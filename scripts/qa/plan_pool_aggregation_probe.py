#!/usr/bin/env python3
"""LIVE end-to-end probe — AGGREGATED PAID-POOL (Phase 376, owner order
2026-10-28 «تجميع حصص الاشتراكات المدفوعة»).

ALL actions through OFFICIAL channels (AGENTS.md §3.3 + §6):
  * test accounts created via the guarded channel (scripts/qa/test_accounts.py)
  * subscription activations via the real admin API route
  * quota meter via the real member API route (/api/ai/quota)
  * plan generations via the real demo route (/api/ai/meal-plan-demo)
  * DB verification READ-ONLY via PostgREST (service key, SELECT only)

THE SCENARIO the owner ordered (the mandatory example): a member who
PARTIALLY consumed his Premium pool, then upgrades to Pro — the quotas of
ALL active paid subscriptions must AGGREGATE:
  step 1  admin activates premium (1 month)      → rows: [premium]
  step 2  member quota meter                     → {used:0, limit:4}
  step 3  member generates 2 plans (success)     → {used:2, limit:4, remaining:2}
  step 4  admin activates pro (1 month)          → rows: [premium INTACT, pro NEW]
  step 5  member quota meter                     → {used:2, limit:12, remaining:10}
          ← THE PROOF: 4+8 aggregated; usage kept (not zeroed, not 6, not 12 fresh)
  step 6  read-only row check (dates + status)
  step 7  admin activates coaching (1 month)     → {used:2, limit:20, remaining:18}
          (Coaching subscriptions stack too — the order names them)
  step 8  admin RENEWS premium (same tier)       → premium end +1 month, meter
          STILL {2,20} — a renewal never double-counts (NOT 24)
  step 9  member cancels                         → ALL active rows marked,
          access continues to end_date → meter STILL {2,20}

NOT live-testable here (honestly out of channel scope — no official route
creates a past-dated row; covered by the unit canaries
plan-pool-aggregation.test.ts with literal-date fixtures): the expiry
ladder (a row's contribution dropping the moment its end_date passes).

Env knobs:
  PROBE_APP_BASE            (default https://alkemos.com) — the app base
                            URL; point at a local `next start` for the
                            pre-push wiring smoke round.
  PROBE_SKIP_GENERATIONS=1  skip the 2 real generations (a local round on
                            a box with no AI provider keys): every
                            expectation below then reads used=0 and the
                            "not zeroed" checks are skipped — it proves
                            the ACTIVATION→METER wiring (2→4→12→20→renewal
                            dedup→cancel), while the production round runs
                            the FULL mandatory example (2 used → 10 left).

Usage:  SUPABASE_SERVICE_ROLE_KEY=… python3 scripts/qa/plan_pool_aggregation_probe.py \
          <member-email> <member-password> <admin-email> <admin-password>
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.request

SB = "https://wyopqryzfjifyeyvyxfy.supabase.co"
REF = "wyopqryzfjifyeyvyxfy"
APP = os.environ.get("PROBE_APP_BASE", "https://alkemos.com").rstrip("/")
SKIP_GEN = os.environ.get("PROBE_SKIP_GENERATIONS", "") == "1"
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
    headers = {"User-Agent": "alkemos-qa-probe/376"}
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


def activate(admin_ck: dict, uid: str, tier: str) -> tuple[bool, dict]:
    st, body = http("POST", f"{APP}/api/coach/subscriptions/activate",
                    {"client_id": uid, "tier": tier, "months": 1,
                     "method": "other"}, cookies=admin_ck)
    return st == 200 and body.get("ok") is True, body


def main() -> int:
    if len(sys.argv) != 5:
        print(__doc__)
        return 2
    m_email, m_pass, a_email, a_pass = sys.argv[1:5]
    mode = "SMOKE (no generations)" if SKIP_GEN else "FULL (mandatory example)"
    print(f"== PLAN-POOL-AGGREGATION probe · {APP} · {mode} ==")

    print("== logins (official password grant) ==")
    admin = login(a_email, a_pass)
    member = login(m_email, m_pass)
    if not admin or not member:
        return 2
    a_ck, m_ck = session_cookies(admin), session_cookies(member)
    check("admin + member sessions", True)

    uid = member["user"]["id"]
    print(f"== member id {uid} ==")

    # sanity: the meter sees the member BEFORE any activation (free pool)
    q0 = quota(m_ck)
    print(f"  baseline meter: {q0}")

    # ── step 1: admin activates PREMIUM (official route) ─────────────
    print("== step 1 · admin activates premium (1 month) ==")
    ok, body = activate(a_ck, uid, "premium")
    check("premium activation via official API", ok, f"HTTP body {str(body)[:120]}")
    if not ok:
        return 1
    premium_end_t0 = body["subscription"]["end_date"]
    print(f"      premium end_date = {premium_end_t0}")

    # ── step 2: member meter — single premium pool ───────────────────
    q1 = quota(m_ck)
    print(f"== step 2 · member meter: {q1} ==")
    check("single premium meter {used:0, limit:4}",
          q1.get("used") == 0 and q1.get("limit") == 4, str(q1))

    # ── step 3: member generates 2 plans (success-only burn) ─────────
    if SKIP_GEN:
        print("== step 3 SKIPPED (PROBE_SKIP_GENERATIONS=1 — local wiring round) ==")
    else:
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
    burned = 0 if SKIP_GEN else 2
    print(f"== meter after the partial-consumption step: {q2} ==")
    check(f"partially-consumed premium {{used:{burned}, limit:4, remaining:{4 - burned}}}",
          q2.get("used") == burned and q2.get("limit") == 4
          and q2.get("remaining") == 4 - burned, str(q2))

    # ── step 4: admin activates PRO (the upgrade) ────────────────────
    print("== step 4 · admin activates pro (1 month) — THE UPGRADE ==")
    ok, body = activate(a_ck, uid, "pro")
    check("pro activation via official API", ok, f"HTTP body {str(body)[:120]}")
    if not ok:
        return 1
    pro_end = body["subscription"]["end_date"]

    # ── step 5: member meter — THE MANDATORY-EXAMPLE PROOF ───────────
    q3 = quota(m_ck)
    print(f"== step 5 · member meter AFTER upgrade: {q3} ==")
    check(f"AGGREGATED POOL {{used:{burned}, limit:12, remaining:{12 - burned}}} (4+8; not zeroed, not 8-only)",
          q3.get("used") == burned and q3.get("limit") == 12
          and q3.get("remaining") == 12 - burned, str(q3))
    check("limit is NOT the superseded best-tier 8", q3.get("limit") != 8)
    if not SKIP_GEN:
        check("remaining is NOT the superseded 6", q3.get("remaining") != 6)
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

    # ── step 7: admin activates COACHING (the Coaching stack) ───────
    print("== step 7 · admin activates coaching (1 month) — the Coaching stack ==")
    ok, body = activate(a_ck, uid, "coaching")
    check("coaching activation via official API", ok, f"HTTP body {str(body)[:120]}")
    if not ok:
        return 1
    q4 = quota(m_ck)
    print(f"== meter after coaching stack: {q4} ==")
    check(f"COACHING STACKS {{used:{burned}, limit:20, remaining:{20 - burned}}} (4+8+8)",
          q4.get("used") == burned and q4.get("limit") == 20
          and q4.get("remaining") == 20 - burned, str(q4))
    rows = subs_rows(uid)
    show_rows(rows)

    # ── step 8: same-tier RENEWAL of premium while pro+coaching live ─
    print("== step 8 · admin renews premium (renewal must NOT double-count) ==")
    ok, body = activate(a_ck, uid, "premium")
    check("premium renewal via official API", ok, f"HTTP body {str(body)[:120]}")
    new_prem_end = body.get("subscription", {}).get("end_date", "")
    rows = subs_rows(uid)
    show_rows(rows)
    by_tier = {r["tier"]: r for r in rows}
    check("premium end EXTENDED from its own end (paid days preserved)",
          new_prem_end > premium_end_t0 and by_tier["premium"]["end_date"] == new_prem_end,
          f"{premium_end_t0[:19]} → {str(new_prem_end)[:19]}")
    check("renewal did NOT double-count the premium pool (limit STILL 20, not 24)",
          len([r for r in rows if r["tier"] == "premium"]) == 1)
    q5 = quota(m_ck)
    print(f"== meter after premium renewal: {q5} ==")
    check(f"meter still {{used:{burned}, limit:20}} after renewal (no double-count)",
          q5.get("limit") == 20 and q5.get("used") == burned, str(q5))

    # ── step 9: member cancels (access continues to end_date) ────────
    print("== step 9 · member cancels (the whole stack) ==")
    st, body = http("POST", f"{APP}/api/subscription/cancel", {}, cookies=m_ck)
    check("cancel accepted", st == 200 and body.get("ok") is True, f"HTTP {st} {str(body)[:120]}")
    st2, body2 = http("POST", f"{APP}/api/subscription/cancel", {}, cookies=m_ck)
    check("cancel idempotent (alreadyRequested=true)",
          st2 == 200 and body2.get("alreadyRequested") is True, str(body2)[:120])
    rows = subs_rows(uid)
    show_rows(rows)
    check("ALL active rows marked cancel_requested_at",
          all(r["cancel_requested_at"] for r in rows))
    check("access continues: status stays 'active' until end_date",
          all(r["status"] == "active" for r in rows))
    q6 = quota(m_ck)
    print(f"== meter after cancel (access until end_date): {q6} ==")
    check(f"paid pool still live after cancel request (limit 20, used {burned})",
          q6.get("limit") == 20 and q6.get("used") == burned, str(q6))

    # ── summary ───────────────────────────────────────────────────────
    print(f"\n== SUMMARY: {len(PASS)} passed, {len(FAIL)} failed ==")
    for name, why in FAIL.items():
        print(f"  ✗ {name}: {why}")
    return 0 if not FAIL else 1


if __name__ == "__main__":
    sys.exit(main())
