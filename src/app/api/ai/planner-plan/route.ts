import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { enrichWorkoutPlanWithLibrary } from "@/lib/ai-workout-exercise-match";

/**
 * GET /api/ai/planner-plan?kind=nutrition|workout — Phase 183 (owner
 * decree 2026-09-13 «البوول الموحد» — spec "Alkemos — Membership &
 * Plan Changes").
 *
 * MEMBER hydration endpoint: returns the caller's LATEST AI-planner
 * plan of the requested kind (rows written by the demo routes'
 * auto-save — source 'ai-planner'). This is what makes the member's
 * generated plan survive navigation, refreshes, AND devices: the
 * planner pages mount → fetch this → render the account copy
 * (cross-device), falling back to the localStorage copy (guest /
 * offline) when 401/empty.
 *
 * Guests get 401 — their plan lives on-device (plan-persistence.ts);
 * that is the spec's no-signup-wall split, and the registration nudge
 * (the account copy is the advertised benefit) stays soft.
 *
 * Workout plans are stored RAW (the honest generated output); this
 * route enriches at read time with the site's exercise library (the
 * §12.35 server-only enrichment — the 1.6MB array never ships).
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json(
      { error: "auth_required" },
      { status: 401 },
    );
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 500 });
  }

  const kind = new URL(request.url).searchParams.get("kind") === "workout"
    ? "workout"
    : "nutrition";
  const planType = kind === "nutrition" ? "meal" : "workout";

  const { data, error } = await supabaseAdmin
    .from("plans")
    .select("id, title, content, created_at")
    .eq("client_id", auth.id)
    .eq("type", planType)
    .eq("status", "approved")
    .eq("is_current", true)
    // Only AI-planner rows — coach/EVO-sourced plans have their own
    // surfaces; this endpoint hydrates the planner PAGES.
    .eq("content->>source", "ai-planner")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[api/ai/planner-plan] fetch error:", error.message);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ plan: null });
  }

  const content = (data.content ?? {}) as {
    source?: string;
    inputs?: Record<string, unknown>;
    medical_disclosure?: unknown;
    plan?: unknown;
  };

  // Enrich workout plans at read time (server-only library match).
  // The row was written by our own route with a validated plan — but
  // storage is never blindly trusted: a non-conforming shape skips
  // enrichment and renders raw (the try/catch floor stays).
  let plan = content.plan ?? null;
  if (
    kind === "workout" &&
    plan &&
    typeof plan === "object" &&
    Array.isArray((plan as { days?: unknown }).days)
  ) {
    try {
      const equipment =
        typeof content.inputs?.equipment === "string" &&
        ["bodyweight", "home-dumbbells", "full-gym"].includes(content.inputs.equipment)
          ? (content.inputs.equipment as "bodyweight" | "home-dumbbells" | "full-gym")
          : "bodyweight";
      plan = enrichWorkoutPlanWithLibrary(
        plan as import("@/lib/ai-workout-planner").WorkoutPlan,
        equipment,
      );
    } catch {
      // Enrichment is best-effort — the raw plan still renders.
    }
  }

  return NextResponse.json({
    plan,
    title: data.title,
    inputs: content.inputs ?? null,
    // GAP-18 completion: the disclosure stamped at generation time rides
    // the hydration response so the planner page renders the SAME
    // medical warning for the restored account copy (persisted rows —
    // legacy rows without one render no banner: no invented warnings).
    disclosure:
      content.medical_disclosure &&
      typeof (content.medical_disclosure as { warning?: unknown }).warning === "string"
        ? content.medical_disclosure
        : null,
    generatedAt: data.created_at,
    planId: data.id,
  });
}
