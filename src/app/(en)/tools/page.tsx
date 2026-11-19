"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageBanner } from "@/components/PageBanner";
import { EngravedIcon } from "@/components/ThemeImg";
// Phase 195 (owner directive «الرقم الحقيقي للأدوات هو 8، وليس 5» + dynamic
// counts): the hub arrays moved to src/lib/tools-shared.ts — the single
// source that also feeds the homepage «8+ Tools» proof chip. Same render.
import { TOOLS, TOOL_LIBRARIES } from "@/lib/tools-shared";
// ORGANIC-GROWTH-P0-B (owner order 2026-11-19 — roadmap 10/P0-B + 07-§2):
// the starting-lane sentences render from segment data so every tool they
// name is a real crawlable <Link> (was plain text — the intent routing was
// invisible to crawlers and cost a navigation step). Same sentences.
import { STARTING_LANES } from "@/lib/tools-hub-starting-paths";

// Phase 127 «Marble & Chrome» identity: engraved icon pairs (mission §6
// zero-emoji law) replace the old Apple-style emoji-fallback tiles.
//
// §12.33 (owner directive «انقل خطط غذائيه جاهزة الى المكتبات باسم مكتبة
// الخطط الغذاييه الجاهزه»): the hub now renders TWO clusters — the tools,
// then the content libraries under their own labeled section.

const tools = TOOLS;
const libraries = TOOL_LIBRARIES;

export default function ToolsPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        {/* Owner artwork page banner (Phase 127: the 12 header images are
            PAGE banners, not homepage section banners) */}
        <PageBanner section="tools" className="mb-10" />

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "الأدوات المجانية" : "Free Tools"}
          </h1>
          {/* PRIORITY-PAGES Implementation 5 (2026-10-19, audit §A-1 +
              Improvement 5 — owner-approved frame): the hub carried ~50
              words with no methodology — it is the institutional entry
              point of the cluster that holds 75% of the site's measured
              impression footprint. The intro chains the loop the tools
              actually serve (calculate → split → plan → generate →
              track); every number is code-verified (TOOLS_COUNT = 8,
              FOODS_COUNT = 8,162+, tools-shared.ts). It also closes the
              §2.6 finding of the 2026-09-28 content audit — the one
              item of its family that never got a remediation row. */}
          <p className="mx-auto mt-3 max-w-md text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "أدوات لياقة وتغذية مجانية — جرّبها فورًا."
              : "Free fitness and nutrition tools — free to try."}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm font-normal leading-relaxed text-[var(--muted-foreground)] md:max-w-3xl md:text-base">
            {isAr
              ? "الأرقام أولًا: كل تغيير حقيقي في جسمك يبدأ بمعرفة أرقامك — كم تحرق، وكيف توزّعها، وماذا تقيس. أدوات Alkemos الثماني المجانية تحسبها لك كاملة: ابدأ بحاسبة السعرات لتعرف رقمك اليومي، وزّعه بالماكروز، ابنِ يومك في مخطط الوجبات من قاعدة 8,162+ صنفًا غذائيًا — كل ذلك دون حاجة إلى حساب — ثم تابع دهون جسمك وماءك حتى تصل. ولتوليد الخطة كاملة بالذكاء الاصطناعي في ثوانٍ فهو متاح لمشتركي بريميوم وأعلى."
              : "Numbers first: every real change in your body starts with knowing your numbers — how much you burn, how you split them, and what you track. Alkemos' eight free tools calculate them all, no account needed: start with the Calorie Calculator for your daily number, split it with the Macro Calculator, build your day in the manual Meal Planner from 8,162+ foods — then track body fat and water on the way. Generating the full plan with AI in seconds is available to subscribers (Premium and above)."}{" "}
            {/* P0-B (07-§2 row 4): ONE contextual commercial bridge exactly where
                the Premium+ sentence names the subscription — «ما الذي يضيفه
                الاشتراك؟». The one-CTA law: this is the ONLY memberships
                link in the hub body (07-§4.2 — no second bridge anywhere). */}
            <Link
              href={isAr ? "/ar/memberships" : "/memberships"}
              className="font-medium text-[#0071e3] hover:underline"
            >
              {isAr ? "ما الذي يضيفه الاشتراك؟" : "What does the subscription add?"}
            </Link>
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} isAr={isAr} />
          ))}
        </div>

        {/* PRIORITY-PAGES Implementation 5 (2026-10-19, audit §A-1): the
            "where do I start?" guide — the audit's second gap for this
            hub (a card index with no intent routing). Three goal lanes,
            each pointing at the tool(s) that serve it; every destination
            exists in TOOLS/TOOL_LIBRARIES (tools-shared.ts) or the
            verified program library (workout-programs.ts).
            ORGANIC-GROWTH-P0-B (2026-11-19): the lane sentences render from
            segment data (tools-hub-starting-paths.ts) — every tool a sentence
            names is a real crawlable <Link> (language-aware href), the
            sentence itself byte-identical. Soft-nav via next/link. */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "من أين تبدأ؟" : "Where do you start?"}
          </h2>
          <p className="mt-2 max-w-md text-sm font-normal text-[var(--muted-foreground)]">
            {isAr
              ? "حدد هدفك، والقائمة التالية تأخذك لأداتك الأولى مباشرة:"
              : "Pick your goal, and the list below takes you straight to your first tool:"}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STARTING_LANES.map((lane) => (
              <div key={lane.goalEn} className="marble-card p-6">
                <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                  {isAr ? lane.goalAr : lane.goalEn}
                </h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {(isAr ? lane.segAr : lane.segEn).map((seg, i) =>
                    seg.href ? (
                      <Link
                        key={i}
                        href={isAr ? `/ar${seg.href}` : seg.href}
                        className="font-medium text-[#0071e3] hover:underline"
                      >
                        {seg.text}
                      </Link>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    )
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* §12.33: the libraries cluster — its own labeled section (owner
            directive «انقل خطط غذائيه جاهزة الى المكتبات»). */}
        <h2 className="mt-12 text-2xl font-semibold tracking-tight md:text-3xl">
          {isAr ? "المكتبات" : "Libraries"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm font-normal text-[var(--muted-foreground)]">
          {isAr
            ? "محتوى جاهز للتصفح: خطط وتمارين وأطعمة."
            : "Ready-to-browse content: plans, exercises, and foods."}
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {libraries.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} isAr={isAr} />
          ))}
        </div>
      </main>

        {/* Access-point fix (2026-09-14): shared marble footer — this
            public page now carries the same persistent link grid as the
            homepage (SiteFooter component). */}
        <SiteFooter />
    </div>
  );
}

function ToolCard({ tool, isAr }: { tool: (typeof tools)[number]; isAr: boolean }) {
  // SEO-GEO-4 (2026-09-08): every tool has an Arabic mirror — /ar/tools/*
  // + /ar/meal-planner. AR renders of this hub must link to the AR URLs.
  const href = isAr
    ? tool.slug.startsWith("/")
      ? `/ar${tool.slug}`
      : `/ar/tools/${tool.slug}`
    : tool.slug.startsWith("/")
      ? tool.slug
      : `/tools/${tool.slug}`;
  return (
    <a
      href={href}
      className="marble-card group flex items-center gap-4 p-6 transition-transform duration-300 hover:-translate-y-0.5"
    >
      {/* Engraved icon pair (Phase 127 identity — replaces emoji tiles) */}
      <EngravedIcon
        name={tool.icon}
        alt={isAr ? tool.nameAr : tool.nameEn}
        size={56}
        className="h-14 w-14 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
          {isAr ? tool.nameAr : tool.nameEn}
        </h3>
        <p className="mt-1 text-sm font-normal text-[var(--muted-foreground)]">
          {isAr ? tool.descAr : tool.descEn}
        </p>
      </div>
      {/* Chrome arrow (mission §6) */}
      <span className="chrome-text shrink-0 text-2xl font-semibold" aria-hidden="true">
        ›
      </span>
    </a>
  );
}
