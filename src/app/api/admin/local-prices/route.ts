import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { adminLocalPriceBodySchema } from "@/lib/validation/schemas";
import {
  computeAutoLocalPrices,
  LOCAL_PRICE_PRODUCTS,
  EXCHANGE_RATE_UPDATE_TIME_UTC,
} from "@/lib/local-prices";

/**
 * /api/admin/local-prices (0104 LOCAL-PAYMENT-EGP) — the admin editor
 * behind /admin/local-prices. ADMIN ONLY (requireAdmin — the leads
 * route prologue) + the service-role client (the tables have NO write
 * policies, so the browser client could never write them even if this
 * route disappeared — defense in depth, post-0055 posture).
 *
 * GET  — the full editor state: every product in the matrix (USD from
 *        memberships.ts/plans.ts, the live EGP row, provenance, stamps),
 *        the mode, the LAST SUCCESSFUL rate, and the last 10 update-log
 *        rows (successes AND failures — the honest history).
 *
 * POST — action envelope (zod-gated, unknown keys stripped — the client
 *        never chooses provenance or updated_by):
 *   set_price {planTier, durationMonths, priceEgp}
 *        Upserts ONE row with source='manual' AND flips the mode to
 *        'manual' — that flip is the protection the owner ordered: the
 *        next daily run will not clobber the hand-set value ("الوضع
 *        اليدوي يمنع الكتابة فوق القيم"). The view explains the flip
 *        before the first edit.
 *   set_auto
 *        Back to auto: mode='auto' + IMMEDIATE recompute of every row
 *        from the STORED last-success rate — no ExchangeRate-API call
 *        is made (the one-request-per-day law holds; freshness arrives
 *        with the next 06:47 UTC run).
 */

type AdminLocalPriceViewRow = {
  plan_tier: string;
  duration_months: number;
  usd: number;
  name_ar: string;
  name_en: string;
  price_egp: number | null;
  source: "auto" | "manual" | null;
  updated_at: string | null;
};

function productKey(planTier: string, months: number): string {
  return `${planTier}::${months}`;
}

export async function GET(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const [pricesRes, settingsRes, rateRes, logRes] = await Promise.all([
    supabaseAdmin.from("local_prices").select("*").order("plan_tier", { ascending: true }),
    supabaseAdmin.from("local_price_settings").select("mode, updated_at, updated_by").eq("id", 1).maybeSingle(),
    supabaseAdmin
      .from("exchange_rate_updates")
      .select("usd_to_egp, rate_date, fetched_at")
      .eq("status", "success")
      .not("usd_to_egp", "is", null)
      .order("rate_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("exchange_rate_updates")
      .select("rate_date, usd_to_egp, status, error, fetched_at")
      .order("rate_date", { ascending: false })
      .limit(10),
  ]);

  const byKey = new Map<string, { price_egp: number; source: "auto" | "manual"; updated_at: string }>();
  for (const row of pricesRes.data ?? []) {
    byKey.set(productKey(row.plan_tier, row.duration_months), {
      price_egp: Number(row.price_egp),
      source: row.source,
      updated_at: row.updated_at,
    });
  }

  const products: AdminLocalPriceViewRow[] = LOCAL_PRICE_PRODUCTS.map((p) => {
    const row = byKey.get(productKey(p.planTier, p.durationMonths));
    return {
      plan_tier: p.planTier,
      duration_months: p.durationMonths,
      usd: p.usd,
      name_ar: p.nameAr,
      name_en: p.nameEn,
      price_egp: row?.price_egp ?? null,
      source: row?.source ?? null,
      updated_at: row?.updated_at ?? null,
    };
  });

  return NextResponse.json({
    products,
    mode: settingsRes.data?.mode === "manual" ? "manual" : "auto",
    mode_updated_at: settingsRes.data?.updated_at ?? null,
    rate: rateRes.data
      ? { usd_to_egp: Number(rateRes.data.usd_to_egp), rate_date: rateRes.data.rate_date, fetched_at: rateRes.data.fetched_at }
      : null,
    log: (logRes.data ?? []).map((r) => ({
      rate_date: r.rate_date,
      usd_to_egp: r.usd_to_egp === null ? null : Number(r.usd_to_egp),
      status: r.status,
      error: r.error,
      fetched_at: r.fetched_at,
    })),
    scheduledUpdateUtc: EXCHANGE_RATE_UPDATE_TIME_UTC,
  });
}

export async function POST(request: NextRequest) {
  let adminId: string | null = null;
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
    adminId = auth.id;
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminLocalPriceBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (parsed.data.action === "set_price") {
    const { planTier, durationMonths, priceEgp } = parsed.data;
    const product = LOCAL_PRICE_PRODUCTS.find(
      (p) => p.planTier === planTier && p.durationMonths === durationMonths,
    );
    if (!product) {
      return NextResponse.json(
        { error: "Unknown plan/duration — prices exist only for real checkout products" },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    // 1) The manual row (source='manual' — provenance is server-set).
    const { error: rowError } = await supabaseAdmin.from("local_prices").upsert(
      {
        plan_tier: planTier,
        duration_months: durationMonths,
        price_egp: priceEgp,
        source: "manual",
        updated_at: now,
        updated_by: adminId,
      },
      { onConflict: "plan_tier, duration_months", ignoreDuplicates: false },
    );
    if (rowError) {
      return NextResponse.json({ error: rowError.message }, { status: 500 });
    }
    // 2) THE PROTECTION FLIP: manual edit → manual mode, so tomorrow's
    //    daily run cannot clobber the hand-set value.
    const { error: modeError } = await supabaseAdmin
      .from("local_price_settings")
      .upsert(
        { id: 1, mode: "manual", updated_at: now, updated_by: adminId },
        { onConflict: "id", ignoreDuplicates: false },
      );
    if (modeError) {
      return NextResponse.json({ error: modeError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, mode: "manual", plan_tier: planTier, duration_months: durationMonths, price_egp: priceEgp });
  }

  // ── set_auto: back to auto + immediate recompute from the STORED rate
  //    (no ExchangeRate-API call — the one-a-day law holds).
  const { data: rateRow } = await supabaseAdmin
    .from("exchange_rate_updates")
    .select("usd_to_egp")
    .eq("status", "success")
    .not("usd_to_egp", "is", null)
    .order("rate_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!rateRow?.usd_to_egp) {
    return NextResponse.json(
      { error: "No successful rate stored yet — the first daily run (06:47 UTC) must succeed before auto mode can compute" },
      { status: 400 },
    );
  }
  const rate = Number(rateRow.usd_to_egp);
  const computed = computeAutoLocalPrices(rate);
  if (computed.length === 0) {
    return NextResponse.json({ error: "No products to price" }, { status: 500 });
  }
  const now = new Date().toISOString();
  const rows = computed.map((p) => ({
    plan_tier: p.planTier,
    duration_months: p.durationMonths,
    price_egp: p.priceEgp,
    source: "auto" as const,
    updated_at: now,
    updated_by: adminId,
  }));
  const { error: priceError } = await supabaseAdmin
    .from("local_prices")
    .upsert(rows, { onConflict: "plan_tier, duration_months", ignoreDuplicates: false });
  if (priceError) {
    return NextResponse.json({ error: priceError.message }, { status: 500 });
  }
  const { error: modeError } = await supabaseAdmin
    .from("local_price_settings")
    .upsert(
      { id: 1, mode: "auto", updated_at: now, updated_by: adminId },
      { onConflict: "id", ignoreDuplicates: false },
    );
  if (modeError) {
    return NextResponse.json({ error: modeError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, mode: "auto", recomputed: rows.length, usd_to_egp_used: rate });
}
