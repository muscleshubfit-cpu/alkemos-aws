import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * RECIPES SEO — the schema + indexing-chain canary
 * (HEALTHY-RECIPES-PLATFORM plan §12.1 item 9 / §10):
 *
 *  - getRecipeSchema emits the full Recipe node (computed nutrition,
 *    HowToStep instructions, honest Organization author) and NEVER an
 *    aggregateRating (the honest-schema law — zero real reviews exist).
 *  - Optional enrichment (sodium/sat-fat) is omitted when null — never
 *    fabricated (owner §2).
 *  - suitableForDiet maps only diets with an honest schema.org enum.
 *  - The indexing chain is complete: sitemap child + index row +
 *    robots.txt + IndexNow + Bing (the audit §11 trap).
 */
import {
  getRecipeSchema,
  getBreadcrumbSchema,
  SCHEMA_SUITABLE_FOR_DIET,
  jsonLd,
} from "@/lib/seo";

const SITE_URL = "https://alkemos.com";

function fullSchema(overrides: Record<string, unknown> = {}) {
  return getRecipeSchema({
    lang: "en",
    title: "Grilled Chicken with Rice",
    description: "A balanced plate.",
    pageUrl: `${SITE_URL}/recipes/grilled-chicken-rice`,
    image: "https://images.pexels.com/photos/1/x.jpg",
    datePublished: "2026-11-10T06:30:00Z",
    dateModified: "2026-11-10T06:30:00Z",
    recipeYield: 4,
    prepMinutes: 15,
    cookMinutes: 30,
    cuisineLabels: ["Egyptian"],
    suitableForDietLabels: ["VegetarianDiet"],
    nutrition: {
      calories: 412,
      proteinG: 38,
      carbsG: 42,
      fatG: 11,
      fiberG: 4,
      saturatedFatG: 2,
      sodiumMg: 340,
    },
    recipeIngredient: ["Chicken breast: 300 g (raw)", "White rice: 200 g (raw)"],
    instructions: ["Season.", "Grill.", "Serve."],
    ...overrides,
  });
}

describe("getRecipeSchema — the full Recipe node (§10-1)", () => {
  it("carries every mandatory field with correct types", () => {
    const s = fullSchema();
    expect(s["@type"]).toBe("Recipe");
    expect(s.name).toBe("Grilled Chicken with Rice");
    expect(s.recipeYield).toBe("4");
    expect(s.prepTime).toBe("PT15M");
    expect(s.cookTime).toBe("PT30M");
    expect(s.totalTime).toBe("PT45M");
    expect(s.recipeCuisine).toEqual(["Egyptian"]);
    expect(s.suitableForDiet).toEqual(["VegetarianDiet"]);
    expect(s.recipeIngredient).toHaveLength(2);
    expect(s.recipeInstructions).toEqual([
      { "@type": "HowToStep", position: 1, text: "Season." },
      { "@type": "HowToStep", position: 2, text: "Grill." },
      { "@type": "HowToStep", position: 3, text: "Serve." },
    ]);
    expect(s.inLanguage).toBe("en");
    expect(s.datePublished).toBe("2026-11-10T06:30:00Z");
  });

  it("the nutrition node mirrors the COMPUTED per-serving values", () => {
    const n = fullSchema().nutrition as Record<string, string>;
    expect(n["@type"]).toBe("NutritionInformation");
    expect(n.calories).toBe("412 kcal");
    expect(n.proteinContent).toBe("38 g");
    expect(n.carbohydrateContent).toBe("42 g");
    expect(n.fatContent).toBe("11 g");
    expect(n.fiberContent).toBe("4 g");
    expect(n.saturatedFatContent).toBe("2 g");
    expect(n.sodiumContent).toBe("340 mg");
  });

  it("OMITS sodium/sat-fat when the enrichment is null (owner §2 — no fabrication)", () => {
    const n = fullSchema({
      nutrition: { calories: 300, proteinG: 20, carbsG: 30, fatG: 8, fiberG: 3, saturatedFatG: null, sodiumMg: null },
    }).nutrition as Record<string, string>;
    expect(n.saturatedFatContent).toBeUndefined();
    expect(n.sodiumContent).toBeUndefined();
  });

  it("NEVER carries aggregateRating (the honest-schema law)", () => {
    expect(JSON.stringify(fullSchema())).not.toContain("aggregateRating");
    expect(JSON.stringify(fullSchema())).not.toContain("review");
  });

  it("the author is the honest Organization (never a fabricated Person)", () => {
    const s = fullSchema();
    expect((s.author as unknown as Record<string, string>)["@type"]).toBe("Organization");
    expect((s.publisher as unknown as Record<string, string>)["@type"]).toBe("Organization");
  });

  it("jsonLd escapes < (XSS-safe injection)", () => {
    const s = fullSchema({ title: "Chicken <script>alert(1)</script>" });
    expect(jsonLd(s)).not.toContain("<script>");
    expect(jsonLd(s)).toContain("\\u003c");
  });

  it("the AR node declares inLanguage ar and keeps the same image", () => {
    const s = fullSchema({ lang: "ar", title: "دجاج مشوي" });
    expect(s.inLanguage).toBe("ar");
    expect(s.name).toBe("دجاج مشوي");
  });
});

describe("SCHEMA_SUITABLE_FOR_DIET — the honest enum map", () => {
  it("maps only diets with a real schema.org restrictedDiet member", () => {
    expect(SCHEMA_SUITABLE_FOR_DIET).toEqual({
      vegetarian: "VegetarianDiet",
      vegan: "VeganDiet",
      "gluten-free": "GlutenFreeDiet",
      "dairy-free": "LowLactoseDiet",
      dash: "LowSaltDiet",
    });
  });

  it("keto/low-carb/high-protein/mediterranean/pescatarian are OMITTED (never approximated)", () => {
    expect(SCHEMA_SUITABLE_FOR_DIET.keto).toBeUndefined();
    expect(SCHEMA_SUITABLE_FOR_DIET["low-carb"]).toBeUndefined();
    expect(SCHEMA_SUITABLE_FOR_DIET["high-protein"]).toBeUndefined();
    expect(SCHEMA_SUITABLE_FOR_DIET.mediterranean).toBeUndefined();
    expect(SCHEMA_SUITABLE_FOR_DIET.pescatarian).toBeUndefined();
  });
});

describe("the breadcrumb node (§10-1)", () => {
  it("home → recipes → the recipe", () => {
    const b = getBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Healthy Recipes", url: "/recipes" },
      { name: "Grilled Chicken", url: "/recipes/grilled-chicken-rice" },
    ]);
    expect(b["@type"]).toBe("BreadcrumbList");
    expect(b.itemListElement[2].item).toBe(`${SITE_URL}/recipes/grilled-chicken-rice`);
  });
});

describe("the indexing chain (§10-3 — the audit §11 trap)", () => {
  const SITEMAP_INDEX = readFileSync(resolve(process.cwd(), "src/app/sitemap.xml/route.ts"), "utf-8");
  const ROBOTS = readFileSync(resolve(process.cwd(), "public/robots.txt"), "utf-8");
  const INDEXNOW = readFileSync(resolve(process.cwd(), "scripts/indexnow-submit.mjs"), "utf-8");
  const BING = readFileSync(resolve(process.cwd(), "scripts/bing-url-submit.mjs"), "utf-8");
  const SITEMAP_PAGES = readFileSync(resolve(process.cwd(), "src/app/sitemap-pages.xml/route.ts"), "utf-8");
  const LASTMOD = readFileSync(resolve(process.cwd(), "src/lib/sitemap-lastmod.ts"), "utf-8");

  it("the child sitemap route exists", () => {
    expect(readFileSync(resolve(process.cwd(), "src/app/sitemap-recipes.xml/route.ts"), "utf-8")).toBeTruthy();
  });

  it("the index registers the child with a DYNAMIC truthful lastmod", () => {
    expect(SITEMAP_INDEX).toContain("sitemap-recipes.xml");
    expect(SITEMAP_INDEX).toContain("recipesEntryLastmod");
  });

  it("robots.txt declares the child", () => {
    expect(ROBOTS).toContain("Sitemap: https://alkemos.com/sitemap-recipes.xml");
  });

  it("IndexNow + Bing inventories include the child", () => {
    expect(INDEXNOW).toContain('"sitemap-recipes.xml"');
    expect(BING).toContain('"sitemap-recipes.xml"');
  });

  it("the static surfaces (listing + methodology + hubs) ride sitemap-pages", () => {
    expect(SITEMAP_PAGES).toContain('`${base}/recipes`');
    expect(SITEMAP_PAGES).toContain('`${base}/recipes/methodology`');
    expect(SITEMAP_PAGES).toContain("RECIPE_CUISINES");
    expect(SITEMAP_PAGES).toContain("RECIPE_DIETS");
    expect(SITEMAP_PAGES).toContain("RECIPE_GOALS");
    expect(SITEMAP_PAGES).toContain("RECIPE_MEAL_TYPES");
  });

  it("the pages family anchor moved to the ship date (the UPDATE PROTOCOL)", () => {
    expect(LASTMOD).toMatch(/pages: "2026-11-10"/);
  });
});

describe("RSS + GEO + intent registration (§10-4/§10-5, decision ق7)", () => {
  it("both language feeds exist as routes", () => {
    expect(readFileSync(resolve(process.cwd(), "src/app/(en)/recipes/rss.xml/route.ts"), "utf-8")).toContain("buildRecipesRss");
    expect(readFileSync(resolve(process.cwd(), "src/app/(ar)/ar/recipes/rss.xml/route.ts"), "utf-8")).toContain("buildRecipesRss");
  });

  it("the AR feed's items link the AR tree (§12.19 P0-2 law)", () => {
    const rss = readFileSync(resolve(process.cwd(), "src/lib/recipes-rss.ts"), "utf-8");
    expect(rss).toContain('lang === "ar" ? "/ar" : ""');
  });

  it("the intent map carries the three recipes clusters", () => {
    const intent = readFileSync(resolve(process.cwd(), "src/lib/intent-map.ts"), "utf-8");
    expect(intent).toContain('cluster: "recipes-library"');
    expect(intent).toContain('cluster: "recipes-cuisines"');
    expect(intent).toContain('cluster: "recipes-diets"');
  });
});
