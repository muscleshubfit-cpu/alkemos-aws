/**
 * ORGANIC-GROWTH-P1-D render proof (owner order 2026-11-20 — docs/
 * organic-growth-system-2026-11-18/10-prioritized-execution-roadmap.md):
 * the acceptance «جسر واحد لكل نتيجة» and the roadmap's chains
 * (BMI→calorie · body-fat→macro/coaching), proven on the RENDERED
 * MARKUP of the bridge component — exactly what a visitor's browser
 * mounts after a calculation (the card is result-gated by design: the
 * BMI message depends on the visitor's own number, so it never ships
 * in the crawler-facing server HTML — the crawl surface for the
 * destinations is carried by the hub, the footer and OtherTools).
 *
 * The repo's diet-plan-bridge-render.test.tsx precedent
 * (renderToStaticMarkup); next/link is stubbed at the seam (no Next
 * router under vitest) — the mock renders the plain <a href> a real
 * Link produces, so hrefs/texts/classes are asserted on real markup.
 */
import { describe, it, expect, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ToolChainResultBridge } from "@/components/ToolChainResultBridge";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children?: ReactNode;
  }) => createElement("a", { href, className }, children),
}));

const LATIN = /[A-Za-z]/;

function renderBmi(bmi: number, lang: "ar" | "en"): string {
  return renderToStaticMarkup(
    createElement(ToolChainResultBridge, {
      source: "bmi-calculator",
      bmi,
      lang,
    }),
  );
}

function renderBodyFat(lang: "ar" | "en"): string {
  return renderToStaticMarkup(
    createElement(ToolChainResultBridge, {
      source: "body-fat-calculator",
      lang,
    }),
  );
}

/** The visible text layer only (tags and hrefs stripped — hrefs are
 *  ASCII by design, the MSA law governs the text). */
function textOnly(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("ToolChainResultBridge render (P1-D — BMI → calorie calculator)", () => {
  it("an above-range result (27.5): the roadmap message + the calorie link, EN", () => {
    const html = renderBmi(27.5, "en");
    expect(html).toContain("Above the healthy range? Start with a targeted calorie plan");
    expect(html).toContain("The calorie calculator works out your daily target to reach a healthy weight");
    expect(html).toContain("ready-made day plans at the calorie level closest to that target");
    expect(html).toContain('href="/tools/calorie-calculator"');
    expect(html).toContain("Start with the calorie calculator");
    // ONE bridge, ONE link — no coaching line on the BMI chain.
    expect((html.match(/<a /g) || []).length).toBe(1);
    expect(html).not.toContain("coaching");
    expect(html).not.toContain("/ar/");
  });

  it("the same above-range result, AR — locale-native href and zero bare Latin in the text layer", () => {
    const html = renderBmi(27.5, "ar");
    expect(html).toContain("وزنك فوق المعدل الصحي؟ ابدأ بخطة سعرات مستهدفة");
    expect(html).toContain('href="/ar/tools/calorie-calculator"');
    expect(html).toContain("ابدأ بحاسبة السعرات");
    expect((html.match(/<a /g) || []).length).toBe(1);
    expect(LATIN.test(textOnly(html))).toBe(false);
  });

  it("a normal result (22) keeps the range; a below result (17.2) targets a surplus", () => {
    expect(renderBmi(22, "en")).toContain("In the healthy range — keep it there");
    expect(renderBmi(22, "ar")).toContain("وزنك داخل المعدل الصحي — حافظ عليه");
    expect(renderBmi(17.2, "en")).toContain(
      "Below the healthy range? Start with a targeted calorie plan",
    );
    expect(renderBmi(17.2, "en")).toContain("for gaining weight with a moderate surplus");
    // The destination never changes with the segment — ONE chain.
    expect(renderBmi(22, "en")).toContain('href="/tools/calorie-calculator"');
    expect(renderBmi(17.2, "en")).toContain('href="/tools/calorie-calculator"');
  });

  it("invalid numbers render nothing — never a broken section", () => {
    expect(renderBmi(0, "en")).toBe("");
    expect(renderBmi(-30, "ar")).toBe("");
    expect(renderBmi(Number.NaN, "en")).toBe("");
  });
});

describe("ToolChainResultBridge render (P1-D — body-fat → macro + coaching)", () => {
  it("the doc's message + BOTH destinations, EN", () => {
    const html = renderBodyFat("en");
    expect(html).toContain("Preserve muscle while losing fat");
    expect(html).toContain("Adequate protein intake can help preserve lean mass");
    expect(html).toContain("macro calculator");
    // The free-tool pill FIRST, then the quiet coaching line.
    expect(html).toContain('href="/tools/macro-calculator"');
    expect(html).toContain("Calculate your macros from your daily calories");
    expect(html).toContain('href="/coaching"');
    expect(html).toContain("Or let a personal coach guide you step by step with");
    expect(html).toContain("online coaching");
    // ONE bridge: exactly two anchors inside the single section.
    expect((html.match(/<a /g) || []).length).toBe(2);
    expect((html.match(/<section/g) || []).length).toBe(1);
    // The coaching link is the QUIET recipe, not a pill button.
    expect(html).toContain('class="font-medium underline underline-offset-4 hover:text-[var(--text)]"');
    expect(html).not.toContain("/ar/");
  });

  it("the same bridge, AR — locale-native hrefs and zero bare Latin in the text layer", () => {
    const html = renderBodyFat("ar");
    expect(html).toContain("حافظ على عضلاتك أثناء خسارة الدهون");
    expect(html).toContain("كمية مناسبة من البروتين يوميًا");
    expect(html).toContain('href="/ar/tools/macro-calculator"');
    expect(html).toContain("احسب توزيع الماكروز من سعراتك اليومية");
    expect(html).toContain('href="/ar/coaching"');
    expect(html).toContain("أو دع مدربًا خاصًا يرافقك خطوة بخطوة عبر");
    expect(html).toContain("التدريب الأونلاين");
    expect((html.match(/<a /g) || []).length).toBe(2);
    expect(LATIN.test(textOnly(html))).toBe(false);
  });

  it("honesty (owner review 2026-11-20): the rendered bridge states the general protein fact — never measured, no lean-mass-derived need, no weight-based macro claim", () => {
    const en = textOnly(renderBodyFat("en"));
    expect(en).toContain("Adequate protein intake can help preserve lean mass during fat loss");
    expect(en).toContain("distributes your daily calories among protein, carbohydrates, and fats");
    expect(en).not.toMatch(/\bmeasur/);
    expect(en).not.toContain("your weight");
    expect(en).not.toContain("lean mass needs");
    const ar = textOnly(renderBodyFat("ar"));
    expect(ar).toContain("كمية مناسبة من البروتين يوميًا");
    expect(ar).toContain("توزيع سعراتك اليومية على جرامات");
    expect(ar).not.toContain("قِست");
    expect(ar).not.toContain("بوزنك");
    expect(ar).not.toContain("تحتاج بروتين");
  });
});
