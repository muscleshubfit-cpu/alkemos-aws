#!/usr/bin/env python3
"""
g1_dni_match.py — مطابقة أمثلة DNI الـ25 (وصلت بجولة التنفيذ 2026-11-11)
ضد بيانات التحقيق القائمة، وإغلاق القيد الموثق (أ) بتقرير 13 §1.

قراءة-فقط: لا يكتب شيئًا في الإنتاج؛ مخرجاته JSON محلي بهذا المجلد.

المطابقات:
  1. عينة CNI (Table.csv — 1,000 رابط، بيانات 06-11): هل أي من الـ25 داخلها؟
  2. السطح التجاري (100 مسار من master-table.json): تقاطع DNI×تجاري.
  3. القائمة التاريخية الـ66: التقاطع مع قائمة الارتساء الموثقة (26).
  4. فحص حي قراءة-فقط لكل رابط من الـ25: الحالة/canonical/robots/hreflang/
     الوجود في sitemap-blog الحية — بنفس أبعاد فحص G-1.
  5. تحليل النمط: اللغة/العائلة (مقالات عربية مقابل فئات مقابل تجاري).
"""
import csv
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
RAW = HERE.parent  # raw/g1-commercial-pages/
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
CTX = ssl.create_default_context()


def get(url: str, headers: dict | None = None):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=25, context=CTX) as r:
        return r.status, dict(r.headers), r.read()


def main() -> int:
    dni = [l.strip() for l in (RAW / "data" / "dni-examples-25.txt").read_text().splitlines() if l.strip()]
    assert len(dni) == 25, f"expected 25 DNI examples, got {len(dni)}"

    # 1) عينة CNI
    cni = set()
    with (RAW / "Table.csv").open() as f:
        for row in csv.DictReader(f):
            cni.add(row["URL"].strip())

    # 2) السطح التجاري من الجدول الموحد
    master = json.loads((RAW / "data" / "master-table.json").read_text())
    entries = master["entries"] if isinstance(master, dict) and "entries" in master else master
    commercial = set()
    for e in entries:
        path = e.get("path") or e.get("url") or ""
        if not path.startswith("http"):
            path = "https://alkemos.com" + path
        # الحسم بحقل commercial الرسمي بالجدول الموحد (تقرير 13 §3) —
        # لا بتصنيف العائلة (بوابات المدونة ليست تجارية).
        if e.get("commercial") is True:
            commercial.add(path.rstrip("/"))
    anchor_26 = [
        "/tools", "/ar/tools", "/tools/body-fat-calculator", "/ar/tools/body-fat-calculator",
        "/compare", "/ar/compare", "/coaching", "/ar/coaching", "/memberships", "/ar/memberships",
        "/ai-workout-planner", "/ar/ai-workout-planner", "/programs", "/ar/programs",
        "/exercises", "/ar/exercises", "/faq", "/ar/faq", "/authors", "/ar/authors",
        "/diet-plan", "/ar/diet-plan", "/meal-planner", "/ar/meal-planner", "/evo", "/ar/evo",
    ]

    in_cni = [u for u in dni if u in cni]
    in_commercial = [u for u in dni if u.rstrip("/") in commercial]
    in_anchor = [u for u in dni if u.replace("https://alkemos.com", "") in anchor_26]

    # 3) الخريطة الحية
    status, _, sm_body = get("https://alkemos.com/sitemap-blog.xml")
    sm_text = sm_body.decode("utf-8", "replace")
    sm_urls = set(re.findall(r"<loc>([^<]+)</loc>", sm_text))

    # 4) فحص حي لكل رابط
    live = []
    for u in dni:
        rec = {"url": u}
        try:
            st, hd, body = get(u)
            html = body.decode("utf-8", "replace")
            rec["status"] = st
            rec["redirected_to"] = hd.get("x-redirected-to") or (u if st == 200 else None)
            m = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', html) or re.search(
                r'<meta[^>]+name="canonical"[^>]+content="([^"]+)"', html)
            rec["canonical"] = m.group(1) if m else None
            rec["canonical_self"] = bool(m and m.group(1).rstrip("/") == u.rstrip("/"))
            m = re.search(r'<meta[^>]+name="robots"[^>]+content="([^"]+)"', html)
            rec["robots"] = m.group(1) if m else None
            rec["x_robots_tag"] = hd.get("x-robots-tag")
            hreflangs = re.findall(r'<link[^>]+hrefLang="([^"]+)"[^>]+href="([^"]+)"', html) or re.findall(
                r'<link[^>]+href="([^"]+)"[^>]+hrefLang="([^"]+)"', html)
            rec["hreflang_pairs"] = hreflangs[:4]
            rec["in_sitemap"] = u.rstrip("/") in {s.rstrip("/") for s in sm_urls}
            rec["cf_cache"] = hd.get("cf-cache-status")
        except Exception as ex:  # noqa: BLE001
            rec["error"] = str(ex)[:120]
        live.append(rec)

    # 5) نمط
    families = {"ar_article": 0, "ar_category": 0, "other": 0}
    for u in dni:
        p = u.replace("https://alkemos.com", "")
        if p.startswith("/ar/blog/category/"):
            families["ar_category"] += 1
        elif p.startswith("/ar/blog/"):
            families["ar_article"] += 1
        else:
            families["other"] += 1

    out = {
        "generated": "2026-11-11",
        "source": "GSC UI copy-paste from owner message (execution round 2026-11-11) — closes report 13 §1 constraint (a) / §10 item 1",
        "dni_count": len(dni),
        "overlap_with_cni_sample_1000": in_cni,
        "overlap_with_commercial_surface_100": in_commercial,
        "overlap_with_anchor_26": in_anchor,
        "families": families,
        "sitemap_blog_live_count": len(sm_urls),
        "live_check": live,
        "summary": {
            "cni_overlap": len(in_cni),
            "commercial_overlap": len(in_commercial),
            "in_sitemap_blog": sum(1 for r in live if r.get("in_sitemap")),
            "http_200": sum(1 for r in live if r.get("status") == 200),
            "self_canonical": sum(1 for r in live if r.get("canonical_self")),
            "index_follow": sum(1 for r in live if "index" in (r.get("robots") or "")),
            "no_x_robots": sum(1 for r in live if not r.get("x_robots_tag")),
        },
    }
    (RAW / "data" / "dni-match-results.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=1))
    print(json.dumps(out["summary"], ensure_ascii=False, indent=1))
    print("families:", families)
    print("CNI overlap:", in_cni)
    print("commercial overlap:", in_commercial)
    return 0


if __name__ == "__main__":
    sys.exit(main())
