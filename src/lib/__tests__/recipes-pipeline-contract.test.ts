import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  narrativeAdvisorySampled,
  parseNarrativeAdvisory,
} from "../recipes-pipeline";
import { parseJsonCell } from "../recipes-queue";

/**
 * RECIPES PIPELINE CONTRACT — the follow-up canary for the fixes that
 * closed the 24de79d1 CI failures (owner order 2026-11-10 «استكمال
 * مشروع Healthy Recipes»):
 *
 *   1) the AI-ROUTER GUARD contract: every recipe:* registration must be
 *      REACHED by a call site the guard's token scan can see (inline
 *      conditional first argument — the variable-indirection lesson);
 *   2) recipe:verify-narrative is genuinely wired into R5 as the
 *      SAMPLED advisory tail (fail-open, never overrides the
 *      deterministic battery, holds with a rerun target on HIGH flags);
 *   3) the runner pair scripts/recipes-runner/{run-step.sh,run-step.mts}
 *      exists and carries the repair contract (the missing-piece class:
 *      recipe-post.yml referenced a runner that was never pushed);
 *   4) migration 0109 re-asserts the foundation with the 0105 pg_proc
 *      guard on the admin policies (the clean-stack is_admin() fix).
 */
const PIPELINE = readFileSync(resolve(process.cwd(), "src/lib/recipes-pipeline.ts"), "utf-8");
const R5 = readFileSync(
  resolve(process.cwd(), "src/app/api/cron/recipes/r5-gates/route.ts"),
  "utf-8",
);
const RUNNER_MTS = readFileSync(
  resolve(process.cwd(), "scripts/recipes-runner/run-step.mts"),
  "utf-8",
);
const RUNNER_SH = readFileSync(
  resolve(process.cwd(), "scripts/recipes-runner/run-step.sh"),
  "utf-8",
);
const WORKFLOW = readFileSync(resolve(process.cwd(), ".github/workflows/recipe-post.yml"), "utf-8");
const QUEUE = readFileSync(resolve(process.cwd(), "src/lib/recipes-queue.ts"), "utf-8");
const M0109 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261110140000_0109_recipes_foundation_clean_stack_guard.sql"),
  "utf-8",
);

describe("1) the guard-visibility contract (recipe:author-ar / recipe:author-en)", () => {
  it("the two authoring ids ride an INLINE conditional first argument", () => {
    // The guard's token scan reads the FIRST argument of dispatchAI( —
    // a ternary there yields both literals; a variable hides them (the
    // dead-registration failure class of 24de79d1).
    expect(PIPELINE).toMatch(
      /dispatchAI\(\s*\n?\s*ar \? "recipe:author-ar" : "recipe:author-en"/,
    );
  });

  it("no variable indirection hides a dispatch id anymore", () => {
    expect(PIPELINE).not.toMatch(/const fn = ar \?/);
  });
});

describe("2) recipe:verify-narrative — the R5 sampled advisory tail", () => {
  it("R5 imports and runs the advisory ONLY on the deterministic pass path", () => {
    expect(R5).toContain("verifyPairNarrative");
    expect(R5).toContain("narrativeAdvisorySampled");
    // The advisory runs after the deterministic verdict, never rescues it:
    // gated on report.passed so a failing battery can never be overridden.
    expect(R5).toMatch(/if \(report\.passed && narrativeAdvisorySampled\(/);
  });

  it("a HIGH-severity inconsistency holds the pair with the r3 rerun target", () => {
    expect(R5).toContain('"r3-authoring"');
    expect(R5).toContain("NARRATIVE-ADV");
    expect(R5).toMatch(/rerunTarget: "r3-authoring"/);
  });

  it("the advisory is fail-open: provider trouble never blocks the verdict", () => {
    // verifyPairNarrative itself swallows dispatch/parse trouble → null.
    expect(PIPELINE).toMatch(/Advisory fail-open/);
  });

  it("the advisory result is stamped into the honest verification record", () => {
    expect(R5).toContain("advisoryNarrative");
  });

  it("sampling is deterministic: 1-in-3 by scheduled day (days 1, 4, 7, …)", () => {
    // Any date's day-of-month: sampled iff ≡ 1 (mod 3) — reproducible
    // audits, no randomness, no env knob to dodge.
    for (const d of ["01", "04", "07", "10", "13", "16", "19", "22", "25", "28", "31"]) {
      expect(narrativeAdvisorySampled(`2026-11-${d}`)).toBe(true);
    }
    for (const d of ["02", "03", "05", "06", "08", "09", "11", "30"]) {
      expect(narrativeAdvisorySampled(`2026-11-${d}`)).toBe(false);
    }
  });

  it("sampling rejects malformed dates (never samples garbage)", () => {
    expect(narrativeAdvisorySampled("")).toBe(false);
    expect(narrativeAdvisorySampled("not-a-date")).toBe(false);
    expect(narrativeAdvisorySampled("2026-11-")).toBe(false);
  });

  it("parseNarrativeAdvisory: strict on shape, tolerant on junk → null", () => {
    const good = parseNarrativeAdvisory(
      JSON.stringify({
        consistent: false,
        issues: [
          { severity: "high", language: "en", field: "steps", problem: "EN bakes 25 min, AR fries" },
        ],
      }),
    );
    expect(good).not.toBeNull();
    expect(good?.consistent).toBe(false);
    expect(good?.issues).toHaveLength(1);
    expect(good?.issues[0].severity).toBe("high");

    // code fences + prose around the JSON (the parseJsonLoose law)
    const fenced = parseNarrativeAdvisory(
      '```json\n{"consistent":true,"issues":[]}\n```',
    );
    expect(fenced?.consistent).toBe(true);

    expect(parseNarrativeAdvisory("total garbage")).toBeNull();
    expect(parseNarrativeAdvisory('{"consistent":"yes"}')).toBeNull();
    expect(parseNarrativeAdvisory("")).toBeNull();
  });

  it("unknown severity/language degrade to low/both instead of failing the parse", () => {
    const lenient = parseNarrativeAdvisory(
      JSON.stringify({
        consistent: false,
        issues: [{ severity: "critical", language: "fr", field: "x", problem: "drift" }],
      }),
    );
    expect(lenient?.issues[0].severity).toBe("low");
    expect(lenient?.issues[0].language).toBe("both");
  });
});

describe("3) the runner pair exists and carries the repair contract", () => {
  it("both runner files exist (the 24de79d1 gap: the workflow referenced a missing script)", () => {
    expect(existsSync(resolve(process.cwd(), "scripts/recipes-runner/run-step.sh"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "scripts/recipes-runner/run-step.mts"))).toBe(true);
  });

  it("the workflow invokes the runner for all eight stages", () => {
    for (const step of [
      "r0-idea",
      "r1-structure",
      "r2-nutrition",
      "r3-authoring",
      "r4-image",
      "r5-gates",
      "r6-publish",
      "r7-indexing",
    ]) {
      expect(WORKFLOW).toContain(`run: bash scripts/recipes-runner/run-step.sh ${step} 3`);
    }
  });

  it("later stages stop gracefully on an honest skip (daily quota / breaker / kill switch)", () => {
    // RECIPES_SKIPPED=1 must gate every post-R0 stage.
    const gated = WORKFLOW.match(/if: env\.RECIPES_SKIPPED != '1'/g) ?? [];
    expect(gated.length).toBe(7);
  });

  it("run-step.mts implements the exit-3 repair contract against the closed target set", () => {
    expect(RUNNER_MTS).toContain("R5_RERUN_TARGETS");
    expect(RUNNER_MTS).toContain("RERUN_TARGET=");
    expect(RUNNER_MTS).toMatch(/process\.exit\(3\)/);
  });

  it("run-step.mts threads queueId and fails fast on missing secrets (the blog law)", () => {
    expect(RUNNER_MTS).toContain('--queueId');
    expect(RUNNER_MTS).toContain("CRON_SECRET");
    expect(RUNNER_MTS).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("run-step.sh runs the repair chain in-run with a hard budget", () => {
    expect(RUNNER_SH).toMatch(/MAX_REPAIRS/);
    expect(RUNNER_SH).toContain("REPAIRS_USED=");
    expect(RUNNER_SH).toContain("--requeue");
    // recursive repair calls pin MAX_REPAIRS=0 (never nests)
    expect(RUNNER_SH).toMatch(/MAX_REPAIRS=0 bash "\$0"/);
  });

  it("the queue lib implements the in-run repair reset (increments, never resets, repair_cycles)", () => {
    expect(QUEUE).toContain("export async function resetRecipeRowForRepair");
    // the admin requeue resets to 0; the in-run reset INCREMENTS
    expect(QUEUE).toMatch(/repair_cycles: \(qi\.repair_cycles \?\? 0\) \+ 1/);
    // the reset map returns the row to the status the TARGET stage accepts
    for (const [target, status] of [
      ['"r1-structure"', '"idea"'],
      ['"r2-nutrition"', '"structured"'],
      ['"r3-authoring"', '"nutrition_verified"'],
      ['"r4-image"', '"authored"'],
    ] as const) {
      const mapIdx = QUEUE.indexOf("const before: Record<string, RecipeQueueStatus> = {");
      const map = QUEUE.slice(mapIdx, QUEUE.indexOf("};", mapIdx));
      expect(map).toContain(`${target}: ${status}`);
    }
  });
});

describe("6) R6's LIVE cache flush (the first-publish ISR lesson, 2026-11-10)", () => {
  const R6 = readFileSync(
    resolve(process.cwd(), "src/app/api/cron/recipes/r6-publish/route.ts"),
    "utf-8",
  );
  const FLUSH = readFileSync(
    resolve(process.cwd(), "src/app/api/cron/recipes/flush-cache/route.ts"),
    "utf-8",
  );

  it("R6 calls the ORIGIN's live flush route after the atomic publish (not just in-process tags)", () => {
    // The 2026-11-10 lesson: revalidateTag inside the GHA runner process
    // mutates the runner's caches, not the production server's — the
    // listings kept the pre-publish empty render until the hourly TTL.
    expect(R6).toMatch(/\/api\/cron\/recipes\/flush-cache\?recipeId=/);
    expect(R6).toContain("authorization: `Bearer ${process.env.CRON_SECRET");
    // non-fatal by design: a flush failure never fails the durable publish
    expect(R6).toContain("non-fatal");
  });

  it("the flush route runs INSIDE the live server behind cron-auth", () => {
    expect(FLUSH).toContain("verifyCronAuth");
    expect(FLUSH).toContain("revalidateRecipeCaches");
    expect(FLUSH).toContain("revalidatePath");
    expect(FLUSH).toContain("purgeCloudflareEdgeUrls");
    // the three layers, blog law: data tags + ISR paths + CF edge
    expect(FLUSH).toMatch(/recipes-list/);
    expect(FLUSH).toContain("/sitemap-recipes.xml");
  });
});

describe("5) the jsonb-wire law (the first-live-run lesson, 2026-11-10)", () => {
  const R2 = readFileSync(
    resolve(process.cwd(), "src/app/api/cron/recipes/r2-nutrition/route.ts"),
    "utf-8",
  );
  const R3 = readFileSync(
    resolve(process.cwd(), "src/app/api/cron/recipes/r3-authoring/route.ts"),
    "utf-8",
  );

  it("R2 writes PLAIN OBJECTS to the recipes jsonb columns (never JSON.stringify)", () => {
    // A JSON.stringify'd value lands in a jsonb column as a STRING document;
    // reading it back gives text and `.calories` silently reads undefined →
    // the all-zeros N-GATE-3 hold class caught by the first live run.
    expect(R2).not.toMatch(/nutrition_total:\s*JSON\.stringify/);
    expect(R2).not.toMatch(/nutrition_per_serving:\s*JSON\.stringify/);
    expect(R2).not.toMatch(/nutrition_sources:\s*JSON\.stringify/);
    expect(R2).not.toMatch(/calories_kcal_consistency:\s*JSON\.stringify/);
    expect(R2).toMatch(/nutrition_per_serving:\s*computation\.perServing/);
  });

  it("R3 writes steps/substitutions as the plain array/object", () => {
    expect(R3).not.toMatch(/steps:\s*JSON\.stringify/);
    expect(R3).not.toMatch(/substitutions:\s*JSON\.stringify/);
    expect(R3).toMatch(/steps:\s*version\.steps/);
  });

  it("R5 stamps verification as a plain object and reads cells tolerantly", () => {
    expect(R5).not.toMatch(/verification:\s*JSON\.stringify/);
    // the tolerant reader covers pre-fix rows (string-valued jsonb) forever
    expect(R5).toContain("parseJsonCell");
    expect(R5).toMatch(/typeof raw === "string"/);
  });

  it("parseJsonCell: both wire shapes read correctly (object and string)", () => {
    const obj = { calories: 788, protein_g: 41.79 };
    expect(parseJsonCell(obj)).toEqual(obj);
    expect(parseJsonCell(JSON.stringify(obj))).toEqual(obj);
    // junk and empties degrade to {} — never throw, never leak text through
    expect(parseJsonCell(null)).toEqual({});
    expect(parseJsonCell("")).toEqual({});
    expect(parseJsonCell("not json")).toEqual({});
    expect(parseJsonCell(42)).toEqual({});
    expect(parseJsonCell(undefined)).toEqual({});
  });
});

describe("4) migration 0109 — the clean-stack is_admin() guard (the 0105 law)", () => {
  it("asserts the full foundation idempotently (IF NOT EXISTS / ON CONFLICT)", () => {
    expect(M0109).toMatch(/create table if not exists public\.recipes\b/);
    expect(M0109).toMatch(/create table if not exists public\.nutrient_reference\b/);
    expect(M0109).toMatch(/on conflict \(slug\) do nothing/);
  });

  it("every admin policy lives INSIDE the guarded DO block (pg_proc check)", () => {
    // The guard opens before any admin policy text and closes after all
    // of them: no unguarded is_admin() CREATE POLICY can ship again.
    const doOpen = M0109.indexOf("do $do$");
    const sqlOpen = M0109.indexOf("execute $sql$");
    const sqlClose = M0109.lastIndexOf("$sql$;");
    const firstAdmin = M0109.indexOf("drop policy if exists nutrient_reference_admin_write");
    const lastAdmin = M0109.lastIndexOf("create policy recipe_ingredients_admin_delete");
    expect(doOpen).toBeGreaterThan(-1);
    expect(sqlOpen).toBeGreaterThan(doOpen);
    expect(firstAdmin).toBeGreaterThan(sqlOpen);
    expect(lastAdmin).toBeGreaterThan(firstAdmin);
    expect(lastAdmin).toBeLessThan(sqlClose);
    // the pg_proc existence check is the gate
    expect(M0109).toMatch(
      /where p\.proname = 'is_admin' and n\.nspname = 'public'/,
    );
  });

  it("the honest NOTICE skip (deny-all) for clean stacks", () => {
    expect(M0109).toContain(
      "raise notice '0109: is_admin() absent",
    );
  });

  it("0109 edits no landed file: it ships as a NEW migration (INDEX row present)", () => {
    const index = readFileSync(resolve(process.cwd(), "supabase/migrations/INDEX.md"), "utf-8");
    expect(index).toContain("20261110140000_0109_recipes_foundation_clean_stack_guard.sql");
    expect(index).toContain("| 0109 |");
  });
});
