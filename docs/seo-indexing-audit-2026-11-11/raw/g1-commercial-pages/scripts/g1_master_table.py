#!/usr/bin/env python3
"""G-1 master table: per-URL classification with all evidence columns."""
import csv, json, re, subprocess
from collections import Counter, defaultdict

BASE = "https://alkemos.com"

# ---- data sources ----
cni = {}
with open("/home/z/my-project/gsc-analysis/g1/Table.csv", newline="", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        cni[row["URL"].strip()] = row.get("Last crawled", "").strip()

live = {r["path"]: r for r in json.load(open("/home/z/my-project/gsc-analysis/g1/live-pages.json", encoding="utf-8"))}

inl = {}
out = subprocess.run(["zcat", "/home/z/my-project/alkemos-aws/docs/seo-indexing-audit-2026-11-11/raw/analysis/all-pages-metrics.csv.gz"],
                     capture_output=True, text=True).stdout
if out.startswith("\ufeff"):
    out = out[1:]
for row in csv.DictReader(out.splitlines()):
    try:
        inl[row["url"].strip()] = int(row["inlinks_dofollow"] or 0)
    except Exception:
        pass

smap = [u[len(BASE):] or "/" for u in re.findall(r"<loc>([^<]+)</loc>",
         open("/home/z/my-project/alkemos-aws/docs/seo-indexing-audit-2026-11-11/raw/sitemaps/sitemap-pages.xml", encoding="utf-8").read())]

# pre-collapse impressions evidence (PRIORITY-PAGES-CONTENT-AUDIT-2026-10-19 §3.2 + §3.2 note)
pre_collapse = {
    "/tools/calorie-calculator": "1,665 ظهورًا @ 84.06",
    "/tools/body-fat-calculator": "827 @ 84.95",
    "/tools/bmi-calculator": "188 @ 78.11",
    "/tools/macro-calculator": "68 @ 20.16",
    "/meal-planner": "32 @ 72.38",
    "/tools": "27 @ 78.96",
    "/evo": "26 @ 4.65",
    "/diet-plan/2000/high-protein": "17 @ 52.59",
    "/ar/tools/calorie-calculator": "16 @ 32.69",
    "/ai-workout-planner": "14 @ 13.93",
    "/foods": "56 @ 46.43 (سياق)",
}
# post-collapse visibility (persistence verdict wk1-wk4 core + home brand)
post_collapse_indexed = {
    "/": "ظهور علامة موثق بعد الانهيار (الرئيسية 5–11 ظهورًا/أسبوع wk1–wk4 — التحقيق الخامس)",
}
surviving_core = ["ar/exercises/cable-wrist-curl", "ar/exercises/leg-lift", "ar/foods/green-tea",
                  "exercises/cross-body-crunch", "exercises/iliopibial-tract-smr",
                  "exercises/on-your-side-quad-stretch", "foods/crackers-cream-gamesa-sabrosas",
                  "foods/spices-pepper-red-or-cayenne", "foods/worthington-choplets-canned-unprepared"]

def family(path):
    core = path[3:] if path.startswith("/ar/") else path
    if core in ("/", "") or path == "/ar":
        return "الرئيسيتان"
    if core.startswith("/tools"):
        return "الأدوات"
    if core in ("/ai-meal-planner", "/ai-workout-planner", "/meal-planner", "/macro-tracker", "/workout-tracker"):
        return "المخططات والتتبعات"
    if core in ("/coaching", "/memberships", "/evo", "/for-coaches", "/for-coaches/register"):
        return "الخدمات المدفوعة"
    if core.startswith("/programs"):
        return "البرامج"
    if core.startswith("/diet-plan"):
        return "مصفوفة الخطط"
    if core.startswith("/recipes"):
        return "بوابات الوصفات"
    if core.startswith("/blog"):
        return "بوابات المدونة"
    if core.startswith("/foods"):
        return "مركز الأطعمة"
    if core.startswith("/exercises"):
        return "مركز التمارين"
    if core == "/compare":
        return "المقارنات"
    return "صفحات معلوماتية"

def is_commercial(path):
    return family(path) in ("الأدوات", "المخططات والتتبعات", "الخدمات المدفوعة", "البرامج", "مصفوفة الخطط", "المقارنات")

sentinel_extras = ["/blog/how-to-periodize-nutrition-body-recomposition", "/recipes/ful-medames-with-eggs"]
all_paths = smap + sentinel_extras

rows = []
for p in all_paths:
    url = BASE + ("" if p == "/" else p)
    fam = family(p)
    lv = live.get(p, {})
    in_cni = url in cni
    if in_cni:
        cls = "CNI مؤكدة (عينة 06-11)"
    elif p in post_collapse_indexed:
        cls = "مفهرسة (ظهور موثق)"
    elif p.lstrip("/") in surviving_core:
        cls = "مفهرسة (نواة ناجية)"
    else:
        cls = "غير متحقق منها"
    rows.append({
        "path": p, "family": fam, "commercial": is_commercial(p) or p in sentinel_extras,
        "classification": cls,
        "cni_last_crawled": cni.get(url, ""),
        "pre_collapse": pre_collapse.get(p, ""),
        "status": lv.get("status"), "canonical_self": lv.get("canonical", "").rstrip("/") == url.rstrip("/"),
        "meta_robots": lv.get("meta_robots", ""), "words": lv.get("words", 0),
        "inlinks": inl.get(url), "ttfb": lv.get("ttfb_ms"),
        "in_sitemap": p in smap,
    })

json.dump(rows, open("/home/z/my-project/gsc-analysis/g1/master-table.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

# ---- report numbers ----
print("=== FINAL NUMBERS ===")
sm_rows = [r for r in rows if r["in_sitemap"]]
print(f"sitemap-pages URLs: {len(sm_rows)}")
print(f"  in current CNI sample: {sum(1 for r in sm_rows if r['classification'].startswith('CNI'))}")
print(f"  indexed (documented): {sum(1 for r in sm_rows if r['classification'].startswith('مفهرسة'))}")
print(f"  unverified: {sum(1 for r in sm_rows if r['classification'] == 'غير متحقق منها')}")
com = [r for r in sm_rows if r["commercial"]]
print(f"commercial URLs (sitemap-pages): {len(com)}")
print(f"  in CNI: {sum(1 for r in com if r['classification'].startswith('CNI'))}")
print(f"  unverified: {sum(1 for r in com if r['classification'] == 'غير متحقق منها')}")
print(f"  live 200: {sum(1 for r in com if r['status'] == 200)} | self-canonical: {sum(1 for r in com if r['canonical_self'])}")
print(f"  index,follow: {sum(1 for r in com if r['meta_robots'] in ('index, follow','index,follow'))}")
print(f"  words>=300: {sum(1 for r in com if r['words'] >= 300)} | min words: {min(r['words'] for r in com)}")
print(f"  inlinks>=2: {sum(1 for r in com if r['inlinks'] and r['inlinks'] >= 2)} | min inlinks: {min(r['inlinks'] for r in com)}")

print("\n=== per-family (commercial) ===")
fam_rows = defaultdict(list)
for r in com:
    fam_rows[r["family"]].append(r)
for fam, g in sorted(fam_rows.items(), key=lambda kv: -len(kv[1])):
    n_cni = sum(1 for r in g if r["classification"].startswith("CNI"))
    n_unv = sum(1 for r in g if r["classification"] == "غير متحقق منها")
    print(f"  {fam:22s} n={len(g):3d}  CNI={n_cni:3d}  unverified={n_unv:3d}")

print("\n=== unverified commercial URLs (25 expected) ===")
for r in sorted(com, key=lambda r: (r["family"], r["path"])):
    if r["classification"] == "غير متحقق منها":
        print(f"  {r['family']:22s} {r['path']:42s} pre-collapse: {r['pre_collapse'] or '-'}")

print("\n=== sentinel 15 ===")
sentinel = ["/tools", "/tools/body-fat-calculator", "/coaching", "/memberships", "/evo",
            "/ar/coaching", "/ar/memberships", "/ar/evo",
            "/", "/ar", "/diet-plan/2500/balanced", "/exercises", "/foods",
            "/blog/how-to-periodize-nutrition-body-recomposition", "/recipes/ful-medames-with-eggs"]
for p in sentinel:
    r = next(x for x in rows if x["path"] == p)
    print(f"  {p:55s} {r['classification']:28s} last-crawled={r['cni_last_crawled'] or '-':10s} "
          f"pre-collapse={r['pre_collapse'] or '-'}")

# CNI sample composition for sitemap-pages
print("\n=== composition of the 99 sitemap-pages CNI URLs ===")
for fam, n in Counter(r["family"] for r in sm_rows if r["classification"].startswith("CNI")).most_common():
    print(f"  {fam:22s} {n}")
