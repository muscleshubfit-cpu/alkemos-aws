#!/usr/bin/env python3
"""phase3_mistral.py — Phase-3 live tests: Mistral La Plateforme.

Owner order 2026-10-30 §3-ج — REAL tests of mistral-small-latest through the
owner-provided MISTRAL_API_KEY repo secret:
  1. GET /v1/models           — key validity + mistral-small-latest presence
  2. Arabic answer            — the unified protein question (same prompt as
     the Cloudflare battery for a fair model-quality comparison)
  3. English answer           — the unified planning question
  4. JSON Mode (json_object)  — response_format + schema-in-prompt, parsed
     and validated against the required keys/types
  5. JSON stability           — the JSON call repeated (JSON validity rate)
Every call records status, latency, and the WHITELISTED rate-limit headers
(actual account limits as the API exposes them). A 429/403 is a recorded
measurement about the free tier, never retried into a fake success.

Isolation: no production path, no customer data, secrets never printed.
Free-tier politeness: 1 call / ~2.5s (well under the documented ~1 RPS).
"""

from __future__ import annotations

import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from phase3_common import emit, http_json, key_prefix  # noqa: E402

KEY = os.environ.get("MISTRAL_API_KEY", "")
BASE = "https://api.mistral.ai/v1"
MODEL = "mistral-small-latest"
SLEEP = 2.5

AR_PROTEIN_Q = ("أجب بالعربية الفصحى في 80-120 كلمة: كم جرام بروتين يوميًا "
                "يحتاج رافع أثقال وزنه 80 كيلوجرامًا لبناء العضلات؟ اذكر "
                "النطاق الشائع واعتبر الفروق الفردية.")
EN_PLAN_Q = ("Plan a daily supplement schedule for a beginner bodybuilder "
             "(creatine monohydrate, whey protein, omega-3): timing, typical "
             "commonly-recommended doses, and one safety caveat line. No "
             "personal medical advice.")
JSON_PROMPT = ("أعد JSON فقط بلا أي نص إضافي بالبنية: "
               '{"title": string, "sections": [{"heading": string, '
               '"summary": string}], "faq": [{"q": string, "a": string}]} '
               "— خطة مقال عربي عن الكرياتين مونوهيدرات: عنوان وثلاثة "
               "أقسام وسؤالا تعليميين.")


def _hdrs():
    return {"Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json"}


def _clip(s, n=700):
    s = (s or "").strip()
    return s if len(s) <= n else s[:n] + "…"


def chat(messages, max_tokens=600, response_format=None, label="",
         temperature=None) -> dict:
    body = {"model": MODEL, "messages": messages, "max_tokens": max_tokens}
    if response_format is not None:
        body["response_format"] = response_format
    if temperature is not None:
        body["temperature"] = temperature
    rec = http_json("POST", f"{BASE}/chat/completions", _hdrs(), body, 120)
    data = rec["json"] or {}
    choice = (data.get("choices") or [{}])[0]
    msg = choice.get("message") or {}
    out = {
        "label": label, "model": MODEL, "ok": rec["ok"],
        "status": rec["status"], "latency_ms": rec["latency_ms"],
        "error": rec["error"],
        "rate_limit_headers": rec["headers"],
        "finish_reason": choice.get("finish_reason"),
        "text": _clip(msg.get("content")),
        "text_len": len(msg.get("content") or ""),
        "usage": data.get("usage"),
    }
    time.sleep(SLEEP)
    return out


def validate_json(text) -> dict:
    v = {"json_parse_ok": False, "required_keys_ok": False,
         "parse_error": None, "parsed_summary": None}
    s = (text or "").strip()
    if s.startswith("```"):
        s = s.strip("`").lstrip("json").strip()
    try:
        obj = json.loads(s) if s else None
        v["json_parse_ok"] = obj is not None
    except Exception as e:
        v["parse_error"] = f"{type(e).__name__}: {e}"
        obj = None
    if isinstance(obj, dict):
        keys_ok = (
            isinstance(obj.get("title"), str)
            and isinstance(obj.get("sections"), list) and obj.get("sections")
            and isinstance(obj.get("faq"), list) and obj.get("faq"))
        v["required_keys_ok"] = keys_ok
        v["parsed_summary"] = {
            "title_head": str(obj.get("title"))[:120],
            "n_sections": len(obj.get("sections") or []),
            "n_faq": len(obj.get("faq") or []),
        }
    return v


def main() -> int:
    started = time.time()
    print("=== Phase-3 Mistral live tests ===")
    print(f"MISTRAL_API_KEY present: {bool(KEY)} "
          f"(prefix {key_prefix('MISTRAL_API_KEY')})")
    payload = {"provider": "mistral", "model": MODEL,
               "key_prefix": key_prefix("MISTRAL_API_KEY")}
    if not KEY:
        print("Mistral SKIPPED — no key")
        payload["status"] = "SKIPPED-no-key"
        emit("mistral", payload)
        return 0

    # 1. key + model-list check
    rec = http_json("GET", f"{BASE}/models", _hdrs(), None, 60)
    models = []
    try:
        models = [m.get("id") for m in (rec["json"] or {}).get("data") or []]
    except Exception:
        pass
    payload["models_endpoint"] = {
        "ok": rec["ok"], "status": rec["status"], "error": rec["error"],
        "n_models": len(models),
        "mistral_small_latest_present": MODEL in models,
        "sample_ids": [m for m in models if "small" in m][:6],
    }
    print(f"models: ok={rec['ok']} n={len(models)} "
          f"mistral-small-latest present={MODEL in models}")
    time.sleep(SLEEP)

    # 2. Arabic answer
    ar = chat([{"role": "user", "content": AR_PROTEIN_Q}], 500,
              label="ar_answer")
    payload["ar_answer"] = ar
    print(f"ar: ok={ar['ok']} {ar['latency_ms']}ms len={ar['text_len']} "
          f"finish={ar['finish_reason']}")
    if ar["ok"]:
        print("ar sample:", _clip(str(ar["text"])[:400], 400).replace("\n", " "))
    print("ar rate-limit headers:", ar["rate_limit_headers"])

    # 3. English answer
    en = chat([{"role": "user", "content": EN_PLAN_Q}], 600, label="en_answer")
    payload["en_answer"] = en
    print(f"en: ok={en['ok']} {en['latency_ms']}ms len={en['text_len']}")

    # 4. JSON Mode (json_object) + schema-in-prompt
    j1 = chat([{"role": "user", "content": JSON_PROMPT}], 700,
              {"type": "json_object"}, "json_mode")
    j1["validation"] = validate_json(j1.get("text"))
    payload["json_mode"] = j1
    print(f"json: ok={j1['ok']} parse={j1['validation']['json_parse_ok']} "
          f"keys={j1['validation']['required_keys_ok']} "
          f"usage={j1.get('usage')}")

    # 5. JSON stability — one repeat (validity rate across both)
    j2 = chat([{"role": "user", "content": JSON_PROMPT}], 700,
              {"type": "json_object"}, "json_mode_repeat")
    j2["validation"] = validate_json(j2.get("text"))
    payload["json_mode_repeat"] = j2
    both = [j1, j2]
    payload["json_stability"] = {
        "n_ok": sum(1 for x in both if x["ok"]),
        "n_valid_json": sum(1 for x in both if x["validation"]["json_parse_ok"]),
        "n_schema_ok": sum(1 for x in both if x["validation"]["required_keys_ok"]),
    }
    print("json stability:", payload["json_stability"])

    # account limits as actually exposed by the API (headers of the last ok call)
    limits = {}
    for x in (ar, en, j1, j2):
        for k, v in (x.get("rate_limit_headers") or {}).items():
            limits.setdefault(k, v)
    payload["account_limit_headers_observed"] = limits
    print("observed limit headers:", limits)

    payload["duration_s"] = round(time.time() - started, 1)
    emit("mistral", payload)
    print(f"\n=== Phase-3 Mistral done in {payload['duration_s']}s ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
