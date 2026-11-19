/**
 * TOOLS-HUB-ITEMLIST — the hub's parent ItemList schema (single source).
 *
 * ORGANIC-GROWTH-P0-F (owner order 2026-11-19, roadmap
 * docs/organic-growth-system-2026-11-18/10 P0-F field 4): the tools hub —
 * the parent surface of the cluster that holds 75% of the site's measured
 * impression footprint — carried NO parent schema at all. This module
 * builds the ItemList for both language trees from the SAME single source
 * the hub grid renders (TOOLS in tools-shared.ts — the Phase 195 law), so
 * the schema can never drift from the page:
 *
 *   - EN tree: name = nameEn, url = /tools/<slug> (or the root-absolute
 *     slugs /meal-planner · /ai-meal-planner · /ai-workout-planner),
 *   - AR tree: name = nameAr, url = /ar-prefixed mirror of the same
 *     destination (the SEO-GEO-4 mirror law — the exact href mapping the
 *     hub's ToolCard computes for its links).
 *
 * Same client-safe pattern as tools-shared.ts /
 * tools-hub-starting-paths.ts: pure data derivation, zero side effects.
 * Serialized through getItemListSchema (src/lib/seo.ts — the existing
 * ItemList precedent used by workout-tracker/macro-tracker layouts).
 */

import { TOOLS } from "@/lib/tools-shared";
import { getItemListSchema } from "@/lib/seo";

export function getToolsHubItemList(lang: "en" | "ar") {
  const isAr = lang === "ar";
  // The EXACT href mapping the hub page's ToolCard computes (src/app/(en)/
  // tools/page.tsx): root-absolute slugs (/meal-planner, /ai-meal-planner,
  // /ai-workout-planner) pass through (AR prefixes /ar), tool slugs nest
  // under /tools (AR under /ar/tools) — the SEO-GEO-4 mirror law.
  const toolHref = (slug: string): string =>
    slug.startsWith("/")
      ? isAr
        ? `/ar${slug}`
        : slug
      : isAr
        ? `/ar/tools/${slug}`
        : `/tools/${slug}`;

  return getItemListSchema({
    name: isAr
      ? "أدوات Alkemos المجانية للياقة والتغذية"
      : "Alkemos free fitness & nutrition tools",
    description: isAr
      ? "كل الأدوات المجانية على Alkemos: حاسبات السعرات ومؤشر كتلة الجسم والماكروز ونسبة الدهون، ومتتبع الماء، ومخطط الوجبات، ومخططا الوجبات والتمارين بالذكاء الاصطناعي."
      : "Every free tool on Alkemos: the calorie, BMI, macro, and body-fat calculators, the water tracker, the manual meal planner, and the AI meal & workout planners.",
    items: TOOLS.map((tool) => ({
      name: isAr ? tool.nameAr : tool.nameEn,
      url: toolHref(tool.slug),
    })),
  });
}
