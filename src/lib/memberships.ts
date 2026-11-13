/**
 * Membership tiers for Alkemos platform.
 *
 * 4 levels (prices unchanged — owner order 2026-11-14 «إعادة هيكلة سياسة
 * الذكاء الاصطناعي والاشتراكات والأرصدة» + التوضيح المُصحِّح + أمر الاستكمال
 * 2026-11-14 «استكمال تطوير نظام الحصص الشهرية» — الوثيقة الحاكمة
 * docs/AI-QUOTAS-POLICY-2026-11-14.md):
 *   - Free:     the full free product (tools, libraries, content, EVO chat
 *               10 msgs/day) — NO AI plan generation or swaps (0 quotas)
 *   - Premium:  $14.99/mo or $119/yr — 4 plan generations + 8 swaps per
 *               month + full EVO chat
 *   - Pro:      $29.99/mo or $239/yr — 8 generations + 16 swaps/mo, no ads
 *   - Coaching: $39.99/mo or $359/yr — personal coach + ALL Pro benefits
 *
 * AI MONTHLY QUOTAS LAW (owner order 2026-11-14 — the completion order:
 * TWO unified quotas ONLY, never credits/wallets, never per-type splits):
 *   - ONE UNIFIED monthly generation quota per identity — nutrition +
 *     workout generations COMBINED: free 0 · premium 4 · pro 8 · coaching 8.
 *     FREE = 0 (subscriber-only generation); guests have no quota path.
 *   - ONE UNIFIED monthly swap quota per identity — meal + exercise swaps
 *     COMBINED (the completion order §1/§2: «التبديلات حصة موحدة… سواء كانت
 *     تبديل وجبة أو تمرين» — no per-type split): free 0 · premium 8 ·
 *     pro 16 · coaching 16. Generation and swap quotas are FULLY
 *     INDEPENDENT (exhausting one never gates the other).
 *   - ONLY successful operations deduct quota (one ai_plan_usage /
 *     plan_swaps success row each — job_ref UNIQUE since migration 0110
 *     so nothing is ever deducted twice); failures never burn quota.
 *   - RENEWAL follows the SUBSCRIPTION CYCLE: each subscription's monthly
 *     window is anchored at its own start_date anniversary (tier-limits.ts
 *     owns the parallel-entitlement law — early renewal extends the same
 *     row and never resets remaining quotas; an upgrade runs parallel to
 *     the old subscription without touching it).
 *   - Both quotas keep the AGGREGATED STACKING (owner order 2026-10-28 +
 *     completion order §4 «يستفيد العميل من حقوق الاشتراكين»): premium 4+8
 *     alongside pro 8+16 for the overlap of the entitled periods.
 *   - Quotas are SEPARATE from the permanent subscription benefits (chat,
 *     ads, export, capacities): those never burn quota, quota exhaustion
 *     never gates them — and quota exhaustion offers the EXISTING payment
 *     path for renewal or upgrade (renewalCheckoutUrlFor/upgrade
 *     CheckoutUrlFor below).
 * Other limits reset monthly. Ads show on Free + Premium tiers only
 * (Pro+ are ad-free).
 */

// Phase 195 (owner directive): the library counts derive from the verified
// client-safe constants (pinned to the real arrays by library-counts.test.ts)
// so they grow automatically with the platform. "+" = content volume only;
// membership limits below NEVER take "+" (0/4/8/8 generations, 0/8/16/16
// swaps, 10 msgs).
import { EXERCISES_COUNT } from "@/lib/exercises-shared";
import { FOODS_COUNT } from "@/lib/foods-shared";
import { TOOLS_COUNT } from "@/lib/tools-shared";

const EX_PLUS = `${EXERCISES_COUNT.toLocaleString("en-US")}+`;
const FOODS_PLUS = `${FOODS_COUNT.toLocaleString("en-US")}+`;

export type MembershipTier = "free" | "premium" | "pro" | "coaching";

export type MembershipLimits = {
  // EVO chat
  evoChatDailyLimit: number | null; // null = unlimited
  // UNIFIED AI plan-generation quota (owner decree 2026-09-13, developed
  // by the 2026-11-14 orders): ONE monthly quota for nutrition + workout
  // generations COMBINED, success-only (ai_plan_usage ledger), renewed
  // on the subscription cycle window. free = 0 → subscriber-only.
  aiPlanMonthlyLimit: number;
  // UNIFIED monthly swap quota (completion order 2026-11-14 §2: «التبديلات
  // حصة موحدة: كل عملية تبديل ناجحة تستهلك حصة واحدة، سواء كانت تبديل
  // وجبة أو تمرين» — the retired per-type split is gone): meal + exercise
  // swaps COMBINED, success-only (plan_swaps ledger), renewed on the
  // subscription cycle window. free = 0 → subscriber-only.
  evoSwapMonthlyLimit: number;
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
   *  Coaching = Personal Coach + AI. Presentation-only — limits stay
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
      // Monthly generation quota (2026-11-14 corrective order): free = 0 —
      // plan generation is subscriber-only. Everything else on the
      // platform stays free (tools, libraries, content, EVO chat 10/day).
      aiPlanMonthlyLimit: 0,
      // Unified monthly swap quota (completion order §1): free = 0 —
      // swaps are subscriber-only, like generation.
      evoSwapMonthlyLimit: 0,
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
      "توليد الخطط والتبديلات بالذكاء الاصطناعي: متاح لاشتراكات بريميوم وأعلى (حصص شهرية تتجدد مع دورة الاشتراك)",
      "بالحساب المجاني: حفظ دائم لخططك ومزامنتها عبر أجهزتك",
      "EVO: 10 رسائل يوميًا",
      "مخطط الوجبات اليدوي (3 وجبات، حفظ 1 جدول)",
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
      "AI plan generation & swaps: available to Premium-and-above subscriptions (monthly quotas that renew with your subscription cycle)",
      "With a free account: plans saved permanently & synced across your devices",
      "EVO: 10 messages a day",
      "Manual Meal Planner (3 meals, save 1 plan)",
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
      // Monthly generation quota (2026-09-13 decree, kept by the 2026-11-14
      // corrective order): 4 successful AI plan generations/month,
      // nutrition + workout combined.
      aiPlanMonthlyLimit: 4,
      // Unified monthly swap quota (completion order 2026-11-14 §1: 8 —
      // meal or exercise swaps from the SAME quota, never split).
      evoSwapMonthlyLimit: 8,
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
      "كل مميزات الباقة المجانية",
      "EVO: محادثة غير محدودة",
      "توليد 4 خطط بالذكاء الاصطناعي شهريًا (تغذية أو تمرين من الحصة نفسها)",
      "8 تبديلات شهريًا (وجبات أو تمارين من الحصة نفسها) — حصة مستقلة عن التوليد تتجدد مع دورة الاشتراك",
      "إدارة أوسع لخططك ومحفوظاتك: سعة أكبر وتصدير كامل",
      "EVO: محادثتك محفوظة وتُستعاد عبر أجهزتك",
      "مخطط الوجبات (6 وجبات، حفظ 10)",
      "حفظ 50 نتيجة + تحميل",
    ],
    featuresEn: [
      "All Free features",
      "EVO: unlimited chat",
      "AI plans: 4 generations/month (nutrition or workout, one quota)",
      "8 swaps/month (meal or exercise, one quota) — independent from generation, renewing with your subscription cycle",
      "Broader management for your plans & saves: bigger capacity, full export",
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
    // pool"-style multipliers anywhere. Numbers per the completion order
    // 2026-11-14 (§1): 8 generations + 16 unified swaps.
    taglineAr: "كيّف خططك وارتقِ: توليد 8 خطط بالذكاء الاصطناعي شهريًا و16 تبديلًا شهريًا (وجبات أو تمارين)، بلا إعلانات",
    taglineEn: "Adapt & optimize: 8 AI plan generations/month, 16 swaps/month (meal or exercise), ad-free",
    limits: {
      evoChatDailyLimit: null,
      // Monthly generation quota (2026-09-13 decree, kept by the 2026-11-14
      // corrective order): 8 successful AI plan generations/month,
      // nutrition + workout combined — 2× Premium.
      aiPlanMonthlyLimit: 8,
      // Unified monthly swap quota (completion order 2026-11-14 §1: 16 —
      // meal or exercise swaps from the SAME quota, never split).
      evoSwapMonthlyLimit: 16,
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
      "كل مميزات بريميوم",
      "توليد 8 خطط بالذكاء الاصطناعي شهريًا (تغذية أو تمرين من الحصة نفسها)",
      "16 تبديلًا شهريًا (وجبات أو تمارين من الحصة نفسها) — حصة مستقلة عن التوليد تتجدد مع دورة الاشتراك",
      "مخطط الوجبات (8 وجبات، 50 جدول)",
      "200 نتيجة محفوظة + تحميل",
      "بدون إعلانات",
    ],
    featuresEn: [
      "All Premium features",
      "AI plans: 8 generations/month (nutrition or workout, one quota)",
      "16 swaps/month (meal or exercise, one quota) — independent from generation, renewing with your subscription cycle",
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
    taglineAr: "مدرب خاص يتابعك خطوة بخطوة + كل قوة الذكاء الاصطناعي",
    taglineEn: "A personal coach in your corner + the full power of AI",
    limits: {
      // Spec 2026-09-13: coaching = personal coach + AI AND "كل مزايا Pro" —
      // every Pro limit is inherited (unified 8-generation monthly quota,
      // unified 16-swap monthly quota, 200 saved results, pattern analysis,
      // premium content, 8-meal planner with 50 saves, NO ads) plus the
      // personal-coach surfaces.
      evoChatDailyLimit: null,
      aiPlanMonthlyLimit: 8,
      evoSwapMonthlyLimit: 16,
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
      "كل مميزات برو",
      "توليد 8 خطط بالذكاء الاصطناعي شهريًا (تغذية أو تمرين من الحصة نفسها)",
      "16 تبديلًا شهريًا (وجبات أو تمارين من الحصة نفسها) — حصة مستقلة عن التوليد تتجدد مع دورة الاشتراك",
      "خطط تغذية وتمرين من مدرب خاص",
      "EVO: محادثة غير محدودة وذاكرة دائمة",
      "متابعة أسبوعية بتذكير تلقائي",
      "تبديلات يدوية من المدرب",
      "تواصل مباشر مع المدرب",
      "دعم أولوية",
    ],
    featuresEn: [
      "All Pro features",
      "AI plans: 8 generations/month (nutrition or workout, one quota)",
      "16 swaps/month (meal or exercise, one quota) — independent from generation, renewing with your subscription cycle",
      "Nutrition & workout plans from a personal coach",
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
    // 2026-11-14 corrective order: generation is subscriber-only; the
    // unified monthly quota numbers are unchanged for paid tiers.
    feature: "خطط الذكاء الاصطناعي (تغذية أو تمرين)",
    featureEn: "AI Plans (nutrition or workout)",
    free: "—",
    premium: "4/شهر",
    pro: "8/شهر",
    coaching: "8/شهر",
  },
  {
    // Completion order 2026-11-14 §1/§6: ONE unified swap quota (meal or
    // exercise from the same quota) — the per-type split is retired.
    feature: "التبديلات (وجبة أو تمرين من الحصة نفسها)",
    featureEn: "Swaps (meal or exercise, one quota)",
    free: "—",
    premium: "8/شهر",
    pro: "16/شهر",
    coaching: "16/شهر",
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
    feature: "مدرب خاص",
    featureEn: "Personal Coach",
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
  "4/شهر": "4/mo",
  "8/شهر": "8/mo",
  "16/شهر": "16/mo",
  "✓ بحساب مجاني": "✓ with a free account",
  "3 وجبات، 1 حفظ": "3 meals, 1 save",
  "6 وجبات، 10 حفظ": "6 meals, 10 saves",
  "8 وجبات، 50 حفظ": "8 meals, 50 saves",
};

export function translateCell(value: string, isAr: boolean): string {
  if (isAr) return value;
  return CELL_TRANSLATIONS[value] ?? value;
}

/* ─────────────── QUOTA-EXHAUSTION RENEWAL/UPGRADE LINKS ───────────────
 * AI-QUOTAS completion order 2026-11-14 §3 («عند نفاد حصة التوليد أو
 * التبديلات… توفير رابط مباشر وفعّال لإتمام التجديد أو الترقية، باستخدام
 * مسار الدفع والتجديد الموجود بالفعل»): when a quota is exhausted the
 * member gets a clear message + direct links that ride the EXISTING
 * payment path — the same /checkout?tier=&months= route every
 * memberships-page CTA uses (checkout requires login; the route itself
 * redirects to auth with `next` preserved, so the links are always
 * effective). No new payment surface, no wallets, no quota purchases:
 * renewing the SAME plan extends the SAME subscription row
 * (extend_subscription 0018 — remaining days + quotas are preserved),
 * and upgrading starts a NEW parallel subscription without touching the
 * old one (§4 — both entitlements live side by side).
 * ────────────────────────────────────────────────────────────────────── */

/** The upgrade ladder (§3: «الترقية إلى باقة أعلى» — coaching is the top
 * tier: a coaching member is offered renewal only, never a dead link). */
const UPGRADE_LADDER: Partial<Record<MembershipTier, MembershipTier>> = {
  premium: "pro",
  pro: "coaching",
};

/** Direct checkout link to RENEW the member's current plan (1 month).
 * Returns null for free/guest identities — the subscribe CTA surface
 * (memberships page) covers that case, as before. */
export function renewalCheckoutUrlFor(
  tier: MembershipTier | "guest",
): string | null {
  if (tier === "guest" || tier === "free") return null;
  return `/checkout?tier=${tier}&months=1`;
}

/** Direct checkout link to UPGRADE to the next tier (1 month), or null
 * when the member already holds the top tier (renewal only). */
export function upgradeCheckoutUrlFor(
  tier: MembershipTier | "guest",
): string | null {
  const next = UPGRADE_LADDER[tier as MembershipTier];
  return next ? `/checkout?tier=${next}&months=1` : null;
}
