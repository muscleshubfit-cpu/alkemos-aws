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
 *     - Body-fat → ONE tool link (the macro calculator — adequate daily
 *       protein helps preserve lean mass, and the macro calculator
 *       distributes the entered daily calories among macro grams by the
 *       chosen diet; it takes NO weight and NO lean-mass input and
 *       computes no protein need from the lean mass — owner reviews
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
 * distributes the visitor's ENTERED daily calories among protein/carb/fat
 * grams by the chosen diet preset — its only inputs are calories +
 * diet type, it consumes no weight and no lean mass; coaching is human
 * supervision). The body-fat page's fat/lean masses are ESTIMATES from
 * a weight inferred at a healthy-midpoint BMI of 22 — the page's own
 * cards carry the «(تقديرية)/(est.)» qualifier with the estimate-basis
 * note (owner review 2026-11-20; pinned on the page by the canary), and
 * the bridge copy never calls them «measured» and never derives a
 * protein requirement from them (owner wording review 2026-11-20: the
 * protein sentence states the general fact — adequate intake helps
 * preserve lean mass — no computed need). The doc's literal wording «حافظ على عضلاتك
 * أثناء القطع» was adapted to
 * the site's own published vocabulary «خسارة الدهون» (the fat-loss
 * phrasing of the macro reference content — «القطع» appears nowhere in
 * the site's Arabic copy), same for «فوق الطبيعي» → «فوق المعدل
 * الصحي» (the BMI page's own intro vocabulary). Zero quota/price
 * claims are made here.
 *
 * Language pass (owner orders 2026-11-20 — the SAME review scope, both
 * languages, every user-visible string of this bridge): the Arabic is
 * natural فصحى — no clitic possessive on the transliterated loanword
 * (the macro anchor reads «احسب توزيع الماكروز…», never the suffixed
 * loanword form), the BMI sub-lines read «تحدد لك هدفك اليومي من
 * السعرات… خططًا يومية جاهزة عند مستوى السعرات الأقرب إلى هذا الهدف»
 * (the nearest level refers to the explicit calorie target, never an
 * ambiguous «number/result»), and the protein sentence states the
 * general fact without deriving a requirement from the lean mass
 * («يساعد تناول كمية مناسبة من البروتين يوميًا على الحفاظ على الكتلة
 * الصافية أثناء خسارة الدهون») — the general guidance and the macro
 * calculator's function are TWO separate sentences (a clear split
 * between what is general advice and what the tool does). The English
 * is natural professional copy («works out your daily target…», «at
 * the calorie level closest to that target», "Preserve muscle while
 * losing fat", "Adequate protein intake can help preserve lean mass
 * during fat loss. The macro calculator distributes your daily
 * calories among protein, carbohydrates, and fats according to your
 * selected diet.") — never mechanical phrasing and never a
 * lean-mass-derived protein claim. The scientific accuracy of §10 is
 * untouched; every replaced phrasing is banned at source level by the
 * canary's language guard.
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
    subAr: "حاسبة السعرات تحدد لك هدفك اليومي من السعرات لزيادة الوزن بفائض معتدل — ونتيجتها تعرض خططًا يومية جاهزة عند مستوى السعرات الأقرب إلى هذا الهدف.",
    subEn: "The calorie calculator works out your daily target for gaining weight with a moderate surplus — and its result opens ready-made day plans at the calorie level closest to that target.",
  },
  normal: {
    titleAr: "وزنك داخل المعدل الصحي — حافظ عليه",
    titleEn: "In the healthy range — keep it there",
    subAr: "حاسبة السعرات تحدد لك هدفك اليومي من السعرات للحفاظ على وزنك الحالي — ونتيجتها تعرض خططًا يومية جاهزة عند مستوى السعرات الأقرب إلى هذا الهدف.",
    subEn: "The calorie calculator works out your daily target to maintain your current weight — and its result opens ready-made day plans at the calorie level closest to that target.",
  },
  above: {
    titleAr: "وزنك فوق المعدل الصحي؟ ابدأ بخطة سعرات مستهدفة",
    titleEn: "Above the healthy range? Start with a targeted calorie plan",
    subAr: "حاسبة السعرات تحدد لك هدفك اليومي من السعرات للوصول إلى وزن صحي — ونتيجتها تعرض خططًا يومية جاهزة عند مستوى السعرات الأقرب إلى هذا الهدف.",
    subEn: "The calorie calculator works out your daily target to reach a healthy weight — and its result opens ready-made day plans at the calorie level closest to that target.",
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
 * are ESTIMATES (weight inferred at BMI 22 — the qualifier lives on the
 * page's own cards), and the macro calculator's real inputs are daily
 * calories + diet type. The final wording (owner wording review
 * 2026-11-20) states the general protein fact WITHOUT deriving a
 * requirement from the lean mass ("يساعد تناول كمية مناسبة من البروتين
 * يوميًا…" / "Adequate protein intake can help preserve lean mass…")
 * and the tool's actual function ("توزيع سعراتك اليومية على جرامات …
 * وفقًا لنظامك الغذائي" / "distributes your daily calories among
 * protein, carbohydrates, and fats according to your selected diet")
 * — TWO separate sentences, never one dashed claim, never "measured",
 * never a lean-mass-derived protein need. */
const BODY_FAT_COPY = {
  titleAr: "حافظ على عضلاتك أثناء خسارة الدهون",
  titleEn: "Preserve muscle while losing fat",
  subAr: "يساعد تناول كمية مناسبة من البروتين يوميًا على الحفاظ على الكتلة الصافية أثناء خسارة الدهون. وتتيح لك حاسبة الماكروز توزيع سعراتك اليومية على جرامات البروتين والكربوهيدرات والدهون وفقًا لنظامك الغذائي.",
  subEn: "Adequate protein intake can help preserve lean mass during fat loss. The macro calculator distributes your daily calories among protein, carbohydrates, and fats according to your selected diet.",
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
