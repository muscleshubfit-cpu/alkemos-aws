#!/usr/bin/env python3
"""FULL-ACCOUNTS-FUNCTIONAL-QA live probe (2026-10-29 round — reusable).

The REST/browser evidence engine for the 2026-10-29 full account &
functional QA audit (docs/FULL-ACCOUNTS-FUNCTIONAL-QA-2026-10-29.md).
Read-only against real data; every write goes through test-owned rows
via the official channels (AGENTS.md §3.3 carve-out + §6 channel law).

Credentials come from a JSON file (never committed) whose path is given
by --creds (default: env QA_CREDS_JSON or ./qa-creds.json). Shape:
  {"admin": {"email": "...", "pass": "..."}, "coach": {...},
   "member": {...}, "full1": {...}, "full2": {...}, "fullc": {...}}
Passwords are one-time values from scripts/qa/test_accounts.py
(reset-password) living in session memory / the owner report only.

Usage:
  python3 scripts/qa/full_accounts_audit_probe.py --creds /path/creds.json \
      [--site https://alkemos.com] [--round rest|functional]

Respects the AGENTS.md §10 audit budget: sequential + ~0.4s pacing +
no bulk cache-busting. Never prints credentials.
"""
import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request

CREDS: dict = {}
SITE = "https://alkemos.com"
SB = "https://wyopqryzfjifyeyvyxfy.supabase.co"
PROJ_REF = "wyopqryzfjifyeyvyxfy"
ANON = os.environ.get(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "",  # env only — even public keys never live in the repo (§3.2)
)
RESULTS = []


def rec(group, test, expected, actual, evidence="", ok=None):
    ok = (expected == actual) if ok is None else ok
    RESULTS.append({"group": group, "test": test, "expected": str(expected),
                    "actual": str(actual), "evidence": str(evidence)[:400],
                    "ok": bool(ok)})
    print(f"[{'PASS' if ok else 'FAIL'}] {group} :: {test} -> {actual}")
    return ok


def pace():
    time.sleep(0.4)


def http(method, url, body=None, headers=None, timeout=40):
    data = None
    hdrs = {"User-Agent": "alkemos-qa-probe/1.0"}
    if headers:
        hdrs.update(headers)
    if body is not None:
        data = json.dumps(body).encode()
        hdrs.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            try:
                return r.status, json.loads(raw)
            except Exception:
                return r.status, raw[:400].decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw[:400].decode("utf-8", "replace")
    except Exception as e:
        return 0, f"ERR {type(e).__name__}: {e}"


def sb_cookie(session):
    """@supabase/ssr v0.12 cookie law: 'base64-' + base64url(JSON),
    chunked .0/.1 past 3180 chars."""
    raw = json.dumps(session)
    val = "base64-" + base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")
    if len(val) > 3180:
        chunks = [val[i:i + 3180] for i in range(0, len(val), 3180)]
        return "; ".join(f"sb-{PROJ_REF}-auth-token.{i}={c}"
                         for i, c in enumerate(chunks))
    return f"sb-{PROJ_REF}-auth-token={val}"


def login(email, password):
    st, body = http("POST", f"{SB}/auth/v1/token?grant_type=password",
                    {"email": email, "password": password},
                    {"apikey": ANON, "Authorization": f"Bearer {ANON}"})
    if st != 200:
        return None, (st, body)
    sess = {"access_token": body["access_token"],
            "refresh_token": body["refresh_token"],
            "token_type": "bearer", "expires_in": body.get("expires_in", 3600),
            "expires_at": body.get("expires_at", int(time.time()) + 3600),
            "user": body["user"]}
    return {"session": sess, "token": body["access_token"],
            "cookie": sb_cookie(sess), "user": body["user"]}, None


def api(method, path, auth=None, body=None, query=""):
    headers = {}
    if auth:
        headers["Cookie"] = auth["cookie"]
    return http(method, f"{SITE}{path}{query}", body, headers)


def pgr(method, path, token, query=""):
    return http(method, f"{SB}/rest/v1/{path}{query}", None,
                {"apikey": ANON, "Authorization": f"Bearer {token}"})


def t_rest(sessions):
    """Round 'rest': auth + allow/deny matrix + RLS isolation."""
    m, c, a = sessions["member"], sessions["coach"], sessions["admin"]
    st, _ = api("GET", "/api/build-info")
    rec("rest", "build-info reachable", 200, st)

    deny = [
        ("member", m, "GET", "/api/admin/accounts", 403),
        ("member", m, "GET", "/api/admin/wallets", 403),
        ("member", m, "GET", "/api/admin/leads", 403),
        ("member", m, "GET", "/api/coach/wallet", 403),
        ("member", m, "POST", "/api/coach/subscriptions/activate", 403),
        ("coach", c, "GET", "/api/admin/accounts", 403),
        ("coach", c, "GET", "/api/admin/wallets", 403),
        ("anon", None, "GET", "/api/admin/accounts", 401),
        ("anon", None, "GET", "/api/tools/saved-results", 401),
        ("anon", None, "POST", "/api/paypal/create-order", 401),
    ]
    for who, auth, method, path, exp in deny:
        st, body = api(method, path, auth, body={} if method == "POST" else None)
        pace()
        rec("deny", f"{who} -> {path}", exp, st, str(body)[:100])

    allow = [
        ("admin", a, "GET", "/api/admin/accounts"),
        ("admin", a, "GET", "/api/admin/wallets"),
        ("member", m, "GET", "/api/tools/saved-results"),
        ("coach", c, "GET", "/api/coach/wallet"),
    ]
    for who, auth, method, path in allow:
        st, body = api(method, path, auth)
        pace()
        rec("allow", f"{who} -> {path}", 200, st, str(body)[:100])

    # RLS isolation (member A vs member B)
    m2 = sessions.get("full2") or m
    st, body = pgr("GET", "plans", m2["token"],
                   query=f"?select=id&client_id=eq.{m['user']['id']}&limit=5")
    pace()
    rec("rls", "member B sees zero of member A's plans", 0,
        len(body) if isinstance(body, list) else -1)
    st, body = http("GET", f"{SB}/rest/v1/profiles?select=id&limit=5",
                    headers={"apikey": ANON})
    pace()
    rec("rls", "anon key sees zero profile rows", True,
        body == [] if isinstance(body, list) else False)


def t_functional(sessions):
    """Round 'functional': quota meter + subscription aggregation readout
    for the audit's test identities (no generation burn — read-only)."""
    for name in ("member", "full1", "full2"):
        s = sessions.get(name)
        if not s:
            continue
        st, body = api("GET", "/api/ai/quota", s)
        pace()
        plans = body.get("plans", {}) if isinstance(body, dict) else {}
        rec("quota", f"{name} quota meter readable (used/limit)", True,
            isinstance(plans.get("limit"), int),
            f"used={plans.get('used')} limit={plans.get('limit')}")


def main():
    global SITE, CREDS
    ap = argparse.ArgumentParser()
    ap.add_argument("--creds", default=os.environ.get("QA_CREDS_JSON", "qa-creds.json"))
    ap.add_argument("--site", default=SITE)
    ap.add_argument("--round", default="rest", choices=["rest", "functional"])
    args = ap.parse_args()
    SITE = args.site
    with open(args.creds) as f:
        CREDS = json.load(f)

    sessions = {}
    for name in ("admin", "coach", "member", "full1", "full2", "fullc"):
        c = CREDS.get(name)
        if not c:
            continue
        s, err = login(c["email"], c["pass"])
        pace()
        if s:
            sessions[name] = s
        else:
            print(f"login {name} FAILED: {err}")

    if args.round == "rest":
        t_rest(sessions)
    else:
        t_functional(sessions)

    passed = sum(1 for r in RESULTS if r["ok"])
    print(f"\n=== {args.round}: {passed}/{len(RESULTS)} ===")
    out = {"round": args.round, "total": len(RESULTS), "passed": passed,
           "failed": len(RESULTS) - passed, "results": RESULTS}
    print(json.dumps(out, indent=1, ensure_ascii=False))
    return 0 if passed == len(RESULTS) else 1


if __name__ == "__main__":
    sys.exit(main())
