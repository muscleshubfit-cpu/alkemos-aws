import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { EXCHANGE_RATE_UPDATE_TIME_UTC, type LocalPricesPublicPayload } from "@/lib/local-prices";

export const dynamic = "force-dynamic";

/**
 * GET /api/local-prices — the PUBLIC read endpoint behind the checkout
 * EGP twin (0104 LOCAL-PAYMENT-EGP).
 *
 * WHY a route (not a browser Supabase read): CheckoutView never touched
 * the browser client; a tiny public read keeps the money-path surface
 * auditable in one place, works identically on the /checkout page in
 * both languages, and is trivially verifiable in production (curl).
 *
 * WHAT IT RETURNS:
 *   prices[]            — every local_prices row (plan_tier × duration →
 *                         price_egp). EMPTY ARRAY when unset: the client
 *                         then renders USD-only (the never-zero display
 *                         law — no guessed value, no stale fallback).
 *   mode                — auto | manual (context for the admin surface;
 *                         harmless to expose: both are public behavior).
 *   rate                — the LAST SUCCESSFUL exchange-rate row (the one
 *                         actually serving), or null before the first
 *                         success. Failure rows are NEVER served here.
 *   scheduledUpdateUtc  — documentation string for the UI ("06:47 UTC
 *                         daily").
 *
 * AUTH: none (public data — USD prices are equally public on
 * /memberships; exchange rates are public). WRITES do not exist on this
 * route — the only writers are the cron job and the requireAdmin route,
 * both through the service-role client.
 */

export async function GET() {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    // Unconfigured (local demo / missing env): USD-only checkout, honest.
    const payload: LocalPricesPublicPayload = {
      prices: [],
      mode: "auto",
      rate: null,
      scheduledUpdateUtc: EXCHANGE_RATE_UPDATE_TIME_UTC,
    };
    return NextResponse.json(payload);
  }

  const [pricesRes, settingsRes, rateRes] = await Promise.all([
    supabaseAdmin.from("local_prices").select("plan_tier, duration_months, price_egp"),
    supabaseAdmin.from("local_price_settings").select("mode").eq("id", 1).maybeSingle(),
    supabaseAdmin
      .from("exchange_rate_updates")
      .select("usd_to_egp, rate_date, fetched_at")
      .eq("status", "success")
      .not("usd_to_egp", "is", null)
      .order("rate_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const prices = (pricesRes.data ?? []).map((r) => ({
    plan_tier: r.plan_tier,
    duration_months: r.duration_months,
    price_egp: Number(r.price_egp),
  }));
  const mode = settingsRes.data?.mode === "manual" ? "manual" : "auto";
  const rateRow = rateRes.data ?? null;
  const rate =
    rateRow && rateRow.usd_to_egp !== null
      ? {
          usd_to_egp: Number(rateRow.usd_to_egp),
          rate_date: rateRow.rate_date,
          fetched_at: rateRow.fetched_at,
        }
      : null;

  const payload: LocalPricesPublicPayload = {
    prices,
    mode,
    rate,
    scheduledUpdateUtc: EXCHANGE_RATE_UPDATE_TIME_UTC,
  };
  return NextResponse.json(payload);
}
