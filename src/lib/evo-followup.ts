/**
 * EVO weekly check-in email — pure builders + eligibility, client-safe.
 *
 * EVO-3 (docs/EVO-MASTER-PLAN.md §4 W2) — owner decree D4:
 *   «موافق على D4 والبريد evo@alkemos.com ارسال فقط بدون استقبال».
 *
 * HARD LAWS (all enforced here, unit-tested):
 *   - OPT-IN MANDATORY (D4): isFollowupDue never passes a non-opted-in
 *     row. No silent enrollment exists anywhere in the system.
 *   - SEND-ONLY (D4): the footer never invites replies — it points to
 *     real site surfaces (Platform Truth law applies to email too).
 *   - REAL DATA ONLY: every number in the email arrives through the
 *     input struct. Missing data renders an honest "no measurements
 *     logged yet" nudge — never an invented number.
 *   - CADENCE: one email per user per 7 days minimum (dispatch route
 *     re-checks against the DB; this helper is the shared definition).
 *
 * ACTIVATION NOTE: this module ships in EVO-3 as infrastructure; nothing
 * sends until the live SMTP check passes, EVO_FOLLOWUP_ENABLED=true and
 * the opt-in UI lands (activation decree — separate step by design).
 */

/* ------------------------------------------------------------------ */
/*  Eligibility                                                        */
/* ------------------------------------------------------------------ */

/** Minimum days between two check-in emails to the same user. */
export const EVO_FOLLOWUP_INTERVAL_DAYS = 7;
const INTERVAL_MS = EVO_FOLLOWUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

/** Mirror of evo_followup_prefs (0079) — only the fields eligibility needs. */
export type FollowupPref = {
  opted_in: boolean;
  last_sent_at: string | null;
};

/**
 * D4 gate: opted_in is MANDATORY, and the 7-day cadence is counted from
 * the last SUCCESSFUL send (null = never sent → due immediately).
 */
export function isFollowupDue(pref: FollowupPref, now: Date = new Date()): boolean {
  if (!pref.opted_in) return false;
  if (!pref.last_sent_at) return true;
  const last = new Date(pref.last_sent_at).getTime();
  if (Number.isNaN(last)) return true; // corrupt stamp → treat as never sent
  return now.getTime() - last >= INTERVAL_MS;
}

/* ------------------------------------------------------------------ */
/*  Opt-in UI write planner (EVO-3 activation step 3)                  */
/* ------------------------------------------------------------------ */

/**
 * The exact client write the /profile opt-in toggle should perform —
 * mirrors migration 0079 RLS write paths (insert authed-own, update
 * owner). Opt-out is an UPDATE, never a delete (D2).
 */
export type FollowupPrefWrite =
  | {
      mode: "insert";
      values: { client_id: string; opted_in: true; language: "ar" | "en" };
    }
  | {
      mode: "update";
      values: { opted_in: boolean; language?: "ar" | "en"; updated_at: string };
    };

/**
 * Plans the toggle write deterministically (pure, unit-tested):
 *   - no row + opt-in   → INSERT (opted_in true + captured language);
 *   - no row + opt-out  → null (default state is already opted-out);
 *   - row + real change → UPDATE with updated_at stamped client-side
 *     (0079 has no trigger; opting out keeps the captured language so a
 *     future re-opt-in restores the user's prior choice in one tap);
 *   - row + no change   → null (no write, no updated_at churn).
 * Language is coerced to the 0079 check constraint domain ("ar"|"en").
 */
export function buildFollowupPrefWrite(
  clientId: string,
  existing: { opted_in: boolean; language?: string | null } | null | undefined,
  action: { optedIn: boolean; language: "ar" | "en" },
  now: Date = new Date(),
): FollowupPrefWrite | null {
  const language: "ar" | "en" = action.language === "en" ? "en" : "ar";
  if (!existing) {
    if (!action.optedIn) return null;
    return {
      mode: "insert",
      values: { client_id: clientId, opted_in: true, language },
    };
  }
  const languageChanged =
    action.optedIn && existing.opted_in && (existing.language ?? "ar") !== language;
  if (existing.opted_in === action.optedIn && !languageChanged) return null;
  return {
    mode: "update",
    values: action.optedIn
      ? { opted_in: true, language, updated_at: now.toISOString() }
      : { opted_in: false, updated_at: now.toISOString() },
  };
}

/* ------------------------------------------------------------------ */
/*  Email content                                                      */
/* ------------------------------------------------------------------ */

export type FollowupEmailInput = {
  name: string;
  language: "ar" | "en";
  /** newest minus oldest logged weight, kg — null when not computable */
  weightDeltaKg: number | null;
  /** latest logged weight, kg — null when nothing logged */
  latestWeight: number | null;
  /** titles of the user's active plans (may be empty) */
  activePlanTitles: string[];
  /** site origin for the CTA link (real route: /profile) */
  siteUrl: string;
};

export type FollowupEmail = {
  subject: string;
  html: string;
  text: string;
};

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtKg(n: number): string {
  return `${Math.round(n * 10) / 10}`;
}

/** The progress sentence — real data or an honest nudge, per language. */
function progressLine(input: FollowupEmailInput): { ar: string; en: string } {
  if (input.weightDeltaKg !== null && input.latestWeight !== null) {
    if (input.weightDeltaKg < 0) {
      const v = fmtKg(Math.abs(input.weightDeltaKg));
      return {
        ar: `وزنك المسجّل في آخر قياس ${fmtKg(input.latestWeight)} كغ، وقد نقص ${v} كغ منذ بداية الفترة — استمر على المسار نفسه.`,
        en: `Your latest logged weight is ${fmtKg(input.latestWeight)}kg, down ${v}kg since the start of this period — keep the same path.`,
      };
    }
    if (input.weightDeltaKg > 0) {
      const v = fmtKg(input.weightDeltaKg);
      return {
        ar: `وزنك المسجّل في آخر قياس ${fmtKg(input.latestWeight)} كغ، وقد زاد ${v} كغ خلال الفترة — إن كان هذا هدفك فأحسنت، وإن لم يكن فلنراجع الخطة معًا.`,
        en: `Your latest logged weight is ${fmtKg(input.latestWeight)}kg, up ${v}kg this period — great if that's the goal; otherwise let's review the plan together.`,
      };
    }
    return {
      ar: `وزنك ثابت تقريبًا (${fmtKg(input.latestWeight)} كغ) — تثبيت الوزن مرحلة وليس هدفًا نهائيًا؛ سجّل قياسك الأسبوعي ولنعدّل معًا.`,
      en: `Your weight is roughly stable (${fmtKg(input.latestWeight)}kg) — is maintenance the goal? Log your weekly measurement and we'll adjust together.`,
    };
  }
  if (input.latestWeight !== null) {
    return {
      ar: `آخر وزن مسجّل لديك ${fmtKg(input.latestWeight)} كغ — سجّل قياسًا جديدًا هذا الأسبوع لنتابع التغيّر الحقيقي.`,
      en: `Your last logged weight is ${fmtKg(input.latestWeight)}kg — log a new measurement this week so we can track the real change.`,
    };
  }
  return {
    ar: `لا توجد قياسات وزن مسجّلة بعد — سجّل قياسك الأول من صفحة حسابك، وسأبدأ معك متابعة التقدم أسبوعيًا.`,
    en: `No weight measurements logged yet — log your first one from your profile page and I'll start tracking your progress weekly.`,
  };
}

const CTA_PATH = "/profile";

export function buildFollowupEmail(input: FollowupEmailInput): FollowupEmail {
  const isAr = input.language === "ar";
  const site = (input.siteUrl || "https://alkemos.com").replace(/\/$/, "");
  const name = input.name.trim().slice(0, 80);
  const ctaUrl = `${site}${CTA_PATH}`;

  const p = progressLine(input);
  const progress = isAr ? p.ar : p.en;

  const plansBlock = (() => {
    const titles = input.activePlanTitles
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 3);
    if (titles.length === 0) {
      return isAr
        ? "لا توجد خطة مفعّلة حاليًا — راسلني في المحادثة وسأبني لك خطة تناسب هدفك."
        : "You have no active plan right now — ask me in the chat and I'll build one that fits your goal.";
    }
    const list = isAr
      ? `خططك المفعّلة: ${titles.join("، ")}.`
      : `Your active plans: ${titles.join(", ")}.`;
    return isAr
      ? `${list} إن شعرت أنها لم تعد تناسبك، أخبرني في المحادثة ونعدّلها معًا.`
      : `${list} If it doesn't feel right lately, tell me in the chat and we'll adjust it.`;
  })();

  const subject = isAr
    ? "متابعتك الأسبوعية من EVO — مدرب Alkemos"
    : "Your weekly check-in from EVO — your Alkemos coach";

  const optOutAr =
    "وصلتك هذه الرسالة لأنك فعّلت المتابعة الأسبوعية من EVO على Alkemos. لإيقافها، عدّل تفضيل المتابعة من صفحة حسابك على الموقع.";
  const optOutEn =
    "You received this because you enabled the weekly EVO check-in on Alkemos. To stop it, change the follow-up preference from your profile page on the site.";

  const greeting = name
    ? isAr
      ? `أهلًا ${esc(name)}،`
      : `Hi ${esc(name)},`
    : isAr
      ? "أهلًا بك،"
      : "Hi there,";

  const html = `<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;" dir="${isAr ? "rtl" : "ltr"}">

    <div style="background:#1d1d1f;border-radius:18px 18px 0 0;padding:28px 24px;text-align:center;">
      <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.3px;">Alkemos</div>
      <div style="color:#a1a1a6;font-size:14px;margin-top:6px;">EVO — ${isAr ? "مدربك الرقمي" : "Your digital coach"}</div>
    </div>

    <div style="background:#ffffff;padding:32px 28px;text-align:${isAr ? "right" : "left"};">
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1d1d1f;">${greeting}</p>
      <p style="margin:0 0 24px;color:#6e6e73;line-height:1.9;">
        ${isAr
          ? "إليك جولة سريعة على أسبوعك — أرقامك الحقيقية فقط، دون كلام إنشائي."
          : "Quick tour of your week — your real numbers only, no filler."}
      </p>

      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1d1d1f;">${isAr ? "تقدمك" : "Your progress"}</p>
      <p style="margin:0 0 20px;color:#424245;line-height:1.9;">${esc(progress)}</p>

      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#34c759;">${isAr ? "خطتك" : "Your plan"}</p>
      <p style="margin:0;color:#424245;line-height:1.9;">${esc(plansBlock)}</p>

      <div style="text-align:center;margin:32px 0 8px;">
        <a href="${ctaUrl}"
          style="display:inline-block;background:#0071e3;color:#ffffff;text-decoration:none;
          padding:14px 36px;border-radius:999px;font-weight:600;font-size:15px;">
          ${isAr ? "سجّل قياسك الآن" : "Log your measurement now"}
        </a>
      </div>
    </div>

    <div style="background:#1d1d1f;border-radius:0 0 18px 18px;padding:20px 24px;text-align:center;">
      <p style="margin:0;color:#8e8e93;font-size:12px;line-height:1.8;">
        ${isAr ? optOutAr : optOutEn}<br />
        © 2026 Alkemos — ${isAr ? "كل الحقوق محفوظة" : "All rights reserved"}
      </p>
    </div>

  </div>
</body>
</html>`;

  const text = [
    isAr ? (name ? `أهلًا ${name}،` : "أهلًا بك،") : name ? `Hi ${name},` : "Hi there,",
    "",
    progress,
    "",
    plansBlock,
    "",
    `${site}${CTA_PATH}`,
    "",
    isAr ? optOutAr : optOutEn,
  ].join("\n");

  return { subject, html, text };
}
