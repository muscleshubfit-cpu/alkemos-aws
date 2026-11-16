/**
 * src/lib/quality-repair/defect-report.ts
 *
 * AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16 — «افتح مهمة مستقلة
 * لمعالجة قصور منظومة إصلاح جودة المحتوى في محركات التوليد»).
 *
 * THE GAP THIS CLOSES (live evidence — scheduled AR run التشغيلة العربية المجدولة (16 نوفمبر 2026) on
 * c286e06e, plus 8 of the last 13 AR runs before 2026-11-16): the
 * quality layer DETECTS defects (blog-msa scanners, P0-P5 gates,
 * recipes gates, plan validators) and REJECTS content, but the repair
 * toolbox was never told WHAT was found or HOW to fix it — the review
 * retry re-read the identical prompt, reproduced the identical
 * «حاجة»×1 weak marker, and died identically at the
 * `weak markers did not improve (1 → 1)` clause (blog-msa.ts:489).
 *
 * This module is the SHARED, engine-agnostic defect contract: a
 * deterministic scanner output is turned into a structured report —
 * kind + WHERE (the offending marker and its count) + WHY it is a
 * defect + a directly actionable FIX instruction. Every generation
 * domain (blog · recipes · ai_jobs single-shot · EVO chat) reports
 * defects through the same shape so the repair loop can pick the right
 * repairer and the honest-failure record can name what could not be
 * fixed and why.
 *
 * Pure leaf module: no DB, no network, no AI — unit-testable alone.
 */

import {
  scanArabicDialect,
  scanLatinContamination,
  type DialectScan,
  type LatinContaminationScan,
} from "@/lib/blog-msa";

/** Defect classes the unified loop knows how to NAME. Engine-specific
 * gates keep their own messages; anything they surface maps onto one of
 * these kinds for the shared ledger. */
export type QualityDefectKind =
  | "dialect-strong" // unambiguous colloquial Arabic (blog-msa STRONG set)
  | "dialect-weak" // colloquial-leaning / MSA-ambiguous (WEAK set)
  | "latin-token" // bare Latin tokens inside Arabic prose (Phase 176)
  | "language" // reply/article language ≠ the requested language
  | "structure" // shape/contract violations (sections, counts, lengths)
  | "content"; // engine-specific content rules (halal, claims, grounding)

export interface QualityDefect {
  kind: QualityDefectKind;
  /** WHERE — the offending token(s) with live counts («حاجة×1»). */
  location: string;
  /** WHY — one line naming the violated law. */
  cause: string;
  /** HOW — the actionable repair instruction (prompt-ready). */
  fixInstruction: string;
}

/**
 * Deterministic dialect scan → structured defects. STRONG hits are
 * always repair-blocking; WEAK hits ride the same scanner the live
 * validateMsaConversion clause grades (any weak>0 input demands strict
 * improvement), so the loop treats them as repairable targets too.
 */
export function dialectDefectsFromScan(scan: DialectScan): QualityDefect[] {
  const defects: QualityDefect[] = [];
  for (const [marker, count] of scan.strongHits) {
    defects.push({
      kind: "dialect-strong",
      location: `${marker}×${count}`,
      cause: "علامة عامية قوية غير مقبولة في الفصحى الحديثة (قانون MSA — مجموعة STRONG)",
      fixInstruction: `استبدل «${marker}» بمقابلها في العربية الفصحى الحديثة بما يناسب سياق الجملة`,
    });
  }
  for (const [marker, count] of scan.weakHits) {
    defects.push({
      kind: "dialect-weak",
      location: `${marker}×${count}`,
      cause: "مؤشر عامية ضعيف (مجموعة WEAK) — بوابة التحويل تطلب تحسنًا صارمًا عند وجوده",
      fixInstruction: `استبدل «${marker}» بمقابل الفصحى المناسب للسياق`,
    });
  }
  return defects;
}

/** Latin contamination scan → structured defects (Phase-176 class). */
export function latinDefectsFromScan(scan: LatinContaminationScan): QualityDefect[] {
  return scan.tokens.map((token) => ({
    kind: "latin-token" as const,
    location: token,
    cause: "توكن لاتيني سائب داخل نثر عربي (قانون 176)",
    fixInstruction: `استبدل «${token}» بمقابله العربي أو تعريبه الصوتي (الإشارة بين قوسين بعد المصطلح تبقى مقبولة)`,
  }));
}

/** EVO-chat language mismatch → one defect the repair directive names. */
export function languageDefect(detected: string, expected: "ar" | "en"): QualityDefect {
  return {
    kind: "language",
    location: detected,
    cause: `لغة الرد (${detected}) لا تطابق اللغة المطلوبة (${expected})`,
    fixInstruction:
      expected === "ar"
        ? "أعد الصياغة بالعربية الفصحى الحديثة السهلة كاملةً من أول كلمة لآخر كلمة"
        : "Rewrite the entire reply in clear English from the first word to the last",
  };
}

/** One prompt-ready line for a defect set (feeds repair directives and
 * the honest unfixable record). */
export function summarizeDefects(defects: QualityDefect[]): string {
  if (defects.length === 0) return "";
  return defects
    .map((d) => `[${d.kind}] ${d.location} — ${d.fixInstruction}`)
    .join(" ; ")
    .slice(0, 1500);
}

/** Full AR prose assessment (dialect + latin) in one call — the shared
 * `assess` used by the blog/recipes surfaces. */
export function assessArabicProse(md: string): {
  dialectScan: DialectScan;
  latinScan: LatinContaminationScan;
  defects: QualityDefect[];
} {
  const dialectScan = scanArabicDialect(md);
  const latinScan = scanLatinContamination(md);
  return {
    dialectScan,
    latinScan,
    defects: [...dialectDefectsFromScan(dialectScan), ...latinDefectsFromScan(latinScan)],
  };
}
