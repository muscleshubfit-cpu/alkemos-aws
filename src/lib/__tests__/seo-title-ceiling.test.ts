import { describe, it, expect } from "vitest";
import { EXERCISES } from "@/lib/exercises";
import { COMPARISONS } from "@/lib/comparisons";
import { MACRO_ACCURACY_GUIDE_META } from "@/lib/macro-accuracy-guide";

/**
 * SEO TITLE CEILING (comprehensive audit 2026-11-04).
 *
 * The site's measured healthy <title> range caps at 75 chars (audit
 * 2026-10-31 measured 23-75 across the sample). This canary pins the
 * three fixes that audit closed:
 *
 *   1. EXERCISES (EN): the always-on "| Alkemos" suffix pushed 53 of
 *      868 long names past the ceiling (worst 97). The page template
 *      now drops the suffix when the composed title would exceed 75 —
 *      this test recomputes BOTH branches for every exercise so the
 *      template law itself is pinned (worst-case ≤75, suffix kept for
 *      short names).
 *   2. COMPARISONS: every titleEn/titleAr ≤75 (the Freeletics pair was
 *      78/84 before the audit fix).
 *   3. GUIDES: the macro-accuracy pillar titleEn ≤75 (was 80).
 *
 * AR exercise titles intentionally stay unpinned here: 12 long Arabic
 * names reach 91 chars worst-case with no droppable suffix — documented
 * as accepted (cosmetic SERP truncation only) in the audit report.
 */

const CEILING = 75;
const SUFFIX = " | Alkemos";

/** Mirrors the (en)/exercises/[slug]/page.tsx template exactly (three tiers). */
function exerciseTitleEn(nameEn: string): string {
  const base = `${nameEn} — Proper Form & Instructions`;
  if (base.length + SUFFIX.length <= CEILING) return `${base}${SUFFIX}`;
  if (base.length <= CEILING) return base;
  return `${nameEn} — Form Guide`;
}

describe("SEO title ceiling (comprehensive audit 2026-11-04)", () => {
  it("every EN exercise title fits the 75-char ceiling (all three template tiers)", () => {
    const over = EXERCISES.filter((e) => exerciseTitleEn(e.nameEn).length > CEILING);
    expect(
    over.map((e) => `${e.slug}: ${exerciseTitleEn(e.nameEn).length}`),
    ).toEqual([]);
  });

  it("short names KEEP the brand suffix (the convention is conditional, not dropped)", () => {
    const withSuffix = EXERCISES.filter((e) => exerciseTitleEn(e.nameEn).endsWith(SUFFIX));
    expect(withSuffix.length).toBeGreaterThan(700); // 815 of 868 before the fix
    const without = EXERCISES.filter((e) => !exerciseTitleEn(e.nameEn).endsWith(SUFFIX));
    expect(without.length).toBeGreaterThan(30); // the 53 long names that triggered the fix
    expect(without.length).toBeLessThan(100); // sanity: the long-name tail stays a minority
  });

  it("every comparison title (EN + AR) fits the 75-char ceiling", () => {
    // EN titles render verbatim; AR titles render through the /ar layout
    // template `%s — Alkemos` which APPENDS 10 chars — so the AR input
    // string must stay ≤65 for the rendered <title> to fit 75.
    const AR_TEMPLATE_SUFFIX = 10;
    const over: string[] = [];
    for (const c of COMPARISONS) {
      if (c.titleEn.length > CEILING) over.push(`en/${c.slug}: ${c.titleEn.length}`);
      if (c.titleAr.length + AR_TEMPLATE_SUFFIX > CEILING)
        over.push(`ar/${c.slug} rendered: ${c.titleAr.length + AR_TEMPLATE_SUFFIX}`);
    }
    expect(over).toEqual([]);
  });

  it("the macro-accuracy guide title fits the ceiling (EN was 80; AR renders +10 via the /ar template)", () => {
    const AR_TEMPLATE_SUFFIX = 10;
    expect(MACRO_ACCURACY_GUIDE_META.titleEn.length).toBeLessThanOrEqual(CEILING);
    expect(
      MACRO_ACCURACY_GUIDE_META.titleAr.length + AR_TEMPLATE_SUFFIX,
    ).toBeLessThanOrEqual(CEILING);
  });

  it("no title is uselessly short (floor 20 — audit-measured healthy range 23-75)", () => {
    for (const c of COMPARISONS) {
      expect(c.titleEn.length, `en/${c.slug}`).toBeGreaterThanOrEqual(20);
      expect(c.titleAr.length, `ar/${c.slug}`).toBeGreaterThanOrEqual(20);
    }
    expect(MACRO_ACCURACY_GUIDE_META.titleEn.length).toBeGreaterThanOrEqual(20);
  });
});
