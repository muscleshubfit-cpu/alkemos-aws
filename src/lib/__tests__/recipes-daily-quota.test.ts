import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * RECIPES DAILY QUOTA — the «one pair per day» canary
 * (HEALTHY-RECIPES-PLATFORM plan §12.1 item 6 / §11-2): three layers
 * prevent a double publish — the STRUCTURAL unique partial index, the
 * ROUTE layer check, and the WORKFLOW concurrency group.
 */
const MIGRATION = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261110100000_0108_healthy_recipes_foundation.sql"),
  "utf-8",
);
const R0 = readFileSync(
  resolve(process.cwd(), "src/app/api/cron/recipes/r0-idea/route.ts"),
  "utf-8",
);
const R6 = readFileSync(
  resolve(process.cwd(), "src/app/api/cron/recipes/r6-publish/route.ts"),
  "utf-8",
);
const WORKFLOW = readFileSync(
  resolve(process.cwd(), ".github/workflows/recipe-post.yml"),
  "utf-8",
);
const QUEUE = readFileSync(resolve(process.cwd(), "src/lib/recipes-queue.ts"), "utf-8");

describe("layer 0 — the structural guard (unique partial index)", () => {
  it("recipes_one_per_day_uidx: ONE row per scheduled day in the live statuses", () => {
    expect(MIGRATION).toMatch(
      /recipes_one_per_day_uidx\s+on\s+public\.recipes\s*\(\s*scheduled_for\s*\)/i,
    );
    expect(MIGRATION).toMatch(
      /where\s+status\s+in\s*\(\s*'in_production'\s*,\s*'verified'\s*,\s*'published'\s*\)/i,
    );
  });
});

describe("layer 1 — the route checks (R0 create-guard + R6 publish-guard)", () => {
  it("R0 skips creation when a pair already published today", () => {
    expect(R0).toContain("countPublishedPairsOnDay");
    expect(R0).toContain("already_published_today");
  });

  it("R6 skips publishing when a pair already published today", () => {
    expect(R6).toContain("countPublishedPairsOnDay");
    expect(R6).toContain("already_published_today");
  });

  it("the queue lib implements the day count (the shared source)", () => {
    expect(QUEUE).toContain("export async function countPublishedPairsOnDay");
  });

  it("R0 is idempotent on re-runs: the open row of the day RESUMES", () => {
    expect(R0).toContain("findResumableRecipeRow");
    expect(R0).toContain("resumed: true");
  });

  it("R6 is idempotent: an already-published queue row short-circuits ok", () => {
    expect(R6).toContain("idempotent: true");
  });
});

describe("layer 2 — the workflow concurrency group", () => {
  it("recipes-pipeline group with no cancellation (the blog law)", () => {
    expect(WORKFLOW).toContain("group: recipes-pipeline");
    expect(WORKFLOW).toContain("cancel-in-progress: false");
  });

  it("one daily cron slot (06:30 UTC) + manual dispatch", () => {
    expect(WORKFLOW).toContain('cron: "30 6 * * *"');
    expect(WORKFLOW).toContain("workflow_dispatch:");
  });
});

describe("the circuit breaker (§11-8 — 3 consecutive failed days)", () => {
  it("R0 trips the breaker with an admin notification", () => {
    expect(R0).toContain("consecutiveRecipeFailureDays");
    expect(R0).toContain("circuit_breaker_tripped");
    expect(R0).toContain("notifyBreakerTripped");
  });

  it("R6 independently respects the breaker (defense in depth)", () => {
    expect(R6).toContain("consecutiveRecipeFailureDays");
    expect(R6).toContain("circuit_breaker_tripped");
  });

  it("the kill switch RECIPES_PUBLISH_ENABLED gates R6", () => {
    expect(R6).toContain("recipesPublishEnabled()");
    expect(QUEUE).toContain("export function recipesPublishEnabled");
  });
});
