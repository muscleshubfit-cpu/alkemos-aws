/**
 * src/lib/memberships-faq.ts — the /memberships FAQ, single source (EN + AR).
 *
 * BILINGUAL-CONTENT-SEO-GEO Phase 2 (owner order 2026-11-04 «ابدأ المرحلة
 * الثانية», audit §3 item 1): the seven memberships FAQ items lived as
 * inline literals inside src/app/(en)/memberships/page.tsx — readable in
 * the DOM but with NO FAQPage JSON-LD on either language, while /coaching
 * already serves one (the coaching-faq.ts precedent, CONTENT-AUDIT P1-2).
 * The texts moved here VERBATIM (owner instruction: «حافظ على الأسئلة
 * الشائعة الحالية حرفيًا عند نقلها إلى مصدر مشترك، ما لم يكشف الفحص عن
 * خطأ فعلي») so:
 *   - the page (client) renders the FAQ from the same array;
 *   - each language surface (server) emits a FAQPage JSON-LD built from
 *     it — the answers become machine-readable in the SERVER HTML, which
 *     is the surface non-JS crawlers (AI answer engines) actually read.
 *
 * The ONE verified actual error fixed in the move (audit item أ-2 class —
 * Latin mixing on an Arabic surface): AR question 3 said «مشمول في Pro»
 * (Latin) while its own answer and every other surface say «برو» — now
 * «مشمول في برو». Zero other character changes.
 *
 * Note (SEO-SCHEMA-REFERENCE, May 2026): Google retired FAQ rich results;
 * this schema is GEO-only value (AI answer engines still parse JSON-LD) —
 * the repo's documented decision, same as coaching-faq.ts.
 */

export type MembershipsFaqItem = { q: string; a: string };

export const MEMBERSHIPS_FAQ: Record<"en" | "ar", MembershipsFaqItem[]> = {
  en: [
    {
      q: "Can I cancel anytime?",
      a: "Yes — on your account page press “Cancel subscription”. Nothing auto-renews: your plan stays active until the period you paid for ends, then simply stops unless you pay again.",
    },
    {
      q: "Is there a refund policy?",
      a: "Yes, full refund within 7 days of activation, provided no paid features (plan generation, swaps, saved results) have been used.",
    },
    {
      q: "Is coaching included in Pro?",
      a: "No, coaching is completely separate from memberships. Pro gives you platform features, coaching gives you a personal coach.",
    },
    {
      q: "Is there a free trial?",
      a: "The product itself is the experience: every library, tool and calculator is free forever, plus 10 EVO messages a day. AI plan generation & swaps are subscriber features (Premium and above) with monthly quotas — subscribe and generate your first plan instantly.",
    },
    {
      q: "Payment methods?",
      a: "PayPal (primary — instant and secure), InstaPay, and Vodafone Cash. PayPal processes automatically; manual methods require uploading a receipt reviewed within 24 hours.",
    },
    // PRIORITY-PAGES Implementation 3 (2026-10-19, audit §C-1): the two
    // lifecycle questions the page never answered — what happens to my
    // plans, and can I change tiers. Facts: plans are data, not quota
    // (plan-persistence law); no auto-renew; limits derive from the
    // ACTIVE tier (membership-tier.ts) so a mid-cycle upgrade applies its
    // higher limits immediately.
    {
      q: "What happens to my plans when my subscription ends?",
      a: "Every plan you generated or saved stays visible and accessible as-is — plans are data, not quota. What returns to the free-tier limits is new generation and swap counts, until you renew. And there's no auto-charge: your plan stays active until the paid period ends, then simply stops.",
    },
    {
      q: "Can I change my plan later?",
      a: "Yes, with no commitment: nothing auto-renews and there are no contracts — next cycle, pick any tier or stay on Free. And upgrading at any moment applies the higher tier's limits immediately, because limits derive from your active tier.",
    },
  ],
  ar: [
    {
      q: "هل يمكنني الإلغاء في أي وقت؟",
      a: "نعم — من صفحة حسابك اضغط «إلغاء الاشتراك» وانتهى الأمر. لا خصم تلقائي: تبقى باقتك فعّالة حتى نهاية المدة التي دفعتها، ثم تتوقف إن لم تُجدّدها بنفسك.",
    },
    {
      q: "هل توجد سياسة استرداد؟",
      a: "نعم — استرداد كامل خلال 7 أيام من التفعيل، ما لم تكن قد استخدمت المزايا المدفوعة (توليد خطط، تبديلات، حفظ نتائج).",
    },
    {
      // BILINGUAL-CONTENT Phase 2 (2026-11-04): the only verified actual
      // error in the verbatim move — «مشمول في Pro» (Latin) → «مشمول في برو»,
      // matching the answer below and every other Arabic surface (the
      // audit's Latin-mixing law أ-2). EN twin untouched.
      q: "هل التدريب الأونلاين مشمول في برو؟",
      a: "لا — التدريب الأونلاين خدمة منفصلة تمامًا عن العضويات: برو يمنحك مزايا المنصة كاملة، والتدريب الأونلاين يضيف إليها مدربًا خاصًا يتابعك شخصيًا (ويشمل كل مزايا برو).",
    },
    {
      q: "هل توجد تجربة مجانية؟",
      a: "التجربة هي المنتج نفسه: كل مكتبة وأداة وحاسبة مجانية للأبد، مع 10 رسائل يوميًا مع EVO. وتوليد الخطط والتبديلات بالذكاء الاصطناعي ميزة لمشتركي بريميوم وأعلى بحصص شهرية — اشترك وولّد خطتك الأولى فورًا.",
    },
    {
      q: "ما هي طرق الدفع؟",
      a: "PayPal (الطريقة الرئيسية — فورية وآمنة)، إضافة إلى InstaPay و Vodafone Cash. تُعالج مدفوعات PayPal تلقائيًا، أما الطرق اليدوية فتتطلب رفع إيصال يراجعه فريقنا خلال 24 ساعة.",
    },
    // PRIORITY-PAGES Implementation 3 (2026-10-19, audit §C-1): المرآتان
    // العربيتان للسؤالين أعلاه — نفس الحقائق الموثقة.
    {
      q: "ماذا يحدث لخططي إذا انتهى اشتراكي؟",
      a: "تبقى كل خطة ولّدتها أو حفظتها مرئية ومتاحة كما هي — الخطط بياناتك، لا حصة تُستهلك. ما يعود إلى حدود المجاني هو التوليد الجديد وعدد التبديلات، حتى تجدد إن أردت. ولا خصم تلقائي: تبقى باقتك فعّالة حتى نهاية المدة المدفوعة، ثم تتوقف.",
    },
    {
      q: "هل أستطيع تغيير الباقة لاحقًا؟",
      a: "نعم، وبلا أي التزام — لا تجديد تلقائي ولا عقود: في الدورة التالية اختر ما تشاء أو ابقَ على المجاني. وحين ترتقي في أي لحظة تسري حدود الباقة الأعلى فورًا، لأن الحدود تُشتق من باقتك الفعّالة.",
    },
  ],
};
