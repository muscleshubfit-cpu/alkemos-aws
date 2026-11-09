import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  SEARCH_INTENT_MAP,
  blogGateEntries,
  findBlogIntentCollision,
  getIntentByCanonical,
  normalizeIntentText,
} from "@/lib/intent-map";

/**
 * SEARCH INTENT MAP — data laws + blog-topic gate behavior (2026-09-14
 * SEO/GEO audit: «Query Cluster → Primary Intent → Canonical Alkemos
 * Page → Supporting Pages» + «امنع أي مقال جديد مستقبلًا من منافسة
 * Intent موجود»).
 *
 * Guarded contracts:
 *   1. Canonical uniqueness — no two entries own the same canonical page.
 *   2. Canonical realism — every canonical maps to a real route surface
 *      (the literals below mirror the actual src/app route tree; a path
 *      that stops existing fails here).
 *   3. Every non-blog entry carries head queries in BOTH languages
 *      (EN + AR) — the audit's non-branded, product-direct priority.
 *   4. The blog gate only ever fires on NON-blog entries.
 *   5. Collision semantics: head-query equality fires; short (≤3-word)
 *      focus keywords containing a head query fire; qualified long-tail
 *      focus keywords (≥4 words) never fire on containment alone.
 *   6. Fork guard: the map is the ONLY intent registry (no second copy).
 */

const REAL_SITE_PATHS = [
  "/",
  "/about",
  "/faq",
  "/memberships",
  "/exercises",
  "/programs",
  "/foods",
  "/tools",
  "/coaching",
  "/coaches",
  "/evo",
  "/compare",
  "/diet-plan",
  "/meal-planner",
  "/ai-meal-planner",
  "/ai-workout-planner",
  "/blog",
  "/ar/blog",
  // HEALTHY-RECIPES-PLATFORM (2026-11-10): the recipes family's primary
  // surfaces (plan §10-5) — concrete hub canonicals (the egyptian
  // cuisine hub + the keto diet hub own their clusters' head queries).
  "/recipes",
  "/recipes/cuisine/egyptian",
  "/recipes/diet/keto",
] as const;

const PARAMETRIC_PATH_PREFIXES = [
  "/muscles/[group]",
  "/equipment/[type]",
  "/collections/[slug]",
  "/tools/calorie-calculator",
  "/tools/macro-calculator",
  "/tools/bmi-calculator",
  "/tools/body-fat-calculator",
  "/tools/water-tracker",
  // Phase 318 (P1-8): the accuracy chain's two new primary canonicals.
  "/guides/macro-tracking-accuracy",
  "/foods/methodology",
  "/blog/category/[slug]",
] as const;

const ALLOWED_PATHS: string[] = [...REAL_SITE_PATHS, ...PARAMETRIC_PATH_PREFIXES];

describe("SEARCH_INTENT_MAP — data laws", () => {
  it("canonical paths are unique across entries", () => {
    const seen = new Map<string, string>();
    for (const entry of SEARCH_INTENT_MAP) {
      const owner = seen.get(entry.canonical);
      expect(owner ?? null, `canonical ${entry.canonical} owned by both ${owner} and ${entry.cluster}`).toBeNull();
      seen.set(entry.canonical, entry.cluster);
    }
  });

  it("every canonical is a real site route (no invented URLs)", () => {
    for (const entry of SEARCH_INTENT_MAP) {
      expect(ALLOWED_PATHS).toContain(entry.canonical);
    }
  });

  it("every non-blog entry carries head queries in BOTH languages", () => {
    for (const entry of blogGateEntries()) {
      expect(entry.queries.length, `${entry.cluster} has no queries`).toBeGreaterThan(0);
      const hasLatin = entry.queries.some((q) => /[a-z]/i.test(q));
      const hasArabic = entry.queries.some((q) => /[\u0600-\u06FF]/.test(q));
      expect(hasLatin, `${entry.cluster} lacks an EN head query`).toBe(true);
      expect(hasArabic, `${entry.cluster} lacks an AR head query`).toBe(true);
    }
  });

  it("exactly one EVO entry — the single primary AI-coach page", () => {
    const evo = SEARCH_INTENT_MAP.filter((e) => e.kind === "evo");
    expect(evo.length).toBe(1);
    expect(evo[0].canonical).toBe("/evo");
  });

  it("EVO's supporting pages include the AI planners and coaching (audit item 8)", () => {
    const evo = getIntentByCanonical("/evo")!;
    expect(evo.supporting).toContain("/ai-meal-planner");
    expect(evo.supporting).toContain("/ai-workout-planner");
    expect(evo.supporting).toContain("/coaching");
  });

  it("no entry targets a banned legacy brand as identity", () => {
    // Brand-name law: the site is «Alkemos»; the map must never carry a
    // MuscleHub-era identity signal.
    const src = readFileSync("src/lib/intent-map.ts", "utf8");
    expect(src).not.toMatch(/musclehub/i);
  });
});

describe("findBlogIntentCollision — the future-topic gate", () => {
  it("fires on head-query equality (tool intent)", () => {
    const hit = findBlogIntentCollision("TDEE calculator", "Why our TDEE calculator is honest");
    expect(hit).not.toBeNull();
    expect(hit!.entry.canonical).toBe("/tools/calorie-calculator");
  });

  it("fires on short focus keywords containing a head query", () => {
    const hit = findBlogIntentCollision("best ai meal planner", "topic");
    expect(hit).not.toBeNull();
    expect(hit!.entry.canonical).toBe("/ai-meal-planner");
  });

  it("fires on Arabic head queries after normalization (alef variants)", () => {
    const hit = findBlogIntentCollision("حاسبه السعرات", "topic");
    expect(hit).not.toBeNull();
    expect(hit!.entry.canonical).toBe("/tools/calorie-calculator");
  });

  it("fires on the EVO primary intent (AI fitness coach)", () => {
    const hit = findBlogIntentCollision("ai fitness coach guide", "topic");
    expect(hit).not.toBeNull();
    expect(hit!.entry.kind).toBe("evo");
  });

  it("does NOT fire on qualified long-tail focus keywords (≥4 words)", () => {
    // The blog corpus's own space — qualified program-design queries.
    const hit = findBlogIntentCollision(
      "برنامج تمارين بناء العضلات في المنزل بدون معدات",
      "برنامج تمارين بناء العضلات في المنزل بدون معدات",
    );
    expect(hit).toBeNull();
  });

  it("does NOT fire on plain article topics (no head query inside)", () => {
    expect(findBlogIntentCollision("deload week structure", "How to structure a deload week")).toBeNull();
    expect(findBlogIntentCollision("بناء العضلات للمبتدئين", "كيف أبدأ بناء العضلات")).toBeNull();
  });

  it("never fires for blog-kind entries (the gate's own corpus is exempt)", () => {
    for (const entry of SEARCH_INTENT_MAP) {
      if (entry.kind === "blog") expect(entry.queries.length).toBe(0);
    }
  });
});

describe("normalizeIntentText + lookups", () => {
  it("normalizes alef variants and diacritics for matching", () => {
    expect(normalizeIntentText("حاسبة ألكموس")).toBe(normalizeIntentText("حاسبة الكموس"));
    expect(normalizeIntentText("  TDEE   Calculator ")).toBe("tdee calculator");
  });

  it("getIntentByCanonical resolves and rejects", () => {
    expect(getIntentByCanonical("/evo")?.cluster).toBe("evo-ai-coach");
    expect(getIntentByCanonical("/not-a-page")).toBeNull();
  });

  it("fork guard — the map is the only intent registry in src", () => {
    // No second file may re-declare a copy of the registry (Phase-169
    // no-fork doctrine, same pattern as the FAQ heading contract).
    const topicsSrc = readFileSync("src/lib/blog-topics.ts", "utf8");
    expect(topicsSrc).toContain("findBlogIntentCollision");
    expect(topicsSrc).not.toMatch(/SEARCH_INTENT_MAP\s*[:=]/);
  });
});
