"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  buildPersistBody,
  parsePersistedBody,
} from "@/lib/evo-chat-links";
import { classifyEvoIntent } from "@/lib/evo-intent";
import { useAuth } from "@/hooks/use-auth";
import { useMembershipTier } from "@/hooks/use-membership-tier";
import { getLimits } from "@/lib/memberships";
import { ensureGuestId } from "@/lib/plan-persistence";
import {
  EVO_OPEN_CHAT_EVENT,
  EVO_RESET_CHAT_EVENT,
  EVO_CHAT_STORAGE_KEY,
} from "@/lib/evo-chat-events";

/**
 * EvoChatContext — manages EVO chat state across all pages.
 *
 * Chat history is stored in localStorage for anonymous users
 * (session-based, cleared on browser close).
 *
 * For authenticated users, chat history is synced to Supabase
 * `chat_messages` table for persistence across devices.
 *
 * OWNER DIRECTIVES (2026-08-27):
 *   1. EVO CHAT SURFACE LAW — the floating widget (EvoFloatingWidget)
 *      is the ONLY chat surface. The old /chat page was REMOVED and
 *      /chat now redirects to /evo. Any CTA anywhere opens the widget
 *      by dispatching the global EVO_OPEN_CHAT_EVENT below.
 *   2. BACK-BUTTON LAW — with the drawer open, the browser/hardware
 *      Back key must CLOSE the drawer, never navigate the site. A
 *      sentinel history entry (mheEvoChat) is pushed while open.
 *   3. LINK PERSISTENCE — assistant links used to vanish on reload
 *      (chat_messages has no links column). Links now travel INSIDE
 *      the persisted body as markdown bullets and are parsed back
 *      out on load, so a reopened conversation renders exactly like
 *      the live one.
 */

/** History sentinel flag marking the entry pushed while the drawer is open. */
const EVO_HISTORY_FLAG = "mheEvoChat";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  /** Optional links to platform pages (exercises, foods, programs, blog) */
  links?: Array<{
    label: string;
    url: string;
  }>;
  /** PHASE 69 — set on the assistant reply that FOLLOWS a plan-creation
   * request (client-side classification mirrors the server's intent
   * detector). Powers the «احفظ كخطة» button in the widget. */
  planKind?: "nutrition" | "workout";
  /** The plan-creation request that triggered this reply (save title). */
  planRequest?: string;
};

export type ChatState = {
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
  /** Number of messages sent by the user today (for rate limiting) */
  dailyCount: number;
  /** Date string (YYYY-MM-DD) for rate limit reset */
  dailyCountDate: string;
};

// m3 FIX (DEEP-UX-AUDIT-2026-09-18): the storage key moved to the tiny
// zero-import events module (evo-chat-events.ts) so the sign-out funnel
// (src/lib/data/auth.ts) can wipe the mirror WITHOUT dragging this whole
// React context into the auth bundle (same bundle law as the open event).
const STORAGE_KEY = EVO_CHAT_STORAGE_KEY;
// D1: the effective limit now comes from the resolved tier
// (getLimits(tier).evoChatDailyLimit — 10 for free/anon, null = unlimited).
const MAX_MESSAGES = 20;
// P-02 (W1-4b, remediation plan §6.2): the coalescing trailing-debounce
// window for the localStorage mirror saves — the plan's ~500ms direction.
const EVO_SAVE_DEBOUNCE_MS = 500;

type EvoChatContextType = {
  isOpen: boolean;
  isTyping: boolean;
  messages: ChatMessage[];
  dailyCount: number;
  /** Effective daily limit from the RESOLVED tier — null = unlimited. */
  dailyLimit: number | null;
  dailyLimitReached: boolean;
  /** True when the resolved tier is premium/pro/coaching. Server-side
   * limits remain the authority; this only shapes the client UI. */
  isPaidTier: boolean;
  /** PHASE 69 — live quota meter (chat/day + plans/month). Null until
   * the first fetch resolves; refreshQuota() re-reads after each send. */
  quota: QuotaSnapshot | null;
  refreshQuota: () => void;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (content: string) => Promise<void>;
};

export type QuotaSnapshot = {
  chat: { used: number; limit: number | null; unlimited: boolean };
  /** Phase 183 (2026-09-13 «البوول الموحد»): ONE unified monthly pool
   * (nutrition + workout COMBINED). Optional for older caches. */
  plans?: {
    used: number;
    limit: number | null;
    remaining?: number;
    unlimited: boolean;
  };
  /** Deprecated mirrors of the unified pool (kept one release for
   * older widget caches — read `plans` instead). */
  nutrition: {
    used: number;
    limit: number | null;
    unlimited: boolean;
    weeklyUsed?: number;
    weeklyLimit?: number | null;
  };
  workout: {
    used: number;
    limit: number | null;
    unlimited: boolean;
    weeklyUsed?: number;
    weeklyLimit?: number | null;
  };
};

const EvoChatContext = createContext<EvoChatContextType | null>(null);

// Get today's date string
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

// Load state from localStorage (fallback for anonymous)
function loadLocalState(): ChatState {
  if (typeof window === "undefined") {
    return { messages: [], isOpen: false, isTyping: false, dailyCount: 0, dailyCountDate: getTodayString() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { messages: [], isOpen: false, isTyping: false, dailyCount: 0, dailyCountDate: getTodayString() };
    const state = JSON.parse(raw) as ChatState;
    const today = getTodayString();
    if (state.dailyCountDate !== today) { state.dailyCount = 0; state.dailyCountDate = today; }
    if (state.messages.length > MAX_MESSAGES) state.messages = state.messages.slice(-MAX_MESSAGES);
    return { ...state, isTyping: false };
  } catch {
    return { messages: [], isOpen: false, isTyping: false, dailyCount: 0, dailyCountDate: getTodayString() };
  }
}

// Save state to localStorage
function saveLocalState(state: ChatState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      messages: state.messages,
      dailyCount: state.dailyCount,
      dailyCountDate: state.dailyCountDate,
    }));
  } catch { /* localStorage full or disabled */ }
}

// Link persistence helpers live in evo-chat-links.ts (pure + unit-tested).
// Convert a DB row to ChatMessage — restores persisted links too.
function rowToMessage(row: { id: string; role: string; body: string; created_at: string }): ChatMessage {
  const { content, links } = parsePersistedBody(row.body);
  return {
    id: row.id,
    role: row.role as "user" | "assistant",
    content,
    timestamp: new Date(row.created_at).getTime(),
    ...(links.length > 0 ? { links } : {}),
  };
}

export function EvoChatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatState>({
    messages: [], isOpen: false, isTyping: false, dailyCount: 0, dailyCountDate: getTodayString(),
  });
  // T-AI-DEEP-AUDIT-V2 (D1 fix): resolve the REAL tier so paid users are
  // never client-locked by the anonymous/free 10-message counter.
  // Previously dailyLimitReached fired for EVERYONE at 10 sends per
  // session — Premium/Pro/Coaching (advertised UNLIMITED chat) got a
  // silent dead send button. The tier resolves "coaching" for coaches
  // too, so staff are unlimited as designed. Until the async tier
  // lookup finishes we ASSUME free (conservative; the server is the
  // ultimate enforcement anyway).
  const { profile } = useAuth();
  const { tier } = useMembershipTier(profile);
  const isPaidTier = tier !== "free";
  const dailyLimit = getLimits(tier).evoChatDailyLimit; // null = unlimited
  // HYDRATION GATE (2026-08-27): no persistence writes until the initial
  // load (localStorage or Supabase) has completed. Without this, the
  // mount-time save effect wrote an EMPTY state over stored history —
  // under StrictMode's double-mount it raced between the two load runs
  // and wiped the seed, and for authenticated users it clobbered the
  // local cache while the async session check was still in flight.
  const [hydrated, setHydrated] = useState(false);
  // PHASE 69 — quota meter state + read-only refresh.
  // PHASE 183 display law (owner directive 2026-09-13 «البوول الموحد»):
  // the unified plan-pool meter is for EVERYONE — the quota route reads
  // the same ledger enforcement counts for members AND guests
  // (?guestId → dual-dimension free-pool readout; authed callers ignore
  // the param — the route resolves the account first).
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);
  const refreshQuota = useCallback(() => {
    const qs = isPaidTier ? "" : `?guestId=${encodeURIComponent(ensureGuestId() || "")}`;
    fetch(`/api/ai/quota${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setQuota(d as QuotaSnapshot);
      })
      .catch(() => {});
  }, [isPaidTier]);

  // PHASE 69 — CROSS-SESSION MEMORY GATING (owner-approved fix).
  // Two different "memories" live here: (a) evo_memory facts (goals &
  // preferences) are FREE for every logged-in user (owner decision D1 —
  // see evo-memory.ts); (b) the chat_messages DB restore (cross-device
  // history) is PAID-only. This gate is about (b): the restore requires
  // isPaidTier; the effect re-runs when the tier resolves (async) so
  // paid users still get their history, and free users keep on-device
  // messages only.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let restored: ChatState | null = null;
      if (isPaidTier && isSupabaseConfigured) {
        try {
          // PHASE 182: the Supabase client chunk is fetched on demand —
          // EvoChatProvider is mounted in the ROOT layout (public pages).
          const { supabase } = await import("@/lib/supabase/client");
          if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from("chat_messages")
              .select("*")
              .eq("client_id", user.id)
              .order("created_at", { ascending: false })
              .limit(MAX_MESSAGES);
            if (data && data.length > 0) {
              const messages = data.reverse().map(rowToMessage);
              restored = { messages, isOpen: false, isTyping: false, dailyCount: 0, dailyCountDate: getTodayString() };
            }
          }
          }
        } catch { /* fall through to localStorage */ }
      }
      if (cancelled) return;
      // Anonymous, free tier, no Supabase, or no stored rows: localStorage
      if (!restored) restored = loadLocalState();
      setState(restored);
      setHydrated(true); // persistence writes may start only NOW
    })();
    return () => { cancelled = true; };
  }, [isPaidTier, profile?.id]);

  // ── P-02 (W1-4b): debounced localStorage mirror ────────────────────
  // The save effect used to fire on EVERY state.messages identity change
  // — during SSE token streaming that is a full JSON.stringify(history)
  // + a synchronous setItem per TOKEN (dozens of main-thread writes per
  // second while the user watches the stream — up to 20 messages with
  // kilobyte schemas each). The mirror is a CACHE (offline/anon restore),
  // never the source of truth, so a coalescing trailing debounce bounds
  // the write rate: the FIRST change arms one 500ms timer, later changes
  // only refresh the pending snapshot, and the fire writes the LATEST
  // state (≤2 writes/sec mid-stream instead of one per token — and the
  // fire reads the ref, so a snapshot armed before a reset can never
  // resurrect pre-reset content). Convergence is guaranteed by the flush
  // points below (pagehide / visibilitychange→hidden) and the reset
  // CANCEL keeps the m3 sign-out wipe airtight.
  const pendingSaveRef = useRef<ChatState | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Flush the pending snapshot NOW (hard close / backgrounding). */
  const flushPendingSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (pending !== null) saveLocalState(pending);
  }, []);
  /** Cancel WITHOUT writing — the sign-out wipe must never flush a
   * pending PRE-signout snapshot back over the removed mirror (m3). */
  const cancelPendingSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingSaveRef.current = null;
  }, []);

  // Save to localStorage on every change (for offline/cache) — ONLY after
  // the initial hydration finished, so a mount-time write can never wipe
  // history that has not been read yet (StrictMode-safe). P-02: the write
  // itself is the coalescing trailing debounce above — armed, never
  // synchronous.
  useEffect(() => {
    if (!hydrated) return;
    pendingSaveRef.current = state;
    if (saveTimerRef.current !== null) return; // window armed — the fire reads the ref
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      flushPendingSave();
    }, EVO_SAVE_DEBOUNCE_MS);
  }, [state.messages, state.dailyCount, state.dailyCountDate, hydrated, flushPendingSave]);

  // Flush on hard close / backgrounding (the plan's «الحفظ عند الإغلاق»):
  // pagehide covers real tab close (incl. bfcache), visibilitychange→
  // hidden covers mobile app switches. Without these, a close inside the
  // 500ms window would drop the last snapshot.
  useEffect(() => {
    const onPageHide = () => flushPendingSave();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushPendingSave();
    };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flushPendingSave]);

  const openChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
    // Free/anon: the unified-pool meter loads lazily on first open —
    // a page view never pays the extra round-trip (paid fetch on mount).
    refreshQuota();
  }, [refreshQuota]);
  const closeChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    // Consume the sentinel entry so the NEXT Back press navigates the
    // site normally instead of re-closing an already-closed drawer.
    if (typeof window !== "undefined" && window.history.state?.[EVO_HISTORY_FLAG] === true) {
      window.history.back();
    }
  }, []);
  const toggleChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
    refreshQuota();
  }, [refreshQuota]);

  // ── BACK-BUTTON LAW: Back closes the drawer, never the page ─────────
  // While open we keep a sentinel history entry on the stack (preserving
  // Next.js' own state keys). Back pops it → popstate → close drawer.
  const isOpen = state.isOpen;
  useEffect(() => {
    if (!isOpen) return;
    if (window.history.state?.[EVO_HISTORY_FLAG] !== true) {
      window.history.pushState(
        { ...(window.history.state || {}), [EVO_HISTORY_FLAG]: true },
        "",
      );
    }
    const onPopState = () => {
      setState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isOpen]);

  // ── EVO CHAT SURFACE LAW: any CTA opens THIS drawer ─────────────────
  useEffect(() => {
    const onOpenEvent = () => setState((prev) => ({ ...prev, isOpen: true }));
    window.addEventListener(EVO_OPEN_CHAT_EVENT, onOpenEvent);
    return () => window.removeEventListener(EVO_OPEN_CHAT_EVENT, onOpenEvent);
  }, []);

  // ── m3 FIX (DEEP-UX-AUDIT-2026-09-18): sign-out wipes the chat ──────
  // The signOut() funnel dispatches EVO_RESET_CHAT_EVENT after removing
  // the localStorage mirror. Resetting the IN-MEMORY state here is what
  // makes the wipe stick: without it, the mounted provider kept the
  // previous user's messages in state and its next save effect would
  // re-persist them to localStorage (re-leaking on the shared device).
  // The drawer closes too — a signed-out visitor must not land inside
  // the previous user's open conversation. dailyCount resets with the
  // messages it guarded; hydration stays true (a save of the EMPTY
  // state is exactly what we want now).
  useEffect(() => {
    const onResetEvent = () => {
      // P-02: with the debounced mirror, an armed timer may hold a
      // PRE-signout snapshot — CANCEL it (drop, never flush: flushing
      // would re-persist the old messages over the removed mirror — the
      // exact leak m3 fixed). The empty state below re-arms the debounce
      // and persists the wipe ≤500ms later; signOut already removed the
      // mirror itself, so the window holds NOTHING.
      cancelPendingSave();
      setState({
        messages: [],
        isOpen: false,
        isTyping: false,
        dailyCount: 0,
        dailyCountDate: getTodayString(),
      });
    };
    window.addEventListener(EVO_RESET_CHAT_EVENT, onResetEvent);
    return () => window.removeEventListener(EVO_RESET_CHAT_EVENT, onResetEvent);
  }, [cancelPendingSave]);

  // OWNER DIRECTIVE #4 (2026-08-27): the "clear chat" feature was REMOVED.
  // It allowed users to wipe their chat_messages rows — the very evidence
  // the daily-limit counter relied on (rate-limit bypass), and the UI button
  // also made quota-reset feel legitimate. History is capped at MAX_MESSAGES
  // client-side and persisted server-side; there is no user-facing clear.

  // D1: only limited tiers (free/anon) can be locally locked. Paid tiers
  // have limit=null → never locked here; a stray server 429 still injects
  // the limit bubble (the server remains the authority).
  const dailyLimitReached = dailyLimit !== null && state.dailyCount >= dailyLimit;

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || dailyLimitReached) return;

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isTyping: true,
        dailyCount: prev.dailyCount + 1,
      }));

      // Persist user message to Supabase (fire-and-forget) — PAID ONLY
      // (Phase 69 memory gating: memory is an advertised paid feature)
      if (isPaidTier && isSupabaseConfigured) {
        (async () => {
          try {
            // PHASE 182: Supabase client chunk fetched on demand.
            const { supabase } = await import("@/lib/supabase/client");
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("chat_messages").insert({
                client_id: user.id,
                role: "user",
                body: content.trim(),
              });
            }
          } catch { /* non-blocking */ }
        })();
      }

      try {
        // Phase 183 — anonymous callers attach the browser's guest id so
        // their unified plan pool is keyed identically to the planner
        // pages (hashGuestKey server-side). Members are identified by
        // the auth cookie; no guestId is sent.
        const guestId = profile ? undefined : ensureGuestId() || undefined;
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            history: state.messages.slice(-10),
            guestId,
          }),
        });

        // Phase 89 — the success response is either SSE (token streaming)
        // or legacy JSON (safety path). 429/errors stay JSON. Sniff the
        // content-type ONCE — never consume the body twice.
        const contentType = response.headers.get("content-type") || "";
        const isSSE = contentType.includes("text/event-stream");
        const data = isSSE ? null : await response.json();

        // G9 FIX (2026-08-27): non-2xx responses (429 rate limit etc.) are no
        // longer rendered as normal EVO replies nor persisted as assistant
        // messages in chat_messages.
        if (!response.ok) {
          if (response.status === 429) {
            // Sync the local counter so the input locks — only for tiers
            // that actually have a daily limit (D1: unlimited tiers keep
            // working; the server bubble below still informs the user).
            setState((prev) => ({
              ...prev,
              isTyping: false,
              dailyCount:
                dailyLimit !== null
                  ? Math.max(prev.dailyCount, dailyLimit)
                  : prev.dailyCount,
              messages: [
                ...prev.messages,
                {
                  id: `msg-${Date.now()}-limit`,
                  role: "assistant" as const,
                  content:
                    typeof data?.response === "string"
                      ? data.response
                      : "وصلت الحد اليومي للمحادثة. اشترك في Premium أو Pro لمحادثة غير محدودة.",
                  timestamp: Date.now(),
                  links: Array.isArray(data?.links) ? data.links : [],
                },
              ],
            }));
            return; // NOT persisted to chat_messages
          }
          throw new Error(data?.error || `HTTP ${response.status}`);
        }

        if (isSSE && response.body) {
          // ── Phase 89: TRUE TOKEN STREAMING ──
          // Insert a live (empty) assistant bubble immediately, grow it on
          // every delta, then swap in the cleaned final text + links.
          const assistantId = `msg-${Date.now()}-assistant`;
          setState((prev) => ({
            ...prev,
            isTyping: false,
            messages: [
              ...prev.messages,
              {
                id: assistantId,
                role: "assistant" as const,
                content: "",
                timestamp: Date.now(),
              },
            ],
          }));

          type SseFinal = {
            response?: string;
            links?: Array<{ label: string; url: string }>;
            source?: string;
          };
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let acc = "";
          let finalData: SseFinal | null = null;
          let streamInterrupted = false;

          // Parse one SSE frame and RETURN its effect (no closure mutation —
          // keeps TS flow analysis exact and the state updaters pure).
          const parseEvent = (
            rawEvent: string,
          ): { delta?: string; final?: SseFinal; error?: boolean } => {
            let eventName = "message";
            const dataLines: string[] = [];
            for (const line of rawEvent.split("\n")) {
              if (line.startsWith("event:")) eventName = line.slice(6).trim();
              else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
            }
            if (dataLines.length === 0) return {};
            let parsed: unknown;
            try {
              parsed = JSON.parse(dataLines.join("\n"));
            } catch {
              return {}; // malformed frame — skip
            }
            const payload = parsed as {
              text?: unknown;
              response?: unknown;
              links?: unknown;
              message?: unknown;
            };
            if (eventName === "delta" && typeof payload?.text === "string" && payload.text.length > 0) {
              return { delta: payload.text };
            }
            if (eventName === "final" && payload && typeof payload === "object") {
              return { final: payload as SseFinal };
            }
            if (eventName === "error") return { error: true };
            return {};
          };

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let sep: number;
            while ((sep = buffer.indexOf("\n\n")) !== -1) {
              const frame = buffer.slice(0, sep);
              buffer = buffer.slice(sep + 2);
              const out = parseEvent(frame);
              if (out.delta) {
                acc += out.delta;
                const snapshot = acc;
                setState((prev) => ({
                  ...prev,
                  messages: prev.messages.map((m) =>
                    m.id === assistantId ? { ...m, content: snapshot } : m,
                  ),
                }));
              } else if (out.final) {
                finalData = out.final;
              } else if (out.error) {
                streamInterrupted = true;
              }
            }
          }

          const intent = classifyEvoIntent(content);
          const finalText =
            finalData && typeof finalData.response === "string" && finalData.response.length > 0
              ? finalData.response
              : acc ||
                (streamInterrupted
                  ? "حصل انقطاع في الرد. جرب تبعت رسالتك تاني."
                  : "عذرًا، لم أتمكن من الرد. حاول مرة أخرى.");
          const finalLinks = Array.isArray(finalData?.links) ? finalData.links : [];

          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: finalText,
                    links: finalLinks,
                    ...(intent.isPlanCreation
                      ? { planKind: intent.planDomain, planRequest: content.trim() }
                      : {}),
                  }
                : m,
            ),
          }));

          // Persist assistant message to Supabase (fire-and-forget) — PAID ONLY
          // (Phase 69 memory gating)
          if (isPaidTier && isSupabaseConfigured) {
            (async () => {
              try {
                // PHASE 182: Supabase client chunk fetched on demand.
                const { supabase } = await import("@/lib/supabase/client");
                if (!supabase) return;
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.from("chat_messages").insert({
                    client_id: user.id,
                    role: "assistant",
                    // LINK PERSISTENCE: links ride inside the body as markdown
                    // bullets — parsePersistedBody restores them on reload.
                    body: buildPersistBody(finalText, finalLinks),
                  });
                }
              } catch { /* non-blocking */ }
            })();
          }
          return;
        }

        // PHASE 69 — tag the reply that answers a plan-creation request so
        // the widget can offer «احفظ كخطة». Classification mirrors the
        // server's evo-intent detector (same library, client-safe).
        const intent = classifyEvoIntent(content);
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: data.response || "عذرًا، لم أتمكن من الرد. حاول مرة أخرى.",
          timestamp: Date.now(),
          links: data.links || [],
          ...(intent.isPlanCreation
            ? { planKind: intent.planDomain, planRequest: content.trim() }
            : {}),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isTyping: false,
        }));

        // Persist assistant message to Supabase (fire-and-forget) — PAID ONLY
        // (Phase 69 memory gating)
        if (isPaidTier && isSupabaseConfigured) {
          (async () => {
            try {
              // PHASE 182: Supabase client chunk fetched on demand.
              const { supabase } = await import("@/lib/supabase/client");
              if (!supabase) return;
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase.from("chat_messages").insert({
                  client_id: user.id,
                  role: "assistant",
                  // LINK PERSISTENCE: links ride inside the body as markdown
                  // bullets — parsePersistedBody restores them on reload.
                  body: buildPersistBody(data.response || "", data.links),
                });
              }
            } catch { /* non-blocking */ }
          })();
        }
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content: "عذرًا، حدث خطأ في الاتصال. تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.",
          timestamp: Date.now(),
        };
        setState((prev) => ({ ...prev, messages: [...prev.messages, errorMessage], isTyping: false }));
      } finally {
        // PHASE 69 — keep the quota meter honest after every send
        refreshQuota();
      }
    },
    [state.messages, dailyLimitReached, dailyLimit, isPaidTier, refreshQuota],
  );

  // PHASE 69 — initial quota fetch once the tier resolves. Paid users
  // fetch on mount; free/anon fetch lazily on first open (openChat /
  // toggleChat) and after every send — same meter, no per-page-load cost.
  useEffect(() => {
    if (isPaidTier) refreshQuota();
  }, [isPaidTier, refreshQuota]);

  return (
    <EvoChatContext.Provider
      value={{
        isOpen: state.isOpen,
        isTyping: state.isTyping,
        messages: state.messages,
        dailyCount: state.dailyCount,
        dailyLimit,
        dailyLimitReached,
        isPaidTier,
        quota,
        refreshQuota,
        openChat,
        closeChat,
        toggleChat,
        sendMessage,
      }}
    >
      {children}
    </EvoChatContext.Provider>
  );
}

export function useEvoChat() {
  const ctx = useContext(EvoChatContext);
  if (!ctx) throw new Error("useEvoChat must be used within EvoChatProvider");
  return ctx;
}
