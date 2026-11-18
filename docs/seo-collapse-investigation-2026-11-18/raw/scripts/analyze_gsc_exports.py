#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""GSC collapse analysis — Alkemos 2026-11-18.
Reads the two GSC exports (Coverage + Performance) and produces:
  - timeline of indexed/not-indexed/impressions with wave detection
  - deltas 7/14/28 days vs baseline windows
  - page-group breakdown (EN/AR x section) from Pages.csv
  - exclusion-category comparison vs 2026-11-11 baseline (from prior audit)
Outputs JSON to /home/z/my-project/gsc-data/analysis.json
"""
import csv, json, datetime as dt
from collections import defaultdict

BASE = "/home/z/my-project/gsc-data"
OUT = f"{BASE}/analysis.json"

# ---------- 1. Coverage timeline ----------
rows = []
with open(f"{BASE}/coverage/Chart.csv", newline="", encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        rows.append({
            "date": r["Date"],
            "not_indexed": int(r["Not indexed"]),
            "indexed": int(r["Indexed"]),
            "impressions": int(r["Impressions"]),
        })

rows.sort(key=lambda x: x["date"])

# wave detection: day-over-day indexed change
waves = []
for prev, cur in zip(rows, rows[1:]):
    d = cur["indexed"] - prev["indexed"]
    if abs(d) >= 30:
        waves.append({"date": cur["date"], "from": prev["indexed"], "to": cur["indexed"], "delta": d,
                      "not_indexed_from": prev["not_indexed"], "not_indexed_to": cur["not_indexed"]})

# freeze detection (indexed constant >= 5 consecutive days ending at last)
last_val = rows[-1]["indexed"]
freeze_len = 0
for r in reversed(rows):
    if r["indexed"] == last_val:
        freeze_len += 1
    else:
        break

# impressions sums per phase
phases = {
    "pre_collapse_peak (09-22..10-04)": ("2026-09-22", "2026-10-04"),
    "post_w1 (10-05..10-23)": ("2026-10-05", "2026-10-23"),
    "post_w2_frozen (10-24..11-06)": ("2026-10-24", "2026-11-06"),
    "post_w3 (11-07..11-09)": ("2026-11-07", "2026-11-09"),
    "latest_7d (11-07..11-13)": ("2026-11-07", "2026-11-13"),
    "latest_14d (10-31..11-13)": ("2026-10-31", "2026-11-13"),
    "latest_28d (10-17..11-13)": ("2026-10-17", "2026-11-13"),
}
phase_stats = {}
for name, (a, b) in phases.items():
    sub = [r for r in rows if a <= r["date"] <= b]
    phase_stats[name] = {
        "days": len(sub),
        "impressions_sum": sum(r["impressions"] for r in sub),
        "impressions_max_day": max((r["impressions"] for r in sub), default=0),
        "indexed_start": sub[0]["indexed"] if sub else None,
        "indexed_end": sub[-1]["indexed"] if sub else None,
    }

# last date with >= 50 impressions
last50 = max((r["date"] for r in rows if r["impressions"] >= 50), default=None)
last10 = max((r["date"] for r in rows if r["impressions"] >= 10), default=None)

coverage = {
    "series": rows,
    "waves_detected": waves,
    "first_date": rows[0]["date"],
    "last_date": rows[-1]["date"],
    "peak_indexed": max(r["indexed"] for r in rows),
    "peak_indexed_date": max(rows, key=lambda r: r["indexed"])["date"],
    "current_indexed": rows[-1]["indexed"],
    "current_not_indexed": rows[-1]["not_indexed"],
    "current_total_known": rows[-1]["indexed"] + rows[-1]["not_indexed"],
    "current_freeze_days": freeze_len,
    "last_date_impressions_ge_50": last50,
    "last_date_impressions_ge_10": last10,
    "phase_stats": phase_stats,
}

# ---------- 2. Exclusion categories vs prior audit baseline ----------
current_exclusions = {}
with open(f"{BASE}/coverage/Critical issues.csv", newline="", encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        current_exclusions[r["Reason"]] = {
            "pages": int(r["Pages"]), "source": r["Source"], "validation": r["Validation"]}

# baseline from prior audit (GSC export 2026-11-11, data through 06-11 + G-1 update through 11-11)
prior = {
    "Crawled - currently not indexed": 1271,
    "Discovered - currently not indexed": 879,
    "indexed_total": 886,
    "not_indexed_total": 2519,
    "as_of": "2026-11-11 (data through 06-11/11-11)",
}
excl_compare = {}
for reason, v in current_exclusions.items():
    excl_compare[reason] = {
        "now": v["pages"],
        "prior": prior.get(reason),
        "delta": (v["pages"] - prior[reason]) if reason in prior else None,
        "validation": v["validation"],
    }

# ---------- 3. Performance chart ----------
perf = []
with open(f"{BASE}/performance/Chart.csv", newline="", encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        perf.append({
            "date": r["Date"],
            "clicks": int(r["Clicks"]),
            "impressions": int(r["Impressions"]),
            "ctr": r["CTR"],
            "position": r["Position"] or None,
        })
perf.sort(key=lambda x: x["date"])

perf_phases = {}
for name, (a, b) in phases.items():
    sub = [r for r in perf if a <= r["date"] <= b]
    pos_vals = [float(r["position"]) for r in sub if r["position"]]
    perf_phases[name] = {
        "clicks": sum(r["clicks"] for r in sub),
        "impressions": sum(r["impressions"] for r in sub),
        "avg_position": round(sum(pos_vals)/len(pos_vals), 2) if pos_vals else None,
    }

performance = {
    "series": perf,
    "first_date": perf[0]["date"],
    "last_date": perf[-1]["date"],
    "phase_stats": perf_phases,
    "total_clicks": sum(r["clicks"] for r in perf),
    "total_impressions": sum(r["impressions"] for r in perf),
}

# ---------- 4. Pages breakdown by group ----------
def classify(url):
    u = url.replace("https://alkemos.com/", "").replace("https://alkemos.com", "")
    u = u.rstrip("/")
    ar = u.startswith("ar/") or u == "ar"
    if ar:
        u = u[3:] if u.startswith("ar/") else ""
    seg = u.split("/")[0] if u else "homepage"
    if seg == "" or url.rstrip("/") == "https://alkemos.com" or url.rstrip("/") == "https://alkemos.com/ar":
        group = "homepage"
    elif seg == "tools":
        group = "tools"
    elif seg == "foods":
        group = "foods"
    elif seg == "exercises":
        group = "exercises"
    elif seg == "blog":
        group = "blog"
    elif seg == "muscles":
        group = "muscles"
    elif seg in ("evo", "ai-workout-planner", "meal-planner", "checkout", "pricing", "subscription",
                 "coaching", "trainers", "plans", "services"):
        group = "commercial"
    else:
        group = f"other:{seg}"
    return ("ar" if ar else "en"), group

pages = []
with open(f"{BASE}/performance/Pages.csv", newline="", encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        url = r["Top pages"]
        lang, group = classify(url)
        pos = float(r["Position"]) if r["Position"] else None
        pages.append({
            "url": url, "lang": lang, "group": group,
            "clicks": int(r["Clicks"]), "impressions": int(r["Impressions"]),
            "position": pos,
        })

agg = defaultdict(lambda: {"pages": 0, "clicks": 0, "impressions": 0, "pos_weighted": 0.0})
for p in pages:
    k = (p["lang"], p["group"])
    agg[k]["pages"] += 1
    agg[k]["clicks"] += p["clicks"]
    agg[k]["impressions"] += p["impressions"]
    if p["position"] is not None:
        agg[k]["pos_weighted"] += p["position"] * p["impressions"]

pages_breakdown = {}
for (lang, group), v in sorted(agg.items(), key=lambda kv: -kv[1]["impressions"]):
    pages_breakdown[f"{lang}/{group}"] = {
        "pages_with_impressions": v["pages"],
        "clicks": v["clicks"],
        "impressions": v["impressions"],
        "avg_position_weighted": round(v["pos_weighted"]/v["impressions"], 2) if v["impressions"] else None,
    }

# position distribution
pos_buckets = defaultdict(int)
for p in pages:
    if p["impressions"] > 0 and p["position"] is not None:
        b = int(p["position"] // 10) * 10
        pos_buckets[f"{b}-{b+9}"] += 1

# ---------- 5. Queries ----------
queries = []
with open(f"{BASE}/performance/Queries.csv", newline="", encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        q = r["Top queries"]
        pos = float(r["Position"]) if r["Position"] else None
        # Arabic detection
        is_ar = any('\u0600' <= ch <= '\u06FF' for ch in q)
        queries.append({"query": q, "is_arabic": is_ar, "clicks": int(r["Clicks"]),
                        "impressions": int(r["Impressions"]), "position": pos})

q_ar = [q for q in queries if q["is_arabic"]]
q_en = [q for q in queries if not q["is_arabic"]]
def qsum(qs):
    imp = sum(q["impressions"] for q in qs)
    wpos = sum((q["position"] or 0)*q["impressions"] for q in qs)
    return {"count": len(qs), "impressions": imp, "clicks": sum(q["clicks"] for q in qs),
            "avg_position_weighted": round(wpos/imp, 2) if imp else None}
queries_summary = {"arabic": qsum(q_ar), "english": qsum(q_en)}

# brand vs non-brand
brand = [q for q in queries if "alkemos" in q["query"].lower()]
nonbrand = [q for q in queries if "alkemos" not in q["query"].lower()]
queries_summary["brand"] = qsum(brand)
queries_summary["non_brand"] = qsum(nonbrand)

# ---------- output ----------
result = {
    "coverage": coverage,
    "exclusions_now": current_exclusions,
    "exclusions_compare_vs_2026-11-11": excl_compare,
    "prior_baseline": prior,
    "performance": performance,
    "pages_breakdown": pages_breakdown,
    "pages_position_distribution": dict(sorted(pos_buckets.items())),
    "queries_summary": queries_summary,
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=1)

# ---------- console summary ----------
print("=== COVERAGE TIMELINE ===")
print(f"range: {coverage['first_date']} .. {coverage['last_date']}  peak={coverage['peak_indexed']}@{coverage['peak_indexed_date']}  now={coverage['current_indexed']} (freeze {freeze_len}d)")
print(f"total known now: {coverage['current_total_known']} (not indexed {coverage['current_not_indexed']})")
print("waves:", json.dumps(waves, ensure_ascii=False))
print(f"last date impressions>=50: {last50} | >=10: {last10}")
print()
print("=== EXCLUSIONS NOW vs 11-11 ===")
for k, v in excl_compare.items():
    print(f"  {k}: now={v['now']} prior={v['prior']} delta={v['delta']} [{v['validation']}]")
print()
print("=== PERF PHASES ===")
for k, v in perf_phases.items():
    print(f"  {k}: impr={v['impressions']} clicks={v['clicks']} avgpos={v['avg_position']}")
print()
print("=== PAGES BREAKDOWN (top 15 by impressions) ===")
for k, v in list(pages_breakdown.items())[:15]:
    print(f"  {k}: pages={v['pages_with_impressions']} impr={v['impressions']} clicks={v['clicks']} wpos={v['avg_position_weighted']}")
print()
print("=== POSITION DISTRIBUTION (pages) ===")
print(dict(sorted(pos_buckets.items())))
print()
print("=== QUERIES ===")
print("arabic:", queries_summary["arabic"])
print("english:", queries_summary["english"])
print("brand:", queries_summary["brand"])
print("non-brand:", queries_summary["non_brand"])
print(f"\nsaved -> {OUT}")
