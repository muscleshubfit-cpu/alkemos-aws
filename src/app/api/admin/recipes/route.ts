import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  adminGetRecipeStats,
  adminListRecipeQueue,
  adminListRecipes,
  adminRequeueRecipe,
  adminUnpublishRecipe,
  adminRepublishRecipe,
} from "@/lib/recipes-admin";
import { consecutiveRecipeFailureDays } from "@/lib/recipes-queue";

/**
 * ADMIN RECIPES — the /admin/recipes dashboard's data + actions
 * (HEALTHY-RECIPES-PLATFORM plan §11-10 — the /api/admin/blog/review
 * pattern: admin-gated, narrow, honest).
 *
 *   GET  /api/admin/recipes
 *        → { stats, queue, recipes, health: { breakerTripped, streak } }
 *
 *   POST /api/admin/recipes   { action, queueId? , recipeId?, reason? }
 *        → requeue | unpublish | republish
 *
 * ACTIONS (all narrow + honest):
 *   - requeue: a held/failed queue row returns to its RERUN_TARGET
 *     stage (the blog-repair contract — plan §6.3).
 *   - unpublish: the atomic unpublish_recipe_pair RPC (both versions
 *     hide together — §11-9) with a recorded reason.
 *   - republish: the atomic publish RPC re-runs its OWN pair /
 *     verification / image checks — nothing is forced through.
 */
export const maxDuration = 30;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const [stats, queue, recipes, streak] = await Promise.all([
    adminGetRecipeStats(),
    adminListRecipeQueue(40),
    adminListRecipes(60),
    consecutiveRecipeFailureDays(),
  ]);

  return NextResponse.json({
    stats,
    queue,
    recipes,
    health: {
      breakerTripped: streak >= 3,
      consecutiveFailureDays: streak,
    },
  });
}

export async function POST(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    queueId?: string;
    recipeId?: string;
    reason?: string;
  };

  switch (body.action) {
    case "requeue": {
      if (!body.queueId || !UUID_RE.test(body.queueId)) {
        return NextResponse.json({ error: "Invalid queueId" }, { status: 400 });
      }
      const res = await adminRequeueRecipe(body.queueId);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 409 });
      return NextResponse.json({ ok: true });
    }
    case "unpublish": {
      if (!body.recipeId || !UUID_RE.test(body.recipeId)) {
        return NextResponse.json({ error: "Invalid recipeId" }, { status: 400 });
      }
      const res = await adminUnpublishRecipe(body.recipeId, body.reason ?? "");
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 409 });
      return NextResponse.json({ ok: true });
    }
    case "republish": {
      if (!body.recipeId || !UUID_RE.test(body.recipeId)) {
        return NextResponse.json({ error: "Invalid recipeId" }, { status: 400 });
      }
      const res = await adminRepublishRecipe(body.recipeId);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 409 });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
