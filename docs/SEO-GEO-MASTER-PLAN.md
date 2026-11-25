<!-- Created: 2026-09-08 -->
<!-- Status: Living document — append-only, every implementation phase adds a section under §12 -->
<!-- Owner: muscleshubfit@gmail.com (Ahmed) — project owner + human supervisor -->
<!-- Scope: SEO / GEO global visibility master plan. Implementation tasks live here, NOT in STATE.md. -->
<!-- Related: AGENTS.md (operating rules) · STATE.md (current project status) · docs/SEO-CWV-THRESHOLDS.md · docs/SEO-EEAT-FRAMEWORK.md · docs/SEO-SCHEMA-REFERENCE.md -->

# Alkemos — Master Plan for Global Organic Visibility (SEO + GEO)

> **لماذا هذا الملف:** الهدف هو تصدّر نتائج البحث العضوي عالميًا في فئة اللياقة والتغذية، وضمان ظهور Alkemos كمرجع مقتبَس في إجابات محركات الذكاء الاصطناعي (ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude). الملف هو مصدر الحقيقة الوحيد لخطة SEO/GEO — لا تنشئ ملفات منافسة، حدّث هذا الملف فقط.
>
> **اللغة:** عربي/إنجليزي مختلط (المصطلحات التقنية بالإنجليزية، الشروحات بالعربية).

---

## 1. ملخّص تنفيذي (Executive Summary)

موقع **Alkemos.com** مبني على أساس تقني قوي جدًا: بنية URLs نظيفة، دعم لغتين (عربي/إنجليزي) صحيح 100%، خرائط موقع مُقسّمة بذكاء، علامات Schema منظّمة، سرعة استجابة ممتازة (TTFB 0.31–0.44 ثانية)، وحوالي **80,100 صفحة مفهرسة في Bing**.

الهدف: **تحويل هذا الأساس التقني إلى تصدّر عضوي عالمي #1** في فئات:
- مكتبة التمارين (vs ExRx.net, MuscleWiki)
- قاعدة بيانات الأطعمة (vs MyFitnessPal, FatSecret, CalorieKing)
- حاسبات اللياقة (vs CDC, calculator.net, NASM)
- مدرب اللياقة الذكي EVO (vs Fitbod, Freeletics, ChatGPT-direct)
- المحتوى العربي الرياضي (سوق مفتوح عمليًا — لا منافس قوي)

**الطريق:** 12 شهرًا، 6 مراحل، استثمار تسويقي محتوى + بناء سلطة (Authority) + توسّع لغوي. لا يتطلب إعادة بناء تقنية، بل قرارات تكتيكية واضحة + جهد تنفيذي مُركّز.

---

## 2. تدقيق الوضع الحالي (Current State Audit)

> تاريخ التدقيق: 2026-09-08 · المرحلة: 144 · آخر كوميت متحقّق منه: 24a033e + Phase 144

### 2.1 ما يعمل بشكل ممتاز ✅

| المجال | الوضع | الدليل |
|---|---|---|
| سرعة الاستجابة (TTFB) | 0.31–0.44 ثانية | `curl -sI https://alkemos.com/` (ثلاث قياسات متتالية) |
| ثنائية اللغة (AR/EN) | صحيحة 100% مع `hreflang` + `canonical` + اتجاه RTL | فحص حي للصفحة الرئيسية و `/ar` |
| علامات البيانات المنظّمة (JSON-LD) | Organization + WebSite + Article + Exercise + Breadcrumb + NutritionInformation | فحص HTML للصفحة الرئيسية وصفحات الأطعمة |
| هيكلة الخرائط (Sitemaps) | 4 خرائط فرعية + Index: pages(47) + exercises(1,736) + foods(160) + blog(61) = 2,004 URLs مُعلَنة | `curl https://alkemos.com/sitemap.xml` |
| بنية الـ URLs | نظيفة ومنطقية: `/exercises/[slug]`, `/ar/exercises/[slug]`, `/foods/[slug]`, `/tools/calorie-calculator` | فحص Sitemap |
| ملف `llms.txt` | موجود ومكتوب باحتراف — جاهز لمحركات الذكاء الاصطناعي | `https://alkemos.com/llms.txt` |
| ملف `llms-full.txt` | موجود كموسّع للمقالات | `https://alkemos.com/llms-full.txt` |
| RSS Feeds | EN + AR متوفّران | `<link rel="alternate" type="application/rss+xml">` |
| خط المدوّنة الآلي | 61 مقالًا منشورًا وقت القياس، 1 مقالة/يوم/لغة (Phase 119 — صُحّح 2026-09-29 من «6 مقالات/يوم» وفق AUDIT_REPORT §9-0.4) | `sitemap-blog.xml` |
| حجم الفهرسة في Bing | ~80,100 صفحة (يشمل 8,750 صفحة طعام من USDA غير المُعلَنة في الخريطة) | `site:alkemos.com` على Bing |
| الأمان والخصوصية | HSTS, CSP, GDPR Cookie Banner, Permissions-Policy, X-Frame-Options | فحص response headers |
| PWA | قابل للتثبيت + Service Worker + manifest.json | `public/manifest.json`, `public/sw.js` |
| مراقبة الأداء | Vercel Analytics مُفعّل (Speed Insights أُزيل في VERCEL-USAGE-2 — 9.7K/10K من حصته الشهرية كانت محترقة) | `<Analytics />` |
| Skipping navigation | `sr-only-focusable` skip link | فحص HTML |
| robots.txt الأساسي | موحّد بذكاء (Phase 140 audit fix) + يسمح لكل البوتات بفهرسة المحتوى العام | فحص حي |
| روابط داخلية في صفحات الأطعمة | `getRelatedFoods` يولّد روابط ذكية | `src/lib/foods.ts` |
| 404 حقيقي للأطعمة المفقودة | `notFound()` بدلًا من 200 + noindex | `src/app/foods/[slug]/page.tsx` (A-8) |

### 2.2 فجوات التصدّر الحالية 🔴

| الفجوة | التأثير | الأولوية |
|---|---|---|
| **عدم وجود صفحات Hub/Collection** (مثل `/muscles/chest`, `/equipment/dumbbell`, `/collections/high-protein-foods`) | ضياع مليون زيارة شهرية محتملة من استعلامات الـ long-tail | عالية |
| **العلامة التجارية غير معروفة ككيان (Entity) لـ Google** | البحث عن "alkemos" لا يُظهر الـ Knowledge Panel | عالية |
| **عدم وجود روابط خلفية (Backlinks)** من مواقع موثوقة | Domain Authority منخفض، صعوبة التصدّر لكلمات تنافسية | عالية |
| **8,750 صفحة طعام USDA غير مُعلَنة في الخريطة** (سياسة Phase 141) | ضياع 87,500–437,500 زيارة شهرية محتملة (تقديري) | متوسطة |
| **لا توجد صفحات مقارنة** ("Alkemos vs MyFitnessPal", "EVO vs Freeletics") | ضياع زيارات عالية نية شرائية | متوسطة |
| **لا توجد ملفات تعريف مؤلفين بأسماء حقيقية وشهادات** | ضعف E-E-A-T (الخبرة، السلطة، الثقة) | متوسطة |
| **رؤوس HTTP تمنع التخزين المؤقّت**: `private, no-cache, no-store` على كل الصفحات | استنزاف Crawl Budget + تكلفة Vercel أعلى + LCP أبطأ على الجوال | متوسطة |
| **المدوّنة الإنجليزية تحت 100 مقال** (61 حاليًا) | المنافسون 10,000–50,000 مقال | منخفضة (الاستراتيجية: نشر آلي 6/يوم) |
| **لا توجد حسابات اجتماعية رسمية فعلية** (فقط أزرار مشاركة) | إشارات الكيان (Entity signals) ضعيفة | عالية |
| **صور OG الخارجية في المدوّنة** (Pexels بدلًا من `/api/og-image/[slug]` الموجود) | تقليل نسبة النقر من Social Shares | منخفضة |

### 2.3 تصحيح تحليل Cloudflare (هام)

> **التحليل الأولي في المحادثة كان مبالغًا فيه.** بعد فحص Cloudflare API بـ Token 1 (zone_settings) و Token 2 (waf) والتأكد من إعدادات WAF Rulesets + Page Rules + Bot Management:

**ما يحدث فعليًا:**

Cloudflare يُضيف تلقائيًا كتلة `"BEGIN Cloudflare Managed content"` إلى أعلى ملف `robots.txt` تمنع **بوتات تدريب الذكاء الاصطناعي فقط** (لا بوتات البحث):

| Bot | المالك | الغرض | محجوب؟ |
|---|---|---|---|
| Googlebot | Google | البحث العادي + AI Overviews | ❌ غير محجوب |
| Bingbot | Microsoft | البحث العادي + Copilot | ❌ غير محجوب |
| PerplexityBot | Perplexity | البحث في Perplexity | ❌ غير محجوب (ليس في القائمة) |
| OAI-SearchBot | OpenAI | ChatGPT Search | ❌ غير محجوب (ليس في القائمة) |
| Applebot | Apple | Siri + Spotlight Search | ❌ غير محجوب |
| **GPTBot** | OpenAI | تدريب ChatGPT | ✅ محجوب |
| **ClaudeBot** | Anthropic | تدريب Claude | ✅ محجوب |
| **Google-Extended** | Google | تدريب Gemini (لا يؤثر على AI Overviews) | ✅ محجوب |
| **CCBot** | Common Crawl | تغذية مشاريع AI مفتوحة المصدر | ✅ محجوب |
| **Bytespider** | ByteDance | تدريب TikTok AI | ✅ محجوب |
| **Amazonbot** | Amazon | تدريب Alexa AI | ✅ محجوب |
| **Applebot-Extended** | Apple | تدريب Apple Intelligence | ✅ محجوب |
| **meta-externalagent** | Meta | تدريب Meta AI | ✅ محجوب |
| **CloudflareBrowserRenderingCrawler** | Cloudflare | تصيير داخل Cloudflare | ✅ محجوب |

**الخلاصة:** الوضع الحالي **صحيح ومتوازن** — يحمي محتواك من السرقة للتدريب بينما يسمح لجميع محركات البحث (التقليدية والذكية) بالوصول.

**التوصية:** اترك هذا الإعداد كما هو. لا تغيّره.

> **Token Permissions Verified:**
> - Token 1 (`cfut_MVeb...`): `#zone_settings:edit`, `#zone_settings:read`, `#dns_records:read` — يصلح لإدارة الإعدادات
> - Token 2 (`cfut_C8Dw...`): `#waf:edit`, `#waf:read`, `#zone:read` — يصلح لإدارة WAF
> - Zone ID: `b4be55a0736831d9c5d9564788861076`
> - Account ID: `881c3f8ebf6e31fea39195295d4cff08`
> - لا توجد Page Rules نشطة
> - لا توجد Custom WAF Rules (فقط Cloudflare Managed Free Ruleset لحماية Log4j/Shellshock/WordPress)
> - Rate limit نشط: 50 req/10s لكل IP على `/api/*` (10 دقائق حظر عند التجاوز)

---

## 3. المشهد التنافسي (Competitive Landscape)

### 3.1 الفئة أ — مكتبة التمارين (الأشرس)

| المنافس | عدد التمارين | سنوات | قوة | نقطة ضعف |
|---|---|---|---|---|
| **ExRx.net** | 2,100+ | منذ 1999 | المرجع التاريخي للمدربين | تصميم قديم 1999، سيئ على الجوال |
| **MuscleWiki** | 2,000+ | 2013 | خريطة عضلية تفاعلية، فيروسي على Reddit | محتوى سطحي، لا برامج متكاملة |
| **ACE Fitness** | ~500 | 1985 | سلطة .org معتمدة | تغطية محدودة |
| **Bodybuilding.com** | ~1,000 | 1999 | علامة تجارية ضخمة | تراجع بعد 2024 |
| **Alkemos (حاليًا)** | 868 | 2026 | ثنائي اللغة + ذكاء اصطناعي + برامج | أحدث، أقل روابط خلفية |

**التقييم:** ExRx و MuscleWiki يتفوقان في الحجم، لكن تصميمهما ضعيف على الجوال، لا يدعمان العربية، ولا يقدّمان ذكاءً اصطناعيًا. **فرصة Alkemos: الجودة + التجربة + العربية + EVO.**

### 3.2 الفئة ب — قاعدة بيانات الأطعمة (المحتكرة)

| المنافس | عدد الأطعمة | مستخدمون | نموذج عمل |
|---|---|---|---|
| **MyFitnessPal** | ملايين | 350 مليون | اشتراك + إعلانات |
| **FatSecret** | 1.9 مليون | 50 مليون+ | API مجاني |
| **CalorieKing** | ~50,000 | — | اشتراك |
| **Nutritionix** | ~800,000 | (B2B) | API مدفوع |
| **Alkemos (حاليًا)** | 8,830 (80 مُختار) | — | مجاني + SEO |

**التقييم:** MyFitnessPal و FatSecret يحتكمان السوق الإنجليزي. لا منافس قوي في **العربية**. Alkemos يملك 8,830 طعامًا (تكفي كبداية) — لكن فقط 80 مُعلَن عنها. **الفرصة: استثمار 8,750 صفحة USDA الإنجليزية + توسّع لغوي.**

### 3.3 الفئة ج — الحاسبات (مُحتكرة من سلطات)

| المنافس | السلطة |
|---|---|
| **CDC.gov** | حكومي أمريكي |
| **calculator.net** | دومين قديم ضخم |
| **NASM.org** | هيئة اعتماد لياقة |
| **MyFitnessPal** | علامة تجارية |
| **HealthHub.sg** | حكومي سنغافوري |
| **Alkemos (حاليًا)** | 6 حاسبات مجانية (BMR, BMI, Macro, Body Fat, Water, Calorie) |

**التقييم:** منافسة شرسة في الإنجليزية. **الفرصة: العربية + الإسبانية + البرتغالية** (الحاسبات الصينية واليابانية والروسية متوفرة، لكن العربية ضعيفة جدًا).

### 3.4 الفئة د — مدرب اللياقة الذكي (سوق ناشئ)

| المنافس | التمويل | النموذج |
|---|---|---|
| **ChatGPT/Claude (direct)** | $157B / $60B | مجاني عام |
| **Fitbod** | $5M+ | اشتراك $79/سنة |
| **Freeletics** | $25M+ | اشتراك €95/سنة |
| **Future** | $90M+ | $200/شهر مع مدرب بشري |
| **Vora** | $10M+ | اشتراك |
| **SensAI** | ناشئ | اشتراك |
| **Alkemos EVO** | bootstrap | مجاني للزوار + مشتركين |

**التقييم:** السوق مزدحم بالـ apps المموّلة، لكن **لا يوجد منافس يقدّم AI coach عربيًا + مجاني للزوار**. EVO فرصة تفاضلية حقيقية.

### 3.5 الفئة هـ — السوق العربي (الفرصة الذهبية) ⭐

| المنافس | المنطقة | نقطة الضعف |
|---|---|---|
| **Trainera** | الخليج | محتوى محدود، تركيز خليجي فقط |
| **ArabFit** | تطبيق بسيط | لا محتوى عميق |
| **GymNation** | سلسلة صالات | لا منصة محتوى |
| **Noursin (Google Play)** | تطبيق | تطبيق لا موقع ويب SEO-friendly |
| **معظم المنافسين** | تطبيقات لا مواقع | فجوة استراتيجية ضخمة لـ Alkemos |

**التقييم:** **السوق العربي مفتوح عمليًا.** لا يوجد موقع ويب عربي رياضي يقدّم: مكتبة تمارين + قاعدة أطعمة + حاسبات + مدرب ذكاء اصطناعي + برامج جاهزة. Alkemos يملك كل هذا بالفعل.

---

## 4. تحليل SWOT

### Strengths (نقاط القوة)
1. **بنية تقنية ممتازة** — Next.js 16 + ISR + SSR + PWA + ثنائية لغة صحيحة
2. **محتوى وفير** — 868 تمرين + 8,830 طعام + 61 مقال + 6 حاسبات + 8 برامج
3. **ذكاء اصطناعي EVO** — لا منافس عربي يقدّمه
4. **الأسعار تنافسية** — $14.99–$39.99/شهر (أقل من Freeletics, Future)
5. **نظام مدربين جاهز** — 100% دخل للمدرب، رسم ثابت
6. **خط مدوّنة آلي** — 1 مقالة/يوم/لغة (Phase 119) ≈ 730 مقالة/سنة باللغتين (صُحّح 2026-09-29 من «6 مقالات/يوم»)
7. **SEO تقني نظيف** — Schema + Sitemaps + hreflang + canonical
8. **PWA** — قابل للتثبيت كتطبيق أصلي

### Weaknesses (نقاط الضعف)
1. **Domain Authority منخفض** — لا روابط خلفية موثوقة
2. **عدم معروفة كعلامة تجارية** — Google لا يعرف "alkemos" كـ Entity
3. **محتوى المدوّنة صغير نسبيًا** — 61 مقالًا (Healthline: 50,000+)
4. **8,750 صفحة طعام USDA غير مُعلَنة** — ضياع حركة Long-tail
5. **لا صفحات Hub/Collection** — فقدان استعلامات المجموعات
6. **لا حسابات اجتماعية فعلية** — إشارات Entity ضعيفة
7. **لا مؤلفون معروفون** — E-E-A-T ضعيف
8. **رؤوس HTTP تمنع التخزين** — استنزاف Crawl Budget
9. **التسجيل الفوري بدون بريد** (Phase 144) — قد يُسبب نسبةbounce عالية (يحتاج قياس)

### Opportunities (الفرص)
1. **السوق العربي مفتوح** — لا منافس قوي
2. **محركات الذكاء الاصطناعي مفتوحة** — PerplexityBot, OAI-SearchBot, Bingbot تستطيع الوصول
3. **8,750 صفحة USDA جاهزة** — أكبر مصدر حركة Long-tail مجانية
4. **التوسّع اللغوي** — الإسبانية، البرتغالية، الفرنسية، الهندية، الإندونيسية
5. **برنامج Affiliate جاهز** — `/affiliate` موجود، يحتاج تفعيل
6. **GEO (Generative Engine Optimization)** — سوق ناشئ 2026، المنافسة ضعيفة
7. **Bing Copilot + ChatGPT Search** — يظهران في ~50% من نتائج البحث الإنجليزية
8. **TikTok + Instagram Reels** — قناة اكتساب عضوي لا مستغلة

### Threats (التهديدات)
1. **ExRx.net و MuscleWiki** — تاريخ طويل + Domain Authority عالٍ
2. **MyFitnessPal + FatSecret** — احتكار قاعدة الأطعمة الإنجليزية
3. **Google AI Overviews** — تأكل نسبة النقر (CTR) من النتائج العضوية العليا
4. **تحديثات Google Core** — تقلبات شهرية في الترتيب
5. **ChatGPT/Claude المباشر** — يجيب على استفسارات اللياقة بدون الحاجة لزيارة موقع
6. **منافسون عرب مموّلون قد يظهرون** — Trainera + رأس مال خليجي
7. **تكلفة Vercel + Supabase + OpenRouter + Groq** — تتصاعد مع النمو
8. **AdSense under review** — لا دخل إعلاني بعد

---

## 5. استراتيجية الكلمات المفتاحية (Keyword Strategy)

### 5.1 التصنيف الهرمي للكلمات

**Tier 1 — Head Terms (تنافسية شرسة، أعلى حجم بحث):**
- "exercise library" (10K–100K شهريًا، ExRx يتصدر)
- "calorie calculator" (100K–1M، calculator.net يتصدر)
- "bmi calculator" (100K–1M، CDC يتصدر)
- "workout programs" (10K–100K)
- "food database" (1K–10K)
- "AI fitness coach" (1K–10K، ناشئ)

> **التقييم:** لا تُهاجم هذه الكلمات مباشرة في السنة الأولى. ركّز على Long-tail ثم اصعد.

**Tier 2 — Medium Tail (فرصة حقيقية):**
- "best chest exercises for mass" (1K–10K)
- "high protein foods list" (10K–100K)
- "low carb foods" (10K–100K)
- "calorie calculator for weight loss" (1K–10K)
- "home workout program no equipment" (1K–10K)
- "AI personal trainer free" (100–1K، ناشئ بسرعة)
- "macro calculator for cutting" (1K–10K)
- "keto friendly foods" (10K–100K)

> **التقييم:** هذه هي ساحة المعركة. أنشئ صفحات Hub/Collection لها.

**Tier 3 — Long Tail (حركة سهلة، إيراد محتمل):**
- "how many calories in 100g chicken breast" (100–1K)
- "best dumbbell exercises for triceps" (100–1K)
- "beginner home workout 3 days week" (100–1K)
- "is tuna good for weight loss" (100–1K)
- "bmi 25 what does it mean" (100–1K)
- "high protein breakfast no eggs" (100–1K)
- "keto snacks under 100 calories" (100–1K)
- "calories in 200g rice" (100–1K)

> **التقييم:** كل صفحة طعام USDA + كل صفحة تمرين + كل مقال مدوّنة = صفحة Long-tail محتملة. لديك بالفعل 80,100 صفحة في Bing — استثمرها.

**Tier 4 — Arabic Long Tail (سوق مفتوح):**
- "تمارين صدر في البيت" (100–1K)
- "حساب السعرات الحرارية اليومية" (1K–10K)
- "أكلات عالية البروتين" (1K–10K)
- "تمارين بطن للمبتدئين" (1K–10K)
- "نظام كيتو دايت عربي" (1K–10K)
- "حاسبة BMI عربي" (1K–10K)
- "أفضل برنامج تضخيم" (100–1K)
- "تمارين كارديو لحرق الدهون" (1K–10K)

> **التقييم:** اكتساح هذه الكلمات ممكن خلال 3–6 أشهر. لا منافس قوي عربيًا.

### 5.2 خريطة الكلمات إلى الصفحات

| الكلمة | الصفحة الحالية/المطلوبة | نوع الصفحة |
|---|---|---|
| best chest exercises | `/muscles/chest` (مطلوبة!) | Hub |
| high protein foods | `/collections/high-protein-foods` (مطلوبة!) | Collection |
| low carb foods | `/collections/low-carb-foods` (مطلوبة!) | Collection |
| keto friendly foods | `/collections/keto-foods` (مطلوبة!) | Collection |
| best dumbbell exercises | `/equipment/dumbbell` (مطلوبة!) | Hub |
| home workout no equipment | `/equipment/bodyweight` (مطلوبة!) | Hub |
| calorie calculator | `/tools/calorie-calculator` (موجودة ✅) | Tool |
| AI personal trainer | `/evo` (موجودة ✅) | Product |
| workout tracker | `/workout-tracker` (موجودة ✅ — P0 SEO audit 2026-09-30، §12.60) | Landing |
| macro tracker | `/macro-tracker` (موجودة ✅ — P0 SEO audit 2026-09-30، §12.60) | Landing |
| alkemos vs cronometer | `/compare/alkemos-vs-cronometer` (موجودة ✅ — P0 SEO audit 2026-09-30، §12.60) | Comparison |
| تمارين صدر في البيت | `/ar/muscles/chest` (مطلوبة!) | Hub AR |
| متتبع تمارين | `/ar/workout-tracker` (موجودة ✅ — P0 SEO audit 2026-09-30) | Landing AR |
| متتبع ماكروز | `/ar/macro-tracker` (موجودة ✅ — P0 SEO audit 2026-09-30) | Landing AR |
| أكلات عالية البروتين | `/ar/collections/high-protein-foods` (مطلوبة!) | Collection AR |

---

## 6. استراتيجية المحتوى (Content Strategy)

### 6.1 الأعمدة الموضوعية (Topic Pillars)

أنشئ 8 أعمدة موضوعية، كل عمود = Hub page + 20–50 صفحة فرعية:

| العمود | الصفحة الرئيسية | الصفحات الفرعية |
|---|---|---|
| بناء العضلات | `/muscles/chest` (Hub) | كل تمارين الصدر + 5 مقالات + 3 برامج |
| خسارة الدهون | `/collections/foods-for-cutting` (Hub) | الأطعمة + مقالات + برنامج Cutting |
| الكيتو دايت | `/collections/keto-foods` (Hub) | الأطعمة + 5 مقالات كيتو |
| التغذية الرياضية | `/collections/high-protein-foods` (Hub) | الأطعمة + مقالات + حاسبة Macros |
| تمارين المنزل | `/equipment/bodyweight` (Hub) | كل تمارين وزن الجسم + 3 برامج منزل |
| المبتدئين | `/beginners` (مطلوبة!) | أدلة شاملة + برنامج 12 أسبوع |
| الذكاء الاصطناعي في اللياقة | `/evo` (موجودة ✅) | مقالات + حالات استخدام |
| مدربون محترفون | `/coaching` (موجودة ✅) | مقالات + قصص نجاح |

### 6.2 معدّل النشر المستهدف

| النوع | الحالي | الهدف (90 يوم) | الهدف (12 شهر) |
|---|---|---|---|
| مقالات المدوّنة (آلي) | 6/يوم | 6/يوم ✓ | 6/يوم (2,190/سنة) |
| صفحات Hub/Collection | 0 | 24 صفحة | 50 صفحة |
| صفحات مقارنة | 4 (أصبحت — الثلاثة الأصلية + Cronometer بP0 audit 2026-09-30، §12.60) | 5 صفحات | 20 صفحة |
| صفحات دليل شاملة | 0 | 3 صفحات | 15 صفحة |
| صفحات Long-tail منسّقة | 0 | 50 صفحة | 500 صفحة |
| فيديوهات YouTube | 0 | 4/شهر | 50/سنة |
| منشورات Social | 0 | 3/أسبوع | مستمر |

### 6.3 قوالب المحتوى

**قالب صفحة Hub/Collection (مطلوب تنفيذه فورًا):**
> **التنفيذ:** البنود 1، 3، 6–8 شُحنت بالمرحلة SEO-GEO-1؛ **البنود 4+5 (الدليل التفسيري + FAQ) شُحنا بالمرحلة SEO-GEO-5.2 (§12.17)** — القالب مكتمل على الـ24 مركزًا المملوءة (بند 2/TOC تُرك لصفحات الأدلة الطويلة، و«FAQ اختياري» في البند 8 حُسم: صفر schema — انظر §12.17).
1. H1 فريد + intro 150 كلمة
2. فهرس محتوى (Table of Contents)
3. قائمة العناصر (Grid) مع صور + روابط
4. نص تفسيري 500–1000 كلمة (مع citations PubMed للمقالات الصحية)
5. قسم "أسئلة شائعة" (FAQ) — 5–10 أسئلة
6. روابط داخلية للمقالات ذات الصلة
7. CTA لل-memberhip / EVO / coaching
8. Schema: ItemList + Breadcrumb + (FAQ اختياري)

**قالب صفحة مقارنة:**
1. H1: "Alkemos vs [Competitor]"
2. جدول مقارنة (الميزات، الأسعار، المحتوى، الدعم)
3. مراجعة تفصيلية 1500+ كلمة
4. آراء مستخدمين (مع إذن)
5. الخلاصة + توصية
6. Schema: Article + Review

---

## 7. أولويات SEO التقني (Technical SEO Priorities)

### 7.1 مرتبة بالأولوية

| # | المهمة | الجهد | التأثير | الحالة |
|---|---|---|---|---|
| 1 | إنشاء صفحات Hub/Collection (`/muscles/[group]`, `/equipment/[type]`, `/collections/[slug]`) | متوسط | 🔴 عالي | ✅ تم (SEO-GEO-1 + حصر 12.9) |
| 2 | إضافة Hub Pages إلى `sitemap-pages.xml` | منخفض | 🔴 عالي | ✅ تم (12.9 — كل العائلات مغطاة) |
| 3 | إضافة ItemList schema للـ Hub Pages | منخفض | متوسط | ✅ تم (متحقق في hubs/collections/compare) |
| 4 | تفعيل `/api/og-image/[slug]` لكل صفحات المدوّنة بدلًا من Pexels | منخفض | متوسط | ✅ تم (151 — OG مصلح EN+AR) |
| 5 | إصلاح رؤوس HTTP للتخزين المؤقّت (Cache-Control) على الصفحات العامة | متوسط | متوسط | ✅ تم (148/149 — قاعدة Cloudflare حية) |
| 6 | إضافة "reviewedBy" Person schema للصفحات الطبية/الصحية | متوسط | متوسط | ✅ تم 2026-09-09 (SEO-GEO-4.5 — الأطعمة والتمارين EN+AR) |
| 7 | إضافة تواريخ "lastReviewed" للمحتوى الصحي | منخفض | متوسط | ✅ تم 2026-09-09 (SEO-GEO-4.5 — عقدة WebPage موحدة) |
| 8 | إعادة تقييم إعلان 8,750 صفحة USDA في خريطة منفصلة (`sitemap-foods-long.xml`) | متوسط | 🔴 عالي | ⏳ معلّق (يحتاج 90 يوم بيانات Search Console أولاً) |
| 9 | إنشاء صفحات `/collections/[tag]` للأطعمة (8 صفحات على الأقل) | متوسط | عالي | ✅ تم (SEO-GEO-1 + حصر 12.9) |
| 10 | إضافة `SearchAction` schema للموقع | منخفض | متوسط | ✅ تم (متحقق — WebSite schema في seo.ts) |
| 11 | تحسين Internal Linking بين التمارين والأطعمة والمقالات | متوسط | عالي | ✅ تم 2026-09-09 (SEO-GEO-4.7 — شبكة spoke→hub حتمية + حقن روابط الأدوات للمقالات) |
| 12 | إنشاء `/sitemap-collections.xml` | منخفض | متوسط | ✅ تم (حية من السبع المضافة في GSC) |
| 13 | إضافة `Speakable` schema للمقالات (للأوامر الصوتية) | منخفض | منخفض | ✅ تم (SEO-GEO-4 — مدونة EN+AR) |
| 14 | تحسين `next-sitemap` لإضافة `<lastmod>` دقيقة | منخفض | منخفض | ✅ تم 2026-09-09 (SEO-GEO-4.7 — SITEMAP_LASTMOD لكل عائلة + سياسة المركزات الفارغة) |
| 15 | مراجعة محتوى الـ 61 مقالًا الحالية وتحسينها (Content Pruning) | متوسط | متوسط | ✅ تم 2026-09-09 (SEO-GEO-4.8 — تدقيق 12 بُعدًا على 63 مقالًا: صفر مرشحي حذف + إصلاح 85 رابطًا ميتًا + 3 مراسٍ خام + 3 CJK) |

### 7.2 Core Web Vitals (مأخوذ من `docs/SEO-CWV-THRESHOLDS.md`)

| المؤشر | الهدف | الوضع الحالي المتوقع |
|---|---|---|
| LCP | ≤2.5s | ~1.5–2.0s (TTFB 0.31–0.44s) |
| INP | ≤200ms | غير مقيس مباشرة (Vercel Speed Insights يلتقطه) |
| CLS | ≤0.1 | ~0.0–0.05 (بعد Phase 136/137 fixes) |

> **ملاحظة:** Vercel Speed Insights مُفعّل ويجمع بيانات CrUX الحقيقية. راجع لوحة Vercel أسبوعيًا.

---

## 8. استراتيجية GEO (Generative Engine Optimization)

> GEO = تحسين الظهور في إجابات محركات الذكاء الاصطناعي (ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude, Meta AI).

### 8.1 حالة الوصول الحالية

✅ **محركات البحث التقليدية**: Googlebot, Bingbot, Yandex, Baidu — كلها تستطيع الزحف والفهرسة.
✅ **محركات البحث الذكية**: PerplexityBot, OAI-SearchBot (ChatGPT Search), Applebot (Siri Search) — كلها تستطيع الزحف.
❌ **بوتات التدريب فقط**: GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider, Amazonbot, Applebot-Extended, meta-externalagent — محجوبة (وهذا صحيح، يحمي المحتوى من السرقة).

### 8.2 تكتيكات GEO الفعّالة

**1. الإجابات الذرية (Atomic Answers)**
- في بداية كل صفحة، قدّم إجابة مباشرة 40–60 كلمة على السؤال الرئيسي
- مثال لصفحة `/foods/chicken-breast`: "Chicken breast contains 165 calories, 31g protein, 0g carbs, and 3.6g fat per 100g. A typical serving (1 medium breast, 150g) provides 248 calories and 46g protein."
- هذه الإجابات هي ما يقتبسه AI bots

**2. الإحصائيات والأرقام القابلة للاقتباس**
- استخدم تنسيق "X% of people..." أو "Studies show..."
- أضف citations لـ PubMed / WHO / CDC
- مثال: "According to a 2023 meta-analysis in the British Journal of Sports Medicine (PMID: 12345678), resistance training 2–3 times per week reduces all-cause mortality by 23%."

**3. قوائم مقارنة (Comparison Tables)**
- جدول مقارنة سريع في كل صفحة Hub
- AI bots تحب الجداول المنظمة

**4. Q&A Sections**
- أضف قسم "أسئلة شائعة" في كل صفحة (5–10 أسئلة)
- ⤵️ **التنفيذ (SEO-GEO-5.2، §12.17):** أقسام FAQ حية على مراكز العضلات/المعدات/الأطعمة الـ24 × لغتين — **والقرار النهائي للـschema: صفر markup** (مصدر الحقيقة `SEO-SCHEMA-REFERENCE.md`: FAQPage retired كليًا منذ 2026-05-07 بلا فائدة SERP، وQAPage محجوز للأسئلة المقدمة من المستخدمين — النص المرئي الإجابات الذرية هو أصل GEO)

**5. llms.txt و llms-full.txt**
- ✅ موجودة بالفعل (`/llms.txt`, `/llms-full.txt`)
- حدّثها شهريًا بأحدث المقالات

**6. Data_attributions و citations**
- كل ادعاء صححي يجب أن يحمل رابطًا للدراسة الأصلية
- استخدم `<cite>` tag في HTML

**7. التحدّث بلغة AI bots**
- استخدم عبارات مثل "According to Alkemos's analysis...", "Research from Alkemos shows..."
- AI bots تُفضل المصادر التي تُعرّف عن نفسها كمرجع

### 8.3 قياس الظهور في AI

| الأداة | الوصف | التكلفة |
|---|---|---|
| **Google Search Console** | يعرض ظهور AI Overviews في تقرير Search Appearance | مجاني |
| **Bing Webmaster Tools** | يعرض ظهور Copilot answers | مجاني |
| **Profound** | تتبّع ظهور العلامة في ChatGPT/Perplexity | مدفوع |
| **Otterly.ai** | مراقبة AI Search visibility | مدفوع |
| **Manual testing** | ابحث يدويًا في ChatGPT/Perplexity/Gemini عن "alkemos" أسبوعيًا | مجاني |

> **التوصية:** ابدأ بالقياس اليدوي الأسبوعي. عند توفّر ميزانية، اشترك في Profound أو Otterly.

### 8.4 بروتوكول القياس الشهري المُفعَّل (§GEO-M — تدقيق التوليد المرحلة 2 بند 4، 2026-09-29)

> تدقيق التوليد المستقل (AUDIT_REPORT.md) قاس أن KPI «الظهور في AI Answers» بلا أي تتبّع فعلي (F14). البروتوكول التالي مُفعَّل منذ 2026-09-29 — عينة ثابتة + قناة قياس مجانية بالكامل:

- **العينة الثابتة (متعهد بها بالكود):** 24 استعلام بحث حقيقي (12 EN + 12 AR) تغطي نوايا الموقع الأساسية (سعرات/بروتين/تمارين منزلية/نوم واستشفاء/مكملات) — نفس العينة كل شهر حتى يكون الاتجاه قابلًا للمقارنة: `scripts/geo/answer-visibility-probe.mts` (مصدر واحد).
- **الذراع الآلية (مجانية):** `geo-answer-visibility.yml` — workflow شهري (يوم 1 من الشهر 07:00 UTC + تشغيل يدوي) يسأل العينة لسلسلة النماذج المجانية نفسها التي تشغّل الموقع (بروكسي لمحرك إجابات توليدي بلا تصفح) ويفحص ذكر Alkemos/alkemos.com والروابط المقتبسة. النتيجة تسجل بالسجل + ملخص التشغيل — بلا أي auto-commit (قانون هوية الكوميت §10).
- **الذراع اليدوية (مالك، ~5 دقائق/شهر):** نفس الاستعلامات الـ24 تُسأل في ChatGPT وPerplexity وGoogle AI Overviews، ويُسجل عدد مرات ظهور alkemos.com (الحقيقة الأرضية التي يقيسها البروكسي اتجاهها لا قيمتها).
- **الربط بالـ KPIs:** مؤشر المرحلة 3 «ظهور أول AI citation» يُقاس الآن رقميًا من هذا البروتوكول — الهدف المحدَّث: ≥10% من استعلامات العينة تذكر Alkemos خلال 90 يومًا (خط الأساس يُقاس عند أول تشغيل شهري).

**سجل القياس الشهري (يُحدَّث من ملخص التشغيل — عمود واحد لكل شهر):**

| التاريخ | ذكر Alkemos (بروكسي السلسلة المجانية) | تفصيل EN/AR | ملاحظات |
|---|---|---|---|
| 2026-09-29 (خط الأساس) | 0/24 (0%) | EN 0/12 · AR 0/12 | بروكسي=السلسلة-المجانية · إخفاقات السلسلة 0 (تشغيل 36501359231) — نقطة البداية الصادقة للتقرير §9: صفر ظهور مقيس قبل أي تحسين |

---

## 9. استراتيجية السلطة والروابط الخلفية (Authority & Backlinks)

### 9.1 الهدف الكمّي

| المقياس | الحالي (تقديري) | الهدف (6 أشهر) | الهدف (12 شهر) |
|---|---|---|---|
| Referring Domains | ~5–20 | 100 | 300 |
| Total Backlinks | ~50 | 1,000 | 5,000 |
| Domain Rating (Ahrefs) | ~10 | 25 | 40 |
| Domain Authority (Moz) | ~10 | 25 | 40 |
| Mentions in major outlets | 0 | 5 | 20 |

### 9.2 قنوات بناء الروابط

**قناة 1: HARO / Connectively (الأعلى ROI)**
- اشترك كخبير لياقة وتغذية
- أجب على 5–10 استفسارات يوميًا (15 دقيقة/يوم)
- كل quote مذكور فيها Alkemos = backlink من موقع إخباري
- التكلفة: مجاني
- الجهد: 15 دقيقة/يوم
- العائد المتوقع: 5–15 backlinks شهريًا من مواقع DR 50+

**قناة 2: البودكاست**
- تواصل مع 30 بودكاست لياقة شهريًا
- اقبل أي دعوة (حتى البودكاست الصغيرة)
- البودكاست الشهيرة المستهدفة: Mind Pump, Huberman Lab, Stronger by Science, Nerd Fitness, The Model Health Show, Mike Matthews' Podcast, Arabic fitness podcasts
- التكلفة: وقتك فقط
- العائد المتوقع: 2–5 backlinks شهريًا + بناء العلامة

**قناة 3: Reddit + Quora**
- أنشئ حساب باسمك الحقيقي (Ahmed + credentials)
- أجب على أسئلة اللياقة يوميًا في:
  - r/fitness, r/bodybuilding, r/nutrition, r/loseit, r/gainit
  - r/AdvancedFitness, r/naturalbodybuilding
  - Quora: متابعة مواضيع Fitness, Nutrition, Bodybuilding
- اذكر Alkemos فقط عندما يكون ذا صلة مباشرة (لا سبام)
- التكلفة: 20 دقيقة/يوم
- العائد المتوقع: حركة مباشرة + إشارات العلامة

**قناة 4: Guest Posts**
- اكتب مقالات مجانية لـ:
  - Medium (DA 95+)
  - Dev.to (DA 90+)
  - MindBodyGreen, Breaking Muscle, T-Nation (DA 80+)
  - Blogs لياقة صغيرة (DA 30–50)
- كل مقال = 1–2 backlinks + بناء سلطة شخصية
- التكلفة: 4 ساعات/مقال
- العائد المتوقع: 4–8 backlinks شهريًا

**قناة 5: YouTube**
- ابدأ قناة "Alkemos Fitness" أو "Ahmed - Alkemos Coach"
- فيديو واحد أسبوعيًا (5–10 دقائق)
- شرح تمرين + رابط للصفحة على الموقع في الوصف
- YouTube مملوك لـ Google — الروابط قوية كإشارات Entity
- التكلفة: 6 ساعات/أسبوع
- العائد المتوقع: 50 إشارة Entity/سنة + حركة مباشرة

**قناة 6: TikTok + Instagram Reels**
- فيديوهات 15–30 ثانية
- شرح تمرين + كوميدي لياقة
- رابط في البايو
- التكلفة: 3 ساعات/أسبوع
- العائد المتوقع: وصول عضوي ضخم + بناء جمهور

**قناة 7: Affiliate Program**
- فعّل برنامج `/affiliate` الموجود
- تواصل مع 50 مدوّن لياقة عربي + 50 إنجليزي شهريًا
- عرض: 30% عمولة + أدوات تسويق جاهزة (بانرات SVG موجودة في `/affiliate`)
- التكلفة: وقت التواصل
- العائد المتوقع: 10–20 backlinks شهرية من affiliates نشطين

**قناة 8: PR والصحافة**
- اكتب بيانًا صحفيًا عند كل ميلستون (1000 عضو، إطلاق ميزة، شراكة)
- وزّعه عبر PR Newswire أو PitchEngine
- استهدف: TechCrunch Arabic, Wamda, Magnitt (للسوق العربي) / Product Hunt, Hacker News (للعالمي)
- التكلفة: $200–$500 لبيان
- العائد المتوقع: 5–15 backlinks لكل بيان

### 9.3 بناء العلامة التجارية ككيان (Entity)

| المهمة | الأولوية | الجهد |
|---|---|---|
| إنشاء Facebook Page رسمية | عالية | ساعة واحدة |
| إنشاء Instagram Business | عالية | ساعة واحدة |
| إنشاء Twitter/X رسمي | عالية | ساعة واحدة |
| إنشاء LinkedIn Company Page | عالية | ساعة واحدة |
| إنشاء YouTube Channel | عالية | ساعتان |
| إنشاء TikTok Business | متوسطة | ساعة واحدة |
| إضافة Alkemos إلى Product Hunt | عالية | نصف يوم (إطلاق كامل) |
| إضافة Alkemos إلى Trustpilot | عالية | ساعة واحدة |
| طلب 10 reviews من أول 10 عملاء | عالية | أسبوع |
| إضافة Alkemos إلى Crunchbase | متوسطة | ساعتان |
| محاولة إنشاء صفحة Wikipedia | منخفضة | تحتاج notability مثبتة أولاً |
| التسجيل في ACE Fitness directory | متوسطة | ساعة |
| التسجيل في IDEA Health & Fitness | متوسطة | ساعة |
| التسجيل في NASM partner directory | متوسطة | ساعة |
| التسجيل في Google Business Profile (حتى بدون موقع فعلي) | متوسطة | ساعتان |
| إنشاء GitHub Discussions عامة | منخفضة | ساعة |
| إضافة Alkemos إلى AlternativeTo.net | متوسطة | ساعة |
| إضافة Alkemos إلى G2 / Capterra | متوسطة | ساعتان |

---

## 10. خارطة الطريق الزمنية (Implementation Roadmap)

### المرحلة 1 — الأسابيع 1–4 (Quick Wins)

**الأهداف:**
- ✅ فحص Cloudflare والتأكد من إعدادات Bot Management (تم)
- ✅ إنشاء ملف التوثيق الرئيسي (تم)
- ⏳ تنفيذ صفحات Hub/Collection الأساسية (قيد التنفيذ)
- ⏳ إضافة Hub Pages إلى sitemap-pages.xml (قيد التنفيذ)
- ⏳ إنشاء sitemap-collections.xml (قيد التنفيذ)
- ⏳ إضافة ItemList + Breadcrumb schema للـ Hub Pages

**إنجازات يدوية (الركات المالك):**
- أنشئ حسابات Facebook, Instagram, Twitter/X, LinkedIn, YouTube, TikTok
- أضف Alkemos إلى Product Hunt, Trustpilot, Crunchbase
- اطلب 5–10 reviews من العملاء الأوائل
- سجّل في Google Search Console (إن لم يكن مسجّلًا) + اربط sitemap.xml
- سجّل في Bing Webmaster Tools (إن لم يكن مسجّلًا)

### المرحلة 2 — الأشهر 2–3 (Foundation Building)

**الأهداف:**
- توسيع صفحات Hub/Collection إلى 24 صفحة (8 مجموعات عضلية × 2 لغة + 8 collections أطعمة)
- إطلاق 5 صفحات مقارنة ("Alkemos vs MyFitnessPal", إلخ)
- تفعيل OG images المخصصة للموقع
- إضافة reviewedBy schema
- بدء برنامج HARO يوميًا
- بدء Guest Posts (4 مقالات شهريًا)
- بدء Reddit/Quora اليومي
- التواصل مع 30 بودكاست شهريًا
- تفعيل برنامج Affiliate + التواصل مع 100 مدوّن

**KPIs:**
- 50 referring domain جديد
- 100K زيارة شهرية عضوية
- ظهور أول AI citation في ChatGPT/Perplexity

### المرحلة 3 — الأشهر 4–6 (Scaling)

**الأهداف:**
- توسيع مكتبة التمارين من 868 إلى 1,500+
- إطلاق النسخة الإسبانية `/es/*`
- إطلاق 3 صفحات دليل شاملة (Beginner's Guide, Cutting Guide, Bulking Guide)
- بدء قناة YouTube (4 فيديوهات شهريًا)
- بدء TikTok + Instagram Reels (3 فيديوهات أسبوعيًا)
- إعادة تقييم إعلان صفحات USDA long-tail بناءً على بيانات Search Console

**KPIs:**
- 150 referring domain جديد
- 300K زيارة شهرية عضوية
- 10 AI citations شهرية في ChatGPT/Perplexity
- Domain Rating 25+

### المرحلة 4 — الأشهر 7–9 (Market Leadership)

**الأهداف:**
- إطلاق النسخة البرتغالية `/pt/*`
- إطلاق النسخة الفرنسية `/fr/*`
- 100 صفحة Hub/Collection
- 50 صفحة مقارنة
- إطلاق أكاديمية Alkemos المعتمدة (Course schema)
- شراكات مع 3 مؤثرين لياقة عرب

**KPIs:**
- 300 referring domain جديد
- 1M زيارة شهرية عضوية
- 50 AI citations شهرية
- Domain Rating 35+

### المرحلة 5 — الأشهر 10–12 (Global Expansion)

**الأهداف:**
- إطلاق النسخة الهندية `/hi/*`
- إطلاق النسخة الإندونيسية `/id/*`
- 500K مستخدم مسجّل
- شراكة مع Dubai Fitness Challenge أو Saudi Vision 2030 fitness initiatives
- إطلاق Alkemos Pro Verified Coach badge

**KPIs:**
- 500+ referring domain
- 3M زيارة شهرية عضوية
- 200 AI citations شهرية
- Domain Rating 45+
- ظهور في Google Knowledge Panel للعلامة التجارية

---

## 11. مؤشرات الأداء (KPIs & Tracking)

### 11.1 KPIs شهرية

| المؤشر | الأداة | التكرار |
|---|---|---|
| زيارات عضوية | Google Analytics 4 + Search Console | أسبوعي |
| impressionات + نقرات + CTR + متوسط الترتيب | Google Search Console | أسبوعي |
| عدد الكلمات المفتاحية في Top 10 | Search Console + Ahrefs | شهري |
| عدد الصفحات المفهرسة | Search Console + Bing WMT | شهري |
| Core Web Vitals (LCP, INP, CLS) | Vercel Speed Insights + CrUX | شهري |
| Backlinks + Referring Domains | Ahrefs / Semrush / Moz | شهري |
| Domain Rating / Authority | Ahrefs / Moz | شهري |
| AI citations | Manual testing + Profound (عند التوفّر) | أسبوعي |
| تحويلات Memberships | Stripe + Supabase | أسبوعي |
| توقيع Coach signups | Supabase | شهري |

### 11.2 KPIs ربع سنوية

| المؤشر | الهدف Q1 | الهدف Q2 | الهدف Q3 | الهدف Q4 |
|---|---|---|---|---|
| زيارات عضوية شهرية | 50K | 150K | 500K | 1M |
| Referring Domains تراكمي | 50 | 150 | 300 | 500 |
| AI citations شهرية | 5 | 25 | 100 | 300 |
| Domain Rating | 15 | 25 | 35 | 45 |
| Memberships جديدة | 50 | 200 | 500 | 1,000 |
| Coach signups | 10 | 30 | 75 | 150 |

### 11.3 تنبيهات (Alerts)

| الحدث | الإجراء |
|---|---|
| انخفاض زيارات عضوية > 20% أسبوعيًا | تحقق من Search Console Manual Actions + Core Update |
| انخفاض Domain Rating > 5 نقاط | راجع جودة الـ backlinks الجديدة |
| ارتفاع LCP > 2.5s | راجع Vercel deployment logs + Cloudflare cache |
| ظهور صفحة في Search Console بـ "soft 404" | أضف `notFound()` أو محتوى حقيقي |
| زيادة Crawl Errors > 10% | راجع robots.txt + sitemap + server logs |

---

## 12. سجل التنفيذ (Implementation Log)

> **انتقل حرفيًا إلى `docs/archive/SEO-GEO-EXECUTION-LOG.md` (المرحلة 291 — ARCH-REMEDIATION):** سجل التنفيذ الكامل (§12.1→§12.53 وخطة التدقيق الخارجي وتنفيذ P0) أُخرج من ملف الخطة إلى ملف السجل المؤرشف — الخطة هنا والتنفيذ هناك؛ الإدخالات الجديدة تُلحق بملف السجل.

## 13. الملاحق (Appendices)

### Appendix A — خريطة الموارد (Resource Map)

| السؤال | المصدر |
|---|---|
| قواعد التشغيل | `AGENTS.md` |
| الحالة الراهنة للمشروع | `STATE.md` |
| عتبات Core Web Vitals | `docs/SEO-CWV-THRESHOLDS.md` |
| إطار E-E-A-T | `docs/SEO-EEAT-FRAMEWORK.md` |
| مرجع Schema.org | `docs/SEO-SCHEMA-REFERENCE.md` |
| أدوات CI | `docs/CI_GATES.md` |
| المرجع التقني | `docs/TECH_REFERENCE.md` |
| خطة SEO/GEO | هذا الملف |

### Appendix B — أدوات خارجية موصى بها

| الأداة | الاستخدام | التكلفة |
|---|---|---|
| Google Search Console | فهرسة + أداء بحث | مجاني |
| Bing Webmaster Tools | فهرسة Bing + Copilot | مجاني |
| Ahrefs Webmaster Tools | backlinks + technical audit | مجاني (محدود) |
| Semrush Free | keyword research | مجاني (محدود) |
| Moz Link Explorer | Domain Authority | مجاني (محدود) |
| Schema.org Validator | التحقق من JSON-LD | مجاني |
| Rich Results Test | اختبار rich snippets | مجاني |
| PageSpeed Insights | أداء + Core Web Vitals | مجاني |
| CrUX Vis | بيانات حقلية حقيقية | مجاني |
| Profound / Otterly | AI Search tracking | مدفوع |

### Appendix C — قائمة التحقق الشهرية (Monthly Checklist)

- [ ] مراجعة Google Search Console: Coverage + Performance + Core Web Vitals
- [ ] مراجعة Bing Webmaster Tools: نفس الفحوصات
- [ ] مراجعة Vercel Speed Insights: LCP, INP, CLS
- [ ] مراجعة Ahrefs: backlinks جديدة + lost + Domain Rating
- [ ] اختبار يدوي للعلامة في ChatGPT, Perplexity, Gemini, Claude
- [ ] فحص `site:alkemos.com` في Google + Bing (عدد الصفحات المفهرسة)
- [ ] فحص broken links (Screaming Frog أو Ahrefs)
- [ ] تحديث `llms.txt` و `llms-full.txt` بأحدث المقالات
- [ ] مراجعة المنافسين: ما الجديد لديهم؟
- [ ] تحديث STATE.md و هذا الملف بأي إنجازات جديدة

### Appendix D — إخلاء المسؤولية

- هذا الملف هو **وثيقة حية** — يُحدَّث مع كل تنفيذ
- الأرقام التقديرية للمنافسين مأخوذة من Similarweb/Ahrefs وقد تختلف عن الواقع
- أي تنفيذ تقني يخضع لقواعد `AGENTS.md` (مراجعة المالك قبل الدفع للإنتاج)
- لا تُنشئ ملفات منافسة لهذا — حدّث هذا الملف فقط
