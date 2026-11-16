/**
 * src/lib/quality-repair/repair-ledger.ts
 *
 * AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16). The HONEST RECORD of
 * every repair cycle — the owner's acceptance criterion #9: when a
 * defect cannot be repaired after the studied attempts, the defect,
 * every strategy that was tried, and WHY each failed must be recorded
 * — and the case may NEVER be marked as success.
 *
 * A cycle only counts as progress when the content ACTUALLY CHANGED
 * and the blocking defect count STRICTLY DECREASED with no new defect
 * class introduced (owner criterion #3: a retry that returns the same
 * result is not repair). The ledger is stamped into queue rows / job
 * errors / the console so an operator can audit exactly what the
 * machine tried before the honest failure.
 *
 * Pure leaf module.
 */

import type { QualityDefect } from "./defect-report";

export type RepairCycleVerdict =
  | "progressed" // defects strictly decreased, content changed
  | "no-progress" // identical output / no improvement / vetoed by finalValidate
  | "resolved"; // zero blocking defects remain after this cycle

export interface RepairCycleRecord {
  /** Which repairer ran (e.g. "deterministic-dictionary", "ai-tokens"). */
  strategy: string;
  /** The defect kinds this cycle targeted. */
  targeted: string;
  /** Did the output differ from the input at all (no-op guard). */
  outputChanged: boolean;
  /** Blocking defect count before / after the cycle. */
  defectsBefore: number;
  defectsAfter: number;
  verdict: RepairCycleVerdict;
  /** Why a no-progress cycle failed to improve (prompt-ready, honest). */
  note?: string;
}

export interface RepairLedger {
  cycles: RepairCycleRecord[];
  /** True iff zero blocking defects remain on the final output. */
  resolved: boolean;
  /** Defects still present on the final output (empty when resolved). */
  remainingDefects: QualityDefect[];
  /** Only set when the loop exhausted every strategy: the honest
   * unfixable explanation (defect + strategies + why each failed). */
  unfixableReason?: string;
}

/** Build the honest unfixable record — the owner's criterion #9 text. */
export function buildUnfixableReason(ledger: {
  cycles: RepairCycleRecord[];
  remainingDefects: QualityDefect[];
}): string {
  const tried = ledger.cycles
    .map((c) => `${c.strategy}: ${c.verdict}${c.note ? ` (${c.note})` : ""}`)
    .join(" · ");
  const remaining = ledger.remainingDefects
    .map((d) => `${d.kind} ${d.location}`)
    .join(" ; ");
  return (
    `تعذّر الإصلاح بعد ${ledger.cycles.length} دورة مدروسة — العيوب المتبقية: ${remaining || "غير محددة"}; ` +
    `الاستراتيجيات المُجرّبة: ${tried || "لا شيء ينطبق"}. ` +
    `الحالة فشل صادق: لا يُسجَّل نجاح ولا يُنشر محتوى معيب.`
  ).slice(0, 2000);
}

/**
 * Thrown ONLY when every repair strategy has been exhausted without
 * resolving the blocking defects. Carries the full ledger so callers
 * (P4 route, recipes routes, ai_jobs processors) can surface the
 * honest record instead of a bare error string.
 */
export class UnfixableDefectError extends Error {
  constructor(message: string, public readonly ledger: RepairLedger) {
    super(message);
    this.name = "UnfixableDefectError";
  }
}

/** Compact one-line summary for logs / queue error columns. */
export function ledgerSummary(ledger: RepairLedger): string {
  const parts = ledger.cycles.map(
    (c) => `${c.strategy}=${c.verdict}${c.outputChanged ? "" : "(no-change)"}`,
  );
  return [
    ledger.resolved ? "resolved" : "unresolved",
    ...parts,
    ledger.remainingDefects.length ? `remaining=${ledger.remainingDefects.length}` : "",
  ]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 500);
}
