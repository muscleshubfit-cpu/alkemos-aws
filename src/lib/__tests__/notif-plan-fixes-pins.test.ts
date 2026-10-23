import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * NOTIF→PLAN 2026-10-24 (owner order items 1+2+3+4+6) — source pins for
 * the notification/plan wiring. The repo's established canary pattern for
 * cross-file contracts (grep-pinned source lines): these tests fail when
 * someone reverts a deep link, drops the dedup guard, deletes the survey
 * eligibility gate, or undoes the modal min-width fix.
 */

const src = (rel: string) =>
  readFileSync(join(process.cwd(), "src", rel), "utf8");

describe("item 3 — notification deep links (روابط الإشعارات)", () => {
  it("plan_activated links deep-open the exact plan (/plans?plan=<id>) + carries plan_id for dedup", () => {
    const s = src("lib/data/plans.ts");
    expect(s).toContain("`/plans?plan=${planId}`");
    expect(s).toContain("createNotificationDeduped");
    expect(s).toContain('{ key: "plan_id", value: planId');
  });

  it("plan_approved (staff) opens the client's manager page, not the generic coach list", () => {
    const s = src("lib/data/plans.ts");
    expect(s).toContain("`/coach/${clientId}`");
    expect(s).toContain("dedupKey: `plan_approved:${planId}`");
  });

  it("questionnaire_submitted opens the client's manager page + dedupKey", () => {
    const s = src("lib/data/questionnaires.ts");
    expect(s).toContain("`/coach/${clientId}`");
    expect(s).toContain("dedupKey: `questionnaire_submitted:${clientId}:${type}`");
  });

  it("questionnaire_status is deduped per (type:status) — coach double-clicks ring once", () => {
    const s = src("lib/data/questionnaires.ts");
    expect(s).toContain('"questionnaire_status"');
    expect(s).toContain('{ key: "dedup_value"');
  });

  it("new_client sites (auth.ts) all deep-link to /coach/<id> with dedupKeys", () => {
    const s = src("lib/data/auth.ts");
    // 4 Supabase-path sites + the localStorage fallback = 5 deduped emits.
    expect((s.match(/dedupKey: `new_client:\$\{/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(s).toContain("dedupKey: `new_client:${id}`");
    expect(s).not.toMatch(/"new_client",[\s\S]{0,200}"coach",/); // no site keeps the generic link
  });

  it("new_ticket opens the ticket's thread (/coach/support?ticket=<id>) in BOTH emit paths", () => {
    expect(src("lib/data/tickets.ts")).toContain("`/coach/support?ticket=${ticket.id}`");
    expect(src("app/api/support/tickets/route.ts")).toContain("link: `/coach/support?ticket=${ticket.id}`");
  });

  it("PlansView auto-opens the ?plan= the bell navigates to", () => {
    expect(src("components/views/PlansView.tsx")).toContain('new URLSearchParams(window.location.search).get("plan")');
  });

  it("CoachSupportView auto-opens the ?ticket= the bell navigates to", () => {
    expect(src("components/views/CoachSupportView.tsx")).toContain('new URLSearchParams(window.location.search).get("ticket")');
  });

  it("the client bell keeps the open-redirect validator on every navigation", () => {
    const s = src("components/NotificationBell.tsx");
    expect(s).toContain("safeNext(link)");
    // Query-carrying links (/plans?plan=…) must ride router.push, not the
    // exact-match navigate() branch — the generic branch is pinned:
    expect(s).toContain("router.push(safeLink)");
  });
});

describe("item 1 — dedup guards at every emit", () => {
  it("the member-bell dedup helper exists with the fail-open law", () => {
    const s = src("lib/data/notifications.ts");
    expect(s).toContain("export async function createNotificationDeduped");
    expect(s).toContain("// fail-open: never lose the event over the guard itself");
  });

  it("POST /api/notifications/admin checks the dedupKey BEFORE inserting (staff bell)", () => {
    const s = src("app/api/notifications/admin/route.ts");
    expect(s).toContain(".contains(\"payload\", { dedupKey: eventKey })");
    expect(s).toContain("{ ok: true, deduped: true");
  });

  it("subscription approve/reject are deduped on the request id", () => {
    const s = src("lib/data/subscriptions.ts");
    expect(s).toContain('"subscription_approved"');
    expect(s).toContain('"subscription_rejected"');
    expect((s.match(/\{ key: "request_id", value: /g) ?? []).length).toBe(2);
  });

  it("support replies dedup identical bodies within 60s", () => {
    const s = src("app/api/support/tickets/route.ts");
    expect(s).toContain('.eq("type", "support_reply")');
    expect(s).toContain('.eq("body", text.slice(0, 200))');
  });

  it("the PayPal wallet top-up notify is deduped on the order id (parallel-race loser)", () => {
    const s = src("app/api/paypal/capture-order/route.ts");
    expect(s).toContain('.contains("payload", { order_id: orderId })');
    expect(s).toContain("order_id: orderId");
  });
});

describe("item 2 — survey-notification eligibility (إشعارات الاستبيانات لغير المشتركين)", () => {
  it("the broadcast route gates SURVEY links on (assigned OR active subscription)", () => {
    const s = src("app/api/notifications/broadcast/route.ts");
    expect(s).toContain("const isSurveyLink =");
    expect(s).toContain("coach_assignments");
    expect(s).toContain('.eq("status", "active")');
    expect(s).toContain("resolveEligibleClientIds");
  });

  it("the gate reports skipped ineligible recipients honestly", () => {
    const s = src("app/api/notifications/broadcast/route.ts");
    expect(s).toContain("skipped_ineligible");
  });

  it("non-survey broadcasts keep the legacy reach (no over-blocking renewal reminders)", () => {
    const s = src("app/api/notifications/broadcast/route.ts");
    // The gate only runs inside isSurveyLink branches:
    expect(s.match(/if \(isSurveyLink\(link\)\)/g)?.length).toBeGreaterThanOrEqual(3);
  });
});

describe("item 4 — diet-type selection rides end-to-end", () => {
  it("the coach UI renders the diet chips BEFORE generating + passes the pick into overrides", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).toContain('useState<"auto" | DietType>("auto")');
    expect(s).toContain("if (dietType !== \"auto\") ov.dietType = dietType;");
    expect(s).toContain('role="radiogroup"');
    expect(s).toContain('qDietText');
  });

  it("the diet contract lives in the zero-dependency leaf (bundle law)", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).toContain('from "@/lib/diet-types"');
    // plan-generator runtime values must NOT reach the client bundle:
    expect(s).not.toContain('from "@/lib/plan-generator";\nimport { DIET_TYPES');
  });

  it("sanitizeJobPayload whitelists dietType (hostile values degrade to undefined)", () => {
    const s = src("lib/ai-jobs.ts");
    expect(s).toContain("dietType: (() => {");
    expect(s).toContain("(DIET_TYPES as readonly string[]).includes(d) ? d : undefined");
  });

  it("the AI processor forwards the diet override into generateNutritionPlanAI", () => {
    const s = src("lib/ai-job-processors.ts");
    expect(s).toContain("dietType: (DIET_TYPES as readonly string[]).includes(String(overrides.dietType))");
  });

  it("the prompt carries an explicit diet-compliance line", () => {
    const s = src("lib/plan-generator.ts");
    expect(s).toContain("النظام الغذائي المعتمد");
    expect(s).toContain("التزم به في اختيار الأصناف");
  });
});

describe("item 6 — the mobile modal fix (root cause, not font shrinking)", () => {
  it("the Modal body is a min-w-0 + overflow-x-auto scroll region (grid min-width:auto was the overflow)", () => {
    const s = src("components/ui/modal.tsx");
    expect(s).toContain('"min-w-0"');
    expect(s).toContain("overflow-x-auto overflow-y-auto");
  });

  it("every plan table scrolls inside its own card (wrapper + readable min width)", () => {
    expect(src("components/views/CoachClientView.tsx")).toContain('<div className="overflow-x-auto">');
    expect(src("components/views/PlansView.tsx")).toContain('<div className="overflow-x-auto">');
  });

  it("no plan table keeps a bare w-full without a wrapper (the overflow class returns)", () => {
    // After the wrap, no unwrapped <table className="w-full text-sm"> remains.
    expect(src("components/views/CoachClientView.tsx")).not.toContain('<table className="w-full text-sm">');
    expect(src("components/views/PlansView.tsx")).not.toContain('<table className="w-full text-sm">');
  });
});

describe("items 5+7 — the review banner + meals-consistency UI", () => {
  it("the coach viewer shows the needs_review banner with human-readable flag labels", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).toContain("content.needs_review");
    expect(s).toContain("REVIEW_FLAG_LABELS_AR");
    expect(s).toContain("الخطة تحتاج مراجعتك قبل الاعتماد");
  });

  it("the coach viewer shows the meals-sum vs daily-target consistency line", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).toContain("meals_total_calories");
    expect(s).toContain("اتساق الوجبات");
  });
});
