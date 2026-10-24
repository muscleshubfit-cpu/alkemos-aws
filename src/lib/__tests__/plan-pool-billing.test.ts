import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { planPoolBillingForRequester } from "@/lib/tier-limits";

/**
 * PLAN-REGEN-CONSTRAINTS 2026-10-24 (owner order item 3: «تصحيح منطق
 * الأرصدة والاستحقاقات… أضف اختبارات مستقلة تثبت أن مدرب الموقع لا يُخصم
 * من رصيد العميل، وأن قواعد مدربي الشركات تُطبّق كما صُممت»).
 *
 * MEASURED BEFORE THE FIX (read-only DB, §3.3-compliant): the recording
 * burned the CLIENT's unified pool on every successful plan job with a
 * clientId — role-blind. 18/20 latest plan jobs were requested by an
 * ADMIN and each burned its client's pool (client 87cd7ba6, coaching
 * tier pool 8/month, lost 5 units to admin-driven work in two days).
 *
 * THE POLICY MATRIX + THE WIRING PINS:
 *   - b2b coach  → bills the client pool (owner decrees 2026-09-01/13);
 *   - site coach → NEVER bills (B2C members already paid the site — 0067);
 *   - admin      → NEVER bills (site staff work — the measured defect);
 *   - unresolved → never bills (fail-open);
 *   - the processors no longer record (source pin);
 *   - the runner records AFTER finishJob (source pin — no double burn);
 *   - the enqueue gate accepts the site-coach roster (source pin).
 */

const src = (rel: string) =>
  readFileSync(join(process.cwd(), rel), "utf8");

describe("planPoolBillingForRequester — the policy matrix", () => {
  it("B2B coach (coach_kind='b2b') bills the client's unified pool — as designed", () => {
    const v = planPoolBillingForRequester("coach", "b2b");
    expect(v.bill).toBe(true);
    expect(v.reason).toContain("b2b");
  });

  it("legacy coach (coach_kind NULL — migration 0067 default) still bills as b2b", () => {
    expect(planPoolBillingForRequester("coach", null).bill).toBe(true);
    expect(planPoolBillingForRequester("coach", undefined).bill).toBe(true);
    expect(planPoolBillingForRequester("COACH", "").bill).toBe(true);
  });

  it("SITE COACH (coach_kind='site') NEVER deducts from the client's balance", () => {
    const v = planPoolBillingForRequester("coach", "site");
    expect(v.bill).toBe(false);
    expect(v.reason).toContain("site-coach");
    expect(v.reason).toContain("0067");
  });

  it("ADMIN (site staff) NEVER deducts from the client's balance — the measured live defect, killed", () => {
    const v = planPoolBillingForRequester("admin", "b2b");
    expect(v.bill).toBe(false);
    expect(v.reason).toContain("staff quota semantics");
    // coach_kind is irrelevant for admins
    expect(planPoolBillingForRequester("admin", null).bill).toBe(false);
    expect(planPoolBillingForRequester("admin", "site").bill).toBe(false);
  });

  it("unresolvable / client requesters never bill (fail-open on the ledger)", () => {
    expect(planPoolBillingForRequester(null, null).bill).toBe(false);
    expect(planPoolBillingForRequester(undefined, undefined).bill).toBe(false);
    expect(planPoolBillingForRequester("client", null).bill).toBe(false);
    expect(planPoolBillingForRequester("weird-role", "b2b").bill).toBe(false);
    expect(planPoolBillingForRequester(42, {}).bill).toBe(false);
  });
});

describe("the billing wiring pins (fail on revert)", () => {
  it("the processors NO LONGER record plan-pool usage — the role-blind burn is gone from the job path", () => {
    const s = src("src/lib/ai-job-processors.ts");
    expect(s).not.toContain("recordPlanPoolUsage");
    expect(s).not.toContain('import { recordUnifiedPlanUsage } from "@/lib/tier-limits"');
    // the honest hand-off comment must point at the runner-side recorder
    expect(s).toContain("recordPlanPoolOnSuccess");
    expect(s).toContain("planPoolBillingForRequester");
  });

  it("the runner records AFTER finishJob — success-only, single-record (no double burn on requeue)", () => {
    const s = src("scripts/ai-jobs-runner/process.mts");
    // the recording call sits after finishJob within the success path
    expect(s).toContain("await finishJob(job.id, result);");
    expect(s).toMatch(/await finishJob\(job\.id, result\);\s*\n\s*await recordSwapOnSuccess\(job\);\s*\n\s*await recordPlanPoolOnSuccess\(job\);/);
    // role-aware: resolves the requester's profile and consults the policy
    expect(s).toContain('from("profiles")');
    expect(s).toContain("planPoolBillingForRequester(role, coachKind)");
    // fail-soft: a ledger hiccup never fails the finished job
    expect(s).toContain("plan-pool usage recording failed (job stays done)");
  });

  it("the enqueue gate accepts the SITE-COACH roster (site_coach_assignments) and skips the B2B money gates for it", () => {
    const s = src("src/app/api/ai/jobs/route.ts");
    expect(s).toContain('from("site_coach_assignments")');
    expect(s).toContain('requesterProfile?.coach_kind');
    expect(s).toContain("end B2B gates");
    // the B2B gates themselves are UNCHANGED for b2b coaches (source pins)
    expect(s).toContain('from("coach_assignments")');
    expect(s).toContain('from("subscriptions")');
    expect(s).toContain("checkUnifiedPlanQuota({ userId: clientId })");
  });
});
