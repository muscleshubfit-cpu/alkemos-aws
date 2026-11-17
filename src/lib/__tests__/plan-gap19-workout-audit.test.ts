import { describe, it, expect } from "vitest";
import { attachIndependentWorkoutAudit } from "@/lib/plan-generator";
import { auditWorkoutPlan } from "@/lib/plan-audit";
import type { WorkoutPlanContent } from "@/lib/plan-generator";

/**
 * GAP-19 canaries (fix order 2026-11-17 — gap-register GAP-19, owner
 * remediation order «إصلاح تدقيق توافق التمارين مع تجهيزات العضو الفعلية،
 * بحيث لا تمر تمارين الجيم ضمن الخطط المنزلية دون كشف أو معالجة»).
 *
 * THE MEASURED DEFECT (live evidence — raw/t4/s4-2-workout-adult.md · the
 * published home plan plans#78080a96 on beacon 44d0c9c0): a home/beginner
 * client's APPROVED+CURRENT workout plan carries Barbell Squat · Cable Row ·
 * Full Range-Of-Motion Lat Pulldown · Triceps Pushdown ×2 — gym exercises —
 * with content.audit.findings=[] and needs_review=None. ROOT CAUSE: the
 * audit's lookupExercise passed the CLIENT'S LOCATION into
 * findExerciseInLibrary, filtering the matcher to the client's equipment
 * world (EQUIP_COMPAT: home = dumbbell/bodyweight/none) — a gym exercise
 * matches NOTHING there, so the suitability checks never ran for exactly
 * the exercises the gate exists to catch.
 *
 * THE LAW THESE CANARIES PIN:
 *   · WORLD-AGNOSTIC LOOKUP: the audit resolves every exercise in the
 *     FULL-GYM world (its TRUE library equipment/level/slug), so gym
 *     exercises in a home plan surface as critical home_equipment_mismatch
 *     findings — the exact live-evidence plan now yields 5 (Barbell Squat,
 *     Lat Pulldown, Triceps Pushdown ×2, Cable Row).
 *   · WOR-2 STAMP: critical findings stamp needs_review with the specific
 *     finding codes — the coach review banner, never a silent save.
 *   · NAME-LEVEL BELT: a name that itself names gym equipment (Arabic or
 *     Latin, WORD level — «بارفيكس» never fires on «بار») fires the SAME
 *     finding even when no library entry matches.
 *   · NO FALSE FIRE ON A CLEAN HOME PLAN: the S4-5 live regenerated day
 *     (dumbbell/bodyweight only) yields ZERO home_equipment_mismatch.
 *   · ENRICHMENT UNTOUCHED: the audit lookup being world-agnostic does not
 *     touch the world-respecting ENRICHMENT matcher (images/links stay
 *     honest) — pinned via matchWorkoutExercise in its own test file.
 */

/** The EXACT training days of the live-evidence plan plans#78080a96
 * (names, sets, reps, rest verbatim from production). */
function liveEvidenceHomePlan(): WorkoutPlanContent {
  const ex = (name: string, sets: number, reps: string, rest: string) => ({
    name, sets, reps, rest, notes: "",
  });
  return {
    overview: "خطة منزلية مبتدئ 4 أيام.",
    days: [
      {
        day: "السبت", focus: "ساقين وكور", isRest: false,
        exercises: [
          ex("Chain Press", 4, "12-15", "90 ثانية"),
          ex("Dumbbell Romanian Deadlift", 3, "12-15", "90 ثانية"),
          ex("Dumbbell Lunges", 3, "12 كل ساق", "90 ثانية"),
          ex("Plank", 3, "30-45 ثانية", "60 ثانية"),
        ],
      },
      { day: "الأحد", focus: "راحة", isRest: true, exercises: [] },
      {
        day: "الإثنين", focus: "صدر، ظهر، أكتاف، ذراعين", isRest: false,
        exercises: [
          ex("Decline Dumbbell Bench Press", 4, "10-12", "2 دقيقة"),
          ex("Full Range-Of-Motion Lat Pulldown", 4, "10-12", "2 دقيقة"),
          ex("Dumbbell Shoulder Press", 3, "12-15", "90 ثانية"),
          ex("Triceps Pushdown", 3, "12-15", "90 ثانية"),
          ex("Dumbbell Bicep Curl", 3, "12-15", "90 ثانية"),
        ],
      },
      { day: "الثلاثاء", focus: "راحة", isRest: true, exercises: [] },
      {
        day: "الأربعاء", focus: "ساقين وكور", isRest: false,
        exercises: [
          ex("Barbell Squat", 4, "12-15", "2 دقيقة"),
          ex("Chain Press", 3, "12-15", "90 ثانية"),
          ex("Dumbbell Romanian Deadlift", 3, "12-15", "90 ثانية"),
          ex("Plank", 3, "30-45 ثانية", "60 ثانية"),
        ],
      },
      { day: "الخميس", focus: "راحة", isRest: true, exercises: [] },
      {
        day: "الجمعة", focus: "صدر، ظهر، أكتاف، ذراعين", isRest: false,
        exercises: [
          ex("Dumbbell Bench Press", 4, "12-15", "2 دقيقة"),
          ex("Cable Row", 3, "12-15", "90 ثانية"),
          ex("Side Lateral Raise", 3, "12-15", "90 ثانية"),
          ex("Triceps Pushdown", 3, "12-15", "90 ثانية"),
          ex("Hammer Curls", 3, "12-15", "90 ثانية"),
        ],
      },
    ],
  };
}

/** The home/beginner fitness context of the live-evidence member. */
const HOME_BEGINNER_CTX = { location: "home", experience: "beginner", injuries: "" };

describe("GAP-19 — attachIndependentWorkoutAudit: world-agnostic lookup kills the home-plan blindness", () => {
  it("the EXACT live-evidence home plan now yields 5 critical home_equipment_mismatch findings (was 0 pre-fix)", () => {
    const content = liveEvidenceHomePlan();
    attachIndependentWorkoutAudit(content, HOME_BEGINNER_CTX);
    const mismatches = (content.audit?.findings ?? []).filter(
      (f) => f.code === "home_equipment_mismatch",
    );
    // Barbell Squat + Full Range-Of-Motion Lat Pulldown + Triceps Pushdown ×2
    // + Cable Row — the exact gym exercises the published plan carried. The
    // dumbbell/bodyweight rows (Chain Press matches a BODYWEIGHT library
    // entry) correctly do NOT fire.
    expect(mismatches).toHaveLength(5);
    expect(mismatches.every((f) => f.severity === "critical")).toBe(true);
    const quoted = mismatches.map((f) => f.message).join(" · ");
    for (const gymName of ["Barbell Squat", "Lat Pulldown", "Cable Row"]) {
      expect(quoted).toContain(gymName);
    }
    expect(quoted).toContain("Triceps Pushdown");
  });

  it("critical findings stamp the WOR-2 needs_review banner with the specific codes", () => {
    const content = liveEvidenceHomePlan();
    attachIndependentWorkoutAudit(content, HOME_BEGINNER_CTX);
    expect(content.needs_review?.flags).toContain("independent_audit_critical_findings");
    expect(content.needs_review?.flags).toContain("home_equipment_mismatch");
    expect(content.needs_review?.note).toContain("راجع الخطة قبل الاعتماد");
  });

  it("the S4-5 live regenerated home day (dumbbell/bodyweight only) stays CLEAN — no false fire", () => {
    const content: WorkoutPlanContent = {
      overview: "يوم ساقين وكور منزلي.",
      days: [
        {
          day: "السبت", focus: "ساقين وكور", isRest: false,
          exercises: [
            { name: "Dumbbell Goblet Squat", sets: 4, reps: "12-15", rest: "90 ثانية", notes: "" },
            { name: "Dumbbell Step Ups", sets: 3, reps: "12 كل ساق", rest: "90 ثانية", notes: "" },
            { name: "Dumbbell Hip Thrust", sets: 3, reps: "12-15", rest: "90 ثانية", notes: "" },
            { name: "London Bridges", sets: 3, reps: "12-15", rest: "60 ثانية", notes: "" },
            { name: "Push Up to Side Plank", sets: 3, reps: "30-45 ثانية", rest: "60 ثانية", notes: "" },
          ],
        },
      ],
    };
    attachIndependentWorkoutAudit(content, HOME_BEGINNER_CTX);
    const mismatches = (content.audit?.findings ?? []).filter(
      (f) => f.code === "home_equipment_mismatch",
    );
    expect(mismatches).toHaveLength(0);
    expect(content.needs_review).toBeUndefined();
  });

  it("a GYM client's plan with the same barbell rows does NOT fire (location gates the check)", () => {
    const content: WorkoutPlanContent = {
      overview: "خطة جيم.",
      days: [
        {
          day: "السبت", focus: "ساقين", isRest: false,
          exercises: [
            { name: "Barbell Squat", sets: 4, reps: "8-10", rest: "2 دقيقة", notes: "" },
            { name: "Cable Row", sets: 3, reps: "12", rest: "90 ثانية", notes: "" },
            { name: "Machine Leg Press", sets: 3, reps: "12", rest: "90 ثانية", notes: "" },
          ],
        },
      ],
    };
    attachIndependentWorkoutAudit(content, { location: "gym", experience: "intermediate" });
    const mismatches = (content.audit?.findings ?? []).filter(
      (f) => f.code === "home_equipment_mismatch",
    );
    expect(mismatches).toHaveLength(0);
    expect(content.needs_review).toBeUndefined();
  });

  it("Arabic gym names fire through the world-agnostic lookup (the live AR surface)", () => {
    const content: WorkoutPlanContent = {
      overview: "خطة منزلية بأسماء عربية.",
      days: [
        {
          day: "السبت", focus: "كامل الجسم", isRest: false,
          exercises: [
            { name: "سكوات بالبار", sets: 4, reps: "8-10", rest: "2 دقيقة", notes: "" },
            { name: "سحب كابل", sets: 3, reps: "12", rest: "90 ثانية", notes: "" },
            { name: "ضغط صدر بالجهاز", sets: 3, reps: "12", rest: "90 ثانية", notes: "" },
          ],
        },
      ],
    };
    attachIndependentWorkoutAudit(content, HOME_BEGINNER_CTX);
    const mismatches = (content.audit?.findings ?? []).filter(
      (f) => f.code === "home_equipment_mismatch",
    );
    // سكوات بالبار → barbell-squat (barbell) · سحب كابل → cable · ضغط صدر
    // بالجهاز → machine. NOTE (deliberately NOT asserted here): a bare
    // «عقلة» currently WRONG-matches the cable pull-through entry — the
    // documented WOR-10 wrong-version class surfacing as a safe-direction
    // banner; pinning it would block WOR-10's own fix.
    expect(mismatches).toHaveLength(3);
  });
});

describe("GAP-19 — the name-level gym-equipment belt (unmatched names must not slip)", () => {
  /** No library at all: the belt alone. */
  const beltAudit = (name: string, location: string) =>
    auditWorkoutPlan(
      {
        days: [
          {
            day: "السبت", focus: "كامل الجسم", isRest: false,
            exercises: [{ name, sets: 3, reps: "12", rest: "60 ثانية" }],
          },
        ],
      },
      { location },
    );

  it("Latin gym-equipment names fire WITHOUT any library lookup", () => {
    for (const name of ["Barbell Squat", "Cable Row", "Machine Chest Press", "Smith Machine Press"]) {
      const r = beltAudit(name, "منزل");
      expect(
        r.findings.filter((f) => f.code === "home_equipment_mismatch"),
        name,
      ).toHaveLength(1);
    }
  });

  it("Arabic gym-equipment names fire WITHOUT any library lookup (word level + attached بال)", () => {
    for (const name of ["سكوات بالبار", "تجديف كابل", "ضغط بالماكينة", "سحب عالي بالبولي"]) {
      const r = beltAudit(name, "home");
      expect(
        r.findings.filter((f) => f.code === "home_equipment_mismatch"),
        name,
      ).toHaveLength(1);
    }
  });

  it("«بارفيكس» (pull-up) NEVER fires on «بار» — word-level tokens, no substring burn", () => {
    const r = beltAudit("بارفيكس", "home");
    expect(r.findings.filter((f) => f.code === "home_equipment_mismatch")).toHaveLength(0);
  });

  it("dumbbell/bodyweight names never fire the belt (home-dumbbells is the home world)", () => {
    for (const name of ["Dumbbell Curl", "سكوات بالدمبل", "Push Up", "بلانك"]) {
      const r = beltAudit(name, "home");
      expect(
        r.findings.filter((f) => f.code === "home_equipment_mismatch"),
        name,
      ).toHaveLength(0);
    }
  });

  it("a gym client never fires the belt", () => {
    const r = beltAudit("Barbell Squat", "gym");
    expect(r.findings.filter((f) => f.code === "home_equipment_mismatch")).toHaveLength(0);
  });

  it("the belt dedupes against the library-based hit (one finding per exercise, not two)", () => {
    // "Barbell Squat" matches barbell-squat via the real world-agnostic
    // lookup AND names barbell — exactly ONE home_equipment_mismatch.
    const content: WorkoutPlanContent = {
      overview: "يوم واحد.",
      days: [
        {
          day: "السبت", focus: "ساقين", isRest: false,
          exercises: [{ name: "Barbell Squat", sets: 4, reps: "8-10", rest: "2 دقيقة", notes: "" }],
        },
      ],
    };
    attachIndependentWorkoutAudit(content, HOME_BEGINNER_CTX);
    expect(
      (content.audit?.findings ?? []).filter((f) => f.code === "home_equipment_mismatch"),
    ).toHaveLength(1);
  });
});
