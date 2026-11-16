/**
 * src/lib/quality-repair/repair-loop.ts
 *
 * AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16) — the unified,
 * engine-agnostic repair loop the owner ordered for the whole AI
 * generation system:
 *
 *   «تحويل مراجعة الجودة من بوابة اكتشاف ورفض إلى دورة إصلاح وتحسين
 *    ذاتية حقيقية… لا يجوز اعتبار إعادة المحاولة دون تغيير فعلي
 *    للمحتوى إصلاحًا»
 *
 * THE LAWS BAKED INTO THIS ENGINE (each pinned by canaries in
 * quality-repair-loop.test.ts):
 *
 *   1. TARGETED REPAIR, not blind regeneration: each cycle receives the
 *      structured defect set (kind + location + fix instruction) and the
 *      strategy decides how to repair THOSE defects.
 *   2. PROGRESS LAW: a cycle counts ONLY when the output actually
 *      differs from its input AND the blocking defect count strictly
 *      decreases AND finalValidate (the no-new-defect check —
 *      preservation laws, links, length, no new banned classes) is
 *      empty. Anything else is recorded as no-progress.
 *   3. NO-OP LOOP PREVENTION: a strategy that returns the input
 *      byte-identically, or that fails to improve, is EXCLUDED from the
 *      next cycle — the loop escalates to the remaining strategies
 *      instead of repeating the same non-repair (the exact «إعادة
 *      المحاولة دون تغيير» class the owner banned).
 *   4. ESCALATION ORDER: strategies are declared cheapest-first
 *      (deterministic → localized AI → directed re-review); the loop
 *      walks them in order and only escalates on no-progress.
 *   5. HONEST TERMINATION: zero blocking defects → success + ledger.
 *      No strategy left (or maxCycles reached) → UnfixableDefectError
 *      carrying the full ledger — the case is NEVER marked success
 *      (owner criterion #9; every gate stays byte-identical — the loop
 *      repairs content, it never lowers a bar).
 *
 * The engine is generic over the content type (string today: blog
 * markdown, recipes prose, chat replies; structured outputs later) —
 * each generation domain injects its own `assess` + strategies +
 * `finalValidate`, preserving its per-engine quality rules (owner
 * criterion #7: one mechanism, per-engine laws).
 *
 * Pure orchestration: no DB, no network, no AI inside this file.
 */

import type { QualityDefect } from "./defect-report";
import {
  buildUnfixableReason,
  UnfixableDefectError,
  type RepairCycleRecord,
  type RepairLedger,
} from "./repair-ledger";

/** What the loop may repair. Ordered: index 0 runs first; the loop
 * escalates forward on no-progress and never goes back within one run
 * (the anti-thrash law — a no-progress strategy is excluded for the
 * REST of the run, not just the next cycle). */
export interface RepairStrategy {
  /** Human-readable name recorded in the ledger. */
  name: string;
  /** Can this strategy address ANY of the current blocking defects? */
  applies(defects: QualityDefect[]): boolean;
  /** Repair THESE defects in the input — targeted, never blind. */
  apply(input: string, defects: QualityDefect[]): Promise<string>;
}

export interface RepairLoopArgs {
  input: string;
  /** Deterministic defect assessment of a candidate output. Returns
   * the BLOCKING defect set (empty ⇒ the content may ship). */
  assess(text: string): QualityDefect[];
  strategies: RepairStrategy[];
  /** The no-new-defect check (owner criterion #5: verify the repair
   * introduced no NEW defects). Non-empty ⇒ the cycle is vetoed and
   * recorded as no-progress with the violations as the note. */
  finalValidate?(candidate: string): string[];
  /** Total repair cycles allowed (default 3 — matches the studied-
   * attempts budget; each cycle may internally make one AI call). */
  maxCycles?: number;
}

export async function runTargetedRepairLoop(
  args: RepairLoopArgs,
): Promise<{ output: string; ledger: RepairLedger }> {
  const maxCycles = args.maxCycles ?? 3;
  const finalValidate = args.finalValidate ?? (() => []);

  let current = args.input;
  let defects = args.assess(current);
  const cycles: RepairCycleRecord[] = [];

  if (defects.length === 0) {
    // Clean input — resolved with zero cycles (byte-identical passthrough).
    return {
      output: current,
      ledger: { cycles, resolved: true, remainingDefects: [] },
    };
  }

  /** Strategies excluded for the rest of the run (no-progress law). */
  const excluded = new Set<string>();

  for (let cycle = 0; cycle < maxCycles && defects.length > 0; cycle++) {
    const strategy = args.strategies.find(
      (s) => !excluded.has(s.name) && s.applies(defects),
    );
    if (!strategy) break; // nothing left that can address these defects

    const before = defects;
    const beforeCount = before.length;
    let candidate: string;
    try {
      candidate = await strategy.apply(current, before);
    } catch (e) {
      // A repairer that THROWS (degenerate AI payload etc.) is a
      // no-progress cycle with the honest reason — the loop escalates.
      cycles.push({
        strategy: strategy.name,
        targeted: before.map((d) => d.kind).join(","),
        outputChanged: false,
        defectsBefore: beforeCount,
        defectsAfter: beforeCount,
        verdict: "no-progress",
        note: e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
      });
      excluded.add(strategy.name);
      continue;
    }

    const outputChanged = candidate !== current;
    const after = outputChanged ? args.assess(candidate) : before;
    const vetoViolations = outputChanged ? finalValidate(candidate) : [];

    if (!outputChanged) {
      cycles.push({
        strategy: strategy.name,
        targeted: before.map((d) => d.kind).join(","),
        outputChanged: false,
        defectsBefore: beforeCount,
        defectsAfter: beforeCount,
        verdict: "no-progress",
        note: "الإصلاح أعاد النص نفسه دون تغيير فعلي — إعادة المحاولة دون تقدم ليست إصلاحًا",
      });
      excluded.add(strategy.name);
      continue;
    }

    if (vetoViolations.length > 0) {
      // New defects introduced (or a preservation law broken) — vetoed.
      cycles.push({
        strategy: strategy.name,
        targeted: before.map((d) => d.kind).join(","),
        outputChanged: true,
        defectsBefore: beforeCount,
        defectsAfter: after.length,
        verdict: "no-progress",
        note: `أدخل الإصلاح عيوبًا جديدة — مرفوض: ${vetoViolations.slice(0, 3).join(" | ")}`.slice(0, 400),
      });
      excluded.add(strategy.name);
      continue;
    }

    const improved = after.length < beforeCount;
    if (!improved) {
      cycles.push({
        strategy: strategy.name,
        targeted: before.map((d) => d.kind).join(","),
        outputChanged: true,
        defectsBefore: beforeCount,
        defectsAfter: after.length,
        verdict: "no-progress",
        note: "تغيّر النص لكن عدد العيوب لم ينقص صارمًا — لا يُحتسب تقدمًا",
      });
      excluded.add(strategy.name);
      continue;
    }

    // PROGRESS — accept the candidate and continue.
    current = candidate;
    defects = after;
    cycles.push({
      strategy: strategy.name,
      targeted: before.map((d) => d.kind).join(","),
      outputChanged: true,
      defectsBefore: beforeCount,
      defectsAfter: after.length,
      verdict: after.length === 0 ? "resolved" : "progressed",
    });
  }

  if (defects.length === 0) {
    return {
      output: current,
      ledger: { cycles, resolved: true, remainingDefects: [] },
    };
  }

  const ledger: RepairLedger = {
    cycles,
    resolved: false,
    remainingDefects: defects,
    unfixableReason: buildUnfixableReason({ cycles, remainingDefects: defects }),
  };
  throw new UnfixableDefectError(
    `quality-repair unfixable: ${ledger.unfixableReason}`,
    ledger,
  );
}
