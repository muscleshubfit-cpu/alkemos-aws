import { describe, expect, it } from "vitest";
import {
  ANIMAL_SOURCE_REVIEW_FLAGS,
  EDITORIAL_FLOOR_WORDS,
  blocksPublish,
  checkAffiliateStoreImage,
  editorialWordCount,
  findAnimalSourceReviewFlag,
  hasBannedClaim,
  hasCommissionRateText,
  hasHalalBlocklistHit,
  hasManualPriceViolation,
  isAmazonImageUrl,
  runAffiliateStoreProductGuards,
} from "../affiliate-store-guards";

/**
 * STORE-GUARD CANARIES — the Phase-1 spec item 1.7 battery:
 * the image law v2 §0 (absolute women ban + clause (h) Amazon domains),
 * the halal blocklist (§3.4-5 + screening §2-1), claims discipline
 * (screening §3), the pre-API price ban (§3.4-6), the NINTH guard
 * (commissions internal-only — ratified §6-c), and the advisory
 * editorial floor (§3.4-8).
 */

const CLEAN_PRODUCT = {
  asin: "B0C1234567",
  title: "Cast-Iron Kettlebell 16 kg",
  summary: "A powder-coated cast-iron kettlebell for swings, cleans, and carries.",
  content:
    "A single fixed-weight kettlebell is the most cost-effective strength tool for a home setup. " +
    "This 16 kg cast-iron bell suits goblet squats, two-arm swings, and loaded carries, and its " +
    "powder coat keeps chalk and sweat from making the handle slippery. Train three sessions a " +
    "week with swings and cleans and you cover most of the posterior chain work a barbell " +
    "program would ask for, at a fraction of the space and cost.",
  image_url: null,
  image_alt: "cast iron kettlebell on a neutral studio background",
  price_usd: null,
};

describe("image guards — IMAGE-POLICY-EN.md v2 §0 (the absolute ban)", () => {
  it("rejects Amazon image domains (clause (h) — no stored Amazon images)", () => {
    expect(isAmazonImageUrl("https://m.media-amazon.com/images/I/71abc.jpg")).toBe(true);
    expect(isAmazonImageUrl("https://images-na.ssl-images-amazon.com/images/I/71.jpg")).toBe(true);
    expect(isAmazonImageUrl("https://ecx.images-amazon.com/images/I/71.jpg")).toBe(true);
    expect(isAmazonImageUrl("https://alkemos.com/affiliate-store-products/kb16.webp")).toBe(false);
    expect(isAmazonImageUrl(null)).toBe(false);
    expect(isAmazonImageUrl("")).toBe(false);
  });

  it("§0.1: rejects ANY female-subject signal in image text (absolute, no exceptions)", () => {
    const result = checkAffiliateStoreImage(
      "https://alkemos.com/affiliate-store-products/shoe.webp",
      "woman training in running shoes",
    );
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("female"))).toBe(true);
  });

  it("§0.1: rejects female signals in the URL itself (background/partial/reflection included)", () => {
    const result = checkAffiliateStoreImage(
      "https://alkemos.com/affiliate-store-products/woman-model-leggings.webp",
      "leggings flat lay",
    );
    expect(result.ok).toBe(false);
  });

  it("§0.2: rejects immodest/NSFW imagery signals for both genders", () => {
    const immodest = checkAffiliateStoreImage(null, "shirtless man flexing abs closeup");
    expect(immodest.ok).toBe(false);
    expect(immodest.violations.some((v) => v.includes("immodest"))).toBe(true);
    const nsfw = checkAffiliateStoreImage(null, "nude fitness pose");
    expect(nsfw.ok).toBe(false);
  });

  it("accepts person-free product imagery (the §0.1 allowed alternative)", () => {
    const result = checkAffiliateStoreImage(
      "https://alkemos.com/affiliate-store-products/kb16.webp",
      "cast iron kettlebell on a neutral background",
    );
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("accepts the null image (the carved-icon default — ص-1)", () => {
    expect(checkAffiliateStoreImage(null, null).ok).toBe(true);
  });
});

describe("halal blocklist — §3.4-5 + screening §2-1 (verbatim word list)", () => {
  it("auto-rejects pork-family words", () => {
    expect(hasHalalBlocklistHit("capsules with pork gelatin")).toBe("pork");
    expect(hasHalalBlocklistHit("cooked in lard")).toBe("lard");
    expect(hasHalalBlocklistHit("smoked bacon bits")).toBe("bacon");
  });
  it("auto-rejects alcohol-family words", () => {
    expect(hasHalalBlocklistHit("wine extract flavor")).toBe("wine");
    expect(hasHalablocklistHitSafe("contains ethanol")).toBe("ethanol");
    expect(hasHalalBlocklistHit("dark rum infused")).toBe("rum");
    expect(hasHalalBlocklistHit("liqueur flavor notes")).toBe("liqueur");
  });
  it("rejects alcohol UNLESS the phrase is explicitly alcohol-free (screening §2-2)", () => {
    expect(hasHalalBlocklistHit("alcohol-free vanilla flavor")).toBeNull();
    expect(hasHalalBlocklistHit("vanilla flavor with alcohol")).toBe("alcohol");
  });
  it("passes clean supplement/food text", () => {
    expect(hasHalalBlocklistHit("whey protein isolate, 24 g protein per scoop")).toBeNull();
    expect(hasHalalBlocklistHit(null)).toBeNull();
  });
  it("flags unknown-origin animal derivatives for OWNER review only (§2-2)", () => {
    expect(findAnimalSourceReviewFlag("gelatin capsule shell")).toBe("gelatin");
    expect(findAnimalSourceReviewFlag("bovine collagen peptides")).toBeNull();
    expect(ANIMAL_SOURCE_REVIEW_FLAGS).toContain("gelatin");
  });
});

describe("claims discipline — screening §3", () => {
  it("rejects disease claims (diagnose/treat/cure/prevent + condition)", () => {
    expect(hasBannedClaim("this formula treats diabetes")).toBe(true);
    expect(hasBannedClaim("prevents heart disease")).toBe(true);
    expect(hasBannedClaim("helps cure arthritis pain")).toBe(true);
  });
  it("rejects FDA-authority claims", () => {
    expect(hasBannedClaim("FDA approved supplement")).toBe(true);
  });
  it("accepts structure/function wording (the allowed register)", () => {
    expect(hasBannedClaim("supports muscle recovery after training")).toBe(false);
    expect(hasBannedClaim("20 g protein per serving")).toBe(false);
    expect(hasBannedClaim(null)).toBe(false);
  });
});

describe("price guard — §3.4-6 (no prices before the Phase-4 API)", () => {
  it("blocks any manual price at publish time", () => {
    expect(hasManualPriceViolation(29.99)).toBe(true);
    expect(hasManualPriceViolation(0)).toBe(true);
  });
  it("allows the NULL pre-API state (the only legal Phase-1 value)", () => {
    expect(hasManualPriceViolation(null)).toBe(false);
    expect(hasManualPriceViolation(undefined)).toBe(false);
  });
});

describe("NINTH GUARD — commissions are internal-only (ratified §6-c)", () => {
  it("fails commission rates in commission/earnings context", () => {
    expect(hasCommissionRateText("Earn a 3.00% commission on this product")).toBe(true);
    expect(hasCommissionRateText("commission rate: 4.5%")).toBe(true);
    expect(hasCommissionRateText("we earn 1% on kitchen items")).toBe(true);
    expect(hasCommissionRateText("the payout is 4.00% for watches")).toBe(true);
  });
  it("fails any documented rate string on its own (the internal table's rates)", () => {
    expect(hasCommissionRateText("Kitchen 4.50%")).toBe(true);
    expect(hasCommissionRateText("Sports 3.00%")).toBe(true);
    expect(hasCommissionRateText("up to 10.00%")).toBe(true);
  });
  it("PASSES the mandated disclosures (no percentages in them, ever)", () => {
    expect(
      hasCommissionRateText(
        "As an Amazon Associate I earn from qualifying purchases.",
      ),
    ).toBe(false);
    expect(
      hasCommissionRateText(
        "When you buy through links on our site, we may earn an affiliate commission at no extra cost to you.",
      ),
    ).toBe(false);
    expect(
      hasCommissionRateText(
        "As an Amazon Associate I earn from qualifying purchases. Read our full affiliate disclosure.",
      ),
    ).toBe(false);
  });
  it("passes ordinary editorial and CTA text", () => {
    expect(hasCommissionRateText("Check price on Amazon")).toBe(false);
    expect(hasCommissionRateText("16 kg cast-iron kettlebell for swings")).toBe(false);
    expect(hasCommissionRateText(null)).toBe(false);
  });
});

describe("editorial floor — §3.4-8 (advisory, never a publish block)", () => {
  it("counts words", () => {
    expect(editorialWordCount("one two three")).toBe(3);
    expect(editorialWordCount(null)).toBe(0);
    expect(editorialWordCount("   ")).toBe(0);
  });
  it("the floor is 300 words (a guideline, NOT Amazon policy)", () => {
    expect(EDITORIAL_FLOOR_WORDS).toBe(300);
  });
});

describe("runAffiliateStoreProductGuards — the aggregated publish gate", () => {
  it("passes a clean product (no blocks; long-enough content)", () => {
    const findings = runAffiliateStoreProductGuards({
      ...CLEAN_PRODUCT,
      content: Array(70).fill("strength training with kettlebells builds work capacity safely").join(" "),
    });
    expect(findings.filter((f) => f.severity === "block")).toEqual([]);
    expect(blocksPublish(findings)).toBe(false);
  });

  it("BLOCKS a halal blocklist hit", () => {
    const findings = runAffiliateStoreProductGuards({
      ...CLEAN_PRODUCT,
      summary: "great for recovery after a glass of wine",
    });
    expect(findings.some((f) => f.rule === "halal-blocklist" && f.severity === "block")).toBe(true);
    expect(blocksPublish(findings)).toBe(true);
  });

  it("BLOCKS an Amazon-hosted image (clause (h))", () => {
    const findings = runAffiliateStoreProductGuards({
      ...CLEAN_PRODUCT,
      image_url: "https://m.media-amazon.com/images/I/71abc.jpg",
    });
    expect(findings.some((f) => f.rule === "image-policy" && f.severity === "block")).toBe(true);
  });

  it("BLOCKS a women-model image (law v2 §0.1 — absolute)", () => {
    const findings = runAffiliateStoreProductGuards({
      ...CLEAN_PRODUCT,
      image_alt: "woman modeling the training apparel",
    });
    expect(findings.some((f) => f.rule === "image-policy" && f.severity === "block")).toBe(true);
  });

  it("BLOCKS a manual price (pre-API)", () => {
    const findings = runAffiliateStoreProductGuards({ ...CLEAN_PRODUCT, price_usd: 29.99 });
    expect(
      findings.some((f) => f.rule === "price-before-api" && f.severity === "block"),
    ).toBe(true);
  });

  it("BLOCKS a commission rate in editorial text (the ninth guard)", () => {
    const findings = runAffiliateStoreProductGuards({
      ...CLEAN_PRODUCT,
      content: "This category pays a 3.00% commission rate to the site.",
    });
    expect(
      findings.some((f) => f.rule === "commissions-internal-only" && f.severity === "block"),
    ).toBe(true);
  });

  it("BLOCKS a stored tagged link (§3.4-1)", () => {
    const findings = runAffiliateStoreProductGuards({
      ...CLEAN_PRODUCT,
      content: "Buy at https://www.amazon.com/dp/B0C1234567?tag=ahmedzake-20 today.",
    });
    expect(findings.some((f) => f.rule === "stored-tagged-link" && f.severity === "block")).toBe(true);
  });

  it("BLOCKS a non-standard ASIN", () => {
    const findings = runAffiliateStoreProductGuards({ ...CLEAN_PRODUCT, asin: "cheap123" });
    expect(findings.some((f) => f.rule === "asin-format" && f.severity === "block")).toBe(true);
  });

  it("WARNS (never blocks) on the advisory editorial floor", () => {
    const findings = runAffiliateStoreProductGuards(CLEAN_PRODUCT);
    const floor = findings.find((f) => f.rule === "editorial-floor");
    expect(floor?.severity).toBe("warn");
    expect(blocksPublish(findings)).toBe(false);
  });

  it("WARNS (never blocks) on an animal-source review flag", () => {
    const findings = runAffiliateStoreProductGuards({
      ...CLEAN_PRODUCT,
      content: "Capsule shell uses gelatin of unspecified origin.",
    });
    const flag = findings.find((f) => f.rule === "animal-source-flag");
    expect(flag?.severity).toBe("warn");
    expect(blocksPublish(findings)).toBe(false);
  });
});

/** tiny wrapper to keep the ethanol expectation readable */
function hasHalablocklistHitSafe(text: string): string | null {
  return hasHalalBlocklistHit(text);
}
