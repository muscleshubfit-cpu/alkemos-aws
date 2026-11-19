/**
 * ORGANIC-GROWTH-P0-C render proof (owner order 2026-11-19 — docs/
 * organic-growth-system-2026-11-18/10-prioritized-execution-roadmap.md):
 * the roadmap's pinned verification «حساب 2,050 سعرة يعرض خلايا 2000» and
 * the acceptance «كل نتيجة سعرات تعرض ≥2 خلايا صحيحة رياضيًا × اللغتين»,
 * proven on the RENDERED MARKUP of the bridge component — exactly what a
 * visitor's browser mounts after a calculation (the card is result-gated
 * by design: the links depend on the visitor's own number, so it never
 * ships in the crawler-facing server HTML — unlike the P0-A CTA).
 *
 * The repo's tool-article-links-render.test.tsx precedent
 * (renderToStaticMarkup); next/link is stubbed at the seam (no Next
 * router under vitest) — the mock renders the plain <a href> a real
 * Link produces, so hrefs/texts/classes are asserted on real markup.
 */
import { describe, it, expect, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DietPlanResultBridge } from "@/components/DietPlanResultBridge";

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

function render(calories: number, lang: "ar" | "en"): string {
  return renderToStaticMarkup(
    createElement(DietPlanResultBridge, {
      calories,
      lang,
      source: "calorie-calculator",
    }),
  );
}

describe("DietPlanResultBridge render (P0-C — النتيجة → الخلايا الجاهزة)", () => {
  it("the roadmap's pinned example: 2,050 → the 2000 cells, EN", () => {
    const html = render(2050, "en");
    // The four 2000-level cells, all four systems.
    expect(html).toContain('href="/diet-plan/2000/balanced"');
    expect(html).toContain('href="/diet-plan/2000/high-protein"');
    expect(html).toContain('href="/diet-plan/2000/keto"');
    expect(html).toContain('href="/diet-plan/2000/vegetarian"');
    // ≥2 mathematically correct cells — the acceptance floor is 2; the
    // bridge ships all 4.
    expect((html.match(/href="\/diet-plan\/2000\//g) || []).length).toBe(4);
    // No OTHER level leaks into the links.
    expect(html).not.toMatch(/href="\/diet-plan\/(?!2000)\d/);
    // The card states the matched level and the legal acceptance text.
    expect(html).toContain("The nearest published level to your result: 2000 calories a day.");
    expect(html).toContain("A full day plan at your calories");
    expect(html).toContain("2000-calorie Balanced plan");
    expect(html).toContain("2000-calorie High-Protein plan");
    expect(html).toContain("2000-calorie Keto plan");
    expect(html).toContain("2000-calorie Vegetarian plan");
    expect(html).toContain(
      "The ready-made plans are published at fixed levels (1200–3000 calories)",
    );
  });

  it("the same 2,050 → the 2000 cells, AR — locale-native hrefs and zero bare Latin in the text layer", () => {
    const html = render(2050, "ar");
    expect(html).toContain('href="/ar/diet-plan/2000/balanced"');
    expect(html).toContain('href="/ar/diet-plan/2000/high-protein"');
    expect(html).toContain('href="/ar/diet-plan/2000/keto"');
    expect(html).toContain('href="/ar/diet-plan/2000/vegetarian"');
    expect((html.match(/href="\/ar\/diet-plan\/2000\//g) || []).length).toBe(4);
    expect(html).toContain("أقرب مستوى منشور لنتيجتك: 2000 سعرة في اليوم.");
    expect(html).toContain("خطة يوم كاملة بسعراتك");
    expect(html).toContain("خطة 2000 سعرة — متوازن");
    expect(html).toContain("خطة 2000 سعرة — عالي البروتين");
    expect(html).toContain("خطة 2000 سعرة — كيتو");
    expect(html).toContain("خطة 2000 سعرة — نباتي");
    expect(html).toContain("الخطط الجاهزة تُنشر بمستويات ثابتة (1200–3000 سعرة)");
    // The AR TEXT layer carries no Latin letters (hrefs are ASCII by
    // design — assert over the text only, the tool-surface MSA law).
    const textOnly = html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    expect(LATIN.test(textOnly)).toBe(false);
  });

  it("a 1,100-calorie result clamps to the 1200 cells (never below the published floor)", () => {
    const html = render(1100, "en");
    expect((html.match(/href="\/diet-plan\/1200\//g) || []).length).toBe(4);
    expect(html).toContain("The nearest published level to your result: 1200 calories a day.");
  });

  it("a 4,200-calorie result clamps to the 3000 cells (the published ceiling)", () => {
    const html = render(4200, "en");
    expect((html.match(/href="\/diet-plan\/3000\//g) || []).length).toBe(4);
    expect(html).toContain("The nearest published level to your result: 3000 calories a day.");
  });

  it("a tie at 2,250 rounds UP to the 2500 cells", () => {
    const html = render(2250, "en");
    expect((html.match(/href="\/diet-plan\/2500\//g) || []).length).toBe(4);
  });

  it("invalid numbers render nothing — never a broken section", () => {
    expect(render(0, "en")).toBe("");
    expect(render(-30, "ar")).toBe("");
    expect(render(Number.NaN, "en")).toBe("");
  });
});
