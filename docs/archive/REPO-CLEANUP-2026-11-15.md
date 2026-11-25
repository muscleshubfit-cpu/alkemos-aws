# تنظيف وإعادة تنظيم مستودع Alkemos — 2026-11-15

> **معرّف المهمة:** REPO-CLEANUP-2026-11-15 · **النوع:** تنظيف مستودع بأمر المالك المباشر (العمل على `main` مباشرة · بلا إعادة كتابة سجل Git · بلا Force Push) · **القيد الحاكم:** تقليل الحجم والتعقيد الفعليين — لا مجرد نقل ملفات إلى مجلد أرشيف آخر.
> **المرجعية المركزية بعد التنظيف (خريطة الوكيل القادم):** الحالة الحية والمهام المفتوحة = `STATE.md` (المصدر الرسمي الوحيد — قانون المرحلة 115) · خطة التنفيذ والمتبقي = قسما «المفتوح الآن» و«بانتظار موافقة المالك» بSTATE + الخطط المصدر التي يشيران إليها · سجل التنفيذ = `worklog.md` (النافذة الحية ≤12 مدخلًا) + `archive/WORKLOG_ARCHIVE.md` (التاريخ الكامل) · فهرس كل تقارير docs = `docs/README.md` · قوانين العمل = `AGENTS.md`.

## 1. الخلاصة في ثلاث جمل

حُذف **194 ملفًا** (تقارير مراحل منتهية ومكررة + خام أدلة لأطوار مغلقة + أدوات repro لمهام منتهية + 5 صور متحقق من عدم استخدامها حيًا) — **صفر مساس** بأي كود أو اختبار أو ميجريشن أو تكوين أو سلوك إنتاج، وصفر إعادة كتابة للتاريخ. العملية جرت بخريطة مراجع كاملة (كل ملف حُذف فُحص من يقتبسه من: STATE · AGENTS · الوثائق الخمس الحاكمة · worklog · السجل · سير عمل CI · scripts · src · الاختبارات · قاعدة البيانات الحية) وكل مرجع حي حُدّث. المجلد الجذري docs انكمش من 108 إلى 55 ملف markdown، وحجم شجرة العمل من 139MB إلى ~121MB، مع توصية موثقة للمالك بشأن انتفاخ سجل Git التاريخي (§7).

## 2. منهجية الحذف (كيف ضُمن عدم فقدان أي شيء)

1. **خريطة مراجع كاملة أولًا:** بُني فحص آلي يعدّ كل إشارة لكل ملف مرشح للحذف عبر كل الأسطح الباقية (STATE.md · AGENTS.md · README/GUIDE/SECURITY/DESIGN · docs/README.md · worklog.md · سير عمل CI الـ57 · scripts · src · الاختبارات · supabase/migrations · deploy).
2. **قاعدة الاقتباس الحامل:** ملف يقتبسه سطح حي بوصفه مصدرًا (بوابة CI · اختبار يقرأه من القرص · كود إنتاج · وثيقة حاكمة حية) **يبقى**؛ ملف لا يقتبسه إلا السجل (registry يُحدَّث · worklog/archive أرشيف تاريخي) **يُحذف**.
3. **قاعدة القيمة الفريدة:** التقرير الذي يحمل قرارًا معلقًا أو أمرًا جاهزًا أو قائمة نشطة يبقى (مثل 13 §8 و17 §8 و19) حتى لو كان تقرير مرحلة منتهية.
4. **التحقق الحي:** الصور الخمس المحذوفة تُحقق من عدم استخدامها بالكود +-scripts + القاعدة الحية (محتوى المقالات وfeatured_image وجداول الوصفات عبر PostgREST قراءة-فقط) — كلها صفر إشارة.
5. **شبكة الأمان المطلقة:** إعادة كتابة التاريخ ممنوعة — كل بايت محذوف يظل متاحًا حرفيًا في سجل Git عند آخر كوميت قبل التنظيف (الأب المباشر لكوميت التنظيف).

## 3. المحذوف (194 ملفًا) بالأسباب

### 3-أ. جذر docs/ — 53 تقرير مراحل منتهية/مكتفى بها
| الفئة | الملفات | سبب الحذف |
|---|---|---|
| سلسلة توسيع مزودي AI (8) | AI-PROVIDERS-EXPANSION-AUDIT + PHASE2 + PHASE3 + PHASE4 + PHASE5A + PHASE5B + PHASE5C · AI-PLAN-QUALITY | كل مراحل §10 نُفّذت واختُبرت حيًا والتوحيد مكتمل — الحاكم النهائي `AI-ROUTER-UNIFICATION-AUDIT-2026-10-31.md` (محتفظ به، يقرؤه اختبار ai-registry.test.ts) + الكود `src/lib/ai-provider.ts` |
| سلسلة تعافي المدونة (2) | BLOG-PIPELINE-RECOVERY-2026-10-20 · -2026-10-21 | مراحل وسيطة لنفس المهمة؛ الحاكم BLOG-PIPELINE-RECOVERY-2026-10-16 (محتفظ به — تقتبسه سيرتا blog-post-ar/en) |
| سلسلة ثنائية اللغة (4) | BILINGUAL-CONTENT-SEO-GEO-CONVERSION-AUDIT · -PHASE2-EXECUTION · BILINGUAL-EDITORIAL-AUDIT · -444B-CLOSURE | سلسلة 444 مغلقة وقوانينها صارت كودًا (blog-editorial-law.ts)؛ جولة R2 اللاحقة (محتفظ بها) تحمل الحالة النهائية |
| تحريرية/محتوى منتهية (7) | AR-COPY-REWRITE · BLOG-CORPUS-TRIAGE · EDITORIAL-QUALITY-AUDIT · PRIORITY-PAGES-CONTENT-AUDIT · CONTENT-AUDIT-REMEDIATION · DOCUMENTATION-REWRITE-REPORT · -CORRECTIONS | بنودها منفذة بالكامل وموثقة بworklog وSTATE؛ القوانين الحية بblog-editorial-law.ts وblog-quality-gates.ts |
| جذور أعمار منتهية (5) | REGEN-ROOTCAUSE-2 · SWAP-ROOTCAUSE-FOODLIBRARY · SUB-PICK-MEMBER-SWAP · ADMIN-ROLE-LOSS-FORENSICS · KETO-LAW-SWAP-DURABILITY | كل إصلاحاتها مدمجة بالكود + كاناريات دائمة + ميجريشنز موثقة؛ أصل القصة بالتاريخ وبworklog |
| أداء منتهٍ (2) | PERFORMANCE-AUDIT-2026-09-28 · PERSONAL-COACH-RENAME | الأول متقادم قبل تدقيق 11-08 (المحتفظ به)؛ الثاني rename منفذ |
| خطط منتهية (5) | PLAN-TRIO · PLAN-REGEN-CONSTRAINTS · PLAN-EDIT-MOBILE · NUTRITION-FALLBACK-TITLES-DRAFTS · VERCEL-BACKUP-MIGRATION-PLAN | خطط نفذت أو تقادمت (الهجرة إلى AWS منتهية — الحاكم VERCEL-TO-AWS محتفظ به)؛ القيود صارت كودًا (plan-ai-validation.ts) |
| SEO مراحل منتهية (12) | SEO-ADSENSE-RECOVERY-PLAN · SEO-COLLAPSE-AUDIT · -PERSISTENCE-VERDICT · -ROOTCAUSE-2026-11-05 · SEO-INDEXING-COLLAPSE-INVESTIGATION · SEO-P0-BASELINE · SEO-P1-2 · SEO-P1-7 · SEO-P1-8 · SEO-P1-9 · SEO-P1-PSI-AFTER · SEO-REQUEST-INDEXING-OUTCOME | سلسلة انهيار الفهرسة أُغلقت نهائيًا (التقرير 18 بالسلسلة أدناه) وخلاصاتها الحاكمة مستخلصة بفهرس السلسلة + GSC-RE-AUDIT (محتفظ)؛ بنود P1 نفذت وسجلها التنفيذي بdocs/archive/SEO-GEO-EXECUTION-LOG.md |
| متفرقات منتهية (7) | QA-TEST-ACCOUNTS-CLEANUP-451 · NUTRITION-GRAM-SCALING-AUDIT · SOCIAL-OG-2 · -3 · -4 · COMPREHENSIVE-SITE-AUDIT | الحاكم الحي لكل منها قائم (BLOG-WEEKLY-CADENCE بقانون AGENTS · QA-TEST-ACCOUNTS ب4 أسطح حاكمة · قانون OG ب113 اختبارًا · التدقيق الشامل خلفه خطة النمو النشطة docs/seo-growth-audit-2026-11-05/) |

### 3-ب. سلسلة تدقيق الفهرسة docs/seo-indexing-audit-2026-11-11/ — 14 تقريرًا + 12 مجلد خام
- **حُذف:** التقارير 01–12 و14 و15 (مراحل التحقيق والتحقق والتنفيذ المكتفى بها — خلاصاتها الحاكمة مستخلصة حرفيًا بفهرس السلسلة README.md المُعاد كتابته والتقرير 18) + مجلدات الخام لأطوار مغلقة (siteone-crawler ‏5.6MB · food-enumeration ‏1.1MB · sitemaps ‏940K · analysis ‏940K · g1-commercial-pages ‏532K · gsc-coverage · cf-cache-rule-fix · cloudflare · ua-tests · external-audit-verification · scripts · verification-round2). **أُبقيا عمدًا خاما القرار النشط:** gsc-performance-2026-11-12 (فيه `b4-ctr-targets.json` — أساس أمر B4 الجاهز بالتقرير 19 §6) وb3-protein-intent-audit-2026-11-12 (خام عائلة البروتين للتقرير 17).
- **بُقي (ذو البنود النشطة):** 13 (قائمة §8 للـ25 تجارية غير متحققة — بند مالك نشط) · 16 (دليل نشر B1/B2) · 17 (أمر B4 الجاهز + قرارات الأزواج) · 18 (الإغلاق النهائي) · 19 (القرارات المعلقة) + الخام النشط الخمسة: raw/pending-decisions-orders-2026-11-12 · raw/gsc-re-audit-2026-11-12 · raw/plan-execution-publish-2026-11-12 · raw/gsc-performance-2026-11-12 · raw/b3-protein-intent-audit-2026-11-12.

### 3-ج. خام حوادث منتهية أخرى
- **docs/recipes-workflow-forensics-2026-11-12/** (42 ملفًا): خام تحقيق جذور فشل الوصفات — الحادث مغلق ومتحقق حيًا؛ التقرير الحاكم docs/RECIPES-WORKFLOW-FAILURE-FORENSICS-2026-11-12.md محتفظ به (تقتبسه README الجذرية واختبار recipes-idea-forensics.test.ts).

### 3-د. أدوات repro لمهام منتهية
- **scripts/repro/sub_pick_repro.py · regen-repro.mts · fetch-ai-job-fixtures.py:** أدوات استنساخ لحظية لجذور أُصلحت (ميجريشن 0102 + canaries دائمة)؛ بقيت إشاراتها التاريخية بتعليقات الكود (تسمح بها قاعدة guard-stale-refs للتعليقات) والتوثيق حُدّث.
- **5 ملفات بيانات قابلة لإعادة التوليد بscripts/repro/food-arabization-batch5/** (remaining_untranslated · target_translatable · generated_names · final_names · translated_names — ~4.4MB): حالة pipeline وُظفت بالفعل في `src/lib/foods.ts` (مصدر الحقيقة)؛ **حُتفظ بالمحرك والمعاجم والمراجعات اليدوية** (engine.py + lexicon*.py + overrides/ + review/ + manual_queue.json + excluded_*.json) — الخط قابل لإعادة التشغيل من القاعدة.

### 3-هـ. أصول عامة غير مستخدمة (5 صور — ~1.5MB)
- **public/images/fitness-portrait.jpg · fitness-dark.jpg · meal-bowl.jpg · meal-clean.jpg · running-outdoor.jpg:** صفر إشارة بالكود/السكربتات/التوثيق **وبالقاعدة الحية** (محتوى المقالات + featured_image + جداول الوصفات — استعلام PostgREST قراءة-فقط 2026-11-15). مكتبة التمارين (74MB) والهوية والفئات كلها سليمة بلا مساس.

## 4. المحتفظ به صراحة (استثناءات درءها الاقتباس الحي)

| الملف | سبب الإبقاء رغم كونه تقرير مرحلة |
|---|---|
| ARCHITECTURE-AUDIT-REPORT-2026-09-28.md | CI_GATES.md يحتكم إليه كمصدر «تحصين IV» (دفعات docs-only تتخطى البطارية) |
| EMERGENCY-RECOVERY-AUDIT-2026-09-20.md | أساس سلسلة الاستعادة (HARDENING-PLAN · RECOVERY-SECRETS-SOURCES §8 · SUPABASE-RUNBOOK · BACKUP-STRATEGY تقتبسه) |
| PERFORMANCE-AUDIT-2026-11-08.md | PERF-VERCEL-UNIFIED-EXECUTION (نشط — تقتبسه STATE وسير عمل caddy) يسميه «المرجع الحاكم» الأول |
| BILINGUAL-LANGUAGE-AUDIT-2026-11-12.md | بروتوكول R2 (المحتفظ به) يلزم قراءته كاملة قبل تنفيذ قراراته |
| CONTENT-QUALITY-SEO-GEO-AUDIT-2026-09-28.md | AUDIT_REPORT.md (الجذر — تقتبسه STATE وخمسة ملفات src) يوثقه كمصدر المقارنة |
| GSC-CONNECTION-STATUS-2026-09-30.md (2KB) | يقتبسه تقرير الإغلاق 18 المحتفظ به |
| BLOG-WEEKLY-COMPENSATION-REVIEW-2026-11-13.md · -FIX-2026-11-13.md | §6 بالمراجعة = مواصفة إصلاح FIFO المعتمدة (نُفّذ بموافقة المالك) — CADENCE الحي يقتبسها؛ والتقريران زوج سرد واحد |
| docs/archive/ كاملًا (31 ملفًا) | أرشيف المشروع المesignated بقانون المرحلة 236 — محكوم بسجل docs/README.md وقانون append-only، ويقرأ ملفٌ منه اختبار auth-callback-origin.test.ts؛ أزيل فقط الفائض من جذر docs لا من الأرشيف المنظم |
| scripts/blog-runner/ كاملًا (بما فيه ~5MB دفعات) | كاناري article-treatment-batch.test.ts يسجل كل دفعة (قاعدة born-gated) والدفعات سجل التطبيقات على القاعدة |
| supabase/ و.github/ وdeploy/ وsrc/ وpublic/assets المستخدمة | إنتاج/اختبارات/تكوين — لم تُمس إطلاقًا |

## 5. المحررات (تحديث الفهارس والروابط — «حدّث الفهارس»)

1. **docs/README.md (السجل المركزي):** حُذفت 70 صفًا للمحذوفات (صف ↔ ملف — قانون ثنائية الفحص M) + أُضيف صف هذا التقرير.
2. **docs/seo-indexing-audit-2026-11-11/README.md:** أُعيدت كتابته فهرسًا للباقي مع الخلاصات الحاكمة حرفيًا ولوحة «ما أزيل وأين يجد».
3. **docs/healthy-recipes-platform/AUDIT.md:** إحالة الحصص صارت لتقرير التوحيد بدل سلسلة التوسيع المحذوفة.
4. **docs/AUTHORITY-ENGINE-RELATION-2026-11-09.md:** إحالة «سبب الوجود» صارت لتقرير الإغلاق 18 بدل SEO-COLLAPSE-ROOTCAUSE.
5. **docs/seo-growth-audit-2026-11-05/README.md:** إحالة خطة استرداد AdSense السابقة صارت نصًا موصوفًا بالإزالة.
6. **docs/BACKUP-STRATEGY-2026-10-03.md:** أُسقطت الإحالة لخطة النقل المحذوفة (أُبقي الاستناد للتدقيق وخطة التقوية وmirror).
7. **docs/QA-TEST-ACCOUNTS-2026-10-26.md:** سابقة أداة الاستنساخ صارت توثيقًا مؤرخًا بلا مسار ميت.
8. **STATE.md:** سطر التحديث = التنظيف + سطر 453-هـ2 أُسقط منه مؤشر الخام المحذوف (ضمن سقف 100 سطر/32,000 بايت: النتيجة 100/31,994).
9. **worklog.md:** مدخل المهمة أعلى النافذة + تدوير ميكانيكي بscripts/worklog_rotate.py بنفس الكوميت (قانون H5).

**سياسة المراجع التاريخية المتبقية (موثقة بقصد):** التقارير المحتفظ بها تحكي أحيانًا ملفات محذوفة بوصفها تاريخًا (مثل إحالة VERCEL-TO-AWS §خطة المفاتيح، وقائمة «التقارير الحاكمة المرتبطة» بتقرير التوحيد، وإشارات مدخلات worklog الأقدم) — هذه سرديات أرشيفية لا روابط تشغيلية، ومحتواها متاح بسجل Git قبل كوميت التنظيف؛ لا تعدل النصوص التاريخية.

## 6. التحقق (قبل الدفع)

- **بوابة نظام المعرفة `docs_audit.py`:** خضراء — A/B/C/D/D2/E/F/G/H/H4/H5/K/J + عائلات Phase-274 (L/M/N/P/Q/R/T) — أبرزها: M ثنائي الاتجاه (55 ملف docs جذر كلها مسجلة وكل مسارات الصفوف قائمة) وR (كل المسارات المُضمنة بالأسطح الخمسة الحاكمة موجودة) وH5 (worklog ≤12 مدخلًا بعد التدوير).
- **`docs_parity.py`:** أخضر (خريطة ترقيم INDEX.md تطابق الملفات — لم تُمس الميجريشنز).
- **`check-stale-refs.sh`:** أخضر (صفر معرفات متقاعدة خارج التعليقات).
- **فحص المراجع المتبقية:** صفر إشارة من أي سطح حي إلى أي ملف محذوف (ما عدا سرديات التاريخ الموثقة أعلاه).
- **صفر مساس:** لا src · لا tests · لا supabase/migrations · لا workflows · لا تكوين إنتاج — الدفعة docs + أصول محذوفة فقط؛ بطارية CI الكاملة تعمل على paths غير docs (الصور) وستثبت الخضرة بنفسها.

## 7. تشخيص انتفاخ سجل Git التاريخي (توصية للمالك — لم يُنفذ بحكم القيدين)

شجرة العمل 139MB لكن **.git = 314MB packed** — المصدر المقيس (إجمالي النسخ عبر التاريخ):
| الملف | إجمالي النسخ عبر التاريخ | عدد النسخ |
|---|---|---|
| archive/WORKLOG_ARCHIVE.md | **613MB** | 268 |
| worklog.md | 263MB | 1,029 |
| src/lib/foods.ts | 42.5MB | 17 |
| src/lib/exercises.ts | 32.7MB | 22 |
| docs/README.md | 29.9MB | 245 |

**السبب البنيوي:** ملفات ضخمة تتغير بمعدل عالٍ (worklog الأرشيفي 3.2MB لكل إلحاق = نسخة كاملة جديدة لكل تحديث). **العلاج الوحيد الفعلي** = إعادة كتابة التاريخ (filter-repo/BFG على المسارين worklog وWORKLOG_ARCHIVE) وهي **محظورة هنا مرتين**: بأمر المالك الصريح (لا rewrite ولا force push) وبقاعدة منع force-push المفعلة على main. **التوصية الموثقة:** إن قرر المالك لاحقًا: (1) نسخة احتياطية mirror كاملة، (2) filter-repo على الفرعين معًا بإطار مالك مستقل، (3) إعادة النشر بإعادة تعيين الحماية مؤقتًا — حتى ذلك الحين يظل clone size بلا تغيير (التنظيف الحالي خفّض شجرة العمل والقراءة فقط).

## 8. الحصيلة المقيسة

| البعد | قبل | بعد |
|---|---|---|
| ملفات markdown بجذر docs | 108 | 55 |
| إجمالي ملفات docs (بالسلاسل) | 216 | ~139 |
| شجرة العمل (بلا .git) | 139MB | ~121MB |
| مجلدات خام بأدلة منتهية | 3 سلاسل خام | أُزيلت (أُبقي النشط الخمسة فقط) |
| صفوف سجل docs/README.md | — | −70 صفًا |
| الحالة المرجعية للوكيل الجديد | STATE + سجل ضخم | STATE + سجل مقتصد + هذا التقرير |

**القيد الأدبي:** كل محذوف قابل للاسترجاع الحرفي من سجل Git (الأب المباشر لكوميت التنظيف) — لم يُفقد قرار سابق ولا مهمة معلقة ولا قيد معتمد؛ المعلقات النشطة كلها موثقة بمواضعها المحتفظ بها (قائمة المالك الكاملة: STATE قسما «المفتوح الآن» و«بانتظار موافقة المالك»).
