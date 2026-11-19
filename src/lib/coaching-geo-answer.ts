/**
 * src/lib/coaching-geo-answer.ts — the /coaching GEO direct-answer
 * block (ORGANIC-GROWTH-P1-A, organic-growth 09-§3.1:
 * «كم تكلفة المدرب أونلاين؟» — قسم التسعير).
 *
 * The roadmap places this answer at the pricing section; the block
 * renders at the TOP of the pricing section (id="coaching-pricing")
 * in the 40-60 word GEO template (09-§1) plus the sources line
 * (09-§3.2: the pricing's published source).
 *
 * Every number verified against src/lib/memberships.ts (the single
 * pricing source — re-verified 2026-11-20): coaching $39.99/mo or
 * $359/yr (every Pro feature + the personal coach) · pro $29.99 →
 * the $10/month difference is pure arithmetic from the same source
 * (the page's own cost-anchor copy) · free tier keeps the tools, EVO
 * chat 10/day, and 3 saved results.
 */

export interface CoachingGeoBlock {
  qEn: string;
  qAr: string;
  aEn: string;
  aAr: string;
  sourcesEn: string;
  sourcesAr: string;
}

export const COACHING_GEO_BLOCK: CoachingGeoBlock = {
  qEn: "How much does an online coach cost?",
  qAr: "كم تكلفة المدرب أونلاين؟",
  aEn:
    "An online coach on Alkemos costs $39.99 a month or $359 a year — one plan including every Pro feature plus a personal coach who builds your plans, checks in weekly, and adjusts by hand. The difference from Pro is $10 a month ($39.99 versus $29.99); below both, a free account keeps the tools, EVO chat, and three saved results.",
  aAr:
    "تكلفة المدرب أونلاين في Alkemos هي 39.99 دولارًا شهريًا أو 359 دولارات سنويًا — باقة واحدة تشمل كل مزايا برو مع مدرب خاص يبني خططك ويتابعك أسبوعيًا ويعدّل بيده. والفرق عن برو عشرة دولارات شهريًا (39.99 مقابل 29.99)؛ وتحتهما يحتفظ الحساب المجاني بالأدوات ومحادثة EVO وثلاث حفظات.",
  sourcesEn:
    "Sources: Alkemos published pricing (memberships page) — Coaching $39.99/month or $359/year · Pro $29.99, every Pro feature included.",
  sourcesAr:
    "المصادر: تسعير Alkemos المنشور بصفحة العضويات — التدريب 39.99 دولارًا شهريًا أو 359 سنويًا · برو 29.99، وكل مزايا برو مشمولة.",
};
