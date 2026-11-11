#!/usr/bin/env python3
"""G-1 live check (READ-ONLY): all sitemap-pages URLs (212) + sentinel extras.
Captures: HTTP status, redirects, canonical, meta robots, X-Robots-Tag, title/desc/h1,
word count, hreflang pairs, TTFB, content markers. Polite rate ~0.7s. No indexing requests.
"""
import json, re, time, ssl, sys
import urllib.request, urllib.error
from html.parser import HTMLParser
import gzip, io

BASE = "https://alkemos.com"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

# --- collect target paths ---
def sitemap_paths():
    with open("/home/z/my-project/alkemos-aws/docs/seo-indexing-audit-2026-11-11/raw/sitemaps/sitemap-pages.xml", encoding="utf-8") as f:
        xml = f.read()
    locs = re.findall(r"<loc>([^<]+)</loc>", xml)
    return [u[len(BASE):] or "/" for u in locs]

SENTINEL_EXTRAS = [
    "/blog/how-to-periodize-nutrition-body-recomposition",
    "/recipes/ful-medames-with-eggs",
]

paths = sitemap_paths() + SENTINEL_EXTRAS
print(f"targets: {len(paths)} paths", flush=True)

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.text = []
        self.h1 = 0
        self.title = ""
        self.in_title = False
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript", "svg"):
            self.skip += 1
        elif tag == "h1":
            self.h1 += 1
        elif tag == "title":
            self.in_title = True
    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "svg") and self.skip:
            self.skip -= 1
        elif tag == "title":
            self.in_title = False
    def handle_data(self, data):
        if self.in_title:
            self.title += data
        elif not self.skip:
            self.text.append(data)

def fetch(url, ua=UA, head_only=False):
    req = urllib.request.Request(url, headers={
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en;q=0.9,ar;q=0.8",
        "Accept-Encoding": "gzip",
    }, method="HEAD" if head_only else "GET")
    t0 = time.time()
    try:
        r = urllib.request.urlopen(req, timeout=30)
        raw = r.read()
        ttfb_ms = round((time.time() - t0) * 1000)
        if r.headers.get("Content-Encoding") == "gzip":
            raw = gzip.decompress(raw)
        return r, raw, ttfb_ms, None
    except urllib.error.HTTPError as e:
        raw = e.read() if not head_only else b""
        return e, raw, round((time.time() - t0) * 1000), f"HTTP {e.code}"
    except Exception as e:
        return None, b"", round((time.time() - t0) * 1000), str(e)

def analyze(path):
    url = (BASE + path) if path != "/" else BASE
    r, raw, ttfb, err = fetch(url)
    rec = {"path": path, "url": url, "error": err}
    if r is None:
        return rec
    rec["status"] = r.getcode()
    rec["final_url"] = r.geturl()
    rec["redirected"] = (r.geturl().rstrip("/") != url.rstrip("/"))
    rec["ttfb_ms"] = ttfb
    rec["bytes"] = len(raw)
    hdrs = {k.lower(): v for k, v in r.headers.items()}
    rec["x_robots_tag"] = hdrs.get("x-robots-tag", "")
    rec["cache_control"] = hdrs.get("cache-control", "")
    rec["cf_cache_status"] = hdrs.get("cf-cache-status", "")
    html = raw.decode("utf-8", errors="replace")
    # canonical
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', html) or \
        re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', html)
    rec["canonical"] = m.group(1) if m else ""
    # meta robots
    m = re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']*)["\']', html) or \
        re.search(r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']robots["\']', html)
    rec["meta_robots"] = m.group(1) if m else ""
    # hreflang
    rec["hreflang"] = sorted(set(re.findall(r'hreflang=["\']([^"\']+)["\']', html)))
    # og:locale
    m = re.search(r'property=["\']og:locale["\'][^>]+content=["\']([^"\']+)["\']', html)
    rec["og_locale"] = m.group(1) if m else ""
    # title/desc
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.S)
    rec["title"] = (m.group(1).strip()[:120] if m else "")
    m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)["\']', html) or \
        re.search(r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']description["\']', html)
    rec["desc_len"] = len(m.group(1)) if m else 0
    # text extraction
    te = TextExtractor()
    try:
        te.feed(html)
        words = " ".join(te.text).split()
        rec["words"] = len(words)
        rec["h1_count"] = te.h1
        rec["title_len"] = len(te.title.strip())
    except Exception as e:
        rec["parse_error"] = str(e)
    # JSON-LD types
    rec["ld_types"] = sorted(set(re.findall(r'"@type"\s*:\s*"([^"]+)"', html)))[:12]
    return rec

results = []
t_start = time.time()
for i, p in enumerate(paths):
    rec = analyze(p)
    results.append(rec)
    if (i + 1) % 25 == 0:
        print(f"  {i+1}/{len(paths)} done ({round(time.time()-t_start)}s)", flush=True)
    time.sleep(0.55)

with open("/home/z/my-project/gsc-analysis/g1/live-pages.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=1)
print(f"saved {len(results)} records in {round(time.time()-t_start)}s")

# quick summary
from collections import Counter
sc = Counter(r.get("status") for r in results)
print("status:", dict(sc))
print("redirected:", sum(1 for r in results if r.get("redirected")))
print("non-self-canonical:", [r["path"] for r in results if r.get("canonical") and r["canonical"].rstrip("/") != r["url"].rstrip("/")])
print("x-robots-tag set:", [r["path"] for r in results if r.get("x_robots_tag")])
print("meta robots != index,follow:", [(r["path"], r.get("meta_robots")) for r in results if r.get("meta_robots") not in ("index, follow", "index,follow")])
