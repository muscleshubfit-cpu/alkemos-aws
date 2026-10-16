/**
 * src/lib/ai-provider-cooldown.ts — PROVIDER FAILOVER COOLDOWN REGISTRY
 * (circuit breaker), BLOG-PROVIDER-FAILOVER 2026-10-16 (owner order).
 *
 * OWNER ORDER (2026-10-16): «افحص وأصلح آلية التبديل التلقائي بين مزوّدي
 * الذكاء الاصطناعي الحاليين (Gemini / OpenRouter / Groq / NVIDIA) في
 * منظومة المدونة، بحيث تنتقل للمزوّد التالي عند نفاد الحصة أو حدوث خطأ
 * مؤهل لإعادة المحاولة … وتجنب تكرار المحاولات الفاشلة.»
 *
 * WHAT THIS IS: a tiny quota-class failure memory. When a provider (or a
 * key×model pair) answers with an EXHAUSTION-class error — 429 quota /
 * 402 payment-required / 401-403 auth / 404 model-gone — retrying it
 * minutes later inside the SAME run window is futile by measurement:
 * the pre-failover ladder burned 8×429 grounded calls per P0 attempt,
 * ×3 step retries, ×2 languages (the 2026-10-16 recovery runs). The
 * registry marks the failing scope with an expiry timestamp; the chain
 * and the grounded ladder SKIP cooling scopes WITHOUT consuming attempt
 * budget (exactly like a missing key) and say so honestly in their
 * aggregate errors. The NEXT provider gets the slot — that IS the
 * owner-ordered "move to the next provider when the quota drains".
 *
 * WHAT THIS IS NOT: a throttle on transient errors. 5xx / timeouts /
 * empty responses are NOT marked — the existing retry semantics ride
 * those out exactly as before. And it never fabricates success: a
 * skipped scope is reported, never pretended to have answered.
 *
 * OPT-IN LAW (canary protection): the registry is INACTIVE unless
 * AI_PROVIDER_COOLDOWN_MS is set to a positive number (the blog
 * workflows set it to 1800000). Absent env → byte-identical pre-2026-10-16
 * behavior — every existing canary stays green untouched, and Vercel/
 * local runs change nothing until the env is deliberately added.
 * Rollback: remove the env (or AI_PROVIDER_COOLDOWN=0) — zero code.
 *
 * PERSISTENCE (cross-process, same job): every blog pipeline step runs
 * as its OWN process (run-step.mts via tsx), so an in-memory Map alone
 * would forget the failures between P0/P1/P2… The registry mirrors to a
 * small JSON file (default ${TMPDIR}/alkemos-ai-provider-cooldown.json,
 * override AI_COOLDOWN_STATE_FILE) which survives across the steps of one
 * GitHub Actions job / one runner VM. Fresh runner = fresh state = quota
 * recovery is always re-probed, never assumed. ALL file I/O is fail-soft:
 * a read/write error degrades to memory-only behavior, never breaks a
 * call. No secret EVER enters a scope name or the file — scopes carry
 * provider/key-INDEX/model names and an error CLASS only.
 */

// Static Node builtins (NOT require()): the blog runner executes as ESM
// (tsx runs .mts), where require() is undefined — the file mirror would
// silently degrade to memory-only and lose the cross-step persistence
// this registry exists for. Static imports work in ESM + CJS + vitest
// (the module is server-only, never edge).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** One cooldown entry (in-memory view; the file stores the same + reason). */
export type CooldownEntry = {
  scope: string;
  /** Epoch-ms expiry. */
  until: number;
  /** Short, secret-free failure summary (for honest aggregate errors). */
  reason: string;
};

/** Cooldown is ACTIVE iff AI_PROVIDER_COOLDOWN_MS>0 and the kill-switch
 *  AI_PROVIDER_COOLDOWN is not "0". Absent env = INACTIVE (canary law). */
export function cooldownEnabled(): boolean {
  if (process.env.AI_PROVIDER_COOLDOWN === "0") return false;
  const ms = Number(process.env.AI_PROVIDER_COOLDOWN_MS);
  return Number.isFinite(ms) && ms > 0;
}

/** The configured TTL (ms) for exhaustion-class cooldowns. */
export function cooldownTtlMs(): number {
  const ms = Number(process.env.AI_PROVIDER_COOLDOWN_MS);
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

/** Cooldown file path (env override; default under os.tmpdir()). */
function cooldownStateFile(): string {
  const custom = (process.env.AI_COOLDOWN_STATE_FILE || "").trim();
  if (custom) return custom;
  return path.join(os.tmpdir(), "alkemos-ai-provider-cooldown.json");
}

/* ── Classification ──────────────────────────────────────────────────── */

/** Exhaustion/auth/retirement classes justify a cooldown (futile to
 *  re-attempt within the window). Mirrors the chain's historical
 *  looksLikeQuota plus the live-measured Gemini 404 «no longer available
 *  to new users» (2026-10-16 round-2 probe). */
const QUOTA_CLASS_RE =
  /\b(401|402|403|429|410)\b|quota|rate.?limit|credit|insufficient|resource.?exhausted|payment|billing/i;
const GONE_CLASS_RE =
  /\b404\b|no longer available|not found|decommissioned|retired|degraded/i;

/** Classify a failure message for cooldown purposes.
 *  "quota" = exhaustion/auth/payment · "gone" = dead model/endpoint ·
 *  null = transient (5xx/timeout/empty) — NEVER cooled. */
export function classifyForCooldown(message: string): "quota" | "gone" | null {
  if (!message) return null;
  if (QUOTA_CLASS_RE.test(message)) return "quota";
  if (GONE_CLASS_RE.test(message)) return "gone";
  return null;
}

/* ── Registry core (memory first, file mirror) ───────────────────────── */

const memory = new Map<string, CooldownEntry>();
let fileLoaded = false;
let lastWrite: Promise<void> | null = null;

function nowMs(): number {
  return Date.now();
}

function pruneExpired(): void {
  const now = nowMs();
  for (const [scope, entry] of memory) {
    if (entry.until <= now) memory.delete(scope);
  }
}

/** Fail-soft file load — once per process. Memory always wins over file
 *  (the file may be stale from a crashed sibling). */
function loadFileState(): void {
  if (fileLoaded) return;
  fileLoaded = true;
  if (!cooldownEnabled()) return; // no I/O unless the feature is on
  try {
    const raw = fs.readFileSync(cooldownStateFile(), "utf8");
    const parsed = JSON.parse(raw) as { entries?: CooldownEntry[] };
    if (Array.isArray(parsed?.entries)) {
      const now = nowMs();
      for (const e of parsed.entries) {
        if (
          typeof e?.scope === "string" &&
          e.scope.length > 0 &&
          typeof e?.until === "number" &&
          e.until > now &&
          !memory.has(e.scope)
        ) {
          memory.set(e.scope, {
            scope: e.scope,
            until: e.until,
            reason: typeof e.reason === "string" ? e.reason.slice(0, 160) : "",
          });
        }
      }
    }
  } catch {
    /* absent/unreadable/corrupt file → memory-only behavior */
  }
}

/** Fail-soft file write (fire-and-forget; awaited only by tests/flush). */
function persistFileState(): Promise<void> {
  const run = (async () => {
    if (!cooldownEnabled()) return;
    try {
      const entries = [...memory.values()].map((e) => ({
        scope: e.scope,
        until: e.until,
        reason: e.reason,
      }));
      const file = cooldownStateFile();
      const tmp = `${file}.tmp-${process.pid}`;
      fs.writeFileSync(tmp, JSON.stringify({ entries }), "utf8");
      fs.renameSync(tmp, file);
    } catch {
      /* unwritable path → memory-only behavior */
    }
  })();
  lastWrite = run;
  return run;
}

/** Mark a scope as cooling (quota/gone class only — callers decide).
 *  No-op when the registry is disabled (canary law). */
export function markCooldown(scope: string, reason: string): void {
  if (!cooldownEnabled()) return;
  const ttl = cooldownTtlMs();
  if (ttl <= 0) return;
  loadFileState();
  const until = nowMs() + ttl;
  const prev = memory.get(scope);
  // Never SHORTEN an active cooldown with a fresh mark.
  if (prev && prev.until >= until) return;
  memory.set(scope, {
    scope,
    until,
    reason: reason.replace(/\s+/g, " ").trim().slice(0, 160),
  });
  void persistFileState();
}

/** Active cooldown for a scope (null when none/absent/disabled). */
export function cooldownState(scope: string): CooldownEntry | null {
  if (!cooldownEnabled()) return null;
  loadFileState();
  const entry = memory.get(scope);
  if (!entry) return null;
  if (entry.until <= nowMs()) {
    memory.delete(scope);
    return null;
  }
  return entry;
}

/** True when the scope is cooling (convenience for hot loops). */
export function isCoolingDown(scope: string): boolean {
  return cooldownState(scope) !== null;
}

/** Secret-free snapshot of ACTIVE cooldowns (logs, probes, tests). */
export function activeCooldowns(): CooldownEntry[] {
  if (!cooldownEnabled()) return [];
  loadFileState();
  pruneExpired();
  return [...memory.values()].sort((a, b) => a.until - b.until);
}

/** Await the last pending file write (probe script shutdown, tests). */
export function flushCooldownWrites(): Promise<void> {
  return lastWrite ?? Promise.resolve();
}

/* ── Test-only helpers (NEVER used at runtime) ───────────────────────── */

/** Wipe memory + the loaded-file flag; optionally delete the state file.
 *  Test files that enable the registry via env call this in beforeEach. */
export function __resetCooldownForTests(opts?: { deleteFile?: boolean }): void {
  memory.clear();
  fileLoaded = false;
  lastWrite = null;
  if (opts?.deleteFile) {
    try {
      fs.rmSync(cooldownStateFile(), { force: true });
    } catch {
      /* ignore */
    }
  }
}
