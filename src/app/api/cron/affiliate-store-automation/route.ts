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
 * whether the FETCH executes (isFetchDue) — weekly = every 7th fire,
 * monthly = every ~30th. A paused system (is_enabled=false) skips the
 * fetch honestly.
 *
 * THE TWO ARMS ARE INDEPENDENT BY DESIGN (measured live 2026-11-27):
 *   - THE LINKING SCAN runs on EVERY fire while auto_link_enabled is
 *     on (it is a cheap DB-only pass over the EN surfaces + the shelf;
 *     its freshness must not wait for the fetch frequency window — a
 *     weekly-fetch store still gets daily link refreshes for new
 *     content).
 *   - THE FETCH runs only when is_enabled AND isFetchDue.
 *
 * OVERLAP SAFETY (three locks):
 *   1. the workflow's tight concurrency group (GitHub level);
 *   2. the DB partial-unique running lock (0120 — a second run is a
 *      constraint violation, impossible to double-run);
 *   3. the frequency due-check (a re-fire inside the window is a
 *      documented no-op).
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

  // ARM 1 — THE LINKING SCAN (every fire while enabled; independent of
  // the fetch frequency window — measured live: a weekly-fetch window
  // must never freeze the daily link freshness).
  let linking: Awaited<ReturnType<typeof scanLinkSuggestions>> | null = null;
  if (settings.auto_link_enabled) {
    try {
      linking = await scanLinkSuggestions();
    } catch (error) {
      linking = {
        pagesScanned: 0,
        productsConsidered: 0,
        suggestionsWritten: 0,
        autoApplied: 0,
        anchorsRefreshed: 0,
      };
      console.error("[affiliate-store-automation] linking scan failed:", error);
    }
  }

  // fetch paused → honest skip (nothing recorded, the schedule stays armed)
  if (!settings.is_enabled) {
    return NextResponse.json({
      ok: true,
      skipped: "disabled",
      message: "automation fetch is paused (is_enabled=false) — only the linking scan ran",
      linking,
    });
  }

  // frequency gate (manual runs from the admin panel bypass this)
  if (!isFetchDue(settings)) {
    return NextResponse.json({
      ok: true,
      skipped: "not-due",
      frequency: settings.frequency,
      last_run_at: settings.last_run_at,
      message: `fetch frequency is ${settings.frequency} and the last run is inside the window — only the linking scan ran`,
      linking,
    });
  }

  // ARM 2 — THE FETCH RUN
  const fetchResult = await runAffiliateStoreFetch("cron");

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
