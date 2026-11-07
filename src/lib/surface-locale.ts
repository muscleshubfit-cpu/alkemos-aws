/**
 * SURFACE LOCALE LAW — phase 449 (owner order 2026-11-07, executed same
 * day; governing report §11: docs/AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07.md)
 * · UNIFIED CHOICE LAW — phase 450 (owner order 2026-11-08 «حلاً موحداً
 * وشاملاً لإدارة لغة الموقع… القاعدة الوحيدة: عندما يختار المستخدم
 * العربية، يظل الموقع بالكامل بالعربية أثناء التنقل بين جميع الصفحات»;
 * governing report §12, same file)
 * · BOUNDARY RECORDER — phase 451 (owner order 2026-11-08, report §13:
 * the always-fresh SERVER twin of the 450 passive record — the CF edge
 * serves public HTML up to 12h stale after every deploy, so the public
 * pages' client enforcers can be a whole generation behind; the special
 * surfaces' boundary recorder keeps the choice handoff generation-proof).
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
 * THE LAW — 449 drew three classes (public-Arabic / public-English /
 * special), each with its own governor. 450 UNIFIES the governor: the
 * RECORDED CHOICE (mhe:lang) rules EVERY surface for anyone who has
 * one; the URL stays the content's address and is KEPT IN SYNC with
 * the choice on public surfaces via the structural mirror map below
 * (use-nav resolves every chrome view navigation into the chosen tree
 * + the UrlLocaleSync safety net replaces wrong-tree URLs + passive
 * recording of a first /ar visit). A visitor with NO recorded choice
 * keeps the 447/F-2-A law verbatim — the URL governs, byte-identical
 * for crawlers and first-time visitors. The one deliberate boundary:
 * content that exists in a single language only (blog article slugs
 * without a linked twin) is served in its own language, both
 * directions. (A middleware mirror-redirect was evaluated and
 * REJECTED on measured evidence: Next 16's proxy strips the RSC
 * flight markers from the middleware's view, and a full-page redirect
 * would inherit the edge-cacheable public Cache-Control — see the
 * report §12.)
 *
 * Classes 1-2 were F-2 Option A VERBATIM (phase 447). For CHOICE-LESS
 * visitors they still are — public pages render by URL, the static
 * (en)/(ar) layouts never read the cookie, and crawlers see zero
 * redirects (they never carry one).
 *
 * Class 3 is the 449 fix (the special surfaces' preference SSR). The
 * historical gap it closed: F-2-A's leaf (UrlLocaleSync in
 * src/lib/i18n.tsx) applied the public URL law to EVERY non-/ar path
 * — including the mirror-less private surfaces — so it force-reset
 * the language to "en" on every pathname change there, erasing the
 * toggle's chrome swap on the very next click. This module owns the
 * question "does this URL carry a language at all?" for everyone.
 *
 * THE PREFERENCE STORE (both written together by persistLangChoice):
 *   - cookie mhe:lang — the only store a server component can read;
 *     THE GOVERNOR (450: cookie-first priority — see readStoredLang).
 *     CLIENT-written only (document.cookie): no server Set-Cookie
 *     anywhere, so public responses (and the edge cache) never see
 *     new cookie noise. Read by the (app) root layout (SSR — the one
 *     server reader) and by every client consumer through
 *     readStoredLang (use-nav, UrlLocaleSync).
 *   - localStorage["mhe:lang"] — the legacy key (fast client read;
 *     every pre-449 toggle already wrote it) kept as the fallback +
 *     write-through mirror, healed to match the cookie by the sync.
 *
 * PUBLIC layouts ((en)/(ar)) must NEVER read this cookie — their
 * static/ISR + edge-cache law (report §5) is pinned by canaries in
 * src/lib/__tests__/surface-locale.test.ts.
 */

/**
 * The persisted-preference key: same name in both stores (localStorage
 * keeps the exact legacy key every pre-449 toggle already wrote; the
 * cookie is new in 449 and is the server-readable governor). NOTE: this
 * is a DIFFERENT cookie than the dead `mhe:locale` one F-6 removed in
 * phase 446 — that one had zero readers; this one has exactly two
 * server readers (the (app) root layout SSR + the 451 middleware
 * boundary recorder, both serving special surfaces only) and two
 * writers (persistLangChoice — setLang / the backfill / the passive
 * record, all CLIENT-side; and the 451 middleware boundary recorder —
 * the SERVER-side writer, which fires ONLY at a special-surface
 * crossing with no recorded choice and a same-origin /ar referer, and
 * never overrides an existing choice).
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
 * 450 UNIFIED CHOICE LAW — the STORE PRIORITY is COOKIE-FIRST.
 *
 * Pre-450 readPersistedLang read localStorage FIRST and the cookie
 * second. Stage 450 adds a SECOND cookie reader (the middleware's
 * mirror redirect — see below) next to the existing one (the (app)
 * root layout SSR). Two governors reading DIFFERENT stores can
 * disagree (cookie=ar + localStorage=en — a half-synced legacy
 * browser), and when they do the client sync and the server redirect
 * form an INFINITE BOUNCE LOOP (/ →307→ /ar →client-replace→ / →…).
 * The loop is structurally impossible when every reader resolves the
 * same store first: the cookie (the only store a server can read)
 * wins on the client too, and the sync HEALS the divergent legacy
 * store to match (alignLangStores below). localStorage survives as
 * the FALLBACK (a pre-449 choice that never got its cookie backfill)
 * and as a write-through mirror.
 */
export function readStoredLang(): "ar" | "en" | null {
  try {
    const m =
      typeof document === "undefined"
        ? null
        : document.cookie.match(/(?:^|;\s*)mhe:lang=(ar|en)\b/);
    if (m) return m[1] === "ar" ? "ar" : "en";
    const ls =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(LANG_STORAGE_KEY);
    if (ls === "ar" || ls === "en") return ls;
  } catch {
    /* private mode / storage disabled — no recorded choice */
  }
  return null;
}

/**
 * CLIENT read of the persisted preference (cookie first — the 450
 * unified priority; localStorage second — the legacy fallback).
 * Client-only: called from the UrlLocaleSync effect. Returns "en"
 * when nothing is stored (fresh visitor).
 */
export function readPersistedLang(): "ar" | "en" {
  return readStoredLang() ?? "en";
}

/**
 * CLIENT write of the cookie mirror (document.cookie only — never a
 * server Set-Cookie; see the module law above). Called by
 * persistLangChoice (the one client writer) AND by UrlLocaleSync as a
 * one-time LEGACY BACKFILL: a user whose saved choice predates the
 * 449 cookie (localStorage set, cookie absent) gets the cookie
 * written on their first visit, so the NEXT load is SSR-correct — at
 * most ONE post-hydration flip, once, ever, then steady state is
 * flip-free SSR-correct rendering.
 */
export function persistLangCookie(l: "ar" | "en"): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`;
  } catch {
    /* cookie writes disabled — localStorage still carries the choice */
  }
}

/**
 * 450 — the ONE client-side choice writer: write BOTH stores in one
 * step (cookie + localStorage) so they can never drift apart again.
 * Used by setLang (every explicit toggle), by the sync's legacy
 * backfill, and by the passive first-/ar/-visit record below. The
 * cookie write is CLIENT-only (document.cookie) — no server
 * Set-Cookie anywhere, so public responses and the edge cache never
 * see new cookie noise.
 */
export function persistLangChoice(l: "ar" | "en"): void {
  persistLangCookie(l);
  try {
    if (typeof window !== "undefined")
      window.localStorage.setItem(LANG_STORAGE_KEY, l);
  } catch {
    /* storage disabled — the cookie still carries the choice */
  }
}

/**
 * 450 — the store HEALER: bring both stores to the RESOLVED value,
 * writing ONLY when a store is absent or divergent (steady state is
 * write-free). Covers the two convergence cases: a legacy
 * localStorage-only choice (cookie absent → backfilled, so the next
 * SSR/middleware read is correct) and a half-synced browser (cookie
 * set, localStorage divergent → healed, so nothing downstream can
 * resurrect the stale value).
 */
export function healLangStores(l: "ar" | "en"): void {
  try {
    if (
      typeof document !== "undefined" &&
      !document.cookie.match(/(?:^|;\s*)mhe:lang=(ar|en)\b/)
    )
      persistLangCookie(l);
  } catch {
    /* cookies disabled — localStorage still carries the choice */
  }
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem(LANG_STORAGE_KEY) !== l
    )
      window.localStorage.setItem(LANG_STORAGE_KEY, l);
  } catch {
    /* storage disabled — the cookie still carries the choice */
  }
}

/* ═══════════════════════════════════════════════════════════════════
 * 450 — THE STRUCTURAL MIRROR MAP (one map, three consumers).
 *
 * The map answers the question the toggle has answered ad-hoc since
 * M31 and that 450's enforcement now needs centrally: "does this
 * PUBLIC path have a same-content mirror in the other language tree,
 * addressable by a pure prefix swap?" It is consumed by:
 *   1. LanguageToggle — navigates to the mirror on toggle (exactly
 *      the MIRROR_ROUTES/PREFIX_MIRROR behavior it hard-coded since
 *      2026-09 — now ONE source instead of a private copy).
 *   2. UrlLocaleSync — the client safety net: a stored choice that
 *      disagrees with the public tree the browser landed on
 *      (edge-cache HITs, external links) replaces the route to the
 *      mirror in the CHOSEN language.
 *   3. middleware — REJECTED (2026-11-08, report §12): Next 16's
 *      proxy layer strips the RSC flight markers (RSC header + _rsc
 *      param) from the middleware's request view, so an RSC-only
 *      redirect needs private APIs; and a full-page redirect inherits
 *      the edge-cacheable public Cache-Control (next.config headers()
 *      wins over middleware headers) — a crawler-facing tail risk.
 *      The middleware stays 449-clean; the law's two enforcers above
 *      cover every navigation class.
 *
 * DELIBERATELY NOT in the map: /blog/[slug] article pages — their
 * mirror exists only when the DB row has a linked_post_id twin (the
 * toggle resolves those with a live lookup; enforcement CANNOT know
 * without a DB call, and redirecting to a 404 would be strictly
 * worse). Article URLs therefore serve their content in the URL's
 * own language for everyone — a page that exists in ONE language
 * only is served in that language, in BOTH directions. Special
 * surfaces carry no language dimension at all (the classifier above).
 *
 * CANARY-PROVEN EXACT (surface-locale.test.ts walks the filesystem):
 * every (en)↔(ar) index pair and every shared dynamic subtree MUST be
 * here — a new mirrored route without a map row fails the suite, so
 * the three consumers can never silently drift from the routes they
 * claim to cover (the same guarantee SPECIAL_LOCALE_PREFIXES has).
 * ═══════════════════════════════════════════════════════════════════ */

/** Index-level mirror pairs (exact pathname ↔ exact pathname). */
export const PUBLIC_INDEX_MIRRORS: ReadonlyArray<Readonly<{ en: string; ar: string }>> = [
  { en: "/", ar: "/ar" },
  { en: "/about", ar: "/ar/about" },
  { en: "/affiliate", ar: "/ar/affiliate" },
  { en: "/ai-meal-planner", ar: "/ar/ai-meal-planner" },
  { en: "/ai-workout-planner", ar: "/ar/ai-workout-planner" },
  { en: "/authors", ar: "/ar/authors" },
  { en: "/blog", ar: "/ar/blog" },
  { en: "/coaching", ar: "/ar/coaching" },
  { en: "/compare", ar: "/ar/compare" },
  { en: "/contact", ar: "/ar/contact" },
  { en: "/diet-plan", ar: "/ar/diet-plan" },
  { en: "/evo", ar: "/ar/evo" },
  { en: "/exercises", ar: "/ar/exercises" },
  { en: "/faq", ar: "/ar/faq" },
  { en: "/foods", ar: "/ar/foods" },
  { en: "/for-coaches", ar: "/ar/for-coaches" },
  { en: "/for-coaches/register", ar: "/ar/for-coaches/register" },
  { en: "/macro-tracker", ar: "/ar/macro-tracker" },
  { en: "/meal-planner", ar: "/ar/meal-planner" },
  { en: "/memberships", ar: "/ar/memberships" },
  { en: "/privacy", ar: "/ar/privacy" },
  { en: "/programs", ar: "/ar/programs" },
  { en: "/terms", ar: "/ar/terms" },
  { en: "/tools", ar: "/ar/tools" },
  { en: "/workout-tracker", ar: "/ar/workout-tracker" },
];

/** Prefix-swappable subtrees (same slug serves both trees). */
export const PUBLIC_PREFIX_MIRRORS: readonly string[] = [
  "/authors/",
  "/blog/category/",
  "/coaches/",
  "/collections/",
  "/compare/",
  "/diet-plan/",
  "/equipment/",
  "/exercises/",
  "/foods/",
  "/guides/",
  "/muscles/",
  "/programs/",
  "/tools/",
];

/** Is this PUBLIC pathname structurally mirrorable (an exact pair or
 * under a prefix pair)? Pure predicate — the en-tree form. */
function isStructuralMirrorPath(pathname: string): boolean {
  return (
    PUBLIC_INDEX_MIRRORS.some((m) => m.en === pathname) ||
    PUBLIC_PREFIX_MIRRORS.some((p) => pathname.startsWith(p))
  );
}

/**
 * 450 — THE mirror resolver: the structural mirror of `pathname` in
 * the `target` language, or null when the path has none (special
 * surfaces, blog article slugs, unknown paths, or already in the
 * target tree). Pure string logic — safe on the edge runtime, no DB,
 * no cookies, identical result for every consumer.
 */
export function mirrorPath(pathname: string, target: "ar" | "en"): string | null {
  if (isSpecialSurface(pathname)) return null;
  if (isArabicPath(pathname)) {
    if (target === "ar") return null; // already in the Arabic tree
    // /ar/… → /… (the root: "/ar" → "/")
    const en = pathname === "/ar" ? "/" : pathname.slice(3);
    return isStructuralMirrorPath(en) ? en : null;
  }
  if (target === "en") return null; // already in the English tree
  if (PUBLIC_INDEX_MIRRORS.some((m) => m.en === pathname)) return `/ar${pathname === "/" ? "" : pathname}`;
  if (PUBLIC_PREFIX_MIRRORS.some((p) => pathname.startsWith(p))) return `/ar${pathname}`;
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
 * 451 — THE BOUNDARY RECORDER decision (pure).
 *
 * THE MEASURED GAP (live-reproduced on production 2026-11-07, report
 * §13): the 450 client enforcers (setLang's cookie write · the passive
 * first-/ar record · healLangStores) live in the PUBLIC pages' JS
 * chunks — and the CF edge serves public HTML for edge_ttl=43200
 * (12h) + SWR 86400, so for up to half a day after EVERY deploy the
 * public pages run the PREVIOUS generation's JS. Measured live after
 * the 450 deploy: / and /ar served pre-449 chunks whose setLang
 * writes ONLY localStorage — so the owner's exact case-2 flow (choose
 * Arabic on the homepage → open the dashboard) hit a special surface
 * whose SSR reads ONLY the cookie → an English dashboard: a visible
 * post-hydration flip at best (localStorage had the value), PERSISTENT
 * English at worst (a /ar arrival by URL records nothing in the old
 * JS — the passive record is a 450 feature the stale chunk lacks).
 *
 * THE LAW'S SERVER TWIN: the special surfaces are force-dynamic and
 * edge-cache-excluded, so their server code is ALWAYS the current
 * deploy. This pure decision answers, at the one boundary the stale
 * client code cannot cover — a request INTO a special surface — the
 * same question the 450 passive record answers on /ar: "is this
 * reader demonstrably reading Arabic, with no recorded choice?" The
 * evidence is the navigation itself: a same-site Referer inside the
 * Arabic tree. Returns "ar" (record it) or null (nothing to record:
 * a choice-holder is never touched — the ONE governor; an EN-tree
 * referer records nothing — English is the documented default, the
 * same 450 rationale; public surfaces are not this recorder's
 * business; a missing/external/malformed referer proves nothing).
 *
 * SAME-SITE IS HOST-BASED (measured, §13.5): the deployed chain is
 * browser → Cloudflare → Caddy → Next on :3000, and behind that chain
 * `request.nextUrl.origin` resolves to a FRANKENSTEIN value — the
 * x-forwarded-proto (https) stapled onto the UPSTREAM SOCKET host
 * (live-measured: "https://localhost:3100" behind a Caddy-shaped
 * proxy, i.e. "https://127.0.0.1:3000" in production) — matching
 * neither the public origin nor the socket. The referer's HOST is
 * therefore compared against the request's FORWARDED HOST
 * (x-forwarded-host — set by Caddy from the client's original Host,
 * defaulted by Next to the Host header when no proxy set it; a comma
 * chain's first entry is the client-addressed host). The scheme is
 * deliberately NOT compared: the client speaks https to the edge
 * while the origin socket is plain http — the HOST is the site's
 * identity, and a port mismatch (or a suffix attack like
 * alkemos.com.evil.com) still fails the strict host equality.
 *
 * Consumers: the middleware (src/middleware.ts) — the ONLY always-
 * fresh execution point. NO redirect is ever issued (the 450-rejected
 * surface stays rejected: RSC-marker stripping + Cache-Control
 * inheritance); the record rides the REQUEST cookies (this render is
 * correct from the first HTML — no flip) and the RESPONSE Set-Cookie
 * (private surfaces only — never edge-cached, never public noise).
 */
export function boundaryRefererRecord(
  pathname: string,
  hasChoice: boolean,
  referer: string | null | undefined,
  requestHost: string | null | undefined,
): "ar" | null {
  if (hasChoice) return null; // the recorded choice governs — never overridden
  if (!isSpecialSurface(pathname)) return null; // public surfaces stay URL-law (F-2-A)
  if (!referer || !requestHost) return null; // nothing proven, nothing recorded
  try {
    const u = new URL(referer);
    // A proxy chain may comma-append hosts — the FIRST entry is the
    // host the client addressed (Caddy overwrites the header with the
    // original Host; Next defaults it from Host when no proxy set it).
    const host = requestHost.split(",")[0].trim().toLowerCase();
    return u.host.toLowerCase() === host && isArabicPath(u.pathname)
      ? "ar"
      : null;
  } catch {
    return null; // malformed referer — prove nothing, change nothing
  }
}
