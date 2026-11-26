import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import {
  getAffiliateStoreAutomationSettings,
  updateAffiliateStoreAutomationSettings,
  listAffiliateStoreFetchCategories,
  upsertAffiliateStoreFetchCategory,
  listAffiliateStoreFetchRuns,
  nextFetchDueAt,
  type AutomationSettingsPatch,
} from "@/lib/affiliate-store-automation";
import { runAffiliateStoreFetchManual } from "@/lib/affiliate-store-fetch";
import {
  scanLinkSuggestions,
  approveLinkSuggestion,
  rejectLinkSuggestion,
  setInlineLinkActive,
} from "@/lib/affiliate-store-linking";
import { buildStoreAnalyticsReport, analyticsDailyTotals } from "@/lib/affiliate-store-analytics";
import { creatorsApiCredentialsStatus } from "@/lib/amazon-creators-api";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 600;

/**
 * ADMIN AFFILIATE-STORE AUTOMATION API (Phase 529 — the control plane
 * behind /admin/affiliate-store/automation):
 *
 *   GET  /api/admin/affiliate-store/automation?analyticsWindow=30
 *     → { settings, nextDueAt, credentials, categories, runs,
 *         suggestions, inlineLinks, analytics, daily }
 *
 *   POST /api/admin/affiliate-store/automation { action, ... }
 *     → settings {is_enabled?, frequency?, max_new_per_run?,
 *         max_links_per_page?, auto_link_enabled?,
 *         link_score_threshold?}
 *     → category-config {category_id, keywords?, browse_node_id?,
 *         target_count?, is_active?}
 *     → run-now          — a MANUAL fetch run (bypasses the due-check;
 *                          the DB overlap lock still applies)
 *     → linking-scan     — a manual relevance scan
 *     → approve-link {id} / reject-link {id}
 *     → toggle-link {id, active}
 *
 * LAWS: requireAdmin BEFORE any data-layer call (the 0105 channel law);
 * credentials surface as BOOLEANS only (never values); the suggestions
 * queue is an internal editorial workflow (admin-only by RLS).
 */

export async function GET(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  const windowDays = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("analyticsWindow") ?? 30) || 30, 7),
    90,
  );
  const [settings, categories, runs, analytics, daily] = await Promise.all([
    getAffiliateStoreAutomationSettings(),
    listAffiliateStoreFetchCategories(),
    listAffiliateStoreFetchRuns(12),
    buildStoreAnalyticsReport(windowDays),
    analyticsDailyTotals(14),
  ]);

  // suggestions + applied links (admin read, service role)
  let suggestions: Array<Record<string, unknown>> = [];
  let inlineLinks: Array<Record<string, unknown>> = [];
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    const [suggRes, linkRes] = await Promise.all([
      supabaseAdmin
        .from("affiliate_store_link_suggestions")
        .select(
          "id,page_type,page_slug,product_id,relevance_score,reason,anchor_phrase,status,created_at",
        )
        .in("status", ["pending", "approved"])
        .order("relevance_score", { ascending: false })
        .limit(60),
      supabaseAdmin
        .from("affiliate_store_inline_links")
        .select(
          "id,page_type,page_slug,product_id,anchor_phrase,is_active,source,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(80),
    ]);
    suggestions = (suggRes.data ?? []) as Array<Record<string, unknown>>;
    inlineLinks = (linkRes.data ?? []) as Array<Record<string, unknown>>;
  }

  return NextResponse.json({
    settings,
    nextDueAt: nextFetchDueAt(settings),
    credentials: creatorsApiCredentialsStatus(),
    categories,
    runs,
    suggestions,
    inlineLinks,
    analytics,
    daily,
  });
}

export async function POST(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  switch (action) {
    case "settings": {
      const patch: AutomationSettingsPatch = {};
      if (typeof body?.is_enabled === "boolean") patch.is_enabled = body.is_enabled;
      if (body?.frequency === "daily" || body?.frequency === "weekly" || body?.frequency === "monthly") {
        patch.frequency = body.frequency;
      }
      if (typeof body?.max_new_per_run === "number") patch.max_new_per_run = body.max_new_per_run;
      if (typeof body?.max_links_per_page === "number") patch.max_links_per_page = body.max_links_per_page;
      if (typeof body?.auto_link_enabled === "boolean") patch.auto_link_enabled = body.auto_link_enabled;
      if (typeof body?.link_score_threshold === "number") patch.link_score_threshold = body.link_score_threshold;
      const result = await updateAffiliateStoreAutomationSettings(patch);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
      return NextResponse.json({ ok: true, settings: await getAffiliateStoreAutomationSettings() });
    }
    case "category-config": {
      const category_id = String(body?.category_id ?? "");
      if (!category_id) {
        return NextResponse.json({ error: "category_id is required" }, { status: 400 });
      }
      const result = await upsertAffiliateStoreFetchCategory({
        category_id,
        keywords: Array.isArray(body?.keywords)
          ? (body.keywords as unknown[]).map((k) => String(k))
          : undefined,
        browse_node_id:
          body?.browse_node_id === null
            ? null
            : typeof body?.browse_node_id === "string"
              ? body.browse_node_id
              : undefined,
        target_count: typeof body?.target_count === "number" ? body.target_count : undefined,
        is_active: typeof body?.is_active === "boolean" ? body.is_active : undefined,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
      return NextResponse.json({ ok: true });
    }
    case "run-now": {
      const result = await runAffiliateStoreFetchManual();
      return NextResponse.json({ ok: result.status !== "failed", result });
    }
    case "linking-scan": {
      const result = await scanLinkSuggestions();
      return NextResponse.json({ ok: true, result });
    }
    case "approve-link": {
      const result = await approveLinkSuggestion(String(body?.id ?? ""));
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
      return NextResponse.json({ ok: true });
    }
    case "reject-link": {
      const result = await rejectLinkSuggestion(String(body?.id ?? ""));
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
      return NextResponse.json({ ok: true });
    }
    case "toggle-link": {
      const result = await setInlineLinkActive(
        String(body?.id ?? ""),
        body?.active === true,
      );
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: `unknown action "${action}"` }, { status: 400 });
  }
}
