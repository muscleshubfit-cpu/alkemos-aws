/**
 * RECIPES-ADMIN — the admin panel data ops
 * (HEALTHY-RECIPES-PLATFORM plan §4/§11-10 — the blog-admin.ts pattern).
 *
 * All writes run through the service-role client (the pipeline law:
 * «إنشاء/تعديل/نشر آلي = service role حصرًا؛ اللوحة = أدمن»).
 * The routes that call these sit behind requireAdmin + AdminGate +
 * noindex (the /admin surface law — inherited wholesale).
 *
 * Honest-state law: requeue/unpublish NEVER mutate verification history
 * silently — every admin action appends a record to recipes.verification.
 */

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { requeueRecipeRow } from "./recipes-queue";

export type AdminRecipeQueueRow = {
  id: string;
  recipe_id: string | null;
  status: string;
  idea: Record<string, unknown>;
  error_message: string | null;
  rerun_target: string | null;
  repair_cycles: number;
  scheduled_for: string;
  created_at: string;
  published_at: string | null;
  pair_slug: string | null;
};

function parseCell(v: unknown): Record<string, unknown> {
  if (!v) return {};
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return p && typeof p === "object" ? (p as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/** The queue rows the dashboard lists (last 30 scheduled days). */
export async function adminListRecipeQueue(limit = 40): Promise<AdminRecipeQueueRow[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("recipe_generation_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    recipe_id: (row.recipe_id as string) ?? null,
    status: String(row.status ?? "idea"),
    idea: parseCell(row.idea),
    error_message: (row.error_message as string) ?? null,
    rerun_target: (row.rerun_target as string) ?? null,
    repair_cycles: Number(row.repair_cycles ?? 0),
    scheduled_for: String(row.scheduled_for ?? ""),
    created_at: String(row.created_at ?? ""),
    published_at: (row.published_at as string) ?? null,
    pair_slug: null,
  }));
}

export type AdminRecipeRow = {
  id: string;
  pair_slug: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  image_verified: boolean;
  verification_status: string;
  cuisines: string[];
  diets: string[];
  title_ar: string | null;
  title_en: string | null;
  slug: string | null;
  favoriteCount: number;
};

/** Master records with their version titles + favorite counts. */
export async function adminListRecipes(limit = 60): Promise<AdminRecipeRow[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("recipes")
    .select(
      `id, pair_slug, status, scheduled_for, published_at, image_verified, verification_status, cuisines, diets,
       recipe_versions(language, title, slug)`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  const rows = data as Array<Record<string, unknown>>;
  const ids = rows.map((r) => String(r.id));
  const favCounts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: favs } = await supabaseAdmin
      .from("recipe_favorites")
      .select("recipe_id")
      .in("recipe_id", ids);
    for (const f of (favs ?? []) as Array<{ recipe_id: string }>) {
      favCounts.set(f.recipe_id, (favCounts.get(f.recipe_id) ?? 0) + 1);
    }
  }

  return rows.map((r) => {
    const versions = (r.recipe_versions as Array<{ language: string; title: string; slug: string }> | null) ?? [];
    const ar = versions.find((v) => v.language === "ar");
    const en = versions.find((v) => v.language === "en");
    return {
      id: String(r.id),
      pair_slug: String(r.pair_slug ?? ""),
      status: String(r.status ?? "draft"),
      scheduled_for: (r.scheduled_for as string) ?? null,
      published_at: (r.published_at as string) ?? null,
      image_verified: Boolean(r.image_verified),
      verification_status: String(r.verification_status ?? "pending"),
      cuisines: Array.isArray(r.cuisines) ? (r.cuisines as string[]) : [],
      diets: Array.isArray(r.diets) ? (r.diets as string[]) : [],
      title_ar: ar?.title ?? null,
      title_en: en?.title ?? null,
      slug: en?.slug ?? ar?.slug ?? null,
      favoriteCount: favCounts.get(String(r.id)) ?? 0,
    };
  });
}

export type AdminRecipeStats = {
  totalPairs: number;
  published: number;
  held: number;
  failed: number;
  inProduction: number;
  last30Days: { published: number; held: number; failed: number };
  favoritesTotal: number;
  queueOpen: number;
};

export async function adminGetRecipeStats(): Promise<AdminRecipeStats> {
  const empty: AdminRecipeStats = {
    totalPairs: 0,
    published: 0,
    held: 0,
    failed: 0,
    inProduction: 0,
    queueOpen: 0,
    last30Days: { published: 0, held: 0, failed: 0 },
    favoritesTotal: 0,
  };
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return empty;

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [masters, queue, favs] = await Promise.all([
    supabaseAdmin.from("recipes").select("status, published_at, verification"),
    supabaseAdmin.from("recipe_generation_queue").select("status, scheduled_for, created_at"),
    supabaseAdmin.from("recipe_favorites").select("id", { count: "exact", head: true }),
  ]);

  const rows = (masters.data ?? []) as Array<{ status: string; published_at: string | null }>;
  const q = (queue.data ?? []) as Array<{ status: string; scheduled_for: string; created_at: string }>;
  const byStatus = new Map<string, number>();
  for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);

  const last30 = { published: 0, held: 0, failed: 0 };
  for (const r of q) {
    if (r.created_at < since) continue;
    if (r.status === "published") last30.published++;
    else if (r.status === "held") last30.held++;
    else if (r.status === "failed") last30.failed++;
  }

  return {
    totalPairs: rows.length,
    published: byStatus.get("published") ?? 0,
    held: byStatus.get("held") ?? 0,
    failed: byStatus.get("failed") ?? 0,
    inProduction: byStatus.get("in_production") ?? 0,
    last30Days: last30,
    favoritesTotal: favs.count ?? 0,
    queueOpen: q.filter((x) => !["published", "failed", "held"].includes(x.status)).length,
  };
}

/** Admin action: requeue a held/failed row to its rerun target stage. */
export async function adminRequeueRecipe(queueId: string): Promise<{ ok: boolean; error: string | null }> {
  return requeueRecipeRow(queueId);
}

/** Admin action (plan §11-9 «إلغاء نشر وصفة عند خطأ مؤثر»): the atomic
 *  unpublish RPC + ISR flush. Both versions hide TOGETHER or nothing. */
export async function adminUnpublishRecipe(
  recipeId: string,
  reason: string,
): Promise<{ ok: boolean; error: string | null }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return { ok: false, error: "admin client not configured" };
  const { error } = await supabaseAdmin.rpc("unpublish_recipe_pair", {
    p_recipe_id: recipeId,
    p_reason: reason.slice(0, 500) || "admin-unpublish",
  });
  if (error) return { ok: false, error: error.message };
  const { revalidateRecipeCaches } = await import("./recipes-server");
  await revalidateRecipeCaches();
  return { ok: true, error: null };
}

/** Admin action: re-publish an unpublished-but-verified pair (the atomic
 *  RPC re-checks the pair + verification + image — nothing forced). */
export async function adminRepublishRecipe(recipeId: string): Promise<{ ok: boolean; error: string | null }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return { ok: false, error: "admin client not configured" };
  const { error } = await supabaseAdmin.rpc("publish_recipe_pair", { p_recipe_id: recipeId });
  if (error) return { ok: false, error: error.message };
  const { revalidateRecipeCaches } = await import("./recipes-server");
  await revalidateRecipeCaches();
  return { ok: true, error: null };
}

/** The queue-health strip shape the dashboard consumes (extends the
 *  /api/ai/queue-health pattern with the recipes family counters). */
export async function adminRecipeQueueHealth(): Promise<{
  openRows: number;
  oldestOpenHours: number | null;
  lastPublishedAt: string | null;
  breakerTripped: boolean;
}> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin)
    return { openRows: 0, oldestOpenHours: null, lastPublishedAt: null, breakerTripped: false };
  const { data } = await supabaseAdmin
    .from("recipe_generation_queue")
    .select("status, created_at, published_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Array<{ status: string; created_at: string; published_at: string | null }>;
  const open = rows.filter((r) => !["published", "failed", "held"].includes(r.status));
  const oldest = open.length > 0 ? open[open.length - 1] : null;
  const lastPublished = rows.find((r) => r.status === "published");
  return {
    openRows: open.length,
    oldestOpenHours: oldest ? (Date.now() - new Date(oldest.created_at).getTime()) / 3600_000 : null,
    lastPublishedAt: lastPublished?.published_at ?? null,
    breakerTripped: false, // set by the API route from consecutiveRecipeFailureDays()
  };
}
