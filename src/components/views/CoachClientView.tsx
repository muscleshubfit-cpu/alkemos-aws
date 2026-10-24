"use client";

import Image from "next/image";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
 ArrowLeft,
 User as UserIcon,
 CreditCard,
 Salad,
 Dumbbell,
 Upload,
 LineChart as LineChartIcon,
 Trash2,
 Sparkles,
 Wand2,
 Loader2,
 Check,
 Eye,
 Pencil,
 Plus,
 RefreshCw,
 ChevronDown,
 Download,
 AlertTriangle,
 Search,
 Target,
} from "lucide-react";
// #5 fix: lazy-load recharts (~600KB) — only loaded when progress tab is opened
import dynamic from "next/dynamic";
// Phase 247: ONE weight chart (WeightChart variant="client") — the old
// ClientWeightChart was a byte-for-byte twin differing only in colors.
const ClientWeightChart = dynamic(
  () => import("@/components/WeightChart").then((m) => m.WeightChart),
  { ssr: false, loading: () => null },
);
import { useI18n } from "@/lib/i18n";
import { useNav } from "@/hooks/use-nav";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
 listAllSubscriptions,
 upsertSubscription,
 listSubscriptionsForClient,
 listProgress,
 listPlans,
 listAllClientPlans,
 addPlan,
 deletePlan,
 activatePlan,
 getQuestionnaire,
 fetchProfile,
} from "@/lib/data";
import { pickPrimarySubscription } from "@/lib/subscription-view";
import { getTier, type Duration, type TierId } from "@/lib/plans";
import { MEMBERSHIPS } from "@/lib/memberships";
import { resolveExerciseImage, getExerciseImage, getExerciseImages, getFallbackSVG } from "@/lib/exercise-images";
import { useExerciseLookup } from "@/lib/exercise-lookup";
import { HealthMetricsDashboard } from "@/components/HealthMetricsDashboard";
import { toast } from "sonner";
import { localizeApiError } from "@/lib/error-i18n";
import { formatQuestionnaireValue } from "@/lib/questionnaire-display";
import { runAiJob, enqueueAiJobClient, getAiJob } from "@/lib/ai-jobs-client";
import {
 addPendingPlanJob,
 removePendingPlanJob,
 readPendingPlanJobs,
 readSavedPlanJobIds,
 addSavedPlanJobId,
 selectRecoverablePlanJobs,
 planJobTypeToKind,
 type PendingPlanJob,
 type RecoverableJobInput,
} from "@/lib/plan-jobs";
import type { AiJobRow } from "@/lib/ai-jobs";
import type { Profile, Subscription, ProgressEntry, Plan } from "@/lib/supabase/types";
// Type-only imports (erased at build): PlanContent family comes from the
// server generator; the client only needs their shapes for the editor.
import type { NutritionPlanContent, WorkoutPlanContent, PlanOverrides } from "@/lib/plan-generator";
// NOTIF→PLAN 2026-10-24: the diet-type contract comes from the ZERO-DEPENDENCY
// leaf module — never plan-generator's runtime values (server-only, 1.6MB
// exercises array — the Phase-183 bundle law).
import { DIET_TYPES, DIET_TYPE_LABELS_AR, classifyDietText, type DietType } from "@/lib/diet-types";
// PLAN-EDIT-2026-10-24: the editor's pure item→meal→plan math (grams
// parser + 4/4/9 macro chain) — the zero-dependency leaf, unit-tested
// in __tests__/nutrition-totals.test.ts.
import {
 parseGrams,
 scalePer100g,
 recomputeNutritionTotals,
 displayCalories,
 resolveTargetCalorieChange,
 TARGET_CONSISTENCY_ABS_KCAL,
 TARGET_CONSISTENCY_PCT,
 type BoundFood,
} from "@/lib/nutrition-totals";
import type { PlanContent } from "@/lib/data/plans";

/** Result payload of a finished plan_* ai_job (getAiJob → job.result). */
type PlanJobResult = { title?: string; content?: PlanContent | null; materialized?: boolean; plan_id?: string };

// NOTIF→PLAN 2026-10-24 (owner order item 5): human-readable labels for the
// server's structural plausibility flags — the coach banner's list.
const REVIEW_FLAG_LABELS_AR: Record<string, string> = {
 missing_gender: "الجنس غير محدد في الاستبيان — حساب BMR استخدم القيمة الافتراضية",
 missing_or_implausible_weight: "الوزن مفقود أو غير منطقي — استُخدمت قيمة افتراضية",
 missing_or_implausible_height: "الطول مفقود أو غير منطقي — استُخدمت قيمة افتراضية",
 missing_or_implausible_age: "العمر مفقود أو غير منطقي — استُخدمت قيمة افتراضية",
 calorie_floor_applied: "السعرات الناتجة تحت الحد الأدنى (١٢٠٠) — تم تقييدها",
 deficit_beyond_25pct: "عجز حراري أعمق من ٢٥٪ من TDEE — قيمة متطرفة",
 surplus_beyond_15pct: "فائض حراري يتجاوز ١٥٪ من TDEE — قيمة متطرفة",
};

/** Narrow questionnaire `data: Json` into a plain editable record. */
const asForm = (v: Json | undefined | null): Record<string, Json> =>
 v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, Json>) : {};
import { NotificationForm } from "@/components/NotificationForm";
import { isSupabaseConfigured } from "@/lib/data/helpers";
import type { Json } from "@/lib/supabase/types";
import type { QuestionnaireRow } from "@/lib/data/questionnaires";
import {
 COACH_CLIENT_PACKAGES,
 COACH_PAYMENT_METHODS,
 coachPaymentMethodLabel,
 type CoachPaymentMethod,
} from "@/lib/coach-limits";

// Unified tier list — the three MODEL tiers (Premium, Pro, Coaching).
// 0045: legacy Starter/Elite were removed (products retired, rows migrated).
// Used in the subscription form so the admin can pick ANY model tier.
const ALL_TIERS: Array<{ id: string; nameAr: string; nameEn: string }> = [
  // 0045: model tiers ONLY. The legacy starter/elite options were removed —
  // those products are retired (DB CHECK guard blocks them now; the
  // historical rows were migrated starter → premium, elite → pro).
  ...MEMBERSHIPS.filter((m) => m.id !== "free").map((m) => ({
    id: m.id,
    nameAr: m.nameAr,
    nameEn: m.nameEn,
  })),
];

export function CoachClientView({ clientId }: { clientId: string }) {
 const { t, dir, lang } = useI18n();
 const isAr = lang === "ar";
 const { navigate } = useNav();
 // OWNER BOUNDARY (2026-08-30): admins manage everything; coaches must
 // NEVER see site memberships (premium/pro) — only their coaching product.
 const { isAdmin, isSiteCoach } = useAuth();
 const [client, setClient] = useState<Profile | null>(null);
 const [sub, setSub] = useState<Subscription | null>(null);
 const [allSubs, setAllSubs] = useState<Subscription[]>([]);
 const [progress, setProgress] = useState<ProgressEntry[]>([]);
 const [plans, setPlans] = useState<Plan[]>([]);
 const [nutriQ, setNutriQ] = useState<QuestionnaireRow | null>(null);
 const [fitQ, setFitQ] = useState<QuestionnaireRow | null>(null);
 const [loading, setLoading] = useState(true);
 const [tab, setTab] = useState<"overview" | "subscription" | "plans" | "ai-plans" | "questionnaires" | "progress" | "notifications">("overview");

 // Subscription form — coaching is the coach's ONLY product; admins may
 // still pick any tier (manual override).
 const [tier, setTier] = useState<string>("coaching");
 const [months, setMonths] = useState<Duration>(1);
 // 0043 OWNER FIX: the manual start/end date inputs are GONE — the server
 // (extend_subscription, 0018 math) computes dates from the selected
 // duration; the UI now only PREVIEWS that computation. Manual editing
 // was always silently ignored by the API and misled staff.
 const [savingSub, setSavingSub] = useState(false);
 // 0034: offline-payment fields — the coach collects OUTSIDE the site
 // (cash / Vodafone Cash / InstaPay) then records it with the activation.
 const [payAmount, setPayAmount] = useState<string>("");
 const [payMethod, setPayMethod] = useState<CoachPaymentMethod>("cash");
 const [payNote, setPayNote] = useState<string>("");

 // Plan upload form
 const [planType, setPlanType] = useState<"meal" | "workout">("meal");
 const [planTitle, setPlanTitle] = useState("");
 const [planNotes, setPlanNotes] = useState("");
 const [uploading, setUploading] = useState(false);

 // AI plan generation
 const [generating, setGenerating] = useState<"workout" | "nutrition" | null>(null);
 const [approving, setApproving] = useState<string | null>(null);
 const [viewingPlan, setViewingPlan] = useState<Plan | null>(null);
 // Phase 183 (2026-09-13 «البوول الموحد"): per-client AI readout —
 // ONE unified plan pool (nutrition + workout COMBINED: 2/4/8/8,
 // success-only via ai_plan_usage). `pool` is the live key; per-kind
 // keys are deprecated mirrors kept one release.
 type AiUsage = {
   unlimited: boolean;
   coachOwn?: { nutrition: { used: number }; workout: { used: number } };
   clientBalance?: {
     tier: string;
     pool?: { used: number; limit: number; remaining?: number; unlimited: boolean };
     nutrition: { used: number; limit: number; unlimited: boolean; weeklyUsed?: number; weeklyLimit?: number };
     workout: { used: number; limit: number; unlimited: boolean; weeklyUsed?: number; weeklyLimit?: number };
   };
 };
 const [aiUsage, setAiUsage] = useState<AiUsage | null>(null);

 // ── OWNER DECREE (2026-08-30): «المدرب قدر يولد خطط للعميل بدون ما يدفع
 // او يفعل اشتراك العميل» — plan generation (AI + manual) is a PAID
 // feature: it requires an ACTIVE coaching subscription for this client
 // ($6/$16 wallet activation). Admins bypass (staff semantics). Enforced
 // here for UX AND server-side in /api/ai/jobs + /api/plans/normalize.
 const hasActiveCoaching = useMemo(
 () =>
 allSubs.some(
 (s) =>
 s.tier === "coaching" &&
 s.status === "active" &&
 (!s.end_date || new Date(s.end_date).getTime() > Date.now()),
 ),
 [allSubs],
 );
 const planGateOpen = isAdmin || hasActiveCoaching;
 // PHASE 142 — kind-aware gate copy: a site coach never sells the B2B
 // $6/$16 coaching packages — his member's coaching subscription is
 // activated from the ADMIN console (the money law: site follow-up has
 // ZERO billing through the coach).
 const planGateMessage = isSiteCoach
 ? isAr
 ? "توليد الخطط مقفول — ده عضو متابعة موقع: اشتراك الكوتشينج بيتفعّل من لوحة الأدمن وهو اللي بيفتح التوليد هنا."
 : "Plan generation is locked — this is a site follow-up member: the coaching subscription is activated from the admin console and that unlocks generation here."
 : isAr
 ? "توليد الخطط مقفول لحد ما تفعّل اشتراك العميل — من تبويب الاشتراك (شهر 6$ — ٣ شهور 16$ بتخصم من محفظتك)."
 : "Plan generation is locked until you activate this client's subscription — from the Subscription tab (1 month $6 — 3 months $16 debited from your wallet).";

 // T-4PILLAR-COMPLETE (2026-08-28): plan jobs are queued on GitHub Actions
 // (~10 min), so a blocking poll that dies with the tab used to STRAND the
 // finished result in ai_jobs — no draft was ever saved. Mirrors the client
 // swap watcher: a localStorage registry re-attaches watchers on every
 // mount, and finished-but-unsaved jobs surface in a recovery card.
 const [pendingPlanJobs, setPendingPlanJobs] = useState<PendingPlanJob[]>([]);
 const [recoverableJobs, setRecoverableJobs] = useState<RecoverableJobInput[]>([]);
 const [recoveringId, setRecoveringId] = useState<string | null>(null);
 const activePlanWatchers = useRef<Set<string>>(new Set());

 // M18 fix: error states for invalid clientId
 const [notFound, setNotFound] = useState(false);
 const [notClient, setNotClient] = useState(false);

 useEffect(() => {
 (async () => {
 const [c, subs, p, pl, n, f] = await Promise.all([
 fetchProfile(clientId),
 listAllSubscriptions(),
 listProgress(clientId),
 listAllClientPlans(clientId),
 getQuestionnaire(clientId, "nutrition"),
 getQuestionnaire(clientId, "fitness"),
 ]);
 // M18 fix: handle non-existent or non-client clientId
 if (!c) {
 setLoading(false);
 setNotFound(true);
 return;
 }
 if (c.role !== "client") {
 setLoading(false);
 setNotClient(true);
 return;
 }
 setClient(c);
 // Get ALL subs for this client (multiple allowed now)
 const clientSubs = subs.filter((x) => x.client_id === clientId);
 // OWNER BOUNDARY (2026-08-30): the coach sees ONLY the coaching-tier
 // subscription — site memberships (premium/pro) are the site's business,
 // never his. Admins keep the full picture.
 const visibleSubs: Subscription[] = isAdmin
 ? clientSubs
 : clientSubs.filter((x) => x.tier === "coaching");
 setAllSubs(visibleSubs);
 // Phase 247: the primary-sub pick law lives in lib/subscription-view.ts —
 // this block was written out twice in this file (and a third time inside
 // getSubscriptionForClient) — one definition now.
 const picked = pickPrimarySubscription(visibleSubs);
 setSub(picked);
 setProgress(p);
 setPlans(pl);
 setNutriQ(n);
 setFitQ(f);
 if (picked) {
 setTier(picked.tier);
 setMonths(picked.months as Duration); // DB stores any int; the form offers the standard durations
 // 0043: no manual date prefill — dates are computed/previewed only.
 }
 setLoading(false);
 })();
 }, [clientId]);

 /* ── T-4PILLAR-COMPLETE: registry-backed plan-job pipeline ──────────
  * enqueue → register → watch (survives reloads) → materialize draft.
  * A finished job becomes a DRAFT plan row even if the coach closed the
  * tab minutes earlier; regeneration deletes the old plan only AFTER the
  * replacement exists and only if it is still an unapproved draft.
  * ───────────────────────────────────────────────────────────────── */
 const scanRecoverableJobs = useCallback(async () => {
 try {
 const res = await fetch("/api/ai/jobs?limit=20");
 if (!res.ok) return;
 const data = await res.json().catch(() => null);
 const picked = selectRecoverablePlanJobs(
 data?.jobs ?? [],
 new Set(readSavedPlanJobIds()),
 new Set(readPendingPlanJobs().map((e) => e.id)),
 );
 setRecoverableJobs(picked);
 } catch {
 /* queue visibility is best-effort */
 }
 }, []);

 useEffect(() => {
 void scanRecoverableJobs();
 }, [scanRecoverableJobs]);

 // 0034: live AI-quota readout for THIS client — the ONE unified monthly
 // plan pool (Phase 183 «البوول الموحد»: nutrition + workout combined,
 // success-only; failed generations never burn quota; admins unlimited).
 const refreshAiUsage = useCallback(async () => {
 if (!isSupabaseConfigured) return;
 try {
 const res = await fetch(`/api/coach/ai-usage?clientId=${encodeURIComponent(clientId)}`);
 if (!res.ok) return;
 const data = await res.json().catch(() => null);
 if (data) setAiUsage(data);
 } catch {
 /* best-effort */
 }
 }, [clientId]);

 useEffect(() => {
 void refreshAiUsage();
 }, [refreshAiUsage]);

 const materializePlanDraft = useCallback(
 async (entry: PendingPlanJob, result: PlanJobResult) => {
 const { title, content } = result ?? {};
 if (!title || !content) throw new Error("نتيجة التوليد غير مكتملة");
 // PLAN MATERIALIZATION LAW (Phase 79, owner «حفظ للخطط المولدة»): the
 // GitHub Actions runner now inserts the draft plans row ITSELF — the
 // browser only refreshes. Legacy jobs (pre-deploy) still fall back to
 // the browser-side insert below.
 if (!result?.materialized || !result?.plan_id) {
 await addPlan({
 client_id: entry.clientId,
 type: entry.kind === "workout" ? "workout" : "meal",
 title,
 notes: "Generated by AI",
 file_url: null,
 content,
 status: "draft",
 is_current: false,
 });
 }
 addSavedPlanJobId(entry.id);
 removePendingPlanJob(entry.id);
 setPendingPlanJobs(readPendingPlanJobs());
 // Regeneration: swap old draft out ONLY if it still exists and was
 // never approved in the meantime (otherwise we would delete a live plan).
 if (entry.replacePlanId) {
 try {
 const fresh = await listAllClientPlans(entry.clientId);
 const old = fresh.find((p) => p.id === entry.replacePlanId);
 if (old && old.status === "draft") {
 // DRAFT-DELETE FIX 2026-10-24: deletePlan is verified now — a failed
 // old-draft cleanup is LOGGED (never silent), but still best-effort:
 // the new draft already exists and stays either way.
 const verdict = await deletePlan(old.id);
 if (!verdict.ok) console.warn("[regenerate] old draft cleanup failed:", verdict.error);
 }
 } catch {
 /* old draft cleanup is best-effort */
 }
 }
 if (entry.clientId === clientId) {
 setPlans(await listAllClientPlans(clientId));
 }
 void refreshAiUsage();
 void scanRecoverableJobs();
 },
 [clientId, scanRecoverableJobs, refreshAiUsage],
 );

 const watchPlanJob = useCallback(
 async (entry: PendingPlanJob) => {
 if (activePlanWatchers.current.has(entry.id)) return;
 activePlanWatchers.current.add(entry.id);
 try {
 const deadline = Date.now() + 26 * 60_000;
 while (Date.now() < deadline) {
 await new Promise((r) => setTimeout(r, 20_000));
 let job: AiJobRow | null = null;
 try {
 job = await getAiJob(entry.id);
 } catch {
 continue; // transient network error — keep waiting
 }
 if (job?.status === "done") {
 try {
 await materializePlanDraft(entry, (job.result ?? {}) as PlanJobResult);
 toast.success(
 entry.kind === "workout"
 ? (isAr ? "وصل برنامج التمارين وتم حفظه كمسودة ✅ راجعه ثم وافق عليه لإرساله للعميل." : "The workout plan arrived and was saved as a draft ✅ Review it, then approve to send it to the client.")
 : (isAr ? "وصلت خطة التغذية وتم حفظها كمسودة ✅ راجعها ثم وافق عليها لإرسالها للعميل." : "The meal plan arrived and was saved as a draft ✅ Review it, then approve to send it to the client."),
 );
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || (isAr ? "وصلت الخطة لكن فشل حفظ المسودة — استخدم بطاقة الاسترجاع." : "The plan arrived but saving the draft failed — use the recovery card."));
 }
 return;
 }
 if (job?.status === "failed") {
 removePendingPlanJob(entry.id);
 setPendingPlanJobs(readPendingPlanJobs());
 toast.error(job.error_message || (isAr ? "فشل توليد الخطة. حاول مرة أخرى." : "Plan generation failed. Please try again."));
 return;
 }
 }
 // Timeout: the job may STILL finish later — keep the registry entry
 // so the next mount re-watches and the recovery card can pick it up.
 toast.info(isAr ? "الخطة لسه بتتولد في الخلفية — هتتطبق تلقائيًا أول ما تفتح صفحة العميل تاني." : "The plan is still generating in the background — it will apply automatically the next time you open this client's page.");
 } finally {
 activePlanWatchers.current.delete(entry.id);
 }
 },
 [materializePlanDraft],
 );

 /** Re-attach watchers to unfinished jobs after reload/remount. */
 useEffect(() => {
 const pending = readPendingPlanJobs();
 setPendingPlanJobs(pending);
 pending.forEach((entry) => void watchPlanJob(entry));
 }, [watchPlanJob]);

 const recoverPlanJob = async (job: RecoverableJobInput) => {
 setRecoveringId(job.id);
 try {
 const full = await getAiJob(job.id); // single GET carries result
 if (full?.status !== "done" || !full?.result?.title || !full?.result?.content || !job.payload?.clientId) {
 throw new Error(isAr ? "النتيجة غير متاحة لهذه المهمة" : "Result unavailable for this job");
 }
 const kind = planJobTypeToKind(job.job_type);
 if (!kind) throw new Error(isAr ? "نوع مهمة غير معروف" : "Unknown job type");
 await materializePlanDraft(
 { id: job.id, clientId: job.payload.clientId as string, kind, createdAt: Date.now() },
 (full.result ?? {}) as PlanJobResult,
 );
 toast.success(isAr ? "تم استرجاع الخطة وحفظها كمسودة ✅" : "Plan recovered and saved as a draft ✅");
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || (isAr ? "فشل الاسترجاع" : "Recovery failed"));
 } finally {
 setRecoveringId(null);
 }
 };

 /** Enqueue a plan job and register a resilient watcher for it. */
 const queuePlanJob = async (
 planType: "workout" | "nutrition",
 clientContext: Record<string, unknown>,
 overrides?: PlanOverrides,
 replacePlan?: Plan | null,
 ) => {
 if (!planGateOpen) {
 toast.error(planGateMessage);
 return;
 }
 setGenerating(planType);
 try {
 const jobId = await enqueueAiJobClient(
 planType === "workout" ? "plan_workout" : "plan_nutrition",
 { clientId, clientContext, overrides },
 );
 const entry: PendingPlanJob = {
 id: jobId,
 clientId,
 kind: planType,
 createdAt: Date.now(),
 replacePlanId: replacePlan?.id,
 };
 addPendingPlanJob(entry);
 setPendingPlanJobs(readPendingPlanJobs());
 void watchPlanJob(entry);
 toast.info(
 planType === "workout"
 ? (isAr ? "تم إرسال طلب التوليد 🚀 البرنامج هيوصل خلال ~10 دقائق ويتم حفظه كمسودة تلقائيًا حتى لو قفلت الصفحة." : "Generation request sent 🚀 The program will arrive within ~10 minutes and is saved as a draft automatically — even if you close the page.")
 : (isAr ? "تم إرسال طلب التوليد 🚀 الخطة هتوصل خلال ~10 دقائق ويتم حفظها كمسودة تلقائيًا حتى لو قفلت الصفحة." : "Generation request sent 🚀 The plan will arrive within ~10 minutes and is saved as a draft automatically — even if you close the page."),
 );
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || t("coach.genFailed"));
 } finally {
 setGenerating(null);
 }
 };

 const updateSub = async () => {
 setSavingSub(true);
 try {
 if (isSupabaseConfigured) {
 // 0034: activation goes through the server route — extend_subscription
 // (service role, 0034-guarded) + coach_payments ledger + client notification.
 const res = await fetch("/api/coach/subscriptions/activate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 client_id: clientId,
 tier,
 months,
 amount: payAmount.trim() === "" ? null : Number(payAmount),
 method: payMethod,
 note: payNote.trim() || null,
 }),
 });
 const json = await res.json().catch(() => null);
 // M1 fix (audit case أ): the 402 insufficient_wallet message (and every
 // other error of this route) used to surface in Arabic inside the English
 // UI — localize at the display layer from the stable error code.
 if (!res.ok) throw new Error(localizeApiError(json, { isAr, months }) || t("common.error"));
 setPayAmount("");
 setPayNote("");
 toast.success(
 isAr
 ? `تم تفعيل الاشتراك ✅ العميل وصل إشعار — والدفع اتسجل في سجل تفعيلات المدربين.`
 : `Subscription activated ✅ — the client was notified and the payment was logged.`,
 );
 } else {
 // Demo/local fallback — direct write, no ledger. Dates computed the
 // same way the server does (0043: no manual date inputs anymore).
 const start = new Date();
 const end = new Date();
 end.setMonth(end.getMonth() + months);
 await upsertSubscription(clientId, tier, months, start.toISOString(), end.toISOString());
 toast.success(t("coach.subUpdated"));
 }
 // Reload all subscriptions to show the updated list
 const updatedSubs = await listSubscriptionsForClient(clientId);
 // OWNER BOUNDARY: same visibility rule as the loader — coach sees only
 // his coaching product; admins see everything.
 const visibleUpdated: Subscription[] = isAdmin
 ? updatedSubs
 : updatedSubs.filter((x) => x.tier === "coaching");
 setAllSubs(visibleUpdated);
 // Phase 247: same shared pick law (was a hand-rolled copy).
 setSub(pickPrimarySubscription(visibleUpdated));
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || t("common.error"));
 } finally {
 setSavingSub(false);
 }
 };

 const uploadPlan = async () => {
 if (!planTitle.trim()) return;
 if (!planGateOpen) {
 toast.error(planGateMessage);
 return;
 }
 setUploading(true);
 try {
 await addPlan({
 client_id: clientId,
 type: planType,
 title: planTitle.trim(),
 notes: planNotes.trim() || null,
 file_url: null,
 content: null,
 });
 setPlanTitle("");
 setPlanNotes("");
 const data = await listPlans(clientId);
 setPlans(data);
 toast.success(t("coach.planUploaded"));
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || t("common.error"));
 } finally {
 setUploading(false);
 }
 };

 // Normalize a coach-pasted plan — converts free text (e.g. from a PDF or
 // notes) into the structured JSON format used by AI-generated plans. The
 // structured plan gets the same editable table UI + per-meal regenerate
 // button as AI plans.
 const [normalizing, setNormalizing] = useState(false);
 const normalizeAndUpload = async () => {
 if (!planTitle.trim() || !planNotes.trim()) {
 toast.error(isAr ? "اكتب عنوان الخطة والصق محتواها في حقل الملاحظات أولاً." : "Enter a plan title and paste its content into the notes field first.");
 return;
 }
 if (!planGateOpen) {
 toast.error(planGateMessage);
 return;
 }
 setNormalizing(true);
 try {
 const res = await fetch("/api/plans/normalize", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ text: planNotes, planType, clientId }),
 });
 if (!res.ok) {
 const err = await res.json().catch(() => ({}));
 throw new Error(err.error || "Failed to normalize plan");
 }
 const { content, source } = await res.json();
 await addPlan({
 client_id: clientId,
 type: planType,
 title: planTitle.trim(),
 notes: "Coach-added (structured)",
 file_url: null,
 content,
 });
 setPlanTitle("");
 setPlanNotes("");
 const data = await listPlans(clientId);
 setPlans(data);
 toast.success(isAr ? `تم تنسيق الخطة وإضافتها! (${source})` : `Plan normalized and added! (${source})`);
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || (isAr ? "فشل التنسيق" : "Normalization failed"));
 } finally {
 setNormalizing(false);
 }
 };

 // DRAFT-DELETE FIX 2026-10-24 (owner order item 3): the native confirm()
 // is replaced by the in-UI dialog below (mobile in-app browsers suppress
 // window.confirm — the coaches' daily reality), the delete itself is
 // VERIFIED against the DB (deletePlan returns ok/error — silent RLS or
 // network failures no longer look like success), and the list refresh
 // reads the SAME source the tab renders (listAllClientPlans — the old
 // listPlans refresh made every draft/archived plan VANISH from the UI
 // after any delete, though they were still in the DB).
 const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
 const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
 const confirmRemovePlan = async () => {
 if (!deleteTarget) return;
 setDeletingPlanId(deleteTarget.id);
 try {
 const verdict = await deletePlan(deleteTarget.id);
 if (!verdict.ok) {
 toast.error(verdict.error || (isAr ? "فشل حذف الخطة — لم يُغيَّر شيء" : "Deleting the plan failed — nothing was changed"));
 return;
 }
 setPlans(await listAllClientPlans(clientId));
 setViewingPlan((vp) => (vp?.id === deleteTarget.id ? null : vp));
 toast.success(isAr ? "تم حذف الخطة نهائيًا ✅" : "The plan was permanently deleted ✅");
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || (isAr ? "فشل حذف الخطة" : "Deleting the plan failed"));
 } finally {
 setDeletingPlanId(null);
 setDeleteTarget(null);
 }
 };





 if (loading) return <div className="text-muted-foreground">{t("common.loading")}</div>;

 // M18 fix: render clear error states for invalid clientId
 if (notFound) {
 return (
 <div className="py-20 text-center">
 <h2 className="text-xl font-semibold">{isAr ? "العميل غير موجود" : "Client not found"}</h2>
 <p className="mt-2 text-sm text-[#6e6e73]">{isAr ? "هذا العميل غير موجود أو تم حذفه." : "This client does not exist or has been deleted."}</p>
 <a href="/coach" className="mt-4 inline-block rounded-full bg-[#0071e3] px-5 py-2 text-sm text-white">{isAr ? "العودة لقائمة العملاء" : "Back to client list"}</a>
 </div>
 );
 }
 if (notClient) {
 return (
 <div className="py-20 text-center">
 <h2 className="text-xl font-semibold">{isAr ? "هذا المستخدم ليس عميلاً" : "This user is not a client"}</h2>
 <p className="mt-2 text-sm text-[#6e6e73]">{isAr ? "لا يمكن عرض بيانات مدرب آخر." : "Cannot view another coach's data."}</p>
 <a href="/coach" className="mt-4 inline-block rounded-full bg-[#0071e3] px-5 py-2 text-sm text-white">{isAr ? "العودة لقائمة العملاء" : "Back to client list"}</a>
 </div>
 );
 }

 const chartData = progress
 .filter((e): e is ProgressEntry & { weight: number } => e.weight != null)
 .map((e) => ({
 date: new Date(e.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" }),
 weight: e.weight,
 }));

 // PHASE 142 — the B2B subscription/billing tab is the independent
 // partner's (and the admin's manual-override) surface. A site coach
 // never bills: his member's subscriptions are managed by the admin.
 type TabId = "overview" | "subscription" | "plans" | "ai-plans" | "notifications" | "questionnaires" | "progress";
 const tabs: { id: TabId; label: string }[] = [
 { id: "overview", label: t("coach.overview") },
 ...(isSiteCoach
   ? []
   : ([{ id: "subscription" as TabId, label: t("coach.subscriptionMgmt") }] satisfies { id: TabId; label: string }[])),
 { id: "plans", label: t("coach.plansSection") },
 { id: "ai-plans", label: t("coach.aiPlans") },
 { id: "notifications", label: lang === "ar" ? "إشعارات" : "Notifications" },
 { id: "questionnaires", label: t("coach.questionnairesSection") },
 { id: "progress", label: t("coach.clientProgress") },
 ];

 // PHASE 62 VARIETY: collect food/exercise names from the client's
 // existing plans so the AI avoids repeating the same meals/lifts.
 const buildRecentPlanNames = (): string[] => {
   try {
     const names: string[] = [];
     for (const p of plans.slice(0, 4)) {
       let c: unknown = p?.content;
       if (typeof c === "string") {
         try { c = JSON.parse(c); } catch { continue; }
       }
       if (!c || typeof c !== "object") continue;
       // DB enum is meal|workout; legacy localStorage rows may say "nutrition"
       // (the old comparison only matched that legacy value — kept + extended
       // so today's "meal" rows feed the variety list too).
       const kind = p.type as string;
       if ((kind === "meal" || kind === "nutrition") && "meals" in c) {
         const meals = (c as { meals?: unknown }).meals;
         if (Array.isArray(meals)) {
           for (const m of meals) {
             const meal = m as { name?: unknown; items?: Array<{ food?: unknown }>; meal_alternatives?: Array<{ name?: unknown }> };
             if (meal?.name) names.push(String(meal.name));
             if (Array.isArray(meal?.items)) for (const it of meal.items) { if (it?.food) names.push(String(it.food)); }
             if (Array.isArray(meal?.meal_alternatives)) for (const alt of meal.meal_alternatives) { if (alt?.name) names.push(String(alt.name)); }
           }
         }
       }
       if (kind === "workout" && "days" in c) {
         const days = (c as { days?: unknown }).days;
         if (Array.isArray(days)) {
           for (const d of days) {
             const day = d as { exercises?: Array<{ name?: unknown }> };
             if (Array.isArray(day?.exercises)) for (const ex of day.exercises) { if (ex?.name) names.push(String(ex.name)); }
           }
         }
       }
     }
     return Array.from(new Set(names)).slice(0, 60);
   } catch {
     return [];
   }
 };

 const generateAIPlan = async (planType: "workout" | "nutrition", overrides?: PlanOverrides) => {
 // Build client context from questionnaires + profile + progress
 const clientContext = {
 name: client?.full_name || "العميل",
 nutrition: nutriQ?.data || null,
 fitness: fitQ?.data || null,
 recent_measurements: progress.slice(-3).map((p) => ({
 weight: p.weight,
 waist: p.waist,
 date: p.created_at,
 })),
 recent_plan_names: buildRecentPlanNames(),
 };

 // T-4PILLAR-COMPLETE: enqueue + resilient registry watcher instead of a
 // blocking poll — the draft materializes even if the coach leaves.
 await queuePlanJob(planType, clientContext, overrides);
 };

 const handleApprovePlan = async (planId: string) => {
 setApproving(planId);
 try {
 await activatePlan(planId, clientId);
 const refreshed = await listAllClientPlans(clientId);
 setPlans(refreshed);
 toast.success(isAr ? "تمت الموافقة على الخطة وإرسالها للعميل!" : "Plan approved and sent to the client!");
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || t("common.error"));
 } finally {
 setApproving(null);
 }
 };

 // Regenerate a plan — queue the replacement, delete the old draft only
 // AFTER the new plan arrives (and only if it was never approved meanwhile).
 const handleRegeneratePlan = async (plan: Plan) => {
 if (!confirm(isAr ? "هل تريد إعادة توليد هذه الخطة؟ سيتم توليد واحدة جديدة وستحل محل المسودة الحالية عند وصولها." : "Regenerate this plan? A new one will be generated and will replace the current draft when it arrives.")) return;
 setViewingPlan(null);
 const clientContext = {
 name: client?.full_name || "العميل",
 nutrition: nutriQ?.data || null,
 fitness: fitQ?.data || null,
 recent_measurements: progress.slice(-3).map((p) => ({
 weight: p.weight,
 waist: p.waist,
 date: p.created_at,
 })),
 recent_plan_names: buildRecentPlanNames(),
 };
 const planType = plan.type === "workout" ? "workout" : "nutrition";
 await queuePlanJob(planType, clientContext, undefined, plan);
 };

 return (
 <div className="space-y-6">
 <div className="flex items-center gap-3">
 <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("coach")}>
 <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
 {t("coach.backToList")}
 </Button>
 </div>

 <div>
 <h1 className="text-2xl font-bold md:text-3xl">{client?.full_name || t("coach.client")}</h1>
 <p className="mt-1 text-sm text-muted-foreground">{client?.email || client?.phone || "—"}</p>
 </div>

 <div className="flex flex-wrap gap-1 rounded-full border border-border bg-card p-1">
 {tabs.map((tb) => (
 <button
 key={tb.id}
 onClick={() => setTab(tb.id)}
 className={cn(
 "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
 tab === tb.id ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground",
 )}
 >
 {tb.label}
 </button>
 ))}
 </div>

 {tab === "overview" && (
 <div className="space-y-4">
 {/* Quick stats row */}
 <div className="grid gap-4 sm:grid-cols-3">
 <Card className="p-5 shadow-card">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("coach.subscription")}</span>
 <CreditCard className="h-4 w-4 text-primary" />
 </div>
 {sub ? (
 <>
 <p className="mt-3 font-display text-lg font-bold">
 {/* Try new MEMBERSHIPS table first, fall back to legacy TIERS */}
 {(() => {
 const m = MEMBERSHIPS.find((x) => x.id === sub.tier);
 if (m) return lang === "ar" ? m.nameAr : m.nameEn;
 const legacy = getTier(sub.tier as TierId); // legacy tier ids (starter/elite) — returns undefined for model tiers
 if (legacy) return t(legacy.nameKey);
 return sub.tier || "—";
 })()}
 </p>
 {/* Show subscription status badge */}
 {sub.status && (
 <span
 className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
 sub.status === "active"
 ? "bg-[#34c759]/10 text-[#34c759]"
 : sub.status === "pending"
 ? "bg-[#ff9500]/10 text-[#ff9500]"
 : "bg-[#6e6e73]/10 text-[#6e6e73]"
 }`}
 >
 {sub.status === "active"
 ? lang === "ar" ? "مؤكد" : "Confirmed"
 : sub.status === "pending"
 ? lang === "ar" ? "بانتظار التأكيد" : "Pending"
 : sub.status}
 </span>
 )}
 <p className="text-xs text-muted-foreground">
 {sub.end_date ? `${t("dash.expiresOn")} ${new Date(sub.end_date).toLocaleDateString()}` : "—"}
 </p>
 </>
 ) : (
 <p className="mt-3 text-sm text-muted-foreground">—</p>
 )}
 </Card>
 <Card className="p-5 shadow-card">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("dash.latestWeight")}</span>
 <LineChartIcon className="h-4 w-4 text-primary" />
 </div>
 <p className="mt-3 font-display text-lg font-bold">
 {progress[progress.length - 1]?.weight ? `${progress[progress.length - 1].weight} ${t("common.kg")}` : "—"}
 </p>
 </Card>
 <Card className="p-5 shadow-card">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("dash.checkins")}</span>
 <UserIcon className="h-4 w-4 text-primary" />
 </div>
 <p className="mt-3 font-display text-lg font-bold">{progress.length}</p>
 </Card>
 </div>

 {/* Apple Health-style metrics dashboard — M-2026 fix: the component is
     locale-aware now (lang prop) so the EN client page no longer shows
     raw Arabic strings from the dashboard. */}
 <HealthMetricsDashboard
 progress={progress}
 questionnaire={(nutriQ?.data ?? null) as Record<string, unknown> | null}
 lang={lang}
 />
 </div>
 )}

 {tab === "subscription" && !isSiteCoach && (
 <>
 {/* All subscriptions list — shows every sub the client has */}
 <Card className="mb-4 p-6 shadow-card">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold">
 {lang === "ar" ? "كل الاشتراكات" : "All Subscriptions"}
 </h2>
 <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-normal text-[#6e6e73]">
 {allSubs.length} {lang === "ar" ? "اشتراك" : "subscriptions"}
 </span>
 </div>

 {allSubs.length === 0 ? (
 <p className="mt-4 text-sm text-muted-foreground">
 {lang === "ar" ? "مفيش اشتراكات بعد." : "No subscriptions yet."}
 </p>
 ) : (
 <div className="mt-4 space-y-3">
 {allSubs.map((s) => {
 const tierInfo = MEMBERSHIPS.find((m) => m.id === s.tier);
 const tierAr = tierInfo?.nameAr || s.tier;
 const tierEn = tierInfo?.nameEn || s.tier;
 const isActive = s.status === "active" && (!s.end_date || new Date(s.end_date).getTime() > Date.now());
 return (
 <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f5f5f7] p-4">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
 s.tier === "premium" ? "bg-[#0071e3]/10 text-[#0071e3]"
 : s.tier === "pro" ? "bg-[#1d1d1f]/10 text-[#1d1d1f]"
 : s.tier === "coaching" ? "bg-[#8b5cf6]/10 text-[#8b5cf6]"
 : "bg-[#f5f5f7] text-[#6e6e73]"
 }`}>
 {lang === "ar" ? tierAr : tierEn}
 </span>
 <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
 isActive ? "bg-[#34c759]/10 text-[#34c759]"
 : "bg-[#6e6e73]/10 text-[#6e6e73]"
 }`}>
 {isActive
 ? (lang === "ar" ? "مؤكد" : "Active")
 : s.status === "pending"
 ? (lang === "ar" ? "بانتظار" : "Pending")
 : (lang === "ar" ? "منتهي" : "Expired")}
 </span>
 </div>
 <p className="mt-1 text-xs font-normal text-[#6e6e73]" dir="ltr">
 {s.start_date ? new Date(s.start_date).toLocaleDateString() : "—"} → {s.end_date ? new Date(s.end_date).toLocaleDateString() : "—"}
 </p>
 </div>
 <div className="text-end">
 <p className="text-sm font-medium">{s.months} {lang === "ar" ? "شهر" : "months"}</p>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </Card>

 {/* Add / update subscription form */}
 <Card className="p-6 shadow-card">
 <h2 className="text-lg font-semibold">{t("coach.subscriptionMgmt")}</h2>
 <p className="mt-1 text-sm font-normal text-[#6e6e73]">
 {lang === "ar"
 ? "حصّل من العميل بره الموقع (كاش / فودافون كاش / انستاباي) ثم فعّل اشتراكه من هنا — التفعيل هيخصم رسوم العميل من محفظتك (شهر 6$ — ٣ شهور 16$، اشحنها من صفحة محفظتي)، والعميل هيوصل إشعار فورًا."
 : "Collect from the client outside the site (cash / Vodafone Cash / InstaPay), then activate here — activation debits the per-client fee from your wallet (1 month $6 — 3 months $16; top up from My Wallet), and the client is notified instantly."}
 </p>
 <p className="mt-1 text-sm font-normal text-[#6e6e73]">
 {lang === "ar"
 ? "لو العميل عنده اشتراك بنفس النوع، المدة هتتجمع على المتبقي. لو نوع مختلف، هيتضاف كاشتراك جديد."
 : "Same tier extends the remaining days; a different tier is added as a new subscription."}
 </p>
 <div className="mt-4 grid gap-4 sm:grid-cols-2">
 <div>
 <Label>{t("checkout.plan")}</Label>
 <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
 {/* OWNER BOUNDARY: the coach sells ONLY his coaching package —
 premium/pro are SITE memberships. Admins keep the full picker. */}
 {(isAdmin ? ALL_TIERS : ALL_TIERS.filter((tierObj) => tierObj.id === "coaching")).map((tierObj) => (
 <button
 key={tierObj.id}
 onClick={() => setTier(tierObj.id)}
 className={cn(
 "rounded-xl border p-3 text-sm font-medium transition-colors",
 tier === tierObj.id ? "border-primary bg-secondary text-primary" : "border-border hover:border-primary/40",
 )}
 >
 {lang === "ar" ? tierObj.nameAr : tierObj.nameEn}
 </button>
 ))}
 </div>
 </div>
 <div>
 <Label>{t("checkout.duration")}</Label>
 {/* OWNER PRICING (2026-08-30, GLOBAL USD): $6 / client-month,
 $16 for 3 months — package prices shown on the buttons. */}
 <div className="mt-1.5 grid grid-cols-2 gap-2">
 {([1, 3] as Duration[]).map((d) => {
 const pkg = COACH_CLIENT_PACKAGES.find((p) => p.months === d);
 return (
 <button
 key={d}
 onClick={() => setMonths(d)}
 className={cn(
 "rounded-xl border p-3 text-sm font-medium transition-colors",
 months === d ? "border-primary bg-secondary text-primary" : "border-border hover:border-primary/40",
 )}
 >
 {d} {t("pricing.months")}
 {pkg && (
 <span className="mt-0.5 block text-xs font-normal text-[#6e6e73]" dir="ltr">
 {pkg.priceUsd}$
 </span>
 )}
 </button>
 );
 })}
 </div>
 </div>
 {/* 0043 OWNER FIX — computed dates preview (replaces the two manual
     date inputs). Mirrors extend_subscription (0018): an ACTIVE same-tier
     subscription stacks the new months on its remaining end_date;
     otherwise the subscription starts now and ends now + months. */}
 <div className="sm:col-span-2">
 <Label>{t("coach.datesAutoTitle")}</Label>
 <div className="mt-1.5 rounded-xl border border-border bg-[#f5f5f7] p-4 text-sm">
 <p className="font-medium text-[#1d1d1f]" dir="ltr">
 {(() => {
 const activeSameTier = allSubs.find(
 (x) =>
 x.tier === tier &&
 x.status === "active" &&
 x.end_date &&
 new Date(x.end_date).getTime() > Date.now(),
 );
 const base = activeSameTier?.end_date ? new Date(activeSameTier.end_date) : new Date();
 const end = new Date(base);
 end.setMonth(end.getMonth() + months);
 const endStr = end.toLocaleDateString(isAr ? "ar-EG" : "en-US");
 return activeSameTier
 ? (isAr
 ? `اشتراك شغال بنفس النوع — المدة بتتجمع على المتبقي، الجديد هينتهي: ${endStr}`
 : `Same-tier subscription active — months stack on the remaining time; new end: ${endStr}`)
 : (isAr
 ? `هيبدأ: اليوم → هينتهي: ${endStr}`
 : `Starts today → ends: ${endStr}`);
 })()}
 </p>
 <p className="mt-1 text-xs font-normal text-[#6e6e73]">
 {t("coach.datesAutoHint")}
 </p>
 </div>
 </div>
 <div>
 <Label htmlFor="pay-amount">{isAr ? "المبلغ اللي اتاخد من العميل (اختياري)" : "Amount collected (optional)"}</Label>
 <Input
 id="pay-amount"
 type="number"
 min="0"
 step="1"
 dir="ltr"
 value={payAmount}
 onChange={(e) => setPayAmount(e.target.value)}
 placeholder="0"
 className="mt-1.5"
 />
 </div>
 <div>
 <Label htmlFor="pay-method">{isAr ? "طريقة الدفع" : "Payment method"}</Label>
 <select
 id="pay-method"
 value={payMethod}
 onChange={(e) => setPayMethod(e.target.value as CoachPaymentMethod)}
 className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
 >
 {COACH_PAYMENT_METHODS.map((m) => (
 <option key={m.id} value={m.id}>
 {isAr ? m.ar : m.en}
 </option>
 ))}
 </select>
 </div>
 <div className="sm:col-span-2">
 <Label htmlFor="pay-note">{isAr ? "ملاحظة (اختياري)" : "Note (optional)"}</Label>
 <Input
 id="pay-note"
 value={payNote}
 onChange={(e) => setPayNote(e.target.value)}
 maxLength={500}
 className="mt-1.5"
 placeholder={isAr ? "مثال: دفعة أولى — باقي ٥٠٠" : "e.g. first installment — 500 remaining"}
 />
 </div>
 </div>
 <Button className="mt-5" onClick={updateSub} disabled={savingSub}>
 {savingSub ? t("common.saving") : t("coach.updateSub")}
 </Button>
 </Card>
 </>
 )}

 {tab === "plans" && (
 <div className="space-y-6">
 {!planGateOpen && (
 <div className="rounded-xl border border-[#ff9500]/30 bg-[#ff9500]/10 p-4 text-sm font-medium text-[#b45309]">
 {planGateMessage}
 </div>
 )}
 <Card className="p-6 shadow-card">
 <h2 className="flex items-center gap-2 text-lg font-semibold">
 <Upload className="h-4 w-4 text-primary" />
 {t("coach.uploadMeal")} / {t("coach.uploadWorkout")}
 </h2>
 <div className="mt-4 grid gap-4 sm:grid-cols-2">
 <div>
 <Label>{t("coach.planTitle")}</Label>
 <Input
 value={planTitle}
 onChange={(e) => setPlanTitle(e.target.value)}
 className="mt-1.5"
 placeholder={t("coach.planTitle")}
 />
 </div>
 <div>
 <Label>{t("checkout.plan")}</Label>
 <div className="mt-1.5 grid grid-cols-2 gap-2">
 <button
 onClick={() => setPlanType("meal")}
 className={cn(
 "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors",
 planType === "meal" ? "border-primary bg-secondary text-primary" : "border-border hover:border-primary/40",
 )}
 >
 <Salad className="h-4 w-4" /> {t("plans.meal")}
 </button>
 <button
 onClick={() => setPlanType("workout")}
 className={cn(
 "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors",
 planType === "workout" ? "border-primary bg-secondary text-primary" : "border-border hover:border-primary/40",
 )}
 >
 <Dumbbell className="h-4 w-4" /> {t("plans.workout")}
 </button>
 </div>
 </div>
 <div className="sm:col-span-2">
 <Label htmlFor="plan-notes">{t("coach.planNotes")}</Label>
 <Textarea
 id="plan-notes"
 value={planNotes}
 onChange={(e) => setPlanNotes(e.target.value)}
 className="mt-1.5"
 />
 </div>
 </div>
 <div className="mt-4 flex flex-wrap gap-2">
 <Button className="gap-2" onClick={uploadPlan} disabled={uploading || normalizing || !planTitle.trim()}>
 <Upload className="h-4 w-4" />
 {uploading ? t("common.uploading") : t("common.upload")}
 </Button>
 <Button
 variant="outline"
 className="gap-2 border-primary/30 text-primary"
 onClick={normalizeAndUpload}
 disabled={normalizing || uploading || !planTitle.trim() || !planNotes.trim()}
 title="حوّل النص اللي كتبته/لصقته في حقل الملاحظات إلى خطة منظمة قابلة للتعديل وإعادة توليد الوجبات"
 >
 {normalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
 {normalizing ? "جارٍ التنسيق..." : "تنسيق وترتيب تلقائي"}
 </Button>
 </div>
 <p className="mt-2 text-[11px] text-muted-foreground">
 <strong>تنسيق وترتيب تلقائي:</strong> لو عندك خطة مكتوبة (من PDF أو وورد)، الصقها في حقل الملاحظات واضغط الزر — هتتحوّل لجدول منظّم قابل للتعديل، والعميل هيقدر يبدّل الوجبات.
 </p>
 </Card>

 <div className="space-y-3">
 {plans.map((p) => (
 <Card key={p.id} className="flex items-center justify-between gap-3 p-4 shadow-card">
 <div className="flex items-center gap-3">
 {p.type === "meal" ? <Salad className="h-5 w-5 text-primary" /> : <Dumbbell className="h-5 w-5 text-primary" />}
 <div>
 <div className="font-medium">{p.title}</div>
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <span>{new Date(p.created_at).toLocaleDateString()}</span>
 {p.status === "draft" && <Badge variant="outline" className="border-warning text-warning">مسودة</Badge>}
 {p.is_current && <Badge variant="outline" className="border-success text-success">مُفعّلة</Badge>}
 {p.notes === "Generated by AI" && <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary"><Sparkles className="me-1 h-3 w-3" />AI</Badge>}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setViewingPlan(p)}>
 <Eye className="h-3.5 w-3.5" />
 عرض
 </Button>
 <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(p)} className="text-destructive hover:text-destructive" title={isAr ? "حذف الخطة (بتأكيد)" : "Delete plan (with confirmation)"}>
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </Card>
 ))}
 {plans.length === 0 && (
 <p className="text-sm text-muted-foreground">{t("plans.empty")}</p>
 )}
 </div>
 </div>
 )}

 {tab === "ai-plans" && (
 <div className="space-y-6">
 {!planGateOpen && (
 <div className="rounded-xl border border-[#ff9500]/30 bg-[#ff9500]/10 p-4 text-sm font-medium text-[#b45309]">
 {planGateMessage}
 </div>
 )}
 <CoachAIPlanGenerator
 generating={generating}
 onGenerate={generateAIPlan}
 t={t}
 quota={aiUsage}
 lang={lang}
 qDietText={String(((nutriQ?.data ?? {}) as { diet?: unknown }).diet ?? "")}
 />

 {/* T-4PILLAR-COMPLETE: live status of queued plan jobs for THIS client.
     Results materialize automatically — even after a reload. */}
 {pendingPlanJobs.filter((e) => e.clientId === clientId).length > 0 && (
 <Card className="border-primary/30 bg-primary/5 p-4 shadow-card">
 <div className="flex items-center gap-2 text-sm font-semibold">
 <Loader2 className="h-4 w-4 animate-spin text-primary" />
 خطط قيد التوليد في الخلفية
 </div>
 <div className="mt-3 space-y-2">
 {pendingPlanJobs
 .filter((e) => e.clientId === clientId)
 .map((e) => (
 <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-sm">
 <div className="flex items-center gap-2">
 {e.kind === "workout" ? <Dumbbell className="h-4 w-4 text-primary" /> : <Salad className="h-4 w-4 text-primary" />}
 <span>{e.kind === "workout" ? "برنامج تمارين" : "خطة تغذية"}</span>
 {e.replacePlanId && (
 <Badge variant="outline" className="border-warning/40 text-warning">إعادة توليد</Badge>
 )}
 </div>
 <span className="text-xs text-muted-foreground">
 منذ {Math.max(1, Math.round((Date.now() - e.createdAt) / 60000))} دقيقة — تُحفظ تلقائيًا كمسودة عند الوصول
 </span>
 </div>
 ))}
 </div>
 </Card>
 )}

 {/* T-4PILLAR-COMPLETE: stranded-jobs recovery — finished plan jobs that
     never materialized (lost watcher / tab closed before the fix). */}
 {recoverableJobs.filter((j) => j.payload?.clientId === clientId).length > 0 && (
 <Card className="border-warning/40 bg-warning/5 p-4 shadow-card">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-2 text-sm font-semibold text-warning">
 <Sparkles className="h-4 w-4" />
 خطط جاهزة لم تُحفظ — استرجاع بنقرة
 </div>
 <Button size="sm" variant="ghost" onClick={() => void scanRecoverableJobs()} className="h-7 text-xs">
 تحديث
 </Button>
 </div>
 <div className="mt-3 space-y-2">
 {recoverableJobs
 .filter((j) => j.payload?.clientId === clientId)
 .map((j) => (
 <div key={j.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-sm">
 <div className="flex items-center gap-2">
 {planJobTypeToKind(j.job_type) === "workout" ? <Dumbbell className="h-4 w-4 text-primary" /> : <Salad className="h-4 w-4 text-primary" />}
 <span>{planJobTypeToKind(j.job_type) === "workout" ? "برنامج تمارين" : "خطة تغذية"}</span>
 <span className="text-xs text-muted-foreground">
 وصلت {new Date(j.finished_at ?? j.created_at ?? Date.now()).toLocaleString(isAr ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
 </span>
 </div>
 <Button
 size="sm"
 className="gap-1.5"
 disabled={recoveringId === j.id}
 onClick={() => recoverPlanJob(j)}
 >
 {recoveringId === j.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
 حفظ كمسودة
 </Button>
 </div>
 ))}
 </div>
 </Card>
 )}

 {/* Show all plans (drafts + approved + archived) */}
 <div>
 <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
 {t("coach.plansSection")} ({plans.length})
 </h3>
 {plans.length === 0 ? (
 <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
 {t("coach.noDrafts")}
 </Card>
 ) : (
 <div className="space-y-3">
 {plans.map((p) => {
 const isDraft = p.status === "draft";
 const isCurrent = p.is_current;
 return (
 <Card key={p.id} className={cn(
 "flex items-center justify-between gap-3 p-4 shadow-card",
 isDraft && "border-warning/40 bg-warning/5",
 isCurrent && "border-success/40",
 )}>
 <div className="flex items-center gap-3">
 {p.type === "meal" ? <Salad className="h-5 w-5 text-primary" /> : <Dumbbell className="h-5 w-5 text-primary" />}
 <div>
 <div className="font-medium">{p.title}</div>
 <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
 <span>{new Date(p.created_at).toLocaleDateString()}</span>
 {p.notes === "Generated by AI" && (
 <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
 <Sparkles className="me-1 h-3 w-3" /> AI
 </Badge>
 )}
 {isDraft && (
 <Badge variant="outline" className="border-warning text-warning">
 مسودة — بانتظار المراجعة
 </Badge>
 )}
 {isCurrent && (
 <Badge variant="outline" className="border-success text-success">
 مُفعّلة للعميل
 </Badge>
 )}
 {p.status === "archived" && (
 <Badge variant="outline" className="text-muted-foreground">
 أرشيف
 </Badge>
 )}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setViewingPlan(p)}>
 <Eye className="h-3.5 w-3.5" />
 عرض
 </Button>
 {isDraft && (
 <Button
 size="sm"
 className="gap-1.5"
 disabled={approving === p.id}
 onClick={() => handleApprovePlan(p.id)}
 >
 {approving === p.id ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <Check className="h-3.5 w-3.5" />
 )}
 موافقة وإرسال
 </Button>
 )}
 <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(p)} className="text-destructive hover:text-destructive" title={isAr ? "حذف الخطة (بتأكيد)" : "Delete plan (with confirmation)"}>
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </Card>
 );
 })}
 </div>
 )}
 </div>
 </div>
 )}

 {tab === "questionnaires" && (
 <div className="grid gap-4 md:grid-cols-2">
 <QuestionnaireCard
 title={t("coach.nutritionQ")}
 type="nutrition"
 data={nutriQ}
 clientId={clientId}
 t={t}
 onChanged={(row) => setNutriQ(row)}
 />
 <QuestionnaireCard
 title={t("coach.fitnessQ")}
 type="fitness"
 data={fitQ}
 clientId={clientId}
 t={t}
 onChanged={(row) => setFitQ(row)}
 />
 </div>
 )}

 {/* Quick notification button at top of notifications tab */}
 {tab === "notifications" && (
 <NotificationForm
   lang={lang}
   sendMode={{ kind: "single", userId: clientId }}
   className="rounded-3xl border border-[#d2d2d7] bg-[#f5f5f7] p-6"
   visible
 />
 )}

 {tab === "progress" && (
 <Card className="p-6 shadow-card">
 <h2 className="text-lg font-semibold">{t("prog.weightChart")}</h2>
 <div className="mt-4 h-64">
 {chartData.length > 0 ? (
 <ClientWeightChart data={chartData} variant="client" lang={lang} />
 ) : (
 <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
 {t("prog.noEntries")}
 </div>
 )}
 </div>
 </Card>
 )}

 {/* Plan Detail Modal — shows full plan content (meals/exercises) */}
 {viewingPlan && (
 <PlanViewerModal
 plan={viewingPlan}
 onClose={() => setViewingPlan(null)}
 onRegenerate={() => handleRegeneratePlan(viewingPlan)}
 // CALORIE-TARGET FIX 2026-10-24 (owner order item 1): the editor's
 // «تعديل الهدف اليومي» control routes an OUT-OF-BAND target change
 // here — the plan content is REGENERATED with the new target as the
 // generation override (meals, quantities, totals — NOT a number-only
 // edit), preserving the client's context + constraints (allergies,
 // diet, goal, measurements) and the plan's original diet type.
 onTargetRegenerate={(newTarget, dietType) => {
 setViewingPlan(null);
 void queuePlanJob("nutrition", {
 name: client?.full_name || "العميل",
 nutrition: nutriQ?.data || null,
 fitness: fitQ?.data || null,
 recent_measurements: progress.slice(-3).map((p) => ({
 weight: p.weight,
 waist: p.waist,
 date: p.created_at,
 })),
 recent_plan_names: buildRecentPlanNames(),
 }, { targetCalories: newTarget, ...(dietType ? { dietType } : {}) }, viewingPlan);
 }}
 // AI-PLAN-QUALITY 2026-10-24: the SAME context the full-plan generator
 // uses (questionnaires + measurements + recent-plan names) now rides
 // every in-editor regeneration — meal/item/day/exercise swaps stopped
 // running blind to allergies, diet, goal, location and injuries.
 regenContext={{
 clientContext: {
 name: client?.full_name || "العميل",
 nutrition: nutriQ?.data || null,
 fitness: fitQ?.data || null,
 recent_measurements: progress.slice(-3).map((p) => ({
 weight: p.weight,
 waist: p.waist,
 date: p.created_at,
 })),
 recent_plan_names: buildRecentPlanNames(),
 },
 location: String((fitQ?.data as { location?: unknown } | null)?.location ?? "") || undefined,
 }}
 />
 )}

 {/* DRAFT-DELETE FIX 2026-10-24 (owner order item 3): the in-UI delete
     confirmation — mobile-safe (no window.confirm, which in-app browsers
     suppress), explicit about WHAT is deleted (this one plans row — never
     ai_jobs receipts, plan_swaps history or notifications), and stronger
     for approved/current plans (a live client surface) than for drafts. */}
 {deleteTarget && (
 <Modal
 open={deleteTarget !== null}
 onOpenChange={(o) => {
 if (!o && deletingPlanId === null) setDeleteTarget(null);
 }}
 title={isAr ? "تأكيد حذف الخطة" : "Confirm plan deletion"}
 icon={<Trash2 className="h-5 w-5" />}
 size="sm"
 >
 <div className="space-y-4">
 <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
 <div className="font-semibold">{deleteTarget.title}</div>
 <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
 <span>{deleteTarget.type === "meal" ? "خطة تغذية" : "برنامج تمارين"}</span>
 <span>·</span>
 <span>{new Date(deleteTarget.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}</span>
 {deleteTarget.status === "draft" && (
 <Badge variant="outline" className="border-warning text-warning">مسودة — بانتظار المراجعة</Badge>
 )}
 {deleteTarget.is_current && (
 <Badge variant="outline" className="border-success text-success">مُفعّلة للعميل</Badge>
 )}
 {deleteTarget.status === "archived" && (
 <Badge variant="outline" className="text-muted-foreground">أرشيف</Badge>
 )}
 {deleteTarget.status === "approved" && !deleteTarget.is_current && (
 <Badge variant="outline" className="border-success/50 text-success">معتمدة</Badge>
 )}
 </div>
 </div>
 {deleteTarget.status === "draft" ? (
 <p className="text-sm text-muted-foreground">
 سيُحذف صف هذه المسودة <strong>نهائيًا من قاعدة البيانات</strong> بعد التأكيد. لا تُمس أي بيانات أخرى (مهام الذكاء الاصطناعى، سجل الاستبدالات، الإشعارات) ولا أي خطة أخرى.
 </p>
 ) : (
 <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
 <p className="font-semibold">
 {deleteTarget.is_current
 ? "هذه خطة مُفعّلة يراها العميل الآن"
 : "هذه خطة معتمدة"}
 {" "}— الحذف نهائي وستختفي من صفحة العميل فورًا.
 </p>
 <p className="mt-1 text-muted-foreground">
 يُحذف صف الخطة فقط من قاعدة البيانات — لا تُمس أي بيانات أخرى مرتبطة. إن كنت تريد استبدالها بخطة جديدة فالأفضل اعتماد الجديدة أولًا (تُؤرشف القديمة تلقائيًا) بدل الحذف.
 </p>
 </div>
 )}
 <div className="flex flex-wrap items-center justify-end gap-2">
 <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deletingPlanId !== null}>
 {isAr ? "إلغاء" : "Cancel"}
 </Button>
 <Button
 variant="destructive"
 onClick={() => void confirmRemovePlan()}
 disabled={deletingPlanId !== null}
 >
 {deletingPlanId !== null ? (
 <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
 ) : (
 <Trash2 className="me-1.5 h-4 w-4" />
 )}
 {deleteTarget.status === "draft"
 ? isAr ? "حذف المسودة نهائيًا" : "Delete draft permanently"
 : isAr ? "حذف الخطة نهائيًا" : "Delete plan permanently"}
 </Button>
 </div>
 </div>
 </Modal>
 )}
 </div>
 );
}

function QuestionnaireCard({
 title,
 type,
 data,
 clientId,
 t,
 onChanged,
}: {
 title: string;
 type: "nutrition" | "fitness";
 data: QuestionnaireRow | null;
 clientId: string;
 t: (k: string) => string;
 onChanged: (row: QuestionnaireRow) => void;
}) {
 // STAGE-254: the card's toasts speak the viewer's language (t arrives as
 // a prop but lang doesn't — useI18n is safe: the card lives inside the
 // I18nProvider).
 const { lang: cardLang } = useI18n();
 const isAr = cardLang === "ar";
 const status = data?.status;
 const qData = asForm(data?.data);
 const [editMode, setEditMode] = useState(false);
 const [form, setForm] = useState<Record<string, Json>>(qData);
 const [saving, setSaving] = useState(false);

 // Sync form when data changes externally
 useEffect(() => {
 setForm(asForm(data?.data));
 }, [data]);

 const handleSave = async () => {
 setSaving(true);
 try {
 const { upsertQuestionnaire } = await import("@/lib/data");
 // Coach edits keep the current status (don't downgrade "approved" to "draft")
 const row = await upsertQuestionnaire(clientId, type, form, data?.status || "draft");
 onChanged(row);
 setEditMode(false);
 toast.success(isAr ? "تم حفظ التعديلات!" : "Changes saved!");
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || (isAr ? "فشل الحفظ" : "Saving failed"));
 } finally {
 setSaving(false);
 }
 };

 // Field definitions — matches the client QuestionnairesView
 const isNutrition = type === "nutrition";
 const nutritionFields = [
 { key: "gender", label: "الجنس", type: "gender" as const },
 { key: "age", label: "العمر", type: "number" as const },
 { key: "height", label: "الطول (سم)", type: "number" as const },
 { key: "weight", label: "الوزن (كجم)", type: "number" as const },
 { key: "target_weight", label: "الوزن المستهدف", type: "number" as const },
 { key: "waist", label: "محيط الخصر", type: "number" as const },
 { key: "neck", label: "محيط الرقبة", type: "number" as const },
 { key: "hip", label: "محيط الورك", type: "number" as const },
 { key: "diet", label: "النظام الغذائي", type: "text" as const },
 { key: "allergies", label: "حساسية", type: "text" as const },
 { key: "disliked", label: "أطعمة غير مرغوبة", type: "text" as const },
 { key: "meals", label: "وجبات/يوم", type: "number" as const },
 { key: "water", label: "ماء (لتر/يوم)", type: "number" as const },
 { key: "medical", label: "حالات طبية", type: "text" as const },
 { key: "supplements", label: "مكملات", type: "text" as const },
 ];
 const fitnessFields = [
 { key: "goal", label: "الهدف", type: "text" as const },
 { key: "activity", label: "مستوى النشاط", type: "select" as const, options: ["sedentary","light","moderate","active","very_active","extra_active"] as const },
 { key: "days", label: "أيام التدريب", type: "number" as const },
 { key: "location", label: "مكان التدريب", type: "text" as const },
 { key: "experience", label: "الخبرة", type: "text" as const },
 { key: "injuries", label: "إصابات", type: "text" as const },
 { key: "preferred", label: "نوع التدريب المفضل", type: "text" as const },
 { key: "equipment", label: "المعدات", type: "text" as const },
 { key: "sleep", label: "النوم (ساعات)", type: "number" as const },
 ];
 const fields = isNutrition ? nutritionFields : fitnessFields;
 const activityLabels: Record<string, string> = {
 sedentary: "خامل", light: "خفيف", moderate: "متوسط",
 active: "نشط", very_active: "نشط جداً", extra_active: "فوق العادي",
 };

 return (
 <Card className="p-5 shadow-card">
 <div className="mb-3 flex items-center justify-between gap-2">
 <h3 className="font-semibold">{title}</h3>
 <div className="flex items-center gap-2">
 {status && (
 <Badge variant="outline">
 {t(`q.status.${status}`)}
 </Badge>
 )}
 {!editMode ? (
 <Button size="sm" variant="outline" className="gap-1.5 h-7" onClick={() => setEditMode(true)}>
 <Pencil className="h-3 w-3" /> تعديل
 </Button>
 ) : (
 <>
 <Button size="sm" className="gap-1.5 h-7" onClick={handleSave} disabled={saving}>
 {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} حفظ
 </Button>
 <Button size="sm" variant="ghost" className="h-7" onClick={() => { setEditMode(false); setForm(asForm(data?.data)); }}>
 إلغاء
 </Button>
 </>
 )}
 </div>
 </div>
 {!data && !editMode ? (
 <p className="text-sm text-muted-foreground">{t("coach.noQ")}</p>
 ) : editMode ? (
 <div className="grid gap-3 sm:grid-cols-2">
 {fields.map((f) => {
 if (f.type === "gender") {
 return (
 <div key={f.key}>
 <Label className="text-xs text-muted-foreground">{f.label}</Label>
 <div className="mt-1 grid grid-cols-2 gap-1.5">
 <button
 type="button"
 onClick={() => setForm((p) => ({ ...p, [f.key]: "male" }))}
 className={`rounded-lg border p-2 text-xs font-medium ${form[f.key] === "male" ? "border-primary bg-secondary text-primary" : "border-border"}`}
 > ذكر</button>
 <button
 type="button"
 onClick={() => setForm((p) => ({ ...p, [f.key]: "female" }))}
 className={`rounded-lg border p-2 text-xs font-medium ${form[f.key] === "female" ? "border-primary bg-secondary text-primary" : "border-border"}`}
 > أنثى</button>
 </div>
 </div>
 );
 }
 if (f.type === "select") {
 return (
 <div key={f.key} className="sm:col-span-2">
 <Label className="text-xs text-muted-foreground">{f.label}</Label>
 <select
 value={form[f.key] == null ? "" : String(form[f.key])}
 onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
 className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm h-8"
 >
 <option value="">— اختر —</option>
 {f.options.map((opt) => (
 <option key={opt} value={opt}>{activityLabels[opt] || opt}</option>
 ))}
 </select>
 </div>
 );
 }
 return (
 <div key={f.key}>
 <Label className="text-xs text-muted-foreground">{f.label}</Label>
 <Input
 type={f.type === "number" ? "number" : "text"}
 value={form[f.key] == null ? "" : String(form[f.key])}
 onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
 className="mt-1 h-8 text-sm"
 />
 </div>
 );
 })}
 <div className="sm:col-span-2">
 <Label className="text-xs text-muted-foreground">ملاحظات</Label>
 <Textarea
 value={form.notes == null ? "" : String(form.notes)}
 onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
 className="mt-1 min-h-[60px] text-sm"
 />
 </div>
 {/* Show photos (read-only — coach can view but not upload from here) */}
 {isNutrition && Array.isArray(form.photos) && form.photos.length > 0 && (
 <div className="sm:col-span-2">
 <Label className="text-xs text-muted-foreground">صور العميل</Label>
 <div className="mt-1 grid grid-cols-3 gap-2">
 {(form.photos as Json[]).map((url, i) => (
 <a key={i} href={String(url)} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg border border-border">
 <Image src={String(url)} alt={`صورة ${i + 1}`} fill className="object-cover" />
 </a>
 ))}
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="space-y-2 text-sm">
 {Object.entries(qData).filter(([k]) => k !== "photos").map(([k, v]) => {
 // Friendlier labels for known keys
 const labelMap: Record<string, string> = {
 gender: "الجنس", age: "العمر", height: "الطول", weight: "الوزن",
 target_weight: "الوزن المستهدف", waist: "الخصر", neck: "الرقبة", hip: "الورك",
 diet: "النظام الغذائي", allergies: "حساسية", disliked: "غير مرغوب",
 meals: "وجبات/يوم", water: "ماء", medical: "حالات طبية", supplements: "مكملات",
 notes: "ملاحظات", goal: "الهدف", activity: "النشاط", days: "أيام التدريب",
 location: "المكان", experience: "الخبرة", injuries: "إصابات",
 preferred: "التدريب المفضل", equipment: "المعدات", sleep: "النوم",
 };
 const displayValue = k === "gender" ? (v === "male" ? "ذكر" : v === "female" ? "أنثى" : String(v))
 : k === "activity" ? (activityLabels[String(v)] || String(v))
 : formatQuestionnaireValue(k, v, true);
 return (
 <div key={k} className="flex justify-between gap-3 border-b border-border/60 pb-1.5">
 <span className="text-muted-foreground">{labelMap[k] || k}</span>
 <span className="font-medium text-end">{displayValue}</span>
 </div>
 );
 })}
 {/* Show photos */}
 {isNutrition && Array.isArray(qData.photos) && qData.photos.length > 0 && (
 <div className="pt-2">
 <span className="text-muted-foreground">صور العميل:</span>
 <div className="mt-2 grid grid-cols-3 gap-2">
 {(qData.photos as Json[]).map((url, i) => (
 <a key={i} href={String(url)} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg border border-border">
 <Image src={String(url)} alt={`صورة ${i + 1}`} fill className="object-cover" />
 </a>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </Card>
 );
}


function PlanViewerModal({
 plan,
 onClose,
 onRegenerate,
 onTargetRegenerate,
 regenContext,
}: {
 plan: Plan;
 onClose: () => void;
 onRegenerate?: () => void;
 /** CALORIE-TARGET FIX 2026-10-24: an out-of-band target change routes
  *  here — the parent regenerates the plan content with the new target
  *  (meals, quantities, totals) preserving the client's context. */
 onTargetRegenerate?: (newTarget: number, dietType?: DietType) => void;
 regenContext?: { clientContext: Record<string, unknown>; location?: string };
}) {
 const { t, lang } = useI18n();
 // STAGE-254: bilingual toasts — the modal is fully bilingual already, the
 // toasts were the only Arabic-only stragglers in it.
 const isAr = lang === "ar";
 // BUNDLE LAW (2026-09-05): the 1.6MB exercises array was imported at
 // module scope — now lazy-loaded mini records (session-cached).
 const EXERCISES = useExerciseLookup();
 const [editMode, setEditMode] = useState(false);
 const [title, setTitle] = useState(plan.title);
 const [notes, setNotes] = useState(plan.notes || "");
 // Deep clone keeps the editor's mutations off the source row object.
 const [content, setContent] = useState<PlanContent | null>(plan.content ? JSON.parse(JSON.stringify(plan.content)) as PlanContent : null);
 const [saving, setSaving] = useState(false);
 const isWorkout = plan.type === "workout";

 // CALORIE-TARGET FIX 2026-10-24 (owner order item 1): the daily-calorie
 // TARGET editor. The stat card below now shows the meals' ACTUAL sum
 // (read-only — editing it was the «الرقم المعروض» illusion); changing the
 // TARGET is this dedicated flow: within the platform's consistency band
 // (±max(120, 7%)) the meals already track the new target → the target
 // field updates and rides the same «حفظ» as every other edit; outside the
 // band a recalculation can NEVER move the meals toward the target → the
 // plan content is regenerated (onTargetRegenerate) with the new target as
 // the generation override, preserving the client's context/constraints.
 const [targetEditOpen, setTargetEditOpen] = useState(false);
 const [targetDraft, setTargetDraft] = useState("");
 const [targetRegenConfirm, setTargetRegenConfirm] = useState<number | null>(null);
 const currentTarget = content && "meals" in content ? Number(content.daily_calories) || 0 : 0;
 const mealsActual = content && "meals" in content ? Number(content.meals_total_calories) || 0 : 0;
 // Preserve the plan's original diet constraint across the regeneration:
 // the generation echo (data_analysis.diet_type) is an Arabic label — map
 // it back to the DietType enum so the new prompt obeys the same diet.
 const planDietType = (() => {
 if (!content || !("meals" in content)) return undefined;
 const label = String((content as NutritionPlanContent).data_analysis?.diet_type || "");
 const hit = (Object.keys(DIET_TYPE_LABELS_AR) as DietType[]).find(
 (k) => DIET_TYPE_LABELS_AR[k] === label,
 );
 return hit;
 })();
 const applyTargetDraft = () => {
 const n = parseInt(targetDraft.replace(/[^0-9]/g, ""), 10);
 if (!Number.isFinite(n) || n <= 0) {
 toast.error(isAr ? "اكتب هدفًا صحيحًا بالسعرات (مثلاً 2000)" : "Enter a valid calorie target (e.g. 2000)");
 return;
 }
 if (n < 1200) {
 toast.error(isAr ? "الحد الأدنى اليومي 1200 سعرة (حد المنصة الصحي) — راجع الهدف" : "The daily floor is 1200 kcal (the platform's health floor) — review the target");
 return;
 }
 if (n > 6000) {
 toast.error(isAr ? "الحد الأقصى اليومي 6000 سعرة — راجع الهدف" : "The daily ceiling is 6000 kcal — review the target");
 return;
 }
 const verdict = resolveTargetCalorieChange(n, mealsActual > 0 ? mealsActual : n);
 if (verdict.kind === "in-band") {
 if (content && "meals" in content) {
 const next = JSON.parse(JSON.stringify(content)) as NutritionPlanContent;
 next.daily_calories = n;
 setContent(next);
 }
 setTargetEditOpen(false);
 setTargetDraft("");
 toast.success(
 isAr
 ? `تم تحديث الهدف اليومي إلى ${n} سعرة — الوجبات الحالية متسقة معه ضمن نطاق المنصة (اضغط «حفظ» للتثبيت)`
 : `Daily target updated to ${n} kcal — the current meals already track it within the platform's band (press Save)`,
 );
 return;
 }
 // Outside the band: recalculation can't move the meals toward the
 // target — regeneration is the honest path. Confirm in-UI (mobile-safe).
 setTargetRegenConfirm(n);
 setTargetEditOpen(false);
 setTargetDraft("");
 };

 // T-4PILLAR-COMPLETE: per-exercise AI swap inside the coach editor —
 // same injury-safe library-filtered job the client side uses, wired
 // through runAiJob (blocking is fine here: the modal is the destination).
 const [regeneratingExKey, setRegeneratingExKey] = useState<string | null>(null);
 const swapExerciseAI = async (dayIdx: number, exIdx: number, focus?: string) => {
 if (!content || !("days" in content)) return;
 const ex = content.days[dayIdx]?.exercises?.[exIdx];
 if (!ex) return;
 setRegeneratingExKey(`${dayIdx}-${exIdx}`);
 try {
 // Swaps run on the GitHub Actions queue; the sanitized payload
 // carries name/sets/reps/rest/focus only.
 // AI-PLAN-QUALITY 2026-10-24: the regeneration now carries the
 // client's context + training location — the substitution engine's
 // injury/equipment filters key on them (blind swaps produced gym
 // machines for home clients and injury-unsafe picks).
 const { result } = await runAiJob("exercise_regenerate", {
 exercise: { name: ex.name, sets: ex.sets, reps: ex.reps, rest: ex.rest, focus },
 location: regenContext?.location,
 clientContext: regenContext?.clientContext,
 });
 // Job results are job-type-specific JSON — narrow to the exercise contract the engine honors.
 const rep = (result.replacement ?? null) as WorkoutPlanContent["days"][number]["exercises"][number] | null;
 if (!rep?.name) throw new Error(isAr ? "لم يتم إرجاع بديل صالح من الذكاء الاصطناعي" : "The AI did not return a valid replacement");
 const newContent = { ...content };
 newContent.days = [...newContent.days];
 newContent.days[dayIdx] = { ...newContent.days[dayIdx] };
 newContent.days[dayIdx].exercises = [...newContent.days[dayIdx].exercises];
 newContent.days[dayIdx].exercises[exIdx] = { ...newContent.days[dayIdx].exercises[exIdx], ...rep };
 setContent(newContent);
 toast.success(isAr ? "تم استبدال التمرين ببديل آمن ✅ — اضغط \"حفظ\" لتثبيت التعديل." : "Exercise replaced with a safe alternative ✅ — press \"Save\" to apply the change.");
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || (isAr ? "فشل استبدال التمرين" : "Failed to replace the exercise"));
 } finally {
 setRegeneratingExKey(null);
 }
 };

 const handleSave = async () => {
 setSaving(true);
 try {
 const { updatePlan } = await import("@/lib/data");
 await updatePlan(plan.id, { title, notes, content });
 // Mutating a prop is forbidden by react-hooks/immutability — use a local
 // copy so the UI updates without modifying the source object.
 const updated = { ...plan, title, notes, content };
 Object.assign(plan, updated);
 toast.success(isAr ? "تم حفظ التعديلات بنجاح!" : "Changes saved successfully!");
 setEditMode(false);
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || (isAr ? "فشل الحفظ" : "Saving failed"));
 } finally {
 setSaving(false);
 }
 };

 // Download plan as PDF — opens a print-optimized window with the full
 // plan content rendered in the PDF reference style. The browser's print
 // dialog lets the user save as PDF.
 const downloadPlanPDF = () => {
 const w = window.open("", "_blank", "width=820,height=1040");
 if (!w) {
 toast.error(isAr ? "المتصفح حظر النافذة المنبثقة. اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى." : "The browser blocked the popup. Allow pop-ups for this site and try again.");
 return;
 }
 const c = content;
 const isWorkout = plan.type === "workout";
 let html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{font-family:'Cairo',sans-serif;padding:32px;color:#141414;margin:0;line-height:1.7}
 h1{font-size:24px;margin:0 0 6px;color:#1F8FFF}
 h2{font-size:18px;margin:20px 0 10px;border-bottom:2px solid #1F8FFF;padding-bottom:4px}
 h3{font-size:15px;margin:14px 0 6px}
 p{color:#333}
 table{width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:13px}
 th,td{border:1px solid #e2e2e2;padding:8px 10px;text-align:right}
 th{background:#f4f9ff;color:#1F8FFF;font-weight:700}
 tr:nth-child(even){background:#fafafa}
 .brand{display:flex;align-items:center;gap:8px;margin-bottom:16px;border-bottom:3px solid #1F8FFF;padding-bottom:12px}
 .brand-logo{width:36px;height:36px;background:#1F8FFF;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:14px}
 .brand-name{font-size:18px;font-weight:800;color:#1F8FFF}
 .brand-tag{font-size:11px;color:#666;margin-top:2px}
 .stats{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
 .stat{background:#f0f7ff;padding:10px 18px;border-radius:10px;font-weight:700;text-align:center;min-width:80px}
 .stat-label{font-size:10px;color:#666;display:block;font-weight:400}
 .stat-value{font-size:18px;color:#1F8FFF}
 .analysis{background:#f9f9f9;border-radius:10px;padding:14px;margin:12px 0;font-size:12px}
 .analysis-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
 .analysis-item{padding:4px 0}
 .analysis-label{color:#666}
 .supplement{background:#fff;border:1px solid #e2e2e2;border-radius:8px;padding:10px;margin:6px 0;font-size:12px}
 .supplement-name{font-weight:700;color:#1F8FFF}
 .health-note{display:flex;gap:6px;margin:4px 0;font-size:12px}
 .health-note:before{content:"•";color:#1F8FFF}
 .meal-total{background:#f0f7ff;font-weight:700}
 .meal-total td{border-top:2px solid #1F8FFF}
 .rest-day{background:#fff3cd;text-align:center;padding:20px;font-style:italic;color:#856404}
 .footer{margin-top:30px;border-top:1px solid #e2e2e2;padding-top:12px;font-size:11px;color:#999;text-align:center}
 @media print{body{padding:20px}}
</style></head><body>
<div class="brand">
 <div class="brand-logo">MH</div>
 <div>
 <div class="brand-name">Alkemos</div>
 <div class="brand-tag">كوتش أونلاين للتغذية واللياقة | alkemos.com</div>
 </div>
</div>
<h1>${title}</h1>`;

 // Overview
 if (c?.overview) {
 html += `<p style="white-space:pre-line">${c.overview}</p>`;
 }

 if (!isWorkout && c && "meals" in c) {
 // Data analysis
 if (c.data_analysis) {
 const da = c.data_analysis;
 html += `<h2> تحليل البيانات</h2><div class="analysis"><div class="analysis-grid">`;
 if (da.gender) html += `<div class="analysis-item"><span class="analysis-label">الجنس:</span> ${da.gender}</div>`;
 if (da.weight) html += `<div class="analysis-item"><span class="analysis-label">الوزن:</span> ${da.weight}</div>`;
 if (da.height) html += `<div class="analysis-item"><span class="analysis-label">الطول:</span> ${da.height}</div>`;
 if (da.age) html += `<div class="analysis-item"><span class="analysis-label">العمر:</span> ${da.age}</div>`;
 if (da.neck) html += `<div class="analysis-item"><span class="analysis-label">الرقبة:</span> ${da.neck}</div>`;
 if (da.waist) html += `<div class="analysis-item"><span class="analysis-label">الخصر:</span> ${da.waist}</div>`;
 if (da.hip) html += `<div class="analysis-item"><span class="analysis-label">الورك:</span> ${da.hip}</div>`;
 if (da.activity) html += `<div class="analysis-item"><span class="analysis-label">النشاط:</span> ${da.activity}</div>`;
 if (da.health) html += `<div class="analysis-item"><span class="analysis-label">الصحة:</span> ${da.health}</div>`;
 if (da.body_fat_pct) html += `<div class="analysis-item"><span class="analysis-label">نسبة الدهون:</span> ${da.body_fat_pct}</div>`;
 if (da.bmr) html += `<div class="analysis-item"><span class="analysis-label">BMR:</span> ~${da.bmr} سعرة</div>`;
 if (da.tdee) html += `<div class="analysis-item"><span class="analysis-label">TDEE:</span> ~${da.tdee} سعرة</div>`;
 html += `</div></div>`;
 }

 // Macros
 const printCals = displayCalories(c);
 if (printCals > 0 || c.macros) {
 html += `<h2> السعرات والماكروز</h2><div class="stats">`;
 if (printCals > 0) html += `<div class="stat"><span class="stat-label">السعرات اليومية (مجموع الوجبات)</span><span class="stat-value">${printCals}</span></div>`;
 if (c.macros?.protein_g) html += `<div class="stat"><span class="stat-label">بروتين</span><span class="stat-value">${c.macros.protein_g}جم</span></div>`;
 if (c.macros?.carbs_g) html += `<div class="stat"><span class="stat-label">كارب</span><span class="stat-value">${c.macros.carbs_g}جم</span></div>`;
 if (c.macros?.fat_g) html += `<div class="stat"><span class="stat-label">دهون</span><span class="stat-value">${c.macros.fat_g}جم</span></div>`;
 html += `</div>`;
 }

 // Supplements
 if ((c.supplements?.length ?? 0) > 0) {
 html += `<h2> المكملات والتوصيات الصحية</h2>`;
 for (const s of c.supplements ?? []) {
 html += `<div class="supplement"><div class="supplement-name">${s.name}</div>`;
 if (s.dose) html += `<div>الجرعة: ${s.dose}</div>`;
 if (s.timing) html += `<div>الموعد: ${s.timing}</div>`;
 if (s.purpose) html += `<div>الهدف: ${s.purpose}</div>`;
 html += `</div>`;
 }
 }

 // Health notes
 if ((c.health_notes?.length ?? 0) > 0) {
 html += `<h2> توصيات صحية خاصة</h2>`;
 for (const n of c.health_notes ?? []) {
 html += `<div class="health-note">${n}</div>`;
 }
 }

 // Water target
 if (c.water_target) {
 html += `<h2> استهلاك الماء</h2><p>${c.water_target}</p>`;
 }

 // Meals
 if (!isWorkout && c && "meals" in c && c.meals?.length > 0) {
 html += `<h2> النظام الغذائي</h2>`;
 for (const m of c.meals) {
 html += `<h3>${m.name}${m.time ? ` <span style="font-size:11px;color:#666;font-weight:400">${m.time}</span>` : ""}</h3>`;
 html += `<table><tr><th style="width:30px">#</th><th>المكون</th><th>الكمية</th><th>السعرات</th><th>البدائل</th></tr>`;
 (m.items || []).forEach((it, i) => {
 html += `<tr><td>${i + 1}</td><td>${it.food}</td><td>${it.amount}</td><td>${it.calories}</td><td style="font-size:11px;color:#666">${it.alternatives || "—"}</td></tr>`;
 });
 if (m.total_calories || m.total_protein_g) {
 html += `<tr class="meal-total"><td colspan="3">إجمالي الوجبة: ~${m.total_calories || (m.items || []).reduce((s, i) => s + (i.calories || 0), 0)} سعرة</td><td>${m.total_protein_g || ""} ${m.total_protein_g ? "جم بروتين" : ""}</td><td></td></tr>`;
 }
 html += `</table>`;
 if (m.notes) html += `<p style="font-size:12px;color:#666"> ${m.notes}</p>`;
 }
 }
 } else if (isWorkout && c && "days" in c) {
 // Workout volume + progression
 if (c.weekly_volume || c.progression) {
 html += `<h2> الحجم والتقدم</h2>`;
 if (c.weekly_volume) html += `<p><strong>الحجم الأسبوعي:</strong> ${c.weekly_volume}</p>`;
 if (c.progression) html += `<p><strong>طريقة التقدم:</strong> ${c.progression}</p>`;
 }
 // Days
 html += `<h2> البرنامج الأسبوعي</h2>`;
 for (const d of c.days) {
 if (d.isRest) {
 html += `<h3>${d.day} — راحة </h3><div class="rest-day">يوم راحة — استشفِ وارتاح. اشرب ماء كافي ونم 7-9 ساعات.</div>`;
 } else {
 html += `<h3>${d.day} — ${d.focus || ""}</h3>`;
 html += `<table><tr><th style="width:30px">#</th><th>التمرين</th><th>مجموعات</th><th>تكرارات</th><th>راحة</th></tr>`;
 (d.exercises || []).forEach((ex, i) => {
 // Find exercise in library for images
 const exLib = EXERCISES.find((e) => e.slug === ex.exerciseSlug || e.nameEn === ex.name || e.nameEn?.toLowerCase() === ex.name?.toLowerCase());
 const exImages = exLib ? getExerciseImages(exLib.imageKey) : [];
 let imgHtml = "";
 if (exImages.length > 0) {
 imgHtml = `<div style="display:flex;gap:4px;margin-bottom:4px">`;
 exImages.slice(0, 2).forEach((url: string) => {
 imgHtml += `<img src="${url}" alt="${ex.name}" style="width:60px;height:60px;object-fit:contain;border:1px solid #e2e2e2;border-radius:6px;background:#fafafa" onerror="this.style.display='none'">`;
 });
 imgHtml += `</div>`;
 }
 html += `<tr><td>${i + 1}</td><td>${imgHtml}<strong>${ex.name}</strong>${ex.notes ? `<br><span style="font-size:11px;color:#666">${ex.notes}</span>` : ""}</td><td style="color:#0071e3;font-weight:700">${ex.sets}</td><td style="color:#34c759;font-weight:700">${ex.reps}</td><td style="color:#ff9500;font-weight:700">${ex.rest}</td></tr>`;
 });
 html += `</table>`;
 }
 }
 }

 // General notes
 if (notes && notes !== "Generated by AI" && notes !== "Coach-added (structured)") {
 html += `<h2> ملاحظات عامة</h2><p>${notes}</p>`;
 }

 html += `<div class="footer">© ${new Date().getFullYear()} Alkemos | alkemos.com<br>هذا التقرير مُعد لأغراض إرشادية — يُرجى استشارة طبيب مختص قبل بدء أي نظام غذائي أو تناول مكملات.</div>`;
 html += `</body></html>`;
 w.document.write(html);
 w.document.close();
 w.focus();
 setTimeout(() => w.print(), 500);
 };


 // Helper to update nested content fields (dynamic path — kept honest
 // with an explicit clone + unknown tree instead of `any`).
 const updateField = (path: string, value: Json) => {
 if (!content) return;
 const newContent = JSON.parse(JSON.stringify(content)) as PlanContent;
 const keys = path.split(".");
 let obj = newContent as unknown as Record<string, unknown>;
 for (let i = 0; i < keys.length - 1; i++) {
 const next = obj[keys[i]];
 obj[keys[i]] = next && typeof next === "object" ? { ...(next as Record<string, unknown>) } : {};
 obj = obj[keys[i]] as Record<string, unknown>;
 }
 obj[keys[keys.length - 1]] = value;
 setContent(newContent);
 };

 // Update meal item — every edit flows through the shared pure math
 // (src/lib/nutrition-totals.ts): item macros → meal totals → plan
 // daily_calories + meals_total_calories + macros (grams AND 4/4/9 kcal
 // splits) — the owner-ordered behavior «بعد تحديد السعرات أو الجرامات
 // يتم تغيّر كل السعرات والماكروز لكامل الخطة».
 //
 // PLAN-EDIT-2026-10-24: the OLD food/amount handler silently fetched
 // the FIRST /api/food-search match and applied its numbers invisibly
 // (a wrong pick was undetectable). That path is REPLACED by the
 // FoodPickerCell combobox (visible library choices) + session-bound
 // per-100g rows: gram edits recompute from the food the coach actually
 // chose; unbound items keep their numbers until a pick (honesty over
 // guessing — the NOTIF→PLAN lesson).
 const [boundFoods, setBoundFoods] = useState<Record<string, BoundFood>>({});

 const pickLibraryFood = (mealIdx: number, itemIdx: number, row: FoodSearchRow) => {
  if (!content || !("meals" in content) || !content.meals[mealIdx]) return;
  const newContent: NutritionPlanContent = JSON.parse(JSON.stringify(content));
  const item = newContent.meals[mealIdx].items[itemIdx];
  if (!item) return;
  // Keep the coach's existing grams when the amount already carries a
  // gram quantity; otherwise prefill the library row's default serving
  // (150g for a chicken breast, etc.) — never a blind 100.
  const grams = parseGrams(item.amount) ?? row.defaultGrams ?? 100;
  item.food = row.name;
  item.amount = `${grams} ${isAr ? "جرام" : "g"}`;
  const scaled = scalePer100g(row.per100g, grams);
  item.calories = scaled.calories;
  item.protein_g = scaled.protein_g;
  item.carbs_g = scaled.carbs_g;
  item.fat_g = scaled.fat_g;
  setBoundFoods((prev) => ({ ...prev, [`${mealIdx}:${itemIdx}`]: { name: row.name, per100g: row.per100g } }));
  setContent(recomputeNutritionTotals(newContent));
  toast.success(isAr
   ? "تم اختيار الصنف من المكتبة ✅ — عدّل الجرامات وستُعاد حسابات الخطة كلها تلقائيًا (اضغط «حفظ» للتثبيت)"
   : "Picked from the food library ✅ — change the grams and every plan total recalculates (press Save to apply)");
 };

 const updateMealItem = (mealIdx: number, itemIdx: number, field: "food" | "amount" | "calories" | "alternatives", value: string) => {
  if (!content || !("meals" in content) || !content.meals[mealIdx]) return;
  const newContent: NutritionPlanContent = JSON.parse(JSON.stringify(content));
  const item = newContent.meals[mealIdx].items[itemIdx];
  if (!item) return;

  if (field === "calories") {
   item.calories = parseInt(value) || 0;
  } else if (field === "alternatives") {
   item.alternatives = value;
  } else if (field === "food") {
   // Free-text rename (FoodPickerCell blur without a pick): the
   // custom name is kept as typed — macros are NOT guessed.
   item.food = value;
  } else {
   // AMOUNT — grams drive the recalc when a library food is bound
   // to this item (pick or explicit re-pick). Count-based amounts
   // ("2 بيضة") parse to null and keep the current numbers.
   item.amount = value;
   const bound = boundFoods[`${mealIdx}:${itemIdx}`];
   const grams = parseGrams(value);
   if (bound && grams != null) {
    const scaled = scalePer100g(bound.per100g, grams);
    item.calories = scaled.calories;
    item.protein_g = scaled.protein_g;
    item.carbs_g = scaled.carbs_g;
    item.fat_g = scaled.fat_g;
   }
  }

  setContent(recomputeNutritionTotals(newContent));
 };

 // Regenerate a single meal — queues meal_regenerate on GitHub Actions, then updates
 // the meal in-place. Available to the coach for ALL plans (AI-generated
 // AND manually-added), so the coach can quickly vary a meal without
 // regenerating the whole plan.
 const [regeneratingMealIdx, setRegeneratingMealIdx] = useState<number | null>(null);
 const regenerateSingleMeal = async (mealIdx: number) => {
 if (!content || !("meals" in content) || !content.meals[mealIdx]) return;
 setRegeneratingMealIdx(mealIdx);
 try {
 const meal = content.meals[mealIdx];
 // OWNER DIRECTIVE 2026-08-27: meal regeneration is a queued AI job
 // (GitHub Actions worker) returning the replacement + 3 suggestions.
 // AI-PLAN-QUALITY 2026-10-24: the request now carries the client's
 // CONTEXT (allergies/goal/diet via the questionnaire data) and the
 // other meals' foods as the avoid-list — regeneration used to run
 // BLIND and could serve foods the client is allergic to.
 const avoidNames: string[] = (content.meals || [])
 .flatMap((m, i) =>
 i === mealIdx
 ? []
 : [String(m?.name || ""), ...((m?.items || []).map((it) => String(it?.food || "")))],
 )
 .filter((n) => n.trim().length > 1)
 .slice(0, 40);
 const { result } = await runAiJob("meal_regenerate", {
 meal,
 targetCalories:
 (typeof meal.total_calories === "number" && meal.total_calories > 0
 ? meal.total_calories
 : (meal.items || []).reduce((s, i) => s + (Number(i?.calories) || 0), 0)) || undefined,
 clientContext: regenContext?.clientContext,
 avoid_names: avoidNames,
 });
 // Job results are job-type-specific JSON — the engine’s "done" result always carries
 // a replacement meal with this exact shape (same runtime semantics as before).
 // The server gate already validated + coerced it; the double-check below
 // keeps a defensive floor against any legacy/drifted payload.
 const newMeal = result.replacement as NutritionPlanContent["meals"][number];
 if (!newMeal || !Array.isArray(newMeal.items) || newMeal.items.length === 0) {
 throw new Error(isAr ? "نتيجة إعادة التوليد غير صالحة — لم تُطبّق" : "The regeneration result is invalid — not applied");
 }
 const newContent: NutritionPlanContent = JSON.parse(JSON.stringify(content));
 newContent.meals[mealIdx] = { ...newMeal };

 // PLAN-EDIT-2026-10-24: totals ride the shared pure math
 // (recomputeNutritionTotals) — including meals_total_calories so the
 // «اتساق الوجبات» banner can never go stale after a regeneration.
 // The replaced meal's items are AI-provided, not library picks —
 // drop this meal's session bindings so a later gram edit can't
 // recompute from the OLD food's per-100g row.
 setBoundFoods((prev) => {
  const next: Record<string, BoundFood> = {};
  for (const [k, v] of Object.entries(prev)) {
   if (k.startsWith(`${mealIdx}:`)) continue;
   next[k] = v;
  }
  return next;
 });
 setContent(recomputeNutritionTotals(newContent));
 toast.success(isAr ? "تم إعادة توليد الوجبة!" : "Meal regenerated!");
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || (isAr ? "فشل إعادة التوليد" : "Regeneration failed"));
 } finally {
 setRegeneratingMealIdx(null);
 }
 };

 // Update exercise
 const updateExercise = (dayIdx: number, exIdx: number, field: "name" | "notes" | "image" | "sets" | "reps" | "rest" | "exerciseSlug", value: string) => {
 if (!content || !("days" in content) || !content.days[dayIdx]) return;
 const newContent: WorkoutPlanContent = { ...content };
 newContent.days = [...newContent.days];
 newContent.days[dayIdx] = { ...newContent.days[dayIdx] };
 newContent.days[dayIdx].exercises = [...newContent.days[dayIdx].exercises];
 const ex = { ...newContent.days[dayIdx].exercises[exIdx] };
 if (field === "sets") {
 ex.sets = parseInt(value) || 0;
 } else if (field === "exerciseSlug") {
 ex.exerciseSlug = value;
 } else {
 ex[field] = value;
 }
 newContent.days[dayIdx].exercises[exIdx] = ex;
 setContent(newContent);
 };

 // Add meal item
 // PLAN-EDIT-2026-10-24: the inline totals math moved to the shared
 // zero-dep leaf (src/lib/nutrition-totals.ts, unit-tested there) —
 // this alias keeps the call sites below terse. It also recomputes
 // meals_total_calories (the old inline copy didn't — the «اتساق
 // الوجبات» banner went stale after every edit).
 const recomputeTotals = (c: NutritionPlanContent) => recomputeNutritionTotals(c);

 // ── Phase 79 (owner «الكوتشينج يستفيدوا من نفس الخصائص»): the two
 // granular regeneration tools the admin console has, now inside the
 // coach plan editor — ONE food item and ONE workout day, via the same
 // GitHub Actions queue (staff editing tools — no client quota burned).
 const [regeneratingElKey, setRegeneratingElKey] = useState<string | null>(null);

 const regenerateSingleItem = async (mealIdx: number, itemIdx: number) => {
 if (!content || !("meals" in content)) return;
 const meal = content.meals[mealIdx];
 const item = meal?.items?.[itemIdx];
 if (!meal || !item) return;
 if (!String(item.food || "").trim()) {
 toast.error(isAr ? "الصنف فاضي — اكتب اسم الصنف الأول أو احذفه." : "The item is empty — write the item name first or delete it.");
 return;
 }
 const key = `item:${mealIdx}:${itemIdx}`;
 setRegeneratingElKey(key);
 try {
 // Avoid-list: every OTHER item in the whole plan (same meal + other
 // meals) so the AI cannot propose something that already exists.
 const avoidNames: string[] = [];
 (content.meals || []).forEach((m, mi) => {
 (m.items || []).forEach((it, ii) => {
 if ((mi !== mealIdx || ii !== itemIdx) && it?.food) avoidNames.push(String(it.food));
 });
 });
 const { result } = await runAiJob("food_item_regenerate", {
 item: { food: item.food, amount: item.amount, calories: item.calories, alternatives: item.alternatives },
 meal_name: meal.name,
 avoid_names: avoidNames.slice(0, 40),
 // AI-PLAN-QUALITY 2026-10-24: same context law as the meal swap —
 // the ±15% single-item replacement must respect allergies/diet.
 clientContext: regenContext?.clientContext,
 });
 // Job results are job-type-specific JSON — narrow to the item contract the engine honors.
 const rep = (result.replacement ?? null) as NutritionPlanContent["meals"][number]["items"][number] | null;
 if (!rep?.food) throw new Error(isAr ? "لم يتم إرجاع بديل صالح من الذكاء الاصطناعي" : "The AI did not return a valid replacement");
 const newContent: NutritionPlanContent = { ...content };
 newContent.meals = [...newContent.meals];
 newContent.meals[mealIdx] = { ...newContent.meals[mealIdx] };
 newContent.meals[mealIdx].items = [...newContent.meals[mealIdx].items];
 newContent.meals[mealIdx].items[itemIdx] = { ...newContent.meals[mealIdx].items[itemIdx], ...rep };
 // AI-PLAN-QUALITY 2026-10-24 (ROOT BUG): the old call DISCARDED the
 // recomputed copy — `recomputeTotals(newContent)` returns a NEW object
 // and its return value was thrown away, so meal/plan totals stayed
 // STALE in the editor after every AI item swap (and the stale numbers
 // were what got SAVED). The recomputed copy is the content now.
 const recomputed = recomputeTotals(newContent);
 // PLAN-EDIT-2026-10-24: the AI's replacement is NOT the coach's picked
 // library row — drop this item's binding so a later gram edit can't
 // recompute from the OLD food's per-100g numbers.
 setBoundFoods((prev) => {
  const next = { ...prev };
  delete next[`${mealIdx}:${itemIdx}`];
  return next;
 });
 setContent(recomputed);
 toast.success(isAr ? "تم استبدال الصنف ✅ — اضغط \"حفظ\" لتثبيت التعديل." : "Item replaced ✅ — press \"Save\" to apply the change.");
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || (isAr ? "فشل استبدال الصنف" : "Failed to replace the item"));
 } finally {
 setRegeneratingElKey(null);
 }
 };

 const regenerateSingleDay = async (dayIdx: number) => {
 if (!content || !("days" in content)) return;
 const d = content.days[dayIdx];
 if (!d || d.isRest) return;
 const key = `day:${dayIdx}`;
 setRegeneratingElKey(key);
 try {
 // Avoid-list: every exercise used in the OTHER days of the same plan.
 const avoidNames: string[] = [];
 (content.days || []).forEach((day, di) => {
 if (di === dayIdx) return;
 (day.exercises || []).forEach((ex) => {
 if (ex?.name) avoidNames.push(String(ex.name));
 });
 });
 const { result } = await runAiJob("day_regenerate", {
 day: { day: d.day, focus: d.focus, exercises: d.exercises || [] },
 avoid_names: avoidNames.slice(0, 60),
 // AI-PLAN-QUALITY 2026-10-24: same context law — home/gym equipment
 // + injuries + experience drive the day's exercise selection.
 clientContext: regenContext?.clientContext,
 });
 // Job results are job-type-specific JSON — narrow to the day contract the engine honors.
 const rep = (result.replacement ?? null) as WorkoutPlanContent["days"][number] | null;
 if (!rep?.exercises?.length) throw new Error(isAr ? "لم يتم إرجاع يوم صالح من الذكاء الاصطناعي" : "The AI did not return a valid day");
 const newContent = { ...content };
 newContent.days = [...newContent.days];
 // Same weekly slot label; fresh focus + exercises from the engine.
 newContent.days[dayIdx] = { ...d, ...rep, day: d.day };
 setContent(newContent);
 toast.success(isAr ? "تم إعادة توليد اليوم ✅ — اضغط \"حفظ\" لتثبيت التعديل." : "Day regenerated ✅ — press \"Save\" to apply the change.");
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || (isAr ? "فشل إعادة توليد اليوم" : "Failed to regenerate the day"));
 } finally {
 setRegeneratingElKey(null);
 }
 };

 const addMealItem = (mealIdx: number) => {
 if (!content || !("meals" in content)) return;
 const newContent: NutritionPlanContent = { ...content };
 newContent.meals = [...newContent.meals];
 newContent.meals[mealIdx] = { ...newContent.meals[mealIdx] };
 newContent.meals[mealIdx].items = [...newContent.meals[mealIdx].items, { food: "", amount: "", calories: 0 }];
 // AI-PLAN-QUALITY 2026-10-24: same discarded-return bug class — the
 // recomputed totals copy is the content that renders and saves.
 setContent(recomputeTotals(newContent));
 };

 // Remove meal item
 const removeMealItem = (mealIdx: number, itemIdx: number) => {
 if (!content || !("meals" in content)) return;
 const newContent: NutritionPlanContent = { ...content };
 newContent.meals = [...newContent.meals];
 newContent.meals[mealIdx] = { ...newContent.meals[mealIdx] };
 newContent.meals[mealIdx].items = newContent.meals[mealIdx].items.filter((_, i) => i !== itemIdx);
 // AI-PLAN-QUALITY 2026-10-24: same discarded-return bug class.
 const recomputed = recomputeTotals(newContent);
 // PLAN-EDIT-2026-10-24: bindings are index-keyed — dropping an item
 // shifts the later indices of the SAME meal; re-key them so a binding
 // can never end up pointing at the wrong item's food.
 setBoundFoods((prev) => {
  const next: Record<string, BoundFood> = {};
  for (const [k, v] of Object.entries(prev)) {
   const [m, i] = k.split(":").map(Number);
   if (m === mealIdx) {
    if (i === itemIdx) continue; // the removed item — drop its binding
    if (i > itemIdx) {
     next[`${m}:${i - 1}`] = v; // shifted down by the removal
     continue;
    }
   }
   next[k] = v;
  }
  return next;
 });
 setContent(recomputed);
 };

 // Add exercise
 const addExercise = (dayIdx: number) => {
 if (!content || !("days" in content) || !content.days[dayIdx]) return;
 const newContent: WorkoutPlanContent = { ...content };
 newContent.days[dayIdx].exercises = [...newContent.days[dayIdx].exercises, { name: "", sets: 3, reps: "10-12", rest: "90 ثانية", notes: "" }];
 setContent(newContent);
 };

 // Remove exercise
 const removeExercise = (dayIdx: number, exIdx: number) => {
 if (!content || !("days" in content) || !content.days[dayIdx]) return;
 const newContent: WorkoutPlanContent = { ...content };
 newContent.days[dayIdx].exercises = newContent.days[dayIdx].exercises.filter((_, i) => i !== exIdx);
 setContent(newContent);
 };

 // Editable cell component
 // EditCell — defined at module level to prevent focus loss on re-render
 // (inline function definitions cause React to remount the component on every keystroke)
 const EditCell = useMemo(() => {
   return ({ value, onChange, type = "text", className = "" }: { value: string | number | undefined; onChange: (v: string) => void; type?: string; className?: string }) => (
     editMode ? (
       <Input
         type={type}
         value={value ?? ""}
         onChange={(e) => onChange(e.target.value)}
         className={`h-8 text-sm ${className}`}
       />
     ) : (
       <span>{value ?? "—"}</span>
     )
   );
 }, [editMode]);

 // PHASE 334 — W1-3b (remediation plan §6.2, audit A-03): the hand-rolled
 // overlay (no dialog semantics, no Escape, no focus trap, and a literally-
 // EMPTY close button) is replaced by the unified <Modal> wrapper built in
 // W1-3a. The wrapper's `title` prop takes a NODE in edit mode — the inline
 // Input rides DialogTitle directly (the editable-header shape W1-3a built
 // for exactly this modal), and the header badges + action buttons ride the
 // `actions` slot in their original order (badges first, then the buttons).
 return (
 <Modal
 open={true}
 onOpenChange={(o) => {
 if (!o) onClose();
 }}
 title={
 editMode ? (
 <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-bold h-9" />
 ) : (
 title
 )
 }
 icon={isWorkout ? <Dumbbell className="h-5 w-5" /> : <Salad className="h-5 w-5" />}
 size="lg"
 scroll
 actions={
 <>
 {plan.status === "draft" && <Badge variant="outline" className="border-warning text-warning">مسودة</Badge>}
 {plan.is_current && <Badge variant="outline" className="border-success text-success">مُفعّلة</Badge>}
 {plan.notes === "Generated by AI" && <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary"><Sparkles className="me-1 h-3 w-3" />AI</Badge>}
 {!editMode ? (
 <>
 {onRegenerate && (
 <Button size="sm" variant="outline" className="gap-1.5 border-primary/30 text-primary" onClick={onRegenerate} title="إعادة توليد الخطة كاملة">
 <RefreshCw className="h-3.5 w-3.5" />
 {/* PLAN-EDIT-2026-10-24: icon-only on phones — the header action
     cluster is the surface that overflowed the modal off-screen
     (639px min-content inside a 328px dialog at 360px); the label
     returns ≥sm where the dialog is 672px wide. */}
 <span className="hidden sm:inline">إعادة توليد</span>
 </Button>
 )}
 <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadPlanPDF()} title="تحميل الخطة كـ PDF">
 <Download className="h-3.5 w-3.5" />
 <span className="hidden sm:inline">PDF</span>
 </Button>
 <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditMode(true)}>
 <Pencil className="h-3.5 w-3.5" />
 تعديل
 </Button>
 </>
 ) : (
 <>
 <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
 {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
 حفظ
 </Button>
 <Button size="sm" variant="ghost" onClick={() => { setEditMode(false); setTitle(plan.title); setNotes(plan.notes || ""); setContent(plan.content ? JSON.parse(JSON.stringify(plan.content)) : null); }}>
 إلغاء
 </Button>
 </>
 )}
 </>
 }
 >

 {/* Content */}
 {content ? (
 <div className="space-y-4">
 {/* Overview */}
 <div>
 <Label className="text-xs text-muted-foreground">نظرة عامة</Label>
 {editMode ? (
 <Textarea
 value={content.overview || ""}
 onChange={(e) => updateField("overview", e.target.value)}
 className="mt-1 min-h-[60px] text-sm"
 />
 ) : (
 content.overview && <p className="mt-1 text-sm text-muted-foreground">{content.overview}</p>
 )}
 </div>

 {/* NOTIF→PLAN 2026-10-24 (owner order items 5+7): the review banner —
     missing basic data / extreme values must STOP silent approval; the
     coach sees exactly WHY the plan needs his eyes before اعتماد. */}
 {!isWorkout && content && "meals" in content && content.needs_review && (
 <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
 <div className="flex items-center gap-1.5 font-bold">
 <AlertTriangle className="h-4 w-4" />
 الخطة تحتاج مراجعتك قبل الاعتماد
 </div>
 <p className="mt-1 leading-relaxed">{content.needs_review.note}</p>
 <ul className="mt-1.5 list-inside list-disc space-y-0.5 opacity-90">
 {content.needs_review.flags.map((f, i) => (
 <li key={i}>{REVIEW_FLAG_LABELS_AR[f] ?? f}</li>
 ))}
 </ul>
 </div>
 )}

 {/* NOTIF→PLAN 2026-10-24 (owner order item 7): meals-vs-target
     consistency — one line, computed from the SAME totals the member
     sees, so "بطاقة 2905" vs "نظرة عامة 2320" can never silently
     diverge again. */}
 {!isWorkout && content && "meals" in content && typeof content.meals_total_calories === "number" && content.meals_total_calories > 0 && (
 <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs">
 <span className="font-semibold">اتساق الوجبات: </span>
 <span className="text-muted-foreground">
 مجموع سعرات الوجبات ≈ {content.meals_total_calories} سعرة
 {content.daily_calories > 0 && (
 <>
 {" · "}
 {Math.abs(content.meals_total_calories - content.daily_calories) <= Math.max(TARGET_CONSISTENCY_ABS_KCAL, content.daily_calories * TARGET_CONSISTENCY_PCT) ? (
 <span className="font-medium text-success">متسق مع الهدف اليومي ({content.daily_calories} سعرة)</span>
 ) : (
 <span className="font-medium text-amber-600 dark:text-amber-400">
 يختلف عن الهدف اليومي ({content.daily_calories} سعرة) بنحو {content.meals_total_calories - content.daily_calories > 0 ? "+" : ""}{content.meals_total_calories - content.daily_calories} سعرة — استخدم «تعديل الهدف» لإعادة التوليد بالهدف الصحيح
 </span>
 )}
 </>
 )}
 </span>
 </div>
 )}

 {/* CALORIE-TARGET FIX 2026-10-24 (owner order item 1): the daily-target
     control — the ONLY way the target changes now. In-band changes update
     the target field (saved via «حفظ»); out-of-band changes regenerate the
     plan content (meals, quantities, totals) with the new target — never
     a number-only edit that leaves the meals behind. */}
 {!isWorkout && content && "meals" in content && (
 <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="text-xs">
 <span className="font-semibold">الهدف اليومي: </span>
 <span className="text-primary font-bold">{currentTarget > 0 ? currentTarget : "غير محدد"}</span>
 <span className="text-muted-foreground"> سعرة</span>
 {mealsActual > 0 && (
 <span className="text-muted-foreground"> · وجبات الخطة حاليًا ≈ {mealsActual} سعرة</span>
 )}
 </div>
 {!targetEditOpen ? (
 <Button
 size="sm"
 variant="outline"
 className="h-7 gap-1.5 border-primary/30 text-primary"
 onClick={() => {
 setTargetDraft(currentTarget > 0 ? String(currentTarget) : "");
 setTargetEditOpen(true);
 }}
 >
 <Target className="h-3.5 w-3.5" />
 تعديل الهدف
 </Button>
 ) : (
 <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setTargetEditOpen(false); setTargetDraft(""); }}>
 إلغاء
 </Button>
 )}
 </div>
 {targetEditOpen && (
 <div className="mt-2.5 space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 <Input
 type="number"
 inputMode="numeric"
 value={targetDraft}
 onChange={(e) => setTargetDraft(e.target.value)}
 placeholder="مثلاً: 2000"
 className="h-8 w-32 text-sm"
 />
 <Button size="sm" className="h-8" onClick={applyTargetDraft} disabled={!targetDraft.trim()}>
 تطبيق الهدف
 </Button>
 </div>
 <p className="text-[11px] leading-relaxed text-muted-foreground">
 تغيير ضئيل (ضمن ±{Math.round(Math.max(TARGET_CONSISTENCY_ABS_KCAL, (parseInt(targetDraft) || currentTarget || 2000) * TARGET_CONSISTENCY_PCT))} سعرة من وجبات الخطة): يُحدَّث الرقم الهدف فقط وتظل الوجبات كما هي — متسقة أصلًا.
 <br />
 تغيير أكبر: تُعاد توليد الوجبات والكميات والمجاميع كاملة بالهدف الجديد (نفس قيود العميل: الحساسيات، النظام الغذائي، الهدف) وتصل كمسودة جديدة تحل محل هذه عند اعتمادك.
 </p>
 </div>
 )}
 {targetRegenConfirm !== null && (
 <div className="mt-2.5 rounded-xl border border-warning/40 bg-warning/5 p-3 text-xs">
 <p className="font-semibold text-warning">
 الهدف الجديد ({targetRegenConfirm} سعرة) يتطلب إعادة توليد الخطة — تغيير الرقم وحده لا يجعل الوجبات تطابقه.
 </p>
 <p className="mt-1 leading-relaxed text-muted-foreground">
 سيُرسل طلب توليد جديد بالهدف الجديد مع الحفاظ الكامل على بيانات العميل وقيوده (الحساسيات، النظام الغذائي{planDietType ? ` (${DIET_TYPE_LABELS_AR[planDietType]})` : ""}، الهدف، القياسات). تصل الخطة الجديدة كمسودة خلال دقائق — {plan.status === "draft" ? "وتحل محل هذه المسودة عند وصولها" : "والخطة الحالية تبقى معتمدة كما هي حتى تعتمد الجديدة"}. هذا يخصم وحدة من رصيد توليد الخطط الشهري للعميل.
 </p>
 <div className="mt-2 flex flex-wrap items-center gap-2">
 <Button size="sm" variant="ghost" className="h-7" onClick={() => setTargetRegenConfirm(null)}>
 إلغاء
 </Button>
 <Button
 size="sm"
 className="h-7 gap-1.5"
 onClick={() => {
 if (onTargetRegenerate) {
 onTargetRegenerate(targetRegenConfirm, planDietType);
 } else {
 toast.error(isAr ? "إعادة التوليد بالهدف غير متاحة هنا" : "Target regeneration is unavailable here");
 }
 setTargetRegenConfirm(null);
 }}
 >
 <RefreshCw className="h-3.5 w-3.5" />
 إعادة التوليد بالهدف الجديد
 </Button>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Nutrition: Macros — CALORIE-TARGET FIX 2026-10-24: the السعرات card
     is the meals' ACTUAL sum (displayCalories: meals_total first, target
     fallback for legacy plans) and is READ-ONLY even in edit mode — it is
     computed from the items (edit the items, or «تعديل الهدف» above), and
     the old editable card was exactly the «تغيير الرقم المعروض» illusion:
     typing a number there never touched the meals, and any later item edit
     silently clobbered it back (RC1-a + RC1-b). The target has its own
     dedicated control above; macros stay item-derived and editable as
     free-text overrides of what the items sum to. */}
 {!isWorkout && (
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
 {[
 { key: "macros.protein_g", label: "بروتين", color: "text-success", suffix: "g" },
 { key: "macros.carbs_g", label: "كارب", color: "text-warning", suffix: "g" },
 { key: "macros.fat_g", label: "دهون", color: "text-primary", suffix: "g" },
 ].map((stat) => {
 const val = content[stat.key.split(".")[0]]?.[stat.key.split(".")[1]];
 return (
 <div key={stat.key} className="rounded-xl border border-border bg-background p-3 text-center">
 {editMode ? (
 <Input
 type="number"
 value={val ?? 0}
 onChange={(e) => {
 updateField(stat.key, parseInt(e.target.value) || 0);
 }}
 className={`h-8 text-center text-lg font-bold ${stat.color}`}
 />
 ) : (
 <div className={`font-display text-lg font-bold ${stat.color}`}>{val || 0}{stat.suffix}</div>
 )}
 <div className="text-xs text-muted-foreground">{stat.label}</div>
 </div>
 );
 })}
 <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
 <div className="font-display text-lg font-bold text-primary">
 {content && "meals" in content ? displayCalories(content) : 0}
 </div>
 <div className="text-xs text-muted-foreground">السعرات (مجموع الوجبات)</div>
 </div>
 </div>
 )}

 {/* PDF-style extras: data analysis + supplements + health notes + water target */}
 {!isWorkout && content && "meals" in content && (content.data_analysis || content.supplements?.length || content.health_notes?.length || content.water_target) && (
 <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
 {content.data_analysis && (
 <div>
 <h4 className="mb-2 text-sm font-bold"> تحليل البيانات {editMode && <span className="text-xs font-normal text-muted-foreground">(قابل للتعديل)</span>}</h4>
 {editMode ? (
 <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
 {[
 { key: "gender", label: "الجنس", placeholder: "ذكر/أنثى" },
 { key: "weight", label: "الوزن", placeholder: "80 كجم" },
 { key: "height", label: "الطول", placeholder: "175 سم" },
 { key: "age", label: "العمر", placeholder: "25 سنة" },
 { key: "neck", label: "الرقبة", placeholder: "37 سم" },
 { key: "waist", label: "الخصر", placeholder: "85 سم" },
 { key: "hip", label: "الورك", placeholder: "95 سم" },
 { key: "activity", label: "النشاط", placeholder: "متوسط" },
 { key: "health", label: "الصحة", placeholder: "لا يوجد" },
 { key: "body_fat_pct", label: "نسبة الدهون", placeholder: "~20%" },
 { key: "bmr", label: "BMR", placeholder: "1700", type: "number" },
 { key: "tdee", label: "TDEE", placeholder: "2300", type: "number" },
 ].map((f) => (
 <div key={f.key}>
 <Label className="text-[10px] text-muted-foreground">{f.label}</Label>
 <Input
 type={f.type === "number" ? "number" : "text"}
 value={String((content.data_analysis as Record<string, unknown> | undefined)?.[f.key] ?? "")}
 placeholder={f.placeholder}
 onChange={(e) => {
 const newContent = { ...content };
 newContent.data_analysis = { ...newContent.data_analysis, [f.key]: e.target.value };
 setContent(newContent);
 }}
 className="mt-0.5 h-8 text-xs"
 />
 </div>
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
 {content.data_analysis.gender && <div><span className="text-muted-foreground">الجنس:</span> {content.data_analysis.gender}</div>}
 {content.data_analysis.weight && <div><span className="text-muted-foreground">الوزن:</span> {content.data_analysis.weight}</div>}
 {content.data_analysis.height && <div><span className="text-muted-foreground">الطول:</span> {content.data_analysis.height}</div>}
 {content.data_analysis.age && <div><span className="text-muted-foreground">العمر:</span> {content.data_analysis.age}</div>}
 {content.data_analysis.neck && <div><span className="text-muted-foreground">الرقبة:</span> {content.data_analysis.neck}</div>}
 {content.data_analysis.waist && <div><span className="text-muted-foreground">الخصر:</span> {content.data_analysis.waist}</div>}
 {content.data_analysis.hip && <div><span className="text-muted-foreground">الورك:</span> {content.data_analysis.hip}</div>}
 {content.data_analysis.activity && <div><span className="text-muted-foreground">النشاط:</span> {content.data_analysis.activity}</div>}
 {content.data_analysis.health && <div><span className="text-muted-foreground">الصحة:</span> {content.data_analysis.health}</div>}
 {content.data_analysis.body_fat_pct && <div><span className="text-muted-foreground">نسبة الدهون:</span> {content.data_analysis.body_fat_pct}</div>}
 {content.data_analysis.bmr && <div><span className="text-muted-foreground">BMR:</span> ~{content.data_analysis.bmr} سعرة</div>}
 {content.data_analysis.tdee && <div><span className="text-muted-foreground">TDEE:</span> ~{content.data_analysis.tdee} سعرة</div>}
 </div>
 )}
 </div>
 )}

 {content && "supplements" in content && (content.supplements?.length ?? 0) > 0 && (
 <div>
 <h4 className="mb-2 text-sm font-bold"> المكملات والتوصيات الصحية {editMode && <span className="text-xs font-normal text-muted-foreground">(قابل للتعديل)</span>}</h4>
 <div className="space-y-2">
 {(content.supplements ?? []).map((s, i) => (
 <div key={i} className="rounded-lg border border-border bg-background p-2 text-xs">
 {editMode ? (
 <div className="space-y-1">
 <div className="grid grid-cols-2 gap-1.5">
 <Input
 value={s.name || ""}
 onChange={(e) => {
 if (!content || !("supplements" in content)) return;
 const newContent: NutritionPlanContent = { ...content };
 newContent.supplements = [...(newContent.supplements ?? [])];
 newContent.supplements[i] = { ...(newContent.supplements ?? [])[i], name: e.target.value };
 setContent(newContent);
 }}
 placeholder="اسم المكمل"
 className="h-7 text-xs font-semibold"
 />
 <Input
 value={s.dose || ""}
 onChange={(e) => {
 if (!content || !("supplements" in content)) return;
 const newContent: NutritionPlanContent = { ...content };
 newContent.supplements = [...(newContent.supplements ?? [])];
 newContent.supplements[i] = { ...(newContent.supplements ?? [])[i], dose: e.target.value };
 setContent(newContent);
 }}
 placeholder="الجرعة (مثلاً: 200-400 مج)"
 className="h-7 text-xs"
 />
 </div>
 <div className="grid grid-cols-2 gap-1.5">
 <Input
 value={s.timing || ""}
 onChange={(e) => {
 if (!content || !("supplements" in content)) return;
 const newContent: NutritionPlanContent = { ...content };
 newContent.supplements = [...(newContent.supplements ?? [])];
 newContent.supplements[i] = { ...(newContent.supplements ?? [])[i], timing: e.target.value };
 setContent(newContent);
 }}
 placeholder="الموعد (مثلاً: قبل النوم)"
 className="h-7 text-xs"
 />
 <Input
 value={s.purpose || ""}
 onChange={(e) => {
 if (!content || !("supplements" in content)) return;
 const newContent: NutritionPlanContent = { ...content };
 newContent.supplements = [...(newContent.supplements ?? [])];
 newContent.supplements[i] = { ...(newContent.supplements ?? [])[i], purpose: e.target.value };
 setContent(newContent);
 }}
 placeholder="الهدف"
 className="h-7 text-xs"
 />
 </div>
 <button
 onClick={() => {
 if (!content || !("supplements" in content)) return;
 const newContent: NutritionPlanContent = { ...content };
 newContent.supplements = (newContent.supplements ?? []).filter((_, j) => j !== i);
 setContent(newContent);
 }}
 className="text-destructive hover:text-destructive/80 text-[11px] flex items-center gap-1"
 >
 <Trash2 className="h-3 w-3" /> حذف المكمل
 </button>
 </div>
 ) : (
 <>
 <div className="font-semibold">{s.name}</div>
 <div className="text-muted-foreground">
 {s.dose && <span>الجرعة: {s.dose}</span>}
 {s.timing && <span> | الموعد: {s.timing}</span>}
 </div>
 {s.purpose && <div className="mt-0.5 text-muted-foreground">الهدف: {s.purpose}</div>}
 </>
 )}
 </div>
 ))}
 </div>
 {editMode && (
 <button
 onClick={() => {
 if (!content || !("supplements" in content)) return;
 const newContent: NutritionPlanContent = { ...content };
 newContent.supplements = [...(newContent.supplements || []), { name: "", dose: "", timing: "", purpose: "" }];
 setContent(newContent);
 }}
 className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
 >
 <Plus className="h-3 w-3" /> إضافة مكمل
 </button>
 )}
 </div>
 )}

 {content && "meals" in content && (content.health_notes?.length ?? 0) > 0 && (
 <div>
 <h4 className="mb-2 text-sm font-bold"> توصيات صحية خاصة {editMode && <span className="text-xs font-normal text-muted-foreground">(قابل للتعديل)</span>}</h4>
 {editMode ? (
 <div className="space-y-1.5">
 {(content.health_notes ?? []).map((n, i) => (
 <div key={i} className="flex gap-1.5">
 <span className="text-primary mt-1.5">•</span>
 <Input
 value={n}
 onChange={(e) => {
 if (!content || !("meals" in content)) return;
 const newContent: NutritionPlanContent = { ...content };
 newContent.health_notes = [...(newContent.health_notes ?? [])];
 newContent.health_notes[i] = e.target.value;
 setContent(newContent);
 }}
 className="h-7 text-xs flex-1"
 />
 <button
 onClick={() => {
 if (!content || !("meals" in content)) return;
 const newContent: NutritionPlanContent = { ...content };
 newContent.health_notes = (newContent.health_notes ?? []).filter((_, j) => j !== i);
 setContent(newContent);
 }}
 className="text-destructive hover:text-destructive/80 p-1"
 >
 <Trash2 className="h-3 w-3" />
 </button>
 </div>
 ))}
 <button
 onClick={() => {
 const newContent = { ...content };
 newContent.health_notes = [...(newContent.health_notes || []), ""];
 setContent(newContent);
 }}
 className="flex items-center gap-1 text-xs text-primary hover:underline"
 >
 <Plus className="h-3 w-3" /> إضافة توصية
 </button>
 </div>
 ) : (
 <ul className="space-y-1 text-xs text-muted-foreground">
 {(content.health_notes ?? []).map((n, i) => (
 <li key={i} className="flex items-start gap-1.5">
 <span className="text-primary">•</span>
 <span>{n}</span>
 </li>
 ))}
 </ul>
 )}
 </div>
 )}

 {/* Water target — always show in edit mode so coach can add it */}
 {(content.water_target || editMode) && (
 <div className="text-xs">
 {editMode ? (
 <div className="flex items-center gap-2">
 <span className="font-bold"> استهلاك الماء:</span>
 <Input
 value={content.water_target || ""}
 onChange={(e) => updateField("water_target", e.target.value)}
 placeholder="مثلاً: 2.5 إلى 3 لتر يومياً"
 className="h-7 text-xs flex-1"
 />
 </div>
 ) : content.water_target ? (
 <div>
 <span className="font-bold"> استهلاك الماء:</span> {content.water_target}
 </div>
 ) : null}
 </div>
 )}
 </div>
 )}

 {/* Meals table — PDF-style with numbered items, alternatives, and per-meal totals */}
 {!isWorkout && content && "meals" in content && content.meals?.map((m, mealIdx: number) => (
 <div key={mealIdx} className="rounded-xl border border-border p-4">
 <div className="mb-2 flex items-center justify-between gap-2">
 <div className="flex-1">
 {editMode ? (
 <Input
 value={m.name || ""}
 onChange={(e) => {
 if (!content || !("meals" in content)) return;
 const newContent: NutritionPlanContent = { ...content };
 newContent.meals[mealIdx] = { ...newContent.meals[mealIdx], name: e.target.value };
 setContent(newContent);
 }}
 className="h-8 font-semibold"
 />
 ) : (
 <h4 className="font-semibold"> {m.name}</h4>
 )}
 {m.time && !editMode && (
 <p className="text-xs text-muted-foreground">{m.time}</p>
 )}
 </div>
 {/* Per-meal regenerate button — works for ALL plans (AI + manual).
     PLAN-EDIT-2026-10-24 (owner order — «توليد صنف او وجبة بالذكاء
     الاصطناعي»): available in BOTH modes now — it was view-only
     before, so the coach editing a meal had to exit edit mode to
     regenerate it. */}
 <Button
 size="sm"
 variant="outline"
 className="gap-1.5 border-primary/30 text-primary shrink-0"
 onClick={() => regenerateSingleMeal(mealIdx)}
 disabled={regeneratingMealIdx !== null}
 >
 {regeneratingMealIdx === mealIdx ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <RefreshCw className="h-3.5 w-3.5" />
 )}
 <span className="hidden sm:inline">إعادة توليد الوجبة</span>
 <span className="sm:hidden">توليد</span>
 </Button>
 </div>
 {/* NOTIF→PLAN 2026-10-24 (item 6): the table scrolls inside its own
     card on phones — never outside the modal. */}
 <div className="overflow-x-auto">
 <table className="w-full min-w-[520px] text-sm">
 <thead>
 <tr className="border-b border-border text-start">
 <th className="p-2 text-start font-medium text-muted-foreground w-8">#</th>
 <th className="p-2 text-start font-medium text-muted-foreground">المكون</th>
 <th className="p-2 text-start font-medium text-muted-foreground">الكمية</th>
 <th className="p-2 text-start font-medium text-muted-foreground">السعرات</th>
 <th className="p-2 text-start font-medium text-muted-foreground hidden md:table-cell">البدائل</th>
 {/* Phase 79: per-item AI swap — same tool the admin console has.
     PLAN-EDIT-2026-10-24 (owner order — «المفترض أن يكون متاح للمدرب
     التعديل والتبديل»): the swap column now exists in BOTH modes —
     one header cell, one action cell per row. */}
 <th className="p-2 w-8"></th>
 </tr>
 </thead>
 <tbody>
 {m.items?.map((it, itemIdx: number) => (
 <tr key={itemIdx} className="border-b border-border/60">
 <td className="p-2 text-muted-foreground">{itemIdx + 1}</td>
 <td className="p-2 min-w-[9rem]">
 {/* PLAN-EDIT-2026-10-24 (owner order — «مفترض أن يظهر اختيارات من
     مكتبة الأطعمة عند كتابة اسم الصنف»): the food cell in edit mode
     is a combobox over the food library — visible choices, never a
     silent first-match guess. */}
 {editMode ? (
 <FoodPickerCell
 value={it.food || ""}
 lang={lang}
 isAr={isAr}
 mealIdx={mealIdx}
 itemIdx={itemIdx}
 onPick={pickLibraryFood}
 onRename={(mi, ii, v) => updateMealItem(mi, ii, "food", v)}
 />
 ) : (
 <span className="font-medium">{it.food}</span>
 )}
 </td>
 <td className="p-2"><EditCell value={it.amount} onChange={(v) => updateMealItem(mealIdx, itemIdx, "amount", v)} /></td>
 <td className="p-2">
 <EditCell value={it.calories} onChange={(v) => updateMealItem(mealIdx, itemIdx, "calories", v)} type="number" />
 {it.protein_g && !editMode && (
 <span className="text-[10px] text-muted-foreground"> {it.protein_g}جم</span>
 )}
 </td>
 <td className="p-2 text-xs text-muted-foreground hidden md:table-cell">
 {editMode ? (
 <Input
 value={it.alternatives || ""}
 onChange={(e) => updateMealItem(mealIdx, itemIdx, "alternatives", e.target.value)}
 placeholder="بدائل (اختياري)"
 className="h-8 text-xs"
 />
 ) : (
 it.alternatives && <span>{it.alternatives}</span>
 )}
 </td>
 <td className="p-2">
 <div className="flex items-center gap-1.5">
 {/* PLAN-EDIT-2026-10-24: the AI item swap rides INSIDE edit mode
     too (it was view-only before) — swap + delete side by side,
     the same cluster the workout editor has. */}
 <button
 onClick={() => regenerateSingleItem(mealIdx, itemIdx)}
 disabled={regeneratingElKey !== null}
 title="استبدال الصنف ببديل مكافئ بالذكاء الاصطناعي"
 className="text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
 >
 {regeneratingElKey === `item:${mealIdx}:${itemIdx}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
 </button>
 {editMode && (
 <button onClick={() => removeMealItem(mealIdx, itemIdx)} className="text-destructive hover:text-destructive/80">
 <Trash2 className="h-3.5 w-3.5" />
 </button>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 {/* Per-meal totals row — matches the PDF format */}
 {(m.total_calories || m.total_protein_g) && (
 <tfoot>
 <tr className="border-t-2 border-primary/30 bg-primary/5">
 <td colSpan={3} className="p-2 text-end font-semibold text-primary">
 {typeof m.total_calories === "number" ? `~${m.total_calories}` : `~${m.items?.reduce((s, i) => s + (i.calories || 0), 0) || 0}`} سعرة حرارية
 </td>
 <td className="p-2 font-semibold text-success">
 {typeof m.total_protein_g === "number" ? m.total_protein_g : ""} {m.total_protein_g ? "جم بروتين" : ""}
 </td>
 <td colSpan={2} className="p-2"></td>
 </tr>
 </tfoot>
 )}
 </table>
 </div>
 {editMode && (
 <button onClick={() => addMealItem(mealIdx)} className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
 <Plus className="h-3 w-3" /> إضافة صنف
 </button>
 )}
 {m.notes && !editMode && <p className="mt-1 text-xs text-muted-foreground"> {m.notes}</p>}
 {editMode && (
 <Input
 value={m.notes || ""}
 onChange={(e) => {
 const newContent = { ...content };
 newContent.meals[mealIdx] = { ...newContent.meals[mealIdx], notes: e.target.value };
 setContent(newContent);
 }}
 placeholder="ملاحظات الوجبة..."
 className="mt-2 h-8 text-xs"
 />
 )}
 </div>
 ))}

 {/* Workout volume + progression — editable */}
 {isWorkout && content && "days" in content && (content.weekly_volume || content.progression || editMode) && (
 <div className="grid gap-3 sm:grid-cols-2">
 {(content.weekly_volume || editMode) && (
 <div>
 <Label className="text-xs text-muted-foreground"> الحجم الأسبوعي</Label>
 {editMode ? (
 <Input
 value={content.weekly_volume || ""}
 onChange={(e) => updateField("weekly_volume", e.target.value)}
 placeholder="مثلاً: 20 مجموعة أسبوعياً"
 className="mt-1 h-8 text-sm"
 />
 ) : (
 <p className="mt-1 text-sm">{content.weekly_volume}</p>
 )}
 </div>
 )}
 {(content.progression || editMode) && (
 <div>
 <Label className="text-xs text-muted-foreground"> طريقة التقدم</Label>
 {editMode ? (
 <Input
 value={content.progression || ""}
 onChange={(e) => updateField("progression", e.target.value)}
 placeholder="مثلاً: زوّد الوزن 2.5 كجم أسبوعياً"
 className="mt-1 h-8 text-sm"
 />
 ) : (
 <p className="mt-1 text-sm">{content.progression}</p>
 )}
 </div>
 )}
 </div>
 )}

 {/* Workout days */}
 {isWorkout && content && "days" in content && content.days?.map((d, dayIdx: number) => (
 <div key={dayIdx} className={cn("rounded-xl border", d.isRest ? "border-muted/40 bg-muted/10" : "border-border")}>
 <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 gap-2">
 {editMode && !d.isRest ? (
 <>
 <Input
 value={d.day || ""}
 onChange={(e) => {
 if (!content || !("days" in content)) return;
 const newContent: WorkoutPlanContent = { ...content };
 newContent.days[dayIdx] = { ...newContent.days[dayIdx], day: e.target.value };
 setContent(newContent);
 }}
 className="h-8 font-semibold"
 />
 <Input
 value={d.focus || ""}
 onChange={(e) => {
 if (!content || !("days" in content)) return;
 const newContent: WorkoutPlanContent = { ...content };
 newContent.days[dayIdx] = { ...newContent.days[dayIdx], focus: e.target.value };
 setContent(newContent);
 }}
 className="h-8 w-32 text-center text-xs"
 placeholder="العضلة"
 />
 </>
 ) : (
 <>
 <span className="font-semibold">{d.day}</span>
 {d.isRest ? (
 <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground"> راحة</Badge>
 ) : (
 d.focus && <Badge variant="secondary">{d.focus}</Badge>
 )}
 </>
 )}
 {/* Phase 79: per-day AI regeneration — same tool the admin console has */}
 {!editMode && !d.isRest && (
 <button
 onClick={() => regenerateSingleDay(dayIdx)}
 disabled={regeneratingElKey !== null}
 title="إعادة توليد اليوم كامل بنفس التركيز العضلي"
 className="flex shrink-0 items-center gap-1 rounded-full border border-primary/30 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
 >
 {regeneratingElKey === `day:${dayIdx}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
 <span className="hidden sm:inline">إعادة توليد اليوم</span>
 </button>
 )}
 </div>
 {d.isRest ? (
 <div className="p-6 text-center text-sm text-muted-foreground">
 يوم راحة — استشفِ وارتاح. اشرب ماء كافي ونم 7-9 ساعات.
 </div>
 ) : (
 <>
 {/* NOTIF→PLAN 2026-10-24 (item 6): the table scrolls inside its own
     card on phones — never outside the modal. */}
 <div className="overflow-x-auto">
 <table className="w-full min-w-[480px] text-sm">
 <thead>
 <tr className="text-start">
 <th className="p-2 text-start font-medium text-muted-foreground">التمرين</th>
 <th className="p-2 text-start font-medium text-muted-foreground">مجموعات</th>
 <th className="p-2 text-start font-medium text-muted-foreground">تكرارات</th>
 <th className="p-2 text-start font-medium text-muted-foreground">راحة</th>
 {!editMode && <th className="p-2 w-8"></th>}
 {editMode && <th className="p-2 w-8"></th>}
 </tr>
 </thead>
 <tbody>
 {d.exercises?.map((ex, exIdx: number) => {
 // Find exercise in library for images
 const exLib = EXERCISES.find((e) => e.slug === ex.exerciseSlug || e.nameEn === ex.name || e.nameEn?.toLowerCase() === ex.name?.toLowerCase());
 const exImages = exLib ? getExerciseImages(exLib.imageKey) : [];
 return (
 <tr key={exIdx} className="border-t border-border/60">
 <td className="p-2">
 {/* Two images ABOVE the text — like exercise library */}
 {!editMode && exImages.length > 0 && (
 <div className="mb-2 grid grid-cols-2 gap-2">
 {exImages.slice(0, 2).map((url, imgIdx: number) => (
 <div key={imgIdx} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
 <ImageWithFallback
 src={url}
 alt={`${ex.name} ${imgIdx + 1}`}
 fill
 className="object-contain"
 fallbackSrc={getFallbackSVG(exLib?.category || "default")}
 />
 </div>
 ))}
 </div>
 )}
 <div>
 <EditCell value={ex.name} onChange={(v) => updateExercise(dayIdx, exIdx, "name", v)} className="font-medium" />
 {editMode ? (
 <>
 <Input
 value={ex.notes || ""}
 onChange={(e) => updateExercise(dayIdx, exIdx, "notes", e.target.value)}
 placeholder="ملاحظات..."
 className="mt-1 h-7 text-xs"
 />
 <Input
 value={ex.image || ""}
 onChange={(e) => updateExercise(dayIdx, exIdx, "image", e.target.value)}
 placeholder="رابط صورة (اختياري — هتتولّد تلقائياً من اسم التمرين)"
 className="mt-1 h-7 text-xs font-mono"
 dir="ltr"
 />
 </>
 ) : (
 ex.notes && <p className="text-xs text-muted-foreground">{ex.notes}</p>
 )}
 </div>
 </td>
 <td className="p-2"><EditCell value={ex.sets} onChange={(v) => updateExercise(dayIdx, exIdx, "sets", v)} type="number" /></td>
 <td className="p-2"><EditCell value={ex.reps} onChange={(v) => updateExercise(dayIdx, exIdx, "reps", v)} /></td>
 <td className="p-2"><EditCell value={ex.rest} onChange={(v) => updateExercise(dayIdx, exIdx, "rest", v)} /></td>
 {editMode && (
 <td className="p-2">
 <div className="flex items-center gap-1.5">
 {/* T-4PILLAR-COMPLETE: AI exercise swap (injury-safe, library-filtered) */}
 <button
 onClick={() => swapExerciseAI(dayIdx, exIdx, d.focus)}
 disabled={regeneratingExKey !== null}
 title="استبدال بديل آمن بالذكاء الاصطناعي"
 className="text-primary hover:text-primary/80 disabled:opacity-50"
 >
 {regeneratingExKey === `${dayIdx}-${exIdx}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
 </button>
 <button onClick={() => removeExercise(dayIdx, exIdx)} className="text-destructive hover:text-destructive/80">
 <Trash2 className="h-3.5 w-3.5" />
 </button>
 </div>
 </td>
 )}
 {!editMode && (
 <td className="p-2">
 {/* Phase 79: AI exercise swap now visible in VIEW mode too — same
 feature the admin console shows without entering edit mode */}
 <button
 onClick={() => swapExerciseAI(dayIdx, exIdx, d.focus)}
 disabled={regeneratingExKey !== null}
 title="استبدال بديل آمن بالذكاء الاصطناعي"
 className="text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
 >
 {regeneratingExKey === `${dayIdx}-${exIdx}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
 </button>
 </td>
 )}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 {editMode && (
 <button onClick={() => addExercise(dayIdx)} className="m-2 flex items-center gap-1 text-xs text-primary hover:underline">
 <Plus className="h-3 w-3" /> إضافة تمرين
 </button>
 )}
 </>
 )}
 </div>
 ))}

 {/* Notes field */}
 <div>
 <Label className="text-xs text-muted-foreground">ملاحظات عامة</Label>
 {editMode ? (
 <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 min-h-[40px] text-sm" />
 ) : (
 notes && notes !== "Generated by AI" && <p className="mt-1 text-sm text-muted-foreground">{notes}</p>
 )}
 </div>
 </div>
 ) : (
 <div className="py-8 text-center text-sm text-muted-foreground">
 لا يوجد محتوى لهذه الخطة
 </div>
 )}
 </Modal>
 );
}

/** A food-library row as returned by /api/food-search — the fields the
 *  editor's combobox consumes (local rows also carry their default
 *  serving since PLAN-EDIT-2026-10-24). */
type FoodSearchRow = {
 name: string;
 source: "local" | "openfoodfacts";
 per100g: { calories: number; protein: number; carbs: number; fat: number };
 defaultGrams?: number;
 servingAr?: string;
 servingEn?: string;
};

/**
 * PLAN-EDIT-2026-10-24 (owner order — «اضافة صنف مفترض ان يظهر اختيارات
 * من مكتبة الأطعمة عند كتابة اسم الصنف»): the food-name cell in edit
 * mode is a COMBOBOX. Typing debounces to /api/food-search and shows the
 * library's rows in a PORTAL dropdown (Radix Popover — it survives the
 * meal table's overflow-x-auto wrapper and the modal's own scroll region
 * on any phone width, where a plain absolute dropdown would be clipped).
 * Picking a row binds its per-100g nutrition to the item, prefills the
 * default serving grams, and recomputes every plan total; later gram
 * edits recalc from the SAME row the coach chose (session binding).
 * Blur without a pick keeps the typed text as a free-form custom item
 * (macros untouched — no more silent first-match guessing).
 */
function FoodPickerCell({
 value,
 lang,
 isAr,
 mealIdx,
 itemIdx,
 onPick,
 onRename,
}: {
 value: string;
 lang: "ar" | "en";
 isAr: boolean;
 mealIdx: number;
 itemIdx: number;
 onPick: (mealIdx: number, itemIdx: number, row: FoodSearchRow) => void;
 onRename: (mealIdx: number, itemIdx: number, value: string) => void;
}) {
 const [query, setQuery] = useState(value);
 const [results, setResults] = useState<FoodSearchRow[]>([]);
 const [loading, setLoading] = useState(false);
 const [open, setOpen] = useState(false);
 const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 // Measured live (2026-10-24 smoke): without this guard every cell's
 // MOUNT fetch (its initial food name) auto-opened a dropdown the coach
 // never asked for. The dropdown opens ONLY for a query the coach
 // actually typed.
 const userTypedRef = useRef(false);

 // Sync the local input when the item's food changes from the outside
 // (a library pick or an AI swap replaced it). Typing never propagates
 // upward, so an in-progress query is never clobbered.
 useEffect(() => {
 setQuery(value);
 }, [value]);

 useEffect(() => {
 if (debounceRef.current) clearTimeout(debounceRef.current);
 const trimmed = query.trim();
 if (!trimmed) {
 setResults([]);
 setOpen(false);
 setLoading(false);
 return;
 }
 setLoading(true);
 // B-03 ownership law (W1-4c, the meal-planner's proven pattern): every
 // query owns its OWN AbortController — a superseded slow query can
 // never land its older results over the newer ones.
 const controller = new AbortController();
 const { signal } = controller;
 debounceRef.current = setTimeout(async () => {
 try {
 const res = await fetch(`/api/food-search?q=${encodeURIComponent(trimmed)}&lang=${lang}`, { signal });
 if (res.ok) {
 const data = await res.json();
 if (signal.aborted) return; // late-body belt
 const rows: FoodSearchRow[] = (data.results ?? []).slice(0, 8);
 setResults(rows);
 if (userTypedRef.current) setOpen(rows.length > 0);
 }
 } catch {
 // silent — includes the AbortError of a superseded query.
 } finally {
 if (!signal.aborted) setLoading(false);
 }
 }, 300);
 return () => {
 if (debounceRef.current) clearTimeout(debounceRef.current);
 controller.abort();
 };
 }, [query, lang]);

 return (
 <Popover open={open} onOpenChange={setOpen}>
 <PopoverAnchor asChild>
 <div className="relative flex w-full items-center">
 <Search className="pointer-events-none absolute start-2 h-3.5 w-3.5 text-muted-foreground" />
 <Input
 value={query}
 onChange={(e) => {
 userTypedRef.current = true;
 setQuery(e.target.value);
 }}
 onFocus={() => {
 if (results.length > 0 && userTypedRef.current) setOpen(true);
 }}
 // Free-text commit when the coach leaves the field without picking:
 // the typed name stays on the item; macros are NOT guessed.
 onBlur={() => onRename(mealIdx, itemIdx, query.trim())}
 placeholder={isAr ? "اكتب اسم الصنف…" : "Food name…"}
 className="h-8 ps-8 text-sm font-medium"
 dir="auto"
 />
 {loading && <Loader2 className="absolute end-2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
 </div>
 </PopoverAnchor>
 <PopoverContent
 // Focus must STAY in the input (this is a combobox, not a menu) —
 // Radix's default auto-focus would break typing.
 onOpenAutoFocus={(e) => e.preventDefault()}
 align="start"
 sideOffset={4}
 collisionPadding={8}
 className="max-h-72 w-64 overflow-y-auto p-1"
 >
 {results.map((r, i) => (
 <button
 key={`${r.name}-${i}`}
 type="button"
 // Classic combobox guard: keep focus in the input while choosing —
 // the click then lands onPick WITHOUT a preceding blur-rename race.
 onMouseDown={(e) => e.preventDefault()}
 onClick={() => {
 onPick(mealIdx, itemIdx, r);
 setOpen(false);
 }}
 className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-accent"
 >
 <span className="w-full truncate text-sm font-medium" dir="auto">{r.name}</span>
 <span className="text-[11px] text-muted-foreground">
 {r.source === "local" ? (isAr ? "المكتبة" : "Library") : isAr ? "منتج" : "Product"}
 {" · "}
 {r.per100g.calories} {isAr ? "سعرة/١٠٠جم" : "kcal/100g"}
 {` · P${r.per100g.protein} C${r.per100g.carbs} F${r.per100g.fat}`}
 </span>
 </button>
 ))}
 </PopoverContent>
 </Popover>
 );
}

/**
 * Coach AI Plan Generator — wraps the two generate buttons with an
 * expandable "advanced options" panel where the coach can optionally
 * specify target calories, macros, preferred foods, and free-text notes.
 *
 * All fields are optional. If left blank, the AI calculates everything
 * automatically from the client's questionnaire data.
 */
function CoachAIPlanGenerator({
 generating,
 onGenerate,
 t,
 quota,
 lang,
 qDietText,
}: {
 generating: string | null;
 onGenerate: (planType: "workout" | "nutrition", overrides?: PlanOverrides) => Promise<void>;
 t: (key: string) => string;
 quota: { unlimited: boolean; clientBalance?: { tier: string; pool?: { used: number; limit: number; remaining?: number; unlimited: boolean }; nutrition: { used: number; limit: number; unlimited: boolean; weeklyUsed?: number; weeklyLimit?: number }; workout: { used: number; limit: number; unlimited: boolean; weeklyUsed?: number; weeklyLimit?: number } } } | null;
 lang: "ar" | "en";
 /** NOTIF→PLAN 2026-10-24: the client's questionnaire diet answer — the
  * "auto" diet chip classifies THIS text live so the coach sees what a
  * no-pick generation would resolve to. */
 qDietText: string;
}) {
 const isAr = lang === "ar";
 // Phase 183 (2026-09-13 «البوول الموحد"): generation is blocked by
 // the CLIENT's ONE unified plan pool — nutrition + workout COMBINED
 // (success-only ledger the member's EVO chat + planner pages also
 // spend from). Fallback to the deprecated per-kind mirrors for one
 // release of older API caches.
 const atCap = (k: "nutrition" | "workout") => {
 void k; // the pool is kind-agnostic
 if (quota?.unlimited) return false;
 const pool = quota?.clientBalance?.pool;
 if (pool) {
 if (pool.unlimited) return false;
 return pool.used >= pool.limit;
 }
 const cb = quota?.clientBalance?.[k];
 if (!cb || cb.unlimited) return false;
 return cb.used >= cb.limit;
 };
 const usageLine = (k: "nutrition" | "workout") => {
 if (!quota || quota.unlimited) return null;
 const pool = quota.clientBalance?.pool;
 if (pool) {
 if (pool.unlimited) return null;
 return (
 <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">
 <span>
 {isAr
 ? `رصيد خطط العميل الموحد (توليدك + ايفو، تغذية وتمارين): ${pool.used}/${pool.limit} شهرياً`
 : `Client's unified plan balance (yours + EVO, nutrition + workout): ${pool.used}/${pool.limit} monthly`}
 </span>
 </div>
 );
 }
 const cb = quota.clientBalance?.[k];
 if (!cb || cb.unlimited) return null;
 const kindAr = k === "nutrition" ? "تغذية" : "تمارين";
 const kindEn = k === "nutrition" ? "nutrition" : "workout";
 return (
 <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">
 <span>
 {isAr
 ? `رصيد ${kindAr} العميل (توليدك + ايفو): ${cb.used}/${cb.limit} شهرياً`
 : `Client's ${kindEn} balance (your + EVO generations): ${cb.used}/${cb.limit} monthly`}
 </span>
 </div>
 );
 };
 const [showAdvanced, setShowAdvanced] = useState(false);
 const [targetCalories, setTargetCalories] = useState("");
 const [proteinG, setProteinG] = useState("");
 const [carbsG, setCarbsG] = useState("");
 const [fatG, setFatG] = useState("");
 const [foods, setFoods] = useState("");
 const [mealsCount, setMealsCount] = useState("");
 const [notes, setNotes] = useState("");
 // NOTIF→PLAN 2026-10-24 (owner order item 4): an explicit diet-type
 // selection BEFORE plan creation. Default "auto" = classify the client's
 // questionnaire diet answer (shown beside the selector); a concrete pick
 // OVERRIDES the questionnaire, rides the sanitized job payload, drives
 // the diet-aware macro policy, and is echoed in the plan's
 // data_analysis.diet_type + overview.
 const [dietType, setDietType] = useState<"auto" | DietType>("auto");

 const buildOverrides = (): PlanOverrides | undefined => {
 const ov: PlanOverrides = {};
 if (targetCalories.trim()) ov.targetCalories = parseInt(targetCalories);
 if (proteinG.trim() || carbsG.trim() || fatG.trim()) {
 ov.macros = {
 protein_g: parseInt(proteinG) || 0,
 carbs_g: parseInt(carbsG) || 0,
 fat_g: parseInt(fatG) || 0,
 };
 }
 if (foods.trim()) {
 ov.foods = foods.split(/[,،\n]/).map((s) => s.trim()).filter(Boolean);
 }
 if (mealsCount.trim()) ov.mealsCount = parseInt(mealsCount);
 if (notes.trim()) ov.notes = notes;
 if (dietType !== "auto") ov.dietType = dietType;
 return Object.keys(ov).length > 0 ? ov : undefined;
 };

 const handleGenerate = (planType: "workout" | "nutrition") => {
 onGenerate(planType, buildOverrides());
 };

 return (
 <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-secondary/40 to-card p-6 shadow-card">
 <div className="flex items-start gap-4">
 <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
 <Sparkles className="h-6 w-6" />
 </div>
 <div className="flex-1">
 <h2 className="flex items-center gap-2 text-lg font-bold">
 {t("coach.aiPlans")}
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">{t("coach.aiHint")}</p>

 {/* NOTIF→PLAN 2026-10-24 (owner order item 4): diet-type selection —
     VISIBLE BEFORE the generate buttons (not buried in advanced
     options). "تلقائي" resolves from the client's questionnaire diet
     answer (shown live); a concrete pick overrides it end-to-end. */}
 <div className="mt-4">
 <div className="mb-1.5 flex flex-wrap items-center gap-2">
 <Label className="text-xs font-semibold text-foreground">
 {isAr ? "نوع النظام الغذائي" : "Diet type"}
 </Label>
 <span className="text-[11px] text-muted-foreground">
 {dietType === "auto"
 ? isAr
 ? `(تلقائي — من الاستبيان: ${classifyDietText(qDietText) === "balanced" && !qDietText.trim() ? "غير محدد" : DIET_TYPE_LABELS_AR[classifyDietText(qDietText)]})`
 : `(auto — from questionnaire: ${qDietText.trim() ? classifyDietText(qDietText) : "unspecified"})`
 : isAr
 ? `الاختيار: ${DIET_TYPE_LABELS_AR[dietType]}`
 : `Selected: ${dietType}`}
 </span>
 </div>
 <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={isAr ? "نوع النظام الغذائي" : "Diet type"}>
 {(["auto", ...DIET_TYPES] as const).map((d) => {
 const active = dietType === d;
 const label = d === "auto" ? (isAr ? "تلقائي" : "Auto") : DIET_TYPE_LABELS_AR[d];
 return (
 <button
 key={d}
 type="button"
 role="radio"
 aria-checked={active}
 onClick={() => setDietType(d)}
 className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
 active
 ? "border-primary bg-primary text-primary-foreground shadow-sm"
 : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
 }`}
 >
 {label}
 </button>
 );
 })}
 </div>
 <p className="mt-1.5 text-[11px] text-muted-foreground">
 {isAr
 ? "نوع الدايت بيحدد توزيع الماكروز (الكيتو = كارب منخفض جدًا) وبيتوجه لاختيار الأصناف. اختيارك بيتحفظ وبيمرر لعملية التوليد فعليًا."
 : "The diet type drives the macro split (keto = very low carb) and food selection. Your pick is saved and passed into the generation job."}
 </p>
 </div>

 <div className="mt-5 grid gap-3 sm:grid-cols-2">
 <button
 onClick={() => handleGenerate("nutrition")}
 disabled={generating !== null || atCap("nutrition")}
 className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4 text-start transition-all hover:border-primary/40 hover:shadow-glow disabled:opacity-50"
 >
 <div className="flex items-center gap-3">
 <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
 {generating === "nutrition" ? (
 <Loader2 className="h-5 w-5 animate-spin" />
 ) : (
 <Salad className="h-5 w-5" />
 )}
 </span>
 <div>
 <div className="font-semibold">{t("coach.genNutrition")}</div>
 {usageLine("nutrition") ?? (
 <div className="text-xs text-muted-foreground">{t("coach.aiHint")}</div>
 )}
 </div>
 </div>
 <Wand2 className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
 </button>

 <button
 onClick={() => handleGenerate("workout")}
 disabled={generating !== null || atCap("workout")}
 className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4 text-start transition-all hover:border-primary/40 hover:shadow-glow disabled:opacity-50"
 >
 <div className="flex items-center gap-3">
 <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
 {generating === "workout" ? (
 <Loader2 className="h-5 w-5 animate-spin" />
 ) : (
 <Dumbbell className="h-5 w-5" />
 )}
 </span>
 <div>
 <div className="font-semibold">{t("coach.genWorkout")}</div>
 {usageLine("workout") ?? (
 <div className="text-xs text-muted-foreground">{t("coach.aiHint")}</div>
 )}
 </div>
 </div>
 <Wand2 className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
 </button>
 </div>

 {/* 0034 — cap hint: generation is limited per client, everything
 else (editing, manual upload) stays unlimited by owner decree. */}
 {(atCap("nutrition") || atCap("workout")) && (
 <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-600">
 {isAr
 ? "وصلت حدود التوليد بالذكاء الاصطناعي عند العميل ده — التوليد منك أو من ايفو بيخصم من نفس رصيده الشهري. التعديل على الخطط والرفع اليدوي متاح بدون حدود."
 : "AI generation caps reached for this client — your generations and the member's EVO ones draw from the same monthly balance. Editing plans and manual uploads stay unlimited."}
 </p>
 )}

 {/* Advanced options toggle */}
 <button
 onClick={() => setShowAdvanced((s) => !s)}
 className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
 >
 <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
 {showAdvanced ? "إخفاء الخيارات المتقدمة" : "خيارات متقدمة (اختياري) — حدد السعرات والماكروز والأطعمة"}
 </button>

 {showAdvanced && (
 <div className="mt-3 space-y-3 rounded-xl border border-border bg-background p-4">
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 <div>
 <Label className="text-xs text-muted-foreground">السعرات المستهدفة (يومياً)</Label>
 <Input
 type="number"
 value={targetCalories}
 onChange={(e) => setTargetCalories(e.target.value)}
 placeholder="مثلاً: 1800"
 className="mt-1 h-8 text-sm"
 />
 </div>
 <div>
 <Label className="text-xs text-muted-foreground">البروتين (جم)</Label>
 <Input
 type="number"
 value={proteinG}
 onChange={(e) => setProteinG(e.target.value)}
 placeholder="مثلاً: 150"
 className="mt-1 h-8 text-sm"
 />
 </div>
 <div>
 <Label className="text-xs text-muted-foreground">الكارب (جم)</Label>
 <Input
 type="number"
 value={carbsG}
 onChange={(e) => setCarbsG(e.target.value)}
 placeholder="مثلاً: 200"
 className="mt-1 h-8 text-sm"
 />
 </div>
 <div>
 <Label className="text-xs text-muted-foreground">الدهون (جم)</Label>
 <Input
 type="number"
 value={fatG}
 onChange={(e) => setFatG(e.target.value)}
 placeholder="مثلاً: 60"
 className="mt-1 h-8 text-sm"
 />
 </div>
 </div>
 <div className="grid gap-3 sm:grid-cols-2">
 <div>
 <Label className="text-xs text-muted-foreground">عدد الوجبات (للتغذية) / أيام التدريب (للتمارين)</Label>
 <Input
 type="number"
 value={mealsCount}
 onChange={(e) => setMealsCount(e.target.value)}
 placeholder="مثلاً: 4"
 className="mt-1 h-8 text-sm"
 />
 </div>
 <div>
 <Label className="text-xs text-muted-foreground">أطعمة مطلوب تضمينها (افصل بفاصلة)</Label>
 <Input
 value={foods}
 onChange={(e) => setFoods(e.target.value)}
 placeholder="مثلاً: دجاج، أرز، تونة"
 className="mt-1 h-8 text-sm"
 />
 </div>
 </div>
 <div>
 <Label className="text-xs text-muted-foreground">ملاحظات إضافية للـ AI</Label>
 <Textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 placeholder="مثلاً: العميل عنده أنيميا — ركّز على مصادر الحديد. أو: تجنب منتجات الألبان."
 className="mt-1 min-h-[60px] text-sm"
 />
 </div>
 <p className="text-[11px] text-muted-foreground">
 كل الحقول اختيارية — لو فضيتها، الـ AI بيحسب كل حاجة تلقائياً من بيانات العميل.
 </p>
 </div>
 )}

 {generating && (
 <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-2 text-sm text-primary">
 <Loader2 className="h-4 w-4 animate-spin" />
 {t("coach.generating")}
 </div>
 )}
 </div>
 </div>
 </Card>
 );
}
