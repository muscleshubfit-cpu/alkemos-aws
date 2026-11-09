import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * RECIPES ROUTES — the bilingual mirror canary
 * (HEALTHY-RECIPES-PLATFORM plan §12.1 item 10): every EN route has its
 * AR mirror, the mirrors are registered in surface-locale (the walking
 * canary there is the second layer), and each route file renders with
 * the correct lang.
 */
const EN_ROOT = "src/app/(en)/recipes";
const AR_ROOT = "src/app/(ar)/ar/recipes";

const ROUTE_FILES = [
  "page.tsx",
  "layout.tsx",
  "[slug]/page.tsx",
  "cuisine/[slug]/page.tsx",
  "diet/[slug]/page.tsx",
  "goal/[slug]/page.tsx",
  "meal/[slug]/page.tsx",
  "methodology/page.tsx",
  "rss.xml/route.ts",
];

function read(root: string, rel: string): string {
  const p = resolve(process.cwd(), root, rel);
  expect(existsSync(p), `missing route file: ${root}/${rel}`).toBe(true);
  return readFileSync(p, "utf-8");
}

describe("every EN route has its AR mirror (§9.1)", () => {
  for (const rel of ROUTE_FILES) {
    it(`${rel} exists in BOTH trees`, () => {
      expect(existsSync(resolve(process.cwd(), EN_ROOT, rel))).toBe(true);
      expect(existsSync(resolve(process.cwd(), AR_ROOT, rel))).toBe(true);
    });
  }
});

describe("the language wiring per route", () => {
  it("EN explorer renders lang=\"en\"; AR explorer renders lang=\"ar\"", () => {
    expect(read(EN_ROOT, "page.tsx")).toContain('lang="en"');
    expect(read(AR_ROOT, "page.tsx")).toContain('lang="ar"');
  });

  it("both detail pages share the ONE slug space (structural mirror)", () => {
    const en = read(EN_ROOT, "[slug]/page.tsx");
    const ar = read(AR_ROOT, "[slug]/page.tsx");
    expect(en).toContain('fetchRecipeDetail(slug, "en")');
    expect(ar).toContain('fetchRecipeDetail(slug, "ar")');
    // hreflang from the SAME shared builder (the complete-by-construction pair)
    expect(en).toContain("buildRecipeHreflang");
    expect(ar).toContain("buildRecipeHreflang");
  });

  it("both detail pages emit the Recipe schema node", () => {
    expect(read(EN_ROOT, "[slug]/page.tsx")).toContain("getRecipeSchema");
    expect(read(AR_ROOT, "[slug]/page.tsx")).toContain("getRecipeSchema");
  });

  it("the AR detail page applies the no-double-brand law", () => {
    expect(read(AR_ROOT, "[slug]/page.tsx")).toContain("stripTrailingBrandForArTemplate");
  });

  it("taxonomy hubs render from the shared component with the right lang", () => {
    for (const kind of ["cuisine", "diet", "goal", "meal"]) {
      expect(read(EN_ROOT, `${kind}/[slug]/page.tsx`)).toContain('lang="en"');
      expect(read(AR_ROOT, `${kind}/[slug]/page.tsx`)).toContain('lang="ar"');
    }
  });

  it("static params pre-render the full closed taxonomy sets", () => {
    const dietEn = read(EN_ROOT, "diet/[slug]/page.tsx");
    expect(dietEn).toContain("RECIPE_DIETS.map");
    const mealAr = read(AR_ROOT, "meal/[slug]/page.tsx");
    expect(mealAr).toContain("RECIPE_MEAL_TYPES.map");
  });
});

describe("the surface-locale registration (the first layer — the walking canary is the second)", () => {
  it("PUBLIC_INDEX_MIRRORS + PUBLIC_PREFIX_MIRRORS carry the recipes rows", () => {
    const surface = readFileSync(resolve(process.cwd(), "src/lib/surface-locale.ts"), "utf-8");
    expect(surface).toContain('{ en: "/recipes", ar: "/ar/recipes" }');
    expect(surface).toContain('"/recipes/"');
  });
});

describe("ISR + caching posture (§2 architecture)", () => {
  it("detail + hubs + listing cache with the recipes tags", () => {
    expect(read(EN_ROOT, "[slug]/page.tsx")).toMatch(/export const revalidate = 3600/);
    expect(read(EN_ROOT, "diet/[slug]/page.tsx")).toMatch(/export const revalidate = 3600/);
  });

  it("the server layer tags every query (recipes-list/detail/slugs)", () => {
    const server = readFileSync(resolve(process.cwd(), "src/lib/recipes-server.ts"), "utf-8");
    expect(server).toContain('["recipes-list"]');
    expect(server).toContain('["recipes-detail"]');
    expect(server).toContain('["recipes-slugs"]');
  });
});
