# AUTH-CALLBACK-LOCALHOST-REDIRECT-FIX-2026-10-10

> **Status:** Fixed in `e8cc613e` (fix(auth): OAuth/recovery callback redirect → localhost:3000 on AWS origin).
> **Owner report (2026-10-10):** «قيم PayPal تمت بالفعل، تسجيل الدخول بحساب جوجل وبعد اختيار البريد صفحة الرجوع https://localhost:3000/»
> **Surface:** `/auth/callback` (Google OAuth + password-recovery landing) on the AWS origin (post-cutover: `alkemos.com` → Cloudflare → Caddy → PM2 `127.0.0.1:3000`).

---

## 1. Symptom

After choosing a Google account on the consent/chooser screen, the browser landed on `https://localhost:3000/` instead of back on the site. The session was **already created**: the PKCE exchange had succeeded and the session cookies were already set on `alkemos.com` — a second visit to the site would have shown the account logged in. The login was 99% complete; only the final browser redirect was wrong.

## 2. What was ruled out (with probes)

| Suspect | Probe | Result |
|---|---|---|
| Supabase Site URL fallback | `GET …supabase.co/auth/v1/callback?code=bogus` (no cookies → no state) | `303 → https://alkemos.com/?error=…` — **Site URL is `https://alkemos.com`, not localhost** |
| Supabase redirect allowlist | The live bundle sends `redirect_to = ${window.location.origin}/auth/callback` (origin-based, verified in the shipped JS); the user REACHED our callback (the bad Location came from our own route) | Allowlist honors the production origin — healthy |
| Google Cloud Console | The Google account chooser appeared and Google handed control back to Supabase | `https://<ref>.supabase.co/auth/v1/callback` is registered — healthy |
| The client bundle | grep of live `/auth` chunks | No hardcoded `localhost:3000` anywhere in the shipped auth logic |

**The smoking gun:** `GET https://alkemos.com/auth/callback` (no `?code`) answered `307 Location: https://localhost:3000/` — our own route produced the bad URL.

## 3. Root cause (measured, not assumed)

`src/app/(app)/auth/callback/route.ts` built every redirect as
`NextResponse.redirect(\`${requestUrl.origin}${decision.href}\`)`.

On **next@16.3.8**, `request.url`'s host is **always `localhost:<port>`** — verified with an isolated probe app (minimal Next 16.3.8 route echoing `request.url`):

| Request headers sent | `request.url` origin |
|---|---|
| (none — plain) | `http://localhost:3100` |
| `Host: alkemos.com` | `http://localhost:3100` |
| `Host: alkemos.com` + `X-Forwarded-Proto: https` | **`https://localhost:3100`** ← production shape |
| `Host: alkemos.com` + `X-Forwarded-Proto: https` + `X-Forwarded-Host: alkemos.com` | `https://localhost:3100` |
| `X-Forwarded-Host: alkemos.com` only | `https://localhost:3100` |

Next 16 ignores **both** `Host` and `X-Forwarded-Host` when constructing `request.url`; only `x-forwarded-proto` is honored (scheme). Behind Caddy the app runs on `127.0.0.1:3000` with `x-forwarded-proto: https` → every origin this route derived was literally `https://localhost:3000` — exactly what the owner saw.

A relative redirect (`NextResponse.redirect("/path")`) is NOT an escape hatch: it **500s** on 16.3.8 (`Error: URL is malformed` — measured). The URL must be absolute, so the origin must come from somewhere other than `request.url`.

Why it never fired on Vercel: the platform fronted the app and the same code path wasn't the one exercising an origin derived this way post-Next-16-upgrade on the Vercel deployment line.

## 4. The fix (`e8cc613e`)

1. **`src/app/(app)/auth/callback/route.ts`** — the origin now resolves as
   `redirectOrigin = (process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin).replace(/\/+$/, "")`
   and all five redirect call sites (gates 1–4 + the catch branch) use it. Local dev keeps working: with no env var set, `requestUrl.origin` is `http://localhost:3000` — which IS the real origin in dev.
2. **`.github/workflows/deploy-aws.yml`** — `NEXT_PUBLIC_SITE_URL` used to reach the **build** only (job env). It is now also staged into the **runtime env** (`env-runtime.env` → `shared/.env`, public literal `https://alkemos.com`, not a secret). Without this, the env branch could never fire on the server.
3. **`src/lib/__tests__/auth-callback-origin.test.ts`** — fs-contract guard: fails if any redirect goes back to `requestUrl.origin`, or if the runtime staging is dropped from the workflow.

Same fix repairs the **password-recovery email links** (they land on the same route with `?next=/auth/reset`).

## 5. Verification

- Local: `tsc --noEmit` 0 · `eslint` 0 · `vitest` 18/18 (new guard + decision-table tests) · `docs_audit.py --ci` green.
- Push gates on `main` (`e8cc613e`): quality gate ✓ · docs-parity ✓ · anti-regression guard ✓.
- Deploy run #9 (`38027909905`) success 2026-10-10 05:38Z — runtime env staged **25 keys** including `NEXT_PUBLIC_SITE_URL` (names only in logs, values never printed); build-info serving `e8cc613e`.
- **Live proof (measured 05:39Z, was → now):**
  - `GET /auth/callback` → `307 Location: https://alkemos.com/` (was `https://localhost:3000/`)
  - `GET /auth/callback?error=probe` → `https://alkemos.com/?auth_error=probe`
  - `GET /auth/callback?next=/auth/reset` (no code) → `https://alkemos.com/auth/reset?recovery_error=1` (the honest recovery landing)

## 6. Owner retest guide (2 minutes)

1. Open **https://alkemos.com/auth** (or any page → «تسجيل الدخول»).
2. Click **«متابعة باستخدام Google»** and pick the account.
3. Expected: you land back on the site **logged in** (dashboard/home) — no `localhost:3000` anywhere.
4. Optional (same route, same fix): «نسيت كلمة المرور؟» → open the email link → should land on `/auth/reset` on the site, not localhost.

If a stale browser tab still shows localhost: hard-refresh once (no caching is involved server-side — the old redirect was produced per-request, so it disappears the moment the new release is active).
