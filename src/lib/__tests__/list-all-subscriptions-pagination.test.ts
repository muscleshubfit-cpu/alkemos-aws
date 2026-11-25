import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Subscription } from "@/lib/supabase/types";
import { listAllSubscriptions } from "@/lib/data/subscriptions";
import { LS_SUBS } from "@/lib/data/helpers";

/**
 * W2-1b (P-04 — 2026-11-26) — pagination of listAllSubscriptions.
 *
 * The old implementation fetched `select("*")` in ONE unbounded shot:
 * PostgREST's default max-rows silently truncated every table beyond
 * 1000 rows, so the coach/admin views lost subscriptions without any
 * signal. These tests pin the NEW contract against the project's own
 * Pagination-Completeness Law (Phase 516 hardening precedent,
 * scripts/db/accounts_orphan_audit.py):
 *
 *   1. MORE THAN ONE PAGE — a table over 1000 rows is walked in fixed
 *      pages (1000/page) until a SHORT page proves the end; every row
 *      comes back, in order, with no loss and no duplication.
 *   2. COMPLETENESS — the ONLY completion proof is a short page; a
 *      full page at the page boundary never stops the walk early.
 *   3. ERRORS — a failed page (first or later) returns [] — the old
 *      single-shot swallow-to-empty contract, never partial data.
 *   4. EMPTY PAGES — an empty table (or a trailing empty page after an
 *      exact multiple of the page size) completes cleanly with [].
 *   5. SAFETY CAP — 50 full pages without a short page refuses the
 *      partial data loudly (console.error), never silently truncates.
 *   6. FALLBACK — the LocalStorage path stays exactly as before.
 */

const PAGE_SIZE = 1000;
const MAX_PAGES = 50;

type PageResponse = { data: Subscription[] | null; error: { message: string } | null };

const h = vi.hoisted(() => ({
        configured: true,
        client: null as unknown,
        responder: null as ((from: number, to: number) => PageResponse) | null,
        requests: [] as Array<{ table: string; orders: string[]; range: [number, number] }>,
}));

vi.mock("@/lib/supabase/client", () => ({
        get isSupabaseConfigured() {
                return h.configured;
        },
        get supabase() {
                if (h.client === null) {
                        const mkFrom = (table: string) => {
                                const entry = { table, orders: [] as string[], range: [0, 0] as [number, number] };
                                const b: {
                                        select: (cols: string) => unknown;
                                        order: (col: string, opts?: { ascending?: boolean }) => unknown;
                                        range: (from: number, to: number) => Promise<PageResponse>;
                                } = {
                                        select: () => b,
                                        order: (col, opts) => {
                                                entry.orders.push(`${col}.${opts?.ascending === false ? "desc" : "asc"}`);
                                                return b;
                                        },
                                        range: (from, to) => {
                                                entry.range = [from, to];
                                                h.requests.push(entry);
                                                const res: PageResponse = h.responder ? h.responder(from, to) : { data: [], error: null };
                                                return Promise.resolve(res);
                                        },
                                };
                                return b;
                        };
                        h.client = { from: mkFrom };
                }
                return h.client;
        },
}));

/** A row factory — unique id + unique created_at per index. */
const row = (i: number): Subscription => ({
        id: `row-${String(i).padStart(6, "0")}`,
        client_id: `client-${i % 5}`,
        tier: "premium",
        months: 3,
        start_date: null,
        end_date: null,
        status: "active",
        subscription_type: "membership",
        cancel_requested_at: null,
        created_at: new Date(Date.UTC(2026, 0, 1) + i * 1000).toISOString(),
});

/** Responds from an in-memory table with inclusive [from, to] range slices. */
const tableResponder = (rows: Subscription[]) => (from: number, to: number): PageResponse => ({
        data: rows.slice(from, to + 1),
        error: null,
});

describe("listAllSubscriptions — P-04 pagination (W2-1b)", () => {
        beforeEach(() => {
                h.configured = true;
                h.client = null;
                h.responder = null;
                h.requests.length = 0;
                vi.spyOn(console, "error").mockImplementation(() => {});
        });
        afterEach(() => {
                vi.restoreAllMocks();
                localStorage.clear();
        });

        it("fetches MORE THAN ONE PAGE for a 2,500-row table and returns every row, in order, with none lost or duplicated", async () => {
                const rows = Array.from({ length: 2500 }, (_, i) => row(i));
                h.responder = tableResponder(rows);

                const out = await listAllSubscriptions();

                // Completeness: exact deep equality with the whole table, in the
                // server's page order (created_at desc + id asc) — concatenation
                // of page slices, nothing dropped, nothing duplicated.
                expect(out).toEqual(rows);
                expect(out.length).toBe(2500);
                expect(new Set(out.map((s) => s.id)).size).toBe(2500);
                // Three pages: 1000 full + 1000 full + 500 short.
                expect(h.requests.length).toBe(3);
                expect(h.requests.map((r) => r.range)).toEqual([
                        [0, 999],
                        [1000, 1999],
                        [2000, 2999],
                ]);
                expect(h.requests.every((r) => r.table === "subscriptions")).toBe(true);
        });

        it("uses the deterministic total order on every page request — created_at desc + id asc (PK tiebreaker), select(*) unchanged", () => {
                h.responder = tableResponder([]);
                return listAllSubscriptions().then(() => {
                        const [first] = h.requests;
                        expect(first.orders).toEqual(["created_at.desc", "id.asc"]);
                });
        });

        it("a table of 7 rows (single short page) → exactly ONE request, all rows returned", async () => {
                const rows = Array.from({ length: 7 }, (_, i) => row(i));
                h.responder = tableResponder(rows);

                const out = await listAllSubscriptions();

                expect(out).toEqual(rows);
                expect(h.requests.length).toBe(1);
                expect(h.requests[0].range).toEqual([0, 999]);
        });

        it("EMPTY TABLE → one request, [] — a short empty page is the completion proof", async () => {
                h.responder = tableResponder([]);

                const out = await listAllSubscriptions();

                expect(out).toEqual([]);
                expect(h.requests.length).toBe(1);
                expect(console.error).not.toHaveBeenCalled();
        });

        it("exactly PAGE_SIZE rows → the trailing EMPTY page proves completeness (no premature stop on a full page)", async () => {
                const rows = Array.from({ length: PAGE_SIZE }, (_, i) => row(i));
                h.responder = tableResponder(rows);

                const out = await listAllSubscriptions();

                expect(out).toEqual(rows);
                expect(out.length).toBe(PAGE_SIZE);
                // A FULL page is NOT a completion proof — the walk must continue
                // and the empty second page closes it.
                expect(h.requests.length).toBe(2);
                expect(h.requests[1].range).toEqual([1000, 1999]);
        });

        it("an exact multiple (2× PAGE_SIZE) → 2 full pages + 1 empty proof page, every row returned", async () => {
                const rows = Array.from({ length: 2 * PAGE_SIZE }, (_, i) => row(i));
                h.responder = tableResponder(rows);

                const out = await listAllSubscriptions();

                expect(out).toEqual(rows);
                expect(h.requests.length).toBe(3);
        });

        it("ERROR on the FIRST page → [] (the old single-shot swallow-to-empty contract preserved), logged loudly", async () => {
                h.responder = () => ({ data: null, error: { message: "network down" } });

                const out = await listAllSubscriptions();

                expect(out).toEqual([]);
                expect(h.requests.length).toBe(1);
                expect(console.error).toHaveBeenCalledWith(
                        expect.stringContaining("listAllSubscriptions page failed"),
                        "network down",
                );
        });

        it("ERROR on a LATER page (after full pages succeeded) → [] — partial collected rows are refused, never returned as the full list", async () => {
                const rows = Array.from({ length: 1200 }, (_, i) => row(i));
                h.responder = (from) =>
                        from === 0 ? { data: rows.slice(0, PAGE_SIZE), error: null } : { data: null, error: { message: "mid-walk failure" } };

                const out = await listAllSubscriptions();

                // 1000 real rows were already fetched — and are REFUSED:
                // truncated data must never be presented as "all subscriptions".
                expect(out).toEqual([]);
                expect(out.length).not.toBe(PAGE_SIZE);
                expect(h.requests.length).toBe(2);
                expect(console.error).toHaveBeenCalled();
        });

        it("null data with NO error → treated as an empty page → [] (no crash, no infinite loop)", async () => {
                h.responder = () => ({ data: null, error: null });

                const out = await listAllSubscriptions();

                expect(out).toEqual([]);
                expect(h.requests.length).toBe(1);
        });

        it(`SAFETY CAP: ${MAX_PAGES} full pages without a short page → [] + loud refusal — never a silent 50,000-row truncation`, async () => {
                const fullPage = Array.from({ length: PAGE_SIZE }, (_, i) => row(i));
                h.responder = () => ({ data: fullPage, error: null });

                const out = await listAllSubscriptions();

                expect(h.requests.length).toBe(MAX_PAGES);
                expect(out).toEqual([]); // partial data refused
                expect(console.error).toHaveBeenCalledWith(expect.stringContaining("partial data refused"));
                expect(console.error).toHaveBeenCalledWith(expect.stringContaining(`${MAX_PAGES}-page cap`));
        });

        it("LocalStorage fallback — Supabase not configured → LS_SUBS rows returned verbatim, zero network requests", async () => {
                h.configured = false;
                const rows = [row(1), row(2), row(3)];
                localStorage.setItem(LS_SUBS, JSON.stringify(rows));

                const out = await listAllSubscriptions();

                expect(out).toEqual(rows);
                expect(h.requests.length).toBe(0);
        });

        it("LocalStorage fallback — Supabase configured but the client is absent → LS path, zero network requests", async () => {
                h.configured = true;
                h.client = undefined; // getter passes absence through (only null triggers lazy creation)
                const rows = [row(9)];
                localStorage.setItem(LS_SUBS, JSON.stringify(rows));

                const out = await listAllSubscriptions();

                expect(out).toEqual(rows);
                expect(h.requests.length).toBe(0);
        });
});
