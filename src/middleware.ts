import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  boundaryRefererRecord,
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
} from "@/lib/surface-locale";

/**
 * Supabase session middleware.
 *
 * CRITICAL for OAuth: @supabase/ssr's browser client stores the PKCE code
 * verifier in localStorage by default. But the /auth/callback route handler
 * runs on the server, which can't read localStorage. The fix is to use
 * @supabase/ssr's createServerClient in middleware — it syncs the auth
 * session (and PKCE verifier) to cookies, so both client and server share
 * the same storage.
 *
 * Without this middleware, Google OAuth fails with:
 * "PKCE code verifier not found in storage. This can happen if the auth
 * flow was initiated in a different browser or device, or if the storage
 * was cleared."
 *
 * This middleware also refreshes expired sessions on every request.
 */
/**
 * SEO locale law (2026-09-01): shared predicate — Arabic ONLY means
 * exactly `/ar` or the `/ar/…` subtree (same rule as the root layout's
 * `isArabicPath` in src/app/layout.tsx). A loose startsWith("/ar") would
 * misclassify future routes like /archive as Arabic.
 */
function isArabicPath(pathname: string): boolean {
  return pathname === "/ar" || pathname.startsWith("/ar/");
}

/**
 * SEO-GEO-4 (2026-09-08, owner directive «ابدأ (ج) ثم (أ)» — audit finding
 * #5): edge-cacheability for public HTML.
 *
 * TWO findings were live-verified locally (`next start`):
 *   1. The route response's Cache-Control (framework dynamic default
 *      `private, no-cache, no-store…`) OVERRIDES any Cache-Control set
 *      here in middleware — middleware is the WRONG layer for it.
 *   2. next.config.ts headers() DOES win over the framework default.
 * The public Cache-Control therefore lives in next.config.ts headers()
 * (the ORIGIN policy — see the SEO-GEO-4 rule there).
 *
 * PHASE 215 / P1-5 (2026-09-16, owner decision «اعتمد الخيار (ب)»):
 * Cloudflare is the OFFICIAL production HTML cache layer. The zone cache
 * rule «alkemos cache rules» (browser_ttl override 300 — expression =
 * the SEO-GEO-4 private-path exclusion list + no-dot paths) rewrites
 * what browsers finally see (`private, max-age=300, must-revalidate` on
 * live HTML) and serves HTML from the edge. CACHE-POLICY-AUDIT
 * 2026-10-22 (measured live via the CF API): edge_ttl = **43200s (12h)**
 * — raised twice since SEO-GEO-4 (3600 → 14400 (T-3) → 43200 (T-3b,
 * the Fluid CPU overage guard)); owner write paths therefore invalidate
 * on demand (revalidateTag/revalidatePath + targeted CF purge) instead
 * of waiting for any TTL. The next.config rule remains the origin-side
 * policy (non-CF paths). Full layer documentation: SECURITY.md §10 +
 * TECH_REFERENCE §5 + docs/CACHE-POLICY-AUDIT-2026-10-22.md.
 *
 * What THIS file still owns: the Content-Language response header and
 * the x-pathname header. The `mhe:locale` cookie write was REMOVED by
 * F-6 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6, executed 2026-11-07):
 * the audit's R-6 proved it DEAD — zero readers anywhere (the old
 * resolveLocale() consumer was retired by VERCEL-USAGE-3), while it
 * still stamped Set-Cookie on the DYNAMIC surfaces (/auth, /checkout)
 * as pure state noise. The public surfaces never saw it anyway (the CF
 * cache rule strips Set-Cookie on edge hits — measured in the audit's
 * §4.2-R6). Removing the write changes no behavior: locale correctness
 * is URL-pinned by the route groups.
 *
 * The PRIVATE-path exclusion list (api/admin/auth/checkout/dashboard/
 * questionnaires/progress/plans/profile/support/referral/preview/coach)
 * lives in next.config.ts's SEO-GEO-4 headers rule — the single layer
 * that wins over the framework's dynamic Cache-Control default.
 */

export async function middleware(request: NextRequest) {
  // ──────────────────────────────────────────────────────────────
  // VERCEL-USAGE-3 (2026-09-21): /_next/image QUOTA GUARD.
  // `images.unoptimized: true` (Phase 97) stopped next/image from
  // EMITTING /_next/image URLs, but the optimizer endpoint itself stayed
  // live — every stale URL still circulating in CDN caches, social-media
  // scrapers, and crawler memory converts into a PAID Image Optimization
  // transformation (4K/5K in the September cycle, the closest quota to
  // breach). With unoptimized as the standing law there is no legitimate
  // caller of this endpoint, so return 410 Gone at the edge before any
  // optimizer work happens.
  if (request.nextUrl.pathname === "/_next/image") {
    return new NextResponse(null, { status: 410 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ──────────────────────────────────────────────────────────────────
  // H1 fix (Option B) history — locale detection. The cookie this block
  // used to write (mhe:locale) was REMOVED by F-6
  // (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6, executed 2026-11-07):
  // zero readers remained after VERCEL-USAGE-3 retired resolveLocale()
  // (the route-group layouts are URL-pinned), so the write was pure
  // Set-Cookie noise on the dynamic surfaces (/auth, /checkout). The
  // two response HEADERS below stay: Content-Language is a real crawler
  // signal; x-pathname is harmless (its readers retired with the same
  // resolveLocale removal — kept for continuity, zero cost).
  // ──────────────────────────────────────────────────────────────────
  const pathname = request.nextUrl.pathname;
  // Route locale — derived from the URL itself: `/ar/*` routes are
  // Arabic, every other route is English. This drives the
  // Content-Language header and the x-pathname header.
  const isArabic = isArabicPath(pathname);

  // ──────────────────────────────────────────────────────────────────
  // 451 UNIFIED CHOICE LAW — THE BOUNDARY RECORDER (owner order
  // 2026-11-08, report §13: docs/AR-DISCOVERY-UI-SETTLE-AUDIT-
  // 2026-11-07.md). The 450 client enforcers (setLang's cookie write,
  // the passive first-/ar record, healLangStores) ship in the PUBLIC
  // pages' JS chunks — which the Cloudflare edge keeps serving up to
  // 12h STALE after every deploy (edge_ttl 43200 + SWR 86400,
  // docs/CACHE-POLICY-AUDIT-2026-10-22.md). Live-reproduced on
  // production after the 450 deploy: / and /ar served pre-449 chunks
  // whose toggle writes ONLY localStorage, so the owner's exact
  // case-2 flow (choose Arabic on the homepage → open the dashboard)
  // hit a special surface whose SSR reads ONLY the cookie → an
  // English dashboard — a post-hydration flip at best, PERSISTENT
  // English when the /ar arrival recorded nothing at all.
  //
  // THIS is the always-fresh server twin of the 450 passive record:
  // the special surfaces are force-dynamic + edge-cache-excluded, so
  // this code is ALWAYS the current deploy. At the one boundary the
  // stale client code cannot cover — a request INTO a special surface
  // — the recorder derives the READING language from the navigation
  // itself (a same-origin Referer inside the Arabic tree) when NO
  // recorded choice exists anywhere, and lands it in BOTH directions:
  //   · the REQUEST cookies (mutated before NextResponse.next — the
  //     (app) layout's cookies() read renders the RIGHT lang/dir from
  //     the first HTML of THIS request: no flip, no wrong paint);
  //   · the RESPONSE Set-Cookie (private surfaces only — never
  //     edge-cached, so the F-2-A public byte-identity and the
  //     CACHE-POLICY law are untouched; crawlers never see it on
  //     public URLs because public paths never enter this branch).
  // A choice-holder is NEVER touched (the ONE governor), an EN-tree
  // referer records NOTHING (English is the documented default — the
  // 450 rationale), and NO redirect is ever issued (the 450-measured
  // rejection stands: Next 16's proxy strips the RSC flight markers
  // and a redirect would inherit the edge-cacheable public
  // Cache-Control). Pure decision: boundaryRefererRecord — unit-
  // tested; this wiring is source-pinned by the 451 canary.
  // ──────────────────────────────────────────────────────────────────
  const boundaryLang = boundaryRefererRecord(
    pathname,
    request.cookies.has(LANG_COOKIE),
    request.headers.get("referer"),
    // SAME-SITE REFERENCE (§13.5, live-measured behind the production
    // chain CF→Caddy→Next): the request URL's origin value resolves to
    // a frankenstein there (x-forwarded-proto + the UPSTREAM SOCKET
    // host — "https://127.0.0.1:3000"), matching neither the public
    // origin nor the referer. The request's FORWARDED HOST is the
    // client-addressed identity: Caddy sets it from the original Host
    // and Next defaults it to the Host header when no proxy set it.
    request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  );
  if (boundaryLang) {
    request.cookies.set(LANG_COOKIE, boundaryLang);
  }
  /** Re-apply the boundary record's Set-Cookie — must be called on
   * EVERY response object that can be returned (the @supabase/ssr
   * setAll callback REPLACES the response mid-flight; without the
   * re-apply a logged-in user's first crossing would render Arabic
   * but never persist the record, and the NEXT special-surface
   * navigation — referer /dashboard, not /ar — would flip back).
   * Cookie attributes mirror persistLangCookie exactly (the ONE
   * writer's contract): path=/ · max-age=1y · samesite=lax. */
  const applyBoundaryCookie = (res: NextResponse) => {
    if (!boundaryLang) return;
    res.cookies.set(LANG_COOKIE, boundaryLang, {
      path: "/",
      maxAge: LANG_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  };

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  applyBoundaryCookie(response);

  // Content-Language header — additional crawler signal (kept from
  // original implementation, now always set even in demo mode).
  response.headers.set("Content-Language", isArabic ? "ar-EG" : "en-US");

  // Expose the pathname to the route tree via a custom header.
  response.headers.set("x-pathname", pathname);

  // If Supabase isn't configured, skip session refresh (demo mode).
  // The locale headers above are already set — return now.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  // ──────────────────────────────────────────────────────────────────
  // VERCEL-USAGE-9 (2026-10-09): Supabase early-exit — two request
  // classes were paying createServerClient + getUser() for nothing:
  //
  //   1. ANONYMOUS requests (zero sb-* cookies): getUser() can only
  //      resolve to "no session", yet every logged-out page view (the
  //      vast majority of public traffic — crawlers + visitors) still
  //      built the client and ran the call on every invocation.
  //
  //   2. /api/* requests (except /api/auth/*): every route handler
  //      validates its own session via getAuthUser() (auth-server.ts —
  //      its own createServerClient whose getUser() performs the
  //      in-memory token refresh when needed), so the middleware hop
  //      was redundant per-invocation work. The OAuth surface is NOT
  //      affected: the PKCE callback lives at /auth/callback (outside
  //      /api/*), and both the PKCE verifier and session cookies are
  //      sb-* prefixed — authenticated flows keep the full cookie-sync
  //      + refresh path below.
  //
  // Locale headers above are complete for every case — this
  // return is behavior-identical for the two skipped classes.
  const hasSbCookies = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));
  const isApiPath =
    pathname === "/api" || pathname.startsWith("/api/");
  const isApiAuthPath = pathname.startsWith("/api/auth/");
  if (!hasSbCookies || (isApiPath && !isApiAuthPath)) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        // Re-apply the locale headers on the new response object (the
        // `setAll` callback creates a new `NextResponse` that replaces
        // the original, so we must re-set our headers on it to avoid
        // losing them). F-6 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07):
        // the mhe:locale cookie re-write that used to live here was
        // removed with the main-path write — same dead-cookie law.
        // 451: the boundary record's Set-Cookie is re-applied here too
        // (see applyBoundaryCookie — the response object replacement
        // would otherwise silently drop it for logged-in crossings).
        response.headers.set("Content-Language", isArabicPath(pathname) ? "ar-EG" : "en-US");
        response.headers.set("x-pathname", pathname);
        applyBoundaryCookie(response);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session (this also sets the cookies via setAll above).
  // IMPORTANT: do not run any code between createServerClient and
  // supabase.auth.getUser — the session refresh depends on this ordering.
  await supabase.auth.getUser();

  return response;
}

export const config = {
 matcher: [
 // Run on all routes except static assets, Next internals, and the
 // OG image generator. VERCEL-USAGE-2 (2026-09-16): /api/og-image/*
 // serves PNGs to social crawlers — the middleware added zero value
 // there (locale header + Supabase session refresh are meaningless for
 // an image response), so each bot fetch no longer pays the wasted
 // `getUser()` network hop (audit item #5).
 "/((?!_next/static|api/og-image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|js|css)$).*)",
 ],
};
