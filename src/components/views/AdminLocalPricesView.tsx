"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, TrendingDown, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHeader, SectionCard, fmtMoney, fmtDate } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * ADMIN LOCAL PRICES VIEW (0104 LOCAL-PAYMENT-EGP — owner order
 * 2026-11-05). The editor behind /admin/local-prices for the EGP twins
 * the manual Egyptian rails (InstaPay / Vodafone Cash) display at
 * checkout: «$14.99 أو 830 جنيه مصري».
 *
 * WHAT THE ADMIN SEES (all persisted facts — zero invention):
 *   - The mode banner: auto (default — the daily 06:47 UTC job recomputes
 *     every row from memberships.ts × the stored rate) or manual (hand-set
 *     values are protected; the daily run stores the rate but never
 *     overwrites the rows).
 *   - The LAST SUCCESSFUL rate + its date (the one actually serving), and
 *     the honest update log (successes AND failures).
 *   - The product matrix: USD (from the price sources, read-only) × the
 *     EGP twin (editable), provenance badge, update stamps.
 *
 * WHAT THE ADMIN CAN DO (requireAdmin route — the tables accept NO
 * browser writes at all):
 *   - Edit one EGP price → set_price → the row becomes 'manual' AND the
 *     mode flips to 'manual' (the protection the owner ordered: tomorrow's
 *     run cannot clobber it). The first edit explains the flip.
 *   - Back to auto → set_auto → every row recomputes IMMEDIATELY from the
 *     STORED rate (no ExchangeRate-API call — one request per day stays
 *     true) and the mode returns to auto.
 */

type ProductRow = {
  plan_tier: string;
  duration_months: number;
  usd: number;
  name_ar: string;
  name_en: string;
  price_egp: number | null;
  source: "auto" | "manual" | null;
  updated_at: string | null;
};

type LogRow = {
  rate_date: string;
  usd_to_egp: number | null;
  status: "success" | "failure";
  error: string | null;
  fetched_at: string;
};

type AdminLocalPricesState = {
  products: ProductRow[];
  mode: "auto" | "manual";
  mode_updated_at: string | null;
  rate: { usd_to_egp: number; rate_date: string; fetched_at: string } | null;
  log: LogRow[];
  scheduledUpdateUtc: string;
};

export function AdminLocalPricesView() {
  const { lang } = useI18n();
  const isAr = lang === "ar";

  const [state, setState] = useState<AdminLocalPricesState | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [backToAutoBusy, setBackToAutoBusy] = useState(false);
  // Drafts per product key ("planTier::months") — string inputs, parsed
  // on save (an empty/garbage draft never reaches the API).
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/local-prices", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as AdminLocalPricesState;
      setState(data);
      setDrafts({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : isAr ? "فشل التحميل" : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const key = (p: { plan_tier: string; duration_months: number }) =>
    `${p.plan_tier}::${p.duration_months}`;

  const draftFor = (p: ProductRow) => drafts[key(p)] ?? (p.price_egp !== null ? String(p.price_egp) : "");

  const dirtyKeys = useMemo(() => {
    if (!state) return new Set<string>();
    const dirty = new Set<string>();
    for (const p of state.products) {
      const draft = drafts[key(p)];
      if (draft === undefined) continue;
      const current = p.price_egp !== null ? String(p.price_egp) : "";
      if (draft !== current) dirty.add(key(p));
    }
    return dirty;
  }, [state, drafts]);

  const savePrice = async (p: ProductRow) => {
    const raw = draftFor(p).trim();
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error(
        isAr ? "أدخل قيمة جنيه صحيحة أكبر من صفر" : "Enter a valid EGP amount greater than zero",
      );
      return;
    }
    // The protection flip, explained BEFORE the first manual save: a
    // hand-set value switches the mode to manual so the next daily run
    // cannot overwrite it (one click brings auto back).
    const ok = window.confirm(
      isAr
        ? "سيُحوَّل النظام إلى الوضع اليدوي لحماية هذا السعر من التحديث اليومي التالي. المواصلة؟"
        : "This switches the system to MANUAL mode so tomorrow's daily update cannot overwrite the hand-set value. Continue?",
    );
    if (!ok) return;
    setSavingKey(key(p));
    try {
      const res = await fetch("/api/admin/local-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_price",
          planTier: p.plan_tier,
          durationMonths: p.duration_months,
          priceEgp: parsed,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      toast.success(isAr ? "تم حفظ السعر (وضع يدوي)" : "Price saved (manual mode)");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : isAr ? "فشل الحفظ" : "Save failed");
    } finally {
      setSavingKey(null);
    }
  };

  const backToAuto = async () => {
    const ok = window.confirm(
      isAr
        ? "العودة للوضع التلقائي ستُعيد حساب كل الأسعار الآن من آخر سعر صرف ناجح مخزّن (بلا طلب API جديد). المواصلة؟"
        : "Back to AUTO recomputes every price NOW from the last successful stored rate (no new API request). Continue?",
    );
    if (!ok) return;
    setBackToAutoBusy(true);
    try {
      const res = await fetch("/api/admin/local-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_auto" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        recomputed?: number;
      };
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      toast.success(
        isAr
          ? `الوضع التلقائي فعّال — أُعيد حساب ${data.recomputed ?? 0} سعرًا من آخر سعر مخزّن`
          : `Auto mode active — ${data.recomputed ?? 0} prices recomputed from the stored rate`,
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : isAr ? "فشل التبديل" : "Switch failed");
    } finally {
      setBackToAutoBusy(false);
    }
  };

  if (loading && !state) {
    return (
      <div className="py-20 text-center text-base font-normal text-[#6e6e73]">
        {isAr ? "جارٍ التحميل…" : "Loading…"}
      </div>
    );
  }
  if (!state) {
    return (
      <div className="py-20 text-center text-base font-normal text-[#6e6e73]">
        {isAr ? "تعذّر تحميل الأسعار المحلية" : "Could not load local prices"}
      </div>
    );
  }

  const manualCount = state.products.filter((p) => p.source === "manual").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "الأسعار المحلية (الجنيه المصري)" : "Local prices (EGP)"}
        sub={
          isAr
            ? "أسعار الجنيه المعروضة بجانب الدولار في الدفع اليدوي (إنستاباي / فودافون كاش) — «$14.99 أو 830 جنيه مصري». PayPal بالدولار فقط ولا يُمس."
            : "The EGP prices shown next to USD on the manual rails (InstaPay / Vodafone Cash) — “$14.99 or 830 EGP”. PayPal stays USD-only and untouched."
        }
        actions={
          <div className="flex items-center gap-2">
            {dirtyKeys.size > 0 && (
              <Badge variant="secondary">
                {isAr ? `${dirtyKeys.size} تغيير غير محفوظ` : `${dirtyKeys.size} unsaved`}
              </Badge>
            )}
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
              <RefreshCw className="h-4 w-4 rtl:rotate-180" />
              {isAr ? "تحديث" : "Reload"}
            </Button>
            {state.mode === "manual" && (
              <Button type="button" size="sm" disabled={backToAutoBusy || dirtyKeys.size > 0} onClick={() => void backToAuto()}>
                {backToAutoBusy ? (
                  isAr ? "جارٍ التبديل…" : "Switching…"
                ) : (
                  isAr ? "العودة للوضع التلقائي" : "Back to auto"
                )}
              </Button>
            )}
          </div>
        }
      />

      {/* Mode + rate status banner */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border p-5 text-sm",
          state.mode === "auto"
            ? "border-[#34c759]/20 bg-[#34c759]/5"
            : "border-[#ff9500]/30 bg-[#ff9500]/5",
        )}
      >
        <div className="flex items-center gap-2">
          {state.mode === "auto" ? (
            <TrendingUp className="h-5 w-5 text-[#34c759]" />
          ) : (
            <TrendingDown className="h-5 w-5 text-[#ff9500]" />
          )}
          <span className="font-medium">
            {state.mode === "auto"
              ? isAr
                ? "الوضع التلقائي (الافتراضي)"
                : "Auto mode (default)"
              : isAr
                ? "الوضع اليدوي — قيمك محمية من التحديث اليومي"
                : "Manual mode — your values are protected from the daily update"}
          </span>
        </div>
        <span className="text-[#6e6e73]">
          {isAr ? "آخر تحديث تلقائي ناجح:" : "Last successful update:"}{" "}
          {state.rate
            ? `${state.rate.usd_to_egp} EGP/USD · ${state.rate.rate_date}`
            : isAr
              ? "لا يوجد بعد"
              : "none yet"}
        </span>
        <span className="text-[#6e6e73]">
          {isAr ? "التحديث اليومي:" : "Daily update:"} {state.scheduledUpdateUtc}
        </span>
        {manualCount > 0 && (
          <Badge variant="outline">
            {isAr ? `${manualCount} سعر يدوي` : `${manualCount} manual`}
          </Badge>
        )}
      </div>

      {/* Product matrix */}
      <SectionCard
        title={isAr ? "مصفوفة الأسعار (الدولار من المصدر — الجنيه للتعديل)" : "Price matrix (USD from source — EGP editable)"}
        sub={
          isAr
            ? "الدولار يُقرأ من memberships.ts/plans.ts (للقراءة فقط — نفس مصدر PayPal). أي تعديل يدوي يحمي القيمة من التحديث اليومي القادم."
            : "USD is read from memberships.ts/plans.ts (read-only — the same source PayPal uses). Any manual edit protects the value from the next daily update."
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-[#f2f2f7]">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-[#f5f5f7]">
                <th className="px-4 py-3 text-start font-medium">{isAr ? "المنتج" : "Product"}</th>
                <th className="px-4 py-3 text-start font-medium">{isAr ? "المدة" : "Duration"}</th>
                <th className="px-4 py-3 text-start font-medium">{isAr ? "السعر (USD)" : "USD price"}</th>
                <th className="px-4 py-3 text-start font-medium">{isAr ? "السعر (EGP)" : "EGP price"}</th>
                <th className="px-4 py-3 text-start font-medium">{isAr ? "المصدر" : "Source"}</th>
                <th className="px-4 py-3 text-start font-medium">{isAr ? "آخر تعديل" : "Last edit"}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {state.products.map((p) => {
                const k = key(p);
                const dirty = dirtyKeys.has(k);
                return (
                  <tr key={k} className="border-t border-[#f2f2f7]">
                    <td className="px-4 py-3 font-medium">{isAr ? p.name_ar : p.name_en}</td>
                    <td className="px-4 py-3 text-[#6e6e73]">
                      {p.duration_months} {isAr ? "شهر" : "months"}
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {fmtMoney(p.usd)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-9 w-32"
                          dir="ltr"
                          inputMode="numeric"
                          placeholder={isAr ? "غير محدد" : "unset"}
                          value={draftFor(p)}
                          onChange={(e) => setDrafts((d) => ({ ...d, [k]: e.target.value }))}
                        />
                        {dirty && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={savingKey === k}
                            onClick={() => void savePrice(p)}
                          >
                            {savingKey === k ? (
                              isAr ? "…" : "…"
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                {isAr ? "حفظ" : "Save"}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.source === "manual" ? (
                        <Badge variant="outline">{isAr ? "يدوي" : "manual"}</Badge>
                      ) : p.source === "auto" ? (
                        <Badge variant="secondary">{isAr ? "تلقائي" : "auto"}</Badge>
                      ) : (
                        <span className="text-[#6e6e73]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#6e6e73]">{fmtDate(p.updated_at, isAr)}</td>
                    <td className="px-4 py-3 text-[#6e6e73]" dir="ltr">
                      {p.price_egp !== null ? `${p.price_egp.toLocaleString("en-US")} EGP` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-normal text-[#6e6e73]">
          {isAr
            ? "التقريب التلقائي: أقرب 5 جنيهات (عرف التحويل النقدي المصري). القيمة اليدوية تقبل أي مبلغ دقيق."
            : "Auto rounding: nearest 5 EGP (the Egyptian cash-transfer convention). A manual value accepts any exact amount."}
        </p>
      </SectionCard>

      {/* The honest update log */}
      <SectionCard
        title={isAr ? "سجل تحديث سعر الصرف (آخر 10)" : "Exchange-rate update log (last 10)"}
        sub={
          isAr
            ? "صف واحد لكل يوم UTC — الفشل يُسجّل أيضًا (صادق): يوم الفشل لا يُعاد طلب API فيه، ويظل آخر سعر ناجح يخدم الأسعار، ويصلك جرس تنبيه."
            : "One row per UTC day — failures are logged too (honest): a failed day makes no further API request, the last successful rate keeps serving, and the admin bell rings."
        }
      >
        {state.log.length === 0 ? (
          <div className="rounded-2xl bg-[#f5f5f7] p-8 text-center text-sm font-normal text-[#6e6e73]">
            {isAr ? "لا سجل بعد" : "No log yet"}
          </div>
        ) : (
          <ul className="space-y-2">
            {state.log.map((row) => (
              <li
                key={row.rate_date}
                className={cn(
                  "flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border px-4 py-3 text-sm",
                  row.status === "success"
                    ? "border-[#34c759]/20 bg-[#34c759]/5"
                    : "border-[#ff3b30]/20 bg-[#ff3b30]/5",
                )}
              >
                <span className="font-medium" dir="ltr">
                  {row.rate_date}
                </span>
                {row.status === "success" ? (
                  <span dir="ltr">{row.usd_to_egp} EGP/USD</span>
                ) : (
                  <span className="text-[#ff3b30]">
                    {isAr ? "فشل" : "failed"}
                    {row.error ? ` — ${row.error.slice(0, 120)}` : ""}
                  </span>
                )}
                <span className="text-xs text-[#6e6e73]">
                  {fmtDate(row.fetched_at, isAr)}{" "}
                  {new Date(row.fetched_at).toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
