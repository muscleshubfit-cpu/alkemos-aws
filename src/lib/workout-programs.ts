/**
 * Workout Programs Library — ready-to-use training programs.
 *
 * Programs are organized by:
 *   - location: home (bodyweight, no equipment) | home-equipment (minimal) | gym (full equipment)
 *   - level: beginner | intermediate | advanced
 *   - goal: general | strength | hypertrophy | fat-loss | endurance
 *
 * Each program has a weekly schedule with days, and each day has exercises
 * (referencing exercise slugs from exercises.ts) with sets/reps.
 */

export type ProgramLocation = "home" | "home-equipment" | "gym";
export type ProgramLevel = "beginner" | "intermediate" | "advanced";
export type ProgramGoal = "general" | "strength" | "hypertrophy" | "fat-loss" | "endurance";

export type WorkoutDay = {
  day: number;
  titleAr: string;
  titleEn: string;
  isRest?: boolean;
  exercises: Array<{
    exerciseSlug: string; // references exercises.ts
    nameAr: string; // denormalized for convenience
    nameEn: string;
    sets: number;
    reps: string; // "8-12" or "30s" or "AMRAP"
    restAr: string; // "60 ثانية"
    restEn: string;
  }>;
};

/**
 * PRIORITY-PAGES-2 Implementation (2026-10-19, audit §D-2 + report §9.4-1):
 * per-program decision FAQs — bilingual {ar,en} pairs on the tool-reference
 * FaqItem pattern (structure parity by construction). Rendered as the
 * visible FAQ on the detail page and emitted as FAQPage JSON-LD by both
 * language [slug] layouts (the evo-faq/coaching-faq precedent).
 */
export type ProgramFaqItem = {
  q: { ar: string; en: string };
  a: { ar: string; en: string };
};

export type WorkoutProgram = {
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  /**
   * CONTENT-AUDIT P1-9 (2026-09-28, audit §2.3 + §3-فرص 3): program pages
   * showed the schedule table with almost no editorial context — no
   * quotable definition line for AI citation and no progression guidance
   * (the heart of any training methodology). Each program now carries a
   * methodology paragraph: definition first, then how to progress.
   */
  methodologyAr: string;
  methodologyEn: string;
  /**
   * PRIORITY-PAGES-2 (2026-10-19, audit §D-2 + §9.4-1): the measured gaps
   * one P1-9 paragraph could not close — numeric load progression
   * (start point, increment, stall rule — the quotable numbers), and the
   * for-whom / not-for-whom honesty card with plain-text cross-program
   * pointers. All OPTIONAL so every existing consumer (hub cards,
   * filters, related-programs) is untouched.
   */
  progressionAr?: string;
  progressionEn?: string;
  forWhomAr?: string;
  forWhomEn?: string;
  /** Per-program decision FAQs (see ProgramFaqItem above). */
  faq?: ProgramFaqItem[];
  location: ProgramLocation;
  level: ProgramLevel;
  goal: ProgramGoal;
  durationWeeks: number;
  daysPerWeek: number;
  image: string; // Unsplash photo URL
  imageAltAr: string;
  imageAltEn: string;
  days: WorkoutDay[];
};

export const LOCATION_LABELS: Record<ProgramLocation, { ar: string; en: string; emoji: string }> = {
  home: { ar: "المنزل (بدون معدات)", en: "Home (No Equipment)", emoji: "🏠" },
  "home-equipment": { ar: "المنزل (بمعدات بسيطة)", en: "Home (Minimal Equipment)", emoji: "🏡" },
  gym: { ar: "النادي الرياضي", en: "Gym", emoji: "🏋️" },
};

export const LEVEL_LABELS: Record<ProgramLevel, { ar: string; en: string; color: string }> = {
  beginner: { ar: "مبتدئ", en: "Beginner", color: "#34c759" },
  intermediate: { ar: "متوسط", en: "Intermediate", color: "#ff9500" },
  advanced: { ar: "متقدم", en: "Advanced", color: "#ff3b30" },
};

export const GOAL_LABELS: Record<ProgramGoal, { ar: string; en: string }> = {
  general: { ar: "لياقة عامة", en: "General Fitness" },
  strength: { ar: "قوة", en: "Strength" },
  hypertrophy: { ar: "تضخيم عضلي", en: "Hypertrophy" },
  "fat-loss": { ar: "حرق دهون", en: "Fat Loss" },
  endurance: { ar: "تحمل", en: "Endurance" },
};

// Local images — each program type has its own unique AI-generated image.
// Generated in Apple iPhone product photography style (2026-08-25).
const IMAGES = {
  homeBodyweight: "/images/programs/home-workout.webp",
  homeDumbbell: "/images/programs/home-dumbbell.webp",
  homeCore: "/images/programs/home-core.webp",
  gymBeginner: "/images/programs/gym-beginner.webp",
  gymStrength: "/images/programs/gym-strength.webp",
  gymHypertrophy: "/images/programs/full-gym.webp",
  fatLoss: "/images/programs/hiit.webp",
  cardio: "/images/programs/hiit.webp",
  absCore: "/images/programs/home-core.webp",
  pushDay: "/images/programs/gym-strength.webp",
  pullDay: "/images/programs/gym-beginner.webp",
  legDay: "/images/programs/full-gym.webp",
  fullBody: "/images/programs/gym-beginner.webp",
  upperBody: "/images/programs/gym-strength.webp",
};

export const WORKOUT_PROGRAMS: WorkoutProgram[] = [
  // ==================== HOME — BODYWEIGHT ====================
  {
    slug: "home-beginner-fullbody",
    nameAr: "برنامج المنزل للمبتدئين — كامل الجسم",
    nameEn: "Home Beginner Full Body",
    descriptionAr:
      "برنامج 3 أيام في الأسبوع بوزن الجسم دون أي معدات. مثالي للمبتدئين الذين يبدأون رحلتهم من المنزل.",
    descriptionEn:
      "3-day-per-week bodyweight program with zero equipment. Perfect for beginners starting their fitness journey at home.",
    methodologyAr:
      "برنامج كامل الجسم للمبتدئين يدرّب كل مجموعات العضلات الكبرى في كل جلسة، عادة ثلاث مرات أسبوعيًا. التقدم بإضافة التكرارات أولًا ثم الوزن: عندما تبلغ الحد الأعلى لنطاق التكرارات في كل المجموعات بشكل سليم، أضف أصغر زيادة متاحة (أو تنويعًا أصعب) وابدأ البناء من جديد. ارتح يومًا على الأقل بين الجلسات — العضلة تنمو في الاستشفاء لا في التمرين.",
    methodologyEn:
      "A full-body beginner program trains every major muscle group in each session, typically three times a week. Progress by adding repetitions first, then weight: once you reach the top of an exercise's rep range in every set with clean form, add the smallest load increment (or a harder variation) and build back up. Rest at least one day between sessions — muscle grows during recovery, not during the workout.",
    // PRIORITY-PAGES-2 (audit D-2): the numeric progression the P1-9
    // paragraph generalized — start point, increment, move-up standard.
    progressionAr:
      "التقدم المزدوج بالأرقام: ابدأ من الحد الأدنى لنطاق كل تمرين (مثلًا 8 تكرارات من نطاق 8-12). في كل جلسة تُكمل فيها كل المجموعات بأسلوب سليم أضف تكرارًا واحدًا لكل تمرين؛ وعند بلوغ الحد الأعلى في كل المجموعات انتقل إلى التنويع الأصعب التالي (ضغط أرضي من الركبتين ثم الضغط الكامل ثم ضغط مرتفع الأقدام) وارجع إلى الحد الأدنى. معيار الانتقال: جلستان متتاليتان عند سقف النطاق بلا تعثر — وهذا التدرج وحده كافٍ لأشهر البداية الأولى.",
    progressionEn:
      "Double progression in numbers: start at the bottom of each exercise's range (say 8 reps of an 8-12 range). Every session where all sets complete with clean form, add one rep per exercise; once you reach the top of the range in every set, move to the next harder variation (knee push-up, then full push-up, then feet-elevated) and drop back to the bottom. The move-up standard: two consecutive sessions at the top of the range without a miss — this progression alone carries your first months.",
    forWhomAr:
      "لك إذا كنت مبتدئًا مطلقًا أو عائدًا بعد انقطاع طويل، وتملك ثلاثة أيام وأربعين دقيقة وأرضًا تفرد عليها سجادة — البرنامج يبني عادة التدريب وقاعدة القوة معًا. ليس لك إذا كان هدفك تضخيمًا عضليًا كبيرًا (الأوزان الحرة أسرع طريق — انظر برنامج الدمبل المنزلي أو برامج النادي)، أو كانت لديك إصابة نشطة تحتاج تقييم أخصائي قبل أي حمل.",
    forWhomEn:
      "For you if you are a complete beginner or returning after a long break, with three days, forty minutes, and a patch of floor for a mat — the program builds the training habit and a strength base together. Not for you if your goal is serious muscle size (free weights are the faster route — see the home dumbbell program or the gym programs), or you carry an active injury that needs a professional's assessment before any load.",
    faq: [
      {
        q: {
          ar: "هل أستطيع البدء وأنا بلا أي خلفية رياضية؟",
          en: "Can I start with zero athletic background?",
        },
        a: {
          ar: "نعم — البرنامج مبني لذلك: ابدأ بالنسخ الأسهل من كل حركة (ضغط من الركبتين، بلانك من الركبتين) وبنصف عدد المجموعات في الجلسة الأولى، ثم بكاملها من الثانية. القاعدة الوحيدة: أن تنهي الجلسة وأنت قادر على جلسة بعدها بعد يومين، لا مكسورًا لأسبوع.",
          en: "Yes — the program is built for exactly that: start with the easier version of each movement (knee push-ups, knee planks) and half the prescribed sets in your first session, then the full thing from the second. The one rule: finish each session able to train again two days later, not broken for a week.",
        },
      },
      {
        q: {
          ar: "متى أنتقل إلى برنامج أصعب؟",
          en: "When do I move to a harder program?",
        },
        a: {
          ar: "عندما تُكمل الحد الأعلى لتكرارات كل تمارين اليوم في جلستين متتاليتين بلا تعثر — وعادة بعد ستة إلى ثمانية أسابيع متواصلة يكون وزن الجسم قد استُهلك جزئيًا كمحفز. الترقية الطبيعية بعدها: برنامج الدمبل المنزلي أو برنامج النادي للمبتدئين، وتذكّر أن نصف التغيير الآخر يطبخ في المطبخ لا في التمرين.",
          en: "When you complete the top of the rep range on every exercise of the day in two consecutive sessions without a miss — usually after six to eight consistent weeks, body weight is partially spent as a stimulus. The natural upgrades after that: the home dumbbell program or the gym beginner program — and remember the other half of the change is cooked in the kitchen, not the workout.",
        },
      },
      {
        q: {
          ar: "هل أحتاج حسابًا أو أدوات لمتابعة البرنامج؟",
          en: "Do I need an account or any equipment to follow it?",
        },
        a: {
          ar: "لا معدات إطلاقًا — وزن جسمك هو المعدات. والصفحة نفسها تعمل لكل زائر بلا حساب؛ الحساب المجاني يضيف حفظ الخطط التي تولّدها ومتابعتها من أي جهازك.",
          en: "No equipment at all — your body weight is the equipment. The page itself works for every visitor without an account; a free account adds saving the plans you generate and reaching them from any device.",
        },
      },
    ],
    location: "home",
    level: "beginner",
    goal: "general",
    durationWeeks: 8,
    daysPerWeek: 3,
    image: IMAGES.homeBodyweight,
    imageAltAr: "تمرين منزلي بالوزن",
    imageAltEn: "Bodyweight home workout",
    days: [
      {
        day: 1,
        titleAr: "كامل الجسم (أ)",
        titleEn: "Full Body (A)",
        exercises: [
          { exerciseSlug: "pushups", nameAr: "ضغط أرضي", nameEn: "Push-up", sets: 3, reps: "8-12", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "bodyweight-walking-lunge", nameAr: "طعن متحرك بوزن الجسم", nameEn: "Bodyweight Walking Lunge", sets: 3, reps: "10 لكل رجل", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "plank", nameAr: "بلانك", nameEn: "Plank", sets: 3, reps: "20-30 ثانية", restAr: "45 ثانية", restEn: "45 sec" },
          { exerciseSlug: "mountain-climbers", nameAr: "تسلق الجبل", nameEn: "Mountain Climbers", sets: 3, reps: "20 ثانية", restAr: "45 ثانية", restEn: "45 sec" },
        ],
      },
      {
        day: 2,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 3,
        titleAr: "كامل الجسم (ب)",
        titleEn: "Full Body (B)",
        exercises: [
          { exerciseSlug: "bench-dips", nameAr: "ديبس (على كرسي)", nameEn: "Dips (on chair)", sets: 3, reps: "8-12", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "crossover-reverse-lunge", nameAr: "طعن رجوعي متقاطع", nameEn: "Crossover Reverse Lunge", sets: 3, reps: "10 لكل رجل", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "crunches", nameAr: "كرنش", nameEn: "Crunches", sets: 3, reps: "12-15", restAr: "45 ثانية", restEn: "45 sec" },
          { exerciseSlug: "frog-hops", nameAr: "قفزات الضفدع", nameEn: "Frog Hops", sets: 3, reps: "5-8", restAr: "60 ثانية", restEn: "60 sec" },
        ],
      },
      {
        day: 4,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 5,
        titleAr: "كامل الجسم (ج)",
        titleEn: "Full Body (C)",
        exercises: [
          { exerciseSlug: "pushups", nameAr: "ضغط أرضي", nameEn: "Push-up", sets: 3, reps: "10-15", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "star-jump", nameAr: "قفزة النجمة", nameEn: "Star Jump", sets: 3, reps: "30 ثانية", restAr: "30 ثانية", restEn: "30 sec" },
          { exerciseSlug: "russian-twist", nameAr: "تويست روسي", nameEn: "Russian Twist", sets: 3, reps: "20 ثانية", restAr: "45 ثانية", restEn: "45 sec" },
          { exerciseSlug: "plank", nameAr: "بلانك", nameEn: "Plank", sets: 3, reps: "30-40 ثانية", restAr: "45 ثانية", restEn: "45 sec" },
        ],
      },
      {
        day: 6,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 7,
        titleAr: "راحة / مشي",
        titleEn: "Rest / Walk",
        isRest: true,
        exercises: [],
      },
    ],
  },
  {
    slug: "home-fat-loss-hiit",
    nameAr: "حرق دهون — HIIT منزلي",
    nameEn: "Fat Loss — Home HIIT",
    descriptionAr:
      "برنامج HIIT بأربع حصص أسبوعيًا لهدف حرق الدهون، بجلسات من 20 إلى 30 دقيقة فقط. مخصص للمستوى المتوسط ممن لديهم أساس تدريبي مسبق.",
    descriptionEn:
      "A 4-day/week HIIT program built for fat loss, with 20-30 minute sessions. For intermediate trainees with a training base.",
    methodologyAr:
      "تمارين HIIT تناوب فترات جهد قصيرة مع راحة غير مكتملة لإبقاء نبض القلب مرتفعًا وحرق السعرات بكفاءة. اعمل بجهد تستطيع الاستمرار عليه طول الفترة لا اندفاعة تنطفئ في منتصف الجولة، واعتبر الراحة المذكورة حدًا أعلى: مع تحسن اللياقة قصّر الراحات قبل أن تطوّل فترات الجهد. أيام الاستشفاء جزء من البرنامج وليست فشلًا.",
    methodologyEn:
      "HIIT alternates short work intervals with incomplete recovery to keep your heart rate high and calorie burn efficient. Work at an effort you can hold for the whole interval — not a sprint that dies mid-round — and treat the listed rest as a ceiling: as conditioning improves, shorten the rests before lengthening the work. Recovery days are part of the program, not a failure.",
    progressionAr:
      "تدرّج هذا البرنامج بالأرقام: ابدأ بنسبة جهد إلى راحة 1:1 (مثلًا 30 ثانية عمل مقابل 30 ثانية راحة). كل أسبوعين تكتمل فيهما كل الجلسات قصّر الراحة 5 ثوانٍ (وصولًا إلى 30 ثانية عمل مقابل 15 راحة) قبل أي تفكير في تطويل فترات العمل. داخل كل فترة عدّ تكراراتك: ارتفاع العدد عبر الأسابيع بنفس الجودة هو قياس اللياقة الصادق. السقف: 4 جلسات أسبوعيًا — ما فوق ذلك يأكل من الاستشفاء أكثر مما يضيف للحرق.",
    progressionEn:
      "This program's progression in numbers: start at a 1:1 work-to-rest ratio (say 30 seconds of work for 30 seconds of rest). Every two weeks in which you complete every session, cut the rest by 5 seconds (down to 30 seconds of work for 15 of rest) before ever lengthening the work intervals. Count your reps inside each interval: the count rising across weeks at the same quality is the honest conditioning measure. Ceiling: 4 sessions a week — beyond that you spend recovery faster than you buy burn.",
    forWhomAr:
      "لك إذا كان هدفك حرق الدهون ووقتك قصير (الجلسة 20 إلى 30 دقيقة) وقلبك ومفاصلك سليمان. ليس لك مع حالة قلبية أو ضغط غير منضبط أو إصابة ركبة أو كاحل حادة (المشي المنتظم أولًا)، ولا لمن يظن أن التمارين المكثفة وحدها تذيب الدهون — العجز الغذائي هو المحرك، وحاسبة السعرات أول خطوة.",
    forWhomEn:
      "For you if fat loss is the goal, time is short (sessions run 20-30 minutes), and your heart and joints are healthy. Not for you with a cardiac condition, uncontrolled blood pressure, or an acute knee or ankle injury (regular walking first), nor if you expect the intervals alone to melt fat — the food deficit is the engine, and the calorie calculator is step one.",
    faq: [
      {
        q: {
          ar: "هل التمارين المكثفة كافية وحدها لخسارة الدهون؟",
          en: "Is HIIT alone enough to lose fat?",
        },
        a: {
          ar: "بأمانة: نادرًا. حرق الدهون يقوده عجز سعرات مستدام، والتمارين المكثفة أداة كفاءة ممتازة تُرافق العجز لا تحل محله. المعادلة العملية: جلسة مكثفة أو اثنتان أسبوعيًا مع مشي يومي وعجز معقول من الطعام تتفوق على أي عنصر منها وحده — ابدأ بحساب احتياجك اليومي ثم اختر مستوى خطة غذائية يوازنه.",
          en: "Honestly: rarely. Fat loss is driven by a sustainable calorie deficit, and intense intervals are an excellent efficiency tool that accompanies the deficit rather than replacing it. The practical equation: one or two interval sessions a week with daily walking and a moderate food deficit beats any single element alone — start by calculating your daily needs, then pick a meal-plan level that matches.",
        },
      },
      {
        q: {
          ar: "كم جلسة أسبوعيًا؟ ولماذا سقف أصلًا؟",
          en: "How many sessions a week — and why is there a ceiling?",
        },
        a: {
          ar: "جلستان إلى ثلاث بين المبتدئ والمتوسط، والسقف أربع للمتقدم. فوق ذلك لا يتراكم اللياقة أسرع بل يتراكم الإجهاد: النوم يفسد والشهية ترتفع والأداء ينزل. أيام الراحة داخل الجدول جزء من التصميم لا فشلًا في الالتزام.",
          en: "Two to three sessions between beginner and intermediate, and a ceiling of four for the advanced. Above that, fitness does not accumulate faster — stress does: sleep frays, appetite rises, performance drops. The rest days inside the schedule are part of the design, not a failure of commitment.",
        },
      },
      {
        q: {
          ar: "شعرت بدوار بعد الجولة الثانية — ماذا أفعل؟",
          en: "I felt dizzy after round two — what do I do?",
        },
        a: {
          ar: "أوقف الجلسة واجلس. الأسباب الشائعة: شدة أعلى من لياقتك الحالية (الجهد المستهدف ما تُتم به كل الفترات لا ما ينطفئ به في منتصفها)، أو طعام غير كافٍ قبل الجلسة بساعتين تقريبًا، أو ترطيب ناقص. عد بجهد أقل بعشرين بالمئة وستكمل غالبًا — وإن تكرر الدوار فالفحص الطبي قبل العودة هو القرار الصحيح.",
          en: "Stop the session and sit down. The usual causes: an intensity above your current conditioning (the target effort is one that completes every interval, not one that dies mid-way), too little food in the two hours before, or short hydration. Return at twenty percent less effort and you will likely finish — and if the dizziness repeats, a medical check before coming back is the right call.",
        },
      },
    ],
    location: "home",
    level: "intermediate",
    goal: "fat-loss",
    durationWeeks: 6,
    daysPerWeek: 4,
    image: IMAGES.fatLoss,
    imageAltAr: "تمرين حرق دهون",
    imageAltEn: "Fat loss workout",
    days: [
      {
        day: 1,
        titleAr: "HIIT — كامل الجسم",
        titleEn: "HIIT — Full Body",
        exercises: [
          { exerciseSlug: "frog-hops", nameAr: "قفزات الضفدع", nameEn: "Frog Hops", sets: 5, reps: "40 ثانية جهد / 20 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "mountain-climbers", nameAr: "تسلق الجبل", nameEn: "Mountain Climbers", sets: 5, reps: "40 ثانية جهد / 20 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "star-jump", nameAr: "قفزة النجمة", nameEn: "Star Jump", sets: 5, reps: "40 ثانية جهد / 20 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "fast-skipping", nameAr: "تخطي سريع", nameEn: "Fast Skipping", sets: 5, reps: "40 ثانية جهد / 20 ثانية راحة", restAr: "—", restEn: "—" },
        ],
      },
      {
        day: 2,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 3,
        titleAr: "HIIT — كور + كارديو",
        titleEn: "HIIT — Core + Cardio",
        exercises: [
          { exerciseSlug: "russian-twist", nameAr: "تويست روسي", nameEn: "Russian Twist", sets: 4, reps: "45 ثانية جهد / 15 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "plank", nameAr: "بلانك", nameEn: "Plank", sets: 4, reps: "45 ثانية جهد / 15 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "mountain-climbers", nameAr: "تسلق الجبل", nameEn: "Mountain Climbers", sets: 4, reps: "45 ثانية جهد / 15 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "frog-hops", nameAr: "قفزات الضفدع", nameEn: "Frog Hops", sets: 4, reps: "30 ثانية جهد / 30 ثانية راحة", restAr: "—", restEn: "—" },
        ],
      },
      {
        day: 4,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 5,
        titleAr: "HIIT — أرجل + قوة",
        titleEn: "HIIT — Legs + Strength",
        exercises: [
          { exerciseSlug: "bodyweight-walking-lunge", nameAr: "طعن متحرك بوزن الجسم", nameEn: "Bodyweight Walking Lunge", sets: 5, reps: "45 ثانية جهد / 15 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "pushups", nameAr: "ضغط أرضي", nameEn: "Push-up", sets: 5, reps: "45 ثانية جهد / 15 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "dips-triceps-version", nameAr: "ديبس", nameEn: "Dips", sets: 5, reps: "45 ثانية جهد / 15 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "star-jump", nameAr: "قفزة النجمة", nameEn: "Star Jump", sets: 5, reps: "45 ثانية جهد / 15 ثانية راحة", restAr: "—", restEn: "—" },
        ],
      },
      {
        day: 6,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 7,
        titleAr: "HIIT — تحدي كامل",
        titleEn: "HIIT — Full Challenge",
        exercises: [
          { exerciseSlug: "frog-hops", nameAr: "قفزات الضفدع", nameEn: "Frog Hops", sets: 4, reps: "30 ثانية جهد / 30 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "mountain-climbers", nameAr: "تسلق الجبل", nameEn: "Mountain Climbers", sets: 4, reps: "30 ثانية جهد / 30 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "russian-twist", nameAr: "تويست روسي", nameEn: "Russian Twist", sets: 4, reps: "30 ثانية جهد / 30 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "plank", nameAr: "بلانك", nameEn: "Plank", sets: 4, reps: "30 ثانية جهد / 30 ثانية راحة", restAr: "—", restEn: "—" },
          { exerciseSlug: "fast-skipping", nameAr: "تخطي سريع", nameEn: "Fast Skipping", sets: 4, reps: "30 ثانية جهد / 30 ثانية راحة", restAr: "—", restEn: "—" },
        ],
      },
    ],
  },
  {
    slug: "home-core-specialization",
    nameAr: "تخصص كور منزلي",
    nameEn: "Home Core Specialization",
    descriptionAr:
      "برنامج 4 أيام/أسبوع لتمرين عضلات الجذع والبطن بعمق، مناسب لكل المستويات، ويمكن للمبتدئين تخفيف الأعداد.",
    descriptionEn:
      "4-day/week program for deep core and abs training. Suitable for all levels, beginners can reduce reps.",
    methodologyAr:
      "برنامج تخصص عضلات البطن يبني قوة الجذع بعمل مباشر لعضلات البطن بتواتر أسبوعي أعلى. التكرارات البطيئة مع شد البطن تتفوق على السريعة هنا — جودة الانقباض هي المحفز — والتقدم يعني تنويعات أصعب وزمن توتر أطول لا تكرارات لا نهائية. حافظ على أمان أسفل ظهرك بإلصاقه بالأرض في الحركات المستلقية.",
    methodologyEn:
      "A core specialization program builds trunk strength with direct abdominal work at higher weekly frequency. Slow, braced repetitions beat fast ones here — quality of contraction is the stimulus — and progression means harder variations and longer time under tension, not endless reps. Keep your lower back safe by pressing it into the floor on supine movements.",
    progressionAr:
      "أرقام التدرج: البلانك ابدأه 20 إلى 30 ثانية وأضف 5 ثوانٍ كل أسبوع تكتمل فيه كل المجموعات بوضع سليم؛ عند 60 ثانية انتقل إلى تنويع أصعب (رجل مرفوعة ثم ذراع واحدة) وارجع إلى 30 ثانية. في التمارين التكرارية: نزول مضبوط 3 ثوانٍ لكل تكرار، وعند إتمام الحد الأعلى بهذا البطء انتقل إلى تنويع أصعب لا إلى تكرارات أكثر. التواتر: 3 إلى 4 جلسات أسبوعيًا سقفًا — عضلات الجذع تستشف بين الجلسات كأي عضلة.",
    progressionEn:
      "Progression numbers: start the plank at 20-30 seconds and add 5 seconds each week all sets complete with clean position; at 60 seconds move to a harder variation (one leg raised, then one arm) and drop back to 30. On rep-based movements: a controlled 3-second lowering on every rep, and once you own the top of the range at that tempo, graduate to a harder variation instead of more reps. Frequency: 3-4 sessions a week is the ceiling — the core recovers between sessions like any muscle.",
    forWhomAr:
      "لك إذا كان جذعك نقطة الضعف في رفعاتك أو جلوسك، أو كنت تطلب استقرارًا وقوامًا أفضل لساعات العمل الطويلة. ليس لك إذا كان الهدف ظهور عضلات البطن — الظهور تقوده نسبة دهون الجسم لا حجم تمرين البطن، فحاسبة دهون الجسم ثم خطة غذائية متوازنة هما طريق الظهور، وهذا البرنامج يقوي ما تحتها.",
    forWhomEn:
      "For you if your trunk is the weak link in your lifts or your sitting posture across long work hours, or you are after better stability overall. Not for you if the goal is visible abs — visibility is driven by body-fat percentage, not ab-work volume: the body-fat calculator and then a matched food plan are the road to definition, and this program strengthens what sits underneath.",
    faq: [
      {
        q: {
          ar: "هل تمارين البطن تحرق دهون البطن؟",
          en: "Do ab exercises burn belly fat?",
        },
        a: {
          ar: "لا — استهداف حرق الدهون بموضع التمرين خرافة رفضتها الدراسات لعقود: التمرين يقوي العضلة تحتها، والدهون تُسحب من الجسم كله بعجز سعرات. اعمل عضلات الجذع هنا للتقوية والاستقرار، واخسر الدهون من المطبخ — الاثنان يعملان معًا لا يغني أحدهما عن الآخر.",
          en: "No — spot-reducing fat by exercising the area above it is a myth studies have rejected for decades: the work strengthens the muscle underneath while the fat is drawn from the whole body by a calorie deficit. Train the core here for strength and stability, and lose the fat in the kitchen — the two work together, neither replaces the other.",
        },
      },
      {
        q: {
          ar: "لماذا التكرارات البطيئة تحديدًا؟",
          en: "Why slow reps specifically?",
        },
        a: {
          ar: "لأن الجذع يعمل مقاومةً لا سرعة: الانقباض الكامل تحت شد بلا اندفاعة هو المحفز الحقيقي، والاندفاع ينقل الحمل إلى أوتار الورك والعضلات المساعدة فيسرق من البطن محفزها. ثلاث ثوانٍ نزول مضبوطة تعادل في الأثر تكرارات متسارعة كثيرة بلا تحكم.",
          en: "Because the trunk works by resistance, not speed: the full contraction under tension without momentum is the real stimulus, and rushing hands the load to the hip flexors and assisting muscles, stealing the stimulus from the abs. Three controlled seconds of lowering match the effect of many uncontrolled, faster reps.",
        },
      },
      {
        q: {
          ar: "أسفل ظهري يؤلم أثناء التمرين — أستمر؟",
          en: "My lower back hurts during the moves — push through?",
        },
        a: {
          ar: "الألم علامة توقف لا تجاوز. السبب الشائع تقني: تقوّس قطني في الحركات المستلقية — ألصق أسفل ظهرك بالأرض وثبّته. أوقف التمرين المؤلم، استمر بما لا يؤلم، وعالج التقنية بزمن أقل أو تنويع أسهل — وإن استمر الألم بعد الراحة فتقييم أخصائي قبل العودة هو القرار الصحيح.",
          en: "Pain is a stop sign, not something to push through. The common cause is technical: a lordotic arch on supine moves — press your lower back into the floor and keep it pinned. Drop the movement that hurts, keep what does not, and rebuild the technique at shorter holds or easier variations — and if the pain survives rest, a professional assessment before returning is the right call.",
        },
      },
    ],
    location: "home",
    level: "intermediate",
    goal: "general",
    durationWeeks: 8,
    daysPerWeek: 4,
    image: IMAGES.absCore,
    imageAltAr: "تمرين كور",
    imageAltEn: "Core workout",
    days: [
      {
        day: 1,
        titleAr: "بطن علوي + سفلي",
        titleEn: "Upper + Lower Abs",
        exercises: [
          { exerciseSlug: "crunches", nameAr: "كرنش", nameEn: "Crunches", sets: 4, reps: "15-20", restAr: "30 ثانية", restEn: "30 sec" },
          { exerciseSlug: "mountain-climbers", nameAr: "تسلق الجبل", nameEn: "Mountain Climbers", sets: 4, reps: "30 ثانية", restAr: "30 ثانية", restEn: "30 sec" },
          { exerciseSlug: "plank", nameAr: "بلانك", nameEn: "Plank", sets: 3, reps: "45-60 ثانية", restAr: "45 ثانية", restEn: "45 sec" },
        ],
      },
      {
        day: 2,
        titleAr: "مائلين + ثبات",
        titleEn: "Obliques + Stability",
        exercises: [
          { exerciseSlug: "russian-twist", nameAr: "تويست روسي", nameEn: "Russian Twist", sets: 4, reps: "20-30 ثانية", restAr: "30 ثانية", restEn: "30 sec" },
          { exerciseSlug: "plank", nameAr: "بلانك", nameEn: "Plank", sets: 3, reps: "30 ثانية", restAr: "30 ثانية", restEn: "30 sec" },
          { exerciseSlug: "mountain-climbers", nameAr: "تسلق الجبل", nameEn: "Mountain Climbers", sets: 3, reps: "30 ثانية", restAr: "30 ثانية", restEn: "30 sec" },
        ],
      },
      {
        day: 3,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 4,
        titleAr: "كور كامل + كارديو",
        titleEn: "Full Core + Cardio",
        exercises: [
          { exerciseSlug: "frog-hops", nameAr: "قفزات الضفدع", nameEn: "Frog Hops", sets: 3, reps: "8-10", restAr: "45 ثانية", restEn: "45 sec" },
          { exerciseSlug: "crunches", nameAr: "كرنش", nameEn: "Crunches", sets: 3, reps: "15-20", restAr: "30 ثانية", restEn: "30 sec" },
          { exerciseSlug: "russian-twist", nameAr: "تويست روسي", nameEn: "Russian Twist", sets: 3, reps: "30 ثانية", restAr: "30 ثانية", restEn: "30 sec" },
          { exerciseSlug: "plank", nameAr: "بلانك", nameEn: "Plank", sets: 3, reps: "45-60 ثانية", restAr: "45 ثانية", restEn: "45 sec" },
        ],
      },
      {
        day: 5,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 6,
        titleAr: "بطن متقدم",
        titleEn: "Advanced Abs",
        exercises: [
          { exerciseSlug: "mountain-climbers", nameAr: "تسلق الجبل", nameEn: "Mountain Climbers", sets: 4, reps: "40 ثانية", restAr: "20 ثانية", restEn: "20 sec" },
          { exerciseSlug: "russian-twist", nameAr: "تويست روسي", nameEn: "Russian Twist", sets: 4, reps: "40 ثانية", restAr: "20 ثانية", restEn: "20 sec" },
          { exerciseSlug: "plank", nameAr: "بلانك", nameEn: "Plank", sets: 3, reps: "60 ثانية", restAr: "30 ثانية", restEn: "30 sec" },
          { exerciseSlug: "frog-hops", nameAr: "قفزات الضفدع", nameEn: "Frog Hops", sets: 3, reps: "10-12", restAr: "45 ثانية", restEn: "45 sec" },
        ],
      },
      {
        day: 7,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
    ],
  },

  // ==================== HOME — WITH DUMBBELLS ====================
  {
    slug: "home-dumbbell-ppl",
    nameAr: "Push Pull Legs — دمبل منزلي",
    nameEn: "Push Pull Legs — Home Dumbbell",
    descriptionAr:
      "برنامج PPL بمعدل 6 أيام/أسبوع باستخدام الدمبل فقط، مثالي لمن لديه دمبل في المنزل ويريد بناء العضلات.",
    descriptionEn:
      "6-day/week PPL program using only dumbbells. Ideal for those with dumbbells at home who want to build muscle.",
    methodologyAr:
      "تقسيم Push/Pull/Legs يناوب عائلات الحركة الثلاث عبر الأسبوع، فيتدرب كل جزء مرتين في الدورة مع استشفاء بينهما. أضف وزنًا عندما يصبح الحد الأعلى لنطاق التكرارات تحت السيطرة في كل المجموعات، وأبقِ تكرارًا أو اثنين في الاحتياط في تمارين العزل. النوم والبروتين هما النصف الآخر من البرنامج.",
    methodologyEn:
      "A Push/Pull/Legs split rotates the body's three movement families across the week, so each muscle trains twice per cycle while recovering between hits. Add load when the top of the rep range feels controlled in every set, and keep one or two reps in reserve on isolation work. Sleep and protein are the other half of the program.",
    progressionAr:
      "التقدم المزدوج بالأرقام: ابدأ بوزن يقع عند الحد الأدنى للنطاق في كل المجموعات (مثلًا 8 من نطاق 8-12). أضف تكرارًا واحدًا لكل تمرين في كل جلسة نظيفة، وعند ملكية الحد الأعلى في كل المجموعات ارفع إلى أقرب زيادة دمبل متاحة (عادة 2 إلى 2.5 كجم) وارجع إلى الحد الأدنى. قاعدة التعثر: تمرين بلا أي تقدم جلستين متتاليتين — ثبّت الوزن وعالج النوم والبروتين قبل لمس البرنامج؛ في هذه المرحلة البرنامج نادرًا ما يكون المشكلة.",
    progressionEn:
      "Double progression in numbers: start at a weight landing you at the bottom of the range in all sets (say 8 of 8-12). Add one rep per exercise every clean session, and once you own the top of the range in every set, jump to the nearest available dumbbell increment (typically 2-2.5 kg) and return to the bottom. The stall rule: an exercise with zero progress two sessions in a row — hold the weight and fix sleep and protein before touching the program; at this stage the program is rarely the problem.",
    forWhomAr:
      "لك إذا تجاوزت مرحلة البداية (ثلاثة أشهر التزام فأكثر) وتملك زوج دمبل قابل للتعديل أو مجموعة أوزان، وتستطيع 4 إلى 6 أيام أسبوعيًا. ليس لك كمبتدئ مطلق — الأنماط تُبنى أولًا ثم الأحمال (ابدأ ببرنامج المنزل للمبتدئين) — ولا بلا أي دمبل: برنامج وزن الجسم المقابل هو الخيار عندك.",
    forWhomEn:
      "For you if you are past the beginner stage (three-plus committed months), own a pair of adjustable dumbbells or a weight set, and can train 4-6 days a week. Not for you as a complete beginner — patterns are built first, then load (start with the home beginner program) — nor with no dumbbells at all: the bodyweight counterpart is your pick.",
    faq: [
      {
        q: {
          ar: "ما الدمبل الذي أحتاجه فعلًا؟",
          en: "What dumbbell do I actually need?",
        },
        a: {
          ar: "زوج قابل للتعديل يبدأ من 2-3 كجم ويصل إلى 20 كجم فأكثر يغطي أشهرًا طويلة. القاعدة: التدرج بزيادات صغيرة أهم من أوزان كبيرة محدودة — سقف 15 كجم ثابت سيصبح عنق زجاجة في الرفعات الكبيرة خلال أسابيع، بينما زيادة 2.5 كجم متاحة تعني تقدمًا لا يتوقف.",
          en: "An adjustable pair starting around 2-3 kg and reaching 20 kg or more covers many months. The rule: progression in small jumps beats a limited set of big weights — a fixed 15 kg ceiling becomes a bottleneck on the big lifts within weeks, while an available 2.5 kg jump means progress that does not stall.",
        },
      },
      {
        q: {
          ar: "لماذا يتكرر كل جزء مرتين في الدورة؟",
          en: "Why does each part train twice per cycle?",
        },
        a: {
          ar: "لأن بناء العضل يستجيب للتواتر الموزع أفضل من جلسة واحدة ضخمة: محفزان متوسطان أسبوعيًا لكل عضلة يتفوقان في معظم الأدلة على محفز واحد كبير بنفس عدد المجموعات — وهذا جوهر تقسيم الدفع والسحب والأرجل، سواء دار على ثلاثة أيام أو ستة.",
          en: "Because muscle responds to distributed frequency better than to one giant session: two moderate weekly stimuli per muscle outperform, across most of the evidence, a single large one at the same set count — that is the heart of a push/pull/legs split, whether it rotates over three days or six.",
        },
      },
      {
        q: {
          ar: "أتدرب بالبار بالفعل — هل أتبع هذا البرنامج؟",
          en: "I already train with a barbell — should I follow this one?",
        },
        a: {
          ar: "إن كان البار متاحًا لك فبرامج النادي أوسع درجات تدرجًا: زيادات 2.5 كجم الدقيقة على البار تتفوق على قفزات الدمبل. هذا البرنامج لمن الأثقل المنزلي هو الواقع أو الخيار الأنسب لحياتهم — والمبادئ نفسها، التقدم المزدوج والتواتر، تنقلك بين البرامج بلا خسارة.",
          en: "If a barbell is available to you, the gym programs offer finer progression steps: precise 2.5 kg bar jumps beat dumbbell leaps. This program is for those whose reality or lifestyle makes home dumbbells the right fit — and the same principles, double progression and frequency, carry you between programs without loss.",
        },
      },
    ],
    location: "home-equipment",
    level: "intermediate",
    goal: "hypertrophy",
    durationWeeks: 12,
    daysPerWeek: 6,
    image: IMAGES.homeDumbbell,
    imageAltAr: "تمرين بالدمبل في المنزل",
    imageAltEn: "Dumbbell home workout",
    days: [
      {
        day: 1,
        titleAr: "Push — صدر + أكتاف + ترايسبس",
        titleEn: "Push — Chest + Shoulders + Triceps",
        exercises: [
          { exerciseSlug: "pushups", nameAr: "ضغط أرضي", nameEn: "Push-up", sets: 4, reps: "10-15", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "dumbbell-floor-press", nameAr: "رفرفة دمبل أرضي", nameEn: "Dumbbell Floor Press", sets: 4, reps: "8-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "arnold-dumbbell-press", nameAr: "أرنولد بريس", nameEn: "Arnold Press", sets: 4, reps: "8-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "triceps-pushdown", nameAr: "تمديد ترايسبس بالدمبل", nameEn: "Dumbbell Triceps Extension", sets: 3, reps: "10-15", restAr: "60 ثانية", restEn: "60 sec" },
        ],
      },
      {
        day: 2,
        titleAr: "Pull — ظهر + بايسبس",
        titleEn: "Pull — Back + Biceps",
        exercises: [
          { exerciseSlug: "pullups", nameAr: "عقلة (لو متاح)", nameEn: "Pull-up (if available)", sets: 4, reps: "AMRAP", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "bent-over-two-dumbbell-row", nameAr: "تجديف دمبل", nameEn: "Dumbbell Row", sets: 4, reps: "10-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "dumbbell-bicep-curl", nameAr: "بايسبس دمبل", nameEn: "Dumbbell Curl", sets: 4, reps: "10-15", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "hyperextensions-back-extensions", nameAr: "هايبر", nameEn: "Hyperextensions", sets: 3, reps: "12-15", restAr: "60 ثانية", restEn: "60 sec" },
        ],
      },
      {
        day: 3,
        titleAr: "Legs — أرجل",
        titleEn: "Legs",
        exercises: [
          { exerciseSlug: "dumbbell-lunges", nameAr: "لانجز بالدمبل", nameEn: "Dumbbell Lunges", sets: 4, reps: "10-12 لكل رجل", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "barbell-hip-thrust", nameAr: "هيب ثرست", nameEn: "Hip Thrust", sets: 4, reps: "10-15", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "lying-leg-curls", nameAr: "ليج كيرل", nameEn: "Leg Curl (if available)", sets: 3, reps: "12-15", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "crunches", nameAr: "كرنش", nameEn: "Crunches", sets: 3, reps: "15-20", restAr: "45 ثانية", restEn: "45 sec" },
        ],
      },
      {
        day: 4,
        titleAr: "Push — تكرار",
        titleEn: "Push — Repeat",
        exercises: [
          { exerciseSlug: "pushups", nameAr: "ضغط أرضي", nameEn: "Push-up", sets: 4, reps: "12-15", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "arnold-dumbbell-press", nameAr: "أرنولد بريس", nameEn: "Arnold Press", sets: 4, reps: "10-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "triceps-pushdown", nameAr: "تمديد ترايسبس", nameEn: "Triceps Extension", sets: 3, reps: "12-15", restAr: "60 ثانية", restEn: "60 sec" },
        ],
      },
      {
        day: 5,
        titleAr: "Pull — تكرار",
        titleEn: "Pull — Repeat",
        exercises: [
          { exerciseSlug: "bent-over-two-dumbbell-row", nameAr: "تجديف دمبل", nameEn: "Dumbbell Row", sets: 4, reps: "10-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "dumbbell-bicep-curl", nameAr: "بايسبس دمبل", nameEn: "Dumbbell Curl", sets: 4, reps: "10-15", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "hyperextensions-back-extensions", nameAr: "هايبر", nameEn: "Hyperextensions", sets: 3, reps: "12-15", restAr: "60 ثانية", restEn: "60 sec" },
        ],
      },
      {
        day: 6,
        titleAr: "Legs — تكرار",
        titleEn: "Legs — Repeat",
        exercises: [
          { exerciseSlug: "dumbbell-lunges", nameAr: "طعن بالدمبل", nameEn: "Dumbbell Lunges", sets: 4, reps: "12-15 لكل رجل", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "barbell-hip-thrust", nameAr: "هيب ثرست", nameEn: "Hip Thrust", sets: 4, reps: "12-15", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "crunches", nameAr: "كرنش", nameEn: "Crunches", sets: 3, reps: "15-20", restAr: "45 ثانية", restEn: "45 sec" },
        ],
      },
      {
        day: 7,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
    ],
  },

  // ==================== GYM ====================
  {
    slug: "gym-beginner-fullbody",
    nameAr: "برنامج النادي للمبتدئين — كامل الجسم",
    nameEn: "Gym Beginner Full Body",
    descriptionAr:
      "برنامج 3 أيام/أسبوع في النادي الرياضي لأساسيات بناء القوة والعضلات، يناسب المبتدئين في النادي.",
    descriptionEn:
      "3-day/week gym program for foundational strength and muscle building. Suitable for gym beginners.",
    methodologyAr:
      "برنامج كامل الجسم في النادي يعلّم الأنماط الأساسية بالبار والماكينات بأحمال خفيفة قابلة للتعلم. تقدم خطيًا: زيادات صغيرة كلما وصلت كل المجموعات المحددة إلى أعلى نطاق التكرارات، وكرر الوزن نفسه إذا اختل الشكل. سجل كل جلسة — السجل هو البرنامج نفسه.",
    methodologyEn:
      "A gym-based full-body beginner program teaches the fundamental barbell and machine patterns with light, learnable loads. Progress linearly: small weight jumps whenever every prescribed set reaches the top of the rep range, and repeat a weight when form breaks down. Record every session — the log IS the program.",
    progressionAr:
      "التقدم الخطي بالأرقام: في أول جلسة لكل تمرين اختر وزنًا تُتم به كل المجموعات عند الحد الأدنى للنطاق بأسلوب سليم ويبقى فيه تكرار أو اثنان بالاحتياط — وسجّله. كل جلسة تكتمل بها المجموعات: زد 2.5 كجم على تمارين البار أو أقرب زيادة دمبل أو ماكينة. وإذا فشلت في الزيادة جلستين متتاليتين فثبّت الوزن وابنِ التكرارات داخل النطاق. هذا الخطي يعمل عند المبتدئ الحقيقي 8 إلى 12 أسبوعًا — وسجّل كل جلسة؛ السجل هو البرنامج نفسه.",
    progressionEn:
      "Linear progression in numbers: in your first session per exercise, pick a weight you can lift for every set at the bottom of the range with clean form and a rep or two left in the tank — and write it down. Every session the sets complete: add 2.5 kg on barbell lifts or the nearest dumbbell or machine increment. If you miss the add twice in a row, hold the weight and build reps inside the range. This linearity runs 8-12 weeks in a true beginner — and log every session; the log IS the program.",
    forWhomAr:
      "لك في أول 6 إلى 12 شهر نادٍ — تعلم الأنماط بأحمال تُتقن فيها التقنية هو أفضل استثمار في هذه المرحلة، وكامل الجسم بثلاثة أيام يمنح كل حركة تكرارًا أسبوعيًا عاليًا. ليس لك بعد سنة أو أكثر من الالتزام المتواصل (تقسيم الدفع والسحب المتوسط محفز أنسب)، ولا لمن يريد قوة البار الخالصة بأرقامها — إن كانت تقنيتك جاهزة فبرنامج القوة 5×5 هو الخط التالي.",
    forWhomEn:
      "For you in your first 6-12 months of gym training — learning the patterns at loads you can master is the best investment this phase offers, and full body across three days gives every movement high weekly repetition. Not for you after a year or more of consistent training (the intermediate push/pull/legs split is the fitter stimulus), nor if pure barbell strength is the aim — with your technique already in place, the 5×5 strength program is the next line.",
    faq: [
      {
        q: {
          ar: "هل أحتاج مدربًا لأتعلم الحركات؟",
          en: "Do I need a coach to learn the lifts?",
        },
        a: {
          ar: "ليس شرطًا للبدء: الأوزان التعليمية خفيفة عمدًا، وكل تمرين في الجدول ينقلك إلى صفحة شرحه الكامل بالصور. عمليًا: صوّر نفسك من الجانب وقارن بالأداء الصحيح، وابدأ بوزن يسهل ضبط التقنية فيه. وإن أردت عينًا بشرية على أدائك فالتدريب الأونلاين بمراجعة الفيديو موجود لهذا الغرض تحديدًا.",
          en: "Not a requirement to start: the learning loads are deliberately light, and every exercise in the schedule links to its full how-to page with images. The practical route: film yourself from the side and compare against proper form, starting at a weight where technique is easy to govern. And if you want a human eye on your performance, online coaching with video review exists for exactly that.",
        },
      },
      {
        q: {
          ar: "متى أنتقل إلى تقسيم عضلي؟",
          en: "When do I move to a body-part split?",
        },
        a: {
          ar: "علامتان: تقدم خطي متعثر في معظم التمارين رغم نوم وبروتين سليمين (عادة بعد 8 إلى 12 أسبوعًا)، أو صار جدولك يستوعب 5 إلى 6 أيام. قبلهما التقسيم المبكر يبدد ميزة المبتدئ: التعلم السريع بالتكرار الأسبوعي العالي لكل حركة.",
          en: "Two signs: linear progress stalling across most lifts despite sound sleep and protein (usually after 8-12 weeks), or your schedule growing to fit 5-6 days. Before either, an early split wastes the beginner's edge: fast learning through high weekly repetition of each movement.",
        },
      },
      {
        q: {
          ar: "النادي يرهقني اجتماعيًا — الناس تنظر. ماذا أفعل؟",
          en: "The gym feels socially intimidating — people are watching. What do I do?",
        },
        a: {
          ar: "إحساس شائع يزول بالعادة والأرقام: خطة مكتوبة تعني أنك أعرف من أكثر من حولك بما تفعل. سماعات، وقت ثابت، والبدء بالأوزان الحرة في ساعات الهدوء — وكل من هناك بدأ بأوزانك الخفيفة نفسها يومًا. الملتزم ببرنامه يلفت الاحترام لا الالتفات.",
          en: "A common feeling that habit and numbers dissolve: a written plan means you know exactly what you are doing, better than most of the room. Headphones, a fixed time slot, and starting in the quiet hours — and everyone there began at your light weights one day. The person following their program earns respect, not stares.",
        },
      },
    ],
    location: "gym",
    level: "beginner",
    goal: "general",
    durationWeeks: 8,
    daysPerWeek: 3,
    image: IMAGES.gymBeginner,
    imageAltAr: "تمرين في النادي الرياضي",
    imageAltEn: "Gym workout",
    days: [
      {
        day: 1,
        titleAr: "كامل الجسم (أ)",
        titleEn: "Full Body (A)",
        exercises: [
          { exerciseSlug: "barbell-bench-press-medium-grip", nameAr: "بنش بريس", nameEn: "Bench Press", sets: 3, reps: "8-10", restAr: "120 ثانية", restEn: "120 sec" },
          { exerciseSlug: "seated-cable-rows", nameAr: "تجديف كابل", nameEn: "Seated Cable Row", sets: 3, reps: "10-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "leg-press", nameAr: "ليج بريس", nameEn: "Leg Press", sets: 3, reps: "10-12", restAr: "120 ثانية", restEn: "120 sec" },
          { exerciseSlug: "plank", nameAr: "بلانك", nameEn: "Plank", sets: 3, reps: "30-45 ثانية", restAr: "45 ثانية", restEn: "45 sec" },
        ],
      },
      {
        day: 2,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 3,
        titleAr: "كامل الجسم (ب)",
        titleEn: "Full Body (B)",
        exercises: [
          { exerciseSlug: "barbell-squat", nameAr: "سكوات بالبار", nameEn: "Barbell Squat", sets: 3, reps: "8-10", restAr: "120 ثانية", restEn: "120 sec" },
          { exerciseSlug: "arnold-dumbbell-press", nameAr: "أرنولد بريس", nameEn: "Arnold Press", sets: 3, reps: "10-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "dumbbell-bicep-curl", nameAr: "بايسبس دمبل", nameEn: "Dumbbell Curl", sets: 3, reps: "10-12", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "triceps-pushdown", nameAr: "ترايسبس بوش داون", nameEn: "Triceps Pushdown", sets: 3, reps: "10-12", restAr: "60 ثانية", restEn: "60 sec" },
        ],
      },
      {
        day: 4,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 5,
        titleAr: "كامل الجسم (ج)",
        titleEn: "Full Body (C)",
        exercises: [
          { exerciseSlug: "barbell-squat", nameAr: "سكوات", nameEn: "Squat", sets: 3, reps: "8-10", restAr: "120 ثانية", restEn: "120 sec" },
          { exerciseSlug: "barbell-bench-press-medium-grip", nameAr: "بنش بريس", nameEn: "Bench Press", sets: 3, reps: "8-10", restAr: "120 ثانية", restEn: "120 sec" },
          { exerciseSlug: "seated-cable-rows", nameAr: "تجديف كابل", nameEn: "Cable Row", sets: 3, reps: "10-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "crunches", nameAr: "كرنش", nameEn: "Crunches", sets: 3, reps: "12-15", restAr: "45 ثانية", restEn: "45 sec" },
        ],
      },
      {
        day: 6,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 7,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
    ],
  },
  {
    slug: "gym-ppl-intermediate",
    nameAr: "Push Pull Legs — نادي رياضي متوسط",
    nameEn: "Push Pull Legs — Gym Intermediate",
    descriptionAr:
      "برنامج PPL كلاسيكي بمعدل 6 أيام/أسبوع في النادي الرياضي للتضخيم العضلي، مناسب للمتدرب المتوسط الذي يريد بناء كتلة عضلية.",
    descriptionEn:
      "Classic 6-day/week PPL gym program for hypertrophy. Suitable for intermediate trainees looking to build muscle mass.",
    methodologyAr:
      "تقسيم Push/Pull/Legs متوسط يضاعف الحجم الأسبوعي لكل عضلة عبر دوران من ستة أيام. أضف الحمل بزيادات صغيرة عندما يثبت سقف نطاق التكرارات في كل المجموعات، وناوب نطاقات التكرارات كل بضعة أسابيع لاستمرار التقدم. خفف الحمل أسبوعًا كاملًا عندما يشكو النوم أو المفاصل.",
    methodologyEn:
      "An intermediate Push/Pull/Legs split doubles weekly volume per muscle across a six-day rotation. Add load in small increments when the rep-range ceiling holds for every set, and rotate rep ranges every few weeks to keep progress going. Take one lighter week when sleep or joints complain.",
    progressionAr:
      "الأرقام الحاكمة: تقدم مزدوج داخل النطاقات المكتوبة — عند ملكية الحد الأعلى في كل المجموعات بأسلوب سليم زد 2.5 كجم على البار أو أقرب زيادة وارجع إلى الحد الأدنى. ناوب نطاقات التكرارات كل 3 إلى 4 أسابيع (مثلًا 8-12 ثم 6-10 في المركّبات) لحفز غير مألوف. وأسبوع تخفيف كل 6 إلى 8 أسابيع: نفس التمارين بأوزان 60 بالمئة ونصف عدد المجموعات — استثمار استشفاء لا تراجع. والنطاق المرجعي للحجم: 10 إلى 20 مجموعة شاقة أسبوعيًا لكل عضلة.",
    progressionEn:
      "The governing numbers: double progression inside the written ranges — once you own the top in every clean set, add 2.5 kg on the bar or the nearest increment and return to the bottom. Rotate rep ranges every 3-4 weeks (8-12 then 6-10 on the compounds) for an unfamiliar stimulus. And a lighter week every 6-8 weeks: the same lifts at 60 percent loads and half the sets — a recovery investment, not a step back. The reference volume range: 10-20 hard sets per muscle per week.",
    forWhomAr:
      "لك بعد سنة أو أكثر من الالتزام، بأسبوع يستوعب 5 إلى 6 أيام وأنماط أساسية متقنة بأحمال معتبرة. ليس لك دون ذلك — الاستشفاء لن يلحق والحجم سيأكل تقنيتك (ابدأ ببرنامج النادي للمبتدئين). وإن كانت أيامك ثلاثًا فقط فالتقسيم نفسه يمشي بدوران على أسبوعين بجلسة لكل جزء أسبوعيًا.",
    forWhomEn:
      "For you after a year or more of consistent training, with a week that fits 5-6 sessions and the basic patterns mastered at respectable loads. Not for you below that — recovery will not keep up and volume will eat your technique (start with the gym beginner program). And if you only have three days, the same split runs as a two-week rotation with each part trained once a week.",
    faq: [
      {
        q: {
          ar: "ستة أيام كثيرة — هل تكفي ثلاثة؟",
          en: "Six days is a lot — do three work?",
        },
        a: {
          ar: "نعم: نفس ترتيب الدفع والسحب والأرجل يمشي بست جلسات على أسبوعين بدل أسبوع واحد، فيتدرب كل جزء مرة أسبوعيًا بدل مرتين. التقدم أبطأ قليلًا والوجهة النهائية قريبة جدًا — والضابط الوحيد ألا تنزل الحجم كله على جلسات تطول عن ساعة ونصف.",
          en: "Yes: the same push/pull/legs order runs as six sessions across two weeks instead of one, so each part trains once a week instead of twice. Progress is slightly slower and the destination is very close — and the one rule is not collapsing the whole volume into sessions that run past ninety minutes.",
        },
      },
      {
        q: {
          ar: "كيف أعرف أن وقت أسبوع التخفيف قد حان؟",
          en: "How do I know it's time for a lighter week?",
        },
        a: {
          ar: "علامتان تجتمعان عادة: تقدم متوقف أسبوعين رغم نوم وطعام سليمين، وواحدة أو أكثر من: نوم متقطع، أوجاع مفاصل صباحية جديدة، نفور من التمرين. الجدول الزمني — كل 6 إلى 8 أسابيع — خطة جيدة، لكن إشارات الجسد أصدق من التقويم.",
          en: "Two signs usually arriving together: progress flat for two weeks despite sound sleep and food, plus one or more of: broken sleep, new morning joint aches, dread of training. The calendar — every 6-8 weeks — is a decent plan, but the body's signals are more honest than the calendar.",
        },
      },
      {
        q: {
          ar: "هل أضيف تمارين لنواقص مثل السمانة وعضلات الجذع؟",
          en: "Can I add work for lagging parts like calves and core?",
        },
        a: {
          ar: "نعم بضابط واحد: إضافاتك تُحسب داخل نطاق الـ10 إلى 20 مجموعة الأسبوعية لكل عضلة، وتوضع نهاية الجلسة ذات الصلة لا بدلًا من تمارينها المركّبة. أربع مجموعات سمانة نهاية يوم الأرجل وثلاث مجموعات جذع نهاية يومي الدفع والسحب نمط شائع ناجح — بشرط ألا يطول التمرين عن ساعة ونصف.",
          en: "Yes, with one guardrail: your additions count inside the 10-20 weekly sets per muscle range, and they go at the end of the related session, not in place of its compounds. Four calf sets to close leg day and three core sets to close push and pull days is a common, working pattern — as long as the session stays under ninety minutes.",
        },
      },
    ],
    location: "gym",
    level: "intermediate",
    goal: "hypertrophy",
    durationWeeks: 12,
    daysPerWeek: 6,
    image: IMAGES.gymHypertrophy,
    imageAltAr: "تضخيم عضلي في النادي الرياضي",
    imageAltEn: "Hypertrophy gym training",
    days: [
      {
        day: 1,
        titleAr: "Push — صدر + أكتاف + ترايسبس",
        titleEn: "Push — Chest + Shoulders + Triceps",
        exercises: [
          { exerciseSlug: "barbell-bench-press-medium-grip", nameAr: "بنش بريس", nameEn: "Bench Press", sets: 4, reps: "6-8", restAr: "120 ثانية", restEn: "120 sec" },
          { exerciseSlug: "arnold-dumbbell-press", nameAr: "أرنولد بريس", nameEn: "Arnold Press", sets: 4, reps: "8-10", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "parallel-bar-dip", nameAr: "ديبس", nameEn: "Dips", sets: 3, reps: "8-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "triceps-pushdown", nameAr: "ترايسبس بوش داون", nameEn: "Triceps Pushdown", sets: 3, reps: "12-15", restAr: "60 ثانية", restEn: "60 sec" },
        ],
      },
      {
        day: 2,
        titleAr: "Pull — ظهر + بايسبس",
        titleEn: "Pull — Back + Biceps",
        exercises: [
          { exerciseSlug: "pullups", nameAr: "عقلة", nameEn: "Pull-up", sets: 4, reps: "6-10", restAr: "120 ثانية", restEn: "120 sec" },
          { exerciseSlug: "seated-cable-rows", nameAr: "تجديف كابل", nameEn: "Seated Cable Row", sets: 4, reps: "10-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "hyperextensions-back-extensions", nameAr: "هايبر", nameEn: "Hyperextensions", sets: 3, reps: "12-15", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "dumbbell-bicep-curl", nameAr: "بايسبس دمبل", nameEn: "Dumbbell Curl", sets: 3, reps: "10-12", restAr: "60 ثانية", restEn: "60 sec" },
        ],
      },
      {
        day: 3,
        titleAr: "Legs — أرجل",
        titleEn: "Legs",
        exercises: [
          { exerciseSlug: "barbell-squat", nameAr: "سكوات بالبار", nameEn: "Barbell Squat", sets: 4, reps: "6-8", restAr: "180 ثانية", restEn: "180 sec" },
          { exerciseSlug: "leg-press", nameAr: "ليج بريس", nameEn: "Leg Press", sets: 4, reps: "10-12", restAr: "120 ثانية", restEn: "120 sec" },
          { exerciseSlug: "lying-leg-curls", nameAr: "ليج كيرل", nameEn: "Leg Curl", sets: 3, reps: "12-15", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "barbell-hip-thrust", nameAr: "هيب ثرست", nameEn: "Hip Thrust", sets: 3, reps: "10-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "crunches", nameAr: "كرنش", nameEn: "Crunches", sets: 3, reps: "15-20", restAr: "45 ثانية", restEn: "45 sec" },
        ],
      },
      {
        day: 4,
        titleAr: "Push — تكرار",
        titleEn: "Push — Repeat",
        exercises: [
          { exerciseSlug: "barbell-bench-press-medium-grip", nameAr: "بنش بريس", nameEn: "Bench Press", sets: 4, reps: "8-10", restAr: "120 ثانية", restEn: "120 sec" },
          { exerciseSlug: "arnold-dumbbell-press", nameAr: "أرنولد بريس", nameEn: "Arnold Press", sets: 4, reps: "10-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "triceps-pushdown", nameAr: "ترايسبس بوش داون", nameEn: "Triceps Pushdown", sets: 3, reps: "12-15", restAr: "60 ثانية", restEn: "60 sec" },
        ],
      },
      {
        day: 5,
        titleAr: "Pull — تكرار",
        titleEn: "Pull — Repeat",
        exercises: [
          { exerciseSlug: "seated-cable-rows", nameAr: "تجديف كابل", nameEn: "Cable Row", sets: 4, reps: "10-12", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "pullups", nameAr: "عقلة", nameEn: "Pull-up", sets: 3, reps: "AMRAP", restAr: "120 ثانية", restEn: "120 sec" },
          { exerciseSlug: "dumbbell-bicep-curl", nameAr: "بايسبس دمبل", nameEn: "Dumbbell Curl", sets: 3, reps: "12-15", restAr: "60 ثانية", restEn: "60 sec" },
        ],
      },
      {
        day: 6,
        titleAr: "Legs — تكرار",
        titleEn: "Legs — Repeat",
        exercises: [
          { exerciseSlug: "barbell-squat", nameAr: "سكوات", nameEn: "Squat", sets: 4, reps: "8-10", restAr: "180 ثانية", restEn: "180 sec" },
          { exerciseSlug: "leg-extensions", nameAr: "ليج إكستنشن", nameEn: "Leg Extension", sets: 3, reps: "12-15", restAr: "60 ثانية", restEn: "60 sec" },
          { exerciseSlug: "lying-leg-curls", nameAr: "ليج كيرل", nameEn: "Leg Curl", sets: 3, reps: "12-15", restAr: "90 ثانية", restEn: "90 sec" },
          { exerciseSlug: "barbell-hip-thrust", nameAr: "هيب ثرست", nameEn: "Hip Thrust", sets: 3, reps: "12-15", restAr: "90 ثانية", restEn: "90 sec" },
        ],
      },
      {
        day: 7,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
    ],
  },
  {
    slug: "gym-strength-5x5",
    nameAr: "قوة 5×5 — نادي رياضي متقدم",
    nameEn: "Strength 5×5 — Gym Advanced",
    descriptionAr:
      "برنامج قوة كلاسيكي 5×5 لرفع الأوزان الثقيلة تدريجيًا. 3 أيام/أسبوع، تركيز على البنش والسكوات والديدليفت. للمتقدمين.",
    descriptionEn:
      "Classic 5×5 strength program for lifting heavy. 3 days/week, focused on bench, squat, and deadlift. For advanced trainees.",
    methodologyAr:
      "برنامج 5×5 يبني القوة بخمس مجموعات ثقيلة من خمس تكرارات في رفعات البار الكبرى. ابدأ بنحو 80% من وزن تستطيع أداء 8 تكرارات نظيفة به، ثم أضف 2.5 كجم على البار كل جلسة تكمل فيها المجموعات الخمس — وبعد جلستين متعثرتين أعد الوزن نفسه مع تخفيض 10%. ارتَح 3–5 دقائق بين المجموعات الثقيلة؛ المجموعة الخامسة يجب أن تكون جهدًا محسوبًا لا نجاة.",
    methodologyEn:
      "A 5×5 program builds strength with five heavy sets of five repetitions on the big barbell lifts. Start around 80% of a weight you could do for eight clean reps, then add 2.5 kg (5 lb) to the bar every session you complete all five sets — and after two stalled sessions, repeat the weight at a 10% reduction. Rest 3–5 minutes between heavy sets; the fifth set should be measured work, not survival.",
    progressionAr:
      "قوانين الأرقام الثلاثة: البداية — وزنًا تُتم به 5×5 بتكرارين بالاحتياط، وعمليًا نحو 80 بالمئة من وزن ترفعه 8 تكرارات نظيفة؛ البدء الأخف أفضل دائمًا من الأثقل. التقدم — زد 2.5 كجم على البار كل جلسة تكتمل مجموعاتها الخمس، والديدليفت يبقى مجموعة واحدة 1×5 كما هو. التعثر — جلسة لا تكتمل: كرر الوزن نفسه؛ تعثر مرتان متتاليتان: أنزل 10 بالمئة وابنِ من جديد. وراحة 3 إلى 5 دقائق بين المجموعات الثقيلة — أقل من ذلك يسرق منك المجموعة الخامسة.",
    progressionEn:
      "The three number laws: Start — a weight you can lift for 5×5 with two reps in reserve, in practice about 80 percent of an 8-clean-rep load; starting lighter always beats heavier. Progress — add 2.5 kg to the bar every session all five sets complete, with the deadlift staying a single 1×5 as written. Stalls — an incomplete session: repeat the weight; two consecutive stalls: drop 10 percent and build back. And 3-5 minutes of rest between heavy sets — less steals from the fifth set.",
    forWhomAr:
      "لك إن كنت تجيد تقنيات البار الثلاث بثبات وتتدرب منذ سنة أو أكثر وتريد أرقامًا تكتبها في دفترك كل أسبوع. ليس لك كمبتدئ — أرقام البار تتطلب تقنية تُبنى أولًا بأحمال أخف، وبرنامج النادي للمبتدئين هو الطريق إليها — ولا لمن يبحث عن مضخة عضلية عالية الحجم: تقسيم الدفع والسحب والأرجل أداة أنسب لذلك.",
    forWhomEn:
      "For you if you handle the three barbell lifts with dependable technique, have trained a year or more, and want weekly numbers you can write in a logbook. Not for you as a beginner — barbell numbers demand technique built first at lighter loads, and the gym beginner program is the road there — nor if you chase high-volume pumps: the push/pull/legs split is the fitter tool for that.",
    faq: [
      {
        q: {
          ar: "لماذا الديدليفت مجموعة واحدة فقط؟",
          en: "Why only one deadlift set?",
        },
        a: {
          ar: "لأنه يأتي بعد خمس مجموعات سكوات في الجلسة نفسها — حملًا مزدوجًا على العمود الفقري والجهاز العصبي. مجموعة واحدة ثقيلة مضبوطة تعطي محفز القوة الكافي عند هذا الحجم دون استنزاف يدفع ثمنه بقية أسبوعك: هذا توازن برنامج 5×5 الكلاسيكي، وسقوط أدائك في الجلسات التالية هو العلامة أن المجموعة الزائدة أغلى من قيمتها.",
          en: "Because it arrives after five sets of squats in the same session — a doubled load on the spine and nervous system. One heavy, disciplined set delivers the strength stimulus this volume needs without a debt the rest of your week pays for: that is the classic 5×5 balance, and your performance dropping in the following sessions is the sign the extra set cost more than it paid.",
        },
      },
      {
        q: {
          ar: "هل أضيف تمارين عزل وإضافات فوق البرنامج؟",
          en: "Should I add isolation and accessory work on top?",
        },
        a: {
          ar: "الحد المعقول: عمل جذع خفيف وسحب مساعد نهاية الجلسة لا ينافسان القانون — البرنامج رفعات ثقيلة أولًا. أما مجموعات العزل الكثيرة فوق ثلاث جلسات قوة فتنافس على الاستشفاء الذي تعيش عليه زيادات الـ2.5 كجم؛ إن أردت حجمًا عضليًا عاليًا فذلك برنامج آخر، وتقسيم الدفع والسحب والأرجل موجود له.",
          en: "The reasonable limit: light core and back-off rows to close a session do not fight the law — this program is heavy lifts first. Piling isolation volume on top of three strength days competes for the very recovery your 2.5 kg jumps live on; if high muscle volume is the goal, that is a different program, and the push/pull/legs split exists for it.",
        },
      },
      {
        q: {
          ar: "متى تنتهي مرحلة 5×5 هذه؟",
          en: "When does this 5×5 phase end?",
        },
        a: {
          ar: "حين تصبح زيادة الـ2.5 كجم متعثرة مرتين في رفعتين مختلفتين بعد إنزال 10 بالمئة وبناء جديد كامل — عندها استُهلك التقدم الخطي وأنت في مستوى قوة حقيقي. التالي الطبيعي برمجة أسبوعية بموجات، وتقسيم الدفع والسحب والأرجل هنا يجمع بين استمرار الحجم والمحافظة على القوة المكتسبة.",
          en: "When the 2.5 kg add stalls twice across two different lifts after a full 10-percent drop and rebuild — at that point the linear run is spent and you are at a genuinely strong place. The natural next step is weekly undulating programming, and the push/pull/legs split here combines continued volume with holding onto the strength you built.",
        },
      },
    ],
    location: "gym",
    level: "advanced",
    goal: "strength",
    durationWeeks: 12,
    daysPerWeek: 3,
    image: IMAGES.gymStrength,
    imageAltAr: "تمرين قوة بالبار",
    imageAltEn: "Barbell strength training",
    days: [
      {
        day: 1,
        titleAr: "تمرين أ",
        titleEn: "Workout A",
        exercises: [
          { exerciseSlug: "barbell-squat", nameAr: "سكوات 5×5", nameEn: "Squat 5×5", sets: 5, reps: "5", restAr: "180 ثانية", restEn: "180 sec" },
          { exerciseSlug: "barbell-bench-press-medium-grip", nameAr: "بنش بريس 5×5", nameEn: "Bench Press 5×5", sets: 5, reps: "5", restAr: "180 ثانية", restEn: "180 sec" },
          { exerciseSlug: "bent-over-barbell-row", nameAr: "تجديف بالبار", nameEn: "Barbell Row", sets: 5, reps: "5", restAr: "120 ثانية", restEn: "120 sec" },
        ],
      },
      {
        day: 2,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 3,
        titleAr: "تمرين ب",
        titleEn: "Workout B",
        exercises: [
          { exerciseSlug: "barbell-squat", nameAr: "سكوات 5×5", nameEn: "Squat 5×5", sets: 5, reps: "5", restAr: "180 ثانية", restEn: "180 sec" },
          { exerciseSlug: "barbell-shoulder-press", nameAr: "أوفرهيد بريس 5×5", nameEn: "Overhead Press 5×5", sets: 5, reps: "5", restAr: "180 ثانية", restEn: "180 sec" },
          { exerciseSlug: "barbell-deadlift", nameAr: "ديدليفت 1×5", nameEn: "Deadlift 1×5", sets: 1, reps: "5", restAr: "—", restEn: "—" },
        ],
      },
      {
        day: 4,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 5,
        titleAr: "تمرين أ — تكرار",
        titleEn: "Workout A — Repeat",
        exercises: [
          { exerciseSlug: "barbell-squat", nameAr: "سكوات 5×5", nameEn: "Squat 5×5", sets: 5, reps: "5", restAr: "180 ثانية", restEn: "180 sec" },
          { exerciseSlug: "barbell-bench-press-medium-grip", nameAr: "بنش بريس 5×5", nameEn: "Bench Press 5×5", sets: 5, reps: "5", restAr: "180 ثانية", restEn: "180 sec" },
          { exerciseSlug: "bent-over-barbell-row", nameAr: "تجديف بالبار", nameEn: "Barbell Row", sets: 5, reps: "5", restAr: "120 ثانية", restEn: "120 sec" },
        ],
      },
      {
        day: 6,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
      {
        day: 7,
        titleAr: "راحة",
        titleEn: "Rest",
        isRest: true,
        exercises: [],
      },
    ],
  },
];

// ==================== Helpers ====================

export function getProgramBySlug(slug: string): WorkoutProgram | undefined {
  return WORKOUT_PROGRAMS.find((p) => p.slug === slug);
}

export function filterPrograms(params: {
  location?: ProgramLocation | "all";
  level?: ProgramLevel | "all";
  goal?: ProgramGoal | "all";
  search?: string;
}): WorkoutProgram[] {
  let result = WORKOUT_PROGRAMS;
  if (params.location && params.location !== "all") {
    result = result.filter((p) => p.location === params.location);
  }
  if (params.level && params.level !== "all") {
    result = result.filter((p) => p.level === params.level);
  }
  if (params.goal && params.goal !== "all") {
    result = result.filter((p) => p.goal === params.goal);
  }
  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.descriptionAr.toLowerCase().includes(q) ||
        p.descriptionEn.toLowerCase().includes(q),
    );
  }
  return result;
}

export function getRelatedPrograms(program: WorkoutProgram, limit = 3): WorkoutProgram[] {
  return WORKOUT_PROGRAMS.filter(
    (p) =>
      p.slug !== program.slug &&
      (p.location === program.location || p.level === program.level || p.goal === program.goal),
  ).slice(0, limit);
}
