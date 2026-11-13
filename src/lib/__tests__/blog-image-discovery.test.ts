import { describe, it, expect, vi, beforeEach } from "vitest";
import jpeg from "jpeg-js";

/**
 * BLOG-DIVERSITY-ENGINE (owner order 2026-11-13 §2) — the V2 image
 * discovery battery. The dHash visual-inspection core is tested against
 * REAL JPEG bytes (synthetic images encoded with jpeg-js, embedded as
 * data: URLs — the production fetch path downloads 96px CDN variants;
 * data URLs exercise the identical decode→grayscale→dHash pipeline
 * without network), and the orchestrator is tested end-to-end with the
 * stock-source fetch and the AI router mocked — proving the multi-query
 * → fingerprint → rank → near-duplicate-reject flow actually runs.
 *
 * FIXTURE GEOMETRY (why these patterns): dHash compares HORIZONTALLY
 * adjacent 9×8 box samples (bit = left < right ? 0 : 1), so the distinct
 * fixture families are chosen by their BIT SIGNATURES — ascending ramp
 * → 00000000 · descending ramp → 11111111 · alternating 28px bands →
 * 10111011 · three 42px steps → 11011011 — pairwise Hamming ≥ 16 (the
 * pick families are ≥ 24 apart; only the near-duplicate pairs sit < 10).
 * Sample boxes (w/9) align exactly with band/step edges so JPEG ringing
 * cannot flip a comparison.
 */

vi.mock("@/lib/ai-router", () => ({
  // Visual brief model call fails → the deterministic per-domain plan
  // must take over (the pipeline NEVER dies on the brief).
  dispatchAI: vi.fn(async () => {
    throw new Error("model unavailable (test)");
  }),
}));

vi.mock("@/lib/blog-queue", () => ({
  // No bilingual twin row → no cover adoption → the full discovery path.
  findRecentPairRows: vi.fn(async () => []),
}));

vi.mock("@/lib/blog-images", () => ({
  fetchImageCandidates: vi.fn(),
}));

import {
  NEAR_DUPLICATE_BITS,
  SIMILAR_BITS,
  computeDHash,
  hammingDistance,
  dHashFromJpegBytes,
  thumbnailUrl,
  translateArabicToImageEnglish,
  buildDeterministicQueries,
  validateBriefQueries,
  rankImageCandidates,
  selectImagesWithDiscovery,
} from "@/lib/blog-image-discovery";
import { fetchImageCandidates, type ImageCandidate } from "@/lib/blog-images";

// ─────────────────────────────────────────────────────────────────
// Synthetic image fixtures (deterministic pixels → deterministic dHash)
// ─────────────────────────────────────────────────────────────────

/** Image builder: pixel value from column x (0..w-1), grayscale RGBA. */
function fromColumnPattern(w: number, h: number, value: (x: number) => number): Uint8Array {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const v = Math.round(value(x));
      const i = (y * w + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return data;
}

/** w=126 → 9 sample boxes of exactly 14px; bands/steps below align to it. */
const W = 126;
const H = 126;

/** ASCENDING ramp → dHash 00000000. */
const ASC_96 = encode(96, 96, (x, w) => (x / (w - 1)) * 255);
const ASC_192 = encode(192, 192, (x, w) => (x / (w - 1)) * 255); // same scene, other "resolution"
/** DESCENDING ramp → dHash 11111111 (Hamming 64 vs ASC). */
const DESC = encode(W, H, (x, w) => 255 - (x / (w - 1)) * 255);
/** Alternating 28px bands → dHash 10111011 (Hamming 16 vs DESC · 48 vs ASC). */
const ALT_BANDS = encode(W, H, (x) => (Math.floor(x / 28) % 2 === 0 ? 0 : 255));
/** Three ascending 42px steps → dHash 11011011 (Hamming 24+ vs every family). */
const STAIRS = encode(W, H, (x) => Math.floor(x / 42) * 127);

function encode(w: number, h: number, value: (x: number, w: number) => number): Uint8Array {
  return new Uint8Array(
    jpeg.encode({ data: Buffer.from(fromColumnPattern(w, h, (x) => value(x, w))), width: w, height: h }, 92).data,
  );
}

/** data: URL of an encoded image — fetchable by Node's undici, no network. */
function dataUrl(bytes: Uint8Array): string {
  return `data:image/jpeg;base64,${Buffer.from(bytes).toString("base64")}`;
}

// ─────────────────────────────────────────────────────────────────
// Perceptual hashing — the REAL visual inspection
// ─────────────────────────────────────────────────────────────────

describe("dHash — decode → grayscale → 64-bit difference hash", () => {
  it("produces a 64-char binary hash from real JPEG bytes", () => {
    const hash = dHashFromJpegBytes(ASC_96);
    expect(hash).not.toBeNull();
    expect(hash).toMatch(/^[01]{64}$/);
  });

  it("identical bytes → identical hash (distance 0)", () => {
    expect(hammingDistance(dHashFromJpegBytes(ASC_96), dHashFromJpegBytes(ASC_96))).toBe(0);
  });

  it("SAME SCENE at a different resolution stays a near-duplicate (< NEAR_DUPLICATE_BITS)", () => {
    // The production failure mode: the same stock photo re-served by the
    // CDN at another size / another id — URL dedup alone misses it, the
    // perceptual hash must catch it.
    const a = dHashFromJpegBytes(ASC_96);
    const b = dHashFromJpegBytes(ASC_192);
    expect(hammingDistance(a, b)).toBeLessThan(NEAR_DUPLICATE_BITS);
  });

  it("STRUCTURALLY different scenes land far apart (> SIMILAR_BITS)", () => {
    // Measured fixture geometry: ramps are 64 bits apart; the band/stair
    // families sit 24 bits from the ramps' poles (and 24 from each other)
    // — inside the acceptable "not near-duplicate" half of the space.
    expect(hammingDistance(dHashFromJpegBytes(ASC_96), dHashFromJpegBytes(DESC))).toBe(64);
    expect(hammingDistance(dHashFromJpegBytes(ASC_96), dHashFromJpegBytes(STAIRS))).toBeGreaterThan(
      SIMILAR_BITS,
    );
    expect(hammingDistance(dHashFromJpegBytes(DESC), dHashFromJpegBytes(ALT_BANDS))).toBeGreaterThan(
      SIMILAR_BITS,
    );
    // …while the pick families stay above the NEAR-DUPLICATE line so the
    // orchestrator accepts them (pinned by the flow test below).
    expect(hammingDistance(dHashFromJpegBytes(DESC), dHashFromJpegBytes(STAIRS))).toBeGreaterThanOrEqual(
      NEAR_DUPLICATE_BITS,
    );
    expect(hammingDistance(dHashFromJpegBytes(ALT_BANDS), dHashFromJpegBytes(STAIRS))).toBeGreaterThanOrEqual(
      NEAR_DUPLICATE_BITS,
    );
  });

  it("computeDHash on raw RGBA — exact bit control (9×8 identity sampling)", () => {
    const ascending = computeDHash(fromColumnPattern(9, 8, (x) => x * 30), 9, 8);
    const descending = computeDHash(fromColumnPattern(9, 8, (x) => 255 - x * 30), 9, 8);
    const alternating = computeDHash(fromColumnPattern(9, 8, (x) => (x % 2 === 0 ? 0 : 255)), 9, 8);
    expect(ascending).toBe("0".repeat(64));
    expect(descending).toBe("1".repeat(64));
    // alternating columns → every comparison differs → 0101… per row
    expect(alternating).toBe(("01".repeat(4) + "").repeat(8));
    expect(hammingDistance(ascending, descending)).toBe(64);
  });

  it("computeDHash returns null for degenerate inputs; hamming is Infinity on mismatch", () => {
    expect(computeDHash(new Uint8Array(0), 4, 4)).toBeNull();
    expect(hammingDistance("01", "0101")).toBe(Number.POSITIVE_INFINITY);
    expect(hammingDistance(null, "0101")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("thumbnailUrl — smallest CDN variant per stock source", () => {
  it("pexels → 96px compressed variant", () => {
    expect(thumbnailUrl("https://images.pexels.com/photos/1.jpeg?a=b")).toBe(
      "https://images.pexels.com/photos/1.jpeg?auto=compress&cs=tinysrgb&w=96",
    );
  });
  it("unsplash → w=96", () => {
    expect(thumbnailUrl("https://images.unsplash.com/photo-x?w=1200")).toContain("w=96");
  });
  it("unknown host → unchanged (hash the original)", () => {
    expect(thumbnailUrl("https://cdn.example.com/img.jpg")).toBe("https://cdn.example.com/img.jpg");
  });
});

// ─────────────────────────────────────────────────────────────────
// AR→EN query vocabulary + deterministic per-domain plan
// ─────────────────────────────────────────────────────────────────

describe("translateArabicToImageEnglish — stock sites are searched in EN", () => {
  it("maps Arabic fitness terms onto their English search words", () => {
    const terms = translateArabicToImageEnglish("تمارين الصدر في المنزل بالدمبل");
    expect(terms).toContain("workout");
    expect(terms).toContain("home");
    expect(terms).toContain("dumbbell");
  });

  it("returns [] for text with no known terms", () => {
    expect(translateArabicToImageEnglish("الصدر فقط")).toEqual([]);
  });
});

describe("buildDeterministicQueries — the no-model fallback plan", () => {
  it("always yields ≥3 queries with alternatives for every domain", () => {
    const domains = [
      "nutrition", "muscle-strength", "fat-loss", "training", "recovery",
      "supplements", "injury-prevention", "metabolic-aging",
      "mistakes-myths", "research-applied", "practical-guides",
    ] as const;
    for (const domain of domains) {
      const plan = buildDeterministicQueries({
        lang: "en",
        queueId: `q-${domain}`,
        topic: "any topic",
        title: "any title",
        focusKeyword: "kw",
        domain,
        slots: 5,
      });
      expect(plan.length).toBeGreaterThanOrEqual(3);
      expect(new Set(plan.map((q) => q.sceneType)).size).toBeGreaterThanOrEqual(2);
      expect(plan.every((q) => q.query.length > 0 && q.alternatives.length === 2)).toBe(true);
    }
  });

  it("is deterministic per queueId and rotates between two queueIds of one domain", () => {
    const base = {
      lang: "en" as const,
      topic: "topic",
      title: "title",
      focusKeyword: "kw",
      domain: "training" as const,
      slots: 5,
    };
    const a1 = buildDeterministicQueries({ ...base, queueId: "id-1" });
    const a2 = buildDeterministicQueries({ ...base, queueId: "id-1" });
    const b = buildDeterministicQueries({ ...base, queueId: "id-2" });
    expect(a1).toEqual(a2);
    // Same domain, different queueId → at least one different query
    // (the rotation offset breaks the same-domain same-look pattern).
    expect(a1.map((q) => q.query)).not.toEqual(b.map((q) => q.query));
  });

  it("AR topics inject their translated English terms into the cover query", () => {
    const plan = buildDeterministicQueries({
      lang: "ar",
      queueId: "ar-1",
      topic: "تمارين المنزل",
      title: "تمارين منزلية",
      focusKeyword: "تمارين المنزل",
      domain: "training",
      slots: 5,
    });
    expect(plan[0].query).toContain("workout");
    expect(plan[0].query).toContain("home");
  });
});

// ─────────────────────────────────────────────────────────────────
// Model-brief validation (the scene-spread + specificity laws)
// ─────────────────────────────────────────────────────────────────

describe("validateBriefQueries — the model brief quality gate", () => {
  const ok = {
    queries: [
      { query: "kettlebell goblet squat home", sceneType: "person-action", alternatives: ["goblet squat kettlebell", "kettlebell squat living room"] },
      { query: "casein yogurt night bowl", sceneType: "food", alternatives: ["greek yogurt bowl night", "cottage cheese bowl"] },
      { query: "dark bedroom quiet sleep", sceneType: "environment", alternatives: ["dim bedroom night", "quiet bedroom morning"] },
      { query: "training log notebook pen", sceneType: "detail", alternatives: ["workout journal notes", "gym log book"] },
    ],
  };

  it("accepts a valid 4-query brief with ≥3 scene types", () => {
    const out = validateBriefQueries(ok, 4);
    expect(out).not.toBeNull();
    expect(out!.length).toBe(4);
    expect(out![0].query).toBe("kettlebell goblet squat home");
  });

  it("rejects a single-scene plan (the scene-spread law)", () => {
    const flat = {
      queries: ok.queries.map((q) => ({ ...q, sceneType: "environment" })),
    };
    expect(validateBriefQueries(flat, 4)).toBeNull();
  });

  it("filters non-English, too-short, too-long and duplicate queries", () => {
    const mixed = {
      queries: [
        ...ok.queries,
        { query: "تمرين منزلي بالدمبل", sceneType: "food", alternatives: [] }, // Arabic → filtered
        { query: "gym", sceneType: "detail", alternatives: [] }, // 1 word → filtered
        { query: "a b c d e f g h i", sceneType: "environment", alternatives: [] }, // 9 words → filtered
        { query: "Kettlebell goblet squat home", sceneType: "environment", alternatives: [] }, // dup (case) → filtered
      ],
    };
    const out = validateBriefQueries(mixed, 8);
    expect(out).not.toBeNull();
    expect(out!.length).toBe(4);
  });

  it("returns null for <3 surviving queries or non-array payloads", () => {
    expect(validateBriefQueries({ queries: ok.queries.slice(0, 2) }, 4)).toBeNull();
    expect(validateBriefQueries({ nope: true }, 4)).toBeNull();
    expect(validateBriefQueries(null, 4)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────
// Ranked selection — relevance × visual diversity, near-dup rejection
// ─────────────────────────────────────────────────────────────────

const HASH_ASC = dHashFromJpegBytes(ASC_96)!;
const HASH_ASC_RESIZED = dHashFromJpegBytes(ASC_192)!; // near-duplicate of ASC
const HASH_DESC = dHashFromJpegBytes(DESC)!; // different scene

function cand(url: string, alt: string, rank = 0): ImageCandidate {
  return { url, alt, credit: "test", source: "pexels", rank };
}

describe("rankImageCandidates", () => {
  it("REJECTS near-duplicates of already-used images (hamming < NEAR_DUPLICATE_BITS)", () => {
    const ranked = rankImageCandidates(
      [cand("https://x/dup.jpg", "kettlebell goblet squat")],
      {
        query: "kettlebell goblet squat",
        usedHashes: [HASH_ASC],
        pickedSceneTypes: [],
        excludeUrls: [],
      },
      new Map([["https://x/dup.jpg", HASH_ASC_RESIZED]]),
    );
    expect(ranked[0].rejected).toBe("near-duplicate");
    expect(ranked[0].score).toBe(0);
  });

  it("REJECTS excluded URLs outright", () => {
    const ranked = rankImageCandidates(
      [cand("https://x/banned.jpg", "kettlebell goblet squat")],
      {
        query: "kettlebell goblet squat",
        usedHashes: [],
        pickedSceneTypes: [],
        excludeUrls: ["https://x/banned.jpg"],
      },
      new Map(),
    );
    expect(ranked[0].rejected).toBe("excluded");
  });

  it("ranks the topically-relevant candidate above the weak one (relevance weight)", () => {
    const ranked = rankImageCandidates(
      [cand("https://x/weak.jpg", "sunny park bench", 8), cand("https://x/hit.jpg", "kettlebell goblet squat home", 0)],
      { query: "kettlebell goblet squat", usedHashes: [], pickedSceneTypes: [], excludeUrls: [] },
      new Map([
        ["https://x/weak.jpg", HASH_DESC],
        ["https://x/hit.jpg", HASH_DESC],
      ]),
    );
    expect(ranked[0].candidate.url).toBe("https://x/hit.jpg");
    expect(ranked[0].relevance).toBeGreaterThan(ranked[1].relevance);
  });

  it("an unknown hash is diversity-neutral (0.5), a fresh scene scores full diversity", () => {
    const ranked = rankImageCandidates(
      [cand("https://x/unknown.jpg", "kettlebell goblet squat"), cand("https://x/fresh.jpg", "kettlebell goblet squat")],
      { query: "kettlebell goblet squat", usedHashes: [HASH_ASC], pickedSceneTypes: [], excludeUrls: [] },
      new Map([["https://x/fresh.jpg", HASH_DESC]]), // unknown.jpg → no hash entry
    );
    const unknown = ranked.find((r) => r.candidate.url === "https://x/unknown.jpg")!;
    const fresh = ranked.find((r) => r.candidate.url === "https://x/fresh.jpg")!;
    expect(unknown.diversity).toBeCloseTo(0.5);
    expect(fresh.diversity).toBe(1);
    expect(fresh.score).toBeGreaterThan(unknown.score);
  });
});

// ─────────────────────────────────────────────────────────────────
// The orchestrator end-to-end (sources + AI mocked, hashing REAL)
// ─────────────────────────────────────────────────────────────────

describe("selectImagesWithDiscovery — the V2 flow", () => {
  const mockFetch = vi.mocked(fetchImageCandidates);

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("runs multi-query sourcing, rejects the near-duplicate of a recent image, fills all slots", async () => {
    // Recent visual memory: the ascending-ramp "photo" (as if a recent
    // article already used this exact scene).
    const recentUrl = dataUrl(ASC_96);
    // Candidate pools per executed query (order: cover first, then slots).
    const pools: ImageCandidate[][] = [
      [
        // The SAME SCENE re-served at another size — must be rejected by
        // the dHash gate, proving the visual inspection really runs
        // (its URL is fresh, so ONLY the fingerprint can catch it).
        cand(dataUrl(ASC_192), "home workout dumbbells living room", 0),
        cand(dataUrl(DESC), "kettlebell wooden floor training", 1),
      ],
      [cand(dataUrl(ALT_BANDS), "workout timer stopwatch gym", 0)],
      [cand(dataUrl(STAIRS), "push up mat home training", 0)],
    ];
    let call = 0;
    mockFetch.mockImplementation(async () => pools[call++] ?? []);

    const result = await selectImagesWithDiscovery({
      lang: "ar",
      queueId: "diversity-test-1",
      topic: "برنامج تمارين منزلية بدون معدات",
      title: "برنامج تمارين منزلية للمبتدئين",
      focusKeyword: "تمارين منزلية",
      sections: ["الإحماء", "التمارين الرئيسية", "التبريد"],
      imagePlanSubjects: ["home workout mat", "water bottle", "timer"],
      pairId: null,
      excludeUrls: [],           // URL not in memory — only the HASH can catch the dup
      recentImageUrls: [recentUrl],
      minImages: 3,
      maxImages: 5,
    });

    // Deterministic brief (the mocked model call fails) — never a dead pipeline.
    expect(result.diagnostics.briefSource).toBe("deterministic");
    expect(result.diagnostics.twinCoverAdopted).toBe(false);

    // The near-duplicate of the recent image was visually REJECTED.
    expect(result.diagnostics.nearDuplicateRejected).toBeGreaterThanOrEqual(1);
    const pickedUrls = result.images.map((i) => i.url);
    expect(pickedUrls).not.toContain(dataUrl(ASC_192));

    // Multi-query plan actually executed (≥3 distinct stock searches).
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(3);
    const executedQueries = mockFetch.mock.calls.map((c) => String(c[0]));
    expect(new Set(executedQueries).size).toBeGreaterThanOrEqual(3);

    // Every slot carries a real, unique image.
    expect(result.images.length).toBeGreaterThanOrEqual(3);
    expect(new Set(pickedUrls).size).toBe(pickedUrls.length);
    for (const img of result.images) {
      expect(img.url.startsWith("data:image/jpeg")).toBe(true);
      expect(img.alt.length).toBeGreaterThan(0);
      expect(img.credit).toBe("test");
    }

    // Diagnostics ride along for the batch review.
    expect(result.diagnostics.queries.length).toBeGreaterThanOrEqual(3);
    expect(result.diagnostics.queries.some((q) => q.rejectedNearDup)).toBe(true);
  });
});
