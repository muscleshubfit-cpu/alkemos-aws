#!/usr/bin/env python3
"""phase3_tavily_exa.py — Phase-3 live search comparison: Tavily vs Exa.

Owner order 2026-10-30 §3-أ: 8 unified queries (4 AR + 4 EN) per provider,
measuring per call: API success + latency, actual result count, domain
diversity + source quality, authority-domain hits (the 14-domain list),
Arabic result quality/relevance, extraction depth (raw_content / contents),
and actual credit consumption where verifiable.

Tavily: basic search (1 credit) ×8 + 2 include_domains probes (the
authority-restriction behavior Phase-2 §8-أ asked for) + /usage before and
after (real credit consumption when the endpoint answers).
Exa: search ×8 (top-10) + full-text /contents extraction of the TOP-3
results of every query (owner order §3-أ last bullet). Cost recorded as
[official-rate calc]: $4/1k searches + $1/1k content pages.

Isolation: test queries only, no production path touched, no customer data,
secrets read from env and never printed.
"""

from __future__ import annotations

import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from phase3_common import (  # noqa: E402
    AUTHORITY_DOMAINS, UNIFIED_QUERIES, arabic_ratio, authority_hits,
    domain_of, emit, http_json, is_arabic, key_prefix,
)

TAVILY_KEY = os.environ.get("TAVILY_API_KEY", "")
EXA_KEY = os.environ.get("EXA_API_KEY", "")

TAVILY_SEARCH = "https://api.tavily.com/search"
TAVILY_USAGE = "https://api.tavily.com/usage"
EXA_SEARCH = "https://api.exa.ai/search"
EXA_CONTENTS = "https://api.exa.ai/contents"

SLEEP = 1.0  # 1 req/s — far under Exa's 10 QPS and Tavily's RPM


def _tavily_headers():
    return {"Authorization": f"Bearer {TAVILY_KEY}",
            "Content-Type": "application/json"}


def _exa_headers():
    return {"x-api-key": EXA_KEY, "Content-Type": "application/json"}


def _clip(s: str, n: int = 220) -> str:
    s = (s or "").replace("\n", " ").strip()
    return s if len(s) <= n else s[:n] + "…"


def tavily_usage(label: str) -> dict:
    """Try GET then POST /usage — real credit meter when available."""
    for method in ("GET", "POST"):
        rec = http_json(method, TAVILY_USAGE, _tavily_headers(), {} if method == "POST" else None)
        if rec["ok"] and isinstance(rec["json"], dict):
            return {"endpoint_method": method, "ok": True, "payload": rec["json"]}
        time.sleep(0.4)
    return {"endpoint_method": "GET+POST", "ok": False,
            "note": "/usage did not answer 200 — credit delta NOT verifiable "
                    "via API this run (dashboard is owner-side)"}


def tavily_search(query: dict, include_domains=None) -> dict:
    body = {
        "query": query["q"],
        "search_depth": "basic",           # 1 credit (official credit table)
        "max_results": 10,
        "include_answer": False,
        "include_raw_content": True,
        "include_domains": include_domains or [],
    }
    rec = http_json("POST", TAVILY_SEARCH, _tavily_headers(), body, timeout=90)
    out = {"qid": query["id"], "lang": query["lang"], "query": query["q"],
           "ok": rec["ok"], "status": rec["status"],
           "latency_ms": rec["latency_ms"], "error": rec["error"],
           "results": []}
    data = rec["json"] or {}
    res = data.get("results") or []
    urls = [r.get("url", "") for r in res]
    out["n_results"] = len(res)
    out["n_unique_domains"] = len({domain_of(u) for u in urls if u})
    out["authority_hits"] = authority_hits(urls)
    if query["lang"] == "ar":
        out["n_arabic_results"] = sum(
            1 for r in res
            if is_arabic((r.get("title") or "") + " " + (r.get("content") or "")))
    for r in res:
        out["results"].append({
            "url": r.get("url", ""),
            "domain": domain_of(r.get("url", "")),
            "title": _clip(r.get("title"), 160),
            "snippet_len": len(r.get("content") or ""),
            "raw_len": len(r.get("raw_content") or "") if r.get("raw_content") else 0,
            "score": r.get("score"),
            "arabic": bool(is_arabic((r.get("title") or "") + " " + (r.get("content") or ""))),
            "snippet_head": _clip(r.get("content")),
        })
    if include_domains:
        out["include_domains_probe"] = True
    time.sleep(SLEEP)
    return out


def exa_search(query: dict) -> dict:
    body = {"query": query["q"], "numResults": 10, "type": "auto"}
    rec = http_json("POST", EXA_SEARCH, _exa_headers(), body, timeout=90)
    out = {"qid": query["id"], "lang": query["lang"], "query": query["q"],
           "ok": rec["ok"], "status": rec["status"],
           "latency_ms": rec["latency_ms"], "error": rec["error"],
           "results": []}
    data = rec["json"] or {}
    res = data.get("results") or []
    urls = [r.get("url", "") for r in res]
    out["n_results"] = len(res)
    out["n_unique_domains"] = len({domain_of(u) for u in urls if u})
    out["authority_hits"] = authority_hits(urls)
    if query["lang"] == "ar":
        out["n_arabic_results"] = sum(
            1 for r in res
            if is_arabic((r.get("title") or "") + " " + (r.get("text") or "")))
    for r in res:
        out["results"].append({
            "url": r.get("url", ""),
            "domain": domain_of(r.get("url", "")),
            "title": _clip(r.get("title"), 160),
            "published": r.get("publishedDate"),
            "score": r.get("score"),
            "author": r.get("author"),
            "arabic": bool(is_arabic((r.get("title") or "") + " " + (r.get("text") or ""))),
        })
    out["top3_urls"] = urls[:3]
    time.sleep(SLEEP)
    return out


def exa_contents(qid: str, urls: list) -> dict:
    """Full-text extraction of the top-3 results (owner order §3-أ).

    Primary shape (docs.exa.ai/reference/contents): {"ids": [...],
    "text": {"maxCharacters": N}}; on 4xx we retry the documented
    alternates once each and record which shape actually answered.
    """
    shapes = [
        {"ids": urls, "text": {"maxCharacters": 5000}},
        {"ids": urls, "text": True},
        {"ids": urls, "contents": {"text": {"maxCharacters": 5000}}},
    ]
    used_shape = None
    rec = None
    for i, body in enumerate(shapes):
        rec = http_json("POST", EXA_CONTENTS, _exa_headers(), body, timeout=120)
        if rec["ok"]:
            used_shape = i
            break
        if rec["status"] not in (400, 422):
            break  # real transport/auth error — do not retry other shapes
        time.sleep(0.8)
    out = {"qid": qid, "ok": rec["ok"], "status": rec["status"],
           "latency_ms": rec["latency_ms"], "error": rec["error"],
           "request_shape_index": used_shape,
           "request_shape_used": ("ids+text{maxCharacters}" if used_shape == 0 else
                                  "ids+text:true" if used_shape == 1 else
                                  "ids+contents.text" if used_shape == 2 else
                                  "none — all shapes failed"),
           "pages": []}
    data = (rec["json"] or {}) if rec["json"] else {}
    for r in (data.get("results") or []):
        text = r.get("text") or ""
        out["pages"].append({
            "url": r.get("url", ""),
            "domain": domain_of(r.get("url", "")),
            "text_len": len(text),
            "text_head": _clip(text, 400),
        })
    out["n_pages_extracted"] = len(out["pages"])
    out["sum_text_len"] = sum(p["text_len"] for p in out["pages"])
    time.sleep(SLEEP)
    return out


def main() -> int:
    started = time.time()
    print(f"=== Phase-3 Tavily/Exa comparison — started (ts {int(started)}) ===")
    print(f"TAVILY_API_KEY present: {bool(TAVILY_KEY)} "
          f"(prefix {key_prefix('TAVILY_API_KEY')})")
    print(f"EXA_API_KEY present: {bool(EXA_KEY)} "
          f"(prefix {key_prefix('EXA_API_KEY')})")
    payload = {"provider": "tavily+exa", "queries": UNIFIED_QUERIES,
               "tavily": None, "exa": None}

    # ── Tavily ────────────────────────────────────────────────────────────
    if TAVILY_KEY:
        print("\n--- Tavily: usage(before) → 8 basic searches → 2 authority "
              "probes → usage(after) ---")
        usage_before = tavily_usage("before")
        print("usage(before):", usage_before.get("ok"), usage_before.get("payload") or usage_before.get("note"))
        searches = [tavily_search(q) for q in UNIFIED_QUERIES]
        probes = [
            tavily_search(UNIFIED_QUERIES[0], AUTHORITY_DOMAINS),
            tavily_search(UNIFIED_QUERIES[4], AUTHORITY_DOMAINS),
        ]
        usage_after = tavily_usage("after")
        ok = sum(1 for s in searches if s["ok"])
        lat = [s["latency_ms"] for s in searches if s["latency_ms"]]
        print(f"Tavily: {ok}/8 searches ok · authority probes done · "
              f"avg latency {sum(lat)//max(len(lat),1)}ms")
        payload["tavily"] = {
            "key_present": True, "key_prefix": key_prefix("TAVILY_API_KEY"),
            "usage_before": usage_before, "usage_after": usage_after,
            "searches": searches, "authority_probes": probes,
            "credits": {"rule": "basic=1 credit/call (official table)",
                        "calls_made": 10,
                        "api_reported_delta": None},
        }
        try:  # real consumption only if the meter answered twice
            b = usage_before.get("payload") or {}
            a = usage_after.get("payload") or {}

            def _cu(d):  # credits_used may sit under key.usage or .key
                k = d.get("key") or d
                for cand in (k.get("usage") or {}, k):
                    if isinstance(cand, dict) and isinstance(
                            cand.get("credits_used"), (int, float)):
                        return cand["credits_used"]
                return None

            cb, ca = _cu(b), _cu(a)
            if cb is not None and ca is not None:
                payload["tavily"]["credits"]["api_reported_delta"] = ca - cb
                print(f"CREDIT DELTA MEASURED VIA /usage: {ca - cb} "
                      f"({cb} → {ca})")
            else:
                print("credit delta not derivable from /usage payloads "
                      "(recorded as-is above)")
        except Exception as e:
            print("credit-delta parse error:", type(e).__name__)
    else:
        print("Tavily SKIPPED — no key")
        payload["tavily"] = {"key_present": False, "status": "SKIPPED-no-key"}

    # ── Exa ───────────────────────────────────────────────────────────────
    if EXA_KEY:
        print("\n--- Exa: 8 searches → /contents full-text of top-3 each ---")
        searches = []
        contents = []
        for q in UNIFIED_QUERIES:
            s = exa_search(q)
            searches.append(s)
            print(f"  {q['id']}: ok={s['ok']} n={s['n_results']} "
                  f"auth={len(s['authority_hits'])} {s['latency_ms']}ms")
            if s["ok"] and s.get("top3_urls"):
                c = exa_contents(q["id"], s["top3_urls"])
                contents.append(c)
                print(f"    contents: ok={c['ok']} pages={c['n_pages_extracted']} "
                      f"chars={c['sum_text_len']} shape={c['request_shape_used']}")
        ok = sum(1 for s in searches if s["ok"])
        n_pages = sum(c["n_pages_extracted"] for c in contents)
        # [official-rate calc] — NOT a meter reading
        cost_calc = round(ok * 4 / 1000 + n_pages * 1 / 1000, 4)
        payload["exa"] = {
            "key_present": True, "key_prefix": key_prefix("EXA_API_KEY"),
            "searches": searches, "contents": contents,
            "cost_calc_usd": {"search_calls": ok, "content_pages": n_pages,
                              "rates": "$4/1k searches · $1/1k content pages",
                              "estimated_cost_usd": cost_calc,
                              "tag": "[official-rate calc, not a meter]"},
        }
        print(f"Exa: {ok}/8 searches ok · {n_pages} pages extracted · "
              f"cost calc ≈ ${cost_calc}")
    else:
        print("Exa SKIPPED — no key")
        payload["exa"] = {"key_present": False, "status": "SKIPPED-no-key"}

    payload["duration_s"] = round(time.time() - started, 1)
    emit("tavily_exa", payload)
    print(f"\n=== Phase-3 Tavily/Exa done in {payload['duration_s']}s ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
