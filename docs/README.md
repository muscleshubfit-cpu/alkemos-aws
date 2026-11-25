# docs/ — Documentation Lifecycle Registry

> **Provenance:** created Phase 236 (2026-09-19) by the owner-approved Documentation & Context
> Architecture Migration Plan §7 — the sanctioned exception to AGENTS.md §12.5's no-new-docs law.
> **Rebuilt compact 2026-11-25 (owner-ordered knowledge-base restructure):** the registry had
> grown to 361KB of per-row content summaries — a map must not duplicate its territory. Rows are
> now one line each; per-report metadata lives in `docs/archive/README.md` (the archive index).
> **Law:** any new documentation file lands WITH its row here (top-level `docs/*.md`) or its
> index entry (`docs/archive/`) in the SAME commit (§3.8 parity); a status that stops being true
> is a bug — check M re-verifies this table on every push.
> **Agent session reading budget (§3.6):**
> `STATE.md` (~30s) → `AGENTS.md` §1–§4 + §12 (the session read; §5–§11 on-demand law)
> → top-3 `worklog.md` entries → everything else ON DEMAND via STATE's source-of-truth map
> or the rows below. Do not read this file top-to-bottom in a normal session.

## Registry — core context sphere (repo root)

| File | Role | Status |
|---|---|---|
| `STATE.md` | Living status — FIRST file of every session | LIVE |
| `AGENTS.md` | Binding law for every agent (§1–§12.10) | LIVE |
| `worklog.md` | Task log — live window ≤12 entries/≤128KB (check H5), newest on top | LIVE |
| `README.md` | Front door + feature law surface (number-free by law) | LIVE |
| `DEVELOPER_GUIDE.md` | Onboarding + architecture (number-free by law) | LIVE |
| `SECURITY.md` | Security policy | LIVE |
| `DESIGN.md` | Design system — THE binding design law | LIVE |
| `CONTRIBUTING.md` | Contribution policy (static) | LIVE |
| `CHANGELOG.md` | Pointer to per-phase tracking (STATE/worklog) | LIVE |
| `AUDIT_REPORT.md` | 2026-09-29 AI-article-generation audit — §9 skeleton preserved (workflow WHY-references); stages 0/1/2 executed | LIVE (بأفعال مالك متبقية) |

## Registry — docs/ top-level (active reference only; Ph 291 born-archived law)

| File | Role | Status |
|---|---|---|
| `docs/README.md` | هذا الفهرس — خريطة التوثيق | LIVE |
| `docs/TECH_REFERENCE.md` | المرجع التقني التفصيلي (Supabase/RLS/مكونات/SQL/كاش/§8) | LIVE |
| `docs/CI_GATES.md` | سرد البوابات: كل سير عمل وما يشتقه ولماذا | LIVE |
| `docs/UTC-TIME-LAW-2026-11-21.md` | قانون التوقيت الموحد UTC (طابع git هو المرجع) | LIVE |
| `docs/QA-TEST-ACCOUNTS-2026-10-26.md` | قناة حسابات الاختبار الدائمة (قانون AGENTS §6) | LIVE (سياسة) |
| `docs/AI-QUOTAS-POLICY-2026-11-14.md` | سياسة حصص AI المعتمدة | LIVE (سياسة) |
| `docs/DB-MIGRATION-PIPELINE-2026-10-27.md` | قانون خط ميجريشنز الإنتاج (التطبيق الآلي والبوابات) | LIVE (سياسة) |
| `docs/MIGRATION-GATE-ISSUE3-RESOLUTION-2026-11-10.md` | قانون عدم تحرير الميجريشن المطبق (migration_edit_guard) | LIVE (سياسة) |
| `docs/MIGRATION-PROBE-0102-ISOLATION-2026-11-24.md` | فحص 0102 المعزول زمنيًا (سقوط إنذار #8 الكاذب) | LIVE |
| `docs/ACCOUNTS-ORPHAN-AUDIT-2026-11-25.md` | تدقيق يتيمة الحسابات اليومي (CLEAN حيًا) | LIVE |
| `docs/ACCOUNTS-ORPHAN-AUDIT-PAGINATION-COMPLETENESS-2026-11-25.md` | قانون اكتمال التقسيم للتدقيق (exit 3 = محجوب) | LIVE |
| `docs/SEO-GEO-MASTER-PLAN.md` | خطة SEO/GEO الحية | LIVE |
| `docs/SEO-EEAT-FRAMEWORK.md` | إطار E-E-A-T (مرجع ثابت) | LIVE (مرجع) |
| `docs/SEO-SCHEMA-REFERENCE.md` | مرجع Schema.org للموقع | LIVE (مرجع) |
| `docs/SEO-CWV-THRESHOLDS.md` | عتبات Core Web Vitals المعتمدة | LIVE (مرجع) |
| `docs/EVO-MASTER-PLAN.md` | خطة EVO (EVO-6 محذوف؛ القرارات §7) | LIVE |
| `docs/content-strategy.md` | استراتيجية محتوى غير-المدونة (مصدر الحقيقة التحريري) | LIVE |
| `docs/GSC-CONNECTION-STATUS-2026-09-30.md` | ملاحظة قائمة: اتصال GSC حي ومتحقق | LIVE (ملاحظة) |
| `docs/GSC-RE-AUDIT-2026-11-12.md` | إعادة تدقيق GSC الإلزامية + نافذة فتح التنفيذ (من 2026-11-30 بأمر) | LIVE (نافذة) |
| `docs/LOCAL-PAYMENT-EGP-PRICES-2026-11-05.md` | أسعار القناتين اليدويتين EGP + سعر الصرف (مصدر حقيقة مع الكود) | LIVE (سياسة) |
| `docs/DUAL-CURRENCY-DISPLAY-2026-11-13.md` | قانون العرض الثنائي العملة (مصدر حقيقة مع الكود) | LIVE (سياسة) |
| `docs/FULL-STACK-AUDIT-AND-REMEDIATION-PLAN-2026-10-02.md` | خطة معالجة الفحص الشامل (W2→W3 متبقية بأوامر مالك) | LIVE (تنفيذ جارٍ) |
| `docs/BACKUP-STRATEGY-2026-10-03.md` | استراتيجية النسخ الموحدة | LIVE (تشغيلية) |
| `docs/SUPABASE-FULL-RECOVERY-RUNBOOK.md` | دليل استعادة فقدان Supabase الكامل | LIVE (تشغيلية) |
| `docs/RECOVERY-SECRETS-SOURCES.md` | سجل مصادر كل متغير بيئة إنتاجي | LIVE (تشغيلية) |
| `docs/RECOVERY-MIRROR-SETUP.md` | دليل إعداد المرآة الخارجية (بانتظار المالك) | LIVE (تشغيلية) |
| `docs/EMERGENCY-RECOVERY-AUDIT-2026-09-20.md` | تدقيق الاستعادة الطارئة (مرجع النتائج) | LIVE (تشغيلية) |
| `docs/EMERGENCY-RECOVERY-HARDENING-PLAN-2026-09-20.md` | خطة تحصين الاستعادة (W0–W4 منفذة) | LIVE (تشغيلية) |
| `docs/Alkemos_SEO_Audit_Report.docx` | تقرير الـSEO الخارجي المعتمد (مصدر خطة SEO-GEO) | LIVE (مصدر معتمد) |

## Registry — governing plan/report folders

| Folder | Role | Status |
|---|---|---|
| `docs/repository-comprehensive-audit-2026-11-24/` | التدقيق الشامل الأخير — القائمة الموحدة للأعمال المتبقية (U-1..U-15) | ACTIVE (U-1+U-2 منفذان) |
| `docs/organic-growth-system-2026-11-18/` | منظومة النمو العضوي: الخطة 00-12 + تقارير التنفيذ 13-30 + الحالة | ACTIVE (P2 بأوامر مالك + نوافذ زمنية) |
| `docs/organic-growth-system-2026-11-18/gsc-ar-weekly-monitoring-log.md` | سجل رصد GSC الأسبوعي الموحد (عائلتا AR+EN جنبًا إلى جنب) — يُكتب آليًا من سير العمل `.github/workflows/gsc-ar-weekly-monitor.yml`؛ القراءات من 2026-11-30 | LIVE (أوتوماتيكي — نافذة 2026-11-30) |
| `docs/seo-collapse-investigation-2026-11-18/` | تحقيق انهيار الفهرسة (آلية مؤكدة؛ قرار A1 أولًا) | ACTIVE (بانتظار مالك) |
| `docs/diet-plan-uniqueness-p0a/` | تجربة تفرد خلايا الخطط (P0-A) — بانتظار مراجعة المالك | ACTIVE (بانتظار مالك) |
| `docs/seo-growth-audit-2026-11-18/` | تدقيق وصول Google-Agent (صفر حجب/صفر زيارات) | DELIVERED (مغلق) |
| `docs/seo-indexing-audit-2026-11-11/` | تدقيق الفهرسة: التقارير 13-19 (الإغلاق 18 + القرارات 19) | CLOSED (بنود مالك بـ19) |
| `docs/seo-growth-audit-2026-11-05/` | تدقيق النمو (المحاور 01-07 + سجل التنفيذ 08 المضغوط) | CLOSED (تصحيح الاتجاه ساري) |
| `docs/healthy-recipes-platform/` | منصة الوصفات: التدقيق + الخطة (منفذة P1→P9 — مضغوطتان) | EXECUTED |
| `docs/ai-operational-tests-2026-11-16/` | سجل فجوات التجارب التشغيلية (gap-register حي؛ مخرجات t0-t5 بتاريخ git) | CLOSED (T5 جزئي موثق) |
| `docs/ai/` | تقرير استهلاك Gemini الأسبوعي (تلقائي) | LIVE |
| `docs/investor/` | المرجع التقني للمستثمرين (مرحلة لاحقة) | FUTURE |
| `docs/research/` | مراجع بحثية | LIVE (مرجع) |
| `docs/archive/` | **الأرشيف التاريخي** — كل تقرير آمن منفذ/مغلق + سجل تنفيذ SEO-GEO — الفهرس: `docs/archive/README.md` | ARCHIVE |

## Registry — code-side pointers

| File | Role | Status |
|---|---|---|
| `src/docs/DESIGN_SYSTEM.md` | Pointer إلى DESIGN.md (توحيد المصدر الواحد Ph 292) | LIVE (pointer-only) |
| `src/styles/design-tokens.ts` | سجل التوكنات المطبوع — بلا مستوردين (Ph 292) | LIVE (pointer-only) |

## How to keep this registry true

1. **New LIVE doc lands → new row in the same commit** (name it in the commit body too). Point-in-time reports (audits/plans/execution logs) are **BORN ARCHIVED** — they land directly in `docs/archive/` WITH their index entry in `docs/archive/README.md` (Ph 291 law, compacted 2026-11-25: the index carries the per-report row; this registry stays one-line-per-live-doc).
2. **Point-in-time docs get their status flipped** (here for folders, in the archive index for reports) when their findings land, with the closing phase numbers.
3. **Dates are NOT hand-maintained** (Ph 289): git is the single source — `scripts/docs_audit.py` check M verifies this table bidirectionally on every push (top-level `docs/*.md` all registered · every row path exists) and its report derives each file's last-commit date.
4. A doc that stops being cited anywhere and describes nothing live is FROZEN-to-archive material (§3.8) — move it, don't delete history; when an archived report's bulk outlives its value, distill it to outcome+decisions and let git hold the full text (the 2026-11-25 restructure precedent).
