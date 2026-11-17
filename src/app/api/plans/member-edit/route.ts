import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { countThisMonthPlanUsage, type EvoPlanKind } from "@/lib/tier-limits";
import { diffFoodNames, mergeSwapPayload } from "@/lib/evo-nutrition-learning";
import {
  memberSaveEvoBodySchema,
  memberSwapBodySchema,
  memberPlanRenameBodySchema,
} from "@/lib/validation/schemas";
import type { Json } from "@/lib/supabase/types";

/**
 * POST /api/plans/member-edit — Phase 69 (owner-approved).
 *
 * The plans RLS (0030B) lets COACHES insert/update plan rows — the MEMBER
 * is read-only by design. Two member-facing features need controlled
 * writes, so they run here with ownership verified server-side:
 *
 * 1. mode "save-evo"  — «حفظ خطط ايفو كخطط حقيقية»: persist an EVO chat
 *    plan (text) as a real plans row the member sees in /plans.
 *      body: { mode: "save-evo", kind: "meal"|"workout", title, text }
 *    Anti-spam: monthly cap per kind (30) + length caps. The plan quota
 *    itself was already enforced at generation time — this only gates
 *    the save step.
 *
 * 2. mode "swap" — «حفظ نتيجة الاستبدال»: persist the mutated content
 *    after an AI meal/exercise swap (previously the swap died on reload).
 *      body: { mode: "swap", planId, content }
 *    Ownership: the plan row MUST belong to the caller (service-role
 *    check — never trusts the body beyond that).
 *
 * Wave 2B (2026-09-17): both payloads pass the central zod gate
 * (memberSaveEvoBodySchema / memberSwapBodySchema — type/trim/ceiling
 * + unknown-key stripping at 120/20000, the routes' own slice points).
 * The legacy bad_request class (incomplete plan / swap data) is
 * re-derived verbatim on gate failure; the values that were previously
 * truncated silently (title >120, text >20000) and the smuggled shapes
 * (non-object swap content) now 400 — the documented P1-7 tightening.
 * The mode dispatch, the nutrition/meal→nutrition mapping and the
 * ownership/lookup policy stay in this route.
 */
const EVO_SAVE_MONTHLY_CAP = 30;
// MAX_TITLE/MAX_TEXT moved to the central schema (Wave 2B —
// MAX_MEMBER_PLAN_TITLE / MAX_MEMBER_PLAN_TEXT): the zod ceilings ARE
// the legacy slice points, so the silent slices are gone.

/**
 * EVO-4 (W4 E3) — record the food-identity diff of one member swap into
 * the swap_removed / swap_added buckets of evo_nutrition_patterns (0080).
 * Payload merges are read-modify-write (service-role) so concurrent swaps
 * of different users accumulate; failures are logged and swallowed — this
 * is analytics enrichment, never a user-facing dependency.
 */
async function recordSwapLearning(
  oldContent: unknown,
  newContent: unknown,
): Promise<void> {
  try {
    const diff = diffFoodNames(oldContent, newContent);
    const groups = [
      { bucket: "swap_removed" as const, foods: diff.removed },
      { bucket: "swap_added" as const, foods: diff.added },
    ];
    const now = new Date();
    const updates: Array<{
      bucket: string;
      key: string;
      payload: Json;
      sample_size: number;
    }> = [];
    for (const group of groups) {
      if (group.foods.length === 0) continue;
      const { data } = await supabaseAdmin!
        .from("evo_nutrition_patterns")
        .select("key, payload")
        .eq("bucket", group.bucket)
        .in("key", group.foods.map((f) => f.key));
      const existing = new Map<string, unknown>(
        ((data ?? []) as Array<{ key: string; payload: unknown }>).map((r) => [r.key, r.payload]),
      );
      for (const food of group.foods) {
        const merged = mergeSwapPayload(
          existing.get(food.key) as Record<string, unknown> | null,
          [food.key],
          now,
        );
        updates.push({
          bucket: group.bucket,
          key: food.key,
          payload: { ...merged, display: food.display } as Json,
          sample_size: merged.count,
        });
      }
    }
    if (updates.length > 0) {
      const { error: upErr } = await supabaseAdmin!
        .from("evo_nutrition_patterns")
        .upsert(updates, { onConflict: "bucket,key" });
      if (upErr) {
        console.warn("[api/plans/member-edit] swap-learning upsert failed:", upErr.message);
        return;
      }
      console.log(`[api/plans/member-edit] swap learning recorded: ${updates.length} food signal(s)`);
    }
  } catch (e) {
    console.warn(
      "[api/plans/member-edit] swap learning (best-effort) failed:",
      e instanceof Error ? e.message : e,
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const mode = String(body.mode ?? "").trim();

  // ── save-evo ─────────────────────────────────────────────────────────
  if (mode === "save-evo") {
    // Wave 2B zod gate — the legacy bad_request class is re-derived
    // verbatim on gate failure (kind invalid / title <3 / text trimmed
    // <20); the oversize values that legacy silently sliced (title
    // >120, text >20000) get the fresh zod-message 400 (P1-7).
    const parsed = memberSaveEvoBodySchema.safeParse(body);
    if (!parsed.success) {
      const raw = (body ?? {}) as Record<string, unknown>;
      const rawKind = String(raw.kind ?? "").trim();
      const rawTitle = String(raw.title ?? "").trim();
      const rawText = String(raw.text ?? "");
      if (
        !(rawKind === "nutrition" || rawKind === "meal" || rawKind === "workout") ||
        rawTitle.length < 3 ||
        rawText.trim().length < 20
      ) {
        return NextResponse.json(
          { error: "bad_request", message: "بيانات الخطة غير مكتملة" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    // The route's own kind mapping stays (nutrition/meal → nutrition).
    const kind: EvoPlanKind =
      parsed.data.kind === "workout" ? "workout" : "nutrition";
    const title = parsed.data.title;
    const text = parsed.data.text;

    // Anti-spam cap: EVO-sourced plans per kind per month.
    // Phase 71 — staff bypass (owner decree: admin unlimited everywhere).
    if (auth.is_staff !== true) {
      const used = await countThisMonthPlanUsage(auth.id, kind);
      if (used >= EVO_SAVE_MONTHLY_CAP) {
        return NextResponse.json(
          { error: "quota_exceeded", message: "وصلت الحد الأقصى للخطط المحفوظة هذا الشهر" },
          { status: 429 },
        );
      }
    }

    const planType = kind === "nutrition" ? "meal" : "workout";
    // ── GAP-18 completion (owner clarification 2026-11-17 — «تأكد من
    // ظهوره في جميع مسارات توليد الخطط… وعلى القنوات والواجهات التي
    // تعرض الخطة»): an EVO-saved diet plan lands in /plans beside the
    // generated ones, so it carries the SAME medical disclosure —
    // computed from the member's own latest nutrition questionnaire
    // (condition-aware / declared-but-unclassified / general — the one
    // medicalDisclosureFor; no alternative warning path). Best-effort: a
    // fetch failure degrades to the general floor, never blocks the save.
    let evoDisclosure: Json | undefined;
    if (planType === "meal") {
      const declaredText = await (async () => {
        try {
          const { data: nutriQ } = await supabaseAdmin
            .from("nutrition_questionnaires")
            .select("data")
            .eq("client_id", auth.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const qData = (nutriQ?.data ?? null) as Record<string, unknown> | null;
          return qData
            ? String(qData.medical || qData.health || qData.medical_conditions || "").trim()
            : "";
        } catch {
          return "";
        }
      })();
      const { detectClinicalConditions, medicalDisclosureFor } = await import(
        "@/lib/plan-clinical-safety"
      );
      evoDisclosure = medicalDisclosureFor(
        detectClinicalConditions({ healthText: declaredText }),
        declaredText,
      ) as unknown as Json;
    }
    const { data: plan, error } = await supabaseAdmin
      .from("plans")
      .insert({
        client_id: auth.id,
        type: planType,
        title,
        notes: null,
        file_url: null,
        content: { text: text.trim(), source: "evo", ...(evoDisclosure ? { medical_disclosure: evoDisclosure } : {}) },
        status: "approved",
        is_current: true,
        approved_at: new Date().toISOString(),
      })
      .select("id, title, type")
      .single();

    if (error) {
      console.error("[api/plans/member-edit] save-evo error:", error.message);
      return NextResponse.json(
        { error: "insert_failed", message: "تعذر حفظ الخطة — حاول مرة أخرى" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, plan });
  }

  // ── swap ─────────────────────────────────────────────────────────────
  if (mode === "swap") {
    // Wave 2B zod gate — the legacy bad_request class is re-derived
    // verbatim on gate failure (missing planId/content); a non-object
    // content (the smuggled shape legacy `typeof` stored) gets the
    // fresh zod-message 400.
    const parsed = memberSwapBodySchema.safeParse(body);
    if (!parsed.success) {
      const raw = (body ?? {}) as Record<string, unknown>;
      const rawPlanId = String(raw.planId ?? "").trim();
      const rawContent = raw.content;
      if (!rawPlanId || !rawContent || typeof rawContent !== "object") {
        return NextResponse.json(
          { error: "bad_request", message: "بيانات الاستبدال غير مكتملة" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    const planId = parsed.data.planId;
    // The gate guarantees a JSON object (it came from request.json());
    // the cast restores the plans-column Json signature — runtime identical.
    const content = parsed.data.content as Json;

    // Ownership gate — service-role read, the member may only persist
    // swaps to HIS OWN plan rows
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("id, client_id, content")
      .eq("id", planId)
      .maybeSingle();

    if (!plan || (plan as { client_id: string }).client_id !== auth.id) {
      return NextResponse.json(
        { error: "not_found", message: "الخطة غير موجودة" },
        { status: 404 },
      );
    }

    const { error } = await supabaseAdmin
      .from("plans")
      .update({ content })
      .eq("id", planId);
    if (error) {
      console.error("[api/plans/member-edit] swap persist error:", error.message);
      return NextResponse.json(
        { error: "update_failed", message: "تعذر حفظ الاستبدال" },
        { status: 500 },
      );
    }

    // EVO-4 (W4 E3) — REAL swap learning: diff old vs new content to learn
    // which foods users actually remove and which replacements they accept.
    // plan_swaps only records the swap TYPE (documented limit) — this diff
    // is the honest food-identity signal. BEST-EFFORT: a learning failure
    // NEVER blocks or degrades the swap the user just made.
    await recordSwapLearning(
      (plan as { content: unknown }).content,
      content,
    ).catch(() => undefined);

    return NextResponse.json({ ok: true });
  }

  // ── rename (I-4, UX-TEST-REPORT-2026-09-21 §5-4 — owner «ابدأ
  // التحسينات» 2026-09-22) ──────────────────────────────────────
  // «تسمية الخطط المولدة»: the AI planners auto-save with a template
  // title; members managing several plans rename their row here. The
  // ONLY field touched is title — content/status/is_current are
  // unreachable from this mode (swap/save-evo remain separate branches).
  if (mode === "rename") {
    const parsed = memberPlanRenameBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "bad_request", message: "اسم الخطة غير صالح (3 أحرف على الأقل و120 كحد أقصى)" },
        { status: 400 },
      );
    }
    const planId = parsed.data.planId;
    // Ownership gate — the same service-role policy as swap: the member
    // may rename only HIS OWN plan rows.
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("id, client_id")
      .eq("id", planId)
      .maybeSingle();
    if (!plan || (plan as { client_id: string }).client_id !== auth.id) {
      return NextResponse.json(
        { error: "not_found", message: "الخطة غير موجودة" },
        { status: 404 },
      );
    }
    const { error } = await supabaseAdmin
      .from("plans")
      .update({ title: parsed.data.title })
      .eq("id", planId);
    if (error) {
      console.error("[api/plans/member-edit] rename error:", error.message);
      return NextResponse.json(
        { error: "update_failed", message: "تعذر حفظ الاسم — حاول مرة أخرى" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, title: parsed.data.title });
  }

  return NextResponse.json({ error: "unknown_mode" }, { status: 400 });
}
