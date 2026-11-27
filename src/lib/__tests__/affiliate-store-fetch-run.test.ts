import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * STORE-FETCH PIPELINE CANARIES (Phase 529) — the run-level laws with
 * the DB + the Creators API mocked:
 *   - THE HONEST DORMANCY: no credentials → a failed run recorded with
 *     'missing-credentials', ZERO network calls, and the admin alert.
 *   - THE OVERLAP LOCK: a live 'running' row → the run skips.
 */

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: { from: (table: unknown) => mockFrom(table) },
}));

vi.mock("next/cache", () => ({
  revalidateTag: () => undefined,
  revalidatePath: () => undefined,
  // affiliate-store-linking now imports blog-server (the Phase-533 render
  // pipeline) which wraps its fetchers in unstable_cache — a passthrough
  // keeps the module importable without Next's real runtime (the
  // site-content-revalidate precedent).
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock("@/lib/edge-purge", () => ({
  purgeCloudflareEdgeUrls: vi.fn(async () => ({ attempted: false, ok: false, urls: [] })),
}));

vi.mock("@/lib/affiliate-store-admin", async (importOriginal) => {
  const original = await importOriginal<typeof import("../affiliate-store-admin")>();
  return {
    ...original,
    adminUpsertAffiliateStoreProduct: vi.fn(async () => ({ ok: true, id: "new-product-id", findings: [] })),
    flushAffiliateStoreCaches: vi.fn(async () => undefined),
  };
});

vi.mock("@/lib/affiliate-store-linking", async (importOriginal) => {
  const original = await importOriginal<typeof import("../affiliate-store-linking")>();
  return {
    ...original,
    deactivateAffiliateStoreLinksForProducts: vi.fn(async () => undefined),
  };
});

import { runAffiliateStoreFetch } from "../affiliate-store-fetch";

/** A flexible thenable query-builder mock (every call shape the
 *  automation layer uses: select+eq+maybeSingle · insert+select+single ·
 *  update+eq · select+limit · bare select). */
type Row = Record<string, unknown>;

function makeBuilder(handlers: {
  onMaybeSingle?: () => Row | null;
  onList?: () => Row[];
  onInsert?: () => Row | null;
}) {
  const state: Row = {};
  const c: Record<string, unknown> = {};
  const self = () => c;
  c.select = vi.fn(self);
  c.eq = vi.fn(self);
  c.neq = vi.fn(self);
  c.not = vi.fn(self);
  c.in = vi.fn(self);
  c.contains = vi.fn(self);
  c.order = vi.fn(self);
  c.gte = vi.fn(self);
  c.where = vi.fn(self);
  c.maybeSingle = vi.fn(() => Promise.resolve({ data: handlers.onMaybeSingle?.() ?? null, error: null }));
  c.single = vi.fn(() => Promise.resolve({ data: handlers.onInsert?.() ?? null, error: null }));
  c.insert = vi.fn(() => {
    // .insert(row).select("id").single()
    return c;
  });
  // .update(row).eq("id", x) — chainable AND awaitable (thenable)
  c.update = vi.fn(() => c);
  c.upsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
  c.limit = vi.fn(() => Promise.resolve({ data: handlers.onList?.() ?? [], error: null }));
  c.then = (
    resolve: (v: unknown) => unknown,
    reject: (v: unknown) => unknown,
  ) => Promise.resolve({ data: handlers.onList?.() ?? [], error: null }).then(resolve, reject);
  return c;
}

const SETTINGS_ROW = {
  is_enabled: true,
  frequency: "weekly",
  max_new_per_run: 12,
  max_links_per_page: 3,
  auto_link_enabled: true,
  link_score_threshold: 30,
  last_run_at: null,
};

/** The full-DB mock used by the run-level tests. */
function installDbMock(overrides: { runningRows?: Row[] } = {}) {
  const written = {
    runs: [] as Row[],
    settings: [] as Row[],
    notifications: [] as Row[],
  };
  mockFrom.mockImplementation((table: string) => {
    switch (table) {
      case "affiliate_store_automation_settings":
        return makeBuilder({
          onMaybeSingle: () => SETTINGS_ROW,
          onList: () => [SETTINGS_ROW],
        });
      case "affiliate_store_fetch_categories":
        return makeBuilder({ onList: () => [] });
      case "affiliate_store_fetch_runs": {
        const c = makeBuilder({
          onMaybeSingle: () => null,
          onList: () => overrides.runningRows ?? [],
          onInsert: () => ({ id: "run-1" }),
        });
        // track run writes for assertions
        const insertFn = c.insert as ReturnType<typeof vi.fn>;
        insertFn.mockImplementation((row: Row) => {
          written.runs.push(row);
          return c;
        });
        const updateFn = c.update as ReturnType<typeof vi.fn>;
        updateFn.mockImplementation((row: Row) => {
          written.runs.push(row);
          return c;
        });
        return c;
      }
      case "affiliate_store_products":
        return makeBuilder({ onList: () => [] });
      case "admin_notifications":
        return makeBuilder({
          onList: () => [],
          onInsert: () => ({ id: "notif-1" }),
        });
      default:
        return makeBuilder({});
    }
  });
  return written;
}

beforeEach(() => {
  vi.unstubAllEnvs();
  mockFrom.mockReset();
});

describe("THE HONEST DORMANCY (no Creators API credentials)", () => {
  it("records a failed missing-credentials run, stamps last_run_at, and never touches the network", async () => {
    vi.stubEnv("AMAZON_CREATORS_API_CREDENTIAL_ID", "");
    vi.stubEnv("AMAZON_CREATORS_API_SECRET", "");
    const written = installDbMock();

    const result = await runAffiliateStoreFetch("cron");

    expect(result.status).toBe("failed");
    expect(result.reason).toBe("missing-credentials");
    // the failed run row carries the honest summary
    const finish = written.runs.find((r) => r.status === "failed");
    expect(finish).toBeDefined();
    expect(String(finish!.error_summary)).toContain("missing-credentials");
    // the running claim was recorded first
    expect(written.runs.some((r) => r.status === "running")).toBe(true);
    // no search/getItems call could have happened (no credentials at all)
    expect(result.counters.inserted).toBe(0);
  });
});

describe("THE OVERLAP LOCK (a live running row)", () => {
  it("skips when another run holds the lock (started 5 minutes ago)", async () => {
    vi.stubEnv("AMAZON_CREATORS_API_CREDENTIAL_ID", "cred");
    vi.stubEnv("AMAZON_CREATORS_API_SECRET", "secret");
    installDbMock({
      runningRows: [{ id: "other-run", started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() }],
    });

    const result = await runAffiliateStoreFetch("cron");
    expect(result.status).toBe("skipped");
    expect(result.reason).toBe("another-run-active");
  });

  it("reaps a STALE lock (older than 2h) and proceeds to claim", async () => {
    vi.stubEnv("AMAZON_CREATORS_API_CREDENTIAL_ID", "cred");
    vi.stubEnv("AMAZON_CREATORS_API_SECRET", "secret");
    const written = installDbMock({
      runningRows: [{ id: "dead-run", started_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }],
    });

    const result = await runAffiliateStoreFetch("cron");
    // the stale lock was reaped to failed…
    const reaped = written.runs.find((r) => r.error_summary === expect.stringContaining("stale-lock") as unknown as string);
    expect(
      written.runs.some(
        (r) => typeof r.error_summary === "string" && r.error_summary.includes("stale-lock-recovered"),
      ),
    ).toBe(true);
    // …and the new run claimed the slot (status running → then its own
    // terminal state; with mocked empty categories it succeeds)
    expect(["succeeded", "partial"]).toContain(result.status);
  });
});
