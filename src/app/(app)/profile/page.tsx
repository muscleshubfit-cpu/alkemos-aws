"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useMembershipTier } from "@/hooks/use-membership-tier";
import { useNav } from "@/hooks/use-nav";
import { SiteHeader } from "@/components/SiteHeader";
import { openEvoFloatingChat } from "@/lib/evo-chat-events";
import { supabase } from "@/lib/supabase/client";
import { buildFollowupPrefWrite } from "@/lib/evo-followup";
import { compressImageFile } from "@/lib/image-compress";
import type { Database } from "@/lib/supabase/types";
import { MEMBERSHIPS, getLimits, type MembershipTier } from "@/lib/memberships";
import { EXERCISES_COUNT } from "@/lib/exercises-shared";
import { FOODS_COUNT } from "@/lib/foods-shared";
// m4 FIX (DEEP-UX-AUDIT-2026-09-18, owner decision «عدد الأدوات الصحيح»):
// the profile's Tools stat was a hardcoded "6" while the hub actually
// serves 8 tools — the 5 calculators/trackers PLUS the meal planner and
// the two AI planners (Phase 195 owner directive «الرقم الحقيقي للأدوات
// هو 8»). Same single-source pattern as EXERCISES_COUNT / FOODS_COUNT:
// derive from tools-shared.ts so every surface agrees with the hub.
import { TOOLS_COUNT } from "@/lib/tools-shared";
import { WORKOUT_PROGRAMS } from "@/lib/workout-programs";
import {
  User,
  Camera,
  Save,
  Loader2,
  Crown,
  ShieldCheck,
  Bell,
  Dumbbell,
  Apple,
  FileText,
  Calculator,
  Settings,
  Bookmark,
  Trash2,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { profile, loading, signOutAsync, isCoach, isAdmin } = useAuth();
  const { navigate } = useNav();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PHASE 68 — subscription management (owner-approved cancel flow).
  // The FAQ promises «ألغِ في أي وقت» — this is the backing UI.
  const [subEndDate, setSubEndDate] = useState<string | null>(null);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  // PHASE 76 — 7-day refund request (owner: «استرجاع الفلوس خلال ٧ ايام
  // بشرط عدم استخدام المميزات»). Server computes the verdict; we display it.
  type RefundEligibility = {
    eligible: boolean;
    reason: string | null;
    daysLeft: number;
    windowDays: number;
    message: string | null;
  };
  const [refundInfo, setRefundInfo] = useState<RefundEligibility | null>(null);
  const [refundStatus, setRefundStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [refundNote, setRefundNote] = useState<string | null>(null);
  const [refundBusy, setRefundBusy] = useState(false);
  // Phase 247: a failed eligibility check used to render identically to
  // «ineligible» — an honest degraded note instead of a silent lie.
  const [refundCheckFailed, setRefundCheckFailed] = useState(false);

  // Determine membership tier via the useMembershipTier hook
  // (queries subscriptions table — NOT the missing profile.membership_tier field)
  const { tier } = useMembershipTier(profile);
  const limits = getLimits(tier);
  const membership = MEMBERSHIPS.find((m) => m.id === tier);

  // AGGREGATED PAID-POOL (owner order 2026-10-28 «تجميع حصص الاشتراكات
  // المدفوعة»): the plan-pool line shows the AGGREGATED monthly pool —
  // every distinct effectively-active paid tier contributes its pool
  // once (premium 4 + pro 8 = 12). The single-source for that number is
  // the METER (/api/ai/quota — the same checkUnifiedPlanQuota verdict
  // the generation gates enforce; meter == enforcement law), NOT a
  // client-side recomputation. Other limits below stay per-tier
  // (best-tier feature gates — ads/saves/chat/swap semantics unchanged).
  const [planPoolLimit, setPlanPoolLimit] = useState<number | null>(null);
  useEffect(() => {
    if (!profile || isCoach || isAdmin) return;
    let cancelled = false;
    fetch("/api/ai/quota")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.plans || j.plans.unlimited) return;
        if (typeof j.plans.limit === "number" && j.plans.limit > 0) {
          setPlanPoolLimit(j.plans.limit);
        }
      })
      .catch(() => {
        // fail-soft: the per-tier number below stays (honest best-effort)
      });
    return () => {
      cancelled = true;
    };
  }, [profile, isCoach, isAdmin]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // PHASE 68 — read the active subscription's end date + cancel state
  // (client SELECT own rows is allowed by 0041 subs_select_owner_or_coach)
  useEffect(() => {
    if (!profile || isCoach || isAdmin || !supabase) return;
    const nowIso = new Date().toISOString();
    supabase
      .from("subscriptions")
      .select("end_date, cancel_requested_at")
      .eq("client_id", profile.id)
      .eq("status", "active")
      .gt("end_date", nowIso)
      .order("end_date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("[profile] subscription read failed:", error.message);
        if (data) {
          setSubEndDate(data.end_date);
          setCancelRequested(!!data.cancel_requested_at);
        } else {
          setSubEndDate(null);
          setCancelRequested(false);
        }
      });
  }, [profile, isCoach, isAdmin]);

  // PHASE 76 — read the refund eligibility + latest request state
  useEffect(() => {
    if (!profile || isCoach || isAdmin) return;
    fetch("/api/refund/request")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body) => {
        if (!body) return;
        setRefundInfo(body.eligibility ?? null);
        if (body.latest) {
          setRefundStatus(body.latest.status);
          setRefundNote(body.latest.admin_note ?? null);
        }
      })
      .catch((e) => {
        console.error("[profile] refund eligibility check failed:", e);
        setRefundCheckFailed(true);
      });
  }, [profile, isCoach, isAdmin]);

  const requestRefund = async () => {
    const confirmed = confirm(
      isAr
        ? "تأكيد طلب استرداد المبلغ؟ هيتابع الدعم الاشتراك ويتم إيقافه عند الموافقة، بشرط إنك مستخدمتش أي مميزة مدفوعة."
        : "Confirm refund request? The subscription will be reviewed and stopped upon approval, provided you haven't used any paid features.",
    );
    if (!confirmed) return;
    setRefundBusy(true);
    try {
      const res = await fetch("/api/refund/request", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || (isAr ? "غير مؤهل لطلب الاسترداد" : "Not eligible for a refund"));
      }
      setRefundStatus("pending");
      toast.success(body?.message || (isAr ? "تم إرسال طلب الاسترداد" : "Refund request sent"));
    } catch (e) {
      toast.error(
        e instanceof Error && e.message ? e.message : isAr ? "حدث خطأ — حاول مرة أخرى" : "Something went wrong",
      );
    } finally {
      setRefundBusy(false);
    }
  };

  const requestCancelSubscription = async () => {
    const confirmed = confirm(
      isAr
        ? "تأكيد طلب إلغاء الاشتراك؟ باقتك هتفضل شغالة لآخر مدة دفعتها، ومفيش أي خصم تلقائي بعدها."
        : "Confirm cancellation request? Your plan stays active until the end of the period you paid for, and nothing renews automatically.",
    );
    if (!confirmed) return;
    setCancelBusy(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Request failed");
      }
      setCancelRequested(true);
      toast.success(
        isAr
          ? "تم تسجيل طلب الإلغاء — باقتك شغالة لآخر مدة مدفوعة"
          : "Cancellation recorded — your plan stays active until the period ends",
      );
    } catch (e) {
      toast.error(
        e instanceof Error && e.message
          ? e.message
          : isAr ? "حدث خطأ — حاول مرة أخرى" : "Something went wrong",
      );
    } finally {
      setCancelBusy(false);
    }
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !profile) {
      navigate("auth", { mode: "login" });
    }
  }, [loading, profile, navigate]);

  const handleAvatarUpload = async (file: File) => {
    if (!profile || !supabase) {
      toast.error(isAr ? "غير قادر على رفع الصورة" : "Unable to upload");
      return;
    }
    // Phase 98: compress ON-DEVICE before the size gate — a 6MB phone
    // photo becomes a few-hundred-KB ~512px WebP that renders identically
    // as an avatar. The helper never throws; the original file wins when
    // compression is impossible, so the upload path is unbreakable.
    file = await compressImageFile(file, { maxDim: 512, quality: 0.85 });
    if (file.size > 2 * 1024 * 1024) {
      toast.error(isAr ? "الصورة كبيرة (حد أقصى 2 ميجا)" : "Image too large (max 2MB)");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;

      // SECURITY SPLIT (2026-09-20, owner-approved urgent fix): avatars go to
      // the dedicated PUBLIC `avatars` bucket (migration 0090) so the sensitive
      // `questionnaire-photos` bucket could be flipped fully PRIVATE (migration
      // 0091). Public URL stays the avatar serving model — coach avatars render
      // on public pages (coach landing / featured) where signed URLs would
      // expire and /api/file would 403. Upload failure still falls back to a
      // data URL below, so a not-yet-migrated environment degrades gracefully.
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        // Fallback: base64 data URL
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setAvatarUrl(dataUrl);
          updateProfile({ avatar_url: dataUrl });
        };
        reader.readAsDataURL(file);
      } else {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        const url = urlData.publicUrl;
        setAvatarUrl(url);
        await updateProfile({ avatar_url: url });
      }

      toast.success(isAr ? "تم رفع الصورة!" : "Avatar updated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (isAr ? "فشل رفع الصورة" : "Upload failed"));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /**
   * PROFILE-SAVE HONESTY FIX 2026-10-29 (FULL-ACCOUNTS-FUNCTIONAL-QA
   * finding, live round): the old updateProfile swallowed the Supabase
   * error (console.error only, no throw) — handleSave's try block then
   * ALWAYS reached toast.success, so a failing update (RLS/network/
   * expired session) showed «Changes saved» over unsaved data. Same
   * honesty class as the DRAFT-DELETE FIX 2026-10-24 (deletePlan): the
   * user must hear the truth. The contract is now boolean — callers
   * toast success ONLY on a real 204.
   */
  const updateProfile = async (
    updates: Database["public"]["Tables"]["profiles"]["Update"],
  ): Promise<boolean> => {
    if (!profile || !supabase) return false;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);
    if (error) {
      console.error("[profile] Update failed:", error.message);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const ok = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      if (ok) {
        toast.success(isAr ? "تم حفظ التغييرات" : "Changes saved");
      } else {
        toast.error(
          isAr
            ? "تعذر حفظ التغييرات — تحقق من اتصالك وحاول مرة أخرى"
            : "Could not save your changes — check your connection and try again",
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (isAr ? "فشل الحفظ" : "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader variant="landing" />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
        </div>
      </div>
    );
  }

  // Stats cards — counts come from the shared constants (test-enforced
  // against the real arrays). BUNDLE LAW (2026-09-05): importing the
  // 3.6MB foods.ts + 1.6MB exercises.ts here just to read two numbers
  // shipped ~5MB of dead data to every profile visitor.
  const stats = [
    { icon: Dumbbell, label: isAr ? "تمارين" : "Exercises", value: `${EXERCISES_COUNT}+`, color: "#0071e3" },
    { icon: Apple, label: isAr ? "أكلات" : "Foods", value: `${FOODS_COUNT.toLocaleString()}+`, color: "#34c759" },
    { icon: Calculator, label: isAr ? "أدوات" : "Tools", value: `${TOOLS_COUNT}`, color: "#ff9500" },
    { icon: FileText, label: isAr ? "برامج" : "Programs", value: `${WORKOUT_PROGRAMS.length}`, color: "#8b5cf6" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* Profile header */}
        <div className="rounded-3xl bg-white p-6 md:p-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="relative">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-[#0071e3]/20 transition-all hover:ring-[#0071e3]/40"
                disabled={uploadingAvatar}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={fullName || "Avatar"} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#0071e3] text-3xl font-semibold text-white">
                    {(fullName || "U")[0].toUpperCase()}
                  </div>
                )}
              </button>
              {/* Camera button overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 end-0 grid h-8 w-8 place-items-center rounded-full bg-[#0071e3] text-white shadow-lg transition-opacity hover:opacity-90"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarUpload(f);
                }}
              />
            </div>

            {/* Name + membership */}
            <div className="flex-1 text-center sm:text-start">
              <h1 className="text-2xl font-semibold tracking-tight">
                {fullName || (isAr ? "مستخدم" : "User")}
              </h1>
              <p className="mt-0.5 text-sm font-normal text-[#6e6e73]" dir="ltr">
                {profile.phone || ""}
              </p>
              {/* Membership badge — staff (coach/admin) get a ROLE badge
                  instead: the platform owner is not a subscriber of his
                  own product, and never sees an upgrade CTA. */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {isCoach ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                      isAdmin
                        ? "bg-[#1d1d1f] text-white"
                        : "bg-[#8b5cf6]/10 text-[#8b5cf6]",
                    )}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {isAdmin
                      ? isAr ? "إدارة المنصة" : "Platform Admin"
                      : isAr ? "مدرب معتمد" : "Coach"}
                  </span>
                ) : (
                  <>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                        tier === "pro" && "bg-[#1d1d1f] text-white",
                        tier === "premium" && "bg-[#0071e3]/10 text-[#0071e3]",
                        tier === "free" && "bg-[#6e6e73]/10 text-[#6e6e73]",
                        tier === "coaching" && "bg-[#8b5cf6]/10 text-[#8b5cf6]",
                      )}
                    >
                      <Crown className="h-3 w-3" />
                      {isAr ? membership?.nameAr : membership?.nameEn}
                    </span>
                    {tier === "free" && (
                      <a
                        href="/memberships"
                        className="text-xs font-medium text-[#0071e3] hover:underline"
                      >
                        {isAr ? "ترقية العضوية ›" : "Upgrade ›"}
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="rounded-2xl bg-white p-4 text-center">
                <Icon className="mx-auto h-5 w-5" style={{ color: s.color }} />
                <p className="mt-2 text-lg font-semibold">{s.value}</p>
                <p className="text-xs font-normal text-[#6e6e73]">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* PHASE 68 — subscription management (cancel request, owner-approved).
            Members only; staff resolve to the coaching tier by default. */}
        {!isCoach && !isAdmin && tier !== "free" && (
          <div className="mt-4 rounded-3xl bg-white p-6 md:p-8">
            <h2 className="text-lg font-semibold tracking-tight">
              {isAr ? "إدارة الاشتراك" : "Subscription"}
            </h2>
            <p className="mt-2 text-sm font-normal text-[#6e6e73]">
              {isAr
                ? `باقتك الحالية: ${membership?.nameAr ?? tier}${subEndDate ? ` — شغالة حتى ${new Date(subEndDate).toLocaleDateString(isAr ? "ar-EG" : "en-US")}` : ""}. مفيش أي خصم تلقائي في الموقع — اشتراكك بينتهي لوحده لو ما جدّدتش.`
                : `Current plan: ${membership?.nameEn ?? tier}${subEndDate ? ` — active until ${new Date(subEndDate).toLocaleDateString(isAr ? "ar-EG" : "en-US")}` : ""}. Nothing renews automatically — your plan simply ends if you don't pay again.`}
            </p>
            {cancelRequested ? (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ff9500]/10 px-4 py-2 text-xs font-medium text-[#ff9500]">
                {isAr
                  ? "طلب الإلغاء مسجل — باقتك شغالة لآخر مدة مدفوعة"
                  : "Cancellation recorded — your plan stays active until the period ends"}
              </p>
            ) : (
              <button
                onClick={requestCancelSubscription}
                disabled={cancelBusy || !subEndDate}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] px-5 py-2.5 text-sm font-medium text-[#1d1d1f] transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {cancelBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAr ? "إلغاء الاشتراك" : "Cancel subscription"}
              </button>
            )}

            {/* PHASE 76 — 7-day money-back (owner request): استرداد خلال
                7 أيام بشرط عدم استخدام المميزات المدفوعة. The verdict is
                computed server-side from the usage ledgers. Inside this
                block tier is already a paid tier (outer guard). */}
            <div className="mt-5 rounded-2xl border border-[#f2f2f7] bg-[#f5f5f7]/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {isAr ? "استرداد كامل خلال 7 أيام من التفعيل" : "Full refund within 7 days of activation"}
                    </p>
                    <p className="mt-1 text-xs font-normal text-[#6e6e73]">
                      {isAr
                        ? "الشرط: عدم استخدام أي ميزة مدفوعة (محادثات إيفو، توليد الخطط، التبديلات، حفظ النتائج)."
                        : "Condition: no paid feature used (EVO chats, plan generation, swaps, saved results)."}
                      {refundInfo?.eligible && refundInfo.daysLeft > 0
                        ? isAr
                          ? ` — باقي ${refundInfo.daysLeft} يوم من مدة الاسترداد`
                          : ` — ${refundInfo.daysLeft} day(s) left in the window`
                        : ""}
                    </p>
                    {refundInfo && !refundInfo.eligible && refundStatus === null && refundInfo.message && (
                      <p className="mt-1 text-xs font-normal text-[#ff3b30]">{refundInfo.message}</p>
                    )}
                    {refundCheckFailed && (
                      <p className="mt-1 text-xs font-normal text-[#6e6e73]">
                        {isAr
                          ? "تعذر التحقق من أهلية الاسترداد الآن — حدّث الصفحة لاحقًا."
                          : "Couldn't check refund eligibility right now — refresh later."}
                      </p>
                    )}
                    {refundStatus === "pending" && (
                      <p className="mt-2 inline-flex rounded-full bg-[#ff9500]/10 px-3 py-1.5 text-xs font-medium text-[#ff9500]">
                        {isAr ? "طلب الاسترداد قيد المراجعة — هنرد عليك قريب" : "Refund request under review"}
                      </p>
                    )}
                    {refundStatus === "approved" && (
                      <p className="mt-2 inline-flex rounded-full bg-[#34c759]/10 px-3 py-1.5 text-xs font-medium text-[#34c759]">
                        {isAr ? "تم قبول الاسترداد — سيتم تحويل المبلغ" : "Refund approved — money on its way"}
                      </p>
                    )}
                    {refundStatus === "rejected" && (
                      <p className="mt-2 inline-flex rounded-full bg-[#ff3b30]/10 px-3 py-1.5 text-xs font-medium text-[#ff3b30]">
                        {isAr
                          ? `تم رفض طلب الاسترداد${refundNote ? ` — السبب: ${refundNote}` : ""}`
                          : `Refund rejected${refundNote ? ` — ${refundNote}` : ""}`}
                      </p>
                    )}
                  </div>
                  {refundStatus === null && (
                    <button
                      onClick={requestRefund}
                      disabled={refundBusy || (refundInfo !== null && !refundInfo.eligible)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-5 py-2.5 text-sm font-medium text-[#1d1d1f] transition-opacity hover:opacity-80 disabled:opacity-50"
                    >
                      {refundBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isAr ? "طلب استرداد المبلغ" : "Request refund"}
                    </button>
                  )}
                </div>
            </div>
          </div>
        )}

        {/* Edit profile */}
        <div className="mt-4 rounded-3xl bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold tracking-tight">
            {isAr ? "تعديل الملف الشخصي" : "Edit Profile"}
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {isAr ? "الاسم" : "Full Name"}
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-2.5 text-base font-normal outline-none focus:border-[#0071e3]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {isAr ? "رقم الهاتف" : "Phone"}
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-2.5 text-base font-normal outline-none focus:border-[#0071e3]"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-6 py-2.5 text-sm font-normal text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isAr ? "حفظ" : "Save"}
            </button>
          </div>
        </div>

        {/* EVO weekly follow-up opt-in — EVO-3/D4 activation step 3. The
            card ships only now that EVO_FOLLOWUP_ENABLED is LIVE and the
            Brevo send path is proven (no promise without backing — the
            activation decree). Writes go client-direct under 0079 RLS
            (insert authed-own / update owner); opt-out is an UPDATE,
            never a delete (D2). */}
        <EvoFollowupSection isAr={isAr} userId={profile?.id} />

        {/* Saved tool results */}
        <SavedResultsSection isAr={isAr} userId={profile?.id} />

        {/* Saved meal plans */}
        <SavedMealPlansSection isAr={isAr} userId={profile?.id} />

        {/* Quick links */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: isAr ? "لوحة التحكم" : "Dashboard", href: "/dashboard", icon: Dumbbell },
            { label: isAr ? "خططي" : "My Plans", href: "/plans", icon: FileText },
            { label: isAr ? "مخطط الوجبات" : "Meal Planner", href: "/meal-planner", icon: Utensils },
            { label: isAr ? "تقدمي" : "Progress", href: "/progress", icon: Calculator },
            // EVO CHAT SURFACE LAW: opens the floating widget — /chat is removed.
            { label: isAr ? "كوتش EVO" : "EVO Coach", href: "#evo-chat", icon: Bell, evoChat: true },
            { label: isAr ? "الإحالات" : "Referral", href: "/referral", icon: Crown },
            { label: isAr ? "الدعم" : "Support", href: "/support", icon: Settings },
          ].map((link, i) => {
            const Icon = link.icon;
            if ("evoChat" in link && link.evoChat) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={openEvoFloatingChat}
                  className="flex cursor-pointer items-center gap-2 rounded-2xl bg-white p-4 text-start text-sm font-medium transition-colors hover:bg-[#f5f5f7]"
                >
                  <Icon className="h-4 w-4 text-[#6e6e73]" />
                  {link.label}
                </button>
              );
            }
            return (
              <Link
                key={i}
                href={link.href}
                className="flex items-center gap-2 rounded-2xl bg-white p-4 text-sm font-medium transition-colors hover:bg-[#f5f5f7]"
              >
                <Icon className="h-4 w-4 text-[#6e6e73]" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Membership limits summary — Phase 103 (owner: «الادمن فى صفحتة
            الشخصية بتظهر بيانات وحدود استخدام مثل العضويات وده مش منطقى»):
            the member-facing limits card is HIDDEN for admins entirely — the
            platform admin is not a subscriber of his own product. Coaches
            keep it (Phase 51: staff resolve to the coaching tier). */}
        {!isAdmin && (
          <div className="mt-4 rounded-3xl bg-white p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                {isAr ? "حدود عضويتك" : "Your Plan Limits"}
              </h2>
              {/* Phase 51 — staff accounts resolve to the coaching tier and
                  never buy site memberships; the member «ترقية» CTA made the
                  page feel member-facing (owner complaint). */}
              {!isCoach && (
                <a href="/memberships" className="text-xs font-medium text-[#0071e3] hover:underline">
                  {isAr ? "ترقية ›" : "Upgrade ›"}
                </a>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: isAr ? "EVO رسائل يوميًا" : "EVO messages a day", value: limits.evoChatDailyLimit === null ? "∞" : `${limits.evoChatDailyLimit}` },
                // Unified pool (2026-09-13): ONE monthly budget for
                // nutrition + workout AI generations combined.
                { label: isAr ? "توليدات خطط AI/شهر" : "AI plan gens/mo", value: `${planPoolLimit ?? limits.aiPlanMonthlyLimit}` },
                { label: isAr ? "تبديلات/أسبوع" : "Swaps/week", value: limits.evoSwapLimit === 0 ? "—" : limits.evoSwapLimit === null ? "∞" : `${limits.evoSwapLimit}` },
                { label: isAr ? "حفظ نتائج" : "Saved results", value: limits.savedResultsLimit === null ? "∞" : `${limits.savedResultsLimit}` },
                { label: isAr ? "جداول وجبات" : "Meal plans saved", value: limits.mealPlannerMaxSaved === null ? "∞" : `${limits.mealPlannerMaxSaved}` },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-[#f5f5f7] p-3">
                  <p className="text-xs font-normal text-[#6e6e73]">{item.label}</p>
                  <p className="mt-0.5 text-lg font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={async () => {
            await signOutAsync();
            navigate("landing");
          }}
          className="mt-4 w-full rounded-2xl bg-white py-3.5 text-center text-sm font-medium text-[#ff3b30] transition-colors hover:bg-[#ff3b30]/5"
        >
          {isAr ? "تسجيل الخروج" : "Log out"}
        </button>
      </main>
    </div>
  );
}

// EVO weekly follow-up opt-in card — EVO-3/D4 activation step 3.
// The opt-out surface the email footer points at («من صفحة حسابك») —
// Platform Truth law: the promise in the email is backed by this card.
function EvoFollowupSection({
  isAr,
  userId,
}: {
  isAr: boolean;
  userId?: string;
}) {
  const [row, setRow] = useState<{
    opted_in: boolean;
    language: string;
    last_sent_at: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const optedIn = !!row?.opted_in;
  // No row yet → the captured language defaults to the current UI language.
  const mailLang: "ar" | "en" = row
    ? row.language === "en"
      ? "en"
      : "ar"
    : isAr
      ? "ar"
      : "en";

  useEffect(() => {
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("evo_followup_prefs")
      .select("opted_in, language, last_sent_at")
      .eq("client_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setRow(data ?? null);
        setLoading(false);
      });
  }, [userId]);

  const applyWrite = async (nextOptedIn: boolean, language: "ar" | "en") => {
    if (!userId || !supabase) return;
    const write = buildFollowupPrefWrite(userId, row, {
      optedIn: nextOptedIn,
      language,
    });
    if (!write) return; // no-op — no write, no updated_at churn
    setBusy(true);
    try {
      const res =
        write.mode === "insert"
          ? await supabase.from("evo_followup_prefs").insert(write.values)
          : await supabase
              .from("evo_followup_prefs")
              .update(write.values)
              .eq("client_id", userId);
      if (res.error) throw res.error;
      setRow((prev) => ({
        opted_in: nextOptedIn,
        language: nextOptedIn ? language : (prev?.language ?? language),
        last_sent_at: prev?.last_sent_at ?? null,
      }));
      toast.success(
        nextOptedIn
          ? isAr
            ? "تم تفعيل المتابعة الأسبوعية من EVO — أول رسالة مع أول دورة إرسال"
            : "Weekly EVO check-in enabled — first email with the next send cycle"
          : isAr
            ? "تم إيقاف المتابعة الأسبوعية"
            : "Weekly EVO check-in disabled",
      );
    } catch {
      toast.error(
        isAr ? "حدث خطأ — حاول مرة أخرى" : "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-3xl bg-white p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {isAr ? "متابعة EVO الأسبوعية" : "Weekly EVO Check-in"}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm font-normal leading-relaxed text-[#6e6e73]">
            {isAr
              ? "بريد أسبوعي من مدربك EVO (evo@alkemos.com) بملخص تقدمك الحقيقي المسجل على المنصة — أرقامك بس من غير حشو. تقدر توقفيه في أي وقت من هنا."
              : "A weekly email from your coach EVO (evo@alkemos.com) summarizing your real logged progress — your numbers only, no filler. Turn it off anytime from here."}
          </p>
        </div>
        {loading ? (
          <Loader2 className="mt-1 h-6 w-6 shrink-0 animate-spin text-[#0071e3]" />
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => applyWrite(!optedIn, mailLang)}
            aria-pressed={optedIn}
            aria-label={
              isAr
                ? "تفعيل أو إيقاف متابعة EVO الأسبوعية"
                : "Toggle the weekly EVO check-in"
            }
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50",
              optedIn ? "bg-[#34c759]" : "bg-[#d2d2d7]",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
                optedIn ? "start-[22px]" : "start-0.5",
              )}
            />
          </button>
        )}
      </div>

      {optedIn && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">
            {isAr ? "لغة البريد:" : "Email language:"}
          </span>
          <div className="flex overflow-hidden rounded-full border border-[#d2d2d7]">
            {(["ar", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                disabled={busy}
                onClick={() => applyWrite(true, l)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                  mailLang === l
                    ? "bg-[#0071e3] text-white"
                    : "bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]",
                )}
              >
                {l === "ar" ? "عربي" : "English"}
              </button>
            ))}
          </div>
          {row?.last_sent_at && (
            <span className="text-xs font-normal text-[#6e6e73]">
              {isAr ? "آخر رسالة: " : "Last email: "}
              {new Date(row.last_sent_at).toLocaleDateString(isAr ? "ar" : "en")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Saved results section component
function SavedResultsSection({ isAr, userId }: { isAr: boolean; userId?: string }) {
  /** saved-results API row — only the fields this section renders. */
  type SavedResultRow = {
    id: string;
    tool_slug: string;
    title?: string | null;
    created_at: string;
  };
  const [results, setResults] = useState<SavedResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/tools/saved-results");
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tools/saved-results?id=${id}`, { method: "DELETE" });
      setResults((prev) => prev.filter((r) => r.id !== id));
      toast.success(isAr ? "تم الحذف" : "Deleted");
    } catch {
      toast.error(isAr ? "فشل الحذف" : "Failed");
    }
  };

  const TOOL_NAMES: Record<string, string> = {
    "calorie-calculator": isAr ? "حاسبة السعرات" : "Calorie Calculator",
    "bmi-calculator": isAr ? "حاسبة BMI" : "BMI Calculator",
    "macro-calculator": isAr ? "حاسبة الماكروز" : "Macro Calculator",
    "body-fat-calculator": isAr ? "حاسبة الدهون" : "Body Fat Calculator",
    "water-tracker": isAr ? "متتبع الماء" : "Water Tracker",
  };

  return (
    <div className="mt-4 rounded-3xl bg-white p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          {isAr ? "النتائج المحفوظة" : "Saved Results"}
        </h2>
        <span className="text-xs font-normal text-[#6e6e73]">
          {results.length} {isAr ? "نتيجة" : "results"}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#0071e3]" />
        </div>
      ) : results.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-[#f5f5f7] p-8 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-[#d2d2d7]" />
          <p className="mt-3 text-sm font-normal text-[#6e6e73]">
            {isAr
              ? "مفيش نتائج محفوظة بعد. استخدم الأدوات واحفظ نتائجك."
              : "No saved results yet. Use the tools and save your results."}
          </p>
          <a
            href="/tools"
            className="mt-3 inline-block text-sm font-medium text-[#0071e3] hover:underline"
          >
            {isAr ? "تصفح الأدوات ›" : "Browse tools ›"}
          </a>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {results.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-[#f5f5f7] p-3"
            >
              <div className="min-w-0 flex-1">
                <a
                  href={`/tools/${r.tool_slug}`}
                  className="block truncate text-sm font-medium text-[#1d1d1f] hover:text-[#0071e3]"
                  title={isAr ? "افتح الأداة" : "Open tool"}
                >
                  {r.title || TOOL_NAMES[r.tool_slug] || r.tool_slug}
                </a>
                <p className="mt-0.5 text-xs font-normal text-[#6e6e73]">
                  {TOOL_NAMES[r.tool_slug] || r.tool_slug} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={`/tools/${r.tool_slug}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#0071e3] transition-colors hover:bg-[#0071e3]/5"
                  title={isAr ? "فتح الأداة" : "Open tool"}
                >
                  <Calculator className="h-4 w-4" />
                </a>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#ff3b30] transition-colors hover:bg-[#ff3b30]/5"
                  title={isAr ? "حذف" : "Delete"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Saved meal plans section component
function SavedMealPlansSection({ isAr, userId }: { isAr: boolean; userId?: string }) {
  /** saved-meal-plans API row — only the fields this section renders. */
  type SavedMealPlanRow = {
    id: string;
    title?: string | null;
    created_at?: string;
    total_calories?: number | null;
    total_protein?: number | null;
    total_carbs?: number | null;
    total_fat?: number | null;
    meal_count?: number | null;
    plan_data?: {
      meals?: {
        name?: string;
        items?: {
          name?: string;
          grams?: number | null;
          per100g?: {
            calories?: number | null;
            protein?: number | null;
            carbs?: number | null;
            fat?: number | null;
          } | null;
        }[];
      }[];
    } | null;
  };
  const [plans, setPlans] = useState<SavedMealPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/tools/saved-meal-plans");
        if (res.ok) {
          const data = await res.json();
          setPlans(data.results || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tools/saved-meal-plans?id=${id}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast.success(isAr ? "تم الحذف" : "Deleted");
    } catch {
      toast.error(isAr ? "فشل الحذف" : "Failed");
    }
  };

  return (
    <div className="mt-4 rounded-3xl bg-white p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          {isAr ? "جداول الوجبات المحفوظة" : "Saved Meal Plans"}
        </h2>
        <span className="text-xs font-normal text-[#6e6e73]">
          {plans.length} {isAr ? "جدول" : "plans"}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#0071e3]" />
        </div>
      ) : plans.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-[#f5f5f7] p-8 text-center">
          <Utensils className="mx-auto h-8 w-8 text-[#d2d2d7]" />
          <p className="mt-3 text-sm font-normal text-[#6e6e73]">
            {isAr
              ? "مفيش جداول محفوظة بعد. ابدأ ببناء جدول وجباتك."
              : "No saved meal plans yet. Start building your meal plan."}
          </p>
          <a
            href="/meal-planner"
            className="mt-3 inline-block text-sm font-medium text-[#0071e3] hover:underline"
          >
            {isAr ? "افتح مخطط الوجبات ›" : "Open Meal Planner ›"}
          </a>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {plans.map((p) => {
            const isExpanded = expandedId === p.id;
            const totals = {
              calories: p.total_calories ?? 0,
              protein: p.total_protein ?? 0,
              carbs: p.total_carbs ?? 0,
              fat: p.total_fat ?? 0,
            };
            const mealCount = p.meal_count ?? p.plan_data?.meals?.length ?? 0;
            return (
              <div
                key={p.id}
                className="rounded-xl bg-[#f5f5f7] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-start"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6]">
                      <Utensils className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {p.title || (isAr ? "جدول وجبات" : "Meal Plan")}
                      </p>
                      <p className="mt-0.5 text-xs font-normal text-[#6e6e73]" dir="ltr">
                        {totals.calories}{isAr ? " كالوري" : " kcal"} · P{totals.protein}{isAr ? " جم" : "g"} · C{totals.carbs}{isAr ? " جم" : "g"} · F{totals.fat}{isAr ? " جم" : "g"} · {mealCount} {isAr ? "وجبات" : "meals"} · {new Date(p.created_at ?? "").toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <a
                      href="/meal-planner"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#0071e3] transition-colors hover:bg-[#0071e3]/5"
                      title={isAr ? "افتح المخطط" : "Open planner"}
                    >
                      <Utensils className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#ff3b30] transition-colors hover:bg-[#ff3b30]/5"
                      title={isAr ? "حذف" : "Delete"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && p.plan_data?.meals && (
                  <div className="mt-3 space-y-2 border-t border-[#d2d2d7] pt-3">
                    {p.plan_data.meals.map((meal, mi) => {
                      const items = meal.items || [];
                      let mCal = 0, mP = 0, mC = 0, mF = 0;
                      for (const item of items) {
                        const factor = (item.grams || 0) / 100;
                        mCal += Math.round((item.per100g?.calories || 0) * factor);
                        mP   += Math.round((item.per100g?.protein  || 0) * factor);
                        mC   += Math.round((item.per100g?.carbs    || 0) * factor);
                        mF   += Math.round((item.per100g?.fat      || 0) * factor);
                      }
                      return (
                        <div key={mi} className="rounded-lg bg-white p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{meal.name}</p>
                            <p className="text-xs font-normal text-[#6e6e73]" dir="ltr">
                              {mCal} kcal · P{mP}g · C{mC}g · F{mF}g
                            </p>
                          </div>
                          {(items).length > 0 && (
                            <ul className="mt-2 space-y-0.5">
                              {items.map((item, ii) => (
                                <li
                                  key={ii}
                                  className="flex items-center justify-between text-xs text-[#6e6e73]"
                                  dir="ltr"
                                >
                                  <span className="truncate">{item.name}</span>
                                  <span className="shrink-0 ms-2">
                                    {item.grams}g · {Math.round((item.per100g?.calories || 0) * (item.grams || 0) / 100)} kcal
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
