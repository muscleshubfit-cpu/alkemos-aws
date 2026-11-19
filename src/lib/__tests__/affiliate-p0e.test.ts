import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AFFILIATE_FAQ } from "@/lib/affiliate-faq";
// the SAME builders the layouts call — the canary verifies the exact
// JSON-LD shape the crawler receives
import { getFAQSchema, getBreadcrumbSchema } from "@/lib/seo";

/**
 * ORGANIC-GROWTH-P0-E — the affiliate-page canary
 * (roadmap docs/organic-growth-system-2026-11-18/10 §P0-E):
 *
 * The five solution fields enforced as automated checks:
 *   1. «توحيد 20%/$10 بالنسختين» — the EN meta description gains the two
 *      strongest numbers (F-8: the AR twin had 20% + 10$, EN had none);
 *      «النصان متطابقان رقميًا» (field 9) = both descriptions AND both
 *      FAQ arrays carry the same number set.
 *   2. FAQPage (4-6 أسئلة: العمولة/الصرف/الكوكيز/التحويلات المؤهلة) —
 *      emitted by BOTH language layouts from the SAME single source the
 *      page renders (src/lib/affiliate-faq.ts — the memberships-faq.ts
 *      precedent: schema == visible, byte-identical).
 *   3. BreadcrumbList — both layouts, RELATIVE urls (getBreadcrumbSchema
 *      prefixes the site origin; an absolute url doubles it — the live
 *      defect class documented in report 18 §6 for for-coaches /
 *      macro-tracker, out of P0-E scope).
 *   4. «تحويل أزرار القسمين الأول والأخير إلى روابط» — the hero primary
 *      + final CTA are real crawlable <Link>s with the state-dependent
 *      href; the member clipboard behavior is preserved byte-faithfully
 *      via the onClick interception (the CTA-CRAWLABILITY secondary
 *      pattern extended to the mixed button).
 *   5. «رابطان واردان (memberships/coaching → «برنامج الشركاء»)» — ONE
 *      muted crawlable channel link in each page's commercial end-zone,
 *      language-aware (SEO-GEO-4).
 *
 * Previous-fix preservation pinned here: the CTA-CRAWLABILITY keeps
 * (hero secondary Link · toolkit Link · share buttons as functional
 * <button>s), the memberships final-card CTAs (ctaHref/ctaLabel logic),
 * and the coaching coach-recruitment links (SEO-RECOVERY 2026-11-11).
 */

const VIEW = "src/components/views/AffiliateProgramView.tsx";
const EN_LAYOUT = "src/app/(en)/affiliate/layout.tsx";
const AR_LAYOUT = "src/app/(ar)/ar/affiliate/layout.tsx";
const MEMBERSHIPS = "src/app/(en)/memberships/page.tsx";
const COACHING = "src/app/(en)/coaching/page.tsx";

// Pre-P0-E og/twitter description strings — the scope pins (P0-D
// precedent: og/twitter are OUT of the description fix's scope; any drift
// here is a scope violation and fails this canary).
const EN_OG_TWITTER_DESC =
  "Share Alkemos with people who trust your recommendations and earn commissions from eligible purchases.";
const AR_OG_TWITTER_DESC =
  "شارك Alkemos مع من يثقون بتوصياتك واكسب عمولة من عمليات الشراء المؤهلة عبر رابطك الخاص.";

// The five original questions (byte-preservation pins — the verbatim
// move law; a single character drift fails this canary).
const AR_ORIGINAL_QUESTIONS = [
  "كم تكلفة الانضمام إلى البرنامج؟",
  "متى وكيف أستلم أرباحي؟",
  "ماذا يحدث إذا استرد المشتري قيمته؟",
  "هل يتتبع الرابط الزائر إن اشترى بعد مدة؟",
  "هل أحتاج إلى أن أكون مدربًا أو صاحب جمهور كبير؟",
];
const EN_ORIGINAL_QUESTIONS = [
  "How much does it cost to join the program?",
  "When and how do I get paid?",
  "What happens if the buyer asks for a refund?",
  "Does my link still count if the visitor buys later?",
  "Do I need to be a coach or have a big audience?",
];

const SERP_CEILING = 160; // SEO-P2-10: the ≤160 SERP-truncation law

function read(p: string): string {
  const path = resolve(process.cwd(), p);
  expect(existsSync(path), `missing file: ${p}`).toBe(true);
  return readFileSync(path, "utf-8");
}

function faqText(lang: "en" | "ar"): string {
  return AFFILIATE_FAQ[lang]
    .map((item) => `${item.q} ${item.a}`)
    .join(" ");
}

describe("P0-E — the FAQ module (single source, 4-6 questions, four subjects)", () => {
  it("ships BOTH language arrays with exactly 6 items (the 4-6 law, upper bound)", () => {
    expect(AFFILIATE_FAQ.ar).toHaveLength(6);
    expect(AFFILIATE_FAQ.en).toHaveLength(6);
  });

  it("every item is a non-empty q/a pair in both languages", () => {
    for (const item of [...AFFILIATE_FAQ.ar, ...AFFILIATE_FAQ.en]) {
      expect(item.q.length).toBeGreaterThan(5);
      expect(item.a.length).toBeGreaterThan(20);
    }
  });

  it("covers the four roadmap subjects: commission · payout · cookies · eligible conversions/refunds (both languages)", () => {
    for (const lang of ["ar", "en"] as const) {
      const text = faqText(lang);
      // العمولة — the commission rate question carries 20%
      expect(text).toContain("20%");
      // الصرف — the payout threshold 10 (10 دولارات / $10)
      expect(text).toMatch(lang === "ar" ? /10 دولارات/ : /\$10/);
      // الكوكيز — the 30-day cookie attribution
      expect(text).toMatch(/30/);
      expect(text).toMatch(lang === "ar" ? /كوكيز/ : /cookie/);
      // التحويلات المؤهلة — refund reversal / eligible purchases
      expect(text).toMatch(lang === "ar" ? /استرد/ : /refund/);
      expect(text).toMatch(lang === "ar" ? /مؤهل/ : /eligible/);
    }
  });

  it("numerical parity: both languages carry the SAME money-number set («النصان متطابقان رقميًا»)", () => {
    const numbers = [
      "20%",
      "3.00",
      "6.00",
      "8.00",
      "14.99",
      "29.99",
      "39.99",
      "10",
      "30",
    ];
    for (const lang of ["ar", "en"] as const) {
      const text = faqText(lang);
      for (const n of numbers) {
        expect(
          text.includes(n),
          `${lang} FAQ missing the number ${n}`,
        ).toBe(true);
      }
    }
  });

  it("the five original AR questions are preserved VERBATIM (the verbatim move law)", () => {
    const qs = AFFILIATE_FAQ.ar.map((item) => item.q);
    for (const q of AR_ORIGINAL_QUESTIONS) {
      expect(qs).toContain(q);
    }
  });

  it("the five original EN questions are preserved VERBATIM", () => {
    const qs = AFFILIATE_FAQ.en.map((item) => item.q);
    for (const q of EN_ORIGINAL_QUESTIONS) {
      expect(qs).toContain(q);
    }
  });

  it("the view renders the FAQ from the SAME single source (schema == visible, byte-identical)", () => {
    const src = read(VIEW);
    expect(src).toContain('import { AFFILIATE_FAQ } from "@/lib/affiliate-faq";');
    expect(src).toContain("items: AFFILIATE_FAQ.ar");
    expect(src).toContain("items: AFFILIATE_FAQ.en");
    // the old inline literals moved out (single source, not a copy)
    expect(src).not.toContain('q: "كم تكلفة الانضمام إلى البرنامج؟"');
    expect(src).not.toContain('q: "How much does it cost to join the program?"');
  });
});

describe("P0-E — the first/last section CTA conversions (أزرار القسمين الأول والأخير)", () => {
  it("the hero primary + final CTA + hero secondary are crawlable <Link>s with the state-dependent href (x3)", () => {
    const src = read(VIEW);
    expect(
      src.match(/href=\{profile \? "\/referral" : "\/auth\?mode=signup"\}/g)
        ?.length,
    ).toBe(3);
  });

  it("the member clipboard behavior is preserved byte-faithfully (onClick interception, ONLY that case)", () => {
    const src = read(VIEW);
    expect(src).toContain("navigator.clipboard.writeText(affiliateUrl)");
    expect(src).toContain("e.preventDefault();");
    expect(src).toContain("void primaryCta();");
    // the interception is scoped to profile && affiliateUrl (the copy case)
    expect(src).toContain("if (profile && affiliateUrl) {");
  });

  it("no bare primaryCta button remains (both sections converted)", () => {
    const src = read(VIEW);
    expect(src).not.toContain("onClick={primaryCta}");
  });

  it("CTA-CRAWLABILITY keeps: the toolkit guest Link + the authed-only share buttons stay functional <button>s", () => {
    const src = read(VIEW);
    expect(src.match(/href="\/auth\?mode=signup"/g)?.length).toBe(1);
    expect(src).toContain("onClick={shareWhatsApp}");
    expect(src).toContain("onClick={shareFacebook}");
    expect(src).toContain("onClick={shareX}");
  });
});

describe("P0-E — both layouts emit FAQPage + BreadcrumbList JSON-LD", () => {
  it("the EN layout emits FAQPage from AFFILIATE_FAQ.en (single source) + two ld+json scripts", () => {
    const src = read(EN_LAYOUT);
    expect(src).toContain("getFAQSchema(AFFILIATE_FAQ.en)");
    expect(src.match(/type="application\/ld\+json"/g)?.length).toBe(2);
    expect(src).toContain("jsonLd(faqSchema)");
    expect(src).toContain("jsonLd(breadcrumbSchema)");
  });

  it("the AR layout emits FAQPage from AFFILIATE_FAQ.ar (single source) + two ld+json scripts", () => {
    const src = read(AR_LAYOUT);
    expect(src).toContain("getFAQSchema(AFFILIATE_FAQ.ar)");
    expect(src.match(/type="application\/ld\+json"/g)?.length).toBe(2);
    expect(src).toContain("jsonLd(faqSchema)");
    expect(src).toContain("jsonLd(breadcrumbSchema)");
  });

  it("the EN BreadcrumbList uses RELATIVE urls (the origin-prefixing law)", () => {
    const src = read(EN_LAYOUT);
    expect(src).toContain('{ name: "Home", url: "/" },');
    expect(src).toContain('{ name: "Affiliate Program", url: "/affiliate" },');
    // scoped to the getBreadcrumbSchema call block ONLY (og:url/canonical
    // legitimately carry absolute urls) — an absolute url inside the
    // breadcrumb call = the doubled-origin defect class (live on
    // for-coaches/macro-tracker — report 18 §6)
    const crumbBlock =
      src.split("getBreadcrumbSchema([")[1]?.split("]);")[0] ?? "";
    expect(crumbBlock).toBeTruthy();
    expect(crumbBlock).not.toContain("http");
  });

  it("the AR BreadcrumbList uses RELATIVE urls (SEO-GEO-4: the /ar mirror path)", () => {
    const src = read(AR_LAYOUT);
    expect(src).toContain('{ name: "الرئيسية", url: "/ar" },');
    expect(src).toContain('{ name: "برنامج الأفلييت (الشركاء)", url: "/ar/affiliate" },');
    const crumbBlock =
      src.split("getBreadcrumbSchema([")[1]?.split("]);")[0] ?? "";
    expect(crumbBlock).toBeTruthy();
    expect(crumbBlock).not.toContain("http");
  });

  it("the schemas are structurally valid FAQPage / BreadcrumbList objects", () => {
    const faq = getFAQSchema(AFFILIATE_FAQ.en);
    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity).toHaveLength(6);
    expect(faq.mainEntity[1].name).toBe("How much commission do I earn?");
    const crumb = getBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Affiliate Program", url: "/affiliate" },
    ]);
    expect(crumb["@type"]).toBe("BreadcrumbList");
    expect(crumb.itemListElement[0].item).toBe("https://alkemos.com/");
    expect(crumb.itemListElement[1].item).toBe("https://alkemos.com/affiliate");
  });
});

describe("P0-E — 20%/$10 parity: «النصان متطابقان رقميًا» (field 9)", () => {
  it("the EN description now carries 20% AND $10 (the F-8 deprivation fixed)", () => {
    const src = read(EN_LAYOUT);
    expect(src).toContain("20% commission");
    expect(src).toContain("$10 minimum payout");
  });

  it("the EN description fits the ≤160 SERP law", () => {
    const m = read(EN_LAYOUT).match(/"Join the Alkemos Affiliate Program: [^"]+",/);
    expect(m).toBeTruthy();
    expect(m![0].length - 2).toBeLessThanOrEqual(SERP_CEILING);
  });

  it("the AR description still carries 20% AND the 10-dollar threshold (pre-existing parity kept)", () => {
    const src = read(AR_LAYOUT);
    expect(src).toContain("20% عمولة");
    expect(src).toContain("10 دولارات");
  });

  it("scope discipline: og/twitter descriptions untouched (P0-D precedent — the pins, exactly 2 each)", () => {
    const en = read(EN_LAYOUT);
    expect(en.split(EN_OG_TWITTER_DESC).length - 1).toBe(2);
    const ar = read(AR_LAYOUT);
    expect(ar.split(AR_OG_TWITTER_DESC).length - 1).toBe(2);
  });
});

describe("P0-E — the two inbound links (memberships/coaching → «برنامج الشركاء»)", () => {
  it("memberships: exactly ONE language-aware affiliate bridge in the commercial end-zone", () => {
    const src = read(MEMBERSHIPS);
    expect(src.match(/href="\/ar\/affiliate"/g)?.length).toBe(1);
    expect(src.match(/href="\/affiliate"/g)?.length).toBe(1);
    // the documented anchor (07-§2 row: «أو اصنع دخلًا بترشيح أصدقائك (20%)»
    // + the roadmap program name) carries the 20% number
    expect(src).toContain("اصنع دخلًا بترشيح أصدقائك عبر برنامج الشركاء (20%)");
    expect(src).toContain(
      "make income by referring your friends through the Affiliate Program (20%)",
    );
  });

  it("coaching: exactly ONE language-aware affiliate bridge in the final-CTA zone", () => {
    const src = read(COACHING);
    expect(src.match(/href="\/ar\/affiliate"/g)?.length).toBe(1);
    expect(src.match(/href="\/affiliate"/g)?.length).toBe(1);
    expect(src).toContain("اصنع دخلًا بترشيح أصدقائك عبر برنامج الشركاء (20%)");
    expect(src).toContain(
      "make income by referring your friends through the Affiliate Program (20%)",
    );
  });

  it("previous fixes preserved: the memberships final-card CTAs + compare bridge untouched", () => {
    const src = read(MEMBERSHIPS);
    expect(src).toContain('href={ctaHref("free", 1)}');
    expect(src).toContain('href={isAr ? "/ar/coaching" : "/coaching"}');
    expect(src).toContain('href={isAr ? "/ar/compare" : "/compare"}');
  });

  it("previous fixes preserved: the coaching coach-recruitment links (SEO-RECOVERY 2026-11-11) untouched", () => {
    const src = read(COACHING);
    expect(src).toContain('href="/ar/for-coaches/register"');
    expect(src).toContain('href="/ar/for-coaches"');
    expect(src).toContain('href="/for-coaches/register"');
    expect(src).toContain('href="/for-coaches"');
  });
});
