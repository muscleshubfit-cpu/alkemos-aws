import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  DEMO_CALORIE_DRIFT,
  DEMO_CALORIE_MAX,
  DEMO_CALORIE_MIN,
  DEMO_NOTES_MAX,
  buildDemoPrompt,
  demoSystemOptions,
  parseDemoPlanText,
  validateDemoPlan,
  validateDemoRequest,
} from "@/lib/ai-meal-planner";

/**
 * §12.28 canaries — the AI meal-planner TRIAL (owner directive «اين صفحة
 * تخطيط الوجبات بالذكاء الاصطناعي؟ مطلوب إنشاؤها مع سماح بالتجربة
 * للجميع بدون تعارض مع الاشتراكات»).
 *
 * LAWS GUARDED:
 *   1. INPUT: calories 1200–4000, one of the 4 site systems, en|ar,
 *      notes ≤200 — anything else is a 400, never a provider call.
 *   2. COST: the route runs an IP BURST GUARD before any provider call
 *      (abuse-only) — pinned on the route source.
 *   3. HONEST SHAPE: a drifted/hallucinated payload is REJECTED —
 *      meals/items/grams/kcal validated, totals recomputed server-side,
 *      ±20% calorie closure.
 *   4. UNIFIED POOL (Phase 183 «البوول الموحد»): the route gates by the
 *      caller's unified monthly pool BEFORE dispatch, records ONE unit
 *      SUCCESS-ONLY (after validation), and auto-saves member plans —
 *      pinned on the route source. No signup wall (getAuthUser, never
 *      requireUser/requireCoach), no ai_jobs queue.
 *   5. SURFACE: /ai-meal-planner + /ar/ai-meal-planner exist as a full
 *      hreflang pair, sitemap-indexed, schema-layered (WebApplication),
 *      and the diet-plan matrix CTA now leads to the generator (the
 *      written promise «خطط وجباتك بالذكاء الاصطناعي» has a destination).
 *   6. llms SYNC: both GEO files point the AI Meal Planner link at the
 *      new page (not the manual planner).
 */

const ROUTE_FILE = "src/app/api/ai/meal-plan-demo/route.ts";
const PAGE_FILE = "src/app/(en)/ai-meal-planner/page.tsx";
const LAYOUT_EN = "src/app/(en)/ai-meal-planner/layout.tsx";
const LAYOUT_AR = "src/app/(ar)/ar/ai-meal-planner/layout.tsx";
const SITEMAP_FILE = "src/app/sitemap-pages.xml/route.ts";
const LEAF_AR = "src/app/(ar)/ar/diet-plan/[level]/[system]/page.tsx";
const LEAF_EN = "src/app/(en)/diet-plan/[level]/[system]/page.tsx";
const HUB_AR = "src/app/(ar)/ar/diet-plan/page.tsx";
const HUB_EN = "src/app/(en)/diet-plan/page.tsx";
const LLMS = "public/llms.txt";
const LLMS_FULL = "src/app/llms-full.txt/route.ts";

const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");

const validPlan = (total: number) => ({
  meals: [
    { name: "Breakfast", items: [
      { food: "Oats", grams: 80, kcal: Math.round(total * 0.15) },
      { food: "Milk", grams: 200, kcal: Math.round(total * 0.1) },
    ] },
    { name: "Lunch", items: [
      { food: "Chicken", grams: 200, kcal: Math.round(total * 0.2) },
      { food: "Rice", grams: 250, kcal: Math.round(total * 0.15) },
    ] },
    { name: "Dinner", items: [
      { food: "Fish", grams: 200, kcal: Math.round(total * 0.2) },
      { food: "Salad", grams: 150, kcal: Math.round(total * 0.1) },
    ] },
    { name: "Snack", items: [
      { food: "Yogurt", grams: 150, kcal: Math.round(total * 0.05) },
      { food: "Apple", grams: 150, kcal: Math.round(total * 0.05) },
    ] },
  ],
});

describe("ai meal planner trial (§12.28)", () => {
  it("INPUT: calories bounds, known system, en|ar, notes cap", () => {
    expect(validateDemoRequest({ calories: 2000, system: "keto", language: "ar" }).ok).toBe(true);
    expect(validateDemoRequest({ calories: DEMO_CALORIE_MIN, system: "balanced", language: "en" }).ok).toBe(true);
    expect(validateDemoRequest({ calories: DEMO_CALORIE_MAX, system: "vegetarian", language: "en", notes: "x".repeat(DEMO_NOTES_MAX) }).ok).toBe(true);
    expect(validateDemoRequest({ calories: 1100, system: "keto", language: "ar" }).ok).toBe(false);
    expect(validateDemoRequest({ calories: 4001, system: "keto", language: "ar" }).ok).toBe(false);
    expect(validateDemoRequest({ calories: 2000.5, system: "keto", language: "ar" }).ok).toBe(false);
    expect(validateDemoRequest({ calories: 2000, system: "carnivore", language: "ar" }).ok).toBe(false);
    expect(validateDemoRequest({ calories: 2000, system: "keto", language: "fr" }).ok).toBe(false);
    // Notes are trimmed to the cap, never rejected outright.
    const clipped = validateDemoRequest({ calories: 2000, system: "keto", language: "ar", notes: "y".repeat(400) });
    expect(clipped.ok).toBe(true);
    if (clipped.ok) expect(clipped.value.notes?.length).toBe(DEMO_NOTES_MAX);
  });

  it("PROMPT: pins calories, the system split, the language, and JSON-only output", () => {
    const en = buildDemoPrompt({ calories: 2500, system: "high-protein", language: "en", notes: "no dairy" });
    expect(en).toContain("2500 kcal");
    expect(en).toContain("High-Protein");
    expect(en).toContain("45/35/20");
    expect(en).toContain("no dairy");
    expect(en).toContain("JSON only");
    const ar = buildDemoPrompt({ calories: 1800, system: "vegetarian", language: "ar" });
    expect(ar).toContain("1800");
    expect(ar).toContain("نباتي");
    expect(ar).toContain("25/50/25");
    expect(ar).toContain("مطبخ عربي");
    // Four system options in each language (the site's own presets).
    expect(demoSystemOptions("en").map((s) => s.slug).sort()).toEqual(
      ["balanced", "high-protein", "keto", "vegetarian"].sort(),
    );
    expect(demoSystemOptions("ar")).toHaveLength(4);
  });

  it("SHAPE: valid plans pass with server-recomputed totals; junk is rejected", () => {
    const ok = validateDemoPlan(validPlan(2000), 2000);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value.kcal).toBe(ok.value.meals.reduce((s, m) => s + m.kcal, 0));
      expect(Math.abs(ok.value.kcal - 2000)).toBeLessThanOrEqual(2000 * DEMO_CALORIE_DRIFT);
    }
    // Common free-model wrappers are tolerated ({plan:{meals}} etc.).
    expect(validateDemoPlan({ plan: validPlan(2000) }, 2000).ok).toBe(true);
    expect(validateDemoPlan({ day_plan: validPlan(2000) }, 2000).ok).toBe(true);
    // Alternate item keys tolerated; totals still recomputed.
    const alt = {
      meals: validPlan(2000).meals.map((m) => ({
        name: m.name,
        foods: m.items.map((i) => ({ name: i.food, grams: i.grams, calories: i.kcal })),
      })),
    };
    expect(validateDemoPlan(alt, 2000).ok).toBe(true);
    expect(validateDemoPlan(null, 2000).ok).toBe(false);
    expect(validateDemoPlan({ meals: [] }, 2000).ok).toBe(false);
    expect(validateDemoPlan({ meals: [{ name: "X", items: [{ food: "a", grams: 2, kcal: 20 }] }] }, 2000).ok).toBe(false);
    expect(validateDemoPlan({ meals: [{ name: "X", items: [{ food: "a", grams: 9999, kcal: 20 }] }] }, 2000).ok).toBe(false);
    expect(validateDemoPlan({ meals: [{ name: "X", items: [{ food: "a", grams: 100, kcal: "lots" }] }] }, 2000).ok).toBe(false);
    // Calorie drift beyond ±20% of the target → reject, never display.
    expect(validateDemoPlan(validPlan(2000), 4000).ok).toBe(false);
  });

  it("REASONING SALVAGE: chain-of-thought text before the JSON still parses", () => {
    // Live-diagnosed free-model behavior (§12.28): reasoning arithmetic
    // precedes the plan JSON — the salvage parser recovers the plan from
    // the LAST {"meals"…} start instead of failing the whole reply.
    const planJson = JSON.stringify(validPlan(2000));
    const noisy =
      "We need 45% protein of 2000 kcal = 900 kcal {macro math}. Let's compute.\n" +
      "Total grams: protein 225 g, carbs 175 g, fat 44 g.\n\n" +
      planJson;
    const salvaged = parseDemoPlanText(noisy, 2000);
    expect(salvaged.ok).toBe(true);
    if (salvaged.ok) expect(salvaged.value.kcal).toBe(2000);
    // A clean reply parses directly (no salvage needed).
    expect(parseDemoPlanText(planJson, 2000).ok).toBe(true);
    // Genuinely meal-less text stays rejected.
    expect(parseDemoPlanText("no json here at all", 2000).ok).toBe(false);
  });

  it("COST + UNIFIED POOL: burst guard before the provider call, pool gate before dispatch, success-only record, no signup wall", () => {
    const src = stripComments(readFileSync(ROUTE_FILE, "utf8"));
    // The IP burst guard (abuse-only) runs BEFORE any provider call.
    expect(src).toContain("rateLimit");
    expect(src).toContain("meal-demo:");
    expect(src).toContain("BURST_GUARD");
    expect(src.indexOf("await rateLimit(")).toBeLessThan(
      src.indexOf("await dispatchAI("),
    );
    // The unified pool is checked BEFORE dispatch (read-only).
    expect(src).toContain("checkUnifiedPlanQuota");
    expect(src.indexOf("await checkUnifiedPlanQuota(")).toBeLessThan(
      src.indexOf("await dispatchAI("),
    );
    // SUCCESS-ONLY: the pool unit is recorded AFTER validation, never
    // before dispatch (failures/422 never burn the pool).
    expect(src.indexOf("await recordUnifiedPlanUsage(")).toBeGreaterThan(
      src.indexOf("await dispatchAI("),
    );
    // Guest identity (hashed) — no signup wall, no hard auth.
    expect(src).toContain("hashGuestKey");
    expect(src).toContain("getAuthUser");
    // No queue, no hard member gate (guests welcome within the pool).
    expect(src).not.toContain("enqueueAiJob");
    expect(src).not.toContain("requireUser");
    expect(src).not.toContain("requireCoach");
    // Member auto-save to the account (spec: plans always saved).
    expect(src).toContain("ai-planner");
  });

  it("SURFACE: bilingual page + full hreflang pair + schema layer", () => {
    const page = readFileSync(PAGE_FILE, "utf8");
    expect(page).toContain("useI18n");
    expect(page).toContain("meal-plan-demo");
    expect(page).toContain("ReviewInviteCard");
    expect(page).toContain("توليدان شهريًا لكل زائر");
    expect(page).toContain("2 generations per month");
    const en = readFileSync(LAYOUT_EN, "utf8");
    expect(en).toContain('canonical: "https://alkemos.com/ai-meal-planner"');
    expect(en).toContain("ar: \"https://alkemos.com/ar/ai-meal-planner\"");
    expect(en).toContain('"x-default": "https://alkemos.com/ai-meal-planner"');
    expect(en).toContain('<ToolSchemaScripts tool="ai-meal-planner" lang="en" />');
    const ar = readFileSync(LAYOUT_AR, "utf8");
    expect(ar).toContain('canonical: "https://alkemos.com/ar/ai-meal-planner"');
    expect(ar).toContain('en: "https://alkemos.com/ai-meal-planner"');
    expect(ar).toContain('"x-default": "https://alkemos.com/ai-meal-planner"');
    expect(ar).toContain('<ToolSchemaScripts tool="ai-meal-planner" lang="ar" />');
    // AR metadata title carries no brand (the /ar template appends it —
    // eadb3e7 law). The openGraph title is allowed to name the brand
    // explicitly (same law as the diet-plan AR pages).
    const metaTitle = ar.match(/^  title: "(.*)",$/m)?.[1] ?? "";
    expect(metaTitle).not.toContain("Alkemos");
    // No forbidden schemas on the new surface.
    const pageStripped = stripComments(page);
    expect(pageStripped).not.toContain("FAQPage");
    expect(pageStripped).not.toContain("aggregateRating");
  });

  it("MATRIX CTA: the written AI promise now leads to the generator (all four files)", () => {
    for (const [name, file] of [
      ["leaf-ar", LEAF_AR],
      ["leaf-en", LEAF_EN],
    ] as const) {
      const src = readFileSync(file, "utf8");
      expect(src, `${name}: generator link`).toContain(
        name === "leaf-ar" ? 'href="/ar/ai-meal-planner"' : 'href="/ai-meal-planner"',
      );
      // The manual planner stays as the exact-grams secondary path.
      expect(src, `${name}: manual planner stays`).toContain(
        name === "leaf-ar" ? 'href="/ar/meal-planner"' : 'href="/meal-planner"',
      );
    }
    const hubAr = readFileSync(HUB_AR, "utf8");
    expect(hubAr).toContain("بالذكاء الاصطناعي");
    const hubEn = readFileSync(HUB_EN, "utf8");
    expect(hubEn).toContain("with AI");
  });

  it("LLMS SYNC: both GEO files point the AI Meal Planner at the trial page", () => {
    const short = readFileSync(LLMS, "utf8");
    expect(short).toContain("[AI Meal Planner](https://alkemos.com/ai-meal-planner)");
    // §12.33: the library label (owner directive «باسم مكتبة الخطط
    // الغذاييه الجاهزه»).
    expect(short).toContain("[Diet Plan Library](https://alkemos.com/diet-plan)");
    const full = readFileSync(LLMS_FULL, "utf8");
    expect(full).toContain("${SITE}/ai-meal-planner");
    expect(full).toContain("${SITE}/diet-plan");
    // The old misleading link (manual planner posing as AI) is gone.
    expect(short).not.toContain("[AI Meal Planner](https://alkemos.com/meal-planner)");
  });

  it("SITEMAP: the trial pair is indexed with alternates", () => {
    const src = readFileSync(SITEMAP_FILE, "utf8");
    expect(src).toContain("`${base}/ai-meal-planner`");
    expect(src).toContain("`${base}/ar/ai-meal-planner`");
    expect(src.match(/alternates: \{ en: `\$\{base\}\/ai-meal-planner/g)).toBeTruthy();
  });

  it("DISCOVERABILITY: tools hub + OtherTools + homepage CTA + footer + nav link the trial", () => {
    // Phase 195: the hub arrays moved to tools-shared.ts (single source also
    // feeding the homepage "8+ Tools" chip) — the contract now asserts the
    // DATA there + the page's import wiring.
    const toolsHub = readFileSync("src/lib/tools-shared.ts", "utf8");
    expect(toolsHub).toContain('slug: "/ai-meal-planner"');
    const toolsPage = readFileSync("src/app/(en)/tools/page.tsx", "utf8");
    expect(toolsPage).toContain('import { TOOLS, TOOL_LIBRARIES } from "@/lib/tools-shared"');
    const otherTools = readFileSync("src/components/OtherTools.tsx", "utf8");
    expect(otherTools).toContain('slug: "/ai-meal-planner"');
    const landing = readFileSync("src/components/views/LandingView.tsx", "utf8");
    // Phase 185 (owner directive 2026-09-13): the homepage GRID cards were
    // retired — the AI planners are the flagship of the free experience via
    // the FREE lead-card CTA + the footer links (routes/nav/tools-hub
    // untouched). Phase 194 (owner directive — Copy Refinement Pass): the
    // CTA label is the benefit-first «أنشئ خطتي» / "Create My Plan".
    // Access-point fix (2026-09-14 audit): the homepage CTA is now
    // locale-aware — the AR homepage previously linked the EN planner.
    expect(landing).toContain('href={isAr ? "/ar/ai-meal-planner" : "/ai-meal-planner"}');
    expect(landing).toContain("أنشئ خطتي");
    expect(landing).toContain("Create My Plan");
    // HOME-REFINE-270 (owner directive 2026-09-24): the planning
    // section is now the INTERACTIVE #plan builder pair (workout +
    // nutrition) — the retired mixed headline (planners + EVO + an
    // implied human coach) is pinned DEAD; the meal-planner CTA pair
    // «أنشئ خطتي / Create My Plan» stays pinned, now on the nutrition
    // builder card.
    expect(landing).toContain('id="plan"');
    expect(landing).toContain("أنشئ خطتي");
    expect(landing).toContain("Create My Plan");
    expect(landing).not.toContain("خطة مبنية حولك — ومدرب يواكب تقدّمك.");
    expect(landing).not.toContain("A plan built around you — and a coach who keeps it moving.");
    // Access-point fix (2026-09-14): the footer (with its locale-aware
    // AI-planner links) moved from LandingView into the SHARED
    // SiteFooter component — the contract follows the markup.
    const footer = readFileSync("src/components/SiteFooter.tsx", "utf8");
    expect(footer).toContain('href={isAr ? "/ar/ai-meal-planner" : "/ai-meal-planner"}');
    // The retired grid entries stay retired.
    expect(landing).not.toContain('slug: "ai-meal-planner"');
    // §12.31 (owner directive «عدل الاسم الى مخطط الوجبات بالذكاء
    // الاصطناعي»): the FULL name everywhere — the abbreviated
    // «مخطط بالذكاء الاصطناعي» is gone from every surface.
    // Access-point fix (2026-09-14): the Tools footer list (with the full
    // Arabic name) lives in the SHARED SiteFooter component now.
    const landingOrFooter = landing.includes("مخطط الوجبات بالذكاء الاصطناعي")
      ? landing
      : footer;
    expect(landingOrFooter).toContain("مخطط الوجبات بالذكاء الاصطناعي");
    expect(landing).not.toContain("مخطط بالذكاء الاصطناعي");
    expect(footer).not.toContain("مخطط بالذكاء الاصطناعي");
    const header = readFileSync("src/components/SiteHeader.tsx", "utf8");
    expect(header).toContain("مخطط الوجبات بالذكاء الاصطناعي");
    // W1-4a (P-01): the header's nav data now lives at module scope as
    // hrefAr/hrefEn pairs (resolved via isAr at render) — pin follows shape.
    expect(header).toContain('hrefAr: "/ar/ai-meal-planner", hrefEn: "/ai-meal-planner"');
  });

  it("HONEST COPY: the page states the unified-pool limits (2/month free, success-only, plans persist)", () => {
    const page = readFileSync(PAGE_FILE, "utf8");
    expect(page).toContain("2 generations per month");
    expect(page).toContain("Only successful generations are deducted from your quota");
    expect(page).toContain("never disappears when the month's quota runs out");
    // Phase 183 persistence law: the page hydrates (localStorage +
    // account) and mirrors every generated plan — no more ephemeral.
    expect(page).toContain("loadGuestPlan");
    expect(page).toContain("saveGuestPlan");
    expect(page).toContain("/api/ai/planner-plan");
    // Soft signup nudge for guests (benefits only, never a block).
    expect(page).toContain("auth?mode=signup");
    // The AR mirror re-exports the same bilingual page.
    const ar = readFileSync("src/app/(ar)/ar/ai-meal-planner/page.tsx", "utf8");
    expect(ar).toContain('@/app/(en)/ai-meal-planner/page');
  });
});
