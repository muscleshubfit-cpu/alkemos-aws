import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * RECIPES PAIR INTEGRITY — the atomic-pair canary
 * (HEALTHY-RECIPES-PLATFORM plan §12.1 item 1 + decision ق2):
 * «ممنوع نشر نسخة منفردة» is enforced IN THE DATABASE. The CI sandbox
 * has no Postgres, so this canary pins the STRUCTURE that enforces it:
 *
 *   1. The migration's publish_recipe_pair RPC publishes BOTH versions
 *      in ONE transaction and REFUSES an incomplete pair / unverified
 *      recipe / unverified image BEFORE any write.
 *   2. The unpublish RPC hides both versions together with the reason.
 *   3. recipe_versions carries the UNIQUE (recipe_id, language) pair
 *      constraint — exactly two rows per recipe, structurally.
 *   4. The R6 route calls the RPC (never a bare UPDATE) and a failed
 *      transaction leaves the recipe verified-but-unpublished.
 *   5. The server layer's detail/list queries filter is_published AND
 *      recipes.status='published' (both halves live together).
 */
const MIGRATION = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261110100000_0108_healthy_recipes_foundation.sql"),
  "utf-8",
);
const R6 = readFileSync(
  resolve(process.cwd(), "src/app/api/cron/recipes/r6-publish/route.ts"),
  "utf-8",
);
const SERVER = readFileSync(resolve(process.cwd(), "src/lib/recipes-server.ts"), "utf-8");

describe("publish_recipe_pair — the atomic RPC (ق2)", () => {
  it("refuses PAIR_INCOMPLETE before any write", () => {
    expect(MIGRATION).toContain("PAIR_INCOMPLETE");
    // the check precedes the updates inside the transaction body
    const checkIdx = MIGRATION.indexOf("PAIR_INCOMPLETE");
    const updateIdx = MIGRATION.search(/update public\.recipes\s+set status = 'published'/i);
    expect(checkIdx).toBeGreaterThan(-1);
    expect(updateIdx).toBeGreaterThan(checkIdx);
  });

  it("refuses VERIFICATION_NOT_PASSED before any write", () => {
    expect(MIGRATION).toContain("VERIFICATION_NOT_PASSED");
    const checkIdx = MIGRATION.indexOf("VERIFICATION_NOT_PASSED");
    const updateIdx = MIGRATION.search(/update public\.recipes\s+set status = 'published'/i);
    expect(checkIdx).toBeGreaterThan(-1);
    expect(updateIdx).toBeGreaterThan(checkIdx);
  });

  it("publishes BOTH versions in the SAME transaction", () => {
    const fn = MIGRATION.slice(
      MIGRATION.indexOf("create or replace function public.publish_recipe_pair"),
      MIGRATION.indexOf("create or replace function public.unpublish_recipe_pair"),
    );
    expect(fn).toMatch(/update public\.recipes\s+set status = 'published'/i);
    expect(fn).toMatch(/update public\.recipe_versions\s+set is_published = true/i);
    // exactly ONE function body → one transaction (SECURITY DEFINER plpgsql)
    expect(fn).toMatch(/language plpgsql\s+security definer/i);
  });
});

describe("unpublish_recipe_pair — both versions hide together (§11-9)", () => {
  it("records the reason and hides both halves atomically", () => {
    const fn = MIGRATION.slice(MIGRATION.indexOf("create or replace function public.unpublish_recipe_pair"));
    expect(fn).toContain("p_reason");
    expect(fn).toMatch(/is_published = false/i);
    expect(fn).toMatch(/status = 'unpublished'/i);
  });
});

describe("recipe_versions — the structural pair", () => {
  it("UNIQUE (recipe_id, language): exactly one row per language per recipe", () => {
    expect(MIGRATION).toMatch(/unique\s*\(\s*recipe_id\s*,\s*language\s*\)/i);
  });

  it("language constrained to ar|en", () => {
    expect(MIGRATION).toMatch(/language\s+text\s+not\s+null\s+check\s*\(\s*language\s+in\s*\('ar','en'\)/i);
  });
});

describe("R6 — the route never bypasses the RPC", () => {
  it("calls publish_recipe_pair (no bare is_published update)", () => {
    expect(R6).toContain('rpc("publish_recipe_pair"');
    expect(R6).not.toMatch(/\.update\(\s*[{]?\s*is_published\s*:/);
  });

  it("a failed RPC keeps the recipe verified-but-unpublished (held, never half)", () => {
    expect(R6).toContain("status: \"held\"");
    expect(R6).toMatch(/[\s\S]*verified[\s\S]*unpublished|stays `verified`/);
  });

  it("ISR flush runs after a successful publish — LIVE on the origin (the 2026-11-10 first-publish lesson: in-runner revalidateTag never reaches the production server's caches)", () => {
    // R6 calls the origin's flush-cache route (inside the live server:
    // data tags + ISR paths + CF edge), non-fatal by design.
    expect(R6).toMatch(/\/api\/cron\/recipes\/flush-cache\?recipeId=/);
    expect(R6).toContain("non-fatal");
  });
});

describe("the public read layer — both halves live together", () => {
  it("detail + list queries filter is_published AND recipes.status='published'", () => {
    expect(SERVER).toContain('.eq("is_published", true)');
    expect(SERVER).toContain('.eq("recipes.status", "published")');
  });

  it("the slugs query reads the EN half of every published pair (one slug per pair)", () => {
    expect(SERVER).toContain('.eq("language", "en")');
  });
});
