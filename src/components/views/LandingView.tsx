// ============================================================
// LandingView — SEO-P1-6 (frame 315, plan §5 step 2): the homepage
// body is now a SERVER component (the old 1,851-line "use client"
// hydration window is gone). Every static section renders on the
// server and ships ZERO component JavaScript; the interactive
// leaves are client islands imported below (verbatim transfers —
// zero behavior/DOM/API/design change, plan §4):
//   · LandingViewIslands.tsx          (static islands: Reveal ·
//     CountUp · CarouselShell · LibraryBrowser · EvoCard · HeroCta)
//   · LandingViewDynamicIslands.tsx   (data islands behind
//     next/dynamic: BlogSection #learn + FeaturedCoachesStrip —
//     their chunk ships as a NON-BLOCKING async script, off the
//     hydration-critical path)
// The two server pages pass `isAr` (URL-pinned — the BlogListPage
// precedent; no useI18n here). Reference:
// docs/SEO-P1-6-ISLANDS-PLAN-2026-09-30.md.
// ============================================================

import dynamic from "next/dynamic";
import { weeksUnitAr } from "@/lib/utils";
import { EXERCISES_COUNT } from "@/lib/exercises-shared";
import { FOODS_COUNT, CATEGORY_LABELS as FOOD_CATEGORY_LABELS, type FoodCategory } from "@/lib/foods-shared";
import { TOOLS, TOOLS_COUNT } from "@/lib/tools-shared";
import { MEMBERSHIPS } from "@/lib/memberships";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getFAQSchema, jsonLd } from "@/lib/seo";
import { resolveHomeCopy, resolveHomeFaq, type HomeCopy, type SiteCopyMap } from "@/lib/site-content/home";
import Image from "next/image";
import { ThemeImg, EngravedIcon } from "@/components/ThemeImg";
import { Reveal, CountUp, CarouselShell, LibraryBrowser, EvoCard, HeroCta } from "./LandingViewIslands";
import type {
  HomeDietSystemSample,
  HomeFoodSample,
  HomeProgramSample,
  HomeSamples,
} from "@/lib/home-samples";

// The two data-fetch islands load through next/dynamic (ssr: true —
// ssr:false is not allowed in a server component, and functionally a
// no-op here: both sections render nothing server-side today because
// their initial state is empty, exactly as before the split).
const BlogSection = dynamic(() =>
  import("./LandingViewDynamicIslands").then((m) => m.BlogSection),
);
const FeaturedCoachesStrip = dynamic(() =>
  import("./LandingViewDynamicIslands").then((m) => m.FeaturedCoachesStrip),
);

// ============================================================
// Site palette — the Marble & Chrome identity resolves through
// the CSS variables in globals.css (:root + [data-theme="dark"]).
// All tokens meet WCAG AAA on their intended backgrounds; --ai
// cyan stays reserved for AI-assistant surfaces only.
// ============================================================
const PALETTE = {
  textPrim: "var(--text)",
  textSec: "var(--muted-foreground)",
  textMuted: "var(--muted-foreground)",
  border: "var(--edge)",
  surface: "var(--card)",
  sectionWhite: "var(--bg)",
  sectionGray: "var(--tint)",
  halo: "var(--tint)",
};

// ============================================================
// Content-volume counts derive from the client-safe verified
// constants (pinned to the real arrays by library-counts.test.ts;
// TOOLS_COUNT derives from the hub array in tools-shared.ts) —
// when the platform grows, these labels grow with it.
// "+" marks CONTENT VOLUME only.
// ============================================================
const EX_PLUS = `${EXERCISES_COUNT.toLocaleString("en-US")}+`;
const FOODS_PLUS = `${FOODS_COUNT.toLocaleString("en-US")}+`;


// The nine food families the /foods hub exposes — the homepage preview
// mirrors the SAME vocabulary (HOME-POLISH-285: the nutrition section
// became the Food Library preview, matching the exercise-library
// pattern). Labels + category images derive from the foods-shared
// single source; every chip routes into the hub's own filtered view.
const FOOD_CATEGORIES: FoodCategory[] = [
  "protein",
  "carb",
  "fat",
  "vegetable",
  "fruit",
  "dairy",
  "nuts",
  "snack",
  "drink",
];

// ============================================================
// HOME-PLATFORM-284 + HOME-POLISH-285 + HOME-REFINE-286 (owner
// orders 2026-09-27 — «الصفحة الرئيسية كواجهة منصة حقيقية» ثم
// «تحسين أقسامها» ثم «التعديلات المتبقية»): the
// embedded tool surfaces are GONE from the homepage. The homepage is a
// true PLATFORM homepage — concise SECTIONS with CARDS that link to the
// real pages, exactly one job per section, mirroring the header's
// service nav:
//
//   SECTION ARC (top → bottom):
//     HERO (two CTAs — fully STATIC since 286: no animated diagram,
//     no entrance beats, no arrows on the CTAs) → PROOF (one row,
//     unchanged) →
//     #library TRAINING (the interactive muscle-group browser — the
//     preview now answers with SIX real exercises per family) →
//     #train PROGRAMS (the ready-made carousel, unchanged) →
//     #eat FOOD LIBRARY (the exercise-library pattern applied to the
//     food database: the nine-category set — WRAPPED on every viewport,
//     never a single scrolling row — routes into /foods?cat=… and SIX
//     real food cards carry the SAME four-fact macro format as the
//     /foods cards — kcal · P · C · F in the food pages' own colors —
//     each linking into its food page) → #diet (the diet-systems
//     carousel, unchanged) → #tools TOOLS (TILE PREVIEW: every free
//     tool as its own visual card — the calculators + the water
//     tracker + the MANUAL Meal Planner «ابنِها بنفسك» — the tools
//     themselves live on their pages) → the free-allowance band
//     (the honest monthly AI-plan quota — sits immediately BEFORE
//     the AI section so it INTRODUCES the AI planners) → #plan AI
//     PLANNING (TWO strong AI cards — the AI Workout Planner + the
//     AI Meal Planner, both explicitly AI-POWERED with filled chrome
//     CTAs; the meal card promises a STRUCTURED full-day plan with
//     portions in grams, not mere suggestions — + EVO as the
//     full-width AI-coach card with the openEvoFloatingChat button
//     per the chat-surface law + the honest 10/day quota) → #learn →
//     #memberships → #faq (a visible Q&A grid — no click-to-reveal).
//
// WHY (the owner's brief): a homepage should NAVIGATE the visitor
// into the platform's real pages — the embedded calculator/builders
// duplicated the tool pages, blurred AI planning into regular tools,
// and buried the section entry points under a landing-page treatment.
// The 285 polish keeps that law and sharpens the previews: the food
// library gets the SAME real-content preview treatment as the
// exercise library, the tools become proper visual tiles (a plain
// chip list read as a footnote), the AI planners get visually stronger
// cards with filled CTAs so smart planning never reads as «more
// calculators», the memberships' single dark anchor is PRO, and the
// FAQ answers are directly visible. The 286 refinement completes the
// owner's remaining orders: the exact AI-allowance wording, the four
// labeled macro facts on every food card (homepage + /foods, same
// colors — «استخدم نفس الألوان لا تمنعها»), the complete wrapped
// category set, and a fully static hero.
//
// The laws that still hold from the 270/271/284 frames: the hero's
// two-button directive; the compact one-row proof strip; prices
// derive from memberships.ts (never literals); EN/AR are independent
// native pairs; counts ride the verified constants (EX_PLUS /
// FOODS_PLUS / TOOLS_COUNT); the EVO chat surface stays the floating
// widget (openEvoFloatingChat — the EVO card's button dispatches it);
// zero emoji; MSA-clean Arabic; motion stays once-only +
// reduced-motion-safe (and the hero carries NO motion at all).
// ============================================================

// ============================================================

// (SEO-P1-6) Reveal + CountUp moved verbatim to LandingViewIslands.tsx
// (client islands — plan §2 map rows «Reveal» + «PROOF CountUp»).


// ══════════════════════════════════════════════════════════════
// THE PLATFORM SECTION CARDS (HOME-PLATFORM-284 + HOME-POLISH-285) —
// the homepage's navigation surfaces. One card = one destination
// page; NO tool is embedded on the homepage anymore. The cards ride
// the SAME marble-card family as the content previews (marble-card +
// card-lift + EngravedIcon + chrome-text arrow) so the whole page
// reads as ONE product surface.
// ══════════════════════════════════════════════════════════════

// ── LandingFoodCard — one REAL food from the curated samples, in
//    the exercise-card language (HOME-POLISH-285: the nutrition
//    section became the Food Library preview). HOME-REFINE-286: the
//    card carries the SAME four-fact macro format as the food
//    pages' cards — Calories · Protein · Carbs · Fat, each in its
//    own labeled cell with the food pages' OWN colors (kcal blue ·
//    protein green · carbs orange · fat red — the owner order:
//    «استخدم نفس الألوان لا تمنعها»), so the preview and the hub
//    read as ONE surface. Values stay the REAL server-provided
//    per-100g numbers (the 3.6MB foods array never crosses to the
//    client) and the card links into the food's detail page. ──
function LandingFoodCard({ food, isAr }: { food: HomeFoodSample; isAr: boolean }) {
  const name = isAr ? food.nameAr : food.nameEn;
  return (
    <a
      href={`${isAr ? "/ar/foods" : "/foods"}/${food.slug}`}
      className="marble-card card-lift group flex flex-col p-4 text-start"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: PALETTE.textMuted }}>
        {isAr ? food.categoryLabelAr : food.categoryLabelEn}
      </p>
      <h3 className="mt-1 text-base font-semibold leading-tight tracking-tight" style={{ color: PALETTE.textPrim }}>
        {name}
      </h3>
      {/* The four REAL per-100g facts — the SAME labeled, colored
          cell format the /foods cards + the food detail page use. */}
      <div className="mt-2.5 grid grid-cols-2 gap-1">
        <div className="rounded bg-white px-1.5 py-1 text-center">
          <p className="text-xs font-semibold leading-tight text-[#0071e3]">{food.calories}</p>
          <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">{isAr ? "سعرة" : "kcal"}</p>
        </div>
        <div className="rounded bg-white px-1.5 py-1 text-center">
          <p className="text-xs font-semibold leading-tight text-[#34c759]">{isAr ? `${food.protein} جم` : `${food.protein}g`}</p>
          <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">{isAr ? "بروتين" : "Protein"}</p>
        </div>
        <div className="rounded bg-white px-1.5 py-1 text-center">
          <p className="text-xs font-semibold leading-tight text-[#ff9500]">{isAr ? `${food.carbs} جم` : `${food.carbs}g`}</p>
          <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">{isAr ? "كربوهيدرات" : "Carbs"}</p>
        </div>
        <div className="rounded bg-white px-1.5 py-1 text-center">
          <p className="text-xs font-semibold leading-tight text-[#ff3b30]">{isAr ? `${food.fat} جم` : `${food.fat}g`}</p>
          <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">{isAr ? "دهون" : "Fat"}</p>
        </div>
      </div>
      <p className="mt-1.5 text-[10px] font-normal" style={{ color: PALETTE.textMuted }}>
        {isAr ? "القيم لكل 100 جم" : "Values per 100 g"}
      </p>
      <p className="chrome-text mt-3 text-xs font-semibold">{isAr ? "اعرض الصنف ›" : "View food ›"}</p>
    </a>
  );
}

// ── ToolTile — one free tool's preview card (HOME-POLISH-285: the
//    tools section renders proper visual tiles, not a plain chip
//    list). The tile mirrors the /tools hub's own ToolCard language
//    (engraved icon + name + one-line description + chrome arrow)
//    and links into the tool's real page — the tool itself never
//    runs here. ──
function ToolTile({
  icon,
  title,
  body,
  chip,
  href,
  isAr,
}: {
  icon: string;
  title: string;
  body: string;
  chip?: string;
  href: string;
  isAr: boolean;
}) {
  return (
    <a href={href} className="marble-card card-lift group flex h-full flex-col p-5 text-start">
      <div className="flex items-start justify-between gap-3">
        <EngravedIcon name={icon} alt="" size={40} className="h-10 w-10 shrink-0" />
        {chip ? (
          <span className="seal-chip shrink-0 py-1! text-[11px]!">{chip}</span>
        ) : null}
      </div>
      <h3 className="mt-4 text-base font-semibold leading-tight tracking-tight" style={{ color: PALETTE.textPrim }}>
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm font-normal leading-relaxed" style={{ color: PALETTE.textSec }}>
        {body}
      </p>
      <p className="chrome-text mt-4 text-sm font-semibold">
        {isAr ? "افتح الأداة" : "Open the tool"}
        <span className="rtl:rotate-180" aria-hidden="true">›</span>
      </p>
    </a>
  );
}

// ── AiCard — the STRONG AI planner card (HOME-POLISH-285 owner
//    directive: «بطاقات وأزرار أوضح وأقوى بصريًا»). NOT a full-card
//    link — the FILLED btn-chrome CTA is the destination (no nested
//    interactive elements), exactly like the EvoCard pattern. The
//    engraved icon wears .ai-ring (the cyan AI-surface law — AI
//    surfaces may touch cyan), the AI-POWERED chip is explicit, and
//    the body states exactly WHAT gets generated. ──
function AiCard({
  icon,
  title,
  body,
  cta,
  href,
  isAr,
}: {
  icon: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  isAr: boolean;
}) {
  return (
    <div className="marble-card card-lift flex h-full flex-col p-6 text-start md:p-7">
      <div className="flex items-start justify-between gap-3">
        <EngravedIcon name={icon} alt="" size={48} className="ai-ring h-12 w-12 shrink-0 rounded-full" />
        <span className="seal-chip shrink-0 py-1! text-[11px]!">
          <EngravedIcon name="evo" alt="" size={12} className="h-3 w-3" />
          {isAr ? "بالذكاء الاصطناعي" : "AI-POWERED"}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-semibold leading-tight tracking-tight" style={{ color: PALETTE.textPrim }}>
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm font-normal leading-relaxed" style={{ color: PALETTE.textSec }}>
        {body}
      </p>
      <a href={href} className="btn-chrome mt-5 w-full px-6 py-3 text-sm md:text-base">
        {cta}
        <span className="chev rtl:rotate-180">›</span>
      </a>
    </div>
  );
}

// (SEO-P1-6) EvoCard moved verbatim to LandingViewIslands.tsx (the
// openEvoFloatingChat onClick owns the client boundary).


// (SEO-P1-6) CarouselShell moved verbatim to LandingViewIslands.tsx
// (styled-jsx must stay inside a client island — plan §4.5). The
// server sections below pass server-rendered cards as children.


// (SEO-P1-6) BlogCarousel + the #learn fetch moved verbatim into
// BlogSection (LandingViewDynamicIslands.tsx, next/dynamic island).


// ── The diet-system card (the ready-made diet-plan library
//    carousel, HOME-REFINE-270 R4). Every value is the REAL matrix
//    data (server slice) — the card links into a real leaf page of
//    the library (the mid 2000-kcal level of that system). ──
function LandingDietCard({ system, levelCount, isAr, index }: { system: HomeDietSystemSample; levelCount: number; isAr: boolean; index: number }) {
  // VRD-V6 — the macro split as ONE machined rail (.split-rail): the
  // SAME system.split data, now in the platform's data-viz language
  // (visual parity with the #eat macro bars) instead of a bare
  // «P/C/F» text run. Segment widths are the real ratio; the numbers
  // stay visible beneath for precision readers.
  // TPL-REF-280 — the ghost index numeral rides above the title
  // (template card technique re-toned to the Alkemos ghost ramp —
  // decorative, aria-hidden, carries no rank meaning).
  const splitTotal =
    system.split.protein + system.split.carbs + system.split.fat || 1;
  const segWidth = (g: number) => `${Math.max(6, Math.round((g / splitTotal) * 100))}%`;
  return (
    <a
      href={`${isAr ? "/ar" : ""}/diet-plan/2000/${system.slug}`}
      className="marble-card card-lift group flex w-72 shrink-0 flex-col p-5 text-start md:w-80"
    >
      <span className="ghost-num" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="text-lg font-semibold tracking-tight" style={{ color: PALETTE.textPrim }}>
        {/* CONTENT-AUDIT P0-4 (2026-09-28, audit §1.10): «النظام متوازن» —
            definite noun + indefinite adjective — is ungrammatical Arabic;
            the indefinite «نظام متوازن» matches the diet-plan library titles
            (نظام 2000 سعرة متوازن) and reads naturally as a card title. */}
        {isAr ? `نظام ${system.nameAr}` : `${system.nameEn}`}
      </h3>
      {/* The macro split rail — aria-hidden (the ratio is decorative;
        the exact numbers are announced by the row below). */}
      <div className="split-rail mt-3" aria-hidden="true">
        <span className="split-seg split-seg--protein" style={{ width: segWidth(system.split.protein) }} />
        <span className="split-seg split-seg--carbs" style={{ width: segWidth(system.split.carbs) }} />
        <span className="split-seg split-seg--fat" style={{ width: segWidth(system.split.fat) }} />
      </div>
      <p className="mt-2 flex items-center justify-between text-[10px] font-medium" style={{ color: PALETTE.textMuted }}>
        <span>{isAr ? "توزيع الماكروز" : "Macro split"}</span>
        <span dir="ltr">
          {system.split.protein}/{system.split.carbs}/{system.split.fat}
        </span>
      </p>
      <p className="mt-2 flex-1 text-sm font-normal leading-relaxed" style={{ color: PALETTE.textSec }}>
        {isAr ? system.lineAr : system.lineEn}
      </p>
      <p className="mt-3 text-xs font-medium" style={{ color: PALETTE.textSec }}>
        {isAr
          ? `${levelCount} مستويات سعرات — من 1200 إلى 3000 سعرة`
          : `${levelCount} calorie levels — from 1200 to 3000 kcal`}
      </p>
      <p className="chrome-text mt-3 text-xs font-semibold">
        {isAr ? "افتح خطة 2000 سعرة ›" : "Open the 2000-kcal plan ›"}
      </p>
    </a>
  );
}


// ─── Helper components (conditional rendering — no display:none in DOM) ───

// ─── HOME-EXPERIENCE-269: real-content sample cards (exercises /
//     foods / programs). Every card is a plain <a> into its detail
//     page — a real content entry point. The samples arrive as
//     precomputed serializable props from the server
//     (getHomeSamples) — zero library imports here. ───

// (SEO-P1-6) LandingExerciseCard moved into LandingViewIslands.tsx
// (the interactive per-family filter owns its render path).


function LandingProgramCard({ prog, isAr }: { prog: HomeProgramSample; isAr: boolean }) {
  const name = isAr ? prog.nameAr : prog.nameEn;
  return (
    <a
      href={`${isAr ? "/ar" : ""}/programs/${prog.slug}`}
      className="marble-card card-lift group relative flex flex-col overflow-hidden"
    >
      {/* Real program artwork (same asset the /programs grid renders). */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={prog.image}
          alt={isAr ? prog.imageAltAr : prog.imageAltEn}
          fill
          sizes="(max-width: 768px) 92vw, 30vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Level seal on the artwork — the level dot color is the real
            library convention (beginner/intermediate/advanced). */}
        <span
          className="seal-chip absolute top-3 end-3 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(11,11,13,0.72)", color: "#F5F5F7", borderColor: "rgba(255,255,255,0.25)" }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: prog.levelColor }}
            aria-hidden="true"
          />
          {isAr ? prog.levelLabelAr : prog.levelLabelEn}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 text-start">
        <h3 className="text-lg font-semibold leading-tight tracking-tight line-clamp-2" style={{ color: PALETTE.textPrim }}>
          {name}
        </h3>
        {/* The two facts a program browser filters by: where it trains
            and the weekly commitment. */}
        <p className="mt-2 text-xs font-medium" style={{ color: PALETTE.textSec }}>
          {isAr ? prog.locationLabelAr : prog.locationLabelEn}
          <span aria-hidden="true" style={{ opacity: 0.4 }}> · </span>
          {isAr ? `${prog.durationWeeks} ${weeksUnitAr(prog.durationWeeks)} · ${prog.daysPerWeek} أيام/أسبوع` : `${prog.durationWeeks} weeks · ${prog.daysPerWeek} days/week`}
        </p>
        <p className="chrome-text mt-4 text-sm font-semibold">{isAr ? "استكشف البرنامج ›" : "Explore program ›"}</p>
      </div>
    </a>
  );
}

// (SEO-P1-6) LibraryBrowser moved verbatim to LandingViewIslands.tsx
// (the muscle-group tab state owns the client boundary; the samples
// still arrive as serializable server props).


// ── VRD-V8R — the membership cards' REAL feature rows ──
// Two–three scannable facts per tier, each mirroring the tier's
// documented limits in memberships.ts (the single source — the page
// invents nothing): the free pool (2/4/8), the EVO daily fair-use
// limit, the export/ad-free deltas. The checkseal icon is the SAME
// engraved mark the /memberships feature lists render — one data
// language across both surfaces. `pinDark` forces the dark engraving
// variant on the ALWAYS-dark Premium card (the theme pair normally
// follows the page; on a fixed-dark surface it must follow the card).
function TierFeatureRows({ rows, pinDark = false }: { rows: readonly string[]; pinDark?: boolean }) {
  return (
    <ul className="mt-4 flex-1 space-y-2.5">
      {rows.map((row) => (
        <li
          key={row}
          className="flex items-start gap-2 text-sm font-normal leading-relaxed"
          style={{ color: pinDark ? "rgba(245,245,247,0.72)" : PALETTE.textSec }}
        >
          <span className="theme-img-pin-dark mt-0.5 inline-flex h-4 w-4 shrink-0">
            <EngravedIcon name="checkseal" alt="" size={16} className="h-4 w-4" />
          </span>
          <span>{row}</span>
        </li>
      ))}
    </ul>
  );
}

export function LandingView({ samples, content, isAr }: { samples: HomeSamples; content?: SiteCopyMap; isAr: boolean }) {
  // SITE-CONTENT-281: the admin-editable marketing copy for the active
  // locale — Supabase overrides (passed down by the server route) win,
  // the code defaults in site-content/home.ts are the eternal fallback
  // (the fallback law: the page can never render empty or crash).
  const c = resolveHomeCopy(content, isAr);
  // (SEO-P1-6) The account-driven hero CTA pair and both data fetches
  // moved verbatim into the client islands (HeroCta · BlogSection ·
  // FeaturedCoachesStrip) — the server body carries no hooks.

  // ── Single-source tier derivations (HOME-REBUILD-258 law, kept) ──
  // Prices on the homepage come ONLY from memberships.ts lookups —
  // never literals — so the pricing page and the homepage can never
  // drift apart. (The GLOBAL USD law: money strings are USD-only.)
  const freeTier = MEMBERSHIPS.find((t) => t.id === "free");
  const premiumTier = MEMBERSHIPS.find((t) => t.id === "premium");
  const proTier = MEMBERSHIPS.find((t) => t.id === "pro");
  const coachingTier = MEMBERSHIPS.find((t) => t.id === "coaching");
  const premiumPriceLabel = `$${(premiumTier?.priceMonthly ?? 0).toFixed(2)}`;
  const proPriceLabel = `$${(proTier?.priceMonthly ?? 0).toFixed(2)}`;
  const coachingPriceLabel = `$${(coachingTier?.priceMonthly ?? 0).toFixed(2)}`;
  const freePriceLabel = `$${(freeTier?.priceMonthly ?? 0).toFixed(0)}`;

  // FAQ schema for SEO. The FIVE questions that remove hesitation before
  // starting — every claim mirrors the implementation (free browsing +
  // free tier — memberships.ts; guest AI pool — unified pool decree; EVO
  // availability with tier limits; the coaching promise) with NO prices
  // and NO variable counts. The FAQPage JSON-LD derives from the same
  // array (single source law). SITE-CONTENT-281: the array resolves
  // from site-content/home.ts defaults + admin overrides — same law,
  // one editable source.
  const faqs = resolveHomeFaq(content, isAr);
  const faqSchema = getFAQSchema(faqs);

  // Proof strip — the four auditable platform numbers, now as ONE
  // compact row directly under the promise (HOME-REFINE-270 R2: small
  // type, numbers + labels inline). Every value rides a verified
  // constant or a documented quota; nothing invented. The count-up
  // beat survives (SSR renders the truth; motion is a bonus).
  const proofStats = [
    {
      value: EXERCISES_COUNT,
      suffix: "+",
      labelAr: "تمرينًا",
      labelEn: "exercises",
    },
    {
      value: FOODS_COUNT,
      suffix: "+",
      labelAr: "صنفًا غذائيًا",
      labelEn: "foods",
    },
    {
      value: TOOLS_COUNT,
      suffix: "",
      labelAr: "أدوات مجانية",
      labelEn: "free tools",
    },
    {
      value: 10,
      suffix: "",
      labelAr: "رسائل EVO يوميًا",
      labelEn: "daily EVO messages",
    },
  ];

  // The ready-made plans count derives from the real matrix slice
  // (systems × levels = 4 × 6 = 24) — never a literal.
  const dietPlansCount = samples.dietSystems.length * samples.dietLevels.length;

  // The dark-marble + chrome-ring card recipe (the /memberships visual
  // language — one concept, one recipe).
  // TPL-REF-280 — featured-card depth: the template's featured pricing
  // shadow (deep, tight, under the featured card only) re-toned to the
  // pinned-black surface — a warm-graphite drop that reads as machined
  // elevation in light mode and quietly grounds the card in dark.
  const darkMarbleStyle = {
    backgroundColor: "#0B0B0D",
    color: "#F5F5F7",
    border: "2px solid transparent",
    backgroundImage:
      "linear-gradient(#0B0B0D, #0B0B0D), linear-gradient(145deg, #FDFDFD 0%, #C9CED3 35%, #878E94 50%, #E6E9EC 70%, #9AA0A6 100%)",
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    boxShadow: "0 24px 60px -28px rgba(11, 11, 13, 0.55)",
  } as const;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />

      <SiteHeader variant="landing" />

      {/* ===================== 1. HERO — Promise =====================
          The Phase 131 overlay scene stays (owner artwork + chrome logo
          + H1 + subtitle). HOME-REFINE-270 R1: exactly TWO CTAs side by
          side — login/signup (primary) + the premium-memberships page
          (secondary); signed-in members keep their console as the
          primary. On touch the actions STACK full-width (no mis-tap
          risk beside the artwork); md+ keeps the single centered row. */}
      <section className="hero-art relative w-full">
        {/* Artwork layer — absolute cover, theme-swapped pair, eager (LCP). */}
        <div className="hero-bg" aria-hidden="true">
          <ThemeImg
            light="/images/brand/hero-light.webp"
            dark="/images/brand/hero-dark.webp"
            alt=""
            width={1280}
            height={713}
            eager
            fetchPriority="high"
            srcSetLight="/images/brand/hero-light-640.webp 640w, /images/brand/hero-light-828.webp 828w, /images/brand/hero-light.webp 1280w"
            srcSetDark="/images/brand/hero-dark-640.webp 640w, /images/brand/hero-dark-828.webp 828w, /images/brand/hero-dark.webp 1280w"
            sizes="100vw"
          />
        </div>
        {/* Content overlay — logo + H1 + CTAs, centered in the artwork */}
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 py-4 text-center md:py-8">
          {/* Silver-chrome brand lockup (owner artwork, theme pair). */}
          <ThemeImg
            light="/images/brand/logo-hero-light.webp"
            dark="/images/brand/logo-hero-dark.webp"
            alt="Alkemos"
            className="w-32 object-contain md:w-52 lg:w-64"
            width={760}
            height={606}
            eager
            srcSetLight="/images/brand/logo-hero-light-256.webp 256w, /images/brand/logo-hero-light-512.webp 512w, /images/brand/logo-hero-light.webp 760w"
            srcSetDark="/images/brand/logo-hero-dark-256.webp 256w, /images/brand/logo-hero-dark-512.webp 512w, /images/brand/logo-hero-dark.webp 760w"
            sizes="(max-width: 768px) 128px, (max-width: 1024px) 208px, 256px"
          />
          {/* RTL law: the H1 keeps the EN tight utilities + explicit rtl:
              counterparts (rtl-typography.test.ts leg 3). */}
          <h1 className="hero-copy font-display mt-3 text-2xl font-semibold leading-tight tracking-tight rtl:leading-snug rtl:tracking-normal md:mt-5 md:text-5xl lg:text-6xl" style={{ color: PALETTE.textPrim }}>
            {c.heroTitle}
          </h1>
          <p className="hero-copy mx-auto mt-3 max-w-xl text-sm font-normal leading-relaxed md:mt-4 md:text-base" style={{ color: PALETTE.textSec }}>
            {c.heroSubtitle}
          </p>

          {/* HOME-REFINE-286 (owner order 2026-09-27): the hero is
              fully STATIC — the animated convergence diagram
              (.trio-flow — traveling pulses + breathing node) and the
              CTA chevron arrows are RETIRED. The three glass pills
              stay as the plain semantic pillar list (the two-button
              law holds; hover is styling, never navigation). */}
          <div className="mt-4 md:mt-5">
            <ul
              className="flex flex-wrap items-center justify-center gap-2 md:gap-3"
              aria-label={isAr ? "أعمدة المنصة" : "The platform pillars"}
            >
              <li className="hero-pill">
                <EngravedIcon name="dumbbell" alt="" size={16} className="h-4 w-4" />
                {c.heroPillTraining}
              </li>
              <li className="hero-pill">
                <EngravedIcon name="protein" alt="" size={16} className="h-4 w-4" />
                {c.heroPillNutrition}
              </li>
              <li className="hero-pill">
                <EngravedIcon name="macros" alt="" size={16} className="h-4 w-4" />
                {c.heroPillPlanning}
              </li>
            </ul>
          </div>

          {/* The two-button pair (R1) — the account-driven half is the
              HeroCta client island (SEO-P1-6): SSR renders the GUEST
              pair exactly as the pre-split client render did. */}
          <HeroCta isAr={isAr} />
        </div>
      </section>

      {/* ===================== 2. PROOF — one compact row =====================
          The four auditable numbers as a single slim band (R2). All values
          ride verified constants or documented quotas
          (EXERCISES_COUNT / FOODS_COUNT / TOOLS_COUNT / the EVO
          fair-use daily limit); the page invents nothing. The count-up
          beat survives — reduced-motion safe, SSR-honest. */}
      <section aria-label={isAr ? "المنصة بالأرقام" : "The platform in numbers"} className="border-y border-[var(--edge)] bg-[var(--tint)] px-4 py-3.5 md:py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-center gap-x-6 gap-y-1.5 md:gap-x-10">
          {proofStats.map((stat) => (
            <span key={stat.labelEn} className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
              {/* TPL-REF-280 — display numerals: the band's numbers take
                  the display face (template stats pattern, in Alkemos's
                  own Playfair) — same compact row, same chrome paint. */}
              <span className="font-display text-lg font-semibold tracking-tight md:text-xl">
                <CountUp value={stat.value} suffix={stat.suffix} paintClass="chrome-text" />
              </span>
              <span className="text-xs font-normal md:text-sm" style={{ color: PALETTE.textSec }}>
                {isAr ? stat.labelAr : stat.labelEn}
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* ===================== 3. TRAINING — the exercise library preview =====================
          The muscle-group browser is the Training section's CONTENT
          PREVIEW (HOME-PLATFORM-284): real curated sample cards that
          filter in-page, now answering with SIX real exercises per
          family. The chips mirror the hub vocabulary and carry the
          VERIFIED per-family counts; every card is a real exercise
          page entry point — the tool-like browsing lives on /exercises. */}
      <section id="library" className="scroll-mt-20 bg-[var(--bg)] px-4 py-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <span className="seal-chip">
              <EngravedIcon name="dumbbell" alt="" size={12} className="h-3 w-3" />
              {isAr ? `${EX_PLUS} تمرينًا` : `${EX_PLUS} EXERCISES`}
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              {c.libraryTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base font-normal md:text-lg" style={{ color: PALETTE.textSec }}>
              {c.libraryBody}
            </p>
          </Reveal>
          <Reveal delay={80} className="mt-8 md:mt-10">
            <LibraryBrowser samples={samples} isAr={isAr} />
          </Reveal>
        </div>
      </section>

      {/* ===================== 4. PROGRAMS — the ready-made carousel =====================
          The READY-MADE PROGRAMS (برامج التمارين الجاهزة) — the same
          blog-style carousel treatment, real program artwork, and ONE
          focused browse-all CTA (the AI planners own plan creation in
          the AI section below; this section only BROWSES programs). */}
      <section id="train" className="scroll-mt-20 border-y border-[var(--edge)] bg-[var(--tint)] px-4 py-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <span className="seal-chip">
              <EngravedIcon name="dumbbell" alt="" size={12} className="h-3 w-3" />
              {c.trainEyebrow}
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              {c.trainTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base font-normal md:text-lg" style={{ color: PALETTE.textSec }}>
              {c.trainBody}
            </p>
          </Reveal>
          <Reveal delay={80} className="mt-8 md:mt-10">
            <CarouselShell isAr={isAr} ariaLabel={isAr ? "برامج التمارين الجاهزة" : "Ready-made training programs"}>
              {samples.programs.map((prog) => (
                <div key={prog.slug} className="w-72 shrink-0 md:w-80">
                  <LandingProgramCard prog={prog} isAr={isAr} />
                </div>
              ))}
            </CarouselShell>
          </Reveal>
          {/* ONE focused section CTA (owner directive 2026-09-24: the
              AI-builder CTA is retired here — the smart-planning
              builders own that job in #plan above). */}
          <Reveal delay={120} className="mt-10 text-center">
            <a
              href={isAr ? "/ar/programs" : "/programs"}
              className="btn-outline px-7 py-3 text-sm font-medium md:text-base"
            >
              {c.trainCta}
              <span className="chev rtl:rotate-180" aria-hidden="true">›</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ===================== 5. FOOD LIBRARY — the /foods preview (HOME-POLISH-285 + HOME-REFINE-286) =====================
          The owner directive: the nutrition section becomes a proper
          FOOD LIBRARY preview, matching the Exercise Library pattern —
          then 286 sharpened it: the COMPLETE nine-category set renders
          WRAPPED at every viewport (never one scrolling row), and the
          SIX real curated food cards carry the SAME four-fact macro
          format as the /foods cards (kcal · P · C · F — labeled cells
          in the food pages' own colors), each linking into the food's
          detail page; the 8,830+ database context rides FOODS_PLUS.
          The Meal Planner and the ready-made diet plans own their
          surfaces elsewhere (the tools section below + the #diet
          carousel), so nothing here duplicates them. */}
      <section id="eat" className="scroll-mt-20 bg-[var(--bg)] px-4 py-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <span className="seal-chip">
              <EngravedIcon name="protein" alt="" size={12} className="h-3 w-3" />
              {isAr ? `${FOODS_PLUS} صنفًا غذائيًا` : `${FOODS_PLUS} FOODS`}
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              {c.eatTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base font-normal md:text-lg" style={{ color: PALETTE.textSec }}>
              {c.eatBody}
            </p>
          </Reveal>
          {/* The category chips — the SAME hub vocabulary (the complete
              nine-category set), each routing into the /foods filtered
              view (real crawlable links). HOME-REFINE-286 (owner
              order): the set renders as a WRAPPED multi-row grid at
              EVERY viewport — never a single horizontal scrolling
              row — so the complete category set is always visible. */}
          <Reveal delay={40}>
            <div className="mt-8 md:mt-10">
              <p className="text-center text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.textMuted }}>
                {isAr ? "اختر فئة" : "Pick a category"}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {FOOD_CATEGORIES.map((cat) => {
                  const label = isAr ? FOOD_CATEGORY_LABELS[cat].ar : FOOD_CATEGORY_LABELS[cat].en;
                  return (
                    <a
                      key={cat}
                      href={`${isAr ? "/ar/foods" : "/foods"}?cat=${cat}`}
                      className="seal-chip transition-transform duration-300 hover:-translate-y-0.5"
                      title={label}
                    >
                      <Image
                        src={FOOD_CATEGORY_LABELS[cat].image}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                      {label}
                    </a>
                  );
                })}
              </div>
            </div>
          </Reveal>
          {/* The six real curated food cards (server-provided real
              per-100g numbers — the bundle law holds). */}
          <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3">
            {samples.foods.map((food, i) => (
              <Reveal key={food.slug} delay={80 + i * 40} className="h-full">
                <LandingFoodCard food={food} isAr={isAr} />
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-sm font-normal leading-relaxed" style={{ color: PALETTE.textSec }}>
            {isAr
              ? `أصناف حقيقية من قاعدة تضم ${FOODS_PLUS} صنف غذائي — سعرات كل صنف وماكروزه لكل 100 جرام داخل صفحته.`
              : `Real foods from a database of ${FOODS_PLUS} — every food's calories and per-100g macros live on its page.`}
          </p>
          <div className="mt-5 text-center">
            <a href={isAr ? "/ar/foods" : "/foods"} className="btn-outline px-7 py-3 text-sm font-medium md:text-base">
              {isAr ? "استكشف مكتبة الأطعمة كاملة" : "Explore the full food library"}
              <span className="chev rtl:rotate-180" aria-hidden="true">›</span>
            </a>
          </div>
        </div>
      </section>

      {/* ===================== 6. THE READY-MADE DIET LIBRARY — carousel (R4) =====================
          The owner directive: add the ready-made diet-plan library
          (مكتبة الخطط الغذائية الجاهزة) to the homepage, beside the
          exercise library. Real matrix data (server slice) — every card
          links into a real leaf page of the /diet-plan library. */}
      <section id="diet" className="scroll-mt-20 border-y border-[var(--edge)] bg-[var(--tint)] px-4 py-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <span className="seal-chip">
              <EngravedIcon name="mealplanner" alt="" size={12} className="h-3 w-3" />
              {isAr ? `${dietPlansCount} خطة جاهزة` : `${dietPlansCount} READY-MADE PLANS`}
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              {c.dietTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base font-normal md:text-lg" style={{ color: PALETTE.textSec }}>
              {c.dietBody}
            </p>
          </Reveal>
          <Reveal delay={80} className="mt-8 md:mt-10">
            <CarouselShell isAr={isAr} ariaLabel={isAr ? "الأنظمة الغذائية الجاهزة" : "The ready-made diet systems"}>
              {samples.dietSystems.map((system, i) => (
                <LandingDietCard
                  key={system.slug}
                  system={system}
                  levelCount={samples.dietLevels.length}
                  isAr={isAr}
                  index={i}
                />
              ))}
            </CarouselShell>
          </Reveal>
          <Reveal delay={120} className="mt-8 text-center">
            <a href={isAr ? "/ar/diet-plan" : "/diet-plan"} className="btn-outline px-7 py-3 text-sm font-medium md:text-base">
              {c.dietCta}
              <span className="chev rtl:rotate-180" aria-hidden="true">›</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ===================== 7. TOOLS — the tile preview (HOME-POLISH-285) =====================
          The owner directive: the tools render as proper VISUAL
          CARDS/TILES linking to their pages — not a plain list of
          buttons, and never the actual calculators. Every tile
          derives from the tools-shared single source: the five
          calculators/tracker PLUS the MANUAL Meal Planner («ابنِها
          بنفسك» — it joined this section per the owner order); the
          two AI planners stay EXCLUDED (they own the AI Planning
          section below — smart planning never reads as «more
          calculators»). The tools themselves run on their own pages. */}
      <section id="tools" className="scroll-mt-20 bg-[var(--bg)] px-4 py-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <span className="seal-chip">
              <EngravedIcon name="calories" alt="" size={12} className="h-3 w-3" />
              {c.toolsEyebrow}
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              {c.toolsTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base font-normal md:text-lg" style={{ color: PALETTE.textSec }}>
              {c.toolsBody}
            </p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-4 md:mt-10 md:grid-cols-3 md:gap-5">
            {/* The tiles derive from the tools-shared single source
                (never literals); the two AI planners are filtered OUT
                (their home is the AI Planning section below). */}
            {TOOLS.filter((t) => !t.slug.startsWith("/") || t.slug === "/meal-planner").map((t, i) => (
              <Reveal key={t.slug} delay={i * 40} className="h-full">
                <ToolTile
                  isAr={isAr}
                  icon={t.icon}
                  href={
                    t.slug.startsWith("/")
                      ? isAr
                        ? `/ar${t.slug}`
                        : t.slug
                      : isAr
                        ? `/ar/tools/${t.slug}`
                        : `/tools/${t.slug}`
                  }
                  chip={t.slug === "/meal-planner" ? (isAr ? "ابنِها بنفسك" : "YOU BUILD IT") : undefined}
                  title={isAr ? t.nameAr : t.nameEn}
                  body={isAr ? t.descAr : t.descEn}
                />
              </Reveal>
            ))}
          </div>
          {/* The ONE focused section CTA — the /tools hub (the full
              cluster incl. the AI-planner trial cards lives there). */}
          <Reveal delay={120} className="mt-10 text-center">
            <a
              href={isAr ? "/ar/tools" : "/tools"}
              className="btn-outline px-7 py-3 text-sm font-medium md:text-base"
            >
              {c.toolsCta}
              <span className="chev rtl:rotate-180" aria-hidden="true">›</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ===================== 7.5 THE FREE-ALLOWANCE BAND (HOME-POLISH-285) =====================
          The owner directive: the honest free monthly plan quota moved
          from AFTER the EVO card to immediately BEFORE the AI Planning
          section — it now INTRODUCES the AI planners (the unified plan
          pool; guests included — a verified policy restatement, never
          marketing copy). A slim band on the white surface, directly
          above the AI section's tint band. */}
      <section aria-label={isAr ? "رصيد الخطط المجاني" : "The free plan allowance"} className="bg-[var(--bg)] px-4 pb-10 md:pb-14">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="marble-card flex flex-col items-center justify-between gap-3 px-5 py-4 text-center md:flex-row md:gap-4 md:text-start">
              <p className="text-sm font-normal leading-relaxed" style={{ color: PALETTE.textSec }}>
                {c.planAllowance}
              </p>
              <span className="seal-chip shrink-0 py-1! text-[11px]!">
                <EngravedIcon name="macros" alt="" size={12} className="h-3 w-3" />
                {c.planAllowanceChip}
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== 8. AI PLANNING — distinct from the regular tools =====================
          HOME-PLATFORM-284 retired the in-page builders; HOME-POLISH-285
          strengthens the section's hierarchy: the AI Workout Planner +
          the AI Meal Planner lead as TWO STRONG cards (visually heavier,
          explicitly AI-POWERED, with FILLED chrome CTA buttons — the
          owner's directive «بطاقات وأزرار أوضح وأقوى»), and EVO follows
          as the full-width AI-coach band. Deliberately SEPARATE from
          #tools so smart planning never reads as «more calculators»:
          the icons wear the cyan .ai-ring (the AI-surface law), every
          card carries the بالذكاء الاصطناعي chip, and the body states
          exactly WHAT gets generated — the meal card promises a
          STRUCTURED full-day plan with portions in grams, not mere
          meal suggestions. */}
      <section id="plan" className="scroll-mt-20 border-y border-[var(--edge)] bg-[var(--tint)] px-4 py-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            <span className="seal-chip">
              <EngravedIcon name="evo" alt="" size={12} className="h-3 w-3" />
              {c.planEyebrow}
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              {c.planTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base font-normal md:text-lg" style={{ color: PALETTE.textSec }}>
              {c.planBody}
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2 md:gap-5">
            {/* Card 1 — the AI Workout Planner (AI-powered, explicit,
                filled chrome CTA). */}
            <Reveal className="h-full">
              <AiCard
                isAr={isAr}
                icon="rack"
                href={isAr ? "/ar/ai-workout-planner" : "/ai-workout-planner"}
                title={isAr ? "مخطط التمارين بالذكاء الاصطناعي" : "AI Workout Planner"}
                body={
                  isAr
                    ? "نظام تدريبي أسبوعي كامل يُبنى لك: تمارين محددة من المكتبة بمجموعاتها وتكراراتها، وفق هدفك ومستواك وأيامك ومعداتك — يتولد في ثوانٍ."
                    : "A complete weekly split built for you: named exercises from the library with sets and reps, matched to your goal, level, days, and equipment — generated in seconds."
                }
                cta={isAr ? "أنشئ خطة التمارين" : "Create my workout plan"}
              />
            </Reveal>
            {/* Card 2 — the AI Meal Planner: a STRUCTURED full-day
                plan with portions/grams — the body states this
                explicitly (owner directive: not mere suggestions). */}
            <Reveal delay={80} className="h-full">
              <AiCard
                isAr={isAr}
                icon="mealplanner"
                href={isAr ? "/ar/ai-meal-planner" : "/ai-meal-planner"}
                title={isAr ? "مخطط الوجبات بالذكاء الاصطناعي" : "AI Meal Planner"}
                body={
                  isAr
                    ? "خطة يوم كاملة منظمة، وليست مجرد اقتراحات وجبات: كل وجبة بأصنافها المحددة وكمياتها بالغرامات وسعراتها المحسوبة — تتولد في ثوانٍ وفق هدفك ونظامك الغذائي."
                    : "A structured full-day plan, not just meal suggestions: every meal with its specific foods, portions in grams, and calculated calories — generated in seconds around your goal and diet system."
                }
                cta={isAr ? "أنشئ خطتي" : "Create My Plan"}
              />
            </Reveal>
          </div>
          {/* Card 3 — EVO, the AI coach (full-width band, chat button
              → floating widget per the chat-surface law). */}
          <Reveal delay={160} className="mt-4 md:mt-5">
            <EvoCard isAr={isAr} />
          </Reveal>
        </div>
      </section>

      {/* ===================== 9. LEARN — the latest articles (R6) =====================
          The simple title the owner asked for («أحدث المقالات»), and
          the carousel is LATEST-FIRST: the newest posts actually lead
          the row (featured posts fill the rest; featured slugs keep
          the dark lead-card styling). The section renders only when
          posts loaded (the needsPosts law). SEO-P1-6: the deferIdle
          (2500ms) fetch + the conditional section moved VERBATIM into
          the BlogSection dynamic island — the copy arrives as props
          from the server registry. */}
      <BlogSection learnTitle={c.learnTitle} learnCta={c.learnCta} isAr={isAr} />

      {/* Greek meander divider — the TWO narrative acts law: exploration
          ends here, the services act begins. */}
      <div className="meander-divider" aria-hidden="true" />

      {/* ===================== 10. MEMBERSHIPS — small cards (R7) =====================
          The compact treatment the owner asked for: SMALL attractive
          membership cards + one online-coaching card. Prices derive
          from memberships.ts (single source — no literals); the free
          card routes to signup, premium/pro to the memberships page.
          HOME-POLISH-285 (owner directive): the section's single DARK
          highlighted card is PRO (was Premium — pricing, features, and
          links untouched), every tier card now carries a CLEAR visible
          CTA button in the SAME consistent recipe (.btn-outline on the
          light cards, .btn-outline-dark on the dark Pro card — the
          coaching band keeps the section's ONE filled chrome CTA). */}
      <section id="memberships" className="scroll-mt-20 bg-[var(--bg)] px-4 py-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center">
            {/* VRD-V8R: the section gains the page's eyebrow rhythm —
                and names the WHOLE services act (memberships + the
                coaching band below). */}
            <span className="seal-chip">
              <EngravedIcon name="laurel" alt="" size={12} className="h-3 w-3" />
              {c.membershipsEyebrow}
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              {c.membershipsTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base font-normal md:text-lg" style={{ color: PALETTE.textSec }}>
              {c.membershipsBody}
            </p>
          </Reveal>

          {/* The small membership cards (Free · Premium · Pro). */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 md:mt-10">
            {/* Free — routes to signup (the visible consistent CTA). */}
            <Reveal className="h-full">
              <div className="marble-card card-lift flex h-full flex-col p-5 text-start">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight" style={{ color: PALETTE.textPrim }}>
                    {isAr ? freeTier?.nameAr : freeTier?.nameEn}
                  </h3>
                  <span className="chrome-text text-lg font-bold">{freePriceLabel}</span>
                </div>
                {/* VRD-V8R: the tier's REAL facts (memberships.ts limits)
                    replace the free-prose one-liner — scannable value,
                    zero invented claims. */}
                <TierFeatureRows
                  rows={
                    isAr
                      ? ["كل المكتبات والأدوات", "توليدان شهريًا للخطط الذكية", "EVO: 10 رسائل يوميًا"]
                      : ["Every library and tool", "2 AI plans a month", "EVO: 10 messages a day"]
                  }
                />
                <a href="/auth?mode=signup" className="btn-outline mt-4 w-full px-6 py-2.5 text-sm font-medium">
                  {isAr ? "ابدأ مجانًا" : "Start free"}
                  <span className="chev rtl:rotate-180" aria-hidden="true">›</span>
                </a>
              </div>
            </Reveal>
            {/* Premium — the light marble card (the dark anchor moved
                to Pro per the HOME-POLISH-285 owner order; Premium
                stays visually distinct by tier, features, and price). */}
            <Reveal delay={80} className="h-full">
              <div className="marble-card card-lift flex h-full flex-col p-5 text-start">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight" style={{ color: PALETTE.textPrim }}>
                    {isAr ? premiumTier?.nameAr : premiumTier?.nameEn}
                  </h3>
                  <span className="chrome-text text-lg font-bold">
                    {premiumPriceLabel}
                    <span className="text-xs font-medium" style={{ color: PALETTE.textMuted }}>
                      {isAr ? " / شهريًا" : " /mo"}
                    </span>
                  </span>
                </div>
                <TierFeatureRows
                  rows={
                    isAr
                      ? ["كل مزايا المستوى المجاني", "EVO بلا حدود وسجل محادثتك متزامن عبر أجهزتك", "4 خطط شهريًا، تصدير كامل، وسعة حفظ أكبر"]
                      : ["Everything in the Free tier", "Unlimited EVO, chat history synced across devices", "4 plans a month, full export, bigger saves"]
                  }
                />
                <a href={isAr ? "/ar/memberships" : "/memberships"} className="btn-outline mt-4 w-full px-6 py-2.5 text-sm font-medium">
                  {isAr ? "التفاصيل" : "See details"}
                  <span className="chev rtl:rotate-180" aria-hidden="true">›</span>
                </a>
              </div>
            </Reveal>
            {/* Pro — THE dark highlighted card (HOME-POLISH-285: the
                black marble + chrome ring + the Recommended seal belong
                to PRO; the CTA rides the .btn-outline-dark variant so
                it stays clearly visible on the dark surface). */}
            <Reveal delay={160} className="h-full">
              <div className="relative h-full" style={darkMarbleStyle}>
                <span
                  className="seal-chip absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0B0B0D]"
                  style={{ color: "#F5F5F7", borderColor: "#3A3F45" }}
                >
                  <EngravedIcon name="laurel" alt="" size={12} className="h-3 w-3" />
                  {isAr ? "موصى بها" : "Recommended"}
                </span>
                <div className="flex h-full flex-col p-5 pt-6 text-start" style={{ color: "#F5F5F7" }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight" style={{ color: "#F5F5F7" }}>
                      {isAr ? proTier?.nameAr : proTier?.nameEn}
                    </h3>
                    <span className="chrome-text-on-dark text-lg font-bold">
                      {proPriceLabel}
                      <span className="text-xs font-medium" style={{ color: "rgba(245,245,247,0.6)" }}>
                        {isAr ? " / شهريًا" : " /mo"}
                      </span>
                    </span>
                  </div>
                  <TierFeatureRows
                    pinDark
                    rows={
                      isAr
                        ? ["كل مزايا البريميوم", "8 خطط شهريًا و6 تبديلات أسبوعية", "تجربة بلا إعلانات"]
                        : ["Everything in Premium", "8 plans a month + 6 weekly swaps", "Ad-free experience"]
                    }
                  />
                  <a
                    href={isAr ? "/ar/memberships" : "/memberships"}
                    className="btn-outline-dark mt-4 w-full px-6 py-2.5 text-sm font-medium"
                  >
                    {isAr ? "التفاصيل" : "See details"}
                    <span className="chev rtl:rotate-180" aria-hidden="true">›</span>
                  </a>
                </div>
              </div>
            </Reveal>
          </div>

          {/* The online-coaching card — the human service, separate from
              the memberships (the terminology law), carrying the
              section's ONE filled CTA. VRD-V6 (hierarchy fix, VLM
              audit #7): the card drops the dark-marble fill for a
              LIGHT service band (--tint + --edge hairline) so the
              section keeps exactly ONE dark anchor (PRO since
              HOME-POLISH-285) — the «two black surfaces, muddy
              hierarchy» blur stays gone. Copy, links, price source, and
              the chrome CTA stay byte-identical (the 273 canary pins
              the CTA recipe). */}
          <Reveal delay={200} className="mt-4 md:mt-5">
            <div className="relative overflow-hidden rounded-[var(--radius-chrome)] border border-[var(--edge)] bg-[var(--tint)] p-5 md:p-7">
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight" style={{ color: PALETTE.textPrim }}>
                    {c.coachingTitle}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm font-normal leading-relaxed" style={{ color: PALETTE.textSec }}>
                    {c.coachingBody}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                  <span className="chrome-text text-2xl font-bold">
                    {coachingPriceLabel}
                    <span className="text-xs font-medium" style={{ color: PALETTE.textMuted }}>
                      {isAr ? " / شهريًا" : " /mo"}
                    </span>
                  </span>
                  <a href={isAr ? "/ar/coaching" : "/coaching"} className="btn-chrome px-6 py-2.5 text-sm font-medium">
                    {c.coachingCta}
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          {/* The REAL refund policy, stated as fact (refund.ts: 7-day
              conditional, no-features-used). */}
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs font-normal leading-relaxed" style={{ color: PALETTE.textMuted }}>
            {isAr
              ? "كل باقة مدفوعة تشمل حق الاسترداد خلال 7 أيام — إن لم تستخدم المزايا المدفوعة، يُعاد إليك المبلغ. ولا خصم تلقائي: تدفع مرة واحدة، وتجدد فقط إن أردت."
              : "Every paid plan carries a 7-day refund — if you haven't used the paid features, you get your money back. And there's no auto-renewal: you pay once, and renew only if you choose to."}
          </p>
        </div>
      </section>

      {/* ===================== 11.5 FEATURED COACHES («أعلن معنا» ads) =====================
          Kept verbatim (0037 paid-ad strip — a real service surface;
          renders only when active ads exist). Labeled as promo spots,
          not an endorsement. SEO-P1-6: the mount-time fetch + the
          conditional strip moved VERBATIM into the
          FeaturedCoachesStrip dynamic island. */}
      <FeaturedCoachesStrip coachesTitle={c.coachesTitle} coachesBody={c.coachesBody} isAr={isAr} />

      {/* ===================== 12. FAQ — hesitation-removers, DIRECTLY VISIBLE =====================
          HOME-POLISH-285 (owner directive): no click-to-reveal — the
          FIVE questions render as a clean compact GRID where every
          answer is visible immediately (the FAQPage JSON-LD still
          derives from the same faqs array — the single-source law
          holds). The 5th card spans both columns so the grid closes
          balanced without inventing a sixth question. */}
      <section id="faq" className="scroll-mt-20 border-t border-[var(--edge)] bg-[var(--tint)] px-4 py-10 md:py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center">
            <span className="seal-chip">
              <EngravedIcon name="scroll" alt="" size={12} className="h-3 w-3" />
              {c.faqEyebrow}
            </span>
            <h2 className="mt-5 text-center text-3xl font-semibold tracking-tight md:text-4xl">
              {c.faqTitle}
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 60} className={i === faqs.length - 1 ? "md:col-span-2" : undefined}>
                <div className="marble-card h-full p-5 md:p-6">
                  <h3 className="flex items-start gap-2.5 text-base font-semibold leading-snug tracking-tight" style={{ color: PALETTE.textPrim }}>
                    <EngravedIcon name="scroll" alt="" size={18} className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="mt-2.5 text-sm font-normal leading-relaxed" style={{ color: PALETTE.textSec }}>
                    {faq.a}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FOOTER — the SHARED SiteFooter component;
          every public page renders the identical footer (HOME-REFINE-270
          R9: flat, fully displayed — no disclosure groups). ===================== */}
      <SiteFooter />
    </div>
  );
}
