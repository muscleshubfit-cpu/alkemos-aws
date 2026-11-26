# ALKEMOS-STORE-RENAME — تقرير إصلاح وتوحيد تسمية متجر الأفلييت (المرحلة 525)

> **الحالة:** منفّذ بأمر المالك 2026-11-26 («أمر إصلاح وتوحيد تسمية متجر الأفلييت — Alkemos» على المستودع `muscleshubfit-cpu/alkemos-aws`) · **النوع:** إطار كود كامل + ميجريشن انتقالي 0118 + توثيق · **التقارير السابقة:** `ALKEMOS-STORE-PHASE1-EXECUTION-2026-11-26.md` (523) و`ALKEMOS-STORE-PHASE1-PUSH-VERIFY-SEED-FIX` (524 — بworklog) · **الوثائق الحية:** `docs/store/README.md` (وتحتوي ملاحظة إعادة التسمية الملزمة).

---

## 1) السبب الجذري لرسالة «تعذر تحميل بيانات المتجر» — مُثبت بالقياس لا بالافتراض

**السبب الجذري: مسار `GET/POST /api/admin/store` لم يوجد إطلاقًا.** الواجهة `StoreAdminView.tsx` (دفعة 523/C4) تستدعي `fetch("/api/admin/store")` للتحميل و`POST` لنفس المسار لأفعال المراجعة/النشر — لكن شجرة المسارات احتوت فقط على الفرعين `products/route.ts` و`verify/route.ts`، **بلا `route.ts` مباشر تحت `src/app/api/admin/store/`**. النتيجة: كل تحميل للوحة يموت على 404 فيدخل `catch` ويطلق التوست «تعذر تحميل بيانات المتجر».

**الأدلة المقيسة (قبل أي تعديل):**
- قياس حي على الإنتاج: `GET https://alkemos.com/api/admin/store` → **HTTP 404**، بينما `GET /api/admin/store/products` → 401 (موجود ويطالب الصلاحية) و`GET /store` و`/sitemap-store.xml` → 200. أي أن العلة في المسار المفقود وحده.
- طبقة البيانات كانت سليمة بالكامل: `src/lib/store-admin.ts` يحمل كل الدوال (قوائم/إحصاءات/شجرة فئات/نقرات/مراجعة/نشر)، والميجريشنات 0115/0116/0117 مطبقة على الإنتاج (تشغيلة تدقيق الحالة 45752342888 بتاريخ 2026-11-26 03:59 UTC: **APPLIED — كل الفحوص الـ21 خضراء**، منها 27 صفًا للدفعة التأسيسية و75 فئة).
- **إصلاح السبب الجذري (لا إخفاء للرسالة):** أُنشئ `src/app/api/admin/affiliate-store/route.ts` بالاسم الموحد الجديد — `GET` يعيد `{ stats, products, categories, clicks }` و`POST` ينفذ أفعال سير 0097 (review/publish/unpublish/feature/category-activate) خلف `requireAdmin` — والواجهة تستدعيه بالاسم الجديد. أي فشل قادم (401/500) يظهر بصدق كما هو.

## 2) توحيد الاسم البرمجي إلى affiliate_store — النطاق الكامل المنفذ

اعتمادًا لأمر المالك («اعتمد affiliate_store الاسم البرمجي الرسمي والموحد… لا تترك أسماء عامة أو ملتبسة مثل store_products أو /admin/store إذا كان بالإمكان توحيدها بأمان»):

### 2.1 قاعدة البيانات — الميجريشن الانتقالي 0118 (`20261126180000_0118_affiliate_store_rename.sql`)
- **إعادة تسمية بلا أي تغيير بيانات** (ALTER TABLE … RENAME TO محافظ بـOID): الجداول الأربعة + الفهارس السبعة (`idx_`/`uq_`) + السياسات التسع + قيود PK/UNIQUE/FK/CHECK التلقائية الستة عشر + تسلسل الهوية `affiliate_store_click_events_id_seq`.
- **قانون اللاجرّة محفوظ:** 0115/0116/0117 مطبقة على الإنتاج ولم تُمس ولم تُعد — 0118 هو قناة التصحيح الوحيدة (نمط 0107/0117).
- **idempotent:** كل إعادة تسمية محروسة بفحص وجود الاسم القديم (to_regclass/pg_class/pg_constraint/pg_policy) — إعادة التشغيل no-op موثقة، متوافقة مع معاملة الملف الواحدة وON_ERROR_STOP.
- **ضمان التقارب:** الإنتاج (0115–0117 عبر القناة) والستاك النظيف (0117 يعيد إنشاء العائلة) كلاهما ينتهي لنفس الحالة النهائية — سلسلة db-migrate validate تشغل الملف بعد 0117 حتمًا.
- **إعادة تحميل مخطط PostgREST** (`NOTIFY pgrst, 'reload schema'`) + كتلة VERIFY إخبارية تعدّ الصفوف عبر الأسماء الجديدة.
- قانون الميجريشن بنفس الكوميت: صف INDEX.md + فحص probes قوي (4 جداول + `count_rows=27` لمجموعة السلغ الثابتة عبر الاسم الجديد — إثبات أن الترحيل حفظ كل منتج) + تحديث فحوص 0115/0116/0117 إلى الأسماء النهائية (قانون 0083: أحدث ميجريشن يملك الاسم النهائي للقابل للرصد) + types.ts + **دعم `ALTER TABLE … RENAME TO` بمحلل migration_audit.py** (سابقة Phase-106 للأعمدة مرفوعة لمستوى الجداول — بدونه كان المحلل سيقرأ الانجراف خطأً للأبد).

### 2.2 خريطة الأسماء القديمة → الجديدة

| الطبقة | القديم | الجديد |
|---|---|---|
| جداول | `store_categories` · `store_products` · `store_product_links` · `store_click_events` | `affiliate_store_categories` · `affiliate_store_products` · `affiliate_store_product_links` · `affiliate_store_click_events` |
| صفحة عامة | `/store` · `/store/[category]` · `/store/[category]/[slug]` | `/affiliate-store` · `/affiliate-store/[category]` · `/affiliate-store/[category]/[slug]` (**301** من القديم) |
| إدارة | `/admin/store` (+`/new`/+`[id]`) | `/admin/affiliate-store` (+`/new`/+`[id]`) (**301**) |
| API إدارة | `/api/admin/store` (المفقود!) · `/products` · `/verify` | `/api/admin/affiliate-store` (**route.ts جديد — الإصلاح الجذري**) · `/products` · `/verify` |
| API عام | `/api/store/clicks` | `/api/affiliate-store/clicks` |
| خريطة موقع | `/sitemap-store.xml` | `/sitemap-affiliate-store.xml` (**301** + تحديث فهرس sitemap.xml وrobots.txt) |
| ملفات lib | `store-{admin,server,guards,link,link-verify}.ts` | `affiliate-store-{admin,server,guards,link,link-verify}.ts` |
| مكونات | `StoreAdminView` · `StoreEditorView` · `components/store/*` · `StoreViewEvent` · `ProductCard`/`ProductGrid` · `StoreCategoryIcon` | `AffiliateStoreAdminView` · `AffiliateStoreEditorView` · `components/affiliate-store/*` · `AffiliateStoreViewEvent` · `AffiliateStoreProductCard`/`AffiliateStoreProductGrid` · `AffiliateStoreCategoryIcon` |
| أنواع | `StoreProduct` · `StoreCategory` · `StoreProductLink` · `StoreClickEvent` (+كل الأنواع المشتقة) | `AffiliateStoreProduct` · `AffiliateStoreCategory` · `AffiliateStoreProductLink` · `AffiliateStoreClickEvent` (+المشتقات) |
| دوال طبقة الإدارة | `adminListStoreProducts` · `adminStoreStats` · `adminPublishStoreProduct` … | `adminListAffiliateStoreProducts` · `adminAffiliateStoreStats` · `adminPublishAffiliateStoreProduct` … |
| دوال الطبقة العامة | `getStoreTree` · `getStoreProductBySlug` · `listFeaturedStoreProducts` … | `getAffiliateStoreTree` · `getAffiliateStoreProductBySlug` · `listFeaturedAffiliateStoreProducts` … |
| وسوم الكاش | `store-tree` · `store-featured` · `store-slugs` · `store-products` | `affiliate-store-tree` · `affiliate-store-featured` · `affiliate-store-slugs` · `affiliate-store-products` |
| أحداث GA4 | `store_view` · `product_view` · `store_click` | `affiliate_store_view` · `affiliate_store_product_view` · `affiliate_store_click` |
| علامات DOM | `data-store-disclosure` | `data-affiliate-store-disclosure` |
| اختبارات | `store-{admin,guards,links,separation,disclosure}.test.ts(x)` | `affiliate-store-{admin,guards,links,separation,disclosure}.test.ts(x)` |
| التسميات الظاهرة | زر الإدارة «متجر المنتجات»/"Product store" · عنوان اللوحة «متجر المنتجات — Alkemos Product Store» · عنوان الصفحات العامة «Alkemos Product Store» | **«متجر منتجات الأفلييت» / "Affiliate Store"** · عنوان اللوحة «متجر منتجات الأفلييت — Alkemos Affiliate Store» · «Alkemos Affiliate Store» بالصفحات العامة |

**قرارات توثيقية مقصودة (لا انجراف):** (1) اسم ميزة التحقق `StoreLinkVerify` بقي كما هو — اسم ميزة فريد لا لبس فيه وليس اسم كيان. (2) قيم أنواع الأسطح `surface_type` المخزنة (`store`/`category`/`product`…) بقيت كما هي — قيم بيانات مقيدة بقيود CHECK في القاعدة وتغييرها يحتاج ميجريشنًا بلا أي فائدة. (3) مسارات الـAPI الداخلية القديمة (`/api/store*` و`/api/admin/store*`) **لا تحويلات لها** — ليست أسطحًا عامة قط، ومستدعيوها شُحنوا بالأسماء الجديدة في نفس الدفعة؛ التوثيق هنا هو القرار. (4) `AMAZON_ASSOCIATES_TAG` والمتعقب `ahmedzake-20` لم يُمسا إطلاقًا (تحقيق المهمة لم يثبت أي ضرورة تقنية — القيمة بيئية والرابط يُبنى مركزيًا كما هو).

### 2.3 توافق الروابط القديمة (لا كسر لأي رابط منشور)
- `next.config.ts`: خمس تحويلات **301** (نمط القانون الموثق 178/192 لأقصى توافق مع الزواحف): `/store` و`/store/:path*` و`/admin/store` و`/admin/store/:path*` و`/sitemap-store.xml` → نظائرها `affiliate-store`.
- الصفحة القانونية `/affiliate-disclosure` اسمها سليم أصلًا ولم تتغير (المحتوى حُدّث بالاسم الجديد للمتجر فقط).

## 3) حدود الفصل المعماري الثلاثي — محفوظة ومشددة

1. **شركاء الموقع الحاليون (النظام 1):** صفر تعديل على `affiliate_transactions`/`affiliate_commissions`/`referrals`/`referral_*` ومسارات `/referral` وصلاحياتها وتحليلاتها. كاناري الفصل المعماري يفحص حرفيًا عدم اقتراب كود المتجر منها.
2. **Affiliate Store (النظام 2):** كل ما أعيدت تسميته أعلاه — إنجليزي حصرًا، أمازون Associates الأمريكي، والمتعقب `ahmedzake-20` كما هو.
3. **المتجر العربي المستقبلي (النظام 3):** صفر جداول/APIs/صفحات/صلاحيات أُنشئ له — خارج النطاق كليًا كما نص الأمر.

**تشديد إضافي (اختبار جديد):** أُضيف لكاناري الفصل فحص تسمية يرفض أي كيان `affiliate_<غير_store>` داخل كود المتجر (نمط `affiliate_(?!store…)`) — فالبادئة `affiliate_store_*` صارت المحصورة حصرًا لعائلة المتجر، والفارق البنيوي عن كيانات النظام 1 محروس بنيويًا لا بالتعبيرات. كما يفحص الكاناري الآن منع **الاسمين** (القديم والجديد) من شجرة `(ar)` كلها.

## 4) سير المراجعة 0097 — دون أي تجاوز

- المنتجات تولد `review_status='pending'` + `is_published=false` (قيد 0115 + منطق الحفظ) — لم يتغير.
- `publish` يستلزم `reviewed` ويعيد تشغيل كل الحرّاس على الصف الحالي — لم يتغير.
- لا نشر تلقائي ولا تجاوز لمراجعة المالك في أي مسار (route.ts الجديد ينفذ الأفعال عبر طبقة البيانات نفسها المحروسة).
- أزرار الإضافة/التحديث/التصفية/المراجعة/النشر/المختارات/تفعيل الفئات كلها تعمل عبر الواجهة الجديدة (vitest يغطي منطق الأفعال، وui-wiring يثبت أن كل مسار fetch يحل لمسار موجود).

## 5) نتائج الاختبارات والتحقق (محليًا قبل الدفع)

| البوابة | النتيجة |
|---|---|
| `npx tsc --noEmit` | **صفر أخطاء** |
| `npx eslint .` | **صفر أخطاء** (تحذيران مسبقان بملفين غير ممسوسين — مثل دفعة 523) |
| `npx vitest run` | **291 ملفًا / 7,164 اختبارًا كلها خضراء** (منها كاناري الفصل الموسع 7/7 والروابط/الحرّاس/الإفصاح/0097 بالأسماء الجديدة) |
| `python3 scripts/db/migration_hygiene.py` | **CLEAN** على 69 ملفًا (0118 مُسجل بفحصه) |
| `python3 scripts/migration_audit.py` | **PASS — صفر انجراف جديد** (بعد دعم rename table بالمحلل) |
| `python3 scripts/docs_parity.py --ci` | ✓ |
| `python3 scripts/docs_audit.py` | ✓ |
| `bash scripts/check-stale-refs.sh` | ✓ لا مراجع ميتة |
| `bash scripts/check-ui-wiring.sh` | ✓ ‏83 هدف API كلها تحل (منها المسارات المعاد تسميتها) |
| `python3 scripts/check_glued_latin.py` | ✓ |
| `bash scripts/check-ai-router-guard.sh` | ✓ |
| فحص صياغة SQL لميجريشن 0118 | ✓ (محلل PostgreSQL الحرفي pglast — 16 عبارة سليمة) |

**التحقق الحي بعد الدفع (يُسجل برد الجلسة):** بوابات GitHub الفعلية على كوميت الدفع (quality-gate/deploy/db-migrate/migration-state-audit/docs-parity/stale-refs) + قياسات HTTP الحية على alkemos.com: `/api/admin/affiliate-store` يجب أن تعيد **401** (المسار موجود ويطالب الصلاحية — بعد أن كانت القديمة 404) و`/store` يجب أن تعيد **301** إلى `/affiliate-store` و`/sitemap-affiliate-store.xml` تعيد 200.

## 6) المخاطر والنقاط المتبقية

- **نافذة الترحيل:** الترتيب القانوني للنشر (migrate قبل deploy) يعني دقائق يقرأ فيها الكود القديم الجداول القديمة بينما طبّق 0118 التسمية الجديدة — النافذة محدودة والتأثير الوحيد الممكن فشل قراءة مؤقت بلوحة إدارة كانت أصلًا مكسورة (404)، والصفحات العامة معزولة بكاش ISR لمدة ساعة. لا خطر بيانات إطلاقًا (صفر تغيير صفوف).
- **أحداث GA4 بأسماء جديدة:** عدادات جديدة في GA4 (كانت القديمة `store_view` إلخ) — قرار موثق بأمر التوحيد، والمتجر لم ينشر أي منتج بعد فلا تاريخ يُفقد عمليًا.
- **فحوص 0115–0117 في probes تشير للأسماء الجديدة:** مقصود قانونًا (قانون 0083) — لو أُعيد بناء بيئة من الصفر بالسلسلة الكاملة تنتهي للأسماء الجديدة نفسها فالفحوص تبقى خضراء.
- **المتبقي على المالك (كما قبل إعادة التسمية):** مراجعة ونشر دفعة الـ27 من `/admin/affiliate-store` (سير 0097: «Mark reviewed» ثم «Publish» — وStoreLinkVerify يفحص كل ASIN بنقرة؛ 16 منتجًا بلا ASIN يُلتقط وقت المراجعة) · قرارات لاحقة بأمر مستقل: تفعيل موجتي 2/3 · المرحلة 2 (وحدات التوصية + التحليلات) · المرحلة 4 (Creators API بشرط 10 مبيعات/30 يومًا).
- **لا خسارة بيانات:** إثبات بنيوي (RENAME بلا DROP/CREATE) + فحص 0118 يقيس 27/27 عبر الاسم الجديد + بوابة تدقيق الحالة اليومية تراقب استمرارًا.

## 7) ميزان التغيير (الملفات)

- **ميجريشن جديد (1):** `supabase/migrations/20261126180000_0118_affiliate_store_rename.sql`
- **ملفات منقولة مع تعديلها (22):** خمسة `src/lib/affiliate-store-*.ts` · مكوّنا العرض · مجلد `components/affiliate-store/` (4 ملفات) · ثلاث صفحات عامة · ثلاث صفحات إدارة · `api/affiliate-store/clicks` · `api/admin/affiliate-store/{route الجديد,products,verify}` · `sitemap-affiliate-store.xml` · خمسة ملفات اختبار
- **معدلة في مكانها (14):** `types.ts` · `AdminShell` · `SiteFooter` · `sitemap.xml/route` · `robots.txt` · `next.config.ts` · `share-unify.test` · `.env.example` · `SECURITY.md` · `README.md` · وثائق `docs/store/` السبعة
- **سكربتات (3):** `migration_probes.py` (تحديث 0115–0117 + فحص 0118) · `migration_audit.py` (دعم rename table) · `INDEX.md` (صف 0118 + خريطة الترقيم)
- **توثيق الحالة:** STATE 525 + هذا التقرير + بند فهرسه أدناه + مدخل worklog (مع التدوير الآلي للنافذة)

— انتهى التقرير (وُلد مؤرشفًا بقانون Phase 291).
