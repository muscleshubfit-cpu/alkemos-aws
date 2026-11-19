/**
 * GA4 event dispatch — ORGANIC-GROWTH-P0-G (owner order 2026-11-19
 * «نفّذ البند التالي مباشرة» — docs/organic-growth-system-2026-11-18/
 * 10-prioritized-execution-roadmap.md · 08-§4).
 *
 * The SINGLE shared sender for the seven funnel events
 * (tool_result · save_result · lead_capture · signup_complete ·
 * checkout_start · subscription_success · evo_message) — the
 * diet_plan_bridge_click precedent (P0-C) lifted into one place:
 *
 *   - gtag FIRST, dataLayer fallback (root-shell bootstraps BOTH before
 *     the lazy gtag.js arrives — an event pushed into dataLayer before
 *     the tag loads is replayed by gtag.js on arrival, so nothing is lost
 *     on lazyOnload).
 *   - NEVER breaks UX: total try/catch, SSR-safe, storage-blocked-safe.
 *   - ZERO PII LAW: no emails, names, phones, user ids, message bodies,
 *     or personal result values ever enter a payload. Tool, language,
 *     plan, duration, payment method and tier only.
 *   - Country & traffic source are GA4 AUTOMATIC dimensions — this lib
 *     NEVER injects them (owner instruction 2026-11-19; GA4 collects geo
 *     + session source by itself).
 */

/** GA4 event parameter values — primitives only (the zero-PII law). */
export type Ga4ParamValue = string | number | boolean | undefined;
export type Ga4Params = Record<string, Ga4ParamValue>;

/**
 * Send a GA4 event. Client-side only by design; a no-op on the server
 * (events fired from render code must survive SSR/prerender silently).
 */
export function trackGa4Event(eventName: string, params: Ga4Params = {}): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: unknown[];
    };
    if (typeof w.gtag === "function") {
      w.gtag("event", eventName, params);
    } else if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: eventName, ...params });
    }
    // Neither present (GA_ID unset and consent bootstrap not yet run):
    // drop silently — analytics must NEVER break UX.
  } catch {
    /* analytics must NEVER break UX */
  }
}

/**
 * The page's language for event params — read from the <html lang> the
 * per-locale route groups stamp server-side ("en" | "ar"). Used where a
 * hook-owned `lang` is not in scope (the EVO provider, the auth layer).
 */
export function docLang(): "ar" | "en" {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang === "ar" ? "ar" : "en";
}

/**
 * Run `fire` at most ONCE per browser session for `key`.
 *
 * WHY: `tool_result` is a funnel KEY event — the honest unit is "this
 * session got a result from this tool", so repeated calculations, cup
 * taps and re-renders within one session must NOT inflate it (owner
 * instruction 2026-11-19: لا إرسال مزدوج بسبب إعادة الرندرة أو ما شابه).
 * sessionStorage survives SPA navigations and reloads inside the tab and
 * dies with it — the closest client-side analogue of a GA4 session.
 *
 * Storage blocked (private mode quirks): fall through and FIRE — a
 * possible duplicate is cheaper than a silently missing funnel event.
 */
export function fireOncePerSession(key: string, fire: () => void): void {
  if (typeof window === "undefined") return;
  try {
    const storageKey = `ga4:${key}`;
    if (window.sessionStorage.getItem(storageKey)) return;
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    /* blocked storage — fire anyway (see above) */
  }
  fire();
}

/* ── signup_complete (Google OAuth arm) ────────────────────────────────── */

/**
 * Cookie stamped by /auth/callback (SERVER) when the PKCE exchange
 * returns a FRESH Google-created account (created <5 min ago AND
 * app_metadata.provider === "google"). The client AuthProvider consumes
 * it the moment the profile arrives and fires signup_complete — exactly
 * once, because the cookie is deleted on consumption.
 */
export const GOOGLE_SIGNUP_COOKIE = "mhe_ga4_google_signup";

/** Match the cookie without a dependency (document.cookie is a flat string). */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

function deleteCookie(name: string): void {
  try {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  } catch {
    /* best effort */
  }
}

/**
 * Fire signup_complete { method: "google" } if the OAuth callback marked
 * a fresh Google signup — and consume the mark either way. Called from
 * the onAuthChange handler (which fires repeatedly: initial session,
 * token refresh…) so the consume-then-fire order is what keeps it
 * exactly-once.
 */
export function consumeGoogleSignupMarkIfAny(): void {
  if (readCookie(GOOGLE_SIGNUP_COOKIE) === null) return;
  deleteCookie(GOOGLE_SIGNUP_COOKIE);
  trackGa4Event("signup_complete", { method: "google", lang: docLang() });
}
