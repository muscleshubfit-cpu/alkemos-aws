/**
 * src/lib/blog-repair-target.ts
 *
 * R1 REPAIR CONTRACT (Execution-Path Audit §8.2 A1, 2026-09-29 —
 * docs/EXECUTION-PATH-AUDIT-AND-RECOVERY-PLAN-2026-09-29.md).
 *
 * WHY THIS EXISTS: a deterministic P5 gate failure (word floor, quality
 * battery, Latin body gate) fires on an IMMUTABLE input —
 * `bundle.review.markdown` — so the runner's blind ×3 retry re-runs the
 * SAME checks on the SAME bytes and fails identically every time (live
 * evidence: three byte-identical P5 failures in GHA run 36507693416,
 * ~6 wasted minutes, then markFailed discards a ~95%-complete article).
 * The audit's fix: the failure itself names the step that can repair
 * the row ("— rerun p2-content" / "— rerun p4-review") — those hints
 * were prose for humans with NO executor. This map turns them into a
 * machine-readable contract: P5's 500 body carries `rerunTarget`,
 * `run-step.mts` translates it to exit code 3, and `run-step.sh`
 * executes the repair IN-RUN on the SAME queue row (≤2 cycles) before
 * the honest markFailed of today.
 *
 * THE MAP IS DETERMINISTIC (no model, no heuristics): exact message
 * patterns → exact targets, unit-pinned in
 * `src/lib/__tests__/blog-repair-target.test.ts` against the LIVE
 * error messages from the audit (§3.1). Any rewording of a P5 gate
 * message breaks a canary and forces a same-commit map update — the
 * contract can never drift silently.
 *
 * SCOPE LAW: this module changes WHO recovers a failed row and WHEN —
 * never WHAT is acceptable. No gate, threshold, or editorial rule is
 * weakened anywhere in the loop (owner constraint, audit §11.1).
 * Quota/duplicate-title skips never reach the 500 path (they are 200
 * skips) and infra failures (post insert, queue update) map to null —
 * the current behavior stays correct for both.
 */

/** The only steps the repair loop may re-run (audit §8.2 A1 contract). */
export const P5_RERUN_TARGETS = ["p2-content", "p4-review"] as const;

export type P5RerunTarget = (typeof P5_RERUN_TARGETS)[number];

/**
 * Map a P5 failure message to the pipeline step that can repair the row.
 *
 *   word floor ────────────────→ "p2-content"  (the draft itself is
 *                                          too short — regenerate it;
 *                                          research0/outline/images
 *                                          are preserved by ?force=1)
 *   quality battery (G2–G6) ───→ "p4-review"  (FAQ count / anchors /
 *                                          authority links / quoted
 *                                          phrases — the review pass
 *                                          rewrites the markdown)
 *   latin body gate ───────────→ "p4-review"  (same — review repairs)
 *   missing review artifacts ──→ "p4-review"  (P4 output absent)
 *   everything else ───────────→ null         (infra / unknown — NOT
 *                                          a repair contract; the
 *                                          plain ×3 retry + backstop
 *                                          semantics stay as today)
 */
export function mapP5FailureToRerunTarget(message: string): P5RerunTarget | null {
  const msg = message ?? "";
  // G1 — publish-layer word floor (audit §3.1: 419/1077-word drafts):
  // the writing step is the root cause; only regenerating content fixes
  // it (the review pass cannot conjure 800 missing words honestly).
  // ART-4 reworded the message (prose words, FAQ excluded) — the regex
  // accepts BOTH the legacy and the new wording (same-commit law).
  if (/article too short \(\d+(?: prose)? words/.test(msg)) return "p2-content";
  // ART-15: wholesale prose reuse vs a published body — regeneration.
  if (msg.includes("5-gram overlap")) return "p2-content";
  // G2–G6 deterministic battery (FAQ count, H2 sections, anchors,
  // authority links, quoted search phrases) — the draft exists; the
  // review pass is the step that rewrites it into compliance.
  if (msg.includes("quality-gate battery failed")) return "p4-review";
  // Phase-176 final Latin body gate (AR) — review-pass repair territory.
  if (msg.includes("latin contamination in final body")) return "p4-review";
  // bundle.review missing entirely — re-run the review pass.
  if (msg.includes("missing reviewed artifacts")) return "p4-review";
  // Unknown / infra (post insert, queue update, partial publish) — no
  // repair contract; honest failure exactly as today.
  return null;
}
