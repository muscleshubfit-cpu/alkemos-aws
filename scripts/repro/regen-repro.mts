/**
 * scripts/repro/regen-repro.mts — REGEN-ROOTCAUSE-2 reproduction instrument.
 *
 * Replays the EXACT production ai_jobs payloads (fetched READ-ONLY by the
 * committed companion scripts/repro/fetch-ai-job-fixtures.py, kept LOCAL
 * under scripts/repro/repro-fixtures/ — git-ignored: real client data,
 * never committed) through the REAL engine with ZERO provider keys
 * configured → the chain fails fast → the LOCAL FALLBACK path (the one
 * serving production when providers fail — the measured free-tier norm)
 * is exercised verbatim.
 *
 * Prints per-job: source, meal-by-meal items + kcal, keto carb sums,
 * dairy-law violations, weird portions, and the independent audit
 * findings. Exit 1 iff any replayed job cannot deliver a gate-passing
 * plan (the honest "regeneration fails" reproduction).
 *
 * THE PINNED INCIDENT (2026-10-25, pre-fix): ai_jobs#15ebfcd6 replays threw
 * «meals sum 3907/3831/3982 kcal drifted beyond ±25% of the 3035 target»
 * on ~2 of 3 draws — the ranked-matcher fix (plan-food-grounding.ts)
 * makes every draw land.
 *
 * Usage: NODE_OPTIONS="--conditions=react-server" npx tsx scripts/repro/regen-repro.mts
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { generateNutritionPlanAI, regenerateMeal } from "../../src/lib/plan-generator";
import { auditNutritionPlan } from "../../src/lib/plan-audit";
import type { ClientContext } from "../../src/lib/ai-local";

/** Mirrors the runner's private pickClientContext verbatim. */
function pickClientContext(raw: unknown): ClientContext {
  const cc = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    name: typeof cc.name === "string" ? cc.name : "",
    nutrition: cc.nutrition || {},
    fitness: cc.fitness || {},
    recent_measurements: Array.isArray(cc.recent_measurements)
      ? (cc.recent_measurements as ClientContext["recent_measurements"])
      : [],
    recent_plan_names: Array.isArray(cc.recent_plan_names)
      ? (cc.recent_plan_names as unknown[]).filter((n) => typeof n === "string")
      : [],
  };
}

const FIXTURES = join(import.meta.dirname, "..", "repro-fixtures");

if (!existsSync(FIXTURES)) {
  console.error(
    "[regen-repro] fixtures missing — fetch them first (READ-ONLY, needs SUPABASE_SERVICE_ROLE_KEY in env):\n" +
      "  python3 scripts/repro/fetch-ai-job-fixtures.py\n" +
      "The fixtures carry REAL client payloads and are git-ignored — never commit them.",
  );
  process.exit(1);
}

type Fixture = {
  job_type: string;
  payload: Record<string, unknown>;
  db_result: Record<string, unknown> | null;
};

const KETO_BANNED_TOKENS = ["حليب", "رايب", "زبادي عادي", "زبادي طبيعي"];
const KETO_GREEK_OK = "زبادي يوناني";

function kcalOf(items: Array<Record<string, unknown>>): number {
  return items.reduce((s, i) => s + (Number(i.calories) || 0), 0);
}

function carbsOf(items: Array<Record<string, unknown>>): number {
  return Math.round(items.reduce((s, i) => s + (Number(i.carbs_g) || 0), 0) * 10) / 10;
}

function reportPlan(label: string, content: Record<string, unknown>, dietType: string | undefined) {
  const meals = (content.meals as Array<Record<string, unknown>>) || [];
  const daily = Number(content.daily_calories) || 0;
  const total = meals.reduce((s, m) => s + kcalOf((m.items as Array<Record<string, unknown>>) || []), 0);
  console.log(`\n── ${label} ──`);
  console.log(`   diet=${dietType} daily_calories=${daily} recomputed_total=${total} drift=${daily ? Math.round(((total - daily) / daily) * 100) : "?"}%`);
  const issues: string[] = [];
  let dayCarbs = 0;
  for (const m of meals) {
    const items = (m.items as Array<Record<string, unknown>>) || [];
    const mc = carbsOf(items);
    dayCarbs += mc;
    console.log(`   [${m.name}] ${kcalOf(items)} kcal · carbs ${mc}g`);
    for (const it of items) {
      const food = String(it.food || "");
      const amount = String(it.amount || "");
      const grams = parseFloat(amount) || 0;
      const flags: string[] = [];
      if (dietType === "keto") {
        for (const tok of KETO_BANNED_TOKENS) {
          if (food.includes(tok) && !food.includes(KETO_GREEK_OK)) flags.push(`KETO-DAIRY(${tok})`);
        }
      }
      if (food.includes("توفو")) flags.push("TOFU");
      if (grams > 500) flags.push(`HUGE-PORTION(${grams}g)`);
      if (grams > 0 && grams < 15) flags.push(`TINY-PORTION(${grams}g)`);
      console.log(`      ${food} | ${amount} | ${it.calories} kcal${flags.length ? "  ⚠ " + flags.join(",") : ""}`);
      if (flags.length) issues.push(`${m.name}/${food}: ${flags.join(",")}`);
    }
  }
  if (dietType === "keto") console.log(`   DAY CARBS: ${Math.round(dayCarbs * 10) / 10}g`);
  return issues;
}

async function replayPlan(name: string) {
  const fx: Fixture = JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), "utf-8"));
  const payload = fx.payload;
  const ctx = pickClientContext(payload.clientContext) as ClientContext;
  const overrides = (payload.overrides ?? {}) as Record<string, unknown>;
  console.log(`\n═══ REPLAY plan ${name} (${fx.job_type}) ═══`);
  const res = await generateNutritionPlanAI(ctx, {
    targetCalories: overrides.targetCalories as number | undefined,
    macros: overrides.macros as { protein_g: number; carbs_g: number; fat_g: number } | undefined,
    foods: overrides.foods as string[] | undefined,
    mealsCount: overrides.mealsCount as number | undefined,
    notes: overrides.notes as string | undefined,
    dietType: overrides.dietType as string | undefined,
  });
  console.log(`source: ${res.source}`);
  const content = res.content as unknown as Record<string, unknown>;
  const da = (content.data_analysis as Record<string, unknown> | undefined) ?? {};
  const dietRaw = String(da.diet_type ?? overrides.dietType ?? "?");
  const isKeto = dietRaw.includes("كيتو") || dietRaw === "keto";
  const issues = reportPlan(`${name} → ${dietRaw}`, content, isKeto ? "keto" : undefined);
  const audit = auditNutritionPlan(content, { dietType: (isKeto ? "keto" : dietRaw) as never });
  console.log(`   audit: recomputed=${audit.recomputed} targetDrift=${audit.targetDriftPct}% macroDrift=${audit.macroDriftPct}% critical=${audit.findings.filter((f) => f.severity === "critical").length}`);
  for (const f of audit.findings.slice(0, 6)) console.log(`     · [${f.severity}] ${f.message}`);
  if (issues.length) console.log(`   ⚠ ISSUES: ${issues.join(" | ")}`);
  return { name, source: res.source, issues, auditCritical: audit.findings.filter((f) => f.severity === "critical").length };
}

async function replayMeal(name: string) {
  const fx: Fixture = JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), "utf-8"));
  const payload = fx.payload;
  console.log(`\n═══ REPLAY meal ${name} (dietType=${payload.dietType}) ═══`);
  const res = await regenerateMeal(
    payload.meal as Record<string, unknown>,
    payload.targetCalories as number | undefined,
    pickClientContext(payload.clientContext),
    (payload.reason as string) || "",
    (payload.avoid_names as string[]) || [],
    undefined,
    payload.dietType as string | undefined,
  );
  const r = res as unknown as Record<string, unknown>;
  const meal = r.meal as Record<string, unknown> | undefined;
  const items = (meal?.items as Array<Record<string, unknown>>) || [];
  console.log(`source: ${r.source} · meal=${meal?.name} · ${kcalOf(items)} kcal · carbs ${carbsOf(items)}g`);
  for (const it of items) console.log(`   ${it.food} | ${it.amount} | ${it.calories} kcal`);
  return { name, source: String(r.source) };
}

async function main() {
  const planResults: Array<{ name: string; source: string; issues: string[]; auditCritical: number }> = [];
  const mealResults: Array<{ name: string; source: string }> = [];
  for (const name of ["a8201f6c", "15ebfcd6"]) {
    try {
      planResults.push(await replayPlan(name));
    } catch (e) {
      console.log(`\n═══ REPLAY plan ${name} — THREW (regeneration fails) ═══`);
      console.log(String((e as Error).message).slice(0, 400));
      planResults.push({ name, source: "THREW", issues: [String((e as Error).message).slice(0, 120)], auditCritical: 1 });
    }
  }
  for (const name of ["a26cf95e", "83a1966e"]) {
    try {
      mealResults.push(await replayMeal(name));
    } catch (e) {
      console.log(`\n═══ REPLAY meal ${name} — THREW ═══`);
      console.log(String((e as Error).message).slice(0, 400));
      mealResults.push({ name, source: "THREW" });
    }
  }

  console.log("\n══════════ SUMMARY ══════════");
  for (const p of planResults) console.log(`plan ${p.name}: source=${p.source} issues=${p.issues.length} critical=${p.auditCritical}`);
  for (const m of mealResults) console.log(`meal ${m.name}: source=${m.source}`);
  const threw = planResults.filter((p) => p.source === "THREW").length;
  if (threw > 0) {
    console.log(`\n❌ REPRO: ${threw} plan job(s) cannot deliver a plan — regeneration FAILS`);
    process.exit(1);
  }
  console.log("\n✅ all replays delivered a plan");
}

main().catch((e) => {
  console.error("repro crashed:", e);
  process.exit(1);
});
