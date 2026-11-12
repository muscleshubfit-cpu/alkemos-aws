/**
 * notification-i18n.ts — NOTIF-I18N-250
 *
 * Render-side localization for SYSTEM notifications — the M1 law
 * (lib/error-i18n.ts: localize server text at the DISPLAY layer) applied
 * to the client bell.
 *
 * Live evidence (frame 250 sweep 2026-09-22): an EN-UI member received
 * «تم تفعيل اشتراكك! تم الموافقة على طلب اشتراكك (premium) لمدة 1 أشهر.»
 * — raw Arabic inside the English UI, plus a real grammar bug («1 أشهر»
 * mixes the singular numeral with the plural noun).
 *
 * Design (mirrors error-i18n.ts exactly):
 *   - The DB row keeps its legacy Arabic text at rest (single source,
 *     backward compatible — old rows and free-text coach broadcasts render
 *     verbatim through the honest fallback).
 *   - System creation sites additionally write structured `payload`
 *     fields (migration 0093: payload jsonb, additive).
 *   - Known system `type`s re-render localized title/body from the
 *     catalog + payload at DISPLAY time; anything unknown (or a row whose
 *     payload is missing a required field) falls back to the stored text
 *     verbatim — the fallback is truthful, never a guess.
 */

import { formatDateFor, formatNumberFor, type UiLang } from "@/lib/format-locale";

export type NotificationLang = UiLang;

export type LocalizableNotification = {
  type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown> | null;
};

/** Arabic month phrase law: 1 شهر واحد · 2 شهرين · 3–10 أشهر · 11+ شهرًا */
export function arMonthsPhrase(n: number): string {
  if (n === 1) return "شهر واحد";
  if (n === 2) return "شهرين";
  if (n >= 3 && n <= 10) return `${formatNumberFor(n, "ar")} أشهر`;
  return `${formatNumberFor(n, "ar")} شهرًا`;
}

export function enMonthsPhrase(n: number): string {
  return `${formatNumberFor(n, "en")} month${n === 1 ? "" : "s"}`;
}

const asString = (v: unknown): string =>
  typeof v === "string" || typeof v === "number" ? String(v) : "";

const asMonths = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Canonical model tiers (0045/0046) — the label law matches the stored
// legacy bodies (plan key passthrough for anything unmapped).
const TIER_LABELS: Record<string, { en: string; ar: string }> = {
  free: { en: "Free", ar: "مجاني" },
  premium: { en: "Premium", ar: "بريميوم" },
  pro: { en: "Pro", ar: "برو" },
  coaching: { en: "Coaching", ar: "التدريب الأونلاين" },
  starter: { en: "Starter", ar: "ستارتر" },
  elite: { en: "Elite", ar: "إيليت" },
};

const tierLabel = (tier: string, lang: NotificationLang): string =>
  TIER_LABELS[tier]?.[lang] ?? tier;

const asPrice = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

const asBool = (v: unknown): boolean => v === true || v === "true";

/** `$` stays Latin on purpose (the 250 money-tile law); the digits follow
 * the UI language (ar-EG → Arabic-Indic). */
const usd = (n: number, lang: NotificationLang): string =>
  `$${formatNumberFor(n, lang)}`;

// Affiliate commission source labels — the machine keys mirror the
// emit-site `transaction_type` law; unknown keys keep the generic label
// (the emit-site else branch, mirrored — not a guess).
const COMMISSION_SOURCE_LABELS: Record<string, { en: string; ar: string }> = {
  subscription_initial: { en: "a new subscription", ar: "اشتراك جديد" },
  subscription_renewal: { en: "a subscription renewal", ar: "تجديد اشتراك" },
  coach_client_activation: {
    en: "a referred coach's client activation",
    ar: "تفعيل عميل لمدرب دعوته",
  },
  one_time_product: { en: "a product purchase", ar: "شراء منتج" },
  friend_referral: { en: "a friend referral", ar: "إحالة صديق" },
};

const commissionSourceLabel = (source: string, lang: NotificationLang): string =>
  COMMISSION_SOURCE_LABELS[source]?.[lang] ??
  (lang === "ar" ? "خدمة" : "a service");

type CatalogEntry = {
  title: (p: Record<string, unknown>, lang: NotificationLang) => string;
  body: (p: Record<string, unknown>, lang: NotificationLang) => string;
};

const CATALOG: Record<string, CatalogEntry> = {
  subscription_approved: {
    title: (_p, lang) => (lang === "ar" ? "تم تفعيل اشتراكك!" : "Subscription activated!"),
    body: (p, lang) => {
      const months = asMonths(p.months);
      const tier = asString(p.tier);
      if (months === null || !tier) return "";
      return lang === "ar"
        ? `تمت الموافقة على طلب اشتراكك (${tierLabel(tier, "ar")}) لمدة ${arMonthsPhrase(months)}.`
        : `Your ${tierLabel(tier, "en")} subscription request was approved — ${enMonthsPhrase(months)}.`;
    },
  },
  subscription_rejected: {
    title: (_p, lang) =>
      lang === "ar" ? "تم رفض طلب الاشتراك" : "Subscription request rejected",
    body: (p, lang) => {
      const reason = asString(p.reason).trim();
      const reasonPart = reason ? (lang === "ar" ? ` (${reason})` : ` (${reason})`) : "";
      return lang === "ar"
        ? `تم رفض طلب اشتراكك.${reasonPart} يرجى التواصل مع الدعم.`
        : `Your subscription request was rejected.${reasonPart} Please contact support.`;
    },
  },
  subscription_activated: {
    title: (_p, lang) =>
      lang === "ar" ? "تم تفعيل اشتراكك 🎉" : "Your subscription is active 🎉",
    body: (p, lang) => {
      const months = asMonths(p.months);
      if (months === null) return "";
      const endIso = asString(p.end);
      const end = endIso ? formatDateFor(endIso, lang) : "";
      return lang === "ar"
        ? `مدربك قام بتفعيل اشتراكك لمدة ${arMonthsPhrase(months)}${end ? ` — سارٍ حتى ${end}` : ""}.`
        : `Your coach activated your subscription for ${enMonthsPhrase(months)}${end ? ` — valid until ${end}` : ""}.`;
    },
  },
  plan_activated: {
    title: (_p, lang) => (lang === "ar" ? "تم تفعيل خطة جديدة لك!" : "A new plan is ready!"),
    body: (p, lang) => {
      const kind = asString(p.plan_type);
      if (kind !== "meal" && kind !== "workout") return "";
      return lang === "ar"
        ? kind === "meal"
          ? "خطتك الغذائية الجديدة جاهزة الآن. اطّلع عليها من صفحة خططي."
          : "خطتك التدريبية الجديدة جاهزة الآن. اطّلع عليها من صفحة خططي."
        : kind === "meal"
          ? "Your new meal plan is live — open it from My Plans."
          : "Your new workout plan is live — open it from My Plans.";
    },
  },
  questionnaire_status: {
    title: (p, lang) => {
      const status = asString(p.status);
      if (status === "approved") {
        return lang === "ar" ? "تمت الموافقة على استبيانك" : "Your questionnaire was approved";
      }
      if (status === "needs_info") {
        return lang === "ar" ? "يحتاج استبيانك لمزيد من المعلومات" : "Your questionnaire needs more info";
      }
      return "";
    },
    body: (p, lang) => {
      const status = asString(p.status);
      const qtype = asString(p.qtype);
      if (status !== "approved" && status !== "needs_info") return "";
      const q = lang === "ar" ? (qtype === "nutrition" ? "التغذية" : "اللياقة") : qtype === "nutrition" ? "nutrition" : "fitness";
      if (status === "approved") {
        return lang === "ar" ? `استبيان ${q}: تمت الموافقة على استبيانك.` : `Your ${q} questionnaire was approved.`;
      }
      return lang === "ar"
        ? `استبيان ${q}: يحتاج استبيانك لمزيد من المعلومات — راجع مدربك أو حدّث إجاباتك.`
        : `Your ${q} questionnaire needs more info — check with your coach or update your answers.`;
    },
  },

  // ── STAFF-BELL-I18N-251 sweep — member-bell types found still writing
  // raw Arabic after 250 (the «similar problems» wave). Same law:
  // payload at emit, localized render at display, verbatim fallback.
  referral_commission: {
    title: (_p, lang) => (lang === "ar" ? "عمولة جديدة! 🎉" : "New commission! 🎉"),
    body: (p, lang) => {
      const amount = asPrice(p.amount_usd);
      const source = asString(p.source).trim();
      if (amount === null || !source) return "";
      const label = commissionSourceLabel(source, lang);
      return lang === "ar"
        ? `ربحت ${usd(amount, lang)} عمولة من ${label}.`
        : `You earned ${usd(amount, lang)} commission from ${label}.`;
    },
  },
  referral_commission_reversed: {
    title: (_p, lang) =>
      lang === "ar" ? "عمولة تم عكسها ⚠️" : "A commission was reversed ⚠️",
    body: (p, lang) => {
      const amount = asPrice(p.amount_usd);
      const reason = asString(p.reason).trim();
      if (amount === null || !reason) return "";
      return lang === "ar"
        ? `تم عكس عمولة بمبلغ ${usd(amount, lang)} (استرداد/إلغاء الدفع). السبب: ${reason}. إن كان لديك استفسار فتواصل مع الدعم.`
        : `A ${usd(amount, lang)} commission was reversed (refund/payment cancellation). Reason: ${reason}. Contact support if you have questions.`;
    },
  },
  payout_paid: {
    title: (_p, lang) =>
      lang === "ar" ? "تم صرف عمولتك! ✅" : "Your commission was paid! ✅",
    body: (p, lang) => {
      const amount = asPrice(p.amount_usd);
      if (amount === null) return "";
      return lang === "ar"
        ? `تم صرف ${usd(amount, lang)} من عمولاتك.`
        : `${usd(amount, lang)} was paid out from your commissions.`;
    },
  },
  payout_rejected: {
    title: (_p, lang) => (lang === "ar" ? "طلب صرف مرفوض" : "Payout request rejected"),
    body: (p, lang) => {
      const amount = asPrice(p.amount_usd);
      if (amount === null) return "";
      const note = asString(p.note).trim();
      const notePart = note ? (lang === "ar" ? ` ${note}` : ` ${note}`) : "";
      return lang === "ar"
        ? `تم رفض طلب صرف ${usd(amount, lang)}.${notePart}`
        : `Your ${usd(amount, lang)} payout request was rejected.${notePart}`;
    },
  },
  coach_support_reply: {
    title: (_p, lang) =>
      lang === "ar" ? "رد فريق الدعم على رسالتك" : "Support replied to your message",
    // The body IS the reply text — UGC renders verbatim.
    body: () => "",
  },
  support_reply: {
    title: (_p, lang) =>
      lang === "ar" ? "رد جديد على تذكرة الدعم" : "New reply on your support ticket",
    // The body IS the reply text — UGC renders verbatim.
    body: () => "",
  },
  refund_approved: {
    title: (p, lang) => {
      // Entry-level completeness gate: `ended` (the emit-site subEnded
      // boolean) must be present, else the whole row falls back verbatim.
      if (typeof p.ended !== "boolean") return "";
      return lang === "ar" ? "تم قبول طلب الاسترداد ✅" : "Your refund was approved ✅";
    },
    body: (p, lang) => {
      // `ended` is the emit-site boolean (subEnded) — its presence is the
      // completeness gate; amount is optional (legacy renders it when set).
      if (typeof p.ended !== "boolean") return "";
      const amount = asPrice(p.amount_usd);
      const amountPart =
        amount !== null
          ? lang === "ar" ? ` (${formatNumberFor(amount, "ar")}$)` : ` ($${formatNumberFor(amount, "en")})`
          : "";
      const warning =
        p.ended
          ? ""
          : lang === "ar"
            ? " (لم نتمكن من إيقاف الاشتراك تلقائيًا — سيتم إنهاؤه يدويًا.)"
            : " (We couldn't stop the subscription automatically — it will be terminated manually.)";
      return lang === "ar"
        ? `تم قبول استرداد اشتراكك${amountPart} وإيقافه اعتبارًا من الآن. سيتم تحويل المبلغ بنفس طريقة الدفع خلال أيام العمل.${warning}`
        : `Your subscription refund${amountPart} was approved and stopped as of now. The amount will be transferred via the same payment method within a few business days.${warning}`;
    },
  },
  refund_rejected: {
    title: (_p, lang) =>
      lang === "ar" ? "تم رفض طلب الاسترداد" : "Your refund was rejected",
    body: (p, lang) => {
      const note = asString(p.note).trim();
      const notePart = note
        ? lang === "ar" ? ` السبب: ${note}` : ` Reason: ${note}`
        : "";
      return lang === "ar"
        ? `تمت مراجعة طلب الاسترداد ورفضه.${notePart} للاستفسار تواصل مع الدعم.`
        : `Your refund request was reviewed and rejected.${notePart} Contact support for questions.`;
    },
  },
  wallet_adjusted: {
    title: (p, lang) => {
      const amount = asPrice(p.amount);
      if (amount === null) return "";
      return lang === "ar"
        ? amount > 0 ? "تم إضافة رصيد لمحفظتك" : "تم تعديل رصيد محفظتك"
        : amount > 0 ? "Wallet credit added" : "Wallet balance adjusted";
    },
    body: (p, lang) => {
      const amount = asPrice(p.amount);
      if (amount === null) return "";
      const note = asString(p.note).trim();
      const signed = (amount > 0 ? "+" : "") + formatNumberFor(amount, lang);
      const notePart = note ? (lang === "ar" ? ` — ${note}` : ` — ${note}`) : "";
      return lang === "ar"
        ? `${signed}$${notePart}`
        : `${amount > 0 ? "+" : "-"}$${formatNumberFor(Math.abs(amount), "en")}${notePart}`;
    },
  },
  wallet_topup_approved: {
    title: (p, lang) => {
      const provider = asString(p.provider) || "manual";
      return provider === "paypal"
        ? lang === "ar" ? "تم شحن محفظتك عبر PayPal ✅" : "Wallet topped up via PayPal ✅"
        : lang === "ar" ? "تم شحن محفظتك ✅" : "Wallet topped up ✅";
    },
    body: (p, lang) => {
      const amount = asPrice(p.amount);
      const balance = asPrice(p.balance);
      if (amount === null || balance === null) return "";
      const provider = asString(p.provider) || "manual";
      return lang === "ar"
        ? provider === "paypal"
          ? `تم شحن ${formatNumberFor(amount, "ar")}$ في محفظتك — الرصيد الجديد ${formatNumberFor(balance, "ar")}.`
          : `تم قبول طلب شحن المحفظة بمبلغ ${formatNumberFor(amount, "ar")}$ — الرصيد الجديد ${formatNumberFor(balance, "ar")}.`
        : provider === "paypal"
          ? `${usd(amount, lang)} was added to your wallet — new balance ${formatNumberFor(balance, "en")}.`
          : `Your ${usd(amount, lang)} top-up request was approved — new balance ${formatNumberFor(balance, "en")}.`;
    },
  },
  wallet_topup_rejected: {
    title: (_p, lang) =>
      lang === "ar" ? "طلب شحن المحفظة مرفوض" : "Wallet top-up rejected",
    body: (p, lang) => {
      const amount = asPrice(p.amount);
      if (amount === null) return "";
      const note = asString(p.note).trim();
      const notePart = note
        ? lang === "ar" ? ` السبب: ${note}` : ` Reason: ${note}`
        : "";
      return lang === "ar"
        ? `لم يتم قبول طلب الشحن بمبلغ ${formatNumberFor(amount, "ar")}$.${notePart} راجع إيصال الدفع وحاول مرة أخرى.`
        : `Your ${usd(amount, lang)} top-up request wasn't approved.${notePart} Check your payment receipt and try again.`;
    },
  },
  coach_ad_started: {
    title: (_p, lang) => (lang === "ar" ? "إعلانك أصبح نشطًا 🎉" : "Your ad is live 🎉"),
    body: (p, lang) => {
      const endsIso = asString(p.ends_iso);
      const pkgAr = asString(p.pkg_ar).trim();
      const pkgEn = asString(p.pkg_en).trim();
      if (!endsIso || (!pkgAr && !pkgEn)) return "";
      const ends = formatDateFor(endsIso, lang);
      const pkg = (lang === "ar" ? pkgAr : pkgEn) || pkgAr || pkgEn;
      return lang === "ar"
        ? `تم تفعيل اشتراك الإعلان (${pkg}) — سيظهر إعلانك في «مدربون مميزون» حتى ${ends}.`
        : `Your ad subscription (${pkg}) is active — it will appear in “Featured Coaches” until ${ends}.`;
    },
  },

  // STAGE-253 — the weekly progress reminder. The ONLY variable is the
  // decorative greeting name (optional): the copy itself is FIXED per
  // type, so even pre-253 rows without payload re-render from this entry
  // — nothing is invented (the truth law forbids GUESSES about data, and
  // here there is no data to guess; the at-rest Arabic copy stays the
  // legacy fallback for any row type we fail to render).
  progress_weekly_reminder: {
    title: (_p, lang) =>
      lang === "ar"
        ? "حان وقت تسجيل تقدمك الأسبوعي!"
        : "Time to log your weekly progress!",
    body: (p, lang) => {
      const name = asString(p.name).trim();
      const hi = name
        ? lang === "ar"
          ? `مرحبًا ${name}`
          : `Hi ${name}`
        : lang === "ar"
          ? "مرحبًا"
          : "Hi";
      return lang === "ar"
        ? `${hi}، لا تنسَ تسجيل متابعتك الأسبوعية (الوزن، القياسات، الطاقة) — فهي تساعد مدربك على تتبع تقدمك!`
        : `${hi} — don't forget your weekly check-in (weight, measurements, energy). It helps your coach track your progress!`;
    },
  },
};

/**
 * Localize a notification row for display. Known system types with a
 * complete payload render from the catalog; everything else (old rows,
 * free-text coach broadcasts, unknown types) returns the stored text
 * verbatim — the truthful fallback.
 */
export function localizeNotification(
  row: LocalizableNotification,
  lang: NotificationLang,
): { title: string; body: string } {
  const entry = CATALOG[row.type];
  if (!entry) return { title: row.title, body: row.body };
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  const title = entry.title(payload, lang);
  const body = entry.body(payload, lang);
  return {
    title: title || row.title,
    body: body || row.body,
  };
}

// ---------------------------------------------------------------------------
// STAFF-BELL-I18N-251 — the crew bell (admin_notifications) catalog
// ---------------------------------------------------------------------------
//
// Frame 250 left the STAFF bell verbatim on purpose: its ~20 emit sites
// (client + server routes) wrote free Arabic text, so an EN-UI admin/coach
// read raw Arabic. This catalog applies the SAME law to the staff bell:
//   - emit sites additionally write structured `payload` fields (column
//     already exists — 0093 added `payload jsonb default '{}'` to BOTH
//     notification tables, so zero migrations);
//   - known staff `type`s re-render localized title/body from the catalog
//     + payload at DISPLAY time in the VIEWER's UI language (the bell is
//     shared by admins and coaches — each reads his own language);
//   - anything unknown (old rows, missing payload fields, types carrying a
//     dedupe suffix we don't recognize) falls back to the stored text
//     verbatim — the fallback is truthful, never a guess.
//
// Suffix law: three emit sites append dedupe suffixes to `type`
// (`coach_page_pending:{uid}`, `refund_request:{uid}:{date}`,
// `subscription_cancel_request:{uid}:{date}`) — matching is done on the
// base type (the part before the first ":").
//
// UGC law: bodies carrying USER-generated content (the coach's support
// subject, the admin's rejection note, the reversal reason) embed that
// content verbatim inside the localized template — we translate the
// template, never the user's words.

export type AdminLocalizableNotification = LocalizableNotification;

const PAYOUT_METHOD_LABELS: Record<string, { en: string; ar: string }> = {
  cash_wallet: { en: "Cash wallet", ar: "محفظة كاش" },
  subscription_discount: { en: "Subscription discount", ar: "خصم اشتراك" },
  bank_transfer: { en: "Bank transfer", ar: "تحويل بنكي" },
};

const payoutMethodLabel = (method: string, lang: NotificationLang): string =>
  PAYOUT_METHOD_LABELS[method]?.[lang] ??
  (lang === "ar" ? "تحويل بنكي" : "Bank transfer");

/** Staff catalog — same shape as the member CATALOG above. */
const ADMIN_CATALOG: Record<string, CatalogEntry> = {
  // ── client-initiated (POST /api/notifications/admin) ──
  new_client: {
    title: (p, lang) => {
      // Required fields shared with the body — an incomplete payload falls
      // back verbatim as a WHOLE entry (the 250 entry-level fallback law).
      if (!asString(p.name).trim() || !asString(p.email).trim()) return "";
      const variant = asString(p.variant) || "standard";
      if (variant === "invited")
        return lang === "ar"
          ? "عميل مدعو أكمل تفعيل حسابه!"
          : "An invited client activated their account!";
      if (variant === "pending")
        return lang === "ar"
          ? "عميل جديد سجّل (بانتظار التأكيد)!"
          : "New client signed up (awaiting confirmation)!";
      return lang === "ar" ? "عميل جديد سجّل!" : "New client signed up!";
    },
    body: (p, lang) => {
      const name = asString(p.name).trim();
      const email = asString(p.email).trim();
      if (!name || !email) return "";
      const who = `${name} (${email})`;
      const variant = asString(p.variant) || "standard";
      if (variant === "invited") {
        return lang === "ar"
          ? `عميلك المدعو ${who} أكمل التسجيل — راجع استبياناته وجهّز خططه.`
          : `Your invited client ${who} completed registration — check their questionnaires and prepare their plans.`;
      }
      if (variant === "pending") {
        return lang === "ar"
          ? `${who} انضم للمنصة — في انتظار تأكيد البريد الإلكتروني.`
          : `${who} joined the platform — awaiting email confirmation.`;
      }
      return lang === "ar"
        ? `${who} انضم للمنصة. راجع استبياناته وجهّز خططه.`
        : `${who} joined the platform. Check their questionnaires and prepare their plans.`;
    },
  },
  questionnaire_submitted: {
    title: (_p, lang) =>
      lang === "ar" ? "استبيان جديد للمراجعة" : "New questionnaire to review",
    body: (p, lang) => {
      const qtype = asString(p.qtype);
      if (qtype !== "nutrition" && qtype !== "fitness") return "";
      const q = lang === "ar"
        ? qtype === "nutrition" ? "التغذية" : "اللياقة"
        : qtype === "nutrition" ? "nutrition" : "fitness";
      return lang === "ar"
        ? `استبيان ${q} — بانتظار مراجعتك`
        : `A ${q} questionnaire is awaiting your review`;
    },
  },
  payment_request: {
    title: (p, lang) => {
      const provider = asString(p.provider) || "manual";
      return provider === "paypal"
        ? lang === "ar" ? "دفع PayPal جديد ✅" : "New PayPal payment ✅"
        : lang === "ar" ? "طلب دفع جديد" : "New payment request";
    },
    body: (p, lang) => {
      const months = asMonths(p.months);
      const tier = asString(p.tier);
      const price = asPrice(p.price_usd);
      if (months === null || !tier || price === null) return "";
      const provider = asString(p.provider) || "manual";
      if (provider === "paypal") {
        return lang === "ar"
          ? `تم دفع ${usd(price, lang)} عبر PayPal لخطة ${tierLabel(tier, lang)} (${arMonthsPhrase(months)}). الاشتراك مُفعّل تلقائيًا.`
          : `${usd(price, lang)} paid via PayPal for the ${tierLabel(tier, lang)} plan (${enMonthsPhrase(months)}). The subscription was activated automatically.`;
      }
      const name = asString(p.name).trim();
      if (!name) return "";
      return lang === "ar"
        ? `${name} طلب اشتراك ${tierLabel(tier, lang)} لمدة ${arMonthsPhrase(months)} — ${usd(price, lang)}.`
        : `${name} requested the ${tierLabel(tier, lang)} plan for ${enMonthsPhrase(months)} — ${usd(price, lang)}.`;
    },
  },
  new_ticket: {
    title: (_p, lang) =>
      lang === "ar" ? "تذكرة دعم جديدة" : "New support ticket",
    body: (p, lang) => {
      const subject = asString(p.subject).trim();
      if (!subject) return "";
      const high = asBool(p.high);
      const suffix = high
        ? lang === "ar" ? " — أولوية (عضوية التدريب الأونلاين)" : " — priority (coaching membership)"
        : "";
      return lang === "ar" ? `موضوع: ${subject}${suffix}` : `Subject: ${subject}${suffix}`;
    },
  },
  plan_approved: {
    title: (_p, lang) =>
      lang === "ar" ? "تم تفعيل خطة للعميل" : "A client plan was activated",
    body: (p, lang) => {
      const kind = asString(p.plan_type);
      if (kind !== "meal" && kind !== "workout") return "";
      return lang === "ar"
        ? kind === "meal"
          ? "خطة تغذية تم تفعيلها وإرسالها للعميل."
          : "خطة تمارين تم تفعيلها وإرسالها للعميل."
        : kind === "meal"
          ? "The meal plan was activated and sent to the client."
          : "The workout plan was activated and sent to the client.";
    },
  },

  // ── coach lifecycle (server routes) ──
  new_coach: {
    title: (_p, lang) =>
      lang === "ar" ? "مدرب جديد سجّل بنفسه" : "A new coach self-registered",
    body: (p, lang) => {
      const name = asString(p.name).trim();
      const email = asString(p.email).trim();
      if (!name || !email) return "";
      return lang === "ar"
        ? `${name} (${email}) انضم كمدرب عبر صفحة انضم-لنا — راجع صفحته العامة أول ما يجهزها.`
        : `${name} (${email}) joined as a coach via the Join page — review their public page once it's ready.`;
    },
  },
  coach_welcome: {
    title: (_p, lang) =>
      lang === "ar" ? "أهلًا بك مدربًا في فريق Alkemos!" : "Welcome to the Alkemos coach team!",
    body: (_p, lang) =>
      lang === "ar"
        ? "تم تفعيل حسابك. ابدأ بإضافة عملائك وحدّد أسعارك وجهّز محفظتك لتفعيل اشتراكاتهم."
        : "Your account is active. Start by adding your clients, set your prices, and top up your wallet to activate their subscriptions.",
  },
  coach_page_setup: {
    title: (_p, lang) =>
      lang === "ar" ? "أكمل إعداد صفحتك العامة" : "Complete your public page setup",
    body: (_p, lang) =>
      lang === "ar"
        ? "صفحتك العامة هي واجهتك أمام العملاء — اكتب نبذتك وتخصصاتك واضبط رابطك، وتُنشر بعد مراجعة الإدارة."
        : "Your public page is your storefront — write your bio and specialties and set your link; it goes live after admin review.",
  },
  coach_page_reminder: {
    title: (_p, lang) =>
      lang === "ar" ? "أكمل إعداد صفحتك العامة" : "Complete your public page setup",
    body: (_p, lang) =>
      lang === "ar"
        ? "تذكير من الإدارة: صفحتك العامة ما تزال تحتاج إكمالًا — اكتب نبذتك وتخصصاتك، واضبط رابطك من «صفحتي العامة»."
        : "Admin reminder: your public page still needs completing — write your bio and specialties and set your link from “My Public Page”.",
  },
  coach_page_approved: {
    title: (_p, lang) =>
      lang === "ar"
        ? "تمت الموافقة على صفحتك العامة"
        : "Your public page was approved",
    body: (_p, lang) =>
      lang === "ar"
        ? "صفحتك ظهرت للجميع على صفحة المدربين — شكرًا لاجتهادك."
        : "Your page is now live on the coaches page — thanks for the effort.",
  },
  coach_page_rejected: {
    title: (_p, lang) =>
      lang === "ar" ? "صفحتك العامة تحتاج تعديل" : "Your public page needs changes",
    body: (p, lang) => {
      const reason = asString(p.reason).trim();
      if (!reason) return "";
      return lang === "ar" ? `سبب الرفض: ${reason}` : `Rejection reason: ${reason}`;
    },
  },
  coach_page_pending: {
    title: (_p, lang) =>
      lang === "ar" ? "صفحة مدرب بانتظار مراجعتك" : "A coach page awaits your review",
    body: (p, lang) => {
      const coachName = asString(p.coach_name).trim();
      if (!coachName) return "";
      return lang === "ar"
        ? `«${coachName}» حدّث صفحته العامة — تحتاج إلى موافقة قبل ظهورها للجميع.`
        : `“${coachName}” updated their public page — it needs approval before going public.`;
    },
  },

  // ── admin business (money / pages / support) ──
  coach_ad: {
    title: (_p, lang) =>
      lang === "ar" ? "اشتراك إعلان جديد" : "New ad subscription",
    body: (p, lang) => {
      const price = asPrice(p.price_usd);
      const endsIso = asString(p.ends_iso);
      const pkgAr = asString(p.pkg_ar).trim();
      const pkgEn = asString(p.pkg_en).trim();
      if (price === null || !endsIso || (!pkgAr && !pkgEn)) return "";
      const ends = formatDateFor(endsIso, lang);
      const pkg = (lang === "ar" ? pkgAr : pkgEn) || pkgAr || pkgEn;
      return lang === "ar"
        ? `مدرب اشترك في باقة إعلان (${pkg}) مقابل ${formatNumberFor(price, lang)}$ — سارية حتى ${ends}.`
        : `A coach subscribed to the ad package (${pkg}) for ${usd(price, lang)} — active until ${ends}.`;
    },
  },
  refund_request: {
    title: (_p, lang) =>
      lang === "ar" ? "طلب استرداد جديد (7 أيام) 💸" : "New refund request (7 days) 💸",
    body: (p, lang) => {
      const email = asString(p.email).trim();
      const tier = asString(p.tier).trim();
      const price = asPrice(p.amount_usd);
      if (!email || !tier || price === null) return "";
      return lang === "ar"
        ? `${email} طلب استرداد اشتراك ${tierLabel(tier, lang)} (${usd(price, lang)}) — التحقق التلقائي: لم يستخدم أي مميزات مدفوعة. راجع /admin/payments.`
        : `${email} requested a refund for the ${tierLabel(tier, lang)} subscription (${usd(price, lang)}) — auto-check passed: no paid features used. Review /admin/payments.`;
    },
  },
  subscription_cancel_request: {
    title: (_p, lang) =>
      lang === "ar" ? "طلب إلغاء اشتراك" : "Subscription cancellation request",
    body: (p, lang) => {
      const email = asString(p.email).trim();
      const tier = asString(p.tier).trim();
      const endIso = asString(p.end_iso);
      if (!email || !tier || !endIso) return "";
      const end = formatDateFor(endIso, lang);
      return lang === "ar"
        ? `${email} طلب إلغاء اشتراكه (${tierLabel(tier, lang)}) — يستمر الاشتراك حتى نهاية آخر مدة مدفوعة (${end}). راجع صفحة المدفوعات إن احتجت إلى إجراء استرداد.`
        : `${email} requested to cancel their ${tierLabel(tier, lang)} subscription — it stays active until the end of the last paid term (${end}). See the payments page if a refund is needed.`;
    },
  },
  payout_request: {
    title: (_p, lang) =>
      lang === "ar" ? "طلب صرف عمولة جديد 💸" : "New commission payout request 💸",
    body: (p, lang) => {
      const name = asString(p.name).trim();
      const amount = asPrice(p.amount_usd);
      const method = asString(p.method).trim();
      if (!name || amount === null || !method) return "";
      const methodLabel = payoutMethodLabel(method, lang);
      // The legacy body carried a machine tag «[uid:…]» for dedupe — the
      // catalog render drops it (dedupe reads the DB body, not the view).
      return lang === "ar"
        ? `${name} طلب صرف ${usd(amount, lang)} عبر ${methodLabel}. راجعه من صفحة الإحالات.`
        : `${name} requested a ${usd(amount, lang)} payout via ${methodLabel}. Review it on the referrals page.`;
    },
  },
  coach_support: {
    title: (_p, lang) =>
      lang === "ar" ? "رسالة دعم من مدرب" : "Support message from a coach",
    // The body IS the coach's subject — user-generated content renders
    // verbatim (empty here = fall through to the stored body).
    body: () => "",
  },

  // ── affiliate (coach-targeted rows) ──
  referral_commission: {
    title: (_p, lang) =>
      lang === "ar" ? "عمولة جديدة! 🎉" : "New commission! 🎉",
    body: (p, lang) => {
      const amount = asPrice(p.amount_usd);
      const source = asString(p.source).trim();
      if (amount === null || !source) return "";
      const label = commissionSourceLabel(source, lang);
      return lang === "ar"
        ? `ربحت ${usd(amount, lang)} عمولة من ${label}.`
        : `You earned ${usd(amount, lang)} commission from ${label}.`;
    },
  },
  referral_commission_reversed: {
    title: (_p, lang) =>
      lang === "ar" ? "عمولة تم عكسها ⚠️" : "A commission was reversed ⚠️",
    body: (p, lang) => {
      const amount = asPrice(p.amount_usd);
      const reason = asString(p.reason).trim();
      if (amount === null || !reason) return "";
      return lang === "ar"
        ? `تم عكس عمولة بمبلغ ${usd(amount, lang)}. السبب: ${reason}.`
        : `A ${usd(amount, lang)} commission was reversed. Reason: ${reason}.`;
    },
  },
};

/**
 * Localize a STAFF bell row for display. Same contract as
 * localizeNotification: matching is on the base type (suffix-tolerant),
 * known types with a complete payload render from the catalog, everything
 * else falls back to the stored text verbatim — truthful, never a guess.
 */
export function localizeAdminNotification(
  row: AdminLocalizableNotification,
  lang: NotificationLang,
): { title: string; body: string } {
  const base = row.type.split(":")[0];
  const entry = ADMIN_CATALOG[base];
  if (!entry) return { title: row.title, body: row.body };
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  const title = entry.title(payload, lang);
  const body = entry.body(payload, lang);
  return {
    title: title || row.title,
    body: body || row.body,
  };
}
