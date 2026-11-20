# 12 — المصادر والأدلة (Sources & Evidence)

> **القاعدة:** كل ادعاء في هذا المشروع يعود إلى أحد المصادر أدناه بتاريخه **وبرابطه المباشر حيثما كان خارجيًا**. المصادر الداخلية = ملفات المستودع عند HEAD ‏90b2f242 (فحص 2026-11-18). المصادر الخارجية = مقروءة حية بتاريخ 2026-11-18 عبر بحث الويب (عناوين النتائج ومقتطفاتها وروابطها) **وأُعيد التحقق من روابطها المباشرة في جلسة تحديث 2026-11-18**. **قسم القياسات الجارية (§4) هو السجل الحي لأي قراءة لاحقة.**

---

## 1. مصادر داخلية (المستودع — قراءة مباشرة)

| المصدر | ما يوثق |
|---|---|
| `src/app/metadata.ts` + `(ar)/ar/layout.tsx` | الافتراضيات والقالب العربي |
| `(en|ar)` ملفات layout/page لكل سطح P0 (البيتاداتا والسكيما) — التفصيل الكامل بتدقيق الميتاداتا الداخلي | نصوص العناوين/الأوصاف/hreflang/JSON-LD الحرفية المستشهد بها في 01 |
| `src/lib/seo.ts` · `tool-schema.ts` · `tools-shared.ts` · `memberships.ts` · `tier-limits.ts` | السكيما المشتركة · جرد الأدوات · الأسعار والحدود |
| `src/components/SiteHeader.tsx` · `SiteFooter.tsx` · `views/LandingView.tsx` (+Islands/DynamicIslands) · `OtherTools.tsx` · `LeadCaptureCard.tsx` · `SaveResultButton.tsx` · `EvoFloatingWidget.tsx` | خريطة الروابط والتحويل (07) |
| `src/app/sitemap-*.xml/route.ts` · `public/robots.txt` | الفهرسة (01-§3) |
| `docs/PERFORMANCE-AUDIT-2026-11-08.md` (+ تنفيذ 452 الموثق بSTATE) | كل أرقام الأداء في 01-§5 |
| `docs/seo-growth-audit-2026-11-05/04-keywords-competitors.md` + `data/2026-11-05-live-measurements.md` | قياسات GSC التاريخية (تشغيلتا #8/#9) وفحوص SERP ‏11-05 والجرد |
| `docs/CONVERSION-COMPETITOR-STUDY-2026-11-04.md` | دراسة منافسي التحويل الثمانية وأنماطهم |
| `docs/seo-collapse-investigation-2026-11-18/` (README + الملحق) | **خط الأساس التاريخي فقط:** 6,896/16 · آخر 28 يومًا ‏53 · غير براندي ‏3,925/0 · مواقع مرجحة 82.1/17.4/9.3 · جرد خرائط محدث — (مشروع مستقل: لا يعتمد هذا المشروع على استنتاجاته) |
| `docs/GSC-RE-AUDIT-2026-11-12.md` | قدرات GSC الموثقة (حصة 2,000/يوم · قراءة-فقط) |
| `docs/SEO-CWV-THRESHOLDS.md` | عتبات CWV ‏2026 |
| `STATE.md` + `AGENTS.md` + `docs/CI_GATES.md` | القوانين الحاكمة (الأمانة · الكاناري · الرئيسية اكتشاف · قرارات المالك الموثقة المشار إليها بD-أ إلى D-ج بعد تحديث 2026-11-18) |
| `worklog.md` (مدخلا 2026-11-18: التسليم الأصلي + جلسة تحديث القرارات) + بنية `archive/WORKLOG_ARCHIVE.md` | حوكمية الإضافة والتحديث |

## 2. مصادر خارجية — مقروءة ومُتحقق من روابطها المباشرة بتاريخ 2026-11-18

### 2.1 بحوث GEO/AEO/AIO (مؤرخة — روابط مباشرة قابلة للفتح)
| المصدر | الرابط المباشر | الاستخدام |
|---|---|---|
| Ahrefs — «Update: AI Overviews Reduce Clicks by 58%» (Ryan Law، 4 فبراير 2026؛ بيانات ديسمبر 2025: -58% للموضع الأول مقابل -34.5% في أبريل 2025 — وتوثق الصفحة نفسها التأكيدات: Seer 49.4-65.2% · Authoritas 47.5% ديسكتوب/37.7% موبايل · Kevin Indig >50%) | https://ahrefs.com/blog/ai-overviews-reduce-clicks-update | 09-§1 (F-7) |
| Pew Research — «Google users are less likely to click on links when an AI summary appears in the results» (22 يوليو 2025: 8% مقابل 15% نسبة النقر مع/بلا ملخص AI — عينة 900 بالغ أمريكي و68,879 بحثًا) | https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/ | 09-§1 |
| Semrush — «Semrush Report: AI Overviews' Impact on Search in 2025» (15 ديسمبر 2025: 6.49% يناير → ~25% يوليو → 15.69% نوفمبر 2025 على قاعدة 10 ملايين كلمة) | https://www.semrush.com/blog/semrush-ai-overviews-study | 09-§1 |
| Seer Interactive — «AIO Impact on Google CTR: September 2025 Update» (CTR عضوي لاستعلامات AIO: 1.76% يونيو 2024 → 0.61% سبتمبر 2025 = -61%) | https://www.seerinteractive.com/insights/aio-impact-on-google-ctr-september-2025-update | 09-§1 |
| Princeton/Georgia Tech/Allen AI — ورقة «GEO: Generative Engine Optimization» (Aggarwal وآخرون — KDD 2024؛ «Fact Density» ترفع ظهور المواقع الأدنى ترتيبًا حتى 40% في إجابات المحركات التوليدية) | https://arxiv.org/abs/2311.09735 | 09-§1/§3.2 |
| SE Ranking — «How to Optimize for ChatGPT» (24 نوفمبر 2025: تحليل 129,000 نطاق و216,524 صفحة في 20 مجالًا — المواقع >32,000 رابط مرجعي أقرب للاقتباس 3.5× من فئة ≤200 · ملايين الإشارات على Reddit/Quora ≈ 4× · llms.txt أثره مهملاً) | https://seranking.com/blog/how-to-optimize-for-chatgpt | 09-§1 (حقيقة بحثية فقط — لا برنامج روابط خارجية بقرار المالك تحديث 2026-11-18) |
| Zenith AI — ChatGPT يقتبس صفحات المقارنة/مواقع العلامات المنافسة أكثر من Google بـ11.1 نقطة (الادعاء مقروء بدليل Yotpo أدناه الذي ينقل دراسة Zenith؛ ودراسة Zenith المنشورة على مدونتها تفحص اقتباسات المحركات التوليدية لمواقع المقارنة) | https://www.yotpo.com/blog/chatgpt-seo-geo-tips + https://www.tryzenith.ai/blog/ai-search-google-vs-gemini-q3-2025 | 09-§1/§3 |
| SE Ranking — «Does LLMs.txt impact your AI visibility and citations? No, according to research» (15 أكتوبر 2026: 300,000 نطاق — لا علاقة للملف بالاقتباس) + موقف Google/John Mueller الرسمي (SEJ 2 يونيو 2026: «مواصفة تخمينية لا تدعمها Search» — وتوثيق 15-06-2026 أن خط ترتيب Search لا يستشير الملف) | https://seranking.com/blog/llms-txt + https://www.searchenginejournal.com/google-says-llms-txt-is-purely-speculative-for-now/577576 + https://www.digitalapplied.com/blog/google-llms-txt-no-seo-value-lighthouse-audit-2026 | 09-§1 |
| Yotpo — «ChatGPT SEO & GEO 2026: 12 Tips to Get Cited in AI Answers» (كتل جواب 40-60 كلمة · أقسام 120-180 كلمة · Gartner -25% حجم بحث تقليدي بحلول 2026 · OpenAI/Harvard 24% استخدام معلوماتي) | https://www.yotpo.com/blog/chatgpt-seo-geo-tips | 09-§1/§3.1 |


### 2.2 فحوص SERP الحية (بحث ويب مباشر — تكوين المتصدرين بتاريخ 2026-11-18)
| الاستعلام | أبرز من ظهر (المستخدم في 02/03) |
|---|---|
| حاسبة السعرات الحرارية | moh.gov.sa · elconsolto.com/calculator/bmr · rc2.med.sa · مصدر إماراتي · nutridaybyday.com · saudi-fit.com |
| حاسبة مؤشر كتلة الجسم BMI | webteb.com · nhlbi.nih.gov · elconsolto.com/calculator/bmi · ilajak.com · مواقع طبية |
| حاسبة الماكروز | nutridaybyday.com · saudi-fit.com · وصفة طبية · حاسبات متخصصة |
| حاسبة نسبة الدهون في الجسم | techcare.health/ar/body-fat-calculator · apollohospitals.com/ar · ilajak.com |
| متتبع شرب الماء | تطبيقات APK (apkpure/softonic) + Pinterest — الويب ضعيف |
| نظام غذائي 1200 سعرة | PDF حكومي sfhm.moi.med.sa · منشورات فيسبوك · خطة د. نوزاردان |
| مدرب لياقة اونلاين / Online Fitness Coach | إنستغرام (مدربون) · مجموعات فيسبوك · تطبيق Trainerize بPlay · Echelon |
| calorie calculator (EN) | nhlbi.nih.gov · cdc.gov · calculator.net |
| macro calculator (EN) | calculator.net · drbillsukala.com · barbellmedicine.com |
| body fat calculator navy (EN) | calculator.net · omnicalculator.com (مستعرض MD + 649 تقييمًا) · rippedbody.com |
| mifflin st jeor calculator (EN) | medscape.com · inchcalculator.com · leighpeele.com · MSD |
| AI meal plan generator free (EN) | makemealplan.com · strongrfastr.com · easy-peasy.ai · eatthismuch.com |
| BMI calculator (EN) | nhlbi.nih.gov · cdc.gov · calculator.net |
| ElCoach | elcoach.me («مدربك في جيبك») · متاجر التطبيقات · تسعير ~56 ريال/ش عبر صفحات أكواد |
| Trainera/منافسو المنصات | نتائج 2026-11-05 الموثقة (trainera.fit ‏1,800+ تمرينًا) — أعيد التحقق من استمرار الجدارة عبر فحص اليوم |

### 2.3 مصادر ملحوظة قيد التحقق اللاحق (P0-G)
أحجام بحث Keyword Planner لقائمة 02-§7 (مصر/السعودية/الإمارات/US) — **مستبعدة نهائيًا بقرار المالك 2026-11-20 (يتطلب إضافة بطاقة بنكية إلى Google Ads — غير مقبول ضمن قيود المشروع؛ ذراع الأحجام أُسقطت من P0-G بلا بديل)**؛ لا رقم حجم بحث ورد بأي تقرير من تقدير ويبقى القياس على GSC المؤرخ وتكوين SERP الحي.

## 3. حدود الأدلة المعلنة وتمييز البيانات الفعلية عن التقديرات (للأمانة)

**التصنيف الملزم لكل رقم/ادعاء في هذه المنظومة:**
- **(أ) قياس فعلي:** مستخرج من GSC/GA4/DOM/الكود بمصدره ونافذته وتاريخه — مثل كل أرقام §1 وجداول GSC (6,896/16 · 1,665@84.06 · 68@20.16 · الدول · عدّ الروابط ~5).
- **(ب) استنتاج من فحص SERP حي مؤرخ:** تكوين المتصدرين بتاريخ الفحص (2026-11-18 وما قبله الموثق) — دليل طلب لا رقم حجم.
- **(ج) تقدير نوعي:** موسوم صراحة [تقدير] ولا يحمل رقمًا (مثل «حجم عربي محدود» لنمط الاشتراكات).
- **(د) نتائج دراسات خارجية:** موثقة بروابطها المباشرة وتواريخها في §2.1 — تصف السوق لا منصتنا، ولا تُنسب للمنصة.


1. فحوص SERP عبر بحث الويب تعرض تكوين النتائج لا مواضع Alkemos الحية (الموقع في فترة اضطراب فهرسة موثق بمشروع مستقل).
2. القياسات التاريخية GSC من نوافذ موثقة سابقًا ولم تُعد تسحب بهذه الجلسة (القدرة موثقة GSC-RE-AUDIT).
3. أحجام البحث ودرجات المنافسة الرقمية: غائبة عمدًا حتى P0-G.
4. بيانات التحويل: غير موجودة قبل تفعيل أحداث GA4 (موثق).

## 4. سجل القياسات الجارية (يُحدَّث عند كل قراءة)

| التاريخ | القياس | النافذة | القيمة | المرجع |
|---|---|---|---|---|
| 2026-11-18 | عدّ روابط أدوات→تجاري الزاحفة | لقطة DOM/كود | ~5 (فوتر) | الجلسة الأصلية (07-§1) |
| 2026-11-18 | حالة بوابات المستودع بعد التسليم | لقطة | docs_audit ✓ · docs_parity ✓ · stale-refs ✓ | الجلسة الأصلية |
| 2026-11-18 | فحص اتساق ما بعد تحديث قرارات المالك | الملفات الأربعة عشر + الحوكمية | صفر بقايا (روابط خارجية · تجربة توليد · تواريخ مستقبلية) · بوابات ✓ · الترقيم D-أ..D-ج وP2-A..C متسق | جلسة التحديث |
| 2026-11-20 | تحقق المالك: أحداث GA4 حية بGA4 كـ Key events | الإنتاج الحي | tool_result · diet_plan_bridge_click · evo_message مؤكدة واصلة فعليًا · الخمسة الباقية (signup_complete · lead_capture · save_result · checkout_start · subscription_success) منشورة بالكود والإنتاج تثبت عند وقوعها | أمر المالك «تحديث حالة P0-G» (التقرير 20 §6) |
| 2026-11-20 | تحقق المالك: ربط GA4 ↔ GSC | واجهة GA4 | مكتمل بنجاح | أمر المالك «تحديث حالة P0-G» (08-§4.2) |
| 2026-11-20 | قرار المالك: استبعاد Keyword Planner نهائيًا | نطاق المنظومة | يتطلب بطاقة بنكية بـGoogle Ads — غير مقبول ضمن قيود المشروع؛ ذراع الأحجام أُسقطت من P0-G | أمر المالك «تحديث حالة P0-G» (02-§7) |
| 2026-11-19 | أول قراءة تقرير GSC «Generative AI features» (Beta) — خط الأساس | 2026-09-04→11-15 (لقطة 2026-11-19 · آخر تحديث بيانات قبلها بـ4 ساعات) | 115 ظهورًا إجماليًا · الصفحات الثلاث الأولى: الرئيسية ‏11 · /tools/macro-calculator ‏6 · /ar/foods/olive-oil ‏4 · ذروة يومية ≈24 مطلع أكتوبر (قراءة بصرية تقريبية من اللقطة — لا رقم مقيس) | لقطة المالك المرفقة بأمر الجلسة 2026-11-20 (مؤرشفة `evidence/gsc-generative-ai-first-read-2026-11-19.jpg` — 08-§1/§4) |
| 2026-11-21 | قيام منظومة مراقبة أدوات AR الأسبوعية (P1-I — التشغيل + السجل) | بنية عند كوميت `bba0922d` | سير عمل مجدول (اثنين 06:20 UTC) + سكربت قراءة-فقط + السجل `gsc-ar-weekly-monitoring-log.md` منشورة على main — الحرس مثبت حيًا بتشغيل dispatch فعلي (no-op قبل النافذة بلا أي استدعاء Google) · **أول قراءة فعلية الاثنين 2026-11-30 06:20 UTC** (قانون النافذة) وأول ملخص شهري (نوفمبر) بأول تشغيل من ديسمبر | التقرير 28 (08-§2 · الخارطة 10/P1-I) |
| — | *أول قراءة GSC نظيفة بعد الاعتماد* | 28 يومًا | *بانتظار — تبدأ تراكميًا بقراءات P1-I الأسبوعية من 2026-11-30* | K1-K3/K8 |
| ~2026-12-17 | *أول تقرير قمع GA4* | 4 أسابيع بعد التفعيل الحي (تحقق 2026-11-20) | *بانتظار* | K6/K7 |
