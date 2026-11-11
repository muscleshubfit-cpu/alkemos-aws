# سجل التنفيذ الخام — SiteOne Crawler v2.5.1

> **الأداة:** SiteOne Crawler v2.5.1.20260627 — من المصدر الرسمي `github.com/janreges/siteone-crawler` (إصدار v2.5.1 بتاريخ 2026-06-27) — حمُّل ثنائي Linux x64 الرسمي `siteone-crawler-v2.5.1-linux-x64.tar.gz` وشُغّل محليًا.
> **نافذة التنفيذ:** 2026-11-10 ~18:45 → 2026-11-11 (توقيت الجلسة UTC+8؛ الطوابع داخل الملفات الخام UTC).
> **الهدف:** https://alkemos.com — **بذور الزحف:** كل روابط الـ Sitemap السبعة (2,359 رابطًا) + الرئيسية = 2,360 بذرة، مع تتبع كل الروابط الداخلية المكتشفة.

## أوامر التنفيذ الحرفية

```bash
# التشغيل النهائي الكامل (بعد تعبئة كاش HTTP عبر 8 دفعات متتالية — نفس الخيارات):
./siteone-crawler \
  --url-list=/home/z/my-project/audit-work/crawl-seed-urls.txt \
  --workers=2 --max-reqs-per-sec=3 --timeout=15 \
  --max-visited-urls=13800 --max-queue-length=25000 \
  --disable-images \
  --result-storage=file --result-storage-compression \
  --http-cache-dir=<dir> \
  --timezone=Africa/Cairo --rows-limit=2000 \
  --output-html-report=alkemos-final-report.html \
  --output-json-file=alkemos-final-output.json \
  --output-text-file=alkemos-final-output.txt \
  --sitemap-xml-file=crawl-discovered-sitemap.xml \
  --sitemap-txt-file=crawl-discovered-urls.txt \
  --offline-export-dir=<dir> --offline-export-no-url-rewriting \
  --offline-export-remove-unwanted-code=0
```

## سياسة الأدب مع الخادم (احترام حدود الإنتاج)

- **معدل ثابت 3 طلبات/ثانية كحد أقصى** (`--max-reqs-per-sec=3`) وعاملان متزامنان فقط (`--workers=2`).
- **احترام robots.txt كاملًا** (الوضع الافتراضي؛ لم يُستخدم `--ignore-robots-txt` إطلاقًا) — 6 روابط خاصة حُجبت تلقائيًا بrobots.txt.
- **كاش HTTP دائم على القرص بين الدفعات** — أي رابط زُحف مرة واحدة لا يُطلب من الخادم مجددًا مهما أعيد التشغيل (المقياس: إعادة زحف 1,600 رابط من الكاش استغرقت 19.7 ثانية بدل ~9 دقائق).
- **تعطيل تنزيل الصور** (`--disable-images`) لتقليل الحمل؛ فُحصت JS/CSS/الخطوط كاملة (95 أصلًا فريدًا كلها 200).
- هوية User-Agent الأصلية للأداة (SiteOne-Crawler/2.5.1) — بلا انتحال لهوية Googlebot في الزحف الشامل.
- التعداد التكميلي لصفحات الترقيم (سكربتات `raw/scripts/`) نفّذ بمعدل 3 طلبات/ثانية كذلك (442×2 صفحة أطعمة + 88 صفحة تمارين + 442 صفحة ترقيم عربية بأسماء العرض).

## ماذا تعني كل ملف خام

| الملف | المحتوى |
|---|---|
| `alkemos-siteone-report.html.gz` | تقرير SiteOne HTML الرسمي الكامل (فك الضغط ثم افتح بالمتصفح) — 20.9MB قبل الضغط |
| `alkemos-siteone-output.json.gz` | مخرجات JSON الكاملة: 13,800 نتيجة لكل رابط (الحالة/الزمن/الحجم/الكاش) + كل جداول التحليل |
| `alkemos-final-output.txt` | الملخص النصي الرسمي للأداة |
| `crawl-discovered-urls.txt` | كل الروابط الـ13,800 المكتشفة والمزحومة |
| `crawl-discovered-sitemap.xml.gz` | sitemap لما زحفته الأداة |
| `../analysis/all-pages-metrics.csv.gz` | القياسات لكل صفحة (14,504 صفحة): robots/canonical/title/desc/H1/كلمات/أنواع Schema/روابط داخلية |
| `../analysis/noindex-pages.csv` | كل الصفحات الـ523 noindex المكتشفة (عناوينها وقيم robots) |
| `../analysis/affected-pages-classified.csv` | الصفحات المتأثرة مصنفة بالمشكلة والخطورة |
| `../food-enumeration/*` | تعداد ذيل الأطعمة الكامل (8,831 EN + 8,831 AR) + انقسام noindex العربي + تمارين |

## حدود التنفيذ الموثقة

- غطى الزحف 13,800 رابطًا من مجال داخلي يقدَّر بـ ~22 ألف رابط فريد (بما فيها ~9,838 صفحة ترقيم/فلترة بارامترية)؛ الذيل المتبقي (ذيل أطعمة غير مزحف بالكامل) عُدّ تعدادًا حتميًا عبر صفحات الترقيم ووُثّق في `../food-enumeration/` — وقاعدة تصنيفه (noindex العربي) تحققت بنسبة 100% (1,155/1,155 مطابقة مع العينة المزحفة).
- النسخة الخام الكاملة لصفحات الموقع (2GB) بقيت محلية خارج المستودع (حجمها يتجاوز المعقول للرفع)؛ كل القياسات المشتقة منها موثقة في `../analysis/`.
- صفحات ترقيم الأطعمة العربية الخام (442 ملف HTML) بقيت محلية كذلك لذات السبب؛ استُخرج منها `ar-foods-named.json` (غير مرفوع — ملخصه `ar-noindex-split.json` مرفوع) — الأسماء الخام متاحة بإعادة تشغيل `raw/scripts/ar_listing_sweep.py`.
