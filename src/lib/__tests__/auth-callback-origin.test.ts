import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * AUTH-CALLBACK-LOCALHOST-REDIRECT canaries (2026-10-10 — owner live bug
 * «تسجيل الدخول بحساب جوجل وبعد اختيار البريد صفحة الرجوع
 * https://localhost:3000/»).
 *
 * LAWS GUARDED:
 *   1. ORIGIN RESOLUTION: /auth/callback must resolve its redirect origin
 *      from NEXT_PUBLIC_SITE_URL (runtime env) with requestUrl.origin as
 *      the local-dev fallback ONLY — never build redirects from
 *      requestUrl.origin directly. Next 16 hardcodes request.url's host
 *      to localhost behind a proxy: Host AND X-Forwarded-Host are both
 *      ignored (measured on next@16.3.8 — a probe app served
 *      Host: alkemos.com + X-Forwarded-Host: alkemos.com still produced
 *      https://localhost:<port>); only x-forwarded-proto is honored,
 *      which is exactly how production produced https://localhost:3000/
 *      behind Caddy while the session cookie was already set.
 *   2. RUNTIME STAGING: deploy-aws.yml must stage NEXT_PUBLIC_SITE_URL
 *      into the RUNTIME env (env-runtime.env → shared/.env). It used to
 *      reach the BUILD only — the server .env lacked the key, so the
 *      env branch of the origin resolution could never fire on the box.
 *   3. ABSOLUTE REDIRECTS: NextResponse.redirect() requires an absolute
 *      URL — a relative one 500s with "URL is malformed" (measured on
 *      next@16.3.8), so the route keeps absolute
 *      `${redirectOrigin}${decision.href}` call sites.
 *
 * Root cause + probe transcript + owner retest guide:
 *   docs/archive/AUTH-CALLBACK-LOCALHOST-REDIRECT-FIX-2026-10-10.md
 */

const ROUTE = "src/app/(app)/auth/callback/route.ts";
const WORKFLOW = ".github/workflows/deploy-aws.yml";

const route = readFileSync(ROUTE, "utf8");
const workflow = readFileSync(WORKFLOW, "utf8");

describe("AUTH-CALLBACK-LOCALHOST-REDIRECT — origin resolution law (route)", () => {
  it("resolves redirectOrigin from NEXT_PUBLIC_SITE_URL with a dev-only requestUrl.origin fallback", () => {
    expect(route).toContain(
      "process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin",
    );
    // Trailing-slash hardening: an env value like "https://alkemos.com/"
    // must never produce "https://alkemos.com//dashboard".
    expect(route).toContain('replace(/\\/+$/, "")');
  });

  it("never builds redirects from requestUrl.origin (the localhost bug)", () => {
    expect(route).not.toContain("NextResponse.redirect(`${requestUrl.origin}");
  });

  it("every redirect call site uses the resolved origin (gates 1-4 + catch)", () => {
    const uses =
      route.match(
        /NextResponse\.redirect\(`\$\{redirectOrigin\}\$\{decision\.href\}`\)/g,
      ) ?? [];
    expect(uses.length).toBe(5);
  });
});

describe("AUTH-CALLBACK-LOCALHOST-REDIRECT — runtime staging law (workflow)", () => {
  it("deploy-aws.yml stages NEXT_PUBLIC_SITE_URL into the RUNTIME env", () => {
    expect(workflow).toContain("R_NEXT_PUBLIC_SITE_URL: https://alkemos.com");
    expect(workflow).toContain('stage NEXT_PUBLIC_SITE_URL');
  });
});
