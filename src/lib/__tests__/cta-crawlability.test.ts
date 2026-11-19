import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";

/**
 * CTA-CRAWLABILITY canary (site-wide audit 2026-11-19 — owner order «تدقيق
 * وإصلاح شامل لجميع عناصر CTA والروابط والأزرار في الموقع بالكامل»).
 *
 * The audit inventoried 926 interactive elements across 328 files and found
 * the ONE structural defect class: pure-navigation CTAs implemented as JS
 * buttons (`onClick={() => navigate(...)}` / `router.push`) — invisible to
 * crawlers in the server HTML. This canary pins the law after the fix:
 *
 *   1) CONVERTED — every pure-navigation element listed below is now a real
 *      <Link> with the exact href navigate() resolved (language-aware for
 *      public targets — access-point law; plain paths for app surfaces —
 *      the useNav pathForView mapping, byte-faithful).
 *   2) FUNCTIONAL KEEPS — the audit's rule «do NOT convert functional
 *      buttons»: clipboard copies, sign-outs, Premium+ gates, form-state
 *      toggles, evo-chat openers and the weight-log sessionStorage writer
 *      STAY <button>s. Each keep is pinned by name so a future "fix" can't
 *      silently delete the behavior either.
 *   3) NO REGRESSION — the converted surfaces carry ZERO pure-nav
 *      `onClick={() => navigate(` patterns (the only remaining navigate
 *      calls live inside functional handlers, pinned as keeps).
 *
 * The verified sites for every href: /, /ar, /memberships, /ar/memberships,
 * /auth, /dashboard, /plans, /questionnaires, /support, /referral, /coach,
 * /coach/{id}, /coach/{wallet,landing,affiliate,ads,help,support},
 * /admin/payments, /admin/blog, /admin/blog/new, /admin/blog/{id} — all real
 * routes in the (en)+(app) trees.
 */

const read = (p: string) => readFileSync(p, "utf8");

/* ── the shared chrome: appears in the SSR HTML of every page ─────────── */

describe("CTA-CRAWLABILITY — SiteHeader (every page's chrome)", () => {
  const src = read("src/components/SiteHeader.tsx");

  it("the desktop helmet logo is a language-aware <Link>, not a navigate button", () => {
    expect(src).toContain('href={isAr ? "/ar" : "/"}');
    // the old JS-only bridge is gone from the logo spots
    expect(src).not.toContain('onClick={() => navigate("landing")}');
  });

  it("both logged-out account icons are <Link> to /auth?mode=login", () => {
    expect(src.match(/href="\/auth\?mode=login"/g)?.length).toBe(2);
    expect(src).not.toContain('navigate("auth", { mode: "login" })');
  });

  it("the drawer nav-items render as <Link> (nav → href mapping) and only evo items keep buttons", () => {
    expect(src).toContain("navItemHref");
    expect(src).toContain("item.href ?? (item.nav && !item.evo ? navItemHref(item.nav) : undefined)");
    // evo-chat stays functional (opens the chat widget — never a navigation)
    expect(src).toContain("else if (item.evo) openEvoFloatingChat();");
  });

  it("sign-out stays a <button> (functional — auth action, never a link)", () => {
    expect(src).toContain("await signOutAsync();");
    expect(src).not.toMatch(/<Link[^>]*signOutAsync/);
  });

  it("every drawer app-surface href maps to its real route", () => {
    for (const [view, href] of [
      ["admin-payments", '"/admin/payments"'],
      ["coach-wallet", '"/coach/wallet"'],
      ["coach-affiliate", '"/coach/affiliate"'],
      ["coach-ads", '"/coach/ads"'],
      ["coach-help", '"/coach/help"'],
      ["coach-support", '"/coach/support"'],
      ["coach-landing", '"/coach/landing"'],
      ["coach-client", '"/coach"'],
    ] as const) {
      expect(src).toContain(`case "${view}":`);
      expect(src).toContain(`return ${href};`);
    }
  });
});

/* ── public pages with converted CTAs ──────────────────────────────────── */

describe("CTA-CRAWLABILITY — public surfaces", () => {
  it("AffiliateProgramView: hero secondary + toolkit signup + the P0-E hero/final primaries are <Link>s (clipboard kept via onClick interception)", () => {
    const src = read("src/components/views/AffiliateProgramView.tsx");
    // state-dependent href x3: hero secondary + hero primary + final CTA
    expect(
      src.match(/href=\{profile \? "\/referral" : "\/auth\?mode=signup"\}/g)
        ?.length,
    ).toBe(3);
    expect(src.match(/href="\/auth\?mode=signup"/g)?.length).toBe(1);
    expect(src).not.toContain("onClick={secondaryCta}");
    // ORGANIC-GROWTH-P0-E (2026-11-19, roadmap 10 field 4: «تحويل أزرار
    // القسمين الأول والأخير إلى روابط»): the hero primary + final CTA
    // buttons became real <Link>s — the P0-E order supersedes this
    // canary's original «the clipboard primary stays a <button>» keep
    // (updated in the same frame per the canary-update law). The clipboard
    // behavior for members holding a code is preserved byte-faithfully:
    // onClick intercepts ONLY that case (preventDefault + primaryCta's
    // copy-and-toast); every other state falls through to the Link's own
    // navigation — identical to the retired navigate() calls.
    expect(src).toContain("navigator.clipboard.writeText(affiliateUrl)");
    expect(src).toContain("e.preventDefault();");
    expect(src).toContain("void primaryCta();");
    // no bare primaryCta button remains anywhere
    expect(src).not.toContain("onClick={primaryCta}");
    // functional keeps: the authed-only share buttons stay <button>s
    expect(src).toContain("onClick={shareWhatsApp}");
    expect(src).toContain("onClick={shareFacebook}");
    expect(src).toContain("onClick={shareX}");
  });

  it("StaticPageView: the FAQ tail CTA is a language-aware <Link> (about/faq/privacy/terms ×2 languages)", () => {
    const src = read("src/components/views/StaticPageView.tsx");
    expect(src).toContain('href={isAr ? "/ar/contact" : "/contact"}');
    expect(src).not.toContain('onClick={() => navigate("contact")}');
    expect(src).not.toContain('import { useNav }');
    expect(src).not.toContain("useNav()");
  });

  it("BlogAdmin/BlogEditor surfaces: the new-article, edit and back CTAs are <Link>s", () => {
    const admin = read("src/components/views/BlogAdminView.tsx");
    expect(admin).toContain('href="/admin/blog/new"');
    expect(admin).toContain("href={`/admin/blog/${post.id}`}");
    expect(admin).not.toContain('onClick={() => router.push("/admin/blog/new")}');
    expect(admin).not.toContain("onClick={() => router.push(`/admin/blog/${post.id}`)}");
    // functional keeps: the AI-draft redirect + the job-poller redirect
    // stay router calls inside handlers (they are flows, not CTAs)
    expect(admin).toContain('router.push("/admin/blog/new?ai=1")');

    const editor = read("src/components/views/BlogEditorView.tsx");
    expect(editor).toContain('href="/admin/blog"');
    expect(editor).not.toContain('onClick={() => router.push("/admin/blog")}');
    // functional keep: the save-success redirect back to the list
    expect(editor).toContain('router.push("/admin/blog")');
  });
});

/* ── account / auth / checkout surfaces ───────────────────────────────── */

describe("CTA-CRAWLABILITY — auth + checkout", () => {
  it("AuthView: logo ×2, mode toggle, guest back-home and the OTP entry are <Link>s", () => {
    const src = read("src/components/views/AuthView.tsx");
    // two logo links (recovery screen + main screen) — language-aware
    expect(src.match(/href=\{isAr \? "\/ar" : "\/"\}/g)?.length).toBe(3);
    // login↔signup toggle — the exact querystring navigate() built
    expect(src).toContain('href={isSignup ? "/auth?mode=login" : "/auth?mode=signup"}');
    // OTP entry — dynamic email querystring
    expect(src).toContain("href={`/auth/reset?mode=code&email=${encodeURIComponent(email.trim())}`}");
  });

  it("AuthView: the three form-state toggles STAY <button>s (state reset IS the behavior)", () => {
    const src = read("src/components/views/AuthView.tsx");
    // the confirmation/forgot/account-exists screens flip LOCAL state first
    expect(src).toContain("setNeedsConfirmation(false)");
    expect(src).toContain("setForgotSent(false)");
    expect(src).toContain("setAccountExists(false)");
    // each of those screens keeps a <button> whose handler resets that state
    expect(src.match(/<button\s+onClick=\{\(\) => \{\s*\n\s*setNeedsConfirmation\(false\);/)).toBeTruthy();
    expect(src.match(/<button\s+onClick=\{\(\) => \{\s*\n\s*setForgotSent\(false\);/)).toBeTruthy();
    expect(src.match(/<button\s+onClick=\{\(\) => \{\s*\n\s*setAccountExists\(false\);/)).toBeTruthy();
  });

  it("CheckoutView: back-to-memberships ×2, logo, and dashboard ×2 are <Link>s; submit/redirect logic untouched", () => {
    const src = read("src/components/views/CheckoutView.tsx");
    expect(src.match(/href=\{isAr \? "\/ar\/memberships" : "\/memberships"\}/g)?.length).toBe(3);
    expect(src.match(/href="\/dashboard"/g)?.length).toBe(2);
    // functional keeps: the delayed auto-redirect + the auth-bounce handler
    expect(src).toContain('setTimeout(() => navigate("dashboard"), 2000)');
    expect(src).toContain('navigate("auth", { mode: "signup" })');
  });
});

/* ── dashboard / plans / app shells ────────────────────────────────────── */

describe("CTA-CRAWLABILITY — dashboard + plans + app shells", () => {
  it("DashboardView: every pure-nav CTA carries a real href; the weight-log quick action stays a <button>", () => {
    const src = read("src/components/views/DashboardView.tsx");
    // attention strip: href items, no action() field left
    expect(src).toContain('href: isAr ? "/ar/memberships" : "/memberships"');
    expect(src).toContain('href: "/questionnaires"');
    expect(src).not.toContain("action: () => navigate(");
    // quick actions: pure-nav entries are Links, the functional one keeps its button
    expect(src).toContain('{ label: t("dash.logWeightToday"), onClick: openWeightAdd }');
    expect(src).toContain('{ label: t("dash.viewPlans"), href: "/plans" }');
    expect(src).toContain('{ label: t("nav.support"), href: "/support" }');
    expect(src).toContain("openWeightAdd"); // sessionStorage write + navigate = functional
    // the five direct CTAs are Links
    expect(src.match(/href="\/questionnaires"/g)?.length).toBe(1);
    expect(src.match(/href="\/plans"/g)?.length).toBe(2);
  });

  it("PlansView: the questionnaire empty-state CTA is a <Link>", () => {
    const src = read("src/components/views/PlansView.tsx");
    expect(src).toContain('href="/questionnaires"');
    expect(src).not.toContain('onClick={() => navigate("questionnaires")}');
  });

  it("AppLayout: sidebar + mobile nav render <Link>s; the evo-chat entry keeps its <button>", () => {
    const src = read("src/components/AppLayout.tsx");
    expect(src).toContain('item.to === "memberships"');
    expect(src).not.toContain("navigate(item.to)");
    expect(src.match(/onClick=\{\(\) => openEvoFloatingChat\(\)\}/g)?.length).toBe(2);
    expect(src).not.toMatch(/const \{ view, navigate \} = useNav\(\)/);
  });
});

/* ── admin / coach private surfaces (same law, no exceptions) ─────────── */

describe("CTA-CRAWLABILITY — admin + coach surfaces", () => {
  it("AdminPaymentsView: the manage-client CTA is a dynamic <Link>", () => {
    const src = read("src/components/views/AdminPaymentsView.tsx");
    expect(src).toContain("href={`/coach/${r.user_id}`}");
    expect(src).not.toContain('navigate("coach-client", { clientId: r.user_id })');
  });

  it("CoachAdsView: wallet + public-page CTAs are <Link>s", () => {
    const src = read("src/components/views/CoachAdsView.tsx");
    expect(src).toContain('href="/coach/wallet"');
    expect(src).toContain('href="/coach/landing"');
    expect(src).not.toContain('onClick={() => navigate("coach-wallet")}');
    expect(src).not.toContain('onClick={() => navigate("coach-landing")}');
    expect(src).not.toContain('import { useNav }');
    expect(src).not.toContain("useNav()");
  });

  it("CoachClientView: the back-to-list CTA is a <Link> (ghost button recipe via buttonVariants)", () => {
    const src = read("src/components/views/CoachClientView.tsx");
    expect(src).toContain('href="/coach"');
    expect(src).toContain('buttonVariants({ variant: "ghost", size: "sm", className: "gap-1" })');
    expect(src).not.toContain('onClick={() => navigate("coach")}');
    expect(src).not.toContain('import { useNav }');
    expect(src).not.toContain("useNav()");
  });

  it("CoachView: admin-payments + manage-client are <Link>s; the row keeps its click affordance", () => {
    const src = read("src/components/views/CoachView.tsx");
    expect(src).toContain('href="/admin/payments"');
    expect(src).toContain("href={`/coach/${c.id}`}");
    expect(src).toContain("onClick={(e) => e.stopPropagation()}");
    // the broadcast row click stays functional (selection mode OR duplicate
    // of the inner link's navigation — the crawlable href lives in the row)
    expect(src).toContain('if (broadcastTarget === "selected") toggleClientSelection(c.id);');
  });
});

/* ── the P0-A functional keeps must survive this frame too ─────────────── */

describe("CTA-CRAWLABILITY — functional keeps from the audit (never convert)", () => {
  it("meal-planner keeps its Premium+ JSON-export gate; water-tracker's save gate was removed by P1-E", () => {
    const water = read("src/app/(en)/tools/water-tracker/page.tsx");
    const meal = read("src/app/(en)/meal-planner/page.tsx");
    // ORGANIC-GROWTH-P1-E (2026-11-20 — owner roadmap order, 01-§6):
    // water-tracker's client-side DB-save gate («Premium+ only»)
    // contradicted the plans table (memberships.ts grants EVERY member
    // saves; /api/tools/save-result enforces that quota) — REMOVED. The
    // page defers to the server quota now (one message, consistent with
    // memberships.ts — pinned in water-tracker-p1e.test.ts). The auth
    // navigation stays.
    expect(water).toContain('navigate("auth", { mode: "login" })');
    expect(water).not.toContain('navigate("memberships")');
    // meal-planner's gate is a REAL per-plan entitlement
    // (limits.mealPlannerExport from memberships.ts) — untouched.
    expect(meal).toContain('navigate("memberships")');
  });

  it("SaveResultButton stays a <button> (save operation)", () => {
    const src = read("src/components/SaveResultButton.tsx");
    expect(src).toMatch(/<button[\s\S]*onClick=/);
    expect(src).not.toMatch(/<Link[\s\S]*href=/);
  });

  it("LanguageToggle stays a <button> (writes the language choice)", () => {
    const src = read("src/components/LanguageToggle.tsx");
    expect(src).toMatch(/<Button[\s\S]*onClick=/);
  });
});

/* ── href sanity: every static href these conversions emit is a real route ── */

describe("CTA-CRAWLABILITY — converted hrefs resolve to real routes", () => {
  const routes = new Set<string>();
  {
    // build the real route map from the app tree (en + app groups)
    const walk = (dir: string, prefix: string) => {
      if (!existsSync(dir)) return;
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) {
          // route groups (parenthesized) never contribute URL segments
          const seg = e.name.startsWith("(") ? "" : `/${e.name}`;
          walk(`${dir}/${e.name}`, `${prefix}${seg}`);
        } else if (e.name === "page.tsx") routes.add(prefix || "/");
      }
    };
    walk("src/app/(en)", "");
    walk("src/app/(app)", "");
  }

  it.each([
    ["/", "home"],
    ["/memberships", "memberships"],
    ["/contact", "contact"],
    ["/referral", "referral dashboard"],
    ["/auth", "auth"],
    ["/dashboard", "dashboard"],
    ["/plans", "plans"],
    ["/questionnaires", "questionnaires"],
    ["/support", "support"],
    ["/coach", "coach"],
    ["/coach/wallet", "coach wallet"],
    ["/coach/landing", "coach public page"],
    ["/admin/payments", "admin payments"],
    ["/admin/blog", "blog admin"],
    ["/admin/blog/new", "new article"],
  ] as [string, string][])("%s is a real route (%s)", (path: string, _label: string) => {
    expect(routes.has(path)).toBe(true);
  });

  it("the dynamic coach-client and blog-edit Link patterns map to dynamic routes", () => {
    expect(routes.has("/coach/[clientId]")).toBe(true);
    expect(routes.has("/admin/blog/[id]")).toBe(true);
  });
});
