import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { MACRO_CALCULATOR_CONTENT } from "@/lib/content/macro-calculator";
import { BODY_FAT_CALCULATOR_CONTENT } from "@/lib/content/body-fat-calculator";

/**
 * SEO-GROWTH canaries (2026-11-05, owner order — P1 «الأسئلة الشائعة ذات
 * الصلة» + P2 «الأسئلة الشائعة والإفصاح الواضح»).
 *
 * WHAT THESE PIN:
 *   1. The numeric-value FAQ pattern — the measured GSC finding
 *      (PRIORITY-PAGES §A-4: "users search for THEIR numeric value",
 *      e.g. "27.0 bmi" @72) that the BMI page already serves — now
 *      extended to the macro and body-fat calculators. Two entries per
 *      tool, bilingual, and the arithmetic must match the pages' own
 *      documented constants (Atwater 4/4/9 · the category bands · the
 *      fat-mass formula).
 *   2. The affiliate-program FAQ (visible plain text on
 *      AffiliateProgramView) — facts pinned to the code's single
 *      sources: 20% (COMMISSION_RATE), $10 (MINIMUM_PAYOUT), 30-day
 *      cookie (COOKIE_DURATION_DAYS), 7-day refund hold (migration
 *      0062). No new claims beyond those.
 *   3. The for-coaches → affiliate internal link (owner order
 *      «إضافة روابط داخلية من المقالات والأدوات ذات الصلة» — the
 *      coach audience is the program's natural partner pool).
 */

describe("SEO-GROWTH P1: numeric-value FAQs on macro + body-fat tools", () => {
  it("macro calculator carries the percentages→grams conversion FAQ with the Atwater arithmetic", () => {
    const faqs = MACRO_CALCULATOR_CONTENT.faqs;
    const grams = faqs.find(
      (f) =>
        f.q.en === "What does 30/40/30 mean in grams on a 2,000-calorie day?",
    );
    expect(grams).toBeDefined();
    // Atwater arithmetic pinned (matches the page's documented 4/4/9):
    // protein 600 kcal ÷ 4 = 150 g · carbs 800 ÷ 4 = 200 g · fat 600 ÷ 9 ≈ 67 g
    expect(grams!.a.en).toContain("150 g");
    expect(grams!.a.en).toContain("200 g");
    expect(grams!.a.en).toContain("67 g");
    expect(grams!.a.ar).toContain("150 غراماً");
    expect(grams!.a.ar).toContain("67 غراماً");
  });

  it("macro calculator carries the g/kg → percentage bridging FAQ with the worked example", () => {
    const faqs = MACRO_CALCULATOR_CONTENT.faqs;
    const bridge = faqs.find(
      (f) =>
        f.q.en === "My coach says 2 g of protein per kg — what percentage is that?",
    );
    expect(bridge).toBeDefined();
    // 80 kg × 2 g/kg = 160 g = 640 kcal → 32% of 2,000 / 26.7% of 2,400
    expect(bridge!.a.en).toContain("640 kcal");
    expect(bridge!.a.en).toContain("26.7%");
    expect(bridge!.a.ar).toContain("640 سعرة");
    expect(bridge!.a.ar).toContain("26.7%");
  });

  it("body-fat calculator carries the band-interpretation FAQ with the sex-specific tables", () => {
    const faqs = BODY_FAT_CALCULATOR_CONTENT.faqs;
    const band = faqs.find(
      (f) => f.q.en === "What does 25% body fat mean?",
    );
    expect(band).toBeDefined();
    // The page's own documented bands: men Average 18–24%, women Average 25–31%
    expect(band!.a.en).toContain("18–24%");
    expect(band!.a.en).toContain("25–31%");
    expect(band!.a.ar).toContain("18–24%");
    expect(band!.a.ar).toContain("25–31%");
  });

  it("body-fat calculator carries the fat-mass arithmetic FAQ with the worked example", () => {
    const faqs = BODY_FAT_CALCULATOR_CONTENT.faqs;
    const mass = faqs.find(
      (f) =>
        f.q.en ===
        "How many kilograms of fat am I actually carrying at 25%?",
    );
    expect(mass).toBeDefined();
    // 80 kg × 0.25 = 20 kg fat / 60 kg lean; 25%→20% at 80 kg ≈ 76.2 kg
    expect(mass!.a.en).toContain("20 kg of fat");
    expect(mass!.a.en).toContain("76.2 kg");
    expect(mass!.a.ar).toContain("20 كيلوغرامًا من الدهون");
    expect(mass!.a.ar).toContain("76.2");
  });

  it("both tools now clear the ≥12 FAQ bar (the BMI page's own depth)", () => {
    expect(MACRO_CALCULATOR_CONTENT.faqs.length).toBeGreaterThanOrEqual(12);
    expect(BODY_FAT_CALCULATOR_CONTENT.faqs.length).toBeGreaterThanOrEqual(17);
  });
});

describe("SEO-GROWTH P2: affiliate program FAQ + internal links", () => {
  const view = readFileSync(
    "src/components/views/AffiliateProgramView.tsx",
    "utf8",
  );

  it("the affiliate view renders a visible FAQ section (both languages)", () => {
    expect(view).toContain("c.faq.title");
    expect(view).toContain("c.faq.items.map");
    // Rendered as always-visible h3+p (memberships-faq precedent — no
    // accordion state, nothing hidden from readers or answer engines).
    expect(view).toMatch(/<h3[^>]*>\s*\{f\.q\}/);
    expect(view).toMatch(/<p[^>]*>\s*\{f\.a\}/);
  });

  it("the FAQ copy carries the code-sourced facts in BOTH languages", () => {
    // AR block then EN block — each carries its own language's facts:
    // payout minimum ($10 / 10 دولارات), refund hold (7-day / سبعة أيام),
    // cookie window (30-day / 30 يوم). The 20% rate itself stays on the
    // commission cards (already pinned by the existing heroStats copy).
    const arFaqAt = view.indexOf('title: "الأسئلة الشائعة عن البرنامج"');
    const enFaqAt = view.indexOf('title: "Affiliate Program FAQ"');
    expect(arFaqAt).toBeGreaterThan(0);
    expect(enFaqAt).toBeGreaterThan(arFaqAt);
    const arBlock = view.slice(arFaqAt, enFaqAt);
    const enBlock = view.slice(enFaqAt);
    for (const needle of ["10 دولارات", "سبعة أيام", "30 يوم"]) {
      expect(arBlock, `AR FAQ missing: "${needle}"`).toContain(needle);
    }
    for (const needle of ["$10", "7-day", "30-day"]) {
      expect(enBlock, `EN FAQ missing: "${needle}"`).toContain(needle);
    }
  });

  it("no guaranteed-income or fabricated-testimonial phrasing entered with the FAQ", () => {
    // The page's honesty guardrails (header comment) stay binding.
    const enFaqAt = view.indexOf('title: "Affiliate Program FAQ"');
    const enBlock = view.slice(enFaqAt, view.indexOf("finalCta", enFaqAt));
    for (const banned of [
      "guaranteed income",
      "passive income guarantee",
      "get rich",
      "testimonials",
    ]) {
      expect(enBlock, `banned phrase: "${banned}"`).not.toContain(banned);
    }
  });

  it("for-coaches links the affiliate program in BOTH languages (one contextual line, not a banner)", () => {
    const page = readFileSync("src/app/(en)/for-coaches/page.tsx", "utf8");
    expect(page).toContain('href="/affiliate"');
    expect(page).toContain('href="/ar/affiliate"');
    expect(page).toContain("Alkemos Affiliate Program");
    expect(page).toContain("برنامج الأفلييت (الشركاء)");
    // The link stays a single contextual paragraph, not a CTA button.
    expect(page).not.toContain('href="/affiliate" className="btn-chrome');
  });
});
