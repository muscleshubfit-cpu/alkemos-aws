# 12 — المصادر والأدلة (Sources & Evidence)

> **القاعدة:** كل ادعاء في هذا المشروع يعود إلى أحد المصادر أدناه بتاريخه. المصادر الداخلية = ملفات المستودع عند HEAD ‏90b2f242 (فحص 2026-11-19). المصادر الخارجية = مقروءة حية بتاريخ 2026-11-19 عبر بحث الويب (عناوين النتائج ومقتطفاتها وروابطها). **قسم القياسات الجارية (§4) هو السجل الحي لأي قراءة لاحقة.**

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
| `STATE.md` + `AGENTS.md` + `docs/CI_GATES.md` | القوانين الحاكمة (الأمانة · الكاناري · الرئيسية اكتشاف · قرارات المالك الموثقة المشار إليها بD-أ إلى D-هـ) |
| `worklog.md` (مدخل 2026-11-19) + بنية `archive/WORKLOG_ARCHIVE.md` | حوكمية الإضافة |

## 2. مصادر خارجية — مقروءة بتاريخ 2026-11-19

### 2.1 بحوث GEO/AEO/AIO (مؤرخة)
| المصدر | الرابط/التعريف | الاستخدام |
|---|---|---|
| Ahrefs — «Update: AI Overviews Reduce Clicks by 58%» (فبراير 2026؛ تأكيدات Seer ‏49.4-65.2% · Authoritas ‏47.5%) | ahrefs.com/blog/ai-overviews-reduce-clicks-update | 09-§1 (F-7) |
| Pew Research — «Google users are less likely to click...» (يوليو 2025) | pewresearch.org/short-reads/2025/07/22 | 09-§1 |
| Semrush — AI Overviews impact study (ديسمبر 2025: ظهور ~25% يوليو → 15.69%) | semrush.com (تقرير Dec 15, 2025) | 09-§1 |
| Seer Interactive — AIO CTR update (سبتمبر 2025: CTR ‏1.31% ديسمبر 2025 → 2.36% فبراير 2026) | seerinteractive.com/insights/aio-impact-on-google-ctr-september-2025-update | 09-§1 |
| Princeton/Georgia Tech/Allen AI — ورقة «GEO: Generative Engine Optimization» (Fact Density ‏+40%) | موثقة نقلاً عن أدلة GEO الصناعية المقروءة | 09-§1/§3.2 |
| SE Ranking — تحليل 400K URL (2025: >32K رابط مرجعي = 3.5× اقتباس · Reddit/Quora ‏4×) | seranking.com (دراسة 2025) | 09-§1 · D-هـ |
| Zenith AI — ChatGPT يقتبس صفحات المقارنة +11.1 نقطة عن Google | موثق بدليل Yotpo GEO ‏(يونيو 2026) المقروء | 09-§1/§3 |
| SE Ranking — «Does LLMs.txt impact...» (أكتوبر 2026: 300K نطاق — لا أثر) + إعلان Google الرسمي 15-06-2026 (لا قيمة ترتيب — عبر أدلة يونيو/نوفمبر 2026 المقروءة وJohn Mueller) | seranking.com/blog/llms-txt · digitalapplied.com | 09-§1 |
| Yotpo — «ChatGPT SEO & GEO 2026: 12 Tips» (كتل جواب 40-60 · أقسام 120-180 · Gartner ‏-25% بحث تقليدي · OpenAI/Harvard ‏24% استخدام معلوماتي) | yotpo.com/blog/chatgpt-seo-geo-tips | 09-§1/§3.1 |

### 2.2 فحوص SERP الحية (بحث ويب مباشر — تكوين المتصدرين بتاريخ 2026-11-19)
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
أحجام بحث Keyword Planner لقائمة 02-§7 (مصر/السعودية/الإمارات/US) — **غير متوفرة بلا أداة**؛ لا رقم حجم بحث ورد بأي تقرير من تقدير.

## 3. حدود الأدلة المعلنة (للأمانة)

1. فحوص SERP عبر بحث الويب تعرض تكوين النتائج لا مواضع Alkemos الحية (الموقع في فترة اضطراب فهرسة موثق بمشروع مستقل).
2. القياسات التاريخية GSC من نوافذ موثقة سابقًا ولم تُعد تسحب بهذه الجلسة (القدرة موثقة GSC-RE-AUDIT).
3. أحجام البحث ودرجات المنافسة الرقمية: غائبة عمدًا حتى P0-G.
4. بيانات التحويل: غير موجودة قبل تفعيل أحداث GA4 (موثق).

## 4. سجل القياسات الجارية (يُحدَّث عند كل قراءة)

| التاريخ | القياس | النافذة | القيمة | المرجع |
|---|---|---|---|---|
| 2026-11-19 | عدّ روابط أدوات→تجاري الزاحفة | لقطة DOM/كود | ~5 (فوتر) | هذه الجلسة (07-§1) |
| 2026-11-19 | حالة بوابات المستودع | لقطة | docs_audit ✓ · docs_parity ✓ · stale-refs ✓ | سجل العمل |
| — | *أول قراءة GSC نظيفة بعد الاعتماد* | 28 يومًا | *بانتظار* | K1-K3/K8 |
| — | *أول تقرير قمع GA4* | 4 أسابيع بعد P0-G | *بانتظار* | K6/K7 |
