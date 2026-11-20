# 01 — دراسة Astryx من الداخل وتحليل التوافق

> مصادر هذه الدراسة: تثبيت فعلي للحزم (`@astryxdesign/core@0.7.16` + `@astryxdesign/cli@0.7.16` + `@astryxdesign/theme-neutral` + `@stylexjs/stylex`) وفحص ملفاتها الموزعة مباشرة، وتشغيل واجهة CLI (`docs` / `theme list` / `component` / `docs tokens` / `docs internationalization/*`)، وموقع التوثيق astryx.atmeta.com، ومستودع github.com/meta/astryx — 2026-11-21.

## 1. ما هو Astryx (الحقائق الموثقة)

- نظام تصميم **مفتوح المصدر (MIT) من Meta**، نما داخليًا 8 سنوات حتى صار «أكبر نظام تصميم وأكثرها استخدامًا في الشركة — يشغّل أكثر من 13,000 تطبيق» (README الرسمي)، وأُتيح علنًا في Beta (نوفمبر 2026).
- مبني على **React 19+ وStyleX** (محرك CSS الذري الخاص بـ Meta): «Astryx requires React 19 or later».
- **174 مكوّنًا** (إحصاء `astryx component` الفعلي) ببنية استيراد لكل مكوّن على حدة («Import each component from its own entry… keeps bundles small»).
- **7 ثيمات جاهزة**: neutral · butter · chocolate · gothic · matcha · stone · y2k — والثيم «مجموعة تجاوزات لخصائص CSS مخصصة، فيمكن لمصمم أن يجعل Astryx بطابعه دون تفريع أو تغليف للمصدر».
- مبدأ «بلا قفل تنسيقي»: «Astryx authors its styles with StyleX, but that's invisible to consumers. Override with `className` using Tailwind, CSS modules, or plain CSS — whatever your project already uses».
- مبدأ «مفتوح للتكوين»: المكوّنات قابلة للفحص عند أي مستوى، و`swizzle` يُخرج مصدر المكوّن كاملًا إلى مشروعك.
- مصمم «للبشر والوكلاء معًا»: الواجهة والوثائق وCLI مصممة معًا بحيث «يبني الإنسان والمساعد الذكي بالطريقة نفسها من المرجع نفسه» — يتضمن prompts جاهزة لأدوات AI.

## 2. البنية التقنية (كما فحصناها بالتثبيت)

- **التثبيت**: `@astryxdesign/core` + `@stylexjs/stylex` (peer) + حزمة ثيم + `@astryxdesign/cli` (dev) — ثم `astryx init` و`astryx theme add <slug>` يولّدان `astryx-themes.ts` (وحدة الثيمات + استيراد CSS الثيم) ويوصيان بتغليف التطبيق بـ `<Theme theme={themes[defaultThemeSlug]}>`.
- **CSS موزّع مسبق الترجمة**: `@astryxdesign/core/astryx.css` (292KB StyleX مجمّع) + `reset.css` — بطبقات cascade معلنة: `@layer reset, astryx-base, astryx-theme`، والثيمات تُحصر بـ `@scope ([data-astryx-theme="…"])`.
- **قاموس التوكِنات** (من `theme-neutral/dist/theme.css` الفعلي): **221 خاصية CSS** منها: ألوان دلالية كاملة (`--color-background-*` · `--color-text-*` · `--color-border-*` · `--color-icon-*` · `--color-on-*` + حالات success/warning/error/info وألوان بيانات 56 متغيرًا للرسوم) جميعها بصيغة `light-dark()` للتبديل التلقائي؛ سلم هندسي للأحجام `--font-size-*` (round(14×1.2^step)) ومقاسات نص دلالية `--text-heading-1..6-*` و`--text-display-1..3-*`؛ `--radius-*` و`--shadow-*` و`--duration-*` و`--ease-*` (بعقفي `tempo` و`character` لتخصيص الحركة).
- **الثيم المخصص**: `defineTheme({extends, …})` لتجاوز التوكِنات دون تفريع، و`theme eject` لتفريع المصدر عند الطلب فقط، ومحرر ثيمات تجريبي (`astryx experimental theme editor new <name> --like neutral`).
- **توليد الألوان**: ملفات `palette.config.json` (وصفة `astryx-oklch-v1`): عائلات لونية ببذور ومراحل 0–100 وتوليد فاتح/داكن معًا — أي أن الثيمات المخصصة تُبنى على منوال لوني مقاس وليس هكسات يدوية.

## 3. RTL والعربية — الدعم الرسمي (نصًا من الوثائق)

من `astryx docs internationalization/i18n-rtl-and-testing text-direction-rtl` (حرفيًا):

> «Astryx tracks text direction (`'ltr'` or `'rtl'`) alongside the locale. By default the direction is derived from the `locale` you pass to `<InternationalizationProvider>` via `Intl.Locale.getTextInfo()`… Once the direction is set, astryx components mirror on their own: **layout and spacing flip via CSS logical properties, directional icons (chevrons, carets) flip in place, keyboard arrow keys swap left/right, and overlays position on the correct side. Set the direction once and the whole component tree follows.**»

> «If your app is server-rendered (like Next.js), the `getLocaleDirection()` helper computes the direction from a locale so you can set it while the page renders» — مع مثال رسمي لتعيين `<html lang dir>` في root layout.

- تكامل i18n كامل: قواميس، تعايش مع react-intl/i18next/next-intl/LinguiJS، تقويمات (هجري/فارسي/عبري…)، و**اختبار pseudo-locale** («wraps every string in ⟦...⟧» لكشف النصوص الصلبة ومشاكل الطول).
- **الخلاصة**: RTL مواطن أول-class في المكوّنات نفسها (لا حيلة اتجاه خارجية) — وهذا نادر في أنظمة التصميم، وهو نقطة التوافق الأهم لمنصة ثنائية اللغة عربية أولًا مثل Alkemos.

## 4. التوافق مع بنية Alkemos الحالية

| المحور | الوضع الحالي (المستودع) | موقف Astryx | الحكم |
|---|---|---|---|
| إطار العمل | Next.js 16.3.8 (App Router) + React 19 | يتطلب React ≥19 | ✅ مستوفى بلا تغيير |
| التنسيق | Tailwind 4 + `globals.css` بقوانين VRD + shadcn/ui (Radix) | «لا قفل تنسيقي» — `className`/Tailwind يعمل فوقه؛ دليل هجرة رسمي من Tailwind/shadcn/Radix (setup → component-migration → verification) | ✅ تعايش تدريجي ممكن |
| الثيمات | `data-theme` + متغيرات CSS (`:root`/`[data-theme="dark"]`) — Marble & Chrome | الثيم = تجاوزات خصائص CSS بـ `light-dark()` و`color-scheme` | ✅ النموذج أثبت التطابق المفاهيمي (نفس آلية المتغيرات) |
| i18n/RTL | مجموعتا مسارات (en)/(ar) + `dir` على `<html>` + خصائص منطقية بقوانين RTL | انعكاس تلقائي للمكوّنات + `getLocaleDirection()` | ✅ يتقاطع مباشرة مع معمارية URL-pinned الحالية |
| الجزر التفاعلية | نمط الجزر الخادمية (SEO-P1-6) | استيراد لكل مكوّن على حدة يحافظ على صغر الحزم | ✅ متوافق فلسفيًا |
| الحركة | قوانين «مرة واحدة + reduced-motion» | توكِنات مدة/منحنى + عقبا `tempo`/`character` | ✅ قابل للقياس على نفس القوانين |
| النضج | إنتاج مستقر (بطارية 7,000+) | **Beta** (إصدار 0.7.x) | ⚠️ الخطر الرئيسي — انظر خطة التنفيذ |

## 5. ما استُفيد منه فعليًا في النموذج (لا تغييرات سطحية)

1. **`reset.css` الحرفي** من `@astryxdesign/core/src/reset.css` مضمّن كما هو في طبقة `@layer reset` بالنموذج.
2. **ثيم مخصص `alkemos-volt`** معرّف على قاموس توكِنات Astryx نفسه (نفس الأسماء والبنية التي يخرجها `theme build`: `--color-background-body/card/muted` · `--color-text-primary/secondary/accent` · `--radius-element/container/page` · `--shadow-low/med/high` · `--duration-fast/medium` · `--ease-entrance/move` · `--text-heading-2-size/leading` …) وباستراتيجية `light-dark()` نفسها — أي أن النموذج «يرتدي» Astryx بطريقة `defineTheme` وليس مجرد ألوان مشابهة.
3. **قوانين RTL المنطقية** المعمول بها في مكوّنات Astryx (inline/block logical properties) مطبقة في كل سطر CSS بالنموذج — صفر قواعد `[dir=rtl]` معاكسة (الاستثناء الوحيد: انعكاس السهم وزاوية الشريط المتحرك).
4. **مصادر الأنماط المعمارية**: طبقات cascade الثلاث، حصر الثيم بـ scope، ونمط «توكِن واحد لكل قرار» — كلها من التوزيعة الفعلية.

## 6. الثيمات الجاهزة لماذا لا تكفي

الثيمات السبعة تحمل شخصيات عامة (neutral رمادي هادئ، gothic داكن تحريري…) — ولا يحقق أي منها طاقة الأداء الرياضي المطلوبة (مرجعية Nike/WHOOP). القرار: **ثيم مخصص على وصفة Astryx** (كما فعل النموذج بـ `alkemos-volt`): فولت واحد (`#CCF53C`) كلون فعل، أسود أداء (`#0A0B0D`) كلوحة، سيان EVO (`#45D6FF`) محجوز لأسطح الذكاء الاصطناعي (امتداد لقانون `--ai` القائم)، مع الحفاظ على قانون ألوان وقائع الماكرو الأربعة (سعرات أزرق · بروتين أخضر · كارب برتقالي · دهون أحمر) بمعايرة تباين للوضعين.

## 7. قرار معماري مؤجل (خياران بعد الموافقة على الاتجاه)

- **(أ) طبقة توكِنات فقط (الأخف)**: يبقى Tailwind/shadcn كما هو، وتُترجم هوية Volt إلى متغيرات `globals.css` القائمة + مكونات العرض تُعاد تصميمها بنفس الأنماط (كما في النموذج). مخاطرة أدنى، وأثر أسرع، واستفادة من Astryx على مستوى القاموس والمنهج.
- **(ب) تبنٍّ كامل تدريجي**: تثبيت الحزم و`defineTheme` ثم استبدال مكوّنات shadcn بمكوّنات Astryx وفق دليل الهجرة الرسمي (قسمًا قسمًا، الأسطح الأقل مخاطرة أولًا). مكاسب: 174 مكوّنًا ممتحنًا + RTL تلقائي + توحيد مع منظومة Meta. كلفة: تعلم + ترحيل + انكشاف على Beta.
- التوصية الأولية: **(أ) الآن ثم (ب) انتقائيًا لاحقًا** للأسطح عالية التفاعل (نماذج/حواريات/تقويم) حيث تظهر قيمة المكوّنات الجاهزة — تفصيلها في `03-execution-plan.md`.
