/**
 * Tool Chain Bridge — ORGANIC-GROWTH-P1-D (owner order 2026-11-20
 * «نفّذ البند التالي مباشرة من خطة التنفيذ» — docs/
 * organic-growth-system-2026-11-18/10-prioritized-execution-roadmap.md).
 *
 * The roadmap item: «توسيع نتائج BMI/الدهون بجسور السلسلة
 * (BMI→calorie · دهون→macro/coaching)» — the BMI and body-fat results
 * ended at their own numbers while the site owns the exact next step
 * each of those numbers begs for (06-§2 «سلاسل منطقية», rule 06-§4.2
 * «لا نتيجة ميتة» — every calculator result ends with ONE logical next
 * step). This module is the single source the two calculators render
 * from:
 *
 *   bmiChainSegment(bmi) — which side of the healthy range the result
 *   sits on (below / normal / above), using the SAME thresholds the
 *   BMI page's own category logic uses (18.5 / 25 — the WHO ranges of
 *   the page's scale table). Invalid input (≤0 / NaN) → null (the
 *   bridge renders nothing). The segment only chooses the MESSAGE; the
 *   chain destination (the calorie calculator) is the same for every
 *   segment — the calculator serves all three goals (lose / maintain /
 *   gain), so the chain is honest for every result.
 *
 *   bmiChainBridge(bmi, isAr) / bodyFatChainBridge(isAr) — the full
 *   rendered model: title + sub-line + links. ONE bridge per result
 *   (the roadmap's acceptance «جسر واحد لكل نتيجة»):
 *     - BMI → ONE tool link: the calorie calculator (07-§2 matrix row
 *       «نتيجة BMI → /tools/calorie-calculator» — the first step of the
 *       tools-hub starting lanes, whose result continues to the
 *       ready-made plan cells through the P0-C bridge).
 *     - Body-fat → ONE tool link (the macro calculator — the visitor's
 *       ESTIMATED lean mass needs daily protein, and the macro calculator
 *       splits the entered daily calories into macro grams by the chosen
 *       diet; it takes NO weight and NO lean-mass input — owner review
 *       2026-11-20) + ONE quiet service link (coaching — 06-§2:
 *       obesity/cutting is explicit coaching intent). The service link
 *       renders as a faint contextual line (the P0-E/P1-B
 *       commercial-zone precedent), NOT a button: the memberships CTA
 *       stays the page's single commercial CTA (law 07-§4.2).
 *
 * Honesty (law §12.50): every claim on the cards is a capability the
 * destination page actually has (the calorie calculator computes the
 * daily target for the goal; its result opens the ready-made plans at
 * the nearest published level — the P0-C bridge; the macro calculator
 * splits the visitor's ENTERED daily calories into protein/carb/fat
 * grams by the chosen diet preset — its only inputs are calories +
 * diet type, it consumes no weight and no lean mass; coaching is human
 * supervision). The body-fat page's fat/lean masses are ESTIMATES from
 * a weight inferred at a healthy-midpoint BMI of 22 — so this copy
 * says «المقدَّرة/estimated», never «measured» (owner review
 * 2026-11-20; the estimate qualifier is pinned on the page's own
 * cards by the canary). The doc's literal wording «حافظ على عضلاتك
 * أثناء القطع» was adapted to
 * the site's own published vocabulary «خسارة الدهون» (the fat-loss
 * phrasing of the macro reference content — «القطع» appears nowhere in
 * the site's Arabic copy), same for «فوق الطبيعي» → «فوق المعدل
 * الصحي» (the BMI page's own intro vocabulary). Zero quota/price
 * claims are made here.
 *
 * Language pass (owner order 2026-11-21 — the SAME review scope, both
 * languages, every user-visible string of this bridge): the Arabic is
 * natural فصحى — no clitic possessive on the transliterated loanword
 * (the macro anchor reads «احسب توزيع الماكروز…», never the suffixed
 * loanword form), the BMI sub-lines read «تحدد لك هدفك اليومي من
 * السعرات… خططًا يومية جاهزة عند مستوى السعرات الأقرب إلى نتيجتك»,
 * and the lean-mass estimate and the macro calculator's function are
 * TWO separate sentences (clear split between what is estimated and
 * what the tool does). The English is natural professional copy
 * («works out your daily target…», «at the calorie level closest to
 * your number», «The macro calculator then splits… according to your
 * diet type») — never mechanical phrasing. The scientific accuracy of
 * §10 is untouched; the replaced phrasings are banned at source level
 * by the canary's language guard.
 *
 * The display component is src/components/ToolChainResultBridge.tsx
 * (rendered inside the calculators' FIRST result container — value
 * first, law 413). Guarded in src/lib/__tests__/tool-chain-bridge-p1d.test.ts
 * and the render proof tool-chain-bridge-render.test.tsx.
 */

/** Which side of the healthy range a BMI result sits on. */
export type BmiChainSegment = "below" | "normal" | "above";

/**
 * The healthy-range thresholds — the same WHO boundaries the BMI page's
 * own category logic and scale table use (18.5 / 25). Exported so the
 * canary can pin the page and the bridge to the same numbers (a drifted
 * threshold on either side breaks the test).
 */
export const BMI_CHAIN_HEALTHY_MIN = 18.5;
export const BMI_CHAIN_HEALTHY_MAX_BOUND = 25;

/** One chain link — href, destination id, render kind, both anchors. */
export interface ChainBridgeLink {
  /** Locale-aware URL (EN: /tools/… · AR: /ar/tools/… — SEO-GEO-4 law). */
  href: string;
  /** The destination id — also the GA4 event dimension. */
  destination: "calorie-calculator" | "macro-calculator" | "coaching";
  /** tool = free next step (pill button) · service = quiet text link. */
  kind: "tool" | "service";
  labelAr: string;
  labelEn: string;
}

/** The complete rendered model for one result's chain bridge. */
export interface ChainBridgeModel {
  titleAr: string;
  titleEn: string;
  subAr: string;
  subEn: string;
  /** Free-tool links — pill buttons (the P0-C bridge recipe). */
  toolLinks: ChainBridgeLink[];
  /** Quiet-line lead for the service links ("" when there are none). */
  serviceLeadAr: string;
  serviceLeadEn: string;
  /** Service links — faint contextual text (P0-E/P1-B precedent). */
  serviceLinks: ChainBridgeLink[];
}

/**
 * Which side of the healthy range the BMI sits on. Returns null for
 * invalid input (render nothing — never a broken section).
 */
export function bmiChainSegment(bmi: number): BmiChainSegment | null {
  if (!Number.isFinite(bmi) || bmi <= 0) return null;
  if (bmi < BMI_CHAIN_HEALTHY_MIN) return "below";
  if (bmi < BMI_CHAIN_HEALTHY_MAX_BOUND) return "normal";
  return "above";
}

/** The BMI segment copy — the roadmap's message, per segment. */
const BMI_COPY: Record<BmiChainSegment, Omit<ChainBridgeModel, "toolLinks" | "serviceLeadAr" | "serviceLeadEn" | "serviceLinks">> = {
  below: {
    titleAr: "وزنك تحت المعدل الصحي؟ ابدأ بخطة سعرات مستهدفة",
    titleEn: "Below the healthy range? Start with a targeted calorie plan",
    subAr: "حاسبة السعرات تحدد لك هدفك اليومي من السعرات لزيادة الوزن بفائض معتدل — ونتيجتها تعرض خططًا يومية جاهزة عند مستوى السعرات الأقرب إلى نتيجتك.",
    subEn: "The calorie calculator works out your daily target for gaining weight with a moderate surplus — and its result opens ready-made day plans at the calorie level closest to your number.",
  },
  normal: {
    titleAr: "وزنك داخل المعدل الصحي — حافظ عليه",
    titleEn: "In the healthy range — keep it there",
    subAr: "حاسبة السعرات تحدد لك هدفك اليومي من السعرات للحفاظ على وزنك الحالي — ونتيجتها تعرض خططًا يومية جاهزة عند مستوى السعرات الأقرب إلى نتيجتك.",
    subEn: "The calorie calculator works out your daily target to maintain your current weight — and its result opens ready-made day plans at the calorie level closest to your number.",
  },
  above: {
    titleAr: "وزنك فوق المعدل الصحي؟ ابدأ بخطة سعرات مستهدفة",
    titleEn: "Above the healthy range? Start with a targeted calorie plan",
    subAr: "حاسبة السعرات تحدد لك هدفك اليومي من السعرات للوصول إلى وزن صحي — ونتيجتها تعرض خططًا يومية جاهزة عند مستوى السعرات الأقرب إلى نتيجتك.",
    subEn: "The calorie calculator works out your daily target to reach a healthy weight — and its result opens ready-made day plans at the calorie level closest to your number.",
  },
};

/** The BMI chain link — the calorie calculator (07-§2 matrix row). */
export function bmiChainLinks(isAr: boolean): ChainBridgeLink[] {
  return [
    {
      href: `${isAr ? "/ar" : ""}/tools/calorie-calculator`,
      destination: "calorie-calculator",
      kind: "tool",
      labelAr: "ابدأ بحاسبة السعرات",
      labelEn: "Start with the calorie calculator",
    },
  ];
}

/** The body-fat chain links — the macro calculator + coaching. */
export function bodyFatChainLinks(isAr: boolean): ChainBridgeLink[] {
  return [
    {
      href: `${isAr ? "/ar" : ""}/tools/macro-calculator`,
      destination: "macro-calculator",
      kind: "tool",
      labelAr: "احسب توزيع الماكروز من سعراتك اليومية",
      labelEn: "Calculate your macros from your daily calories",
    },
    {
      href: `${isAr ? "/ar" : ""}/coaching`,
      destination: "coaching",
      kind: "service",
      labelAr: "التدريب الأونلاين",
      labelEn: "online coaching",
    },
  ];
}

/** The body-fat bridge copy — the doc's message in the site's vocabulary.
 * Owner review 2026-11-20 (honesty): the body-fat page's lean/fat masses
 * are ESTIMATES (weight inferred at BMI 22), and the macro calculator's
 * real inputs are daily calories + diet type — the sub-line states both
 * facts exactly, as TWO separate sentences ("المقدَّرة" · "توزّع سعراتك
 * اليومية … حسب نظامك الغذائي" / "estimated" · "splits your daily
 * calories … according to your diet type"), never "measured" and never
 * a weight/goal-based macro claim (language pass 2026-11-21: the
 * estimate and the tool's function are a period apart, never one
 * dashed claim). */
const BODY_FAT_COPY = {
  titleAr: "حافظ على عضلاتك أثناء خسارة الدهون",
  titleEn: "Keep your muscle while cutting",
  subAr: "كتلتك الصافية المقدَّرة تحتاج بروتينًا كافيًا يوميًا ليدافع عنها أثناء خسارة الدهون. وحاسبة الماكروز توزّع سعراتك اليومية على جرامات البروتين والكربوهيدرات والدهون حسب نظامك الغذائي.",
  subEn: "Your estimated lean mass needs enough daily protein to defend it through fat loss. The macro calculator then splits your daily calories into protein, carbohydrate and fat grams according to your diet type.",
  serviceLeadAr: "أو دع مدربًا خاصًا يرافقك خطوة بخطوة عبر",
  serviceLeadEn: "Or let a personal coach guide you step by step with",
} as const;

/**
 * The BMI result's chain bridge — null for an invalid number (the
 * component renders nothing; never a broken section).
 */
export function bmiChainBridge(
  bmi: number,
  isAr: boolean,
): ChainBridgeModel | null {
  const segment = bmiChainSegment(bmi);
  if (!segment) return null;
  return {
    ...BMI_COPY[segment],
    toolLinks: bmiChainLinks(isAr),
    serviceLeadAr: "",
    serviceLeadEn: "",
    serviceLinks: [],
  };
}

/** The body-fat result's chain bridge (message is goal-agnostic). */
export function bodyFatChainBridge(isAr: boolean): ChainBridgeModel {
  return {
    titleAr: BODY_FAT_COPY.titleAr,
    titleEn: BODY_FAT_COPY.titleEn,
    subAr: BODY_FAT_COPY.subAr,
    subEn: BODY_FAT_COPY.subEn,
    toolLinks: bodyFatChainLinks(isAr).filter((l) => l.kind === "tool"),
    serviceLeadAr: BODY_FAT_COPY.serviceLeadAr,
    serviceLeadEn: BODY_FAT_COPY.serviceLeadEn,
    serviceLinks: bodyFatChainLinks(isAr).filter((l) => l.kind === "service"),
  };
}
