import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";

/**
 * AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16) — the RECIPES engine's
 * directed-repair canaries. The audited gaps these close (the recipes
 * twin of the blog's B1 law):
 *
 *   1. resetRecipeRowForRepair WIPED error_message — every r3/r4-targeted
 *      repair re-run was a BLIND regeneration (canary 1: the stamp now
 *      preserves the violations in the bundle).
 *   2. r3's in-loop early-gate rejection re-drew the IDENTICAL prompt
 *      (canary 2: the next attempt now carries the violations).
 *   3. The R5 hold carried only violations[0]'s target and no directive
 *      at all (canary 3: the full violation set is stamped).
 *   4. N-GATE-3's R5 message targeted r2-nutrition — PURE computation,
 *      a deterministic no-op repair loop (canary 4: now r1-structure).
 *   5. r1 re-runs after a chain reset get the preserved directive
 *      (previously: wiped) — the structure re-draw is directed (canary 5).
 */

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: vi.fn(() => {
      const builder = () => ({
        select: () => builder(),
        update: () => builder(),
        eq: () => builder(),
        order: () => builder(),
        limit: () => builder(),
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: { id: "r" }, error: null }),
      });
      return { ...builder(), insert: () => ({ select: () => ({ single: async () => ({ data: { id: "r" }, error: null }) }) }) };
    }),
  },
}));

import {
  resetRecipeRowForRepair,
  updateRecipeQueueItem,
  type RecipeQueueItem,
} from "@/lib/recipes-queue";
import { authorRecipeVersion } from "@/lib/recipes-pipeline";
import { mapR5FailureToRerunTarget } from "@/lib/recipes-repair-target";

// The recipes-queue module under test — updateRecipeQueueItem is mocked
// at the module seam (the same capture pattern the queue tests ride).
vi.mock("@/lib/recipes-queue", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/recipes-queue")>();
  return {
    ...orig,
    updateRecipeQueueItem: vi.fn(async () => null),
  };
});

// The AI seam: capture the authoring prompt.
vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...orig,
    callFreeAIFallbackChain: vi.fn(async () => ({
      text: JSON.stringify({
        title: "وصفة اختبارية صحية",
        excerpt: "مقدمة تحريرية وافية عن الوصفة الصحية للاختبار.",
        steps: ["خطوة أولى وافية بطول كافٍ لاجتياز المخطط.", "خطوة ثانية وافية بطول كافٍ.", "خطوة ثالثة وافية بطول كافٍ."],
        tips: "نصيحة وافية.",
        storageInfo: "معلومات تخزين وافية.",
        substitutions: [],
        metaTitle: "وصفة اختبارية صحية",
        metaDescription: "وصف ميتا وافٍ بطول خمسين حرفًا على الأقل للاختبار الحتمي.",
      }),
      model: "test-m",
      provider: "test-p",
    })),
  };
});

const update = vi.mocked(updateRecipeQueueItem);

const baseRow = (over: Partial<RecipeQueueItem>): RecipeQueueItem =>
  ({
    id: "row-1",
    recipe_id: "rec-1",
    status: "held",
    idea: { themeAr: "فطار عالى البروتين", themeEn: "high protein breakfast", cuisine: "international", mealType: "breakfast" },
    bundle: { structure: { servings: 2 } },
    error_message: null,
    rerun_target: null,
    repair_cycles: 0,
    scheduled_for: "2026-11-16",
    created_at: "2026-11-16T00:00:00Z",
    published_at: null,
    ...over,
  }) as unknown as RecipeQueueItem;

// fetchRecipeQueueItem is module-internal to recipes-queue's supabase
// surface — drive it through the admin mock's from().select().eq() chain
// by re-mocking at the queue level instead (the established capture
// pattern): the simplest honest path is calling the REAL reset against
// the REAL fetch — so mock the supabase row read through the admin
// builder used by fetchRecipeQueueItem.
const fetchCalls = { row: baseRow({}) };
/** Captures every recipe_generation_queue UPDATE payload (the capture seam). */
const updateCaptures: Array<Record<string, unknown>> = [];

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: vi.fn(() => {
      const builder = () => ({
        select: () => builder(),
        order: () => builder(),
        limit: () => builder(),
        maybeSingle: async () => ({ data: fetchCalls.row, error: null }),
        single: async () => ({ data: fetchCalls.row, error: null }),
        eq: () => builder(),
        update: (updates: Record<string, unknown>) => ({
          eq: () => ({ then: (cb: (r: { error: null }) => unknown) => Promise.resolve({ error: null }).then(cb) }),
        }),
      });
      void updateCaptures;
      return {
        ...builder(),
        // The capture point — resetRecipeRowForRepair rides this chain.
        update: (updates: Record<string, unknown>) => {
          updateCaptures.push(updates);
          return builder().update(updates);
        },
        insert: () => ({ select: () => ({ single: async () => ({ data: { id: "r" }, error: null }) }) }),
      };
    }),
  },
}));

import { callFreeAIFallbackChain } from "@/lib/ai-provider";
const chain = vi.mocked(callFreeAIFallbackChain);

beforeEach(() => {
  vi.clearAllMocks();
  updateCaptures.length = 0;
});

describe("resetRecipeRowForRepair — the diagnostics are PRESERVED (canary 1)", () => {
  it("1. the R5 violations ride the bundle as the one-shot repair stamp (pre-2026-11-16: wiped)", async () => {
    fetchCalls.row = baseRow({
      status: "held",
      rerun_target: "r3-authoring",
      error_message: "R5: Q-GATE-1: fails MSA (strong=1) — rerun r3-authoring",
      bundle: { structure: { servings: 2 }, versions: {} },
    });
    const res = await resetRecipeRowForRepair("row-1");
    expect(res.reset).toBe(true);
    const updates = updateCaptures[0] as Record<string, string>;
    expect(updates.status).toBe("nutrition_verified");
    expect(updates.error_message).toBeNull();
    expect(updates.rerun_target).toBeNull();
    expect(updates.repair_cycles).toBe(1);
    // THE stamp: the directive survives the reset inside the bundle.
    const bundle = JSON.parse(updates.bundle as string) as {
      repair: { directive: string; target: string };
    };
    expect(bundle.repair.directive).toContain("Q-GATE-1");
    expect(bundle.repair.target).toBe("r3-authoring");
    // The row's real artifacts survive (structure intact).
    expect((bundle as { structure?: { servings?: number } }).structure?.servings).toBe(2);
  });

  it("1b. a row with NO diagnostics stays a plain reset (no fabricated directive)", async () => {
    fetchCalls.row = baseRow({ rerun_target: "r3-authoring", error_message: null, bundle: { structure: { servings: 2 } } });
    await resetRecipeRowForRepair("row-1");
    const updates = updateCaptures[0] as Record<string, string>;
    const bundle = JSON.parse(updates.bundle as string) as { repair?: unknown; structure?: unknown };
    expect(bundle.repair).toBeUndefined();
    expect(bundle.structure).toEqual({ servings: 2 });
  });

  it("1c. repair_cycles increments cumulatively (the honest counter law)", async () => {
    fetchCalls.row = baseRow({ rerun_target: "r4-image", error_message: "R5: P-GATE-3", repair_cycles: 2 });
    await resetRecipeRowForRepair("row-1");
    const updates = updateCaptures[0] as Record<string, number>;
    expect(updates.repair_cycles).toBe(3);
  });
});

describe("authorRecipeVersion — the directed repair prompt (canary 2)", () => {
  const input = {
    themeAr: "شوربة عدس صحية",
    themeEn: "healthy lentil soup",
    cuisine: "international",
    mealType: "lunch",
    servings: 2,
    prepMinutes: 10,
    cookMinutes: 25,
    ingredients: [
      { nameAr: "عدس أصفر", nameEn: "yellow lentils", amountG: 200, weightState: "raw" },
      { nameAr: "بصل", nameEn: "onion", amountG: 80, weightState: "raw" },
    ],
    stepsOutline: ["اسلق العدس", "أضف البصل", "اهرس الخليط"],
    computedPerServing: { calories: 320, protein: 18, carbs: 42, fat: 6, fiber: 12 },
  };

  it("2. a repairDirective rides the AR prompt as a one-shot REPAIR block (the B1 law, ported)", async () => {
    await authorRecipeVersion("ar", {
      ...input,
      repairDirective: "Q-GATE-1: fails MSA (strong=1, weak=0: عشان×1) — rerun r3-authoring",
    });
    const prompt = chain.mock.calls[0]?.[0] ?? "";
    expect(prompt).toContain("إعادة إصلاح موجّهة");
    expect(prompt).toContain("عشان×1");
    expect(prompt).toContain("أصلح كل واحدة عند سببها الحقيقي");
  });

  it("2b. the EN prompt carries its bilingual twin", async () => {
    await authorRecipeVersion("en", {
      ...input,
      repairDirective: "Q-GATE-2: meta description exceeds 160 chars — rerun r3-authoring",
    });
    const prompt = chain.mock.calls[0]?.[0] ?? "";
    expect(prompt).toContain("DIRECTED REPAIR RETRY");
    expect(prompt).toContain("meta description exceeds 160");
  });

  it("2c. NO directive → the prompt carries NO repair block (byte-identical normal run)", async () => {
    await authorRecipeVersion("ar", { ...input });
    const prompt = chain.mock.calls[0]?.[0] ?? "";
    expect(prompt).not.toContain("إعادة إصلاح موجّهة");
    expect(prompt).toContain("شوربة عدس صحية");
  });

  it("2d. control chars and novelines are stripped from the directive (the sanitize law)", async () => {
    await authorRecipeVersion("ar", {
      ...input,
      repairDirective: "Q-GATE-5: حلال\n\rviolation\tQ-GATE-1: MSA",
    });
    const prompt = chain.mock.calls[0]?.[0] ?? "";
    expect(prompt).toContain("Q-GATE-5: حلال violation Q-GATE-1: MSA");
    expect(prompt).not.toMatch(/\t/);
  });
});

describe("N-GATE-3's R5 target — the deterministic no-op loop is dead (canary 4)", () => {
  it("4. the R5 message now targets r1-structure (r2 is pure computation — identical output, zero progress)", () => {
    const msg =
      "N-GATE-3: total calories 500 vs macros-derived 900 outside tolerance — rerun r1-structure";
    expect(mapR5FailureToRerunTarget(msg)).toBe("r1-structure");
  });

  it("4b. the gate message itself pins the new target (source pin — the same-commit canary law)", () => {
    const src = readFileSync("src/lib/recipes-quality-gates.ts", "utf8");
    expect(src).toContain("outside tolerance — rerun r1-structure");
    expect(src).not.toContain("outside tolerance — rerun r2-nutrition");
  });

  it("4c. r2-nutrition remains a legal contract arm (in-stage R2 messages keep their own target)", () => {
    expect(mapR5FailureToRerunTarget("something in R2 — rerun r2-nutrition")).toBe("r2-nutrition");
  });
});

describe("r1's chain-reset class — the structure re-draw is directed (canary 5, source pin)", () => {
  it("5. the r1 route consumes bundle.repair.directive when its own self-hold feedback is absent", () => {
    const src = readFileSync("src/app/api/cron/recipes/r1-structure/route.ts", "utf8");
    expect(src).toContain("stampedDirective");
    expect(src).toContain("bundle.repair.directive");
    // Priority law: R1's OWN missing-refs self-hold feedback wins.
    expect(src).toContain('qi.error_message.includes("missing nutrient refs")');
  });

  it("5b. the r3 route consumes the stamp on the first attempt and drops it on success (one-shot law)", () => {
    const src = readFileSync("src/app/api/cron/recipes/r3-authoring/route.ts", "utf8");
    expect(src).toContain("stampedDirective");
    expect(src).toContain("loopDirective = lastErr.slice(0, 1500)");
    expect(src).toContain("repair: undefined");
  });

  it("5c. the R5 hold stamps the FULL violation set into the bundle (not just violations[0])", () => {
    const src = readFileSync("src/app/api/cron/recipes/r5-gates/route.ts", "utf8");
    expect(src).toContain("repair: {");
    expect(src).toContain("directive: reason");
    expect(src).toContain("bundleWithDirective");
  });
});
