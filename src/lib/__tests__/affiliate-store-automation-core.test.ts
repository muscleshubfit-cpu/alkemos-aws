import { describe, expect, it } from "vitest";
import {
  isFetchDue,
  nextFetchDueAt,
} from "../affiliate-store-automation";
import {
  transformCandidate,
  draftEditorialContent,
  draftSummary,
  distillSpecLines,
  candidateSlug,
} from "../affiliate-store-fetch";
import {
  scoreProductForPage,
  insertStoreLinks,
  pickAnchorPhrase,
  tokenize,
} from "../affiliate-store-linking";
import type { CreatorsApiItem } from "../amazon-creators-api";

/**
 * AFFILIATE-STORE AUTOMATION CANARIES (Phase 529 — the pure cores):
 * the frequency due-check, the candidate transform + the editorial
 * draft laws, the relevance engine, and the render-time injection
 * (EN-only, idempotent, capped — the insertToolLinks discipline).
 */

describe("isFetchDue (the frequency gate)", () => {
  it("is due when never run", () => {
    expect(isFetchDue({ frequency: "weekly", last_run_at: null })).toBe(true);
  });
  it("is due after the window (with drift tolerance)", () => {
    const justBeforeWindow = new Date(Date.now() - (7 * 24 * 3600 * 1000 - 5 * 60 * 1000)).toISOString();
    expect(isFetchDue({ frequency: "weekly", last_run_at: justBeforeWindow })).toBe(true);
    // 23h in (NOT within the 10-min tolerance of a daily window) stays not-due
    const sixDays23h = new Date(Date.now() - (7 * 24 * 3600 - 3600) * 1000).toISOString();
    expect(isFetchDue({ frequency: "weekly", last_run_at: sixDays23h })).toBe(false);
  });
  it("is NOT due inside the window", () => {
    const threeDays = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
    expect(isFetchDue({ frequency: "weekly", last_run_at: threeDays })).toBe(false);
    const twoWeeks = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    expect(isFetchDue({ frequency: "monthly", last_run_at: twoWeeks })).toBe(false);
  });
  it("daily is due after ~a day but not after an hour", () => {
    const h23 = new Date(Date.now() - 23 * 3600 * 1000).toISOString();
    expect(isFetchDue({ frequency: "daily", last_run_at: h23 })).toBe(false); // 1h short of the window
    const justBeforeDay = new Date(Date.now() - (24 * 3600 * 1000 - 5 * 60 * 1000)).toISOString();
    expect(isFetchDue({ frequency: "daily", last_run_at: justBeforeDay })).toBe(true); // inside the 10-min tolerance
    const h1 = new Date(Date.now() - 1 * 3600 * 1000).toISOString();
    expect(isFetchDue({ frequency: "daily", last_run_at: h1 })).toBe(false);
  });
  it("nextFetchDueAt projects from the last run", () => {
    const last = new Date("2026-11-20T07:17:00Z").toISOString();
    const next = nextFetchDueAt({ frequency: "weekly", last_run_at: last });
    expect(next).toBe(new Date("2026-11-27T07:17:00Z").toISOString());
  });
});

describe("distillSpecLines (the pre-filter)", () => {
  it("drops halal-blocklist / claims / female / immodest lines", () => {
    const out = distillSpecLines([
      "Solid steel construction",
      "Contains alcohol-based coating",
      "Treats joint pain and prevents arthritis",
      "Women's specific fit",
      "Sexy cropped design",
      "x", // too short
    ]);
    expect(out).toEqual(["Solid steel construction"]);
  });
  it("caps the line count", () => {
    const many = Array.from({ length: 10 }, (_, i) => `Feature number ${i} with enough length`);
    expect(distillSpecLines(many, 4)).toHaveLength(4);
  });
});

describe("the editorial draft laws", () => {
  const specs = ["Adjustable from 5 to 52.5 pounds", "Dial-a-weight selection"];

  it("produces ≥250 words of unique structured EN prose", () => {
    const content = draftEditorialContent({
      title: "ExampleFit Adjustable Dumbbell 52.5 lb",
      brand: "ExampleFit",
      categoryName: "Strength & Free Weights",
      specs,
    });
    const words = content.trim().split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(250);
    expect(content).toContain("## What it is");
    expect(content).toContain("## Who it suits");
    expect(content).toContain("As an Amazon Associate");
  });

  it("carries NO banned vocabulary (guards re-check, but the source is clean)", () => {
    const content = draftEditorialContent({
      title: "Example Product",
      brand: null,
      categoryName: "Protein Powders",
      specs,
    });
    expect(/\b(pork|lard|bacon|ethanol|wine|beer|rum|liquor|liqueur)\b/i.test(content)).toBe(false);
    expect(/\bfda[ -]?(approved|certified|endorsed)\b/i.test(content)).toBe(false);
    expect(/amazon\.com\/dp|tag=/i.test(content)).toBe(false); // no stored links
    expect(/\d+(\.\d+)?\s*%/.test(content)).toBe(false); // no commission rates
  });

  it("summary stays ≤200 chars", () => {
    const long = "A".repeat(300);
    const s = draftSummary(long, "Category", ["spec line"]);
    expect(s.length).toBeLessThanOrEqual(200);
  });
});

describe("transformCandidate", () => {
  const baseItem: CreatorsApiItem = {
    asin: "B08EXAMPLE",
    images: {
      primary: { large: { url: "https://m.media-amazon.com/images/I/51example.jpg" } },
    },
    itemInfo: {
      title: { displayValue: "Example Adjustable Dumbbell, 25 lb" },
      features: { displayValues: ["Solid steel"] },
      byLineInfo: { brand: { displayValue: "ExampleFit" } },
    },
    offersV2: {
      listings: [
        { price: { amount: 99.5, currency: "USD" }, availability: { message: "In Stock." } },
      ],
    },
  };

  it("shapes the full candidate with slug collision handling", () => {
    const c = transformCandidate(
      baseItem,
      { id: "cat-1", slug: "adjustable-fixed-dumbbells", name: "Adjustable & Fixed Dumbbells" },
      new Set(),
    );
    expect(c).not.toBeNull();
    expect(c!.slug).toBe("example-adjustable-dumbbell-25-lb");
    expect(c!.price_usd).toBe(99.5);
    expect(c!.payload.source).toBe("creators-api");
    // slug collision → ASIN tail
    const c2 = transformCandidate(
      baseItem,
      { id: "cat-1", slug: "adjustable-fixed-dumbbells", name: "Adjustable & Fixed Dumbbells" },
      new Set(["example-adjustable-dumbbell-25-lb"]),
    );
    expect(c2!.slug).toBe("example-adjustable-dumbbell-25-lb-mple"); // the ASIN's last 4 chars
  });

  it("rejects items without image or title or with bad ASINs", () => {
    expect(transformCandidate({ ...baseItem, asin: "bad" }, { id: "c", slug: "s", name: "N" })).toBeNull();
    expect(
      transformCandidate({ ...baseItem, images: { primary: null } }, { id: "c", slug: "s", name: "N" }),
    ).toBeNull();
    expect(
      transformCandidate({ ...baseItem, itemInfo: { title: null } }, { id: "c", slug: "s", name: "N" }),
    ).toBeNull();
  });
});

describe("candidateSlug", () => {
  it("appends the ASIN tail only on collision", () => {
    expect(candidateSlug("Adjustable Dumbbell 25 lb", "B08EXAMPLE", new Set())).toBe(
      "adjustable-dumbbell-25-lb",
    );
    expect(candidateSlug("Adjustable Dumbbell 25 lb", "B08EXAMPLE", new Set(["adjustable-dumbbell-25-lb"]))).toBe(
      "adjustable-dumbbell-25-lb-mple",
    );
  });
});

describe("the relevance engine", () => {
  const product = {
    productId: "p1",
    slug: "examplefit-adjustable-dumbbell",
    categorySlug: "adjustable-fixed-dumbbells",
    categoryName: "Adjustable & Fixed Dumbbells",
    title: "ExampleFit Adjustable Dumbbell 52.5 lb",
    brand: "ExampleFit",
    summary: "Space-saving adjustable dumbbell with dial selection.",
  };

  it("scores a category-topic hit strongly (dumbbell article)", () => {
    const match = scoreProductForPage(product, {
      title: "The Best Adjustable Dumbbells for a Home Gym",
      body: "## Why dumbbells?\nAdjustable dumbbells save space. progressive overload with a dumbbell.",
    });
    expect(match).not.toBeNull();
    expect(match!.categoryHit).toBe(true);
    expect(match!.score).toBeGreaterThanOrEqual(40);
  });

  it("returns null for an unrelated page (no random matching)", () => {
    const match = scoreProductForPage(product, {
      title: "How to Cook Egyptian Koshari at Home",
      body: "Rice, lentils, and pasta with tomato sauce. A traditional dish.",
    });
    expect(match).toBeNull();
  });

  it("requires ≥3 token matches without a category hit", () => {
    const niche = {
      ...product,
      categorySlug: "unknown-category-slug",
      categoryName: "Misc",
    };
    const match = scoreProductForPage(niche, {
      title: "ExampleFit dumbbell",
      body: "dumbbell examplefit space-saving selection",
    });
    expect(match).not.toBeNull();
    const weak = scoreProductForPage(niche, {
      title: "dumbbell",
      body: "unrelated text about cooking",
    });
    expect(weak).toBeNull();
  });

  it("pickAnchorPhrase prefers a title segment that occurs in the page", () => {
    const anchor = pickAnchorPhrase(
      product,
      {
        title: "Home Gym Guide",
        body: "We recommend the ExampleFit Adjustable Dumbbell 52.5 lb for most lifters.",
      },
      ["dumbbell", "adjustable"],
    );
    expect(anchor).toBe("ExampleFit Adjustable Dumbbell 52.5 lb");
  });
});

describe("insertStoreLinks (THE LANGUAGE LAW + the render discipline)", () => {
  const links = [
    {
      productId: "p1",
      anchorPhrase: "adjustable dumbbells",
      slug: "examplefit-adjustable-dumbbell",
      categorySlug: "adjustable-fixed-dumbbells",
      title: "ExampleFit Adjustable Dumbbell",
    },
    {
      productId: "p2",
      anchorPhrase: "foam roller",
      slug: "example-foam-roller",
      categorySlug: "foam-rollers-massage-tools",
      title: "Example Foam Roller",
    },
  ];

  const md = [
    "# Training at Home",
    "",
    "Adjustable dumbbells are the single best investment for a small home gym.",
    "They replace an entire rack of fixed weights and switch weight in seconds.",
    "",
    "## Recovery",
    "",
    "After heavy sessions, a foam roller helps with self-massage.",
    "Consistency beats intensity over months of training.",
  ].join("\n");

  it("is a HARD NO-OP for non-English content (the store's §0 law)", () => {
    const ar = "الدمبل القابل للتعديل أفضل استثمار foam roller للتدريب المنزلي";
    const out = insertStoreLinks(ar, "ar", links);
    expect(out.md).toBe(ar);
    expect(out.inserted).toHaveLength(0);
  });

  it("wraps first occurrences with INTERNAL product links only", () => {
    const out = insertStoreLinks(md, "en", links);
    expect(out.inserted).toHaveLength(2);
    expect(out.md).toContain(
      "[Adjustable dumbbells](/affiliate-store/adjustable-fixed-dumbbells/examplefit-adjustable-dumbbell)",
    );
    expect(out.md).toContain(
      "[foam roller](/affiliate-store/foam-rollers-massage-tools/example-foam-roller)",
    );
    expect(out.md).not.toContain("amazon.com"); // NEVER a direct Amazon link
  });

  it("is idempotent (a second pass inserts nothing)", () => {
    const first = insertStoreLinks(md, "en", links);
    const second = insertStoreLinks(first.md, "en", links);
    expect(second.inserted).toHaveLength(0);
    expect(second.md).toBe(first.md);
  });

  it("caps at the render limit and never links inside headings/links", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      productId: `p${i}`,
      anchorPhrase: "dumbbells",
      slug: `product-${i}`,
      categorySlug: "adjustable-fixed-dumbbells",
      title: `Product ${i}`,
    }));
    const out = insertStoreLinks(md, "en", many);
    expect(out.inserted.length).toBeLessThanOrEqual(4);
    const withLink = "Read [an existing link](https://example.com) about dumbbells today";
    const out2 = insertStoreLinks(withLink, "en", many.slice(0, 1));
    expect(out2.md).not.toContain("](/affiliate-store/");
    const heading = "# dumbbells guide\nsome text";
    const out3 = insertStoreLinks(heading, "en", many.slice(0, 1));
    expect(out3.inserted).toHaveLength(0); // never inside a heading
  });

  it("respects word boundaries (no mid-word wraps)", () => {
    const text =
      "Choosing equipment for a garage gym starts with the fundamentals. " +
      "Dumbbellsrule the conversation, and Our dumbbells review covers the models " +
      "that survived a full season of testing with lifters of different levels, " +
      "from complete beginners to intermediates running their first programs.";
    const out = insertStoreLinks(text, "en", [
      { ...links[0], anchorPhrase: "dumbbells" },
    ]);
    // "Dumbbellsrule" must NOT be split — only the clean later occurrence
    expect(out.md).toContain("Our [dumbbells](/affiliate-store/");
    expect(out.md).not.toContain("[Dumbbellsrule]");
  });

  it("returns unchanged for short content", () => {
    const out = insertStoreLinks("short", "en", links);
    expect(out.md).toBe("short");
  });
});

describe("tokenize", () => {
  it("drops stop words, short tokens, and pure digits", () => {
    const tokens = tokenize("The best 25 dumbbells for your home gym!");
    expect(tokens).toContain("dumbbells");
    expect(tokens).toContain("home");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("25");
    expect(tokens).not.toContain("for");
  });
});
