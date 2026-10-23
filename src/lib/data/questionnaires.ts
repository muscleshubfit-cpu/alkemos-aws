"use client";

import {
 supabase,
 isSupabaseConfigured,
 read,
 write,
 uid,
 LS_NUTRI_Q,
 LS_FIT_Q,
} from "./helpers";
import { createNotificationDeduped, createAdminNotification } from "./notifications";
import type { Json, NutritionQuestionnaire, FitnessQuestionnaire } from "@/lib/supabase/types";

/** Row shape shared by nutrition/fitness questionnaires (identical columns). */
export type QuestionnaireRow = NutritionQuestionnaire | FitnessQuestionnaire;

export async function getQuestionnaire(clientId: string, type: "nutrition" | "fitness"): Promise<QuestionnaireRow | null> {
 if (isSupabaseConfigured && supabase) {
 const table = type === "nutrition" ? "nutrition_questionnaires" : "fitness_questionnaires";
 const { data } = await supabase
 .from(table)
 .select("*")
 .eq("client_id", clientId)
 .order("updated_at", { ascending: false })
 .limit(1)
 .maybeSingle();
 return data;
 }
 const store = read<Record<string, NutritionQuestionnaire | FitnessQuestionnaire>>(type === "nutrition" ? LS_NUTRI_Q : LS_FIT_Q, {});
 return store[clientId] ?? null;
}

/**
 * Phase 247 — STATUS-ONLY read for the member dashboard's attention strip.
 * The full-row read carries the whole JSONB answer payload; the strip only
 * needs the lifecycle flag (`draft|submitted|approved|needs_info`). Same
 * RLS surface as getQuestionnaire (client reads his own rows).
 */
export async function getQuestionnaireStatus(
 clientId: string,
 type: "nutrition" | "fitness",
): Promise<QuestionnaireRow["status"] | null> {
 if (isSupabaseConfigured && supabase) {
 const table = type === "nutrition" ? "nutrition_questionnaires" : "fitness_questionnaires";
 const { data } = await supabase
 .from(table)
 .select("status")
 .eq("client_id", clientId)
 .order("updated_at", { ascending: false })
 .limit(1)
 .maybeSingle();
 return (data as { status: QuestionnaireRow["status"] } | null)?.status ?? null;
 }
 const store = read<Record<string, NutritionQuestionnaire | FitnessQuestionnaire>>(type === "nutrition" ? LS_NUTRI_Q : LS_FIT_Q, {});
 return store[clientId]?.status ?? null;
}

export async function upsertQuestionnaire(
 clientId: string,
 type: "nutrition" | "fitness",
 data: Json,
 status: "draft" | "submitted" | "approved" | "needs_info",
) {
 if (isSupabaseConfigured && supabase) {
 const table = type === "nutrition" ? "nutrition_questionnaires" : "fitness_questionnaires";
 const { data: row, error } = await supabase
 .from(table)
 .upsert(
 { client_id: clientId, data, status, updated_at: new Date().toISOString() },
 { onConflict: "client_id" },
 )
 .select()
 .single();
 if (error) throw new Error(error.message);
 // If submitted, notify the ASSIGNED coach (fire-and-forget — don't block
 // on notification; routed via clientId → target_coach_id)
 if (status === "submitted") {
 // NOTIF→PLAN 2026-10-24 (items 1+3): deep link opens the client's
 // manager page (/coach/<id>) — the questionnaire lives THERE, not on
 // the generic coach list; dedupKey kills double-pings when the member
 // re-saves the same questionnaire twice in quick succession.
 createAdminNotification(
  "questionnaire_submitted",
  "استبيان جديد للمراجعة ",
  `استبيان ${type === "nutrition" ? "التغذية" : "اللياقة"} — بانتظار مراجعتك`,
  `/coach/${clientId}`,
  clientId,
  { qtype: type, client_id: clientId, dedupKey: `questionnaire_submitted:${clientId}:${type}` },
 ).catch(() => {});
 }
 return row;
 }
 const key = type === "nutrition" ? LS_NUTRI_Q : LS_FIT_Q;
 const store = read<Record<string, NutritionQuestionnaire | FitnessQuestionnaire>>(key, {});
 store[clientId] = {
 id: store[clientId]?.id ?? uid(),
 client_id: clientId,
 data,
 status,
 created_at: store[clientId]?.created_at ?? new Date().toISOString(),
 updated_at: new Date().toISOString(),
 };
 write(key, store);
 return store[clientId];
}

// ---------------------------------------------------------------------------
// Questionnaire status management (coach)
// ---------------------------------------------------------------------------

export async function setQuestionnaireStatus(
 clientId: string,
 type: "nutrition" | "fitness",
 status: "draft" | "submitted" | "approved" | "needs_info",
) {
 if (isSupabaseConfigured && supabase) {
 const table = type === "nutrition" ? "nutrition_questionnaires" : "fitness_questionnaires";
 const { data, error } = await supabase
 .from(table)
 .update({ status, updated_at: new Date().toISOString() })
 .eq("client_id", clientId)
 .select()
 .single();
 if (error) throw new Error(error.message);
 // Notify the user — 0093: payload feeds the bell's render-side catalog.
 // NOTIF→PLAN 2026-10-24 (item 1): deduped on (qtype:status) — the coach
 // double-clicking approve/needs-info must not double-ring the member.
 const statusMsg = status === "approved" ? "تمت الموافقة على استبيانك" : "يحتاج استبيانك لمزيد من المعلومات";
 await createNotificationDeduped(
  clientId,
  "questionnaire_status",
  statusMsg,
  `استبيان ${type === "nutrition" ? "التغذية" : "اللياقة"}: ${statusMsg}`,
  "/questionnaires",
  { qtype: type, status, dedup_value: `${type}:${status}` },
  { key: "dedup_value", value: `${type}:${status}`, windowMs: 2 * 60 * 1000 },
 );
 return data;
 }
 const key = type === "nutrition" ? LS_NUTRI_Q : LS_FIT_Q;
 const store = read<Record<string, NutritionQuestionnaire | FitnessQuestionnaire>>(key, {});
 if (store[clientId]) {
 store[clientId].status = status;
 store[clientId].updated_at = new Date().toISOString();
 write(key, store);
 }
 return store[clientId];
}
