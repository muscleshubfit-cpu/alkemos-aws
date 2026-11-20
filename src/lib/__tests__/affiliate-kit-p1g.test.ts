import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";
import {
  AFFILIATE_KIT,
  affiliateKitLinkHref,
  COACH_ACTIVATION_TWIN_AMOUNTS,
} from "@/lib/affiliate-kit";
import { COMMISSION_RATE, MINIMUM_PAYOUT, COOKIE_DURATION_DAYS } from "@/lib/affiliate-constants";
import { COACH_CLIENT_PACKAGES } from "@/lib/coach-limits";
import { MEMBERSHIPS } from "@/lib/memberships";

/**
 * ORGANIC-GROWTH-P1-G canary (owner order 2026-11-21 «نفّذ البند التالي
 * مباشرة من خطة التنفيذ» — docs/organic-growth-system-2026-11-18/
 * 10-prioritized-execution-roadmap.md §P1-G · plan 05-§6): the affiliate
 * RECRUITMENT kit —
 *
 *   «قوالب رسائل للمدربين/المؤثرين + قسم شرائح بصفحة /affiliate»
 *   acceptance: «كيت منشور بالصفحة» · approval field: «نصوص قانونية
 *   بلا وعود» (light PR, NO unverifiable number promises).
 *
 * Enforced as automated checks:
 *   1. SEGMENTS — four segments ×2 languages, honest why-it-fits copy,
 *      the coaches card carries the 05-§5 «سوقان/two markets» story
 *      (B2C eligible subscriptions + B2B referred-coach activations,
 *      both at 20%), and the 07-§2 matrix row «صفحة الأفلييت —
 *      الأقسام → /memberships + /coaching + /for-coaches» ships ONE
 *      contextual crawlable link per card, resolved locale-aware.
 *   2. OUTREACH — three ready message templates (Instagram DM per the
 *      11-18 finding, WhatsApp, email) ×2 languages, with sender
 *      placeholders, the disclosure INSIDE every template, and the
 *      honest numbers only — arithmetic-pinned against the REAL
 *      governing constants (never hand-typed).
 *   3. THE NO-PROMISES LAW — the roadmap's approval field is a source-
 *      level ban: income-guarantee phrasings may never appear in the
 *      kit (AR + EN), while the conditional honest wording («قد أكسب»
 *      / "may earn" + «المؤهلة» / "eligible") must.
 *   4. WIRING — the view renders BOTH sections from the single source
 *      (segments section + kit section), the outreach blocks use the
 *      CopyButton + the GA4 event, the coaches pitch carries the EGP
 *      twins on the activation fees only, and every pinned previous
 *      fix (P0-E CTA conversions, FAQ single source, share buttons)
 *      stays intact.
 *   5. MSA — the Arabic kit copy is Pan-Arab MSA with zero bare Latin
 *      beyond the Alkemos brand (the manifest extension follows the
 *      affiliate-faq.ts precedent, verified here from the manifest
 *      itself).
 */

const VIEW = "src/components/views/AffiliateProgramView.tsx";
const LIB = "src/lib/affiliate-kit.ts";
const MSA_MANIFEST = "src/lib/__tests__/marketing-msa-surface.test.ts";

const read = (p: string) => {
  const path = resolve(process.cwd(), p);
  expect(existsSync(path), `missing file: ${p}`).toBe(true);
  return readFileSync(path, "utf-8");
};

/** Build the real route map from the app tree (the cta-crawlability
 * precedent — a kit link must resolve to a real route). */
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

const planMonthly = (tier: string) =>
  MEMBERSHIPS.find((m) => m.id === tier)!.priceMonthly!;
const comm = (usd: number) => Math.round(usd * COMMISSION_RATE * 100) / 100;
// The kit's own formatting laws: commissions are ALWAYS two decimals
// (the page's FAQ style), prices/thresholds keep the integer short form.
const commAr = (n: number) => `${n.toFixed(2)}$`;
const commEn = (n: number) => `$${n.toFixed(2)}`;
const priceAr = (n: number) => (Number.isInteger(n) ? `${n}$` : `${n.toFixed(2)}$`);
const priceEn = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

const allKitText = (lang: "en" | "ar") => {
  const k = AFFILIATE_KIT[lang];
  return [
    k.segmentsTitle,
    k.segmentsSubtitle,
    ...k.segments.flatMap((s) => [s.title, s.pitch, s.share, s.link?.label ?? ""]),
    k.kitTitle,
    k.kitSubtitle,
    k.kitNote,
    ...k.outreach.flatMap((t) => [t.title, t.platform, t.body]),
  ].join("\n");
};

describe("ORGANIC-GROWTH-P1-G — the segments (قسم الشرائح)", () => {
  it("ships exactly FOUR segments ×2 languages, all fields non-empty", () => {
    for (const lang of ["ar", "en"] as const) {
      expect(AFFILIATE_KIT[lang].segments).toHaveLength(4);
      expect(AFFILIATE_KIT[lang].segments.map((s) => s.id)).toEqual([
        "coaches",
        "nutrition",
        "creators",
        "communities",
      ]);
      for (const s of AFFILIATE_KIT[lang].segments) {
        expect(s.title.length).toBeGreaterThan(5);
        expect(s.pitch.length).toBeGreaterThan(40);
        expect(s.share.length).toBeGreaterThan(40);
      }
    }
  });

  it("the coaches card carries the 05-§5 «two markets» story: B2C subscriptions + B2B coach activations, both at 20%", () => {
    for (const lang of ["ar", "en"] as const) {
      const coaches = AFFILIATE_KIT[lang].segments.find((s) => s.id === "coaches")!;
      const text = `${coaches.title} ${coaches.pitch} ${coaches.share}`;
      expect(text).toContain("20%");
      // B2C — the eligible-subscriptions market with the plan examples
      expect(text).toContain(lang === "ar" ? "اشتراكات" : "subscription");
      // B2B — the referred-coach activation market
      expect(text).toContain(lang === "ar" ? "تفعيل" : "activation");
      // permanence — the honest recurring basis
      expect(
        text.match(lang === "ar" ? /ربط الإحالة دائم/ : /attribution is permanent/),
      ).toBeTruthy();
      // the segment is named the highest-value one (05-§6)
      expect(
        text.match(lang === "ar" ? /الأعلى قيمة/ : /highest-value/),
      ).toBeTruthy();
    }
  });

  it("arithmetic pins: every money figure in the kit derives from the governing constants", () => {
    // The real constants (imports — a drift in any source flips this
    // test, the P1-A دبابيس حسابية precedent).
    expect(planMonthly("premium")).toBe(14.99);
    expect(planMonthly("coaching")).toBe(39.99);
    expect(comm(planMonthly("premium"))).toBe(3);
    expect(comm(planMonthly("coaching"))).toBe(8);
    expect(comm(COACH_CLIENT_PACKAGES[0].priceUsd)).toBe(1.2);
    expect(comm(COACH_CLIENT_PACKAGES.find((p) => p.months === 3)!.priceUsd)).toBe(3.2);
    expect(COMMISSION_RATE).toBe(0.2);
    expect(MINIMUM_PAYOUT).toBe(10);
    expect(COOKIE_DURATION_DAYS).toBe(30);
    expect(COACH_ACTIVATION_TWIN_AMOUNTS).toEqual([6, 16]);

    // The coaches pitch carries the derived figures in both languages
    for (const lang of ["ar", "en"] as const) {
      const coaches = AFFILIATE_KIT[lang].segments.find((s) => s.id === "coaches")!;
      const commFmt = lang === "ar" ? commAr : commEn;
      const priceFmt = lang === "ar" ? priceAr : priceEn;
      for (const figure of [
        commFmt(comm(planMonthly("premium"))),
        commFmt(comm(planMonthly("coaching"))),
        commFmt(comm(COACH_CLIENT_PACKAGES[0].priceUsd)),
        commFmt(comm(COACH_CLIENT_PACKAGES.find((p) => p.months === 3)!.priceUsd)),
        priceFmt(COACH_CLIENT_PACKAGES[0].priceUsd),
        priceFmt(COACH_CLIENT_PACKAGES.find((p) => p.months === 3)!.priceUsd),
      ]) {
        expect(
          coaches.pitch.includes(figure),
          `${lang} coaches pitch missing the derived figure ${figure}`,
        ).toBe(true);
      }
    }
  });

  it("the 07-§2 matrix row ships: for-coaches + memberships + coaching — ONE link each, locale-aware, all REAL routes", () => {
    const kinds = new Set(
      ["ar", "en"].flatMap((lang) =>
        AFFILIATE_KIT[lang as "ar" | "en"].segments
          .map((s) => s.link?.kind)
          .filter(Boolean),
      ),
    );
    expect(kinds).toEqual(new Set(["for_coaches", "memberships", "coaching"]));

    // locale-aware resolution (SEO-GEO-4)
    expect(affiliateKitLinkHref("for_coaches", false)).toBe("/for-coaches");
    expect(affiliateKitLinkHref("for_coaches", true)).toBe("/ar/for-coaches");
    expect(affiliateKitLinkHref("memberships", true)).toBe("/ar/memberships");
    expect(affiliateKitLinkHref("coaching", true)).toBe("/ar/coaching");

    // every href resolves to a REAL route in the app tree
    const routes = buildRoutes("src/app");
    for (const kind of ["for_coaches", "memberships", "coaching"] as const) {
      for (const isAr of [false, true]) {
        const href = affiliateKitLinkHref(kind, isAr);
        expect(
          routes.has(href),
          `kit link ${href} is not a real route`,
        ).toBe(true);
      }
    }

    // exactly ONE link per language-side (communities carries none —
    // the matrix names three destinations, no more)
    for (const lang of ["ar", "en"] as const) {
      const withLinks = AFFILIATE_KIT[lang].segments.filter((s) => s.link);
      expect(withLinks).toHaveLength(3);
      expect(AFFILIATE_KIT[lang].segments.find((s) => s.id === "communities")!.link).toBeNull();
    }
  });
});

describe("ORGANIC-GROWTH-P1-G — the outreach templates (قوالب الرسائل)", () => {
  it("ships exactly THREE templates ×2 languages (Instagram DM · WhatsApp · email)", () => {
    for (const lang of ["ar", "en"] as const) {
      expect(AFFILIATE_KIT[lang].outreach.map((t) => t.id)).toEqual([
        "instagram_dm",
        "whatsapp",
        "email",
      ]);
      for (const t of AFFILIATE_KIT[lang].outreach) {
        expect(t.title.length).toBeGreaterThan(5);
        expect(t.platform.length).toBeGreaterThan(10);
        expect(t.body.length).toBeGreaterThan(200);
      }
    }
  });

  it("every template carries the sender placeholders (name + link) — copy-ready, never a dead end", () => {
    const namePh = (lang: "ar" | "en") => (lang === "ar" ? /\[اسم/ : /\[(Coach's|Creator's|Owner's|Your) name\]/);
    const linkPh = (lang: "ar" | "en") => (lang === "ar" ? /\[رابطك\]|\[رابطكم\]/ : /\[Your link\]/);
    for (const lang of ["ar", "en"] as const) {
      for (const t of AFFILIATE_KIT[lang].outreach) {
        expect(t.body, `${lang}/${t.id}: missing a name placeholder`).toMatch(namePh(lang));
        expect(t.body, `${lang}/${t.id}: missing the link placeholder`).toMatch(linkPh(lang));
      }
    }
  });

  it("the disclosure lives INSIDE every template (إفصاح جزء من القالب)", () => {
    for (const lang of ["ar", "en"] as const) {
      for (const t of AFFILIATE_KIT[lang].outreach) {
        expect(
          t.body,
          `${lang}/${t.id}: missing the in-template disclosure`,
        ).toMatch(lang === "ar" ? /إفصاح: .*أفلييت/ : /Disclosure: .*affiliate/);
      }
    }
  });

  it("honest numbers only: the payout threshold + cookie window + 20% appear; every template stays conditional («قد أكسب»/may earn)", () => {
    for (const lang of ["ar", "en"] as const) {
      const text = allKitText(lang);
      expect(text).toContain("20%");
      expect(text).toContain(lang === "ar" ? priceAr(MINIMUM_PAYOUT) : priceEn(MINIMUM_PAYOUT));
      expect(text).toContain(String(COOKIE_DURATION_DAYS));
      // conditional earning language everywhere (never «ستربح»)
      for (const t of AFFILIATE_KIT[lang].outreach) {
        expect(
          t.body,
          `${lang}/${t.id}: the earning must stay conditional`,
        ).toMatch(lang === "ar" ? /قد أكسب عمولة/ : /may earn a commission/);
      }
    }
  });

  it("البريد الإلكتروني carries the no-income-guarantee line (أمانة العرض المؤسسي)", () => {
    const ar = AFFILIATE_KIT.ar.outreach.find((t) => t.id === "email")!;
    const en = AFFILIATE_KIT.en.outreach.find((t) => t.id === "email")!;
    expect(ar.body).toContain("ولا تضمن أي دخل");
    expect(en.body).toContain("guarantee no income");
  });
});

describe("ORGANIC-GROWTH-P1-G — the NO-PROMISES law (نصوص قانونية بلا وعود)", () => {
  // The roadmap's approval field, enforced at SOURCE level (lib + view):
  // income-guarantee phrasings may never appear in the kit.
  const BANNED_AR = [
    "دخل مضمون",
    "أرباح مضمونة",
    "ربح مضمون",
    "ستربح",
    "سوف تربح",
    "دخل شهري ثابت",
    "ثراء سريع",
    "مضمون الدخل",
    "اضمن لك",
  ];
  const BANNED_EN = [
    "guaranteed income",
    "guaranteed earnings",
    "you will earn",
    "passive income",
    "get rich",
    "fixed monthly income",
  ];

  it("zero income-promise phrasings in the kit module (both languages)", () => {
    const src = read(LIB);
    for (const banned of [...BANNED_AR, ...BANNED_EN]) {
      expect(src, `promise phrasing returned: "${banned}"`).not.toContain(banned);
    }
  });

  it("zero income-promise phrasings in the rendered kit strings (runtime values, not just source)", () => {
    for (const lang of ["ar", "en"] as const) {
      const text = allKitText(lang);
      const banned = lang === "ar" ? BANNED_AR : BANNED_EN;
      for (const phrase of banned) {
        expect(text, `${lang} kit carries the promise phrasing "${phrase}"`).not.toContain(phrase);
      }
    }
  });

  it("the eligibility wording («مؤهل»/eligible) is present in BOTH languages", () => {
    expect(allKitText("ar")).toMatch(/المؤهل|مؤهل/);
    expect(allKitText("en")).toMatch(/eligible/);
  });
});

describe("ORGANIC-GROWTH-P1-G — MSA law on the Arabic kit copy", () => {
  it("zero dialect markers and zero bare Latin (Alkemos brand + figures only)", () => {
    const arCopy = allKitText("ar");
    const dialect = scanArabicDialect(arCopy);
    expect(dialect.strong, JSON.stringify(dialect.strongHits)).toBe(0);
    expect(dialect.weak, JSON.stringify(dialect.weakHits)).toBe(0);
    const latin = scanLatinContamination(arCopy);
    expect(latin.count, `bare Latin tokens: ${JSON.stringify(latin.tokens)}`).toBe(0);
  });

  it("the kit module joined the marketing-MSA manifest (the affiliate-faq.ts precedent)", () => {
    const manifest = read(MSA_MANIFEST);
    expect(manifest).toContain('"src/lib/affiliate-kit.ts",');
  });
});

describe("ORGANIC-GROWTH-P1-G — wiring: the kit is PUBLISHED on the page (كيت منشور بالصفحة)", () => {
  it("the view renders BOTH sections from the single source", () => {
    const src = read(VIEW);
    expect(src).toContain('AFFILIATE_KIT[isAr ? "ar" : "en"]');
    expect(src).toContain("kit.segments.map");
    expect(src).toContain("kit.outreach.map");
    expect(src).toContain("{kit.segmentsTitle}");
    expect(src).toContain("{kit.kitTitle}");
    expect(src).toContain("{kit.kitNote}");
  });

  it("the segment links are real crawlable <Link>s resolved locale-aware", () => {
    const src = read(VIEW);
    expect(src).toContain("href={affiliateKitLinkHref(seg.link.kind, isAr)}");
    // no navigate() for the kit links (crawlability — the P0-A law)
    expect(src).not.toContain("navigate(\"for-coaches\")");
  });

  it("the coaches pitch carries the EGP twins on the activation fees ONLY (derived, never hand-typed)", () => {
    const src = read(VIEW);
    expect(src).toContain("COACH_ACTIVATION_TWIN_AMOUNTS");
    expect(src).toMatch(/onlyAmounts=\{\[\.\.\.COACH_ACTIVATION_TWIN_AMOUNTS\]\}/);
  });

  it("the outreach blocks are copyable: CopyButton + the GA4 event + dir-aware pre", () => {
    const src = read(VIEW);
    expect(src).toContain('analyticsEvent="affiliate_outreach_copied"');
    expect(src).toContain("value={tpl.body}");
    expect(src).toMatch(/<pre\s+dir=\{dir\}/);
  });

  it("the kit section order: segments follow WHO IT'S FOR, the kit follows the promo toolkit", () => {
    const src = read(VIEW);
    const who = src.indexOf("c.who.title");
    const segments = src.indexOf("kit.segmentsTitle");
    const commission = src.indexOf("c.commission.title");
    const toolkit = src.indexOf("YOUR PROMO TOOLKIT");
    const kitTitle = src.indexOf("kit.kitTitle");
    const whatYouGet = src.indexOf("c.perks.title");
    expect(who).toBeGreaterThan(-1);
    expect(segments).toBeGreaterThan(who);
    expect(segments).toBeLessThan(commission);
    expect(toolkit).toBeGreaterThan(-1);
    expect(kitTitle).toBeGreaterThan(toolkit);
    expect(kitTitle).toBeLessThan(whatYouGet);
  });

  it("previous fixes preserved: the P0-E CTA conversions + FAQ single source + share buttons", () => {
    const src = read(VIEW);
    // the three state-dependent crawlable CTAs (P0-E pin)
    expect(
      src.match(/href=\{profile \? "\/referral" : "\/auth\?mode=signup"\}/g)?.length,
    ).toBe(3);
    // the single literal guest link stays exactly one (P0-E pin)
    expect(src.match(/href="\/auth\?mode=signup"/g)?.length).toBe(1);
    // the FAQ renders from the single source (P0-E)
    expect(src).toContain("items: AFFILIATE_FAQ.ar");
    expect(src).toContain("items: AFFILIATE_FAQ.en");
    // the share buttons stay functional buttons (authed-only section)
    expect(src).toContain("onClick={shareWhatsApp}");
    expect(src).toContain("onClick={shareFacebook}");
    expect(src).toContain("onClick={shareX}");
  });
});

describe("ORGANIC-GROWTH-P1-G — the stale-pin guard", () => {
  it("every pinned literal still exists verbatim in its source file", () => {
    const lib = read(LIB);
    const view = read(VIEW);
    for (const pin of [
      "شرائح الشركاء الأعلى قيمة",
      "المدربون — الشريحة الأعلى قيمة",
      "كيت التوظيف — قوالب رسائل جاهزة",
      "سوقان يعملان لك من رابط واحد",
      "تذكير الأمانة: لا تُضف وعودًا بأرقام دخل",
      "The highest-value partner segments",
      "Two markets work for you from one link",
      "The recruitment kit — ready outreach messages",
      "Honesty reminder: never add income promises",
    ]) {
      expect(lib, `stale pin (lib): "${pin}"`).toContain(pin);
    }
    for (const pin of [
      "PARTNER SEGMENTS (P1-G — قسم الشرائح)",
      "RECRUITMENT KIT — outreach message templates (P1-G)",
    ]) {
      expect(view, `stale pin (view): "${pin}"`).toContain(pin);
    }
  });
});
