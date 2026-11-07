"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { deferIdle } from "@/lib/defer-idle";
import type { Profile } from "@/lib/supabase/types";

// Exported for the W1-4a render-storm canary (the probe types the ctx
// object) — type-only, zero runtime surface.
export type AuthCtx = {
  profile: Profile | null;
  loading: boolean;
  /** STAFF semantics: true for role coach AND admin. Gates every coach
   * surface (clients, support, payments). Admin additionally gets the
   * admin-exclusive surfaces via isAdmin. */
  isCoach: boolean;
  /** role === "admin" — platform owner. Admin-exclusive: blog admin,
   * tool leads, saved results, referrals admin. */
  isAdmin: boolean;
  /** profiles.coach_kind — 'site' | 'b2b' | null. Phase 142 (owner:
   * «يجب الفصل بين ادمن / مدرب موقع / مدرب مستقل»): the kind decides
   * which coach console a coach gets. Null for clients/admins. */
  coachKind: "site" | "b2b" | null;
  /** role='coach' AND coach_kind='site' — follows up assigned site members
   * (B2C): no wallet, no per-client billing, no ads/affiliate. */
  isSiteCoach: boolean;
  /** role='coach' AND coach_kind!=='site' — an independent B2B partner:
   * own clients, wallet, per-client fees, affiliate, ads. */
  isB2BCoach: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string, coachSlug?: string | null) => Promise<{ error: string | null; needsConfirmation?: boolean; duplicateEmail?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; profile: Profile | null }>;
  signInGoogle: (nextPath?: string) => Promise<{ error: string | null }>;
  signOutAsync: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

/* ── PHASE 182 (2026-09-12): lazy auth/data layer ───────────────────────
 *
 * AuthProvider is mounted in the ROOT layout, so its static imports used
 * to drag @/lib/data (the whole data layer) + @supabase/ssr (~68KB gz)
 * into EVERY page's first-load JS — including public marketing pages
 * where ~80% is never used. The layer is now loaded ON DEMAND:
 *
 *   immediately   — OAuth return (?code=) and auth-gated routes
 *                   (GATED_PREFIXES below; re-checked on every SPA
 *                   navigation via usePathname).
 *   on idle      — returning users ONLY (an sb-*-auth-token session
 *   (≤2.5s)        cookie exists): the header flips to the user menu
 *                  after the LCP/INP critical window instead of
 *                  competing with it for bandwidth.
 *   never         — anonymous visitors on public pages: the ctx stays in
 *                  its logged-out initial state (CORRECT for anon) and
 *                  `loading` resolves immediately; any auth action
 *                  (signIn / signUp / google) loads the layer at call
 *                  time. A missed gated route degrades safely:
 *                  loading=false + profile=null → gates redirect to
 *                  /auth (which is a gated prefix → loads there).
 *
 * The rest of the app is untouched: @/lib/data still consumes the single
 * eager browser client from @/lib/supabase/client — only the TIMING of
 * when that chunk is fetched changed. */

type DataLayer = typeof import("@/lib/data");
let dataLayerPromise: Promise<DataLayer> | null = null;
function loadDataLayer(): Promise<DataLayer> {
  if (!dataLayerPromise) dataLayerPromise = import("@/lib/data");
  return dataLayerPromise;
}

/** Auth-gated route prefixes — load the layer immediately on these. */
const GATED_PREFIXES = [
  "/auth",
  "/admin",
  "/checkout",
  "/profile",
  "/memberships",
  "/for-coaches",
  "/dashboard",
  "/coach", // NOTE: exact-segment matching — does NOT match /coaching (public marketing)
  "/plans",
  "/progress",
  "/questionnaires",
  "/referral",
  "/support",
];

function isGatedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return GATED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function hasOAuthCodeParam(): boolean {
  if (typeof window === "undefined") return false;
  return new URL(window.location.href).searchParams.has("code");
}

/** @supabase/ssr persists sessions in sb-<ref>-auth-token(.N) cookies —
 *  their presence is a cheap "has a session ever been established here"
 *  signal that costs zero network. */
function hasSupabaseSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)sb-[a-zA-Z0-9-]+-auth-token/.test(document.cookie);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const startedRef = useRef(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const startAuth = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    const data = await loadDataLayer();
    data.seedLocalData();

    // Safety net: exchange code if present in URL (from OAuth callback).
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("code")) {
        try {
          const { supabase } = await import("@/lib/supabase/client");
          if (supabase) {
            await supabase.auth.exchangeCodeForSession(window.location.href);
            window.history.replaceState({}, document.title, url.pathname);
          }
        } catch (e) {
          console.error("[auth] Fallback code exchange failed:", e);
        }
      }
    }

    // Subscribe to auth state changes first (so we don't miss any events).
    unsubRef.current = data.onAuthChange((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, []);

  // The pathname-dependent trigger moved INTO AuthRouteTrigger below
  // (W1-4a · audit P-01 — see the leaf's header comment).

  // Unmount cleanup (AuthProvider lives in the root layout, but keep the
  // original subscription lifecycle semantics intact).
  useEffect(() => () => {
    if (unsubRef.current) unsubRef.current();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, phone: string, coachSlug?: string | null) => {
      const { signUpEmail } = await loadDataLayer();
      const { error, profile: p, needsConfirmation, duplicateEmail } = await signUpEmail(email, password, fullName, phone, coachSlug);
      if (!error && p) setProfile(p);
      // M2 FIX (DEEP-UX-AUDIT-2026-09-18): duplicateEmail passes through so
      // AuthView can show the honest «account exists — sign in» screen.
      return { error, needsConfirmation, duplicateEmail };
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { signInEmail } = await loadDataLayer();
    const { error, profile: p } = await signInEmail(email, password);
    if (!error && p) setProfile(p);
    return { error, profile: p };
  }, []);

  const signInGoogle = useCallback(async (nextPath?: string) => {
    const { signInWithGoogle } = await loadDataLayer();
    return await signInWithGoogle(nextPath);
  }, []);

  const signOutAsync = useCallback(async () => {
    const { signOut } = await loadDataLayer();
    await signOut();
    setProfile(null);
  }, []);

  const kind = (profile?.coach_kind === "site" ? "site" : profile?.role === "coach" ? "b2b" : null) as "site" | "b2b" | null;

  // W1-4a (audit P-01 — 2026-10-02): the ctx value is MEMOIZED, so a
  // provider re-render can no longer hand every useAuth consumer a fresh
  // object identity — the value reference changes ONLY when the auth
  // state (profile/loading) actually changes. The four actions are
  // useCallback-stable and `kind` derives from `profile`.
  const value = useMemo<AuthCtx>(
    () => ({
      profile,
      loading,
      isCoach: profile?.role === "coach" || profile?.role === "admin",
      isAdmin: profile?.role === "admin",
      coachKind: kind,
      isSiteCoach: profile?.role === "coach" && kind === "site",
      isB2BCoach: profile?.role === "coach" && kind !== "site",
      signUp,
      signIn,
      signInGoogle,
      signOutAsync,
    }),
    [profile, loading, kind, signUp, signIn, signInGoogle, signOutAsync],
  );

  return (
    <Ctx.Provider value={value}>
      <AuthRouteTrigger
        startedRef={startedRef}
        startAuth={startAuth}
        setLoading={setLoading}
      />
      {children}
    </Ctx.Provider>
  );
}

/* ── W1-4a (audit P-01 — 2026-10-02): pathname subscription torn off ────
 *
 * The provider used to call `usePathname()` itself, so EVERY SPA
 * navigation re-rendered AuthProvider — and with an inline value object
 * that meant all useAuth consumers re-rendered too, even though neither
 * profile nor loading had changed (the audit's render storm: 49 useAuth
 * consumers + 92 useI18n consumers on every route change).
 *
 * The pathname logic — the Phase 182 lazy-layer TRIGGER, moved here
 * VERBATIM (gated route / OAuth code → immediate; returning session
 * cookie → idle; anonymous → resolved logged-out) — now lives in this
 * null-rendering LEAF inside the provider: a route change re-renders
 * only this component, while the memoized ctx value above keeps every
 * consumer untouched. The refs/handlers arrive as props with stable
 * identities (useRef/useCallback/setState), so the leaf re-renders ONLY
 * on pathname change — identical timing semantics for the trigger. */
function AuthRouteTrigger({
  startedRef,
  startAuth,
  setLoading,
}: {
  startedRef: { current: boolean };
  startAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (startedRef.current) return;

    if (hasOAuthCodeParam() || isGatedPath(pathname)) {
      void startAuth();
    } else if (hasSupabaseSessionCookie()) {
      // Returning user on a public page: resolve after the critical
      // window (idle callback, hard timeout below) — never compete with
      // LCP.
      //
      // F-3 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6, executed
      // 2026-11-07): 2500ms → 1200ms. The audit measured the perceived
      // "logged-out → logged-in" header flip at ~1.5–4.5s end-to-end
      // (idle cap + dynamic chunk + two network round trips) and
      // recommended cutting the idle cap. 1200ms keeps the deferral
      // PRINCIPLE intact (requestIdleCallback still fires first whenever
      // the browser goes idle — the timeout is only the worst-case
      // guarantee, so an idle main thread still resolves the session
      // long before the cap) while halving the worst-case wait. The
      // alternative in the report (server-side sb-* cookie branch →
      // hasSession prop) was NOT taken: a per-cookie server branch opts
      // public pages out of ISR/edge-cache — the exact damage §5 of the
      // audit forbids (110 dynamic routes + fragmented edge cache), and
      // behind the CF edge cache (12h TTL) the branch would not even
      // execute for most public traffic.
      deferIdle(() => void startAuth(), 1200);
    } else {
      // Anonymous visitor on a public page: auth state is resolved as
      // logged-out — no chunk, no network. Auth actions load on demand.
      setLoading(false);
    }
  }, [pathname, startedRef, startAuth, setLoading]);

  return null;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
