import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * RECIPES WIRING — the UI-integration canary
 * (HEALTHY-RECIPES-PLATFORM plan §12.1 item 11 — the check-ui-wiring
 * pattern): the section appears in every mandatory entry point.
 */
function readRepo(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf-8");
}

describe("the header carries the recipes link (both nav systems)", () => {
  const header = readRepo("src/components/SiteHeader.tsx");
  it("SERVICE_NAV_DEFS nutrition group leads with Recipes", () => {
    expect(header).toContain('labelEn: "Recipes"');
    expect(header).toContain('hrefEn: "/recipes"');
    expect(header).toContain('hrefAr: "/ar/recipes"');
  });
  it("DRAWER_GROUP_DEFS nutrition group carries Recipes", () => {
    expect(header).toContain('labelAr: "الوصفات الصحية"');
  });
});

describe("the footer carries the recipes link", () => {
  it("the Nutrition column lists Recipes first", () => {
    const footer = readRepo("src/components/SiteFooter.tsx");
    expect(footer).toContain('"/ar/recipes" : "/recipes"');
    expect(footer).toContain('label === undefined ? "الوصفات الصحية" : "Recipes"'.replace(/label === undefined \? /, ""));
    expect(footer).toContain('الوصفات الصحية');
  });
});

describe("the homepage carries the featured-recipes section (§9.3)", () => {
  it("LandingView renders RecipeSuggestCards only with real published pairs", () => {
    const landing = readRepo("src/components/views/LandingView.tsx");
    expect(landing).toContain("recipeSamples");
    expect(landing).toContain("LandingRecipeCard");
    // the honest-empty law: the section renders ONLY when non-empty
    expect(landing).toMatch(/recipeSamples && recipeSamples\.length > 0/);
  });

  it("both home routes fetch the slice server-side (the bundle law)", () => {
    expect(readRepo("src/app/(en)/(home)/page.tsx")).toContain("listHomeSampleRecipes");
    expect(readRepo("src/app/(ar)/ar/(home)/page.tsx")).toContain("listHomeSampleRecipes");
  });
});

describe("the cross-navigation clusters carry the section (§9.3)", () => {
  it("OtherTools LIBRARIES + PageBottomPromo EXPLORE_ITEMS", () => {
    const other = readRepo("src/components/OtherTools.tsx");
    expect(other).toContain('slug: "/recipes"');
    const promo = readRepo("src/components/PageBottomPromo.tsx");
    expect(promo).toContain('key: "recipes"');
  });

  it("the recipes explorer excludes itself from ExploreMore", () => {
    const explorer = readRepo("src/components/recipes/RecipesExplorer.tsx");
    expect(explorer).toContain('exclude="recipes"');
  });
});

describe("the tools integration (§9.4 — read-only, isolated)", () => {
  it("the public suggest endpoint exists", () => {
    expect(readFileSync(resolve(process.cwd(), "src/app/api/recipes/suggest/route.ts"), "utf-8")).toBeTruthy();
  });

  it("calorie calculator + AI meal planner + meal planner mount the strip", () => {
    expect(readRepo("src/app/(en)/tools/calorie-calculator/page.tsx")).toContain("RecipeSuggestStrip");
    expect(readRepo("src/app/(en)/ai-meal-planner/page.tsx")).toContain("RecipeSuggestStrip");
    expect(readRepo("src/app/(en)/meal-planner/page.tsx")).toContain("RecipeSuggestStrip");
  });

  it("the suggest endpoint is READ-ONLY (the isolation law — no writes, no plan-engine input)", () => {
    const suggest = readRepo("src/app/api/recipes/suggest/route.ts");
    expect(suggest).toContain("listRecipeSummariesAll");
    expect(suggest).not.toMatch(/\.(insert|update|upsert|delete|rpc)\(/);
  });
});

describe("EVO knows the recipes family (§9.4)", () => {
  it("searchPlatform includes the recipe hub arm", () => {
    const evo = readRepo("src/lib/evo-search.ts");
    expect(evo).toContain("searchRecipeHubs");
    expect(evo).toContain('type: "recipe"');
    expect(evo).toContain('"/recipes/diet/keto"');
  });
});

describe("the blog auto-links recipe mentions (§9.3)", () => {
  it("blog-tool-links carries the recipes-hub rule ABOVE the generic hubs", () => {
    const links = readRepo("src/lib/blog-tool-links.ts");
    const recipesIdx = links.indexOf('id: "recipes-hub"');
    const programsIdx = links.indexOf('id: "programs-hub"');
    expect(recipesIdx).toBeGreaterThan(-1);
    expect(programsIdx).toBeGreaterThan(recipesIdx); // most-specific-first law
  });
});

describe("the admin panel (§11-10)", () => {
  it("/admin/recipes exists with the API route", () => {
    expect(readFileSync(resolve(process.cwd(), "src/app/(app)/admin/recipes/page.tsx"), "utf-8")).toBeTruthy();
    expect(readFileSync(resolve(process.cwd(), "src/app/api/admin/recipes/route.ts"), "utf-8")).toContain("requireAdmin");
  });

  it("the admin shell nav carries the entry", () => {
    expect(readRepo("src/components/admin/AdminShell.tsx")).toContain('"/admin/recipes"');
  });

  it("the favorites API is authed-only (decision ق6)", () => {
    const fav = readRepo("src/app/api/recipes/favorite/route.ts");
    expect(fav).toContain("requireUser");
    expect(fav).not.toContain("requireAdmin"); // authed users, not staff-only
  });
});

describe("the llms guides declare the family (§10-4)", () => {
  it("both guides list the recipes section + the citation rule", () => {
    const llms = readRepo("public/llms.txt");
    const full = readRepo("src/app/llms-full.txt/route.ts");
    for (const src of [llms, full]) {
      expect(src).toContain("Healthy Recipes");
      expect(src).toContain("/recipes/[slug]");
      expect(src).toMatch(/[Rr]ecipe requests/);
    }
  });
});
