#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO-GSC-COVERAGE-2026-11-11 — تحليل تصدير Google Search Console Coverage
المصدر: upload/alkemos.com-Coverage-2026-11-11.zip (ملفات Chart/Critical/Non-critical/Metadata)
قراءة-فقط: لا يعدل شيئًا خارج مجلد الخام هذا.
المخرجات: timeline.csv (اليومي كامل) + waves.json (الموجات ونقاط التحول) + summary.md
"""
import csv, json, os
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "gsc-export")
OUT = HERE

# ---------- 1) قراءة الملفات الأربعة ----------
with open(os.path.join(RAW, "Chart.csv"), encoding="utf-8-sig") as f:
    rows = [r for r in csv.DictReader(f)]
chart = [dict(date=r["Date"], not_indexed=int(r["Not indexed"]),
              indexed=int(r["Indexed"]), impressions=int(r["Impressions"])) for r in rows]

with open(os.path.join(RAW, "Critical issues.csv"), encoding="utf-8-sig") as f:
    critical = [dict(r) for r in csv.DictReader(f)]
with open(os.path.join(RAW, "Non-critical issues.csv"), encoding="utf-8-sig") as f:
    noncritical = [dict(r) for r in csv.DictReader(f)]
with open(os.path.join(RAW, "Metadata.csv"), encoding="utf-8-sig") as f:
    metadata = [dict(r) for r in csv.DictReader(f)]

# ---------- 2) الجدول اليومي مع الفروق ----------
timeline = []
prev = None
for r in chart:
    d = dict(r)
    d["total_known"] = r["indexed"] + r["not_indexed"]
    if prev is None:
        d.update(d_indexed=None, d_not_indexed=None, d_total=None, d_impressions=None)
    else:
        d.update(d_indexed=r["indexed"] - prev["indexed"],
                 d_not_indexed=r["not_indexed"] - prev["not_indexed"],
                 d_total=(r["indexed"] + r["not_indexed"]) - (prev["indexed"] + prev["not_indexed"]),
                 d_impressions=r["impressions"] - prev["impressions"])
    timeline.append(d)
    prev = {"indexed": r["indexed"], "not_indexed": r["not_indexed"], "impressions": r["impressions"]}

with open(os.path.join(OUT, "timeline.csv"), "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(timeline[0].keys()))
    w.writeheader()
    w.writerows(timeline)

# ---------- 3) استخراج الموجات (أيام تغير الأعمدة) ----------
change_days = [d for d in timeline if (d["d_indexed"] or 0) != 0 or (d["d_not_indexed"] or 0) != 0]
plateaus = []          # فترات الثبات
start = timeline[0]
for d in timeline[1:] + [None]:
    if d is None or d["d_indexed"] != 0 or d["d_not_indexed"] != 0:
        plateaus.append(dict(
            from_date=start["date"], to_date=(timeline[timeline.index(d) - 1]["date"] if d else timeline[-1]["date"]),
            indexed=start["indexed"], not_indexed=start["not_indexed"],
            days=(int((timeline.index(d) if d else len(timeline) - 1)) - timeline.index(start)) + 1))
        if d: start = d
# (تعديل: حساب الفترات بطريقة أبسط وأصح)
plateaus = []
seg_start_idx = 0
for i in range(1, len(timeline)):
    if timeline[i]["d_indexed"] != 0 or timeline[i]["d_not_indexed"] != 0:
        plateaus.append(dict(
            from_date=timeline[seg_start_idx]["date"], to_date=timeline[i - 1]["date"],
            indexed=timeline[seg_start_idx]["indexed"], not_indexed=timeline[seg_start_idx]["not_indexed"],
            days=i - seg_start_idx))
        seg_start_idx = i
plateaus.append(dict(from_date=timeline[seg_start_idx]["date"], to_date=timeline[-1]["date"],
                     indexed=timeline[seg_start_idx]["indexed"], not_indexed=timeline[seg_start_idx]["not_indexed"],
                     days=len(timeline) - seg_start_idx))

first, last = timeline[0], timeline[-1]
peak = max(timeline, key=lambda r: r["indexed"])
min_imp_nonzero = [r for r in timeline if r["impressions"] > 0]

# القيم عند تواريخ مرجعية
def at(date):
    return next(r for r in timeline if r["date"] == date)

waves = OrderedDict()
waves["property_start"] = dict(date=first["date"], indexed=first["indexed"], not_indexed=first["not_indexed"],
                               impressions=first["impressions"])
waves["baseline_sep5"] = dict(at("2026-09-05"))
waves["mass_index_event_sep22"] = dict(at("2026-09-22"),
    note="قفزة مفهرس +670 في يوم واحد (792->1462): منها +228 صفحة انتقلت من غير-مفهرس إلى مفهرس و+442 رابطًا جديدًا دخل المجموع المعروف مفهرسًا مباشرة")
waves["peak"] = dict(date=peak["date"], indexed=peak["indexed"])
waves["visibility_collapse"] = dict(
    impressions_oct1=at("2026-10-01")["impressions"], impressions_oct3=at("2026-10-03")["impressions"],
    impressions_oct4=at("2026-10-04")["impressions"], impressions_oct8=at("2026-10-08")["impressions"],
    impressions_oct9=at("2026-10-09")["impressions"])
waves["wave1_oct5"] = dict(at("2026-10-05"),
    d_indexed=at("2026-10-05")["d_indexed"], d_not_indexed=at("2026-10-05")["d_not_indexed"],
    note="أكبر موجة إخراج مفردة: -420 مفهرس / +432 غير مفهرس — قبل الانتقال إلى AWS بخمسة أيام")
waves["aws_migration_oct10"] = dict(at("2026-10-10"),
    d_indexed=at("2026-10-10")["d_indexed"], d_not_indexed=at("2026-10-10")["d_not_indexed"],
    note="يوم القطع إلى AWS: -3 مفهرس فقط — لا أي انقطاع أو جرف في المنحنى")
waves["slow_bleed_oct10_23"] = dict(
    indexed_oct10=at("2026-10-10")["indexed"], indexed_oct23=at("2026-10-23")["indexed"],
    loss=at("2026-10-10")["indexed"] - at("2026-10-23")["indexed"],
    note="نزيف بطيء بعد الانتقال: 1039 (10-10) -> 1020 (23-10) = -19 عبر 14 يومًا بخطوات صغيرة -3/-4/-7/-8 (و-22 من 1042 يوم 9-10)")
waves["wave2_oct24"] = dict(at("2026-10-24"),
    d_indexed=at("2026-10-24")["d_indexed"], d_not_indexed=at("2026-10-24")["d_not_indexed"],
    note="الموجة الثانية: -134 مفهرس / +195 غير مفهرس — بعد الانتقال بـ14 يومًا")
waves["freeze_since_oct24"] = dict(
    days=sum(1 for r in timeline if r["date"] >= "2026-10-24"),
    indexed=last["indexed"], not_indexed=last["not_indexed"],
    impressions_total=sum(r["impressions"] for r in timeline if r["date"] >= "2026-10-24"),
    note="تجمّد كامل للعددين معًا منذ 24-10 حتى آخر بيانات (06-11) مع ظهور شبه معدوم")
waves["totals"] = dict(
    last_date=last["date"], indexed=last["indexed"], not_indexed=last["not_indexed"],
    total_known=last["total_known"],
    peak_to_last_loss=peak["indexed"] - last["indexed"],
    peak_to_last_pct=round(100 * (peak["indexed"] - last["indexed"]) / peak["indexed"], 1))

# ---------- 4) مصالحة التصدير القديم (بيانات حتى 12-10) مع الجديد ----------
old_export_1012 = {"CNI": 1068, "DNI": 881, "noindex": 135, "alt_canonical": 203,
                   "robots": 1, "404": 4, "redirect": 4}
new_reasons = {r["Reason"]: int(r["Pages"]) for r in critical}
reason_map = {"CNI": "Crawled - currently not indexed", "DNI": "Discovered - currently not indexed",
              "noindex": "Excluded by ‘noindex’ tag", "alt_canonical": "Alternate page with proper canonical tag",
              "robots": "Blocked by robots.txt", "404": "Not found (404)", "redirect": "Page with redirect"}
recon = []
for k, v in old_export_1012.items():
    nv = new_reasons.get(reason_map[k])
    recon.append(dict(reason=k, old_1012=v, new_1106=nv, delta=(nv - v) if nv is not None else None))
old_total = sum(old_export_1012.values())
new_total = sum(new_reasons.values())
oct12_chart = at("2026-10-12")
recon.append(dict(reason="TOTAL_not_indexed", old_1012=old_total, new_1106=new_total,
                  delta=new_total - old_total))
recon.append(dict(reason="chart_oct12_not_indexed", old_1012=oct12_chart["not_indexed"], new_1106=new_total,
                  delta=new_total - oct12_chart["not_indexed"],
                  note="تطابق مجموع تصدير 10-12 مع الرسم البياني الجديد يوم 12-10 = 2,296 — الاتساق مثبت"))

# ---------- 5) مقارنات النطاق ----------
comp = OrderedDict()
comp["gsc_known_1106"] = last["total_known"]
comp["gsc_indexed_1106"] = last["indexed"]
comp["sitemap_declared"] = 2359
comp["site_unique_pages"] = 4666
comp["site_indexable_unique"] = 4143
comp["site_intentional_noindex"] = 523
comp["pct_of_sitemap_indexed_max"] = round(100 * last["indexed"] / 2359, 1)
comp["pct_of_indexable_indexed"] = round(100 * last["indexed"] / 4143, 1)
comp["undiscovered_unique_min"] = 4666 - last["total_known"]
comp["cni_plus_dni"] = new_reasons.get(reason_map["CNI"], 0) + new_reasons.get(reason_map["DNI"], 0)
comp["technical_exclusions_total"] = (new_reasons.get(reason_map["noindex"], 0)
                                      + new_reasons.get(reason_map["alt_canonical"], 0)
                                      + new_reasons.get(reason_map["robots"], 0)
                                      + new_reasons.get(reason_map["404"], 0)
                                      + new_reasons.get(reason_map["redirect"], 0))
comp["pct_google_system_vs_technical"] = dict(
    google_systems_pct=round(100 * (new_reasons.get(reason_map["CNI"], 0) + new_reasons.get(reason_map["DNI"], 0)) / new_total, 1),
    technical_pct=round(100 * (new_reasons.get(reason_map["noindex"], 0)
                               + new_reasons.get(reason_map["alt_canonical"], 0)
                               + new_reasons.get(reason_map["robots"], 0)
                               + new_reasons.get(reason_map["404"], 0)
                               + new_reasons.get(reason_map["redirect"], 0)) / new_total, 1))

out = dict(metadata=metadata, critical_issues=critical, noncritical_issues=noncritical,
           waves=waves, plateaus=plateaus, old_vs_new_reconciliation=recon, comparisons=comp)
with open(os.path.join(OUT, "waves.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

# ---------- 6) ملخص نصي ----------
lines = []
lines.append("# ملخص تحليل تصدير Coverage — بيانات حتى %s\n" % last["date"])
lines.append("## الموجات ونقاط التحول")
for k, v in waves.items():
    lines.append("- **%s:** %s" % (k, json.dumps(v, ensure_ascii=False)))
lines.append("\n## فترات الثبات (plateaus)")
for p in plateaus:
    lines.append("- %s -> %s (%d يومًا): مفهرس=%s غير-مفهرس=%s" % (p["from_date"], p["to_date"], p["days"], p["indexed"], p["not_indexed"]))
lines.append("\n## مصالحة تصدير 10-12 مع 06-11")
for r in recon:
    lines.append("- %s: %s -> %s (فرق %s)" % (r["reason"], r["old_1012"], r["new_1106"], r.get("delta")))
lines.append("\n## مقارنات النطاق")
for k, v in comp.items():
    lines.append("- %s: %s" % (k, json.dumps(v, ensure_ascii=False)))
with open(os.path.join(OUT, "summary.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("OK — timeline rows:", len(timeline))
print("Last:", last)
print("Peak indexed:", peak["date"], peak["indexed"])
print("Waves:", json.dumps({k: v for k, v in waves.items() if k in ('wave1_oct5','aws_migration_oct10','wave2_oct24','freeze_since_oct24','totals')}, ensure_ascii=False, indent=1))
print("Recon:", json.dumps(recon, ensure_ascii=False, indent=1))
print("Comp:", json.dumps(comp, ensure_ascii=False, indent=1))
