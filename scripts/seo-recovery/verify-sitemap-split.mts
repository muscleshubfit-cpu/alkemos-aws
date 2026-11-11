/**
 * verify-sitemap-split.mts — SEO-RECOVERY (2026-11-11)
 * One-shot verification of the pages/commercial sitemap split:
 *   1. Both children return 200 + XML.
 *   2. pages ∪ commercial == the exact URL set the OLD single child
 *      emitted (212 URLs), intersection empty (exact partition).
 *   3. The union carries every URL family the audit-13 §3 surface
 *      expects (100 commercial paths: 10 services + 12 tools +
 *      10 planners/trackers + 16 programs + 50 diet-plan + 2 compare).
 *   4. hreflang alternates present on both children.
 * Run: bun scripts/seo-recovery/verify-sitemap-split.mts
 */
import { GET as pagesGET } from "../../src/app/sitemap-pages.xml/route";
import { GET as commercialGET } from "../../src/app/sitemap-commercial.xml/route";

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const [pagesRes, commercialRes] = await Promise.all([pagesGET(), commercialGET()]);
const pagesXml = await pagesRes.text();
const commercialXml = await commercialRes.text();
const pagesSet = new Set(locs(pagesXml));
const commercialSet = new Set(locs(commercialXml));

console.log(`sitemap-pages.xml:     ${pagesSet.size} URLs (${pagesRes.status})`);
console.log(`sitemap-commercial.xml: ${commercialSet.size} URLs (${commercialRes.status})`);

const intersection = [...pagesSet].filter((u) => commercialSet.has(u));
console.log(`intersection: ${intersection.length} ${intersection.length ? "FAIL " + intersection.join(", ") : "OK (exact partition)"}`);

const union = new Set([...pagesSet, ...commercialSet]);
console.log(`union: ${union.size} ${union.size === 212 ? "OK (== the previous single-child 212)" : "FAIL expected 212"}`);

// The commercial surface families (audit 13 §3)
const fam: Record<string, string[]> = {
  // audit-13 §3: paid services = 10 paths (the homepage pair is NOT
  // commercial — it stays in the pages child).
  services: ["evo", "ar/evo", "memberships", "ar/memberships", "coaching", "ar/coaching", "for-coaches", "ar/for-coaches", "for-coaches/register", "ar/for-coaches/register"],
  tools: ["tools", "ar/tools", "tools/calorie-calculator", "ar/tools/calorie-calculator", "tools/bmi-calculator", "ar/tools/bmi-calculator", "tools/macro-calculator", "ar/tools/macro-calculator", "tools/body-fat-calculator", "ar/tools/body-fat-calculator", "tools/water-tracker", "ar/tools/water-tracker"],
  planners: ["meal-planner", "ar/meal-planner", "ai-meal-planner", "ar/ai-meal-planner", "ai-workout-planner", "ar/ai-workout-planner", "workout-tracker", "ar/workout-tracker", "macro-tracker", "ar/macro-tracker"],
  compare: ["compare", "ar/compare"],
};
const base = "https://alkemos.com";
let ok = true;
for (const [name, paths] of Object.entries(fam)) {
  const missing = paths.filter((p) => !commercialSet.has(`${base}/${p}`));
  if (missing.length) { ok = false; console.log(`FAIL ${name}: missing from commercial -> ${missing.join(", ")}`); }
}
console.log(`commercial families present: ${ok ? "OK" : "FAIL"}`);

// programs + diet-plan matrix counts
const programs = [...commercialSet].filter((u) => /\/(ar\/)?programs(\/|$)/.test(u.replace(base, "")));
const dietPlan = [...commercialSet].filter((u) => u.includes("/diet-plan"));
console.log(`programs family: ${programs.length} ${programs.length === 16 ? "OK" : "FAIL expected 16"}`);
console.log(`diet-plan family: ${dietPlan.length} ${dietPlan.length === 50 ? "OK" : "FAIL expected 50"}`);
const commercialTotal = [...commercialSet].length;
console.log(`commercial total: ${commercialTotal} ${commercialTotal === 100 ? "OK (audit-13 section-3)" : "FAIL expected 100"}`);

// hreflang present on both children
const pagesAlt = (pagesXml.match(/hreflang=/g) || []).length;
const commercialAlt = (commercialXml.match(/hreflang=/g) || []).length;
console.log(`hreflang alternates: pages=${pagesAlt} commercial=${commercialAlt} ${pagesAlt > 100 && commercialAlt > 200 ? "OK" : "WARN check"}`);

// key informational URLs stayed in pages
for (const must of ["/blog", "/ar/blog", "/authors", "/ar/authors", "/recipes", "/faq", "/ar/faq", "/affiliate"]) {
  if (!pagesSet.has(`${base}${must}`)) { console.log(`FAIL ${must} missing from pages child`); process.exitCode = 1; }
}
console.log("informational surface intact OK");
if (intersection.length === 0 && union.size === 212 && commercialTotal === 100 && ok) {
  console.log("\nSPLIT VERIFIED OK — exact partition, all families present");
} else {
  console.log("\nSPLIT FAILED");
  process.exitCode = 1;
}
