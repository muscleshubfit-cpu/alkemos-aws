#!/usr/bin/env python3
"""GSC export analysis for Alkemos B2 (demand-filtered Arabization) + B4 (CTR).

Inputs (owner GSC exports, 3-month window, Web search):
  /home/z/my-project/gsc-data/performance/Pages.csv
  /home/z/my-project/gsc-data/performance/Queries.csv
  /home/z/my-project/gsc-data/coverage/*.csv
Foods truth: /home/z/my-project/alkemos-aws/src/lib/foods.ts (8,830 rows)

Outputs (JSON, consumed by the report + B2 batch generation):
  /home/z/my-project/gsc-data/b2-demand-candidates.json  (untranslated foods w/ demand)
  /home/z/my-project/gsc-data/b4-ctr-targets.json        (high-impression low-CTR surfaces)
  /home/z/my-project/gsc-data/summary.json               (headline numbers)
"""
import csv
import json
import re
import sys
from collections import defaultdict

GSC = "/home/z/my-project/gsc-data"
FOODS_TS = "/home/z/my-project/alkemos-aws/src/lib/foods.ts"
AR_RX = re.compile(r"[\u0600-\u06FF]")


def read_csv(path):
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    hdr = rows[0]
    return [dict(zip(hdr, r)) for r in rows[1:] if len(r) == len(hdr)]


def parse_foods():
    """Parse foods.ts rows: slug, nameAr, nameEn (per100g not needed here)."""
    src = open(FOODS_TS, encoding="utf-8").read()
    foods = []
    # Each row starts with { slug: "..." and contains nameAr/nameEn literals.
    row_rx = re.compile(r'\{\s*slug:\s*"([^"]+)",\s*\n\s*nameAr:\s*"((?:[^"\\]|\\.)*)",\s*\n\s*nameEn:\s*"((?:[^"\\]|\\.)*)"')
    for m in row_rx.finditer(src):
        slug, name_ar, name_en = m.group(1), m.group(2), m.group(3)
        foods.append(
            {
                "slug": slug,
                "nameAr": name_ar,
                "nameEn": name_en,
                "translated": bool(AR_RX.search(name_ar)),
            }
        )
    return foods


def main():
    pages = read_csv(f"{GSC}/performance/Pages.csv")
    queries = read_csv(f"{GSC}/performance/Queries.csv")

    foods = parse_foods()
    by_slug = {f["slug"]: f for f in foods}
    n_total = len(foods)
    n_translated = sum(1 for f in foods if f["translated"])

    # ---- B2: untranslated foods with measured EN-side demand ----
    demand = []
    for p in pages:
        url = p["Top pages"]
        m = re.match(r"https://alkemos\.com/foods/([^/?#]+)$", url)
        if not m:
            continue
        slug = m.group(1)
        f = by_slug.get(slug)
        if f is None:
            continue  # URL params etc.
        if f["translated"]:
            continue  # already has Arabic name
        impr = int(p["Impressions"])
        if impr <= 0:
            continue
        demand.append(
            {
                "slug": slug,
                "nameEn": f["nameEn"],
                "impressions": impr,
                "clicks": int(p["Clicks"]),
                "position": float(p["Position"]),
            }
        )
    demand.sort(key=lambda x: -x["impressions"])

    # ---- B4: CTR targets (impressions>=10, position<=25, CTR below expected) ----
    b4 = []
    for p in pages:
        impr = int(p["Impressions"])
        clicks = int(p["Clicks"])
        pos = float(p["Position"])
        if impr < 10 or pos > 25:
            continue
        ctr = (clicks / impr * 100) if impr else 0.0
        # expected CTR by position band (rough industry curve)
        exp = 0.25 if pos <= 5 else (0.10 if pos <= 10 else (0.04 if pos <= 15 else 0.02))
        if ctr >= exp:
            continue
        b4.append(
            {
                "url": p["Top pages"].replace("https://alkemos.com", ""),
                "impressions": impr,
                "clicks": clicks,
                "ctr_pct": round(ctr, 2),
                "position": pos,
                "expected_ctr_pct": exp * 100,
            }
        )
    b4.sort(key=lambda x: -x["impressions"])

    # ---- headline summary ----
    tool_pat = re.compile(r"^https://alkemos\.com/(?:ar/)?tools/")
    tool_pages = [p for p in pages if tool_pat.match(p["Top pages"])]
    tool_impr = sum(int(p["Impressions"]) for p in tool_pages)
    food_en = [p for p in pages if re.match(r"https://alkemos\.com/foods/", p["Top pages"])]
    ar_sections = defaultdict(lambda: [0, 0, 0.0, 0])
    for p in pages:
        m = re.match(r"https://alkemos\.com/ar/([a-z-]+)", p["Top pages"])
        if m:
            a = ar_sections[m.group(1)]
            i = int(p["Impressions"])
            a[0] += int(p["Clicks"])
            a[1] += i
            a[2] += float(p["Position"]) * i if i else 0
            a[3] += 1

    summary = {
        "window": "last 3 months (to 2026-11-11), Web",
        "total_pages_with_impressions": len(pages),
        "total_queries": len(queries),
        "total_clicks": sum(int(p["Clicks"]) for p in pages),
        "total_impressions": sum(int(p["Impressions"]) for p in pages),
        "tools_impressions": tool_impr,
        "foods_en_pages": len(food_en),
        "foods_en_impressions": sum(int(p["Impressions"]) for p in food_en),
        "foods_translated": n_translated,
        "foods_total": n_total,
        "foods_untranslated": n_total - n_translated,
        "b2_demand_candidates": len(demand),
        "b2_demand_impressions": sum(d["impressions"] for d in demand),
        "ar_sections": {
            k: {"clicks": v[0], "impressions": v[1], "avg_pos": round(v[2] / v[1], 1) if v[1] else None, "pages": v[3]}
            for k, v in sorted(ar_sections.items(), key=lambda kv: -kv[1][1])
        },
    }

    with open(f"{GSC}/b2-demand-candidates.json", "w", encoding="utf-8") as f:
        json.dump(demand, f, ensure_ascii=False, indent=2)
    with open(f"{GSC}/b4-ctr-targets.json", "w", encoding="utf-8") as f:
        json.dump(b4, f, ensure_ascii=False, indent=2)
    with open(f"{GSC}/summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("\n=== B2 top demand candidates (untranslated) ===")
    for d in demand[:40]:
        print(f"  {d['impressions']:>4} impr pos {d['position']:>5} | {d['slug']}")
    print("\n=== B4 CTR targets ===")
    for b in b4[:25]:
        print(f"  {b['impressions']:>4} impr pos {b['position']:>5} ctr {b['ctr_pct']:>5}% | {b['url']}")


if __name__ == "__main__":
    sys.exit(main())
