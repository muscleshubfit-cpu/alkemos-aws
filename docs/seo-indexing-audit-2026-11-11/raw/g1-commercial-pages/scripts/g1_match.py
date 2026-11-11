#!/usr/bin/env python3
"""G-1: Match sitemap-pages URLs against current CNI drilldown sample (Table.csv)."""
import csv, re, sys
from collections import Counter

BASE = "https://alkemos.com"

# 1. Load current CNI sample (1,000 examples, data through 2026-11-06)
cni = {}
with open("/home/z/my-project/gsc-analysis/g1/Table.csv", newline="", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        cni[row["URL"].strip()] = row.get("Last crawled", "").strip()
print(f"CNI sample: {len(cni)} URLs (unique: {len(set(cni))})")

# 2. Load sitemap-pages (current snapshot, 212 URLs)
smap = []
with open("/home/z/my-project/alkemos-aws/docs/seo-indexing-audit-2026-11-11/raw/sitemaps/sitemap-pages.xml", encoding="utf-8") as f:
    for loc in re.findall(r"<loc>([^<]+)</loc>", f.read()):
        smap.append(loc.strip())
print(f"sitemap-pages: {len(smap)} URLs")

# 3. Named key pages from the original references (10-18 audit §7.1, 11-10 investigation §7, report 11 §3)
named_en = ["/tools", "/tools/body-fat-calculator", "/compare", "/coaching", "/memberships",
            "/ai-workout-planner", "/programs", "/exercises", "/faq", "/authors", "/diet-plan",
            "/meal-planner", "/evo"]
named = []
for p in named_en:
    named.append(p)
    named.append("/ar" + p)

# 4. Family classification
def family(path):
    p = path[len(BASE):] if path.startswith(BASE) else path
    ar = p.startswith("/ar/")
    core = p[3:] if ar else p
    if core == "" or core == "/":
        return "home"
    if core.startswith("/tools"):
        return "tools"
    if core in ("/ai-meal-planner", "/ai-workout-planner", "/meal-planner", "/macro-tracker", "/workout-tracker"):
        return "planners-trackers"
    if core in ("/coaching", "/memberships", "/evo", "/for-coaches", "/for-coaches/register"):
        return "paid-services"
    if core.startswith("/programs"):
        return "programs"
    if core.startswith("/diet-plan"):
        return "diet-plan"
    if core.startswith("/recipes"):
        return "recipes-hubs"
    if core.startswith("/blog"):
        return "blog-hubs"
    if core.startswith("/foods"):
        return "foods-hub"
    if core.startswith("/exercises"):
        return "exercises-hub"
    if core == "/compare":
        return "compare"
    if core in ("/about", "/affiliate", "/contact", "/privacy", "/terms", "/authors", "/faq", "/guides/macro-tracking-accuracy"):
        return "info-pages"
    return "other"

# 5. Match
in_cni = [u for u in smap if u in cni]
not_in_cni = [u for u in smap if u not in cni]
print(f"\n=== sitemap-pages IN current CNI sample: {len(in_cni)} of {len(smap)} ===")
fam_counter = Counter(family(u) for u in in_cni)
for fam, n in fam_counter.most_common():
    print(f"  {fam}: {n}")
print()
for u in sorted(in_cni):
    print(f"  CNI  {family(u):16s} {u}  (last crawled {cni[u]})")

print(f"\n=== Named key pages (original reference) status in CURRENT CNI sample ===")
for p in named:
    url = BASE + p
    status = "IN CNI (crawled %s)" % cni[url] if url in cni else "NOT in CNI sample"
    insm = "sitemap" if url in smap else "NOT-in-sitemap!"
    print(f"  {status:45s} {insm:18s} {p}")

print(f"\n=== CNI sample composition (all 1,000) ===")
allfam = Counter()
for u in cni:
    p = u[len(BASE):] if u.startswith(BASE) else u
    if not u.startswith(BASE):
        allfam["external/non-base"] += 1
    elif p.startswith("/ar/exercises/") or p.startswith("/exercises/"):
        allfam["exercise details"] += 1
    elif p.startswith("/ar/foods/") or p.startswith("/foods/"):
        allfam["food details"] += 1
    elif p.startswith("/ar/blog/") or p.startswith("/blog/"):
        allfam["blog articles"] += 1
    elif re.match(r"(/ar)?/exercises", p):
        allfam["exercises hub/family"] += 1
    elif re.match(r"(/ar)?/foods", p):
        allfam["foods hub/family"] += 1
    elif re.match(r"(/ar)?/diet-plan/", p):
        allfam["diet-plan cells"] += 1
    elif re.match(r"(/ar)?/programs/", p):
        allfam["program details"] += 1
    elif re.match(r"(/ar)?/recipes/", p):
        allfam["recipes"] += 1
    elif re.match(r"(/ar)?/collections", p):
        allfam["collections"] += 1
    else:
        allfam["pages/other: " + p] += 1
for fam, n in allfam.most_common(40):
    print(f"  {n:5d}  {fam}")
