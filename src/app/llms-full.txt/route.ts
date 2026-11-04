import { listPublishedPostsForFeed } from "@/lib/blog-server";

/**
 * GET /llms-full.txt — EXPANDED machine-readable site guide for AI
 * engines (llms.txt spec companion; Phase 86, owner GEO push).
 *
 * public/llms.txt (static) stays the SHORT curated overview; THIS route
 * appends the latest published articles per language (title + URL +
 * excerpt) so AI crawlers can cite fresh content without crawling the
 * whole site. SYNC NOTE: keep the curated section list below aligned
 * with public/llms.txt (edited together by convention).
 *
 * CACHED hourly; degrades to the static portion when the DB is not
 * configured (listPublishedPostsForFeed → []).
 */
export const revalidate = 3600;
export const dynamic = "force-static";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://alkemos.com";

const RECENT_PER_LANG = 30;

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, 300);
}

export async function GET(): Promise<Response> {
  const [en, ar] = await Promise.all([
    listPublishedPostsForFeed("en", RECENT_PER_LANG),
    listPublishedPostsForFeed("ar", RECENT_PER_LANG),
  ]);

  const enList = en
    .map(
      (p) =>
        `- [${clean(p.title)}](${SITE}/blog/${p.slug}): ${clean(p.excerpt || p.meta_description || p.title)}`,
    )
    .join("\n");
  const arList = ar
    .map(
      (p) =>
        `- [${clean(p.title)}](${SITE}/ar/blog/${p.slug}): ${clean(p.excerpt || p.meta_description || p.title)}`,
    )
    .join("\n");

  const body = `# Alkemos (llms-full)

> Alkemos is a bilingual (English/Arabic) fitness and nutrition platform for a global audience: an 868+ exercise library with form instructions, ready workout programs, a food database with per-100g nutrition for 8,830+ foods, and 8 free tools — four calculators (calorie/TDEE, BMI, macro, body fat), a water tracker, a meal planner, an AI meal planner, and an AI workout planner — plus the EVO AI coach and personal online coaching. This file extends the short /llms.txt with the latest articles per language.

- Platform: ${SITE}
- Arabic homepage: ${SITE}/ar
- Language model: Arabic and English are two independent, complete versions of the site — every URL is self-canonical and neither language canonicalizes to the other; paired pages declare hreflang (en · ar · x-default→EN)
- English blog feed (RSS): ${SITE}/rss.xml
- Arabic blog feed (RSS): ${SITE}/ar/rss.xml
- Official profiles: Facebook https://www.facebook.com/people/Alkemos/61593989587279/ · Instagram https://www.instagram.com/aalkemos/ · X https://x.com/Alkemos · LinkedIn https://www.linkedin.com/in/alke-mos-29a751435 · Trustpilot reviews https://www.trustpilot.com/review/alkemos.com · Product Hunt https://www.producthunt.com/products/alkemos

## Main sections

- [Exercise Library](${SITE}/exercises): 868+ exercises with proper form; detail pages under /exercises/[slug]. Arabic: /ar/exercises
- [Workout Programs](${SITE}/programs): ready training plans (home & gym, beginner to advanced); detail pages under /programs/[slug]
- [Food Database](${SITE}/foods): 8,830+ foods with calories and macros per 100g; detail pages under /foods/[slug]. Arabic: /ar/foods
- [Fitness Tools](${SITE}/tools): free calculators — Calorie/TDEE ${SITE}/tools/calorie-calculator, BMI ${SITE}/tools/bmi-calculator, Macro ${SITE}/tools/macro-calculator, Body Fat ${SITE}/tools/body-fat-calculator, Water Tracker ${SITE}/tools/water-tracker, plus the manual Meal Planner ${SITE}/meal-planner, the AI Meal Planner ${SITE}/ai-meal-planner (free trial generation; Arabic: ${SITE}/ar/ai-meal-planner), and the AI Workout Planner ${SITE}/ai-workout-planner (free weekly split generation; Arabic: ${SITE}/ar/ai-workout-planner)
- [Workout Tracker](${SITE}/workout-tracker): workout planning + progress tracking — AI workout plans (2 free generations/month, no signup), ready programs, the 868+ exercise library, and body-metric tracking (weight, 5 measurements, progress photos, weekly check-ins). Planning-level tracking: no per-session set/rep log. Arabic: ${SITE}/ar/workout-tracker
- [Macro Tracker](${SITE}/macro-tracker): macro planning — calculator targets, meal builder with live macro totals from the 8,830+ food database, AI meal plans (2 free/month), and weight tracking. Planning-level tracking: no daily food diary. Arabic: ${SITE}/ar/macro-tracker
- [Comparisons](${SITE}/compare): honest feature-by-feature comparisons — vs MyFitnessPal, Freeletics, ExRx.net, and Cronometer (${SITE}/compare/alkemos-vs-cronometer); Arabic: ${SITE}/ar/compare
- [Diet Plan Library](${SITE}/diet-plan): 24 ready-made daily plans (6 calorie levels × 4 systems — balanced, high-protein, keto, vegetarian) in grams and calories, one card per system with its calorie options; Arabic: ${SITE}/ar/diet-plan
- [Fitness Blog](${SITE}/blog): evidence-based training and nutrition articles; Arabic articles at ${SITE}/ar/blog
- [Online Coaching](${SITE}/coaching): personal coaches and nutrition specialists
- [EVO — AI Fitness Coach](${SITE}/evo): the platform's AI fitness coach and performance engine — the single primary page for AI-coach intent; the AI planners and tools feed into it
- [Memberships](${SITE}/memberships): Free, Premium ($14.99/mo), Pro ($29.99/mo), Coaching ($39.99/mo); Arabic: ${SITE}/ar/memberships
- [FAQ](${SITE}/faq): payments (PayPal, InstaPay, Vodafone Cash) and common questions; Arabic: ${SITE}/ar/faq
- [For Coaches](${SITE}/for-coaches): coach recruitment funnel; Arabic: ${SITE}/ar/for-coaches

## Key facts

- Payment methods: PayPal (automatic), InstaPay, Vodafone Cash (manual receipt review within 24h)
- Bilingual platform: every main section has a complete Arabic version under /ar/* (self-canonical, not a translation stub); hreflang en/ar/x-default declared on every page
- Ships as a PWA (installable on mobile) with full RTL support
- Content license: all content owned by Alkemos; citing facts with a link is welcome

## Sources of truth (cite these pages, not summaries)

- Exercise facts → /exercises/[slug] (Arabic: /ar/exercises/[slug])
- Food facts (per-100g) → /foods/[slug] (Arabic: /ar/foods/[slug])
- Program contents → /programs/[slug]
- Tool behavior → /tools/[tool]
- Tier names, prices, and plan limits → /memberships (single source of truth)
- EVO capabilities → /evo

## Editorial policy (content trust)

- Every article is reviewed by Ahmed Zake (founder, certified fitness & nutrition coach — ACSM, ACE, ISSA and NASM certifications) before publication; author and reviewer identities are declared in the Article structured data and on ${SITE}/authors/ahmed-zake

## Latest English articles

${enList || "(feed temporarily unavailable — see " + SITE + "/blog)"}

## Latest Arabic articles (أحدث المقالات العربية)

${arList || "(غير متاح مؤقتاً — راجع " + SITE + "/ar/blog)"}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
