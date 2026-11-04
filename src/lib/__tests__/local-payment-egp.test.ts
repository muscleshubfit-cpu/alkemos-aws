import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  computeAutoLocalPrices,
  dualPriceParts,
  dualPriceString,
  roundEgpCash,
  LOCAL_PRICE_PRODUCTS,
  EXCHANGE_RATE_CRON_UTC,
  EXCHANGE_RATE_UPDATE_TIME_UTC,
} from "@/lib/local-prices";
import { MEMBERSHIPS } from "@/lib/memberships";
import { getTier } from "@/lib/plans";
import { resolvePlanPrice } from "@/lib/paypal";

/**
 * LOCAL-PAYMENT-EGP canaries (owner order 2026-11-05 — the eleven
 * verification items, each pinned so the regression class can never
 * silently return):
 *
 *  1. THE MATRIX IS DERIVED — every USD price reads memberships.ts /
 *     plans.ts (never a literal) AND equals resolvePlanPrice's answer
 *     for the same product (PayPal charges exactly this USD — a drift
 *     here would mean two different prices for one order).
 *  2. ROUNDING LAW — nearest 5 EGP, cash-friendly, invalid inputs → 0.
 *  3. PAIRED DISPLAY — the owner's exact format: USD FIRST, then
 *     «أو»/or, then the EGP twin («$14.99 أو 830 جنيه مصري»).
 *  4. UNSET → USD-ONLY — null / 0 / negative / NaN never render an EGP
 *     twin (the never-zero display law).
 *  5. BOOTSTRAP SEED PINS — the migration's literal values equal
 *     computeAutoLocalPrices(55.3706) (the live-measured rate) — the
 *     SQL can never drift from the code path the cron job uses.
 *  6. ONE-REQUEST-PER-DAY — the DB lock (rate_date UNIQUE) + the
 *     route's check-before-fetch + the daily schedule + the fixed-time
 *     documentation.
 *  7. MANUAL MODE PROTECTION — the daily job recomputes ONLY in auto
 *     mode; a manual edit flips the mode; back-to-auto uses the stored
 *     rate (no second API call).
 *  8. FAILURE POSTURE — failure row + admin alert + last-success rate
 *     keeps serving + 502 loudness + missing key = dormant (no request,
 *     no row) + key-redaction in stored errors.
 *  9. AMOUNT LOCK — price_egp is snapshotted at request creation, and
 *     the review path never rewrites it (old orders are immutable).
 * 10. PAYPAL ISOLATION — zero EGP/local-price references inside the
 *     PayPal money path files.
 * 11. MIGRATION + DOCS GATES — 0104 naming law, INDEX.md row, types.ts
 *     mirror, migration probes, .env.example, deploy env-sync, the
 *     crontab line.
 */

const repo = (...parts: string[]) => path.join(process.cwd(), ...parts);
const read = (...parts: string[]) => readFileSync(repo(...parts), "utf8");

const BOOTSTRAP_RATE = 55.3706; // live-measured 2026-11-05 (see migration 0104 header)

describe("LOCAL-PAYMENT-EGP (0104) — the eleven canaries", () => {
  // ── 1. The matrix is DERIVED (never literals, never drifts from PayPal) ──
  it("1a. every product USD is read from memberships.ts/plans.ts (no hand-typed price)", () => {
    expect(LOCAL_PRICE_PRODUCTS.length).toBeGreaterThanOrEqual(10);
    for (const p of LOCAL_PRICE_PRODUCTS) {
      const m = MEMBERSHIPS.find((x) => x.id === p.planTier);
      if (m && (p.planTier === "premium" || p.planTier === "pro" || p.planTier === "coaching")) {
        const expected = p.durationMonths === 12 ? m.priceYearly : m.priceMonthly;
        expect(p.usd).toBe(expected);
      } else {
        const legacy = getTier(p.planTier as "starter" | "elite");
        expect(legacy).toBeDefined();
        expect(p.usd).toBe(legacy!.prices[p.durationMonths as 1 | 12]);
      }
    }
  });

  it("1b. the matrix equals resolvePlanPrice for every product×duration (PayPal charges exactly this USD)", () => {
    for (const p of LOCAL_PRICE_PRODUCTS) {
      expect(p.usd).toBe(resolvePlanPrice(p.planTier, p.durationMonths));
    }
  });

  it("1c. computeAutoLocalPrices recomputes from the rate — never hardcodes", () => {
    const at55 = computeAutoLocalPrices(BOOTSTRAP_RATE);
    const at60 = computeAutoLocalPrices(60);
    expect(at55.find((r) => r.planTier === "premium" && r.durationMonths === 1)?.priceEgp).toBe(830);
    // 14.99 × 60 = 899.4 → 900: a different rate MUST yield a different row.
    expect(at60.find((r) => r.planTier === "premium" && r.durationMonths === 1)?.priceEgp).toBe(900);
    expect(at60.find((r) => r.planTier === "elite" && r.durationMonths === 12)?.priceEgp).toBe(24000);
  });

  // ── 2. Rounding law ──
  it("2. rounds to the nearest 5 EGP (cash-friendly); invalid inputs → 0", () => {
    expect(roundEgpCash(14.99, BOOTSTRAP_RATE)).toBe(830);
    expect(roundEgpCash(119, BOOTSTRAP_RATE)).toBe(6590);
    for (const r of computeAutoLocalPrices(BOOTSTRAP_RATE)) {
      expect(r.priceEgp % 5).toBe(0);
      expect(r.priceEgp).toBeGreaterThan(0);
    }
    expect(roundEgpCash(0, BOOTSTRAP_RATE)).toBe(0);
    expect(roundEgpCash(14.99, 0)).toBe(0);
    expect(roundEgpCash(-1, BOOTSTRAP_RATE)).toBe(0);
    expect(roundEgpCash(14.99, Number.NaN)).toBe(0);
    expect(roundEgpCash(Number.POSITIVE_INFINITY, BOOTSTRAP_RATE)).toBe(0);
  });

  // ── 3. Paired display — the owner's exact format ──
  it("3. USD first, ثم «أو»/or, then the EGP twin — the owner's example verbatim", () => {
    expect(dualPriceString(14.99, 830, true)).toBe("$14.99 أو 830 جنيه مصري");
    expect(dualPriceString(14.99, 830, false)).toBe("$14.99 or 830 EGP");
    // Thousands separators keep Latin digits (the format-locale currency law).
    expect(dualPriceString(119, 6590, true)).toBe("$119 أو 6,590 جنيه مصري");
    expect(dualPriceString(119, 6590, false)).toBe("$119 or 6,590 EGP");
    const parts = dualPriceParts(14.99, 830, true);
    expect(parts.usd).toBe("$14.99");
    expect(parts.or).toBe("أو");
    expect(parts.egp).toBe("830 جنيه مصري");
  });

  // ── 4. Unset → USD-only (never zero, never a guess) ──
  it("4. null/0/negative/NaN EGP renders USD-ONLY — no جنيه, no or, no number", () => {
    for (const bad of [null, undefined, 0, -5, Number.NaN]) {
      const s = dualPriceString(14.99, bad as number | null | undefined, true);
      expect(s).toBe("$14.99");
      expect(s).not.toContain("جنيه");
      expect(s).not.toContain("أو");
      const parts = dualPriceParts(14.99, bad as number | null | undefined, true);
      expect(parts.egp).toBeNull();
      expect(parts.or).toBeNull();
    }
  });

  // ── 5. Bootstrap seed pins — the SQL equals the code path ──
  it("5. migration 0104 seeds exactly computeAutoLocalPrices(55.3706) + the measured rate row", () => {
    const sql = read("supabase/migrations/20261105064700_0104_local_payment_egp_prices.sql");
    expect(sql).toContain("'2026-11-05', 55.3706, 'success', 'owner-bootstrap'");
    const computed = computeAutoLocalPrices(BOOTSTRAP_RATE);
    for (const r of computed) {
      const row = `('${r.planTier}', ${r.durationMonths}, ${r.priceEgp}, 'auto')`;
      expect(sql).toContain(row);
    }
    // No hand-typed row outside the computed set: count the VALUES tuples.
    const seeded = sql.match(/\('(premium|pro|coaching|starter|elite)', (1|12), \d+, 'auto'\)/g) ?? [];
    expect(seeded.length).toBe(computed.length);
  });

  // ── 6. One request per UTC day ──
  it("6. the DB lock + check-before-fetch + fixed daily schedule enforce one request/day", () => {
    const sql = read("supabase/migrations/20261105064700_0104_local_payment_egp_prices.sql");
    // THE DB-LEVEL LOCK: unique rate_date = a second server/re-fire is a no-op.
    expect(sql).toContain("rate_date date not null unique");
    const route = read("src/app/api/cron/exchange-rate/route.ts");
    // Check today's row BEFORE any fetch; a hit returns without calling the API.
    expect(route).toContain('.eq("rate_date", today)');
    expect(route).toContain('"already-ran-today"');
    // The fetch happens exactly once, after the lock check passes.
    expect(route.indexOf('.eq("rate_date", today)')).toBeLessThan(route.indexOf("await fetchUsdToEgp"));
    // The fixed, documented, off-midnight slot.
    expect(EXCHANGE_RATE_CRON_UTC).toBe("47 6 * * *");
    expect(EXCHANGE_RATE_UPDATE_TIME_UTC).toBe("06:47 UTC daily");
    const crontab = read("deploy/crontab-alkemos");
    expect(crontab).toContain("47 6 * * * deploy sh -c 'curl -fsS -m 90 -H \"Authorization: Bearer $(grep -m1 \"^CRON_SECRET=\" /srv/alkemos/shared/.env | cut -d= -f2-)\" http://127.0.0.1:3000/api/cron/exchange-rate'");
  });

  // ── 7. Manual-mode protection ──
  it("7. the daily job recomputes ONLY in auto mode; manual edits flip the mode and are protected", () => {
    const route = read("src/app/api/cron/exchange-rate/route.ts");
    // The recompute is inside the mode gate (source order: gate BEFORE upsert).
    const modeGate = route.indexOf('const mode = settings?.mode === "manual" ? "manual" : "auto";');
    const recompute = route.indexOf("if (mode === \"auto\") {");
    expect(modeGate).toBeGreaterThan(-1);
    expect(recompute).toBeGreaterThan(modeGate);
    expect(route).toContain("Prices are NOT recomputed");
    // The admin editor: set_price writes source='manual' AND flips the mode.
    const admin = read("src/app/api/admin/local-prices/route.ts");
    expect(admin).toContain("source: \"manual\"");
    expect(admin).toContain("mode: \"manual\"");
    // Back to auto recomputes from the STORED rate — no API call (the
    // one-a-day law holds through the mode switch).
    expect(admin).toContain('from("exchange_rate_updates")');
    expect(admin).not.toContain("exchangerate-api.com");
  });

  // ── 8. Failure posture ──
  it("8. failure: row recorded, admin alerted with last-success date, 502 loud, missing key dormant, errors redacted", () => {
    const route = read("src/app/api/cron/exchange-rate/route.ts");
    // Failure row + alert + last-success lookup.
    expect(route).toContain('status: "failure"');
    expect(route).toContain("alertAdminsOnFailure");
    expect(route).toContain("last_success_date");
    expect(route).toContain("last successful rate keeps serving");
    // 502 so the crontab's curl -fsS marks the run failed in the log.
    expect(route).toContain("{ status: 502 }");
    // Missing key → dormant 503, NO row, NO request (the day's slot stays open).
    expect(route).toContain('"missing-key"');
    const dormantBlock = route.slice(route.indexOf('"missing-key"'), route.indexOf('"missing-key"') + 400);
    expect(dormantBlock).toContain("{ status: 503 }");
    // Redaction before storage — a fetch error can embed the key in the URL.
    expect(route).toContain("function redactError");
    expect(route).toContain("[redacted]");
    // The key is never echoed in any response field.
    expect(route).not.toMatch(/json\(\{[^}]*apiKey/);
  });

  // ── 9. Amount lock ──
  it("9. price_egp is snapshotted at request creation and never rewritten afterwards", () => {
    const checkout = read("src/components/views/CheckoutView.tsx");
    // The submitted value is exactly the DISPLAYED state (the member pays
    // what they saw), documented as the 0104 AMOUNT LOCK.
    expect(checkout).toContain("price_egp: localPriceEgp");
    expect(checkout).toContain("0104 AMOUNT LOCK");
    const sql = read("supabase/migrations/20261105064700_0104_local_payment_egp_prices.sql");
    expect(sql).toContain("add column if not exists price_egp");
    expect(sql).toContain("Never rewritten by rate updates or mode flips");
    // The review path updates ONLY status/reviewed_at — the locked amount
    // (and price_usd) are immutable through approval.
    const dataLib = read("src/lib/data/subscriptions.ts");
    const reviewBlock = dataLib.slice(
      dataLib.indexOf("export async function reviewSubscriptionRequest"),
      dataLib.indexOf("export async function", dataLib.indexOf("export async function reviewSubscriptionRequest") + 10),
    );
    expect(reviewBlock).toContain('.update({ status:');
    expect(reviewBlock).not.toContain("price_egp:");
    // The input shape carries the field.
    expect(dataLib).toContain('"price_usd" | "price_egp" | "payment_method"');
  });

  // ── 10. PayPal isolation ──
  it("10. the PayPal money path contains ZERO local-price/EGP references (USD-only law)", () => {
    const paypalFiles = [
      "src/lib/paypal.ts",
      "src/app/api/paypal/create-order/route.ts",
      "src/app/api/paypal/capture-order/route.ts",
      "src/app/api/paypal/webhook/route.ts",
    ];
    // THIS FEATURE'S identifiers only — the pre-0038 legacy `egp_amount`
    // wallet-topup compat (owner-decreed ÷50 conversion, documented in the
    // GLOBAL USD LAW) is a different, pre-existing thing and stays legal.
    const forbidden =
      /local[_-]?prices?|exchange[_-]?rate|EXCHANGERATE_API|price_egp|جنيه|أو 8\d\d|dualPrice/i;
    for (const f of paypalFiles) {
      const src = read(f);
      expect(src, `${f} must stay USD-only`).not.toMatch(forbidden);
    }
    // And the resolvePlanPrice authority still answers USD for every product.
    for (const p of LOCAL_PRICE_PRODUCTS) {
      expect(resolvePlanPrice(p.planTier, p.durationMonths)).toBe(p.usd);
    }
  });

  // ── 11. Migration + docs gates (the same-commit law) ──
  it("11. 0104 ships with INDEX.md row, types.ts mirror, probes, .env.example, and the deploy env-sync", () => {
    // Naming law: YYYYMMDDHHMMSS_NNNN_slug.sql, sequence after 0103.
    expect(path.basename("supabase/migrations/20261105064700_0104_local_payment_egp_prices.sql")).toMatch(
      /^20261105064700_0104_[a-z0-9_]+\.sql$/,
    );
    // INDEX.md: numbering-map row + audit-log row.
    const index = read("supabase/migrations/INDEX.md");
    expect(index).toContain("20261105064700_0104_local_payment_egp_prices.sql");
    expect(index).toContain("| 0104 |");
    // types.ts mirror: the three tables + the amount-lock column.
    const types = read("src/lib/supabase/types.ts");
    expect(types).toContain("local_prices: {");
    expect(types).toContain("exchange_rate_updates: {");
    expect(types).toContain("local_price_settings: {");
    expect(types).toContain("price_egp: number | null;");
    // Probes (the 0102-up law).
    const probes = read("scripts/db/migration_probes.py");
    expect(probes).toContain('"table": "local_prices"');
    expect(probes).toContain('"table": "exchange_rate_updates"');
    expect(probes).toContain('"table": "local_price_settings"');
    expect(probes).toContain('"column": "price_egp"');
    // Env documentation + the AWS staging channel.
    expect(read(".env.example")).toContain("EXCHANGERATE_API_KEY=");
    const workflow = read(".github/workflows/deploy-aws.yml");
    expect(workflow).toContain("R_EXCHANGERATE_API_KEY: ${{ secrets.EXCHANGERATE_API_KEY }}");
    expect(workflow).toContain('stage EXCHANGERATE_API_KEY');
    // The public read endpoint exists (checkout display source of truth).
    expect(read("src/app/api/local-prices/route.ts")).toContain("export async function GET()");
  });
});
