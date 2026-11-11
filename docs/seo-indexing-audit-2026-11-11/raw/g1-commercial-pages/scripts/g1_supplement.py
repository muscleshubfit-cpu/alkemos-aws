#!/usr/bin/env python3
"""G-1 supplement: (a) case-insensitive hreflang re-check on commercial surface + sentinel,
(b) live sitemap verification, (c) Googlebot-UA byte comparison on 4 key commercial pages.
READ-ONLY. Polite rate."""
import json, re, time, urllib.request, urllib.error, gzip
from collections import Counter

BASE = "https://alkemos.com"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
GBOT = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/130.0 Safari/537.36"

def fetch(url, ua=UA):
    req = urllib.request.Request(url, headers={
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip",
    })
    t0 = time.time()
    try:
        r = urllib.request.urlopen(req, timeout=30)
        raw = r.read()
        if r.headers.get("Content-Encoding") == "gzip":
            raw = gzip.decompress(raw)
        return r, raw, round((time.time() - t0) * 1000)
    except urllib.error.HTTPError as e:
        return e, b"", round((time.time() - t0) * 1000)
    except Exception as e:
        return None, str(e).encode(), round((time.time() - t0) * 1000)

targets = []
for p in open("/tmp/sitemap-pages-paths.txt"):
    p = p.strip()
    if not p:
        continue
    core = p[3:] if p.startswith("/ar/") else p
    fam = ("tools" if core.startswith("/tools")
           else "planner" if core in ("/ai-meal-planner", "/ai-workout-planner", "/meal-planner", "/macro-tracker", "/workout-tracker")
           else "paid" if core in ("/coaching", "/memberships", "/evo", "/for-coaches", "/for-coaches/register")
           else "prog" if core.startswith("/programs")
           else "dp-hub" if core == "/diet-plan"
           else "compare" if core == "/compare"
           else None)
    if fam:
        targets.append((p, fam))
targets.append(("/", "home"))
targets.append(("/ar", "home"))
targets.append(("/blog/how-to-periodize-nutrition-body-recomposition", "sentinel-article"))
targets.append(("/recipes/ful-medames-with-eggs", "sentinel-recipe"))
print(f"hreflang re-check targets: {len(targets)}")

results = []
for p, fam in targets:
    url = BASE + ("" if p == "/" else p)
    r, raw, ms = fetch(url)
    html = raw.decode("utf-8", errors="replace")
    # case-insensitive hreflang link extraction with href
    pairs = re.findall(r'<link[^>]*?href=["\']([^"\']+)["\'][^>]*?hreflang=["\']([^"\']+)["\']', html, re.I)
    pairs2 = re.findall(r'<link[^>]*?hreflang=["\']([^"\']+)["\'][^>]*?href=["\']([^"\']+)["\']', html, re.I)
    hl = {}
    for href, lang in pairs:
        hl[lang] = href
    for lang, href in pairs2:
        hl[lang] = href
    is_ar = p.startswith("/ar/")
    ok = ("ar" in hl and "en" in hl and hl.get("x-default"))
    self_ok = (hl.get("ar", "").rstrip("/") == (BASE + "/ar" if not is_ar and p == "/" else "").rstrip("/") or True)
    # verify pair correctness: EN page should declare en->self, ar->mirror
    results.append({"path": p, "fam": fam, "status": r.getcode() if r else None,
                    "hreflang": hl, "complete": ok})
    time.sleep(0.45)

bad = [x for x in results if not x["complete"]]
print(f"pages with incomplete hreflang (missing en/ar/x-default): {len(bad)}")
for x in bad:
    print("  ", x["path"], x["hreflang"])

# pair correctness sample: verify EN page links to its AR mirror and vice versa
pair_errors = []
bycore = {}
for x in results:
    core = x["path"][3:] if x["path"].startswith("/ar/") else x["path"]
    bycore.setdefault(core, {})["ar" if x["path"].startswith("/ar/") else "en"] = x
for core, d in bycore.items():
    if "en" in d and "ar" in d:
        en, ar = d["en"], d["ar"]
        exp_ar = BASE + "/ar" + ("" if core == "/" else core)
        exp_en = BASE + ("" if core == "/" else core)
        if en["hreflang"].get("ar", "").rstrip("/") != exp_ar.rstrip("/"):
            pair_errors.append((core, "EN->AR", en["hreflang"].get("ar"), exp_ar))
        if ar["hreflang"].get("en", "").rstrip("/") != exp_en.rstrip("/"):
            pair_errors.append((core, "AR->EN", ar["hreflang"].get("en"), exp_en))
        if ar["hreflang"].get("ar", "").rstrip("/") != exp_ar.rstrip("/"):
            pair_errors.append((core, "AR->AR(self)", ar["hreflang"].get("ar"), exp_ar))
        if en["hreflang"].get("en", "").rstrip("/") != exp_en.rstrip("/"):
            pair_errors.append((core, "EN->EN(self)", en["hreflang"].get("en"), exp_en))
print(f"\nhreflang pair-direction errors: {len(pair_errors)}")
for e in pair_errors[:10]:
    print("  ", e)

# ---- live sitemap verification ----
print("\n=== live sitemap check ===")
r, raw, ms = fetch(BASE + "/sitemap.xml")
idx = re.findall(r"<loc>([^<]+)</loc>", raw.decode("utf-8", errors="replace"))
print(f"sitemap.xml index children: {len(idx)}")
total = 0
for child in idx:
    r2, raw2, _ = fetch(child)
    n = len(re.findall(r"<loc>", raw2.decode("utf-8", errors="replace")))
    total += n
    print(f"  {child}: {n} URLs (HTTP {r2.getcode()})")
    time.sleep(0.4)
print(f"TOTAL live sitemap URLs: {total}")

# ---- Googlebot UA comparison on 4 key commercial pages ----
print("\n=== Googlebot byte comparison (4 key commercial pages) ===")
for p in ["/memberships", "/coaching", "/tools/calorie-calculator", "/evo"]:
    url = BASE + p
    rb, rawb, _ = fetch(url, UA)
    rg, rawg, _ = fetch(url, GBOT)
    same = (rawb == rawg)
    print(f"  {p}: browser={rb.getcode()}/{len(rawb)}B googlebot={rg.getcode()}/{len(rawg)}B identical={same}")
    time.sleep(0.6)

json.dump({"hreflang": results, "pair_errors": pair_errors},
          open("/home/z/my-project/gsc-analysis/g1/hreflang-sitemaps.json", "w"), ensure_ascii=False, indent=1)
print("\nsaved hreflang-sitemaps.json")
