import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * ORGANIC-GROWTH-P1-F — the trackers' <title> + in-scope canonical canary
 * (roadmap docs/organic-growth-system-2026-11-18/10 §P1-F, acceptance
 * field: «فحص آلي للأطوال والروابط» — enforced here exactly as the P0-D
 * title canary precedent).
 *
 * The defects (audit 01-current-state-audit §2, both live-verified
 * pre-execution on production 2026-11-20):
 *   1. The two EN tracker <title>s measured 64/63 rendered chars — over
 *      the ~60 SERP display budget (audit row «عنوانا المتتبعين EN
 *      65-66 حرفًا … فوق ميزانية ~60»).
 *   2. canonical was relative/absolute MIXED across the in-scope
 *      surfaces — six positions declared relative strings/templates
 *      (EN water-tracker + EN meal-planner + AR home + AR memberships +
 *      AR programs index + AR programs/[slug]) while every other
 *      in-scope surface declares absolute. Rendered identical via
 *      metadataBase (the audit's own «تجميلي» verdict) — the fix makes
 *      the SOURCE uniform so the convention is grep-able and no future
 *      surface regresses.
 *
 * The fix (P1-F, pinned verbatim):
 *   Macro:   "Macro Tracker — Set Targets & Track Totals | Alkemos" (52)
 *   Workout: "Workout Tracker — Plan Workouts & Track Progress | Alkemos" (58)
 *   Six canonical positions switched to the absolute site convention
 *   (each in its own file's style: literals where the file uses literals,
 *   `${SITE_URL}`/`url` where it uses those).
 *
 * Scope discipline (the P0-D precedent): og:title and twitter:title are
 * pinned to their PRE-P1F strings — social cards are not bound by the
 * SERP display budget; any drift there is a scope violation and fails
 * this canary. The AR twins are pinned verbatim (P1-F is EN-only).
 */

const EN_MACRO = "src/app/(en)/macro-tracker/layout.tsx";
const EN_WORKOUT = "src/app/(en)/workout-tracker/layout.tsx";
const AR_MACRO = "src/app/(ar)/ar/macro-tracker/layout.tsx";
const AR_WORKOUT = "src/app/(ar)/ar/workout-tracker/layout.tsx";

const MACRO_TITLE = "Macro Tracker — Set Targets & Track Totals | Alkemos";
const WORKOUT_TITLE =
  "Workout Tracker — Plan Workouts & Track Progress | Alkemos";

// Pre-P1F strings — the og/twitter scope pins (must survive verbatim).
const MACRO_OG_TWITTER =
  "Macro Tracker — Set Targets, Build Meals, Track Totals | Alkemos";
const WORKOUT_OG_TWITTER =
  "Workout Tracker — Plan Workouts & Track Progress Free | Alkemos";

// The AR twins (P1-F is EN-only — pinned to prove zero AR drift).
const AR_MACRO_TITLE = "متتبّع الماكروز — أهداف واضحة ومجاميع حيّة مجانًا";
const AR_WORKOUT_TITLE = "متتبّع التمارين — خطّط تدريبك وتابع تقدّمك مجانًا";

const CEILING = 60; // the P1-F roadmap law
const BRAND = "Alkemos";

// The six P1-F canonical positions (file → pinned declaration).
const CANONICAL_PINS: Array<[string, string]> = [
  [
    "src/app/(en)/tools/water-tracker/layout.tsx",
    'canonical: "https://alkemos.com/tools/water-tracker",',
  ],
  [
    "src/app/(en)/meal-planner/layout.tsx",
    'canonical: "https://alkemos.com/meal-planner",',
  ],
  [
    "src/app/(ar)/ar/(home)/page.tsx",
    "canonical: `${SITE_URL}/ar`,",
  ],
  [
    "src/app/(ar)/ar/memberships/page.tsx",
    "canonical: `${SITE_URL}/ar/memberships`,",
  ],
  [
    "src/app/(ar)/ar/programs/page.tsx",
    "canonical: `${SITE_URL}/ar/programs`,",
  ],
  // programs/[slug] canonicalizes to the page's own AR absolute `url`.
  [
    "src/app/(ar)/ar/programs/[slug]/page.tsx",
    "canonical: url,",
  ],
];

/**
 * The organic-growth system's in-scope surface inventory (audit 01 §1 —
 * home + tools hub + 5 tools + meal/AI planners + 2 trackers + diet-plan
 * library & cells + memberships + coaching + programs + for-coaches +
 * register + evo + affiliate + compare, ×2 languages). EVERY file must
 * declare its canonical ABSOLUTE — the P1-F unification law. A file added
 * to this inventory without updating this list fails the existsSync
 * guard; a relative canonical anywhere in it fails the sweep.
 */
const IN_SCOPE_SURFACES: string[] = [
  // EN
  "src/app/(en)/(home)/layout.tsx",
  "src/app/(en)/tools/layout.tsx",
  "src/app/(en)/tools/calorie-calculator/layout.tsx",
  "src/app/(en)/tools/bmi-calculator/layout.tsx",
  "src/app/(en)/tools/macro-calculator/layout.tsx",
  "src/app/(en)/tools/body-fat-calculator/layout.tsx",
  "src/app/(en)/tools/water-tracker/layout.tsx",
  "src/app/(en)/meal-planner/layout.tsx",
  "src/app/(en)/ai-meal-planner/layout.tsx",
  "src/app/(en)/ai-workout-planner/layout.tsx",
  "src/app/(en)/macro-tracker/layout.tsx",
  "src/app/(en)/workout-tracker/layout.tsx",
  "src/app/(en)/diet-plan/page.tsx",
  "src/app/(en)/diet-plan/[level]/[system]/page.tsx",
  "src/app/(en)/memberships/layout.tsx",
  "src/app/(en)/coaching/layout.tsx",
  "src/app/(en)/evo/layout.tsx",
  "src/app/(en)/for-coaches/layout.tsx",
  "src/app/(en)/for-coaches/register/layout.tsx",
  "src/app/(en)/affiliate/layout.tsx",
  "src/app/(en)/programs/layout.tsx",
  "src/app/(en)/programs/[slug]/page.tsx",
  "src/app/(en)/compare/page.tsx",
  "src/app/(en)/compare/[slug]/page.tsx",
  // AR mirrors
  "src/app/(ar)/ar/(home)/page.tsx",
  "src/app/(ar)/ar/tools/layout.tsx",
  "src/app/(ar)/ar/tools/calorie-calculator/layout.tsx",
  "src/app/(ar)/ar/tools/bmi-calculator/layout.tsx",
  "src/app/(ar)/ar/tools/macro-calculator/layout.tsx",
  "src/app/(ar)/ar/tools/body-fat-calculator/layout.tsx",
  "src/app/(ar)/ar/tools/water-tracker/layout.tsx",
  "src/app/(ar)/ar/meal-planner/layout.tsx",
  "src/app/(ar)/ar/ai-meal-planner/layout.tsx",
  "src/app/(ar)/ar/ai-workout-planner/layout.tsx",
  "src/app/(ar)/ar/macro-tracker/layout.tsx",
  "src/app/(ar)/ar/workout-tracker/layout.tsx",
  "src/app/(ar)/ar/diet-plan/page.tsx",
  "src/app/(ar)/ar/diet-plan/[level]/[system]/page.tsx",
  "src/app/(ar)/ar/memberships/page.tsx",
  "src/app/(ar)/ar/coaching/layout.tsx",
  "src/app/(ar)/ar/evo/layout.tsx",
  "src/app/(ar)/ar/for-coaches/layout.tsx",
  "src/app/(ar)/ar/for-coaches/register/layout.tsx",
  "src/app/(ar)/ar/affiliate/layout.tsx",
  "src/app/(ar)/ar/programs/page.tsx",
  "src/app/(ar)/ar/programs/[slug]/page.tsx",
  "src/app/(ar)/ar/compare/page.tsx",
  "src/app/(ar)/ar/compare/[slug]/page.tsx",
];

function read(p: string): string {
  const path = resolve(process.cwd(), p);
  expect(existsSync(path), `missing surface file: ${p}`).toBe(true);
  return readFileSync(path, "utf-8");
}

/** Extract every `canonical: <expr>` VALUE from code lines (comments skipped). */
function extractCanonicalValues(src: string): string[] {
  const out: string[] = [];
  for (const line of src.split("\n")) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith("*") ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*")
    ) {
      continue; // comment line — e.g. the trackers' "EN canonical: …" docs
    }
    const m = trimmed.match(/^canonical:\s*(.+?),?\s*$/);
    if (m) out.push(m[1].trim());
  }
  return out;
}

/** Does a canonical expression statically resolve to an absolute
 *  https://alkemos.com origin? Chases one level of local consts
 *  (PAGE_URL/url/SITE/SITE_URL) — the patterns the in-scope files use. */
function resolvesAbsolute(expr: string, src: string, depth = 0): boolean {
  if (depth > 3) return false;
  const e = expr.trim();

  const str = e.match(/^"([^"]*)"$/); // "https://alkemos.com/…"
  if (str) return str[1].startsWith("https://alkemos.com");

  const tpl = e.match(/^`([^`]*)`$/); // template literal
  if (tpl) {
    const body = tpl[1];
    const firstPh = body.indexOf("${");
    const staticPrefix = firstPh === -1 ? body : body.slice(0, firstPh);
    if (staticPrefix.startsWith("https://alkemos.com")) return true;
    const ph = body.match(/^\$\{([A-Za-z_$][\w$]*)\}/); // `${SITE_URL}/…`
    if (ph) return constResolvesAbsolute(ph[1], src, depth + 1);
    return false;
  }

  const ident = e.match(/^[A-Za-z_$][\w$]*$/); // bare identifier (no capture group → [0])
  if (ident) return constResolvesAbsolute(ident[0], src, depth + 1);

  return false;
}

function constResolvesAbsolute(
  name: string,
  src: string,
  depth: number,
): boolean {
  const def = src.match(new RegExp(`const ${name} = ([^;\\n]+)`));
  if (!def) return false;
  return resolvesAbsolute(def[1], src, depth);
}

describe("P1-F — macro-tracker EN <title>: ≤60, one brand, group suffix", () => {
  it("the EN layout title is the pinned P1-F string (verbatim)", () => {
    expect(read(EN_MACRO)).toContain(`title: "${MACRO_TITLE}",`);
  });

  it("the EN title fits the ≤60 law (P1-F field: قص العنوانين → ≤60)", () => {
    expect(MACRO_TITLE.length).toBeLessThanOrEqual(CEILING);
    expect(MACRO_TITLE.length).toBeGreaterThan(45); // not over-trimmed
  });

  it("the EN title carries the brand exactly ONCE, via the group suffix", () => {
    expect(MACRO_TITLE.split(BRAND).length - 1).toBe(1);
    expect(MACRO_TITLE.endsWith(" | Alkemos")).toBe(true);
  });

  it("the head term stays first (the page's keyword lead)", () => {
    expect(MACRO_TITLE.startsWith("Macro Tracker — ")).toBe(true);
  });

  it("the retired 64-char original lives ONLY in og/twitter (exactly 2)", () => {
    const src = read(EN_MACRO);
    expect(src.split(MACRO_OG_TWITTER).length - 1).toBe(2);
    expect(src.split(MACRO_TITLE).length - 1).toBe(1); // the <title> slot only
  });
});

describe("P1-F — workout-tracker EN <title>: ≤60, one brand, group suffix", () => {
  it("the EN layout title is the pinned P1-F string (verbatim)", () => {
    expect(read(EN_WORKOUT)).toContain(`title: "${WORKOUT_TITLE}",`);
  });

  it("the EN title fits the ≤60 law", () => {
    expect(WORKOUT_TITLE.length).toBeLessThanOrEqual(CEILING);
    expect(WORKOUT_TITLE.length).toBeGreaterThan(45); // not over-trimmed
  });

  it("the EN title carries the brand exactly ONCE, via the group suffix", () => {
    expect(WORKOUT_TITLE.split(BRAND).length - 1).toBe(1);
    expect(WORKOUT_TITLE.endsWith(" | Alkemos")).toBe(true);
  });

  it("the head term stays first (the page's keyword lead)", () => {
    expect(WORKOUT_TITLE.startsWith("Workout Tracker — ")).toBe(true);
  });

  it("the retired 63-char original lives ONLY in og/twitter (exactly 2)", () => {
    const src = read(EN_WORKOUT);
    expect(src.split(WORKOUT_OG_TWITTER).length - 1).toBe(2);
    expect(src.split(WORKOUT_TITLE).length - 1).toBe(1); // the <title> slot only
  });
});

describe("P1-F — the AR twins untouched (EN-only item, pinned)", () => {
  it("the AR macro-tracker title/og/twitter keep the pre-P1F string (3)", () => {
    expect(read(AR_MACRO).split(AR_MACRO_TITLE).length - 1).toBe(3);
  });

  it("the AR workout-tracker title/og/twitter keep the pre-P1F string (3)", () => {
    expect(read(AR_WORKOUT).split(AR_WORKOUT_TITLE).length - 1).toBe(3);
  });
});

describe("P1-F — the six canonical positions: absolute, pinned verbatim", () => {
  for (const [file, pin] of CANONICAL_PINS) {
    it(`${file} declares ${pin}`, () => {
      expect(read(file)).toContain(pin);
    });
  }

  it("programs/[slug] canonical `url` is the page's own AR absolute URL", () => {
    const src = read("src/app/(ar)/ar/programs/[slug]/page.tsx");
    expect(src).toContain(
      "const url = `${SITE_URL}/ar/programs/${program.slug}`;",
    );
    expect(src).toContain('const SITE_URL = "https://alkemos.com";');
  });
});

describe("P1-F — site-wide guard: zero relative canonical in scope", () => {
  it("every in-scope surface file exists (inventory stays honest)", () => {
    for (const f of IN_SCOPE_SURFACES) {
      expect(
        existsSync(resolve(process.cwd(), f)),
        `inventory lists a missing file: ${f}`,
      ).toBe(true);
    }
  });

  it("every in-scope canonical resolves ABSOLUTE (no relative regression)", () => {
    const offenders: string[] = [];
    for (const f of IN_SCOPE_SURFACES) {
      const src = read(f);
      const values = extractCanonicalValues(src);
      if (values.length === 0) {
        offenders.push(`${f}: no canonical declaration found`);
        continue;
      }
      for (const v of values) {
        if (!resolvesAbsolute(v, src)) {
          offenders.push(`${f}: canonical ${v} is not absolute`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("the organic-growth inventory covers 48 surfaces (24 EN + 24 AR)", () => {
    expect(IN_SCOPE_SURFACES).toHaveLength(48);
    expect(IN_SCOPE_SURFACES.filter((f) => f.startsWith("src/app/(en)/")))
      .toHaveLength(24);
    expect(IN_SCOPE_SURFACES.filter((f) => f.startsWith("src/app/(ar)/")))
      .toHaveLength(24);
  });
});
