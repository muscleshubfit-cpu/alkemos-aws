import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { MEMBERSHIPS } from "@/lib/memberships";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";

/**
 * ORGANIC-GROWTH-P1-B — the services→free bridges canary
 * (roadmap docs/organic-growth-system-2026-11-18/10 §P1-B + 05-§2 item 2
 * + 05-§3 item 2 + matrix 07-§2 rows «memberships — قسم القيمة → /tools +
 * /diet-plan» and «coaching — قسم EVO والثقة → /evo + /tools»):
 *
 * Both commercial pages were one-way sheets — every bridge pointed INTO
 * the checkout and ZERO crawlable exits led to the free product. The
 * roadmap's fix («2-3 روابط جرّب أولًا») is enforced here as automated
 * checks:
 *
 *   1. Memberships — the «جرّب قبل الاشتراك» card, placed right after
 *      the value section («ما الذي يضيفه الاشتراك فعلًا؟»), carries
 *      THREE crawlable plain <a> exits per language: the tools hub (the
 *      matrix's exact anchor «جرّب الأدوات مجانًا أولًا»), its natural
 *      first step (the calorie calculator — the hub's own starting-path
 *      order T1), and the ready-plan library.
 *   2. Coaching — the EVO section carries TWO crawlable plain <a> exits
 *      per language: «جرّب EVO مجانًا» → /evo and «ابدأ بالأدوات
 *      المجانية» → /tools, built on the section's own every-membership
 *      message plus the published free-tier chat quota.
 *   3. Honesty guard: the roadmap's literal EVO wording «شاهد كيف يبني
 *      EVO خططًا مجانًا» is BANNED — AI plan generation is
 *      subscriber-only (AI-QUOTAS 2026-11-14); the honest free offer is
 *      the chat (10 messages a day — pinned against memberships.ts, the
 *      single source).
 *   4. Every destination resolves to a REAL route on BOTH language trees
 *      (the CTA-CRAWLABILITY route-map precedent).
 *   5. Previous fixes preserved: the memberships conversion CTAs
 *      (ctaHref free · coaching band · compare bridge) and the P0-E
 *      affiliate bridges keep their exact counts; the coaching
 *      informational EVO link (owner directive 2026-08-30) is untouched.
 *   6. The new AR copy is MSA + Latin-clean (the marketing-surface law
 *      both files already ride — targeted here on the new literals).
 */

const MEMBERSHIPS_PAGE = "src/app/(en)/memberships/page.tsx";
const COACHING_PAGE = "src/app/(en)/coaching/page.tsx";

// The exact anchor strings (byte pins — a single character drift fails).
const MEMBERSHIPS_CARD = {
  titleAr: "جرّب قبل الاشتراك",
  titleEn: "Try before subscribing",
  hubAr: "جرّب الأدوات مجانًا أولًا",
  hubEn: "Try the tools free first",
  calorieAr: "ابدأ بحاسبة السعرات",
  calorieEn: "Start with the calorie calculator",
  dietPlanAr: "مكتبة الخطط الجاهزة",
  dietPlanEn: "Browse the ready-plan library",
};

const COACHING_BRIDGE = {
  evoAr: "جرّب EVO مجانًا",
  evoEn: "try EVO free",
  toolsAr: "ابدأ بالأدوات المجانية",
  toolsEn: "start with the free tools",
};

// The value-section and personas-section markers (placement pins).
const VALUE_SECTION_AR = "ما الذي يضيفه الاشتراك فعلًا؟";
const VALUE_SECTION_EN = "What a subscription actually adds";
const PERSONAS_SECTION_AR = "أي باقة تناسبك؟";
const PERSONAS_SECTION_EN = "Which plan fits you?";

// The EVO-section markers (placement pins for the coaching bridge).
const EVO_INFO_LINK_AR = "اعرف المزيد عن EVO";
const EVO_INFO_LINK_EN = "Learn more about EVO";
const TRUST_SECTION_AR = "التزام يمكن الاعتماد عليه.";
const TRUST_SECTION_EN = "A commitment you can count on.";

// The roadmap's literal EVO wording — banned by the honesty law (AI plan
// generation is subscriber-only; only the CHAT is free — 10/day).
const BANNED_FREE_PLAN_CLAIMS = [
  "شاهد كيف يبني EVO خططًا مجانًا",
  "يبني EVO خططًا مجانًا",
  "EVO builds plans for free",
  "watch EVO build plans free",
];

function read(p: string): string {
  const path = resolve(process.cwd(), p);
  expect(existsSync(path), `missing file: ${p}`).toBe(true);
  return readFileSync(path, "utf-8");
}

/** Build the real route map from the app tree (the cta-crawlability
 *  precedent — a crawlable link must resolve to a real route). */
function buildRoutes(root: string): Set<string> {
  const routes = new Set<string>();
  const walk = (dir: string, prefix: string) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        const seg = e.name.startsWith("(") ? "" : `/${e.name}`;
        walk(resolve(dir, e.name), `${prefix}${seg}`);
      } else if (e.name === "page.tsx") {
        routes.add(prefix || "/");
      }
    }
  };
  walk(resolve(process.cwd(), root), "");
  return routes;
}

describe("P1-B — memberships: the «جرّب قبل الاشتراك» card (3 crawlable exits ×2 languages)", () => {
  it("carries the card title and the three matrix anchors in BOTH languages (byte pins)", () => {
    const src = read(MEMBERSHIPS_PAGE);
    expect(src).toContain(MEMBERSHIPS_CARD.titleAr);
    expect(src).toContain(MEMBERSHIPS_CARD.titleEn);
    expect(src).toContain(MEMBERSHIPS_CARD.hubAr);
    expect(src).toContain(MEMBERSHIPS_CARD.hubEn);
    expect(src).toContain(MEMBERSHIPS_CARD.calorieAr);
    expect(src).toContain(MEMBERSHIPS_CARD.calorieEn);
    expect(src).toContain(MEMBERSHIPS_CARD.dietPlanAr);
    expect(src).toContain(MEMBERSHIPS_CARD.dietPlanEn);
  });

  it("exactly ONE crawlable <a> per destination per language (no duplication, language-aware)", () => {
    const src = read(MEMBERSHIPS_PAGE);
    // the tools hub
    expect(src.match(/href="\/ar\/tools"/g)?.length).toBe(1);
    expect(src.match(/href="\/tools"/g)?.length).toBe(1);
    // the calorie calculator deep link
    expect(src.match(/href="\/ar\/tools\/calorie-calculator"/g)?.length).toBe(1);
    expect(src.match(/href="\/tools\/calorie-calculator"/g)?.length).toBe(1);
    // the ready-plan library
    expect(src.match(/href="\/ar\/diet-plan"/g)?.length).toBe(1);
    expect(src.match(/href="\/diet-plan"/g)?.length).toBe(1);
  });

  it("placement: the card sits AFTER the value section and BEFORE the personas section (07-§2 «قسم القيمة»)", () => {
    const src = read(MEMBERSHIPS_PAGE);
    const valueAr = src.indexOf(VALUE_SECTION_AR);
    const valueEn = src.indexOf(VALUE_SECTION_EN);
    const card = src.indexOf(MEMBERSHIPS_CARD.titleAr);
    const personasAr = src.indexOf(PERSONAS_SECTION_AR);
    const personasEn = src.indexOf(PERSONAS_SECTION_EN);
    expect(valueAr).toBeGreaterThan(-1);
    expect(valueEn).toBeGreaterThan(-1);
    expect(personasAr).toBeGreaterThan(-1);
    expect(personasEn).toBeGreaterThan(-1);
    expect(card, "the card must exist").toBeGreaterThan(-1);
    expect(card).toBeGreaterThan(valueAr);
    expect(card).toBeGreaterThan(valueEn);
    expect(card).toBeLessThan(personasAr);
    expect(card).toBeLessThan(personasEn);
  });

  it("honesty: the card's free-tier facts carry the PUBLISHED numbers (memberships.ts is the single source)", () => {
    const src = read(MEMBERSHIPS_PAGE);
    const free = MEMBERSHIPS.find((m) => m.id === "free");
    expect(free?.limits.evoChatDailyLimit).toBe(10);
    // the copy quotes the same number in both languages
    expect(src).toContain("10 رسائل يوميًا");
    expect(src).toContain("10 messages a day");
    // the free-save promise matches the page's own established framing
    expect(src).toContain("يحفظ نتائجك وخططك للأبد");
    expect(src).toContain("keeps your results and plans forever");
  });

  it("previous fixes preserved: conversion CTAs + P0-E affiliate bridge counts untouched", () => {
    const src = read(MEMBERSHIPS_PAGE);
    // the free-tier CTA logic (BILINGUAL-CONTENT Phase 2)
    expect(src).toContain('href={ctaHref("free", 1)}');
    // the coaching band bridge
    expect(src).toContain('href={isAr ? "/ar/coaching" : "/coaching"}');
    // the compare bridge (access-point fix 2026-09-14)
    expect(src).toContain('href={isAr ? "/ar/compare" : "/compare"}');
    // P0-E: exactly ONE language-aware affiliate bridge per language
    expect(src.match(/href="\/ar\/affiliate"/g)?.length).toBe(1);
    expect(src.match(/href="\/affiliate"/g)?.length).toBe(1);
    // the value section's four delta cards + the personas grid survive
    expect(src).toContain("More plans every month");
    expect(src).toContain("خطط أكثر كل شهر");
  });
});

describe("P1-B — coaching: the two free-exit bridges in the EVO section (×2 languages)", () => {
  it("carries the two matrix anchors in BOTH languages (byte pins)", () => {
    const src = read(COACHING_PAGE);
    expect(src).toContain(COACHING_BRIDGE.evoAr);
    expect(src).toContain(COACHING_BRIDGE.evoEn);
    expect(src).toContain(COACHING_BRIDGE.toolsAr);
    expect(src).toContain(COACHING_BRIDGE.toolsEn);
  });

  it("exactly ONE crawlable literal <a> per destination per language (the informational EVO button stays an expression, not counted)", () => {
    const src = read(COACHING_PAGE);
    // the literal crawlable exits added by P1-B
    expect(src.match(/href="\/ar\/evo"/g)?.length).toBe(1);
    expect(src.match(/href="\/evo"/g)?.length).toBe(1);
    expect(src.match(/href="\/ar\/tools"/g)?.length).toBe(1);
    expect(src.match(/href="\/tools"/g)?.length).toBe(1);
  });

  it("placement: the bridge line sits inside the EVO section — after the informational EVO link, before the trust section", () => {
    const src = read(COACHING_PAGE);
    const infoAr = src.indexOf(EVO_INFO_LINK_AR);
    const infoEn = src.indexOf(EVO_INFO_LINK_EN);
    const bridge = src.indexOf(COACHING_BRIDGE.evoAr);
    const trustAr = src.indexOf(TRUST_SECTION_AR);
    const trustEn = src.indexOf(TRUST_SECTION_EN);
    expect(infoAr).toBeGreaterThan(-1);
    expect(infoEn).toBeGreaterThan(-1);
    expect(bridge, "the bridge must exist").toBeGreaterThan(-1);
    expect(trustAr).toBeGreaterThan(-1);
    expect(trustEn).toBeGreaterThan(-1);
    expect(bridge).toBeGreaterThan(infoAr);
    expect(bridge).toBeGreaterThan(infoEn);
    expect(bridge).toBeLessThan(trustAr);
    expect(bridge).toBeLessThan(trustEn);
  });

  it("honesty: the free offer is the CHAT with the published quota (10/day from memberships.ts) — never free plan generation", () => {
    const src = read(COACHING_PAGE);
    const free = MEMBERSHIPS.find((m) => m.id === "free");
    expect(free?.limits.evoChatDailyLimit).toBe(10);
    // the copy quotes the same number in both languages
    expect(src).toContain("(10 رسائل)");
    expect(src).toContain("(10 messages)");
    // the roadmap's literal free-plan-building claim may NEVER appear
    for (const banned of BANNED_FREE_PLAN_CLAIMS) {
      expect(src, `dishonest free-generation claim returned: "${banned}"`).not.toContain(banned);
    }
  });

  it("previous fixes preserved: the informational EVO link (owner 2026-08-30) + trust cards + P0-E affiliate bridge", () => {
    const src = read(COACHING_PAGE);
    // the quiet informational EVO link keeps its expression href + labels
    expect(src).toContain('href={isAr ? "/ar/evo" : "/evo"}');
    expect(src).toContain(EVO_INFO_LINK_AR);
    expect(src).toContain(EVO_INFO_LINK_EN);
    // the every-membership message (Phase 196 law) survives in both languages
    expect(src).toContain("part of every Alkemos membership");
    expect(src).toContain("جزء من كل عضويات Alkemos");
    // P0-E: exactly ONE language-aware affiliate bridge per language
    expect(src.match(/href="\/ar\/affiliate"/g)?.length).toBe(1);
    expect(src.match(/href="\/affiliate"/g)?.length).toBe(1);
    // SEO-RECOVERY 2026-11-11: the coach-recruitment links survive
    expect(src).toContain('href="/ar/for-coaches/register"');
    expect(src).toContain('href="/for-coaches/register"');
  });
});

describe("P1-B — every bridge destination resolves to a real route on BOTH language trees", () => {
  const enRoutes = buildRoutes("src/app/(en)");
  // the (ar) route group contributes no URL segment; the nested `ar`
  // directory contributes the /ar prefix — walking the GROUP root maps
  // the AR tree to its real /ar-prefixed routes.
  const arRoutes = buildRoutes("src/app/(ar)");

  it.each([
    ["/tools", "tools hub"],
    ["/tools/calorie-calculator", "calorie calculator"],
    ["/diet-plan", "diet-plan library"],
    ["/evo", "EVO product page"],
  ] as [string, string][])("%s is a real EN route (%s)", (path) => {
    expect(enRoutes.has(path)).toBe(true);
  });

  it.each([
    ["/ar/tools", "أدوات"],
    ["/ar/tools/calorie-calculator", "حاسبة السعرات"],
    ["/ar/diet-plan", "مكتبة الخطط"],
    ["/ar/evo", "صفحة EVO"],
  ] as [string, string][])("%s is a real AR route (%s)", (path) => {
    expect(arRoutes.has(path)).toBe(true);
  });
});

describe("P1-B — the new AR copy is MSA and Latin-clean (marketing-surface law, targeted)", () => {
  // The new Arabic literals introduced by P1-B (scanned on their own —
  // the same tokenizer discipline as P1-H's targeted MSA+Latin checks).
  // NOTE: the coaching lead-in is pinned as its TWO source literals —
  // JSX wraps the long sentence across two string literals.
  const NEW_AR_LITERALS = [
    "جرّب قبل الاشتراك",
    "المجاني ليس نسخة تجريبية: كل الأدوات والحاسبات مجانية، ومحادثة EVO مجانية بـ10 رسائل يوميًا، والحساب المجاني يحفظ نتائجك وخططك للأبد. جرّب المنتج بنفسك أولًا، وارتقِ حين يصبح استخدامك أوسع من حصتك.",
    "جرّب الأدوات مجانًا أولًا",
    "ابدأ بحاسبة السعرات",
    "مكتبة الخطط الجاهزة",
    "EVO جزء من كل عضويات Alkemos — والعضوية المجانية تشمل محادثته",
    "اليومية (10 رسائل):",
    "جرّب EVO مجانًا",
    "ابدأ بالأدوات المجانية",
    "— وأضف مدربًا بشريًا حين تكون جاهزًا.",
  ];

  it("zero STRONG dialect markers, zero weak markers in the new literals", () => {
    const text = NEW_AR_LITERALS.join("\n");
    const scan = scanArabicDialect(text);
    expect(
      scan.strong,
      `strong dialect markers: ${JSON.stringify(scan.strongHits)}`,
    ).toBe(0);
    expect(
      scan.weak,
      `weak dialect markers: ${JSON.stringify(scan.weakHits)}`,
    ).toBe(0);
  });

  it("no bare Latin 'vs'/'limits' inside the new Arabic literals (the marketing Latin law)", () => {
    const offenders = NEW_AR_LITERALS.filter((l) =>
      /\b(?:vs|limits?)\b/i.test(l),
    );
    expect(
      offenders,
      `bare Latin "vs"/"limits" in Arabic copy: ${JSON.stringify(offenders)}`,
    ).toEqual([]);
  });

  it("every new AR literal actually exists in its page source (the pin set is never stale)", () => {
    const memberships = read(MEMBERSHIPS_PAGE);
    const coaching = read(COACHING_PAGE);
    const membershipsSet = [
      NEW_AR_LITERALS[0],
      NEW_AR_LITERALS[1],
      NEW_AR_LITERALS[2],
      NEW_AR_LITERALS[3],
      NEW_AR_LITERALS[4],
    ];
    const coachingSet = [
      NEW_AR_LITERALS[5],
      NEW_AR_LITERALS[6],
      NEW_AR_LITERALS[7],
      NEW_AR_LITERALS[8],
      NEW_AR_LITERALS[9],
    ];
    for (const l of membershipsSet) {
      expect(memberships, `stale pin — missing from memberships: "${l.slice(0, 40)}…"`).toContain(l);
    }
    for (const l of coachingSet) {
      expect(coaching, `stale pin — missing from coaching: "${l.slice(0, 40)}…"`).toContain(l);
    }
  });
});
