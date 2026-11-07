"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { mirrorPath, readStoredLang } from "@/lib/surface-locale";

export type View =
 | "landing"
 | "memberships"
 | "auth"
 | "checkout"
 | "dashboard"
 | "questionnaires"
 | "progress"
 | "plans"
 | "chat"
 | "support"
 | "coach"
 | "coach-client"
 | "coach-support"
 | "admin-payments"
 | "coach-landing"
 | "coach-wallet"
 | "coach-affiliate"
 | "coach-ads"
 | "coach-help"
 | "referral"
 | "blog"
 | "about"
 | "contact"
 | "privacy"
 | "terms"
 | "faq"
 | "blog-admin"
 | "blog-editor"
 | "admin-referrals";

/**
 * Real, crawlable, back-button-friendly routing.
 *
 * This used to be a pure in-memory SPA router (view/params kept in React
 * state, URL always stayed at "/"). That broke the browser back button and
 * made every internal screen invisible to search engines. `useNav()` is now
 * a thin adapter over Next.js's router so every existing `navigate("x", {...})`
 * call site in the app keeps working unchanged, but each call now produces a
 * real URL + a real browser history entry.
 */
function pathForView(view: View, params: Record<string, string> = {}): string {
 switch (view) {
 case "landing":
 return "/";
 case "auth":
 return params.mode ? `/auth?mode=${encodeURIComponent(params.mode)}` : "/auth";
 case "memberships":
 return "/memberships";
 case "checkout": {
 const q = new URLSearchParams();
 if (params.tier) q.set("tier", String(params.tier));
 if (params.months) q.set("months", String(params.months));
 const qs = q.toString();
 return qs ? `/checkout?${qs}` : "/checkout";
 }
 case "coach-client":
 return params.clientId ? `/coach/${encodeURIComponent(params.clientId)}` : "/coach";
 // 0043 TERMINOLOGY: site-membership payment requests are reviewed by
 // the ADMIN only (site coaching = B2C/admin; coach system = B2B).
 case "admin-payments":
 return "/admin/payments";
 case "coach-wallet":
 return "/coach/wallet";
 case "coach-affiliate":
 return "/coach/affiliate";
 case "coach-ads":
 return "/coach/ads";
 case "coach-help":
 return "/coach/help";
 case "coach-support":
 return "/coach/support";
 case "coach-landing":
 return "/coach/landing";
 case "coach":
 return "/coach";
 case "blog-admin":
 return "/admin/blog";
 case "admin-referrals":
 return "/admin/referrals";
 case "blog-editor":
 // New article by default; if a postId is provided, edit that article.
 return params.postId ? `/admin/blog/${encodeURIComponent(params.postId)}` : "/admin/blog/new";
 default:
 return `/${view}`;
 }
}

/** Reverse mapping: current pathname -> View, used for active-tab highlighting. */
function viewForPath(pathname: string): View {
 // Access-point fix (2026-09-14): strip the /ar prefix so the mirror URLs
 // resolve to the same views (e.g. /ar/memberships → "memberships").
 const path = pathname.replace(/^\/ar(?=\/|$)/, "") || "/";
 if (path === "/" || path === "") return "landing";
 if (path.startsWith("/admin/payments")) return "admin-payments";
 if (path.startsWith("/coach/wallet")) return "coach-wallet";
 if (path.startsWith("/coach/affiliate")) return "coach-affiliate";
 if (path.startsWith("/coach/ads")) return "coach-ads";
 if (path.startsWith("/coach/help")) return "coach-help";
 if (path.startsWith("/coach/support")) return "coach-support";
 if (path.startsWith("/coach/landing")) return "coach-landing";
 if (path.startsWith("/coach/")) return "coach-client";
 if (path === "/coach") return "coach";
 if (path.startsWith("/admin/blog")) return "blog-admin";
 if (path.startsWith("/admin/referrals")) return "admin-referrals";
 const clean = path.replace(/^\//, "").split("/")[0];
 const known: View[] = [
 "memberships", "auth", "checkout", "dashboard", "questionnaires",
 "progress", "plans", "chat", "support", "referral", "blog",
 "about", "contact", "privacy", "terms", "faq",
 ];
 return (known as string[]).includes(clean) ? (clean as View) : "landing";
}

/**
 * AR mirrors for the PUBLIC marketing views (access-point fix 2026-09-14).
 *
 * When a CHOICE-LESS visitor is on an /ar/* URL, navigate() resolves these
 * views to their Arabic mirror instead of dropping them back on the EN
 * path — the header logo / «الرئيسية» button on /ar/memberships now lands
 * on /ar, and the FAQ-page «تواصل معنا» CTA lands on /ar/contact. Views
 * without an Arabic mirror (auth, checkout, dashboard, … — private or
 * EN-only surfaces) are untouched and keep their EN routes.
 *
 * 450 UNIFIED CHOICE LAW: a visitor WITH a recorded choice no longer
 * depends on this URL-based table at all — every PUBLIC view target is
 * resolved through the CENTRAL structural map (mirrorPath in
 * src/lib/surface-locale.ts) into the CHOSEN tree, from ANY surface
 * (the logo → "/" from an Arabic admin session lands on /ar directly,
 * no wrong-language page renders first — the boundary conflict the law
 * outlaws, fixed once here for all 25 useNav consumers instead of per
 * component). Special-surface targets carry no language dimension and
 * pass through untouched.
 */
const AR_VIEW_MIRRORS: Partial<Record<View, string>> = {
 landing: "/ar",
 memberships: "/ar/memberships",
 blog: "/ar/blog",
 about: "/ar/about",
 faq: "/ar/faq",
 contact: "/ar/contact",
 privacy: "/ar/privacy",
 terms: "/ar/terms",
};

export function useNav() {
 const router = useRouter();
 const pathname = usePathname();
 // VERCEL-USAGE-3 (2026-09-21): was useSearchParams() — that hook
 // suspends, so with the site's pages becoming statically prerenderable
 // (static RootShell — VERCEL-USAGE-3) every page rendering SiteHeader
 // failed the build with missing-suspense-with-csr-bailout, and wrapping
 // the header in Suspense would drop the nav links from the crawler-facing
 // static shell. The same established law as LanguageToggle/BlogListPage
 // applies instead: read window.location in an effect — client-only,
 // hydration-safe (initial SSR state stays ""), zero suspense.
 const view = useMemo(() => viewForPath(pathname || "/"), [pathname]);
 const [routeParams, setRouteParams] = useState<Record<string, string>>({});
 useEffect(() => {
   const obj: Record<string, string> = {};
   if (typeof window !== "undefined" && window.location.search) {
     new URLSearchParams(window.location.search).forEach((value, key) => {
       obj[key] = value;
     });
   }
   if (view === "coach-client") {
     obj.clientId = (pathname || "").split("/").filter(Boolean)[1];
   }
   setRouteParams(obj);
 }, [pathname, view]);
 const params = routeParams;

 const navigate = useCallback(
 (v: View, p: Record<string, string> = {}) => {
 const target = pathForView(v, p);
 // 450 UNIFIED CHOICE LAW (src/lib/surface-locale.ts — report §12): a
 // RECORDED choice governs the TREE of every public view target — the
 // logo, the account buttons, the logout landing, every view navigation
 // in the chrome. A choice-holder leaving a special surface (or any
 // page) for a public view lands DIRECTLY in their chosen tree — no
 // wrong-language render, no post-hydration replace. Choice-less
 // visitors keep the 449 URL-based remap below (F-2-A verbatim: the
 // URL governs when nobody has chosen).
 const stored = readStoredLang();
 const mirror = stored
 ? mirrorPath(target, stored)
 : /^\/ar(\/|$)/.test(pathname || "/") && Object.keys(p).length === 0
 ? AR_VIEW_MIRRORS[v]
 : undefined;
 router.push(mirror ?? target);
 // NOTE: Do NOT call window.scrollTo here.
 // The smooth-scroll on every navigation was causing a jarring "scroll
 // to top before page change" effect. The browser's default behavior
 // (instant jump on route change) is better — and Next.js App Router
 // already handles scroll restoration correctly for back/forward.
 },
 [router, pathname],
 );

 return { view, params, navigate };
}
