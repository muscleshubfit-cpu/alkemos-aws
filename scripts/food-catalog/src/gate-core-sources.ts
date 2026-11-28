/**
 * F3-a (539) — the approved-core-source liveness check for the acceptance
 * gate (scripts/food-catalog/validate.ts).
 *
 * The count band (criterion 2: total vs the 130,362 reference ± a documented
 * deviation, default ±20%) DOCUMENTS drift — upstream sources drift daily and
 * adapter availability varies. It must never MASK a dead source: a build that
 * loses a whole approved core source can still land inside the band (e.g. the
 * CNF tables or the curated packs contribute only a few thousand raw records
 * — losing either moves the total by a few percent) and would previously pass
 * the gate. Owner order 2026-11-28: the failure of ANY approved core source
 * must fail the acceptance gate, while the documented exceptions survive —
 * the cache-only source (contributes 0 on a fresh runner by design) and the
 * optional opt-in source (contributed 0 to the reference build).
 *
 * A core source is FAILED when ANY of:
 *  - the build report marks it `failed: true` (its adapter threw), or
 *  - it contributed ZERO raw records without throwing (the real failure mode
 *    of the OFF stream and the USDA downloader: they log and return [] —
 *    a silent zero), or
 *  - it is MISSING from the report entirely (composition drift — the
 *    approved composition was changed without an owner decision).
 *
 * Pure, dependency-free on purpose: validate.ts imports it, and the repo's
 * vitest suite (src/lib/__tests__/food-catalog-gate-core-sources.test.ts)
 * imports the SAME module to pin the law — no @libsql needed to test it.
 *
 * The composition law itself lives in build.ts (DEFAULT_ADAPTERS) — this
 * module must MIRROR it, never change it (a composition change is an owner
 * decision; build.ts is untouched by this check).
 */

/** The four approved core sources — the documented contributors of the
 * reference build (source DATA_LICENSES "Current Build": raw 170,051 →
 * 130,362 foods; build.ts DEFAULT_ADAPTERS minus the cache-only adapter). */
export const APPROVED_CORE_SOURCE_IDS: readonly string[] = [
  'usda',
  'national-tables',
  'off-foodrepo',
  'curated',
];

/** Documented exception (cache-only): runs from a local cache that a fresh
 * CI runner never has — contributes 0 raw records on a fresh runner BY
 * DESIGN (scripts/food-catalog/README.md "Upstream sources"). Its failure or
 * zero contribution is recorded, never blocking. */
export const CACHE_ONLY_SOURCE_IDS: readonly string[] = ['menustat-opennosh'];

/** Documented exception (optional, opt-in via --with-opennutrition): it
 * contributed 0 to the reference build and joining it grows the approved
 * composition by ~+49% — an owner decision, not a build default. Its failure
 * or zero contribution is recorded, never blocking. */
export const OPTIONAL_SOURCE_IDS: readonly string[] = ['opennutrition'];

export type CoreSourceFailureReason =
  | 'adapter-failed' // the adapter threw (build report failed: true)
  | 'zero-records' // silent death: no throw, but 0 raw records
  | 'missing-from-report'; // absent from build-report.json entirely

/** The slice of build-report.json's adapterContributions this check reads. */
export interface GateAdapterContribution {
  id: string;
  rawRecords: number;
  failed: boolean;
}

export interface CoreSourceFailure {
  id: string;
  reason: CoreSourceFailureReason;
  rawRecords: number;
}

export interface CoreSourceExceptionRecord {
  id: string;
  kind: 'cache-only' | 'optional';
  present: boolean;
  failed: boolean;
  rawRecords: number;
}

export interface UnknownSourceRecord {
  id: string;
  rawRecords: number;
  failed: boolean;
}

export interface CoreSourceHealth {
  coreSourceIds: string[];
  failures: CoreSourceFailure[];
  exceptions: CoreSourceExceptionRecord[];
  unknownSources: UnknownSourceRecord[];
  healthy: boolean; // failures.length === 0 — the gate's blocking verdict
}

/**
 * Evaluates the approved-core-source liveness of a build from its
 * adapter-contributions slice of build-report.json.
 *
 * Blocking (any entry → the acceptance gate MUST fail, regardless of the
 * count band): every APPROVED_CORE_SOURCE_IDS entry that threw, contributed
 * 0 raw records, or is missing from the report.
 *
 * Non-blocking (recorded as the documented exceptions): the cache-only
 * source and the optional opt-in source — however they behaved. Unknown
 * adapter ids (composition drift the gate does not know) are recorded for
 * visibility without blocking: the count band and the owner's review cover
 * them (blocking on unknowns would break the documented --with-opennutrition
 * build, whose report carries the optional adapter).
 */
export function evaluateCoreSourceHealth(
  contributions: readonly GateAdapterContribution[]
): CoreSourceHealth {
  const byId = new Map<string, GateAdapterContribution>();
  for (const contribution of contributions) {
    if (contribution && typeof contribution.id === 'string') {
      byId.set(contribution.id, contribution);
    }
  }

  const failures: CoreSourceFailure[] = [];
  for (const id of APPROVED_CORE_SOURCE_IDS) {
    const contribution = byId.get(id);
    if (!contribution) {
      failures.push({ id, reason: 'missing-from-report', rawRecords: 0 });
      continue;
    }
    if (contribution.failed) {
      failures.push({ id, reason: 'adapter-failed', rawRecords: contribution.rawRecords });
      continue;
    }
    const rawRecords =
      typeof contribution.rawRecords === 'number' && Number.isFinite(contribution.rawRecords)
        ? contribution.rawRecords
        : 0;
    if (rawRecords <= 0) {
      failures.push({ id, reason: 'zero-records', rawRecords });
    }
  }

  const exceptions: CoreSourceExceptionRecord[] = [];
  const recordException = (id: string, kind: 'cache-only' | 'optional'): void => {
    const contribution = byId.get(id);
    exceptions.push({
      id,
      kind,
      present: contribution !== undefined,
      failed: contribution ? contribution.failed === true : false,
      rawRecords: contribution ? contribution.rawRecords : 0,
    });
  };
  for (const id of CACHE_ONLY_SOURCE_IDS) {
    recordException(id, 'cache-only');
  }
  for (const id of OPTIONAL_SOURCE_IDS) {
    recordException(id, 'optional');
  }

  const known = new Set<string>();
  for (const id of APPROVED_CORE_SOURCE_IDS) known.add(id);
  for (const id of CACHE_ONLY_SOURCE_IDS) known.add(id);
  for (const id of OPTIONAL_SOURCE_IDS) known.add(id);

  const unknownSources: UnknownSourceRecord[] = [];
  for (const contribution of contributions) {
    if (contribution && typeof contribution.id === 'string' && !known.has(contribution.id)) {
      unknownSources.push({
        id: contribution.id,
        rawRecords: contribution.rawRecords,
        failed: contribution.failed === true,
      });
    }
  }

  return {
    coreSourceIds: APPROVED_CORE_SOURCE_IDS.slice(),
    failures,
    exceptions,
    unknownSources,
    healthy: failures.length === 0,
  };
}
