# IMPLEMENTATION-PLAN — التصميم المعماري ومراحل تنفيذ منظومة الوصفات الصحية (Healthy Recipes)

> **المهمة:** HEALTHY-RECIPES-PLATFORM — المرجع التنفيذي المعتمد لبناء القسم.
> **الوثيقة الشقيقة:** [`AUDIT.md`](./AUDIT.md) — حالة المشروع الحالية والفجوات وأدلة كل استنتاج.
> **القاعدة:** كل ملف/جدول/مسار في هذه الخطة إما **قائم فعليًا** (يُذكر كمسار حقيقي) أو **جديد مقرر** (يُذكر كإنشاء). لا توصيات عامة.
> **الحالة:** **منفذة بالكامل (P1→P9) 2026-11-10** — سجل التنفيذ والقرارات والنتائج والاختبارات بالقسم §19 أدناه (أمر المالك «Alkemos Healthy Recipes – Full Implementation»).

---

## 1. المبادئ الحاكمة (مستمدة من أمر المالك وقوانين المستودع القائمة)

1. **اللغتان مساران إنتاج مستقلان، لا ترجمة:** كل وصفة = سجل رئيسي واحد يربط نسختين أصليتين (عربية وإنجليزية) تُؤلَّف كلٌّ منهما من الصفر من مواصفة مشتركة — استنساخ لنمط المدونة المُثبت (Phase 157) مع تقويته إلى إلزام ذري (§4).
2. **الذكاء الاصطناعي يؤلف النصوص ولا يقرر الأرقام:** كل قيمة غذائية تُحسب برمجيًا من مرجع مغذيات موثق (`nutrient_reference`)، والذكاء الاصطناعي يقترح البنية (مكونات/أوزان/خطوات) فقط. أي رقم في نص الوصفة يجب أن يطابق المحسوب أو تُحجز الوصفة.
3. **زوج أو لا شيء:** لا تُنشر نسخة منفردة أبدًا — الإلزام بنيوي (قاعدة بيانات + معاملة نشر ذرية واحدة)، لا مجرد سياسة تشغيل.
4. **إعادة الاستخدام قبل البناء:** محرك AI الموحد (`dispatchAI`)، مزودو الصور، محرك الحساب، البوابات الحتمية، أنماط SEO والواجهات — كلها قائمة وتُستهلك كما هي (جرد كامل بالتدقيق §15).
5. **بوابات لا تُضعف أبدًا:** فشل أي بوابة = حجز الوصفة (held/failed) مع سبب مقروء وإعادة محاولة موجهة — استنساخ عقد الإصلاح R1 القائم في المدونة (≤2 دورة ثم markFailed صادق).
6. **لا مفاتيح جديدة ولا تكاليف جديدة:** كل شيء يعمل على الطبقات المجانية القائمة (التكلفة المتوقعة ~$0 — التدقيق §16).
7. **قانون المستودع الأعلى:** مهمة واحدة = كوميت واحد، كل ميجريشن برقمه وسجله في `INDEX.md` بنفس الكوميت، كل ملف توثيق بصفه في `docs/README.md`، وكل بوابات CI الخضراء شرط دفع.

---

## 2. المعمارية الكلية

```
┌─────────────────────────────────────────────────────────────────────┐
│                    محرك المحتوى الغذائي (التصميم المعماري)              │
│                                                                       │
│  GitHub Actions (سير عمل يومي واحد recipe-post.yml)                   │
│  R0 فكرة → R1 بنية JSON → R2 حساب غذائي برمجي → R3 تأليف AR/EN        │
│  → R4 صورة → R5 بوابات → R6 نشر ذري → R7 فهرسة                        │
│        │                                                              │
│        ▼ يستدعي (داخل عملية العداد — نمط scripts/blog-runner)          │
│  معالجات مراحل src/app/api/cron/recipes/{r0..r7}/route.ts             │
│        │                                                              │
│        ├─ dispatchAI("recipe:*") ──► سجل/موجه/محرك AI الموحد القائم    │
│        ├─ blog-images.ts (Pexels→Unsplash→Pixabay + safety)           │
│        ├─ recipes-nutrition.ts (حساب صافٍ من nutrient_reference)       │
│        └─ recipes-quality-gates.ts (بوابات حتمية بلا AI)               │
│        │                                                              │
│        ▼                                                              │
│  Supabase: recipes (الزوج) ─┬─ recipe_versions (ar/en)                │
│                             ├─ recipe_ingredients (مشتركة)            │
│                             ├─ nutrient_reference (المصدر الموثق)      │
│                             ├─ recipe_generation_queue (الطابور)       │
│                             └─ recipe_favorites (المفضلة)              │
│        │                                                              │
│        ▼ تُقرأ ISR بوسم "recipes-*"                                    │
│  الواجهات: /recipes + /ar/recipes (قائمة/تصنيفات/[slug])               │
│  + الرئيسية (وصفات مختارة) + الهيدر/الفوتر + الأدوات + EVO             │
└─────────────────────────────────────────────────────────────────────┘
```

**قرار التصميم المركزي — فصل ثلاثي الطبقات للبيانات:**
- **الطبقة 1 (الزوج/الحقيقة الغذائية):** `recipes` + `recipe_ingredients` — مشتركة بين اللغتين: المكونات والأوزان وحالة الوزن والحصص والأوقات والصورة والقيم المحسوبة. *التطابق الغذائي بين النسختين مضمون بالبناء لأن هناك مصدرًا واحدًا فقط للحقائق.*
- **الطبقة 2 (النسختان التحريريتان):** `recipe_versions` — العنوان والشرح والخطوات والنصائح والتخزين والـmeta بلغة كل نسخة.
- **الطبقة 3 (المرجع):** `nutrient_reference` — قيم لكل 100جم لكل مكون معرف بالمصدر (USDA FDC ID) والإصدار.

---

## 3. تصميم قاعدة البيانات (P1) — ميجريشن جديد واحد شامل

ملف ميجريشن واحد: `supabase/migrations/2026MMDDHHMMSS_0105_healthy_recipes_foundation.sql` (+ صفه في `INDEX.md` + تحديث `src/lib/supabase/types.ts` بنفس الكوميت — قانون تدقيق السكيمة `migration_audit.py`).

> المخططات أدناه تصميم أولي كامل يُنقّح نصيًا عند التنفيذ، والقوانين (RLS/الفهارس/القيود) ملزمة كما هي.

### 3.1 `recipes` — السجل الرئيسي للزوج
```sql
CREATE TABLE public.recipes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_slug        text NOT NULL,                    -- اسم الزوج المشترك (لاتيني، مفتاح الربط)
  status           text NOT NULL DEFAULT 'draft',    -- draft|in_production|verified|published|held|failed|unpublished
  scheduled_for    date,                             -- اليوم المستهدف للنشر (حارس التكرار اليومي)
  servings         int  NOT NULL CHECK (servings BETWEEN 1 AND 12),
  serving_weight_g numeric NOT NULL CHECK (serving_weight_g > 0),
  prep_minutes     int  NOT NULL CHECK (prep_minutes BETWEEN 0 AND 600),
  cook_minutes     int  NOT NULL CHECK (cook_minutes BETWEEN 0 AND 600),
  -- الصورة: على السجل الرئيسي حصرًا => نفس الملف للنسختين بالبناء (اشتراط المالك §8)
  image_url        text,
  image_alt_ar     text, image_alt_en text,          -- alt بلغة كل نسخة، الصورة واحدة
  image_source     text CHECK (image_source IN ('pexels','unsplash','pixabay','approved_bank')),
  image_verified   boolean NOT NULL DEFAULT false,   -- بوابة مطابقة الصورة للطبق
  -- الحقائق الغذائية المحسوبة والمتحقق منها (تُكتبها طبقة الحساب فقط، لا الذكاء الاصطناعي):
  nutrition_total     jsonb NOT NULL DEFAULT '{}',   -- {calories, protein_g, carbs_g, fat_g, sat_fat_g, fiber_g, sodium_mg}
  nutrition_per_serving jsonb NOT NULL DEFAULT '{}',
  nutrition_sources   jsonb NOT NULL DEFAULT '[]',   -- [{ingredient, fdc_id, source, version}]
  calories_kcal_consistency jsonb,                   -- سجل فحص اتساق السعرات (4/4/9)
  -- التصنيف (تُملأ الأنظمة الغذائية من محرك القواعد فقط — §5.4):
  cuisines   text[] NOT NULL DEFAULT '{}',   -- egyptian|gulf|arab|mediterranean|asian|international
  goals      text[] NOT NULL DEFAULT '{}',   -- weight-loss|muscle-gain|weight-gain|maintenance|sports-nutrition|high-protein
  diets      text[] NOT NULL DEFAULT '{}',   -- keto|low-carb|high-protein|mediterranean|vegetarian|vegan|pescatarian|dash|gluten-free|dairy-free
  meal_types text[] NOT NULL DEFAULT '{}',   -- breakfast|lunch|dinner|snack|healthy-dessert|drink|pre-workout|post-workout
  budget_tier text CHECK (budget_tier IN ('low','medium','high')),
  verification     jsonb NOT NULL DEFAULT '{}',   -- سجل البوابات: نتائج كل فحص + طوابع زمنية
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','passed','failed')),
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX recipes_pair_slug_uidx ON public.recipes (pair_slug);
CREATE INDEX recipes_status_published_idx ON public.recipes (status, published_at DESC);
CREATE INDEX recipes_diets_idx ON public.recipes USING gin (diets);
CREATE INDEX recipes_filters_idx ON public.recipes USING gin (cuisines, goals, meal_types);
-- حارس التكرار اليومي (بنيوي): زوج واحد منشور/قيد التنفيذ لكل يوم مجدول:
CREATE UNIQUE INDEX recipes_one_per_day_uidx ON public.recipes (scheduled_for)
  WHERE status IN ('in_production','verified','published');
```

### 3.2 `recipe_versions` — نسختا اللغة
```sql
CREATE TABLE public.recipe_versions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id   uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  language    text NOT NULL CHECK (language IN ('ar','en')),
  title       text NOT NULL,
  slug        text NOT NULL,
  excerpt     text NOT NULL,                    -- مقدمة تحريرية فريدة (لا ترجمة)
  steps       jsonb NOT NULL DEFAULT '[]',      -- [{position, text}] بلغة النسخة
  tips        text,
  storage_info text,                            -- معلومات التخزين بلغة النسخة
  substitutions jsonb NOT NULL DEFAULT '[]',    -- بدائل مع أثرها الغذائي (تتحقق البوابة من أرقامها §5.5)
  meta_title  text, meta_description text,
  faq_json    jsonb,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipe_id, language),                 -- الزوج إلزامي: صفان بالضبط لكل وصفة
  UNIQUE (slug, language)                       -- على نمط blog_posts
);
CREATE INDEX recipe_versions_published_idx ON public.recipe_versions (language, is_published, published_at DESC);
```

### 3.3 `recipe_ingredients` — المكونات (مشتركة بين النسختين)
```sql
CREATE TABLE public.recipe_ingredients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  position      int NOT NULL,
  amount_g      numeric NOT NULL CHECK (amount_g > 0),   -- الوزن بالجرام إلزامي (اشتراط المالك §7)
  weight_state  text NOT NULL DEFAULT 'raw' CHECK (weight_state IN ('raw','cooked')), -- حالة الوزن إلزامية
  name_ar       text NOT NULL,                  -- الاسم التحريري لكل لغة — الكمية والحقيقة مشتركة
  name_en       text NOT NULL,
  nutrient_ref_slug text NOT NULL REFERENCES public.nutrient_reference(slug),
  is_optional   boolean NOT NULL DEFAULT false, -- المكون الأساسي لا يجوز نقص مرجعه (بوابة §5.2)
  note_ar text, note_en text                    -- ملاحظات (للتذوق/البديل) بلغة النسخة
);
CREATE INDEX recipe_ingredients_recipe_idx ON public.recipe_ingredients (recipe_id, position);
```

### 3.4 `nutrient_reference` — مرجع المغذيات الموثق (يعالج الفجوة الحرجة ق1)
```sql
CREATE TABLE public.nutrient_reference (
  slug           text PRIMARY KEY,
  name_en        text NOT NULL, name_ar text NOT NULL,
  per100g        jsonb NOT NULL,   -- {calories, protein_g, carbs_g, fat_g, sat_fat_g, fiber_g, sodium_mg, sugar_g}
  fdc_id         text,             -- معرف USDA FoodData Central (أو معرف المصدر البديل)
  source_name    text NOT NULL DEFAULT 'USDA FDC',
  source_version text NOT NULL,    -- إصدار المصدر (اشتراط المالك §7/6)
  yield_cooked_g numeric,          -- معامل التحويل نيئ→مطبوخ لكل 100جم نيئ (§5.3) أو NULL إن لا ينطبق
  flags          text[] NOT NULL DEFAULT '{}',  -- animal|dairy|gluten|fish|egg|plant... (وقود محرك الأنظمة §5.4)
  verified_at    timestamptz NOT NULL DEFAULT now()
);
-- التعبئة الأولية (P1): 150–300 مكون شائع في الوصفات المستهدفة (مطابخ المشروع)
-- مستمدة من USDA FDC (واجهته المجانية) بتدقيق يدوي للعناصر الشائعة المصرية/العربية،
-- مع تغطية إلزامية للزيوت والصلصات والإضافات (اشتراط المالك §7/2).
```
**قاعدة البوابة:** مكون بلا صف مرجع = الوصفة تُحجز فورًا (لا تقدير، لا استنساب) — هذا هو تطبيق «نقص بيانات مكون أساسي» و«عدم معرفة وزن أحد المكونات» حرفيًا.

### 3.5 `recipe_generation_queue` — طابور الإنتاج
```sql
CREATE TABLE public.recipe_generation_queue (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id    uuid REFERENCES public.recipes(id),
  status       text NOT NULL DEFAULT 'idea',  -- idea|structured|nutrition_verified|authored|imaged|gates_passed|published|held|failed
  idea         jsonb NOT NULL DEFAULT '{}',   -- {themeEn, themeAr, cuisine, goal, mealType, brief} — المكافئ المختوم لsharedBrief
  bundle       jsonb NOT NULL DEFAULT '{}',   -- مخرجات كل مرحلة (بنية JSON، الحسابات، المسودات، الصورة، سجل البوابات)
  error_message text, repair_cycles int NOT NULL DEFAULT 0,
  scheduled_for date NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(), published_at timestamptz
);
CREATE INDEX recipe_queue_status_idx ON public.recipe_generation_queue (status, created_at);
CREATE INDEX recipe_queue_day_idx ON public.recipe_generation_queue (scheduled_for);
```

### 3.6 `recipe_favorites` — المفضلة (قرار ق6: للمصادقين)
```sql
CREATE TABLE public.recipe_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);
```

### 3.7 دوال RPC والنشر الذري (قرار ق2)
```sql
-- النشر الذري: معاملة واحدة تفحص البوابات وتنشر النسختين معًا أو لا شيء (قانون «ممنوع نسخة منفردة»)
CREATE OR REPLACE FUNCTION public.publish_recipe_pair(p_recipe_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 1) الزوج مكتمل: نسختان، كلتاهما جاهزة
  IF (SELECT count(*) FROM public.recipe_versions WHERE recipe_id = p_recipe_id) <> 2 THEN
    RAISE EXCEPTION 'PAIR_INCOMPLETE';
  END IF;
  -- 2) التحقق الغذائي والبوابات ناجح على السجل الرئيسي
  IF (SELECT verification_status FROM public.recipes WHERE id = p_recipe_id) <> 'passed' THEN
    RAISE EXCEPTION 'VERIFICATION_NOT_PASSED';
  END IF;
  -- 3) حارس اليوم (يعمل جنبًا إلى جنب مع الفهرس الفريد recipes_one_per_day_uidx)
  -- 4) النشر معًا
  UPDATE public.recipes SET status='published', published_at=now(), updated_at=now() WHERE id=p_recipe_id;
  UPDATE public.recipe_versions SET is_published=true, published_at=now(), updated_at=now() WHERE recipe_id=p_recipe_id;
END $$;
-- إلغاء النشر الذري عند اكتشاف خطأ مؤثر (اشتراط المالك §12): unpublish_recipe_pair(reason) يسجل السبب ويخفي النسختين معًا
```

### 3.8 سياسات RLS (نمط blog_posts الحاكم)
- `recipes` / `recipe_versions` / `recipe_ingredients` / `nutrient_reference`: **قراءة عامة للمنشور فقط** (`is_published=true` / `status='published'`؛ `nutrient_reference` عامة القراءة كاملة) + **كتابة أدمن حصرًا** عبر `is_admin()` (الطابور والمفضلة عبر service role / مالك الصف).
- `recipe_favorites`: CRUD لصاحبها فقط (`auth.uid() = user_id`).
- `recipe_generation_queue`: بلا سياسات عامة (service role فقط) — على نمط `blog_generation_queue`.

---

## 4. محرك إدارة المحتوى الأساسي (P1 — كود)

| ملف جديد | المسؤولية |
|---|---|
| `src/lib/recipes-shared.ts` (client-safe) | أنواع `RecipeSummary`/`RecipeFilters`، ثوابت التصنيفات (تسميات ثنائية اللغة للمطابخ/الأهداف/الأنظمة/الوجبات — على نمط `foods-shared.ts`)، `RECIPES_FILTER_LIMITS` |
| `src/lib/recipes-taxonomy.ts` | سجل التصنيفات الأحادي + **قواعد كل نظام غذائي** (حدود الماكروز لكل حصة + أعلام المكونات المحظورة) — بيانات صافية قابلة للاختبار |
| `src/lib/recipes-server.ts` | استعلامات ISR المقيدة بالكاش (`unstable_cache` بوسوم `recipes-list`/`recipes-detail`/`recipes-slugs` على نمط `blog-server.ts`) + باني hreflang الزوج (مكتمل دائمًا بالبناء) + إبطال `revalidateTag` |
| `src/lib/recipes-admin.ts` | عمليات اللوحة (نمط `blog-admin.ts`): قائمة/إحصاءات/حجز/إعادة طوابير/إلغاء نشر/اعتماد يدوي استثنائي |
| تحديث `src/lib/supabase/types.ts` | الجداول الستة الجديدة (نفس كوميت الميجريشن — قانون المرآة) |

---

## 5. محرك الحسابات الغذائية وبوابة التحقق الإلزامية (P3 — يُقدَّم قبل محرك الإنتاج، §14)

### 5.1 ملفات جديدة
- `src/lib/recipes-nutrition.ts` — الحساب الصافي (بلا AI، بلا شبكة): `computeRecipeNutrition(recipe, ingredients, refs)` → مجموعات + حصة + اتساق سعرات.
- `src/lib/recipes-diet-rules.ts` — محرك قواعد الأنظمة الغذائية: `evaluateDiets(nutritionPerServing, ingredientFlags, taxonomyRules)` → `diets[]` المحسوبة **حصريًا** (لا تُقبل قائمة diets من الذكاء الاصطناعي أصلًا — تُمسح من مخرجات R1 وتُعاد كتابتها من هذا المحرك).
- `src/lib/recipes-quality-gates.ts` — بطارية البوابات الحتمية (بلا AI — على نمط `blog-quality-gates.ts`).

### 5.2 خوارزمية الحساب (اشتراط المالك §7 حرفيًا)
1. لكل مكون: `per100g` من `nutrient_reference` **× (amount_g / 100)** — لا مصدر آخر للأرقام.
2. **الزيوت والصلصات والإضافات تُدرج مكونات كاملة بمراجعها** — قائمة فحص إلزامية في R1 (زيت الطهي/الزبدة/الصلصات/العسل…)؛ غياب زيت طهي عن وصفة تتطلبه يُرفض في بوابة البنية (S-GATE-3).
3. **حالة الوزن:** إذا `weight_state='raw'` والمرجع يحمل `yield_cooked_g` تُسجَّل قيم النيئ للمكون (المعيار الموحد: **القيم تُحسب على أساس الوزن المُدخل بحالته المصرّح بها**، والمقارنة النيئ/مطبوخ تُعرض في الواجهة بشفافية). أي تعارض (مطبوخ بلا معامل) = حجز.
4. الجمع لكل المغذيات السبعة → `nutrition_total` → القسمة على `servings` → `nutrition_per_serving`.
5. **فحص اتساق السعرات:** `|calories − (4·protein + 4·carbs + 9·fat)| ≤ max(5%, 20 kcal)` لكل من الوصفة والحصة (توسيع مباشر لمنهج `recomputeNutritionTotals` القائم في `nutrition-totals.ts`).
6. حفظ `nutrition_sources` (كل مكون: المرجع + `fdc_id` + الإصدار) — اشتراط «حفظ مرجع البيانات وإصداره».
7. **رفض صريح لأي قيمة لغوية مولدة كبيانات غذائية:** أي رقم غذائي داخل نصوص R3 يُستخرج (regex عربي/إنجليزي) ويُقارن بالمحسوب؛ عدم التطابق (بحدود التقريب المعلنة) = حجز (G-GATE-4).

### 5.3 بوابة النشر الإلزامية (تحجز الوصفة ولا تنشرها عند أي فشل)
| البوابة | الفحص الحتمي | مصدر الاشتراط |
|---|---|---|
| N-GATE-1 | كل مكون له صف مرجع + وزن > 0 + حالة وزن | «نقص بيانات مكون أساسي/وزن مجهول» |
| N-GATE-2 | الزيوت/الصلصات مدرجة أو الوصفة لا تحتاجها (قائمة فحص) | «عدم تجاهل الزيوت والإضافات» |
| N-GATE-3 | اتساق السعرات ضمن السماحية | «تناقض في الحسابات» |
| N-GATE-4 | أرقام النصوص تطابق المحسوب (عربي + إنجليزي) | «عدم اعتبار القيم اللغوية مصادر» |
| P-GATE-1 | نسختان موجودتان (ar+en) بحالة جاهزة | «عدم تطابق النسختين» |
| P-GATE-2 | مطابقة بنيوية: نفس `recipe_id` للمكونات/الأوزان/الحصص (مضمونة بالبناء + يُختبر) | «تطابق المكونات والأوزان» |
| P-GATE-3 | الصورة واحدة على السجل الرئيسي + `image_verified` | «نفس الصورة للنسختين» |
| D-GATE-1 | كل نظام غذائي في `diets[]` ناتج محرك القواعد فقط | «لا تصنيف قبل التحقق من التوافق» |
| Q-GATE-1 | MSA + لا تلوث لاتيني عربي (`blog-msa.ts` كما هو) | قانون المرحلة 176 القائم |
| Q-GATE-2 | حدود العناوين (`clampMetaTitle` بأقصى en:60/ar:70) + وصف ≤160 | قانون `blog-meta-title.ts` القائم |
| Q-GATE-3 | حد أدنى للخطوات (≥3 خطوات مرقمة) وحد أقصى (≤15) لكل نسخة | جودة تحريرية |
| Q-GATE-4 | عدم تكرار: `pair_slug` جديد + عنوان غير مستخدم + تداخل مكونات مع وصفة منشورة ≤70% (Jaccard) | منع التنافس الداخلي |
| Q-GATE-5 | فحص نوايا البحث ضد `intent-map.ts` (مداخل الوصفات الجديدة §10.5) | منع أكل الذات مع المدونة والصفحات القنونية |

نتائج كل البوابات تُخزَّن في `recipes.verification` (تقرير JSON بطوابع زمنية) — سجل كامل قابل للعرض من اللوحة (اشتراط «سجل كامل لعمليات الإنتاج والتحقق والنشر»).

### 5.4 قواعد الأنظمة الغذائية (حدود أولية تُعتمد من المالك عند تنفيذ P3 — مصادر طبية معتمدة عند التنفيذ)
| النظام | قواعد لكل حصة (مقترح أولي) |
|---|---|
| Keto | كربوهيدرات صافية ≤ 10g (بعد خصم الألياف) |
| Low Carb | كربوهيدرات ≤ 20g |
| High Protein | بروتين ≥ 25g أو ≥ 30% من السعرات |
| Mediterranean | بلا أعلام meat-heavy + زيت زيتون/أسماك/خضار (قواعد نمط) |
| Vegetarian | صفر أعلام `animal|fish` (يسمح dairy/egg حسب التعريف المتبع — يُثبَّت عند P3) |
| Vegan | صفر أعلام `animal|fish|dairy|egg|honey` |
| Pescatarian | صفر أعلام `animal-meat` (يسمح fish) |
| DASH | صوديوم ≤ 600mg لكل حصة |
| Gluten Free | صفر أعلام `gluten` |
| Dairy Free | صفر أعلام `dairy` |
الأهداف (خسارة/بناء/زيادة/محافظة/رياضي) تُشتق من كثافة السعرات لكل حصة + البروتين على مصفوفة في `recipes-taxonomy.ts`.

---

## 6. محرك إنتاج الوصفات (P2) — خط الأنابيب اليومي

### 6.1 دوال التسجيل في AI Registry (لا محرك موازٍ — القرار المعتمد بالتدقيق §15-أ)
إضافات إلى `src/lib/ai-registry.ts` (كلها `json: true` حيث يلزم، على سلم التدوير الثلاثي القائم openrouter→groq→nvidia مع ذيل Gemini/CF، بوسوم قياس `recipe:*` تدخل عدادات Upstash والتقرير الأسبوعي تلقائيًا):
| المعرف | الدور | ملاحظات |
|---|---|---|
| `recipe:idea` | توليد فكرة اليوم (موضوع/مطبخ/هدف/وجبة) | jsonMode؛ يُفحص ضد Q-GATE-4/5 |
| `recipe:structure` | بنية الوصفة JSON (مكونات+أوزان+حالات+خطوات موجزة+أوقات+حصص) | **المخرج الوحيد الذي يمس الأرقام الغذائية هيكليًا — تتحقق البوابات ثم تُحسب القيم برمجيًا**؛ schema صارم بـ zod |
| `recipe:author-ar` | تأليف النسخة العربية الأصلية | من البنية المشتركة فقط؛ MSA إلزامي |
| `recipe:author-en` | تأليف النسخة الإنجليزية الأصلية | نفس البنية — لا يرى النص العربي (إنتاج مستقل لا ترجمة) |
| `recipe:verify-narrative` | قراءة ناقدة للاتساق النصي (اختياري — عينات) | لا يقرر أرقامًا؛ يُغذي RERUN_TARGET |

### 6.2 المراحل (معالجات مسارات جديدة `src/app/api/cron/recipes/` — كلها خلف `verifyCronAuth` القائم بـ`CRON_SECRET` نفسه)
| المرحلة | المسار | ما يحدث | الفشل |
|---|---|---|---|
| R0 فكرة | `/api/cron/recipes/r0-idea` | اختيار الفكرة: توازن دوري للمطابخ/الأهداف (مصفوفة تغطية) + فحوص Q-GATE-4/5 + ختم `idea` (المكافئ المختوم لـsharedBrief) | إعادة محاولة بموضوع بديل من القائمة الاحتياطية الحتمية (بلا AI) |
| R1 بنية | `r1-structure` | `dispatchAI("recipe:structure")` → تحقق zod + N-GATE-1/2 على المكونات والمراجع → إنشاء `recipes` (status=in_production) + `recipe_ingredients` | دورة إصلاح موجهة (نفس عقد R1 القائم: ≤2 ثم فشل صادق) |
| R2 حساب | `r2-nutrition` | **كود صرفٍ بلا AI**: §5.2 كاملة + `evaluateDiets` + كتابة الحقائق والمراجع + N-GATE-3 | فشل بنيوي = حجز (لا إصلاح بالذكاء الاصطناعي — يعود لR1) |
| R3 تأليف | `r3-authoring` | نداءان مستقلان `recipe:author-ar` و`recipe:author-en` → إنشاء `recipe_versions` (slug فريد لكل لغة) | إصلاح النسخة الفاشلة وحدها؛ **لا نشر جزئيًا مهما حدث** |
| R4 صورة | `r4-image` | بحث `blog-images.ts` (Pexels→…) باستعلام مركب من اسم الطبق + المكونات الرئيسية + سلامة `image-safety.ts` + تدوير واستبعاد المكرر + **تحقق مطابقة** (Q-GATE البصري: كلمات مفتاحية للطبق في الاستعلام والنتيجة + بنك معتمد تراكمي) → كتابة `image_url` على السجل الرئيسي + alt بلغتين | توسيع الاستعلام ثم المزود التالي؛ فشل كامل = حجز الوصفة |
| R5 بوابات | `r5-gates` | بطارية §5.3 كاملة (بلا AI) + ختم `verification_status` | `held` مع سبب + `RERUN_TARGET` (r1/r3/r4) |
| R6 نشر | `r6-publish` | استدعاء `publish_recipe_pair()` — معاملة ذرية واحدة (§3.7) + `revalidateTag` + منع مزدوج (الفهرس الفريد + فحص اليوم) | فشل المعاملة = بقاء الوصفة `verified` غير منشورة (لا نسخة منفردة إطلاقًا) |
| R7 فهرسة | `r7-indexing` | تقديم URL النسختين لIndexNow (سكربت قائم بمصفوفة موسعة §10.4) + تحديث sitemap lastmod | تحذير غير حاجز |

### 6.3 سير العمل `.github/workflows/recipe-post.yml` (ملف واحد — الزوج ذري)
- **الجدولة المقترحة:** cron `30 6 * * *` UTC (09:30 القاهرة — بعد مدونة AR وقبل ذروة الزوار) + `workflow_dispatch` (مدخل `recipe_id` لإعادة التشغيل اليدوي).
- **مجموعة تزامن:** `recipes-pipeline` بلا إلغاء (نمط المدونة) — تمنع تشغيلين متوازيين لنفس اليوم.
- **التنفيذ:** `scripts/recipes-runner/run-step.sh` (استنساخ مباشر لـ`scripts/blog-runner/run-step.sh`: ×3 محاولات، تراجع 120/240 ثانية، استيراد المعالجات داخل العملية، `Bearer CRON_SECRET`، service role) — **بلا ملفات جديدة منطقية، نسخ مكيَّف**.
- **حارس تعبئة:** توسيع `dispatch-pipelines` القائم (23:40 UTC) ليشمل الوصفات، أو خطوة تعبئة داخلية بسير العمل (نافذة 90 دقيقة).
- **صمام الإيقاف (اشتراط «إيقاف النشر عند خلل متكرر»):** `RECIPES_PUBLISH_ENABLED` (سر بيئة، افتراضي true) — يفحصه R6؛ + قاطع دارة: 3 أيام فشل متتالية (تُقرأ من الطابور) = تفعيل تلقائي للوضع `held-only` + إشعار أدمن عبر `admin_notifications` (النظام القائم).
- **إعادة تشغيل الوصفات الفاشلة (اشتراط §12):** زر «إعادة طابور» بلوحة الإدمن يعيد صف الطابور إلى الحالة المطلوبة بحسب `RERUN_TARGET` — إعادة استخدام عقد `blog-repair-target.ts` بنمط جديد `recipes-repair-target.ts`.

---

## 7. الصور (P4) — قرار ق4: مزودات الأسواق القائمة

1. **المصدر:** سلسلة Pexels→Unsplash→Pixabay القائمة حرفيًا (`src/lib/blog-images.ts`) — إعادة استخدام كاملة، بلا مفاتيح جديدة (المفاتيح القائمة `PEXELS_API_KEY`/`UNSPLAWS_ACCESS_KEY`/`PIXABAY_API_KEY` تكفي).
2. **نفس الملف للنسختين:** مضمون بنيويًا — حقل `image_url` على `recipes` (السجل الرئيسي) وحده، والنسختان تقرآن منه (`P-GATE-3` يمنع أي انحراف). alt بلغة كل نسخة (`image_alt_ar/en`).
3. **مطابقة الصورة للوصفة (اشتراط «تمثل المكونات والتقديم الفعليين»):** استعلام البحث يُبنى من اسم الطبق + المكونات البارزة (لا نص عام)، وفحص ما بعد الاختيار: تصفية نتائج بكلمات نوع الطبق (soup/salad/curry/…)، وبنك صور معتمدة تراكمي (`image_source='approved_bank'`) للوجوه المصرية/العربية النادرة في الأسواق — يبدأ فارغًا ويتغذى من مراجعة المالك الدورية (قرار تشغيلي موثق باللوحة).
4. **حقوق الاستخدام:** تراخيص مزودات الأسواق القائمة موثقة لديها (Pexels/Unsplash/Pixabay تسمح بالاستخدام التجاري بلا إسناد) — تُوثق صفحة منهجية `/recipes/methodology` (نمط `/foods/methodology` القائم).
5. **التحسين:** إعادة كتابة عناوين الصور بعرض/ارتفاع/`fm=webp` عند العرض (`remote-image-size.ts` القائم)، وبطاقة OG لكل نسخة من الصورة نفسها (`/api/og-image` القائم يُوسَّع بنوع `recipe`).
6. **التصميم للمستقبل (اشتراط «صور إضافية وخطوات»):** جدول `recipe_images` يُضاف لاحقًا بأمر مستقل (تصميم `recipes.image_url` لا يمنعه) — يُذكر بالتوسع §13 ولا يُنفذ الآن.

---

## 8. التصنيفات والفلاتر (P5)

1. **السجل الأحادي:** `src/lib/recipes-taxonomy.ts` يحمل التسميات ثنائية اللغة والقواعد (§5.4) — الأصناف الأربعة كاملة من أمر المالك (المطابك: مصري/خليجي/عربي/متوسطي/آسيوي/عالمي — الأهداف: خسارة/بناء/زيادة/محافظة/رياضي/عالي البروتين — الأنظمة: العشرة المطلوبة — الوجبات: الإفطار/الغداء/العشاء/خفيفة/حلويات صحية/مشروبات/قبل وبعد التمرين).
2. **قاعدة التحقق قبل التصنيف:** `recipes.diets[]` تُكتب من `evaluateDiets` فقط (R2) — أي قائمة أنظمة قادمة من الذكاء الاصطناعي تُرفض (D-GATE-1). المطابخ وأنواع الوجبات يقبلها R1 بعد تحقق zod من مطابقتها للسجل.
3. **الفلاتر المطلوبة (اشتراط §9-هـ):** سعرات/بروتين/وقت تحضير/ميزانية/مكونات — كلها حقول قابلة للاستعلام في `recipes`/`recipe_ingredients` (فهارس GIN للمصفوفات + أعمدة رقمية) وتُعرض بنمط فلاتر URL-state للأطعمة القائم (`src/components/foods/url.ts` نمط يُستنسخ في `src/components/recipes/url.ts`).

---

## 9. واجهات القسم وتكامله مع الموقع (P5/P6)

### 9.1 المسارات الجديدة (كلها ثنائية اللغة — مرآة كاملة)
| المسار EN | المسار AR | المكوّن/النمط |
|---|---|---|
| `/recipes` | `/ar/recipes` | قائمة المستكشف — نمط `FoodsExplorer` (فلاتر URL + `ServerPagination`) |
| `/recipes/[slug]` | `/ar/recipes/[slug]` | صفحة الوصفة الكاملة (تفاصيل أدناه) — نمط `/foods/[slug]` + `/blog/[slug]` |
| `/recipes/cuisine/[slug]` | `/ar/recipes/cuisine/[slug]` | صفحات المطابخ — نمط `hub-collections.ts` |
| `/recipes/diet/[slug]` | `/ar/recipes/diet/[slug]` | صفحات الأنظمة (مع شرح توافق القواعد — قيمة حقيقية لا قوائم آلية) |
| `/recipes/goal/[slug]` | `/ar/recipes/goal/[slug]` | صفحات الأهداف |
| `/recipes/meal/[slug]` | `/ar/recipes/meal/[slug]` | صفحات أنواع الوجبات |
| `/recipes/methodology` | `/ar/recipes/methodology` | المنهجية والمصادر والحقوق (نمط `/foods/methodology`) |
| `/recipes/rss.xml` | `/ar/recipes/rss.xml` | تغذية (قرار ق7) — نمط `rss.ts` القائم |
| `/api/recipes/favorite` | — | POST/DELETE للمصادقين (نمط `/api/tools/saved-results`) |

### 9.2 صفحة الوصفة (اشتراطات §10 كاملة)
مكوّن خادمي `RecipeDetailPage` + جزيرة عميل واحدة `RecipeServingsScaler`:
- الهيرو (الصورة الواحدة المشتركة، alt بلغة النسخة) + شارات التصنيفات (منطقية فقط) + أوقات التحضير/الطهي.
- **المكونات بأوزان الجرام وحالة الوزن** (نيئ/مطبوخ بوضوح — اشتراط §7) + **مقيّد حصص** (1–12): جزيرة عميل تعيد حساب المقادير والقيم للحصة/الوصفة من بيانات المكونات المُمرَّرة كخصائص (لا نداء شبكة — نمط `calculateNutrition` الصافي القائم).
- **جدول القيم الغذائية لكل حصة** (السبعة إلزامية) + لكل الوصفة + «القيم المحسوبة من: USDA FDC (الإصدار)» (شفافية المصدر).
- خطوات التحضير المرقمة + نصائح + معلومات التخزين + البدائل وأثرها (تُتحقق أرقامها بـN-GATE-4).
- **طباعة** (نمط CSS `@media print` مخصص يعرض المكونات والخطوات فقط) + **مشاركة** (`share-links.ts` القائم) + **مفضلة** (للمصادقين؛ للزائر دعوة تسجيل).
- روابط داخلية: وصفات ذات صلة (تداخل مكونات/تصنيف) + مقالات المدونة ذات الصلة (بحث `blog-search.ts` بوسم التصنيف) + الأدوات (§9.4).
- اللغة: زر التبديل يقفز للتوأم مباشرة (المساران زوج مكتمل دائمًا — أقوى من حالة المدونة).

### 9.3 نقاط الإدخال الإلزامية في الموقع القائم (كل تعديل = موضع حقيقي مُدقق)
| الملف | التعديل |
|---|---|
| `src/lib/surface-locale.ts` | صفّا `/recipes` + `/ar/recipes` في `PUBLIC_INDEX_MIRRORS` و`PUBLIC_PREFIX_MIRRORS` — **بنفس كوميت أول مسار** (الكاناري `surface-locale.test.ts` يمشي نظام الملفات ويفشل بدونه) |
| `src/components/SiteHeader.tsx` | عنصر «Recipes/وصفات» في `SERVICE_NAV_DEFS` مجموعة nutrition (~سطر 369) + `DRAWER_GROUP_DEFS` (~سطر 172) |
| `src/components/SiteFooter.tsx` | رابط بعمود Nutrition (~سطر 206) |
| `src/lib/home-samples.ts` + `src/components/views/LandingView.tsx` | قسم «وصفات مختارة» (نمط `#eat` الأطعمة القائم): `RECIPES_SAMPLE_SLUGS` + `HomeRecipeSample` + بطاقة `LandingRecipeCard` + تحديث تثبيت `home-samples.test.ts` |
| `src/components/OtherTools.tsx` + `src/components/PageBottomPromo.tsx` | إضافة القسم لمصفوفتي `LIBRARIES`/`EXPLORE_ITEMS` |
| `src/lib/blog-tool-links.ts` | قاعدة روابط تلقائية → `/recipes` (كلمات: وصفة/طبخ/muffin/recipe…) |

### 9.4 التكامل مع الأدوات (اشتراط §10 كامل)
- **حاسبة السعرات:** بطاقة نتيجة تقترح وصفات ضمن نطاق سعرات الهدف (استعلام `recipes` بفلتر سعرات ±10% لنفس الهدف) — نمط بطاقات خفيفة.
- **مخطط الوجبات التفاعلي:** اقتراح «استبدل هذا الطبق بوصفة جاهزة» بجانب نتائج البحث (`/api/food-search` يعيد مقترحات وصفات عند توافق الاستعلام).
- **مخطط الوجبات بالذكاء الاصطناعي:** بعد توليد خطة تغذية تُعرض 2–3 وصفات متوافقة مع ماكروز اليوم (قراءة من `recipes` بفلتر diets/goals) — **دون إدخال الوصفات في محرك الخطة نفسه** (لا مساس بـ`plan-generator.ts` — عزل تام يحمي الأداة القائمة).
- **اقتراحات بحسب هدف المستخدم:** على لوحة العضو `(authed)` شريط وصفات مطابق لهدف خطته.
- **EVO:** توسيع قاعدة معرفة البحث (`evo-search.ts` يضيف عائلة الوصفات لمصادر `searchPlatform`) — إجابات المدرب تشير للوصفات المناسبة.

---

## 10. استراتيجية SEO/GEO المستقلة (P7)

1. **Recipe Schema (`getRecipeSchema` في `src/lib/seo.ts`):** عقدة `Recipe` كاملة — `recipeIngredient` (نص المكون بالوزن والحالة بلغة النسخة)، `recipeInstructions` (HowToStep من `steps`)، `nutrition` (NutritionInformation: calories + protein/carbs/fat/saturatedFat/fiber/sodium — لكل حصة)، `recipeYield`, `totalTime/prepTime/cookTime` (ISO 8601)، `image` (الصورة الواحدة المشتركة)، `recipeCuisine`, `suitableForDiet` (من diets المحسوبة)، `inLanguage`, `datePublished/dateModified` الصادقة، `author/publisher` (نمط الصدق القائم — بلا `aggregateRating` مصطنع قطعًا). + `BreadcrumbList` (منزل → وصفات → الوصفة) + FAQ فقط عند وجود أسئلة حقيقية (نفس قانون المدونة «NO-FORCED-FILLER»).
2. **hreflang/canonical:** كل صفحة وصفة تُصدر `{en, ar, x-default→EN}` كاملة دائمًا (الزوج مكتمل بنيويًا — لا حالة «غير مقترن») — عبر باني `recipes-server.ts`. صفحات التصنيف كذلك.
3. **خريطة جديدة:** `src/app/sitemap-recipes.xml/route.ts` (استعلام حي للمنشور بنمط `sitemap-blog` مع lastmod صادق لكل صف) + سطر في فهرس `sitemap.xml` + عائلة `recipes` في `SITEMAP_LASTMOD` + سطر Sitemap في `robots.txt` + **إضافة الخريطة لمصفوفات `SITEMAPS` في `indexnow-submit.mjs` و`bing-url-submit.mjs`** (بدونها لا تُقدَّم للفهرسة تلقائيًا — الفخ الموثق بالتدقيق §11).
4. **GEO:** إضافة عائلة الوصفات لـ`public/llms.txt` و`src/app/llms-full.txt/route.ts` + **تمديد كاناري `llms-family-coverage.test.ts`** (قانون التغطية).
5. **منع التنافس الداخلي:** مداخل نوايا جديدة في `src/lib/intent-map.ts` (`recipes-library → /recipes`، cuisines، diets — بعبارات رأس عربية وإنجليزية) — بعد إنشاء المسارات (الكاناري يفحص وجودها) — فتحمي بوابة مواضيع المدونة القائمة الوصفاتَ من منافسة المقالات، وتُدار العلاقة مع تصنيف `/blog/category/recipes` (قرار ق5).
6. **الروابط الداخلية:** من الأطعمة (صفحة كل مكون رئيسي تعرض وصفاته)، من الأدوات (§9.4)، من المدونة (قاعدة `blog-tool-links` الجديدة)، ومن الرئيسية.
7. **سياسات Google:** المحتوى أصلي ثنائي اللغة من إنتاج مستقل + قيم محسوبة قابلة للتحقق + إفصاح منهجية التوليد بصفحة الوصفة وصفحة المنهجية — اتساقًا مع إرشادات المحتوى المفيد والمولد آليًا (الالتزام المعماري القائم في E-E-A-T).

---

## 11. النشر التلقائي والتشغيل والأمان (P8)

1. **الجدولة اليومية:** زوج واحد يوميًا (وصفة عربية + توأمها الإنجليزية = نشر واحد ذري) — سير العمل §6.3.
2. **منع التكرار اليومي (اشتراط «عدم تشغيل مهمة النشر أكثر من مرة لنفس اليوم»):** ثلاث طبقات — فهرس فريد بنيوي `recipes_one_per_day_uidx` + فحص الطبقة (نمط `countAutomatedPublishedToday`) + مجموعة تزامن سير العمل.
3. **سجل كامل:** الطابور (`status/error_message/repair_cycles/bundle`) + `recipes.verification` + إدخال worklog لكل مرحلة تنفيذية (قانون المستودع).
4. **صلاحيات:** إنشاء/تعديل/نشر آلي = service role حصرًا (خط الأنابيب)؛ اللوحة = أدمن (`is_admin()` + `requireAdmin`)؛ المفضلة = صاحبها. **لا توجد أي واجهة كتابة عامة.**
5. **حماية واجهات الإدارة:** نمط `/admin` القائم (AdminGate + noindex + robots) — القسم الجديد يرثه كاملًا.
6. **معالجة أخطاء المزودين:** التدوير الثلاثي والتبريد والميزانيات القائمة (`ai-provider-cooldown.ts`) — تُستهلك كما هي بلا تعديل.
7. **حدود استهلاك الذكاء الاصطناعي:** وسوم `recipe:*` في عدادات Upstash القائمة (ميزانية النداءات اليومية لكل دالة تُسجل في السجل) + عداد نهائي يومي للوصفات (1 زوج) هو الحد التشغيلي الأقصى بطبيعته.
8. **قاطع الدارة وصمام الإيقاف:** §6.3 (3 إخفاقات متتالية = إيقاف تلقائي + إشعار أدمن + `RECIPES_PUBLISH_ENABLED`).
9. **إلغاء نشر وصفة عند خطأ مؤثر:** `unpublish_recipe_pair(reason)` الذري + 410/404 فوري للنسختين معًا + إزالة من الخريطة بالوسم (`revalidateTag`).
10. **لوحة المتابعة الإدارية:** `/admin/recipes` (نمط `BlogAdminView`): حالة إنتاج اليوم، آخر 30 يومًا (نُشر/حُجز/فشل مع الأسباب)، إعادة طوابير، إلغاء نشر، إحصاءات المفضلة، وشريط صحة موسَّع بـ`/api/ai/queue-health`.

---

## 12. الاختبارات ومعايير القبول (P9 — وبوابات داخل كل مرحلة)

### 12.1 اختبارات كاناري جديدة (ملفات `src/lib/__tests__/recipes-*.test.ts` + `src/app/**/__tests__`)
| الاختبار | يثبت (اشتراط المالك §16) |
|---|---|
| `recipes-pair-integrity.test.ts` | لا وصفة منشورة بلا نسختين منشورتين (استعلام + محاكاة نشر جزئي مرفوضة بالRPC) |
| `recipes-nutrition-math.test.ts` (ثوابت ذهبية) | صحة حساب الحصص والسعرات والماكروز (حالات: زيوت/صلصات/نيئ-مطبوخ/تقريب) |
| `recipes-calorie-consistency.test.ts` (property) | فحص 4/4/9 على مجموعات مولدة |
| `recipes-diet-rules.test.ts` | كل نظام يُقبل/يُرفض بحتمية (حالات حدية لكل قاعدة §5.4) |
| `recipes-gates-hold.test.ts` | وصفة فاشلة في أي بوابة لا تصل للنشر أبدًا (محاكاة كل بوابة) |
| `recipes-daily-quota.test.ts` | فشل النشر المزدوج لنفس اليوم (فهرس فريد + طبقة النشر) |
| `recipes-shared-structure.test.ts` | تطابق معرف الوصفة والمكونات والأوزان بين النسختين (مقارنة استعلامات ar/en) |
| `recipes-same-image.test.ts` | الصورة من السجل الرئيسي للنسختين (P-GATE-3) |
| `recipes-seo.test.ts` | صحة hreflang/canonical/Recipe Schema (عقدة كاملة بأحجام صحيحة) |
| `recipes-routes.test.ts` + كاناري `surface-locale` الموسَّع | نجاح المسارات العربية والإنجليزية + المرايا |
| `recipes-wiring.test.ts` (نمط `check-ui-wiring.sh`) | ظهور القسم في الهيدر والفوتر والرئيسية وصفحات الأدوات |
| `recipes-msa.test.ts` | عينات نصوص عربية تمر/تُرفض بكاشف MSA القائم |
| توسيع `llms-family-coverage.test.ts` + `intent-map.test.ts` | تغطية GEO والنوايا |

### 12.2 معايير قبول المراحل (تعمل داخل بطارية CI القائمة: `tsc --noEmit` 0 · ESLint 0 · Vitest كاملة خضراء · build exit 0)
لكل مرحلة P1→P9: كوميت مستقل ببواباته الخضراء + إدخال worklog + فحص `migration_audit` عند لمس السكيمة. بعد P8: **دخان إنتاجي** يومي تلقائي (أول تشغيل حي) + إضافة مسارات الوصفات لبطارية `verify` في `deploy-aws.yml` (نمط الدخان الثنائي القائم 29 مسارًا) + التحقق من عدم تأثر الأدوات والمقالات (مقارنة عدد صفحات البناء واختبارات الانحدار القائمة قبل/بعد).

---

## 13. خطة التوسع (تصميم الآن — تنفيذ لاحقًا بأمر مستقل)

المحرك مصمم بثلاث نقاط تعميم مخططة سلفًا، **دون أي كود إضافي الآن**:
1. **الطابور والحالات والوسوم عامة:** `recipe_generation_queue` بنمطها (فكرة/بنية/تحقق/تأليف/بوابات/نشر + `error_message` + `RERUN_TARGET`) هي القالب الذي تستنسخه أي عائلة محتوى قادمة (خطط وجبات/أدلة مكونات/تغذية رياضية/مقارنات) — بنفس أجزاء سير العمل القابلة لإعادة الاستخدام.
2. **بوابات لكل نوع:** `recipes-quality-gates.ts` بنمطه (سجل قواعد بيانات صافية + بطارية حتمية) — كل نوع محتوى مستقبلي يحمل ملف بواباته الخاص بنفس الواجهة `runGates(bundle) → GateReport`، و`AI_FUNCTION_REGISTRY` يستوعب عائلات جديدة بحقل `family` جديد.
3. **ثنائية اللغة بنفس الطبقات:** نمط (سجل رئيسي + نسختان إلزاميتان + مرجع حقائق مشترك) يصلح لأي نوع محتوى ثنائي مستقبلًا دون إعادة بناء المحرك الأساسي (المكونات/الحسابات تتبدل بطبقة الحقائق الخاصة بالنوع).
التوسعات نفسها (خطط الوجبات، الأدلة الغذائية، أدلة المكونات، التغذية الرياضية، المقارنات، محتوى الأنظمة) **تُنفذ كلٌّ بأمر مالك مستقل** — البنية تستوعبها بلا كسر (حالة توسيع لاحقة موثقة، لا عمل مجدول).

---

## 14. ترتيب التنفيذ (P0→P9) — **مع تعديلين مبررين على ترتيب الأمر**

> الترتيب المقترح بالأمر سليم بنيويًا مع تعديلين اكتشفهما الفحص الفعلي:

| المرحلة | النطاق (كل مرحلة = فريم/كوميت مستقل قابل للاختبار) | الملفات/الجداول المتأثرة | معيار الإغلاق |
|---|---|---|---|
| **P0** ✅ | التدقيق + هذا التصميم (التسليم الحالي) | `docs/healthy-recipes-platform/*` | اعتماد المالك للقرارات §17 |
| **P1** | قاعدة البيانات + محرك المحتوى الأساسي + **تعبئة مرجع المغذيات الأولية (150–300 مكون + الزيوت والصلصات)** | ميجريشن 0105 · `types.ts` · `recipes-shared/taxonomy/server/admin.ts` · سكربت تعبئة المرجع (قراءة-فقط من USDA FDC، بلا مفاتيح جديدة) | `migration_audit` أخضر + اختبارات وحدة للتصنيفات + مرجع مكتمل النصاب |
| **P2** 🔄 *(تقديم P3 الأصلية)* | **محرك الحساب الغذائي + بوابة التحقق الإلزامية** — يسبق محرك الإنتاج لأن R1 تعتمد عليه في التحقق اللحظي | `recipes-nutrition.ts` · `recipes-diet-rules.ts` · `recipes-quality-gates.ts` + اختباراتها الذهبية | كل اختبارات §12.1 الحسابية خضراء على حالات ثابتة |
| **P3** 🔄 *(P2 الأصلية)* | محرك الإنتاج: دوال السجل + معالجات R0→R7 + `recipes-runner` + بذور اختبار (3–5 أزواج وصفات يدوية منسقة للتحقق التكاملي) | `ai-registry.ts` (5 دوال) · `api/cron/recipes/*` · `scripts/recipes-runner/*` · `recipes-repair-target.ts` | تشغيل جاف كامل لزوج بذري (dry-run بلا نشر) يمر بالبوابات |
| **P4** | الصور: البحث + التحقق البصري + بنك المعتمدين + OG | `recipes-images.ts` (غلاف فوق `blog-images.ts`) · توسيع `/api/og-image` | زوج بذري بصورة موثقة المطابقة للنسختين |
| **P5** | واجهات القسم: كل مسارات §9.1 + صفحة الوصفة + المقيّد + الطباعة + **صفوف `surface-locale` والهيدر/الفوتر بنفس الكوميت** | `app/(en)/recipes/**` · `app/(ar)/ar/recipes/**` · `components/recipes/**` · `surface-locale.ts` · `SiteHeader/SiteFooter` | كاناري المرايا أخضر + دخان محلي AR/EN + build بالصفحات الجديدة |
| **P6** | تكامل الموقع: قسم الرئيسية + الأدوات (§9.4) + المفضلة + لوحة `/admin/recipes` | `home-samples.ts` · `LandingView.tsx` · `OtherTools/PageBottomPromo` · `api/recipes/favorite` · `app/(app)/admin/recipes/**` | اختبارات الأسلاك خضراء + بلا أي أثر سلبي على الأدوات القائمة (انحدار صفر) |
| **P7** | SEO كامل: `getRecipeSchema` + الخريطة + llms + النوايا + RSS + قاعدة روابط المدونة | `seo.ts` · `sitemap-recipes.xml` · `sitemap.xml` · `robots.txt` · `llms*.txt` · `intent-map.ts` · `blog-tool-links.ts` · سكربتا التقديم | كل كاناري SEO الجديدة خضراء + الخريطة بالفهرس |
| **P8** | النشر التلقائي اليومي الحي: `recipe-post.yml` + تعبئة dispatch + قاطع الدارة + لوحة المتابعة الموسعة | `.github/workflows/recipe-post.yml` · توسيع `dispatch-pipelines` · `admin_notifications` | أول يوم إنتاج أخضر كامل (زوج منشور مفهرس) بلا نشر منفرد |
| **P9** | الاختبارات الشاملة + التحقق الإنتاجي: بطارية §12 كاملة + دخان الإنتاج + مراجعة أسبوعين | توسيع `deploy-aws.yml` verify + كل ملفات الاختبار | §12.2 كاملة + تقرير إغلاق |

**مبررا التعديل:**
1. **تقديم الحساب الغذائي (P3 الأصلية) على محرك الإنتاج (P2 الأصلية):** بنية الوصفة (R1) تُتحقق لحظيًا ضد المرجع والبوابات — بناء المحرك قبل الحاسبة ينتج خطوة R1 غير قابلة للإغلاق، والحاسبة وحدة صافية قابلة للاختبار المستقل فورًا بعد P1.
2. **نقل تسجيل `surface-locale`/الهيدر/الفوتر من P6 إلى P5:** قانون الكاناري القائم يمشي نظام ملفات المسارات — أول مسار ثنائي بلا صف خريطة = بطارية حمراء؛ فالتسجيل جزء عضوي من كوميت المسارات نفسه لا مهمة تكامل لاحقة.

**بقية الترتيب (P4→P9) يطابق ترتيب الأمر كما هو** — الفحص الفعلي لم يكشف تعارضات إضافية.

---

## 15. العقبات والإمكانيات غير المتاحة (صريحة — لا افتراضات)

1. **توليد صور بالذكاء الاصطناعي غير متاح** (محال بقانون مالك 2026-08-28؛ لا مفاتيح ولا تكامل) — الخطة تعمل بمزودات الأسواق، وتوليد الصور خيار مستقبلي بقرار مالك ومفاتيح جديدة.
2. **بيانات الصوديوم/الدهون المشبعة غير موجودة للمكتبة الحالية** (8,830 صنفًا بلا هذين الحقلين) — تُبنى طبقة مرجع مخصصة لمكونات الوصفات (قرار ق1) بدل تعبئة المكتبة كلها.
3. **لا معرفات مرجعية (FDC) في المكتبة الحالية** — المرجع الجديد يحملها لمكونات الوصفات حصرًا.
4. **حصص المزودين المجانية قابلة للاستنفاد بالتراكم** مع المدونة — محرس بعدادات القائمة + سقف 1 زوج/يوم يبقى الاستهلاك جزئيًا جدًا من الحدود (التدقيق §16).
5. **دقة مطابقة صور الأسواق للمطابخ المصرية/العربية متفاوتة** — يعالجه بنك الصور المعتمد التراكمي + إمكانية حجز الوصفة عند فشل التحقق البصري.
6. **أي تغيير على سير المراجعة الحالي للمدونة خارج نطاق هذه المهمة** — منظومة الوصفات تعلن منهجيتها الخاصة (قرار ق3) دون المساس بقانون المدونة.

---

## 16. التكلفة التشغيلية المتوقعة

مطابقة لتحليل التدقيق §16 — **~$0 شهريًا** ضمن الطبقات المجانية القائمة (توليد نصوص على المزودين الخمسة، بحث مُسند داخل حصص Tavily/Exa، صور من الأسواق المجانية، جدولة GitHub Actions لمستودع عام، وعرض ISR على الأصل القائم). لا اشتراكات جديدة ولا مفاتيح جديدة ولا خدمات مدفوعة ضمن هذه الخطة إطلاقًا. مصدر التكلفة الوحيد المستقبلي المحتمل: قرار مالك لاحق بتفعيل مزود صور توليدية أو توسيع الحصص — كلاهما خارج نطاق الخطة الحالية.

---

## 17. القرارات المعمارية المطلوب اعتماد المالك قبل بدء P1

(مطابقة لجدول التدقيق §18 — تُعاد هنا للمرجعية التنفيذية)

| # | القرار | التوصية |
|---|---|---|
| ق1 | مصدر مرجع المغذيات (الصوديوم/المشبعة/المرجع) | مستودع مُنسَّق 150–300 مكون من USDA FDC بمعرفات وإصدارات |
| ق2 | ذريّة الزوج اللغوي | إلزام بنيوي (RPC معاملة واحدة + فهرس يومي فريد) — لا تدهور متسامح |
| ق3 | سياسة المراجعة (بلا مراجعة شخصية لكل وصفة) | بوابات حتمية بديلًا كاملًا + حالة `auto_verified` صادقة + إفصاح بالصفحة + مراجعة مالك لاحقة اختيارية |
| ق4 | مصدر الصور | الأسواق القائمة + بنك معتمد تراكمي (لا توليد) |
| ق5 | تصنيف المدونة `recipes` القائم | يبقى بنوايا منفصلة (خيار إعادة التسمية مؤجل) |
| ق6 | نطاق المفضلة | مصادقون فقط بجدول قابل للتعميم |
| ق7 | RSS للوصفات | تغذية منفصلة لكل لغة |

---

## 18. أول مرحلة تنفيذية جاهزة للبدء فور الاعتماد

**P1 — الأساس:** ميجريشن `0105_healthy_recipes_foundation.sql` (الجداول الستة + RLS + الفهارس + `publish_recipe_pair`/`unpublish_recipe_pair`) بنفس كوميت تحديث `types.ts` وصف `INDEX.md` + الوحدات الأربع (`recipes-shared/taxonomy/server/admin`) + **سكربت تعبئة مرجع المغذيات** (قائمة أولى: 150–300 مكون مغطيًا الزيوت/الصلصات/البروتينات/الحبوب/الخضار/الفواكه المشتركة في المطابخ الست) + اختبارات وحدة التصنيفات والمرجع. 
**شروط الدخول:** اعتماد ق1 (مصدر المرجع) وق2 (الذريّة) وق3 (سياسة المراجعة). 
**شروط الإغلاق:** كل بوابات CI خضراء (tsc/eslint/vitest/docs-audit/migration-audit) + إدخال worklog + كوميت واحد على `main`.

> **تذكير إلزامي (الأصل التخطيطي):** لا يبدأ أي تنفيذ برمجي أو نشر إنتاجي قبل اعتماد المالك لهذه الخطة وقراراتها (نص الأمر §17-9). — **تم:** اعتمد المالك ونفّذ (§19).

---

## 19. سجل التنفيذ (EXECUTION LOG — أمر المالك «Alkemos Healthy Recipes – Full Implementation» 2026-11-10)

> التنفيذ الكامل P1→P9 بكوميت واحد على `main` وفق هذه الخطة حرفيًا إلا حيث وُثّق انحراف بدليل أدناه. المصدر الحي للتفاصيل: كوميت التنفيذ + مدخل worklog ‏`HEALTHY-RECIPES-PLATFORM-FULL-IMPLEMENTATION-2026-11-10`.

### 19.1 المراحل المنفذة

| المرحلة | الحالة | الملاحظات التنفيذية |
|---|---|---|
| P1 قاعدة البيانات + المحتوى | ✅ | ميجريشن `20261110100000_0108_healthy_recipes_foundation.sql` (الرقم 0108 لا 0105 — أرقام 0105–0107 استُهلكت بمراحل 2026-11-05..09) بستة جداول + RPCين ذريين + RLS + فهرس `recipes_one_per_day_uidx` + بذرة **~168** مكونًا (فوق حد 150–300 المخطط، بتغطية الزيوت/الصلصات كاملة) · بنفس الكوميت: INDEX.md + types.ts + migration_probes — migration_audit ‏PASS بصفر انحراف جديد |
| P2 (الحساب) / P3 (الإنتاج) بالترتيب المعدَّل | ✅ | recipes-nutrition · recipes-diet-rules · recipes-quality-gates ثم 5 دوال سجل `recipe:*` + معالجات R0→R7 + recipes-repair-target + قاطع الدارة والصمام |
| P4 الصور | ✅ | recipes-images: استعلام مركب (الطبق + مكونات رئيسية) + تصفية نوع الطبق + استبعاد مكرر — الصورة على السجل الرئيسي حصرًا (P-GATE-3 بنيويًا) |
| P5 الواجهات | ✅ | 18 ملف مسار × شجرتَي (en)/(ar): مستكشف + [slug] + 4 عائلات مراكز + منهجية + RSS + layout — **تسجيل المرايا بsurface-locale بنفس الكوميت** (كاناري المشي أخضر) كما عدّل §14 |
| P6 التكامل | ✅ | الهيدر/الدرج/الفوتر/OtherTools/PageBottomPromo/AdminShell + قسم «وصفات مختارة» (حالة فارغة صادقة: لا قسم قبل أول نشر) + قاعدة blog-tool-links فوق المسارات العامة + عائلة EVO (12 مركزًا) + تكامل الأدوات **قراءة-فقط** عبر /api/recipes/suggest (عزل محرك الخطة intact) + المفضلة + لوحة /admin/recipes |
| P7 SEO | ✅ | getRecipeSchema + Breadcrumb + sitemap-recipes.xml (فهرس ديناميكي الصدق + robots + IndexNow + Bing — فخ §11 مغلق) + الأسطح الثابتة بsitemap-pages (مرساة pages → 2026-11-10) + llms.txt/llms-full + 3 مداخل نوايا + OG ‏type=recipe |
| P8 التشغيل | ✅ | recipe-post.yml (06:30 UTC + dispatch + concurrency) + recipes-runner (نسخة المدونة بعقد إصلاح R5) + توسيع dispatch-pipelines |
| P9 الاختبارات | ✅ | 13 عائلة كاناري — **vitest 5,838/5,838 · tsc ‏0 · eslint ‏0 · build ‏exit 0 بـ2,326 صفحة (كان 2,248)** |

### 19.2 القرارات التنفيذية (انحرافات موثقة بدليل)

1. **نطاق اتساق السعرات (§5.2-5):** المسودة `max(5%، 20 سعرة)` أثبتت البذرة عدم قابليتها للشحن — بيانات USDA المنشورة تحمل انحرافًا هيكليًا عن 4/4/9 (مقيسًا على بذرة 0108: تمر مجهول 277 مقابل 309 مشتق · زبيب 299/334 · زبدة فول سوداني 588/634 · ملوخية 60/44 — أطعمة غنية بالألياف/السكريات/المكسرات تنشر طاقة أيضًا أقل من المعاملات العامة). **النطاق المُنفذ: `max(12%، 150 سعرة)`** — يستوعب أسوأ الحالات الواقعية (500جم تمر خالص: انحراف 160 مقابل سماحية 166 ✓) ويظل يمسك كل تلفيق (مئات السعرات)، بسابقة قانون «اتساق الوجبات» القائم في nutrition-totals (±max(120، 7%)) الذي سمّته الخطة «توسيعًا مباشرًا» له. التوثيق الكامل بتعليق الوحدة (recipes-nutrition.ts) والقياس محفوظ هنا.
2. **رقم الميجريشن:** 0108 بدل 0105 (استهلاك الأرقام بمراحل سابقة) — القانون (رقم + صف فهرس + فحوص بنفس الكوميت) ملتزم به.
3. **بطاقة OG للوصفات (§7-5):** الوصفات المنشورة تحمل صورة حتمًا (بوابة image_verified تمنع النشر بلا صورة) فالصفحة cover-first بالصورة الحقيقية نفسها للنسختين؛ ذراع `type=recipe` أُضيف للمولد كمسار احتياطي صادق فقط.
4. **مرساة sitemap-lastmod (§10-3):** عائلة التفاصيل ديناميكية الصدق (نمط المدونة — مصدر حقيقة واحد) ولا تُدرج بSITEMAP_LASTMOD؛ الأسطح الثابتة انضمت لعائلة pages بمرساة 2026-11-10 (بروتوكول التحديث).
5. **حالة المفضلة عميليًا:** صفحة الوصفة ISR-ثابتة، فالزر يدرك حالة المشاهد بGET خفيف بعد التحميل (لا قراءة كوكيز بالصفحة — يحفظ التوليد الثابت الذي تشترطه المعمارية).
6. **كانارات العد المعتمدة حُدّثت بتعليل** (card-lift ‏12 عائلة بإضافة LandingRecipeCard · chev ‏11 بCTA الوصفات · لهجات البطاقة: خلية الوقت محايدة اللون حفاظًا على دلالة البرتقالي=كرب فقط).

### 19.3 نتائج الاختبارات (§12.2)

- **البطارية:** vitest ‏**5,838/5,838** خضراء (213 ملفًا — كانت 5,704 قبل المنظومة؛ +13 ملف كاناري جديدًا + تمديدات) · `tsc --noEmit` صفر · `eslint .` صفر أخطاء · `migration_audit` ‏PASS (صفر انحراف جديد) · `docs_audit` + `docs_parity` أخضران · **build ‏exit 0 بـ2,326 صفحة** (قبل: 2,248 — الطفو +78 عنوانًا هو عائلة الوصفات الثابتة ×المرآتين، صفر خسارة).
- **اختبارات §4 العملية المنفذة (بيانات معزولة — صفر نشر اختباري):** اتساق الحساب الغذائي بثوابت ذهبية محسوبة يدويًا + خصائص مولدة (60 تركيبة) · حجب النشر المنفرد (RPC يرفض قبل أي كتابة — مُثبت نصيًا وبنيويًا) · منع النشر المزدوج (ثلاث طبقات) · الصورة الواحدة للنسختين (بنيويًا + بالعقدة) · محاكاة فشل كل بوابة → حجز بعقد rerun صحيح · فشل مزود (اتساق مفبرك) → حجز N-GATE-3 · تطابق المعرف والمكونات والأوزان بين النسختين (مسار واحد للحقائق) · روابط التوأم والمرايا (hreflang ثلاثي كامل دائمًا) · Schema/SEO كاملة (14 اختبارًا) · عدم تأثر الموجود (البطارية الكاملة خضراء بلا استثناء + عدد صفحات البناء محفوظ زائدًا).
- **المتبقي بعد الدفع (خطوات ما بعد الكوميت):** تشغيل أول زوج حي (cron ‏06:30 UTC التالي أو dispatch يدوي — الميجريشن يطبق آليًا بخطوة migrate قبل الكود) ثم التحقق الإنتاجي البعدي (دخان المسارات الثنائية + أول زوج منشور مفهرس) — يُوثق بمدخل متابعة.

