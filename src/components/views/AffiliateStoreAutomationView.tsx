"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Pause, Play, RefreshCw, ScanSearch, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHeader, SectionCard, StatTile, EmptyState } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * AFFILIATE-STORE AUTOMATION VIEW (Phase 529 — owner order 2026-11-27
 * «نفّذ مرحلة بناء منظومة الأتمتة والتسويق الداخلي»).
 *
 * The control panel behind /admin/affiliate-store/automation:
 *   - the master switch (تشغيل/إيقاف) + frequency (daily/weekly/monthly)
 *     + per-run cap;
 *   - the CREDENTIALS panel (booleans only — never values): the Amazon
 *     Creators API pair presence, the Associates tag, region/marketplace;
 *   - the fetch-categories table (keywords · target · active);
 *   - last run / next due + the RUN HISTORY (counters + error summary);
 *   - manual actions: RUN NOW (fetch) · LINKING SCAN;
 *   - the suggestions queue (approve / reject);
 *   - the ANALYTICS tab (impressions · clicks · CTR · top products ·
 *     top pages · category performance · zero-interaction products).
 */

type Settings = {
  is_enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  max_new_per_run: number;
  max_links_per_page: number;
  auto_link_enabled: boolean;
  link_score_threshold: number;
  last_run_at: string | null;
};

type Credentials = {
  credentialId: boolean;
  credentialSecret: boolean;
  associatesTag: boolean;
  region: string;
  marketplace: string;
};

type FetchCategory = {
  category_id: string;
  category_slug: string;
  category_name: string;
  main_name: string | null;
  product_count: number;
  keywords: string[];
  browse_node_id: string | null;
  target_count: number;
  is_active: boolean;
};

type RunRow = {
  id: string;
  trigger: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  candidates: number;
  inserted: number;
  updated: number;
  unchanged: number;
  rejected: number;
  hidden: number;
  error_summary: string | null;
};

type Suggestion = {
  id: string;
  page_type: string;
  page_slug: string;
  product_id: string;
  relevance_score: number;
  reason: string;
  anchor_phrase: string | null;
  status: string;
};

type InlineLink = {
  id: string;
  page_type: string;
  page_slug: string;
  product_id: string;
  anchor_phrase: string;
  is_active: boolean;
  source: string;
};

type Analytics = {
  windowDays: number;
  totals: { impressions: number; clicks: number; ctr: number | null };
  topProducts: Array<{
    productId: string; slug: string; title: string; brand: string | null;
    categorySlug: string; categoryName: string; impressions: number; clicks: number; ctr: number | null;
  }>;
  topSurfaces: Array<{
    surface: string; surfaceType: string; surfaceKey: string;
    impressions: number; clicks: number; ctr: number | null;
  }>;
  categories: Array<{
    categorySlug: string; categoryName: string; impressions: number;
    clicks: number; ctr: number | null; productsWithClicks: number;
  }>;
  zeroInteraction: Array<{
    productId: string; slug: string; title: string; impressions: number; clicks: number;
  }>;
  productsTracked: number;
};

type State = {
  settings: Settings;
  nextDueAt: string | null;
  credentials: Credentials;
  categories: FetchCategory[];
  runs: RunRow[];
  suggestions: Suggestion[];
  inlineLinks: InlineLink[];
  analytics: Analytics;
  daily: Array<{ day: string; impressions: number; clicks: number }>;
};

const TABS = [
  { key: "control", ar: "التحكم", en: "Control" },
  { key: "categories", ar: "فئات الجلب", en: "Fetch categories" },
  { key: "runs", ar: "سجل التشغيلات", en: "Run history" },
  { key: "suggestions", ar: "مقترحات الربط", en: "Link suggestions" },
  { key: "analytics", ar: "التحليلات", en: "Analytics" },
];

export function AffiliateStoreAutomationView() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [state, setState] = useState<State | null>(null);
  const [tab, setTab] = useState("control");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/affiliate-store/automation", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState((await res.json()) as State);
    } catch {
      toast.error(isAr ? "تعذر تحميل بيانات الأتمتة" : "Failed to load automation data");
    }
  }, [isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = useCallback(
    async (payload: Record<string, unknown>, busyKey: string, successMsg?: string) => {
      setBusy(busyKey);
      try {
        const res = await fetch("/api/admin/affiliate-store/automation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = (await res.json().catch(() => ({}))) as { error?: string; result?: unknown };
        if (!res.ok) {
          toast.error(body.error ?? (isAr ? "فشل الإجراء" : "Action failed"));
          return null;
        }
        toast.success(successMsg ?? (isAr ? "تم التنفيذ" : "Done"));
        await load();
        return body;
      } catch {
        toast.error(isAr ? "فشل الاتصال" : "Request failed");
        return null;
      } finally {
        setBusy(null);
      }
    },
    [isAr, load],
  );

  const credentialsOk = state?.credentials.credentialId && state?.credentials.credentialSecret;

  const lastRun = state?.runs?.[0] ?? null;
  const pendingSuggestions = useMemo(
    () => (state?.suggestions ?? []).filter((s) => s.status === "pending"),
    [state],
  );

  if (!state) {
    return (
      <div className="p-6 text-sm text-[#6e6e73]">
        {isAr ? "جارٍ التحميل…" : "Loading…"}
      </div>
    );
  }

  const s = state.settings;

  return (
    <div className="space-y-8 p-4 md:p-6">
      <PageHeader
        title={isAr ? "أتمتة المتجر والربط الداخلي" : "Store Automation & Internal Linking"}
        sub={
          isAr
            ? "منظومة جلب المنتجات من واجهة Amazon Creators الرسمية + الربط الذكي بالمحتوى الإنجليزي + التتبع والتحليلات — كل التحكم من هنا."
            : "The official Amazon Creators API fetch pipeline + smart EN-content linking + tracking & analytics — fully controlled from here."
        }
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/affiliate-store">
              {isAr ? "← لوحة المتجر" : "← Store dashboard"}
            </Link>
          </Button>
        }
      />

      {/* ── the master status strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label={isAr ? "حالة المنظومة" : "System"}
          value={s.is_enabled ? (isAr ? "تعمل" : "Active") : isAr ? "متوقفة" : "Paused"}
          tone={s.is_enabled ? "green" : "gray"}
        />
        <StatTile
          label={isAr ? "بيانات اعتماد Amazon" : "Amazon credentials"}
          value={credentialsOk ? (isAr ? "مُعدّة" : "Configured") : isAr ? "غير متوفرة" : "Missing"}
          tone={credentialsOk ? "green" : "red"}
        />
        <StatTile
          label={isAr ? "آخر تشغيلة" : "Last run"}
          value={s.last_run_at ? new Date(s.last_run_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", { month: "short", day: "numeric" }) : "—"}
          tone="blue"
        />
        <StatTile
          label={isAr ? "التشغيلة القادمة" : "Next due"}
          value={
            !s.is_enabled
              ? isAr ? "متوقفة" : "paused"
              : state.nextDueAt
                ? new Date(state.nextDueAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", { month: "short", day: "numeric" })
                : "—"
          }
          tone="orange"
        />
      </div>

      {/* ── the credentials honesty panel ───────────────────────── */}
      {!credentialsOk && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" aria-hidden="true" />
            {isAr ? "متطلب خارجي موثّق: بيانات اعتماد Amazon Creators API" : "Documented external requirement: Amazon Creators API credentials"}
          </div>
          {isAr ? (
            <p>
              نظام الجلب مبني بالكامل على الواجهة الرسمية (Amazon أوقفت PA-API 5.0 في 2026-05-15 وحلّت محلها Creators API). لتفعيله:
              (1) يجب أن يكون حساب Associates (ahmedzake-20) به 10 مبيعات مؤهلة خلال آخر 30 يومًا،
              (2) سجّل الوصول من Associates Central ← Tools ← Creators API وأنشئ Credential ID/Secret،
              (3) أضفهما كأسرار في المستودع: <code className="rounded bg-red-100 px-1 dark:bg-red-900/50">AMAZON_CREATORS_API_CREDENTIAL_ID</code> و<code className="rounded bg-red-100 px-1 dark:bg-red-900/50">AMAZON_CREATORS_API_SECRET</code>.
              حتى ذلك الحين تعمل المنظومة بوضع الخمول الصادق (تسجّل كل تشغيلة أن البيانات ناقصة — بلا بيانات وهمية إطلاقًا).
            </p>
          ) : (
            <p>
              The fetch pipeline is built entirely on the official interface (Amazon retired PA-API 5.0 on 2026-05-15; the Creators API is its successor). To activate:
              (1) the Associates account (ahmedzake-20) needs 10 qualifying sales in the trailing 30 days,
              (2) register API access in Associates Central → Tools → Creators API and issue a Credential ID/Secret,
              (3) add them as repo secrets: <code className="rounded bg-red-100 px-1 dark:bg-red-900/50">AMAZON_CREATORS_API_CREDENTIAL_ID</code> and <code className="rounded bg-red-100 px-1 dark:bg-red-900/50">AMAZON_CREATORS_API_SECRET</code>.
              Until then the system stays honestly dormant (every run records the missing-credentials state — zero mock data).
            </p>
          )}
        </div>
      )}

      {/* ── tabs ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
                : "border-[var(--edge)] text-[var(--muted-foreground)] hover:text-[var(--text)]",
            )}
          >
            {isAr ? t.ar : t.en}
            {t.key === "suggestions" && pendingSuggestions.length > 0 && (
              <span className="ms-1.5 rounded-full bg-[#ff9500] px-1.5 text-[10px] font-bold text-white">
                {pendingSuggestions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTROL ─────────────────────────────────────────────── */}
      {tab === "control" && (
        <div className="space-y-8">
          <SectionCard
            title={isAr ? "التحكم في الجلب الآلي" : "Automatic fetch control"}
            sub={isAr ? "التشغيل والإيقاف، الدورية، وسقف المنتجات الجديدة لكل تشغيلة." : "Run/pause, frequency, and the new-products cap per run."}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-[var(--edge)] bg-[var(--card)] p-4">
                <div>
                  <div className="font-semibold">{isAr ? "الجلب الآلي" : "Automatic fetch"}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    {s.is_enabled
                      ? isAr ? "الجدولة مسلّحة (07:17 UTC يوميًا + فحص الدورية)" : "Schedule armed (daily 07:17 UTC + frequency check)"
                      : isAr ? "متوقف مؤقتًا — لا تشغيلات تلقائية" : "Paused — no automatic runs"}
                  </div>
                </div>
                <Button
                  onClick={() =>
                    act(
                      { action: "settings", is_enabled: !s.is_enabled },
                      "toggle-enabled",
                      s.is_enabled
                        ? isAr ? "تم إيقاف الجلب الآلي" : "Automatic fetch paused"
                        : isAr ? "تم تشغيل الجلب الآلي" : "Automatic fetch enabled",
                    )
                  }
                  disabled={busy === "toggle-enabled"}
                  variant={s.is_enabled ? "destructive" : "default"}
                >
                  {s.is_enabled ? <Pause className="me-1 size-4" /> : <Play className="me-1 size-4" />}
                  {busy === "toggle-enabled" ? "…" : s.is_enabled ? (isAr ? "إيقاف مؤقت" : "Pause") : isAr ? "تشغيل" : "Enable"}
                </Button>
              </div>

              <div className="rounded-xl border border-[var(--edge)] bg-[var(--card)] p-4">
                <div className="mb-2 font-semibold">{isAr ? "دورية الجلب" : "Fetch frequency"}</div>
                <div className="flex gap-2">
                  {(["daily", "weekly", "monthly"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => act({ action: "settings", frequency: f }, `freq-${f}`)}
                      disabled={busy === `freq-${f}` || s.frequency === f}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        s.frequency === f
                          ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]"
                          : "border-[var(--edge)] hover:text-[var(--text)]",
                      )}
                    >
                      {f === "daily" ? (isAr ? "يومي" : "Daily") : f === "weekly" ? (isAr ? "أسبوعي" : "Weekly") : isAr ? "شهري" : "Monthly"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--edge)] bg-[var(--card)] p-4">
                <div className="mb-2 font-semibold">
                  {isAr ? "سقف المنتجات الجديدة لكل تشغيلة" : "Max new products per run"}
                  <span className="ms-2 text-sm font-normal text-[var(--muted-foreground)]">{s.max_new_per_run}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={s.max_new_per_run}
                  onChange={(e) => setState({ ...state, settings: { ...s, max_new_per_run: Number(e.target.value) } })}
                  onMouseUp={() => act({ action: "settings", max_new_per_run: s.max_new_per_run }, "cap")}
                  onTouchEnd={() => act({ action: "settings", max_new_per_run: s.max_new_per_run }, "cap")}
                  className="w-full"
                />
              </div>

              <div className="rounded-xl border border-[var(--edge)] bg-[var(--card)] p-4">
                <div className="mb-2 font-semibold">
                  {isAr ? "الربط الذكي الداخلي" : "Smart internal linking"}
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={s.auto_link_enabled}
                      onChange={(e) => act({ action: "settings", auto_link_enabled: e.target.checked }, "auto-link")}
                      disabled={busy === "auto-link"}
                      className="size-4"
                    />
                    {isAr ? "تطبيق المقترحات فوق العتبة تلقائيًا" : "Auto-apply suggestions above threshold"}
                  </label>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {isAr ? "العتبة" : "Threshold"}: {s.link_score_threshold}
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={s.link_score_threshold}
                  onChange={(e) => setState({ ...state, settings: { ...s, link_score_threshold: Number(e.target.value) } })}
                  onMouseUp={() => act({ action: "settings", link_score_threshold: s.link_score_threshold }, "threshold")}
                  onTouchEnd={() => act({ action: "settings", link_score_threshold: s.link_score_threshold }, "threshold")}
                  className="mt-2 w-full"
                />
                <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {isAr ? `سقف الروابط لكل صفحة: ${s.max_links_per_page}` : `Max links per page: ${s.max_links_per_page}`}
                </div>
              </div>
            </div>

            {/* manual actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={() => act({ action: "run-now" }, "run-now", isAr ? "انتهت التشغيلة اليدوية" : "Manual run finished")}
                disabled={busy === "run-now"}
              >
                <RefreshCw className={cn("me-1.5 size-4", busy === "run-now" && "animate-spin")} />
                {busy === "run-now" ? (isAr ? "جارٍ الجلب…" : "Fetching…") : isAr ? "تشغيل جلب يدوي الآن" : "Run fetch now"}
              </Button>
              <Button
                variant="outline"
                onClick={() => act({ action: "linking-scan" }, "scan", isAr ? "انتهت مسح الربط" : "Linking scan finished")}
                disabled={busy === "scan"}
              >
                <ScanSearch className={cn("me-1.5 size-4", busy === "scan" && "animate-pulse")} />
                {busy === "scan" ? (isAr ? "جارٍ المسح…" : "Scanning…") : isAr ? "مسح الربط الذكي الآن" : "Run linking scan now"}
              </Button>
            </div>
          </SectionCard>

          {/* last run summary */}
          <SectionCard title={isAr ? "آخر تشغيلة" : "Last run"} sub={lastRun ? new Date(lastRun.started_at).toLocaleString(isAr ? "ar-EG" : "en-US") : undefined}>
            {lastRun ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                <StatTile label={isAr ? "مرشح" : "Candidates"} value={lastRun.candidates} tone="blue" />
                <StatTile label={isAr ? "مضافة" : "Inserted"} value={lastRun.inserted} tone="green" />
                <StatTile label={isAr ? "محدثة" : "Updated"} value={lastRun.updated} tone="green" />
                <StatTile label={isAr ? "مرفوضة" : "Rejected"} value={lastRun.rejected} tone="orange" />
                <StatTile label={isAr ? "مخفية" : "Hidden"} value={lastRun.hidden} tone="red" />
                <StatTile
                  label={isAr ? "الحالة" : "Status"}
                  value={lastRun.status}
                  tone={lastRun.status === "succeeded" ? "green" : lastRun.status === "failed" ? "red" : "orange"}
                />
                {lastRun.error_summary && (
                  <p className="col-span-full rounded-lg border border-[var(--edge)] bg-[var(--card)] p-3 text-xs text-[var(--muted-foreground)]">
                    {lastRun.error_summary}
                  </p>
                )}
              </div>
            ) : (
              <EmptyState text={isAr ? "لم تُنفَّذ أي تشغيلة بعد." : "No runs recorded yet."} />
            )}
          </SectionCard>
        </div>
      )}

      {/* ── CATEGORIES ──────────────────────────────────────────── */}
      {tab === "categories" && (
        <SectionCard
          title={isAr ? "فئات الجلب" : "Fetch categories"}
          sub={isAr ? "الكلمات المفتاحية والعدد المستهدف لكل فئة — الفئات النشطة فقط تُجلب." : "Keywords and target count per category — only active categories are fetched."}
        >
          <div className="overflow-x-auto rounded-xl border border-[var(--edge)]">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[var(--muted)]/50 text-start">
                <tr>
                  <th className="p-3 text-start font-medium">{isAr ? "الفئة" : "Category"}</th>
                  <th className="p-3 text-start font-medium">{isAr ? "الكلمات المفتاحية" : "Keywords"}</th>
                  <th className="p-3 text-start font-medium">{isAr ? "المنتجات" : "Products"}</th>
                  <th className="p-3 text-start font-medium">{isAr ? "الهدف" : "Target"}</th>
                  <th className="p-3 text-start font-medium">{isAr ? "نشطة" : "Active"}</th>
                </tr>
              </thead>
              <tbody>
                {state.categories.map((c) => (
                  <tr key={c.category_id} className="border-t border-[var(--edge)]">
                    <td className="p-3">
                      <div className="font-medium">{c.category_name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{c.main_name}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {c.keywords.map((k) => (
                          <Badge key={k} variant="secondary" className="text-xs font-normal">{k}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">{c.product_count}</td>
                    <td className="p-3">{c.target_count}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() =>
                          act(
                            { action: "category-config", category_id: c.category_id, is_active: !c.is_active },
                            `cat-${c.category_id}`,
                          )
                        }
                        disabled={busy === `cat-${c.category_id}`}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                          c.is_active ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                        )}
                      >
                        {c.is_active ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                        {c.is_active ? (isAr ? "نعم" : "Yes") : isAr ? "لا" : "No"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── RUNS ────────────────────────────────────────────────── */}
      {tab === "runs" && (
        <SectionCard
          title={isAr ? "سجل التشغيلات" : "Run history"}
          sub={isAr ? "كل تشغيلة بنتائجها وأخطائها (قفل منع التداخل يضمن عدم تكرار التنفيذ)." : "Every run with its results and errors (the overlap lock prevents double execution)."}
        >
          {state.runs.length === 0 ? (
            <EmptyState text={isAr ? "لا تشغيلات مسجلة بعد." : "No runs recorded yet."} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--edge)]">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-[var(--muted)]/50">
                  <tr>
                    <th className="p-3 text-start font-medium">{isAr ? "الوقت (UTC)" : "Started (UTC)"}</th>
                    <th className="p-3 text-start font-medium">{isAr ? "المصدر" : "Trigger"}</th>
                    <th className="p-3 text-start font-medium">{isAr ? "الحالة" : "Status"}</th>
                    <th className="p-3 text-start font-medium">{isAr ? "مضافة" : "Ins"}</th>
                    <th className="p-3 text-start font-medium">{isAr ? "محدثة" : "Upd"}</th>
                    <th className="p-3 text-start font-medium">{isAr ? "مرفوضة" : "Rej"}</th>
                    <th className="p-3 text-start font-medium">{isAr ? "مخفية" : "Hid"}</th>
                    <th className="p-3 text-start font-medium">{isAr ? "ملاحظات" : "Notes"}</th>
                  </tr>
                </thead>
                <tbody>
                  {state.runs.map((r) => (
                    <tr key={r.id} className="border-t border-[var(--edge)]">
                      <td className="p-3 whitespace-nowrap">{r.started_at.replace("T", " ").slice(0, 19)}</td>
                      <td className="p-3">{r.trigger}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            r.status === "succeeded" && "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
                            r.status === "failed" && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
                            (r.status === "partial" || r.status === "running") && "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
                            r.status === "skipped" && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3">{r.inserted}</td>
                      <td className="p-3">{r.updated}</td>
                      <td className="p-3">{r.rejected}</td>
                      <td className="p-3">{r.hidden}</td>
                      <td className="max-w-[260px] truncate p-3 text-xs text-[var(--muted-foreground)]" title={r.error_summary ?? ""}>
                        {r.error_summary ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── SUGGESTIONS ─────────────────────────────────────────── */}
      {tab === "suggestions" && (
        <div className="space-y-8">
          <SectionCard
            title={isAr ? "مقترحات الربط الذكي" : "Smart-linking suggestions"}
            sub={isAr ? "المنتجات المرشحة لكل صفحة إنجليزية بدرجة صلة حقيقية — وافق أو ارفض (فوق العتبة تُطبق تلقائيًا إن كان التطبيق الآلي مفعلاً)." : "Products proposed per EN page with a real relevance score — approve or reject (above-threshold items auto-apply when enabled)."}
          >
            {pendingSuggestions.length === 0 ? (
              <EmptyState text={isAr ? "لا مقترحات معلقة — شغّل مسح الربط لتوليد المزيد." : "No pending suggestions — run the linking scan to generate more."} />
            ) : (
              <div className="space-y-2">
                {pendingSuggestions.slice(0, 30).map((sg) => (
                  <div key={sg.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--edge)] bg-[var(--card)] p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Badge variant="outline">{sg.page_type}</Badge>
                        <span className="truncate">{sg.page_slug}</span>
                        <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-bold text-[var(--text)]">
                          {Math.round(sg.relevance_score)}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                        {sg.reason}
                        {sg.anchor_phrase ? ` · anchor: "${sg.anchor_phrase}"` : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => act({ action: "approve-link", id: sg.id }, `appr-${sg.id}`)} disabled={busy === `appr-${sg.id}`}>
                        {isAr ? "اعتماد" : "Approve"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => act({ action: "reject-link", id: sg.id }, `rej-${sg.id}`)} disabled={busy === `rej-${sg.id}`}>
                        {isAr ? "رفض" : "Reject"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={isAr ? "الروابط المطبقة" : "Applied inline links"}
            sub={isAr ? "الروابط الحية داخل صفحات المحتوى الإنجليزي (تُخفى تلقائيًا عند إخفاء المنتج)." : "Live links inside EN content pages (auto-hidden when the product hides)."}
          >
            {state.inlineLinks.length === 0 ? (
              <EmptyState text={isAr ? "لا روابط مطبقة بعد." : "No applied links yet."} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--edge)]">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="bg-[var(--muted)]/50">
                    <tr>
                      <th className="p-3 text-start font-medium">{isAr ? "الصفحة" : "Page"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "نص الرابط" : "Anchor"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "المصدر" : "Source"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "نشط" : "Active"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "إجراء" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.inlineLinks.slice(0, 40).map((l) => (
                      <tr key={l.id} className="border-t border-[var(--edge)]">
                        <td className="p-3">
                          <Badge variant="outline" className="me-1.5">{l.page_type}</Badge>
                          {l.page_slug}
                        </td>
                        <td className="p-3">{l.anchor_phrase}</td>
                        <td className="p-3">{l.source}</td>
                        <td className="p-3">{l.is_active ? "✓" : "—"}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {l.is_active && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => act({ action: "repair-inline-link", id: l.id }, `rep-${l.id}`)}
                                disabled={busy === `rep-${l.id}`}
                                title={isAr ? "أعد حساب المرساة من متن المقال القابل للعرض (يعطّل الرابط إن لم توجد مرساة صالحة)" : "Recompute the anchor from the article's renderable body (deactivates the link if no valid anchor exists)"}
                              >
                                {busy === `rep-${l.id}` ? "…" : isAr ? "إصلاح المرساة" : "Repair anchor"}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => act({ action: "toggle-link", id: l.id, active: !l.is_active }, `tog-${l.id}`)}
                              disabled={busy === `tog-${l.id}`}
                            >
                              {l.is_active ? (isAr ? "تعطيل" : "Deactivate") : isAr ? "تنشيط" : "Activate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── ANALYTICS ───────────────────────────────────────────── */}
      {tab === "analytics" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label={isAr ? "الانطباعات (النافذة)" : "Impressions (window)"} value={state.analytics.totals.impressions.toLocaleString("en-US")} tone="blue" />
            <StatTile label={isAr ? "النقرات" : "Clicks"} value={state.analytics.totals.clicks.toLocaleString("en-US")} tone="green" />
            <StatTile label={isAr ? "معدل النقر" : "CTR" } value={state.analytics.totals.ctr !== null ? `${state.analytics.totals.ctr}%` : "—"} tone="orange" />
            <StatTile label={isAr ? "منتجات متتبعة" : "Products tracked"} value={state.analytics.productsTracked} tone="gray" />
          </div>

          {/* daily strip */}
          <SectionCard title={isAr ? "آخر 14 يومًا" : "Last 14 days"} sub={isAr ? "الانطباعات مقابل النقرات يوميًا." : "Impressions vs clicks per day."}>
            <div className="flex h-32 items-end gap-1">
              {state.daily.map((d) => {
                const max = Math.max(...state.daily.map((x) => x.impressions), 1);
                return (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-0.5" title={`${d.day}: ${d.impressions} impr / ${d.clicks} clicks`}>
                    <div className="w-full rounded-t bg-[#0071e3]" style={{ height: `${Math.max((d.impressions / max) * 100, 2)}%` }} />
                    {d.clicks > 0 && <div className="w-full rounded-b bg-[#34c759]" style={{ height: `${Math.min((d.clicks / max) * 100 + 4, 30)}%` }} />}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-[#0071e3]" /> {isAr ? "انطباعات" : "impressions"}</span>
              <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-[#34c759]" /> {isAr ? "نقرات" : "clicks"}</span>
            </div>
          </SectionCard>

          <SectionCard title={isAr ? "المنتجات الأكثر جذبًا للنقرات" : "Top products by clicks"}>
            {state.analytics.topProducts.length === 0 ? (
              <EmptyState text={isAr ? "لا بيانات بعد — تبدأ اللوحة بالتعبئة مع أول زوار." : "No data yet — the dashboard fills with the first visitors."} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--edge)]">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="bg-[var(--muted)]/50">
                    <tr>
                      <th className="p-3 text-start font-medium">{isAr ? "المنتج" : "Product"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "الفئة" : "Category"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "انطباعات" : "Impr"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "نقرات" : "Clicks"}</th>
                      <th className="p-3 text-start font-medium">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.analytics.topProducts.map((p) => (
                      <tr key={p.productId} className="border-t border-[var(--edge)]">
                        <td className="max-w-[280px] truncate p-3 font-medium">{p.title}</td>
                        <td className="p-3 text-xs text-[var(--muted-foreground)]">{p.categoryName}</td>
                        <td className="p-3">{p.impressions}</td>
                        <td className="p-3 font-semibold">{p.clicks}</td>
                        <td className="p-3">{p.ctr !== null ? `${p.ctr}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title={isAr ? "الصفحات الأكثر تحقيقًا للنقرات" : "Top pages by clicks"}>
            {state.analytics.topSurfaces.length === 0 ? (
              <EmptyState text="—" />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--edge)]">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="bg-[var(--muted)]/50">
                    <tr>
                      <th className="p-3 text-start font-medium">{isAr ? "السطح" : "Surface"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "انطباعات" : "Impr"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "نقرات" : "Clicks"}</th>
                      <th className="p-3 text-start font-medium">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.analytics.topSurfaces.map((sf) => (
                      <tr key={sf.surface} className="border-t border-[var(--edge)]">
                        <td className="p-3 font-mono text-xs">{sf.surface}</td>
                        <td className="p-3">{sf.impressions}</td>
                        <td className="p-3 font-semibold">{sf.clicks}</td>
                        <td className="p-3">{sf.ctr !== null ? `${sf.ctr}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title={isAr ? "أداء التصنيفات" : "Category performance"}>
            {state.analytics.categories.length === 0 ? (
              <EmptyState text="—" />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--edge)]">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="bg-[var(--muted)]/50">
                    <tr>
                      <th className="p-3 text-start font-medium">{isAr ? "التصنيف" : "Category"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "انطباعات" : "Impr"}</th>
                      <th className="p-3 text-start font-medium">{isAr ? "نقرات" : "Clicks"}</th>
                      <th className="p-3 text-start font-medium">CTR</th>
                      <th className="p-3 text-start font-medium">{isAr ? "منتجات بنقرات" : "Products w/ clicks"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.analytics.categories.map((c) => (
                      <tr key={c.categorySlug} className="border-t border-[var(--edge)]">
                        <td className="p-3">{c.categoryName}</td>
                        <td className="p-3">{c.impressions}</td>
                        <td className="p-3 font-semibold">{c.clicks}</td>
                        <td className="p-3">{c.ctr !== null ? `${c.ctr}%` : "—"}</td>
                        <td className="p-3">{c.productsWithClicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={isAr ? "منتجات بلا أي تفاعل" : "Zero-interaction products"}
            sub={isAr ? "انطباعات ≥ 20 وصفر نقرات — مرشحة للاستبدال أو إعادة الصياغة." : "≥20 impressions, zero clicks — candidates for replacement or re-editing."}
          >
            {state.analytics.zeroInteraction.length === 0 ? (
              <EmptyState text={isAr ? "لا شيء تحت العتبة — كل المنتجات المتتبعة تحقق تفاعلًا أو انطباعات قليلة." : "Nothing above the floor — every tracked product engages or has low impressions."} />
            ) : (
              <ul className="space-y-1 text-sm">
                {state.analytics.zeroInteraction.map((p) => (
                  <li key={p.productId} className="flex items-center justify-between rounded-lg border border-[var(--edge)] px-3 py-2">
                    <span className="max-w-[70%] truncate">{p.title}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{p.impressions} impr · 0 clicks</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
