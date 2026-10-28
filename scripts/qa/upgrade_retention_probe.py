#!/usr/bin/env python3
"""LIVE end-to-end probe — Premium→Pro upgrade retention (Phase 375).

ALL actions through OFFICIAL channels (AGENTS.md §3.3 + §6):
  * test account created via the guarded channel (scripts/qa/test_accounts.py)
  * subscription activations via the real admin API route
  * quota meter via the real member API route (/api/ai/quota)
  * plan generations via the real demo route (/api/ai/meal-plan-demo)
    — the same synchronous member path Phase 374 exercised
  * DB verification READ-ONLY via PostgREST (service key, SELECT only)

THE SCENARIO the owner ordered (the 374 gap): a member who PARTIALLY
consumed his Premium pool, then upgrades to Pro:
  step 1  admin activates premium (1 month)      → rows: [premium]
  step 2  member quota meter                     → {used:0, limit:4}
  step 3  member generates 2 plans (success)     → {used:2, limit:4, remaining:2}
  step 4  admin activates pro (1 month)          → rows: [premium INTACT, pro NEW]
  step 5  member quota meter                     → {used:2, limit:8, remaining:6}
          ← THE PROOF: usage NOT zeroed, pool NOT stacked (12), premium row kept
  step 6  read-only row check (dates + status)
  step 7  admin RENEWS premium (same tier)       → premium end +1 month, pro untouched
  step 8  member cancels                         → BOTH active rows marked, idempotent

Usage:  SUPABASE_SERVICE_ROLE_KEY=… python3 live_upgrade_probe.py \
          <member-email> <member-password> <admin-email> <admin-password>
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request

SB = "https://wyopqryzfjifyeyvyxfy.supabase.co"
REF = "wyopqryzfjifyeyvyxfy"
APP = "https://alkemos.com"
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
COOKIE = f"sb-{REF}-auth-token"
MAX_CHUNK = 3180

if not KEY:
    print("REFUSED: set SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
    sys.exit(2)

PASS: dict[str, bool] = {}
FAIL: dict[str, str] = {}


def check(name: str, ok: bool, detail: str = "") -> None:
    mark = "PASS" if ok else "FAIL"
    print(f"  [{mark}] {name}" + (f" — {detail}" if detail else ""))
    (PASS if ok else FAIL)[name] = detail or mark


def http(method: str, url: str, body=None, token: str | None = None,
         cookies: dict | None = None, timeout: int = 130):
    headers = {"User-Agent": "alkemos-qa-probe/375"}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["apikey"] = token
        headers["Authorization"] = f"Bearer {token}"
    if cookies:
        headers["Cookie"] = "; ".join(f"{k}={v}" for k, v in cookies.items())
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw.strip() else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw[:400]


def sb_get(path: str):
    return http("GET", SB + path, token=KEY)


# ── session → @supabase/ssr cookie set (base64url, chunked if >3180) ──
def b64url(s: str) -> str:
    return base64.urlsafe_b64encode(s.encode()).decode().rstrip("=")


def session_cookies(session: dict) -> dict:
    value = "base64-" + b64url(json.dumps(session))
    if len(value) <= MAX_CHUNK:
        return {COOKIE: value}
    chunks = [value[i:i + MAX_CHUNK] for i in range(0, len(value), MAX_CHUNK)]
    return {f"{COOKIE}.{i}": c for i, c in enumerate(chunks)}


def login(email: str, password: str) -> dict | None:
    st, body = http("POST", f"{SB}/auth/v1/token?grant_type=password",
                    {"email": email, "password": password}, token=KEY)
    if st != 200:
        print(f"REFUSED: login failed for {email}: HTTP {st}: {str(body)[:200]}")
        return None
    return body


def quota(cookies: dict) -> dict:
    st, body = http("GET", f"{APP}/api/ai/quota", cookies=cookies)
    if st != 200:
        return {"__status__": st, "error": body}
    return body.get("plans", {})


def subs_rows(uid: str) -> list:
    st, rows = sb_get(
        "/rest/v1/subscriptions?select=id,tier,months,start_date,end_date,"
        f"status,cancel_requested_at,created_at&client_id=eq.{uid}"
        "&order=created_at.asc")
    return rows if isinstance(rows, list) else []


def show_rows(rows: list) -> None:
    for r in rows:
        print(f"      tier={r['tier']:<9} status={r['status']:<8} "
              f"end={str(r['end_date'])[:19]} cancel_req={r['cancel_requested_at']} "
              f"created={str(r['created_at'])[:19]}")


def main() -> int:
    if len(sys.argv) != 5:
        print(__doc__)
        return 2
    m_email, m_pass, a_email, a_pass = sys.argv[1:5]

    print("== logins (official password grant) ==")
    admin = login(a_email, a_pass)
    member = login(m_email, m_pass)
    if not admin or not member:
        return 2
    a_ck, m_ck = session_cookies(admin), session_cookies(member)
    check("admin + member sessions", True)

    uid = member["user"]["id"]
    print(f"== member id {uid} ==")

    # sanity: the meter sees the member (free pool before any activation)
    q0 = quota(m_ck)
    print(f"  baseline meter: {q0}")

    # ── step 1: admin activates PREMIUM (official route) ─────────────
    print("== step 1 · admin activates premium (1 month) ==")
    st, body = http("POST", f"{APP}/api/coach/subscriptions/activate",
                    {"client_id": uid, "tier": "premium", "months": 1,
                     "method": "other"}, cookies=a_ck)
    ok = st == 200 and body.get("ok") is True
    check("premium activation via official API", ok, f"HTTP {st} {str(body)[:120]}")
    if not ok:
        return 1
    premium_end_t0 = body["subscription"]["end_date"]
    print(f"      premium end_date = {premium_end_t0}")

    # ── step 2: member meter — premium pool ──────────────────────────
    q1 = quota(m_ck)
    print(f"== step 2 · member meter: {q1} ==")
    check("premium meter {used:0, limit:4}",
          q1.get("used") == 0 and q1.get("limit") == 4, str(q1))

    # ── step 3: member generates 2 plans (success-only burn) ─────────
    print("== step 3 · member generates 2 plans (official demo route) ==")
    for i in (1, 2):
        st, body = http("POST", f"{APP}/api/ai/meal-plan-demo",
                        {"calories": 2000, "system": "balanced",
                         "language": "en", "notes": ""}, cookies=m_ck)
        ok = st == 200 and body.get("plan") is not None
        check(f"generation #{i} success (HTTP {st})", ok, str(body)[:100] if not ok else "")
        if not ok:
            print(f"      body: {str(body)[:300]}")
    q2 = quota(m_ck)
    print(f"== meter after 2 generations: {q2} ==")
    check("partially-consumed premium {used:2, limit:4, remaining:2}",
          q2.get("used") == 2 and q2.get("limit") == 4 and q2.get("remaining") == 2, str(q2))

    # ── step 4: admin activates PRO (the upgrade) ────────────────────
    print("== step 4 · admin activates pro (1 month) — THE UPGRADE ==")
    st, body = http("POST", f"{APP}/api/coach/subscriptions/activate",
                    {"client_id": uid, "tier": "pro", "months": 1,
                     "method": "other"}, cookies=a_ck)
    ok = st == 200 and body.get("ok") is True
    check("pro activation via official API", ok, f"HTTP {st} {str(body)[:120]}")
    if not ok:
        return 1
    pro_end = body["subscription"]["end_date"]

    # ── step 5: member meter — THE PROOF ─────────────────────────────
    q3 = quota(m_ck)
    print(f"== step 5 · member meter AFTER upgrade: {q3} ==")
    check("UPGRADE RETENTION {used:2, limit:8, remaining:6} (not zeroed, not stacked)",
          q3.get("used") == 2 and q3.get("limit") == 8 and q3.get("remaining") == 6, str(q3))
    check("limit is NOT the stacked 12 (no double-grant)", q3.get("limit") != 12)
    check("used is NOT zeroed", q3.get("used") != 0)

    # ── step 6: read-only row check ──────────────────────────────────
    print("== step 6 · read-only DB rows after upgrade ==")
    rows = subs_rows(uid)
    show_rows(rows)
    by_tier = {r["tier"]: r for r in rows}
    prem, pro = by_tier.get("premium"), by_tier.get("pro")
    check("premium row SURVIVED the upgrade (still active, same end_date)",
          prem is not None and prem["status"] == "active"
          and prem["end_date"] == premium_end_t0
          and prem["cancel_requested_at"] is None)
    check("pro row ADDED as a separate parallel row (own dates)",
          pro is not None and pro["status"] == "active"
          and pro["end_date"] == pro_end)
    check("premium created BEFORE pro (record order preserved)",
          prem is not None and pro is not None
          and prem["created_at"] < pro["created_at"])

    # ── step 7: same-tier RENEWAL of premium while pro is live ───────
    print("== step 7 · admin renews premium (stacking math on its OWN row) ==")
    st, body = http("POST", f"{APP}/api/coach/subscriptions/activate",
                    {"client_id": uid, "tier": "premium", "months": 1,
                     "method": "other"}, cookies=a_ck)
    ok = st == 200 and body.get("ok") is True
    check("premium renewal via official API", ok, f"HTTP {st} {str(body)[:120]}")
    new_prem_end = body.get("subscription", {}).get("end_date", "")
    rows = subs_rows(uid)
    show_rows(rows)
    by_tier = {r["tier"]: r for r in rows}
    check("premium end EXTENDED from its own end (paid days preserved)",
          new_prem_end > premium_end_t0 and by_tier["premium"]["end_date"] == new_prem_end,
          f"{premium_end_t0[:19]} → {str(new_prem_end)[:19]}")
    check("pro row UNTOUCHED by the premium renewal",
          by_tier["pro"]["end_date"] == pro_end)
    q4 = quota(m_ck)
    print(f"== meter after premium renewal: {q4} ==")
    check("meter still reads the PRO pool (limit 8) after premium renewal",
          q4.get("limit") == 8 and q4.get("used") == 2, str(q4))

    # ── step 8: member cancels (the whole stack) ─────────────────────
    print("== step 8 · member cancels ==")
    st, body = http("POST", f"{APP}/api/subscription/cancel", {}, cookies=m_ck)
    check("cancel accepted", st == 200 and body.get("ok") is True, f"HTTP {st} {str(body)[:120]}")
    st2, body2 = http("POST", f"{APP}/api/subscription/cancel", {}, cookies=m_ck)
    check("cancel idempotent (alreadyRequested=true)",
          st2 == 200 and body2.get("alreadyRequested") is True, str(body2)[:120])
    rows = subs_rows(uid)
    show_rows(rows)
    check("BOTH active rows marked cancel_requested_at",
          all(r["cancel_requested_at"] for r in rows))
    check("access continues: status stays 'active' until end_date",
          all(r["status"] == "active" for r in rows))
    q5 = quota(m_ck)
    print(f"== meter after cancel (access until end_date): {q5} ==")
    check("paid pool still live after cancel request (limit 8, used 2)",
          q5.get("limit") == 8 and q5.get("used") == 2, str(q5))

    # ── summary ───────────────────────────────────────────────────────
    print(f"\n== SUMMARY: {len(PASS)} passed, {len(FAIL)} failed ==")
    for name, why in FAIL.items():
        print(f"  ✗ {name}: {why}")
    return 0 if not FAIL else 1


if __name__ == "__main__":
    sys.exit(main())
