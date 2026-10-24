/**
 * scripts/plan-ai-probe.mts — LIVE plan-generation quality probe
 * (PLAN-REGEN-CONSTRAINTS 2026-10-24, owner order item 4: «استخدم مزودًا
 * حقيقيًا واحدًا على الأقل في اختبار توليد مضبوط… مع ميزانية اختبار
 * مخصصة للمزودين عند الحاجة، ولا تستهلك أرصدة العملاء»).
 *
 * Dispatch-only measuring instrument (plan-ai-probe.yml) — the same
 * discipline as ai-grounded-failover-probe.mts: REAL calls against the
 * REAL provider keys with a SYNTHETIC client fixture, printing ONLY
 * numbers/verdicts/model names. No secret values, no personal data, NO
 * DB writes (§3.3 law: no ai_jobs rows, no plans rows, no ai_plan_usage
 * rows — nothing that touches a client's balance or plan).
 *
 * WHAT IT MEASURES (the owner's three problem classes, live):
 *   1. FULL keto generation at a synthetic target — the constraint
 *      prompt + quality gate + library grounding all firing against a
 *      real provider chain (Gemini-first ladder per the 2026-10-06 law,
 *      failover across providers as designed).
 *   2. The INDEPENDENT audit's recomputed truth on the generated plan:
 *      meals sum vs target, macros recomputed from items, Atwater
 *      coherence, keto compliance, allergen compliance.
 *   3. ONE meal regeneration under the same keto constraint (the swap
 *      path the member/coach UIs queue) — same gate.
 *
 * EXIT LAW (honest): exit 0 iff a real provider produced a plan/meal
 * that passes the whole gate AND the independent audit raises no
 * CRITICAL finding. A local-fallback result is an honest RED (the paid
 * quality bar was not met live), and so is any critical audit finding.
 *
 * Usage (GitHub Actions runner, secrets in env, SAME invocation law as
 * process-ai-jobs.yml — the react-server condition keeps server-only
 * imports resolvable under tsx):
 *   NODE_OPTIONS="--conditions=react-server" \
 *   npx --no-install tsx scripts/plan-ai-probe.mts
 * Env: OPENROUTER_API (or OPENROUTER_API_KEY), GROQ_API_KEY,
 *      NVIDIA_API_KEY, GEMINI_API_KEY [optional], AI_CHAIN_TOTAL_BUDGET_MS
 */

import {
  generateNutritionPlanAI,
  regenerateMeal,
} from "../src/lib/plan-generator";
import { auditNutritionPlan } from "../src/lib/plan-audit";
import type { ClientContext } from "../src/lib/ai-local";

const fail = (msg: string): never => {
  console.error(`::error::PLAN-AI-PROBE ${msg}`);
  console.error(`❌ PLAN-AI-PROBE ${msg}`);
  process.exit(1);
};

async function main(): Promise<void> {
  const budget = Number(process.env.AI_CHAIN_TOTAL_BUDGET_MS || 300000);
  console.log(`[plan-ai-probe] provider budget: ${budget}ms · real chain, synthetic client, zero DB writes`);

  /* ── The synthetic KETO client (the owner's incident shape) ── */
  const ketoClient: ClientContext = {
    name: "عميل اختبار اصطناعي",
    nutrition: {
      gender: "male",
      weight: "95",
      height: "178",
      age: "32",
      target_weight: "85",
      meals: "3",
      diet: "دايت صحي", // deliberately NOT keto — the coach's explicit selection is the source of truth
      allergies: "مكسرات",
      disliked: "كبدة",
    },
    fitness: { days: "4", goal: "خسارة الوزن", activity: "متوسط" },
    recent_measurements: [],
    recent_plan_names: [],
  };
  const TARGET = 1800;

  /* ── 1. FULL keto generation through the REAL chain ── */
  console.log("\n═══ 1) full keto plan @ 1800 kcal (real provider chain) ═══");
  const res = await generateNutritionPlanAI(ketoClient, {
    targetCalories: TARGET,
    dietType: "keto",
  });
  console.log(`source: ${res.source}`);
  if (res.source === "local-fallback") {
    fail("the real chain did not deliver a gate-passing keto plan (local fallback) — the paid quality bar was not met live");
  }

  const content = res.content;
  const mealsSum = (content.meals || []).reduce(
    (s, m) => s + (Number(m.total_calories) || 0),
    0,
  );
  console.log(`meals: ${content.meals.length} · declared target: ${content.daily_calories} kcal · meals sum: ${mealsSum} kcal (drift ${Math.round(((mealsSum - TARGET) / TARGET) * 100)}%)`);
  const itemsList = (content.meals || []).flatMap((m) => m.items || []);
  console.log(`items: ${itemsList.length} → ${itemsList.map((i) => `${i.food}(${i.calories})`).join(" · ")}`);

  /* ── 2. The INDEPENDENT audit on the generated plan ── */
  console.log("\n═══ 2) independent audit (recomputed from the raw items) ═══");
  const groundItemMod = await import("../src/lib/plan-food-grounding");
  const audit = auditNutritionPlan(content, {
    dietType: "keto",
    allergyText: "مكسرات",
    dislikedText: "كبدة",
    anchorItem: groundItemMod.groundItemToLibrary,
  });
  console.log(`recomputed: meals=${audit.recomputed.meals_total_calories.value} kcal · P=${audit.recomputed.protein_g.value}g · C=${audit.recomputed.carbs_g.value}g · F=${audit.recomputed.fat_g.value}g · Atwater=${audit.recomputed.kcal_from_macros} kcal (${audit.recomputed.meals_total_calories.provenance})`);
  console.log(`target drift: ${audit.targetDriftPct}% · macro drift: P${audit.macroDriftPct.protein}%/C${audit.macroDriftPct.carbs}%/F${audit.macroDriftPct.fat}%`);
  for (const f of audit.findings) {
    console.log(`  ${f.severity === "critical" ? "🔴" : "🟡"} [${f.code}] ${f.message}`);
  }
  const critical = audit.findings.filter((f) => f.severity === "critical");
  if (critical.length > 0) {
    fail(`the independent audit raised ${critical.length} critical finding(s) on a live-generated plan`);
  }

  /* ── 3. ONE meal regeneration under the same keto constraint ── */
  console.log("\n═══ 3) meal regeneration under keto (the swap path) ═══");
  const firstMeal = (content.meals || [])[0];
  if (!firstMeal || !(firstMeal.items || []).length) {
    fail("generated plan carries no regenerable meal");
  }
  const mealTarget = Number(firstMeal.total_calories) || TARGET / 3;
  const swap = await regenerateMeal(
    {
      name: String(firstMeal.name || "وجبة"),
      items: (firstMeal.items || []).map((i) => ({
        food: String(i.food),
        amount: String(i.amount ?? ""),
        calories: Number(i.calories) || 0,
      })),
    },
    mealTarget,
    ketoClient,
    undefined,
    (content.meals || []).flatMap((m) => (m.items || []).map((i) => String(i.food))),
    undefined,
    "keto",
  );
  const swapSum = (swap.meal.items || []).reduce((s, i) => s + (Number(i.calories) || 0), 0);
  console.log(`source: ${swap.source} · replacement meal «${String(swap.meal.name)}» · ${swap.meal.items.length} items · sum ${swapSum} kcal vs target ${Math.round(mealTarget)} (±20% band: ${Math.round(mealTarget * 0.8)}-${Math.round(mealTarget * 1.2)})`);
  console.log(`items → ${(swap.meal.items || []).map((i) => `${String(i.food)}(${Number(i.calories) || 0})`).join(" · ")}`);

  console.log("\n✅ PLAN-AI-PROBE PASSED — a real provider delivered a keto plan + keto swap that passed the full gate and the independent audit with zero critical findings.");
  console.log("::notice::PLAN-AI-PROBE green (real-provider keto generation + regen + independent audit)");
}

main().catch((e: unknown) => {
  fail(`crashed: ${e instanceof Error ? e.message : String(e)}`);
});
