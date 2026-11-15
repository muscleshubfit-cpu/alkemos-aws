import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PERIODIZATION_WEEKS,
  LARGE_MUSCLE_WEEKLY_SETS,
  SMALL_MUSCLE_WEEKLY_SETS,
  buildWorkoutPeriodization,
  classifyPeriodizationGoal,
  classifyPeriodizationLevel,
} from "@/lib/workout-periodization";
import { buildWorkoutPrompt as buildDemoPrompt } from "@/lib/ai-workout-planner";
import { AI_FUNCTION_REGISTRY } from "@/lib/ai-registry";

/**
 * WOR-7 / P2-1 canaries (audit AI-GENERATION-PIPELINES-2026-11-15) — the
 * deterministic multi-week TRAINING-INTELLIGENCE layer:
 *
 *   1. THE WAVE: exactly 4 weeks, week 4 ALWAYS the deload (half sets,
 *      floor 2, −10% load); weeks 2-3 carry real progression; beginners
 *      progress by reps, never load jumps before form mastery.
 *   2. VOLUME BANDS: 10-20 weekly sets per large muscle / 6-12 per small
 *      — the SAME numbers the upgraded prompts teach (model target and
 *      server stamp can never diverge).
 *   3. CARDIO BY GOAL: keyed by the CLIENT'S goal (never model prose) —
 *      fat-loss/endurance always carry a prescription; muscle/strength
 *      never carry a mandatory one.
 *   4. WIRING: every AI workout plan (paid path AND local fallback) saves
 *      the stamp — the registry row's "Multi-week" claim is now TRUE,
 *      which the registry rationale itself states honestly.
 *   5. PROMPTS: both the coach prompt and the demo trial prompt carry
 *      the explicit training-intelligence sections (ordering, volume
 *      bands, warm-up, cardio, 4-week wave) — the audit's finding was
 *      "no progression, no volume ranges, no ordering, no warm-up,
 *      no goal-keyed cardio".
 *   6. UI WIRING: the member's PlansView and the coach's modal + print
 *      export actually RENDER the stamp (the WOR-1 lesson: whatever is
 *      generated but never displayed is a defect, not a feature).
 */

/* ── Behavioral wiring (the chain is MOCKED — same pattern as the
 * plan-generator-regen-quality battery; the engine's behavior around the
 * gate is the product under test). ── */
const chainState = vi.hoisted(() => {
  const responses: Array<{ text: string; model: string; provider: string } | Error> = [];
  const prompts: string[] = [];
  return { responses, prompts };
});

vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...actual,
    callFreeAIFallbackChain: vi.fn(async (prompt: string) => {
      chainState.prompts.push(prompt);
      const next = chainState.responses.shift();
      if (!next) throw new Error("no scripted response");
      if (next instanceof Error) throw next;
      // INF-4 / P2-2: the engine's result carries qualityTier (untagged
      // entries default "strong") — the mock mirrors the engine default so
      // the plan generators' generation stamp stays well-formed.
      return { qualityTier: "strong" as const, ...next };
    }),
  };
});

vi.mock("@/lib/plan-food-grounding", () => ({
  groundItemToLibrary: () => null,
}));

import { generateWorkoutPlanAI } from "@/lib/plan-generator";
import type { ClientContext } from "@/lib/ai-local";

const ctx: ClientContext = {
  name: "عميل الاختبار",
  nutrition: {
    gender: "male",
    weight: "80",
    height: "180",
    age: "30",
    target_weight: "75",
    meals: "3",
    diet: "متوازن",
    allergies: "",
    disliked: "",
  },
  fitness: { days: "4", goal: "خسارة الوزن", activity: "متوسط", experience: "متوسط" },
  recent_measurements: [],
  recent_plan_names: [],
};

const validWorkoutPlan = () => ({
  overview: "برنامج أسبوعي",
  weekly_volume: "18 مجموعة أسبوعيًا",
  progression: "تدرّج 4 أسابيع",
  days: [
    { day: "السبت", focus: "صدر", isRest: false, exercises: [
      { name: "Barbell Bench Press - Medium Grip", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "" },
      { name: "Incline Press", sets: 3, reps: "10", rest: "60 ثانية", notes: "" },
      { name: "Cable Fly", sets: 3, reps: "12", rest: "60 ثانية", notes: "" },
    ] },
    { day: "الأحد", focus: "راحة", isRest: true, exercises: [] },
    { day: "الإثنين", focus: "ظهر", isRest: false, exercises: [
      { name: "Full Range-Of-Motion Lat Pulldown", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "" },
      { name: "Row", sets: 3, reps: "10", rest: "60 ثانية", notes: "" },
      { name: "Face Pull", sets: 3, reps: "15", rest: "45 ثانية", notes: "" },
    ] },
    { day: "الثلاثاء", focus: "أرجل", isRest: false, exercises: [
      { name: "Barbell Squat", sets: 4, reps: "8-12", rest: "120 ثانية", notes: "" },
      { name: "Leg Press", sets: 3, reps: "10", rest: "90 ثانية", notes: "" },
      { name: "Calf Raise", sets: 3, reps: "15", rest: "45 ثانية", notes: "" },
    ] },
    { day: "الأربعاء", focus: "أكتاف", isRest: false, exercises: [
      { name: "Dumbbell Shoulder Press", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "" },
      { name: "Lateral Raise", sets: 3, reps: "12", rest: "60 ثانية", notes: "" },
      { name: "Shrug", sets: 3, reps: "12", rest: "60 ثانية", notes: "" },
    ] },
  ],
});

beforeEach(() => {
  chainState.responses.length = 0;
  chainState.prompts.length = 0;
  vi.clearAllMocks();
});

/* ── Source-of-truth file pins (the repo's own canary pattern; resolved
 * from THIS file's location so the pins work from any cwd — CI runs
 * from the repo root, local runs may not). ── */
const HERE = dirname(fileURLToPath(import.meta.url));
const PLANS_VIEW = "src/components/views/PlansView.tsx";
const COACH_VIEW = "src/components/views/CoachClientView.tsx";
const COACH_PROMPT_FILE = "src/lib/plan-generator.ts";
const read = (f: string) => readFileSync(join(HERE, "../../../", f), "utf-8");

describe("WOR-7 — the 4-week wave (deterministic math)", () => {
  it("always exactly 4 weeks; week 4 is the deload, weeks 1-3 are not", () => {
    for (const goal of ["خسارة الوزن", "بناء العضلات", "زيادة القوة", "اللياقة العامة", undefined]) {
      const p = buildWorkoutPeriodization({ goal, level: "متوسط" });
      expect(p.weeks).toHaveLength(PERIODIZATION_WEEKS);
      expect(p.weeks.map((w) => w.week)).toEqual([1, 2, 3, 4]);
      expect(p.weeks.filter((w) => w.isDeload).map((w) => w.week)).toEqual([4]);
    }
  });

  it("the deload prescription halves sets (floor 2) and cuts load 10%", () => {
    const p = buildWorkoutPeriodization({ goal: "muscle", level: "advanced", language: "ar" });
    const deload = p.weeks[3];
    expect(deload.prescription).toContain("النصف");
    expect(deload.prescription).toContain("حد أدنى مجموعتان");
    expect(deload.prescription).toContain("−10%");
    // The block repeats: after week 4 the cycle restarts at week-2 logic
    // on week-3 loads — progression survives the deload.
    expect(deload.prescription).toContain("دورة جديدة");
  });

  it("weeks 2-3 carry real progression; beginners progress by REPS not load", () => {
    const adv = buildWorkoutPeriodization({ goal: "muscle", level: "متقدم" });
    expect(adv.weeks[1].prescription).toContain("+1 مجموعة");
    expect(adv.weeks[1].prescription).toContain("6 مجموعات");
    expect(adv.weeks[2].prescription).toContain("2.5-5%");
    const beg = buildWorkoutPeriodization({ goal: "muscle", level: "مبتدئ" });
    expect(beg.weeks[1].prescription).toContain("+2 تكرارات");
    expect(beg.weeks[1].prescription).toContain("نفس الوزن");
    expect(beg.weeks[1].prescription).not.toContain("أضف 2.5 كجم");
  });

  it("the wave is bilingual — en labels differ from ar", () => {
    const ar = buildWorkoutPeriodization({ goal: "muscle", level: "intermediate", language: "ar" });
    const en = buildWorkoutPeriodization({ goal: "muscle", level: "intermediate", language: "en" });
    expect(ar.weeks[0].label).toContain("الأسبوع 1");
    expect(en.weeks[0].label).toBe("Week 1 — Base");
    expect(en.weeks[3].label).toBe("Week 4 — Deload");
    expect(en.volumeNote).toContain("10-20");
    expect(en.warmUp.length + en.coolDown.length).toBeGreaterThan(40);
  });
});

describe("WOR-7 — per-muscle volume bands (constants)", () => {
  it("large 10-20, small 6-12 — the same numbers the prompts teach", () => {
    expect(LARGE_MUSCLE_WEEKLY_SETS).toEqual({ min: 10, max: 20 });
    expect(SMALL_MUSCLE_WEEKLY_SETS).toEqual({ min: 6, max: 12 });
    const ar = buildWorkoutPeriodization({ goal: "muscle", language: "ar" });
    expect(ar.volumeNote).toContain("10-20");
    expect(ar.volumeNote).toContain("6-12");
    const en = buildWorkoutPeriodization({ goal: "muscle", language: "en" });
    expect(en.volumeNote).toContain("10-20");
    expect(en.volumeNote).toContain("6-12");
  });
});

describe("WOR-7 — cardio keyed by the client's goal", () => {
  it("fat-loss carries a LISS prescription (3-4 × 25-40)", () => {
    const p = buildWorkoutPeriodization({ goal: "خسارة الوزن" });
    expect(p.cardio).toBeDefined();
    expect(p.cardio!.sessionsPerWeek).toBe("3-4");
    expect(p.cardio!.minutesPerSession).toBe("25-40");
    expect(p.cardio!.modality).toContain("مشي مائل");
  });

  it("endurance carries zone-2 + intervals; general carries moderate work", () => {
    const e = buildWorkoutPeriodization({ goal: "اللياقة العامة والتحمل" });
    expect(e.cardio!.sessionsPerWeek).toBe("2-3");
    expect(e.cardio!.modality).toContain("Zone 2");
    const g = buildWorkoutPeriodization({ goal: "توازن عام" });
    expect(g.cardio!.sessionsPerWeek).toBe("2");
  });

  it("muscle/strength never carry a MANDATORY cardio block (recovery first)", () => {
    const m = buildWorkoutPeriodization({ goal: "بناء العضلات" });
    expect(m.cardio!.sessionsPerWeek).toBe("1-2");
    expect(m.cardio!.modality).toContain("اختياري");
    const s = buildWorkoutPeriodization({ goal: "زيادة القوة" });
    expect(s.cardio!.sessionsPerWeek).toBe("0");
    expect(s.cardio!.modality).toContain("لا كارديو إلزامي");
  });

  it("goal/level classification accepts the real surface vocab (AR + EN)", () => {
    expect(classifyPeriodizationGoal("خسارة الوزن")).toBe("fat-loss");
    expect(classifyPeriodizationGoal("تخسيس")).toBe("fat-loss");
    expect(classifyPeriodizationGoal("fat loss")).toBe("fat-loss");
    expect(classifyPeriodizationGoal("بناء العضلات")).toBe("muscle");
    expect(classifyPeriodizationGoal("build muscle")).toBe("muscle");
    expect(classifyPeriodizationGoal("زيادة القوة")).toBe("strength");
    expect(classifyPeriodizationGoal("اللياقة العامة")).toBe("endurance");
    expect(classifyPeriodizationGoal("متوازن")).toBe("general");
    expect(classifyPeriodizationGoal(undefined)).toBe("general");
    expect(classifyPeriodizationLevel("مبتدئ")).toBe("beginner");
    expect(classifyPeriodizationLevel("beginner")).toBe("beginner");
    expect(classifyPeriodizationLevel("متقدم")).toBe("advanced");
    expect(classifyPeriodizationLevel("متوسط")).toBe("intermediate");
  });
});

describe("WOR-7 — wiring: every AI workout plan ships the multi-week stamp", () => {
  it("the PAID path stamps the wave on the saved content (fat-loss ctx → cardio rides)", async () => {
    chainState.responses.push({ text: JSON.stringify(validWorkoutPlan()), model: "m", provider: "nvidia" });
    const res = await generateWorkoutPlanAI(ctx);
    expect(res.source).toBe("nvidia:m");
    const content = res.content as {
      periodization?: {
        weeks: Array<{ week: number; isDeload: boolean; prescription: string }>;
        cardio?: { sessionsPerWeek: string };
        volumeNote: string;
        warmUp: string;
        coolDown: string;
      };
    };
    expect(content.periodization).toBeDefined();
    expect(content.periodization!.weeks).toHaveLength(4);
    expect(content.periodization!.weeks[3].isDeload).toBe(true);
    expect(content.periodization!.volumeNote).toContain("10-20");
    // ctx's goal is خسارة الوزن → the fat-loss cardio prescription rides.
    expect(content.periodization!.cardio!.sessionsPerWeek).toBe("3-4");
  });

  it("the LOCAL FALLBACK path ships the SAME stamp (never poorer than the paid path)", async () => {
    chainState.responses.push(new Error("chain dead"));
    const res = await generateWorkoutPlanAI(ctx);
    expect(res.source).toBe("local-fallback");
    const content = res.content as { periodization?: { weeks: unknown[] } };
    expect(content.periodization).toBeDefined();
    expect(content.periodization!.weeks).toHaveLength(4);
  });

  it("the upgraded coach prompt rides the paid path (sections + goal-aware cardio line)", async () => {
    chainState.responses.push({ text: JSON.stringify(validWorkoutPlan()), model: "m", provider: "groq" });
    await generateWorkoutPlanAI(ctx);
    const prompt = chainState.prompts[0];
    expect(prompt).toContain("قانون الذكاء التدريبي");
    expect(prompt).toContain("المركّبات متعددة المفاصل أولًا");
    expect(prompt).toContain("10-20 مجموعة");
    expect(prompt).toContain("الكارديو لهذا الهدف: 3-4 جلسات × 25-40 دقيقة");
    expect(prompt).toContain("موجة 4 أسابيع");
    expect(prompt).toContain("أسبوع 4 تفريغ");
  });

  it("the muscle goal flips the prompt's cardio line honestly (no mandatory cardio)", async () => {
    const muscleCtx: ClientContext = {
      ...ctx,
      fitness: { ...((ctx.fitness ?? {}) as Record<string, unknown>), goal: "بناء العضلات" },
    };
    chainState.responses.push({ text: JSON.stringify(validWorkoutPlan()), model: "m", provider: "groq" });
    await generateWorkoutPlanAI(muscleCtx);
    expect(chainState.prompts[0]).toContain("لا كارديو إلزامي لهذا الهدف");
  });
});

describe("WOR-7 — the demo trial prompt carries the training-intelligence sections", () => {
  it("AR: ordering law + volume law + 4-week headroom all present", () => {
    const ar = buildDemoPrompt({ goal: "muscle", level: "beginner", days: 3, equipment: "full-gym", language: "ar" });
    expect(ar).toContain("قانون الترتيب");
    expect(ar).toContain("المركّبة متعددة المفاصل أولًا");
    expect(ar).toContain("10-20 مجموعة أسبوعيًا");
    expect(ar).toContain("6-12 لكل عضلة صغيرة");
    expect(ar).toContain("4 أسابيع");
    expect(ar).toContain("استشفاء");
  });

  it("EN: the same three laws in English", () => {
    const en = buildDemoPrompt({ goal: "strength", level: "intermediate", days: 4, equipment: "home-dumbbells", language: "en" });
    expect(en).toContain("Ordering law");
    expect(en).toContain("compound movements FIRST");
    expect(en).toContain("10-20 weekly sets");
    expect(en).toContain("6-12 per small");
    expect(en).toContain("4-week progression");
    expect(en).toContain("deload");
  });

  it("fat-loss conditioning density steers the composition (goal-aware, both languages)", () => {
    const ar = buildDemoPrompt({ goal: "fat-loss", level: "intermediate", days: 4, equipment: "full-gym", language: "ar" });
    expect(ar).toContain("شرطًا تصميميًا");
    expect(ar).toContain("45-60 ثانية");
    const en = buildDemoPrompt({ goal: "fat-loss", level: "intermediate", days: 4, equipment: "full-gym", language: "en" });
    expect(en).toContain("design constraint");
    expect(en).toContain("45-60 seconds");
    // A strength trial carries NO conditioning line (honest scoping).
    const strength = buildDemoPrompt({ goal: "strength", level: "intermediate", days: 4, equipment: "full-gym", language: "ar" });
    expect(strength).not.toContain("شرطًا تصميميًا");
  });
});

describe("WOR-7 — the registry row tells the truth about Multi-week", () => {
  it("plan:workout's rationale describes the deterministic stamp, not a bare claim", () => {
    const spec = AI_FUNCTION_REGISTRY["plan:workout"];
    expect(spec).toBeDefined();
    // The audit's finding: «السجل يسميها Multi-week program JSON زورًا» —
    // the bare claim is gone, replaced by what actually ships.
    expect(spec.doc.rationale).not.toBe("Multi-week program JSON; 35s per-model window for slow strong models.");
    expect(spec.doc.rationale).toContain("4-week periodization");
    expect(spec.doc.rationale).toContain("workout-periodization.ts");
    expect(spec.doc.rationale).toContain("deload");
    expect(spec.doc.rationale).toContain("goal-keyed cardio");
    // Policy numbers (the ai-registry golden canary pins these too — no
    // drift). temperature: INF-9/P2-2 (audit AI-GENERATION-PIPELINES
    // 2026-11-15) aligned the plans family 0.7 → 0.5 (structured-task
    // band); AI_ROUTER_MODE=legacy restores 0.7 — pinned in
    // ai-registry.test.ts (P2_2_LEGACY_TEMPERATURES).
    expect(spec.policy.temperature).toBe(0.5);
    expect(spec.policy.maxTokens).toBe(4000);
    expect(spec.policy.timeoutMs).toBe(35_000);
    expect(spec.policy.maxModels).toBe(4);
  });
});

describe("WOR-7 — UI wiring: the stamp is RENDERED, never generated-then-dropped", () => {
  it("PlansView renders the periodization block (member modal + print export)", () => {
    const src = read(PLANS_VIEW);
    expect(src).toContain("PeriodizationBlock");
    expect(src).toContain('content.periodization && <PeriodizationBlock');
    expect(src).toContain("التدرج عبر 4 أسابيع");
    // The print/PDF export carries the same block (server constants).
    expect(src).toContain("content.periodization");
    expect(src).toContain("الكارديو حسب الهدف");
  });

  it("CoachClientView renders the stamp in the modal + the coach print export", () => {
    const src = read(COACH_VIEW);
    expect(src).toContain("content.periodization && (");
    expect(src).toContain("التدرج عبر 4 أسابيع");
    expect(src).toContain("أسبوع استشفاء (Deload)");
    expect(src).toContain("c.periodization");
    expect(src).toContain("الكارديو حسب الهدف");
  });

  it("the coach prompt file carries the system-prompt law + the per-request block", () => {
    const src = read(COACH_PROMPT_FILE);
    expect(src).toContain("قانون الذكاء التدريبي (WOR-7");
    expect(src).toContain("قانون الذكاء التدريبي (إلزامي)");
    expect(src).toContain("buildWorkoutPeriodization");
  });
});
