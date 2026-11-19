import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * ORGANIC-GROWTH-P0-A canary (owner order 2026-11-19 «ابدأ تنفيذ أول بند
 * في خارطة التنفيذ» — docs/organic-growth-system-2026-11-18/
 * 10-prioritized-execution-roadmap.md): the strongest commercial bridge on
 * the site (tools → /memberships) must be a REAL crawlable <a> that ships
 * in the SERVER HTML of all 12 tool pages (6 routes × 2 languages — the
 * AR mirrors re-export these bilingual EN sources).
 *
 * What F-1 measured before this frame: the calculators' CTA was a
 * result-gated JS button (`onClick={() => navigate("memberships")}`) —
 * absent from the server HTML entirely (verified live 2026-11-19: the CTA
 * text appeared 0 times in view-source on EN+AR calorie pages), and
 * water-tracker/meal-planner had NO visible commercial element at all
 * (their navigate("memberships") lived inside Premium+ toast gates in
 * event handlers — the roadmap's «12 مواضع أزرار» premise was 8 visible
 * buttons + 2 handler-level gates ×2 languages).
 *
 * This canary pins, per page source:
 *   1) CRAWLABLE LINK — <Link href={isAr ? "/ar/memberships" :
 *      "/memberships"}> exists, so the AR tree server-renders the AR
 *      mirror URL and the EN tree the EN URL (urlLocale-resolved isAr —
 *      the OtherTools precedent, not a bounce back to EN).
 *   2) UNIFIED TEXT — ONE anchor pair for all 12 pages: AR «احصل على خطة
 *      مخصصة ›» / EN «Get a personalized plan ›» (roadmap acceptance:
 *      «نص واحد موحد لكل لغة»).
 *   3) ZERO-VISUAL-CHANGE — the anchor keeps the exact button classes
 *      `mt-4 btn-chrome px-6 py-2.5 text-sm` inside the same CTA card
 *      (`rounded-3xl border … p-6 text-center`).
 *   4) SSR CRAWLABILITY — the Link must NOT live inside a client-state
 *      gate. Calculators: the results container is split AROUND the CTA
 *      (exactly two `{result && (` gates, the Link between them → it
 *      renders with no result, i.e. in the server HTML, while the visual
 *      order after a calculation is unchanged — value first, law 413).
 *      water-tracker/meal-planner: zero result gates — the card is
 *      static JSX.
 *   5) NO JS BRIDGE LEFT on the calculators: zero `navigate(` calls
 *      (useNav removed) — the crawlable Link is the ONLY bridge.
 *      water-tracker/meal-planner KEEP their functional Premium+ toast
 *      gates (auth + memberships) — those are behavior, not crawl
 *      surface, and are pinned as preserved.
 */

const CALCULATORS = [
  "src/app/(en)/tools/calorie-calculator/page.tsx",
  "src/app/(en)/tools/bmi-calculator/page.tsx",
  "src/app/(en)/tools/macro-calculator/page.tsx",
  "src/app/(en)/tools/body-fat-calculator/page.tsx",
] as const;

const GATED_TOOLS = [
  "src/app/(en)/tools/water-tracker/page.tsx",
  "src/app/(en)/meal-planner/page.tsx",
] as const;

// ORGANIC-GROWTH-P1-E (2026-11-20 — owner roadmap order, 01-§6):
// water-tracker's client-side DB-save gate («Premium+ only») contradicted
// the plans table (memberships.ts grants EVERY member saves; the server
// enforces that quota) and was REMOVED. The save is plan-quota now — the
// only save-limit message is the shared server «Save limit reached (N)»
// (pinned in water-tracker-p1e.test.ts). meal-planner's gate is a REAL
// per-plan entitlement (limits.mealPlannerExport) and stays gated.
const STILL_GATED = ["src/app/(en)/meal-planner/page.tsx"] as const;
const P1E_UNGATED = ["src/app/(en)/tools/water-tracker/page.tsx"] as const;

const AR_MIRRORS = [
  "src/app/(ar)/ar/tools/calorie-calculator/page.tsx",
  "src/app/(ar)/ar/tools/bmi-calculator/page.tsx",
  "src/app/(ar)/ar/tools/macro-calculator/page.tsx",
  "src/app/(ar)/ar/tools/body-fat-calculator/page.tsx",
  "src/app/(ar)/ar/tools/water-tracker/page.tsx",
  "src/app/(ar)/ar/meal-planner/page.tsx",
] as const;

const ALL_TOOL_PAGES = [...CALCULATORS, ...GATED_TOOLS] as const;

// The ONE unified anchor pair (roadmap acceptance: one text per language).
const CTA_AR = "احصل على خطة مخصصة ›";
const CTA_EN = "Get a personalized plan ›";
// The language-aware crawlable href (renders /ar/memberships on the AR tree).
const CTA_HREF = 'href={isAr ? "/ar/memberships" : "/memberships"}';
// The exact button recipe the anchor must keep (zero visual change).
const CTA_CLASSES = 'className="mt-4 btn-chrome px-6 py-2.5 text-sm"';

const read = (p: string) => readFileSync(p, "utf8");

describe("ORGANIC-GROWTH-P0-A — crawlable commercial CTAs on the 12 tool pages", () => {
  it.each(ALL_TOOL_PAGES)("the crawlable memberships Link exists with the unified texts and the button recipe (%s)", (file) => {
    const src = read(file);
    // The link (not a button) — real <a href> in the server HTML.
    expect(src).toContain('import Link from "next/link";');
    expect(src).toContain(CTA_HREF);
    // ONE unified pair: the AR and the EN anchor texts, exactly once each.
    expect(src.split(CTA_AR).length - 1).toBe(1);
    expect(src.split(CTA_EN).length - 1).toBe(1);
    // The anchor keeps the exact chrome-button classes + the same card.
    expect(src).toContain(CTA_CLASSES);
    expect(src).toContain("rounded-3xl border border-[var(--edge)] bg-[var(--tint)] p-6 text-center");
    // The bilingual page resolves its tree via the server-resolved locale.
    expect(src).toContain('const isAr = lang === "ar";');
  });

  it.each(CALCULATORS)("the old JS bridge is GONE — zero navigate() calls, and the Link ships OUTSIDE the result gate (server HTML) (%s)", (file) => {
    const src = read(file);
    // useNav is removed entirely — the crawlable Link is the only bridge.
    expect(src).not.toContain("navigate(");
    expect(src).not.toContain('from "@/hooks/use-nav"');
    // SSR crawlability: the results container is split AROUND the CTA —
    // exactly two result gates, and the Link sits BETWEEN them (renders
    // with no result → present in the server HTML; after a calculation
    // the visual order is unchanged).
    const gates = [...src.matchAll(/\{result && \(/g)];
    expect(gates.length).toBe(2);
    const linkIdx = src.indexOf(CTA_HREF);
    expect(linkIdx).toBeGreaterThan(gates[0].index!);
    expect(linkIdx).toBeLessThan(gates[1].index!);
  });

  it.each(STILL_GATED)("the functional Premium+ toast gates are PRESERVED (behavior, not crawl surface) (%s)", (file) => {
    const src = read(file);
    // The handler-level gates stay: auth navigation + the memberships
    // upgrade navigation after the toast (meal-planner JSON export).
    // Removing them would change behavior.
    expect(src).toContain('navigate("auth", { mode: "login" })');
    expect(src).toContain('navigate("memberships");');
    expect(src).toContain('from "@/hooks/use-nav"');
    // And the page carries NO result gate — the new CTA card is static
    // JSX, so it is server-rendered by construction.
    expect(src).not.toContain("{result && (");
  });

  it.each(P1E_UNGATED)("P1-E: the contradictory save gate is GONE — plan-quota save; auth nav + use-nav preserved (%s)", (file) => {
    const src = read(file);
    // The login navigation stays (save still requires an account), and
    // the use-nav wiring with it; the memberships toast gate is gone and
    // the P0-A crawlable CTA card is the page's commercial bridge.
    expect(src).toContain('navigate("auth", { mode: "login" })');
    expect(src).not.toContain('navigate("memberships");');
    expect(src).toContain('from "@/hooks/use-nav"');
    expect(src).not.toContain("{result && (");
  });

  it("the AR mirrors re-export the bilingual EN twins — 6 sources = 12 crawlable pages", () => {
    const pairs: Array<[string, string]> = [
      ["src/app/(ar)/ar/tools/calorie-calculator/page.tsx", "@/app/(en)/tools/calorie-calculator/page"],
      ["src/app/(ar)/ar/tools/bmi-calculator/page.tsx", "@/app/(en)/tools/bmi-calculator/page"],
      ["src/app/(ar)/ar/tools/macro-calculator/page.tsx", "@/app/(en)/tools/macro-calculator/page"],
      ["src/app/(ar)/ar/tools/body-fat-calculator/page.tsx", "@/app/(en)/tools/body-fat-calculator/page"],
      ["src/app/(ar)/ar/tools/water-tracker/page.tsx", "@/app/(en)/tools/water-tracker/page"],
      ["src/app/(ar)/ar/meal-planner/page.tsx", "@/app/(en)/meal-planner/page"],
    ];
    expect(AR_MIRRORS.length).toBe(pairs.length);
    for (const [mirror, enPath] of pairs) {
      expect(read(mirror)).toContain(`export { default } from "${enPath}";`);
    }
  });

  it("the CTA anchor text pair is byte-identical across all six page sources (one text per language)", () => {
    const arTexts = new Set<string>();
    const enTexts = new Set<string>();
    for (const file of ALL_TOOL_PAGES) {
      const m = read(file).match(/\{isAr \? ("[^"]+") : ("[^"]+")\}/);
      // The CTA line is the only isAr ternary carrying the › chevron.
      const src = read(file);
      const cta = src.match(/\{isAr \? ([^}]*›[^}]*) : ([^}]*›[^}]*)\}/);
      expect(cta, `${file} lost its CTA text pair`).toBeTruthy();
      arTexts.add(cta![1]);
      enTexts.add(cta![2]);
      expect(m).toBeTruthy();
    }
    expect(arTexts.size).toBe(1);
    expect(enTexts.size).toBe(1);
  });
});
