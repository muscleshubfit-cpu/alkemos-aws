#!/usr/bin/env python3
"""
live_google_agent_probe.py — live access probe for the Google-Agent
access audit (SEO-GROWTH-AUDIT 2026-11-18).

LIMITS (AGENTS.md audit-request budget law): ~30 requests total,
1 req/s, GET only, NO cache-busting parameters, no repeated load tests.

WHAT THIS IS:  a UA-string probe of the LIVE edge chain
(Client -> Cloudflare -> Caddy -> Next.js). It measures whether any
layer reacts to the UA STRING (block / challenge / redirect / serve).
WHAT THIS IS NOT (owner's explicit constraint): it is NOT a reliable
simulation of Google-Agent identity — manual UA spoofing never proves
origin authenticity, and a 200 here does NOT prove a verified
Google-Agent request would pass (nor would a block here prove one
would fail — the real agent comes from Google IP ranges with Web Bot
Auth signatures). Every result below is labeled "UA-string probe,
non-conclusive for identity".

Captured per request: final status, redirect count+chain, cf-ray,
cf-cache-status, cf-mitigated header (challenge indicator), server,
content-type, bytes, body challenge markers (__cf_chl /
challenge-platform / Just a moment), x-pathname (origin reached).

Output: ../live-probe-2026-11-19.json
"""
import json
import os
import re
import ssl
import time
import urllib.request
import urllib.error

BASE = "https://alkemos.com"

UAS = {
    "chrome": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
               "AppleWebKit/537.36 (KHTML, like Gecko) "
               "Chrome/130.0.0.0 Safari/537.36"),
    "googlebot": ("Mozilla/5.0 (compatible; Googlebot/2.1; "
                  "+http://www.google.com/bot.html)"),
    "google_agent_bare": "Google-Agent",
    "google_agent_browserlike": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                 "AppleWebKit/537.36 (KHTML, like Gecko) "
                                 "Chrome/130.0.0.0 Safari/537.36 "
                                 "(compatible; Google-Agent)"),
}

CHALLENGE_MARKERS = (b"__cf_chl", b"challenge-platform",
                     b"Just a moment", b"cf-challenge", b"turnstile")

# 5 core URLs x 4 UAs (20) + 5 secondary x chrome (5) + 3 api/xhr pairs (6)
CORE = [
    "/",
    "/ar",
    "/tools/calorie-calculator",
    "/foods/salmon",
    "/blog/protein-after-workout-grams-guide",
]
SECONDARY = [
    "/evo",
    "/coaching",
    "/exercises/dumbbell-bench-press-with-neutral-grip",
    "/muscles/biceps",
    "/authors",
]
APIS = [
    "/api/food-search?q=chicken%20breast",
    "/api/build-info",
    "/robots.txt",
]

plan = []
for path in CORE:
    for ua in UAS:
        plan.append((path, ua))
for path in SECONDARY:
    plan.append((path, "chrome"))
for path in APIS:
    plan.append((path, "chrome"))
    if path.startswith("/api/"):
        plan.append((path, "google_agent_browserlike"))

CTX = ssl.create_default_context()


def probe(path, ua_key):
    url = BASE + path
    req = urllib.request.Request(
        url, method="GET",
        headers={"User-Agent": UAS[ua_key],
                 "Accept": "text/html,application/xhtml+xml,application/xml;"
                           "q=0.9,*/*;q=0.8",
                 "Accept-Language": "en-US,en;q=0.9,ar;q=0.8"})
    started = time.time()
    rec = {"path": path, "ua": ua_key, "url": url}
    redirects = []
    opener = urllib.request.build_opener(
        urllib.request.HTTPRedirectHandler())
    try:
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, headers, newurl):
                redirects.append({"code": code, "location": newurl})
                return None
        opener = urllib.request.build_opener(NoRedirect)
        try:
            with opener.open(req, timeout=30) as r:
                rec["status"] = r.status
                headers = r.headers
                body = r.read()
        except urllib.error.HTTPError as e:
            rec["status"] = e.code
            headers = e.headers
            body = e.read()
    except Exception as e:  # noqa: BLE001
        rec["status"] = 0
        rec["error"] = str(e)[:200]
        rec["ms"] = int((time.time() - started) * 1000)
        return rec
    rec["ms"] = int((time.time() - started) * 1000)
    rec["redirects"] = redirects
    hdr = {k.lower(): headers.get(k) for k in
           ("CF-Ray", "CF-Cache-Status", "CF-Mitigated", "Server",
            "Content-Type", "X-Pathname", "Cache-Control")}
    rec["headers"] = {k: v for k, v in hdr.items() if v is not None}
    rec["bytes"] = len(body)
    rec["challenge_markers"] = [m.decode()
                                for m in CHALLENGE_MARKERS if m in body[:40000]]
    rec["body_sha1_head"] = __import__("hashlib").sha1(
        body[:200000]).hexdigest()[:12]
    return rec


results = []
for i, (path, ua) in enumerate(plan):
    rec = probe(path, ua)
    results.append(rec)
    print(f"[{i+1:02d}/{len(plan)}] {rec.get('status')} {ua:24s} "
          f"{path[:60]} mit={rec.get('headers', {}).get('cf-mitigated')} "
          f"cc={rec.get('headers', {}).get('cf-cache-status')}")
    time.sleep(1.0)

out = {"base": BASE, "collected_at_utc": time.strftime(
           "%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
       "total_requests": len(results),
       "method": "UA-string probe via HTTPS from audit sandbox "
                 "(non-Google IP) — NON-CONCLUSIVE for identity per "
                 "owner constraint; measures UA-based edge/WAF/origin "
                 "reactions only",
       "results": results}
path_out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                        "live-probe-2026-11-19.json")
with open(path_out, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("saved ->", os.path.normpath(path_out))
