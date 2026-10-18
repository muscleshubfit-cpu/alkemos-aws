import type { Metadata } from "next";
import Link from "next/link";
import { jsonLd, getBreadcrumbSchema } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { DIET_LEVELS, DIET_SYSTEMS } from "@/lib/diet-plan-matrix";

const SITE_URL = "https://alkemos.com";

/**
 * /diet-plan — the English diet-plan LIBRARY hub (§12.27 EN twin ·
 * §12.33+§12.34 owner directives «انقل خطط غذائيه جاهزة الى المكتبات باسم
 * مكتبة الخطط الغذاييه الجاهزه ، عدل شكل وتوزيع الخطط الغذاييه الجاهزه
 * الى كارت لكل نوع واسفل منه اختيارات السعرات»). The 24 EN leaf cells
 * live under /diet-plan/{level}/{system}; the hub now presents them as
 * one card per system with the six calorie options below it.
 *
 * Full hreflang pair with the AR twin (ar/diet-plan). No FAQPage schema,
 * no ratings, no fabricated signals.
 */

/** One honest line per system — the card's subtitle (§12.34). */
const SYSTEM_LINES: Record<string, string> = {
  balanced: "A balanced starting point — a 30/40/30 calorie split (protein/carbs/fat).",
  "high-protein": "Built for fat loss and muscle building — 45/35/20 with protein leading.",
  keto: "High fat, near-zero carbs — 25/5/70.",
  vegetarian: "Legumes, grains, dairy, and eggs — 25/50/25 (a library-only preset).",
};

export const metadata: Metadata = {
  title: "Diet Plan Library: Ready-Made Plans by Calories | Alkemos",
  // PHASE 189 (SEO-GEO-10, deep-audit P1-3): was 184 chars — inside the
  // 158 EN budget now, ends on a clean period (no mid-word cut).
  description:
    "24 ready daily diet plans — 6 calorie levels × 4 systems (balanced, high-protein, keto, vegetarian) in grams and calories, plus a free customization step.",
  alternates: {
    canonical: `${SITE_URL}/diet-plan`,
    languages: {
      en: `${SITE_URL}/diet-plan`,
      ar: `${SITE_URL}/ar/diet-plan`,
      "x-default": `${SITE_URL}/diet-plan`,
    },
  },
  openGraph: {
    title: "Diet Plan Library — Ready-Made Plans by Calories | Alkemos",
    description:
      "24 complete daily plans in grams: from 1200 to 3000 calories × 4 diet systems.",
    url: `${SITE_URL}/diet-plan`,
    type: "website",
    locale: "en_US",
    // §12.53 item 4 (2026-09-15): og:image + og:locale for the EN hub —
    // a child openGraph block REPLACES the root one (Next.js merging).
    // Same-family home card, matching the AR mirror's og-home-ar
    // inheritance.
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=3.
        url: "/images/og/og-diet-plan-en.png?v=3",
        width: 1200,
        height: 630,
        alt: "Alkemos — The Smart Fitness & Nutrition Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-diet-plan-en.png?v=3"],
  },
};

export default function DietPlanHubPageEn() {
  const breadcrumb = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Diet Plan Library", url: "/diet-plan" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }}
      />
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <SiteHeader variant="landing" />
        <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Diet Plan Library — Ready-Made Plans by Calories
          </h1>
          <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            This library turns your calorie number into an actual day of food:
            twenty-four ready plans, each built for one calorie level (from
            1200 to 3000) across four diet systems — balanced, high-protein,
            keto, and vegetarian. Every plan is written in grams and calories
            per item, with breakfast, lunch, dinner, and a snack drawn from
            familiar, affordable food: eggs and pita bread, rice and chicken,
            lentils and yogurt — no powders, no ingredients your local market
            does not stock.
          </p>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            Start from your number: if you already know your daily calories,
            pick your system from the cards below, then your level from its
            calorie options; if you do not, run the{" "}
            <Link
              href="/tools/calorie-calculator"
              className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]"
            >
              calorie calculator
            </Link>{" "}
            first — a 1500-calorie plan fits a person burning 2400 very differently
            than one burning 1800. Then choose the system that resembles your
            life: balanced makes a balanced starting point,
            high-protein is built for fat loss and muscle building, keto
            suits people who already live that way, and vegetarian is built
            for days of legumes, grains, dairy, and eggs.
          </p>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            Every plan page ends with the customization step: plan your meals
            with AI — it generates a complete day from your number, system,
            and preferences, free without any account — or open the manual
            meal planner, enter the same items at your own grams, and watch
            the totals build live for each meal and for the day, then adjust
            the grams until your day lands exactly on your target. The ready
            plan opens the door; customization makes it your home.
          </p>

          <div className="mt-6">
            <ShareButtons path="/diet-plan" title="Diet Plan Library — Alkemos" />
          </div>

          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            The library — one card per system, calorie options below
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {DIET_SYSTEMS.map((s) => (
              <div key={s.slug} className="marble-card flex flex-col p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
                    {s.nameEn}
                  </h3>
                  <span
                    className="whitespace-nowrap text-xs font-normal text-[var(--muted-foreground)]"
                    dir="ltr"
                  >
                    {s.split.protein}/{s.split.carbs}/{s.split.fat}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {SYSTEM_LINES[s.slug]}
                </p>
                <p className="mt-4 text-xs font-medium text-[var(--text)]">
                  Calorie options:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIET_LEVELS.map((lv) => (
                    <Link
                      key={lv}
                      href={`/diet-plan/${lv}/${s.slug}`}
                      className="rounded-full border border-[var(--edge)] px-3.5 py-1.5 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
                    >
                      {lv} calories
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* PRIORITY-PAGES-2 (2026-10-19, audit §E-1): a TEXTUAL index of
              all 24 leaf plans in the measured query pattern — "2000 calorie
              high protein meal plan" (2 impr @ 56.50) and "2000 calorie
              vegetarian meal plan" (1 impr @ 16.00, GSC run 39152491179) —
              the library showed the cards but never a query-shaped link a
              searcher (or a crawler) could read. The /diet-plan/2000/
              high-protein page itself measured 17 impressions @ 52.59. */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            Every plan by name — the full 24
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            The whole library, written the way people ask for it — pick your
            calories and your system and the plan opens in grams:
          </p>
          <div className="mt-4 space-y-5">
            {DIET_SYSTEMS.map((s) => (
              <div key={s.slug}>
                <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                  {s.nameEn} meal plans
                </h3>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                  {DIET_LEVELS.map((lv) => (
                    <li key={lv}>
                      <Link
                        href={`/diet-plan/${lv}/${s.slug}`}
                        className="text-sm font-normal text-[var(--muted-foreground)] underline decoration-[var(--edge)] underline-offset-4 transition-colors hover:text-[var(--text)]"
                      >
                        {`${lv}-calorie ${s.nameEn.toLowerCase()} meal plan — ready in grams`}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            How to read and use a plan
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            The weights in these plans are cooked or ready-to-eat — cooked
            rice is not dry rice, and a boiled egg weighs roughly with its
            shell. The plan is an honest starting scaffold, not a closed
            contract: swap an item for another from the same family (fish for
            chicken, lentils for chickpeas) as long as the daily total stays
            near your target, and measure your response on the scale across
            two weeks, not by feel. If your weight moved in the intended
            direction after two weeks, the plan is working; if it did not,
            adjust by 100 to 200 calories in the required direction and give
            the next two weeks the same patience.
          </p>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            And the usual health reminder: these are general plans for healthy
            adults. If you live with a chronic condition — diabetes, kidney
            disease, pregnancy, or an eating disorder — the right number for
            you is set with a professional who sees your full file, and this
            library is an excellent conversation piece with them, never a
            replacement.
          </p>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
