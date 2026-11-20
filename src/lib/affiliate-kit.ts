/**
 * src/lib/affiliate-kit.ts — the affiliate RECRUITMENT kit, single
 * source (EN + AR).
 *
 * ORGANIC-GROWTH-P1-G (2026-11-21, roadmap
 * docs/organic-growth-system-2026-11-18/10 §P1-G · plan 05-§6): the
 * documented gap — «لا برنامج توظيف شرائح: الشريحة الأعلى قيمة =
 * المدربون وصنّاع المحتوى الذين يتصدرون نية "مدرب اونلاين" عربيًا
 * (فحص 11-18: إنستغرام) — [توصية] صفحة شرائح + قوالب رسائل تواصل
 * (PR خفيف بلا وعود أرقام غير قابلة للتحقق)». Two deliverables, BOTH
 * rendered on the public /affiliate page (acceptance: «كيت منشور
 * بالصفحة»):
 *
 *   1. AFFILIATE_KIT[lang].segments — the highest-value partner
 *      segments with the honest why-it-fits story per segment. The
 *      coaches card carries the «سوقان / two markets» story (05-§5:
 *      B2C eligible subscriptions + B2B referred-coach client
 *      activations — both at 20%), and the section carries the
 *      07-§2 matrix row «صفحة الأفلييت — الأقسام → /memberships +
 *      /coaching + /for-coaches» as ONE contextual crawlable link per
 *      card (locale-aware hrefs resolved by the view — SEO-GEO-4).
 *
 *   2. AFFILIATE_KIT[lang].outreach — ready outreach message templates
 *      for recruiting coaches/creators (an Instagram DM — the 11-18
 *      finding's channel, a WhatsApp message, and an email), with
 *      sender placeholders. They serve BOTH senders: the team (paste
 *      the site link) and a partner inviting a fellow coach (paste the
 *      personal link — every client activation the referred coach pays
 *      earns the inviter 20%, because attribution is permanent).
 *
 * Honesty laws (roadmap field «اعتماد: نصوص قانونية بلا وعود» — the
 * P1-G canary bans the promise phrasings at source level):
 *   - Every number derives from the governing sources: plan prices
 *     from MEMBERSHIPS (memberships.ts — rule 07-§4.3 «الأرقام من
 *     memberships.ts حصرًا»), the 20% rate from COMMISSION_RATE, the
 *     payout threshold from MINIMUM_PAYOUT, the cookie window from
 *     COOKIE_DURATION_DAYS, and the coach activation packages from
 *     COACH_CLIENT_PACKAGES (coach-limits.ts — the same single source
 *     the server debits).
 *   - The derived commissions (3.00/6.00/8.00 on the plans · 1.20/3.20
 *     on the activation packages) are round(COMMISSION_RATE × amount)
 *     — pure arithmetic on published numbers, pinned by the canary
 *     against the REAL constants (the P1-A/P1-H دبابيس حسابية
 *     precedent).
 *   - «قد أكسب عمولة / may earn a commission» + «المؤهلة / eligible»
 *     everywhere; commissions are recorded when payment is confirmed
 *     (the page's standing wording — never earlier).
 *
 * MSA law: the Arabic copy is Pan-Arab Modern Standard Arabic with
 * zero bare Latin beyond the Alkemos brand («إنستجرام · واتساب ·
 * تيليجرام · فيسبوك» — the site's published vocabulary), guarded by
 * the marketing-msa-surface manifest (this file joined it in the same
 * frame — the affiliate-faq.ts precedent).
 */

import { MEMBERSHIPS } from "@/lib/memberships";
import {
  COMMISSION_RATE,
  MINIMUM_PAYOUT,
  COOKIE_DURATION_DAYS,
} from "@/lib/affiliate-constants";
import { COACH_CLIENT_PACKAGES } from "@/lib/coach-limits";

// ─────────────────────────────────────────────────────────────────────────
// Number derivation — from the governing sources ONLY (no hand-typed
// money figures anywhere in this module)
// ─────────────────────────────────────────────────────────────────────────

/** A paid plan's monthly price from MEMBERSHIPS (07-§4.3 single source). */
function planMonthly(tier: "premium" | "pro" | "coaching"): number {
  const m = MEMBERSHIPS.find((p) => p.id === tier);
  if (!m || !m.priceMonthly) {
    // Structural impossibility (all three tiers are paid), but the kit
    // must never silently ship a wrong number.
    throw new Error(`[affiliate-kit] missing paid plan: ${tier}`);
  }
  return m.priceMonthly;
}

/** The published coach-activation packages ($6 / 1 month · $16 / 3). */
const COACH_PKG_MONTH = COACH_CLIENT_PACKAGES[0]; // { months: 1, priceUsd: 6 }
const COACH_PKG_QUARTER = COACH_CLIENT_PACKAGES.find(
  (p) => p.months === 3,
) ?? COACH_CLIENT_PACKAGES[0]; // { months: 3, priceUsd: 16 }

/**
 * The activation-fee figures that gain EGP twins on the coaches card
 * (EGP-DISPLAY law: activation fees are PRICES the coach pays — the
 * commissions 1.20/3.20 are earnings and stay pure USD, exactly like
 * the page's standing commission examples).
 */
export const COACH_ACTIVATION_TWIN_AMOUNTS: readonly number[] = [
  COACH_PKG_MONTH.priceUsd,
  COACH_PKG_QUARTER.priceUsd,
];

/**
 * Resolve a kit link kind to its locale-aware href (SEO-GEO-4: the /ar
 * mirrors) — the tool-chain-bridge locale-aware link precedent.
 */
export function affiliateKitLinkHref(
  kind: AffiliateKitLinkKind,
  isAr: boolean,
): string {
  const base = {
    for_coaches: "/for-coaches",
    memberships: "/memberships",
    coaching: "/coaching",
  }[kind];
  return isAr ? `/ar${base}` : base;
}

/** 20% of an amount, rounded to cents (the engine's rounding). */
function commissionOf(usd: number): number {
  return Math.round(usd * COMMISSION_RATE * 100) / 100;
}

/** AR COMMISSION form — always two decimals («3.00$» · «1.20$»), the
 * page's published FAQ style (earnings are cents-precision). */
function commAr(n: number): string {
  return `${n.toFixed(2)}$`;
}

/** EN COMMISSION form — always two decimals ("$3.00" · "$1.20"). */
function commEn(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** AR PRICE/threshold form (integer → «6$», cents → «14.99$») — the
 * page's style for prices and the payout threshold. */
function priceAr(n: number): string {
  return Number.isInteger(n) ? `${n}$` : `${n.toFixed(2)}$`;
}

/** EN PRICE/threshold form (integer → "$6", cents → "$14.99"). */
function priceEn(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

/** The three earning products the 07-§2 matrix row names for this page. */
export type AffiliateKitLinkKind = "for_coaches" | "memberships" | "coaching";

export type AffiliateSegment = {
  /** Stable id. */
  id: "coaches" | "nutrition" | "creators" | "communities";
  /** Card title. */
  title: string;
  /** Why the program fits this segment (honest, numbers from source). */
  pitch: string;
  /** What this segment honestly shares. */
  share: string;
  /** ONE contextual crawlable product link (07-§2 matrix row) or null. */
  link: { kind: AffiliateKitLinkKind; label: string } | null;
};

export type OutreachTemplate = {
  /** Stable id. */
  id: "instagram_dm" | "whatsapp" | "email";
  /** Localised template title. */
  title: string;
  /** Recommended channel note. */
  platform: string;
  /** The ready message (with sender placeholders — copyable verbatim). */
  body: string;
};

export type AffiliateKitCopy = {
  /** ── Segments section (قسم الشرائح) ── */
  segmentsTitle: string;
  segmentsSubtitle: string;
  segments: AffiliateSegment[];
  /** ── Outreach kit section (كيت التوظيف) ── */
  kitTitle: string;
  kitSubtitle: string;
  kitNote: string;
  outreach: OutreachTemplate[];
  /** CopyButton labels for the outreach blocks. */
  copyLabel: string;
  copiedLabel: string;
  copyErrorLabel: string;
  /** aria prefix for the copyable body blocks. */
  bodyAriaLabel: string;
};

// ─────────────────────────────────────────────────────────────────────────
// The kit (EN + AR)
// ─────────────────────────────────────────────────────────────────────────

export const AFFILIATE_KIT: Record<"en" | "ar", AffiliateKitCopy> = {
  ar: {
    segmentsTitle: "شرائح الشركاء الأعلى قيمة",
    segmentsSubtitle:
      "البرنامج مفتوح للجميع، وهذه الشرائح الأربع التي يخدمها أفضل من غيرها — لكل شريحة قصتها مع المنصة وما تشاركه بأمانة.",
    segments: [
      {
        id: "coaches",
        title: "المدربون — الشريحة الأعلى قيمة",
        pitch:
          "سوقان يعملان لك من رابط واحد: عمولة 20% على اشتراكات جمهورك المؤهلة " +
          `(${commAr(commissionOf(planMonthly("premium")))} عن عضوية بريميوم · ` +
          `${commAr(commissionOf(planMonthly("coaching")))} عن اشتراك التدريب الأونلاين)، ` +
          "وعمولة 20% على كل رسم تفعيل عملاء يدفعه أي مدرب سجّل عبر رابطك " +
          `(${commAr(commissionOf(COACH_PKG_MONTH.priceUsd))} عن باقة الشهر ` +
          `(${priceAr(COACH_PKG_MONTH.priceUsd)}) و` +
          `${commAr(commissionOf(COACH_PKG_QUARTER.priceUsd))} عن باقة الأشهر الثلاثة ` +
          `(${priceAr(COACH_PKG_QUARTER.priceUsd)})) — ` +
          "تتكرر مع كل تفعيل لأن ربط الإحالة دائم.",
        share:
          "شارك رابطك مع متابعيك وزملائك المدربين. وإن أردت إدارة عملائك على المنصة نفسها فمنصة المدربين بانتظارك: عملاؤك بأسعارك وأموالك بين يديك.",
        link: { kind: "for_coaches", label: "اعرف منصة المدربين" },
      },
      {
        id: "nutrition",
        title: "أخصائيو التغذية",
        pitch:
          "جمهورك يسألك يوميًا عن خطط وجبات وأرقام سعرات. أدوات المنصة المجانية تجيب عن هذه الأسئلة (حاسبات دقيقة ومخطط وجبات ومكتبة خطط جاهزة)، والاشتراك المؤهل عبر رابطك يحسب لك عمولة 20%.",
        share:
          "شارك الأدوات المجانية مع متابعيك أولًا ثم وضّح ما يضيفه الاشتراك — الأدوات مجانية بالكامل والتوصية الصادقة هي ما يبني الثقة.",
        link: { kind: "memberships", label: "شاهد باقات العضوية" },
      },
      {
        id: "creators",
        title: "صنّاع المحتوى",
        pitch:
          "جمهورك يتابعك ليقتدي بك. القوالب الترويجية الجاهزة (منشور طويل · رسالة واتساب · ستوري قصير) والبانرات متاحة بالعربية والإنجليزية — كلها تحمل رابطك مع إفصاح واضح داخل النص نفسه.",
        share:
          "ابدأ بتجربتك الحقيقية للأدوات المجانية ثم اذكر ما يضيفه الاشتراك بوضوح — الإفصاح جزء من القالب لا إضافة عليه.",
        link: { kind: "coaching", label: "التدريب الأونلاين — العمولة الأعلى بين الباقات" },
      },
      {
        id: "communities",
        title: "أصحاب المجتمعات",
        pitch:
          "مجموعة واتساب أو قناة تيليجرام أو مجموعة فيسبوك مهتمة باللياقة والتغذية جمهور مثالي: التوصية تأتي من ثقة المجموعة نفسها، والأدوات مجانية لكل الأعضاء فلا يشعر أحد بأنك تبيع له.",
        share:
          "شارك الأدوات المجانية مع أعضائك، ودع من يريد مزايا إضافية يسجل برابطك — القاعدة الوحيدة الملزمة: التوصية لجمهور حقيقي مهتم.",
        link: null,
      },
    ],
    kitTitle: "كيت التوظيف — قوالب رسائل جاهزة",
    kitSubtitle:
      "قوالب جاهزة للتواصل مع المدربين وصنّاع المحتوى لدعوتهم إلى البرنامج. انسخ القالب، واكتب الاسم، وضع رابطك الشخصي — وإن كنت من فريق Alkemos فضع رابط الموقع. الشريك الذي يدعو مدربًا يحصل على عمولة على كل رسم تفعيل عملائه لأن ربط الإحالة دائم.",
    kitNote:
      "تذكير الأمانة: لا تُضف وعودًا بأرقام دخل أو أي ضمانات — العمولات تُحتسب على عمليات الشراء المؤهلة فقط وتُسجَّل عند تأكيد الدفع.",
    outreach: [
      {
        id: "instagram_dm",
        title: "رسالة إنستجرام مباشرة لمدرب",
        platform: "الرسائل المباشرة على إنستجرام — البداية الموصى بها مع المدربين وصنّاع المحتوى.",
        body: [
          "مرحبًا [اسم المدرب] 👋",
          "",
          "أنا [اسمك]، أتابع محتواك عن التدريب والتغذية. متابعوك يسألونك يوميًا عن خطط جاهزة وأدوات تتبع.",
          "",
          `Alkemos منصة لياقة وتغذية تعمل بالذكاء الاصطناعي: أدوات مجانية بالكامل (حاسبات السعرات والماكروز، مخطط وجبات، مكتبة خطط جاهزة) واشتراكات مدفوعة لمن يريد مزيدًا من التوليد والمتابعة. برنامج الشركاء يمنح عمولة 20% على الاشتراكات المؤهلة (${commAr(commissionOf(planMonthly("premium")))} عن عضوية بريميوم · ${commAr(commissionOf(planMonthly("coaching")))} عن اشتراك التدريب الأونلاين)، وكل رسم تفعيل عملاء يدفعه مدرب سجّل برابطك يحسب لك عمولة أيضًا لأن ربط الإحالة دائم.`,
          "",
          "إن وجدت الأمر مناسبًا لجمهورك ابدأ من هنا: [رابطك]",
          "",
          "(إفصاح: هذا رابط أفلييت — قد أكسب عمولة على عمليات الشراء المؤهلة.)",
        ].join("\n"),
      },
      {
        id: "whatsapp",
        title: "رسالة واتساب لصانع محتوى",
        platform: "الرسائل المباشرة وقوائم البث على واتساب.",
        body: [
          "مرحبًا [اسم صانع المحتوى] 👋",
          "",
          `أنا [اسمك]. أشاركك Alkemos — منصة لياقة وتغذية تعمل بالذكاء الاصطناعي: أدواتها مجانية بالكامل (حاسبات، مخطط وجبات، مكتبة خطط جاهزة)، وبرنامج الشركاء يمنح عمولة 20% على الاشتراكات المؤهلة عبر رابطك، مع ربط دائم لمن يسجل حسابًا وكوكيز ${COOKIE_DURATION_DAYS} يومًا للمشتريات اللاحقة، وحد أدنى للصرف ${priceAr(MINIMUM_PAYOUT)}.`,
          "",
          "لا رسوم انضمام — حساب مجاني ورابطك جاهز في لوحتك بعد التسجيل مباشرة.",
          "",
          "جرّب الأدوات بنفسك أولًا ثم قرر: [رابطك]",
          "",
          "(إفصاح: رابط أفلييت — قد أكسب عمولة على الشراء المؤهل.)",
        ].join("\n"),
      },
      {
        id: "email",
        title: "بريد إلكتروني لصاحب نادٍ أو عيادة تغذية",
        platform: "البريد الإلكتروني الرسمي — النادي أو العيادة أو الجهة المؤسسية.",
        body: [
          "الموضوع: شراكة بعمولة 20% مع Alkemos — منصة اللياقة والتغذية",
          "",
          "مرحبًا [اسم المسؤول]،",
          "",
          "أنا [اسمك]، وأراسلك بشأن برنامج شركاء Alkemos — منصة لياقة وتغذية تعمل بالذكاء الاصطناعي.",
          "",
          "ما يمكنكم مشاركته مع عملائكم ومتابعيكم:",
          "- أدوات مجانية بالكامل: حاسبات (السعرات · الماكروز · مؤشر كتلة الجسم · دهون الجسم) ومخطط وجبات ومكتبة خطط جاهزة.",
          `- اشتراكات مدفوعة تبدأ من ${priceAr(planMonthly("premium"))} شهريًا.`,
          "",
          `العمولة: 20% على كل اشتراك مؤهل يُسجَّل عبر رابطكم ويُؤكَّد دفعه — مثلًا ${commAr(commissionOf(planMonthly("premium")))} عن عضوية بريميوم (${priceAr(planMonthly("premium"))}) و${commAr(commissionOf(planMonthly("coaching")))} عن اشتراك التدريب الأونلاين (${priceAr(planMonthly("coaching"))}). ولمن يرشح مدربين: كل رسم تفعيل عملاء يدفعه المدرب المسجل برابطكم يحسب لكم عمولة 20% (${commAr(commissionOf(COACH_PKG_MONTH.priceUsd))} عن باقة الشهر · ${commAr(commissionOf(COACH_PKG_QUARTER.priceUsd))} عن باقة الأشهر الثلاثة) لأن ربط الإحالة دائم. الحد الأدنى للصرف ${priceAr(MINIMUM_PAYOUT)} ولا رسوم انضمام.`,
          "",
          "الأرقام أمثلة على الأسعار المنشورة ولا تضمن أي دخل — العمولة لا تُسجَّل إلا بعد تأكيد الدفع.",
          "",
          "للبدء: [رابطكم]",
          "",
          "مع التقدير،",
          "[اسمك]",
          "",
          "(إفصاح: رابط أفلييت — قد أكسب عمولة على عمليات الشراء المؤهلة.)",
        ].join("\n"),
      },
    ],
    copyLabel: "نسخ الرسالة",
    copiedLabel: "تم النسخ ✓",
    copyErrorLabel: "تعذر النسخ",
    bodyAriaLabel: "نص الرسالة",
  },

  en: {
    segmentsTitle: "The highest-value partner segments",
    segmentsSubtitle:
      "The program is open to everyone — these are the four segments it serves best, each with its own story with the platform and what it honestly shares.",
    segments: [
      {
        id: "coaches",
        title: "Coaches — the highest-value segment",
        pitch:
          "Two markets work for you from one link: a 20% commission on your audience's eligible subscriptions " +
          `(${commEn(commissionOf(planMonthly("premium")))} from a Premium membership · ` +
          `${commEn(commissionOf(planMonthly("coaching")))} from Personal Coaching), ` +
          "plus 20% of every client-activation fee paid by any coach who signs up through your link " +
          `(${commEn(commissionOf(COACH_PKG_MONTH.priceUsd))} on the 1-month package ` +
          `(${priceEn(COACH_PKG_MONTH.priceUsd)}) and ` +
          `${commEn(commissionOf(COACH_PKG_QUARTER.priceUsd))} on the 3-month package ` +
          `(${priceEn(COACH_PKG_QUARTER.priceUsd)})) — ` +
          "recurring on every activation, because referral attribution is permanent.",
        share:
          "Share your link with your followers and fellow coaches. And if you want to run your own clients on the platform itself, the coaches platform is waiting: your clients, your prices, your money.",
        link: { kind: "for_coaches", label: "Explore the coaches platform" },
      },
      {
        id: "nutrition",
        title: "Nutrition professionals",
        pitch:
          "Your audience asks you daily about meal plans and calorie targets. The platform's free tools answer those questions (accurate calculators, a meal planner, and a library of ready plans), and every eligible subscription through your link earns you 20%.",
        share:
          "Share the free tools with your audience first, then explain what a subscription adds — the tools are completely free, and honest recommendations are what build trust.",
        link: { kind: "memberships", label: "See the membership plans" },
      },
      {
        id: "creators",
        title: "Content creators",
        pitch:
          "Your audience follows you to do what you do. The ready-made promo templates (a long post · a WhatsApp message · a short story caption) and the banners ship in Arabic and English — all carrying your link with a clear disclosure inside the text itself.",
        share:
          "Start with your genuine experience of the free tools, then state clearly what a subscription adds — the disclosure is part of the template, not an add-on.",
        link: { kind: "coaching", label: "Personal Coaching — the highest commission of the plans" },
      },
      {
        id: "communities",
        title: "Community owners",
        pitch:
          "A WhatsApp group, a Telegram channel, or a Facebook group interested in fitness and nutrition is an ideal audience: the recommendation rides the group's own trust, and the tools are free for every member — nobody feels sold to.",
        share:
          "Share the free tools with your members, and let whoever wants extra features sign up through your link — the one binding rule: recommend to a real, interested audience.",
        link: null,
      },
    ],
    kitTitle: "The recruitment kit — ready outreach messages",
    kitSubtitle:
      "Ready templates for reaching out to coaches and content creators and inviting them to the program. Copy the template, write the name, and paste YOUR personal link — if you are on the Alkemos team, paste the site link. A partner who invites a coach earns a commission on every client-activation fee that coach pays, because referral attribution is permanent.",
    kitNote:
      "Honesty reminder: never add income promises or guarantees — commissions apply to eligible purchases only and are recorded once payment is confirmed.",
    outreach: [
      {
        id: "instagram_dm",
        title: "Instagram DM to a coach",
        platform: "Instagram direct messages — the recommended opener with coaches and content creators.",
        body: [
          "Hi [Coach's name] 👋",
          "",
          "I'm [Your name] — I follow your training and nutrition content. Your followers ask you daily for ready plans and tracking tools.",
          "",
          `Alkemos is an AI-powered fitness and nutrition platform: completely free tools (calorie and macro calculators, a meal planner, a library of ready plans) and paid subscriptions for those who want more generation and tracking. The affiliate program pays a 20% commission on eligible subscriptions (${commEn(commissionOf(planMonthly("premium")))} from a Premium membership · ${commEn(commissionOf(planMonthly("coaching")))} from Personal Coaching), and every client-activation fee paid by a coach who signed up through your link earns you a commission too, because referral attribution is permanent.`,
          "",
          "If it fits your audience, start here: [Your link]",
          "",
          "(Disclosure: this is an affiliate link — I may earn a commission on eligible purchases.)",
        ].join("\n"),
      },
      {
        id: "whatsapp",
        title: "WhatsApp message to a creator",
        platform: "WhatsApp direct messages and broadcast lists.",
        body: [
          "Hi [Creator's name] 👋",
          "",
          `I'm [Your name]. Sharing Alkemos with you — an AI-powered fitness and nutrition platform: its tools are completely free (calculators, a meal planner, a library of ready plans), and the affiliate program pays a 20% commission on eligible subscriptions through your link, with permanent attribution for anyone who signs up and a ${COOKIE_DURATION_DAYS}-day cookie for later purchases, plus a ${priceEn(MINIMUM_PAYOUT)} minimum payout.`,
          "",
          "No joining fee — a free account, and your link is ready in your dashboard right after signup.",
          "",
          "Try the tools yourself first, then decide: [Your link]",
          "",
          "(Disclosure: affiliate link — I may earn a commission on eligible purchases.)",
        ].join("\n"),
      },
      {
        id: "email",
        title: "Email to a gym or nutrition practice",
        platform: "Formal email — a gym, a practice, or an institution.",
        body: [
          "Subject: A 20%-commission partnership with Alkemos — the fitness & nutrition platform",
          "",
          "Hello [Owner's name],",
          "",
          "I'm [Your name], writing about the Alkemos partner program — an AI-powered fitness and nutrition platform.",
          "",
          "What you can share with your clients and followers:",
          "- Completely free tools: calculators (calories · macros · BMI · body fat), a meal planner, and a library of ready plans.",
          `- Paid subscriptions starting at ${priceEn(planMonthly("premium"))} per month.`,
          "",
          `The commission: 20% of every eligible subscription registered through your link with payment confirmed — for example ${commEn(commissionOf(planMonthly("premium")))} from a Premium membership (${priceEn(planMonthly("premium"))}) and ${commEn(commissionOf(planMonthly("coaching")))} from Personal Coaching (${priceEn(planMonthly("coaching"))}). For coach referrals: every client-activation fee paid by a coach who registered through your link earns you 20% (${commEn(commissionOf(COACH_PKG_MONTH.priceUsd))} on the 1-month package · ${commEn(commissionOf(COACH_PKG_QUARTER.priceUsd))} on the 3-month package) because referral attribution is permanent. The minimum payout is ${priceEn(MINIMUM_PAYOUT)}, with no joining fee.`,
          "",
          "These numbers are examples on the published prices and guarantee no income — a commission is recorded only after payment is confirmed.",
          "",
          "To start: [Your link]",
          "",
          "Best regards,",
          "[Your name]",
          "",
          "(Disclosure: affiliate link — I may earn a commission on eligible purchases.)",
        ].join("\n"),
      },
    ],
    copyLabel: "Copy message",
    copiedLabel: "Copied ✓",
    copyErrorLabel: "Unable to copy",
    bodyAriaLabel: "Message text",
  },
};
