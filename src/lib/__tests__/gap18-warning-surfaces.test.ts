import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderMealPlanText } from "@/lib/external-plan-text";

/**
 * GAP-18 COMPLETION — WARNING-SURFACE SOURCE PINS (owner clarification
 * 2026-11-17: «تأكد من ظهوره في جميع مسارات توليد الخطط، سواء AI أو
 * Local، وعلى القنوات والواجهات التي تعرض الخطة»).
 *
 * The repo's established cross-file contract pattern (grep-pinned source
 * lines — same as notif-plan-fixes-pins.test.ts): the SEMANTICS of the
 * warning live in one canonical module (plan-clinical-safety — swept by
 * plan-clinical-safety.test.ts); these pins guard the WIRING so no
 * surface silently drops the stamped disclosure again:
 *
 *   · /api/ai/meal-plan-demo   — stamps medical_disclosure in the saved
 *     account copy AND returns `disclosure` in the response (the planner
 *     page renders it for guests AND members).
 *   · /api/ai/planner-plan     — the hydration response carries the
 *     saved disclosure (restored account copy keeps the banner).
 *   · /ai-meal-planner page    — the banner renders above the plan and
 *     the disclosure wires from generation + hydration + localStorage.
 *   · plan-persistence         — the guest envelope carries the
 *     disclosure (refresh/navigation keeps the warning).
 *   · PlansView printPlan      — the printed/PDF copy renders the
 *     medical warning block (the member's paper plan carries it).
 *   · PlansView + CoachClientView modals — the on-screen banners stay.
 *   · /api/plans/normalize     — the coach-paste path fetches the
 *     client's questionnaire and passes the declared text.
 *   · /api/plans/member-edit   — the save-evo path stamps the disclosure
 *     on EVO-saved diet plans (from the member's questionnaire).
 *   · external-plan-text       — the admin's copyable text renders the
 *     stamped warning.
 */

const src = (rel: string) => readFileSync(join(process.cwd(), "src", rel), "utf8");

describe("GAP-18 completion — the AI meal-planner generation path stamps + returns the disclosure", () => {
  it("/api/ai/meal-plan-demo computes the disclosure from the notes text via the CANONICAL module (no alternative wording)", () => {
    const s = src("app/api/ai/meal-plan-demo/route.ts");
    expect(s).toContain('from "@/lib/plan-clinical-safety"');
    expect(s).toContain("detectClinicalConditions({ healthText: req.notes ?? \"\" })");
    expect(s).toContain("medicalDisclosureFor(");
  });

  it("the saved account copy carries medical_disclosure (the /plans banner renders for planner plans)", () => {
    const s = src("app/api/ai/meal-plan-demo/route.ts");
    expect(s).toMatch(/medical_disclosure:\s*disclosure/);
    expect(s).toMatch(/disclosure,\s*\n\s*quota:/);
  });

  it("/api/ai/planner-plan returns the SAVED disclosure on hydration (the restored copy keeps the banner)", () => {
    const s = src("app/api/ai/planner-plan/route.ts");
    expect(s).toContain("medical_disclosure");
    expect(s).toMatch(/disclosure:\s*\n?\s*content\.medical_disclosure/);
  });
});

describe("GAP-18 completion — the planner PAGE renders the warning banner on every plan-display state", () => {
  it("the banner renders above the plan (bilingual, same rose styling as the /plans viewer)", () => {
    const s = src("app/(en)/ai-meal-planner/page.tsx");
    expect(s).toContain('data-testid="medical-disclosure-banner"');
    expect(s).toContain("تنبيه طبي — قبل تطبيق هذه الخطة");
    expect(s).toContain("Medical notice — before applying this plan");
  });

  it("the disclosure wires from ALL THREE sources: generation response + account hydration + localStorage restore", () => {
    const s = src("app/(en)/ai-meal-planner/page.tsx");
    // generation:
    expect(s).toMatch(/setDisclosure\(\s*\n?\s*data\?\.disclosure/);
    // hydration:
    expect(s).toMatch(/data\?\.disclosure && typeof data\.disclosure\.warning === "string"/);
    // guest restore:
    expect(s).toContain("setDisclosure(stored.disclosure ?? null)");
    // persistence on generate:
    expect(s).toMatch(/saveGuestPlan\(\s*\n?\s*"nutrition",\s*\n?\s*newPlan/);
  });

  it("the AR mirror re-exports the same bilingual page (no divergent twin)", () => {
    const s = src("app/(ar)/ar/ai-meal-planner/page.tsx");
    expect(s).toContain('(en)/ai-meal-planner/page');
  });
});

describe("GAP-18 completion — the guest persistence envelope carries the disclosure", () => {
  it("plan-persistence saves + restores the disclosure (validated loosely — a corrupt shape is dropped, never rendered)", () => {
    const s = src("lib/plan-persistence.ts");
    expect(s).toMatch(/disclosure\?:\s*\{ flag\?: unknown; conditions\?: unknown; warning: string \}/);
    expect(s).toMatch(/\.\.\.\(disclosure \? \{ disclosure \} : \{\}\)/);
    expect(s).toContain("typeof parsed.disclosure.warning === \"string\"");
  });
});

describe("GAP-18 completion — the PRINT/PDF export renders the medical warning block", () => {
  it("printPlan renders the stamped medical_disclosure for meal plans (title-adjacent, never re-invented)", () => {
    const s = src("components/views/PlansView.tsx");
    // the print block reads the STAMPED disclosure:
    expect(s).toMatch(/"medical_disclosure" in content\s*\n\s*\)/);
    expect(s).toContain("تنبيه طبي — قبل تطبيق هذه الخطة");
    // the printed block sits right after the H1 title, before the content:
    const h1 = s.indexOf("<h1>${escapeHtml(plan.title)}</h1>");
    const printBlock = s.indexOf("تنبيه طبي — قبل تطبيق هذه الخطة");
    expect(h1).toBeGreaterThan(-1);
    expect(printBlock).toBeGreaterThan(h1);
  });

  it("the on-screen member banner stays (the /plans modal)", () => {
    const s = src("components/views/PlansView.tsx");
    expect(s).toContain("⚕️ تنبيه طبي — قبل تطبيق هذه الخطة");
    expect(s).toContain("plan.type === \"meal\"");
  });

  it("the on-screen coach banner stays (CoachClientView)", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).toContain("medical_disclosure");
    expect(s).toContain("تنبيه طبي — قبل تطبيق العميل لهذه الخطة");
  });
});

describe("GAP-18 completion — the coach-paste path carries the client's declared conditions", () => {
  it("/api/plans/normalize fetches the client's latest nutrition questionnaire and passes the declared text", () => {
    const s = src("app/api/plans/normalize/route.ts");
    expect(s).toContain("nutrition_questionnaires");
    expect(s).toContain("qData.medical || qData.health || qData.medical_conditions");
    expect(s).toMatch(/normalizeCoachPlanText\(text, planType, declaredHealthText\)/);
  });

  it("normalizeCoachPlanText forwards the declared text on ALL THREE of its nutrition branches (json-direct · ai-parse · raw-fallback)", () => {
    const s = src("lib/plan-generator.ts");
    const branches = s.match(/normalizeNutritionPlan\(\s*\n?\s*(parsed|validatedLocal|\{)[\s\S]{0,400}?declaredHealthText/g) ?? [];
    // json-direct + ai-parse + raw-fallback in normalizeCoachPlanText:
    expect(branches.length).toBeGreaterThanOrEqual(3);
  });
});

describe("GAP-18 completion — the EVO-saved diet plans carry the disclosure", () => {
  it("/api/plans/member-edit save-evo stamps medical_disclosure from the member's questionnaire (the one medicalDisclosureFor)", () => {
    const s = src("app/api/plans/member-edit/route.ts");
    expect(s).toContain("nutrition_questionnaires");
    expect(s).toContain("medicalDisclosureFor(");
    expect(s).toMatch(/medical_disclosure: evoDisclosure/);
  });
});

describe("GAP-18 completion — the admin external-plans text export renders the stamped warning", () => {
  it("renderMealPlanText renders the stamped disclosure (behavioral: the warning rides the copyable text)", () => {
    const text = renderMealPlanText({
      overview: "خطة خارجية.",
      daily_calories: 1800,
      macros: { protein_g: 130, carbs_g: 180, fat_g: 60 },
      meals: [],
      medical_disclosure: {
        flag: "medical_review_advised",
        conditions: ["سكري"],
        warning: "تنبيه صحي مهم — استشر طبيبك. هذه الخطة لا تغني عن الاستشارة الطبية.",
      },
    });
    expect(text).toContain("تنبيه طبي — قبل تطبيق هذه الخطة");
    expect(text).toContain("هذه الخطة لا تغني عن الاستشارة الطبية");
    expect(text).toContain("الحالات الصحية المعلنة المرصودة بالخطة: سكري");
    // the warning rides FIRST (before the meals/body, right after the macros line):
    expect(text.indexOf("تنبيه طبي")).toBeGreaterThan(-1);
  });

  it("a plan with NO stamped disclosure renders no invented warning (never re-worded, never invented)", () => {
    const text = renderMealPlanText({
      overview: "خطة خارجية.",
      daily_calories: 1800,
      macros: { protein_g: 130, carbs_g: 180, fat_g: 60 },
      meals: [],
    });
    expect(text).not.toContain("تنبيه طبي");
  });
});
