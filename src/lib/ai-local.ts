/**
 * Local AI plan generator — no external API needed.
 *
 * Generates personalized workout and nutrition plans based on the client's
 * questionnaire data using rule-based logic. This is fast, free, and works
 * in any environment (no API keys required).
 *
 * The plans follow the same structure as the original Lovable project:
 * Workout: { overview, days: [{ day, focus, exercises: [{name, sets, reps, rest, notes}] }] }
 * Nutrition: { overview, daily_calories, macros: {protein_g, carbs_g, fat_g}, meals: [{name, items, notes}] }
 */

import type { PlanContent } from "@/lib/data/plans";
import { classifyDietText, type DietType } from "@/lib/diet-types";
import {
  buildClientConstraints,
  checkItemConstraints,
  PLAN_AI_SANITY,
  type ClientItemConstraints,
} from "@/lib/plan-ai-validation";

export type ClientContext = {
 name?: string | null;
 nutrition?: unknown;
 fitness?: unknown;
 recent_measurements?: Array<{ weight?: number | string; waist?: number | string; date?: string }>;
 current_plans?: Array<{ type?: string; content?: PlanContent | null; title?: string }>;
 subscription?: { swapLimit?: number | null } | null;
 /** PHASE 62 VARIETY: names of foods/exercises used in this client's
  *  previous plans — injected as an avoid-repeat list into AI prompts. */
 recent_plan_names?: string[];
};

type WorkoutContent = {
 overview: string;
 days: Array<{
 day: string;
 focus: string;
 exercises: Array<{
 name: string;
 sets: number;
 reps: string;
 rest: string;
 notes: string;
 image?: string;
 }>;
 isRest?: boolean;
 }>;
};

type NutritionContent = {
 overview: string;
 daily_calories: number;
 macros: { protein_g: number; carbs_g: number; fat_g: number };
 meals: Array<{
 name: string;
 items: Array<{ food: string; amount: string; calories: number }>;
 notes: string;
 }>;
};

/* ----------------------------- Workout plan ------------------------------ */

export function generateWorkoutPlan(ctx: ClientContext): WorkoutContent {
 const nutrition = loose(ctx.nutrition);
 const fitness = loose(ctx.fitness);
 const goal = String(fitness.goal || nutrition.target || "general fitness").toLowerCase();
 const daysPerWeek = parseInt(String(fitness.days ?? "")) || 4;
 const location = String(fitness.location || "gym").toLowerCase();
 const experience = String(fitness.experience || "intermediate").toLowerCase();
 const injuries = String(fitness.injuries || "").toLowerCase();

 const isHome = location.includes("home") || location.includes("منزل");
 const isBeginner = experience.includes("beginner") || experience.includes("مبتدئ");
 const weight = parseFloat(String(nutrition.weight || "80"));
 const isHeavy = weight > 100; // heavy clients need joint-friendly exercises
 const isFatLoss = goal.includes("fat") || goal.includes("loss") || goal.includes("دهون") || goal.includes("تخسيس");
 const isMuscleGain = goal.includes("muscle") || goal.includes("build") || goal.includes("عضلات") || goal.includes("كتلة");

 // Exercise selection with rotation for variety
 const allKeys = Object.keys(EXERCISE_LIBRARY);
 const shuffledKeys = shuffle(allKeys);

 // Choose split based on days/week
 let trainingDays: Array<{ day: string; focus: string; exercises: ExerciseVariant[] }> = [];

 if (daysPerWeek <= 3) {
 trainingDays = [
 { day: "اليوم الأول", focus: "كامل الجسم A", exercises: pickExercises(["squat", "bench", "row", "ohp", "plank"], isHome, isBeginner, injuries, isHeavy) },
 { day: "اليوم الثاني", focus: "كامل الجسم B", exercises: pickExercises(["deadlift", "incline_bench", "pulldown", "leg_press", "curl"], isHome, isBeginner, injuries, isHeavy) },
 { day: "اليوم الثالث", focus: "كامل الجسم C", exercises: pickExercises(["front_squat", "db_press", "chinup", "rdl", "triceps"], isHome, isBeginner, injuries, isHeavy) },
 ].slice(0, daysPerWeek);
 } else if (daysPerWeek === 4) {
 trainingDays = [
 { day: "اليوم الأول", focus: "أعلى الجسم (قوة)", exercises: pickExercises(["bench", "row", "ohp", "dip", "curl"], isHome, isBeginner, injuries, isHeavy) },
 { day: "اليوم الثاني", focus: "أسفل الجسم (قوة)", exercises: pickExercises(["squat", "rdl", "leg_press", "calf", "plank"], isHome, isBeginner, injuries, isHeavy) },
 { day: "اليوم الثالث", focus: "أعلى الجسم (حجم)", exercises: pickExercises(["incline_db", "pulldown", "lateral", "triceps", "face_pull"], isHome, isBeginner, injuries, isHeavy) },
 { day: "اليوم الرابع", focus: "أسفل الجسم (حجم)", exercises: pickExercises(["front_squat", "hip_thrust", "leg_curl", "calf", "abs"], isHome, isBeginner, injuries, isHeavy) },
 ];
 } else {
 trainingDays = [
 { day: "اليوم الأول", focus: "Push (صدر، أكتاف، ترايسبس)", exercises: pickExercises(["bench", "ohp", "incline_db", "lateral", "triceps"], isHome, isBeginner, injuries, isHeavy) },
 { day: "اليوم الثاني", focus: "Pull (ظهر، بايسبس)", exercises: pickExercises(["deadlift", "pullup", "row", "curl", "face_pull"], isHome, isBeginner, injuries, isHeavy) },
 { day: "اليوم الثالث", focus: "Legs (أرجل)", exercises: pickExercises(["squat", "rdl", "leg_press", "leg_curl", "calf"], isHome, isBeginner, injuries, isHeavy) },
 { day: "اليوم الرابع", focus: "Upper (أعلى الجسم)", exercises: pickExercises(["incline_bench", "pulldown", "ohp", "curl", "triceps"], isHome, isBeginner, injuries, isHeavy) },
 { day: "اليوم الخامس", focus: "Lower (أسفل الجسم)", exercises: pickExercises(["front_squat", "hip_thrust", "leg_curl", "calf", "abs"], isHome, isBeginner, injuries, isHeavy) },
 ].slice(0, daysPerWeek);
 }

 // Insert rest days between training days
 const dayNames = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
 const days: Array<{ day: string; focus: string; exercises: ExerciseVariant[]; isRest?: boolean }> = [];

 // Pattern: train, rest, train, rest, train, train, rest (for 4 days)
 // For 3 days: train, rest, train, rest, train, rest, rest
 // For 5 days: train, train, rest, train, train, rest, train
 const restPatterns: Record<number, boolean[]> = {
 2: [true, false, true, true, false, true, true],
 3: [false, true, false, true, false, true, true],
 4: [false, true, false, true, false, false, true],
 5: [false, false, true, false, false, true, false],
 6: [false, false, true, false, false, false, true],
 };
 const pattern = restPatterns[daysPerWeek] || restPatterns[4];
 let trainingIdx = 0;

 for (let i = 0; i < 7; i++) {
 if (pattern[i] || trainingIdx >= trainingDays.length) {
 days.push({
 day: dayNames[i],
 focus: "راحة",
 exercises: [],
 isRest: true,
 });
 } else {
 days.push({
 ...trainingDays[trainingIdx],
 day: dayNames[i],
 });
 trainingIdx++;
 }
 }

 const goalText = isFatLoss ? "حرق الدهون" : isMuscleGain ? "بناء العضلات" : "تحسين اللياقة العامة";
 const totalVolume = trainingDays.reduce((sum, d) => sum + d.exercises.reduce((s, e) => s + e.sets, 0), 0);
 const overview = `برنامج تمارين مخصص لـ ${ctx.name || "العميل"} بهدف ${goalText}.

 تفاصيل البرنامج:
• أيام التدريب: ${daysPerWeek} أيام/أسبوع
• أيام الراحة: ${7 - daysPerWeek} أيام
• مكان التدريب: ${isHome ? "المنزل" : "النادي الرياضي"}
• المستوى: ${isBeginner ? "مبتدئ" : "متوسط/متقدم"}
• إجمالي المجموعات الأسبوعية: ${totalVolume} مجموعة
• عدد التمارين: ${trainingDays.reduce((s, d) => s + d.exercises.length, 0)} تمرين

${isFatLoss ? " تركيز على حرق الدهون: كثافة عالية، راحة قصيرة بين المجموعات" : ""}
${isMuscleGain ? " تركيز على بناء العضلات: أوزان ثقيلة، راحة أطول، حجم تدريبي عالي" : ""}
${injuries ? " تم مراعاة الإصابات المذكورة — تجنب التمارين المؤذية" : ""}

تدرّب بأوزان صحيحة، ركّز على الأداء قبل زيادة الأوزان، وتابع التقدم أسبوعياً.`;

 return { overview, days };
}

/** One concrete exercise prescription (the shape AI plans render). */
type ExerciseVariant = { name: string; sets: number; reps: string; rest: string; notes: string; image: string };

// Exercise library with images (Unsplash — free to use)
// Image URLs are exercise-specific and show proper form
const EXERCISE_LIBRARY: Record<string, { gym: ExerciseVariant; home: ExerciseVariant }> = {
 squat: {
 gym: { name: "سكوات بالبار", sets: 4, reps: "6-8", rest: "3 دقائق", notes: "حافظ على عمق الحركة وظهرك مستقيم", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Barbell_squat.jpg/200px-Barbell_squat.jpg" },
 home: { name: "سكوات بالدمبل", sets: 4, reps: "10-12", rest: "90 ثانية", notes: "نزل ببطء واصعد بقوة", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Dumbbell_squat.jpg/200px-Dumbbell_squat.jpg" },
 },
 bench: {
 gym: { name: "بنش بريس", sets: 4, reps: "6-8", rest: "2-3 دقائق", notes: "الكتف مضمّنة، المس بار الصدر", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Bench_press.jpg/200px-Bench_press.jpg" },
 home: { name: "ضغط أرضي", sets: 4, reps: "12-15", rest: "60 ثانية", notes: "حافظ على استقامة الجسم", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Pushup_Position.png/200px-Pushup_Position.png" },
 },
 row: {
 gym: { name: "تجديف بالبار", sets: 4, reps: "8-10", rest: "90 ثانية", notes: "اسحب الكوع للخلف", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bent-over_row.jpg/200px-Bent-over_row.jpg" },
 home: { name: "تجديف بالدمبل", sets: 4, reps: "10-12", rest: "90 ثانية", notes: "ثبّت الجذع", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/One_arm_dumbbell_row.jpg/200px-One_arm_dumbbell_row.jpg" },
 },
 ohp: {
 gym: { name: "ضغط كتف بالبار", sets: 3, reps: "8-10", rest: "2 دقيقة", notes: "لا تقوّس ظهرك", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Military_press.jpg/200px-Military_press.jpg" },
 home: { name: "ضغط كتف بالدمبل", sets: 3, reps: "10-12", rest: "90 ثانية", notes: "الدمبل بمحاذاة الأذن", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bent-over_row.jpg/200px-Bent-over_row.jpg" },
 },
 deadlift: {
 gym: { name: "ديدليفت", sets: 3, reps: "5", rest: "3-5 دقائق", notes: "حافظ على استقامة الظهر", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Deadlift.jpg/200px-Deadlift.jpg" },
 home: { name: "ديدليفت روماني بالدمبل", sets: 3, reps: "10-12", rest: "90 ثانية", notes: "انزل بالورك للخلف", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Barbell_squat.jpg/200px-Barbell_squat.jpg" },
 },
 incline_bench: {
 gym: { name: "بنش مائل بالبار", sets: 4, reps: "8-10", rest: "2 دقيقة", notes: "زاوية 30 درجة", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Bench_press.jpg/200px-Bench_press.jpg" },
 home: { name: "ضغط مائل بالدمبل", sets: 4, reps: "10-12", rest: "90 ثانية", notes: "تحكم في النزول", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bent-over_row.jpg/200px-Bent-over_row.jpg" },
 },
 incline_db: {
 gym: { name: "بنش مائل بالدمبل", sets: 3, reps: "10-12", rest: "90 ثانية", notes: "مدى حركة كامل", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Military_press.jpg/200px-Military_press.jpg" },
 home: { name: "ضغط مائل بالدمبل", sets: 3, reps: "10-12", rest: "90 ثانية", notes: "تحكم في النزول", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bent-over_row.jpg/200px-Bent-over_row.jpg" },
 },
 db_press: {
 gym: { name: "ضغط دمبل مستوي", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "مدى حركة كامل", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Military_press.jpg/200px-Military_press.jpg" },
 home: { name: "ضغط دمبل أرضي", sets: 4, reps: "10-12", rest: "90 ثانية", notes: "تحكم في النزول", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bent-over_row.jpg/200px-Bent-over_row.jpg" },
 },
 pulldown: {
 gym: { name: "سحب أمامي", sets: 4, reps: "10-12", rest: "90 ثانية", notes: "اسحب للصدر", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bent-over_row.jpg/200px-Bent-over_row.jpg" },
 home: { name: "سحب باند", sets: 4, reps: "12-15", rest: "60 ثانية", notes: "ثبّت الباند جيداً", image: "/images/categories/exercises/back.webp" },
 },
 pullup: {
 gym: { name: "عقلة", sets: 4, reps: "6-10", rest: "2 دقيقة", notes: "مدى حركة كامل", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Pullup.jpg/200px-Pullup.jpg" },
 home: { name: "عقلة استسلامية", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "نزل ببطء", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/One_arm_dumbbell_row.jpg/200px-One_arm_dumbbell_row.jpg" },
 },
 chinup: {
 gym: { name: "عقلة قبضة معكوسة", sets: 3, reps: "6-10", rest: "2 دقيقة", notes: "تركيز على البايسبس", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Pullup.jpg/200px-Pullup.jpg" },
 home: { name: "عقلة استسلامية", sets: 3, reps: "8-12", rest: "90 ثانية", notes: "نزل ببطء", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/One_arm_dumbbell_row.jpg/200px-One_arm_dumbbell_row.jpg" },
 },
 leg_press: {
 gym: { name: "ليج بريس", sets: 4, reps: "10-12", rest: "2 دقيقة", notes: "لا تقفل الركبة بالكامل", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Dumbbell_squat.jpg/200px-Dumbbell_squat.jpg" },
 home: { name: "لانجز بالدمبل", sets: 4, reps: "12 لكل رجل", rest: "90 ثانية", notes: "الركبة خلف القدم", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Lunge_(exercise).jpg/200px-Lunge_(exercise).jpg" },
 },
 leg_curl: {
 gym: { name: "ليج كيرل", sets: 3, reps: "12-15", rest: "60 ثانية", notes: "تحكم في الحركة", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Dumbbell_squat.jpg/200px-Dumbbell_squat.jpg" },
 home: { name: "هامسترنج كيرل بالباند", sets: 3, reps: "15-20", rest: "60 ثانية", notes: "ثبّت الورك", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Lunge_(exercise).jpg/200px-Lunge_(exercise).jpg" },
 },
 front_squat: {
 gym: { name: "فرنت سكوات", sets: 4, reps: "6-8", rest: "3 دقائق", notes: "حافظ على الصدر مرفوع", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Barbell_squat.jpg/200px-Barbell_squat.jpg" },
 home: { name: "جوبيت سكوات", sets: 4, reps: "10-12", rest: "90 ثانية", notes: "نزل كاملاً", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Dumbbell_squat.jpg/200px-Dumbbell_squat.jpg" },
 },
 rdl: {
 gym: { name: "رومانيان ديدليفت", sets: 4, reps: "8-10", rest: "2 دقيقة", notes: "انزل بالورك للخلف", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Deadlift.jpg/200px-Deadlift.jpg" },
 home: { name: "رومانيان ديدليفت بالدمبل", sets: 4, reps: "10-12", rest: "90 ثانية", notes: "ابطأ في النزول", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Barbell_squat.jpg/200px-Barbell_squat.jpg" },
 },
 hip_thrust: {
 gym: { name: "هيب ثرست", sets: 4, reps: "10-12", rest: "2 دقيقة", notes: "اكتمل الحركة في الأعلى", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Lunge_(exercise).jpg/200px-Lunge_(exercise).jpg" },
 home: { name: "هيب ثرست بوزن الجسم", sets: 4, reps: "15-20", rest: "60 ثانية", notes: "ارفع الورك بالكامل", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Lunge_(exercise).jpg/200px-Lunge_(exercise).jpg" },
 },
 calf: {
 gym: { name: "كاف ريز واقف", sets: 4, reps: "15-20", rest: "60 ثانية", notes: "مدى حركة كامل", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Dumbbell_squat.jpg/200px-Dumbbell_squat.jpg" },
 home: { name: "كاف ريز على السلم", sets: 4, reps: "15-20", rest: "60 ثانية", notes: "انزل بالكامل", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Dumbbell_squat.jpg/200px-Dumbbell_squat.jpg" },
 },
 curl: {
 gym: { name: "بايسبس كيرل بالبار", sets: 3, reps: "10-12", rest: "60 ثانية", notes: "لا تتحرك بالكتف", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Military_press.jpg/200px-Military_press.jpg" },
 home: { name: "بايسبس كيرل بالدمبل", sets: 3, reps: "12-15", rest: "60 ثانية", notes: "تحكم في النزول", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/One_arm_dumbbell_row.jpg/200px-One_arm_dumbbell_row.jpg" },
 },
 triceps: {
 gym: { name: "ترايسبس بوش داون", sets: 3, reps: "12-15", rest: "60 ثانية", notes: "ثبّت المرفقين", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Military_press.jpg/200px-Military_press.jpg" },
 home: { name: "ديبس على الكرسي", sets: 3, reps: "12-15", rest: "60 ثانية", notes: "انزل ببطء", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Pushup_Position.png/200px-Pushup_Position.png" },
 },
 dip: {
 gym: { name: "ديبس على المتوازي", sets: 3, reps: "8-12", rest: "90 ثانية", notes: "الميل للأمام للصدر", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Pullup.jpg/200px-Pullup.jpg" },
 home: { name: "ديبس على الكرسي", sets: 3, reps: "12-15", rest: "60 ثانية", notes: "انزل ببطء", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Pushup_Position.png/200px-Pushup_Position.png" },
 },
 lateral: {
 gym: { name: "رفرفة جانبية", sets: 3, reps: "15", rest: "60 ثانية", notes: "لا ترفع فوق الكتف", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bent-over_row.jpg/200px-Bent-over_row.jpg" },
 home: { name: "رفرفة جانبية بالدمبل", sets: 3, reps: "15", rest: "60 ثانية", notes: "تحكم في الحركة", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bent-over_row.jpg/200px-Bent-over_row.jpg" },
 },
 face_pull: {
 gym: { name: "فيس بول بالكابل", sets: 3, reps: "15-20", rest: "60 ثانية", notes: "للأكتاف والوضعية", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Military_press.jpg/200px-Military_press.jpg" },
 home: { name: "فيس بول بالباند", sets: 3, reps: "15-20", rest: "60 ثانية", notes: "ثبّت الباند", image: "/images/categories/exercises/back.webp" },
 },
 plank: {
 gym: { name: "بلانك", sets: 3, reps: "45-60 ثانية", rest: "45 ثانية", notes: "حافظ على استقامة الجسم", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Plank_(exercise).jpg/200px-Plank_(exercise).jpg" },
 home: { name: "بلانك", sets: 3, reps: "45-60 ثانية", rest: "45 ثانية", notes: "شد البطن", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Plank_(exercise).jpg/200px-Plank_(exercise).jpg" },
 },
 abs: {
 gym: { name: "كرنش بالكابل", sets: 3, reps: "15-20", rest: "60 ثانية", notes: "ركز على الانقباض", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Pushup_Position.png/200px-Pushup_Position.png" },
 home: { name: "كرنش أرضي", sets: 3, reps: "20-25", rest: "45 ثانية", notes: "لا تشد الرقبة", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Pushup_Position.png/200px-Pushup_Position.png" },
 },
};

// Exercises that are too advanced/dangerous for beginners or heavy clients.
// These are skipped and replaced with safer alternatives.
const ADVANCED_EXERCISES = new Set([
 "dip", // dips — shoulder stress for beginners
 "pullup", // pull-ups — too hard for beginners/heavy
 "chinup", // chin-ups — same
 "deadlift", // conventional deadlift — RDL is safer
 "front_squat", // front squat — wrist mobility required
]);

function pickExercises(
 keys: string[],
 isHome: boolean,
 isBeginner: boolean,
 _injuries: string,
 isHeavy: boolean = false,
): ExerciseVariant[] {
 const skipAdvanced = isBeginner || isHeavy;
 return keys.map((k) => {
 const ex = EXERCISE_LIBRARY[k];
 if (!ex) return null;
 // Skip advanced exercises for beginners/heavy clients
 if (skipAdvanced && ADVANCED_EXERCISES.has(k)) return null;
 const variant = isHome ? ex.home : ex.gym;
 if (isBeginner) {
 // For beginners: lower sets, higher reps, lighter intensity
 return { ...variant, sets: Math.max(3, variant.sets - 1), reps: "12-15" };
 }
 if (isHeavy) {
 // For heavy clients: slightly higher reps, same sets
 return { ...variant, reps: "10-15" };
 }
 return variant;
 }).filter((x): x is ExerciseVariant => x !== null);
}

/* ---------------------------- Nutrition plan ----------------------------- */

// Mifflin-St Jeor BMR formula — the most accurate for general population
function calculateBMR(weight: number, height: number, age: number, isMale: boolean): number {
 if (isMale) {
 return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
 }
 return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
}

// Activity multipliers based on activity level
/** Questionnaire records arrive as JSON blobs — the local generator reads
 *  a known set of string-ish fields. One honest loose view per entry point. */
type LooseFields = Record<string, string | number | boolean | undefined>;
export const loose = (v: unknown): LooseFields =>
 (v && typeof v === "object" && !Array.isArray(v) ? v : {}) as LooseFields;

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
 sedentary: 1.2, // مكتب work, no exercise
 light: 1.375, // 1-3 days exercise
 moderate: 1.55, // 3-5 days exercise
 active: 1.725, // 6-7 days exercise
 very_active: 1.9, // athlete level
};

function parseActivityLevel(activity: string): number {
 const a = (activity || "").toLowerCase();
 if (a.includes("very") || a.includes("نشيط جدا") || a.includes("رياضي")) return 1.9;
 if (a.includes("active") || a.includes("نشيط") || a.includes("6") || a.includes("7")) return 1.725;
 if (a.includes("moderate") || a.includes("متوسط") || a.includes("3") || a.includes("4") || a.includes("5")) return 1.55;
 if (a.includes("light") || a.includes("خفيف") || a.includes("1") || a.includes("2")) return 1.375;
 return 1.2; // sedentary default
}

// Food database with calories per 100g, macros, and meal-type suitability
export type FoodItem = {
 name: string;
 name_en: string;
 calsPer100g: number;
 proteinPer100g: number;
 carbsPer100g: number;
 fatPer100g: number;
 category: "protein" | "carb" | "fat" | "veg" | "fruit" | "dairy";
 meals: ("breakfast" | "lunch" | "dinner" | "snack")[]; // which meals this food suits
};

export const FOOD_DB: FoodItem[] = [
 // === PROTEINS — Chicken ===
 { name: "صدر دجاج مشوي", name_en: "grilled chicken breast", calsPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, category: "protein", meals: ["lunch", "dinner"] },
 { name: "صدر دجاج مسلوق", name_en: "boiled chicken breast", calsPer100g: 151, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 2.5, category: "protein", meals: ["lunch", "dinner"] },
 { name: "أوراك دجاج مشوية", name_en: "grilled chicken thigh", calsPer100g: 209, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 11, category: "protein", meals: ["lunch", "dinner"] },
 { name: "دجاج مقطع بالبهارات", name_en: "spiced chicken strips", calsPer100g: 175, proteinPer100g: 28, carbsPer100g: 2, fatPer100g: 5, category: "protein", meals: ["lunch", "dinner"] },
 // === PROTEINS — Beef ===
 { name: "لحم بقري مشوي", name_en: "grilled beef", calsPer100g: 217, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 12, category: "protein", meals: ["lunch", "dinner"] },
 { name: "ستيك لحم مشوي", name_en: "beef steak", calsPer100g: 271, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 19, category: "protein", meals: ["lunch", "dinner"] },
 { name: "لحم مفروم قليل الدهن", name_en: "lean ground beef", calsPer100g: 191, proteinPer100g: 24, carbsPer100g: 0, fatPer100g: 10, category: "protein", meals: ["lunch", "dinner"] },
 // === PROTEINS — Lamb ===
 { name: "لحم ضأن مشوي", name_en: "grilled lamb", calsPer100g: 258, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 17, category: "protein", meals: ["lunch", "dinner"] },
 // === PROTEINS — Fish ===
 { name: "سمك سلمون مشوي", name_en: "grilled salmon", calsPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, category: "protein", meals: ["lunch", "dinner"] },
 { name: "تونة في الماء", name_en: "tuna in water", calsPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1, category: "protein", meals: ["lunch", "dinner", "snack"] },
 { name: "سمك بلطي مشوي", name_en: "grilled tilapia", calsPer100g: 128, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 2.7, category: "protein", meals: ["lunch", "dinner"] },
 { name: "روبيان مسلوق", name_en: "boiled shrimp", calsPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3, category: "protein", meals: ["lunch", "dinner"] },
 { name: "سمك مكاريل مشوي", name_en: "grilled mackerel", calsPer100g: 205, proteinPer100g: 19, carbsPer100g: 0, fatPer100g: 14, category: "protein", meals: ["lunch", "dinner"] },
 // === PROTEINS — Eggs ===
 { name: "بيض كامل مسلوق", name_en: "boiled whole egg", calsPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, category: "protein", meals: ["breakfast"] },
 { name: "بيض مقلي", name_en: "fried egg", calsPer100g: 196, proteinPer100g: 14, carbsPer100g: 1, fatPer100g: 15, category: "protein", meals: ["breakfast"] },
 { name: "أومليت بالخضار", name_en: "veggie omelette", calsPer100g: 154, proteinPer100g: 11, carbsPer100g: 3, fatPer100g: 11, category: "protein", meals: ["breakfast"] },
 { name: "بياض البيض", name_en: "egg white", calsPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2, category: "protein", meals: ["breakfast", "snack"] },
 // === PROTEINS — Other ===
 { name: "كبدة دجاج", name_en: "chicken liver", calsPer100g: 119, proteinPer100g: 17, carbsPer100g: 0.7, fatPer100g: 4.8, category: "protein", meals: ["lunch", "dinner"] },
 { name: "لحم رومي (ديك رومي)", name_en: "turkey", calsPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1, category: "protein", meals: ["lunch", "dinner"] },
 // === PROTEINS — Plant (VEGAN staples — the measured gap: the local DB had
 // ZERO vegan proteins, so vegan local plans collapsed to ~50% of target
 // calories; owner order 2026-10-25 item 5 «اختبر كذلك النباتي») ===
 { name: "فول مدمس", name_en: "cooked fava beans", calsPer100g: 110, proteinPer100g: 7.6, carbsPer100g: 19.6, fatPer100g: 0.4, category: "protein", meals: ["breakfast", "lunch"] },
 { name: "عدس مطبوخ", name_en: "cooked lentils", calsPer100g: 116, proteinPer100g: 9, carbsPer100g: 20.1, fatPer100g: 0.4, category: "protein", meals: ["lunch", "dinner"] },
 { name: "حمص مطبوخ", name_en: "cooked chickpeas", calsPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 27.4, fatPer100g: 2.6, category: "protein", meals: ["lunch", "dinner", "snack"] },
 { name: "توفو", name_en: "firm tofu", calsPer100g: 144, proteinPer100g: 17.3, carbsPer100g: 2.8, fatPer100g: 8.7, category: "protein", meals: ["lunch", "dinner"] },

 // === CARBS ===
 { name: "أرز بسمتي مطبوخ", name_en: "cooked basmati rice", calsPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, category: "carb", meals: ["lunch", "dinner"] },
 { name: "أرز أبيض مصري", name_en: "cooked white rice", calsPer100g: 129, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, category: "carb", meals: ["lunch", "dinner"] },
 { name: "بطاطس مسلوقة", name_en: "boiled potato", calsPer100g: 87, proteinPer100g: 2, carbsPer100g: 20, fatPer100g: 0.1, category: "carb", meals: ["lunch", "dinner"] },
 { name: "بطاطس مشوية", name_en: "baked potato", calsPer100g: 93, proteinPer100g: 2, carbsPer100g: 21, fatPer100g: 0.1, category: "carb", meals: ["lunch", "dinner"] },
 { name: "بطاطا حلوة مشوية", name_en: "baked sweet potato", calsPer100g: 90, proteinPer100g: 2, carbsPer100g: 21, fatPer100g: 0.1, category: "carb", meals: ["lunch", "dinner"] },
 { name: "شوفان مطبوخ", name_en: "cooked oats", calsPer100g: 71, proteinPer100g: 2.5, carbsPer100g: 12, fatPer100g: 1.5, category: "carb", meals: ["breakfast"] },
 { name: "خبز أسمر", name_en: "whole wheat bread", calsPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.2, category: "carb", meals: ["breakfast", "lunch", "dinner"] },
 { name: "خبز عربي أسمر", name_en: "brown pita", calsPer100g: 275, proteinPer100g: 9, carbsPer100g: 55, fatPer100g: 1.2, category: "carb", meals: ["breakfast", "lunch", "dinner"] },
 { name: "كينوا مطبوخة", name_en: "cooked quinoa", calsPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9, category: "carb", meals: ["lunch", "dinner"] },
 { name: "معكرونة قمح كامل", name_en: "whole wheat pasta", calsPer100g: 124, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1, category: "carb", meals: ["lunch", "dinner"] },
 { name: "برغل مطبوخ", name_en: "cooked bulgur", calsPer100g: 83, proteinPer100g: 3, carbsPer100g: 19, fatPer100g: 0.2, category: "carb", meals: ["lunch", "dinner"] },
 { name: "فريك مطبوخ", name_en: "cooked freekeh", calsPer100g: 110, proteinPer100g: 4, carbsPer100g: 22, fatPer100g: 1, category: "carb", meals: ["lunch", "dinner"] },

 // === FATS ===
 { name: "زيت زيتون", name_en: "olive oil", calsPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, category: "fat", meals: ["breakfast", "lunch", "dinner"] },
 { name: "لوز نيء", name_en: "raw almonds", calsPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, category: "fat", meals: ["breakfast", "snack"] },
 { name: "فول سوداني", name_en: "peanuts", calsPer100g: 567, proteinPer100g: 26, carbsPer100g: 16, fatPer100g: 49, category: "fat", meals: ["snack"] },
 { name: "جوز", name_en: "walnuts", calsPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65, category: "fat", meals: ["breakfast", "snack"] },
 { name: "زبدة الفول السوداني", name_en: "peanut butter", calsPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, category: "fat", meals: ["breakfast", "snack"] },
 { name: "أفوكادو", name_en: "avocado", calsPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, category: "fat", meals: ["breakfast", "lunch", "dinner"] },
 { name: "بذور الكتان", name_en: "flaxseed", calsPer100g: 534, proteinPer100g: 18, carbsPer100g: 29, fatPer100g: 42, category: "fat", meals: ["breakfast", "snack"] },
 { name: "بذور عباد الشمس", name_en: "sunflower seeds", calsPer100g: 584, proteinPer100g: 21, carbsPer100g: 20, fatPer100g: 51, category: "fat", meals: ["snack"] },

 // === DAIRY ===
 { name: "زبادي يوناني", name_en: "greek yogurt", calsPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4, category: "dairy", meals: ["breakfast", "snack"] },
 { name: "زبادي عادي كامل الدسم", name_en: "whole milk yogurt", calsPer100g: 61, proteinPer100g: 3.5, carbsPer100g: 4.7, fatPer100g: 3.3, category: "dairy", meals: ["breakfast", "snack"] },
 { name: "زبادي عادي قليل الدسم", name_en: "low fat yogurt", calsPer100g: 63, proteinPer100g: 5.3, carbsPer100g: 7, fatPer100g: 1.6, category: "dairy", meals: ["breakfast", "snack"] },
 { name: "جبن قريش", name_en: "cottage cheese", calsPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3, category: "dairy", meals: ["breakfast", "snack"] },
 { name: "جبن فيتا", name_en: "feta cheese", calsPer100g: 264, proteinPer100g: 14, carbsPer100g: 4.1, fatPer100g: 21, category: "dairy", meals: ["breakfast", "lunch"] },
 { name: "جبن موزاريلا قليلة الدسم", name_en: "low fat mozzarella", calsPer100g: 141, proteinPer100g: 14, carbsPer100g: 3.1, fatPer100g: 7, category: "dairy", meals: ["breakfast", "lunch"] },
 { name: "جبن حلوم مشوي", name_en: "grilled halloumi", calsPer100g: 321, proteinPer100g: 22, carbsPer100g: 2.2, fatPer100g: 25, category: "dairy", meals: ["breakfast", "lunch"] },
 { name: "جبن بارميزان", name_en: "parmesan", calsPer100g: 431, proteinPer100g: 38, carbsPer100g: 4.1, fatPer100g: 29, category: "dairy", meals: ["lunch", "dinner"] },
 { name: "حليب بقري 2%", name_en: "milk 2%", calsPer100g: 50, proteinPer100g: 3.3, carbsPer100g: 5, fatPer100g: 2, category: "dairy", meals: ["breakfast", "snack"] },
 { name: "لبن رايب", name_en: "buttermilk", calsPer100g: 40, proteinPer100g: 3.3, carbsPer100g: 4.8, fatPer100g: 0.9, category: "dairy", meals: ["breakfast", "lunch", "snack"] },

 // === VEGETABLES ===
 { name: "بروكلي مطبوخ", name_en: "cooked broccoli", calsPer100g: 35, proteinPer100g: 2.4, carbsPer100g: 7, fatPer100g: 0.4, category: "veg", meals: ["lunch", "dinner"] },
 { name: "سبانخ مطبوخة", name_en: "cooked spinach", calsPer100g: 23, proteinPer100g: 3, carbsPer100g: 3.8, fatPer100g: 0.3, category: "veg", meals: ["lunch", "dinner"] },
 { name: "كوسة مطبوخة", name_en: "cooked zucchini", calsPer100g: 15, proteinPer100g: 1.1, carbsPer100g: 3, fatPer100g: 0.3, category: "veg", meals: ["lunch", "dinner"] },
 { name: "فاصوليا خضراء", name_en: "green beans", calsPer100g: 35, proteinPer100g: 1.8, carbsPer100g: 7, fatPer100g: 0.1, category: "veg", meals: ["lunch", "dinner"] },
 { name: "خيار", name_en: "cucumber", calsPer100g: 15, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1, category: "veg", meals: ["breakfast", "lunch", "dinner", "snack"] },
 { name: "طماطم", name_en: "tomato", calsPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, category: "veg", meals: ["breakfast", "lunch", "dinner"] },
 { name: "خس", name_en: "lettuce", calsPer100g: 15, proteinPer100g: 1.4, carbsPer100g: 2.9, fatPer100g: 0.2, category: "veg", meals: ["breakfast", "lunch", "dinner"] },
 { name: "فلفل أخضر", name_en: "green pepper", calsPer100g: 20, proteinPer100g: 0.9, carbsPer100g: 4.6, fatPer100g: 0.2, category: "veg", meals: ["lunch", "dinner"] },
 { name: "جزر مطبوخ", name_en: "cooked carrot", calsPer100g: 35, proteinPer100g: 0.8, carbsPer100g: 8, fatPer100g: 0.2, category: "veg", meals: ["lunch", "dinner"] },
 { name: "باذنجان مشوي", name_en: "grilled eggplant", calsPer100g: 25, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.2, category: "veg", meals: ["lunch", "dinner"] },
 { name: "سلطة خضراء مشكلة", name_en: "mixed salad", calsPer100g: 20, proteinPer100g: 1, carbsPer100g: 4, fatPer100g: 0.2, category: "veg", meals: ["breakfast", "lunch", "dinner"] },

 // === FRUITS ===
 { name: "موز", name_en: "banana", calsPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, category: "fruit", meals: ["breakfast", "snack"] },
 { name: "تفاح", name_en: "apple", calsPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, category: "fruit", meals: ["breakfast", "snack"] },
 { name: "برتقال", name_en: "orange", calsPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1, category: "fruit", meals: ["breakfast", "snack"] },
 { name: "فراولة", name_en: "strawberry", calsPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3, category: "fruit", meals: ["breakfast", "snack"] },
 { name: "عنب", name_en: "grapes", calsPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18, fatPer100g: 0.2, category: "fruit", meals: ["snack"] },
 { name: "بطيخ", name_en: "watermelon", calsPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 8, fatPer100g: 0.2, category: "fruit", meals: ["snack"] },
 { name: "كيوي", name_en: "kiwi", calsPer100g: 61, proteinPer100g: 1.1, carbsPer100g: 15, fatPer100g: 0.5, category: "fruit", meals: ["breakfast", "snack"] },
 { name: "تمر", name_en: "dates", calsPer100g: 282, proteinPer100g: 2.5, carbsPer100g: 75, fatPer100g: 0.4, category: "fruit", meals: ["breakfast", "snack"] },
];

// Shuffle array (for variety each generation)
function shuffle<T>(arr: T[]): T[] {
 const copy = [...arr];
 for (let i = copy.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [copy[i], copy[j]] = [copy[j], copy[i]];
 }
 return copy;
}

// Pick random element from array
function pickRandom<T>(arr: T[]): T {
 return arr[Math.floor(Math.random() * arr.length)];
}

function gramsForCalories(food: FoodItem, targetCals: number): number {
 return Math.round(targetCals / food.calsPer100g * 100);
}

export function calcMacros(food: FoodItem, grams: number) {
 return {
 protein: Math.round(food.proteinPer100g * grams / 100),
 carbs: Math.round(food.carbsPer100g * grams / 100),
 fat: Math.round(food.fatPer100g * grams / 100),
 calories: Math.round(food.calsPer100g * grams / 100),
 };
}

/**
 * Look up a food in the database by name (Arabic or English, fuzzy match).
 * Returns the closest match or null if nothing found.
 *
 * Used by the coach's manual-edit auto-calculator: when the coach types a
 * food name and a gram amount, we look up the food's calsPer100g and
 * compute the calorie value automatically so the totals stay consistent.
 */
export function lookupFood(query: string): FoodItem | null {
 if (!query) return null;
 const q = query.toLowerCase().trim();
 // Exact match first
 let match = FOOD_DB.find((f) => f.name.toLowerCase() === q || f.name_en.toLowerCase() === q);
 if (match) return match;
 // Contains match (Arabic or English)
 match = FOOD_DB.find((f) => f.name.toLowerCase().includes(q) || f.name_en.toLowerCase().includes(q));
 if (match) return match;
 // Reverse: query contains the food name
 match = FOOD_DB.find((f) => q.includes(f.name.toLowerCase()) || q.includes(f.name_en.toLowerCase()));
 return match || null;
}

/**
 * Parse a gram amount from a free-text string like "100 جم" or "1/2 رغيف" or
 * "2 بيضات". Returns the numeric gram value or null if unparseable.
 *
 * For common Arabic food units, we apply known gram equivalents:
 * - رغيف بلدي = 130g (full) or 65g (half)
 * - بيضة = 50g
 * - ملعقة كبيرة = 15g (oil/sugar) or 30g (rice)
 * - كوب = 240g (water) or 200g (rice) or 150g (yogurt)
 */
export function parseGrams(amount: string): number | null {
 if (!amount) return null;
 const s = amount.toLowerCase().trim();
 // Direct gram value (e.g. "100 جم", "150g", "100 grams")
 const gramMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:جم|g|gm|gram|grams|جرام)/);
 if (gramMatch) return parseFloat(gramMatch[1]);
 // Numeric prefix only (e.g. "100")
 const numMatch = s.match(/^(\d+(?:\.\d+)?)$/);
 if (numMatch) return parseFloat(numMatch[1]);
 // Egg count (بيضات / بيضة)
 const eggMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:بيض|بيضه|بيضة|egg|eggs)/);
 if (eggMatch) return parseFloat(eggMatch[1]) * 50;
 // Bread loaf fractions (رغيف)
 if (s.includes("½") || s.includes("1/2")) {
 if (s.includes("رغيف")) return 65; // half baladi loaf
 }
 if (s.match(/(\d+)\s*رغيف/)) {
 const m = s.match(/(\d+)\s*رغيف/)!;
 return parseInt(m[1]) * 130;
 }
 // Tablespoon (ملعقة كبيرة)
 if (s.includes("ملعقة كبيرة") || s.includes("ملعقه كبيره") || s.match(/\d+\s*tbsp/)) {
 const m = s.match(/(\d+(?:\.\d+)?)\s*(?:ملعقة|ملعقه|tbsp)/);
 if (m) {
 // Oil → 15g, sugar → 15g, rice → 30g default
 if (s.includes("زيت") || s.includes("oil") || s.includes("عسل") || s.includes("honey")) return parseFloat(m[1]) * 15;
 return parseFloat(m[1]) * 20;
 }
 }
 // Cup (كوب)
 if (s.match(/(\d+(?:\.\d+)?)\s*(?:كوب|cup)/)) {
 const m = s.match(/(\d+(?:\.\d+)?)\s*(?:كوب|cup)/)!;
 return parseFloat(m[1]) * 200;
 }
 // Slice (شريحة)
 if (s.match(/(\d+)\s*(?:شريحة|slice)/)) {
 const m = s.match(/(\d+)\s*(?:شريحة|slice)/)!;
 return parseInt(m[1]) * 30;
 }
 // Generic number → assume grams
 const anyNum = s.match(/(\d+(?:\.\d+)?)/);
 if (anyNum) return parseFloat(anyNum[1]);
 return null;
}

/**
 * Given a food name + amount string, return the calculated calories.
 * Returns null if the food isn't in the DB or the amount can't be parsed.
 *
 * This is the function used by the coach's manual-edit auto-calculator.
 */
export function calcCaloriesForItem(foodName: string, amount: string): number | null {
 const food = lookupFood(foodName);
 if (!food) return null;
 const grams = parseGrams(amount);
 if (grams === null) return null;
 return Math.round(food.calsPer100g * grams / 100);
}

/* ══════════ NUTRITION-FALLBACK 2026-10-25 (owner order P0-1 + P0-2) ══════════
 * The measured production defect: the local fallback was DIET-BLIND — it
 * recomputed its own BMR/TDEE (ignoring the coach's target-calorie
 * override), pushed rice/bread at 30% of every meal even for KETO plans,
 * and normalizeNutritionPlan then stamped the keto card + keto macros ON
 * TOP of that carb content (a mislabeled plan was SAVED).
 *
 * The law now:
 *  - the fallback consumes the SAME server-resolved numbers the AI path
 *    was asked to hit (dailyCalories / macros / dietType / mealsCount) —
 *    never its own math when they exist;
 *  - food selection is diet-aware (keto → no starch/fruit, fat-forward
 *    portions; low_carb → starch share cut; vegetarian/vegan → no
 *    meat/fish/dairy-per-diet) and constraint-checked with the SAME
 *    checkItemConstraints the quality gate uses (one law, both engines);
 *  - items carry per-item macros so the gate's keto/low-carb carb
 *    ceilings and Atwater coherence checks are enforceable on fallback
 *    output too;
 *  - meal/item SWAPS get local food-DB replacements when the provider
 *    chain fails (owner order P0-2) — calorie-matched and
 *    constraint-checked, or honest null (caller keeps the original).
 * ════════════════════════════════════════════════════════════════════════════ */

/** Options carrying the SERVER-RESOLVED plan targets into the local engine. */
export type LocalNutritionOptions = {
 /** computeNutritionTargets().dailyCalories — wins over local BMR/TDEE math. */
 dailyCalories?: number;
 /** Diet-aware macro targets (computeMacrosForDiet / coach overrides). */
 macros?: { protein_g: number; carbs_g: number; fat_g: number };
 /** Resolved diet type (coach override > plan echo > questionnaire). */
 dietType?: DietType;
 /** Coach-requested meals count (2..6). */
 mealsCount?: number;
 /** The client's committed constraint bundle (diet + allergy + banned tokens). */
 constraints?: ClientItemConstraints | null;
};

/** Per-category calorie share of ONE meal, by diet family. Zero = the
 * category is never used for that diet (keto: no starch, no fruit). */
type MealShares = { protein: number; carb: number; fat: number; veg: number; fruit: number; dairy: number };
const DIET_MEAL_SHARES: Record<DietType, MealShares> = {
 keto: { protein: 0.42, carb: 0, fat: 0.30, veg: 0.16, fruit: 0, dairy: 0.12 },
 low_carb: { protein: 0.40, carb: 0.16, fat: 0.26, veg: 0.12, fruit: 0.02, dairy: 0.04 },
 balanced: { protein: 0.38, carb: 0.28, fat: 0.12, veg: 0.10, fruit: 0.04, dairy: 0.08 },
 vegetarian: { protein: 0.36, carb: 0.28, fat: 0.12, veg: 0.10, fruit: 0.04, dairy: 0.10 },
 vegan: { protein: 0.38, carb: 0.30, fat: 0.14, veg: 0.10, fruit: 0.08, dairy: 0 },
};

/** Portion floors/ceilings per category (grams) — keeps portions physical. */
const PORTION_BOUNDS: Record<string, [number, number]> = {
 protein: [30, 600],
 carb: [30, 400],
 fat: [5, 120],
 veg: [80, 350],
 fruit: [60, 250],
 dairy: [50, 350],
};

/** Build the item's macros from per-100g values at `grams`. */
function itemFromFood(food: FoodItem, grams: number): {
 food: string;
 amount: string;
 calories: number;
 protein_g: number;
 carbs_g: number;
 fat_g: number;
} {
 const g = Math.max(1, Math.round(grams));
 return {
 food: food.name,
 amount: `${g} جم`,
 calories: Math.round(food.calsPer100g * g / 100),
 protein_g: Math.round(food.proteinPer100g * g / 100 * 10) / 10,
 carbs_g: Math.round(food.carbsPer100g * g / 100 * 10) / 10,
 fat_g: Math.round(food.fatPer100g * g / 100 * 10) / 10,
 };
}

/** Constraint-check a CANDIDATE food by NAME only (token tables), the
 * cheap first pass before portion math exists. */
function foodPassesTokens(food: FoodItem, constraints?: ClientItemConstraints | null): boolean {
 return checkItemConstraints(food.name, { carbs_g: null }, constraints) === null;
}

/** Constraint-check a BUILT item (real portion macros — keto/low-carb carb
 * ceilings included). Returns true when the item may ship. */
function itemPassesConstraints(
 it: { food: string; carbs_g: number },
 constraints?: ClientItemConstraints | null,
): boolean {
 return checkItemConstraints(it.food, { carbs_g: it.carbs_g }, constraints) === null;
}

/** All FOOD_DB rows passing the name-level constraint tables. */
function safeFoodsFor(constraints?: ClientItemConstraints | null): FoodItem[] {
 return FOOD_DB.filter((f) => foodPassesTokens(f, constraints));
}

export function generateNutritionPlan(ctx: ClientContext, opts?: LocalNutritionOptions): NutritionContent {
 const nutrition = loose(ctx.nutrition);
 const fitness = loose(ctx.fitness);
 const measurements = ctx.recent_measurements || [];

 const weight = parseFloat(String(nutrition.weight || measurements[0]?.weight || "80"));
 const height = parseFloat(String(nutrition.height || "175"));
 const age = parseInt(String(nutrition.age || "25"));
 const targetWeight = parseFloat(String(nutrition.target || nutrition.target_weight || weight));
 const goal = String(fitness.goal || "").toLowerCase();
 const activityLevel = parseActivityLevel(String(fitness.activity || ""));
 const trainingDays = parseInt(String(fitness.days ?? "")) || 4;

 const weightDiff = targetWeight - weight;
 const isFatLoss = weightDiff < -2 || goal.includes("fat") || goal.includes("دهون") || goal.includes("تخسيس") || goal.includes("loss");
 const isMuscleGain = weightDiff > 2 || goal.includes("muscle") || goal.includes("عضلات") || goal.includes("build") || goal.includes("كتلة");

 // FIX (2026-08-27): derive sex from the questionnaire instead of hardcoding
 // isMale=true — female clients were getting +5 kcal BMR instead of −161.
 const genderRaw = String(nutrition.gender || "male").toLowerCase();
 const isMale = !(genderRaw.includes("f") || /أنثى|بنت|امرأة|إمرأة/.test(genderRaw));
 const bmr = calculateBMR(weight, height, age, isMale);

 let adjustedMultiplier = activityLevel;
 if (trainingDays >= 5) adjustedMultiplier = Math.max(activityLevel, 1.725);
 else if (trainingDays >= 3) adjustedMultiplier = Math.max(activityLevel, 1.55);
 else if (trainingDays >= 1) adjustedMultiplier = Math.max(activityLevel, 1.375);

 const tdee = Math.round(bmr * adjustedMultiplier);

 // NUTRITION-FALLBACK 2026-10-25: the RESOLVED diet + constraints drive the
 // whole engine. With opts (the plan-generator path) these are the
 // server-resolved truth; standalone callers resolve from the
 // questionnaire — either way the engine is no longer diet-blind.
 const dietType: DietType = opts?.dietType ?? classifyDietText(nutrition.diet);
 const constraints: ClientItemConstraints | null =
 opts?.constraints ??
 buildClientConstraints({
 dietType,
 allergyText: nutrition.allergies,
 dislikedText: nutrition.disliked,
 });

 let dailyCalories: number;
 if (opts?.dailyCalories && opts.dailyCalories > 0) {
 // The server's target (coach override > questionnaire math) WINS.
 dailyCalories = Math.round(opts.dailyCalories);
 } else {
 let dc: number;
 if (isFatLoss) dc = tdee - Math.round(tdee * 0.20);
 else if (isMuscleGain) dc = tdee + Math.round(tdee * 0.10);
 else dc = tdee;
 dailyCalories = Math.round(dc / 10) * 10;
 }

 let proteinG: number, fatG: number, carbsG: number;
 if (opts?.macros && opts.macros.protein_g > 0) {
 // The server's diet-aware macros (coach override > computeMacrosForDiet) WIN.
 proteinG = Math.round(opts.macros.protein_g);
 carbsG = Math.round(opts.macros.carbs_g);
 fatG = Math.round(opts.macros.fat_g);
 } else if (dietType === "keto") {
 // Standalone keto band — mirrors plan-generator.computeMacrosForDiet
 // (single-source note: the resolved path always passes opts.macros).
 proteinG = Math.round(weight * 2.0);
 carbsG = Math.max(20, Math.min(50, Math.round((dailyCalories * 0.08) / 4)));
 fatG = Math.max(Math.round(0.5 * weight), Math.round((dailyCalories - proteinG * 4 - carbsG * 4) / 9));
 } else if (dietType === "low_carb") {
 proteinG = Math.round(weight * 2.0);
 carbsG = Math.max(50, Math.round((dailyCalories * 0.25) / 4));
 fatG = Math.max(Math.round(0.6 * weight), Math.round((dailyCalories - proteinG * 4 - carbsG * 4) / 9));
 } else if (isFatLoss) {
 proteinG = Math.round(weight * 2.4);
 fatG = Math.round(weight * 0.8);
 carbsG = Math.max(0, Math.round((dailyCalories - proteinG * 4 - fatG * 9) / 4));
 } else {
 proteinG = Math.round(weight * 2.0);
 fatG = Math.round(weight * 1.0);
 carbsG = Math.max(0, Math.round((dailyCalories - proteinG * 4 - fatG * 9) / 4));
 }

 const requestedMeals =
 Number(opts?.mealsCount ?? (parseInt(String(nutrition.meals ?? "")) || 4)) || 4;
 const mealsCount = Math.min(8, Math.max(2, Math.round(requestedMeals)));

 // Meal distributions (position-based share of the daily target)
 const distributions = mealsCount === 3 ? [0.35, 0.35, 0.30]
 : mealsCount === 4 ? [0.25, 0.35, 0.15, 0.25]
 : mealsCount === 5 ? [0.20, 0.30, 0.10, 0.25, 0.15]
 : mealsCount === 6 ? [0.20, 0.05, 0.25, 0.10, 0.25, 0.15]
 : mealsCount === 2 ? [0.55, 0.45]
 : Array.from({ length: mealsCount }, () => 1 / mealsCount);

 const mealNames = mealsCount === 3 ? ["الفطار", "الغداء", "العشاء"]
 : mealsCount === 4 ? ["الفطار", "الغداء", "سناك", "العشاء"]
 : mealsCount === 5 ? ["الفطار", "سناك صباحي", "الغداء", "سناك", "العشاء"]
 : mealsCount === 6 ? ["الفطار", "سناك صباحي", "الغداء", "سناك", "العشاء", "سناك مسائي"]
 : mealsCount === 2 ? ["الفطار", "العشاء"]
 : ["الفطار", "الغداء", "سناك", "العشاء"];

 // Map meal index to meal type
 const mealTypes: ("breakfast" | "lunch" | "dinner" | "snack")[] = mealsCount === 3
 ? ["breakfast", "lunch", "dinner"]
 : mealsCount === 4
 ? ["breakfast", "lunch", "snack", "dinner"]
 : mealsCount === 5
 ? ["breakfast", "snack", "lunch", "snack", "dinner"]
 : mealsCount === 6
 ? ["breakfast", "snack", "lunch", "snack", "dinner", "snack"]
 : mealsCount === 2
 ? ["breakfast", "dinner"]
 : ["breakfast", "lunch", "snack", "dinner"];

 const shares = DIET_MEAL_SHARES[dietType];

 // KETO DAY CARB BUDGET (structural, not lucky): the ketogenic band is
 // 20-50g NET for the whole day. Per-item ceilings alone let randomized
 // veg/dairy draws accumulate past it (measured worst draw: 79g). The
 // budget = the server-resolved macro target when provided (clamped to
 // the published band), spent ACROSS meals as items are built.
 const dayCarbBudget =
 dietType === "keto"
 ? Math.max(20, Math.min(50, Math.round(opts?.macros?.carbs_g ?? (dailyCalories * 0.08) / 4)))
 : Number.POSITIVE_INFINITY;

 // Shuffle the SAFE pools for variety — different each generation, but
 // never a food the constraint tables forbid.
 const safe = safeFoodsFor(constraints);
 const shuffledProteins = shuffle(safe.filter((f) => f.category === "protein"));
 // PROTEIN FLOOR (owner order P0-1: «إذا تعذر إنتاج نتيجة متوافقة، أوقف
 // الحفظ واعرض سببًا واضحًا»): a plan whose constraint-filtered food pools
 // carry ZERO protein sources is not a plan — fats and greens cannot fake
 // one (the measured degenerate draw: an oil-closed "keto day" at ~0g
 // protein against a 190g target). Fail HERE with the named reason; the
 // caller keeps nothing and surfaces the honest error.
 if (shuffledProteins.length === 0) {
 throw new Error(
 `لا توجد أي مصادر بروتين متوافقة مع قيود هذا العميل (النظام: ${dietType === "keto" ? "كيتو" : dietType === "low_carb" ? "قليل الكربوهيدرات" : dietType === "vegan" ? "نباتي صرف" : dietType === "vegetarian" ? "نباتي" : "متوازن"}${constraints?.allergyTokens?.length ? ` · الحساسيات: ${[...new Set(constraints.allergyTokens)].slice(0, 8).join("، ")}` : ""}${constraints?.bannedTokens?.length ? ` · الممنوعات: ${[...new Set(constraints.bannedTokens)].slice(0, 8).join("، ")}` : ""}) — أوقفنا الحفظ بدل توليد خطة بلا بروتين. عدّل القيود أو أضف بدائل متوافقة.`,
 );
 }
 const shuffledCarbs = shuffle(safe.filter((f) => f.category === "carb"));
 const shuffledFats = shuffle(safe.filter((f) => f.category === "fat"));
 const shuffledVegs = shuffle(safe.filter((f) => f.category === "veg"));
 const shuffledFruits = shuffle(safe.filter((f) => f.category === "fruit"));
 const shuffledDairy = shuffle(safe.filter((f) => f.category === "dairy"));

 // Track used protein sources to avoid repetition
 let proteinIdx = 0;

 const meals = distributions.slice(0, mealsCount).map((dist, idx) => {
 const mealCals = Math.round(dailyCalories * dist);
 const mealType = mealTypes[idx];
 const items: Array<{ food: string; amount: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }> = [];
 // This meal's share of the keto day-carb band (proportional to its
 // calorie share — early meals cannot starve the later ones).
 const mealCarbBudget = Number.isFinite(dayCarbBudget) ? dayCarbBudget * dist : Number.POSITIVE_INFINITY;
 let mealCarbsUsed = 0;

 // Pick protein suitable for this meal type
 const proteinsForMeal = shuffledProteins.filter((f) => f.meals.includes(mealType));
 const proteinFood = proteinsForMeal[proteinIdx % Math.max(1, proteinsForMeal.length)];
 if (proteinsForMeal.length > 0) proteinIdx++;

 // Pick carb suitable for this meal type (diet may forbid the category)
 const carbsForMeal = shares.carb > 0 ? shuffledCarbs.filter((f) => f.meals.includes(mealType)) : [];
 const carbFood = pickRandom(carbsForMeal);

 // Pick fat suitable for this meal type
 const fatsForMeal = shuffledFats.filter((f) => f.meals.includes(mealType));
 const fatFood = pickRandom(fatsForMeal);

 // Pick veg
 const vegsForMeal = shuffledVegs.filter((f) => f.meals.includes(mealType));
 const vegFood = pickRandom(vegsForMeal);

 // Pick fruit (mostly breakfast/snack; keto excludes the category)
 const fruitsForMeal = shares.fruit > 0 ? shuffledFruits.filter((f) => f.meals.includes(mealType)) : [];
 const fruitFood = pickRandom(fruitsForMeal);

 // Pick dairy (breakfast/snack; vegan excludes the category)
 const dairyForMeal = shares.dairy > 0 ? shuffledDairy.filter((f) => f.meals.includes(mealType)) : [];
 const dairyFood = pickRandom(dairyForMeal);

 const pushItem = (food: FoodItem | undefined, share: number, category: string) => {
 if (!food || share <= 0) return;
 const targetCals = Math.round(mealCals * share);
 let grams = Math.round(targetCals / food.calsPer100g * 100);
 const [minG, maxG] = PORTION_BOUNDS[category] ?? [10, 500];
 grams = Math.min(maxG, Math.max(minG, grams));
 // Keto greens cap: vegetables at their full portion bound can push the
 // DAY's carbs past the ketogenic band even when each item passes the
 // 12g ceiling (measured: 71g/day with carrot-heavy draws). For keto the
 // veg portion shrinks so a single veg item never carries >10g carbs —
 // the day stays inside the band while the plate keeps its greens.
 if (dietType === "keto" && food.carbsPer100g > 0 && category === "veg") {
 grams = Math.min(grams, Math.floor((10 / food.carbsPer100g) * 100));
 grams = Math.max(minG, grams);
 }
 let it = itemFromFood(food, grams);
 // This meal's share of the keto day band: shrink carb-carrying items
 // into what remains of the meal's sub-budget, then drop them when it is
 // spent (greens and dairy yield their grams to the proteins/fats that
 // carry the calories — bounded loss, the ±25% day band has headroom).
 if (Number.isFinite(mealCarbBudget) && it.carbs_g > 0 && mealCarbsUsed + it.carbs_g > mealCarbBudget) {
 const remaining = mealCarbBudget - mealCarbsUsed;
 if (remaining < 3) return; // sub-budget spent — keep the day in the band
 const budgetedGrams = Math.floor((remaining / food.carbsPer100g) * 100);
 if (budgetedGrams < 20) return; // unphysical crumb — drop instead
 it = itemFromFood(food, budgetedGrams);
 }
 // Keto/low-carb carb ceiling at the REAL portion: shrink once, then drop.
 if (!itemPassesConstraints(it, constraints)) {
 const shrunk = Math.max(PORTION_BOUNDS[category]?.[0] ?? 10, Math.floor(grams * 0.5));
 const candidate = itemFromFood(food, shrunk);
 if (!itemPassesConstraints(candidate, constraints)) return;
 it = candidate;
 }
 mealCarbsUsed += it.carbs_g;
 items.push(it);
 };

 pushItem(proteinFood, shares.protein, "protein");
 pushItem(carbFood, shares.carb, "carb");
 pushItem(fatFood, shares.fat, "fat");
 pushItem(dairyFood, shares.dairy, "dairy");
 pushItem(vegFood, shares.veg, "veg");
 pushItem(fruitFood, shares.fruit, "fruit");

 // KETO CALORIE CLOSE-OUT: when the carb budget dropped the greens/dairy
 // items (measured worst draw: avocado as the fat item spent the whole
 // meal sub-budget → meal = protein+fat only = 72% of its calories), the
 // gap is closed with a ZERO-CARB fat — olive oil, the ketogenic staple
 // (a drizzle for the plate/cooking). Keeps the day inside the carb band
 // AND inside the ±25% calorie band by construction, not by luck.
 if (Number.isFinite(mealCarbBudget)) {
 const mealSum0 = items.reduce((s, i) => s + i.calories, 0);
 const gap = mealCals - mealSum0;
 if (gap > 60) {
 const oil = FOOD_DB.find((f) => f.name === "زيت زيتون");
 // A DRIZZLE, not a meal: the close-out caps at 2 tablespoons (30g ≈
 // 265 kcal) — degenerate draws with no protein source cannot fake a
 // compliant plan out of oil alone; the gate then rejects honestly.
 const OIL_CLOSE_MAX_G = 30;
 if (oil && itemPassesConstraints({ food: oil.name, carbs_g: 0 }, constraints)) {
 const existing = items.find((i) => i.food === oil.name);
 if (existing) {
 // scale the existing oil portion up (bounded) toward the gap
 const food = safe.find((f) => f.name === oil.name) ?? oil;
 const currentG = parseFloat(existing.amount) || 15;
 const targetG = Math.min(OIL_CLOSE_MAX_G, Math.max(currentG, Math.round((existing.calories + gap) / food.calsPer100g * 100)));
 const scaled = itemFromFood(food, targetG);
 if (itemPassesConstraints(scaled, constraints)) {
 const i = items.indexOf(existing);
 items[i] = scaled;
 }
 } else {
 const grams = Math.min(OIL_CLOSE_MAX_G, Math.max(5, Math.round(gap / oil.calsPer100g * 100)));
 const it = itemFromFood(oil, grams);
 if (itemPassesConstraints(it, constraints)) items.push(it);
 }
 }
 }
 }

 // MEAL CALIBRATION: portion floors can overshoot the meal's calorie
 // share with calorie-dense draws (measured: 50g halloumi = 160 kcal
 // against a 40-kcal dairy share → vegetarian meals +26%). One guarded
 // proportional rescale brings the meal back inside ±12% — floors keep
 // portions physical (never below 15g), constraint checks keep diets
 // honest, and keto carb items keep their budgeted grams.
 {
 const mealSum = items.reduce((s, i) => s + i.calories, 0);
 if (mealSum > 0 && Math.abs(mealSum - mealCals) / mealCals > 0.12) {
 const scale = Math.min(1.6, Math.max(0.6, mealCals / mealSum));
 const carbsBefore = items.reduce((s, i) => s + i.carbs_g, 0);
 const rescaled = items.map((it) => {
 if (it.carbs_g > 1 && Number.isFinite(mealCarbBudget)) return it; // keto budgeted grams stay
 const food = safe.find((f) => f.name === it.food);
 if (!food) return it;
 const grams = Math.max(15, Math.round((parseFloat(it.amount) || 0) * scale));
 if (grams >= (parseFloat(it.amount) || 0) - 0.5 && scale < 1) return it; // cannot shrink
 const candidate = itemFromFood(food, grams);
 return itemPassesConstraints(candidate, constraints) ? candidate : it;
 });
 const newSum = rescaled.reduce((s, i) => s + i.calories, 0);
 const carbsAfter = rescaled.reduce((s, i) => s + i.carbs_g, 0);
 const improved = Math.abs(newSum - mealCals) < Math.abs(mealSum - mealCals) - 10;
 const budgetSafe = !Number.isFinite(mealCarbBudget) || carbsAfter <= Math.max(mealCarbBudget + 2, carbsBefore);
 if (improved && budgetSafe && rescaled.length === items.length) {
 items.length = 0;
 items.push(...rescaled);
 }
 }
 }

 let notes = "";
 if (idx === 0) notes = "تناولها خلال ساعة من الاستيقاظ — مهمة لتشغيل الأيض";
 else if (idx === mealsCount - 1) notes = "وجبة خفيفة قبل النوم بـ 2-3 ساعات";
 else if (mealType === "snack") notes = "وجبة خفيفة للحفاظ على الطاقة بين الوجبات الرئيسية";
 else notes = "وجبة رئيسية — ركّز على البروتين";

 return { name: mealNames[idx] || `وجبة ${idx + 1}`, items, notes };
 });

 const goalText = isFatLoss ? "خسارة الدهون" : isMuscleGain ? "بناء العضلات" : "الحفاظ على الوزن";
 const dietText = dietType === "keto" ? "كيتو (قليل الكربوهيدرات جدًا)"
 : dietType === "low_carb" ? "قليل الكربوهيدرات"
 : dietType === "vegan" ? "نباتي صرف"
 : dietType === "vegetarian" ? "نباتي"
 : "متوازن";

 const overview = `خطة تغذية مخصصة لـ ${ctx.name || "العميل"} بهدف ${goalText} — نظام ${dietText}.

 تحليل بياناتك:
• الوزن: ${weight} كجم | الهدف: ${targetWeight} كجم
• الطول: ${height} سم | العمر: ${age} سنة
• معدل الأيض الأساسي (BMR): ${bmr} كالوري
• إجمالي الاستهلاك (TDEE): ${tdee} كالوري

 السعرات المستهدفة: ${dailyCalories} كالوري/يوم
 البروتين: ${proteinG}جم (≈${(proteinG * 4 / dailyCalories * 100).toFixed(0)}%)
 الكربوهيدرات: ${carbsG}جم (≈${(carbsG * 4 / dailyCalories * 100).toFixed(0)}%)
 الدهون: ${fatG}جم (≈${(fatG * 9 / dailyCalories * 100).toFixed(0)}%)

${String(nutrition.allergies || "").trim() ? ` تم استبعاد: ${nutrition.allergies}\n` : ""}${String(nutrition.disliked || "").trim() ? ` تم تجنب: ${nutrition.disliked}\n` : ""}وزّع الوجبات على مدار اليوم لتحقيق أفضل امتصاص للبروتين.`;

 return {
 overview,
 daily_calories: dailyCalories,
 macros: { protein_g: proteinG, carbs_g: carbsG, fat_g: fatG },
 meals,
 };
}

/* ══════════ MEAL TITLES LAW 2026-10-25 (owner order P1-3) ══════════
 * Base titles only: «الفطار، الغداء، العشاء، سناك». The model (and the
 * old variety engine) invented compound titles like «فطار بحري» — the
 * title must be the MEAL SLOT, food descriptions live in items.
 * ═══════════════════════════════════════════════════════════════════ */

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export const BASE_MEAL_TITLES: Record<MealSlot, string> = {
 breakfast: "الفطار",
 lunch: "الغداء",
 dinner: "العشاء",
 snack: "سناك",
};

/** Detect the meal slot from a (possibly invented) meal name. */
export function detectMealSlot(rawName: string | undefined | null): MealSlot | null {
 const n = String(rawName || "");
 if (!n.trim()) return null;
 // Snack first — «سناك صباحي» contains «صباح» which would otherwise read
 // as breakfast.
 if (/سناك|سناكس|وجبه خفيفه|وجبة خفيفة|خفيفه|snack|سندويتش/.test(n)) return "snack";
 if (/افطار|إفطار|فطور|فطار|breakfast/.test(n)) return "breakfast";
 if (/غداء|غدا|lunch/.test(n)) return "lunch";
 if (/عشاء|عشا|dinner/.test(n)) return "dinner";
 return null;
}

/** The canonical title for a detected slot (snack variants keep their
 * morning/evening qualifier when the original name carried it). */
function slotTitle(slot: MealSlot, rawName: string): string {
 if (slot === "snack") {
 const n = String(rawName || "");
 if (/صباح/.test(n)) return "سناك صباحي";
 if (/مساء|مسائي|ليلي|قبل النوم/.test(n)) return "سناك مسائي";
 return BASE_MEAL_TITLES.snack;
 }
 return BASE_MEAL_TITLES[slot];
}

/** Position-based fallback layout per meals count (mirrors the local
 * generator's own mealNames table). */
function positionalTitle(slotIndex: number, mealsCount: number): string {
 const layouts: Record<number, string[]> = {
 2: ["الفطار", "العشاء"],
 3: ["الفطار", "الغداء", "العشاء"],
 4: ["الفطار", "الغداء", "سناك", "العشاء"],
 5: ["الفطار", "سناك صباحي", "الغداء", "سناك", "العشاء"],
 6: ["الفطار", "سناك صباحي", "الغداء", "سناك", "العشاء", "سناك مسائي"],
 };
 const layout = layouts[mealsCount] ?? layouts[4];
 return layout[slotIndex] ?? `وجبة ${slotIndex + 1}`;
}

/** Canonicalize ONE meal title: keyword slot detection first, positional
 * fallback second. «فطار بحري» → «الفطار»; «وجبة 1» (idx 0 of 4) → «الفطار». */
export function canonicalMealTitle(
 rawName: string | undefined | null,
 slotIndex: number,
 mealsCount: number,
): string {
 const raw = String(rawName || "").trim();
 const slot = detectMealSlot(raw);
 if (slot) return slotTitle(slot, raw);
 return positionalTitle(slotIndex, mealsCount);
}

/** Canonicalize a whole meals array's titles. Plain duplicate «سناك»
 * titles get sequential numbering (سناك 1، سناك 2) when a plan carries
 * more than one unqualified snack. */
export function canonicalizeMealTitles<T extends { name?: unknown }>(meals: T[]): string[] {
 const count = meals.length;
 const out = meals.map((m, i) => canonicalMealTitle(String(m?.name ?? ""), i, count));
 const plainSnacks = out.filter((t) => t === BASE_MEAL_TITLES.snack).length;
 if (plainSnacks > 1) {
 let sn = 0;
 for (let i = 0; i < out.length; i++) {
 if (out[i] === BASE_MEAL_TITLES.snack) {
 sn += 1;
 if (sn < plainSnacks) out[i] = `${BASE_MEAL_TITLES.snack} ${sn}`;
 else out[i] = `${BASE_MEAL_TITLES.snack} ${sn}`;
 }
 }
 }
 return out;
}

/* ══════════ LOCAL SWAP BUILDERS 2026-10-25 (owner order P0-2) ══════════
 * When the provider chain cannot deliver a gate-passing replacement, the
 * local food DB builds one: diet-aware (same constraint tables), calorie-
 * matched to the original meal/item (±20% / ±15% — the gates' own bands),
 * avoid-list aware. Returns null when no compliant replacement exists —
 * the caller then keeps the original and fails honestly.
 * ═══════════════════════════════════════════════════════════════════════ */

export type LocalReplacementMealInput = {
 originalMeal: { name?: string; items?: Array<{ food: string; amount: string; calories: number }>; notes?: string };
 targetCalories: number;
 constraints?: ClientItemConstraints | null;
 avoidNames?: string[];
};

export type LocalReplacementMeal = {
 name: string;
 items: Array<{ food: string; amount: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }>;
 notes: string;
};

/** Build a full local replacement meal (provider-failure swap path). */
export function buildLocalReplacementMeal(input: LocalReplacementMealInput): LocalReplacementMeal | null {
 const { originalMeal, targetCalories, constraints } = input;
 const target = Math.round(Number(targetCalories) || 0);
 if (target < 60) return null; // degenerate anchor — no honest equivalent

 const avoid = new Set((input.avoidNames ?? []).map((n) => String(n || "").trim()).filter(Boolean));
 const originalFoods = new Set((originalMeal.items ?? []).map((i) => String(i?.food || "").trim()).filter(Boolean));

 const dietType = constraints?.dietType ?? null;
 const shares = DIET_MEAL_SHARES[dietType ?? "balanced"];
 const slot = detectMealSlot(originalMeal.name) ?? "lunch";
 const safe = safeFoodsFor(constraints).filter(
 (f) => !avoid.has(f.name) && !originalFoods.has(f.name) && f.meals.includes(slot as "breakfast" | "lunch" | "dinner" | "snack"),
 );

 const pool = (cat: FoodItem["category"]) => shuffle(safe.filter((f) => f.category === cat));
 const proteins = pool("protein");
 const carbs = shares.carb > 0 ? pool("carb") : [];
 const fats = pool("fat");
 const vegs = pool("veg");
 const dairies = shares.dairy > 0 ? pool("dairy") : [];

 const proteinFood = proteins[0];
 if (!proteinFood) return null; // no safe protein → no honest meal

 const picks: Array<{ food: FoodItem; share: number; category: string }> = [
 { food: proteinFood, share: shares.protein, category: "protein" },
 ];
 if (carbs[0]) picks.push({ food: carbs[0], share: shares.carb, category: "carb" });
 if (fats[0]) picks.push({ food: fats[0], share: shares.fat, category: "fat" });
 if ((slot === "breakfast" || slot === "snack") && dairies[0]) picks.push({ food: dairies[0], share: shares.dairy, category: "dairy" });
 if (vegs[0]) picks.push({ food: vegs[0], share: shares.veg, category: "veg" });

 const items: LocalReplacementMeal["items"] = [];
 for (const p of picks) {
 if (p.share <= 0) continue;
 const [minG, maxG] = PORTION_BOUNDS[p.category] ?? [10, 500];
 let grams = Math.round((target * p.share) / p.food.calsPer100g * 100);
 grams = Math.min(maxG, Math.max(minG, grams));
 let it = itemFromFood(p.food, grams);
 if (!itemPassesConstraints(it, constraints)) {
 const shrunk = Math.max(PORTION_BOUNDS[p.category]?.[0] ?? 10, Math.floor(grams * 0.5));
 it = itemFromFood(p.food, shrunk);
 if (!itemPassesConstraints(it, constraints)) continue;
 }
 items.push(it);
 }
 if (items.length < 2) return null;

 // Close on the target: rescale the LARGEST item's grams so the meal total
 // lands inside the ±20% gate band (aim ±10%).
 const sum = items.reduce((s, i) => s + i.calories, 0);
 if (sum <= 0) return null;
 const drift = Math.abs(sum - target) / target;
 if (drift > 0.45) return null; // pools too sparse to close — honest null
 if (drift > 0.10) {
 const largest = items.reduce((a, b) => (b.calories > a.calories ? b : a));
 const food = safe.find((f) => f.name === largest.food) ?? null;
 if (food) {
 const delta = target - (sum - largest.calories);
 const grams = Math.max(10, Math.round(delta / food.calsPer100g * 100));
 const rescaled = itemFromFood(food, grams);
 if (itemPassesConstraints(rescaled, constraints) && rescaled.calories > 0) {
 const idx = items.indexOf(largest);
 items[idx] = rescaled;
 }
 }
 }

 const finalSum = items.reduce((s, i) => s + i.calories, 0);
 if (finalSum <= 0 || Math.abs(finalSum - target) / target > PLAN_AI_SANITY.mealDriftTolerance) {
 return null;
 }

 return {
 name: canonicalMealTitle(originalMeal.name, 1, 3),
 items,
 notes: "بديل محلي من قاعدة أطعمة المنصة — مكافئ بالسعرات ومطابق لقيود العميل.",
 };
}

/** Infer a food name's category (for the single-item swap path). */
function detectFoodCategory(name: string): FoodItem["category"] | null {
 const hit = lookupFood(name);
 if (hit) return hit.category;
 const n = String(name || "");
 if (/دجاج|لحم|سمك|فراخ|بيض|تونا|سلمون|جمبري|روبيان|كبده|كبدة|رومي|صدر/.test(n)) return "protein";
 if (/ارز|أرز|رز|خبز|عيش|مكرونه|مكرونة|بطاطس|بطاطا|شوفان|كينوا|برغل|فريك|بلغر|كسكسي|معكرونه/.test(n)) return "carb";
 if (/زيت|مكسرات|لوز|جوز|بندق|فستق|فول سوداني|زبده|زبدة|افوكادو|أفوكادو|بذور/.test(n)) return "fat";
 if (/خضار|خيار|طماطم|طمام|خس|بروكلي|سبانخ|كوسه|كوسة|فلفل|جزر|باذنجان|سلطه|سلطة/.test(n)) return "veg";
 if (/موز|تفاح|برتقال|فراوله|فراولة|عنب|بطيخ|كيوي|تمر|بلح|مانجو|اناناس|فاكهه|فاكهة/.test(n)) return "fruit";
 if (/زبادي|جبن|جبنة|حليب|لبن|قريش|فيتا|موزاريلا|حلوم|بارميزان/.test(n)) return "dairy";
 return null;
}

export type LocalReplacementItem = {
 food: string;
 amount: string;
 calories: number;
 protein_g?: number;
 carbs_g?: number;
 fat_g?: number;
 alternatives?: string;
};

/** Build a single-item local replacement (provider-failure item swap). */
export function buildLocalReplacementItem(input: {
 item: { food: string; amount: string; calories: number };
 constraints?: ClientItemConstraints | null;
 avoidNames?: string[];
}): LocalReplacementItem | null {
 const target = Math.max(10, Math.round(Number(input.item?.calories) || 0));
 const category = detectFoodCategory(String(input.item?.food || ""));
 if (!category) return null;
 const avoid = new Set((input.avoidNames ?? []).map((n) => String(n || "").trim()).filter(Boolean));
 const original = String(input.item?.food || "").trim();

 const candidates = safeFoodsFor(input.constraints).filter(
 (f) => f.category === category && f.name !== original && !avoid.has(f.name),
 );
 if (candidates.length === 0) return null;

 for (const cand of shuffle(candidates)) {
 const grams = Math.max(5, Math.round(target / cand.calsPer100g * 100));
 if (grams > 700) continue; // unphysical portion for this calorie level
 const it = itemFromFood(cand, grams);
 if (!itemPassesConstraints(it, input.constraints)) continue;
 const drift = Math.abs(it.calories - target) / target;
 if (drift > PLAN_AI_SANITY.itemDriftTolerance) continue;
 const alt = candidates.find((c) => c !== cand);
 return {
 ...it,
 alternatives: alt ? `أو ${alt.name} بكمية مكافئة` : undefined,
 };
 }
 return null;
}

/* ----------------------------- Chat reply -------------------------------- */

/**
 * Smart chat reply — reads the client's full context (plans, questionnaires,
 * progress, subscription) and answers questions intelligently.
 *
 * IMPORTANT: This AI does NOT generate new plans. It only:
 * - Answers questions about existing plans
 * - Calculates swap equivalents (grams, macros) when client asks
 * - Suggests using the swap button on specific meals/exercises
 * - If daily limit reached, suggests sending a request to the coach
 */
export function generateChatReply(message: string, ctx?: ClientContext): string {
 const text = message.toLowerCase().trim();
 const name = ctx?.name || "";
 const plans = ctx?.current_plans || [];
 const nutrition = loose(ctx?.nutrition);
 const fitness = loose(ctx?.fitness);
 const measurements = ctx?.recent_measurements || [];
 const subscription = ctx?.subscription;

 // Helper: check if ANY keyword matches
 const has = (...words: string[]) => words.some((w) => text.includes(w));

 // Greeting
 if (has("hello", "hi", "hey", "مرحبا", "اهلا", "أهلا", "السلام", "سلام", "صباح", "مساء", "هاي", "هلا")) {
 return `أهلاً${name ? ` ${name}` : ""}! أنا EVO، مساعدك الذكي. عندي خلفية كاملة عن:
${plans.length > 0 ? ` خططك الحالية (${plans.length} خطة)` : "⏳ لا توجد خطط مفعّلة بعد"}
${nutrition.weight ? ` وزنك: ${nutrition.weight} كجم` : ""}
${fitness.goal ? ` هدفك: ${fitness.goal}` : ""}

تقدر تسألني عن أي حاجة:
• "كم بروتين في خطتي؟" — أقولك بالأرقام
• "عايز أخفف وزني" — أشرحلك خطتك
• "بدل الرز ببطاطس" — أحسبلك الجرامات
• "إيه تمارين اليوم الأول؟" — أعرضها لك
• "كم تبديل باقي لي؟" — أقولك حدك
كيف أقدر أساعدك؟`;
 }

 // Food swap — broader matching
 if (has("بدل", "استبدل", "swap", "تغيير", "غيّر", "غير") && has("بطاطس", "رز", "ارز", "أرز", "دجاج", "سمك", "لحم", "اكل", "أكل", "وجبة", "وجبه", "meal", "food", "صنف", "طعام", "شوفان", "بطاطا", "خبز", "معكرونة", "مكرونة")) {
 return handleFoodSwapQuestion(text, ctx);
 }
 // Also catch "ينفع اكل" / "ممكن اكل" / "أكل إيه"
 if (has("ينفع", "ممكن", "أكل", "اكل") && has("بدل", "بدلا", "عوض", "تغيير", "بطاطس", "رز", "ارز", "أرز", "شوفان", "بطاطا", "خبز")) {
 return handleFoodSwapQuestion(text, ctx);
 }

 // Exercise swap — broader matching
 if (has("بدل", "استبدل", "swap", "تغيير", "غيّر", "غير") && has("تمرين", "سكوات", "بنش", "ديدليفت", "exercise", "workout", "ضغط", "عقلة", "سحب", "كيرل", "رفرفة", "بلانك", "ليج")) {
 return handleExerciseSwapQuestion(text, ctx);
 }

 // Protein — broader
 if (has("protein", "بروتين", "بروتينة", "واي", "whey")) {
 const weight = parseFloat(String(nutrition.weight || measurements[0]?.weight || "80"));
 const proteinTarget = Math.round(weight * 2);
 const nContent = plans.find((p) => p.type === "meal" || p.type === "nutrition")?.content;
 const c = nContent && "meals" in nContent ? nContent : null;
 if (c?.macros?.protein_g) {
 return `خطة التغذية بتاعتك فيها ${c.macros.protein_g}جم بروتين يومياً.
وزنك ${weight} كجم، احتياجك ${proteinTarget}جم (2جم/كجم) — خطتك بتغطي احتياجك! 

مصادر ممتازة: صدور دجاج، بيض، سمك، لحم قليل الدهن، زبادي يوناني، جبن قريش، تونة.

لو عايز تبديل صنف بروتيني، اضغط زر "استبدال" على الوجبة في صفحة خطتي، أو اسألني عن تبديل معين.`;
 }
 return `احتياجك اليومي من البروتين حوالي ${proteinTarget}جم (2جم/كجم وزنك ${weight}كجم).
وزّعها على وجباتك (${Math.round(proteinTarget / 4)}جم لكل وجبة) لأفضل امتصاص.

بعد ما الكوتش يفعّل خطة تغذيتك، هقدر أقولك كم بروتين في كل وجبة بالضبط.`;
 }

 // Water — broader
 if (has("water", "ماء", "مياه", "شرب", "ميه", "ترطيب", "hydration")) {
 const weight = parseFloat(String(nutrition.weight || measurements[0]?.weight || "80"));
 const waterTarget = Math.round(weight * 35 / 1000 * 10) / 10;
 return `احتياجك اليومي من الماء حوالي ${waterTarget} لتر (${Math.round(weight * 35)} مل).
• اضف 500 مل حول التمرين
• زد في الجو الحار أو لو بتعرق كتير
• ابدأ يومك بكوبين ماء على الريق
• خلي زجاجة ماء معاك طول اليوم`;
 }

 // Weight loss / fat loss — broader
 if (has("weight", "وزن", "fat", "دهون", "تخسيس", "تنحيف", "خسارة", "خفف", "أخفف", "نزل", "أنزل", "نزول", "diet", "دايت", "رجيم", "حرق")) {
 const weight = parseFloat(String(nutrition.weight || measurements[0]?.weight || "80"));
 const target = parseFloat(String(nutrition.target || nutrition.target_weight || "0"));
 const nContent = plans.find((p) => p.type === "meal" || p.type === "nutrition")?.content;
 const c = nContent && "meals" in nContent ? nContent : null;
 if (c?.daily_calories) {
 const maintenance = Math.round(weight * 33);
 const deficit = maintenance - c.daily_calories;
 return `خطتك الحالية فيها ${c.daily_calories} كالوري/يوم.
صيانة وزنك ≈ ${maintenance} كالوري، يعني خطتك بتعمل عجز ${deficit} كالوري/يوم ≈ ${(deficit * 7 / 7700).toFixed(1)} كجم أسبوعياً.

${target ? ` هدفك: ${target} كجم (متبقي ${(weight - target).toFixed(1)} كجم)` : ""}

 نصائح لخسارة دهون بشكل أسرع:
• التزم بخطتك 100% — كل سعرة محسوبة
• سجل وزنك كل أسبوع في صفحة التقدم
• زد 20-30 دقيقة مشي يومياً
• نام 7-9 ساعات (قلة النوم ترفع الكورتيزول)
• اشرب 3 لتر ماء يومياً`;
 }
 return `لخسارة الدهون بشكل مستدام:
• عجز 300-500 كالوري يومياً (≈0.5 كجم/أسبوع)
• بروتين عالي: 2-2.4جم/كجم وزن
• تمارين مقاومة 4 مرات أسبوعياً
• 20-30 دقيقة كارديو 2-3 مرات
• نوم 7-9 ساعات

بعد ما الكوتش يفعّل خطتك، هقدر أقولك بالضبط كم عجز في خطتك.`;
 }

 // Muscle building — broader
 if (has("muscle", "عضلات", "عضلة", "build", "تضخيم", "كتلة", "بناء", "ضخامة", "bulk", "تضخم")) {
 const weight = parseFloat(String(nutrition.weight || measurements[0]?.weight || "80"));
 const nContent = plans.find((p) => p.type === "meal" || p.type === "nutrition")?.content;
 const c = nContent && "meals" in nContent ? nContent : null;
 if (c?.daily_calories) {
 return `خطتك الحالية فيها ${c.daily_calories} كالوري/يوم — مصممة لبناء العضلات.

 لبناء عضلات بشكل فعال:
• التزم ببروتين ${c.macros?.protein_g || Math.round(weight * 2)}جم يومياً
• تدرّب بأوزان ثقيلة (6-12 تكرار)
• زد 2.5 كجم كل أسبوعين (progressive overload)
• نام 7-9 ساعات للتعافي العضلي
• كل كارب قبل وبعد التمرين للطاقة`;
 }
 return `لبناء العضلات:
• فائض 200-300 كالوري فوق الصيانة
• بروتين 2جم/كجم وزن
• تمارين مركبة (سكوات، بنش، ديدليفت)
• 4-5 أيام تدريب أسبوعياً
• نوم 7-9 ساعات أساسي للتعافي`;
 }

 // Cardio
 if (has("cardio", "كارديو", "مشي", "جري", "ركض", "دراجة", "hiit", "هيت")) {
 return `الكارديو اختياري لخسارة الدهون لكن ممتاز لصحة القلب:
• 2-3 جلسات أسبوعياً، 20-30 دقيقة
• اختر اللي تحبه: مشي سريع، جري، دراجة، سباحة
• HIIT (تدريب متقطع) يحرق سعرات أكثر في وقت أقل
• لا تفرط في الكارديو لو بتبني عضلات — يأكل من العضل`;
 }

 // Sleep
 if (has("sleep", "نوم", "أنام", "نام", "تعافي", "recovery", "راحة")) {
 return `النوم 7-9 ساعات أساسي لـ:
• إصلاح العضلات وإفراز هرمون النمو
• تنظيم هرمونات الجوع والشبع
• تحسين الأداء الرياضي والتركيز

 نصائح لنوم أفضل:
• قلل الشاشات قبل النوم بساعة
• تجنب الكافيين بعد العصر
• حافظ على مواعيد نوم ثابتة
• درجة حرارة الغرفة 18-20°م`;
 }

 // Supplements
 if (has("supplement", "مكمل", "واي", "كرياتين", "فيتامين", "bcaa", "أوميغا", "omega", "زنك", "حديد")) {
 return `المكملات الأساسية فقط:
• واي بروتين: 1-2 سكوب يومياً (25-50جم بروتين)
• كرياتين: 5جم يومياً (يحسن القوة والقدرة)
• فيتامين D: 2000-4000 IU (لو ما تتعرضش للشمس)
• أوميغا 3: 1-2جم يومياً (لصحة القلب)

الباقي اختياري. استشر طبيب قبل أي مكمل لو عندك حالة طبية.`;
 }

 // Current plan — broader
 if (has("خطتي", "plan", "الخطة", "برنامجي", "نظامي", "تماريني", "وجباتي", "نظامي", "my plan", "خطتي", "خطة")) {
 if (plans.length === 0) {
 return `لا يوجد خطة مفعّلة لديك حالياً. بمجرد ما الكوتش يفعّل خطتك، هقدر أقولك تفاصيلها بالكامل: السعرات، الماكروز، الوجبات، التمارين، وأي تبديلات تناسبك.`;
 }
 const mealContent = plans.find((p) => p.type === "meal" || p.type === "nutrition")?.content;
 const mealPlan = mealContent && "meals" in mealContent ? mealContent : null;
 const workoutPlan = plans.find((p) => p.type === "workout")?.content;
 const wContent = workoutPlan && "days" in workoutPlan ? workoutPlan : null;
 let reply = `عندك ${plans.length} خطة مفعّلة:\n\n`;
 if (mealPlan) {
 const c = mealPlan;
 reply += ` • السعرات: ${c.daily_calories} كالوري/يوم\n`;
 reply += ` • الماكروز: بروتين ${c.macros.protein_g}جم | كارب ${c.macros.carbs_g}جم | دهون ${c.macros.fat_g}جم\n`;
 reply += ` • ${c.meals.length} وجبات: ${c.meals.map((m) => m.name).join("، ")}\n`;
 reply += "\n";
 }
 if (wContent?.days) {
 reply += ` • ${wContent.days.filter((d) => !d.isRest).length} أيام تدريب + ${wContent.days.filter((d) => d.isRest).length} أيام راحة\n`;
 reply += ` • الأيام: ${wContent.days.map((d) => `${d.day} (${d.isRest ? "راحة" : d.focus})`).join("، ")}\n\n`;
 }
 reply += `تقدر تسألني عن أي وجبة أو تمرين محدد، أو تطلب تبديل وأحسبه لك.`;
 return reply;
 }

 // Swap limit — broader
 if (has("حد", "limit", "كام تبديل", "عدد التبديلات", "كم تبديل", "تبديلات", "كام تغيير", "كم تغيير")) {
 if (subscription?.swapLimit === null || subscription?.swapLimit === undefined) {
 return `اشتراكك يتيح لك تبديلات غير محدودة يومياً! 
تقدر تبديل وجبات وتمارين قد ما تحب بدون أي قيود.`;
 }
 return `اشتراكك يتيح لك ${subscription?.swapLimit || 2} تبديل يومياً لكل نوع:
• ${subscription?.swapLimit || 2} تبديل وجبات/يوم
• ${subscription?.swapLimit || 2} تبديل تمارين/يوم

تتجدد التبديلات كل يوم. إذا خلصت الحد، تقدر تطلب تبديل من المدرب مباشرة وأنا هساعدك تقدم الطلب.`;
 }

 // Calories question — broader
 if (has("سعرات", "calories", "كالوري", "سعرة", "حرارية", "كم سعرة", "كام سعرة")) {
 const nContent = plans.find((p) => p.type === "meal" || p.type === "nutrition")?.content;
 const c = nContent && "meals" in nContent ? nContent : null;
 if (c?.daily_calories) {
 return `خطتك فيها ${c.daily_calories} كالوري/يوم.
• بروتين: ${c.macros?.protein_g || 0}جم = ${((c.macros?.protein_g || 0) * 4)} كالوري (${Math.round((c.macros?.protein_g || 0) * 4 / c.daily_calories * 100)}%)
• كارب: ${c.macros?.carbs_g || 0}جم = ${((c.macros?.carbs_g || 0) * 4)} كالوري (${Math.round((c.macros?.carbs_g || 0) * 4 / c.daily_calories * 100)}%)
• دهون: ${c.macros?.fat_g || 0}جم = ${((c.macros?.fat_g || 0) * 9)} كالوري (${Math.round((c.macros?.fat_g || 0) * 9 / c.daily_calories * 100)}%)`;
 }
 return `بعد ما الكوتش يفعّل خطة تغذيتك، هقدر أقولك بالضبط كم سعرة وماكروز في كل وجبة.`;
 }

 // Macros question
 if (has("ماكرو", "macro", "بروتين", "كارب", "دهون", "macros", "نسبة")) {
 const nContent = plans.find((p) => p.type === "meal" || p.type === "nutrition")?.content;
 const c = nContent && "meals" in nContent ? nContent : null;
 if (c?.macros) {
 return `الماكروز في خطتك:
• بروتين: ${c.macros.protein_g}جم
• كارب: ${c.macros.carbs_g}جم
• دهون: ${c.macros.fat_g}جم`;
 }
 return `بعد ما الكوتش يفعّل خطة تغذيتك، هقدر أقولك الماكروز بالتفصيل.`;
 }

 // What exercises today?
 if (has("تمارين", "تمرين", "تدريب", "workout", "exercise", "أد إيه", "اد ايه", "اليوم")) {
 const wContent = plans.find((p) => p.type === "workout")?.content;
 if (wContent && "days" in wContent && wContent.days) {
 const trainingDays = wContent.days.filter((d) => !d.isRest);
 let reply = `برنامجك فيه ${trainingDays.length} أيام تدريب:\n\n`;
 trainingDays.forEach((d) => {
 reply += `${d.day} — ${d.focus}:\n`;
 d.exercises?.forEach((ex) => {
 reply += ` • ${ex.name}: ${ex.sets}×${ex.reps} (راحة: ${ex.rest})\n`;
 });
 reply += "\n";
 });
 return reply + `تقدر تسألني عن تبديل أي تمرين وأقترح بديل مناسب.`;
 }
 return `بعد ما الكوتش يفعّل برنامج تمارينك، هقدر أعرضلك تفاصيل كل يوم وتمارينه.`;
 }

 // Thanks
 if (has("شكرا", "شكراً", "thanks", "thank", "تسلم", "ممتاز", "تمام")) {
 return `العفو${name ? ` ${name}` : ""}! أنا دايماً هنا لو احتجت أي حاجة. تقدر تسألني في أي وقت.`;
 }

 // Default — smarter fallback
 return `سؤال حلو${name ? ` ${name}` : ""}! 

ممكن أساعدك في:
• "كم بروتين في خطتي؟" — أقولك بالأرقام
• "عايز أخفف وزني" — أشرحلك خطتك
• "بدل الرز ببطاطس" — أحسبلك الجرامات
• "إيه تمارين اليوم الأول؟" — أعرضها لك
• "كم تبديل باقي لي؟" — أقولك حدك
• "كم سعرات في خطتي؟" — أقولك التفاصيل
• "إيه الماكروز بتاعتي؟" — أعرضها لك

اكتب سؤالك بطريقة تانية أو اختار من اللي فوق وأنا أساعدك.`;
}

function handleFoodSwapQuestion(text: string, ctx?: ClientContext): string {
 const plans = ctx?.current_plans || [];
 const nutrition = loose(ctx?.nutrition);
 const nContent = plans.find((p) => p.type === "meal" || p.type === "nutrition")?.content;
 const nutritionPlan = nContent && "meals" in nContent ? nContent : null;

 // Common food swaps with macro calculations
 const foodSwaps: Record<string, { from: string; to: string; fromCal: number; toCal: number; fromGrams: number; toGrams: number; fromProtein: number; toProtein: number; fromCarbs: number; toCarbs: number; note: string }> = {
 "بطاطس رز": {
 from: "أرز أبيض مطبوخ",
 to: "بطاطس مسلوقة",
 fromCal: 130, toCal: 87, // per 100g
 fromGrams: 150, toGrams: 224, // 150g rice = 195cal, 224g potato = 195cal
 fromProtein: 2.7, toProtein: 2.0,
 fromCarbs: 28, toCarbs: 20,
 note: "البطاطس فيها سعرات أقل لكل 100جم، فمحتاج كمية أكبر لمطابقة السعرات. البطاطس فيها ألياف أكثر وشبع أعلى.",
 },
 "رز بطاطس": {
 from: "أرز أبيض مطبوخ",
 to: "بطاطس مسلوقة",
 fromCal: 130, toCal: 87,
 fromGrams: 150, toGrams: 224,
 fromProtein: 2.7, toProtein: 2.0,
 fromCarbs: 28, toCarbs: 20,
 note: "البطاطس فيها سعرات أقل لكل 100جم، فمحتاج كمية أكبر لمطابقة السعرات. البطاطس فيها ألياف أكثر وشبع أعلى.",
 },
 "دجاج سمك": {
 from: "صدر دجاج",
 to: "سمك (تونة/سلمون)",
 fromCal: 165, toCal: 132,
 fromGrams: 150, toGrams: 187,
 fromProtein: 31, toProtein: 28,
 fromCarbs: 0, toCarbs: 0,
 note: "السمك فيه سعرات أقل لكن دهون أوميغا-3 صحية. زود الكمية قليل لمطابقة البروتين.",
 },
 "ارز شوفان": {
 from: "أرز",
 to: "شوفان",
 fromCal: 130, toCal: 389,
 fromGrams: 150, toGrams: 50, // 50g oats dry = 195cal
 fromProtein: 2.7, toProtein: 6.8,
 fromCarbs: 28, toCarbs: 28,
 note: "الشوفان طاقة أعلى لكل جرام، فمحتاج كمية أقل. فيه ألياف أكثر وبروتين أعلى.",
 },
 };

 // Find matching swap
 let swap: typeof foodSwaps[string] | null = null;
 for (const key of Object.keys(foodSwaps)) {
 const [a, b] = key.split(" ");
 if ((text.includes(a) && text.includes(b)) || text.includes(key)) {
 swap = foodSwaps[key];
 break;
 }
 }

 // Generic calculation for any food swap
 if (!swap) {
 if (nutritionPlan?.meals) {
 return `سؤال ممتاز عن تبديل الأطعمة! 

عندك ${nutritionPlan.meals.length} وجبات في خطتك الحالية. للتبديل:
1. اذهب لصفحة "خطتي"
2. افتح الخطة
3. اضغط زر "استبدال" بجانب الوجبة

أو اكتب لي سؤالك بالتفصيل، مثال:
• "بدل الرز بإيه؟" — أقترح بدائل بنفس السعرات
• "كم بطاطس بدل 150 جم رز؟" — أحسبلك بالضبط

تقدر تسألني عن أي صنف محدد وأحسبلك المكافئ بالجرامات والسعرات.`;
 }
 return `لتبديل صنف معين، اذهب لصفحة "خطتي" واضغط زر "استبدال" بجانب الوجبة.

أو اسألني سؤال محدد مثل:
• "بدل الرز بإيه؟"
• "كم بطاطس تساوي 100 جم رز؟"

وأحسبلك التبديل بالجرامات والسعرات والماكروز.`;
 }

 return ` تبديل ${swap.from} بـ ${swap.to}:

 الحسابات (لمطابقة ${swap.fromGrams}جم من ${swap.from}):
• ${swap.to}: ${swap.toGrams}جم
• السعرات: ${Math.round(swap.fromCal * swap.fromGrams / 100)} كالوري (نفس السعرات)
• البروتين: ${swap.fromProtein}جم → ${swap.toProtein}جم
• الكارب: ${swap.fromCarbs}جم → ${swap.toCarbs}جم

 ${swap.note}

للتبديل الفعلي، اذهب لصفحة "خطتي" واضغط زر "استبدال" على الوجبة، أو اطلب مني وأنا أساعدك.`;
}

function handleExerciseSwapQuestion(text: string, ctx?: ClientContext): string {
 const plans = ctx?.current_plans || [];
 const wContent = plans.find((p) => p.type === "workout")?.content;
 const workoutPlan = wContent && "days" in wContent ? wContent : null;

 // Common exercise swaps by muscle group
 const exerciseSwaps: Record<string, { from: string; to: string; muscle: string; sets: number; reps: string; note: string }> = {
 "سكوات": { from: "سكوات", to: "ليج بريس / جوبيت سكوات", muscle: "أمام الفخذ + مؤخرة الفخذ + أرداف", sets: 4, reps: "8-12", note: "نفس الحجم والشدة. الليج بريس آمن أكتر لو عندك مشاكل ظهر." },
 "بنش": { from: "بنش بريس", to: "ضغط أرضي / دمبل بريس", muscle: "صدر + ترايسبس + كتف أمامي", sets: 4, reps: "8-12", note: "الضغط الأرضي بديل ممتاز للمنزل، نفس العضلات بدون معدات." },
 "ديدليفت": { from: "ديدليفت", to: "رومانيان ديدليفت / هيب ثرست", muscle: "مؤخرة الفخذ + أرداف + ظهر سفلي", sets: 3, reps: "8-10", note: "الرومانيان أخف على الظهر ويستهدف المؤخرة أكثر." },
 "عقلة": { from: "عقلة", to: "سحب أمامي / سحب باند", muscle: "ظهر عرضي + بايسبس", sets: 4, reps: "8-12", note: "السحب أمامي أسهل ويسمح بحجم أكبر للمبتدئين." },
 };

 let swap: typeof exerciseSwaps[string] | null = null;
 for (const key of Object.keys(exerciseSwaps)) {
 if (text.includes(key)) {
 swap = exerciseSwaps[key];
 break;
 }
 }

 if (!swap) {
 if (workoutPlan?.days) {
 return `سؤال ممتاز عن تبديل التمارين! 

عندك ${workoutPlan.days.length} أيام تدريب. للتبديل:
1. اذهب لصفحة "خطتي"
2. افتح برنامج التمارين
3. اضغط زر "استبدال" بجانب التمرين

أو اسألني عن تمرين محدد مثل:
• "بدل السكوات بإيه؟"
• "بديل بنش بريس للمنزل"

وأقترح بديل بنفس العضلة والحجم.`;
 }
 return `لتبديل تمرين معين، اذهب لصفحة "خطتي" واضغط زر "استبدال" بجانب التمرين.

أو اسألني عن تمرين محدد مثل "بدل السكوات" وأقترح بديل مناسب.`;
 }

 return ` تبديل ${swap.from} بـ ${swap.to}:

 العضلات المستهدفة: ${swap.muscle}
 الحجم: ${swap.sets} مجموعات × ${swap.reps} تكرار (نفس الأصلي)
⏱ الراحة: نفس الفترة

 ${swap.note}

للتبديل الفعلي، اذهب لصفحة "خطتي" واضغط زر "استبدال" على التمرين، أو اطلب مني مباشرة.`;
}

