import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * RECIPES IDEA-LAYER FORENSICS — the canary family closing the
 * 2026-11-11/12 daily-pair failures
 * (docs/RECIPES-WORKFLOW-FAILURE-FORENSICS-2026-11-12.md):
 *
 *   RC1  pickIdeaSlot's comparator was INVERTED — it picked the
 *        MOST-recently-used cuisine×mealType, so after the first
 *        egyptian×breakfast publish every day demanded the same slot
 *        and the models answered Ful-Medames variants over and over;
 *   RC2  ideaPassesGuards compared only PUBLISHED pair_slugs while the
 *        DB indexes are status-blind (recipes_pair_slug_uidx is
 *        GLOBAL) — an idea colliding with a stale in_production master
 *        passed R0 and died at R1 with a raw duplicate-key;
 *   RC3  run-step.sh's r0-target repair chain never re-ran the
 *        intermediate stages on the fresh row → deterministic
 *        409 wrong_status ×3 → red X (run 43040277363);
 *   RC4  an R5 hold with rerunTarget=r0-idea left the recipes master
 *        in_production — the partial one-per-day index kept the day's
 *        slot occupied, blocking every same-day retry.
 */

const h = vi.hoisted(() => {
  const publishedRecent: Array<{ cuisines: string[]; meal_types: string[] }> = [];
  const allSlugs: string[] = [];
  const eqCalls: Array<[string, unknown]> = [];
  return { publishedRecent, allSlugs, eqCalls };
});

vi.mock("@/lib/supabase/admin", () => {
  const makeBuilder = (table: string): unknown => {
    let selectCols = "";
    const outcome = (): Promise<{ data: unknown; error: unknown }> => {
      if (table === "recipes" && selectCols.includes("cuisines")) {
        return Promise.resolve({ data: h.publishedRecent, error: null });
      }
      if (table === "recipes" && selectCols.includes("pair_slug")) {
        return Promise.resolve({
          data: h.allSlugs.map((s) => ({ pair_slug: s })),
          error: null,
        });
      }
      return Promise.resolve({ data: [], error: null });
    };
    const b: Record<string, unknown> = {
      select: (cols: string) => {
        selectCols = cols;
        return b;
      },
      eq: (col: string, val: unknown) => {
        h.eqCalls.push([col, val]);
        return b;
      },
      order: () => b,
      limit: () => b,
      then: (onf: unknown, onr: unknown) =>
        outcome().then(onf as never, onr as never),
    };
    return b;
  };
  return {
    isSupabaseAdminConfigured: true,
    supabaseAdmin: { from: (t: string) => makeBuilder(t) },
  };
});

import {
  pickIdeaSlot,
  ideaPassesGuards,
  listRecentPairSlugs,
  type RecipeIdea,
} from "@/lib/recipes-pipeline";

const PIPELINE = readFileSync(resolve(process.cwd(), "src/lib/recipes-pipeline.ts"), "utf-8");
const RUNNER_SH = readFileSync(
  resolve(process.cwd(), "scripts/recipes-runner/run-step.sh"),
  "utf-8",
);
const R5 = readFileSync(
  resolve(process.cwd(), "src/app/api/cron/recipes/r5-gates/route.ts"),
  "utf-8",
);
const QUEUE = readFileSync(resolve(process.cwd(), "src/lib/recipes-queue.ts"), "utf-8");

function idea(themeEn: string, themeAr = "طبق تجريبي"): RecipeIdea {
  return {
    ideaId: "test-idea",
    themeAr,
    themeEn,
    cuisine: "egyptian",
    goal: "maintenance",
    mealType: "breakfast",
    brief: "وصفة تجريبية لاختبار الحراسة فقط دون أي نشر.",
    sealedAt: "2026-11-12T00:00:00.000Z",
  };
}

beforeEach(() => {
  h.publishedRecent.length = 0;
  h.allSlugs.length = 0;
  h.eqCalls.length = 0;
});

describe("RC1 — pickIdeaSlot is LEAST-recently-used (the Ful-Medames loop killer)", () => {
  it("the slot never repeats the most-recently-published cuisine × mealType", async () => {
    // The exact 2026-11-11/12 evidence: the only published pair was
    // egyptian × breakfast — the slot must rotate AWAY from it. The old
    // ascending comparator re-picked egyptian × breakfast every day.
    h.publishedRecent.push({ cuisines: ["egyptian"], meal_types: ["breakfast"] });
    const slot = await pickIdeaSlot();
    expect(slot.cuisine).not.toBe("egyptian");
    expect(slot.mealType).not.toBe("breakfast");
  });

  it("with every cuisine used, the OLDEST use wins (not the newest)", async () => {
    // newest → oldest: international, asian, mediterranean, arab, gulf, egyptian.
    for (const c of ["international", "asian", "mediterranean", "arab", "gulf", "egyptian"]) {
      h.publishedRecent.push({ cuisines: [c], meal_types: ["lunch"] });
    }
    const slot = await pickIdeaSlot();
    expect(slot.cuisine).toBe("egyptian"); // used 6th-most-recently = the least-recently-used
  });

  it("the comparator sorts DESCENDING (never-used first, then oldest use)", () => {
    expect(PIPELINE).toMatch(
      /\(lastUseCuisine\.get\(b\) \?\? neverUsed\) - \(lastUseCuisine\.get\(a\) \?\? neverUsed\)/,
    );
    expect(PIPELINE).toMatch(
      /\(lastUseMeal\.get\(b\) \?\? neverUsed\) - \(lastUseMeal\.get\(a\) \?\? neverUsed\)/,
    );
  });
});

describe("RC2 — the anti-dup corpus is ALL recipe rows (status-blind like the DB indexes)", () => {
  it("an idea whose slug matches a NON-published row is rejected at R0 (not at R1's raw duplicate-key)", async () => {
    // The exact 2026-11-12 evidence: "Ful Medames" collided with the
    // stale in_production master from the abandoned Nov-9 attempt.
    h.allSlugs.push("ful-medames", "ful-medames-with-eggs", "ful-medames-with-poached-eggs");
    const verdict = await ideaPassesGuards(idea("Ful Medames", "فول مدمس"));
    expect(verdict).not.toBeNull();
    expect(verdict).toContain("duplicates a recent pair_slug");
    expect(verdict).toContain("rerun r0-idea");
  });

  it("the corpus query carries NO status filter (published-only was the blind spot)", async () => {
    h.allSlugs.push("ful-medames");
    await listRecentPairSlugs(200);
    expect(h.allSlugs).toContain("ful-medames");
    expect(h.eqCalls).toEqual([]); // no .eq("status", "published") — the RC2 fix
  });

  it("the idea prompt carries the ALREADY-USED avoid-list (fail-soft guidance, guard stays the gate)", () => {
    expect(PIPELINE).toContain("ALREADY-USED themes");
    expect(PIPELINE).toMatch(/do NOT propose these dishes or close variants/);
  });

  it("the deterministic fallback bank rotates to an unused slug (never re-picks a burned one)", () => {
    expect(PIPELINE).toMatch(
      /bank\.find\(\(e\) => !usedSlugs\.includes\(pairSlugify\(e\.themeEn\)\)\)/,
    );
  });
});

describe("RC3 — run-step.sh's r0-target repair chain advances the fresh row", () => {
  it("the r0 branch re-runs the intermediate stages on the fresh row (r1 … before the failing step)", () => {
    // The 2026-11-11 gap: after the fresh r0 the wrapper re-attempted
    // r5 directly on a status='idea' row → deterministic 409 ×3.
    expect(RUNNER_SH).toContain("RC3 (forensics 2026-11-12");
    expect(RUNNER_SH).toMatch(/if \[ "\$FAILING_INDEX" -ge 1 \]/);
    expect(RUNNER_SH).toMatch(
      /fresh row captured: QUEUE_ID=\$QUEUE_ID[\s\S]{0,1200}while \[ "\$i" -lt "\$FAILING_INDEX" \][\s\S]{0,400}repair step: \$RS/,
    );
  });

  it("the repair chain stays budget-pinned (recursive calls MAX_REPAIRS=0, no nesting)", () => {
    expect(RUNNER_SH).toMatch(/MAX_REPAIRS=0 bash "\$0"/);
    expect(RUNNER_SH).toContain("REPAIRS_USED=");
    expect(RUNNER_SH).toContain("--requeue");
  });
});

describe("RC4 — an r0-idea hold releases the day slot (the master leaves the live set)", () => {
  it("R5 demotes the abandoned attempt's master BEFORE holding the queue row", () => {
    expect(R5).toMatch(/if \(rerunTarget === "r0-idea"\) \{\s*\n\s*await abandonRecipeAttemptMaster\(recipeId\);/);
  });

  it("non-r0 targets keep the master in_production (repairable attempts stay live)", () => {
    // The demotion is strictly the r0-idea abandonment path — r1..r4
    // targets repair the SAME master in place.
    expect(R5).not.toMatch(/rerunTarget === "r[1-4]-[a-z]+"\) \{\s*\n\s*await abandonRecipeAttemptMaster/);
  });

  it("the queue lib implements the demotion (status 'failed', never throws)", () => {
    expect(QUEUE).toContain("export async function abandonRecipeAttemptMaster");
    expect(QUEUE).toMatch(/status: "failed", updated_at: new Date\(\)\.toISOString\(\)/);
  });
});

describe("the untouched safety net (nothing was bent to make the pipeline green)", () => {
  it("R5 still holds on violations and stamps the full report", () => {
    expect(R5).toContain("status: \"held\"");
    expect(R5).toContain("verification_status: report.passed ? \"passed\" : \"failed\"");
  });

  it("R6 still owns the atomic publish + daily quota + breaker + kill switch", () => {
    const R6 = readFileSync(
      resolve(process.cwd(), "src/app/api/cron/recipes/r6-publish/route.ts"),
      "utf-8",
    );
    expect(R6).toContain('supabaseAdmin.rpc("publish_recipe_pair"');
    expect(R6).toContain("recipesPublishEnabled()");
    expect(R6).toContain("consecutiveRecipeFailureDays()");
    expect(R6).toContain("countPublishedPairsOnDay(today)");
  });
});
