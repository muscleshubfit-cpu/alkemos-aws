import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import type { Database } from "@/lib/supabase/types";

// tool_slug is a DB enum (check constraint) — this union is its mirror.
type SavedToolSlug = Database["public"]["Tables"]["saved_results"]["Row"]["tool_slug"];

/**
 * GET /api/admin/saved-results
 *
 * Returns saved tool results across ALL users (for coaches/admins).
 *
 * Query params:
 *   ?tool=calorie-calculator  — filter by tool
 *   ?limit=50                 — default 100, max 500
 *   ?offset=0
 *
 * Response shape:
 *   {
 *     results: Array<{
 *       id, tool_slug, title, result_data, created_at,
 *       user_id, user_email, user_name
 *     }>,
 *     total: number
 *   }
 */
export async function GET(request: NextRequest) {
  if (!authRequired) {
    return NextResponse.json({ results: [], total: 0, demo: true });
  }

  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const tool = searchParams.get("tool");
  const limit = Math.min(
    500,
    Math.max(1, parseInt(searchParams.get("limit") || "100", 10)),
  );
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Build query — flat select, then resolve user info with ONE .in()
  // profiles lookup (the house pattern from /api/admin/site-assignments).
  // FIX 2026-10-27 (live-measured 500): saved_results.user_id references
  // auth.users(id), NOT profiles — there is no FK for PostgREST to resolve
  // a `profiles!inner(...)` embed, so the old single query died with
  // «Could not find a relationship between 'saved_results' and 'profiles'
  // in the schema cache» and the admin page surfaced the raw error.
  let query = supabase
    .from("saved_results")
    .select("id, tool_slug, title, result_data, created_at, user_id", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tool) {
    // Trust-boundary cast: invalid values simply match no rows at the DB
    // check-constraint level (identical runtime behavior to the old untyped
    // builder — the constraint is the runtime guard).
    query = query.eq("tool_slug", tool as SavedToolSlug);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[admin/saved-results] query failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Resolve the page's user_ids against profiles in ONE follow-up query
  // (saved_results.user_id → auth.users, no profiles FK — see note above).
  const rows = (data || []) as Array<{
    id: string;
    tool_slug: SavedToolSlug;
    title: string | null;
    result_data: Database["public"]["Tables"]["saved_results"]["Row"]["result_data"];
    created_at: string;
    user_id: string;
  }>;
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const nameOf = new Map<string, { full_name: string | null; email: string | null }>();
  if (userIds.length > 0) {
    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    if (pErr) {
      // Non-fatal: the listing still renders — unknown users show «—».
      console.error("[admin/saved-results] profiles lookup failed:", pErr.message);
    } else {
      for (const p of prof ?? []) {
        nameOf.set(p.id, { full_name: p.full_name, email: p.email });
      }
    }
  }
  const results = rows.map((r) => {
    const p = nameOf.get(r.user_id);
    return {
      id: r.id,
      tool_slug: r.tool_slug,
      title: r.title,
      result_data: r.result_data,
      created_at: r.created_at,
      user_id: r.user_id,
      user_name: p?.full_name || "—",
      user_email: p?.email || "—",
    };
  });

  return NextResponse.json({
    results,
    total: count || 0,
    limit,
    offset,
  });
}
