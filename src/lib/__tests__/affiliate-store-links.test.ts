import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  AMAZON_ASSOCIATES_TAG_ENV,
  AFFILIATE_STORE_BUY_CTA_LABEL,
  associatesTag,
  containsStoredAmazonLink,
  isValidAsin,
  resolveAmazonBuyLink,
} from "../affiliate-store-link";

/**
 * STORE-LINKS GUARD (governing law §3.4-1 — the Phase-1 spec item 1.7):
 * every store purchase link is the ONE canonical shape
 * https://www.amazon.com/dp/{ASIN}?tag={ENV TAG} — built at render time
 * from the environment ONLY, tag merged exactly once, non-standard
 * ASINs rejected, and NO tagged link ever accepted from storage.
 */

const TEST_TAG = "test-tag-20";

describe("isValidAsin — the strict US-ASIN gate", () => {
  it("accepts B-prefixed 10-char codes", () => {
    expect(isValidAsin("B0C1234567")).toBe(true);
    expect(isValidAsin("B08X7QZLPK")).toBe(true);
  });
  it("accepts 10-digit ISBN-10-derived codes", () => {
    expect(isValidAsin("0123456789")).toBe(true);
  });
  it("rejects non-standard shapes (lowercase/short/long/specials)", () => {
    expect(isValidAsin("b0c1234567")).toBe(false);
    expect(isValidAsin("B0C123456")).toBe(false);
    expect(isValidAsin("B0C12345678")).toBe(false);
    expect(isValidAsin("B0C123 456")).toBe(false);
    expect(isValidAsin("B0C123456?")).toBe(false);
    expect(isValidAsin("B0C1234567?tag=x")).toBe(false);
    expect(isValidAsin("B0C-234567")).toBe(false);
  });
  it("is null-safe", () => {
    expect(isValidAsin(null)).toBe(false);
    expect(isValidAsin(undefined)).toBe(false);
    expect(isValidAsin("")).toBe(false);
  });
});

describe("resolveAmazonBuyLink — the single tag source", () => {
  beforeEach(() => {
    vi.stubEnv(AMAZON_ASSOCIATES_TAG_ENV, TEST_TAG);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds the canonical /dp/ URL with the env tag exactly once", () => {
    const link = resolveAmazonBuyLink("B0C1234567");
    expect(link).not.toBeNull();
    expect(link?.url).toBe(`https://www.amazon.com/dp/B0C1234567?tag=${TEST_TAG}`);
    expect(link?.tag).toBe(TEST_TAG);
    expect(link?.asin).toBe("B0C1234567");
    // tag merged EXACTLY once (the §3.4-1 invariant)
    expect(link && link.url.split("tag=").length - 1).toBe(1);
  });

  it("rejects non-standard ASINs (guard: «يرفض أي ASIN غير قياسي»)", () => {
    expect(resolveAmazonBuyLink("not-an-asin")).toBeNull();
    expect(resolveAmazonBuyLink("b0c1234567")).toBeNull();
    expect(resolveAmazonBuyLink(null)).toBeNull();
    expect(resolveAmazonBuyLink("")).toBeNull();
  });

  it("returns null when the tag env is unset (no untagged links, ever)", () => {
    vi.stubEnv(AMAZON_ASSOCIATES_TAG_ENV, "");
    expect(associatesTag()).toBe("");
    expect(resolveAmazonBuyLink("B0C1234567")).toBeNull();
  });

  it("ignores a malformed tag env value (never a broken link)", () => {
    vi.stubEnv(AMAZON_ASSOCIATES_TAG_ENV, "bad tag!&x=1");
    expect(associatesTag()).toBe("");
    expect(resolveAmazonBuyLink("B0C1234567")).toBeNull();
  });
});

describe("containsStoredAmazonLink — the stored-link rejection (§3.4-1)", () => {
  it("rejects any stored tagged Amazon link", () => {
    expect(
      containsStoredAmazonLink("https://www.amazon.com/dp/B0C1234567?tag=ahmedzake-20"),
    ).toBe(true);
    expect(containsStoredAmazonLink("amazon.com/dp/B0X?tag=other")).toBe(true);
  });
  it("rejects short links and legacy obidos forms", () => {
    expect(containsStoredAmazonLink("https://amzn.to/3xYz123")).toBe(true);
    expect(
      containsStoredAmazonLink("https://www.amazon.com/exec/obidos/ASIN/B0X"),
    ).toBe(true);
  });
  it("rejects any raw tag= fragment in a stored column", () => {
    expect(containsStoredAmazonLink("check tag=ahmedzake-20 for details")).toBe(true);
  });
  it("accepts normal editorial text and internal links", () => {
    expect(containsStoredAmazonLink("Cast-iron kettlebell for swings and carries.")).toBe(false);
    expect(containsStoredAmazonLink("https://alkemos.com/affiliate-store/kettlebells")).toBe(false);
    expect(containsStoredAmazonLink(null)).toBe(false);
    expect(containsStoredAmazonLink("")).toBe(false);
  });
});

describe("the unified Phase-1 CTA label (no prices before API)", () => {
  it("is the single fixed English CTA", () => {
    expect(AFFILIATE_STORE_BUY_CTA_LABEL).toBe("See price on Amazon");
  });
});
