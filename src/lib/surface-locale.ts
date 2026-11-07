/**
 * SURFACE LOCALE LAW — phase 449 (owner order 2026-11-07, executed same
 * day; governing report §11: docs/AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07.md).
 *
 * THE CENTRAL CLASSIFIER for "which source governs the UI language on
 * this URL" — the single guarantee that was MISSING when the admin
 * panel's language could not survive a navigation (live-reproduced on
 * production 2026-11-07 with the sanctioned QA admin account:
 * /admin/dashboard toggled to Arabic → one sidebar link → the whole
 * chrome reverted to en/ltr while localStorage["mhe:lang"] stayed "ar";
 * reload ignored the preference too, and raw SSR served en/ltr even
 * with a preference cookie — the server never saw the choice at all).
 *
 * THE LAW — one rule per surface class:
 *
 *   1. PUBLIC ARABIC  — `/ar` + `/ar/*`               → the URL says Arabic.
 *   2. PUBLIC ENGLISH — every other PUBLIC URL        → the URL says English.
 *   3. SPECIAL        — the (app) route group's       → the URL carries NO
 *      surfaces (/admin /auth /checkout /profile         language dimension
 *      /preview + the (authed) subtree: /dashboard       (mirror-less by the
 *      /coach /plans /progress /questionnaires           documented owner
 *      /referral /support)                               decision — the
 *                                                        LanguageToggle is
 *                                                        the change
 *                                                        mechanism there),
 *                                                        so the PERSISTED
 *                                                        PREFERENCE governs
 *                                                        the chrome.
 *
 * Classes 1-2 are F-2 Option A VERBATIM (phase 447 — the owner order
 * «لغة مسار URL هي المصدر الحاكم للغة الواجهة من أول HTML وأول رسم»: the
 * URL is the sole governor of the PUBLIC trees; no saved-preference
 * override, no post-hydration flip on public pages). This module does
 * NOT reopen that decision — public pages are byte-identical before
 * and after 449.
 *
 * Class 3 is the 449 fix. The historical gap: F-2-A's leaf
 * (UrlLocaleSync in src/lib/i18n.tsx) applied the public URL law to
 * EVERY non-/ar path — including the mirror-less private surfaces —
 * so it force-reset the language to "en" on every pathname change
 * there, erasing the toggle's chrome swap on the very next click (the
 * LanguageToggle's own documented contract promised a persistent swap:
 * «just toggle the UI language … the user sees the new language
 * without a URL change»). Two components held contradictory
 * assumptions and NOTHING owned the question "does this URL carry a
 * language at all?" — the absence of a central guarantee, in one
 * sentence. This module is that owner now: one predicate set, consumed
 * by the one writer (UrlLocaleSync) and the one server reader (the
 * (app) root layout).
 *
 * THE PREFERENCE STORE (both written together by setLang — the toggle):
 *   - localStorage["mhe:lang"] — the legacy key (fast client read;
 *     every pre-449 toggle already wrote it, so existing users' saved
 *     choice is honored with zero migration).
 *   - cookie mhe:lang — the only store a server component can read.
 *     The (app) root layout is force-dynamic + noindex + excluded from
 *     the Cloudflare public-HTML cache (VERCEL-USAGE-3 + the SEO-GEO-4
 *     private-path list), so it reads this cookie and server-renders
 *     the owner's language from the FIRST HTML — no post-hydration
 *     flip on the account surfaces either (steady state: the client
 *     resolution equals the SSR value, so the sync's setState is a
 *     no-op). The cookie is CLIENT-written only (document.cookie) —
 *     no server Set-Cookie anywhere, so public responses (and the
 *     edge cache) never see new cookie noise.
 *
 * PUBLIC layouts ((en)/(ar)) must NEVER read this cookie — their
 * static/ISR + edge-cache law (report §5) is pinned by canaries in
 * src/lib/__tests__/surface-locale.test.ts.
 */

/**
 * The persisted-preference key: same name in both stores (localStorage
 * keeps the exact legacy key every pre-449 toggle already wrote; the
 * cookie is new in 449 and is the server-readable mirror). NOTE: this
 * is a DIFFERENT cookie than the dead `mhe:locale` one F-6 removed in
 * phase 446 — that one had zero readers; this one has exactly one
 * server reader (the (app) root layout) and one client writer.
 */
export const LANG_STORAGE_KEY = "mhe:lang";
export const LANG_COOKIE = "mhe:lang";
/** 1 year — matches the old mhe:locale precedent (SameSite=lax, path=/). */
export const LANG_COOKIE_MAX_AGE = 31536000;

/**
 * SPECIAL SURFACE PREFIXES — the (app) route group's own top-level
 * folders (plus its (authed) nested group's folders), verbatim:
 *
 *   src/app/(app)/admin · auth · checkout · preview · profile
 *   src/app/(app)/(authed)/coach · dashboard · plans · progress ·
 *                              questionnaires · referral · support
 *
 * This is the SAME set as the SEO-GEO-4 private-path exclusion list in
 * next.config.ts (documented in src/middleware.ts): the surfaces that
 * are dynamic + noindex + excluded from the public-HTML edge cache —
 * exactly the surfaces where a per-request cookie read is FREE.
 *
 * CANARY-PROVEN EXACT (surface-locale.test.ts walks the filesystem):
 * adding a route folder to (app) without adding its prefix here fails
 * the suite — the classifier can never silently drift from the routes
 * it claims to cover.
 */
export const SPECIAL_LOCALE_PREFIXES = [
  "/admin",
  "/auth",
  "/checkout",
  "/profile",
  "/preview",
  "/dashboard",
  "/coach",
  "/plans",
  "/progress",
  "/questionnaires",
  "/referral",
  "/support",
] as const;

/** The Arabic-path predicate — the middleware's exact rule (2026-09-01
 * SEO locale law): Arabic means exactly `/ar` or the `/ar/…` subtree.
 * A loose startsWith("/ar") would misclassify /archive as Arabic. */
export function isArabicPath(pathname: string): boolean {
  return pathname === "/ar" || pathname.startsWith("/ar/");
}

/**
 * SPECIAL SURFACE predicate: exact match or subtree, with the same
 * boundary discipline as isArabicPath — `/administration` is NOT
 * special (it does not exist; if it ever did, it would be a PUBLIC
 * English URL until explicitly classified).
 */
export function isSpecialSurface(pathname: string): boolean {
  return SPECIAL_LOCALE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

/** Only "ar" | "en" survive; anything else (absent, tampered, legacy
 * junk) falls back to "en" — the documented default. NO browser-
 * language sniffing anywhere: F-2-A killed that chain (audit R-1) and
 * 449 does not resurrect it; the toggle is the only way a preference
 * comes to exist. */
export function normalizeLang(v: unknown): "ar" | "en" {
  return v === "ar" ? "ar" : "en";
}

/**
 * CLIENT read of the persisted preference (localStorage first — the
 * legacy store every pre-449 toggle wrote; cookie second — the 449
 * mirror). Client-only: called from the UrlLocaleSync effect. Returns
 * "en" when nothing is stored (fresh visitor).
 */
export function readPersistedLang(): "ar" | "en" {
  try {
    const ls =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(LANG_STORAGE_KEY);
    if (ls === "ar" || ls === "en") return ls;
    const m =
      typeof document === "undefined"
        ? null
        : document.cookie.match(/(?:^|;\s*)mhe:lang=(ar|en)\b/);
    if (m) return m[1] === "ar" ? "ar" : "en";
  } catch {
    /* private mode / storage disabled — the default below stands */
  }
  return "en";
}

/**
 * CLIENT write of the cookie mirror (document.cookie only — never a
 * server Set-Cookie; see the module law above). Called by setLang
 * (every explicit toggle) AND by UrlLocaleSync's special-surface
 * branch as a one-time LEGACY BACKFILL: a user whose saved choice
 * predates the 449 cookie (localStorage set, cookie absent) gets the
 * cookie written on their first special-surface visit, so the NEXT
 * load is SSR-correct — at most ONE post-hydration flip, once, ever,
 * then steady state is flip-free SSR-correct rendering.
 */
export function persistLangCookie(l: "ar" | "en"): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`;
  } catch {
    /* cookie writes disabled — localStorage still carries the choice */
  }
}
