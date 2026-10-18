import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { jsonLd, getBreadcrumbSchema } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import {
  DIET_LEVELS,
  DIET_SYSTEMS,
  FOOD_NAMES_EN,
  LEVEL_GUIDANCE_EN,
  MEAL_NAME_EN,
  SYSTEM_GUIDANCE_EN,
  buildCellIntroEn,
  buildCellMetadataEn,
  getDietSystem,
  isDietLevel,
  macroTargets,
  solveDayPlan,
} from "@/lib/diet-plan-matrix";

const SITE_URL = "https://alkemos.com";

/**
 * /diet-plan/{level}/{system} — the 24 EN programmatic leaf pages
 * (§12.27 — the English twin of the §12.26 AR matrix).
 *
 * LAWS (see src/lib/diet-plan-matrix.ts header):
 *   - Unique intro per cell + computed day plan within ±10 kcal — the SAME
 *     solve as the AR twin prints (one engine, identical numbers).
 *   - Full hreflang pair: en + ar + x-default→en. BreadcrumbList schema
 *     only — no FAQPage, no ratings.
 *   - Free-planner CTA (no registration needed — free tier: 3 meals).
 */

export function generateStaticParams() {
  return DIET_LEVELS.flatMap((level) =>
    DIET_SYSTEMS.map((system) => ({
      level: String(level),
      system: system.slug,
    })),
  );
}

type Params = { params: Promise<{ level: string; system: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { level, system } = await params;
  if (!isDietLevel(level) || !getDietSystem(system)) return {};
  const lv = Number(level) as 1200 | 1500 | 1800 | 2000 | 2500 | 3000;
  const sys = getDietSystem(system)!;
  const { title, description } = buildCellMetadataEn(lv, sys);
  const url = `${SITE_URL}/diet-plan/${lv}/${sys.slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: url,
        ar: `${SITE_URL}/ar/diet-plan/${lv}/${sys.slug}`,
        "x-default": url,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "en_US",
      // §12.53 item 4 (2026-09-15): og:image + og:locale for the 24 EN
      // cells — same-family home card as the hub above (matches the AR
      // mirror's og-home-ar inheritance).
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
}

export default async function DietPlanCellPageEn({ params }: Params) {
  const { level, system } = await params;
  if (!isDietLevel(level) || !getDietSystem(system)) notFound();
  const lv = Number(level) as 1200 | 1500 | 1800 | 2000 | 2500 | 3000;
  const sys = getDietSystem(system)!;

  const targets = macroTargets(lv, sys);
  const day = solveDayPlan(lv, sys);
  const intro = buildCellIntroEn(lv, sys, targets);
  const url = `${SITE_URL}/diet-plan/${lv}/${sys.slug}`;

  const breadcrumb = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Diet Plan Library", url: "/diet-plan" },
    { name: `${lv} Calories`, url: `/diet-plan/${lv}/${sys.slug}` },
  ]);

  const macroRows = [
    {
      label: "Protein",
      grams: targets.protein,
      kcal: Math.round((lv * sys.split.protein) / 100),
      pct: sys.split.protein,
    },
    {
      label: "Carbohydrates",
      grams: targets.carbs,
      kcal: Math.round((lv * sys.split.carbs) / 100),
      pct: sys.split.carbs,
    },
    {
      label: "Fat",
      grams: targets.fat,
      kcal: Math.round((lv * sys.split.fat) / 100),
      pct: sys.split.fat,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }}
      />
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <SiteHeader variant="landing" />
        <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted-foreground)]">
            <Link href="/diet-plan" className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
              Diet Plan Library
            </Link>
            <span className="px-1.5">/</span>
            <span>
              {lv} calories · {sys.nameEn}
            </span>
          </nav>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            {/* CONTENT-AUDIT P0-5 (audit §1.11): one template literal = one
                text node — no React `<!-- -->` separators where the number
                meets "-Calorie", so raw-HTML readers (scrapers/AI crawlers)
                can never see "2000 -Calorie". */}
            {`${lv}-Calorie ${sys.nameEn} Diet Plan`}
          </h1>

          {intro.map((p, i) => (
            <p key={i} className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              {p}
            </p>
          ))}

          {/* ── The full day, computed (same solve as the AR twin) ── */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            {`The full day in grams (${day.kcal} calories)`}
          </h2>
          <div className="mt-4 space-y-4">
            {day.meals.map((meal) => (
              <div key={meal.name} className="rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                    {MEAL_NAME_EN[meal.name] ?? meal.name}
                  </h3>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {meal.kcal} kcal
                  </span>
                </div>
                <ul className="mt-2 divide-y divide-[var(--edge)]/60">
                  {meal.items.map((item) => (
                    <li key={item.food} className="flex items-baseline justify-between gap-3 py-1.5 text-sm font-normal">
                      <span className="text-[var(--muted-foreground)]">
                        {FOOD_NAMES_EN[item.food] ?? item.food}
                      </span>
                      <span className="whitespace-nowrap text-[var(--muted-foreground)]">
                        {item.grams} g · {item.kcal} kcal
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
            Day total: {day.kcal} calories · protein {day.protein} g · carbs{" "}
            {day.carbs} g · fat {day.fat} g. Weights are cooked or
            ready-to-eat and values are rounded to the nearest calorie — the
            natural spread of real-food digestion is far wider than these
            decimal places.
          </p>

          {/* ── Macro targets ── */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            Macro split at {lv} calories
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--edge)]">
            <table className="w-full min-w-[420px] border-collapse text-sm font-normal">
              <thead>
                <tr className="bg-[var(--tint)]">
                  <th scope="col" className="border-b border-[var(--edge)] px-3 py-2 text-start font-medium text-[var(--text)]">Macro</th>
                  <th scope="col" className="border-b border-[var(--edge)] px-3 py-2 text-center font-medium text-[var(--text)]">Grams/day</th>
                  <th scope="col" className="border-b border-[var(--edge)] px-3 py-2 text-center font-medium text-[var(--text)]">Calories</th>
                  <th scope="col" className="border-b border-[var(--edge)] px-3 py-2 text-center font-medium text-[var(--text)]">Share</th>
                </tr>
              </thead>
              <tbody>
                {macroRows.map((r) => (
                  <tr key={r.label} className="odd:bg-[var(--tint)]/40">
                    <td className="border-b border-[var(--edge)]/60 px-3 py-2 text-[var(--muted-foreground)]">{r.label}</td>
                    <td className="border-b border-[var(--edge)]/60 px-3 py-2 text-center text-[var(--muted-foreground)]">{r.grams} g</td>
                    <td className="border-b border-[var(--edge)]/60 px-3 py-2 text-center text-[var(--muted-foreground)]">{r.kcal}</td>
                    <td className="border-b border-[var(--edge)]/60 px-3 py-2 text-center text-[var(--muted-foreground)]">{r.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
            This split is the same header as the day plan above — the actual
            food grams land close to it with a natural gap, because the plan
            is built from real food rather than laboratory powders. If you
            want the split tuned to the decimal, the{" "}
            <Link href="/tools/macro-calculator" className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
              macro calculator
            </Link>{" "}
            computes it from your calories in copyable grams.
          </p>

          {/* ── Level & system guidance ── */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            Why {lv} calories? And when does it fit you?
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            {LEVEL_GUIDANCE_EN[lv]}
          </p>
          <h2 className="mt-8 text-xl font-semibold tracking-tight text-[var(--text)]">
            About the {sys.nameEn.toLowerCase()} system
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            {SYSTEM_GUIDANCE_EN[sys.slug]}
          </p>

          {/* ── Free customization CTA (§12.28: AI generator first, manual planner for exact grams) ── */}
          <div className="mt-10 rounded-3xl border border-[var(--edge)] bg-[var(--tint)] p-6">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">
              Make it your plan — free
            </h2>
            <p className="mt-2 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              The plan above is drawn for {lv} calories in general; your own
              numbers deserve their own measurement. The fastest route:{" "}
              <Link href="/ai-meal-planner" className="font-medium underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
                plan your meals with AI
              </Link>{" "}
              — enter your number, system, and preferences, and a complete day
              plan in grams is generated for you in seconds, free for everyone.
              For exact manual control, open the{" "}
              <Link href="/meal-planner" className="font-medium underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
                meal planner
              </Link>{" "}
              — it works for visitors, free to try — and enter
              this plan&apos;s items at your grams: the totals build live for
              each meal and for the day, and you adjust grams until your day
              lands exactly on target.
            </p>
            <p className="mt-2 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              And if you are not yet sure {lv} calories is even your number,
              start at the{" "}
              <Link href="/tools/calorie-calculator" className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
                calorie calculator
              </Link>{" "}
              — honest age, weight, height, and activity — and walk out with
              your own figures, not the averages&apos;.
            </p>
          </div>

          {/* ── Visible FAQ (plain text, no FAQPage schema) ── */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            {lv}-calorie {sys.nameEn.toLowerCase()} plan — common questions
          </h2>
          <div className="mt-3 space-y-4">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                Must I follow these grams literally?
              </h3>
              <p className="mt-1.5 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                No — the plan is a scaffold, not a shackle. Literal-gram
                compliance every day with no social life and no variety
                collapses faster than it starts. The daily constants are the
                total{` (${day.kcal} calories)`} and the protein (about{" "}
                {targets.protein} g); how the items are arranged across meals
                should follow your day and your taste, and same-family swaps
                (chicken for fish, lentils for chickpeas) are allowed as long
                as the daily total stays near target.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                What if I am hungry at {lv} calories?
              </h3>
              <p className="mt-1.5 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                Hunger is information first: audit your protein, fiber, and
                vegetable volume — if any of them is low, fix that first,
                because they are the primary satiety tools. Drink a glass of
                water and wait ten minutes; if the hunger is still honest, add
                a serving of cooked vegetables or fat-free yogurt at a low
                calorie cost, and measure its effect on your weekly weight
                trend. If hunger is chronic across the whole week, {lv}{" "}
                calories may simply be below your real requirement — recalc
                instead of punishing yourself.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                How do I know the plan is working?
              </h3>
              <p className="mt-1.5 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                By the weekly trend, never the morning reading: weigh yourself
                under the same conditions and compare one week&apos;s average
                to the next. For fat loss, a sensible drop is 0.25–0.5 kg per
                week (slower at the lower levels because the margin is
                narrower); for maintenance, the average holds inside a
                one-kilogram band; for gaining, a rise of similar size. Two
                weeks with no movement despite honest adherence = adjust 100
                to 200 calories toward your goal.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                Is this system suitable for diabetes or hypertension?
              </h3>
              <p className="mt-1.5 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                The food itself — vegetables, legumes, protein, and healthy
                fats — closely resembles what dietary guidelines generally
                recommend, but the numbers (carbohydrates especially with
                diabetes, sodium with hypertension) are tuned individually
                with your physician, your medications, and your labs. This
                page is general planning for healthy adults, not a medical
                prescription: use it as an excellent discussion piece with
                your professional, never as a substitute.
              </p>
            </div>
            {/* PRIORITY-PAGES-2 (2026-10-19, audit §E-1): the customization
                route as an explicit question — the CTA card above carries the
                links; this Q&A states the three paths (manual planner grams,
                AI generation, EVO meal swaps) in the quotable FAQ format the
                page's other answers already use. */}
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                Can I customize this plan instead of following it as-is?
              </h3>
              <p className="mt-1.5 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                Yes, and that is the intended next step: open the meal
                planner and enter this plan&apos;s items at your own grams —
                the totals build live per meal and per day, and you adjust
                the grams until the day lands exactly on your target. For a
                regenerated day from your number, system, and preferences,
                the AI meal planner builds one in seconds, free for
                everyone. And with a subscription, EVO can swap any single
                meal inside your plan for a macro-matched equivalent without
                touching the rest of the day.
              </p>
            </div>
          </div>

          {/* ── Internal mesh: same level, other systems + same system, other levels ── */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            Related plans
          </h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
            At {lv} calories on another system:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIET_SYSTEMS.filter((s) => s.slug !== sys.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/diet-plan/${lv}/${s.slug}`}
                className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
              >
                {`${lv}-calorie ${s.nameEn}`}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-sm font-normal text-[var(--muted-foreground)]">
            The {sys.nameEn} system at another level:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIET_LEVELS.filter((l) => l !== lv).map((l) => (
              <Link
                key={l}
                href={`/diet-plan/${l}/${sys.slug}`}
                className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
              >
                {l}-calorie {sys.nameEn}
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm font-normal text-[var(--muted-foreground)]">
            <Link href="/diet-plan" className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
              The full library — every level and system
            </Link>
            {" · "}
            <Link href={url} className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
              This plan
            </Link>
          </p>
        </main>
      </div>
    </>
  );
}
