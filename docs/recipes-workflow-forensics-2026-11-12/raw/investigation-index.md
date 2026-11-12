# الفهرس — خام التحقيق RECIPES-WORKFLOW-FAILURE-FORENSICS-2026-11-12

كل ملف هنا خام قابل لإعادة الإنتاج من مصادره (لا تعديل يدوي). لقطات «قبل الإصلاح»: 2026-11-12 ~16:30–17:10 UTC · لقطات «بعد الإصلاح والنشر»: ~17:12–17:25 UTC.

## الملفات

| الملف | المصدر (أمر إعادة الإنتاج) | ما هو |
|---|---|---|
| `runs-index.tsv` | `GET /repos/muscleshubfit-cpu/alkemos-aws/actions/workflows/412596246/runs?per_page=50` | كل تشغيلات `recipe-post.yml` الثمانية قبل الإصلاح (الرقم/المعرّف/النوع/النتيجة/التوقيت/الـSHA) |
| `run-42840870767-generate.log` | `GET /repos/.../actions/runs/42840870767/logs` (فك الضغط) | التشغيلة الناجحة الوحيدة بschedule قبل الإصلاح (10-11: تخطٍّ صادق already_published_today — للمقارنة) |
| `run-43040277363-generate.log` | نفس القناة `runs/43040277363/logs` | فشل 11-11: R5/Q-GATE-4 → عقد r0 → 409 wrong_status ×3 (دليل RC3+RC1) |
| `run-43121573764-generate.log` | `runs/43121573764/logs` | فشل backstop 23:40 ليوم 11: R1 duplicate one_per_day → 409 (دليل RC4) |
| `run-43248163699-steps/` | `runs/43248163699/logs` (منفصلة بالخطوات) | فشل 12-11: R1 duplicate pair_slug (دليل RC2+RC1) + سجل R0 بخطوة منفصلة |
| `db-recipe_generation_queue-before.json` | PostgREST `GET {SUPABASE_URL}/rest/v1/recipe_generation_queue?select=*` | كل صفوف الطابور السبعة قبل الإصلاح (الحالات/الأخطاء/الأهداف) |
| `db-recipes-before.json` | PostgREST `GET /rest/v1/recipes?select=*` | الصفوف الثلاثة قبل الإصلاح (منشور + in_production×2 — دليل العلق/RC4) |
| `db-recipe_versions-before.json` | PostgREST `GET /rest/v1/recipe_versions?select=recipe_id,language,slug,is_published` | 6 نسخ: الزوج المنشور + محاولتا held كاملتا النسختين — النشر الذري سليم بلا أي منفرد |
| `workflows-branch-filter-inventory.txt` | `grep -rn "ain\]" .github/workflows/*.yml` | جرد ملاحظة §8-2: السطور العشرة الفاسدة بسبعة ملفات سير |
| `run-43266172910-steps/` | `runs/43266172910/logs` (منفصلة بالخطوات — 20 ملفًا) | **التشغيلة اليدوية المضبوطة بعد الدفع (كوميت 582395c3): R0→R7 كلها خضراء** — سجل الإصلاح قيد التشغيل الحي |
| `db-recipe_generation_queue-after.json` | نفس قناة before | الطابور بعد: f782460a published (اليوم مُخدوم) والصفوف السبعة التاريخية كما هي |
| `db-recipes-after.json` | نفس القناة | recipes بعد: 4b6d0a2d published · grilled-chicken-machboos · **gulf×lunch** (دليل دوران LRU) |
| `db-recipe_versions-published-pair.json` | PostgREST `?recipe_id=eq.4b6d0a2d...&select=*` | نسختا الزوج المنشور (ar+en) بـis_published=true وpublished_at واحد — الذرية مقيسة |
| `live-verify-43266172910.md` | سير + قاعدة + موقع حي | ملخص التحقق الحي الكامل: الخطوات/الزوج/القاعدة/الموقع بالغتين/CI ‏5/5 |

## ملاحظات

- سجلات GitHub تحمل القيم السرية مقنعة `***` من المنبع (لا أسرار بالخام).
- أحداث الأفكار المخزنة (المصادر) مذكورة بالتقرير §3 مقتبسة من عمود `idea` بصفوف الطابور أعلاه (من `db-recipe_generation_queue-before.json`).
- للقارئ: الترتيب الزمني الكامل للتشخيص والإصلاح بمدخل `RECIPES-WORKFLOW-FAILURE-FORENSICS-2026-11-12` في `worklog.md`.
