import { describe, it, expect, vi } from "vitest";

/**
 * WOR-3 (audit AI-GENERATION-PIPELINES 2026-11-15, P0-8): the MEMBER
 * exercise-swap path used to send NO training location and NO fitness
 * context (PlansView swapExercise → enqueueAiJobClient), so the engine's
 * equipment whitelist (home → bodyweight/dumbbell/band/kettlebell) and
 * the beginner level gate never fired — a home trainee received
 * barbell/cable/machine substitutes and a beginner received advanced
 * moves. The coach path always sent them; the member path now does too.
 *
 * These canaries pin the ENGINE side of that fix (the sanitizer keeps
 * location + fitness, and substituteExercise filters its candidate pool
 * by them) — the deterministic path is forced by throwing on every
 * provider call, which is exactly the fallback a dead chain produces.
 */

vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...actual,
    callFreeAIFallbackChain: vi.fn(async () => {
      throw new Error("scripted provider outage — deterministic path");
    }),
  };
});

import { substituteExercise } from "@/lib/plan-generator";
import { sanitizeJobPayload } from "@/lib/ai-jobs";
import { EXERCISES } from "@/lib/exercises";

const byName = new Map(EXERCISES.map((e) => [e.nameEn.toLowerCase(), e]));

const lookup = (name: string) => byName.get(String(name).toLowerCase()) ?? null;

const HOME_EQUIPMENT = new Set(["bodyweight", "dumbbell", "band", "none", "kettlebell"]);

async function swapAll(opts: {
  location?: string;
  experience?: string;
  reason?: string;
  exerciseName?: string;
}) {
  const out = await substituteExercise({
    exercise: {
      name: opts.exerciseName ?? "Barbell Bench Press - Medium Grip",
      sets: 3,
      reps: "8-12",
      rest: "90 ثانية",
      focus: "صدر",
    },
    reason: opts.reason ?? "أريد تنويعًا",
    ...(opts.location ? { location: opts.location } : {}),
    clientContext: {
      name: "عضو",
      nutrition: {},
      fitness: opts.experience ? { experience: opts.experience } : {},
      recent_measurements: [],
      recent_plan_names: [],
    },
  });
  return out;
}

describe("WOR-3 — substituteExercise honors location + experience on the member swap path", () => {
  it("home location: replacement AND all alternatives are home-safe (no barbell/cable/machine)", async () => {
    const out = await swapAll({ location: "home" });
    const names = [out.replacement.name, ...out.alternatives.map((a) => a.name)];
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const lib = lookup(name);
      expect(lib, `«${name}» must exist in the exercise library`).not.toBeNull();
      expect(
        HOME_EQUIPMENT.has(String(lib!.equipment)),
        `«${name}» equipment=${lib!.equipment} is NOT home-safe`,
      ).toBe(true);
    }
  });

  it("beginner experience: no advanced-level substitute is proposed", async () => {
    const out = await swapAll({ location: "gym", experience: "beginner" });
    const names = [out.replacement.name, ...out.alternatives.map((a) => a.name)];
    for (const name of names) {
      const lib = lookup(name);
      expect(lib, `«${name}» must exist in the exercise library`).not.toBeNull();
      expect(
        String(lib!.level).toLowerCase(),
        `«${name}» level=${lib!.level} is advanced — above a beginner member`,
      ).not.toBe("advanced");
    }
  });

  it("blind payload (legacy plans, no questionnaire) still returns a valid substitution", async () => {
    const out = await swapAll({});
    expect(out.replacement.name).toBeTruthy();
    expect(out.replacement.sets).toBeGreaterThan(0);
  });
});

describe("WOR-3 — the job sanitizer keeps location + fitness context for exercise_regenerate", () => {
  it("payload.location and clientContext.fitness survive sanitization", () => {
    const payload = sanitizeJobPayload("exercise_regenerate", {
      exercise: { name: "Barbell Bench Press - Medium Grip", sets: 3, reps: "8-12", rest: "90s", focus: "صدر" },
      location: "home",
      clientContext: {
        name: "عضو",
        fitness: { location: "home", experience: "beginner", injuries: "" },
        nutrition: { allergies: "" },
      },
      planId: "11111111-1111-1111-1111-111111111111",
      clientId: "22222222-2222-2222-2222-222222222222",
      dayIdx: 0,
      exIdx: 1,
    });
    const obj = payload as Record<string, unknown>;
    expect(obj.location).toBe("home");
    const cc = obj.clientContext as Record<string, unknown>;
    const fitness = cc.fitness as Record<string, unknown>;
    expect(fitness.location).toBe("home");
    expect(fitness.experience).toBe("beginner");
  });

  it("hostile extra fields are dropped (the allowlist stays closed)", () => {
    const payload = sanitizeJobPayload("exercise_regenerate", {
      exercise: { name: "Squat", sets: 3, reps: "10", rest: "60s", focus: "أرجل" },
      location: "gym",
      clientContext: { name: "عضو" },
      injection_attempt: "DROP TABLE plans",
    });
    expect((payload as Record<string, unknown>).injection_attempt).toBeUndefined();
  });
});
