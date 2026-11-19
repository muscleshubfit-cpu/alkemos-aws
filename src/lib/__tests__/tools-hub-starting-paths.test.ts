import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import {
  STARTING_LANES,
  STARTING_LANE_LINK_COUNTS,
} from "@/lib/tools-hub-starting-paths";

/**
 * ORGANIC-GROWTH-P0-B canary (owner order «نفّذ البنود بالترتيب» — roadmap
 * docs/organic-growth-system-2026-11-18/10-prioritized-execution-roadmap.md
 * P0-B + 07-§2 matrix rows 3-4): the tools-hub «Where do you start?» lanes
 * were guidance TEXT with no links — the hub's most successful conversion
 * section was invisible to crawlers and cost every visitor a navigation
 * step (the audit's dead-commercial-node #2).
 *
 * What this canary pins (roadmap acceptance, field by field):
 *
 *   1) TEXT PRESERVED — each lane's segments re-concatenate to the
 *      BYTE-IDENTICAL original sentence («نص المسار الحالي نفسه» —
 *      07-§2): the constants below are the pre-change sentences from
 *      the repo history; any drift fails CI.
 *   2) EVERY NAMED TOOL LINKED — each lane links exactly the tools its
 *      sentence names, to the tool's real route (fat loss: calorie →
 *      macro → body-fat → water · muscle: macro → calorie → AI workout →
 *      programs · health: bmi → body-fat → water).
 *   3) ≥8 NEW LINKS PER LANGUAGE — the roadmap's verification bar
 *      («لقطة DOM: ≥8 روابط جديدة بالمركز ×2 لغة»); AR and EN carry the
 *      SAME link count (the bilingual source renders both trees).
 *   4) REAL ROUTES ONLY — every segment href resolves to an existing
 *      page.tsx in the (en) tree AND its /ar mirror (SEO-GEO-4 law).
 *   5) ONE CONTEXTUAL COMMERCIAL BRIDGE — exactly ONE memberships
 *      <Link> in the hub body, on the Premium+ sentence, with the
 *      07-§2-documented text «ما الذي يضيفه الاشتراك؟» /
 *      "What does the subscription add?" (the one-CTA law — 07-§4.2).
 *   6) SSR — the lanes render inside static JSX (no client-state gate),
 *      so the links ship in the server HTML of /tools and /ar/tools.
 */

// The pre-change lane sentences (byte-exact from the repo history —
// the text-preservation contract; a segmented rewrite may not drift).
const ORIGINAL_SENTENCES = [
  {
    goalEn: "Your goal is fat loss",
    ar: "ابدأ بحاسبة السعرات لتعرف رقمك اليومي، ثم وزّعه بالماكروز، وتابع التقدم بحاسبة الدهون ومتتبع الماء.",
    en: "Start with the Calorie Calculator for your daily number, split it with the Macro Calculator, and follow progress with the Body Fat Calculator and the Water Tracker.",
  },
  {
    goalEn: "Your goal is building muscle",
    ar: "ابدأ بالماكروز (بروتينك أولًا) بجانب حاسبة السعرات، وولّد تقسيمتك من مخطط التمارين بالذكاء الاصطناعي أو من برامج التدريب الجاهزة.",
    en: "Start with the Macro Calculator (your protein first) alongside the Calorie Calculator, and generate your split from the AI Workout Planner or the ready programs.",
  },
  {
    goalEn: "You're starting with general health",
    ar: "قياس سريع في دقائق: مؤشر الكتلة، ثم نسبة الدهون، ثم عادة الماء اليومية — ثلاث أدوات ترسم لك صورة واضحة منذ اليوم الأول.",
    en: "A quick three-minute reading: the BMI Calculator, then Body Fat, then the daily water habit — three tools that give you a clear picture on day one.",
  },
] as const;

// The lane → named-tool href map (acceptance: «كل مسار يربط لأداته
// المذكورة») — in the lane's own logical order (07-§2: T1→T3→T4→T5).
const EXPECTED_LANE_HREFS: Record<string, string[]> = {
  "Your goal is fat loss": [
    "/tools/calorie-calculator",
    "/tools/macro-calculator",
    "/tools/body-fat-calculator",
    "/tools/water-tracker",
  ],
  "Your goal is building muscle": [
    "/tools/macro-calculator",
    "/tools/calorie-calculator",
    "/ai-workout-planner",
    "/programs",
  ],
  "You're starting with general health": [
    "/tools/bmi-calculator",
    "/tools/body-fat-calculator",
    "/tools/water-tracker",
  ],
};

const HUB_PAGE = "src/app/(en)/tools/page.tsx";
const read = (p: string) => readFileSync(p, "utf8");

describe("ORGANIC-GROWTH-P0-B — the tools-hub starting lanes carry crawlable links", () => {
  it("the three lanes exist and their goal headings are unchanged", () => {
    expect(STARTING_LANES.map((l) => l.goalEn)).toEqual(
      ORIGINAL_SENTENCES.map((s) => s.goalEn),
    );
    expect(STARTING_LANES.map((l) => l.goalAr)).toEqual([
      "هدفك خسارة الدهون",
      "هدفك بناء العضل",
      "هدفك الصحة العامة",
    ]);
  });

  it("the lane sentences are BYTE-IDENTICAL to the pre-change texts (نص المسار الحالي نفسه)", () => {
    for (const lane of STARTING_LANES) {
      const original = ORIGINAL_SENTENCES.find((s) => s.goalEn === lane.goalEn)!;
      expect(
        lane.segAr.map((s) => s.text).join(""),
        `AR sentence drifted for lane «${lane.goalEn}»`,
      ).toBe(original.ar);
      expect(
        lane.segEn.map((s) => s.text).join(""),
        `EN sentence drifted for lane «${lane.goalEn}»`,
      ).toBe(original.en);
    }
  });

  it("every tool a lane names is linked to its real route, in the lane's logical order (كل مسار يربط لأداته المذكورة)", () => {
    for (const lane of STARTING_LANES) {
      const hrefsAr = lane.segAr.filter((s) => s.href).map((s) => s.href!);
      const hrefsEn = lane.segEn.filter((s) => s.href).map((s) => s.href!);
      const expected = EXPECTED_LANE_HREFS[lane.goalEn];
      expect(hrefsAr, `AR lane «${lane.goalEn}» hrefs`).toEqual(expected);
      expect(hrefsEn, `EN lane «${lane.goalEn}» hrefs`).toEqual(expected);
    }
  });

  it("≥8 crawlable lane links per language — the roadmap's verification bar (×2 languages)", () => {
    expect(STARTING_LANE_LINK_COUNTS.ar).toBeGreaterThanOrEqual(8);
    expect(STARTING_LANE_LINK_COUNTS.en).toBeGreaterThanOrEqual(8);
    // Both trees carry the SAME count (one bilingual source, 11 links).
    expect(STARTING_LANE_LINK_COUNTS.ar).toBe(STARTING_LANE_LINK_COUNTS.en);
    expect(STARTING_LANE_LINK_COUNTS.en).toBe(11);
  });

  it("every lane href is a REAL route in the EN tree AND has its /ar mirror (SEO-GEO-4)", () => {
    const seen = new Set<string>();
    for (const lane of STARTING_LANES) {
      for (const seg of [...lane.segAr, ...lane.segEn]) {
        if (!seg.href) continue;
        seen.add(seg.href);
      }
    }
    expect(seen.size).toBe(7); // calorie · macro · body-fat · water · bmi · ai-workout · programs
    for (const href of seen) {
      expect(existsSync(`src/app/(en)${href}/page.tsx`), `EN route missing: ${href}`).toBe(true);
      expect(existsSync(`src/app/(ar)/ar${href}/page.tsx`), `AR mirror missing: ${href}`).toBe(true);
    }
  });

  it("the hub renders the lanes as real <Link>s with language-aware hrefs (soft-nav, /ar prefix on the AR tree)", () => {
    const src = read(HUB_PAGE);
    expect(src).toContain('import Link from "next/link";');
    expect(src).toContain('from "@/lib/tools-hub-starting-paths"');
    expect(src).toContain("STARTING_LANES.map");
    // The language-aware lane href: the AR tree renders /ar/* mirrors.
    expect(src).toContain("href={isAr ? `/ar${seg.href}` : seg.href}");
    // The lane paragraph keeps its classes (zero visual change).
    expect(src).toContain(
      '"mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]"',
    );
    expect(src).toContain('"marble-card p-6"');
    // The lanes render inside static JSX — no client-state gate around them
    // (SSR crawlability by construction; matches the §6 canary style).
    expect(src).not.toMatch(/\{\w+ && \(\s*<section className="mt-12">/);
  });

  it("exactly ONE contextual memberships bridge — on the Premium+ sentence, with the 07-§2 texts (قانون CTA واحد)", () => {
    const src = read(HUB_PAGE);
    // The one bridge: language-aware href + the documented text pair.
    expect(src).toContain('href={isAr ? "/ar/memberships" : "/memberships"}');
    expect(src).toContain('"ما الذي يضيفه الاشتراك؟"');
    expect(src).toContain('"What does the subscription add?"');
    // ONE memberships link in the body — the ternary appears exactly once
    // (any second bridge breaks the one-CTA law 07-§4.2).
    expect(
      src.split('href={isAr ? "/ar/memberships" : "/memberships"}').length - 1,
    ).toBe(1);
    // The intro paragraph that carries the Premium+ sentence still ships
    // byte-identical (the bridge appends after it, never rewrites it).
    expect(src).toContain("متاح لمشتركي بريميوم وأعلى");
    expect(src).toContain("(Premium and above)");
  });

  it("the AR mirror re-exports the bilingual EN hub — one source renders both trees", () => {
    const mirror = read("src/app/(ar)/ar/tools/page.tsx");
    expect(mirror).toContain('export { default } from "@/app/(en)/tools/page";');
  });
});
