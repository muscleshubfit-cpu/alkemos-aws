import { NextRequest, NextResponse } from "next/server";
import { requireUser, authRequired } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

/**
 * RECIPE FAVORITES — the authed-only favorites CRUD
 * (HEALTHY-RECIPES-PLATFORM plan §9.1 / decision ق6).
 *
 *   GET    /api/recipes/favorite?recipeId=<uuid>  → { favorited: boolean }
 *   POST   /api/recipes/favorite  { recipeId }    → insert (idempotent)
 *   DELETE /api/recipes/favorite  { recipeId }    → remove
 *
 * RLS is the real gate (owner-only rows — migration 0108); this handler
 * authenticates and validates shape only. The 401 branches let the
 * client island render its honest sign-in invite.
 *
 * Idempotency: POST on an existing row is a no-op (upsert on the
 * unique (user_id, recipe_id)); DELETE of a missing row is a no-op.
 */
export const maxDuration = 20;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function recipeIdOf(raw: unknown): string | null {
  const id = typeof raw === "string" ? raw.trim() : "";
  return UUID_RE.test(id) ? id : null;
}

async function readBody(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  if (!authRequired) return NextResponse.json({ favorited: false, demo: true });
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const recipeId = recipeIdOf(request.nextUrl.searchParams.get("recipeId"));
  if (!recipeId) return NextResponse.json({ error: "Invalid recipeId" }, { status: 400 });

  const { data } = await supabaseAdmin
    .from("recipe_favorites")
    .select("id")
    .eq("user_id", auth.id)
    .eq("recipe_id", recipeId)
    .maybeSingle();
  return NextResponse.json({ favorited: Boolean(data) });
}

export async function POST(request: NextRequest) {
  if (!authRequired) return NextResponse.json({ ok: true, demo: true });
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const body = await readBody(request);
  const recipeId = recipeIdOf(body.recipeId);
  if (!recipeId) return NextResponse.json({ error: "Invalid recipeId" }, { status: 400 });

  // Verify the recipe exists (and is published) before favoriting.
  const { data: recipe } = await supabaseAdmin
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("status", "published")
    .maybeSingle();
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("recipe_favorites")
    .upsert({ user_id: auth.id, recipe_id: recipeId }, { onConflict: "user_id,recipe_id" });
  if (error) {
    return NextResponse.json({ error: "Could not save favorite" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, favorited: true });
}

export async function DELETE(request: NextRequest) {
  if (!authRequired) return NextResponse.json({ ok: true, demo: true });
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const body = await readBody(request);
  const recipeId = recipeIdOf(body.recipeId);
  if (!recipeId) return NextResponse.json({ error: "Invalid recipeId" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("recipe_favorites")
    .delete()
    .eq("user_id", auth.id)
    .eq("recipe_id", recipeId);
  if (error) {
    return NextResponse.json({ error: "Could not remove favorite" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, favorited: false });
}
