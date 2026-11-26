/**
 * STORE-AUTOMATION — the settings + run-ledger data layer of the Alkemos
 * Affiliate Store automation system (Phase 529, owner order 2026-11-27).
 *
 * LAWS:
 *  - Service-role only (the cron + admin routes sit behind verifyCronAuth /
 *    requireAdmin; this layer is the second lock — the 0105 channel law).
 *  - THE OVERLAP LOCK (migration 0120): at most ONE run row may hold
 *    status='running' (partial UNIQUE index). claimFetchRun() inserts the
 *    running row and treats a unique violation as "another run is active".
 *    A stale lock (running > 2 h — a crashed worker) is reaped to
 *    status='failed' with error_summary 'stale-lock-recovered' so a crash
 *    can NEVER freeze the schedule permanently.
 *  - Honest dormancy: missing settings row → defaults (disabled); missing
 *    Supabase env → null/empty reads, honest write errors.
 *  - Nothing here touches System 1 (partner referral family) — §0.
 */

import type {
  Database,
  AffiliateStoreFetchRun,
} from "./supabase/types";

type SettingsUpdate = Database["public"]["Tables"]["affiliate_store_automation_settings"]["Update"];
type FetchCategoryUpdate = Database["public"]["Tables"]["affiliate_store_fetch_categories"]["Update"];
type FetchCategoryInsert = Database["public"]["Tables"]["affiliate_store_fetch_categories"]["Insert"];
type FetchRunInsert = Database["public"]["Tables"]["affiliate_store_fetch_runs"]["Insert"];
type FetchRunUpdate = Database["public"]["Tables"]["affiliate_store_fetch_runs"]["Update"];
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase/admin";

function client() {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  return supabaseAdmin;
}

/* ───────────────────────── settings ───────────────────────── */

export type AffiliateStoreAutomationSettingsView = {
  is_enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  max_new_per_run: number;
  max_links_per_page: number;
  auto_link_enabled: boolean;
  link_score_threshold: number;
  last_run_at: string | null;
};

export const DEFAULT_SETTINGS: AffiliateStoreAutomationSettingsView = {
  is_enabled: false,
  frequency: "weekly",
  max_new_per_run: 12,
  max_links_per_page: 3,
  auto_link_enabled: true,
  link_score_threshold: 30,
  last_run_at: null,
};

const SETTINGS_COLUMNS =
  "is_enabled,frequency,max_new_per_run,max_links_per_page,auto_link_enabled,link_score_threshold,last_run_at";

export async function getAffiliateStoreAutomationSettings(): Promise<AffiliateStoreAutomationSettingsView> {
  const db = client();
  if (!db) return { ...DEFAULT_SETTINGS };
  const { data } = await db
    .from("affiliate_store_automation_settings")
    .select(SETTINGS_COLUMNS)
    .eq("id", 1)
    .maybeSingle();
  if (!data) return { ...DEFAULT_SETTINGS };
  const row = data as Database["public"]["Tables"]["affiliate_store_automation_settings"]["Row"];
  return {
    is_enabled: row.is_enabled,
    frequency: (["daily", "weekly", "monthly"] as const).includes(
      row.frequency as "daily" | "weekly" | "monthly",
    )
      ? (row.frequency as "daily" | "weekly" | "monthly")
      : "weekly",
    max_new_per_run: row.max_new_per_run,
    max_links_per_page: row.max_links_per_page,
    auto_link_enabled: row.auto_link_enabled,
    link_score_threshold: Number(row.link_score_threshold),
    last_run_at: row.last_run_at,
  };
}

export type AutomationSettingsPatch = Partial<{
  is_enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  max_new_per_run: number;
  max_links_per_page: number;
  auto_link_enabled: boolean;
  link_score_threshold: number;
}>;

export async function updateAffiliateStoreAutomationSettings(
  patch: AutomationSettingsPatch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const update: SettingsUpdate = { updated_at: new Date().toISOString() };
  if (typeof patch.is_enabled === "boolean") update.is_enabled = patch.is_enabled;
  if (patch.frequency && ["daily", "weekly", "monthly"].includes(patch.frequency)) {
    update.frequency = patch.frequency;
  }
  if (typeof patch.max_new_per_run === "number") {
    if (patch.max_new_per_run < 1 || patch.max_new_per_run > 40) {
      return { ok: false, error: "max_new_per_run must be 1..40" };
    }
    update.max_new_per_run = Math.round(patch.max_new_per_run);
  }
  if (typeof patch.max_links_per_page === "number") {
    if (patch.max_links_per_page < 1 || patch.max_links_per_page > 6) {
      return { ok: false, error: "max_links_per_page must be 1..6" };
    }
    update.max_links_per_page = Math.round(patch.max_links_per_page);
  }
  if (typeof patch.auto_link_enabled === "boolean") update.auto_link_enabled = patch.auto_link_enabled;
  if (typeof patch.link_score_threshold === "number") {
    if (patch.link_score_threshold < 0 || patch.link_score_threshold > 100) {
      return { ok: false, error: "link_score_threshold must be 0..100" };
    }
    update.link_score_threshold = patch.link_score_threshold;
  }
  const { error } = await db
    .from("affiliate_store_automation_settings")
    .update(update)
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/* ───────────────────────── frequency due-check ───────────────────────── */

const FREQUENCY_DAYS: Record<"daily" | "weekly" | "monthly", number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

/**
 * Is a run due now? (The scheduler fires daily; the frequency decides
 * whether THIS fire executes.) Manual runs bypass the check entirely.
 */
export function isFetchDue(
  settings: Pick<AffiliateStoreAutomationSettingsView, "frequency" | "last_run_at">,
  now: Date = new Date(),
): boolean {
  if (!settings.last_run_at) return true;
  const last = new Date(settings.last_run_at).getTime();
  if (Number.isNaN(last)) return true;
  const gapMs = FREQUENCY_DAYS[settings.frequency] * 24 * 60 * 60 * 1000;
  // A small tolerance (10 min) absorbs scheduler drift.
  return now.getTime() - last >= gapMs - 10 * 60 * 1000;
}

/** The next due moment (for the admin panel display). */
export function nextFetchDueAt(
  settings: Pick<AffiliateStoreAutomationSettingsView, "frequency" | "last_run_at">,
): string | null {
  if (!settings.last_run_at) return new Date().toISOString();
  const last = new Date(settings.last_run_at).getTime();
  if (Number.isNaN(last)) return new Date().toISOString();
  return new Date(last + FREQUENCY_DAYS[settings.frequency] * 24 * 60 * 60 * 1000).toISOString();
}

/* ───────────────────────── fetch categories ───────────────────────── */

export type AffiliateStoreFetchCategoryView = {
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

export async function listAffiliateStoreFetchCategories(): Promise<AffiliateStoreFetchCategoryView[]> {
  const db = client();
  if (!db) return [];
  const [configs, cats, counts] = await Promise.all([
    db.from("affiliate_store_fetch_categories").select("category_id,keywords,browse_node_id,target_count,is_active"),
    db.from("affiliate_store_categories").select("id,slug,name,parent_id"),
    db.from("affiliate_store_products").select("category_id"),
  ]);
  const catRows = (cats.data ?? []) as Array<{
    id: string; slug: string; name: string; parent_id: string | null;
  }>;
  const catById = new Map(catRows.map((c) => [c.id, c]));
  const countMap = new Map<string, number>();
  for (const row of (counts.data ?? []) as Array<{ category_id: string }>) {
    countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1);
  }
  const out: AffiliateStoreFetchCategoryView[] = [];
  for (const cfg of (configs.data ?? []) as Array<{
    category_id: string; keywords: string[]; browse_node_id: string | null;
    target_count: number; is_active: boolean;
  }>) {
    const cat = catById.get(cfg.category_id);
    if (!cat) continue;
    const parent = cat.parent_id ? catById.get(cat.parent_id) : null;
    out.push({
      category_id: cfg.category_id,
      category_slug: cat.slug,
      category_name: cat.name,
      main_name: parent?.name ?? null,
      product_count: countMap.get(cfg.category_id) ?? 0,
      keywords: cfg.keywords ?? [],
      browse_node_id: cfg.browse_node_id,
      target_count: cfg.target_count,
      is_active: cfg.is_active,
    });
  }
  return out.sort((a, b) => a.category_name.localeCompare(b.category_name));
}

export type FetchCategoryPatch = {
  category_id: string;
  keywords?: string[];
  browse_node_id?: string | null;
  target_count?: number;
  is_active?: boolean;
};

export async function upsertAffiliateStoreFetchCategory(
  patch: FetchCategoryPatch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const update: FetchCategoryUpdate = { updated_at: new Date().toISOString() };
  if (patch.keywords) {
    const kws = patch.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 8);
    if (kws.length === 0) return { ok: false, error: "at least one keyword is required" };
    update.keywords = kws;
  }
  if (patch.browse_node_id !== undefined) {
    const node = (patch.browse_node_id ?? "").trim();
    if (node && !/^\d{1,19}$/.test(node)) {
      return { ok: false, error: "browse node must be a positive integer id" };
    }
    update.browse_node_id = node || null;
  }
  if (typeof patch.target_count === "number") {
    if (patch.target_count < 1 || patch.target_count > 60) {
      return { ok: false, error: "target_count must be 1..60" };
    }
    update.target_count = Math.round(patch.target_count);
  }
  if (typeof patch.is_active === "boolean") update.is_active = patch.is_active;
  const { error } = await db
    .from("affiliate_store_fetch_categories")
    .update(update)
    .eq("category_id", patch.category_id);
  if (error) {
    // A config row that does not exist yet: insert it (keywords required).
    if (patch.keywords) {
      const kws = patch.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 8);
      const insert: FetchCategoryInsert = {
        category_id: patch.category_id,
        keywords: kws.length > 0 ? kws : ["fitness"],
        is_active: patch.is_active ?? true,
        target_count: patch.target_count ?? 6,
      };
      if (patch.browse_node_id !== undefined) {
        insert.browse_node_id = (patch.browse_node_id ?? "").trim() || null;
      }
      const ins = await db.from("affiliate_store_fetch_categories").insert(insert);
      if (ins.error) return { ok: false, error: ins.error.message };
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/* ───────────────────────── the run ledger + OVERLAP LOCK ───────────────────────── */

export type RunEvent = {
  at: string;
  kind: string;
  detail?: string;
};

export type ClaimRunResult =
  | { ok: true; runId: string }
  | { ok: false; reason: "another-run-active" | "db-error"; error?: string };

const STALE_LOCK_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Claim the run slot: reap any stale running row (> 2 h — a crashed
 * worker becomes an honest 'failed' with 'stale-lock-recovered'), then
 * insert the new 'running' row. A unique-index violation means another
 * run is active → the caller skips (duplicate execution impossible).
 */
export async function claimAffiliateStoreFetchRun(
  trigger: "cron" | "manual",
  settingsSnapshot: Record<string, unknown> = {},
): Promise<ClaimRunResult> {
  const db = client();
  if (!db) return { ok: false, reason: "db-error", error: "Supabase not configured" };

  // 1) reap stale locks
  const { data: running } = await db
    .from("affiliate_store_fetch_runs")
    .select("id,started_at")
    .eq("status", "running")
    .limit(5);
  for (const row of (running ?? []) as Array<{ id: string; started_at: string }>) {
    if (Date.now() - new Date(row.started_at).getTime() > STALE_LOCK_MS) {
      await db
        .from("affiliate_store_fetch_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_summary: "stale-lock-recovered (run exceeded 2h — crashed worker reaped)",
        })
        .eq("id", row.id);
    } else {
      return { ok: false, reason: "another-run-active" };
    }
  }

  // 2) claim the slot (the partial unique index enforces single-running)
  const insert: FetchRunInsert = {
    trigger,
    status: "running",
    settings_snapshot: settingsSnapshot as Database["public"]["Tables"]["affiliate_store_fetch_runs"]["Insert"]["settings_snapshot"],
  };
  const { data, error } = await db
    .from("affiliate_store_fetch_runs")
    .insert(insert)
    .select("id")
    .single();
  if (error) {
    const code = (error as { code?: string }).code ?? "";
    if (code === "23505" || /unique|duplicate/i.test(error.message ?? "")) {
      return { ok: false, reason: "another-run-active" };
    }
    return { ok: false, reason: "db-error", error: error.message };
  }
  return { ok: true, runId: (data as { id: string }).id };
}

export type FinishRunPatch = {
  status: "succeeded" | "partial" | "failed" | "skipped";
  counters?: Partial<{
    candidates: number;
    inserted: number;
    updated: number;
    unchanged: number;
    rejected: number;
    hidden: number;
  }>;
  errorSummary?: string | null;
  events?: RunEvent[];
};

export async function finishAffiliateStoreFetchRun(
  runId: string,
  patch: FinishRunPatch,
): Promise<void> {
  const db = client();
  if (!db) return;
  const update: FetchRunUpdate = {
    status: patch.status,
    finished_at: new Date().toISOString(),
  };
  if (patch.counters) Object.assign(update, patch.counters);
  if (patch.errorSummary !== undefined) update.error_summary = patch.errorSummary;
  if (patch.events) update.events = patch.events as Database["public"]["Tables"]["affiliate_store_fetch_runs"]["Update"]["events"];
  await db.from("affiliate_store_fetch_runs").update(update).eq("id", runId);
}

export async function appendAffiliateStoreRunEvent(
  runId: string,
  event: RunEvent,
): Promise<void> {
  const db = client();
  if (!db) return;
  // Read-modify-write on the events jsonb (single-writer by the lock).
  const { data } = await db
    .from("affiliate_store_fetch_runs")
    .select("events")
    .eq("id", runId)
    .maybeSingle();
  const existing = (data as { events?: unknown } | null)?.events;
  const list = Array.isArray(existing) ? (existing as RunEvent[]) : [];
  list.push(event);
  await db.from("affiliate_store_fetch_runs").update({ events: list }).eq("id", runId);
}

export async function markAffiliateStoreLastRun(now: Date = new Date()): Promise<void> {
  const db = client();
  if (!db) return;
  await db
    .from("affiliate_store_automation_settings")
    .update({ last_run_at: now.toISOString() })
    .eq("id", 1);
}

export type AffiliateStoreFetchRunView = AffiliateStoreFetchRun & {
  events_list?: RunEvent[];
};

export async function listAffiliateStoreFetchRuns(limit = 15): Promise<AffiliateStoreFetchRunView[]> {
  const db = client();
  if (!db) return [];
  const { data } = await db
    .from("affiliate_store_fetch_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as AffiliateStoreFetchRun[]).map((r) => ({
    ...r,
    events_list: Array.isArray(r.events) ? (r.events as RunEvent[]) : [],
  }));
}
