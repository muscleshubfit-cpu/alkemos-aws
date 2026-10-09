import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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
 * rule «alkemos cache rules» (cache=true · edge_ttl override 3600 ·
 * browser_ttl override 300 — expression = the SEO-GEO-4 private-path
 * exclusion list + no-dot paths) rewrites what browsers finally see
 * (`private, max-age=300, must-revalidate` on live HTML) and serves
 * HTML from the edge for 3600s. The next.config rule remains the
 * origin-side policy (Vercel output + non-CF paths). Full layer
 * documentation: SECURITY.md §10 + TECH_REFERENCE §5.
 *
 * What THIS file still owns: the `mhe:locale` cookie is now written ONLY
 * when the value actually changes. The old unconditional write put
 * Set-Cookie on EVERY response, and any response with Set-Cookie is
 * uncacheable at every CDN edge — that made the next.config policy
 * theoretical. With the change-only write, the vast majority of public
 * responses carry no Set-Cookie and become edge-cacheable. Locale
 * correctness never depends on this cookie for /ar paths (the
 * x-pathname header wins in the root layout).
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
  // H1 fix (Option B): Locale detection — ALWAYS runs, even in demo
  // mode (when Supabase env vars are not set). This is critical because
  // the root layout (`src/app/layout.tsx`) depends on the `x-pathname`
  // header + `mhe:locale` cookie to render `<html lang dir>` correctly.
  //
  // Precedence (enforced in the root layout, NOT here):
  //   1. URL pathname (`/ar/...` → `ar`) — always wins
  //   2. `mhe:locale` cookie (fallback for non-`/ar` routes)
  //   3. Default `en`
  //
  // The cookie is always set to match the current pathname so that:
  //   - `/ar/*` requests always get `mhe:locale=ar` (cookie can NOT override)
  //   - English requests get `mhe:locale=en` (resets any stale `ar` cookie)
  // ──────────────────────────────────────────────────────────────────
  const pathname = request.nextUrl.pathname;
  // Route locale — DYNAMIC, derived from the URL itself: `/ar/*` routes are
  // Arabic, every other route is English. This drives the Content-Language
  // header, the `x-pathname` header (read by the root layout to render
  // `<html lang dir>`) and the `mhe:locale` cookie.
  const isArabic = isArabicPath(pathname);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Content-Language header — additional crawler signal (kept from
  // original implementation, now always set even in demo mode).
  response.headers.set("Content-Language", isArabic ? "ar-EG" : "en-US");

  // Expose the pathname to the root layout via a custom header. The
  // root layout cannot receive `params` (it's the parent of all routes,
  // not a dynamic segment), so `headers().get('x-pathname')` is the
  // cleanest server-side way to know which URL the user requested.
  response.headers.set("x-pathname", pathname);

  // Write a `mhe:locale` cookie so the root layout can read it via
  // `cookies()` as a fallback when the pathname doesn't determine the
  // locale. SEO-GEO-4: written ONLY when the value actually changes —
  // an unconditional write put Set-Cookie on EVERY response, which
  // makes the response uncacheable at any CDN edge.
  const desiredLocale = isArabic ? "ar" : "en";
  if (request.cookies.get("mhe:locale")?.value !== desiredLocale) {
    response.cookies.set("mhe:locale", desiredLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year — survives browser restarts
    });
  }

  // If Supabase isn't configured, skip session refresh (demo mode).
  // The locale headers/cookies above are already set — return now.
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
  // Locale headers/cookies above are complete for every case — this
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
        // Re-apply locale headers/cookies on the new response object
        // (the `setAll` callback creates a new `NextResponse` that
        // replaces the original, so we must re-set our locale headers
        // on it to avoid losing them). SEO-GEO-4: same change-only
        // cookie write as the main path (see the block comment above).
        const isAr = isArabicPath(pathname);
        response.headers.set("Content-Language", isAr ? "ar-EG" : "en-US");
        response.headers.set("x-pathname", pathname);
        const desired = isAr ? "ar" : "en";
        if (request.cookies.get("mhe:locale")?.value !== desired) {
          response.cookies.set("mhe:locale", desired, {
            path: "/",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365,
          });
        }
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
 // an image response) but DID stamp `Set-Cookie: mhe:locale` on every
 // cookieless crawler request, which makes a response uncacheable at
 // any CDN edge — so the s-maxage added to that route could never
 // fire. Excluded here, crawler responses are cookie-free and
 // edge-cacheable, and each bot fetch no longer pays the wasted
 // `getUser()` network hop either (audit item #5).
 "/((?!_next/static|api/og-image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|js|css)$).*)",
 ],
};
