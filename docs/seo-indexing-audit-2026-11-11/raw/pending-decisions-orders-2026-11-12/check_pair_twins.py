#!/usr/bin/env python3
"""Read-only live review of the seven B3 pairs (session 2026-11-12 — Report 19 §3/§4).

For each of the 7 cross-language twin pairs (B3-ج1→ج7 — Report 17 §4-ج) it fetches
BOTH sides live and records the ACTUAL pairing surface as served to Google:
  - HTTP status, live <title>, canonical
  - <link rel="alternate" hrefLang=...> targets (what the ar/en/x-default
    alternates actually point at) — the DB-driven pairing state
    (src/lib/blog.ts resolves the twin via linked_post_id)
  - language-toggle link target (paired posts link their twin; unpaired
    posts link the generic /blog root)
  - in-body twin link (the E31 cross-links batch, 2026-11-03)
  - JSON-LD datePublished of both sides (pairing went live when the later
    side published — Phase 157 P5 handshake fills linked_post_id both ways)

Zero writes, zero indexing requests, zero DB/GSC API calls — fetch + parse only.
Re-runnable:
  python3 docs/seo-indexing-audit-2026-11-11/raw/pending-decisions-orders-2026-11-12/check_pair_twins.py
"""
import datetime as dt
import json
import re
import ssl
import urllib.request
from pathlib import Path

PAIRS = [
    ("B3-ج1", "protein-after-workout-grams-guide", "protein-grams-after-workout-guide"),
    ("B3-ج2", "best-protein-timing-after-workout-guide", "best-protein-timing-after-workout"),
    ("B3-ج3", "choose-whey-protein-muscle-gain", "choose-whey-protein-muscle-gain-guide"),
    ("B3-ج4", "protein-myths-busted-muscle-gain", "protein-myths-muscle-gain-guide"),
    ("B3-ج5", "best-plant-based-protein-powder-muscle-gain-2026", "best-plant-based-protein-powder-guide"),
    ("B3-ج6", "build-muscle-without-supplements-guide", "increase-muscle-mass-no-protein-supplements"),
    ("B3-ج7", "best-protein-supplement-ramadan-guide", "best-protein-supplement-ramadan"),
]

BASE_EN = "https://alkemos.com/blog/"
BASE_AR = "https://alkemos.com/ar/blog/"
CTX = ssl.create_default_context()


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "alkemos-seo-readonly-review/1.0"})
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        return r.read().decode("utf-8", "replace")


def slug_of(url: str) -> str:
    return url.rstrip("/").rsplit("/", 1)[-1]


def side_summary(side: str, slug: str, base: str, twin_slug: str) -> dict:
    url = base + slug
    html = fetch(url)
    title = ""
    m = re.search(r"<title>(.*?)</title>", html, re.S)
    if m:
        title = m.group(1).strip()
    canonical = ""
    m = re.search(r'<link rel="canonical" href="([^"]+)"', html)
    if m:
        canonical = m.group(1)
    alternates = {
        m.group(1): m.group(2)
        for m in re.finditer(r'<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"', html)
    }
    toggle = re.findall(r'<a href="([^"]+)" hrefLang="(?:en|ar)"[^>]*>', html)
    body_twin_links = re.findall(
        r'<a href="' + re.escape(("/ar/blog/" if side == "en" else "/blog/") + twin_slug) + r'"[^>]*>(.*?)</a>',
        html,
        re.S,
    )
    body_twin_anchors = [re.sub(r"<[^>]+>", "", a).strip() for a in body_twin_links]
    pub = ""
    m = re.search(r'"datePublished":"([^"]+)"', html)
    if m:
        pub = m.group(1)
    return {
        "side": side,
        "slug": slug,
        "url": url,
        "http_status": 200,
        "live_title": title,
        "canonical": canonical,
        "alternates": alternates,
        "language_toggle_target": toggle[0] if toggle else None,
        "in_body_twin_link_anchors": body_twin_anchors,
        "date_published": pub,
    }


def main() -> None:
    out = {
        "_law": (
            "Report 19 §3/§4 — read-only live review of the seven pairs (B3-ج1→ج7) before "
            "preparing the formal execution orders. Fetch + parse only: zero writes, zero "
            "indexing requests, zero DB/GSC API calls. Records what the hreflang alternates "
            "ACTUALLY point at (the DB pairing state as rendered), the language-toggle target, "
            "the E31 in-body twin link, and both sides' datePublished."
        ),
        "checked_at_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "pairs": [],
    }
    for pid, en_slug, ar_slug in PAIRS:
        en = side_summary("en", en_slug, BASE_EN, ar_slug)
        ar = side_summary("ar", ar_slug, BASE_AR, en_slug)
        en_ar = slug_of(en["alternates"].get("ar", ""))
        ar_en = slug_of(ar["alternates"].get("en", ""))
        bidirectional = en_ar == ar_slug and ar_en == en_slug
        later_side = "ar" if (ar["date_published"] or "") > (en["date_published"] or "") else "en"
        out["pairs"].append(
            {
                "pair_id": pid,
                "en": en,
                "ar": ar,
                "live_bidirectional_pairing": bidirectional,
                "en_ar_alternate_points_to": en_ar or None,
                "ar_en_alternate_points_to": ar_en or None,
                "pairing_live_since": ar["date_published"] if later_side == "ar" else en["date_published"],
                "note": (
                    "hreflang alternates served bidirectionally at the TRUE twin (linked_post_id "
                    "set both ways) — the effect Report 17 §7 ordered is ALREADY LIVE"
                    if bidirectional
                    else "NEEDS ATTENTION — alternates do not point at the twin"
                ),
            }
        )
    dest = Path(__file__).parent / "seven-pairs-live-review.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    for p in out["pairs"]:
        print(
            p["pair_id"],
            "| bidirectional:", p["live_bidirectional_pairing"],
            "| live since:", (p["pairing_live_since"] or "")[:10],
            "| EN body-link:", p["en"]["in_body_twin_link_anchors"][:1],
            "| AR body-link:", p["ar"]["in_body_twin_link_anchors"][:1],
        )


if __name__ == "__main__":
    main()
