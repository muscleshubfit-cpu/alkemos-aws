/**
 * src/lib/affiliate-faq.ts — the /affiliate FAQ, single source (EN + AR).
 *
 * ORGANIC-GROWTH-P0-E (2026-11-19, roadmap
 * docs/organic-growth-system-2026-11-18/10 field 4: «FAQPage (4-6 أسئلة:
 * العمولة/الصرف/الكوكيز/التحويلات المؤهلة)»): the five affiliate FAQ
 * items lived as inline literals inside AffiliateProgramView's getCopy() —
 * readable in the DOM but with NO FAQPage JSON-LD on either language
 * surface (F-8: «صفر schema»). The texts moved here VERBATIM so:
 *   - the view (client) renders the FAQ from the same array;
 *   - each language layout (server) emits a FAQPage JSON-LD built from
 *     it — the answers become machine-readable in the SERVER HTML, which
 *     is the surface non-JS crawlers (AI answer engines) actually read.
 * (the memberships-faq.ts / coaching-faq.ts precedent, BILINGUAL-CONTENT
 * Phase 2 — verbatim move law.)
 *
 * The ONE addition (roadmap field 4 names the four subjects
 * العمولة/الصرف/الكوكيز/التحويلات المؤهلة; the five moved questions
 * cover three of them — payout, refund/eligibility, cookie attribution):
 * the commission-rate question. Every number in its answer is already
 * published on this page (20% = COMMISSION_RATE in
 * affiliate-constants.ts; $3.00/$6.00/$8.00 commissions on the
 * $14.99/$29.99/$39.99 plans — the commission section + how-it-works
 * step 6) — zero new claims (§12.50 honesty law).
 *
 * Numerical-parity law (roadmap P0-E field 9: «النصان متطابقان رقميًا»):
 * the EN and AR arrays carry the SAME number set — pinned by the
 * affiliate-p0e canary (src/lib/__tests__/affiliate-p0e.test.ts).
 *
 * Note (SEO-SCHEMA-REFERENCE, May 2026): Google retired FAQ rich results;
 * this schema is GEO-only value (AI answer engines still parse JSON-LD) —
 * the repo's documented decision, same as coaching-faq.ts and
 * memberships-faq.ts.
 */

export type AffiliateFaqItem = { q: string; a: string };

export const AFFILIATE_FAQ: Record<"en" | "ar", AffiliateFaqItem[]> = {
  ar: [
    {
      q: "كم تكلفة الانضمام إلى البرنامج؟",
      a: "الانضمام مجاني تمامًا: يكفي حساب Alkemos مجاني، ويُنشأ رابطك الشخصي تلقائيًا في لوحتك دون رسوم تسجيل أو اشتراك. العمولة تُحسب على عمليات الشراء المؤهلة فقط، ولا توجد أي التزامات شهرية على الشريك.",
    },
    {
      // P0-E addition — the commission-rate question (roadmap field 4
      // subject #1 «العمولة»); numbers already on the page (commission
      // section + how-it-works step 6). Byte-style follows the same AR
      // forms the page already uses («3.00$», «(14.99$)»).
      q: "كم نسبة العمولة التي أكسبها؟",
      a: "تكسب 20% من قيمة أي اشتراك مؤهل يُسجَّل عبر رابطك ويجري تأكيد دفعه — مثلًا: 3.00$ من عضوية بريميوم (14.99$)، و6.00$ من عضوية برو (29.99$)، و8.00$ من اشتراك التدريب الأونلاين (39.99$). تُحتسب العمولة على عمليات الشراء المؤهلة فقط.",
    },
    {
      q: "متى وكيف أستلم أرباحي؟",
      a: "تظهر العمولة في لوحتك لحظة تأكيد دفع الاشتراك المؤهل، ويُتاح سحبها بعد انقضاء نافذة الاسترداد. عندما يبلغ رصيدك المتاح الحد الأدنى للصرف وهو 10 دولارات، تطلب الصرف من لوحتك بأحد الطرق المتاحة (محفظة إلكترونية أو تحويل بنكي أو خصم من قيمة اشتراكك)، ثم يراجع فريق Alkemos الطلب ويُنفّذه. لا صرف تلقائيًا بلا طلب — أنت من يحدد التوقيت.",
    },
    {
      q: "ماذا يحدث إذا استرد المشتري قيمته؟",
      a: "تُحفظ عمولات الاشتراكات طوال نافذة استرداد مدتها سبعة أيام قبل توافرها للصرف؛ فإن استرد المشتري قيمته داخل النافذة تُعكس العمولة تلقائيًا. بهذا تُبنى أرباحك على مدفوعات فعلية بقيت فعلية — لا عمولات على عمليات ملغاة.",
    },
    {
      q: "هل يتتبع الرابط الزائر إن اشترى بعد مدة؟",
      a: "نعم — التتبع على مستويين: من يسجّل حسابًا عبر رابطك يظل مرتبطًا بإحالتك ربطًا دائمًا (النقرة الأولى تحسم النسبة)، وعمليات الشراء المؤهلة اللاحقة من ذلك الحساب تُحتسب لك، بينما تغطي آلية الكوكيز البالغة 30 يومًا منتجات وخدمات الدفع لمرة واحدة.",
    },
    {
      q: "هل أحتاج إلى أن أكون مدربًا أو صاحب جمهور كبير؟",
      a: "لا — البرنامج مفتوح لأي مستخدم يصل إلى جمهور مهتم فعلًا باللياقة والتغذية: صنّاع محتوى ومدربين ومشرفي مجموعات ومدونين ومالكي مواقع. القاعدة الوحيدة الملزمة: التوصية لجمهور حقيقي مهتم؛ فالممارسات المزعجة أو الإرسال الجماعي غير المرغوب فيه يعرّضان الحساب للإيقاف.",
    },
  ],
  en: [
    {
      q: "How much does it cost to join the program?",
      a: "Nothing — a free Alkemos account is all you need: your personal tracking link is generated automatically in your dashboard, with no sign-up fee and no subscription. Commissions are earned on eligible purchases only; the program itself carries no monthly obligations for partners.",
    },
    {
      // P0-E addition — the commission-rate question (roadmap field 4
      // subject #1 «العمولة»); numbers already on the page (commission
      // section + how-it-works step 6).
      q: "How much commission do I earn?",
      a: "You earn 20% of any qualifying subscription purchased through your link and verified — for example: $3.00 from a $14.99 Premium membership, $6.00 from a $29.99 Pro membership, and $8.00 from a $39.99 Personal Coaching subscription. The commission applies to eligible purchases only.",
    },
    {
      q: "When and how do I get paid?",
      a: "A commission appears on your dashboard the moment an eligible subscription payment is confirmed, and becomes withdrawable after the refund window passes. Once your available balance reaches the $10 minimum payout, you request the payout from your dashboard via one of the available methods (mobile wallet, bank transfer, or subscription discount), and the Alkemos team reviews and processes it. Nothing pays out automatically without your request — you control the timing.",
    },
    {
      q: "What happens if the buyer asks for a refund?",
      a: "Subscription commissions are held for a 7-day refund window before they become withdrawable; if the buyer is refunded inside that window, the commission is reversed automatically. Your earnings are therefore always built on payments that actually stuck — never on cancelled orders.",
    },
    {
      q: "Does my link still count if the visitor buys later?",
      a: "Yes — attribution works on two levels: anyone who signs up through your link stays permanently tied to your referral (the first click wins), so their later eligible purchases count for you, while one-time products and services are covered by the 30-day cookie mechanism.",
    },
    {
      q: "Do I need to be a coach or have a big audience?",
      a: "No — the program is open to any user who reaches a genuinely interested fitness and nutrition audience: content creators, coaches, community admins, bloggers, and website owners. The one binding rule: recommend to a real, interested audience — spam practices or unsolicited mass-messaging put the account at risk of suspension.",
    },
  ],
};
