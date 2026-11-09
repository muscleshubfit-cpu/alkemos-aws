"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  UtensilsCrossed,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  EyeOff,
  Eye,
  ExternalLink,
  Heart,
} from "lucide-react";
import { toast } from "sonner";

/**
 * RECIPES-ADMIN-VIEW — the /admin/recipes dashboard
 * (HEALTHY-RECIPES-PLATFORM plan §11-10 — the BlogAdminView pattern).
 *
 * What the owner sees (the owner's «لوحة متابعة» requirements, §13):
 *   - Stat tiles: pairs / published / held / failed / in-production /
 *     favorites + last-30-days counts.
 *   - The circuit-breaker strip (3 consecutive failed days = tripped).
 *   - The production queue (status, day, error, rerun target) with the
 *     REQUEUE action (the repair contract — plan §6.3).
 *   - The pairs table with ATOMIC unpublish (both versions together,
 *     reason recorded — §11-9) and republish (the RPC re-verifies).
 */

type Stats = {
  totalPairs: number;
  published: number;
  held: number;
  failed: number;
  inProduction: number;
  last30Days: { published: number; held: number; failed: number };
  favoritesTotal: number;
  queueOpen: number;
};

type QueueRow = {
  id: string;
  status: string;
  scheduled_for: string | null;
  error_message: string | null;
  rerun_target: string | null;
  created_at: string;
  published_at: string | null;
};

type RecipeRow = {
  id: string;
  pair_slug: string;
  title_ar: string | null;
  title_en: string | null;
  status: string;
  published_at: string | null;
  verification_status: string;
};

type Payload = {
  stats: Stats;
  queue: QueueRow[];
  recipes: RecipeRow[];
  health: { breakerTripped: boolean; consecutiveFailureDays: number };
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  held: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
  in_production: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  verified: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export function RecipesAdminView() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/recipes");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as Payload);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(body: Record<string, unknown>, key: string) {
    setBusyId(key);
    try {
      const res = await fetch("/api/admin/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? (isAr ? "فشل الإجراء" : "Action failed"));
        return;
      }
      toast.success(isAr ? "تم ✅" : "Done ✅");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "action failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
        <RefreshCw className="mb-2 h-6 w-6 animate-spin text-primary" />
        {isAr ? "جارٍ التحميل..." : "Loading..."}
      </div>
    );
  }

  const s = data?.stats;
  const statCards = [
    { label: isAr ? "أزواج الوصفات" : "Pairs", value: s?.totalPairs ?? 0, icon: UtensilsCrossed, color: "text-blue-500" },
    { label: isAr ? "منشورة" : "Published", value: s?.published ?? 0, icon: CheckCircle2, color: "text-emerald-500" },
    { label: isAr ? "محجوزة" : "Held", value: s?.held ?? 0, icon: AlertTriangle, color: "text-orange-500" },
    { label: isAr ? "فاشلة" : "Failed", value: s?.failed ?? 0, icon: XCircle, color: "text-red-500" },
    { label: isAr ? "قيد الإنتاج" : "In production", value: s?.inProduction ?? 0, icon: Loader2, color: "text-blue-500" },
    { label: isAr ? "مفضلات" : "Favorites", value: s?.favoritesTotal ?? 0, icon: Heart, color: "text-pink-500" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {isAr ? "إدارة الوصفات الصحية" : "Recipes Admin"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr
              ? "خط الإنتاج اليومي الثنائي — المتابعة والإصلاح وإلغاء النشر الذري"
              : "The daily bilingual pipeline — monitoring, repair, and atomic unpublish"}
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {isAr ? "تحديث" : "Refresh"}
        </button>
      </div>

      {/* Circuit-breaker strip */}
      {data?.health.breakerTripped ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
          {isAr
            ? `⛔ قاطع الدارة مُفعَّل — ${data.health.consecutiveFailureDays} أيام فشل متتالية. النشر موقوف تلقائيًا (الوضع held-only) حتى المعالجة.`
            : `⛔ Circuit breaker TRIPPED — ${data.health.consecutiveFailureDays} consecutive failed days. Publishing is auto-paused (held-only) until resolved.`}
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          {isAr
            ? `✓ قاطع الدارة سليم (سجل الفشل المتتالي الحالي: ${data?.health.consecutiveFailureDays ?? 0})`
            : `✓ Circuit breaker healthy (current failure streak: ${data?.health.consecutiveFailureDays ?? 0})`}
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className="mt-1.5 text-2xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Last 30 days */}
      <p className="text-sm text-muted-foreground">
        {isAr ? "آخر 30 يومًا:" : "Last 30 days:"}{" "}
        <strong className="text-emerald-600 dark:text-emerald-400">
          {s?.last30Days.published ?? 0} {isAr ? "منشور" : "published"}
        </strong>{" · "}
        <strong className="text-orange-600 dark:text-orange-400">
          {s?.last30Days.held ?? 0} {isAr ? "محجوز" : "held"}
        </strong>{" · "}
        <strong className="text-red-600 dark:text-red-400">
          {s?.last30Days.failed ?? 0} {isAr ? "فاشل" : "failed"}
        </strong>
      </p>

      {/* Queue */}
      <section className="rounded-xl border border-border/60 bg-card">
        <h2 className="border-b border-border/60 px-4 py-3 text-sm font-semibold text-foreground">
          {isAr ? "طابور الإنتاج (آخر 40 صفًا)" : "Production queue (last 40 rows)"}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-start text-xs text-muted-foreground">
                <th className="px-4 py-2 text-start font-medium">{isAr ? "الحالة" : "Status"}</th>
                <th className="px-4 py-2 text-start font-medium">{isAr ? "اليوم المجدول" : "Scheduled"}</th>
                <th className="px-4 py-2 text-start font-medium">{isAr ? "إعادة التشغيل" : "Rerun"}</th>
                <th className="px-4 py-2 text-start font-medium">{isAr ? "السبب / الخطأ" : "Reason / error"}</th>
                <th className="px-4 py-2 text-start font-medium">{isAr ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.queue ?? []).map((q) => (
                <tr key={q.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5"><StatusBadge status={q.status} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{q.scheduled_for ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{q.rerun_target ?? "—"}</td>
                  <td className="max-w-[320px] truncate px-4 py-2.5 text-muted-foreground" title={q.error_message ?? ""}>
                    {q.error_message ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {(q.status === "held" || q.status === "failed") && q.rerun_target ? (
                      <button
                        onClick={() =>
                          void act({ action: "requeue", queueId: q.id }, `q-${q.id}`)
                        }
                        disabled={busyId === `q-${q.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/20 disabled:opacity-50 dark:text-blue-400"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {isAr ? "إعادة طابور" : "Requeue"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {(data?.queue.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {isAr ? "الطابور فارغ — لم يبدأ خط الإنتاج بعد" : "Queue is empty — the pipeline has not run yet"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pairs */}
      <section className="rounded-xl border border-border/60 bg-card">
        <h2 className="border-b border-border/60 px-4 py-3 text-sm font-semibold text-foreground">
          {isAr ? "أزواج الوصفات (آخر 60)" : "Recipe pairs (last 60)"}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs text-muted-foreground">
                <th className="px-4 py-2 text-start font-medium">{isAr ? "الزوج" : "Pair"}</th>
                <th className="px-4 py-2 text-start font-medium">{isAr ? "العنوان (ع/إ)" : "Title (AR/EN)"}</th>
                <th className="px-4 py-2 text-start font-medium">{isAr ? "الحالة" : "Status"}</th>
                <th className="px-4 py-2 text-start font-medium">{isAr ? "النشر" : "Published"}</th>
                <th className="px-4 py-2 text-start font-medium">{isAr ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recipes ?? []).map((r) => (
                <tr key={r.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.pair_slug}</td>
                  <td className="max-w-[280px] truncate px-4 py-2.5">
                    <span className="block truncate" dir="rtl">{r.title_ar ?? "—"}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.title_en ?? "—"}</span>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {r.published_at ? new Date(r.published_at).toISOString().slice(0, 10) : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {r.status === "published" ? (
                        <>
                          <a
                            href={`/recipes/${r.pair_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
                          >
                            <ExternalLink className="h-3 w-3" />
                            EN
                          </a>
                          <a
                            href={`/ar/recipes/${r.pair_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
                          >
                            <ExternalLink className="h-3 w-3" />
                            AR
                          </a>
                          <button
                            onClick={() => {
                              const reason = prompt(
                                isAr ? "سبب إلغاء النشر (يُسجَّل):" : "Unpublish reason (recorded):",
                              );
                              if (reason === null) return;
                              void act(
                                { action: "unpublish", recipeId: r.id, reason },
                                `r-${r.id}`,
                              );
                            }}
                            disabled={busyId === `r-${r.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
                          >
                            <EyeOff className="h-3 w-3" />
                            {isAr ? "إلغاء النشر" : "Unpublish"}
                          </button>
                        </>
                      ) : r.verification_status === "passed" ? (
                        <button
                          onClick={() => void act({ action: "republish", recipeId: r.id }, `r-${r.id}`)}
                          disabled={busyId === `r-${r.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
                        >
                          <Eye className="h-3 w-3" />
                          {isAr ? "إعادة النشر" : "Republish"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.recipes.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {isAr ? "لا أزواج بعد — سينشئ خط الإنتاج أول زوج يوم التشغيل الأول" : "No pairs yet — the pipeline creates the first pair on its first run"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
