import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * ORGANIC-GROWTH-P1-E — the water-tracker canary
 * (roadmap docs/organic-growth-system-2026-11-18/10 P1-E · spec
 * 06-§2/T5 · contradiction documented in 01-§6).
 *
 * TWO defects pinned as fixed:
 *
 * 1. THE SAVE-MESSAGE CONTRADICTION (01-§6, conversion friction F-9):
 *    the page used to gate DB saving client-side with
 *    «Water log save is Premium+ only» / «حفظ سجل الماء متاح لأعضاء
 *    باقة بريميوم فأعلى» while the plans table (memberships.ts — the
 *    single source of truth) grants EVERY logged-in member saves
 *    (Free: 3 · Premium: 50 · Pro/Coaching: 200) and
 *    /api/tools/save-result enforces exactly that quota server-side.
 *    The fix: the client-side tier gate is REMOVED — the page now
 *    behaves like SaveResultButton (the site-wide save pattern), so
 *    the ONLY save-limit message a user can ever meet is the shared
 *    «Save limit reached (N). Upgrade for more.» answered by the
 *    server from memberships.ts. Acceptance «رسالة واحدة متسقة مع
 *    memberships.ts» is enforced as: gate gone + both contradicting
 *    strings gone + the shared limit strings byte-equal in BOTH files.
 *
 * 2. THE EN TITLE RETARGET (06-§2/T5): "Water Tracker — Daily
 *    Hydration Goal & Log | Alkemos" led with the APP-intent head
 *    term ("tracker" SERPs are APK stores — T5's different strategy:
 *    don't fight the apps on their word). The fix leads with the WEB
 *    intent "Water Intake Calculator" (56 chars · head term first ·
 *    one brand suffix — the P1-F tracker-title law family, ≤60).
 *
 * Scope discipline (P0-D/P1-F precedent — the <title> ONLY): og:title,
 * twitter, description, keywords, canonical and the AR title are
 * pinned to their pre-P1-E values; any drift is a scope violation.
 *
 * Previous-fix preservation: P0-A's crawlable /memberships CTA card,
 * P1-F's absolute canonical, SEO-GEO-4's reciprocal hreflang and the
 * GA4 save_result wiring are re-pinned so P1-E can never silently
 * reopen them.
 */

const EN_LAYOUT = "src/app/(en)/tools/water-tracker/layout.tsx";
const AR_LAYOUT = "src/app/(ar)/ar/tools/water-tracker/layout.tsx";
const EN_PAGE = "src/app/(en)/tools/water-tracker/page.tsx";
const AR_PAGE = "src/app/(ar)/ar/tools/water-tracker/page.tsx";
const SAVE_BUTTON = "src/components/SaveResultButton.tsx";
const SAVE_API = "src/app/api/tools/save-result/route.ts";

const EN_TITLE = "Water Intake Calculator — Hydration Goal & Log | Alkemos";
const OLD_EN_TITLE = "Water Tracker — Daily Hydration Goal & Log | Alkemos";
const AR_TITLE = "متتبع شرب الماء — هدفك اليومي وسجل أكوابك";

// Pre-P1-E scope pins (must survive verbatim).
const EN_OG_TITLE = 'title: "Water Tracker | Alkemos",';
const EN_DESCRIPTION =
  "Track your daily water intake free: a smart hydration goal from your body weight (35 ml × kg), log every cup, and keep your history.";

// The site-wide shared save-limit message (SaveResultButton precedent).
const LIMIT_MSG_EN = "`Save limit reached (${data.limit}). Upgrade for more.`";
const LIMIT_MSG_AR = "`وصلت حد الحفظ (${data.limit}). طوّر باقتك للمزيد.`";

// The contradicting P1-E-removed strings (must stay gone forever).
const GONE_EN = '"Water log save is Premium+ only"';
const GONE_AR = '"حفظ سجل الماء متاح لأعضاء باقة بريميوم فأعلى"';
const GONE_GATE = '["premium", "pro", "coaching"].includes(tier)';

const BRAND = "Alkemos";
const CEILING = 60; // the tracker-titles law (P1-F family — 10/P1-E field 6: «قصّ قانون ≤60»)

function read(p: string): string {
  const path = resolve(process.cwd(), p);
  expect(existsSync(path), `missing file: ${p}`).toBe(true);
  return readFileSync(path, "utf-8");
}

describe("P1-E — EN title retarget: «Water Intake Calculator» (نية الويب لا التطبيق)", () => {
  it("the EN layout title is the pinned P1-E string (verbatim)", () => {
    expect(read(EN_LAYOUT)).toContain(`title: "${EN_TITLE}",`);
  });

  it("the title obeys the ≤60 tracker law", () => {
    expect(EN_TITLE.length).toBeLessThanOrEqual(CEILING);
    expect(EN_TITLE.length).toBe(56);
  });

  it("the WEB-intent head term leads (indexOf === 0)", () => {
    expect(EN_TITLE.startsWith("Water Intake Calculator")).toBe(true);
  });

  it("one brand suffix exactly (no double brand)", () => {
    expect(EN_TITLE.split(BRAND).length - 1).toBe(1);
    expect(EN_TITLE.endsWith(`| ${BRAND}`)).toBe(true);
  });

  it("the app-intent old lead is gone — not «Water Tracker» anymore", () => {
    const src = read(EN_LAYOUT);
    expect(src).not.toContain(`title: "${OLD_EN_TITLE}",`);
    expect(EN_TITLE.startsWith("Water Tracker")).toBe(false);
  });

  it("the retarget is real, not title theater: the keyword set already carries the web intent", () => {
    expect(read(EN_LAYOUT)).toContain('"water intake calculator",');
  });

  it("scope pin — og:title keeps the pre-P1-E family name (P0-D/P1-F precedent)", () => {
    expect(read(EN_LAYOUT)).toContain(EN_OG_TITLE);
  });

  it("scope pin — the description is untouched and still ≤160", () => {
    const src = read(EN_LAYOUT);
    expect(src).toContain(`"${EN_DESCRIPTION}",`);
    expect(EN_DESCRIPTION.length).toBeLessThanOrEqual(160);
    expect(EN_DESCRIPTION.length).toBe(132);
  });

  it("scope pin — P1-F absolute canonical + SEO-GEO-4 reciprocal hreflang survive", () => {
    const src = read(EN_LAYOUT);
    expect(src).toContain('canonical: "https://alkemos.com/tools/water-tracker",');
    expect(src).toContain('ar: "https://alkemos.com/ar/tools/water-tracker",');
    expect(src).toContain('"x-default": "https://alkemos.com/tools/water-tracker",');
  });

  it("scope pin — P1-E is EN-only: the AR title is untouched (verbatim)", () => {
    const src = read(AR_LAYOUT);
    expect(src).toContain(`title: "${AR_TITLE}",`);
    expect(src).toContain('canonical: "https://alkemos.com/ar/tools/water-tracker",');
  });
});

describe("P1-E — رسالة حفظ واحدة متسقة مع memberships.ts (التضارب 01-§6)", () => {
  it("the client-side Premium+ tier gate is GONE from the page", () => {
    expect(read(EN_PAGE)).not.toContain(GONE_GATE);
  });

  it("both contradicting «Premium+ only» strings are GONE forever", () => {
    const src = read(EN_PAGE);
    expect(src).not.toContain(GONE_EN);
    expect(src).not.toContain(GONE_AR);
  });

  it("the gate's only consumer left with it — no useMembershipTier wiring remains", () => {
    const src = read(EN_PAGE);
    expect(src).not.toContain("useMembershipTier");
    expect(src).not.toMatch(/\btier\b/);
  });

  it("the page carries the SITE-WIDE limit message verbatim (EN + AR)", () => {
    const src = read(EN_PAGE);
    expect(src).toContain(LIMIT_MSG_EN);
    expect(src).toContain(LIMIT_MSG_AR);
  });

  it("ONE message everywhere: SaveResultButton carries the same two strings byte-equal", () => {
    const src = read(SAVE_BUTTON);
    expect(src).toContain(LIMIT_MSG_EN);
    expect(src).toContain(LIMIT_MSG_AR);
  });

  it("the page follows the SaveResultButton structure: login → save → server verdict", () => {
    const src = read(EN_PAGE);
    const loginIdx = src.indexOf('"Log in to save"');
    const fetchIdx = src.indexOf('"/api/tools/save-result"');
    const notOkIdx = src.indexOf("if (!res.ok)");
    const limitIdx = src.indexOf('"Limit reached"');
    const trackIdx = src.indexOf('trackGa4Event("save_result"');
    expect(loginIdx).toBeGreaterThan(-1);
    expect(fetchIdx).toBeGreaterThan(loginIdx);
    expect(notOkIdx).toBeGreaterThan(fetchIdx);
    expect(limitIdx).toBeGreaterThan(notOkIdx);
    expect(trackIdx).toBeGreaterThan(notOkIdx);
  });

  it("the quota is SERVER-side from memberships.ts — the API reads getLimits(tier).savedResultsLimit", () => {
    const src = read(SAVE_API);
    expect(src).toContain("getLimits(tier)");
    expect(src).toContain("limits.savedResultsLimit");
    // The verdict the page defers to:
    expect(src).toContain('"Limit reached"');
  });

  it("memberships.ts stays the single save-quota source (the consistency anchor)", () => {
    const src = read("src/lib/memberships.ts");
    expect(src).toContain("savedResultsLimit: number | null;");
    expect(src).toMatch(/savedResultsLimit: 3,/); // Free
  });
});

describe("P1-E — حفظ الإصلاحات السابقة (لا انحدار)", () => {
  it("P0-A preserved — the crawlable /memberships CTA card survives the gate removal", () => {
    const src = read(EN_PAGE);
    expect(src).toContain('href={isAr ? "/ar/memberships" : "/memberships"}');
    expect(src).toContain('"Get a personalized plan ›"');
  });

  it("GA4 (P0-G) preserved — save_result still fires only on the server-confirmed path", () => {
    const src = read(EN_PAGE);
    expect(src).toContain('trackGa4Event("save_result", { tool: "water-tracker", lang });');
    expect(src.indexOf('trackGa4Event("save_result"')).toBeGreaterThan(
      src.indexOf("if (!res.ok)"),
    );
  });

  it("AR mirror is the same bilingual page (one code file — the fix serves both languages)", () => {
    expect(read(AR_PAGE)).toContain(
      'export { default } from "@/app/(en)/tools/water-tracker/page";',
    );
  });
});
