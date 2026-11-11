#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO-GSC-COVERAGE-2026-11-11 — فحص حي مهذب لعينات ممثلة (قراءة-فقط)
معدل ~1 طلب/1.2 ثانية. يلتقط: الحالة، التحويلات، canonical، meta robots،
X-Robots-Tag، hreflang، العنوان، الحجم، TTFB. حفظ JSON.
"""
import json, re, ssl, time, urllib.request, urllib.error, urllib.parse

HERE = "/home/z/my-project/gsc-analysis"
UA_BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
UA_GB = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36"

SAMPLES = [
    # (url, family, lens, ua)
    ("https://alkemos.com/", "home-EN", "core", "browser"),
    ("https://alkemos.com/ar", "home-AR", "core", "browser"),
    ("https://alkemos.com/tools", "tools-hub", "core", "browser"),
    ("https://alkemos.com/tools/body-fat-calculator", "tool-detail", "core", "browser"),
    ("https://alkemos.com/tools/bmi-calculator", "tool-detail", "core", "browser"),
    ("https://alkemos.com/coaching", "paid-coaching", "paid", "browser"),
    ("https://alkemos.com/memberships", "paid-memberships", "paid", "browser"),
    ("https://alkemos.com/evo", "paid-evo", "paid", "browser"),
    ("https://alkemos.com/programs", "programs-hub", "core", "browser"),
    ("https://alkemos.com/programs/gym-strength-5x5", "program-detail", "core", "browser"),
    ("https://alkemos.com/diet-plan", "dietplan-hub", "core", "browser"),
    ("https://alkemos.com/diet-plan/2500/balanced", "dietplan-cell", "core", "browser"),
    ("https://alkemos.com/meal-planner", "tool-page", "core", "browser"),
    ("https://alkemos.com/ai-workout-planner", "tool-page", "core", "browser"),
    ("https://alkemos.com/compare", "compare", "core", "browser"),
    ("https://alkemos.com/faq", "faq", "core", "browser"),
    ("https://alkemos.com/authors", "authors", "core", "browser"),
    ("https://alkemos.com/foods", "foods-hub", "database", "browser"),
    ("https://alkemos.com/foods?page=2", "foods-pagination", "database", "browser"),
    ("https://alkemos.com/foods/chicken-breast", "food-curated", "database", "browser"),
    ("https://alkemos.com/foods/cheese-tilsit", "food-usda-tail", "database", "browser"),
    ("https://alkemos.com/ar/foods/cheese-tilsit", "food-usda-tail-AR", "database", "browser"),
    ("https://alkemos.com/foods/worthington-choplets-canned-unprepared", "food-usda-tail2", "database", "browser"),
    ("https://alkemos.com/exercises", "exercises-hub", "database", "browser"),
    ("https://alkemos.com/exercises/barbell-squat", "exercise-detail", "database", "browser"),
    ("https://alkemos.com/exercises/34-sit-up", "exercise-detail2", "database", "browser"),
    ("https://alkemos.com/blog/how-to-periodize-nutrition-body-recomposition", "blog-article", "core", "browser"),
    ("https://alkemos.com/recipes/ful-medames-with-eggs", "recipe-detail", "core", "browser"),
    ("https://alkemos.com/balance", "planned-balance-404", "technical", "browser"),
    ("https://alkemos.com/robots.txt", "robots", "technical", "browser"),
    ("https://alkemos.com/sitemap.xml", "sitemap-index", "technical", "browser"),
    ("https://musclehubeg.vercel.app/", "old-property-home", "oldproperty", "browser"),
    ("https://musclehubeg.vercel.app/tools", "old-property-tools", "oldproperty", "browser"),
    # هوية Googlebot على 4 مسارات للتحقق من التكافؤ
    ("https://alkemos.com/", "home-EN", "core", "googlebot"),
    ("https://alkemos.com/tools", "tools-hub", "core", "googlebot"),
    ("https://alkemos.com/foods/cheese-tilsit", "food-usda-tail", "database", "googlebot"),
    ("https://alkemos.com/exercises/barbell-squat", "exercise-detail", "database", "googlebot"),
]

def fetch(url, ua):
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en,ar;q=0.8",
    })
    t0 = time.time()
    result = {"url": url, "ua": "googlebot" if "Googlebot" in ua else "browser"}
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
            body = r.read()
            result.update(status=r.status, final_url=r.geturl(),
                          content_type=r.headers.get("Content-Type", ""),
                          x_robots=r.headers.get("X-Robots-Tag", ""),
                          cache=r.headers.get("CF-Cache-Status", "") or r.headers.get("x-vercel-cache", ""),
                          ttfb_ms=int((time.time() - t0) * 1000), bytes=len(body))
            html = body.decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        body = e.read()
        result.update(status=e.code, final_url=url, content_type=e.headers.get("Content-Type", ""),
                      x_robots=e.headers.get("X-Robots-Tag", ""), ttfb_ms=int((time.time() - t0) * 1000),
                      bytes=len(body))
        html = body.decode("utf-8", "replace")
    except Exception as e:
        result.update(status="ERROR", error=type(e).__name__ + ": " + str(e)[:200])
        return result
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', html, re.I)
    result["canonical"] = m.group(1) if m else None
    m = re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
    if not m:
        m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']robots["\']', html, re.I)
    result["meta_robots"] = m.group(1) if m else None
    result["hreflang_count"] = len(re.findall(r'rel=["\']alternate["\'][^>]*hreflang', html)) or \
                               len(re.findall(r'hreflang=["\'][a-z-]+["\']', html))
    m = re.search(r"<title[^>]*>([^<]{0,200})</title>", html, re.I)
    result["title"] = m.group(1).strip() if m else None
    result["has_html_lang"] = bool(re.search(r"<html[^>]+lang=", html))
    # فحص أساس قاعدة البيانات: جداول/حقول/عناصر بيانات في المكتبات
    if "database" in url or "/foods" in url or "/exercises" in url:
        result["db_signals"] = dict(
            table_rows=len(re.findall(r"<tr[ >]", html)),
            nutrition_fields=len(re.findall(r"(protein|carb|fat|fiber|sugar|calories|calorie)", html, re.I)),
            howto="HowTo" in html, itemlist="ItemList" in html,
            images=len(re.findall(r"<img[ >]", html)),
        )
    return result

out = []
for url, family, lens, ua_kind in SAMPLES:
    ua = UA_GB if ua_kind == "googlebot" else UA_BROWSER
    r = fetch(url, ua)
    r.update(family=family, lens=lens)
    out.append(r)
    print("%-42s %-22s %-9s -> %s" % (r["url"].replace("https://", "")[:42], family, r.get("ua"), r.get("status")))
    time.sleep(1.2)

with open(HERE + "/live-samples.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("\nSaved", len(out), "samples -> live-samples.json")
