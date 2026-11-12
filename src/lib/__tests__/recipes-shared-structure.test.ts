import { describe, it, expect } from "vitest";

/**
 * RECIPES SHARED STRUCTURE + SAME IMAGE — the pair-consistency canaries
 * (HEALTHY-RECIPES-PLATFORM plan §12.1 items 7+8):
 *
 *  - ONE Latin slug per pair (the foods-library law, NOT the blog's
 *    per-language slugs): /recipes/[slug] ↔ /ar/recipes/[slug] is a
 *    STRUCTURAL mirror — the language toggle jumps straight to the twin.
 *  - The ingredients/weights/servings/image live on the MASTER record
 *    shared by both versions: «تطابق المكونات والأوزان» is guaranteed
 *    by construction (P-GATE-2) and the image is the SAME FILE for both
 *    versions (P-GATE-3 — «نفس الصورة للنسختين»).
 */
import {
  buildRecipeHreflang,
  recipeIngredientLine,
  recipePublicPath,
  recipesListingPath,
  recipesTaxonomyPath,
  type RecipeIngredientView,
} from "@/lib/recipes-shared";
import { getRecipeSchema } from "@/lib/seo";

const ING: RecipeIngredientView = {
  position: 1,
  amountG: 250,
  weightState: "raw",
  nameAr: "أرز أبيض",
  nameEn: "White rice",
  noteAr: null,
  noteEn: "rinsed",
  isOptional: false,
  per100g: { calories: 360, protein: 7, carbs: 79, fat: 0.6, fiber: 1.4 },
};

describe("one slug per pair — the structural mirror (item 7)", () => {
  it("hreflang is ALWAYS the complete triple (by construction, never dangling)", () => {
    const h = buildRecipeHreflang("en", "shish-tawook-rice");
    expect(h.en).toBe("https://alkemos.com/recipes/shish-tawook-rice");
    expect(h.ar).toBe("https://alkemos.com/ar/recipes/shish-tawook-rice");
    expect(h["x-default"]).toBe(h.en);
    expect(Object.keys(h)).toHaveLength(3);
    // the AR mirror builds the SAME pair from its own side
    const hAr = buildRecipeHreflang("ar", "shish-tawook-rice");
    expect(hAr).toEqual(h);
  });

  it("public paths share the one slug across languages", () => {
    expect(recipePublicPath("en", "shish-tawook-rice")).toBe("/recipes/shish-tawook-rice");
    expect(recipePublicPath("ar", "shish-tawook-rice")).toBe("/ar/recipes/shish-tawook-rice");
    expect(recipesListingPath("ar")).toBe("/ar/recipes");
    expect(recipesTaxonomyPath("en", "diet", "keto")).toBe("/recipes/diet/keto");
    expect(recipesTaxonomyPath("ar", "cuisine", "egyptian")).toBe("/ar/recipes/cuisine/egyptian");
  });
});

describe("ingredient lines — grams + weight state in the version's language (item 7)", () => {
  it("EN line carries the grams and the raw state", () => {
    const line = recipeIngredientLine(ING, "en");
    expect(line).toContain("White rice");
    expect(line).toContain("250 g");
    expect(line).toContain("(raw)");
    expect(line).toContain("rinsed");
  });

  it("AR line carries the same grams (Western digits — site convention) and the نيئ state", () => {
    const line = recipeIngredientLine(ING, "ar");
    expect(line).toContain("أرز أبيض");
    expect(line).toContain("جم");
    expect(line).toContain("نيئ");
    // the numeric truth is IDENTICAL across the two versions
    expect(line).toContain("250");
  });

  it("cooked state and optional marker render in both languages", () => {
    const cooked: RecipeIngredientView = { ...ING, weightState: "cooked", isOptional: true, noteEn: null };
    expect(recipeIngredientLine(cooked, "en")).toContain("(cooked)");
    expect(recipeIngredientLine(cooked, "en")).toContain("(optional)");
    expect(recipeIngredientLine(cooked, "ar")).toContain("مطبوخ");
    expect(recipeIngredientLine(cooked, "ar")).toContain("اختياري");
  });
});

describe("the same image for both versions (item 8 — P-GATE-3)", () => {
  const ONE_IMAGE = "https://images.pexels.com/photos/1/plate.jpg";

  it("the Recipe schema node for BOTH languages carries the ONE master image", () => {
    const base = {
      title: "Shish Tawook",
      description: "d",
      pageUrl: "https://alkemos.com/recipes/shish-tawook-rice",
      image: ONE_IMAGE,
      datePublished: "2026-11-10T06:30:00Z",
      recipeYield: 4,
      prepMinutes: 20,
      cookMinutes: 25,
      cuisineLabels: ["Egyptian"],
      suitableForDietLabels: [],
      nutrition: { calories: 412, proteinG: 38, carbsG: 42, fatG: 11 },
      recipeIngredient: ["White rice: 250 g (raw)"],
      instructions: ["Season.", "Grill."],
    };
    const en = getRecipeSchema({ ...base, lang: "en" });
    const ar = getRecipeSchema({
      ...base,
      lang: "ar",
      pageUrl: "https://alkemos.com/ar/recipes/shish-tawook-rice",
      title: "شيش طاووق",
      description: "د",
    });
    expect(en.image).toEqual([ONE_IMAGE]);
    expect(ar.image).toEqual([ONE_IMAGE]); // the SAME file — by construction
    expect(ar.inLanguage).toBe("ar");
    expect(en.inLanguage).toBe("en");
  });

  it("the master-record source law: image fields live ONLY on recipes (migration text)", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20261110100000_0108_healthy_recipes_foundation.sql"),
      "utf-8",
    );
    // the image columns exist on the MASTER table…
    expect(migration).toMatch(/create table if not exists public\.recipes[\s\S]*?image_url/);
    expect(migration).toMatch(/create table if not exists public\.recipes[\s\S]*?image_alt_ar/);
    // …and NOWHERE on the versions table (the structural same-file law)
    const versionsBlock = migration.slice(
      migration.indexOf("create table if not exists public.recipe_versions"),
      migration.indexOf("create table if not exists public.recipe_ingredients"),
    );
    expect(versionsBlock).not.toContain("image_url");
    expect(versionsBlock).not.toContain("image_alt");
  });
});
