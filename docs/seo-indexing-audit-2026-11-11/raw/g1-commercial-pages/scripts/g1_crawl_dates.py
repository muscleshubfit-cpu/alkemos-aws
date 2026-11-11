#!/usr/bin/env python3
"""G-1: crawl-date analysis + paid/tools detail + robots.txt check."""
import csv, json, re, time, urllib.request, gzip
from collections import Counter
from datetime import date

def d(s):
    try:
        y, m, dd = map(int, s.split("-"))
        return date(y, m, dd)
    except Exception:
        return None

cni = {}
with open("/home/z/my-project/gsc-analysis/g1/Table.csv", newline="", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        cni[row["URL"].strip()] = row.get("Last crawled", "").strip()

WAVE2 = date(2026, 10, 24)
EXPORT_DATE = date(2026, 11, 6)

# sitemap-pages in CNI
smap = [u.strip() for u in re.findall(r"<loc>([^<]+)</loc>",
        open("/home/z/my-project/alkemos-aws/docs/seo-indexing-audit-2026-11-11/raw/sitemaps/sitemap-pages.xml", encoding="utf-8").read())]
sm_cni = {u: cni[u] for u in smap if u in cni}

# commercial subset of sitemap-pages
def is_commercial(path):
    core = path[3:] if path.startswith("/ar/") else path
    return (core.startswith("/tools") or core in ("/ai-meal-planner", "/ai-workout-planner", "/meal-planner",
            "/macro-tracker", "/workout-tracker", "/coaching", "/memberships", "/evo", "/for-coaches",
            "/for-coaches/register") or core.startswith("/programs") or core.startswith("/diet-plan")
            or core == "/compare" or core == "/")

comm_cni = {u: cni[u] for u in sm_cni if is_commercial(u[len("https://alkemos.com"):] or "/")}

print(f"sitemap-pages in CNI: {len(sm_cni)} | commercial in CNI: {len(comm_cni)}")
print(f"\n=== last-crawled distribution (sitemap-pages in CNI, n={len(sm_cni)}) ===")
buckets = Counter()
for u, lc in sm_cni.items():
    dt = d(lc)
    if dt is None:
        buckets["unparseable"] += 1
    elif dt >= WAVE2:
        buckets["crawled on/after wave-2 (24-10)"] += 1
    elif dt >= date(2026, 10, 19):
        buckets["crawled 19-23 Oct (week of wave-2)"] += 1
    elif dt >= date(2026, 10, 10):
        buckets["crawled 10-18 Oct (post-migration)"] += 1
    else:
        buckets["crawled before 10-10 (pre-migration)"] += 1
for k, v in sorted(buckets.items()):
    print(f"  {v:3d}  {k}")

print(f"\n=== commercial pages in CNI crawled ON/AFTER wave-2 (still not indexed) ===")
for u, lc in sorted(comm_cni.items()):
    dt = d(lc)
    if dt and dt >= WAVE2:
        print(f"  {u:60s} last crawled {lc}")

print(f"\n=== whole-sample (all 1,000) last-crawled ===")
b2 = Counter()
for u, lc in cni.items():
    dt = d(lc)
    if dt is None:
        b2["unparseable"] += 1
    elif dt >= WAVE2:
        b2[">=24-10"] += 1
    elif dt >= date(2026, 10, 19):
        b2["19-23 Oct"] += 1
    elif dt >= date(2026, 10, 10):
        b2["10-18 Oct"] += 1
    else:
        b2["<10-10"] += 1
for k, v in sorted(b2.items()):
    print(f"  {v:4d}  {k}")

# ---- paid-services & tools & planners full detail with inlinks ----
import subprocess
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

print("\n=== tools / planners / paid-services / programs detail ===")
for u in sorted(smap):
    p = u[len("https://alkemos.com"):] or "/"
    core = p[3:] if p.startswith("/ar/") else p
    if (core.startswith("/tools") or core in ("/ai-meal-planner", "/ai-workout-planner", "/meal-planner",
       "/macro-tracker", "/workout-tracker", "/coaching", "/memberships", "/evo", "/for-coaches", "/for-coaches/register")
       or core.startswith("/programs") or core == "/compare"):
        st = f"CNI(crawled {cni[u]})" if u in cni else "not-in-sample"
        print(f"  {p:38s} {st:28s} inlinks={inl.get(u, '?')}")

# ---- robots.txt quick check ----
req = urllib.request.Request("https://alkemos.com/robots.txt", headers={"User-Agent": "Mozilla/5.0"})
r = urllib.request.urlopen(req, timeout=20)
robots = r.read().decode()
print(f"\nrobots.txt: HTTP {r.getcode()}, {len(robots)} bytes, sitemap lines:")
for line in robots.splitlines():
    if "sitemap" in line.lower() or "disallow" in line.lower():
        print("  ", line)
