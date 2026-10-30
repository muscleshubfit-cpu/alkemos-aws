#!/usr/bin/env python3
"""phase3_common.py — shared helpers for the AI-providers Phase-3 live tests.

Owner order 2026-10-30 (Phase 3: live tests + numeric comparison).
DISCIPLINE (AGENTS.md §3.2 + the phase order):
  * NEVER print a secret value — env keys are read but only their
    PRESENCE (and an 8-char non-secret prefix where useful) is reported.
  * Failures are MEASUREMENTS: every HTTP error is recorded with its
    real status/body and the run continues (honest, never fabricated).
  * stdlib only — no dependencies, runs on ubuntu-latest python3.
"""

from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse

# ── The project's 14 approved authority domains ──────────────────────────
# SINGLE SOURCE: src/lib/blog-editorial-law.ts (EDITORIAL_AUTHORITY_DOMAINS,
# law 298/302). Duplicated here because the test runs standalone in Actions;
# any drift is caught by the report citing the law file as the source.
AUTHORITY_DOMAINS = [
    "who.int",
    "ncbi.nlm.nih.gov",
    "pubmed.ncbi.nlm.nih.gov",
    "ods.od.nih.gov",
    "nccih.nih.gov",
    "cdc.gov",
    "mayoclinic.org",
    "acsm.org",
    "issn-online.org",
    "nsca.com",
    "health.gov",
    "nasm.org",
    "acefitness.org",
    "eatright.org",
]

# The 8 unified queries (4 AR + 4 EN) — sports nutrition / muscle building /
# supplements, the site's domain. Identical for Tavily and Exa (fair fight)
# and reused for the model-quality prompts where noted.
UNIFIED_QUERIES = [
    {"id": "AR1", "lang": "ar",
     "q": "كم جرام بروتين يحتاجه لاعب كمال الأجسام يوميًا لكل كيلوجرام من وزن الجسم لبناء العضلات؟"},
    {"id": "AR2", "lang": "ar",
     "q": "ما الجرعة الآمنة الشائعة لمكمل الكرياتين مونوهيدرات لبناء العضلات وهل له أضرار على الكلى؟"},
    {"id": "AR3", "lang": "ar",
     "q": "هل الإفراط في مكملات البروتين ضار بصحة الكلى عند الأصحاء؟ الأدلة العلمية"},
    {"id": "AR4", "lang": "ar",
     "q": "فوائد أوميغا 3 للاعبي رفع الأثقال والتعافي العضلي بعد التمرين"},
    {"id": "EN1", "lang": "en",
     "q": "how much protein per day per kg body weight to build muscle evidence"},
    {"id": "EN2", "lang": "en",
     "q": "creatine monohydrate dosage safety kidney side effects evidence"},
    {"id": "EN3", "lang": "en",
     "q": "are high protein supplements safe for kidneys in healthy adults research"},
    {"id": "EN4", "lang": "en",
     "q": "omega-3 fish oil benefits for strength training athletes recovery"},
]

_ARABIC_RE = re.compile(r"[\u0600-\u06FF]")


def arabic_ratio(text: str) -> float:
    """Fraction of Arabic letters among letters — 0.0 for non-Arabic text."""
    if not text:
        return 0.0
    letters = re.sub(r"[^\w]", "", text, flags=re.UNICODE)
    if not letters:
        return 0.0
    return len(_ARABIC_RE.findall(letters)) / len(letters)


def is_arabic(text: str) -> bool:
    return arabic_ratio(text) >= 0.30


def domain_of(url: str) -> str:
    try:
        netloc = urlparse(url).netloc.lower()
        return netloc[4:] if netloc.startswith("www.") else netloc
    except Exception:
        return ""


def authority_hits(urls) -> list:
    hits = []
    for u in urls or []:
        d = domain_of(u)
        if d in AUTHORITY_DOMAINS or any(
            d == a or d.endswith("." + a) for a in AUTHORITY_DOMAINS
        ):
            hits.append(d)
    return hits


# header whitelist for printing — numeric quota/latency metadata ONLY,
# never anything that could echo a credential back.
_HEADER_WHITELIST = re.compile(
    r"(ratelimit|rate-limit|limit-|remaining|reset|retry|x-endpoint|x-model"
    r"|cf-ai|cf-ray|server-timing|x-request|x-runtime|quota|usage)",
    re.IGNORECASE,
)


def printable_headers(headers) -> dict:
    out = {}
    try:
        items = headers.items()
    except Exception:
        return out
    for k, v in items:
        if _HEADER_WHITELIST.search(k):
            sv = str(v)
            out[k] = sv if len(sv) <= 80 else sv[:80] + "…"
    return out


def http_json(method: str, url: str, headers: dict, body: dict | None = None,
              timeout: int = 120) -> dict:
    """One HTTP JSON call. Returns a measurement record — never raises.

    Record: {ok, status, latency_ms, headers, json, error, body_head}
    """
    started = time.time()
    data = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    rec = {"ok": False, "status": None, "latency_ms": None,
           "headers": {}, "json": None, "error": None, "body_head": None}
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            rec["status"] = resp.status
            raw = resp.read()
            rec["headers"] = printable_headers(resp.headers)
            rec["latency_ms"] = round((time.time() - started) * 1000)
            try:
                rec["json"] = json.loads(raw.decode("utf-8", "replace"))
                rec["ok"] = 200 <= resp.status < 300
            except Exception:
                rec["body_head"] = raw[:400].decode("utf-8", "replace")
                rec["ok"] = False
                rec["error"] = "non-JSON response body"
    except urllib.error.HTTPError as e:
        rec["status"] = e.code
        try:
            raw = e.read()
        except Exception:
            raw = b""
        rec["headers"] = printable_headers(e.headers)
        rec["latency_ms"] = round((time.time() - started) * 1000)
        try:
            rec["json"] = json.loads(raw.decode("utf-8", "replace"))
        except Exception:
            rec["body_head"] = raw[:400].decode("utf-8", "replace")
        rec["error"] = f"HTTP {e.code}"
    except Exception as e:  # timeouts, DNS, TLS…
        rec["latency_ms"] = round((time.time() - started) * 1000)
        rec["error"] = f"{type(e).__name__}: {e}"
    return rec


def jaccard(a: str, b: str) -> float:
    sa = set(a.split())
    sb = set(b.split())
    if not sa and not sb:
        return 1.0
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def emit(provider: str, payload: dict) -> None:
    """Print the machine-readable block this run's log is parsed by."""
    print(f"=====PHASE3_JSON_BEGIN:{provider}=====")
    print(json.dumps(payload, ensure_ascii=False, indent=1))
    print(f"=====PHASE3_JSON_END:{provider}=====")


def key_prefix(env_name: str) -> str:
    """8-char non-secret prefix (Phase-2 precedent) or ABSENT."""
    import os
    v = os.environ.get(env_name, "")
    return v[:8] + "…" if v else "ABSENT"
