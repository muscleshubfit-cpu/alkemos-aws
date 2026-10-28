/**
 * Membership tiers for Alkemos platform.
 *
 * 4 levels (prices updated 2026 to cover Vercel + Supabase + AI +
 * Lemon Squeezy 5%+$0.50 payment fees + profit margin):
 *   - Free:     basic access, limited EVO, 1 meal plan save
 *   - Premium:  $14.99/mo or $119/yr — full EVO chat, limited plan gen
 *   - Pro:      $29.99/mo or $239/yr — full features, no ads
 *   - Coaching: $39.99/mo or $359/yr — human coach + ALL Pro benefits
 *
 * PLAN GENERATION LAW (owner decree 2026-09-13 «البوول الموحد» —
 * spec "Alkemos — Membership & Plan Changes"; zero live subscribers at
 * cutover, owner-approved, so the old per-kind ledger needed no balance
 * migration):
 *   - ONE UNIFIED monthly pool per identity — nutrition + workout
 *     generations COMBINED: free 2 · premium 4 · pro 8 · coaching 8
 *     (coaching inherits every Pro benefit per the spec).
 *   - ONLY successful generations burn the pool (failed attempts,
 *     input edits, navigation, viewing an existing plan = free).
 *   - Guests (not signed in) get the FREE pool — no signup wall; the
 *     signup nudge stays soft (benefits only, never a block).
 *   - The old weekly cap (1+1 / 2+2) is RETIRED with the per-kind split.
 *   - The pool resets on the 1st, UTC. Previously generated plans stay
 *     visible/accessible even after the pool is exhausted.
 *   - AGGREGATED PAID-POOL (owner order 2026-10-28 «تجميع حصص
 *     الاشتراكات المدفوعة» — supersedes the previous best-tier-wins
 *     sizing for the plan pool): a MEMBER's pool is the SUM of every
 *     distinct effectively-active paid tier's aiPlanMonthlyLimit —
 *     Premium (4) + Pro (8) = 12 for the entitled period; usage burned
 *     before the upgrade keeps counting against the aggregate (2 used
 *     → 10 remaining, NOT 6). One contribution per tier per month
 *     (renewals extend the same row — never counted twice); expired or
 *     cancelled-and-lapsed rows stop contributing at end_date. The
 *     enforcement single source: resolveUnifiedPlanPoolLimit() in
 *     src/lib/membership-tier.ts + checkUnifiedPlanQuota() in
 *     src/lib/tier-limits.ts. The per-tier numbers below are the
 *     building blocks (and stay the advertised per-tier pools).
 * Other limits reset monthly. Ads show on Free + Premium tiers only
 * (Pro+ are ad-free).
 */

// Phase 195 (owner directive): the library counts derive from the verified
// client-safe constants (pinned to the real arrays by library-counts.test.ts)
// so they grow automatically with the platform. "+" = content volume only;
// membership limits below NEVER take "+" (2 generations, 3/6 swaps, 10 msgs).
import { EXERCISES_COUNT } from "@/lib/exercises-shared";
import { FOODS_COUNT } from "@/lib/foods-shared";
import { TOOLS_COUNT } from "@/lib/tools-shared";

const EX_PLUS = `${EXERCISES_COUNT.toLocaleString("en-US")}+`;
const FOODS_PLUS = `${FOODS_COUNT.toLocaleString("en-US")}+`;

export type MembershipTier = "free" | "premium" | "pro" | "coaching";

export type MembershipLimits = {
  // EVO chat
  evoChatDailyLimit: number | null; // null = unlimited
  // UNIFIED AI plan-generation pool (owner decree 2026-09-13):
  // ONE monthly budget for nutrition + workout generations COMBINED.
  // Guests get the free-tier pool. Success-only accounting (the ledger
  // is ai_plan_usage, migration 0085).
  aiPlanMonthlyLimit: number;
  // EVO swaps (weekly)
  evoSwapLimit: number | null; // per week
  // EVO advanced features
  evoPatternAnalysis: boolean;
  evoCrossSessionMemory: boolean;
  evoSaveBodyData: boolean;
  // Meal Planner
  mealPlannerMaxMeals: number | null; // max meals per plan
  mealPlannerMaxSaved: number | null; // max saved plans
  mealPlannerExport: boolean;
  // Saved tool results
  savedResultsLimit: number | null;
  savedResultsExport: boolean;
  // Premium content
  premiumContent: boolean;
  // Ads
  adsEnabled: boolean;
};

export type MembershipInfo = {
  id: MembershipTier;
  nameAr: string;
  nameEn: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  /** One-line positioning ladder (owner repositioning 2026-09-13):
   *  Free = Experience → Premium = Manage → Pro = Adapt & Optimize →
   *  Coaching = Human Coach + AI. Presentation-only — limits stay
   *  authoritative in `limits`. */
  taglineAr: string;
  taglineEn: string;
  limits: MembershipLimits;
  features: string[]; // Arabic display strings (used when isAr)
  featuresEn: string[]; // English display strings (used when !isAr)
  highlight: boolean;
  separate: boolean; // true for coaching (not a standard tier)
};

export const MEMBERSHIPS: MembershipInfo[] = [
  {
    id: "free",
    nameAr: "مجاني",
    nameEn: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    taglineAr: "مجاني للأبد — مجموعة كاملة من الأدوات الأساسية",
    taglineEn: "Free forever — a full set of essential tools",
    limits: {
      evoChatDailyLimit: 10,
      // Unified pool (2026-09-13 decree): free = 2 successful AI plan
      // generations/month — guests get the same 2 without any signup.
      aiPlanMonthlyLimit: 2,
      evoSwapLimit: 0,
      evoPatternAnalysis: false,
      evoCrossSessionMemory: false,
      evoSaveBodyData: false,
      mealPlannerMaxMeals: 3,
      mealPlannerMaxSaved: 1,
      mealPlannerExport: false,
      savedResultsLimit: 3,
      savedResultsExport: false,
      premiumContent: false,
      adsEnabled: true,
    },
    features: [
      `تصفح ${EX_PLUS} تمرينًا`,
      `تصفح ${FOODS_PLUS} صنفًا غذائيًا`,
      "تصفح برامج التدريب",
      `${TOOLS_COUNT} أدوات لياقة وتغذية مجانية`,
      "خطط AI: توليدان شهريًا (تغذية أو تمرين) — رصيد مجاني لكل زائر، وتبقى خطتك على جهازك بدون حساب",
      "بالحساب المجاني: حفظ دائم لخططك ومزامنتها عبر أجهزتك",
      "EVO: 10 رسائل يوميًا",
      "مخطط الوجبات (3 وجبات، حفظ 1 جدول)",
      "حفظ 3 نتائج أدوات",
    ],
    featuresEn: [
      `Browse ${EX_PLUS} exercises`,
      `Browse ${FOODS_PLUS} foods`,
      "Browse workout programs",
      // CONTENT-AUDIT P2-3 (audit §1.12): the count is exactly 8 (TOOLS_COUNT)
      // and every other surface states it without "+" — the Free-tier card
      // must not imply more tools than exist.
      `${TOOLS_COUNT} free fitness & nutrition tools`,
      "AI plans: 2 generations/month (nutrition or workout) — a free allowance for every visitor; no account keeps your plan on this device",
      "With a free account: plans saved permanently & synced across your devices",
      "EVO: 10 messages a day",
      "Meal Planner (3 meals, save 1 plan)",
      "Save 3 tool results",
    ],
    highlight: false,
    separate: false,
  },
  {
    id: "premium",
    nameAr: "بريميوم",
    nameEn: "Premium",
    priceMonthly: 14.99,
    priceYearly: 119.0,
    // Owner save-ladder unification (2026-09-13): permanent-save +
    // cross-device sync is the FREE-ACCOUNT benefit (plan-persistence.ts:
    // every signed-in member auto-saves to `plans`) — Premium's own value
    // is the MANAGEMENT delta (bigger capacity, export, chat sync).
    taglineAr: "أدر خططك: سعة حفظ أكبر، تصدير كامل، ومحادثة متزامنة عبر أجهزتك",
    taglineEn: "Manage: bigger save capacity, full export, and chat sync across devices",
    limits: {
      evoChatDailyLimit: null,
      // Unified pool (2026-09-13 decree): 4 successful AI plan
      // generations/month, nutrition + workout combined.
      aiPlanMonthlyLimit: 4,
      evoSwapLimit: 3, // per week
      evoPatternAnalysis: false,
      evoCrossSessionMemory: true,
      evoSaveBodyData: true,
      mealPlannerMaxMeals: 6,
      mealPlannerMaxSaved: 10,
      mealPlannerExport: true,
      savedResultsLimit: 50,
      savedResultsExport: true,
      premiumContent: false,
      adsEnabled: true,
    },
    features: [
      "كل مميزات Free",
      "EVO: محادثة غير محدودة",
      "خطط AI: 4 توليدات شهريًا (تغذية أو تمرين)",
      "إدارة أوسع لخططك ومحفوظاتك: سعة أكبر وتصدير كامل",
      "EVO: 3 تبديلات للوجبات أو التمارين أسبوعيًا",
      "EVO: محادثتك محفوظة وتُستعاد عبر أجهزتك",
      "مخطط الوجبات (6 وجبات، حفظ 10)",
      "حفظ 50 نتيجة + تحميل",
    ],
    featuresEn: [
      "All Free features",
      "EVO: unlimited chat",
      "AI plans: 4 generations/month (nutrition or workout)",
      "Broader management for your plans & saves: bigger capacity, full export",
      "EVO: 3 meal/exercise swaps per week",
      "EVO: chat history synced & restored across devices",
      "Meal Planner (6 meals, save 10)",
      "Save 50 results + export",
    ],
    highlight: false,
    separate: false,
  },
  {
    id: "pro",
    nameAr: "برو",
    nameEn: "Pro",
    priceMonthly: 29.99,
    priceYearly: 239.0,
    // Owner directive (2026-09-13): direct numbers only — no "2× the
    // pool"-style multipliers anywhere.
    taglineAr: "كيّف خططك وارتقِ: 8 توليدات خطط AI شهريًا و6 تبديلات للوجبات أو التمارين أسبوعيًا، بلا إعلانات",
    taglineEn: "Adapt & optimize: 8 AI plan generations/month, 6 meal/exercise swaps per week, ad-free",
    limits: {
      evoChatDailyLimit: null,
      // Unified pool (2026-09-13 decree): 8 successful AI plan
      // generations/month, nutrition + workout combined — 2× Premium.
      aiPlanMonthlyLimit: 8,
      evoSwapLimit: 6,
      evoPatternAnalysis: true,
      evoCrossSessionMemory: true,
      evoSaveBodyData: true,
      mealPlannerMaxMeals: 8,
      mealPlannerMaxSaved: 50,
      mealPlannerExport: true,
      savedResultsLimit: 200,
      savedResultsExport: true,
      premiumContent: true,
      adsEnabled: false,
    },
    features: [
      "كل مميزات Premium",
      "خطط AI: 8 توليدات شهريًا (تغذية أو تمرين)",
      "EVO: 6 تبديلات للوجبات أو التمارين أسبوعيًا لتكييف خططك",
      "مخطط الوجبات (8 وجبات، 50 جدول)",
      "200 نتيجة محفوظة + تحميل",
      "بدون إعلانات",
    ],
    featuresEn: [
      "All Premium features",
      "AI plans: 8 generations/month (nutrition or workout)",
      "EVO: 6 meal/exercise swaps per week to adapt your plans",
      "Meal Planner (8 meals, 50 plans)",
      "200 saved results + export",
      "No ads",
    ],
    highlight: true,
    separate: false,
  },
  {
    id: "coaching",
    nameAr: "التدريب الأونلاين",
    nameEn: "Coaching",
    priceMonthly: 39.99,
    priceYearly: 359.0,
    taglineAr: "مدرب بشري يتابعك خطوة بخطوة + كل قوة الذكاء الاصطناعي",
    taglineEn: "A human coach in your corner + the full power of AI",
    limits: {
      // Spec 2026-09-13: coaching = human coach + AI AND "كل مزايا Pro" —
      // every Pro limit is inherited (unified 8-pool, 6 meal/exercise
      // swaps per week,
      // 200 saved results, pattern analysis, premium content, 8-meal
      // planner with 50 saves, NO ads) plus the human-coach surfaces.
      evoChatDailyLimit: null,
      aiPlanMonthlyLimit: 8,
      evoSwapLimit: 6,
      evoPatternAnalysis: true,
      evoCrossSessionMemory: true,
      evoSaveBodyData: true,
      mealPlannerMaxMeals: 8,
      mealPlannerMaxSaved: 50,
      mealPlannerExport: true,
      savedResultsLimit: 200,
      savedResultsExport: true,
      premiumContent: true,
      adsEnabled: false,
    },
    features: [
      "كل مميزات Pro",
      "خطط AI: 8 توليدات شهرياً (تغذية أو تمرين)",
      "خطط تغذية وتمرين من مدرب بشري",
      "EVO: محادثة غير محدودة وذاكرة دائمة",
      "متابعة أسبوعية بتذكير تلقائي",
      "تبديلات يدوية من المدرب",
      "تواصل مباشر مع المدرب",
      "دعم أولوية",
    ],
    featuresEn: [
      "All Pro features",
      "AI plans: 8 generations/month (nutrition or workout)",
      "Nutrition & workout plans from a human coach",
      "EVO: unlimited chat + persistent memory",
      "Weekly check-in reminders",
      "Manual swaps by the coach",
      "Direct contact with the coach",
      "Priority support",
    ],
    highlight: false,
    separate: true,
  },
];

/**
 * Get membership info by tier ID.
 */
export function getMembership(id: MembershipTier): MembershipInfo | undefined {
  return MEMBERSHIPS.find((m) => m.id === id);
}

/**
 * Get limits for a given tier.
 */
export function getLimits(id: MembershipTier): MembershipLimits {
  const m = getMembership(id);
  return m?.limits || MEMBERSHIPS[0].limits;
}

/**
 * Check if a feature is available for a tier.
 */
export function hasFeature(id: MembershipTier, feature: keyof MembershipLimits): boolean {
  const limits = getLimits(id);
  const val = limits[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  if (val === null) return true; // null = unlimited
  return false;
}

/**
 * Get remaining quota for a feature (null = unlimited).
 */
export function getRemaining(
  id: MembershipTier,
  feature: keyof MembershipLimits,
  used: number,
): number | null {
  const limits = getLimits(id);
  const limit = limits[feature];
  if (limit === null) return null; // unlimited
  if (typeof limit !== "number") return 0;
  return Math.max(0, limit - used);
}

/**
 * Get the display price string.
 */
export function getPriceString(m: MembershipInfo): { monthly: string; yearly?: string } {
  if (m.priceMonthly === 0) {
    return { monthly: "Free" };
  }
  const monthly = `$${(m.priceMonthly ?? 0).toFixed(2)}/mo`;
  const yearly = m.priceYearly ? `$${m.priceYearly.toFixed(2)}/yr` : undefined;
  return { monthly, yearly };
}

/**
 * Comparison table data for display.
 * Each row has `feature` (Arabic) and `featureEn` (English).
 * Cell values are Arabic; use `translateCell()` to get English.
 */
export const COMPARISON_ROWS: Array<{
  feature: string;
  featureEn: string;
  free: string;
  premium: string;
  pro: string;
  coaching: string;
}> = [
  {
    feature: `مكتبة التمارين (${EX_PLUS})`,
    featureEn: `Exercise Library (${EX_PLUS})`,
    free: "✓",
    premium: "✓",
    pro: "✓",
    coaching: "✓",
  },
  {
    feature: `قاعدة بيانات الأطعمة (${FOODS_PLUS})`,
    featureEn: `Food Database (${FOODS_PLUS})`,
    free: "✓",
    premium: "✓",
    pro: "✓",
    coaching: "✓",
  },
  {
    // 2026-09-15 (owner directive — comparison tables must reflect the
    // current service set): ready-made programs are browsable on every
    // tier (Free features list "تصفح برامج التدريب") — now a table row.
    feature: "برامج التدريب الجاهزة",
    featureEn: "Ready-made Programs",
    free: "✓",
    premium: "✓",
    pro: "✓",
    coaching: "✓",
  },
  {
    // 2026-09-15: the row was "حاسبات اللياقة/Fitness Calculators" while
    // the hub serves the full 8-tool cluster (tools-shared.ts) — renamed
    // to the actual service, matching the tier feature lines above.
    feature: `الأدوات المجانية (${TOOLS_COUNT})`,
    featureEn: `Free Tools (${TOOLS_COUNT})`,
    free: "✓",
    premium: "✓",
    pro: "✓",
    coaching: "✓",
  },
  {
    feature: "EVO: المحادثة",
    featureEn: "EVO: Chat",
    free: "10/يوم",
    premium: "غير محدود",
    pro: "غير محدود",
    coaching: "غير محدود",
  },
  {
    feature: "خطط الذكاء الاصطناعي (تغذية أو تمرين)",
    featureEn: "AI Plans (nutrition or workout)",
    free: "2/شهر",
    premium: "4/شهر",
    pro: "8/شهر",
    coaching: "8/شهر",
  },
  {
    feature: "EVO: تبديلات الوجبات والتمارين",
    featureEn: "EVO: Meal & Exercise Swaps",
    free: "—",
    premium: "3/أسبوع",
    pro: "6/أسبوع",
    coaching: "6/أسبوع",
  },
  {
    feature: "ذاكرة EVO (أهدافك وتفضيلاتك)",
    featureEn: "EVO memory (your goals & preferences)",
    free: "✓ بحساب مجاني",
    premium: "✓",
    pro: "✓",
    coaching: "✓",
  },
  {
    feature: "استرجاع سجل المحادثة عبر الأجهزة",
    featureEn: "Cross-device chat-history restore",
    free: "—",
    premium: "✓",
    pro: "✓",
    coaching: "✓",
  },
  {
    feature: "مخطط الوجبات",
    featureEn: "Meal Planner",
    free: "3 وجبات، 1 حفظ",
    premium: "6 وجبات، 10 حفظ",
    pro: "8 وجبات، 50 حفظ",
    coaching: "8 وجبات، 50 حفظ",
  },
  {
    feature: "حفظ نتائج الأدوات",
    featureEn: "Save Tool Results",
    free: "3",
    premium: "50",
    pro: "200",
    coaching: "200",
  },
  {
    feature: "تحميل النتائج",
    featureEn: "Export Results",
    free: "—",
    premium: "✓",
    pro: "✓",
    coaching: "✓",
  },
  {
    feature: "مدرب بشري",
    featureEn: "Human Coach",
    free: "—",
    premium: "—",
    pro: "—",
    coaching: "✓",
  },
  {
    feature: "متابعة أسبوعية",
    featureEn: "Weekly Check-ins",
    free: "—",
    premium: "—",
    pro: "—",
    coaching: "✓",
  },
  {
    feature: "دعم أولوية",
    featureEn: "Priority Support",
    free: "—",
    premium: "—",
    pro: "—",
    coaching: "✓",
  },
];

/**
 * Translate a comparison table cell value to the requested language.
 * Arabic values are stored in the data; this maps them to English.
 * Language-neutral values (✓, —, numbers) pass through unchanged.
 */
const CELL_TRANSLATIONS: Record<string, string> = {
  "10/يوم": "10/day",
  "غير محدود": "Unlimited",
  "2/شهر": "2/mo",
  "4/شهر": "4/mo",
  "8/شهر": "8/mo",
  "3/أسبوع": "3/wk",
  "6/أسبوع": "6/wk",
  "✓ بحساب مجاني": "✓ with a free account",
  "3 وجبات، 1 حفظ": "3 meals, 1 save",
  "6 وجبات، 10 حفظ": "6 meals, 10 saves",
  "8 وجبات، 50 حفظ": "8 meals, 50 saves",
};

export function translateCell(value: string, isAr: boolean): string {
  if (isAr) return value;
  return CELL_TRANSLATIONS[value] ?? value;
}
