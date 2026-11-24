# 02 — تحليل الفروع ومقارنتها بـ main

> مرجع: `git fetch --all --prune` عند 2026-11-24T21:00Z. **main هو المرجع الأساسي** (رأس `500ed1f2`). لا فروع محلية في بيئة الفحص (استنساخ نظيف) — الفحص على الفروع البعيدة الثمانية + main، ولا stash.

---

## 1. جدول الفروع الكامل

| الفرع | ahead/behind مقابل main | آخر كوميت (تاريخ الالتزام) | الحكم |
|---|---|---|---|
| `main` | — | `500ed1f2` (2026-11-23) | المرجع |
| `design/alkemos-home-redesign-preview` | **+13 / −0** | `4dc60e4b` — 2026-11-24T16:18:08+02:00 | **عمل نشط غير مدمج — بانتظار مراجعة المالك البصرية (PR ‏#9)** |
| `gd2-retention` | +1 / −566 | `82fe4dc8` — 2026-10-04 | **مكرر منجز:** عمله هبط في main بكوميت مختلف (`4fddbe24` — الجولة الخضراء + الهبوط §6) — الفرع نسخة تجريبية متقادمة |
| `perf/vercel-usage-fix` | +1 / −542 | `ba045317` — 2026-10-09 | **مكرر منجز:** عمله هبط في main عبر `ede3637f` (PR ‏#7 بالمستودع السابق) — الفرع نسخة تجريبية متقادمة |
| `blog/provider-failover` | 0 / −505 | 2026-10-16 | مدمج بالكامل — متروك للتنظيف |
| `gd1-smoke-test` | 0 / −570 | 2026-10-04 | مدمج بالكامل — متروك للتنظيف |
| `gd3-offsite` | 0 / −560 | 2026-10-04 | مدمج بالكامل — متروك للتنظيف |
| `gd4-restore-drill` | 0 / −558 | 2026-10-04 | مدمج بالكامل — متروك للتنظيف |
| `test/aws-lightsail-migration` | 0 / −522 | 2026-10-09 | مدمج بالكامل — متروك للتنظيف |

> «ahead» = كوميتات موجودة في الفرع وغير موجودة في main. الفروع الخمسة الأخيرة صفر ahead أي لا تحتوي أي عمل غير مدمج.

---

## 2. الفرع النشط: `design/alkemos-home-redesign-preview` (الوحيد)

- **13 كوميت غير مدمجة** (من `e4fa1e91` إلى `4dc60e4b`)، كلها خلال 2026-11-24 — عمل جارٍ اليوم نفسه يوم الفحص.
- **النطاق (diff ثلاثي النقاط مقابل main — 8 ملفات، +186 سطرًا):**
  - `preview-pages/index.html` + `preview-pages/ar/index.html` + `preview-pages/style.css` — صفحتا معاينة ثابتتين معزولتين للنشر على GitHub Pages.
  - `.github/workflows/preview-pages.yml` — سير نشر المعاينة (push على هذا الفرع فقط + dispatch؛ صلاحيات pages:write).
  - `src/app/(en)/design-preview/page.tsx` + `src/app/(ar)/ar/design-preview/page.tsx` + `src/components/design-preview/DesignPreview.tsx` + `DesignPreview.module.css` — مسارا معاينة داخل التطبيق ثنائيا اللغة، بترقيم noindex وفق جسم PR ‏#9.
- **تصميم المحتوى:** «Marble & Chrome» — عناوين EN/AR، إثباتات (868+ تمرين · 8,162+ صنف · 8 أدوات)، بطاقات أقسام، قسم EVO — كلها من أصول وهوية موجودة، بلا مساس بالمنطق أو البيانات أو الدفع.
- **العلاقة بـ PR ‏#9:** مسودة مفتوحة من الفرع إلى main — انظر `03-pull-requests.md`.
- **سياق تاريخي:** هذا العمل خلف إلغاء مهمة ASTRYX-DESIGN-STUDY (كوميت `dd9abe40` — revert كامل بأمر المالك) — أي أن اتجاه إعادة التصميم أعيد فتحه لاحقًا بمسار معزول قابل للعكس بدل دراسة النظام المغلوطة.
- **ملاحظة فنية من جسم الـ PR:** «هذا المستودع لا يملك نشر معاينة للفروع، فالمسارات منفذة بالمسودة لكن بلا رابط معاينة حي بالمتصفح» — سير `preview-pages.yml` على الفرع هو الحل المقترح لذلك داخل نفس الفرع.

---

## 3. الفرعان المكرران (عملهما منجز في main)

### 3.1 `gd2-retention` — الكوميت `82fe4dc8` (2026-10-04)
- رسالته: «feat: [vercel skip] GD-2 backup retention — GFS working-tree prune of the private backup repo (owner order 2026-10-04 «نفّذ GD-2»)» مع **مُشغّل دفع مؤقت محصور بالفرع** لقياس الجولة الخضراء (قانون الهبوط الموثق داخل الملف نفسه: يُزال عند الهبوط).
- **الدليل على الإنجاز في main:** `git log main --grep=GD-2` يظهر `4fddbe24` «feat: GD-2 backup retention — green round complete + §6 landing» + `2daea1ca` «docs: GD-2 measured-apply record — first prune landed exactly as predicted». و`.github/workflows/backup-retention.yml` حي في main (سبت 03:30Z + dispatch مع dry_run افتراضي).
- **الخلاصة:** الفرع نسخة القياس المؤقتة قبل الهبوط — لا قيمة مستقبلية؛ حذفه بعد تأكيد المالك (التاريخ محفوظ في reflog/الوسوم عند الحاجة، والقانون داخله نص على إزالة المُشغّل المؤقت عند الهبوط).

### 3.2 `perf/vercel-usage-fix` — الكوميت `ba045317` (2026-10-09)
- رسالته: «perf: 345 — VERCEL-USAGE-9 ISR routes + CSP + middleware + CF RSC — … on the owner-ordered trial branch (no push until approval)».
- **الدليل على الإنجاز في main:** الكوميت `ede3637f` (نفس العنوان حرفيًا مع «(#7)») سلف main، وسلسلة `3e5f0170` «VERCEL-USAGE-9-DEPLOY — PR#7 + 6-path HIT». تحقق مضموني مباشر من هذا التدقيق: `export const revalidate = 3600` بمسار `src/app/(ar)/ar/blog/[slug]/page.tsx` و`revalidate = 86400` بمسار `src/app/(en)/foods/[slug]/page.tsx` — موجودان في main اليوم بالقيم نفسها.
- **الخلاصة:** trial-branch أُعيد هبوط عمله عبر PR بالمستودع السابق للانتقال؛ لا فجوة بين الفرع وmain عدا اختلاف الأساس (git cherry: patch-id مختلف لأن القاعدة مختلفة).

---

## 4. مرشحو الحذف بعد تأكيد المالك (لم يُحذف أي فرع في هذه المهمة)

| الفرع | السبب |
|---|---|
| `blog/provider-failover` · `gd1-smoke-test` · `gd3-offsite` · `gd4-restore-drill` · `test/aws-lightsail-migration` | مدمجة بالكامل (صفر ahead) — أثر تاريخي فقط |
| `gd2-retention` · `perf/vercel-usage-fix` | عملهما منجز في main بنسخ نهائية — نسخ تجريبية متقادمة |

**يُحتفظ به:** `design/alkemos-home-redesign-preview` (عمل نشط بـ PR ‏#9 مفتوح) + `main`.

> **قيد أمانة:** حذف الفروع فعل تغييري خارج نطاق أمر هذه المهمة («لا تحذف فروعًا») — القائمة أعلاه توصية بأمر مالك مستقل فقط، ولا يفقد الحذف شيئًا لأن كل الكوميتات موجودة في main أو محفوظة بتاريخها (ولا مانع هيكليًا: حماية منع الحذف مفعلة على main فقط).

---

## 5. الوسوم

وسمان أرشيفيان فقط: `archive/patch-1-uploads-20260819` و`backup/clean-2026-08-25` — لا وسوم إصدارات؛ يطابق طبيعة المستودع (نشر مستمر من main بلا إصدارات معلنة).
