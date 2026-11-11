#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Final verification: every headline number in report 13 against raw data."""
import csv, json, re, io

BASE = "https://alkemos.com"
ok = []

def check(name, cond, detail=""):
    ok.append((name, bool(cond), detail))

# 1. Table.csv = 1,000 rows
cni = {}
with open("/home/z/my-project/gsc-analysis/g1/Table.csv", newline="", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        cni[row["URL"].strip()] = row.get("Last crawled", "").strip()
check("Table.csv = 1,000 عينة", len(cni) == 1000, f"n={len(cni)}")

# 2. Chart: 1,098 -> 1,271 on 24-10
chart = dict(l.strip().split(",") for l in open("/home/z/my-project/gsc-analysis/g1/Chart.csv") if l.strip() and not l.startswith("Date"))
check("قفزة +173 يوم 24-10 (1,098→1,271)", int(chart["2026-10-23"]) == 1098 and int(chart["2026-10-24"]) == 1271,
      f"{chart['2026-10-23']}→{chart['2026-10-24']}")
check("ثبات 1,271 حتى 06-11", chart["2026-11-06"] == "1271")

# 3. sitemap-pages = 212; 99 in CNI
smap = re.findall(r"<loc>([^<]+)</loc>", io.open("/home/z/my-project/alkemos-aws/docs/seo-indexing-audit-2026-11-11/raw/sitemaps/sitemap-pages.xml", encoding="utf-8").read())
check("sitemap-pages = 212", len(smap) == 212, f"n={len(smap)}")
sm_cni = [u for u in smap if u in cni]
check("99 من 212 في عينة CNI (46.7%)", len(sm_cni) == 99 and round(99/212*100, 1) == 46.7, f"n={len(sm_cni)}")

# 4. commercial 100 / 75 CNI / 25 unverified
rows = json.load(open("/home/z/my-project/gsc-analysis/g1/master-table.json", encoding="utf-8"))
com = [r for r in rows if r["commercial"] and r["in_sitemap"]]
check("السطح التجاري = 100", len(com) == 100, f"n={len(com)}")
check("75 مؤكد CNI", sum(1 for r in com if r["classification"].startswith("CNI")) == 75)
check("25 غير متحقق", sum(1 for r in com if r["classification"] == "غير متحقق منها") == 25)
check("صفر مؤكد فهرسة تجاريًا", sum(1 for r in com if r["classification"].startswith("مفهرسة")) == 0)

# 5. anchor 26: 20 CNI (13 EN + 7 AR)
named_en = ["/tools", "/tools/body-fat-calculator", "/compare", "/coaching", "/memberships", "/ai-workout-planner", "/programs", "/exercises", "/faq", "/authors", "/diet-plan", "/meal-planner", "/evo"]
en_in = sum(1 for p in named_en if BASE + p in cni)
ar_in = sum(1 for p in named_en if BASE + "/ar" + p in cni)
check("13/13 إنجليزية في CNI", en_in == 13, f"{en_in}")
check("7/13 مرايا عربية في CNI (المجموع 20)", ar_in == 7 and en_in + ar_in == 20, f"{ar_in}")

# 6. 49 of 99 crawled >= 24-10
from datetime import date
def d(s):
    try:
        y, m, dd = map(int, s.split("-")); return date(y, m, dd)
    except Exception:
        return None
n_post = sum(1 for u in sm_cni if d(cni[u]) and d(cni[u]) >= date(2026, 10, 24))
check("49 من 99 زُحفت في/بعد 24-10", n_post == 49, f"n={n_post}")
check("أحدث زحف /ar = 11-07", cni.get(BASE + "/ar") == "2026-11-07")
check("/tools/calorie-calculator زحف 11-03", cni.get(BASE + "/tools/calorie-calculator") == "2026-11-03")

# 7. whole sample: 834 <10-10; 126 >=24-10
n_pre = sum(1 for u in cni if d(cni[u]) and d(cni[u]) < date(2026, 10, 10))
n_w2 = sum(1 for u in cni if d(cni[u]) and d(cni[u]) >= date(2026, 10, 24))
check("834/1,000 آخر زحف قبل 10-10", n_pre == 834, f"n={n_pre}")
check("126/1,000 زحف ≥24-10", n_w2 == 126, f"n={n_w2}")

# 8. live checks: 214 all 200 etc.
live = json.load(open("/home/z/my-project/gsc-analysis/g1/live-pages.json", encoding="utf-8"))
check("214 سجل فحص حي", len(live) == 214, f"n={len(live)}")
check("كلها 200", all(r.get("status") == 200 for r in live))
check("صفر تحويلات", sum(1 for r in live if r.get("redirected")) == 0)
check("canonical ذاتي 214/214", all(r.get("canonical", "").rstrip("/") == r["url"].rstrip("/") for r in live))
check("index,follow 214/214", all(r.get("meta_robots") in ("index, follow", "index,follow") for r in live))
check("صفر X-Robots-Tag", sum(1 for r in live if r.get("x_robots_tag")) == 0)
check("h1=1 للكل", all(r.get("h1_count") == 1 for r in live))
check("أدنى كلمات 297", min(r.get("words", 0) for r in live) == 297)
check("أدنى كلمات تجاري 307", min(r["words"] for r in com if (lv := next((l for l in live if l['path'] == r['path']), None))) == 307)

# 9. og_locale 108/106; hreflang 0 errors; sitemap 2359; googlebot 4
og = [r for r in live if r.get("og_locale") == "en_US"]; ogar = [r for r in live if r.get("og_locale") == "ar_EG"]
check("og:locale ‏108 en_US / 106 ar_EG", len(og) == 108 and len(ogar) == 106, f"{len(og)}/{len(ogar)}")
hs = json.load(open("/home/z/my-project/gsc-analysis/g1/hreflang-sitemaps.json", encoding="utf-8"))
check("hreflang: صفر ناقص على 56", len(hs["hreflang"]) == 56 and all(x["complete"] for x in hs["hreflang"]))
check("hreflang: صفر خطأ اتجاه", len(hs["pair_errors"]) == 0)

# 10. sentinel: 9 CNI + 1 indexed + 5 unverified
sentinel = ["/tools", "/tools/body-fat-calculator", "/coaching", "/memberships", "/evo", "/ar/coaching", "/ar/memberships", "/ar/evo", "/", "/ar", "/diet-plan/2500/balanced", "/exercises", "/foods", "/blog/how-to-periodize-nutrition-body-recomposition", "/recipes/ful-medames-with-eggs"]
srows = [next(r for r in rows if r["path"] == p) for p in sentinel]
nsc = sum(1 for r in srows if r["classification"].startswith("CNI"))
nsi = sum(1 for r in srows if r["classification"].startswith("مفهرسة"))
nsu = sum(1 for r in srows if r["classification"] == "غير متحقق منها")
check("الحارس: 9 CNI + 1 مفهرسة + 5 غير متحقق", nsc == 9 and nsi == 1 and nsu == 5, f"{nsc}/{nsi}/{nsu}")

# 11. report placeholders check
rep = io.open("/home/z/my-project/alkemos-aws/docs/seo-indexing-audit-2026-11-11/13-g1-commercial-pages-investigation.md", encoding="utf-8").read()
for bad in ["TODO", "XXX", "undefined", "NaN", "【"]:
    check(f"لا placeholder '{bad}'", bad not in rep)
check("التقرير: 13 قسمًا (§0–§12)", rep.count("\n## §") == 13, f"sections={rep.count(chr(10)+'## §')}")

# summary
fails = [x for x in ok if not x[1]]
for name, passed, detail in ok:
    print(("PASS " if passed else "FAIL ") + name + (f"  [{detail}]" if detail and not passed else ""))
print(f"\n{len(ok)-len(fails)}/{len(ok)} checks passed")
assert not fails, [f[0] for f in fails]
