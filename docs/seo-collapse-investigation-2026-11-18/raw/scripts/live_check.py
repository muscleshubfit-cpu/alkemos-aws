#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Live production technical check — Alkemos 2026-11-18 (read-only).
Compares Googlebot UA vs Chrome UA across a representative sample of each page group.
Checks: status, latency, x-robots-tag, cache headers, title, canonical, hreflang,
meta-robots, JSON-LD, main-content word count. No requests submitted to GSC.
"""
import requests, json, time, re
from bs4 import BeautifulSoup

GB = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
CH = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

SAMPLES = [
    ("homepage-en", "https://alkemos.com/"),
    ("homepage-ar", "https://alkemos.com/ar"),
    ("tool-calorie-en", "https://alkemos.com/tools/calorie-calculator"),
    ("tool-calorie-ar", "https://alkemos.com/ar/tools/calorie-calculator"),
    ("tool-bodyfat-en", "https://alkemos.com/tools/body-fat-calculator"),
    ("food-salmon-en", "https://alkemos.com/foods/salmon"),
    ("food-rice-en", "https://alkemos.com/foods/white-rice"),
    ("food-oliveoil-ar", "https://alkemos.com/ar/foods/olive-oil"),
    ("food-mcnuggets-en", "https://alkemos.com/foods/mcdonalds-chicken-mcnuggets"),
    ("exercise-en", "https://alkemos.com/exercises/dumbbell-bench-press-with-neutral-grip"),
    ("exercise-ar", "https://alkemos.com/ar/exercises/shoulder-circles"),
    ("muscle-en", "https://alkemos.com/muscles/biceps"),
    ("blog-en", "https://alkemos.com/blog/protein-after-workout-grams-guide"),
    ("blog-ar", "https://alkemos.com/ar/blog/hiit-home-workout-guide"),
    ("commercial-evo", "https://alkemos.com/evo"),
    ("commercial-coaching", "https://alkemos.com/coaching"),
    ("authors", "https://alkemos.com/authors"),
]

def fetch(url, ua):
    t0 = time.time()
    r = requests.get(url, headers={"User-Agent": ua}, timeout=40, allow_redirects=True)
    ms = round((time.time() - t0) * 1000)
    return r, ms

def analyze(r):
    h = r.headers
    out = {
        "status": r.status_code,
        "final_url": r.url,
        "server": h.get("server", ""),
        "cf_cache": h.get("cf-cache-status", ""),
        "age": h.get("age", ""),
        "cache_control": h.get("cache-control", ""),
        "x_robots": h.get("x-robots-tag", ""),
        "content_type": h.get("content-type", ""),
        "bytes": len(r.content),
    }
    if "text/html" in out["content_type"]:
        soup = BeautifulSoup(r.text, "html.parser")
        t = soup.find("title")
        out["title"] = t.get_text(strip=True)[:120] if t else None
        mrc = soup.find("meta", attrs={"name": "robots"})
        out["meta_robots"] = mrc.get("content") if mrc else None
        cl = soup.find("link", rel="canonical")
        out["canonical"] = cl.get("href") if cl else None
        alts = soup.find_all("link", rel="alternate", hreflang=True)
        out["hreflang"] = {a.get("hreflang"): (a.get("href") or "")[:80] for a in alts}
        out["jsonld_types"] = sorted({json.loads(s.string).get("@type", "?") if s.string and s.string.strip().startswith("{") else
                                       next((x.get("@type") for x in json.loads(s.string) if isinstance(x, dict)), "?")
                                       for s in soup.find_all("script", type="application/ld+json") if s.string})[:8] if soup.find_all("script", type="application/ld+json") else []
        body = soup.find("body")
        if body:
            txt = body.get_text(" ", strip=True)
            out["body_words"] = len(txt.split())
    return out

results = {}
for name, url in SAMPLES:
    try:
        rg, msg = fetch(url, GB)
        ag = analyze(rg)
        rc, _ = fetch(url, CH)
        ag["chrome_status"] = rc.status_code
        ag["bytes_match_chrome"] = (len(rc.content) == len(rg.content))
        # latency measured on the Googlebot fetch
        ag["latency_ms"] = msg
        results[name] = {"url": url, **ag}
        print(f"{name:24s} {ag['status']} {str(msg):>5}ms cache={ag['cf_cache']:5s} robots={str(ag['meta_robots'])[:22]:22s} words={ag.get('body_words','?'):>5} bytesMatch={ag['bytes_match_chrome']}")
    except Exception as e:
        results[name] = {"url": url, "error": str(e)}
        print(f"{name:24s} ERROR {e}")

with open("/home/z/my-project/gsc-data/live-check.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=1)

# redirect checks
print("\n=== REDIRECTS ===")
for name, url in [("www", "https://www.alkemos.com/"), ("http", "http://alkemos.com/"),
                  ("trailing-slash", "https://alkemos.com/tools/calorie-calculator/")]:
    try:
        r = requests.get(url, headers={"User-Agent": GB}, timeout=30, allow_redirects=False)
        print(f"{name:16s} -> {r.status_code} {r.headers.get('location','')}")
    except Exception as e:
        print(f"{name:16s} ERROR {e}")

print("\nsaved -> /home/z/my-project/gsc-data/live-check.json")
