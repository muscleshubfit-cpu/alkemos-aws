#!/usr/bin/env python3
"""B3 — Protein-family intent audit (read-only live + repo-truth analysis).

Law (report 15 §5-B3): a decisions report for the owner — table of intent
per family article (EN + AR mirrors), grounded in real search questions
(GSC queries per article where available) + the retro-pair decision log.
NO merges, NO 301s, NO pairing applications — every recommendation stays
an owner decision naming the pair.

Inputs:
  Live (read-only GETs): sitemap-blog.xml + each family article page
  (title / meta description / HTTP status).
  Repo truth: scripts/retro-pair-blog.pairs.json (pair decisions log).
  GSC owner export (3 months to 2026-11-11):
    /home/z/my-project/gsc-data/performance/Pages.csv
    /home/z/my-project/gsc-data/performance/Queries.csv
  Title snapshots (2026-11-12, B2 session):
    /home/z/my-project/gsc-data/en-titles.json · ar-titles.json

Outputs (next to this script):
  family-intent-table.json  (26 rows: dimension/audience/question/pairing/GSC)
  protein-queries-gsc.json  (protein-related query subset, EN + AR)
"""
import json
import re
import ssl
import sys
import time
import urllib.request

REPO = "/home/z/my-project/alkemos-aws"
GSC = "/home/z/my-project/gsc-data"
OUT = f"{REPO}/docs/seo-indexing-audit-2026-11-11/raw/b3-protein-intent-audit-2026-11-12"

UA = "Mozilla/5.0 (compatible; AlkemosSEOAudit/1.0; read-only)"
CTX = ssl.create_default_context()

# Family membership rule (documented in report 17 §2): the article's PRIMARY
# question is about protein itself — dose / timing / source-choice / myths /
# distribution / supplement-dependence. Protein as a qualifier of another
# primary topic (meal ideas, fat loss, recomposition, a specific food) is
# adjacent, NOT family.
EN_FAMILY = [
    "beef-protein-vs-whey-isolate-muscle-comparison",  # source comparison
    "best-plant-based-protein-powder-muscle-gain-2026",  # source choice (plant)
    "best-protein-supplement-ramadan-guide",  # source choice (Ramadan)
    "best-protein-timing-after-workout-guide",  # timing
    "build-muscle-without-supplements-guide",  # supplement dependence
    "choose-whey-protein-muscle-gain",  # source choice (whey types)
    "protein-after-workout-grams-guide",  # dose (post-workout)
    "protein-calculator-women-muscle-gain",  # dose (women)
    "protein-myths-busted-muscle-gain",  # myths
    "protein-needs-ozempic-glp1-calculator-guide",  # dose (GLP-1)
    "protein-per-day-muscle-build-plan",  # dose (general)
    "whey-protein-dosage-muscle-gain",  # dose (whey total)
]
AR_FAMILY = [
    "best-plant-based-protein-powder-guide",  # source choice (plant)
    "best-protein-supplement-ramadan",  # source choice (Ramadan, athletes)
    "best-protein-supplement-women-ramadan",  # source choice (Ramadan, women)
    "best-protein-timing-after-workout",  # timing
    "choose-whey-protein-muscle-gain-guide",  # source choice (whey types)
    "choose-whey-protein-ramadan-women",  # source choice (whey, Ramadan, women)
    "compare-whey-soy-protein-athletes",  # source comparison (whey vs soy)
    "how-to-calc-daily-protein-athletes",  # dose (athletes)
    "increase-muscle-mass-no-protein-supplements",  # supplement dependence
    "protein-distribution-daily-meals-muscle-building",  # distribution
    "protein-grams-after-workout-guide",  # dose (post-workout)
    "protein-intake-calculator-muscle-build",  # dose (general)
    "protein-myths-muscle-gain-guide",  # myths
    "protein-supplements-veg-animal-comparison",  # source comparison (veg vs animal)
]
# Boundary (documented, not family): /ar/blog/healthy-high-protein-meals-office
# = quick-meals question (protein is a qualifier) — retro-PAIRED to
# /blog/quick-healthy-meal-ideas-busy-people (applied pair #3).


def http_get(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        return r.status, r.read().decode("utf-8", "replace")


def extract_meta(html: str) -> dict:
    t = re.search(r"<title>([^<]+)</title>", html)
    d = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html)
    c = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"', html)
    return {
        "title": t.group(1).strip() if t else None,
        "description": d.group(1).strip() if d else None,
        "canonical": c.group(1) if c else None,
    }


def read_csv(path):
    import csv
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    hdr = rows[0]
    return [dict(zip(hdr, r)) for r in rows[1:] if len(r) == len(hdr)]


def main() -> int:
    # ---- 1. live sitemap (read-only) ----
    st, sm = http_get("https://alkemos.com/sitemap-blog.xml")
    sm_urls = re.findall(r"<loc>([^<]+)</loc>", sm)
    en_sm = {u.rsplit("/", 1)[1] for u in sm_urls if re.match(r"https://alkemos\.com/blog/[^/]+$", u)}
    ar_sm = {u.rsplit("/", 1)[1] for u in sm_urls if re.match(r"https://alkemos\.com/ar/blog/[^/]+$", u)}
    print(f"live sitemap-blog.xml: HTTP {st} · EN {len(en_sm)} + AR {len(ar_sm)} = {len(en_sm)+len(ar_sm)}")

    # ---- 2. per-article live fetch (read-only GETs) ----
    snapshots = {
        "en": json.load(open(f"{GSC}/en-titles.json", encoding="utf-8")),
        "ar": json.load(open(f"{GSC}/ar-titles.json", encoding="utf-8")),
    }
    pages_csv = read_csv(f"{GSC}/performance/Pages.csv")
    gsc_by_url = {p["Top pages"]: p for p in pages_csv}

    family = []
    for lang, slugs, base in (("en", EN_FAMILY, "https://alkemos.com/blog/"),
                              ("ar", AR_FAMILY, "https://alkemos.com/ar/blog/")):
        for slug in slugs:
            url = base + slug
            in_sitemap = slug in (en_sm if lang == "en" else ar_sm)
            try:
                st, html = http_get(url)
                meta = extract_meta(html)
                meta["http_status"] = st
            except Exception as e:  # honest failure record
                meta = {"http_status": None, "error": repr(e)}
            g = gsc_by_url.get(url)
            snap = snapshots[lang].get(("/blog/" if lang == "en" else "/ar/blog/") + slug)
            family.append({
                "lang": lang,
                "slug": slug,
                "url": url,
                "in_live_sitemap": in_sitemap,
                "live": {
                    "http_status": meta.get("http_status"),
                    "title": meta.get("title"),
                    "description": meta.get("description"),
                    "canonical": meta.get("canonical"),
                },
                "snapshot_2026_11_12": {"title": snap[0], "excerpt": snap[1]} if snap else None,
                "gsc_3mo": {
                    "impressions": int(g["Impressions"]),
                    "clicks": int(g["Clicks"]),
                    "position": float(g["Position"]),
                } if g else None,
            })
            time.sleep(0.4)  # politeness

    # ---- 3. pairing status (repo truth) ----
    pairs = json.load(open(f"{REPO}/scripts/retro-pair-blog.pairs.json", encoding="utf-8"))
    def pairing_of(slug):
        hits = []
        for section in ("pairs", "reviewPairs", "deadPairs"):
            for p in pairs.get(section, []):
                if slug in (p.get("enSlug"), p.get("arSlug")):
                    hits.append({
                        "section": section,
                        "enSlug": p["enSlug"],
                        "arSlug": p["arSlug"],
                        "topic": p.get("topic"),
                        "note": p.get("why") or p.get("whyDifferent") or p.get("record_note"),
                        "decision": p.get("decision"),
                    })
        return hits
    for a in family:
        a["pairing_decisions"] = pairing_of(a["slug"])

    # ---- 4. protein-related GSC queries (aggregate; the export has no
    #         page×query matrix — documented limitation) ----
    queries_csv = read_csv(f"{GSC}/performance/Queries.csv")
    prot_q = [q for q in queries_csv
              if re.search(r"protein|whey|بروتين|واي ", q["Top queries"], re.I)]
    prot_q.sort(key=lambda q: -int(q["Impressions"]))
    queries_out = [{
        "query": q["Top queries"],
        "clicks": int(q["Clicks"]),
        "impressions": int(q["Impressions"]),
        "position": float(q["Position"]),
    } for q in prot_q]

    with open(f"{OUT}/family-intent-table.json", "w", encoding="utf-8") as f:
        json.dump(family, f, ensure_ascii=False, indent=2)
    with open(f"{OUT}/protein-queries-gsc.json", "w", encoding="utf-8") as f:
        json.dump(queries_out, f, ensure_ascii=False, indent=2)

    # ---- 5. console summary ----
    live_ok = sum(1 for a in family if a["live"]["http_status"] == 200)
    sm_ok = sum(1 for a in family if a["in_live_sitemap"])
    gsc_meas = sum(1 for a in family if a["gsc_3mo"])
    print(f"family rows: {len(family)} · live 200: {live_ok} · in live sitemap: {sm_ok}")
    print(f"family pages with measured GSC impressions: {gsc_meas}")
    print(f"protein-related aggregate queries: {len(queries_out)} "
          f"({sum(q['impressions'] for q in queries_out)} impressions)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
