import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  getAffiliateStoreAutomationSettings,
  isFetchDue,
} from "@/lib/affiliate-store-automation";
import { runAffiliateStoreFetch } from "@/lib/affiliate-store-fetch";
import { scanLinkSuggestions } from "@/lib/affiliate-store-linking";

export const maxDuration = 600;

/**
 * AFFILIATE-STORE AUTOMATION CRON (Phase 529 — owner order 2026-11-27
 * «نفّذ مرحلة بناء منظومة الأتمتة والتسويق الداخلي لمتجر Affiliate
 * Store»).
 *
 * SCHEDULE: daily 07:17 UTC — fired by
 * .github/workflows/affiliate-store-automation.yml (the repo-native
 * GitHub Actions fire channel, the exchange-rate precedent). The
 * FREQUENCY decision (daily/weekly/monthly) lives in the owner's
 * settings row: the scheduler fires daily, this endpoint decides
 * whether the fire EXECUTES (isFetchDue) — weekly = every 7th fire,
 * monthly = every ~30th. A paused system (is_enabled=false) skips
 * honestly.
 *
 * OVERLAP SAFETY (three locks):
 *   1. the workflow's tight concurrency group (GitHub level);
 *   2. the DB partial-unique running lock (0120 — a second run is a
 *      constraint violation, impossible to double-run);
 *   3. the frequency due-check (a re-fire inside the window is a
 *      documented no-op).
 *
 * WHAT ONE FIRE DOES (in order):
 *   1. fetch run — runAffiliateStoreFetch('cron'): credentials gate →
 *      new products per active fetch categories → the sync pass over
 *      every published product (price/availability/image refresh,
 *      unavailable → hide + link deactivation) → run ledger + alerts.
 *   2. linking scan — scanLinkSuggestions(): the EN-surface relevance
 *      scan + threshold-gated auto-apply (inline links + rail
 *      bindings).
 *
 * HONEST CODES (the exchange-rate discipline):
 *   200 ok            — ran (or skipped: disabled / not due / locked)
 *   503 missing-credentials — the Creators API pair is absent (dormant
 *                      run recorded; NO mock data, NO fake fetch)
 *   502 failed        — the fetch errored (the run ledger + admin bell
 *                      carry the details; the linking scan still runs)
 *   401               — bad/missing CRON_SECRET
 *
 * SECRETS: CRON_SECRET (Bearer). The Creators API credentials are read
 * from the server env only — never logged, never echoed.
 */

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const settings = await getAffiliateStoreAutomationSettings();

  // paused → honest skip (nothing recorded, the schedule stays armed)
  if (!settings.is_enabled) {
    return NextResponse.json({
      ok: true,
      skipped: "disabled",
      message: "automation is paused (is_enabled=false) — nothing ran",
    });
  }

  // frequency gate (manual runs from the admin panel bypass this)
  if (!isFetchDue(settings)) {
    return NextResponse.json({
      ok: true,
      skipped: "not-due",
      frequency: settings.frequency,
      last_run_at: settings.last_run_at,
      message: `frequency is ${settings.frequency} and the last run is inside the window — skipped`,
    });
  }

  // THE FETCH RUN
  const fetchResult = await runAffiliateStoreFetch("cron");

  // THE LINKING SCAN (independent of fetch success — relevance works on
  // the products already on the shelf)
  let linking: Awaited<ReturnType<typeof scanLinkSuggestions>> | null = null;
  try {
    linking = await scanLinkSuggestions();
  } catch (error) {
    linking = {
      pagesScanned: 0,
      productsConsidered: 0,
      suggestionsWritten: 0,
      autoApplied: 0,
    };
    console.error("[affiliate-store-automation] linking scan failed:", error);
  }

  if (fetchResult.status === "failed" && fetchResult.reason === "missing-credentials") {
    return NextResponse.json(
      {
        error: "missing-credentials",
        message:
          "Amazon Creators API credentials are not configured (AMAZON_CREATORS_API_CREDENTIAL_ID / AMAZON_CREATORS_API_SECRET) — register in Associates Central, add the two repo secrets; the system activates on the next fire",
        linking,
      },
      { status: 503 },
    );
  }

  if (fetchResult.status === "failed") {
    return NextResponse.json(
      {
        error: "fetch-failed",
        message: fetchResult.error ?? "the fetch run failed (see the run ledger)",
        fetch: fetchResult,
        linking,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    fetch: fetchResult,
    linking,
  });
}
