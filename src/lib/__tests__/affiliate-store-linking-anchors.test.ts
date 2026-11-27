import { describe, expect, it } from "vitest";
import {
  occursInRenderablePosition,
  renderableBlogBody,
  buildBlogPipelineContent,
  pickAnchorPhrase,
  anchorRendersVisibly,
  insertStoreLinks,
  type InlineLinkRow,
  type BlogRenderContext,
} from "../affiliate-store-linking";

/**
 * THE PHASE-533 ANCHOR-LAW CANARIES (report 533 §3 — the structural
 * fix): anchors are only ever picked from the article's RENDERABLE
 * body, and every candidate must survive the real render pipeline
 * (insertStoreLinks → FAQ strip → title-heading strip). These tests
 * pin the three live-measured failure classes:
 *   ① anchors that only exist in TABLE rows (never wrapped),
 *   ② anchors that only exist in TAGS/KEYWORDS (never in the body),
 *   ③ anchors inside the FAQ section (stripped at render — the
 *      women-home-muscle-building live defect), including the sneaky
 *      "FAQ occurrence comes FIRST" variant that wrapped the wrong
 *      occurrence.
 * Plus the healthy classes: plain-body anchors, first-occurrence
 * wrapping, and the ultimate "no dead link" guarantee.
 */

const PRODUCT = {
  productId: "p1",
  slug: "optimum-nutrition-micronized-creatine",
  categorySlug: "creatine-amino-acids",
  categoryName: "Creatine & Amino Acids",
  title: "Optimum Nutrition Micronized Creatine Monohydrate Powder, Unflavored",
  brand: "Optimum Nutrition",
  summary: "Micronized creatine monohydrate powder for strength.",
};

const linkRow = (anchorPhrase: string): InlineLinkRow => ({
  productId: "p1",
  anchorPhrase,
  slug: PRODUCT.slug,
  categorySlug: PRODUCT.categorySlug,
  title: PRODUCT.title,
});

const URL_P1 = `/affiliate-store/${PRODUCT.categorySlug}/${PRODUCT.slug}`;

// An article-shaped fixture: long enough for the injector (≥200 chars),
// a leading title heading (Phase 187), paragraphs, a table, an existing
// markdown link, and a trailing FAQ section (Phase 178).
const ARTICLE = [
  "# Creatine Timing for Muscle Gain",
  "",
  "Most lifters ask when to take creatine for the best muscle gain results. Research on creatine timing suggests consistency matters far more than the clock.",
  "",
  "## How to Read a Supplement Label",
  "",
  "The first ingredient tells the truth about a blend. The label on Optimum Nutrition Micronized Creatine Monohydrate Powder lists a single ingredient and nothing else.",
  "",
  "| Form | Notes |",
  "| --- | --- |",
  "| Powder | Unflavored |",
  "",
  "Some lifters prefer a [pre-workout checklist](/blog/pre-workout-nutrition-guide) before shopping.",
  "",
  "## Frequently Asked Questions",
  "",
  "Do I need to load creatine? No — a steady daily dose of creatine monohydrate reaches saturation in about three weeks.",
  "",
  "Is creatine safe for kidneys? Healthy adults tolerate it well in studied doses.",
].join("\n");

const ARTICLE_NO_FAQ_HEADING = ARTICLE.replace("## Frequently Asked Questions", "## Common Questions");

const ctxWith = (content: string, hasFaqCards = true): BlogRenderContext => ({
  pipelineContent: content,
  title: "Creatine Timing for Muscle Gain",
  hasFaqCards,
});

describe("occursInRenderablePosition (the wrappable-position law)", () => {
  it("accepts a phrase in a plain paragraph", () => {
    expect(occursInRenderablePosition("creatine timing", ARTICLE)).toBe(true);
  });

  it("rejects a heading-line occurrence (headings are never wrapped)", () => {
    expect(occursInRenderablePosition("How to Read a Supplement Label", ARTICLE)).toBe(false);
  });

  it("rejects a table-row occurrence (class ① — the live 'Unflavored' defect)", () => {
    expect(occursInRenderablePosition("Unflavored", ARTICLE)).toBe(false);
  });

  it("rejects an occurrence inside an existing markdown link (never nests)", () => {
    expect(occursInRenderablePosition("pre-workout checklist", ARTICLE)).toBe(false);
    // the same words outside any link ARE wrappable
    expect(occursInRenderablePosition("creatine monohydrate", ARTICLE)).toBe(true);
  });

  it("rejects a blockquote occurrence", () => {
    const md = "Intro line here.\n\n> consistency matters far more\n\nClosing line here.";
    expect(occursInRenderablePosition("consistency matters far more", md)).toBe(false);
  });

  it("rejects mid-word occurrences (word boundaries — the injector law)", () => {
    const md = "Our creatinetiming approach is simple and consistent every single training day.";
    expect(occursInRenderablePosition("creatine timing", md)).toBe(false);
  });

  it("accepts a phrase appearing AFTER an existing link in the same line", () => {
    const md = "See the [official guide](/blog/x) for more about creatine timing details today.";
    expect(occursInRenderablePosition("creatine timing", md)).toBe(true);
  });
});

describe("renderableBlogBody (the displayed body — Phase 178/187 strip order)", () => {
  it("strips the FAQ section (heading through next H2) when faq cards exist", () => {
    const displayed = renderableBlogBody(ARTICLE, "Creatine Timing for Muscle Gain", true);
    expect(displayed).toContain("How to Read a Supplement Label");
    expect(displayed).not.toContain("Do I need to load creatine?");
    expect(displayed).not.toContain("Frequently Asked Questions");
  });

  it("keeps the FAQ section when there are no faq cards (single-display law)", () => {
    const displayed = renderableBlogBody(ARTICLE, "Creatine Timing for Muscle Gain", false);
    expect(displayed).toContain("Do I need to load creatine?");
  });

  it("strips the leading title heading when it matches the post title (Phase 187)", () => {
    const displayed = renderableBlogBody(ARTICLE, "Creatine Timing for Muscle Gain", true);
    expect(displayed.startsWith("# ")).toBe(false);
    expect(displayed).toContain("Most lifters ask");
  });

  it("removes a TRAILING FAQ section entirely (heading to end of document)", () => {
    const displayed = renderableBlogBody(ARTICLE, "Creatine Timing for Muscle Gain", true);
    expect(displayed).not.toContain("Is creatine safe for kidneys?");
    // everything before the FAQ heading survives
    expect(displayed).toContain("pre-workout checklist");
  });
});

describe("pickAnchorPhrase (anchors from the renderable body ONLY)", () => {
  it("prefers a product-title segment that occurs in the renderable body", () => {
    const displayed = renderableBlogBody(ARTICLE, "Creatine Timing for Muscle Gain", true);
    const anchor = pickAnchorPhrase(
      PRODUCT,
      { title: "Creatine Timing for Muscle Gain", body: displayed },
      ["creatine", "monohydrate"],
    );
    expect(anchor).toBe("Optimum Nutrition Micronized Creatine Monohydrate Powder");
  });

  it("returns a RENDERABLE token fallback — never the table-only segment (class ①)", () => {
    const displayed = renderableBlogBody(ARTICLE, "Creatine Timing for Muscle Gain", true);
    // "Unflavored" lives only inside the table row — never an anchor; the
    // token fallback "creatine" IS in the displayed body in a wrappable
    // position, so that is the honest anchor
    const anchor = pickAnchorPhrase(
      { ...PRODUCT, title: "Micronized Creatine Powder, Unflavored" },
      { title: "Creatine Timing", body: displayed },
      ["creatine"],
    );
    expect(anchor).toBe("creatine");
    expect(anchor).not.toBe("Unflavored");
    // with no matched tokens and no renderable segment there is NO anchor
    // → the approve path must refuse (the 533 law)
    const none = pickAnchorPhrase(
      { ...PRODUCT, title: "Micronized Creatine Powder, Unflavored" },
      { title: "Creatine Timing", body: displayed },
      [],
    );
    expect(none).toBeNull();
  });

  it("returns null when the phrase exists only in tags (class ② — tags are never passed as body)", () => {
    const displayed = renderableBlogBody(ARTICLE_NO_FAQ_HEADING, "Creatine Timing", true);
    const anchor = pickAnchorPhrase(
      { ...PRODUCT, title: "Smart Scale Body Composition Analyzer" },
      { title: "Creatine Timing", body: displayed },
      ["scale"],
    );
    expect(anchor).toBeNull();
  });

  it("falls back to a matched-token pair only in a renderable position", () => {
    // "reaches saturation" exists ONLY in the FAQ answer — which the
    // displayed body (FAQ-stripped) no longer contains → no anchor
    const anchor = pickAnchorPhrase(
      { ...PRODUCT, title: "Totally Unrelated Product Name, Never In Body" },
      { title: "Creatine Timing", body: renderableBlogBody(ARTICLE, "Creatine Timing", true) },
      ["reaches", "saturation"],
    );
    expect(anchor).toBeNull();
    // same pair on a body whose FAQ section is NOT recognized as strippable
    // (the heading does not match the Phase-178 regex) → the pair stays
    // renderable and becomes the honest anchor
    const anchor2 = pickAnchorPhrase(
      { ...PRODUCT, title: "Totally Unrelated Product Name, Never In Body" },
      { title: "Creatine Timing", body: renderableBlogBody(ARTICLE_NO_FAQ_HEADING, "Creatine Timing", true) },
      ["reaches", "saturation"],
    );
    expect(anchor2).toBe("reaches saturation");
  });

  it("never uses the page title as an anchor source (it renders as the H1 hero)", () => {
    const product = { ...PRODUCT, title: "Creatine Timing for Muscle Gain Guide Product" };
    const body = "The article body never mentions the product itself anywhere at all.";
    const anchor = pickAnchorPhrase(product, { title: "Creatine Timing for Muscle Gain", body }, []);
    expect(anchor).toBeNull();
  });
});

describe("anchorRendersVisibly (the real-pipeline probe — no dead links)", () => {
  it("accepts an anchor in a plain paragraph: the wrap survives the strips", () => {
    const ctx = ctxWith(ARTICLE);
    expect(anchorRendersVisibly(ctx, [linkRow("creatine timing")], URL_P1)).toBe(true);
  });

  it("rejects an anchor whose only occurrence is inside the FAQ section (class ③)", () => {
    const ctx = ctxWith(ARTICLE);
    // "daily dose of creatine monohydrate" only exists in the FAQ answer
    expect(anchorRendersVisibly(ctx, [linkRow("daily dose of creatine monohydrate")], URL_P1)).toBe(false);
  });

  it("rejects the first-occurrence hazard: FAQ occurrence BEFORE the visible one (the live women-home defect shape)", () => {
    // The phrase occurs twice: FIRST inside the FAQ section, LATER in a
    // visible paragraph. The injector wraps the FIRST occurrence — which
    // the Phase-178 strip then removes. The probe must say NOT visible.
    const md = [
      "# Creatine Timing for Muscle Gain",
      "",
      "Intro paragraph about training and consistency over many months.",
      "",
      "## Frequently Asked Questions",
      "",
      "What about dumbbell pair options? A dumbbell pair works for home training.",
      "",
      "## Training at Home",
      "",
      "A dumbbell pair is the single best investment for a small home gym setup.",
    ].join("\n");
    const ctx = ctxWith(md);
    expect(anchorRendersVisibly(ctx, [linkRow("dumbbell pair")], URL_P1)).toBe(false);
  });

  it("rejects a table-only anchor (the injector never wraps table rows)", () => {
    const ctx = ctxWith(ARTICLE);
    expect(anchorRendersVisibly(ctx, [linkRow("Unflavored")], URL_P1)).toBe(false);
  });

  it("rejects an anchor inside an existing markdown link (no nesting)", () => {
    const ctx = ctxWith(ARTICLE);
    expect(anchorRendersVisibly(ctx, [linkRow("pre-workout checklist")], URL_P1)).toBe(false);
  });

  it("rejects an anchor in a heading line", () => {
    const ctx = ctxWith(ARTICLE);
    expect(anchorRendersVisibly(ctx, [linkRow("How to Read a Supplement Label")], URL_P1)).toBe(false);
  });

  it("rejects when the page already carries more links than the render cap", () => {
    const ctx = ctxWith(ARTICLE);
    const others: InlineLinkRow[] = [1, 2, 3, 4].map((i) => ({
      productId: `other-${i}`,
      anchorPhrase: "creatine",
      slug: `other-product-${i}`,
      categorySlug: "creatine-amino-acids",
      title: `Other ${i}`,
    }));
    // 4 existing links fill the RENDER_CAP of 4 → the candidate never renders
    expect(anchorRendersVisibly(ctx, [...others, linkRow("creatine timing")], URL_P1)).toBe(false);
  });

  it("honors the shared-anchor collision: two links with the same phrase need two renderable occurrences", () => {
    const md = [
      "# Creatine Timing for Muscle Gain",
      "",
      "Creatine timing matters, and creatine timing consistency beats perfection every week.",
      "",
      "## Frequently Asked Questions",
      "",
      "Does creatine timing matter? Yes but consistency wins.",
    ].join("\n");
    const ctx = ctxWith(md);
    const second: InlineLinkRow = {
      productId: "p2",
      anchorPhrase: "creatine timing",
      slug: "second-product",
      categorySlug: "creatine-amino-acids",
      title: "Second",
    };
    const url2 = "/affiliate-store/creatine-amino-acids/second-product";
    // the second link wraps the SECOND visible occurrence (first-occurrence
    // skip is per-link) and stays visible — the probe proves it
    expect(anchorRendersVisibly(ctx, [linkRow("creatine timing"), second], url2)).toBe(true);
  });
});

describe("buildBlogPipelineContent (the template order: sanitize → tool links)", () => {
  it("wraps a tool phrase into a link so the same phrase is no longer a wrappable anchor", () => {
    const md = [
      "# A Long Enough Article Title About Planning",
      "",
      "Plan your protein intake precisely and track real progress week over week without missing anything important at all.",
    ].join("\n");
    const pools = { en: new Set<string>(), ar: new Set<string>() };
    const pipeline = buildBlogPipelineContent(md, pools);
    // the tool injector wrapped the WHOLE phrase "protein intake"
    expect(pipeline).toContain("[protein intake](/tools/macro-calculator)");
    // ...so that exact phrase is no longer a wrappable anchor position
    expect(occursInRenderablePosition("protein intake", pipeline)).toBe(false);
    // while plain text around it stays wrappable
    expect(occursInRenderablePosition("real progress", pipeline)).toBe(true);
  });

  it("wraps only the FIRST matched word — later mentions of neighboring words stay wrappable", () => {
    const md = [
      "# A Long Enough Article Title About Planning",
      "",
      "Track your calories with the calorie calculator and then review the numbers every week for real progress.",
    ].join("\n");
    const pools = { en: new Set<string>(), ar: new Set<string>() };
    const pipeline = buildBlogPipelineContent(md, pools);
    // the first "calories" became a tool link …
    expect(pipeline).toContain("[calories](/tools/calorie-calculator)");
    // … so "calories" alone is spent, but the later "calorie calculator"
    // mention is plain text and remains a valid anchor position
    expect(occursInRenderablePosition("calories", pipeline)).toBe(false);
    expect(occursInRenderablePosition("calorie calculator", pipeline)).toBe(true);
  });

  it("keeps the pipeline stable when no tool phrases exist", () => {
    const pools = { en: new Set<string>(), ar: new Set<string>() };
    const pipeline = buildBlogPipelineContent(ARTICLE, pools);
    expect(pipeline).toContain("Most lifters ask");
  });
});

describe("the end-to-end no-dead-link law (insertStoreLinks + the strips)", () => {
  it("an approved-shape link remains in the DISPLAYED body after the full render pipeline", () => {
    const ctx = ctxWith(ARTICLE);
    const { md } = insertStoreLinks(ctx.pipelineContent, "en", [linkRow("creatine timing")]);
    expect(md).toContain(`[creatine timing](${URL_P1})`);
    const displayed = renderableBlogBody(md, ctx.title, ctx.hasFaqCards);
    expect(displayed).toContain(`[creatine timing](${URL_P1})`);
  });

  it("a dead anchor writes a wrap that the strips erase (why the probe gate exists)", () => {
    const ctx = ctxWith(ARTICLE);
    const { md, inserted } = insertStoreLinks(ctx.pipelineContent, "en", [linkRow("daily dose of creatine monohydrate")]);
    // the injector DID wrap (inside the FAQ section)...
    expect(inserted.length).toBe(1);
    // ...but the displayed body no longer carries it — the exact dead-row
    // shape the 533 approval gate refuses to write
    const displayed = renderableBlogBody(md, ctx.title, ctx.hasFaqCards);
    expect(displayed).not.toContain(URL_P1);
    // and the probe says so up front:
    expect(anchorRendersVisibly(ctx, [linkRow("daily dose of creatine monohydrate")], URL_P1)).toBe(false);
  });
});

describe("GENERIC_SINGLE_ANCHORS blocklist (534-hotfix: junk single-word anchors never ship)", () => {
  it("rejects 'total' for a 'Total Upper Body Doorway Pull-Up Bar' product — falls to a better candidate", () => {
    const product = {
      ...PRODUCT,
      title: "Iron Gym Total Upper Body Doorway Pull-Up Bar, Black",
      categorySlug: "power-racks-benches-pull-up-bars",
      categoryName: "Power Racks, Benches & Pull-up Bars",
    };
    const displayed = renderableBlogBody(ARTICLE, "Creatine Timing for Muscle Gain", true);
    // 'total' occurs renderably in the body? force it to, and prove it is STILL not picked
    const bodyWithTotal = displayed.replace(
      "Most lifters ask",
      "The total volume matters and Most lifters ask",
    );
    const anchor = pickAnchorPhrase(product, { title: "Creatine Timing", body: bodyWithTotal }, ["total"]);
    expect(anchor).not.toBe("total");
  });

  it("rejects 'classic' (Bigelow Classic Green Tea class) even when it occurs in the body", () => {
    const product = {
      ...PRODUCT,
      title: "Bigelow Classic Green Tea Bags (40 ct, 6 Pack)",
      categorySlug: "coffees-teas",
      categoryName: "Coffees & Teas",
    };
    const body = "A classic approach to training keeps the total weekly volume honest and repeatable across months.";
    const anchor = pickAnchorPhrase(product, { title: "Training", body }, ["classic", "green"]);
    expect(anchor).toBeNull();
  });

  it("still accepts a real type noun from the product name ('casein', 'magnesium', 'creatine')", () => {
    const casein = { ...PRODUCT, title: "Optimum Nutrition Gold Standard 100% Casein Protein Powder" };
    const body = renderableBlogBody(ARTICLE, "Creatine Timing", true).replace(
      "Most lifters ask",
      "Some lifters pair creatine with casein at night; Most lifters ask",
    );
    expect(pickAnchorPhrase(casein, { title: "Creatine Timing", body }, ["casein"])).toBe("casein");
  });
});
