import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkUnifiedPlanQuota,
  checkSwapQuota,
  quotaBucketsForSubs,
  attributeUsageFifo,
  bucketVerdict,
  earliestBucketWindowStart,
  type SubRowWithStart,
} from "@/lib/tier-limits";
import { resolveUnifiedPlanPoolLimit, resolveUnifiedSwapLimit } from "@/lib/membership-tier";
import { getLimits } from "@/lib/memberships";

/**
 * AI-QUOTAS COMPLETION ORDER 2026-11-14 («استكمال تطوير نظام الحصص
 * الشهرية») — THE PARALLEL-ENTITLEMENT CANARY. Governing doc:
 * docs/AI-QUOTAS-POLICY-2026-11-14.md (§4/§5/§7).
 *
 * The order's acceptance matrix, proven at every layer:
 *
 *   §4-أ EARLY RENEWAL (same plan, before expiry): the renewed row keeps
 *        its start_date (extend_subscription 0018) → the SAME window, the
 *        SAME remaining quota — nothing resets, nothing is lost; the
 *        renewal's fresh entitlements arrive with the NEXT window
 *        («تُضاف استحقاقات الحصص الجديدة وفق مدة التجديد»).
 *   §4-ب UPGRADE (higher plan, before expiry): the old row's quotas and
 *        end_date are untouched; the new row's window starts at ITS OWN
 *        purchase date; the member benefits from BOTH
 *        («يستفيد العميل من حقوق الاشتراكين دون أن يمس أحدهما الآخر»).
 *   §5  CYCLE RENEWAL: quotas renew on each subscription's OWN
 *        anniversary (never the calendar month); unused units die with
 *        their window (no rollover) — EXCEPT nothing paid is ever lost.
 *   §7  NO-LOSS: overlap usage is absorbed FIFO by the earliest-expiring
 *        subscription, and after the old one expires its GHOST bucket
 *        keeps absorbing that usage — the surviving subscription's
 *        entitlement is never eaten by units the old one paid for.
 *   §2  INDEPENDENCE: exhausting the generation quota never gates swaps
 *        and vice versa.
 *   §3  EXHAUSTION + LINKS: 429 vs 402 verdicts and the meter carries
 *        renewalUrl/upgradeUrl riding the EXISTING /checkout path.
 *
 * Section A walks the full member lifecycle with FIXED dates through the
 * pure engine (deterministic, no timers). Section B proves the same
 * verdicts end-to-end through checkUnifiedPlanQuota/checkSwapQuota over a
 * mocked DB. Section C pins the wiring (source pins).
 */

const src = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

/* ─────────────────────────────────────────────────────────────────────
 * A. THE LIFECYCLE WALKTHROUGH — pure engine, fixed dates
 *
 * A member buys PREMIUM on Oct 10 (4 generations + 8 swaps a month,
 * windows [10th → 10th)). Timeline:
 *   Oct 15+20  — burns 2 generations (1 nutrition + 1 workout).
 *   Nov 5      — EARLY RENEWAL (same plan): end_date Nov 10 → Dec 10.
 *   Nov 12     — the window rolls (10th anniversary): fresh 4.
 *   Nov 20     — UPGRADE to PRO (new row, own start Nov 20 → Dec 20).
 *   Nov 22-Dec 5 — burns 6 generations during the overlap.
 *   Dec 12     — premium expired (Dec 10): pro must still have 6 of 8.
 * ───────────────────────────────────────────────────────────────────── */

const gen = (t: "premium" | "pro" | "coaching" | "free") => getLimits(t).aiPlanMonthlyLimit;
const swapQ = (t: "premium" | "pro" | "coaching" | "free") => getLimits(t).evoSwapMonthlyLimit;
const row = (
  tier: string,
  startIso: string,
  endIso: string,
  status = "active",
): SubRowWithStart => ({ tier, status, end_date: endIso, start_date: startIso }) as SubRowWithStart;

/** The member's premium row across its whole life (renewal extends end only). */
const PREMIUM_START = "2026-10-10T10:00:00Z";

describe("A) lifecycle walkthrough — early renewal, upgrade, expiry (no loss)", () => {
  it("§4-أ EARLY RENEWAL: extending end_date (Nov 5) never resets the current window — remaining stays 2/4", () => {
    const beforeRenewal = new Date("2026-11-04T12:00:00Z");
    const afterRenewal = new Date("2026-11-06T12:00:00Z");
    // BEFORE: premium [Oct 10 → Nov 10], 2 used
    let buckets = quotaBucketsForSubs([row("premium", PREMIUM_START, "2026-11-10T10:00:00Z")], gen, beforeRenewal);
    attributeUsageFifo(buckets, ["2026-10-15T09:00:00Z", "2026-10-20T09:00:00Z"]);
    expect(bucketVerdict(buckets)).toMatchObject({ used: 2, limit: 4, remaining: 2 });
    // AFTER the renewal (extend_subscription: SAME row, end Nov 10 → Dec 10)
    buckets = quotaBucketsForSubs([row("premium", PREMIUM_START, "2026-12-10T10:00:00Z")], gen, afterRenewal);
    attributeUsageFifo(buckets, ["2026-10-15T09:00:00Z", "2026-10-20T09:00:00Z"]);
    const v = bucketVerdict(buckets);
    expect(v).toMatchObject({ used: 2, limit: 4, remaining: 2 }); // NOT reset to 4
    expect(v.renewsAt).toBe("2026-11-10T00:00:00.000Z"); // the SAME renewal day
    // The wrong readings this kills:
    expect(v.remaining).not.toBe(4); // «لا تُصفّر الحصص المتبقية»
    expect(v.remaining).not.toBe(0); // and nothing is lost either
  });

  it("§5 CYCLE RENEWAL: after the 10th, the window rolls — fresh 4 (the 2 unused died: no rollover)", () => {
    const now = new Date("2026-11-12T12:00:00Z");
    const buckets = quotaBucketsForSubs([row("premium", PREMIUM_START, "2026-12-10T10:00:00Z")], gen, now);
    // October's 2 successes are OUTSIDE the new window [Nov 10 → Dec 10)
    attributeUsageFifo(buckets, ["2026-10-15T09:00:00Z", "2026-10-20T09:00:00Z"]);
    const v = bucketVerdict(buckets);
    expect(v).toMatchObject({ used: 0, limit: 4, remaining: 4 }); // fresh entitlement
    expect(buckets[0].windowStart).toBe("2026-11-10T00:00:00.000Z"); // the sub's OWN anniversary
  });

  it("§4-ب UPGRADE (Nov 20): old quotas + end_date untouched, new window from the PURCHASE date, BOTH live", () => {
    const now = new Date("2026-11-21T12:00:00Z");
    const premiumRow = row("premium", PREMIUM_START, "2026-12-10T10:00:00Z");
    const proRow = row("pro", "2026-11-20T14:00:00Z", "2026-12-20T14:00:00Z");
    const buckets = quotaBucketsForSubs([premiumRow, proRow], gen, now);
    expect(buckets).toHaveLength(2);
    const premium = buckets.find((b) => !b.ghost && b.limit === 4)!;
    const pro = buckets.find((b) => !b.ghost && b.limit === 8)!;
    // the old subscription keeps its own cycle [Nov 10 → Dec 10) and its end
    expect(premium.windowStart).toBe("2026-11-10T00:00:00.000Z");
    expect(premium.subEnd).toBe("2026-12-10T10:00:00Z");
    // the new subscription's entitlement starts at the PURCHASE date
    expect(pro.windowStart).toBe("2026-11-20T00:00:00.000Z");
    // the member benefits from BOTH for the overlap: 4 + 8 = 12
    expect(bucketVerdict(buckets)).toMatchObject({ limit: 12, remaining: 12 });
    // The stacking law twins (pure aggregator == Σ buckets):
    expect(resolveUnifiedPlanPoolLimit([premiumRow, proRow], now)).toBe(12);
    expect(resolveUnifiedSwapLimit([premiumRow, proRow], now)).toBe(24); // 8 + 16
  });

  it("§7 THE NO-LOSS SCENARIO: 6 burned during the overlap — premium (earliest-expiring) absorbs 4, pro absorbs 2", () => {
    const duringOverlap = new Date("2026-12-01T12:00:00Z");
    const rows = [
      row("premium", PREMIUM_START, "2026-12-10T10:00:00Z"),
      row("pro", "2026-11-20T14:00:00Z", "2026-12-20T14:00:00Z"),
    ];
    const overlapUsage = [
      "2026-11-22T09:00:00Z", "2026-11-25T09:00:00Z", "2026-11-28T09:00:00Z",
      "2026-12-01T09:00:00Z", "2026-12-03T09:00:00Z", "2026-12-05T09:00:00Z",
    ];
    let buckets = quotaBucketsForSubs(rows, gen, duringOverlap);
    attributeUsageFifo(buckets, overlapUsage);
    // FIFO: premium caps at 4, the spillover (2) lands on pro
    expect(bucketVerdict(buckets)).toMatchObject({ used: 6, limit: 12, remaining: 6 });
    const premiumUsed = buckets.find((b) => !b.ghost && b.limit === 4)!.used;
    const proUsed = buckets.find((b) => !b.ghost && b.limit === 8)!.used;
    expect(premiumUsed).toBe(4);
    expect(proUsed).toBe(2);
  });

  it("§7 AFTER THE OLD SUB EXPIRES (Dec 12): the ghost keeps absorbing its 4 — pro still has 6 of 8 (NOT 2)", () => {
    const afterExpiry = new Date("2026-12-12T12:00:00Z");
    const rows = [
      row("premium", PREMIUM_START, "2026-12-10T10:00:00Z"), // expired 2 days ago
      row("pro", "2026-11-20T14:00:00Z", "2026-12-20T14:00:00Z"),
    ];
    const overlapUsage = [
      "2026-11-22T09:00:00Z", "2026-11-25T09:00:00Z", "2026-11-28T09:00:00Z",
      "2026-12-01T09:00:00Z", "2026-12-03T09:00:00Z", "2026-12-05T09:00:00Z",
    ];
    const buckets = quotaBucketsForSubs(rows, gen, afterExpiry);
    // The ghost premium exists (window clamped to its death) and absorbs…
    const ghosts = buckets.filter((b) => b.ghost);
    expect(ghosts.length).toBeGreaterThanOrEqual(1);
    // …the pro bucket is the ONLY live limit…
    const live = buckets.filter((b) => !b.ghost);
    expect(live).toHaveLength(1);
    expect(live[0].limit).toBe(8);
    // The full no-loss verdict: the ghost absorbed the 4 overlap units it
    // paid for — pro shows its OWN live consumption (2 of 8, 6 left). The
    // ghost's units left with the expired subscription: never counted
    // against a live entitlement, never re-granted.
    attributeUsageFifo(buckets, overlapUsage);
    const v = bucketVerdict(buckets);
    expect(v).toMatchObject({ used: 2, limit: 8, remaining: 6 });
    // The wrong reading this kills (re-attribution to the survivor):
    expect(v.remaining).not.toBe(2);
  });

  it("§7 ghost hygiene: a ghost NEVER grants quota, never outlives 45 days, and a live sibling of the same tier wins", () => {
    const now = new Date("2026-12-12T12:00:00Z");
    // Only an expired premium (no live rows): no bucket is needed at all —
    // there is nothing to shield, and the gates answer with the honest 402
    // subscriber-only verdict (proven end-to-end below).
    const onlyGhost = quotaBucketsForSubs(
      [row("premium", PREMIUM_START, "2026-12-10T10:00:00Z")],
      gen,
      now,
    );
    expect(onlyGhost).toEqual([]);
    // A ghost older than the lookback never even becomes a bucket.
    expect(
      quotaBucketsForSubs([row("premium", "2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z")], gen, now),
    ).toEqual([]);
    // A live premium row beats its expired stray duplicate (renewal shape).
    const renewed = quotaBucketsForSubs(
      [
        row("premium", PREMIUM_START, "2026-12-10T10:00:00Z"), // stray expired
        row("premium", PREMIUM_START, "2027-06-10T10:00:00Z"), // the live renewed row
      ],
      gen,
      now,
    );
    expect(renewed).toHaveLength(1);
    expect(renewed[0].ghost).toBe(false);
    expect(renewed[0].subEnd).toBe("2027-06-10T10:00:00Z");
    // A ghost BESIDE a live different tier shields it (the no-loss shape):
    // the live row exists, the ghost exists, and the ghost never grants.
    const shielded = quotaBucketsForSubs(
      [
        row("premium", PREMIUM_START, "2026-12-10T10:00:00Z"),
        row("pro", "2026-11-20T14:00:00Z", "2026-12-20T14:00:00Z"),
      ],
      gen,
      now,
    );
    expect(shielded.some((b) => b.ghost)).toBe(true);
    expect(bucketVerdict(shielded).limit).toBe(8); // the ghost adds NOTHING
  });

  it("§5 NO ROLLOVER, both quotas: unused units die with their window — but the OTHER quota is untouched", () => {
    const now = new Date("2026-11-12T12:00:00Z");
    // 2 generations used in October die with the Oct→Nov window…
    const genBuckets = quotaBucketsForSubs([row("premium", PREMIUM_START, "2026-12-10T10:00:00Z")], gen, now);
    attributeUsageFifo(genBuckets, ["2026-10-15T09:00:00Z", "2026-10-20T09:00:00Z"]);
    expect(bucketVerdict(genBuckets)).toMatchObject({ used: 0, limit: 4 });
    // …and the SAME timestamps against the SWAP quota also die (§2: the two
    // quotas are independent ledgers with the same window law).
    const swapBuckets = quotaBucketsForSubs([row("premium", PREMIUM_START, "2026-12-10T10:00:00Z")], swapQ, now);
    attributeUsageFifo(swapBuckets, ["2026-10-15T09:00:00Z", "2026-10-20T09:00:00Z"]);
    expect(bucketVerdict(swapBuckets)).toMatchObject({ used: 0, limit: 8 });
  });
});

/* ─────────────────────────────────────────────────────────────────────
 * B. END-TO-END VERDICTS — the gates over a mocked DB
 * ───────────────────────────────────────────────────────────────────── */

const h = vi.hoisted(() => {
  const subRows: Array<{ tier: string; status: string; end_date: string; start_date: string | null }> = [];
  const usage: Record<string, Array<{ created_at: string }>> = {};
  const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  return { subRows, usage, inserts };
});

type RowOutcome = { count: number | null; error: unknown; data: unknown };
interface FakeBuilder extends PromiseLike<RowOutcome> {
  select: () => FakeBuilder;
  eq: (col: string, val: unknown) => FakeBuilder;
  gt: () => FakeBuilder;
  gte: (col: string, val: unknown) => FakeBuilder;
  order: () => FakeBuilder;
  limit: () => FakeBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
  single: () => Promise<{ data: unknown; error: unknown }>;
}

vi.mock("@/lib/supabase/admin", () => {
  const makeBuilder = (table: string): FakeBuilder => {
    let identity = "";
    let sinceMs = 0;
    const outcome = (): Promise<RowOutcome> => {
      if (table === "subscriptions") {
        return Promise.resolve({ count: null, error: null, data: h.subRows } as unknown as RowOutcome);
      }
      const rows = (h.usage[`${table}:${identity}`] ?? []).filter(
        (r) => new Date(r.created_at).getTime() >= sinceMs,
      );
      return Promise.resolve({ count: rows.length, error: null, data: rows } as unknown as RowOutcome);
    };
    const builder: FakeBuilder = {
      select: () => builder,
      eq: (col, val) => {
        if (col === "user_id") identity = String(val);
        return builder;
      },
      gt: () => builder,
      gte: (col, val) => {
        if (col === "created_at") sinceMs = new Date(String(val)).getTime();
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      then: (onfulfilled, onrejected) => outcome().then(onfulfilled, onrejected),
    };
    return builder;
  };
  return {
    isSupabaseAdminConfigured: true,
    supabaseAdmin: {
      from: (table: string) => {
        const b = makeBuilder(table);
        if (table === "ai_plan_usage") {
          return {
            ...b,
            insert: (r: Record<string, unknown>) => ({
              then: (onfulfilled: unknown, onrejected: unknown) => {
                h.inserts.push({ table, row: r });
                return Promise.resolve({ error: null }).then(onfulfilled as never, onrejected as never);
              },
            }),
          };
        }
        return b;
      },
    },
  };
});

const MEMBER = "44444444-4444-4444-4444-444444444444";
const DAY = 86400000;

describe("B) end-to-end verdicts (mocked DB)", () => {
  beforeEach(() => {
    h.subRows.length = 0;
    for (const k of Object.keys(h.usage)) delete h.usage[k];
    h.inserts.length = 0;
  });

  it("§3 EXHAUSTION + §2 INDEPENDENCE: generation 4/4 blocks generation but swaps stay fully usable — and vice versa", async () => {
    const now = Date.now();
    h.subRows.push({
      tier: "premium",
      status: "active",
      end_date: new Date(now + 30 * DAY).toISOString(),
      start_date: new Date(now - 10 * DAY).toISOString(),
    });
    // 4 generations burned (exhausted)…
    h.usage[`ai_plan_usage:${MEMBER}`] = Array.from({ length: 4 }, (_, i) => ({
      created_at: new Date(now - DAY - i * 60_000).toISOString(),
    }));
    const gen = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "premium" });
    expect(gen.allowed).toBe(false);
    expect(gen).toMatchObject({ used: 4, limit: 4, remaining: 0 });
    expect(gen.subscriptionRequired).toBe(false); // 429, not 402
    expect(gen.renewsAt).toBeTruthy(); // the renewal date rides the verdict
    // …yet the swap quota is FULLY independent and untouched (8/8).
    const swap = await checkSwapQuota(MEMBER, "meal", "premium");
    expect(swap).toMatchObject({ allowed: true, used: 0, limit: 8, remaining: 8 });
    // And the mirror: 8 swaps burned never gates generation.
    h.usage[`plan_swaps:${MEMBER}`] = Array.from({ length: 8 }, (_, i) => ({
      created_at: new Date(now - DAY - i * 60_000).toISOString(),
    }));
    const swapExhausted = await checkSwapQuota(MEMBER, "exercise", "premium");
    expect(swapExhausted).toMatchObject({ allowed: false, used: 8, limit: 8 });
    const genStillFine = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "premium" });
    expect(genStillFine.allowed).toBe(false); // still exhausted from ITS OWN 4
    h.usage[`ai_plan_usage:${MEMBER}`] = [];
    const genFresh = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "premium" });
    expect(genFresh.allowed).toBe(true); // swaps' exhaustion never touched it
  });

  it("§2 UNIFIED SWAPS: meal and exercise rows land in the SAME quota (the enqueue gate reads one verdict)", async () => {
    const now = Date.now();
    h.subRows.push({
      tier: "pro",
      status: "active",
      end_date: new Date(now + 30 * DAY).toISOString(),
      start_date: new Date(now - 10 * DAY).toISOString(),
    });
    // 15 swaps: any mix of meals/exercises — one quota of 16.
    h.usage[`plan_swaps:${MEMBER}`] = Array.from({ length: 15 }, (_, i) => ({
      created_at: new Date(now - DAY - i * 60_000).toISOString(),
    }));
    const v = await checkSwapQuota(MEMBER, "meal", "pro");
    expect(v).toMatchObject({ used: 15, limit: 16, remaining: 1, allowed: true });
    h.usage[`plan_swaps:${MEMBER}`] = [
      ...h.usage[`plan_swaps:${MEMBER}`],
      { created_at: new Date(now - 30 * 60_000).toISOString() },
    ];
    const blocked = await checkSwapQuota(MEMBER, "exercise", "pro");
    expect(blocked).toMatchObject({ allowed: false, used: 16, remaining: 0 });
  });

  it("§4-ب→§7 END-TO-END NO-LOSS: after the old sub expires, the survivor keeps its full minus the true spillover", async () => {
    const now = Date.now();
    // premium bought 40d ago, renewed once (end 20d ahead → died... no —
    // craft the expiry INSIDE the recent window): premium ended 2 days ago;
    // pro bought 22 days ago, ends 8 days ahead.
    h.subRows.push(
      {
        tier: "premium",
        status: "active",
        end_date: new Date(now - 2 * DAY).toISOString(),
        start_date: new Date(now - 40 * DAY).toISOString(),
      },
      {
        tier: "pro",
        status: "active",
        end_date: new Date(now + 8 * DAY).toISOString(),
        start_date: new Date(now - 22 * DAY).toISOString(),
      },
    );
    // 6 generations during the overlap (3 days ago — premium was still live).
    h.usage[`ai_plan_usage:${MEMBER}`] = Array.from({ length: 6 }, (_, i) => ({
      created_at: new Date(now - 3 * DAY - i * 60_000).toISOString(),
    }));
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    // Ghost premium absorbed 4; pro's 8 minus the 2-unit spillover = 6
    // (used counts the LIVE subscription only — the ghost's units left
    // with the subscription that paid for them).
    expect(v).toMatchObject({ used: 2, limit: 8, remaining: 6, allowed: true });
    expect(v.remaining).not.toBe(2); // the re-attribution defect this kills
  });

  it("§3 SUCCESS-ONLY: the check gates write NOTHING (the runner records on `done` only)", async () => {
    const now = Date.now();
    h.subRows.push({
      tier: "premium",
      status: "active",
      end_date: new Date(now + 30 * DAY).toISOString(),
      start_date: new Date(now - 10 * DAY).toISOString(),
    });
    await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "premium" });
    await checkSwapQuota(MEMBER, "meal", "premium");
    expect(h.inserts).toHaveLength(0);
  });

  it("subscriber-only: no live paid rows (only a ghost) → 402 verdicts for BOTH quotas", async () => {
    const now = Date.now();
    h.subRows.push({
      tier: "premium",
      status: "active",
      end_date: new Date(now - 2 * DAY).toISOString(), // expired → ghost only
      start_date: new Date(now - 40 * DAY).toISOString(),
    });
    const gen = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "premium" });
    expect(gen.allowed).toBe(false);
    expect(gen.subscriptionRequired).toBe(true); // the hint cannot out-grant the DB
    expect(gen.limit).toBe(0);
    const swap = await checkSwapQuota(MEMBER, "meal", "premium");
    expect(swap.allowed).toBe(false);
    expect(swap.subscriptionRequired).toBe(true);
  });
});

/* ─────────────────────────────────────────────────────────────────────
 * C. WIRING PINS — the exhaustion UX + the once-only ledger
 * ───────────────────────────────────────────────────────────────────── */

describe("C) wiring pins (§3 links + §2 once-only)", () => {
  it("the meter (/api/ai/quota) carries renewalUrl/upgradeUrl from memberships.ts (the EXISTING payment path)", () => {
    const route = src("src/app/api/ai/quota/route.ts");
    expect(route).toContain("renewalCheckoutUrlFor");
    expect(route).toContain("upgradeCheckoutUrlFor");
    expect(route).toContain("renewalUrl");
    expect(route).toContain("upgradeUrl");
    // the URL builders live in the client-safe single source
    const memberships = src("src/lib/memberships.ts");
    expect(memberships).toContain("/checkout?tier=${tier}&months=1");
  });

  it("PlansView renders the exhaustion CTAs for BOTH quotas independently (AR + EN)", () => {
    const view = src("src/components/views/PlansView.tsx");
    // generation exhaustion block
    expect(view).toContain("planQuota.remaining <= 0");
    expect(view).toContain("planQuota.renewalUrl");
    expect(view).toContain("planQuota.upgradeUrl");
    // swap exhaustion block (independent)
    expect(view).toContain("swapUsage.remaining <= 0");
    expect(view).toContain("swapUsage.renewalUrl");
    expect(view).toContain("swapUsage.upgradeUrl");
    // the AR + EN renewal/upgrade labels
    expect(view).toContain("تجديد الاشتراك الآن");
    expect(view).toContain("Renew your plan now");
    expect(view).toContain("الترقية إلى باقة أعلى");
    expect(view).toContain("Upgrade to a higher plan");
  });

  it("§2 once-only: the ledgers keep the UNIQUE job_ref law (migration 0110)", () => {
    const limits = src("src/lib/tier-limits.ts");
    expect(limits).toContain("job_ref: opts.jobRef ?? null");
    expect(limits).toContain("job_ref: jobRef ?? null");
    const migrationIndex = src("supabase/migrations/INDEX.md");
    expect(migrationIndex).toContain("0110");
  });

  it("the swap enqueue gate carries renewsAt in its 429 body (the cycle renewal date)", () => {
    const jobs = src("src/app/api/ai/jobs/route.ts");
    expect(jobs).toContain("renewsAt: limitCheck.renewsAt ?? null");
  });
});
