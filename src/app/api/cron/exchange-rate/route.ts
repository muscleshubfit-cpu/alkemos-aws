import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { computeAutoLocalPrices, EXCHANGE_RATE_UPDATE_TIME_UTC } from "@/lib/local-prices";

export const maxDuration = 60;

/**
 * DAILY USD→EGP EXCHANGE-RATE JOB (0104 LOCAL-PAYMENT-EGP — owner order
 * 2026-11-05).
 *
 * SCHEDULE: daily 06:47 UTC — owner-fixed, deliberately NOT midnight and
 * off the existing cron grid (03:47 indexnow · 05:30 db-backup · 05:45
 * storage-inventory · 06:00 storage-backup · 06:10 migration-audit ·
 * 06:30 offsite). ExchangeRate-API publishes its daily rate at
 * 00:00:01 UTC, so 06:47 UTC always reads the fresh value. FIRED BY
 * .github/workflows/exchange-rate-daily.yml — the 0105 amendment's
 * repo-native GitHub Actions schedule (same 06:47 UTC slot, same
 * CRON_SECRET repo secret deploy-aws.yml stages, fired against the
 * public origin; zero owner server steps). The /etc/cron.d/alkemos line
 * (deploy/crontab-alkemos) remains an OPTIONAL redundant server-side
 * fire — the DB lock below makes a double fire the same day a no-op
 * ("already-ran-today"). A missed fire costs at most one day; the next
 * run catches up (benign-by-design, the schedule-health law).
 *
 * THE ONE-REQUEST-PER-DAY LAW (owner order): ExchangeRate-API is called
 * AT MOST ONCE per UTC day, enforced by the exchange_rate_updates
 * rate_date UNIQUE row — THE DB-LEVEL LOCK:
 *   - a second server firing the same day → "already ran" no-op
 *   - a manual re-fire the same day (success OR failure) → no-op
 *   - NO EXCHANGERATE_API_KEY configured → NOTHING is recorded and NO
 *     API call happens (dormant 503, the dispatch-pipelines precedent)
 *     — the day's slot stays open, so a later fire the same day after
 *     the key is fixed still makes at most that one request.
 *
 * FLOW (success): fetch v6 /latest/USD → validate → upsert today's row
 * (status success) → IF the mode is AUTO, recompute every local_prices
 * row from memberships.ts + plans.ts × the fresh rate (nearest-5 EGP).
 * In MANUAL mode the rate is still fetched and stored (the admin
 * surface and the "back to auto" recompute stay fresh) but the rows are
 * NEVER touched — a hand-set price survives every daily run until an
 * admin clicks back to auto.
 *
 * FLOW (failure — API error / quota exhausted / invalid key / bad
 * payload): upsert today's row (status failure + a REDACTED error
 * string) → the LAST SUCCESSFUL rate keeps serving everywhere → prices
 * are NOT recomputed → the admin bell rings with the last-success date
 * → respond 502 so the crontab's `curl -fsS` marks the run failed in
 * /var/log/alkemos/cron.log (double visibility). Recovery = the next
 * day's run (documented in the governing report §7).
 *
 * SECRETS: EXCHANGERATE_API_KEY (server-side env on the AWS host —
 * staged by deploy-aws.yml "Stage runtime env" from the GitHub repo
 * secret, same channel as CRON_SECRET). The key NEVER appears in code,
 * in the DB, in the browser, in logs, or in any response field — the
 * URL is built inline and error text is redacted before storage.
 *
 * PAYPAL IS NOT TOUCHED: this job writes ONLY the three 0104 tables.
 * resolvePlanPrice, the create-order/capture-order routes, the webhook
 * and every PayPal env var are untouched (USD-only, the GLOBAL USD LAW
 * — a canary pins the isolation).
 */

const EXCHANGERATE_API_BASE = "https://v6.exchangerate-api.com/v6";
const FETCH_TIMEOUT_MS = 20_000;

/** UTC calendar date as YYYY-MM-DD (the rate_date key). */
function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Strip anything that could leak the key from an error message —
 *  fetch errors can embed the full URL. Only safe vocabulary survives. */
function redactError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const stripped = raw.replace(/[A-Za-z0-9_-]{20,}/g, "[redacted]");
  return stripped.slice(0, 300);
}

type ExchangeRateApiPayload = {
  result?: string;
  conversion_rates?: Record<string, number>;
};

/** Fetch the USD→EGP rate. Throws on HTTP/network/shape errors (the
 *  caller records the failure row + alerts). */
async function fetchUsdToEgp(apiKey: string): Promise<number> {
  const res = await fetch(`${EXCHANGERATE_API_BASE}/${apiKey}/latest/USD`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    // No caching: the one-a-day law is enforced by the DB row, and this
    // route runs exactly once a day.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ExchangeRate-API HTTP ${res.status}`);
  }
  const data = (await res.json()) as ExchangeRateApiPayload;
  const egp = data?.conversion_rates?.EGP;
  if (data?.result !== "success" || typeof egp !== "number" || !Number.isFinite(egp) || egp <= 0) {
    throw new Error("ExchangeRate-API payload rejected (no valid EGP rate)");
  }
  return egp;
}

/** Server-side admin bell insert (the capture-order precedent — direct
 *  service-role insert into admin_notifications). Targets the primary
 *  admin; falls back to a broadcast so the alert is never lost. */
async function alertAdminsOnFailure(lastSuccessDate: string | null, reason: string): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
  try {
    const { data: admin } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const lastSuccessText = lastSuccessDate ?? "لا يوجد (لم ينجح أي تحديث بعد)";
    await supabaseAdmin.from("admin_notifications").insert({
      type: "exchange_rate_failure",
      title: "تحديث سعر الصرف اليومي فشل",
      body: `فشل تحديث سعر الدولار/الجنيه (${reason}). الأسعار الحالية تخدم بآخر سعر ناجح: ${lastSuccessText}. سيُعاد المحاولة تلقائيًا غدًا 06:47 UTC — لا حاجة لأي إجراء إلا إذا تكرر الفشل.`,
      link: "/admin/local-prices",
      payload: { last_success_date: lastSuccessDate, reason: reason.slice(0, 200) },
      ...(admin?.id ? { target_coach_id: admin.id } : {}),
    });
  } catch {
    // Alerting must never crash the cron — the failure row is the ledger.
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const today = utcToday();

  // ── THE LOCK: any row for today (success OR failure) = the day's one
  // request already happened → no-op. Multi-server and re-fire safe.
  const { data: existing } = await supabaseAdmin
    .from("exchange_rate_updates")
    .select("rate_date, usd_to_egp, status")
    .eq("rate_date", today)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      ok: true,
      skipped: "already-ran-today",
      rate_date: existing.rate_date,
      status: existing.status,
      usd_to_egp: existing.usd_to_egp === null ? null : Number(existing.usd_to_egp),
      scheduledUpdateUtc: EXCHANGE_RATE_UPDATE_TIME_UTC,
    });
  }

  // ── Dormant-until-provisioned (the dispatch-pipelines precedent):
  // no key → no API call, no row, honest 503. The day's slot stays open.
  const apiKey = process.env.EXCHANGERATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        skipped: "missing-key",
        hint: "Set the EXCHANGERATE_API_KEY repo secret (deploy-aws stages it to the shared .env) — no request was made today.",
      },
      { status: 503 },
    );
  }

  // ── The day's ONE request.
  let rate: number;
  try {
    rate = await fetchUsdToEgp(apiKey);
  } catch (e) {
    const reason = redactError(e);
    // Record the burned attempt (the day is spent — no retry today).
    await supabaseAdmin
      .from("exchange_rate_updates")
      .upsert(
        { rate_date: today, usd_to_egp: null, status: "failure", error: reason },
        { onConflict: "rate_date", ignoreDuplicates: false },
      );
    // Last successful rate (for the alert + the response context).
    const { data: lastSuccess } = await supabaseAdmin
      .from("exchange_rate_updates")
      .select("rate_date")
      .eq("status", "success")
      .order("rate_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    await alertAdminsOnFailure(lastSuccess?.rate_date ?? null, reason);
    // Prices are NOT recomputed; the last successful rate keeps serving.
    return NextResponse.json(
      {
        ok: false,
        error: "exchange-rate-fetch-failed",
        reason,
        last_success_date: lastSuccess?.rate_date ?? null,
        note: "last successful rate keeps serving; retry happens on the next daily run",
      },
      { status: 502 },
    );
  }

  // ── Success: record the day's row.
  const { error: insertError } = await supabaseAdmin
    .from("exchange_rate_updates")
    .upsert(
      { rate_date: today, usd_to_egp: rate, status: "success", error: null },
      { onConflict: "rate_date", ignoreDuplicates: false },
    );
  if (insertError) {
    return NextResponse.json(
      { ok: false, error: "rate-row-write-failed", reason: redactError(insertError.message) },
      { status: 500 },
    );
  }

  // ── Recompute ONLY in auto mode (manual rows are never clobbered).
  const { data: settings } = await supabaseAdmin
    .from("local_price_settings")
    .select("mode")
    .eq("id", 1)
    .maybeSingle();
  const mode = settings?.mode === "manual" ? "manual" : "auto";

  let recomputed = 0;
  if (mode === "auto") {
    const computed = computeAutoLocalPrices(rate);
    if (computed.length > 0) {
      const rows = computed.map((p) => ({
        plan_tier: p.planTier,
        duration_months: p.durationMonths,
        price_egp: p.priceEgp,
        source: "auto" as const,
        updated_at: new Date().toISOString(),
        updated_by: null,
      }));
      const { error: priceError } = await supabaseAdmin
        .from("local_prices")
        .upsert(rows, { onConflict: "plan_tier, duration_months", ignoreDuplicates: false });
      if (priceError) {
        return NextResponse.json(
          { ok: false, error: "local-price-recompute-failed", reason: redactError(priceError.message) },
          { status: 500 },
        );
      }
      recomputed = rows.length;
    }
  }

  return NextResponse.json({
    ok: true,
    rate_date: today,
    usd_to_egp: rate,
    mode,
    recomputed,
    scheduledUpdateUtc: EXCHANGE_RATE_UPDATE_TIME_UTC,
  });
}
