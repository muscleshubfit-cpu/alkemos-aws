"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Salad, Dumbbell, FileText, Download, Printer, RefreshCw, Loader2, Info, Sparkles, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useNav } from "@/hooks/use-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listPlans, getPlanFileUrl, getSwapUsage } from "@/lib/data";
import type { PlanContent } from "@/lib/data/plans";
import type { NutritionPlanContent, WorkoutPlanContent } from "@/lib/plan-generator";
import type { AiJobRow } from "@/lib/ai-jobs";
import type { Plan, Json } from "@/lib/supabase/types";
import { displayCalories } from "@/lib/nutrition-totals";
// PLAN-REGEN-CONSTRAINTS 2026-10-24: the member swap carries the OWNING
// plan's committed diet (resolved from the plan content itself — the echo
// label written at generation) plus the member's own questionnaire answers
// (allergies/disliked/diet) so the replacement respects the same
// constraints the coach-side swaps respect.
import { resolvePlanDietType } from "@/lib/diet-types";
import { getQuestionnaire } from "@/lib/data";
import { enqueueAiJobClient, getAiJob } from "@/lib/ai-jobs-client";
// AI-QUOTAS 2026-11-14: the member self-service generation rides the SAME
// survivable pending-job registry the coach plan flow uses (survives
// reloads — the GHA runner finishes the job even with a dead tab).
import { addPendingPlanJob, readPendingPlanJobs, removePendingPlanJob } from "@/lib/plan-jobs";
import { applyMemberSwapToContent } from "@/lib/member-swap-apply";
import { resolveExerciseImage, getExerciseImage, getExerciseImages, getFallbackSVG } from "@/lib/exercise-images";
import { useExerciseLookup } from "@/lib/exercise-lookup";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";

// M53 fix: escape HTML to prevent XSS in print window
function escapeHtml(str: string | undefined | null): string {
 if (!str) return "";
 return String(str)
 .replace(/&/g, "&amp;")
 .replace(/</g, "&lt;")
 .replace(/>/g, "&gt;")
 .replace(/"/g, "&quot;")
 .replace(/'/g, "&#039;");
}

/* ── OWNER DIRECTIVE 2026-08-27: swaps execute on GitHub Actions ─────────
 * A click enqueues an ai_jobs row and returns instantly; a resilient
 * watcher (surviving page reloads via localStorage) applies the result
 * to local plan state as soon as the worker finishes.
 * PHASE 99: the click is now OPTIMISTIC — the quota counter decrements
 * instantly and a persistent badge marks the queued item until the
 * watcher applies the replacement (server truth reconciles after).
 * ───────────────────────────────────────────────────────────────────── */
type PendingSwap = {
 id: string;
 planId: string;
 kind: "meal" | "exercise";
 i1: number; // meal index | day index
 i2?: number; // exercise index
 createdAt: number;
};
const AI_PENDING_KEY = "mhe:pending-swaps";
const AI_SWAP_TTL_MS = 24 * 60 * 60_000;

function readPendingSwaps(): PendingSwap[] {
 try {
 const raw = localStorage.getItem(AI_PENDING_KEY);
 const list = raw ? (JSON.parse(raw) as PendingSwap[]) : [];
 // TTL + FIX 2026-10-27: entries WITHOUT a usable id are unwatchable
 // garbage from the pre-fix jobId bug (enqueue returned undefined →
 // JSON.stringify dropped the field). They can never be polled or
 // removed by removePendingSwap(id) — pruning them self-heals the
 // permanent «جارٍ التبديل» badge for members carrying legacy rows.
 return Array.isArray(list)
 ? list.filter(
 (e) =>
 typeof e?.id === "string" &&
 e.id.length > 0 &&
 Date.now() - e.createdAt < AI_SWAP_TTL_MS,
 )
 : [];
 } catch {
 return [];
 }
}

function writePendingSwaps(list: PendingSwap[]): void {
 try {
 localStorage.setItem(AI_PENDING_KEY, JSON.stringify(list.slice(-40)));
 } catch {
 /* storage full/blocked — watching still works in-session */
 }
}

/** Narrow plan.content (Json) into the parsed generator shape. */
function asPlanContent(v: Json | null | undefined): PlanContent | null {
 if (!v || typeof v !== "object" || Array.isArray(v)) return null;
 return v as PlanContent;
}

/** Swap-quota readout shape returned by data/plans.getSwapUsage.
 * AI-QUOTAS completion order 2026-11-14 (§1/§2): ONE unified monthly
 * swap quota — meal + exercise combined (the per-type split is retired) —
 * carrying a subscriptionRequired flag (free members see the subscribe
 * CTA instead of a broken 0/0 widget) and the exhaustion renewal links
 * (§3) that ride the existing /checkout payment path. */
type SwapUsage = Awaited<ReturnType<typeof getSwapUsage>>;

/** Unified generation quota readout — the SAME /api/ai/quota verdict the
 * enforcement reads (meter == enforcement law; one fetch serves both the
 * plan quota and the swap quotas in refreshUsage). Carries the §3
 * exhaustion links (renewal = current plan, upgrade = next tier up). */
type PlanQuota = {
 used: number;
 limit: number;
 remaining: number;
 unlimited: boolean;
 subscriptionRequired: boolean;
 renewsAt: string | null;
 renewalUrl: string | null;
 upgradeUrl: string | null;
};

export function PlansView() {
 const { t, lang } = useI18n();
 const isAr = lang === "ar";
 const { profile } = useAuth();
 // BUNDLE LAW (2026-09-05): the 1.6MB exercises array was imported at
 // module scope — now lazy-loaded mini records (session-cached).
 const EXERCISES = useExerciseLookup();
 const [plans, setPlans] = useState<Plan[]>([]);
 const [loading, setLoading] = useState(true);
 const [active, setActive] = useState<Plan | null>(null);
 const [swapLoading, setSwapLoading] = useState<string | null>(null);
 // AI-QUOTAS completion order: ONE unified swap quota (meal + exercise).
 const [swapUsage, setSwapUsage] = useState<SwapUsage>({
 used: 0, limit: 0, remaining: 0, unlimited: false, subscriptionRequired: true,
 renewsAt: null, renewalUrl: null, upgradeUrl: null,
 });
 // AI-QUOTAS 2026-11-14: the unified monthly generation quota + the
 // subscription-cycle renewal date (one /api/ai/quota fetch feeds the
 // plan quota AND the swap quotas — the same verdicts enforcement reads).
 const [planQuota, setPlanQuota] = useState<PlanQuota>({
 used: 0, limit: 0, remaining: 0, unlimited: false, subscriptionRequired: true, renewsAt: null,
 renewalUrl: null, upgradeUrl: null,
 });
 const [generating, setGenerating] = useState<"nutrition" | "workout" | null>(null);
 const [pendingPlans, setPendingPlans] = useState<ReturnType<typeof readPendingPlanJobs>>([]);
 const activePlanWatchers = useRef<Set<string>>(new Set());
 // PHASE 99 — pending-swaps snapshot (mirror of the localStorage queue)
 // powering the persistent «جارٍ التبديل» badge + double-submit guard.
 const [pendingSwaps, setPendingSwaps] = useState<PendingSwap[]>([]);
 const activeWatchers = useRef<Set<string>>(new Set());
 // PHASE 69 — latest plans snapshot so the swap persists the EXACT mutated
 // content via /api/plans/member-edit (plans RLS is coach-write-only for
 // browser updates — the member persist runs server-side).
 const plansRef = useRef<Array<{ id: string; content: unknown }>>([]);
 useEffect(() => {
 // ESLint (react-compiler): refs must not be written during render —
 // sync after commit instead. Events always run after the effect flush,
 // so applySwapToPlans still reads the latest snapshot.
 plansRef.current = plans;
 }, [plans]);
 const persistSwap = useCallback(async (planId: string, content: unknown) => {
 if (!planId || !content) return;
 try {
 const res = await fetch("/api/plans/member-edit", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ mode: "swap", planId, content }),
 });
 if (!res.ok) throw new Error(`HTTP ${res.status}`);
 } catch (e) {
 console.error("[PlansView] swap persist failed (state kept):", e);
 toast.error(isAr ? "الاستبدال ظاهر حاليًا لكن تعذّر حفظه — ستحتاج إلى إعادته إذا حدّثت الصفحة." : "The swap is visible now but saving it failed — you'll need to redo it if you refresh the page.");
 }
 }, []);

 const refreshUsage = useCallback(async () => {
 if (!profile) return;
 try {
 // ONE meter fetch — the same /api/ai/quota verdicts enforcement reads
 // (the swap helper maps .swaps from the same response).
 const [u, quotaMeter] = await Promise.all([
 getSwapUsage(profile.id),
 fetch("/api/ai/quota", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
 ]);
 setSwapUsage(u);
 if (quotaMeter?.plans) {
 setPlanQuota({
 used: Number(quotaMeter.plans.used ?? 0),
 limit: quotaMeter.plans.unlimited || quotaMeter.plans.limit === null ? Number.POSITIVE_INFINITY : Number(quotaMeter.plans.limit ?? 0),
 remaining: quotaMeter.plans.unlimited || quotaMeter.plans.limit === null ? Number.POSITIVE_INFINITY : Number(quotaMeter.plans.remaining ?? 0),
 unlimited: Boolean(quotaMeter.plans.unlimited),
 subscriptionRequired: Boolean(quotaMeter.plans.subscriptionRequired),
 renewsAt: typeof quotaMeter.plans.renewsAt === "string" ? quotaMeter.plans.renewsAt : null,
 // §3 exhaustion links — the server owns the URLs (never invented here).
 renewalUrl: typeof quotaMeter.plans.renewalUrl === "string" ? quotaMeter.plans.renewalUrl : null,
 upgradeUrl: typeof quotaMeter.plans.upgradeUrl === "string" ? quotaMeter.plans.upgradeUrl : null,
 });
 }
 } catch {
 /* keep last known usage */
 }
 }, [profile]);

 // PHASE 99 — OPTIMISTIC QUOTA: decrement the visible counter the instant
 // the user clicks. refreshUsage() reconciles with server truth right
 // after enqueue (and doubles as the rollback on failure). The server
 // remains the enforcement authority — this is display-only.
 // AI-QUOTAS completion order: ONE unified quota — a meal or an exercise
 // swap both decrement the SAME counter (§2).
 const applyOptimisticUsage = useCallback((_kind: "meal" | "exercise") => {
 setSwapUsage((prev) => {
 if (prev.unlimited) return prev;
 return { ...prev, used: prev.used + 1, remaining: Math.max(0, prev.remaining - 1) };
 });
 }, []);

 /** PHASE 99 — pending predicate for the modal's persistent badge and
 * double-submit guard (driven by the localStorage mirror). */
 const isSwapPending = useCallback(
 (kind: "meal" | "exercise", planId: string, i1: number, i2?: number) =>
 pendingSwaps.some(
 (e) => e.planId === planId && e.kind === kind && e.i1 === i1 && (i2 === undefined ? e.i2 === undefined : e.i2 === i2),
 ),
 [pendingSwaps],
 );

 const removePendingSwap = useCallback((id: string) => {
 writePendingSwaps(readPendingSwaps().filter((e) => e.id !== id));
 // PHASE 99 — keep badge state in sync (the «جارٍ التبديل» chip
 // disappears the moment the watcher applies/removes the entry).
 setPendingSwaps(readPendingSwaps());
 }, []);

 /** Applies a finished job's replacement to local plan state AND persists
 * it (PHASE 69 — previously local-only: a reload reverted the swap).
 * AI-PLAN-QUALITY 2026-10-24: the replacement is VALIDATED first (shape
 * + coerced numbers) and MEAL swaps recompute the whole plan's totals —
 * the old code spliced the raw payload unvalidated and left the calorie
 * card showing the previous meal's numbers, or corrupted the row when
 * the payload was shapeless. An invalid result is NEVER applied nor
 * persisted — the member sees exactly why instead of a broken plan. */
 const applySwapToPlans = useCallback(
 (entry: PendingSwap, replacement: unknown) => {
 // Compute the new content ONCE from the latest snapshot (plansRef is
 // render-synced) so the persisted payload always matches the UI.
 const target = plansRef.current.find((p) => p.id === entry.planId);
 if (!target) return;
 const applied = applyMemberSwapToContent(
 (target.content ?? null) as unknown,
 entry.kind,
 entry.i1,
 entry.i2,
 replacement,
 );
 if (!applied.ok) {
 console.warn("[PlansView] swap result rejected by the apply gate:", applied.error);
 toast.error(applied.error);
 return;
 }
 const newContent = applied.content as Json;
 setPlans((prev) => prev.map((p) => (p.id === entry.planId ? { ...p, content: newContent } : p)));
 setActive((prevActive) =>
 prevActive && prevActive.id === entry.planId
 ? { ...prevActive, content: newContent }
 : prevActive,
 );
 void persistSwap(entry.planId, newContent);
 },
 [persistSwap],
 );

 /** Polls one job every 20s up to ~26 min, then applies/cleans. */
 const watchSwapJob = useCallback(
 async (entry: PendingSwap) => {
 if (activeWatchers.current.has(entry.id)) return;
 activeWatchers.current.add(entry.id);
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
 applySwapToPlans(entry, job.result?.replacement);
 removePendingSwap(entry.id);
 await refreshUsage();
 toast.success(isAr ? "تم استبدال العنصر من الذكاء الاصطناعي ✅" : "Item swapped by the AI ✅");
 return;
 }
 if (job?.status === "failed") {
 removePendingSwap(entry.id);
 // REGEN-RELIABILITY FIX 2026-10-24 (owner order item 2 — «عدم استهلاك
 // الحصة عند الفشل»): the server records the unified monthly swap
 // unit ONLY on
 // success (recordSwapOnSuccess in the runner) — the optimistic
 // decrement from the click must roll back to server truth HERE too,
 // or the member stares at a burned unit the DB never charged.
 void refreshUsage();
 toast.error(job.error_message || (isAr ? "فشل الاستبدال." : "The swap failed."));
 return;
 }
 }
 removePendingSwap(entry.id);
 void refreshUsage();
 toast.error(isAr ? "انتهت مهلة انتظار الاستبدال — حاول مرة أخرى." : "The swap wait timed out — please try again.");
 } finally {
 activeWatchers.current.delete(entry.id);
 }
 },
 [applySwapToPlans, removePendingSwap, refreshUsage],
 );

 // Resume watching swaps that were queued before a page reload.
 useEffect(() => {
 setPendingSwaps(readPendingSwaps());
 readPendingSwaps().forEach((entry) => void watchSwapJob(entry));
 }, [watchSwapJob]);

 /* ── AI-QUOTAS 2026-11-14 — MEMBER SELF-SERVICE GENERATION ──────────────
 * «توليد خطة جديدة من داخل قسم الخطط وفق صلاحية الاشتراك والحصة»:
 * a member enqueues plan_nutrition / plan_workout for HIMSELF through the
 * SAME ai_jobs queue the coach uses (the route verifies clientId ===
 * requester and gates by the unified monthly quota; the runner bills his
 * quota on success ONLY — a failed job never burns quota, and the UNIQUE
 * job_ref makes double-billing structurally impossible). The plan row
 * lands approved + current (selfService flag). Survives reloads via the
 * shared plan-jobs registry. */
 const reloadPlans = useCallback(async () => {
 if (!profile) return;
 try {
 const data = await listPlans(profile.id);
 setPlans(data);
 } catch {
 /* keep last known list */
 }
 }, [profile]);

 const watchPlanJob = useCallback(
 async (jobId: string) => {
 if (activePlanWatchers.current.has(jobId)) return;
 activePlanWatchers.current.add(jobId);
 try {
 const deadline = Date.now() + 26 * 60_000;
 while (Date.now() < deadline) {
 await new Promise((r) => setTimeout(r, 20_000));
 let job: AiJobRow | null = null;
 try {
 job = await getAiJob(jobId);
 } catch {
 continue; // transient network error — keep waiting
 }
 if (job?.status === "done") {
 removePendingPlanJob(jobId);
 setPendingPlans(readPendingPlanJobs());
 await reloadPlans();
 await refreshUsage();
 toast.success(isAr ? "خطتك الجديدة جاهزة ✅ — تظهر أعلى القائمة." : "Your new plan is ready ✅ — it's at the top of the list.");
 return;
 }
 if (job?.status === "failed") {
 removePendingPlanJob(jobId);
 setPendingPlans(readPendingPlanJobs());
 // Success-only law: a failed job never burned the quota — the meter
 // reconcile is just bookkeeping hygiene.
 void refreshUsage();
 toast.error(job.error_message || (isAr ? "فشل توليد الخطة." : "The plan generation failed."));
 return;
 }
 }
 removePendingPlanJob(jobId);
 setPendingPlans(readPendingPlanJobs());
 toast.error(isAr ? "انتهت مهلة انتظار التوليد — تابع لاحقًا من قسم الخطط." : "The generation wait timed out — check back later in the Plans section.");
 } finally {
 activePlanWatchers.current.delete(jobId);
 }
 }, [reloadPlans, refreshUsage]);

 // Resume watching generations queued before a page reload.
 useEffect(() => {
 const pending = readPendingPlanJobs().filter((e) => e.clientId === profile?.id);
 setPendingPlans(pending);
 pending.forEach((e) => void watchPlanJob(e.id));
 }, [profile, watchPlanJob]);

 const generatePlan = useCallback(
 async (kind: "nutrition" | "workout") => {
 if (!profile) return;
 // Server enforces too (subscription + unified monthly quota) — this is
 // the honest pre-check (fast feedback, no enqueue round-trip).
 if (planQuota.subscriptionRequired) {
 toast.error(isAr
 ? "توليد الخطط بالذكاء الاصطناعي متاح لمشتركي بريميوم وأعلى — اشترك لتوليد خطط التغذية والتمارين بحصة شهرية."
 : "AI plan generation is available to Premium subscribers and above — subscribe to generate nutrition & workout plans with a monthly quota.");
 return;
 }
 if (!planQuota.unlimited && planQuota.remaining <= 0) {
 // §3 exhaustion: clear message + the banner above carries the direct
 // renewal/upgrade links (toasts are text-only — the links live in the
 // persistent quota banner so they stay clickable).
 toast.error(isAr
 ? `انتهت حصة توليد الخطط لهذه الدورة (${planQuota.used}/${planQuota.limit}) — تتجدد في ${planQuota.renewsAt ? new Date(planQuota.renewsAt).toLocaleDateString("ar-EG") : ""}. جدّد اشتراكك أو رقِّه من الأعلى لإضافة استحقاقات جديدة.`
 : `Your plan-generation quota for this cycle is used up (${planQuota.used}/${planQuota.limit}) — it renews on ${planQuota.renewsAt ? new Date(planQuota.renewsAt).toLocaleDateString("en-US") : ""}. Renew or upgrade from the banner above to add new entitlements.`);
 return;
 }
 setGenerating(kind);
 try {
 // The member's questionnaires ride the payload exactly like the
 // coach's flow (allergies/dislikes/goals — the generator's inputs).
 const [nutriQ, fitQ] = await Promise.all([
 getQuestionnaire(profile.id, "nutrition").catch(() => null),
 getQuestionnaire(profile.id, "fitness").catch(() => null),
 ]);
 const jobId = await enqueueAiJobClient(kind === "nutrition" ? "plan_nutrition" : "plan_workout", {
 clientId: profile.id,
 selfService: true,
 clientContext: {
 name: profile.full_name,
 ...(nutriQ?.data && typeof nutriQ.data === "object" ? { nutrition: nutriQ.data } : {}),
 ...(fitQ?.data && typeof fitQ.data === "object" ? { fitness: fitQ.data } : {}),
 },
 });
 addPendingPlanJob({ id: jobId, clientId: profile.id, kind, createdAt: Date.now() });
 setPendingPlans(readPendingPlanJobs().filter((e) => e.clientId === profile?.id));
 void watchPlanJob(jobId);
 toast.info(isAr
 ? "تم إرسال طلب التوليد 🚀 خطتك الجديدة ستظهر أعلى القائمة تلقائيًا خلال دقائق حتى لو قفلت الصفحة."
 : "Generation request sent 🚀 Your new plan appears at the top of the list within minutes, even if you close the page.");
 } catch (e) {
 toast.error((e instanceof Error ? e.message : "") || t("common.error"));
 } finally {
 setGenerating(null);
 }
 },
 [profile, planQuota, watchPlanJob]);

 useEffect(() => {
 if (!profile) return;
 (async () => {
 try {
 const [data, usage] = await Promise.all([
 listPlans(profile.id),
 getSwapUsage(profile.id),
 ]);
 setPlans(data);
 setSwapUsage(usage);
 // AI-QUOTAS 2026-11-14: the unified generation quota meter rides the
 // same refresh path (display == enforcement).
 void refreshUsage();
 // NOTIF→PLAN 2026-10-24 (owner order item 3 — التوجيه): the
 // plan_activated notification deep link (/plans?plan=<id>) auto-opens
 // THIS plan's modal — the member lands on the exact plan the bell
 // announced, not just the plans list. One-shot per mount (the param
 // stays in the URL harmlessly; a manual later open is never hijacked).
 try {
 const wanted = new URLSearchParams(window.location.search).get("plan");
 if (wanted) {
 const match = data.find((p) => p.id === wanted);
 if (match) setActive(match);
 }
 } catch {
 /* a malformed ?plan param never breaks the page */
 }
 } catch (e) {
 console.error("[PlansView] load failed:", e instanceof Error ? e.message : e);
 } finally {
 setLoading(false);
 }
 })();
 }, [profile, refreshUsage]);

 if (loading) return <div className="text-muted-foreground">{t("common.loading")}</div>;

 const meal = plans.filter((p) => p.type === "meal");
 const workout = plans.filter((p) => p.type === "workout");

 const openFile = async (bucket: string, filePath: string) => {
 const url = await getPlanFileUrl(bucket, filePath);
 if (url) window.open(url, "_blank");
 // Phase 247: a failed sign used to be a DEAD click — the exact
 // silent-failure shape the 246 receipt fix removed elsewhere.
 else toast.error(t("plans.openFailed"));
 };

 const swapMeal = async (planId: string, mealIndex: number) => {
 if (!profile) return;
 // Check remaining quota client-side first — the server enforces too.
 // Completion order §2: ONE unified swap quota — meal and exercise draw
 // from the same budget (the required case gets the honest subscribe
 // CTA instead of a broken 0/0 widget).
 if (swapUsage.subscriptionRequired) {
 toast.error(isAr
 ? "التبديلات متاحة لمشتركي بريميوم وأعلى — اشترك للحصول على حصة تبديلات شهرية للوجبات والتمارين."
 : "Swaps are available to Premium subscribers and above — subscribe for a monthly swap quota (meals and exercises).");
 return;
 }
 if (swapUsage.remaining <= 0) {
 toast.error(isAr
 ? `انتهت حصة التبديلات لهذه الدورة (${swapUsage.used}/${swapUsage.limit}) — تتجدد مع دورة الاشتراك. جدّد اشتراكك أو رقّه من الأعلى لإضافة استحقاقات جديدة.`
 : `Your swap quota for this cycle is used up (${swapUsage.used}/${swapUsage.limit}) — it renews with your subscription cycle. Renew or upgrade from the banner above to add new entitlements.`);
 return;
 }
 setSwapLoading(`meal-${planId}-${mealIndex}`);
 // PHASE 99 OPTIMISTIC: the counter shows the new value instantly.
 applyOptimisticUsage("meal");
 try {
 const plan = plans.find((p) => p.id === planId);
 const planContent = asPlanContent(plan?.content);
 if (!planContent || !("meals" in planContent) || !planContent.meals[mealIndex]) throw new Error("Meal not found");
 const mealItem = planContent.meals[mealIndex];
 // AI-PLAN-QUALITY 2026-10-24: the meal's CURRENT calorie anchor rides the
 // payload explicitly (coerced — legacy string totals must not reach the
 // server gate as garbage); the server's ±20% regeneration law keys on it.
 const mealTargetCals =
 (typeof mealItem.total_calories === "number" && mealItem.total_calories > 0
 ? mealItem.total_calories
 : (mealItem.items || []).reduce((s, i) => s + (Number(i?.calories) || 0), 0)) || undefined;
 // PHASE 62 VARIETY: pass the OTHER meals' item names from the same plan
 // so the regenerated meal doesn't duplicate them (allergies/dislikes in
 // the questionnaire aren't available client-side here, but the queue
 // sanitizer keeps the list server-safe).
 const avoidNames: string[] = (planContent.meals || [])
   .flatMap((m, i) =>
     i === mealIndex
       ? []
       : [String(m?.name || ""), ...((m?.items || []).map((it) => String(it?.food || "")))],
   )
   .filter((n) => n.trim().length > 1)
   .slice(0, 40);
 // OWNER DIRECTIVE 2026-08-27: generation runs on GitHub Actions — this
 // click only enqueues the job (tier limit is enforced server-side now).
 // PLAN-REGEN-CONSTRAINTS 2026-10-24 (the measured RC1-c): the swap rides
 // the plan's COMMITTED diet + the member's questionnaire constraints —
 // a keto plan's replacement meal may no longer come back as rice at
 // matching calories, and allergens are gate-enforced server-side.
 const planDiet = resolvePlanDietType(planContent) ?? undefined;
 let memberNutrition: Record<string, unknown> | null = null;
 try {
 const nutriQ = await getQuestionnaire(profile.id, "nutrition");
 memberNutrition = (nutriQ?.data as Record<string, unknown> | null) ?? null;
 } catch {
 memberNutrition = null; // questionnaire unreadable → diet echo still rides
 }
 const jobId = await enqueueAiJobClient("meal_regenerate", {
 meal: mealItem,
 targetCalories: mealTargetCals,
 clientContext: { name: profile?.full_name, ...(memberNutrition ? { nutrition: memberNutrition } : {}) },
 avoid_names: avoidNames,
 ...(planDiet ? { dietType: planDiet } : {}),
 // MEMBER-SWAP-DURABILITY 2026-10-26 (owner order items 1-2 — «توحيد
 // مصدر الخطط… وتبديل الوجبة أو الصنف يُحفظ ويظهر في جميع الواجهات
 // المعنية»): the member's swap rides the SAME plan-target law the
 // coach's editor has had since 368 — planId + clientId + mealIdx on the
 // payload (whitelisted by sanitizeJobPayload, ownership-gated at the
 // enqueue route, verified again by the runner before the write). The
 // RUNNER now persists the gated replacement into plans.content
 // server-side, so the member's swap survives a dead tab exactly like
 // the coach's — previously ONLY the browser poller applied it and a
 // closed tab lost the result (the exact 13:29Z failure class 368
 // fixed for the coach flow but left open here).
 planId,
 clientId: profile.id,
 mealIdx: mealIndex,
 });
 const pendingEntry: PendingSwap = {
 id: jobId,
 planId,
 kind: "meal",
 i1: mealIndex,
 createdAt: Date.now(),
 };
 writePendingSwaps([...readPendingSwaps(), pendingEntry]);
 setPendingSwaps(readPendingSwaps());
 // PHASE 99 OPTIMISTIC: quota was already decremented on click; this
 // reconcile is fire-and-forget so the toast fires instantly.
 void refreshUsage();
 void watchSwapJob(pendingEntry);
 toast.info(isAr ? "تم إرسال طلب الاستبدال 🚀 النتيجة هتتطبق تلقائيًا خلال ~10 دقائق حتى لو قفلت الصفحة." : "Swap request sent 🚀 The result applies automatically within ~10 minutes, even if you close the page.");
 } catch (e) {
 // Roll back the optimistic quota decrement to server truth.
 void refreshUsage();
 toast.error((e instanceof Error ? e.message : "") || t("common.error"));
 } finally {
 setSwapLoading(null);
 }
 };

 const swapExercise = async (planId: string, dayIndex: number, exIndex: number) => {
 if (!profile) return;
 // Completion order §2: ONE unified swap quota (same checks as meals —
 // meal and exercise swaps draw from the same monthly budget).
 if (swapUsage.subscriptionRequired) {
 toast.error(isAr
 ? "التبديلات متاحة لمشتركي بريميوم وأعلى — اشترك للحصول على حصة تبديلات شهرية للوجبات والتمارين."
 : "Swaps are available to Premium subscribers and above — subscribe for a monthly swap quota (meals and exercises).");
 return;
 }
 if (swapUsage.remaining <= 0) {
 toast.error(isAr
 ? `انتهت حصة التبديلات لهذه الدورة (${swapUsage.used}/${swapUsage.limit}) — تتجدد مع دورة الاشتراك. جدّد اشتراكك أو رقّه من الأعلى لإضافة استحقاقات جديدة.`
 : `Your swap quota for this cycle is used up (${swapUsage.used}/${swapUsage.limit}) — it renews with your subscription cycle. Renew or upgrade from the banner above to add new entitlements.`);
 return;
 }
 setSwapLoading(`ex-${planId}-${dayIndex}-${exIndex}`);
 // PHASE 99 OPTIMISTIC: the counter shows the new value instantly.
 applyOptimisticUsage("exercise");
 try {
 const plan = plans.find((p) => p.id === planId);
 const planContent = asPlanContent(plan?.content);
 if (!planContent || !("days" in planContent) || !planContent.days[dayIndex]?.exercises?.[exIndex]) throw new Error("Exercise not found");
 const exercise = planContent.days[dayIndex].exercises[exIndex];
 const focus = planContent.days[dayIndex].focus;
 // Library-filtered, injury-safe substitution on GitHub Actions.
 const jobId = await enqueueAiJobClient("exercise_regenerate", {
 exercise: { ...exercise, focus },
 clientContext: { name: profile?.full_name },
 // MEMBER-SWAP-DURABILITY 2026-10-26: the exercise swap rides the same
 // plan-target law (sanitizer + ownership gate + runner materialization
 // added in this frame) — previously exercise swaps had NO server-side
 // persistence at all, even for coaches.
 planId,
 clientId: profile.id,
 dayIdx: dayIndex,
 exIdx: exIndex,
 });
 const pendingEntry: PendingSwap = {
 id: jobId,
 planId,
 kind: "exercise",
 i1: dayIndex,
 i2: exIndex,
 createdAt: Date.now(),
 };
 writePendingSwaps([...readPendingSwaps(), pendingEntry]);
 setPendingSwaps(readPendingSwaps());
 // PHASE 99 OPTIMISTIC: fire-and-forget reconcile (rollback on catch).
 void refreshUsage();
 void watchSwapJob(pendingEntry);
 toast.info(isAr ? "تم إرسال طلب استبدال التمرين 🚀 البديل الآمن هيظهر خلال ~10 دقائق." : "Exercise swap request sent 🚀 The safe alternative appears within ~10 minutes.");
 } catch (e) {
 // Roll back the optimistic quota decrement to server truth.
 void refreshUsage();
 toast.error((e instanceof Error ? e.message : "") || t("common.error"));
 } finally {
 setSwapLoading(null);
 }
 };

 const printPlan = (plan: Plan) => {
 const w = window.open("", "_blank", "width=820,height=1040");
 if (!w) return;
 const content = asPlanContent(plan.content);
 const isWorkout = plan.type === "workout";
 let html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${plan.title}</title>
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
 <div class="brand-tag">مدرب أونلاين للتغذية واللياقة | alkemos.com</div>
 </div>
</div>
<h1>${escapeHtml(plan.title)}</h1>`;
 if (content) {
 if (content.overview) html += `<p style="white-space:pre-line">${escapeHtml(content.overview)}</p>`;

 if (!isWorkout) {
 // Data analysis
 if (content && "meals" in content && content.data_analysis) {
 const da = content.data_analysis;
 html += `<h2> تحليل البيانات</h2><div class="analysis"><div class="analysis-grid">`;
 const fields = [
 ["الجنس", da.gender], ["الوزن", da.weight], ["الطول", da.height],
 ["العمر", da.age], ["الرقبة", da.neck], ["الخصر", da.waist],
 ["الورك", da.hip], ["النشاط", da.activity], ["الصحة", da.health],
 ["نسبة الدهون", da.body_fat_pct],
 ];
 for (const [label, val] of fields) {
 if (val) html += `<div class="analysis-item"><span class="analysis-label">${label}:</span> ${val}</div>`;
 }
 if (da.bmr) html += `<div class="analysis-item"><span class="analysis-label">BMR:</span> ~${da.bmr} سعرة</div>`;
 if (da.tdee) html += `<div class="analysis-item"><span class="analysis-label">TDEE:</span> ~${da.tdee} سعرة</div>`;
 html += `</div></div>`;
 }

 // Macros
 if (content && "meals" in content && (content.daily_calories || content.macros)) {
 html += `<h2> السعرات والماكروز</h2><div class="stats">`;
 const printCals = displayCalories(content);
 if (printCals > 0) html += `<div class="stat"><span class="stat-label">السعرات اليومية (مجموع الوجبات)</span><span class="stat-value">${printCals}</span></div>`;
 if (content.macros?.protein_g) html += `<div class="stat"><span class="stat-label">بروتين</span><span class="stat-value">${content.macros.protein_g}جم</span></div>`;
 if (content.macros?.carbs_g) html += `<div class="stat"><span class="stat-label">كربوهيدرات</span><span class="stat-value">${content.macros.carbs_g}جم</span></div>`;
 if (content.macros?.fat_g) html += `<div class="stat"><span class="stat-label">دهون</span><span class="stat-value">${content.macros.fat_g}جم</span></div>`;
 html += `</div>`;
 }

 // Supplements
 if (content && "meals" in content && (content.supplements?.length ?? 0) > 0) {
 html += `<h2> المكملات والتوصيات الصحية</h2>`;
 for (const s of content.supplements ?? []) {
 html += `<div class="supplement"><div class="supplement-name">${s.name}</div>`;
 if (s.dose) html += `<div>الجرعة: ${s.dose}</div>`;
 if (s.timing) html += `<div>الموعد: ${s.timing}</div>`;
 if (s.purpose) html += `<div>الهدف: ${s.purpose}</div>`;
 html += `</div>`;
 }
 }

 // Health notes
 if (content && "meals" in content && (content.health_notes?.length ?? 0) > 0) {
 html += `<h2> توصيات صحية خاصة</h2>`;
 for (const n of content.health_notes ?? []) {
 html += `<div class="health-note">${n}</div>`;
 }
 }

 // Water target
 if (content && "meals" in content && content.water_target) {
 html += `<h2> استهلاك الماء</h2><p>${content.water_target}</p>`;
 }

 // Meals
 if (content && "meals" in content && content.meals) {
 html += `<h2> النظام الغذائي</h2>`;
 for (const m of content.meals) {
 html += `<h3>${escapeHtml(m.name)}${m.time ? ` <span style="font-size:11px;color:#666;font-weight:400">${escapeHtml(m.time)}</span>` : ""}</h3>`;
 html += `<table><tr><th style="width:30px">#</th><th>المكون</th><th>الكمية</th><th>السعرات</th><th>البدائل</th></tr>`;
 (m.items || []).forEach((it, i) => {
 html += `<tr><td>${i + 1}</td><td>${escapeHtml(it.food)}</td><td>${escapeHtml(it.amount)}</td><td>${escapeHtml(String(it.calories))}</td><td style="font-size:11px;color:#666">${escapeHtml(it.alternatives) || "—"}</td></tr>`;
 });
 if (m.total_calories || m.total_protein_g) {
 html += `<tr class="meal-total"><td colspan="3">إجمالي الوجبة: ~${m.total_calories || (m.items || []).reduce((s, i) => s + (i.calories || 0), 0)} سعرة</td><td>${m.total_protein_g || ""} ${m.total_protein_g ? "جم بروتين" : ""}</td><td></td></tr>`;
 }
 html += `</table>`;
 if (m.notes) html += `<p style="font-size:12px;color:#666"> ${m.notes}</p>`;
 }
 }
 } else if (isWorkout && content && "days" in content) {
 // Workout volume + progression
 if (content.weekly_volume || content.progression) {
 html += `<h2> الحجم والتقدم</h2>`;
 if (content.weekly_volume) html += `<p><strong>الحجم الأسبوعي:</strong> ${content.weekly_volume}</p>`;
 if (content.progression) html += `<p><strong>طريقة التقدم:</strong> ${content.progression}</p>`;
 }
 html += `<h2> البرنامج الأسبوعي</h2>`;
 for (const d of content.days) {
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
 imgHtml += `<img src="${url}" alt="${escapeHtml(ex.name)}" style="width:60px;height:60px;object-fit:contain;border:1px solid #e2e2e2;border-radius:6px;background:#fafafa" onerror="this.style.display='none'">`;
 });
 imgHtml += `</div>`;
 }
 html += `<tr><td>${i + 1}</td><td>${imgHtml}<strong>${escapeHtml(ex.name)}</strong>${ex.notes ? `<br><span style="font-size:11px;color:#666">${escapeHtml(ex.notes)}</span>` : ""}</td><td style="color:#0071e3;font-weight:700">${escapeHtml(String(ex.sets))}</td><td style="color:#34c759;font-weight:700">${escapeHtml(String(ex.reps))}</td><td style="color:#ff9500;font-weight:700">${escapeHtml(ex.rest)}</td></tr>`;
 });
 html += `</table>`;
 }
 }
 }
 }
 html += `<div class="footer">© ${new Date().getFullYear()} Alkemos | alkemos.com<br>هذا التقرير مُعد لأغراض إرشادية — يُرجى استشارة طبيب مختص قبل بدء أي نظام غذائي أو تناول مكملات.</div>`;
 html += `</body></html>`;
 w.document.write(html);
 w.document.close();
 w.focus();
 setTimeout(() => w.print(), 500);
 };

 return (
 <div className="space-y-8">
 <div>
 <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("plans.title")}</h1>
 <p className="mt-2 text-base font-normal text-[#6e6e73] md:text-lg">{t("plans.subtitle")}</p>
 </div>

 {/* ── AI-QUOTAS (completion order 2026-11-14): the quota banner — TWO
     unified quotas only (generation + swaps; meal/exercise never split,
     §1/§2), each with its own honest exhaustion treatment (§3: clear
     message + direct renewal/upgrade links riding the EXISTING /checkout
     payment path; exhausting one quota NEVER gates the other). Free
     members see the honest subscribe CTA instead of 0/0 widgets (the
     m6-fix law, carried forward). */}
 <div className="rounded-2xl bg-[#f5f5f7] px-5 py-4 text-sm font-normal text-[#6e6e73]">
 {planQuota.subscriptionRequired ? (
 <div className="flex flex-wrap items-center gap-2">
 <span>
 {isAr
 ? "توليد الخطط والتبديلات بالذكاء الاصطناعي متاحة لمشتركي بريميوم وأعلى — بحصص شهرية تتجدد مع دورة الاشتراك."
 : "AI plan generation & swaps are available to Premium subscribers and above — monthly quotas renewing with your subscription cycle."}
 </span>
 <a
 href={isAr ? "/ar/memberships" : "/memberships"}
 className="font-medium text-[#0071e3] hover:underline"
 >
 {t("plans.swaps.upgradeCta")}
 </a>
 </div>
 ) : (
 <div className="space-y-2">
 <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
 <span>
 {isAr ? "توليد الخطط:" : "Plan generations:"}{" "}
 <strong className={planQuota.remaining > 0 ? "text-[#1d1d1f]" : "text-[#ff3b30]"}>
 {planQuota.unlimited ? "∞" : planQuota.remaining}
 </strong>
 {planQuota.unlimited ? "" : `/${planQuota.limit}`}
 {" "}{isAr ? "متبقٍ هذه الدورة" : "left this cycle"}
 </span>
 <span className="text-[#d2d2d7]">|</span>
 <span>
 {isAr ? "التبديلات (وجبات أو تمارين):" : "Swaps (meal or exercise):"}{" "}
 <strong className={swapUsage.remaining > 0 ? "text-[#1d1d1f]" : "text-[#ff3b30]"}>
 {swapUsage.unlimited ? "∞" : swapUsage.remaining}
 </strong>
 {swapUsage.unlimited ? "" : `/${swapUsage.limit}`}
 </span>
 {planQuota.renewsAt && (
 <>
 <span className="text-[#d2d2d7]">|</span>
 <span>
 {isAr ? "تتجدد الحصة:" : "Quota renews:"}{" "}
 {new Date(planQuota.renewsAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
 </span>
 </>
 )}
 </div>
 {/* §3 — generation exhausted: clear message + direct renewal/upgrade
     links (the EXISTING payment path; one quota's exhaustion never
     hides or gates the other quota's readout above). */}
 {!planQuota.unlimited && planQuota.remaining <= 0 && (
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-3 py-2 text-[#1d1d1f]">
 <span className="font-medium text-[#ff3b30]">
 {isAr
 ? `انتهت حصة توليد الخطط لهذه الدورة (${planQuota.used}/${planQuota.limit})${planQuota.renewsAt ? ` — تتجدد في ${new Date(planQuota.renewsAt).toLocaleDateString("ar-EG")}` : ""}.`
 : `Your generation quota for this cycle is used up (${planQuota.used}/${planQuota.limit})${planQuota.renewsAt ? ` — renews on ${new Date(planQuota.renewsAt).toLocaleDateString("en-US")}` : ""}.`}
 </span>
 {planQuota.renewalUrl && (
 <a href={planQuota.renewalUrl} className="font-medium text-[#0071e3] hover:underline">
 {isAr ? "تجديد الاشتراك الآن ›" : "Renew your plan now ›"}
 </a>
 )}
 {planQuota.upgradeUrl && (
 <a href={planQuota.upgradeUrl} className="font-medium text-[#0071e3] hover:underline">
 {isAr ? "الترقية إلى باقة أعلى ›" : "Upgrade to a higher plan ›"}
 </a>
 )}
 </div>
 )}
 {/* §3 — swaps exhausted: same treatment, INDEPENDENT of generation
     (the generation quota above stays usable if it still has units). */}
 {!swapUsage.unlimited && swapUsage.remaining <= 0 && (
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-3 py-2 text-[#1d1d1f]">
 <span className="font-medium text-[#ff3b30]">
 {isAr
 ? `انتهت حصة التبديلات لهذه الدورة (${swapUsage.used}/${swapUsage.limit})${swapUsage.renewsAt ? ` — تتجدد في ${new Date(swapUsage.renewsAt).toLocaleDateString("ar-EG")}` : ""}.`
 : `Your swap quota for this cycle is used up (${swapUsage.used}/${swapUsage.limit})${swapUsage.renewsAt ? ` — renews on ${new Date(swapUsage.renewsAt).toLocaleDateString("en-US")}` : ""}.`}
 </span>
 {swapUsage.renewalUrl && (
 <a href={swapUsage.renewalUrl} className="font-medium text-[#0071e3] hover:underline">
 {isAr ? "تجديد الاشتراك الآن ›" : "Renew your plan now ›"}
 </a>
 )}
 {swapUsage.upgradeUrl && (
 <a href={swapUsage.upgradeUrl} className="font-medium text-[#0071e3] hover:underline">
 {isAr ? "الترقية إلى باقة أعلى ›" : "Upgrade to a higher plan ›"}
 </a>
 )}
 </div>
 )}
 </div>
 )}
 </div>

 {/* ── Member self-service generation (AI-QUOTAS 2026-11-14) — the
     two buttons ride the member's own unified monthly quota. */}
 <div className="grid gap-4 sm:grid-cols-2">
 <Card className="flex flex-col gap-3 p-5">
 <div className="flex items-center gap-2">
 <Salad className="h-5 w-5 text-primary" />
 <h3 className="font-semibold">{isAr ? "توليد خطة تغذية جديدة" : "Generate a new nutrition plan"}</h3>
 </div>
 <p className="text-xs text-muted-foreground">
 {isAr
 ? "خطة تغذية كاملة بالذكاء الاصطناعي مبنية على استبيانك — تُخصم من حصة التوليد الشهرية عند النجاح فقط."
 : "A full AI nutrition plan built from your questionnaire — deducted from your monthly generation quota only on success."}
 </p>
 <div className="flex items-center justify-between">
 <Badge variant="secondary">{isAr ? "تُظهر خلال دقائق" : "Ready within minutes"}</Badge>
 <Button
 size="sm"
 className="gap-2"
 disabled={generating !== null || pendingPlans.length > 0}
 onClick={() => void generatePlan("nutrition")}
 >
 {generating === "nutrition" ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Plus className="h-4 w-4" />
 )}
 {isAr ? "توليد" : "Generate"}
 </Button>
 </div>
 </Card>
 <Card className="flex flex-col gap-3 p-5">
 <div className="flex items-center gap-2">
 <Dumbbell className="h-5 w-5 text-primary" />
 <h3 className="font-semibold">{isAr ? "توليد خطة تمارين جديدة" : "Generate a new workout plan"}</h3>
 </div>
 <p className="text-xs text-muted-foreground">
 {isAr
 ? "برنامج تمرين أسبوعي بالذكاء الاصطناعي مبنٍ على هدفك ومستواك — تُخصم من حصة التوليد الشهرية عند النجاح فقط."
 : "An AI weekly workout program built from your goal and level — deducted from your monthly generation quota only on success."}
 </p>
 <div className="flex items-center justify-between">
 <Badge variant="secondary">{isAr ? "تُظهر خلال دقائق" : "Ready within minutes"}</Badge>
 <Button
 size="sm"
 className="gap-2"
 disabled={generating !== null || pendingPlans.length > 0}
 onClick={() => void generatePlan("workout")}
 >
 {generating === "workout" ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Plus className="h-4 w-4" />
 )}
 {isAr ? "توليد" : "Generate"}
 </Button>
 </div>
 </Card>
 </div>

 {/* Pending generation status — the survivable watcher keeps the member
     informed even across reloads (pendingPlans mirrors the registry). */}
 {pendingPlans.length > 0 && (
 <div className="flex items-center gap-2 rounded-2xl bg-[#e8f0fe] px-5 py-4 text-sm text-[#0071e3]">
 <Loader2 className="h-4 w-4 animate-spin" />
 <span>
 {isAr
 ? `جارٍ توليد ${pendingPlans.length === 1 ? "خطة" : `${pendingPlans.length} خطط`} بالذكاء الاصطناعي — ستظهر أعلى القائمة تلقائيًا عند اكتمالها (حتى لو أغلقت الصفحة).`
 : `Generating ${pendingPlans.length === 1 ? "a plan" : `${pendingPlans.length} plans`} — they appear at the top of the list automatically when ready (even if you close the page).`}
 </span>
 </div>
 )}

 {/* ── Latest plan highlight (owner order: «عرض أحدث خطة أنتجها EVO
     للعميل») — the newest plan row of ANY source (EVO-saved plans land in
     the same plans table via member-edit save-evo; planner/coach/self-
     service generations land here too). listPlans is created_at DESC. */}
 {plans.length > 0 && (
 <div>
 <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#6e6e73]">
 <Sparkles className="h-4 w-4 text-primary" />
 <span>{isAr ? "أحدث خطة" : "Latest plan"}</span>
 </div>
 <PlanCard plan={plans[0]} onClick={() => setActive(plans[0])} />
 </div>
 )}

 <Tabs defaultValue="workout">
 <TabsList className="flex-wrap rounded-full bg-[#f5f5f7] p-1">
 <TabsTrigger value="workout" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
 {t("plans.workout")} ({workout.length})
 </TabsTrigger>
 <TabsTrigger value="meal" className="gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
 {t("plans.meal")} ({meal.length})
 </TabsTrigger>
 </TabsList>

 <TabsContent value="workout" className="mt-6">
 {workout.length === 0 ? (
 <EmptyCard text={t("plans.empty")} />
 ) : (
 <div className="grid gap-4 sm:grid-cols-2">
 {workout.map((p) => (
 <PlanCard key={p.id} plan={p} onClick={() => setActive(p)} />
 ))}
 </div>
 )}
 </TabsContent>

 <TabsContent value="meal" className="mt-6">
 {meal.length === 0 ? (
 <EmptyCard text={t("plans.empty")} />
 ) : (
 <div className="grid gap-4 sm:grid-cols-2">
 {meal.map((p) => (
 <PlanCard key={p.id} plan={p} onClick={() => setActive(p)} />
 ))}
 </div>
 )}
 </TabsContent>
 </Tabs>

 {/* Plan Detail Modal */}
 {active && (
 <PlanDetailModal
 plan={active}
 onClose={() => setActive(null)}
 onSwapMeal={(i) => swapMeal(active.id, i)}
 onSwapExercise={(d, e) => swapExercise(active.id, d, e)}
 swapLoading={swapLoading}
 isSwapPending={isSwapPending}
 onPrint={() => printPlan(active)}
 onOpenFile={(path) => openFile(active.type === "meal" ? "meal-plans" : "workout-plans", path)}
 />
 )}
 </div>
 );
}

function EmptyCard({ text }: { text: string }) {
 const { t, lang } = useI18n();
 const isAr = lang === "ar";
 const { navigate } = useNav();
 return (
 <div className="rounded-2xl bg-[#f5f5f7] p-12 text-center">
 <p className="text-base font-normal text-[#6e6e73]">{text}</p>
 <p className="mt-2 text-sm font-normal text-[#6e6e73]">
 {isAr ? "املأ استبيانك ليتمكن المدرب من تجهيز خطتك المخصصة." : "Fill out your questionnaire so the coach can prepare your personalized plan."}
 </p>
 <button
 onClick={() => navigate("questionnaires")}
 className="mt-4 rounded-full bg-[#0071e3] px-5 py-2 text-sm font-normal text-white transition-opacity hover:opacity-90"
 >
 {isAr ? "املأ الاستبيان ›" : "Fill questionnaire ›"}
 </button>
 </div>
 );
}

function PlanCard({ plan, onClick }: { plan: Plan; onClick: () => void }) {
 const content = asPlanContent(plan.content);
 const { t, lang } = useI18n();
 const isAr = lang === "ar";
 return (
 <Card className="group cursor-pointer p-5 shadow-card transition-all hover:shadow-glow" onClick={onClick}>
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 {plan.type === "meal" ? <Salad className="h-5 w-5 text-primary" /> : <Dumbbell className="h-5 w-5 text-primary" />}
 <h3 className="truncate font-semibold">{plan.title}</h3>
 </div>
 <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{plan.notes || "—"}</p>
 </div>
 <Button size="sm" variant="ghost" className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
 {t("plans.view")}
 </Button>
 </div>
 {content && "meals" in content && displayCalories(content) > 0 && (
 <div className="mt-3 flex gap-2 text-xs">
 <Badge variant="secondary">{displayCalories(content)} cal</Badge>
 {content.macros && (
 <Badge variant="outline">P:{content.macros.protein_g}g</Badge>
 )}
 </div>
 )}
 {content && "days" in content && (
 <div className="mt-3 text-xs text-muted-foreground">
 {content.days.length} {isAr ? "أيام" : "days"}
 </div>
 )}
 </Card>
 );
}

function PlanDetailModal({
 plan,
 onClose,
 onSwapMeal,
 onSwapExercise,
 swapLoading,
 isSwapPending,
 onPrint,
 onOpenFile,
}: {
 plan: Plan;
 onClose: () => void;
 onSwapMeal: (i: number) => void;
 onSwapExercise: (d: number, e: number) => void;
 swapLoading: string | null;
 isSwapPending: (kind: "meal" | "exercise", planId: string, i1: number, i2?: number) => boolean;
 onPrint: () => void;
 onOpenFile: (path: string) => void;
}) {
 const { t } = useI18n();
 const content = asPlanContent(plan.content);

 // PHASE 334 — W1-3b (remediation plan §6.2, audit A-03): the hand-rolled
 // overlay (no dialog semantics, no Escape, no focus trap, and a literally-
 // EMPTY close button) is replaced by the unified <Modal> wrapper built in
 // W1-3a — role=dialog + labelled title + Escape + focus trap/restore +
 // labeled X close all inherit from Radix. Mounted-when-open (the parent's
 // conditional render): open is true for the component's lifetime and
 // onOpenChange(false) → onClose() keeps the instant close the old overlay
 // had, while the remount per plan keeps this component's local state fresh.
 return (
 <Modal
 open={true}
 onOpenChange={(o) => {
 if (!o) onClose();
 }}
 title={plan.title}
 icon={plan.type === "meal" ? <Salad className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
 size="lg"
 scroll
 actions={
 <>
 <Button size="sm" variant="outline" className="gap-2" onClick={onPrint}>
 <Printer className="h-4 w-4" />
 <span className="hidden sm:inline">{t("plan.print")}</span>
 </Button>
 {plan.file_url && (
 <Button size="sm" variant="outline" className="gap-2" onClick={() => plan.file_url && onOpenFile(plan.file_url)}>
 <Download className="h-4 w-4" />
 <span className="hidden sm:inline">{t("common.download")}</span>
 </Button>
 )}
 </>
 }
 >
 {plan.type === "meal" && content && "meals" in content ? (
 <MealContent content={content} onSwap={onSwapMeal} swapLoading={swapLoading} planId={plan.id} isSwapPending={isSwapPending} />
 ) : plan.type === "workout" && content && "days" in content ? (
 <WorkoutContent content={content} onSwap={onSwapExercise} swapLoading={swapLoading} planId={plan.id} isSwapPending={isSwapPending} />
 ) : (
 <div className="text-sm text-muted-foreground">
 {/* PHASE 69 — EVO-saved plans render their text content */}
 {content && "text" in content ? (
 <p className="whitespace-pre-wrap leading-relaxed">{String((content as { text?: unknown }).text)}</p>
 ) : (
 plan.notes || "—"
 )}
 {plan.file_url && (
 <a href="#" onClick={(e) => { e.preventDefault(); if (plan.file_url) onOpenFile(plan.file_url); }} className="mt-3 flex items-center gap-1 text-primary hover:underline">
 <Download className="h-4 w-4" /> {t("common.download")}
 </a>
 )}
 </div>
 )}
 </Modal>
 );
}

function MealContent({ content, onSwap, swapLoading, planId, isSwapPending }: { content: NutritionPlanContent; onSwap: (i: number) => void; swapLoading: string | null; planId: string; isSwapPending: (kind: "meal" | "exercise", planId: string, i1: number, i2?: number) => boolean }) {
 const { t, lang } = useI18n();
 const isAr = lang === "ar";
 return (
 <div className="space-y-4">
 {content.overview && <p className="whitespace-pre-line text-sm text-muted-foreground">{content.overview}</p>}

 {/* PDF-style data analysis section */}
 {content.data_analysis && (
 <div className="rounded-xl border border-border bg-muted/30 p-4">
 <h4 className="mb-2 text-sm font-bold"> تحليل البيانات</h4>
 <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
 {content.data_analysis.gender && <div><span className="text-muted-foreground">الجنس:</span> {content.data_analysis.gender}</div>}
 {content.data_analysis.weight && <div><span className="text-muted-foreground">الوزن:</span> {content.data_analysis.weight}</div>}
 {content.data_analysis.height && <div><span className="text-muted-foreground">الطول:</span> {content.data_analysis.height}</div>}
 {content.data_analysis.age && <div><span className="text-muted-foreground">العمر:</span> {content.data_analysis.age}</div>}
 {content.data_analysis.activity && <div><span className="text-muted-foreground">النشاط:</span> {content.data_analysis.activity}</div>}
 {content.data_analysis.health && <div><span className="text-muted-foreground">الصحة:</span> {content.data_analysis.health}</div>}
 {content.data_analysis.body_fat_pct && <div><span className="text-muted-foreground">نسبة الدهون:</span> {content.data_analysis.body_fat_pct}</div>}
 {content.data_analysis.bmr && <div><span className="text-muted-foreground">BMR:</span> ~{content.data_analysis.bmr} سعرة</div>}
 {content.data_analysis.tdee && <div><span className="text-muted-foreground">TDEE:</span> ~{content.data_analysis.tdee} سعرة</div>}
 </div>
 </div>
 )}

 {/* Macros summary */}
 {displayCalories(content) > 0 && (
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
 <Stat label={t("plan.calories")} value={displayCalories(content)} />
 <Stat label={t("plan.protein")} value={`${content.macros?.protein_g || 0}g`} />
 <Stat label={t("plan.carbs")} value={`${content.macros?.carbs_g || 0}g`} />
 <Stat label={t("plan.fat")} value={`${content.macros?.fat_g || 0}g`} />
 </div>
 )}

 {/* Supplements & health notes */}
 {((content.supplements?.length ?? 0) > 0 || (content.health_notes?.length ?? 0) > 0 || content.water_target) && (
 <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
 {(content.supplements?.length ?? 0) > 0 && (
 <div>
 <h4 className="mb-2 text-sm font-bold"> المكملات والتوصيات الصحية</h4>
 <div className="space-y-2">
 {(content.supplements ?? []).map((s, i) => (
 <div key={i} className="rounded-lg border border-border bg-background p-2 text-xs">
 <div className="font-semibold">{s.name}</div>
 <div className="text-muted-foreground">
 {s.dose && <span>الجرعة: {s.dose}</span>}
 {s.timing && <span> | الموعد: {s.timing}</span>}
 </div>
 {s.purpose && <div className="mt-0.5 text-muted-foreground">الهدف: {s.purpose}</div>}
 </div>
 ))}
 </div>
 </div>
 )}
 {(content.health_notes?.length ?? 0) > 0 && (
 <div>
 <h4 className="mb-2 text-sm font-bold"> توصيات صحية خاصة</h4>
 <ul className="space-y-1 text-xs text-muted-foreground">
 {(content.health_notes ?? []).map((n, i) => (
 <li key={i} className="flex items-start gap-1.5">
 <span className="text-primary">•</span>
 <span>{n}</span>
 </li>
 ))}
 </ul>
 </div>
 )}
 {content.water_target && (
 <div className="text-xs">
 <span className="font-bold"> استهلاك الماء:</span> {content.water_target}
 </div>
 )}
 </div>
 )}

 {/* Meals — PDF-style with numbered items, alternatives, and per-meal totals */}
 {content.meals?.map((m, i: number) => (
 <div key={i} className="rounded-xl border border-border p-4">
 <div className="mb-2 flex items-center justify-between gap-2">
 <div>
 <h4 className="flex items-center gap-2 font-semibold"> {m.name}
 {isSwapPending("meal", planId, i) && (
 <span className="rounded-full bg-[#ff9500]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ff9500]">
 ⏳ {isAr ? "جارٍ التبديل" : "Swapping"}
 </span>
 )}
 </h4>
 {m.time && <p className="text-xs text-muted-foreground">{m.time}</p>}
 </div>
 <Button
 size="sm"
 variant="ghost"
 className="h-7 gap-1 px-2 text-xs text-primary hover:bg-primary/10"
 onClick={() => onSwap(i)}
 disabled={swapLoading === `meal-${planId}-${i}` || isSwapPending("meal", planId, i)}
 >
 {swapLoading === `meal-${planId}-${i}` || isSwapPending("meal", planId, i) ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <RefreshCw className="h-3.5 w-3.5" />
 )}
 {isSwapPending("meal", planId, i) ? (isAr ? "قيد الاستبدال" : "Swapping") : t("plan.swap")}
 </Button>
 </div>
 {/* NOTIF→PLAN 2026-10-24 (item 6): the table scrolls inside its own
     card on phones — never outside the modal. */}
 <div className="overflow-x-auto">
 <table className="w-full min-w-[520px] text-sm">
 <thead>
 <tr className="text-start">
 <th className="p-2 text-start font-medium text-muted-foreground w-8">#</th>
 <th className="p-2 text-start font-medium text-muted-foreground">{t("plan.food")}</th>
 <th className="p-2 text-start font-medium text-muted-foreground">{t("plan.amount")}</th>
 <th className="p-2 text-start font-medium text-muted-foreground">{t("plan.calories")}</th>
 <th className="p-2 text-start font-medium text-muted-foreground hidden md:table-cell">البدائل</th>
 </tr>
 </thead>
 <tbody>
 {m.items?.map((it, j: number) => (
 <tr key={j} className="border-t border-border/60">
 <td className="p-2 text-muted-foreground">{j + 1}</td>
 <td className="p-2 font-medium">{it.food}</td>
 <td className="p-2">{it.amount}</td>
 <td className="p-2">
 {it.calories}
 {it.protein_g && <span className="block text-[10px] text-muted-foreground"> {it.protein_g}جم</span>}
 </td>
 <td className="p-2 text-xs text-muted-foreground hidden md:table-cell">{it.alternatives || "—"}</td>
 </tr>
 ))}
 </tbody>
 {(m.total_calories || m.total_protein_g) && (
 <tfoot>
 <tr className="border-t-2 border-primary/30 bg-primary/5">
 <td colSpan={3} className="p-2 text-end font-semibold text-primary">
 {typeof m.total_calories === "number"
 ? `~${m.total_calories}`
 : `~${m.items?.reduce((s, i) => s + (i.calories || 0), 0) || 0}`} سعرة حرارية
 </td>
 <td className="p-2 font-semibold text-success">
 {m.total_protein_g ? `${m.total_protein_g} جم بروتين` : ""}
 </td>
 <td className="p-2 hidden md:table-cell"></td>
 </tr>
 </tfoot>
 )}
 </table>
 </div>
 {m.notes && <p className="mt-1 text-xs text-muted-foreground"> {m.notes}</p>}
 </div>
 ))}
 </div>
 );
}

function WorkoutContent({ content, onSwap, swapLoading, planId, isSwapPending }: { content: WorkoutPlanContent; onSwap: (d: number, e: number) => void; swapLoading: string | null; planId: string; isSwapPending: (kind: "meal" | "exercise", planId: string, i1: number, i2?: number) => boolean }) {
 const { t, lang } = useI18n();
 // BUNDLE LAW (2026-09-05): lazy mini records replace the 1.6MB array import.
 const EXERCISES = useExerciseLookup();
 const isAr = lang === "ar";
 return (
 <div className="space-y-4">
 {content.overview && <p className="text-sm text-muted-foreground">{content.overview}</p>}
 {content.days?.map((d, i: number) => (
 <div key={i} className="rounded-xl border border-border">
 <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
 <span className="font-semibold">{d.day}</span>
 <Badge variant="secondary">{d.focus}</Badge>
 </div>
 {/* Exercise list — card layout (responsive mobile + desktop) */}
 <div className="space-y-3">
 {d.exercises?.map((ex, j: number) => {
 // Find exercise in library to get both images
 const exLib = EXERCISES.find((e) => e.slug === ex.exerciseSlug || e.nameEn === ex.name || e.nameEn.toLowerCase() === ex.name?.toLowerCase());
 const exImages = exLib ? getExerciseImages(exLib.imageKey) : (ex.image ? [ex.image] : []);
 const exHref = ex.exerciseSlug ? `/exercises/${ex.exerciseSlug}` : (exLib ? `/exercises/${exLib.slug}` : null);
 return (
 <div key={j} className="rounded-2xl border border-border/60 bg-card p-3">
 {/* Two images ABOVE the text — like exercise library */}
 {exImages.length > 0 && (
 <div className="mb-3 grid grid-cols-2 gap-2">
 {exImages.slice(0, 2).map((url, idx: number) => (
 <div key={idx} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
 <ImageWithFallback
 src={url}
 alt={`${ex.name} ${idx + 1}`}
 fill
 className="object-contain"
 fallbackSrc={getFallbackSVG(exLib?.category || "default")}
 />
 </div>
 ))}
 </div>
 )}
 {/* Exercise name + notes */}
 <div className="mb-2">
 <p className="font-medium text-base">
 {exHref ? (
 <a href={exHref} className="text-primary hover:underline">{ex.name}</a>
 ) : ex.name}
 </p>
 {ex.notes && <p className="text-xs text-muted-foreground mt-0.5">{ex.notes}</p>}
 </div>
 {/* Sets / Reps / Rest — colored badges */}
 <div className="flex flex-wrap items-center gap-2">
 <span className="rounded-lg bg-[#0071e3]/10 px-3 py-1 text-sm font-semibold text-[#0071e3]">
 {ex.sets} {t("plan.sets")}
 </span>
 <span className="rounded-lg bg-[#34c759]/10 px-3 py-1 text-sm font-semibold text-[#34c759]">
 {ex.reps} {t("plan.reps")}
 </span>
 {ex.rest && (
 <span className="rounded-lg bg-[#ff9500]/10 px-3 py-1 text-sm font-semibold text-[#ff9500]">
 {ex.rest}
 </span>
 )}
 {isSwapPending("exercise", planId, i, j) && (
 <span className="rounded-lg bg-[#ff9500]/10 px-3 py-1 text-xs font-semibold text-[#ff9500]">
 ⏳ {isAr ? "جارٍ التبديل" : "Swapping"}
 </span>
 )}
 {/* PHASE 334 — W1-3b (audit A-04): the exercise swap button carries the
 meal-swap twin's exact label — an icon-only button had NO accessible name
 (WCAG 4.1.2); the label mirrors MealContent's button in every state. */}
 <Button
 size="sm"
 variant="ghost"
 className="ml-auto h-7 gap-1 px-2 text-xs text-primary hover:bg-primary/10"
 onClick={() => onSwap(i, j)}
 disabled={swapLoading === `ex-${planId}-${i}-${j}` || isSwapPending("exercise", planId, i, j)}
 >
 {swapLoading === `ex-${planId}-${i}-${j}` || isSwapPending("exercise", planId, i, j) ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <RefreshCw className="h-3.5 w-3.5" />
 )}
 {isSwapPending("exercise", planId, i, j) ? (isAr ? "قيد الاستبدال" : "Swapping") : t("plan.swap")}
 </Button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 );
}

function Stat({ label, value }: { label: string; value: string | number }) {
 return (
 <div className="rounded-xl border border-border bg-card p-3 text-center">
 <div className="font-display text-lg font-bold text-gradient">{value}</div>
 <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
 </div>
 );
}
