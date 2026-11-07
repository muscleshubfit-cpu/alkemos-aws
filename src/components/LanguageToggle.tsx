"use client";

import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getBlogPost, getLinkedPost } from "@/lib/blog";

/**
 * Site-wide language toggle. M31 fix: now navigates to the /ar/ mirror
 * (or back to the English URL) when a mirror exists, so the URL matches
 * the language and can be shared/bookmarked correctly.
 *
 * Pages with Arabic mirrors (/ar/*):
 *   /            <-> /ar
 *   /blog        <-> /ar/blog
 *   /blog/[slug] <-> /ar/blog/[slug] (via linked_post_id)
 *   /blog/category/[slug] <-> /ar/blog/category/[slug] (same ids)
 *   /exercises   <-> /ar/exercises (+ /exercises/[slug] detail pages —
 *                   same bilingual library row, pure prefix swap)
 *   /programs    <-> /ar/programs (AR mirror 2026-08-31 — full-training
 *                   audit follow-up; detail pages mirror the same way)
 *   /foods       <-> /ar/foods (+ /foods/[slug] detail pages — same row)
 *   /muscles/[group]      <-> /ar/muscles/[group]
 *   /equipment/[type]     <-> /ar/equipment/[type]
 *   /collections/[slug]   <-> /ar/collections/[slug]
 *   /authors/[slug]       <-> /ar/authors/[slug]
 *   /memberships <-> /ar/memberships
 *   /about       <-> /ar/about (AR expansion 2026-08-30)
 *   /faq         <-> /ar/faq (AR expansion 2026-08-30)
 *   /privacy     <-> /ar/privacy (access-point fix 2026-09-14)
 *   /terms       <-> /ar/terms (access-point fix 2026-09-14)
 *   /contact     <-> /ar/contact (access-point fix 2026-09-14)
 *   /coaches/[slug] <-> /ar/coaches/[slug] (same slug — multi-coach
 *                   public landing, migration 0032 i18n follow-up)
 *   /tools       <-> /ar/tools (SEO-GEO-4, 2026-09-08 — every calculator
 *                   now has an Arabic mirror: /ar/tools/* + /ar/meal-planner)
 *   /compare     <-> /ar/compare (SEO-GEO-4, 2026-09-08 — comparison
 *                   index + detail pages mirror by prefix swap)
 *   /affiliate   <-> /ar/affiliate (§12.53 item 11, 2026-09-16 — the
 *                   last monolingual page on the site)
 *   /workout-tracker <-> /ar/workout-tracker (P0 SEO audit 2026-09-30 —
 *                   the search-intent landing pair)
 *   /macro-tracker   <-> /ar/macro-tracker (P0 SEO audit 2026-09-30 —
 *                   the search-intent landing pair)
 * 
 * Pages without Arabic mirrors (private surfaces like /checkout,
 * /profile, /admin, /auth): just toggle the UI language (the
 * page content is already bilingual via useI18n, so the user sees the
 * new language without a URL change).
 */
export function LanguageToggle() {
 const { lang, setLang } = useI18n();
 const pathname = usePathname() || "/";
 const router = useRouter();

 const handleToggle = async () => {
 const nextLang = lang === "ar" ? "en" : "ar";

 // P3-10/م8 (deep-audit Phase 217): usePathname() carries no search, so
 // toggling the language used to DROP the query string (/exercises?
 // equipment=barbell lost its filters). Read it from window.location at
 // click time and carry it to the mirror — deliberately NOT
 // useSearchParams(): that hook would involve every page in a
 // client-side re-render/suspense for data used by one button click.
 const qs =
 typeof window !== "undefined" && window.location.search
 ? window.location.search
 : "";
 const withQs = (path: string) =>
 qs && !path.includes("?") ? `${path}${qs}` : path;

 // Blog article page: /blog/[slug] <-> /ar/blog/[slug] (via linked_post_id)
 const enMatch = pathname.match(/^\/blog\/([^/]+)$/);
 const arMatch = pathname.match(/^\/ar\/blog\/([^/]+)$/);
 if (enMatch || arMatch) {
 const currentSlug = (enMatch || arMatch)![1];
 const currentArticleLang: "en" | "ar" = enMatch ? "en" : "ar";
 setLang(nextLang);
 try {
 const post = await getBlogPost(currentArticleLang, currentSlug);
 const linked = post ? await getLinkedPost(post) : null;
 if (linked) {
 router.push(withQs(linked.language === "ar" ? `/ar/blog/${linked.slug}` : `/blog/${linked.slug}`));
 return;
 }
 } catch {
 // fall through to list-page fallback below
 }
 // No translated version exists yet — land on the blog list in the new language.
 router.push(withQs(nextLang === "ar" ? "/ar/blog" : "/blog"));
 return;
 }

 // Multi-coach public landing: /coaches/[slug] <-> /ar/coaches/[slug].
 // Same slug serves both languages (migration 0032), so the mirror is
 // a pure prefix swap — no lookup needed (unlike the blog pair).
 const coachEnMatch = pathname.match(/^\/coaches\/([^/]+)$/);
 const coachArMatch = pathname.match(/^\/ar\/coaches\/([^/]+)$/);
 if (coachEnMatch || coachArMatch) {
 const slug = (coachEnMatch || coachArMatch)![1];
 setLang(nextLang);
 router.push(withQs(nextLang === "ar" ? `/ar/coaches/${slug}` : `/coaches/${slug}`));
 return;
 }

 // Program detail: /programs/[slug] <-> /ar/programs/[slug].
 // Same slug serves both languages (static data), so the mirror is a pure
 // prefix swap — AR expansion 2026-08-31 (Phase 59 audit follow-up).
 const progEnMatch = pathname.match(/^\/programs\/([^/]+)$/);
 const progArMatch = pathname.match(/^\/ar\/programs\/([^/]+)$/);
 if (progEnMatch || progArMatch) {
 const slug = (progEnMatch || progArMatch)![1];
 setLang(nextLang);
 router.push(withQs(nextLang === "ar" ? `/ar/programs/${slug}` : `/programs/${slug}`));
 return;
 }

 // Comparison pages: /compare/[slug] <-> /ar/compare/[slug] (same slug,
 // static bilingual data — pure prefix swap). SEO-GEO-4, 2026-09-08.
 const compareEnMatch = pathname.match(/^\/compare\/([^/]+)$/);
 const compareArMatch = pathname.match(/^\/ar\/compare\/([^/]+)$/);
 if (compareEnMatch || compareArMatch) {
 const slug = (compareEnMatch || compareArMatch)![1];
 setLang(nextLang);
 router.push(withQs(nextLang === "ar" ? `/ar/compare/${slug}` : `/compare/${slug}`));
 return;
 }

 // Tools pages: /tools/[slug] <-> /ar/tools/[slug] (same slug, bilingual
 // client pages — pure prefix swap). SEO-GEO-4, 2026-09-08.
 const toolEnMatch = pathname.match(/^\/tools\/([^/]+)$/);
 const toolArMatch = pathname.match(/^\/ar\/tools\/([^/]+)$/);
 if (toolEnMatch || toolArMatch) {
 const slug = (toolEnMatch || toolArMatch)![1];
 setLang(nextLang);
 router.push(withQs(nextLang === "ar" ? `/ar/tools/${slug}` : `/tools/${slug}`));
 return;
 }

 // M31 fix: routes with known Arabic mirrors — navigate to the mirror URL.
 const MIRROR_ROUTES = [
 { en: "/", ar: "/ar" },
 { en: "/blog", ar: "/ar/blog" },
 { en: "/exercises", ar: "/ar/exercises" },
 { en: "/programs", ar: "/ar/programs" },
 { en: "/foods", ar: "/ar/foods" },
 { en: "/memberships", ar: "/ar/memberships" },
 { en: "/about", ar: "/ar/about" },
 { en: "/faq", ar: "/ar/faq" },
 // Access-point fix (2026-09-14): the legal/contact mirrors now exist.
 { en: "/privacy", ar: "/ar/privacy" },
 { en: "/terms", ar: "/ar/terms" },
 { en: "/contact", ar: "/ar/contact" },
 { en: "/for-coaches", ar: "/ar/for-coaches" },
 { en: "/for-coaches/register", ar: "/ar/for-coaches/register" },
 { en: "/tools", ar: "/ar/tools" },
 { en: "/meal-planner", ar: "/ar/meal-planner" },
 // §12.27: the diet-plan matrix is bilingual — the toggle swaps trees.
 { en: "/diet-plan", ar: "/ar/diet-plan" },
 // §12.28: the AI meal-planner trial pair.
 { en: "/ai-meal-planner", ar: "/ar/ai-meal-planner" },
 // §12.32: the AI workout-planner trial pair.
 { en: "/ai-workout-planner", ar: "/ar/ai-workout-planner" },
 { en: "/compare", ar: "/ar/compare" },
 // SEO-GEO-6.4 (P1-9): evo + coaching now have Arabic mirrors.
 { en: "/evo", ar: "/ar/evo" },
 { en: "/coaching", ar: "/ar/coaching" },
 // §12.53 item 11 (2026-09-16): the affiliate AR mirror.
 { en: "/affiliate", ar: "/ar/affiliate" },
 // P0 SEO audit (2026-09-30, finding #1): the search-intent landing
 // pairs — "workout tracker" / "macro tracker" had zero matching pages.
 { en: "/workout-tracker", ar: "/ar/workout-tracker" },
 { en: "/macro-tracker", ar: "/ar/macro-tracker" },
 ];

 for (const route of MIRROR_ROUTES) {
 if (pathname === route.en) {
 setLang(nextLang);
 router.push(withQs(nextLang === "ar" ? route.ar : route.en));
 return;
 }
 if (pathname === route.ar) {
 setLang(nextLang);
 router.push(withQs(nextLang === "ar" ? route.ar : route.en));
 return;
 }
 }

 // §12.27: the diet-plan matrix CELLS are server components on dynamic
 // mirror routes (/diet-plan/{level}/{system} ↔ /ar/diet-plan/…) — exact
 // matching can't cover 24 pairs, so the subtree swaps by prefix.
 if (pathname.startsWith("/diet-plan/")) {
 setLang(nextLang);
 router.push(withQs(nextLang === "ar" ? `/ar${pathname}` : pathname));
 return;
 }
 if (pathname.startsWith("/ar/diet-plan/")) {
 setLang(nextLang);
 router.push(withQs(nextLang === "ar" ? pathname : pathname.replace(/^\/ar/, "")));
 return;
 }

 // Access-point fix (2026-09-14): detail/hub subtrees whose slugs are
 // identical in both trees — a pure prefix swap with a SAFE fallback:
 // every prefix below has a complete /ar mirror (exercises + foods are
 // one bilingual library; muscles/equipment/collections/authors share
 // the same static hub slugs; blog categories share the same ids).
 // F-2-A regression fix (2026-11-07 follow-up): "/guides/" added — its
 // omission made the toggle on /ar/guides/* do a chrome-only swap (EN
 // chrome under an /ar URL — a mixed state that violates the
 // URL-governs principle) instead of navigating to the EN mirror.
 const PREFIX_MIRROR = [
 "/exercises/",
 "/foods/",
 "/muscles/",
 "/equipment/",
 "/collections/",
 "/blog/category/",
 "/authors/",
 "/guides/",
 ];
 for (const prefix of PREFIX_MIRROR) {
 if (pathname.startsWith(prefix)) {
 setLang(nextLang);
 router.push(withQs(nextLang === "ar" ? `/ar${pathname}` : pathname));
 return;
 }
 if (pathname.startsWith(`/ar${prefix}`)) {
 setLang(nextLang);
 router.push(withQs(nextLang === "ar" ? pathname : pathname.replace(/^\/ar/, "")));
 return;
 }
 }

 // Pages without Arabic mirrors: just toggle the UI language.
 // The page content is already bilingual via useI18n, so the user sees
 // the new language immediately without a URL change.
 setLang(nextLang);
 };

 return (
 <Button
 variant="ghost"
 size="sm"
 className="gap-2"
 onClick={handleToggle}
 aria-label={lang === "ar" ? "تبديل اللغة" : "Toggle language"}
 >
 <Languages className="h-4 w-4" />
 <span className="text-xs font-semibold">{lang === "ar" ? "EN" : "ع"}</span>
 </Button>
 );
}
