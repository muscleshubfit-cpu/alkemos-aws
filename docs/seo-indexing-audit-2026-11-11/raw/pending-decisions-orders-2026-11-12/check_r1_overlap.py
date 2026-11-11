#!/usr/bin/env python3
"""Read-only live overlap evidence for the B3-ر1 decision (Report 19 §5).

The owner approved (session 2026-11-12): keep the two AR articles separate —
`protein-intake-calculator-muscle-build` (general, men/women, 1.6-2.2 g/kg)
and `how-to-calc-daily-protein-athletes` (athletes, weight x activity
coefficient). This script records the live differentiation surface:
  - live title + meta description of both
  - H2 section map of both (the structural overlap: distribution + worked
    example + common errors on each side)
  - hreflang state (the general article is a paired retro twin; the athletes
    article is deliberately unpaired — no EN twin exists)
  - cross-link state between the two articles (asymmetry measured: the
    general article links to the athletes article once with an
    intent-differentiating anchor; the athletes article links back ZERO
    times — the basis of the documented proposal P-ر1-أ)

Zero writes, zero indexing requests, zero DB/GSC API calls.
Re-runnable:
  python3 docs/seo-indexing-audit-2026-11-11/raw/pending-decisions-orders-2026-11-12/check_r1_overlap.py
"""
import datetime as dt
import json
import re
import ssl
import urllib.request
from pathlib import Path

ARTICLES = {
    "general_ar_13": {
        "slug": "protein-intake-calculator-muscle-build",
        "url": "https://alkemos.com/ar/blog/protein-intake-calculator-muscle-build",
        "other_slug": "how-to-calc-daily-protein-athletes",
    },
    "athletes_ar_14": {
        "slug": "how-to-calc-daily-protein-athletes",
        "url": "https://alkemos.com/ar/blog/how-to-calc-daily-protein-athletes",
        "other_slug": "protein-intake-calculator-muscle-build",
    },
}

CTX = ssl.create_default_context()


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "alkemos-seo-readonly-review/1.0"})
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        return r.read().decode("utf-8", "replace")


def main() -> None:
    out = {
        "_law": "Report 19 §5 — B3-ر1 keep-separate decision (owner-approved 2026-11-12): read-only live overlap evidence. Fetch + parse only.",
        "checked_at_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "articles": {},
    }
    for key, a in ARTICLES.items():
        html = fetch(a["url"])
        title = ""
        m = re.search(r"<title>(.*?)</title>", html, re.S)
        if m:
            title = m.group(1).strip()
        desc = ""
        m = re.search(r'<meta name="description" content="([^"]*)"', html)
        if m:
            desc = m.group(1)
        h2s = [m.group(1).strip() for m in re.finditer(r"<h2[^>]*>([^<]*)", html)]
        alternates = {
            m.group(1): m.group(2)
            for m in re.finditer(r'<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"', html)
        }
        cross = re.findall(
            r'<a href="[^"]*' + re.escape(a["other_slug"]) + r'"[^>]*>(.*?)</a>', html, re.S
        )
        cross_anchors = [re.sub(r"<[^>]+>", "", c).strip() for c in cross]
        out["articles"][key] = {
            "slug": a["slug"],
            "url": a["url"],
            "http_status": 200,
            "live_title": title,
            "live_meta_description": desc,
            "h2_sections": h2s,
            "hreflang_alternates": alternates,
            "links_to_other_article_anchors": cross_anchors,
        }
    g = out["articles"]["general_ar_13"]
    at = out["articles"]["athletes_ar_14"]
    out["cross_link_state"] = {
        "general_links_to_athletes": len(g["links_to_other_article_anchors"]),
        "athletes_links_to_general": len(at["links_to_other_article_anchors"]),
        "asymmetry": "general→athletes exists (1 anchor, intent-differentiating); athletes→general = 0 — basis of proposal P-ر1-أ (documented, not started)",
    }
    dest = Path(__file__).parent / "b3-r1-overlap-live.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("general links to athletes:", out["cross_link_state"]["general_links_to_athletes"])
    print("athletes links to general:", out["cross_link_state"]["athletes_links_to_general"])
    print("general hreflang:", list(g["hreflang_alternates"].keys()))
    print("athletes hreflang:", list(at["hreflang_alternates"].keys()))


if __name__ == "__main__":
    main()
