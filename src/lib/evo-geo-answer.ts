/**
 * src/lib/evo-geo-answer.ts — the /evo GEO direct-answer block
 * (ORGANIC-GROWTH-P1-A, organic-growth 09-§3.1: «هل EVO مجاني؟»).
 *
 * The roadmap's mechanism for EVO is «FAQ الموجود يُعاد ترتيبه» — the
 * existing FAQ (src/lib/evo-faq.ts) ALREADY leads with this question in
 * both languages (order pinned by the P1-A canary so it can never
 * regress); this block makes the same answer extractable as the FIRST
 * content section after the hero, in the 40-60 word GEO template
 * (09-§1 — the Yotpo/Princeton synthesis), plus the sources line
 * (09-§3.2: the quotas' published source).
 *
 * Every number verified against src/lib/memberships.ts (the single
 * pricing/quota source — re-verified 2026-11-20, completion order):
 * free chat 10/day · generations 4/8/8 monthly (premium/pro/coaching)
 * · ONE unified swap quota 8/16/16 · unlimited chat + memory +
 * cross-device history restore on paid tiers.
 */

export interface EvoGeoBlock {
  qEn: string;
  qAr: string;
  aEn: string;
  aAr: string;
  sourcesEn: string;
  sourcesAr: string;
}

export const EVO_GEO_BLOCK: EvoGeoBlock = {
  qEn: "Is EVO free?",
  qAr: "هل EVO مجاني؟",
  aEn:
    "Yes — EVO is free for everyone: 10 messages a day with answers, guidance, and fitness math, no signup needed. Plan generation and swaps are subscriber features: 4 generations a month on Premium, 8 on Pro and Coaching, and one unified swap quota of 8 or 16 a month. Subscribers also get unlimited chat, persistent memory, and full history restore.",
  aAr:
    "نعم — EVO مجاني للجميع: 10 رسائل يوميًا بإجابات وتوجيه وحل الحسابات، بلا تسجيل. أما توليد الخطط والتبديلات فميزة مشتركين: 4 توليدات شهريًا مع بريميوم و8 مع برو والتدريب، وحصة تبديلات موحدة 8 أو 16 شهريًا. ويحصل المشتركون أيضًا على محادثة غير محدودة وذاكرة دائمة واسترجاع السجل كاملًا.",
  sourcesEn:
    "Sources: Alkemos published plan quotas (memberships page) — 10 messages/day free · generations 4/8/8 monthly · swaps 8/16/16.",
  sourcesAr:
    "المصادر: حصص باقات Alkemos المنشورة بصفحة العضويات — 10 رسائل يوميًا مجانًا · التوليد 4/8/8 شهريًا · التبديلات 8/16/16.",
};
