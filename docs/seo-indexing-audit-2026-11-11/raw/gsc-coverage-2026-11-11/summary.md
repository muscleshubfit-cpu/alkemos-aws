# ملخص تحليل تصدير Coverage — بيانات حتى 2026-11-06

## الموجات ونقاط التحول
- **property_start:** {"date": "2026-09-04", "indexed": 0, "not_indexed": 2, "impressions": 0}
- **baseline_sep5:** {"date": "2026-09-05", "not_indexed": 2099, "indexed": 720, "impressions": 1, "total_known": 2819, "d_indexed": 720, "d_not_indexed": 2097, "d_total": 2817, "d_impressions": 1}
- **mass_index_event_sep22:** {"date": "2026-09-22", "not_indexed": 1860, "indexed": 1462, "impressions": 175, "total_known": 3322, "d_indexed": 670, "d_not_indexed": -228, "d_total": 442, "d_impressions": 85, "note": "قفزة مفهرس +670 في يوم واحد (792->1462) مقابل تراجع غير-مفهرس 228 وقصر المجموع المعروف بـ558"}
- **peak:** {"date": "2026-09-22", "indexed": 1462}
- **visibility_collapse:** {"impressions_oct1": 641, "impressions_oct3": 459, "impressions_oct4": 49, "impressions_oct8": 1, "impressions_oct9": 0}
- **wave1_oct5:** {"date": "2026-10-05", "not_indexed": 2292, "indexed": 1042, "impressions": 14, "total_known": 3334, "d_indexed": -420, "d_not_indexed": 432, "d_total": 12, "d_impressions": -35, "note": "أكبر موجة إخراج مفردة: -420 مفهرس / +432 غير مفهرس — قبل الانتقال إلى AWS بخمسة أيام"}
- **aws_migration_oct10:** {"date": "2026-10-10", "not_indexed": 2296, "indexed": 1039, "impressions": 0, "total_known": 3335, "d_indexed": -3, "d_not_indexed": 4, "d_total": 1, "d_impressions": 0, "note": "يوم القطع إلى AWS: -3 مفهرس فقط — لا أي انقطاع أو جرف في المنحنى"}
- **slow_bleed_oct10_23:** {"indexed_oct10": 1039, "indexed_oct23": 1020, "loss": 19, "note": "نزيف بطيء -22 صفحة عبر 14 يومًا بعد الانتقال (خطوات صغيرة -3/-4/-7/-8)"}
- **wave2_oct24:** {"date": "2026-10-24", "not_indexed": 2519, "indexed": 886, "impressions": 4, "total_known": 3405, "d_indexed": -134, "d_not_indexed": 195, "d_total": 61, "d_impressions": 4, "note": "الموجة الثانية: -134 مفهرس / +195 غير مفهرس — بعد الانتقال بـ14 يومًا"}
- **freeze_since_oct24:** {"days": 14, "indexed": 886, "not_indexed": 2519, "impressions_total": 29, "note": "تجمّد كامل للعددين معًا منذ 24-10 حتى آخر بيانات (06-11) مع ظهور شبه معدوم"}
- **totals:** {"last_date": "2026-11-06", "indexed": 886, "not_indexed": 2519, "total_known": 3405, "peak_to_last_loss": 576, "peak_to_last_pct": 39.4}

## فترات الثبات (plateaus)
- 2026-09-04 -> 2026-09-04 (1 يومًا): مفهرس=0 غير-مفهرس=2
- 2026-09-05 -> 2026-09-14 (10 يومًا): مفهرس=720 غير-مفهرس=2099
- 2026-09-15 -> 2026-09-18 (4 يومًا): مفهرس=780 غير-مفهرس=2081
- 2026-09-19 -> 2026-09-21 (3 يومًا): مفهرس=792 غير-مفهرس=2088
- 2026-09-22 -> 2026-10-04 (13 يومًا): مفهرس=1462 غير-مفهرس=1860
- 2026-10-05 -> 2026-10-09 (5 يومًا): مفهرس=1042 غير-مفهرس=2292
- 2026-10-10 -> 2026-10-12 (3 يومًا): مفهرس=1039 غير-مفهرس=2296
- 2026-10-13 -> 2026-10-16 (4 يومًا): مفهرس=1035 غير-مفهرس=2300
- 2026-10-17 -> 2026-10-19 (3 يومًا): مفهرس=1028 غير-مفهرس=2308
- 2026-10-20 -> 2026-10-23 (4 يومًا): مفهرس=1020 غير-مفهرس=2324
- 2026-10-24 -> 2026-11-06 (14 يومًا): مفهرس=886 غير-مفهرس=2519

## مصالحة تصدير 10-12 مع 06-11
- CNI: 1068 -> 1271 (فرق 203)
- DNI: 881 -> 879 (فرق -2)
- noindex: 135 -> 157 (فرق 22)
- alt_canonical: 203 -> 203 (فرق 0)
- robots: 1 -> 1 (فرق 0)
- 404: 4 -> 4 (فرق 0)
- redirect: 4 -> 4 (فرق 0)
- TOTAL_not_indexed: 2296 -> 2519 (فرق 223)
- chart_oct12_not_indexed: 2296 -> 2519 (فرق 223)

## مقارنات النطاق
- gsc_known_1106: 3405
- gsc_indexed_1106: 886
- sitemap_declared: 2359
- site_unique_pages: 4666
- site_indexable_unique: 4143
- site_intentional_noindex: 523
- pct_of_sitemap_indexed_max: 37.6
- pct_of_indexable_indexed: 21.4
- undiscovered_unique_min: 1261
- cni_plus_dni: 2150
- technical_exclusions_total: 369
- pct_google_system_vs_technical: {"google_systems_pct": 85.4, "technical_pct": 14.6}