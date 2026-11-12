import { NextRequest, NextResponse } from "next/server";
import { normalizeCoachPlanText } from "@/lib/plan-generator";
import { requireCoach, authRequired } from "@/lib/auth-server";
import { planNormalizeBodySchema } from "@/lib/validation/schemas";

/**
 * Normalize a coach-pasted plan (free text, markdown, or loosely-structured
 * JSON) into the standard structured JSON format used by AI-generated plans.
 *
 * POST /api/plans/normalize
 * Body: {
 * text: string, // raw coach text (or JSON string)
 * planType: "nutrition" | "workout"
 * }
 *
 * Returns: { content, source }
 *
 * This is what makes coach-added plans behave like AI-generated plans:
 * - They get the same editable table UI in the PlanViewerModal.
 * - Clients get the per-meal regenerate button (because the meal items
 * are now structured with food/amount/calories).
 *
 * The endpoint tries OpenRouter's best free models in order. If all fail,
 * it falls back to wrapping the raw text in a minimal structure.
 *
 * Wave 2B completion (2026-09-17): the POST body passes the central zod
 * gate (planNormalizeBodySchema — text type-pinned + trimmed, planType
 * pinned to the enum, clientId a bounded string, unknown keys stripped).
 * Gate failure re-derives the legacy 400 classes VERBATIM in legacy
 * precedence order (text first, then planType); only genuinely new
 * violations (wrong types) get the fresh zod 400. text has NO zod
 * ceiling — the route has no slice point (plan-generator's
 * rawText.slice(0,8000) clamp-and-process is lib policy, the chat-message
 * precedent); the UUID_RE + ownership 403 + activation 402 ladder stays
 * route policy below.
 */
export const maxDuration = 60; // Vercel Hobby cap (2026-08-27) — was 180 which exceeds Hobby

export async function POST(request: NextRequest) {
 try {
 // Coach-only — uses OpenRouter credits to normalize coach-pasted plans.
 let coachId: string | undefined;
 let coachRole: string | undefined;
 if (authRequired) {
 const auth = await requireCoach(request);
 if (auth instanceof Response) return auth;
 coachId = auth.id;
 coachRole = auth.role;
 }

 // Wave 2B completion zod gate — on failure the legacy 400 classes are
 // re-derived verbatim from the RAW body in legacy precedence order
 // (text first, then planType); what remains is the genuinely new
 // wrong-type class, which gets the fresh zod 400.
 const rawBody: unknown = await request.json().catch(() => null);
 const parsed = planNormalizeBodySchema.safeParse(rawBody);
 if (!parsed.success) {
 const raw = (rawBody ?? {}) as { text?: unknown; planType?: unknown };
 if (!raw.text || (typeof raw.text === "string" && !raw.text.trim())) {
 return NextResponse.json(
 { error: "Missing required field: text" },
 { status: 400 },
 );
 }
 if (raw.planType !== "nutrition" && raw.planType !== "workout") {
 return NextResponse.json(
 { error: "planType must be 'nutrition' or 'workout'" },
 { status: 400 },
 );
 }
 return NextResponse.json(
 { error: parsed.error.issues[0]?.message ?? "Invalid request" },
 { status: 400 },
 );
 }
 const { text, planType, clientId } = parsed.data;

 // ── OWNER DECREE (2026-08-30): no paid activation → no plan service.
 // Normalize burns OpenRouter credits, so a COACH (never admin) must
 // target his OWN assigned client AND that client must carry an ACTIVE
 // coaching subscription (the $6/$16 wallet activation). Mirrors the
 // /api/ai/jobs gate — the raw manual upload path is gated the same way.
 if (authRequired && coachRole === "coach") {
 const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if (!clientId || !UUID_RE.test(clientId)) {
 return NextResponse.json(
 { error: "افتح صفحة العميل ثم ارفع الخطة منه — الخطة محتاجة عميل محدد." },
 { status: 400 },
 );
 }
 const { supabaseAdmin, isSupabaseAdminConfigured } = await import(
 "@/lib/supabase/admin"
 );
 if (!isSupabaseAdminConfigured || !supabaseAdmin) {
 return NextResponse.json({ error: "Server not configured" }, { status: 501 });
 }
 const { data: owned } = await supabaseAdmin
 .from("coach_assignments")
 .select("client_id")
 .eq("client_id", clientId)
 .eq("coach_id", coachId!)
 .maybeSingle();
 if (!owned) {
 return NextResponse.json(
 { error: "هذا العميل ليس من عملائك — كل مدرب يدير خطط عملائه هو فقط." },
 { status: 403 },
 );
 }
 const nowIso = new Date().toISOString();
 const { data: activeCoaching } = await supabaseAdmin
 .from("subscriptions")
 .select("id")
 .eq("client_id", clientId)
 .eq("tier", "coaching")
 .eq("status", "active")
 .or(`end_date.is.null,end_date.gt.${nowIso}`)
 .limit(1)
 .maybeSingle();
 if (!activeCoaching) {
 return NextResponse.json(
 {
 error:
 "هذا العميل لم يُفعّل اشتراكه بعد — فعّل اشتراكه أولًا من صفحته (شهر 6$ — 3 شهور 16$ تُخصم من محفظتك) وبعدها يمكنك توليد الخطط له.",
 code: "client_not_activated",
 },
 { status: 402 },
 );
 }
 }

 const result = await normalizeCoachPlanText(text, planType);
 return NextResponse.json(result);
 } catch (e) {
 const msg = e instanceof Error ? e.message : String(e);
 console.error("[api/plans/normalize] Error:", msg);
 return NextResponse.json(
 { error: msg || "Failed to normalize plan" },
 { status: 500 },
 );
 }
}
