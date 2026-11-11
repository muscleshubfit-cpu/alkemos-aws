# اختبار تكافؤ الهويات — Googlebot مقابل الزائر العادي (2026-11-10/11)

## 1. تكافؤ البايتات: Googlebot مقابل Chrome (7 مسارات × 5 عائلات صفحات)

| المسار | Googlebot/2.1 | Chrome عادي | الحكم |
|---|---|---|---|
| `/` الرئيسية | 200 · 337,797B | 200 · 337,797B | **متطابقان بايت-ببايت** (md5 واحد) |
| `/ar/blog/hiit-home-workout-guide` | 200 · 177,079B | 200 · 177,079B | **متطابقان** |
| `/foods/chicken-breast` | 200 · 124,194B | 200 · 124,194B | **متطابقان** |
| `/exercises/34-sit-up` | 200 · 146,802B | 200 · 146,802B | **متطابقان** |
| `/ar/diet-plan/3000/vegetarian` | 200 · 143,539B | 200 · 143,539B | **متطابقان** |
| `/muscles/chest` | 200 · 181,603B | 200 · 181,603B | **متطابقان** |
| `/compare/alkemos-vs-myfitnesspal` | 200 · 145,109B | 200 · 145,109B | **متطابقان** |

**الخلاصة:** صفر تمويه (Cloaking) وصفر حجب مبني على الهوية على كل العائلات المفحوصة.

## 2. الرئيسية عبر 5 هويات (زائر عادي / Googlebot ديسكتوب / Googlebot موبايل / Bingbot / GPTBot)

| الهوية | HTTP | الحجم | TTFB |
|---|---|---|---|
| Chrome عادي | 200 | 337,797B | 42ms |
| Googlebot/2.1 | 200 | 337,797B | 40ms |
| Googlebot Smartphone | 200 | 337,797B | 53ms |
| bingbot/2.0 | 200 | 337,797B | 56ms |
| GPTBot/1.1 | 200 | 337,797B | 48ms |

**الخلاصة:** استجابة واحدة موحدة لكل الهويات — لا تخصيص ولا حجب ولا تحدي.

## 3. أزمنة استجابة روبوتات الذكاء الاصطناعي (9 مسارات × 3 هويات — ملف `../analysis/ai-crawler-times.json`)

| المسار | GPTBot | ClaudeBot | PerplexityBot |
|---|---|---|---|
| `/` | 200/265ms | 200/46ms | 200/42ms |
| `/foods/chicken-breast` | 200/52ms | 200/45ms | 200/44ms |
| `/ar/foods/chicken-breast` | 200/44ms | 200/53ms | 200/40ms |
| `/exercises/34-sit-up` | 200/318ms | 200/45ms | 200/54ms |
| `/tools/body-fat-calculator` | 200/39ms | 200/36ms | 200/43ms |
| `/blog/hiit-home-fat-burning-workout` | 200/293ms | 200/40ms | 200/43ms |
| `/foods?page=2` | 200/343ms | 200/41ms | 200/37ms |
| `/ar/blog/hiit-home-workout-guide` | 200/43ms | 200/41ms | 200/45ms |
| `/diet-plan/2500/balanced` | 200/47ms | 200/41ms | 200/36ms |

**الخلاصة:** 27/27 استجابة 200 سليمة، أقصى زمن 343ms — **لا يوجد أي مسار بطيء لروبوتات الذكاء الاصطناعي** في القياس المستقل (ادعاء Ahrefs عن «صفحة واحدة بطيئة عند زحف AI Crawlers» لم يتكرر — يُرجَّح أنه عابر في لحظة قياسهم).

## 4. التحويلات والقواعد العامة

| الفحص | النتيجة |
|---|---|
| `http://alkemos.com/` | 301 → `https://alkemos.com/` |
| `https://www.alkemos.com/` | 301 → `https://alkemos.com/` |
| `/exercises/34-sit-up/` (شرطة ختامية) | 308 → المسار النظيف |
| `/foods/chicken-breast/` (شرطة ختامية) | 308 → المسار النظيف |
| `musclehubeg.vercel.app` (النطاق القديم) | 301 → `https://alkemos.com/` |
| صفحة 404 (مسار غير موجود بهوية Googlebot) | 404 صحيحة (ليست Soft 404) |
| روابط داخلية بشرطة ختامية أو www أو http (عينة 3,000 صفحة) | **صفر** — كل الروابط الداخلية نظيفة |

## 5. ترويسات الرئيسية (الملف الخام `home_headers.txt`)

تشمل: `strict-transport-security: max-age=63072000; includeSubDomains; preload` · CSP كاملة (تقرير + فرض) · `x-content-type-options: nosniff` · `x-frame-options: SAMEORIGIN` · `referrer-policy: strict-origin-when-cross-origin` · `permissions-policy` كاملة · `content-language` · `cache-control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400` — ولا وجود لأي `X-Robots-Tag` في أي استجابة (فُحص على مستوى الزحف الكامل: صفر).
