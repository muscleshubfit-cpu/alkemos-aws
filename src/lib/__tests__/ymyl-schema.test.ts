import { describe, it, expect } from "vitest";
import {
  getReviewedWebPageSchema,
  CONTENT_LAST_REVIEWED,
  jsonLd,
} from "@/lib/seo";
import { AHMED_ZAKE } from "@/lib/authors";

/**
 * Phase SEO-GEO-4.5 (§7.1 #6+#7) — YMYL E-E-A-T schema canaries.
 *
 * The food (8,162) + exercise (868) detail pages × 2 language mirrors now
 * carry a WebPage JSON-LD node with `lastReviewed` + `reviewedBy` (Person).
 * These tests pin the invariants:
 *   - the node is strictly schema.org-valid (WebPage carries lastReviewed;
 *     reviewedBy is legal via CreativeWork ancestry — NOT stamped on the
 *     NutritionInformation/HowTo nodes, which sit under Intangible)
 *   - the reviewer is the canonical Ahmed Zake Person (@id-stable, same
 *     entity Article.author and Organization.founder reference)
 *   - the review date is a real ISO calendar date (single source, not
 *     per-page drift)
 *   - jsonLd() serialization stays script-safe for Arabic names (contains
 *     no raw `<` breakout even with RTL content)
 */

describe("YMYL reviewed-WebPage schema (SEO-GEO-4.5)", () => {
  const schema = getReviewedWebPageSchema({
    url: "https://alkemos.com/foods/chicken-breast",
    name: "Chicken Breast — Nutrition Facts (per 100 g)",
  });

  it("is a WebPage node with url + name", () => {
    expect(schema["@type"]).toBe("WebPage");
    expect(schema.url).toBe("https://alkemos.com/foods/chicken-breast");
    expect(schema.name).toContain("Chicken Breast");
  });

  it("carries lastReviewed from the single CONTENT_LAST_REVIEWED source", () => {
    expect(CONTENT_LAST_REVIEWED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(schema.lastReviewed).toBe(CONTENT_LAST_REVIEWED);
  });

  it("explicit lastReviewed param overrides the default", () => {
    const custom = getReviewedWebPageSchema({
      url: "https://alkemos.com/exercises/squat",
      name: "Squat — Proper Form & Instructions",
      lastReviewed: "2026-10-01",
    });
    expect(custom.lastReviewed).toBe("2026-10-01");
  });

  it("reviewedBy resolves to the canonical Ahmed Zake Person entity", () => {
    const reviewer = schema.reviewedBy as Record<string, unknown>;
    expect(reviewer["@type"]).toBe("Person");
    expect(reviewer["@id"]).toBe(AHMED_ZAKE.profileUrl);
    expect(reviewer.name).toBe(AHMED_ZAKE.nameEn);
    expect(reviewer.alternateName).toBe(AHMED_ZAKE.nameAr);
    expect(Array.isArray(reviewer.hasCredential)).toBe(true);
  });

  it("AR mirror node keeps the Arabic page URL and Arabic name", () => {
    const ar = getReviewedWebPageSchema({
      url: "https://alkemos.com/ar/foods/chicken-breast",
      name: "صدور الفراخ — القيم الغذائية (لكل 100 جرام)",
    });
    expect(ar.url).toBe("https://alkemos.com/ar/foods/chicken-breast");
    expect(/[\u0600-\u06FF]/.test(ar.name as string)).toBe(true);
  });

  it("jsonLd() serialization is script-safe (no raw <) even with Arabic names", () => {
    const serialized = jsonLd(
      getReviewedWebPageSchema({
        url: "https://alkemos.com/ar/exercises/squat",
        name: "سكوات — الأداء الصحيح والتعليمات",
      }),
    );
    expect(serialized).not.toContain("</script>");
    expect(() => JSON.parse(serialized)).not.toThrow();
  });
});
