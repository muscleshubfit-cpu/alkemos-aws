import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCallbackRedirect } from "@/lib/auth-callback-redirect";

/**
 * OAuth + recovery callback handler (server-side).
 *
 * Flow:
 * 1. User clicks "Continue with Google" on the client — or opens a
 * forgot-password email link (RECOVERY: redirectTo=/auth/callback?next=
 * /auth/reset from AuthView).
 * 2. Client calls supabase.auth.signInWithOAuth({ redirectTo: '/auth/callback' })
 * (OAuth) or supabase.auth.resetPasswordForEmail(…) (recovery). Both store
 * a PKCE code verifier in cookies (via @supabase/ssr + middleware).
 * 3. Browser redirects to Google → user consents → Google redirects to Supabase.
 * 4. Supabase exchanges Google's code for its own auth code, then redirects to
 * /auth/callback?code=XXX (our server route).
 * 5. THIS handler reads the code, exchanges it for a session (using the PKCE
 * verifier from the cookie), sets the session cookie, and redirects to the
 * sanitized `next` (default /).
 * 6. The client's onAuthStateChange listener fires with the new session,
 * updating the UI (user lands on their dashboard).
 *
 * RECOVERY-LINK-ERROR FIX (2026-09-22, owner live bug report «بعد الضغط على
 * الرابط فتح الموقع مع رسالة خطاء»): the PKCE verifier cookie only exists in
 * the browser that STARTED the flow. A recovery email link opened in a
 * different browser / mail-app WebView — or with its one-time code already
 * consumed (email scanners, second click) — or expired used to dump the user
 * on the HOMEPAGE with the raw GoTrue string as a toast («Login failed:
 * invalid request: …»). The redirect decision table
 * (src/lib/auth-callback-redirect.ts, unit-tested) now sends EVERY recovery
 * failure branch to /auth/reset?recovery_error=1, where the reset page shows
 * an honest localized state with a «start the recovery again» CTA. The OAuth
 * surface keeps its exact pre-fix behavior (/?auth_error=… on the homepage)
 * — branch ordering below mirrors the pre-fix route on purpose.
 *
 * AUTH-CALLBACK-LOCALHOST-REDIRECT FIX (2026-10-10, owner live bug report
 * «تسجيل الدخول بحساب جوجل وبعد اختيار البريد صفحة الرجوع
 * https://localhost:3000/»): Next 16 constructs request.url with a
 * HARDCODED localhost host — measured on next@16.3.8, it ignores BOTH the
 * Host header AND X-Forwarded-Host (probe: Host + XFH alkemos.com still
 * yields https://localhost:3000; only x-forwarded-proto is honored for the
 * scheme). On the AWS origin (Caddy → 127.0.0.1:3000, x-forwarded-proto
 * https) every redirect this route built from requestUrl.origin sent the
 * browser to https://localhost:3000/ — right AFTER the PKCE exchange had
 * already succeeded and the session cookie was already set, so Google login
 * looked dead while being 99% complete. NextResponse.redirect() REQUIRES an
 * absolute URL (a relative one 500s — "URL is malformed", measured), so the
 * origin is now resolved: NEXT_PUBLIC_SITE_URL (staged into the RUNTIME env
 * by deploy-aws.yml since this fix — it used to be build-time only) →
 * requestUrl.origin (local-dev fallback, where Next's localhost IS the real
 * origin). Root cause + probes: docs/archive/AUTH-CALLBACK-LOCALHOST-REDIRECT-FIX-2026-10-10.md.
 *
 * PII law (SECURITY.md §2.3): never log user emails.
 */
export async function GET(request: Request) {
 const requestUrl = new URL(request.url);
 // AUTH-CALLBACK-LOCALHOST-REDIRECT FIX (2026-10-10): see the file header —
 // Next 16's request.url is ALWAYS localhost-hosted behind a proxy, so the
 // redirect origin comes from the configured site URL (runtime env), falling
 // back to requestUrl.origin ONLY in local dev where that origin is real.
 const redirectOrigin = (process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin).replace(/\/+$/, "");
 const code = requestUrl.searchParams.get("code");
 const next = requestUrl.searchParams.get("next") || "/";
 const error = requestUrl.searchParams.get("error");
 const errorDescription = requestUrl.searchParams.get("error_description");

 // ── Gate 1: provider/GoTrue forwarded an error (used/expired link,
 // provider deny…). No Supabase work is done — same as pre-fix.
 if (error) {
 console.error("[auth/callback] provider error:", error, errorDescription);
 const decision = authCallbackRedirect({ code, next, providerError: error });
 return NextResponse.redirect(`${redirectOrigin}${decision.href}`);
 }

 // ── Gate 2: no code at all (malformed link / verify dropped it).
 // OAuth keeps its silent home redirect; recovery gets its honest landing.
 if (!code) {
 const decision = authCallbackRedirect({ code: null, next, providerError: null });
 return NextResponse.redirect(`${redirectOrigin}${decision.href}`);
 }

 // ── Gate 3: server configuration.
 const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

 if (!supabaseUrl || !supabaseAnonKey) {
 console.error("[auth/callback] Missing Supabase env vars");
 const decision = authCallbackRedirect({
 code,
 next,
 providerError: null,
 exchangeError: "server-config",
 });
 return NextResponse.redirect(`${redirectOrigin}${decision.href}`);
 }

 const cookieStore = await cookies();

 const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
 cookies: {
 getAll() {
 return cookieStore.getAll();
 },
 setAll(cookiesToSet) {
 try {
 cookiesToSet.forEach(({ name, value, options }) =>
 cookieStore.set(name, value, options),
 );
 } catch {
 // Called from a Server Component — middleware will refresh the session.
 }
 },
 },
 });

 // ── Gate 4: PKCE exchange (code is guaranteed non-null here).
 try {
 const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
 if (exchangeError) {
 console.error("[auth/callback] Code exchange failed:", exchangeError.message);
 }
 // Session (if exchanged) is now in cookies. Redirect per the decision
 // table: recovery failures land on /auth/reset?recovery_error=1, OAuth
 // failures on /?auth_error=…, success on the sanitized `next`.
 const decision = authCallbackRedirect({
 code,
 next,
 providerError: null,
 exchangeError: exchangeError?.message ?? null,
 });
 return NextResponse.redirect(`${redirectOrigin}${decision.href}`);
 } catch (e) {
 const msg = e instanceof Error ? e.message : String(e);
 console.error("[auth/callback] Exception:", msg);
 const decision = authCallbackRedirect({
 code,
 next,
 providerError: null,
 exchangeError: msg || "unknown",
 });
 return NextResponse.redirect(`${redirectOrigin}${decision.href}`);
 }
}
