#!/usr/bin/env python3
"""phase3_cloudflare.py — Phase-3 live tests: Cloudflare Workers AI.

Owner order 2026-10-30 §3-ب, using ONLY the owner-provided repo secrets
CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_AI_TOKEN (created per Phase-2 §8-ج with
Workers AI:Read; the two legacy zone-scoped cfut_ tokens measured by Phase 2
carry NO Workers-AI permission and are NOT used here).

Sequence (each step recorded honestly, failures are measurements):
  1. Token verify            — GET /user/tokens/verify
  2. Catalog check           — GET /accounts/{id}/ai/models/search — the
     three candidate models must be CURRENTLY listed before any run call;
     the payment-method-only models are listed for avoidance proof.
  3. Per model (the 3 owner-listed ids only — nothing billed):
       a. Arabic generation quality   (protein question, AR answer)
       b. Planning/nutrition answer   (supplement schedule + safety line)
       c. JSON-object mode            (response_format json_object)
       d. JSON-schema mode            (response_format json_schema with the
          article-plan schema; the documented «JSON Mode couldn't be met»
          error is caught and recorded, never swallowed)
       e. Stability                   (same sample ×3 — exact-match rate +
          pairwise Jaccard + length spread)
     Every call records: status, latency_ms, cf-ai-neurons header (the
     per-call neuron meter), usage block when present.
  4. Best-effort GraphQL analytics read for today's AI usage (needs
     Account Analytics:Read on the token — an honest failure is recorded
     if the permission is missing).

Budget guard: 21 short calls (≈100-700 output tokens each) — expected
well inside the 10,000 neurons/day free allocation; no paid-billing model
is ever called.
"""

from __future__ import annotations

import itertools
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from phase3_common import emit, http_json, jaccard, key_prefix  # noqa: E402

ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
AI_TOKEN = os.environ.get("CLOUDFLARE_AI_TOKEN", "").strip()

BASE = "https://api.cloudflare.com/client/v4"

# The three owner-listed candidates (Phase-2 §8-ج) — nothing else is called
# by default. CF_MODELS_OVERRIDE (workflow dispatch input) narrows or
# substitutes the list (e.g. the 8B-fp8 variant when the -fast id is absent
# from the catalog) — every id is STILL catalog-gated before any call.
DEFAULT_MODELS = [
    "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    "@cf/meta/llama-4-scout-17b-16e-instruct",
]
MODELS = [m.strip() for m in
          (os.environ.get("CF_MODELS_OVERRIDE") or "").split(",")
          if m.strip()] or DEFAULT_MODELS

# Officially billing-only models (Phase-2 §4) — NEVER called; presence in
# the catalog is only REPORTED to prove avoidance.
PAID_ONLY_MODELS = [
    "@cf/kimi/kimi-k2.6",
    "@cf/kimi/kimi-k2.7-code",
    "@zai/glm-5.2",
    "@zai/glm-5.3",
    "@zai/glm-5.3-flash",
    "@cf/deepseek-ai/deepseek-v4-flash-0731",
    "@cf/deepseek-ai/deepseek-v4.1-flash-1017",
    "@cf/deepseek-ai/deepseek-v4-pro-0813",
]

SLEEP = 1.2

AR_PROTEIN_Q = ("أجب بالعربية الفصحى في 80-120 كلمة: كم جرام بروتين يوميًا "
                "يحتاج رافع أثقال وزنه 80 كيلوجرامًا لبناء العضلات؟ اذكر "
                "النطاق الشائع واعتبر الفروق الفردية.")
EN_PLAN_Q = ("Plan a daily supplement schedule for a beginner bodybuilder "
             "(creatine monohydrate, whey protein, omega-3): timing, typical "
             "commonly-recommended doses, and one safety caveat line. No "
             "personal medical advice.")
AR_STABILITY_Q = ("اكتب جملتين بالعربية الفصحى عن أهمية شرب الماء قبل "
                  "التمرين وأثناءه.")

ARTICLE_PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "heading": {"type": "string"},
                    "summary": {"type": "string"},
                },
                "required": ["heading", "summary"],
            },
        },
        "faq": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "q": {"type": "string"},
                    "a": {"type": "string"},
                },
                "required": ["q", "a"],
            },
        },
    },
    "required": ["title", "sections", "faq"],
}


def _hdrs():
    return {"Authorization": f"Bearer {AI_TOKEN}",
            "Content-Type": "application/json"}


def _clip(s, n=700):
    s = (s or "").strip()
    return s if len(s) <= n else s[:n] + "…"


def verify_token() -> dict:
    rec = http_json("GET", f"{BASE}/user/tokens/verify", _hdrs(), None, 60)
    res = (rec["json"] or {}).get("result") or {}
    return {"ok": rec["ok"], "status": rec["status"],
            "token_status": res.get("status"),
            "token_id_prefix": (res.get("id") or "")[:8] + "…",
            "error": rec["error"]}


def catalog_check() -> dict:
    rec = http_json("GET",
                    f"{BASE}/accounts/{ACCOUNT_ID}/ai/models/search?per_page=100",
                    _hdrs(), None, 90)
    out = {"ok": rec["ok"], "status": rec["status"], "error": rec["error"],
           "n_models_page": None, "model_presence": {}, "paid_only_presence": {}}
    res = (rec["json"] or {}).get("result") or []
    if isinstance(res, dict):
        res = res.get("models") or []
    names = []
    for m in res:
        names.append(m.get("name") or m.get("id") or "")
    out["n_models_page"] = len(names)
    for want in MODELS:
        out["model_presence"][want] = want in names
    for paid in PAID_ONLY_MODELS:
        out["paid_only_presence"][paid] = paid in names
    out["_all_names_sample"] = [n for n in names if any(
        k in n for k in ("llama-3.1-8b", "llama-3.3-70b", "llama-4-scout"))]
    return out


def run_model(model: str, messages: list, max_tokens: int,
              response_format: dict | None = None, label: str = "",
              timeout: int = 240) -> dict:
    body = {"messages": messages, "max_tokens": max_tokens}
    if response_format is not None:
        body["response_format"] = response_format
    rec = http_json("POST", f"{BASE}/accounts/{ACCOUNT_ID}/ai/run/{model}",
                    _hdrs(), body, timeout)
    data = rec["json"] or {}
    result = data.get("result")
    if isinstance(result, dict):
        text = result.get("response")
        usage = result.get("usage")
    else:
        text, usage = result, None
    out = {
        "label": label, "model": model, "ok": rec["ok"],
        "status": rec["status"], "latency_ms": rec["latency_ms"],
        "error": rec["error"],
        "cf_ai_neurons": (rec["headers"].get("cf-ai-neurons")
                          or rec["headers"].get("Cf-Ai-Neurons")),
        "headers": rec["headers"],
        "api_errors": data.get("errors") if not rec["ok"] else None,
        "usage": usage,
        "text_is_object": isinstance(text, dict),
        "text": (text if isinstance(text, dict) else _clip(text)),
        "text_len": len(text) if isinstance(text, str) else None,
    }
    time.sleep(SLEEP)
    return out


def _parse_json_text(rec_out: dict) -> dict:
    """Validate the JSON-mode answer: parse + required top-level keys/types."""
    v = {"json_parse_ok": False, "required_keys_ok": False,
         "parsed_summary": None, "parse_error": None}
    text = rec_out.get("text")
    if isinstance(text, dict):
        obj = text
        v["json_parse_ok"] = True
    else:
        s = (text or "").strip()
        # tolerate code fences some models add despite instructions
        if s.startswith("```"):
            s = s.strip("`").lstrip("json").strip()
        try:
            obj = json.loads(s) if s else None
            v["json_parse_ok"] = obj is not None
        except Exception as e:
            v["parse_error"] = f"{type(e).__name__}: {e}"
            obj = None
    if v["json_parse_ok"] and isinstance(obj, dict):
        keys_ok = (
            isinstance(obj.get("title"), str)
            and isinstance(obj.get("sections"), list) and obj.get("sections")
            and isinstance(obj.get("faq"), list) and obj.get("faq")
        )
        v["required_keys_ok"] = keys_ok
        v["parsed_summary"] = {
            "title_head": str(obj.get("title"))[:120],
            "n_sections": len(obj.get("sections") or []),
            "n_faq": len(obj.get("faq") or []),
            "section_keys_ok": all(
                isinstance(x, dict) and "heading" in x and "summary" in x
                for x in (obj.get("sections") or [])[:3]),
        }
    return v


def test_model(model: str) -> dict:
    print(f"\n--- Model: {model} ---")
    t = {"model": model, "ar_generation": None, "planning": None,
         "json_object_mode": None, "json_schema_mode": None,
         "stability": None, "neurons_total": 0, "calls_ok": 0,
         "calls_total": 0}

    # a. Arabic generation
    r = run_model(model, [
        {"role": "system", "content": "أنت مساعد خبير في التغذية الرياضية."},
        {"role": "user", "content": AR_PROTEIN_Q}], 500, None, "ar_generation")
    t["ar_generation"] = r
    print(f"  ar: ok={r['ok']} {r['latency_ms']}ms neurons={r['cf_ai_neurons']} "
          f"len={r['text_len']}")
    if r["ok"]:
        print("  ar sample:", _clip(str(r["text"])[:400], 400).replace("\n", " "))

    # b. Planning (EN)
    r = run_model(model, [
        {"role": "user", "content": EN_PLAN_Q}], 600, None, "planning")
    t["planning"] = r
    print(f"  plan: ok={r['ok']} {r['latency_ms']}ms neurons={r['cf_ai_neurons']} "
          f"len={r['text_len']}")

    # c. JSON-object mode
    json_prompt = ("أعد JSON فقط بلا أي نص إضافي بالبنية: "
                   '{"title": string, "sections": [{"heading": string, '
                   '"summary": string}], "faq": [{"q": string, "a": string}]} '
                   "— خطة مقال عربي عن الكرياتين مونوهيدرات: عنوان وثلاثة "
                   "أقسام وسؤالا تعليميين.")
    r = run_model(model, [{"role": "user", "content": json_prompt}], 700,
                  {"type": "json_object"}, "json_object_mode")
    r["validation"] = _parse_json_text(r)
    t["json_object_mode"] = r
    print(f"  json_object: ok={r['ok']} parse={r['validation']['json_parse_ok']} "
          f"keys={r['validation']['required_keys_ok']} neurons={r['cf_ai_neurons']}")

    # d. JSON-schema mode (the documented strict mode + its failure mode)
    r = run_model(model, [{"role": "user", "content": json_prompt}], 700,
                  {"type": "json_schema", "json_schema": ARTICLE_PLAN_SCHEMA},
                  "json_schema_mode")
    r["validation"] = _parse_json_text(r)
    t["json_schema_mode"] = r
    print(f"  json_schema: ok={r['ok']} parse={r['validation']['json_parse_ok']} "
          f"keys={r['validation']['required_keys_ok']} neurons={r['cf_ai_neurons']}")
    if r.get("api_errors"):
        print("  json_schema api_errors:", str(r["api_errors"])[:200])

    # e. Stability — same sample ×3 (default sampling; honest about that)
    reps = []
    for i in range(3):
        r = run_model(model, [{"role": "user", "content": AR_STABILITY_Q}],
                      250, None, f"stability_{i+1}")
        reps.append(r)
        print(f"  stability #{i+1}: ok={r['ok']} len={r['text_len']}")
    texts = [str(x.get("text") or "") for x in reps if x["ok"]]
    lens = [x["text_len"] for x in reps if x["ok"] and x["text_len"]]
    st = {"n_ok": len(texts), "exact_match_all": len(set(texts)) == 1 if texts else None,
          "lengths": lens,
          "length_spread": (max(lens) - min(lens)) if lens else None,
          "pairwise_jaccard": None}
    if len(texts) >= 2:
        pairs = [round(jaccard(a, b), 3) for a, b in itertools.combinations(texts, 2)]
        st["pairwise_jaccard"] = pairs
        print(f"  stability: exact={st['exact_match_all']} "
              f"jaccard={pairs} spread={st['length_spread']}")
    t["stability"] = {"reps": reps, "stats": st}

    all_calls = [t["ar_generation"], t["planning"], t["json_object_mode"],
                 t["json_schema_mode"]] + reps
    t["calls_total"] = len(all_calls)
    t["calls_ok"] = sum(1 for c in all_calls if c and c["ok"])
    neurons = []
    for c in all_calls:
        if c and c.get("cf_ai_neurons"):
            try:
                neurons.append(float(c["cf_ai_neurons"]))
            except Exception:
                pass
    t["neurons_measured_per_call"] = neurons
    t["neurons_total"] = round(sum(neurons), 2) if neurons else None
    print(f"  → calls {t['calls_ok']}/{t['calls_total']} ok · "
          f"neurons measured: {t['neurons_total']}")
    return t


def graphql_usage_attempt() -> dict:
    """Best-effort: today's AI inference requests via GraphQL analytics.

    Requires Account Analytics:Read on the token; a permission failure is
    an honest recorded outcome, not an error to hide. Two dimension-name
    shapes are tried ("model" then "modelId") because the schema is not
    published in the REST docs.
    """
    today = time.strftime("%Y-%m-%dT00:00:00Z", time.gmtime())
    for dim in ("model", "modelId"):
        q = {"query": f"""{{
          viewer {{
            accounts(filter: {{accountTag: "{ACCOUNT_ID}"}}) {{
              aiInferenceAdaptiveGroups(
                limit: 50
                filter: {{datetime_geq: "{today}"}}
              ) {{
                dimensions {{ datetime {dim} }}
                metrics {{ requests }}
              }}
            }}
          }}
        }}"""}
        rec = http_json("POST", f"{BASE}/graphql", _hdrs(), q, 60)
        data = rec["json"] or {}
        errs = data.get("errors")
        if rec["ok"] and not errs:
            out = {"ok": True, "status": rec["status"],
                   "dimension_field_used": dim, "groups": []}
            try:
                groups = (data["data"]["viewer"]["accounts"][0]
                          ["aiInferenceAdaptiveGroups"])
                out["groups"] = [
                    {"datetime": g["dimensions"].get("datetime"),
                     dim: g["dimensions"].get(dim),
                     "requests": g["metrics"].get("requests")} for g in groups]
                out["total_requests_today"] = sum(
                    g["metrics"].get("requests") or 0 for g in groups)
            except Exception as e:
                out["parse"] = f"{type(e).__name__}: {e}"
            return out
    return {"ok": False, "status": rec["status"], "error": rec["error"],
            "errors": errs,
            "note": "both dimension shapes rejected — schema differs from "
                    "the guess; per-call REST usage.neurons remains the "
                    "authoritative meter"}


def main() -> int:
    started = time.time()
    print("=== Phase-3 Cloudflare Workers AI live tests ===")
    print(f"CLOUDFLARE_ACCOUNT_ID present: {bool(ACCOUNT_ID)} "
          f"(prefix {key_prefix('CLOUDFLARE_ACCOUNT_ID')})")
    print(f"CLOUDFLARE_AI_TOKEN present: {bool(AI_TOKEN)} "
          f"(prefix {key_prefix('CLOUDFLARE_AI_TOKEN')})")
    payload = {"provider": "cloudflare",
               "account_id_prefix": key_prefix("CLOUDFLARE_ACCOUNT_ID"),
               "token_prefix": key_prefix("CLOUDFLARE_AI_TOKEN")}

    if not (ACCOUNT_ID and AI_TOKEN):
        print("Cloudflare SKIPPED — account id or token absent")
        payload["status"] = "SKIPPED-no-credentials"
        emit("cloudflare", payload)
        return 0

    payload["token_verify"] = verify_token()
    print("token verify:", payload["token_verify"]["ok"],
          payload["token_verify"].get("token_status"),
          payload["token_verify"].get("error") or "")

    payload["catalog"] = catalog_check()
    cat = payload["catalog"]
    print(f"catalog: ok={cat['ok']} models_on_page={cat['n_models_page']}")
    for want in MODELS:
        print(f"  presence {want}: {cat['model_presence'].get(want)}")

    missing = [m for m in MODELS if not cat["model_presence"].get(m)]
    runnable = [m for m in MODELS if cat["model_presence"].get(m)]
    if missing:
        print(f"NOT RUN (absent from the CURRENT catalog, honestly skipped): "
              f"{missing}")
    payload["models_absent_from_catalog"] = missing
    payload["models"] = [test_model(m) for m in runnable]
    payload["graphql_usage_attempt"] = graphql_usage_attempt()
    print("graphql usage attempt:", payload["graphql_usage_attempt"].get("ok"),
          payload["graphql_usage_attempt"].get("errors") or
          payload["graphql_usage_attempt"].get("total_requests_today"))

    payload["duration_s"] = round(time.time() - started, 1)
    emit("cloudflare", payload)
    print(f"\n=== Phase-3 Cloudflare done in {payload['duration_s']}s ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
