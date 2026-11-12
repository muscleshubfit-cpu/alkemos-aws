import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { MEMBERSHIPS } from "@/lib/memberships";
import { MEMBERSHIPS_FAQ } from "@/lib/memberships-faq";

/**
 * BILINGUAL-CONTENT-SEO-GEO-CONVERSION Phase 2 canaries (owner order
 * 2026-11-04 «ابدأ المرحلة الثانية… لا تتوقف لطلب موافقة إضافية») — the
 * audit's fixed gaps stay fixed, the single-source laws stay enforced:
 *
 *   1) FAQ SINGLE SOURCE — /memberships renders its FAQ from
 *      src/lib/memberships-faq.ts (the coaching-faq.ts precedent), and
 *      BOTH language surfaces emit that same array as FAQPage JSON-LD in
 *      the server HTML (GEO: AI answer engines parse JSON-LD).
 *   2) OFFERCATALOG PARITY — /ar/memberships serves an OfferCatalog like
 *      the EN twin (audit gap #1), with prices DERIVED from
 *      memberships.ts (never literals — the drift law).
 *   3) COMPARISON-TABLE HEADERS — the Arabic surface reads
 *      «مجاني/بريميوم/برو/التدريب الأونلاين» derived from
 *      memberships.ts nameAr (audit gap #4 — no Latin headers on the AR
 *      surface, no literal duplicates that could drift).
 *   4) PRESSURE-FREE SUBSCRIPTION CTAS — «الآن» never returns to a
 *      subscribe button (owner order: one pressure-free law for every
 *      surface — the AR-COPY-REWRITE-287 coaching precedent).
 *   5) OG SITE NAME — the three paid surfaces that dropped og:site_name
 *      (child openGraph replaces the root block) pin it explicitly.
 *   6) TITLE LAWS — the two owner-approved Arabic titles are pinned
 *      verbatim (and stay inside the ~60-char budget); the anti-
 *      double-brand `absolute` mechanism stays in place.
 */

const MEMBERSHIPS_PAGE = "src/app/(en)/memberships/page.tsx";
const EN_LAYOUT = "src/app/(en)/memberships/layout.tsx";
const AR_PAGE = "src/app/(ar)/ar/memberships/page.tsx";
const AR_COACHING_LAYOUT = "src/app/(ar)/ar/coaching/layout.tsx";
const EN_COACHING_LAYOUT = "src/app/(en)/coaching/layout.tsx";
const COACHING_PAGE = "src/app/(en)/coaching/page.tsx";
const FAQ_SOURCE = "src/lib/memberships-faq.ts";
const AR_ROOT_LAYOUT = "src/app/(ar)/ar/layout.tsx";
const AR_HOME = "src/app/(ar)/ar/(home)/page.tsx";
const read = (p: string) => readFileSync(p, "utf8");

describe("BILINGUAL-CONTENT Phase 2 — schema + consistency canaries", () => {
  // (1) The FAQ single source feeds BOTH the render and BOTH schemas.
  it("the memberships FAQ renders from the single source and both languages emit FAQPage JSON-LD from it", () => {
    const page = read(MEMBERSHIPS_PAGE);
    const enLayout = read(EN_LAYOUT);
    const arPage = read(AR_PAGE);
    // Render: the page consumes the shared array (no inline FAQ literals).
    expect(page).toContain('from "@/lib/memberships-faq"');
    expect(page).toContain('MEMBERSHIPS_FAQ[isAr ? "ar" : "en"]');
    // EN surface: FAQPage JSON-LD from the same source.
    expect(enLayout).toContain('from "@/lib/memberships-faq"');
    expect(enLayout).toContain("getFAQSchema(MEMBERSHIPS_FAQ.en)");
    // AR surface: same, Arabic.
    expect(arPage).toContain("getFAQSchema(MEMBERSHIPS_FAQ.ar)");
    // The seven questions exist in BOTH languages of the shared source
    // (byte-stable — the verbatim-move law).
    expect(MEMBERSHIPS_FAQ.en.length).toBe(7);
    expect(MEMBERSHIPS_FAQ.ar.length).toBe(7);
    expect(read(FAQ_SOURCE)).toContain("Can I cancel anytime?");
    expect(read(FAQ_SOURCE)).toContain("هل يمكنني الإلغاء في أي وقت؟");
    // The one verified fix in the move: AR q3 is «برو» (Arabic), never
    // the Latin «Pro» that slipped through before (audit أ-2 class).
    expect(MEMBERSHIPS_FAQ.ar[2].q).toContain("مشمول في برو");
    expect(MEMBERSHIPS_FAQ.ar[2].q).not.toContain("Pro");
  });

  // (2) OfferCatalog parity: AR serves it too, prices DERIVED from the
  //     single source (no literals anywhere — a price change in
  //     memberships.ts must flow to the Arabic schema automatically).
  it("the Arabic memberships page serves an OfferCatalog with prices derived from memberships.ts", () => {
    const arPage = read(AR_PAGE);
    expect(arPage).toContain('"@type": "OfferCatalog"');
    expect(arPage).toContain("tierPrice");
    expect(arPage).toContain('from "@/lib/memberships"');
    // No literal monthly price may appear in the AR OfferCatalog block —
    // every price rides the tierPrice() derivation.
    const catalogBlock = arPage.slice(
      arPage.indexOf("const offerCatalogSchema"),
      arPage.indexOf("export default function Page"),
    );
    for (const m of MEMBERSHIPS) {
      if (m.priceMonthly === null) continue;
      expect(
        catalogBlock,
        `literal price "${m.priceMonthly}" found in the AR OfferCatalog — prices must derive from memberships.ts`,
      ).not.toContain(`"${m.priceMonthly.toFixed(2)}"`);
    }
    expect(catalogBlock).toContain('price: tierPrice("free")');
    expect(catalogBlock).toContain('price: tierPrice("premium")');
    expect(catalogBlock).toContain('price: tierPrice("pro")');
    expect(catalogBlock).toContain('price: tierPrice("coaching")');
    // The EN twin keeps its OfferCatalog (regression guard).
    expect(read(EN_LAYOUT)).toContain('"@type": "OfferCatalog"');
  });

  // (3) The comparison-table headers derive from memberships.ts — the
  //     Arabic surface reads Arabic tier names (audit gap #4).
  it("the comparison-table headers derive tier names from memberships.ts (Arabic on the Arabic surface)", () => {
    const page = read(MEMBERSHIPS_PAGE);
    expect(page).toContain('(["free", "premium", "pro", "coaching"] as const)');
    expect(page).toContain("isAr ? m.nameAr : m.nameEn");
    // The old Latin-only header cells must stay dead.
    expect(page).not.toContain(">Free</th>");
    expect(page).not.toContain(">Premium</th>");
    expect(page).not.toContain(">Pro</th>");
    expect(page).not.toContain(">Coaching</th>");
  });

  // (4) Pressure-free subscription CTAs — «الآن» never returns to a
  //     subscribe button on any in-scope surface (one editorial law).
  it("subscription CTAs stay pressure-free («الآن» retired across the paid surfaces)", () => {
    const page = read(MEMBERSHIPS_PAGE);
    const coaching = read(COACHING_PAGE);
    for (const banned of ["اشترك الآن", "ابدأ الآن"]) {
      expect(page, `memberships page: pressure word returned: "${banned}"`).not.toContain(banned);
      expect(coaching, `coaching page: pressure word returned: "${banned}"`).not.toContain(banned);
    }
    // The unified labels exist (specific, not weaker — the plan NAME
    // rides the primary money button; the coaching strip mirrors the
    // coaching page's own hero CTA).
    expect(page).toContain("اشترك في ${tier.nameAr}");
    expect(page).toContain("Subscribe to ${tier.nameEn}");
    expect(page).toContain("ابدأ التدريب الأونلاين ›");
    // GROWTH-PLAN batch 10 (owner blanket order «أولوية خاصة لصفحات الخدمات
    // المدفوعة»): optional item 9 executed — EN button now matches the AR
    // label and the hero.
    expect(coaching).toContain('"ابدأ التدريب الأونلاين" : "Start coaching"');
  });

  // (5) og:site_name pinned on the three paid surfaces that dropped it
  //     (audit gap #6 — child openGraph replaces the root block).
  it("the paid surfaces pin og:site_name explicitly", () => {
    expect(read(EN_LAYOUT)).toContain('siteName: "Alkemos"');
    expect(read(AR_PAGE)).toContain('siteName: "Alkemos"');
    expect(read(AR_COACHING_LAYOUT)).toContain('siteName: "Alkemos"');
    expect(read(EN_COACHING_LAYOUT)).toContain('siteName: "Alkemos"');
  });

  // (6) The owner-approved Arabic titles, pinned verbatim + inside the
  //     ~60-char budget, via `absolute` (anti-double-brand).
  it("the owner-approved Arabic titles are pinned verbatim via absolute (no double brand)", () => {
    const arPage = read(AR_PAGE);
    const arCoaching = read(AR_COACHING_LAYOUT);
    const membershipsTitle = "عضويات Alkemos — الأسعار والباقات والفروق";
    const coachingTitle = "التدريب الأونلاين مع مدرب متخصص | Alkemos";
    expect(arPage).toContain(`absolute: "${membershipsTitle}"`);
    expect(arCoaching).toContain(`absolute: "${coachingTitle}"`);
    expect([...membershipsTitle].length).toBeLessThanOrEqual(60);
    expect([...coachingTitle].length).toBeLessThanOrEqual(60);
    // The template-rendered (non-absolute) forms stay dead.
    expect(arPage).not.toContain('title: "العضويات والباقات"');
    expect(arCoaching).not.toContain('title: "التدريب الأونلاين — مدرب بشري يبني خططك ويتابعك أسبوعيًا"');
  });

  // (7) The tanween + hreflang fixes stay fixed.
  it("the /ar root metadata tanween is unified and the AR home hreflang matches \"/\" literally", () => {
    const arRoot = read(AR_ROOT_LAYOUT);
    // Old-style tanween must stay dead in SERVED strings (the one
    // remaining occurrence lives inside an explanatory code comment).
    const served = arRoot
      .split("\n")
      .filter((l) => !l.trim().startsWith("//"))
      .join("\n");
    expect(served).not.toContain("تمريناً");
    expect(served).not.toContain("صنفاً");
    expect(served).toContain("868+ تمرينًا");
    expect(served).toContain("8,162+ صنفًا");
    // The AR home declares en/x-default WITHOUT the trailing slash —
    // byte-identical with the "/" declarations.
    const arHome = read(AR_HOME);
    expect(arHome).toContain("en: `${SITE_URL}`,");
    expect(arHome).toContain('"x-default": `${SITE_URL}`,');
    expect(arHome).not.toContain("en: `${SITE_URL}/`");
  });

  // (8) The closing decision band (the conversion-review addition) —
  //     pressure-free, reusing the existing CTA logic, no new routes.
  it("the memberships page carries the post-FAQ closing band (free-first, pressure-free)", () => {
    const page = read(MEMBERSHIPS_PAGE);
    expect(page).toContain("ابدأ حيث يناسبك.");
    expect(page).toContain("Start where it fits you.");
    expect(page).toContain('ctaHref("free", 1)');
    expect(page).toContain('ctaLabel("free", isAr)');
    // No new route literals beyond the existing coaching link pair.
    expect(page).not.toContain('href="/checkout?tier=free');
  });

  // (6) GROWTH-PLAN batch 10 (owner order «إبراز القيمة التي تدفع المستخدم
  //     للاشتراك»): subscription savings must be DERIVED from memberships.ts —
  //     the hardcoded -33% chip is banned (it was already wrong for any tier
  //     whose yearly ratio differs), and both paid surfaces must state the
  //     dollar saving at the decision moment (12 × monthly − yearly).
  it("yearly savings derive from memberships.ts — no hardcoded discount chips", () => {
    const page = read(MEMBERSHIPS_PAGE);
    const coaching = read(COACHING_PAGE);
    // The hardcoded chip is gone…
    expect(page, "the -33% literal chip must never return").not.toContain('seal-chip">-33%');
    // …replaced by the derived percentage in BOTH chip spots.
    expect(page).toContain("Math.round((1 - tier.priceYearly! / (12 * tier.priceMonthly!)) * 100)");
    // The dollar saving line is present and derived.
    expect(page).toContain("12 * tier.priceMonthly! - tier.priceYearly!");
    // The coaching page states its derived yearly saving from the same source.
    expect(coaching).toContain("12 * (MEMBERSHIPS.find((m) => m.id === \"coaching\")?.priceMonthly");
    expect(coaching).not.toContain('"أو $359 سنويًا"');
  });
});
