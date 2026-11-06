import { describe, it, expect } from "vitest";
import {
 localizeNotification,
 localizeAdminNotification,
} from "../notification-i18n";

/**
 * STAFF-BELL-I18N-251 canaries — the crew bell (admin_notifications)
 * display-layer contract, mirroring NOTIF-I18N-250 for the member bell:
 *  - known staff types localize to the VIEWER's UI language from the
 *    structured payload (column exists since 0093 — zero migrations);
 *  - the three dedupe-suffix types (coach_page_pending:{uid},
 *    refund_request:{uid}:{date}, subscription_cancel_request:{uid}:{date})
 *    match on their BASE type;
 *  - unknown types, old rows without payload, and rows with incomplete
 *    payloads fall through VERBATIM (honest fallback, never masked);
 *  - UGC (coach support subject, rejection note, reversal reason) is
 *    embedded verbatim inside the localized template — never translated;
 *  - the «لمدة 1 شهر»-class grammar bugs can never come back —
 *    arMonthsPhrase owns the Arabic plural law;
 *  - $ stays Latin (money law) while digits follow the UI language.
 */

const ar = (row: Parameters<typeof localizeAdminNotification>[0]) =>
  localizeAdminNotification(row, "ar");
const en = (row: Parameters<typeof localizeAdminNotification>[0]) =>
  localizeAdminNotification(row, "en");

describe("new_client — variant law", () => {
  const row = {
    type: "new_client",
    title: "عميل جديد سجّل! ",
    body: "أحمد (a@b.com) انضم للمنصة. اطمئن على استبياناته وجهّز خططه.",
    payload: { name: "أحمد", email: "a@b.com", variant: "standard" },
  };
  it("standard renders both languages", () => {
    expect(ar(row).title).toBe("عميل جديد سجّل!");
    expect(ar(row).body).toBe("أحمد (a@b.com) انضم للمنصة. اطمئن على استبياناته وجهّز خططه.");
    expect(en(row).title).toBe("New client signed up!");
    expect(en(row).body).toBe(
      "أحمد (a@b.com) joined the platform. Check their questionnaires and prepare their plans.",
    );
  });
  it("invited + pending variants render", () => {
    const invited = { ...row, payload: { ...row.payload, variant: "invited" } };
    expect(ar(invited).title).toBe("عميل مدعو أكمل تفعيل حسابه!");
    expect(en(invited).body).toContain("Your invited client أحمد (a@b.com)");
    const pending = { ...row, payload: { ...row.payload, variant: "pending" } };
    expect(ar(pending).title).toBe("عميل جديد سجّل (بانتظار التأكيد)!");
    expect(en(pending).body).toContain("awaiting email confirmation");
  });
  it("missing payload falls back verbatim", () => {
    const legacy = { type: "new_client", title: "عميل جديد", body: "سجّل" };
    expect(ar(legacy)).toEqual({ title: "عميل جديد", body: "سجّل" });
  });
  it("missing email falls back verbatim (no guessing)", () => {
    const partial = { type: "new_client", title: "t", body: "b", payload: { name: "أحمد" } };
    expect(ar(partial)).toEqual({ title: "t", body: "b" });
  });
});

describe("payment_request — month grammar + tier label", () => {
  const row = {
    type: "payment_request",
    title: "طلب دفع جديد ",
    body: "عميل طلب اشتراك premium لمدة 2 شهر — $18",
    payload: { name: "عميل", tier: "premium", months: 2, price_usd: 18 },
  };
  it("AR uses the dual form (شهرين — never «2 شهر»)", () => {
    expect(ar(row).body).toBe("عميل طلب اشتراك بريميوم لمدة شهرين — $١٨.");
  });
  it("EN renders the plan + months", () => {
    expect(en(row).body).toBe("عميل requested the Premium plan for 2 months — $18.");
  });
  it("PayPal provider variant", () => {
    const pp = {
      type: "payment_request",
      title: "دفع PayPal جديد ✅",
      body: "x",
      payload: { provider: "paypal", tier: "starter", months: 1, price_usd: 2 },
    };
    expect(ar(pp).title).toBe("دفع PayPal جديد ✅");
    expect(ar(pp).body).toBe(
      "تم دفع $٢ عبر PayPal لخطة ستارتر (شهر واحد). الاشتراك مُفعّل تلقائيًا.",
    );
    expect(en(pp).body).toContain("$2 paid via PayPal for the Starter plan (1 month)");
  });
});

describe("suffix types — base-type matching", () => {
  it("refund_request:{uid}:{date} matches", () => {
    const row = {
      type: "refund_request:uid-1:2026-09-22",
      title: "طلب استرداد جديد (7 أيام) 💸",
      body: "x",
      payload: { email: "m@x.com", tier: "premium", amount_usd: 18 },
    };
    expect(ar(row).title).toBe("طلب استرداد جديد (7 أيام) 💸");
    expect(ar(row).body).toContain("m@x.com طلب استرداد اشتراك بريميوم ($١٨)");
    expect(en(row).body).toContain("requested a refund for the Premium subscription ($18)");
  });
  it("subscription_cancel_request:{uid}:{date} matches + localizes the date", () => {
    const row = {
      type: "subscription_cancel_request:uid-1:2026-09-22",
      title: "طلب إلغاء اشتراك",
      body: "x",
      payload: { email: "m@x.com", tier: "free", end_iso: "2026-10-22T00:00:00.000Z" },
    };
    expect(ar(row).body).toContain("طلب إلغاء اشتراكه (مجاني)");
    expect(ar(row).body).toContain("٢٢");
    expect(en(row).body).toContain("cancel their Free subscription");
  });
  it("coach_page_pending:{uid} matches", () => {
    const row = {
      type: "coach_page_pending:uid-1",
      title: "صفحة مدرب بانتظار مراجعتك",
      body: "x",
      payload: { coach_name: "كريم" },
    };
    expect(ar(row).body).toBe("«كريم» حدّث صفحته العامة — محتاجة موافقة قبل ظهورها للجميع.");
    expect(en(row).body).toBe(
      "“كريم” updated their public page — it needs approval before going public.",
    );
  });
});

describe("UGC law — user content embedded verbatim", () => {
  it("coach_support localizes the title, keeps the subject verbatim", () => {
    const row = {
      type: "coach_support",
      title: "رسالة دعم من مدرب",
      body: "مشكلة في المحفظة",
    };
    expect(ar(row).title).toBe("رسالة دعم من مدرب");
    expect(en(row).title).toBe("Support message from a coach");
    expect(en(row).body).toBe("مشكلة في المحفظة");
  });
  it("coach_page_rejected embeds the note verbatim", () => {
    const row = {
      type: "coach_page_rejected",
      title: "صفحتك العامة تحتاج تعديل",
      body: "سبب الرفض: الصورة غير واضحة",
      payload: { reason: "الصورة غير واضحة" },
    };
    expect(en(row).title).toBe("Your public page needs changes");
    expect(en(row).body).toBe("Rejection reason: الصورة غير واضحة");
    expect(ar(row).body).toBe("سبب الرفض: الصورة غير واضحة");
  });
  it("new_ticket embeds the subject verbatim + high-priority suffix", () => {
    const base = {
      type: "new_ticket",
      title: "تذكرة دعم جديدة ",
      body: "x",
      payload: { subject: "الموقع بطيء" },
    };
    expect(en(base).body).toBe("Subject: الموقع بطيء");
    const high = { ...base, payload: { ...base.payload, high: true } };
    expect(ar(high).body).toBe("موضوع: الموقع بطيء — أولوية (عضوية التدريب الأونلاين)");
    expect(en(high).body).toBe("Subject: الموقع بطيء — priority (coaching membership)");
  });
});

describe("payout_request — machine tag dropped on render", () => {
  const row = {
    type: "payout_request",
    title: "طلب صرف عمولة جديد 💸",
    body: "عضو طلب صرف $5 عبر محفظة كاش. راجعه من صفحة الإحالات. [uid:abc-123]",
    payload: { name: "عضو", amount_usd: 5, method: "cash_wallet" },
  };
  it("AR render has no [uid:…] tag", () => {
    const view = ar(row);
    expect(view.body).not.toContain("[uid:");
    expect(view.body).toBe("عضو طلب صرف $٥ عبر محفظة كاش. راجعه من صفحة الإحالات.");
  });
  it("EN render localizes the method + no tag", () => {
    const view = en(row);
    expect(view.body).toBe(
      "عضو requested a $5 payout via Cash wallet. Review it on the referrals page.",
    );
  });
  it("unknown method falls back to bank transfer label (emit-site law)", () => {
    const view = en({ ...row, payload: { ...row.payload, method: "weird" } });
    expect(view.body).toContain("via Bank transfer");
  });
  it("legacy rows (with the tag at rest) still render verbatim", () => {
    const legacy = {
      type: "payout_request",
      title: "طلب صرف عمولة جديد 💸",
      body: "قديم [uid:abc]",
    };
    expect(ar(legacy)).toEqual({ title: "طلب صرف عمولة جديد 💸", body: "قديم [uid:abc]" });
  });
});

describe("static coach lifecycle types — no payload needed", () => {
  it("coach_welcome", () => {
    const row = { type: "coach_welcome", title: "أهلًا بك كوتش في Alkemos!", body: "x" };
    expect(en(row).title).toBe("Welcome to the Alkemos coach team!");
    expect(en(row).body).toContain("Your account is active.");
    expect(ar(row).body).toContain("تم تفعيل حسابك.");
  });
  it("coach_page_setup + reminder + approved", () => {
    expect(en({ type: "coach_page_setup", title: "t", body: "b" }).title).toBe(
      "Complete your public page setup",
    );
    expect(en({ type: "coach_page_reminder", title: "t", body: "b" }).body).toContain(
      "Admin reminder",
    );
    expect(en({ type: "coach_page_approved", title: "t", body: "b" }).title).toBe(
      "Your public page was approved",
    );
  });
});

describe("affiliate rows", () => {
  it("referral_commission localizes the source label", () => {
    const row = {
      type: "referral_commission",
      title: "عمولة جديدة! 🎉",
      body: "ربحت $10 عمولة من اشتراك جديد.",
      payload: { amount_usd: 10, source: "subscription_initial" },
    };
    expect(ar(row).body).toBe("ربحت $١٠ عمولة من اشتراك جديد.");
    expect(en(row).body).toBe("You earned $10 commission from a new subscription.");
  });
  it("unknown source keeps the generic label (emit-site else branch)", () => {
    const row = {
      type: "referral_commission",
      title: "t",
      body: "b",
      payload: { amount_usd: 3, source: "mystery" },
    };
    expect(ar(row).body).toBe("ربحت $٣ عمولة من خدمة.");
  });
  it("referral_commission_reversed embeds the reason verbatim", () => {
    const row = {
      type: "referral_commission_reversed",
      title: "عمولة تم عكسها ⚠️",
      body: "x",
      payload: { amount_usd: 7.5, reason: "PayPal refund (capture 8XN)" },
    };
    expect(ar(row).body).toBe("تم عكس عمولة بمبلغ $٧٫٥. السبب: PayPal refund (capture 8XN).");
    expect(en(row).body).toBe(
      "A $7.5 commission was reversed. Reason: PayPal refund (capture 8XN).",
    );
  });
});

describe("coach_ad + questionnaire_submitted + plan_approved + new_coach", () => {
  it("coach_ad localizes the package label + date", () => {
    const row = {
      type: "coach_ad",
      title: "اشتراك إعلان جديد",
      body: "x",
      payload: { pkg_ar: "شهر", pkg_en: "1 month", price_usd: 7, ends_iso: "2026-10-22T00:00:00.000Z" },
    };
    expect(ar(row).body).toContain("باقة إعلان (شهر) مقابل ٧$");
    expect(en(row).body).toContain("ad package (1 month) for $7");
  });
  it("questionnaire_submitted", () => {
    const row = {
      type: "questionnaire_submitted",
      title: "استبيان جديد للمراجعة ",
      body: "استبيان التغذية — بانتظار مراجعتك",
      payload: { qtype: "nutrition" },
    };
    expect(en(row).body).toBe("A nutrition questionnaire is awaiting your review");
    expect(ar(row).body).toBe("استبيان التغذية — بانتظار مراجعتك");
  });
  it("plan_approved", () => {
    const row = {
      type: "plan_approved",
      title: "تم تفعيل خطة للعميل ",
      body: "x",
      payload: { plan_type: "workout" },
    };
    expect(en(row).body).toBe("The workout plan was activated and sent to the client.");
    expect(ar(row).body).toBe("خطة تمارين تم تفعيلها وإرسالها للعميل.");
  });
  it("new_coach", () => {
    const row = {
      type: "new_coach",
      title: "مدرب جديد سجّل بنفسه",
      body: "x",
      payload: { name: "سامي", email: "s@x.com" },
    };
    expect(en(row).body).toContain("سامي (s@x.com) joined as a coach via the Join page");
  });
});

describe("unknown types — always verbatim", () => {
  it("a staff broadcast with an unknown type is never touched", () => {
    const row = { type: "coach_broadcast", title: "عنوان حر", body: "نص حر من مدرب" };
    expect(en(row)).toEqual({ title: "عنوان حر", body: "نص حر من مدرب" });
  });
});

/**
 * ── STAFF-BELL-I18N-251 member-bell sweep (the «similar problems» wave) ──
 * 12 member-bell types found still writing raw Arabic after 250; same
 * law applied: payload at emit → localized render at display → verbatim
 * fallback for legacy rows and incomplete payloads.
 */
const mar = (row: Parameters<typeof localizeNotification>[0]) =>
  localizeNotification(row, "ar");
const men = (row: Parameters<typeof localizeNotification>[0]) =>
  localizeNotification(row, "en");

describe("member sweep — affiliate money rows", () => {
  it("referral_commission localizes source (friend_referral)", () => {
    const row = {
      type: "referral_commission",
      title: "عمولة جديدة! 🎉",
      body: "ربحت $10 عمولة من إحالة صديق.",
      payload: { amount_usd: 10, source: "friend_referral" },
    };
    expect(men(row).body).toBe("You earned $10 commission from a friend referral.");
    expect(mar(row).body).toBe("ربحت $١٠ عمولة من إحالة صديق.");
  });
  it("referral_commission_reversed embeds reason verbatim", () => {
    const row = {
      type: "referral_commission_reversed",
      title: "عمولة تم عكسها ⚠️",
      body: "x",
      payload: { amount_usd: 7.5, reason: "PayPal refund (capture 8XN)" },
    };
    expect(men(row).body).toContain("A $7.5 commission was reversed (refund/payment cancellation). Reason: PayPal refund (capture 8XN).");
    expect(mar(row).body).toContain("لو عندك استفسار تواصل مع الدعم.");
  });
  it("payout_paid + payout_rejected", () => {
    const paid = {
      type: "payout_paid", title: "t", body: "b",
      payload: { amount_usd: 25 },
    };
    expect(men(paid).body).toBe("$25 was paid out from your commissions.");
    const rejected = {
      type: "payout_rejected", title: "t", body: "b",
      payload: { amount_usd: 25, note: "بيانات غير مكتملة" },
    };
    expect(mar(rejected).body).toBe("تم رفض طلب صرف $٢٥. بيانات غير مكتملة");
    const noNote = { ...rejected, payload: { amount_usd: 25 } };
    expect(men(noNote).body).toBe("Your $25 payout request was rejected.");
  });
});

describe("member sweep — support replies are title-only (UGC body)", () => {
  it("support_reply + coach_support_reply keep the reply text verbatim", () => {
    const r1 = { type: "support_reply", title: "رد جديد على تذكرة الدعم", body: "سنراجع الموضوع" };
    expect(men(r1).title).toBe("New reply on your support ticket");
    expect(men(r1).body).toBe("سنراجع الموضوع");
    const r2 = { type: "coach_support_reply", title: "رد فريق الدعم على رسالتك", body: "تم الحل" };
    expect(men(r2).title).toBe("Support replied to your message");
    expect(men(r2).body).toBe("تم الحل");
  });
});

describe("member sweep — refunds", () => {
  it("refund_approved with amount + auto-stop warning", () => {
    const row = {
      type: "refund_approved", title: "t", body: "b",
      payload: { amount_usd: 18, ended: false },
    };
    expect(mar(row).body).toContain("تم قبول استرداد اشتراكك (١٨$)");
    expect(mar(row).body).toContain("لم نتمكن من إيقاف الاشتراك تلقائيًا");
    expect(men(row).body).toContain("Your subscription refund ($18) was approved");
  });
  it("refund_approved missing ended flag falls back verbatim", () => {
    const row = { type: "refund_approved", title: "t-stored", body: "b-stored", payload: { amount_usd: 18 } };
    expect(mar(row)).toEqual({ title: "t-stored", body: "b-stored" });
  });
  it("refund_rejected with/without note", () => {
    const withNote = {
      type: "refund_rejected", title: "t", body: "b",
      payload: { note: "استخدام مميزات مدفوعة" },
    };
    expect(men(withNote).body).toContain("Reason: استخدام مميزات مدفوعة");
    const noNote = { type: "refund_rejected", title: "t", body: "b", payload: {} };
    expect(men(noNote).body).toBe(
      "Your refund request was reviewed and rejected. Contact support for questions.",
    );
  });
});

describe("member sweep — wallet rows", () => {
  it("wallet_adjusted positive + negative", () => {
    const plus = {
      type: "wallet_adjusted", title: "t", body: "b",
      payload: { amount: 5, note: "مكافأة" },
    };
    expect(mar(plus).title).toBe("تم إضافة رصيد لمحفظتك");
    expect(mar(plus).body).toBe("+٥$ — مكافأة");
    expect(men(plus).body).toBe("+$5 — مكافأة");
    const minus = { ...plus, payload: { amount: -3, note: "" } };
    expect(mar(minus).title).toBe("تم تعديل رصيد محفظتك");
    expect(men(minus).body).toBe("-$3");
  });
  it("wallet_topup_approved manual + paypal", () => {
    const manual = {
      type: "wallet_topup_approved", title: "t", body: "b",
      payload: { amount: 10, balance: 45, provider: "manual" },
    };
    expect(mar(manual).body).toBe("اتقبل طلب شحن المحفظة بمبلغ ١٠$ — الرصيد الجديد ٤٥.");
    const paypal = { ...manual, payload: { ...manual.payload, provider: "paypal" } };
    expect(men(paypal).title).toBe("Wallet topped up via PayPal ✅");
    expect(men(paypal).body).toBe("$10 was added to your wallet — new balance 45.");
  });
  it("wallet_topup_rejected", () => {
    const row = {
      type: "wallet_topup_rejected", title: "t", body: "b",
      payload: { amount: 10, note: "الإيصال غير واضح" },
    };
    expect(men(row).body).toContain("Your $10 top-up request wasn't approved. Reason: الإيصال غير واضح");
    expect(mar(row).body).toContain("راجع إيصال الدفع وحاول تاني.");
  });
});

describe("member sweep — coach_ad_started", () => {
  it("localizes package label + date", () => {
    const row = {
      type: "coach_ad_started", title: "t", body: "b",
      payload: { pkg_ar: "شهر", pkg_en: "1 month", ends_iso: "2026-10-22T00:00:00.000Z" },
    };
    expect(mar(row).body).toContain("تم تفعيل اشتراك الإعلان (شهر)");
    expect(men(row).body).toContain("Your ad subscription (1 month) is active");
  });
});
