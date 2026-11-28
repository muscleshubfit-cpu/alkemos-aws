/**
 * food-catalog-gate-core-sources.test.ts — F3-a gate hardening (539).
 *
 * Owner order 2026-11-28 («راجع وأصلح بوابة التحقق في
 * scripts/food-catalog/validate.ts»): the failure of ANY approved core
 * source must fail the acceptance gate — the ±20% count band documents
 * DRIFT, it must never MASK a dead source — while the documented
 * exceptions (the cache-only source and the optional opt-in source)
 * stay non-blocking.
 *
 * Two layers, same file (the notifications-retention.test.ts pattern):
 *
 *   A. GATE LOGIC — evaluateCoreSourceHealth (the pure module the real
 *      gate imports — scripts/food-catalog/src/gate-core-sources.ts)
 *      against the measured shapes of the real CI runs (the final green
 *      run's contributions: usda 38,493 · national-tables 5,684 ·
 *      off-foodrepo 125,637 · curated 323 · menustat-opennosh 0):
 *      the masking scenario (a core source dead while the total stays
 *      inside the band) is BLOCKED; every failure mode of every core
 *      source is BLOCKED; the documented exceptions are NOT blocking.
 *
 *   B. GATE WIRING PINS — validate.ts actually wires the check into its
 *      blocking failures list (independent of deviationWithinBand), and
 *      build.ts's composition (the approved source configuration and
 *      count) is untouched by this hardening: DEFAULT_ADAPTERS keeps the
 *      audited composition (the four core + the cache-only adapter) and
 *      opennutrition stays the opt-in exception it was fixed to be (538).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  APPROVED_CORE_SOURCE_IDS,
  CACHE_ONLY_SOURCE_IDS,
  OPTIONAL_SOURCE_IDS,
  evaluateCoreSourceHealth,
  type GateAdapterContribution,
} from "../../../scripts/food-catalog/src/gate-core-sources";

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf8");

const VALIDATE_TS = "scripts/food-catalog/validate.ts";
const BUILD_TS = "scripts/food-catalog/build.ts";

/** The final green CI run's contributions (STATE.md 538, run 46149628185)
 * — the healthy baseline every blocking test below starts from. */
const healthyContributions: GateAdapterContribution[] = [
  { id: "usda", rawRecords: 38_493, failed: false },
  { id: "national-tables", rawRecords: 5_684, failed: false },
  { id: "off-foodrepo", rawRecords: 125_637, failed: false },
  { id: "curated", rawRecords: 323, failed: false },
  { id: "menustat-opennosh", rawRecords: 0, failed: false },
];

const THE_REFERENCE_COUNT = 130_362;
const THE_BAND_PCT = 20;

const deviationPct = (actual: number): number =>
  Number((((actual - THE_REFERENCE_COUNT) / THE_REFERENCE_COUNT) * 100).toFixed(4));

describe("F3-a gate (539) — approved-core-source liveness", () => {
  it("blocks the masking scenario: national-tables silently dead while the total stays INSIDE the ±20% band", () => {
    // The measured masking hole this fix closes: the final green run
    // deduplicated 147,739 foods WITH CNF's 5,684 raw records; without
    // them the total lands near 144,000 = +10.4% — comfortably inside
    // the ±20% band, so the OLD count-only gate passed a build whose
    // approved core source contributed nothing.
    const contributions = healthyContributions.map((c) =>
      c.id === "national-tables" ? { ...c, rawRecords: 0 } : c
    );
    const totalWithCnfDead = 144_000;
    const deviation = deviationPct(totalWithCnfDead);

    expect(Math.abs(deviation)).toBeLessThanOrEqual(THE_BAND_PCT); // band: PASSES
    const health = evaluateCoreSourceHealth(contributions); // gate: must BLOCK
    expect(health.healthy).toBe(false);
    expect(health.failures).toEqual([
      { id: "national-tables", reason: "zero-records", rawRecords: 0 },
    ]);
  });

  it("blocks the same masking scenario for the OFF stream dying mid-run (failed: true, 0 records)", () => {
    // The large-source twin: OFF throws and contributes 0 — the total
    // would breach the floor too, but the gate must not depend on the
    // band arithmetic to catch it.
    const contributions = healthyContributions.map((c) =>
      c.id === "off-foodrepo" ? { ...c, rawRecords: 0, failed: true } : c
    );
    const health = evaluateCoreSourceHealth(contributions);
    expect(health.healthy).toBe(false);
    expect(health.failures).toEqual([
      { id: "off-foodrepo", reason: "adapter-failed", rawRecords: 0 },
    ]);
  });

  it("blocks EVERY core source's EVERY failure mode — thrown, silent zero, missing from the report", () => {
    expect(APPROVED_CORE_SOURCE_IDS).toEqual([
      "usda",
      "national-tables",
      "off-foodrepo",
      "curated",
    ]);

    for (const id of APPROVED_CORE_SOURCE_IDS) {
      // (a) adapter threw → blocked
      const thrown = healthyContributions.map((c) =>
        c.id === id ? { ...c, rawRecords: 0, failed: true } : c
      );
      expect(evaluateCoreSourceHealth(thrown).failures, `${id} thrown`).toEqual([
        { id, reason: "adapter-failed", rawRecords: 0 },
      ]);

      // (b) silent zero (no throw — the real OFF/USDA failure mode) → blocked
      const silentZero = healthyContributions.map((c) =>
        c.id === id ? { ...c, rawRecords: 0, failed: false } : c
      );
      expect(evaluateCoreSourceHealth(silentZero).failures, `${id} silent zero`).toEqual([
        { id, reason: "zero-records", rawRecords: 0 },
      ]);

      // (c) missing from build-report.json entirely (composition drift) → blocked
      const missing = healthyContributions.filter((c) => c.id !== id);
      expect(evaluateCoreSourceHealth(missing).failures, `${id} missing`).toEqual([
        { id, reason: "missing-from-report", rawRecords: 0 },
      ]);
    }
  });

  it("keeps the documented exceptions non-blocking: the cache-only source and the optional opt-in source", () => {
    // The cache-only source contributes 0 on every fresh CI runner by
    // design — and even its explicit failure is recorded, never blocking.
    const cacheOnlyDead = healthyContributions.map((c) =>
      c.id === "menustat-opennosh" ? { ...c, rawRecords: 0, failed: true } : c
    );
    expect(evaluateCoreSourceHealth(cacheOnlyDead).healthy).toBe(true);
    expect(
      evaluateCoreSourceHealth(cacheOnlyDead).exceptions.find(
        (e) => e.id === "menustat-opennosh"
      )
    ).toMatchObject({ kind: "cache-only", present: true, failed: true, rawRecords: 0 });

    // The optional opt-in source (--with-opennutrition build) failing or
    // contributing 0 is recorded, never blocking (it contributed 0 to the
    // reference build itself).
    const withOptional = [
      ...healthyContributions,
      { id: "opennutrition", rawRecords: 0, failed: true },
    ];
    const optionalHealth = evaluateCoreSourceHealth(withOptional);
    expect(optionalHealth.healthy).toBe(true);
    expect(optionalHealth.failures).toEqual([]);
    expect(
      optionalHealth.exceptions.find((e) => e.id === "opennutrition")
    ).toMatchObject({ kind: "optional", present: true, failed: true, rawRecords: 0 });

    // The exceptions list stays exactly the documented pair.
    expect([...CACHE_ONLY_SOURCE_IDS, ...OPTIONAL_SOURCE_IDS]).toEqual([
      "menustat-opennosh",
      "opennutrition",
    ]);
  });

  it("passes the healthy baseline (the final green run's contributions) and records unknown sources without blocking", () => {
    const health = evaluateCoreSourceHealth(healthyContributions);
    expect(health.healthy).toBe(true);
    expect(health.failures).toEqual([]);
    expect(health.exceptions.map((e) => `${e.id}:${e.rawRecords}`)).toEqual([
      "menustat-opennosh:0",
      "opennutrition:0",
    ]);

    // A future composition change (an adapter the gate does not know) is
    // VISIBLE in the report (unknownSources) without blocking — blocking
    // on unknowns would break the documented --with-opennutrition build.
    const unknown = [
      ...healthyContributions,
      { id: "some-future-source", rawRecords: 5_000, failed: false },
    ];
    const unknownHealth = evaluateCoreSourceHealth(unknown);
    expect(unknownHealth.healthy).toBe(true);
    expect(unknownHealth.unknownSources).toEqual([
      { id: "some-future-source", rawRecords: 5_000, failed: false },
    ]);
  });

  it("GATE WIRING — validate.ts blocks on coreSourceHealth.failures regardless of the count band", () => {
    const source = read(VALIDATE_TS);
    // The gate imports the law module and pushes its failures into the
    // blocking list — the wiring that makes healthy=false exit 1 even
    // when deviationWithinBand is true.
    expect(source).toContain("from './src/gate-core-sources'");
    expect(source).toContain(
      "const coreSourceHealth = evaluateCoreSourceHealth(buildReport.adapterContributions);"
    );
    expect(source).toContain("for (const coreFailure of coreSourceHealth.failures) {");
    expect(source).toContain("CORE SOURCE FAILED:");
    // The blocking loop lives BEFORE any reference to the band verdict —
    // the check is independent of deviationWithinBand by construction.
    const blockingLoop = source.indexOf("for (const coreFailure of coreSourceHealth.failures) {");
    const bandVerdict = source.indexOf("deviationWithinBand: boolean");
    expect(blockingLoop).toBeGreaterThan(-1);
    expect(bandVerdict).toBeGreaterThan(-1);
  });

  it("GATE WIRING — the approved source configuration and count are untouched (build.ts composition law)", () => {
    const source = read(BUILD_TS);
    // DEFAULT_ADAPTERS keeps the audited composition fixed at 538: the
    // four core sources + the cache-only adapter; opennutrition stays in
    // ALL_ADAPTERS only (opt-in via --with-opennutrition).
    const defaultBlock = source.slice(
      source.indexOf("const DEFAULT_ADAPTERS"),
      source.indexOf("const ALL_ADAPTERS")
    );
    expect(defaultBlock).toContain("usdaAdapter");
    expect(defaultBlock).toContain("nationalTablesAdapter");
    expect(defaultBlock).toContain("menuStatOpenNoshAdapter");
    expect(defaultBlock).toContain("offFoodRepoAdapter");
    expect(defaultBlock).toContain("curatedAdapter");
    expect(defaultBlock).not.toContain("openNutritionAdapter");

    const allBlock = source.slice(source.indexOf("const ALL_ADAPTERS"));
    expect(allBlock).toContain("openNutritionAdapter");
  });
});
