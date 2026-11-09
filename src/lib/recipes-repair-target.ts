/**
 * RECIPES-REPAIR-TARGET — the R5→R? rerun contract
 * (HEALTHY-RECIPES-PLATFORM plan §6.2/§6.3 — the blog-repair-target
 * pattern applied to the recipes pipeline).
 *
 * A deterministic gate failure at R5 returns exit code 3 from
 * run-step.mts carrying `RERUN_TARGET=<step>`; the runner re-runs the
 * targeted stage (and every stage between it and R5) on the SAME queue
 * row, ≤ MAX_REPAIRS cycles, then an honest held/failed verdict.
 *
 * The mapping is regex-based over the PINNED gate messages of
 * recipes-quality-gates.ts (the blog contract precedent — canaries pin
 * the message text).
 */

export const R5_RERUN_TARGETS = [
  "r0-idea",
  "r1-structure",
  "r2-nutrition",
  "r3-authoring",
  "r4-image",
] as const;

export type R5RerunTarget = (typeof R5_RERUN_TARGETS)[number];

export function mapR5FailureToRerunTarget(message: string): R5RerunTarget | null {
  const msg = message ?? "";
  if (msg.includes("rerun r0-idea")) return "r0-idea";
  if (msg.includes("rerun r1-structure")) return "r1-structure";
  if (msg.includes("rerun r2-nutrition")) return "r2-nutrition";
  if (msg.includes("rerun r3-authoring")) return "r3-authoring";
  if (msg.includes("rerun r4-image")) return "r4-image";
  return null; // infra/unknown — plain retry semantics
}
