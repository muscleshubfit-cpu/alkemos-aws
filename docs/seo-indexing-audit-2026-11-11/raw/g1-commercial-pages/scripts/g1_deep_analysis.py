#!/usr/bin/env python3
"""G-1: deep analysis of live results + live sitemap verification."""
import json, re, urllib.request, gzip
from collections import Counter, defaultdict

with open("/home/z/my-project/gsc-analysis/g1/live-pages.json", encoding="utf-8") as f:
    live = json.load(f)

BASE = "https://alkemos.com"

# ---- family classification (same as g1_match) ----
def family(path):
    p = path
    ar = p.startswith("/ar/")
    core = p[3:] if ar else p
    if core == "/" or core == "":
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

# ---- CNI membership ----
import csv
cni = {}
with open("/home/z/my-project/gsc-analysis/g1/Table.csv", newline="", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        cni[row["URL"].strip()] = row.get("Last crawled", "").strip()

# ---- inlinks from eighth-audit crawl metrics ----
import subprocess
inl = {}
out = subprocess.run(["zcat", "/home/z/my-project/alkemos-aws/docs/seo-indexing-audit-2026-11-11/raw/analysis/all-pages-metrics.csv.gz"],
                     capture_output=True, text=True).stdout
if out.startswith("\ufeff"):
    out = out[1:]
rd = csv.DictReader(out.splitlines())
for row in rd:
    u = row["url"].strip()
    try:
        inl[u] = int(row["inlinks_dofollow"] or 0)
    except ValueError:
        inl[u] = 0

rows = []
for r in live:
    p = r["path"]
    url = r["url"]
    fam = family(p)
    rows.append({
        "path": p, "fam": fam, "status": r.get("status"),
        "words": r.get("words", 0), "h1": r.get("h1_count", 0),
        "title_len": r.get("title_len", 0), "desc_len": r.get("desc_len", 0),
        "ttfb": r.get("ttfb_ms"), "bytes": r.get("bytes"),
        "canonical_self": (r.get("canonical", "").rstrip("/") == url.rstrip("/")),
        "meta_robots": r.get("meta_robots"), "hreflang": r.get("hreflang", []),
        "cni": url in cni, "last_crawled": cni.get(url, ""),
        "inlinks": inl.get(url, None),
        "ld_n": len(r.get("ld_types", [])),
    })

# ---- per-family aggregates ----
print("=== Per-family live + CNI summary (sitemap-pages 212 + 2 extras) ===")
fams = defaultdict(list)
for row in rows:
    fams[row["fam"]].append(row)
hdr = f"{'family':18s} {'n':>3s} {'CNI':>3s} {'all200':>6s} {'selfcan':>7s} {'medWords':>8s} {'minW':>5s} {'medInl':>7s} {'minInl':>6s} {'medTTFB':>7s}"
print(hdr)
for fam in sorted(fams, key=lambda f: -len(fams[f])):
    g = fams[fam]
    ws = sorted(x["words"] for x in g)
    il = sorted(x["inlinks"] for x in g if x["inlinks"] is not None)
    tb = sorted(x["ttfb"] for x in g if x["ttfb"] is not None)
    print(f"{fam:18s} {len(g):3d} {sum(1 for x in g if x['cni']):3d} "
          f"{str(all(x['status']==200 for x in g)):>6s} {str(all(x['canonical_self'] for x in g)):>7s} "
          f"{ws[len(ws)//2]:8d} {ws[0]:5d} {(il[len(il)//2] if il else -1):7d} {(il[0] if il else -1):6d} "
          f"{(tb[len(tb)//2] if tb else -1):7d}")

# ---- anomalies: thin content, missing h1, short titles, hreflang gaps ----
print("\n=== Anomalies ===")
thin = [x for x in rows if x["words"] < 150]
print(f"words<150: {[(x['path'], x['words']) for x in thin]}")
noh1 = [x for x in rows if x["h1"] == 0]
print(f"h1=0: {[x['path'] for x in noh1]}")
h1multi = [x for x in rows if x["h1"] > 1]
print(f"h1>1: {[(x['path'], x['h1']) for x in h1multi]}")
shorttitle = [x for x in rows if x["title_len"] < 15]
print(f"title<15 chars: {[(x['path'], x['title_len']) for x in shorttitle]}")
nodesc = [x for x in rows if x["desc_len"] == 0]
print(f"no meta description: {[x['path'] for x in nodesc]}")

def hl_ok(x):
    # EN pages: en+ar(+x-default); AR pages: ar+en(+x-default)
    hs = set(x["hreflang"])
    is_ar = x["path"].startswith("/ar")
    need = {"ar", "en"} if is_ar else {"en", "ar"}
    return need.issubset(hs)
hl_bad = [x for x in rows if not hl_ok(x)]
print(f"hreflang missing en/ar pair: {[(x['path'], x['hreflang']) for x in hl_bad]}")

# inlinks zero
noinl = [x for x in rows if x["inlinks"] == 0]
print(f"zero dofollow inlinks (crawl 10/11-11): {[x['path'] for x in noinl]}")
lowinl = [x for x in rows if x["inlinks"] is not None and x["inlinks"] <= 2]
print(f"<=2 dofollow inlinks: {[(x['path'], x['inlinks']) for x in lowinl]}")

# ---- EN/AR pair word comparison ----
print("\n=== EN/AR word-count pairs (commercial families) ===")
bycore = {}
for x in rows:
    p = x["path"]
    core = p[3:] if p.startswith("/ar/") else p
    bycore.setdefault(core, {})[ "ar" if p.startswith("/ar/") else "en"] = x
com_fams = {"tools", "planners-trackers", "paid-services", "programs", "diet-plan", "compare"}
gaps = []
for core, d in sorted(bycore.items()):
    if family(core) not in com_fams:
        continue
    if "en" in d and "ar" in d:
        ratio = d["en"]["words"] / max(1, d["ar"]["words"])
        flag = "  <== AR/EN gap" if ratio > 2.5 or ratio < 0.4 else ""
        if flag:
            gaps.append((core, d["en"]["words"], d["ar"]["words"]))
        if flag or d["en"]["words"] < 400 or d["ar"]["words"] < 400:
            print(f"  {core:45s} EN {d['en']['words']:5d} / AR {d['ar']['words']:5d}{flag}")
    else:
        print(f"  {core:45s} {'EN only' if 'en' in d else 'AR only'}")
print(f"\ntotal EN/AR gap>2.5x pairs: {len(gaps)}")

# ---- commercial pages detail table ----
print("\n=== Commercial surface detail (CNI status + inlinks + words) ===")
for x in sorted(rows, key=lambda r: (r["fam"], r["path"])):
    if x["fam"] in com_fams:
        print(f"  {x['fam']:16s} {x['path']:42s} CNI={'Y' if x['cni'] else '-'} craw={x['last_crawled'] or '-':10s} "
              f"inl={str(x['inlinks']):>4s} words={x['words']:5d} ttfb={x['ttfb']}")

# save enriched
with open("/home/z/my-project/gsc-analysis/g1/enriched.json", "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=1)
print("\nsaved enriched.json")
