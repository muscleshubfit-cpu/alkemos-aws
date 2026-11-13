import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * BLOG-DIVERSITY-ENGINE (owner order 2026-11-13) — WIRING CANARIES.
 * The semantic gate, the diversity directive, the LRU angle rotation and
 * the V2 image discovery are only useful if they sit on the REAL
 * production path (P0 research → P1 outline → P3 images), not in a
 * dead helper module. These canaries pin the wiring the way
 * blog-topic-dedup.test.ts pins the research horizon: the exact call
 * sites inside the shipped sources.
 */

function src(rel: string): string {
  return readFileSync(rel, "utf8");
}

describe("P4 review prompt ↔ P5 G4 gate alignment (batch 2026-11-13 finding)", () => {
  const pipeline = src("src/lib/blog-pipeline.ts");

  it("instruction 9 states the ≥1 authority-link FLOOR the P5 gate enforces", () => {
    // Live evidence (run 43435605031): a stuck EN row failed P5's G4
    // authority floor through 3+ repair cycles because instruction 9
    // said "at most 2" (an upper bound — zero satisfies it) while the
    // FACT GUARD scared the model off unverified URLs. The standing
    // prompt must REQUIRE the link and name stable verified pages.
    expect(pipeline).toContain("AT LEAST ONE and at most 2 external links");
    expect(pipeline).toContain("stable VERIFIED pages");
    expect(pipeline).toContain("who.int/news-room/fact-sheets/detail/healthy-diet");
  });
});

describe("P0 research — the diversity engine rides the topic-discovery path", () => {
  const research = src("src/lib/blog-research.ts");

  it("injects the coverage-diversity directive into the research prompt", () => {
    expect(research).toContain("buildDiversityDirective");
    expect(research).toContain("diversityBlock");
  });

  it("pre-filters model topics LEXICALLY and SEMANTICALLY before P1", () => {
    expect(research).toContain("findSemanticTopicCollision");
    expect(research).toContain("survivesDedup");
  });

  it("keeps the grounding law (real search before every batch)", () => {
    expect(research).toContain("USE YOUR GOOGLE SEARCH TOOL");
    expect(research).toContain("getRecentPostsByLanguage(lang, 100)");
  });
});

describe("P1 outline — semantic dup guard + LRU angle rotation", () => {
  const outlineRoute = src("src/app/api/cron/blog/p1-outline/route.ts");
  const pipeline = src("src/lib/blog-pipeline.ts");

  it("the outline route's duplicate guard is lexical AND semantic", () => {
    expect(outlineRoute).toContain("findSemanticTopicCollision");
    expect(outlineRoute).toContain("isDuplicateTopic");
  });

  it("pickArticleAngle rotates least-recently-used instead of pure random", () => {
    expect(pipeline).toContain("pickLeastRecentlyUsedAngle");
    expect(pipeline).toContain("getRecentAngleIds(lang, 8)");
  });

  it("the outline prompt carries the imagePlan SPECIFICITY LAW", () => {
    expect(pipeline).toContain("SPECIFICITY LAW");
    expect(pipeline).toContain("BLOG-DIVERSITY-ENGINE");
  });
});

describe("P3 images — V2 discovery is the PRIMARY production path", () => {
  const route = src("src/app/api/cron/blog/p3-images/route.ts");

  it("routes sourcing through sourceImagesV2 → selectImagesWithDiscovery", () => {
    expect(route).toContain("sourceImagesV2");
    expect(route).toContain("selectImagesWithDiscovery");
  });

  it("passes the bilingual pair id (twin-cover adoption input)", () => {
    expect(route).toContain("pairId: qi.pair_id");
  });

  it("uses the featured+body visual-dedup memory (not covers only)", () => {
    expect(route).toContain("getRecentImageUrls(30, 10)");
  });

  it("stores discovery diagnostics on the bundle for the batch review", () => {
    expect(route).toContain("imageDiagnostics");
  });

  it("keeps the legacy single-query flow as the failure fallback", () => {
    expect(route).toContain("sourceImages(plan, coverHint, queueId)");
  });
});

describe("image sources — the free-stock law is untouched", () => {
  const images = src("src/lib/blog-images.ts");

  it("still Pexels-first with Unsplash/Pixabay failover (no AI images)", () => {
    expect(images).toContain("api.pexels.com/v1/search");
    expect(images).toContain("api.unsplash.com/search/photos");
    expect(images).toContain("pixabay.com/api/");
  });

  it("the candidate pool is exposed for the ranked discovery path", () => {
    expect(images).toContain("export async function fetchImageCandidates");
    expect(images).toContain("export async function getRecentImageUrls");
  });
});

describe("AI registry — the visual-brief spec is registered", () => {
  const registry = src("src/lib/ai-registry.ts");

  it("blog:visual-brief exists with the light-JSON policy", () => {
    expect(registry).toContain('"blog:visual-brief"');
    expect(registry).toContain("blog-image-discovery.ts buildVisualBrief");
  });
});

describe("queue — the LRU angle input is a real DB helper", () => {
  const queue = src("src/lib/blog-queue.ts");

  it("getRecentAngleIds reads recent bundles' outline.angle newest-first", () => {
    expect(queue).toContain("export async function getRecentAngleIds");
    expect(queue).toContain("outline?.angle");
  });
});
