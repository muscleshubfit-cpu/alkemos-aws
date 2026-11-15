/**
 * WOR-7 / P2-1 (audit AI-GENERATION-PIPELINES-2026-11-15 — owner order
 * 2026-11-15 «نفّذ البند التالي غير المنفّذ بالكامل»): the deterministic
 * MULTI-WEEK TRAINING-INTELLIGENCE layer every AI workout plan now rides.
 *
 * WHY DETERMINISTIC (the repo's own law — «server math over model prose»):
 * the audit's finding was that the paid plan shipped as ONE bare week while
 * the registry row called it a "Multi-week program JSON". Asking the model
 * for the periodization would make the structure optional (a model that
 * omits it ships another hollow plan — the exact WOR-1 defect class).
 * Instead the model still authors the weekly SPLIT, and THIS module stamps
 * the 4-week wave (progression deltas + deload), the per-muscle volume
 * bands, the warm-up/cooldown contract and the goal-keyed cardio
 * prescription as pure server math — identical for every generation,
 * unit-testable, never absent.
 *
 * LAWS (guarded in src/lib/__tests__/workout-periodization.test.ts):
 *   - EXACTLY 4 weeks; week 4 is ALWAYS the deload (halve sets, floor 2,
 *     −10% load) — the wave never ships without its recovery week.
 *   - Volume bands are CONSTANTS (10-20 weekly sets per large muscle,
 *     6-12 per small) — the same numbers the upgraded prompts teach, so
 *     the model's composition target and the plan's stamp never diverge.
 *   - Cardio is keyed by the CLIENT'S goal (never model prose): fat-loss
 *     and endurance always carry a prescription; muscle/strength never
 *     carry a mandatory one (recovery is the priority).
 *   - Beginners progress by REPS, not load (no weight jumps before form
 *     mastery) — the beginner-unsafe axis the workout audit already guards.
 *   - Pure module: zero provider calls, zero DB, zero i18n dependency —
 *     bilingual labels are built here so the demo surface and the paid
 *     surface can share the same stamp.
 */

/** The wave length — weeks 1-3 build, week 4 deloads. */
export const PERIODIZATION_WEEKS = 4;

/** Weekly-set volume band for LARGE muscle groups (chest/back/legs/shoulders). */
export const LARGE_MUSCLE_WEEKLY_SETS = { min: 10, max: 20 } as const;

/** Weekly-set volume band for SMALL muscle groups (arms/calves/core). */
export const SMALL_MUSCLE_WEEKLY_SETS = { min: 6, max: 12 } as const;

export type PeriodizationGoal = "fat-loss" | "muscle" | "strength" | "endurance" | "general";
export type PeriodizationLevel = "beginner" | "intermediate" | "advanced";

/** Free-text goal → the periodization axis (Arabic + English vocab). */
export function classifyPeriodizationGoal(goal: unknown): PeriodizationGoal {
  const g = String(goal ?? "").toLowerCase();
  if (/(fat|loss|cut|دهون|خسارة|تخسيس|تنشيف|نزول)/.test(g)) return "fat-loss";
  if (/(muscle|build|hypertrophy|mass|عضل|بناء|كتلة|تضخيم)/.test(g)) return "muscle";
  if (/(strength|power|قوة|رافعة)/.test(g)) return "strength";
  if (/(endurance|stamina|cardio|لياقة|تحمل|كارديو|جري)/.test(g)) return "endurance";
  return "general";
}

/** Free-text level → the progression safety axis. */
export function classifyPeriodizationLevel(level: unknown): PeriodizationLevel {
  const l = String(level ?? "").toLowerCase();
  if (/(beginner|novice|مبتدئ)/.test(l)) return "beginner";
  if (/(advanced|متقدم|خبير)/.test(l)) return "advanced";
  return "intermediate";
}

/** One week of the wave — the prescription is guidance text stamped
 * next to the model-authored weekly table (never a recomputation of
 * the table itself: the split stays the model's product). */
export type PeriodizationWeek = {
  week: number;
  label: string;
  intent: string;
  prescription: string;
  isDeload: boolean;
}

/** Goal-keyed cardio prescription (deterministic — see the laws above). */
export type CardioPrescription = {
  sessionsPerWeek: string;
  minutesPerSession: string;
  modality: string;
  placement: string;
}

/** The full training-intelligence stamp attached to WorkoutPlanContent. */
export type WorkoutPeriodization = {
  weeks: PeriodizationWeek[];
  volumeNote: string;
  warmUp: string;
  coolDown: string;
  cardio?: CardioPrescription;
}

export function buildWorkoutPeriodization(input: {
  goal?: unknown;
  level?: unknown;
  language?: "ar" | "en";
}): WorkoutPeriodization {
  const language = input.language === "en" ? "en" : "ar";
  const goal = classifyPeriodizationGoal(input.goal);
  const level = classifyPeriodizationLevel(input.level);
  const ar = language === "ar";

  const weeks: PeriodizationWeek[] = [
    {
      week: 1,
      label: ar ? "الأسبوع 1 — التأسيس" : "Week 1 — Base",
      intent: ar ? "أسّس أوزانًا صادقة" : "Establish honest loads",
      prescription: ar
        ? "نفّذ الجدول كما هو: اختر أوزانًا تترك 1-2 تكرارًا في الاحتياط (RIR 1-2) وسجّلها — هذا هو خط الأساس الذي يقيس عليه كل تدرّج لاحق."
        : "Run the table as written: pick loads leaving 1-2 reps in reserve (RIR 1-2) and log them — this is the baseline every later progression measures against.",
      isDeload: false,
    },
    {
      week: 2,
      label: ar ? "الأسبوع 2 — التحميل" : "Week 2 — Loading",
      intent: ar ? "زوّد حجم العمل" : "Add work",
      prescription:
        level === "beginner"
          ? ar
            ? "+2 تكرارات على نفس الوزن في كل تمرين — لا تزد الحمل قبل إتقان الأداء الفني."
            : "+2 reps at the SAME load on every exercise — never add load before the technique is solid."
          : ar
            ? "+1 مجموعة لأول تمرين مركّب في كل يوم (لا تتجاوز 6 مجموعات — إن بلغتها زوّد التكرار +2 بدلًا منها)، وأضف 2.5 كجم للأبار/5% للأجهزة بعد إتمام أعلى المدى مرتين."
            : "+1 set on the first compound of each day (never past 6 sets — otherwise +2 reps instead) and add 2.5 kg on bars / 5% on machines after hitting the top of the range twice.",
      isDeload: false,
    },
    {
      week: 3,
      label: ar ? "الأسبوع 3 — الذروة" : "Week 3 — Peak",
      intent: ar ? "أثقل أسبوع في الدورة" : "Heaviest week of the block",
      prescription:
        level === "beginner"
          ? ar
            ? "+2 تكرارات إضافية عن الأسبوع 2 عند نفس الوزن، مع راحة أطول بين المجموعات."
            : "+2 further reps over week 2 at the same load, resting longer between sets."
          : ar
            ? "زوّد الحمل 2.5-5% عن أسبوع 2 — التكرارات عند أسفل المدى مع الحمل الأثقل، وراحة كاملة بين المجموعات المركّبة."
            : "Add 2.5-5% load over week 2 — reps at the bottom of the range with the heavier load and full rest between compound sets.",
      isDeload: false,
    },
    {
      week: 4,
      label: ar ? "الأسبوع 4 — التفريغ (Deload)" : "Week 4 — Deload",
      intent: ar ? "استشفاء مجدول يثبّت المكسب" : "Scheduled recovery that locks in the gain",
      prescription: ar
        ? "خفّض مجموعات كل تمرين إلى النصف (حد أدنى مجموعتان) والأحمال −10% وارجع لمنتصف مدى التكرارات — أسبوع خفيف بنيويًّا. بعد الأسبوع 4 ابدأ دورة جديدة من أسبوع 2 بأوزان أسبوع 3."
        : "Halve every exercise's sets (floor: 2 sets), cut loads by 10% and return to the middle of the rep ranges — a structurally light week. After week 4, restart the block from week 2 at week-3 loads.",
      isDeload: true,
    },
  ];

  const volumeNote = ar
    ? `الحجم الأسبوعي المستهدف: ${LARGE_MUSCLE_WEEKLY_SETS.min}-${LARGE_MUSCLE_WEEKLY_SETS.max} مجموعة للعضلات الكبيرة (صدر/ظهر/أرجل/أكتاف) · ${SMALL_MUSCLE_WEEKLY_SETS.min}-${SMALL_MUSCLE_WEEKLY_SETS.max} للعضلات الصغيرة (ذراعان/سمانة/كور)`
    : `Weekly volume target: ${LARGE_MUSCLE_WEEKLY_SETS.min}-${LARGE_MUSCLE_WEEKLY_SETS.max} sets for large muscles (chest/back/legs/shoulders) · ${SMALL_MUSCLE_WEEKLY_SETS.min}-${SMALL_MUSCLE_WEEKLY_SETS.max} for small ones (arms/calves/core)`;

  const warmUp = ar
    ? "قبل كل جلسة: 5-10 دقائق إحماء عام (دراجة/حبل/مشي سريع) + 1-2 مجموعة تصاعدية خفيفة على أول تمرين مركّب في اليوم قبل أوزان العمل."
    : "Before every session: 5-10 minutes of general warm-up (bike/rope/brisk walk) plus 1-2 light ramping sets on the day's first compound before working loads.";

  const coolDown = ar
    ? "بعد كل جلسة: 5 دقائق تهدئة — إطالات ثابتة للعضلات المستهدفة + تنفّس عميق؛ لا تهملها في أيام الأحمال الثقيلة."
    : "After every session: 5 minutes of cooldown — static stretches for the trained muscles plus deep breathing; never skip it on heavy days.";

  const cardio = cardioForGoal(goal, level, ar);

  return { weeks, volumeNote, warmUp, coolDown, ...(cardio ? { cardio } : {}) };
}

/** The goal-keyed cardio law (fat-loss/endurance always carry one;
 * muscle/strength never carry a mandatory one). */
function cardioForGoal(
  goal: PeriodizationGoal,
  level: PeriodizationLevel,
  ar: boolean,
): CardioPrescription | undefined {
  switch (goal) {
    case "fat-loss":
      return ar
        ? {
            sessionsPerWeek: "3-4",
            minutesPerSession: "25-40",
            modality: "مشي مائل أو دراجة أو جري خفيف (LISS — شدة معتدلة تستطيع الكلام خلالها)",
            placement:
              "بعد جلسة الأوزان أو بأيام منفصلة عنها" +
              (level === "beginner" ? "" : " · أو جلسات HIIT قصيرة (15-20 دقيقة) مرتين أسبوعيًا كبديل"),
          }
        : {
            sessionsPerWeek: "3-4",
            minutesPerSession: "25-40",
            modality: "inclined walking, cycling or light jogging (LISS — a conversational pace)",
            placement:
              "after the lifting session or on separate days" +
              (level === "beginner" ? "" : " · or twice-weekly short HIIT (15-20 minutes) as the alternative"),
          };
    case "endurance":
      return ar
        ? {
            sessionsPerWeek: "2-3",
            minutesPerSession: "20-40",
            modality: "كارديو هوائي بمنطقة شدة 2 (Zone 2) + جلسة فواصل واحدة أسبوعيًا",
            placement: "أيام منفصلة عن الأوزان أو بعدها بفاصل راحة",
          }
        : {
            sessionsPerWeek: "2-3",
            minutesPerSession: "20-40",
            modality: "zone-2 aerobic work plus one interval session per week",
            placement: "on separate days from lifting, or after it with a recovery gap",
          };
    case "muscle":
      return ar
        ? {
            sessionsPerWeek: "1-2",
            minutesPerSession: "20",
            modality: "مشي خفيف اختياري فقط (LISS) — الكارديو الإلزامي يضر حجم استشفائك",
            placement: "أيام الراحة أو بعد الجلسة بلا إرهاق",
          }
        : {
            sessionsPerWeek: "1-2",
            minutesPerSession: "20",
            modality: "optional easy walking only (LISS) — mandatory cardio eats into recovery",
            placement: "on rest days or after sessions without fatigue",
          };
    case "strength":
      return ar
        ? {
            sessionsPerWeek: "0",
            minutesPerSession: "0",
            modality: "لا كارديو إلزامي — يكفي الإحماء العام قبل الجلسة (5-10 دقائق)",
            placement: "الإحماء العام ضمن الجلسة نفسها",
          }
        : {
            sessionsPerWeek: "0",
            minutesPerSession: "0",
            modality: "no mandatory cardio — the pre-session general warm-up (5-10 minutes) is enough",
            placement: "the general warm-up inside the session itself",
          };
    default:
      return ar
        ? {
            sessionsPerWeek: "2",
            minutesPerSession: "20-30",
            modality: "نشاط هوائي معتدل (مشي سريع/دراجة/سباحة)",
            placement: "أيام الراحة أو بعد جلسات الأوزان",
          }
        : {
            sessionsPerWeek: "2",
            minutesPerSession: "20-30",
            modality: "moderate aerobic activity (brisk walking/cycling/swimming)",
            placement: "on rest days or after lifting sessions",
          };
  }
}
