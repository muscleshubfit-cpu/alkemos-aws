import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  WORKOUT_DAYS_MAX,
  WORKOUT_DAYS_MIN,
  WORKOUT_NOTES_MAX,
  buildWorkoutPrompt,
  parseWorkoutPlanText,
  validateWorkoutPlan,
  validateWorkoutRequest,
  workoutEquipmentOptions,
  workoutGoalOptions,
  workoutLevelOptions,
} from "@/lib/ai-workout-planner";

/**
 * §12.32 canaries — the AI workout-planner TRIAL (owner directive «ضيف
 * أداة جديده مخطط التمارين بالذكاء الاصطناعي») — the workout twin of
 * §12.28's meal-planner trial, with every live-hardening law that batch
 * earned applied from day one.
 *
 * LAWS GUARDED:
 *   1. INPUT: one of 4 goals · one of 3 levels · 2–6 days · one of 3
 *      equipment worlds · en|ar · notes ≤200 — anything else is a 400,
 *      never a provider call.
 *   2. COST: the route rate-limits by IP BEFORE any provider call
 *      (5 / 24 h) — pinned on the route source.
 *   3. HONEST SHAPE: a drifted/hallucinated payload is REJECTED — the
 *      days array must carry EXACTLY the requested number of training
 *      days, each with 3–8 exercises, sets 1–10, reps numeric or a
 *      bounded range.
 *   4. NO SUBSCRIPTION CONFLICT: the route touches no ai_jobs enqueue,
 *      no quota ledger, no membership gate — pinned on the route source.
 *   5. SURFACE: /ai-workout-planner + /ar/ai-workout-planner exist as a
 *      full hreflang pair, sitemap-indexed, schema-layered
 *      (WebApplication), ReviewInviteCard on the achievement surface.
 *   6. llms SYNC: both GEO files link the AI Workout Planner.
 *   7. §12.28 LIVE LAWS CARRIED OVER: 3000-token budget, 20s chain
 *      calls, JSON-only system prompt, reasoning-salvage parser — all
 *      pinned on the route source.
 */

const ROUTE_FILE = "src/app/api/ai/workout-plan-demo/route.ts";
const PAGE_FILE = "src/app/(en)/ai-workout-planner/page.tsx";
const LAYOUT_EN = "src/app/(en)/ai-workout-planner/layout.tsx";
const LAYOUT_AR = "src/app/(ar)/ar/ai-workout-planner/layout.tsx";
const SITEMAP_FILE = "src/app/sitemap-pages.xml/route.ts";
const LLMS = "public/llms.txt";
const LLMS_FULL = "src/app/llms-full.txt/route.ts";

const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");

const validPlan = (days: number) => ({
  days: Array.from({ length: days }, (_, i) => ({
    name: `Day ${i + 1}`,
    focus: "full body",
    exercises: [
      { name: "Squat", sets: 4, reps: 8 },
      { name: "Bench press", sets: 3, reps: "8-12" },
      { name: "Row", sets: 3, reps: 10 },
      { name: "Plank", sets: 3, reps: 30 },
    ],
  })),
});

describe("ai workout planner trial (§12.32)", () => {
  it("INPUT: known goal/level/equipment, 2–6 days, en|ar, notes cap", () => {
    expect(
      validateWorkoutRequest({ goal: "muscle", level: "beginner", days: 3, equipment: "full-gym", language: "ar" }).ok,
    ).toBe(true);
    expect(
      validateWorkoutRequest({ goal: "fat-loss", level: "advanced", days: WORKOUT_DAYS_MIN, equipment: "bodyweight", language: "en" }).ok,
    ).toBe(true);
    expect(
      validateWorkoutRequest({ goal: "endurance", level: "intermediate", days: WORKOUT_DAYS_MAX, equipment: "home-dumbbells", language: "en", notes: "x".repeat(WORKOUT_NOTES_MAX) }).ok,
    ).toBe(true);
    expect(
      validateWorkoutRequest({ goal: "powerlifting", level: "beginner", days: 3, equipment: "full-gym", language: "ar" }).ok,
    ).toBe(false);
    expect(
      validateWorkoutRequest({ goal: "muscle", level: "expert", days: 3, equipment: "full-gym", language: "ar" }).ok,
    ).toBe(false);
    expect(
      validateWorkoutRequest({ goal: "muscle", level: "beginner", days: 1, equipment: "full-gym", language: "ar" }).ok,
    ).toBe(false);
    expect(
      validateWorkoutRequest({ goal: "muscle", level: "beginner", days: 7, equipment: "full-gym", language: "ar" }).ok,
    ).toBe(false);
    expect(
      validateWorkoutRequest({ goal: "muscle", level: "beginner", days: 3.5, equipment: "full-gym", language: "ar" }).ok,
    ).toBe(false);
    expect(
      validateWorkoutRequest({ goal: "muscle", level: "beginner", days: 3, equipment: "smith-machine", language: "ar" }).ok,
    ).toBe(false);
    expect(
      validateWorkoutRequest({ goal: "muscle", level: "beginner", days: 3, equipment: "full-gym", language: "fr" }).ok,
    ).toBe(false);
    // Notes are trimmed to the cap, never rejected outright.
    const clipped = validateWorkoutRequest({ goal: "muscle", level: "beginner", days: 3, equipment: "full-gym", language: "ar", notes: "y".repeat(400) });
    expect(clipped.ok).toBe(true);
    if (clipped.ok) expect(clipped.value.notes?.length).toBe(WORKOUT_NOTES_MAX);
  });

  it("PROMPT: pins goal, level, day count, equipment, language, and JSON-only output", () => {
    const en = buildWorkoutPrompt({ goal: "strength", level: "intermediate", days: 4, equipment: "home-dumbbells", language: "en", notes: "avoid the left knee" });
    expect(en).toContain("4-day");
    expect(en).toContain("getting stronger");
    expect(en).toContain("intermediate");
    expect(en).toContain("a pair of dumbbells at home");
    expect(en).toContain("avoid the left knee");
    expect(en).toContain("JSON only");
    const ar = buildWorkoutPrompt({ goal: "muscle", level: "beginner", days: 3, equipment: "full-gym", language: "ar" });
    expect(ar).toContain("3 أيام");
    expect(ar).toContain("بناء العضلات");
    expect(ar).toContain("مبتدئ");
    expect(ar).toContain("نادي كامل التجهيز");
    // The option lists cover the full vocab in both languages.
    expect(workoutGoalOptions("en").map((g) => g.slug).sort()).toEqual(
      ["fat-loss", "muscle", "strength", "endurance"].sort(),
    );
    expect(workoutLevelOptions("ar")).toHaveLength(3);
    expect(workoutEquipmentOptions("en")).toHaveLength(3);
  });

  it("SHAPE: exact day count, bounded sets/reps; junk and drift rejected", () => {
    const ok = validateWorkoutPlan(validPlan(3), 3);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.days).toHaveLength(3);
    // A plan whose day count does not match the request is DISHONEST —
    // rejected (the split you asked for is the split you get).
    expect(validateWorkoutPlan(validPlan(4), 3).ok).toBe(false);
    expect(validateWorkoutPlan(validPlan(2), 3).ok).toBe(false);
    // Common free-model wrappers are tolerated ({plan:{days}} etc.).
    expect(validateWorkoutPlan({ plan: validPlan(3) }, 3).ok).toBe(true);
    expect(validateWorkoutPlan({ workout: validPlan(3) }, 3).ok).toBe(true);
    // Alternate keys tolerated (movements / exercise).
    const alt = {
      days: validPlan(3).days.map((d) => ({
        name: d.name,
        movements: d.exercises.map((e) => ({ exercise: e.name, sets: e.sets, reps: e.reps })),
      })),
    };
    expect(validateWorkoutPlan(alt, 3).ok).toBe(true);
    expect(validateWorkoutPlan(null, 3).ok).toBe(false);
    expect(validateWorkoutPlan({ days: [] }, 3).ok).toBe(false);
    // Too few exercises on a day → reject.
    expect(
      validateWorkoutPlan({ days: [{ name: "D1", exercises: [{ name: "Squat", sets: 3, reps: 8 }] }] }, 1).ok,
    ).toBe(false);
    // Out-of-bounds sets / reps → reject.
    expect(
      validateWorkoutPlan({ days: [{ name: "D1", exercises: [{ name: "Squat", sets: 12, reps: 8 }] }] }, 1).ok,
    ).toBe(false);
    expect(
      validateWorkoutPlan({ days: [{ name: "D1", exercises: [{ name: "Squat", sets: 3, reps: 99 }] }] }, 1).ok,
    ).toBe(false);
    expect(
      validateWorkoutPlan({ days: [{ name: "D1", exercises: [{ name: "Squat", sets: 3, reps: "AMRAP" }] }] }, 1).ok,
    ).toBe(false);
    // A sane range string passes through (with the 3-exercise floor met).
    const rangePlan = {
      days: [
        {
          name: "D1",
          exercises: [
            { name: "Squat", sets: 3, reps: "8-12" },
            { name: "Row", sets: 3, reps: 10 },
            { name: "Plank", sets: 3, reps: 30 },
          ],
        },
      ],
    };
    const rangeOk = validateWorkoutPlan(rangePlan, 1);
    expect(rangeOk.ok).toBe(true);
    if (rangeOk.ok) expect(rangeOk.value.days[0].exercises[0].reps).toBe("8-12");
  });

  it("REASONING SALVAGE: chain-of-thought text before the JSON still parses", () => {
    // The §12.28 live lesson applied from day one: reasoning-capable free
    // models prefix chain-of-thought text before the plan JSON — the
    // salvage parser recovers the plan from the LAST {"days"…} start.
    const planJson = JSON.stringify(validPlan(3));
    const noisy =
      "Let's plan a 3-day split for a beginner.\n" +
      "Push day, pull day, legs day. Sets: 3-4. Reps: 8-12.\n\n" +
      planJson;
    const salvaged = parseWorkoutPlanText(noisy, 3);
    expect(salvaged.ok).toBe(true);
    // A clean reply parses directly (no salvage needed).
    expect(parseWorkoutPlanText(planJson, 3).ok).toBe(true);
    // Genuinely day-less text stays rejected.
    expect(parseWorkoutPlanText("no json here at all", 3).ok).toBe(false);
  });

  it("COST + UNIFIED POOL: burst guard before the provider call, pool gate before dispatch, success-only record, no signup wall", () => {
    const src = stripComments(readFileSync(ROUTE_FILE, "utf8"));
    // The IP burst guard (abuse-only) runs BEFORE any provider call.
    expect(src).toContain("rateLimit");
    expect(src).toContain("workout-demo:");
    expect(src).toContain("BURST_GUARD");
    expect(src.indexOf("await rateLimit(")).toBeLessThan(
      src.indexOf("await dispatchAI("),
    );
    // The unified pool is checked BEFORE dispatch (read-only).
    expect(src).toContain("checkUnifiedPlanQuota");
    expect(src.indexOf("await checkUnifiedPlanQuota(")).toBeLessThan(
      src.indexOf("await dispatchAI("),
    );
    // SUCCESS-ONLY: the pool unit is recorded AFTER validation.
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
    // §12.28 live laws carried over from day one — R3 (AI-Router
    // unification): the SAME values now resolve from the registry
    // (3000-token budget · 20s chain calls · JSON-only · bounded retry);
    // the call site rides dispatchAI and must NOT carry policy inline.
    expect(src).toContain('await dispatchAI("workout-demo"');
    expect(src).not.toContain("maxTokens: 3000");
    expect(src).not.toContain("timeoutMs: 20_000");
    expect(src).toContain("REMINDER: reply with ONE JSON object");
    const registry = stripComments(readFileSync("src/lib/ai-registry.ts", "utf8"));
    const spec = registry.slice(registry.indexOf('"workout-demo":'));
    expect(spec).toContain("maxTokens: 3000");
    expect(spec).toContain("timeoutMs: 20_000");
    expect(spec).toContain("jsonMode: true");
  });

  it("SURFACE: bilingual page + full hreflang pair + schema layer", () => {
    const page = readFileSync(PAGE_FILE, "utf8");
    expect(page).toContain("useI18n");
    expect(page).toContain("workout-plan-demo");
    expect(page).toContain("ReviewInviteCard");
    expect(page).toContain("توليدان شهريًا لكل زائر");
    expect(page).toContain("2 generations per month");
    expect(page).toContain("مخطط التمارين بالذكاء الاصطناعي");
    const en = readFileSync(LAYOUT_EN, "utf8");
    expect(en).toContain('canonical: "https://alkemos.com/ai-workout-planner"');
    expect(en).toContain("ar: \"https://alkemos.com/ar/ai-workout-planner\"");
    expect(en).toContain('"x-default": "https://alkemos.com/ai-workout-planner"');
    expect(en).toContain('<ToolSchemaScripts tool="ai-workout-planner" lang="en" />');
    const ar = readFileSync(LAYOUT_AR, "utf8");
    expect(ar).toContain('canonical: "https://alkemos.com/ar/ai-workout-planner"');
    expect(ar).toContain('en: "https://alkemos.com/ai-workout-planner"');
    expect(ar).toContain('"x-default": "https://alkemos.com/ai-workout-planner"');
    expect(ar).toContain('<ToolSchemaScripts tool="ai-workout-planner" lang="ar" />');
    // AR metadata title carries no brand (the /ar template appends it —
    // eadb3e7 law). The openGraph title is allowed to name the brand.
    const metaTitle = ar.match(/^  title: "(.*)",$/m)?.[1] ?? "";
    expect(metaTitle).not.toContain("Alkemos");
    // No forbidden schemas on the new surface.
    const pageStripped = stripComments(page);
    expect(pageStripped).not.toContain("FAQPage");
    expect(pageStripped).not.toContain("aggregateRating");
    // The schema layer entry exists (WebApplication + HowTo).
    const schema = readFileSync("src/lib/tool-schema.ts", "utf8");
    expect(schema).toContain('"ai-workout-planner"');
    expect(schema).toContain("مخطط التمارين بالذكاء الاصطناعي");
  });

  it("LLMS SYNC: both GEO files link the AI Workout Planner", () => {
    const short = readFileSync(LLMS, "utf8");
    expect(short).toContain("[AI Workout Planner](https://alkemos.com/ai-workout-planner)");
    expect(short).toContain("/ar/ai-workout-planner");
    const full = readFileSync(LLMS_FULL, "utf8");
    expect(full).toContain("${SITE}/ai-workout-planner");
    expect(full).toContain("${SITE}/ar/ai-workout-planner");
  });

  it("SITEMAP: the trial pair is indexed with alternates", () => {
    const src = readFileSync(SITEMAP_FILE, "utf8");
    expect(src).toContain("`${base}/ai-workout-planner`");
    expect(src).toContain("`${base}/ar/ai-workout-planner`");
    expect(src.match(/alternates: \{ en: `\$\{base\}\/ai-workout-planner/g)).toBeTruthy();
  });

  it("DISCOVERABILITY: tools hub + OtherTools + homepage CTA + footer + nav + toggle link the trial", () => {
    // Phase 195: the hub arrays moved to tools-shared.ts — contract points
    // at the data source + the page's import wiring.
    const toolsHub = readFileSync("src/lib/tools-shared.ts", "utf8");
    expect(toolsHub).toContain('slug: "/ai-workout-planner"');
    expect(toolsHub).toContain("مخطط التمارين بالذكاء الاصطناعي");
    const toolsPage = readFileSync("src/app/(en)/tools/page.tsx", "utf8");
    expect(toolsPage).toContain('import { TOOLS, TOOL_LIBRARIES } from "@/lib/tools-shared"');
    const otherTools = readFileSync("src/components/OtherTools.tsx", "utf8");
    expect(otherTools).toContain('slug: "/ai-workout-planner"');
    const landing = readFileSync("src/components/views/LandingView.tsx", "utf8");
    // Phase 185 (owner directive 2026-09-13): the homepage GRID cards were
    // retired — the homepage links the trial via the FREE lead-card CTA
    // (secondary button) + the footer links (routes/nav/tools-hub
    // untouched).
    // Access-point fix (2026-09-14 audit): the homepage CTA is now
    // locale-aware — the AR homepage previously linked the EN planner.
    expect(landing).toContain('href={isAr ? "/ar/ai-workout-planner" : "/ai-workout-planner"}');
    // Access-point fix (2026-09-14): the footer (with its locale-aware
    // AI-planner links) moved from LandingView into the SHARED
    // SiteFooter component — the contract follows the markup.
    const footer = readFileSync("src/components/SiteFooter.tsx", "utf8");
    expect(footer).toContain('href={isAr ? "/ar/ai-workout-planner" : "/ai-workout-planner"}');
    // The retired grid entries stay retired.
    expect(landing).not.toContain('slug: "ai-workout-planner"');
    // The nav drawer tools group carries the entry (§12.31 lesson: the
    // meal planner was invisible in the drawer — the workout planner
    // ships with a drawer entry from day one).
    const header = readFileSync("src/components/SiteHeader.tsx", "utf8");
    // W1-4a (P-01): the header's nav data now lives at module scope as
    // hrefAr/hrefEn pairs (resolved via isAr at render) — pin follows shape.
    expect(header).toContain('hrefAr: "/ar/ai-workout-planner", hrefEn: "/ai-workout-planner"');
    // The language toggle swaps the pair.
    const toggle = readFileSync("src/components/LanguageToggle.tsx", "utf8");
    expect(toggle).toContain('{ en: "/ai-workout-planner", ar: "/ar/ai-workout-planner" }');
  });

  it("HONEST COPY: the page states the unified-pool limits (2/month free, success-only, plans persist)", () => {
    const page = readFileSync(PAGE_FILE, "utf8");
    expect(page).toContain("2 generations per month");
    expect(page).toContain("only successful generations are deducted from your quota");
    expect(page).toContain("never disappears when the month's quota runs out");
    // Phase 183 persistence law: the page hydrates (localStorage +
    // account) and mirrors every generated plan — no more ephemeral.
    expect(page).toContain("loadGuestPlan");
    expect(page).toContain("saveGuestPlan");
    expect(page).toContain("/api/ai/planner-plan");
    // Soft signup nudge for guests (benefits only, never a block).
    expect(page).toContain("auth?mode=signup");
    // The AR mirror re-exports the same bilingual page.
    const ar = readFileSync("src/app/(ar)/ar/ai-workout-planner/page.tsx", "utf8");
    expect(ar).toContain("@/app/(en)/ai-workout-planner/page");
  });
});
