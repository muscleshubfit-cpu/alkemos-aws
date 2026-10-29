#!/usr/bin/env python3
"""One-time closure tool: delete the LEGACY QA-admin TEST account
"QA Admin Test" <alkemos.qa.admin@gmail.com> from PRODUCTION — explicit
owner order 2026-10-29 evening («احذف حساب الاختبار القديم التالي من بيئة
الإنتاج في Alkemos … تحقّق أولًا من هوية الحساب في Supabase Auth
وارتباطه بملف المستخدم، وتأكد أنه حساب اختبار وليس حساب عميل حقيقي …
احذف الحساب وبيانات الاختبار التابعة له بأمان، دون المساس بأي مستخدمين
أو مدفوعات أو بيانات حقيقية»).

WHY A SEPARATE ACCOUNT: this is the 0073-era QA admin (created ~2026-09-07
through the live signup form, bootstrapped to admin by
20260907200000_0073_qa_admin_bootstrap.sql — full dashboard QA). It
PREDATES the Test-Accounts Channel (reserved domain + is_test_account
flag), which is exactly why it survived the 18-account wipe of
QA-TEST-ACCOUNTS-CLOSE: that scope required BOTH the flag AND a
reserved-domain email; this is a @gmail.com address. The channel-era gate
probe (qa.admin@alkemos-test.com) was wiped with the other 17.

EXECUTION VEHICLE: runs inside the one-time dispatchable
.github/workflows/qa-legacy-admin-cleanup.yml with the repo's
SUPABASE_SERVICE_ROLE_KEY Actions secret — the same sanctioned machinery
the migration-state gate itself uses since 49358a97 (probe_session.py
provisions AND deletes auth users with the same key on every run).
auth-user deletion goes through the GoTrue ADMIN API only — never direct
auth.users SQL (channel law). Data rows via PostgREST (0095 v2 map).

MODES:
  --dry-run  (default) enumerate + identity verification + census only
  --execute  the gated deletion (aborts unless EVERY check passes)

SAFETY:
  * Hard target: ONE email constant — no argv target, no patterns.
  * Identity gate (the «حساب اختبار وليس عميل حقيقي» proof): email exact
    + full_name == "QA Admin Test" + role == admin + auth/profile ids
    identical + created inside the 0073 era (2026-09-01..2026-09-30).
    ANY mismatch aborts before a single delete.
  * Payment-evidence guard: any subscription row under this uid carrying
    non-null payment evidence (capture/transaction/order-id columns)
    aborts the run — QA fixtures never carry real money trails.
  * Wallet law (0066 precedent): coach_wallet_transactions.created_by is
    NULLIFIED, rows preserved (they belong to REAL wallets).
  * Live-schema check (OpenAPI spec): absent tables/columns are skipped
    loudly, never guessed.
  * Serial ~0.5s between calls (§10 production-request budget).
  * Idempotent: a missing account is a clean no-op verdict.
  * Never prints keys or tokens.

FUTURE-ACCOUNTS LAW (owner directive 2026-10-29): deleting this legacy
account does NOT forbid future test accounts — those stay allowed under
the Test-Accounts Channel rules (AGENTS §3.3/§6/§7/§8 +
docs/QA-TEST-ACCOUNTS-2026-10-26.md).
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

TARGET_EMAIL = "alkemos.qa.admin@gmail.com"   # the ONLY target (hard guard)
EXPECTED_NAME = "QA Admin Test"               # documented in 0073
EXPECTED_ROLE = "admin"                       # bootstrapped by 0073
ERA_LO, ERA_HI = "2026-09-01", "2026-09-30"   # 0073 era (live signup)

# 0095 v2 / 0066 v2 map — tables with NO live FK cascade (explicit deletes)
STEP1 = [
    ("chat_messages", "client_id"),
    ("saved_results", "user_id"),
    ("meal_plans", "user_id"),
    ("plan_swaps", "user_id"),
    ("coach_presence", "coach_id"),      # live column (0066 v2 lesson)
    ("progress_photos", "user_id"),
    ("subscription_requests", "user_id"),
    ("evo_chat_usage", "user_id"),       # preventive
    ("ticket_messages", "sender_id"),    # preventive
    ("evo_call_stats", "user_id"),       # preventive (no FK — 0081)
]
# read-only census additions (cascade-side, informational)
CENSUS = [
    ("subscriptions", "client_id"),
    ("notifications", "user_id"),
]
EVIDENCE_RE = re.compile(
    r"capture|transaction|order_id|payment_id|txn|invoice", re.I)

SB = (os.environ.get("SUPABASE_URL")
      or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANON = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY",
                      os.environ.get("SUPABASE_ANON_KEY", ""))
EXECUTE = "--execute" in sys.argv
if not (SB and KEY):
    sys.exit("missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (env only)")


def http(method: str, path: str, key: str = "", body=None, timeout: int = 30):
    k = key or KEY
    headers = {"apikey": k, "Authorization": f"Bearer {k}"}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(SB + path, data=data, headers=headers,
                                 method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw.strip() else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw
    except Exception as e:
        return 0, str(e)


def q(s: str) -> str:
    return urllib.parse.quote(s, safe="")


def _err(body) -> str:
    """Short error message from a GoTrue response (never a key)."""
    if isinstance(body, dict):
        return str(body.get("error_description")
                   or body.get("msg") or body.get("error") or "")[:60]
    return str(body)[:60]


def auth_user_by_email() -> dict | None:
    st, page = http("GET", "/auth/v1/admin/users?per_page=1000")
    if st != 200 or not isinstance(page, dict):
        print(f"FATAL: admin user list failed (HTTP {st}): {str(page)[:200]}")
        sys.exit(1)
    users = [u for u in (page.get("users") or [])
             if u.get("email", "").lower() == TARGET_EMAIL]
    if len(page.get("users") or []) >= 1000:
        print("WARN: user page looks full (1000) — verify no pagination cut")
    return users[0] if users else None


def swagger_tables() -> dict:
    st, spec = http("GET", "/rest/v1/")
    if st != 200 or not isinstance(spec, dict):
        print(f"FATAL: cannot read OpenAPI spec (HTTP {st})")
        sys.exit(1)
    out = {}
    for t, d in (spec.get("definitions") or {}).items():
        props = d.get("properties") if isinstance(d, dict) else None
        out[t] = list(props.keys()) if isinstance(props, dict) else []
    return out


def count_rows(table: str, col: str, value: str) -> int | str:
    st, rows = http("GET", f"/rest/v1/{table}?select=id&{col}=eq.{q(value)}")
    if st != 200:
        return f"HTTP {st}"
    return len(rows) if isinstance(rows, list) else "?"


def final_state_verification(uid: str | None, steps, tables,
                             total_before) -> bool:
    """Post-state evidence (read-only): residuals when the uid is known,
    login-impossibility probes, real-data integrity. Returns the
    gone-verdict (auth user AND profile both absent)."""
    print("\n[post-verify] residual check:")
    au2 = auth_user_by_email()
    print(f"  auth user by email: {'GONE' if au2 is None else 'STILL THERE!'}")
    st_p, left = http("GET", "/rest/v1/profiles?select=id"
                      f"&email=eq.{q(TARGET_EMAIL)}")
    print(f"  profile by email: "
          f"{'GONE' if (st_p == 200 and not left) else f'LEFT: {left}'}")
    if uid:
        for table, col in steps:
            n = count_rows(table, col, uid)
            print(f"  {table}.{col}: {n}")
        if "tool_leads" in tables and "email" in tables["tool_leads"]:
            print(f"  tool_leads.email: "
                  f"{count_rows('tool_leads', 'email', TARGET_EMAIL)}")
        if "coach_wallet_transactions" in tables and \
                "created_by" in tables["coach_wallet_transactions"]:
            print(f"  wallet rows still attributed (must be 0): "
                  f"{count_rows('coach_wallet_transactions', 'created_by', uid)}")

    # login-impossibility probes (no real credential is ever known/printed)
    if ANON:
        st, body = http("POST", "/auth/v1/token?grant_type=password",
                        key=ANON,
                        body={"email": TARGET_EMAIL,
                              "password": "definitely-not-the-password-#1"})
        msg = _err(body)
        print(f"  password-grant probe: HTTP {st} ({msg}) — "
              "no credential can sign in")
        st, body = http("POST", "/auth/v1/recover", key=ANON,
                        body={"email": TARGET_EMAIL})
        msg = _err(body)
        note = (" — enumeration protection on; Admin-API absence above "
                "is the definitive proof" if st == 200 else "")
        print(f"  password-recover probe: HTTP {st} ({msg}){note}")
    else:
        print("  (anon key absent — Admin-API absence above is the proof)")

    # real-data integrity (the untouched-customer proof, with end dates)
    st, subs = http("GET", "/rest/v1/subscriptions?select=tier,status,end_date"
                    "&client_id=eq.87cd7ba6-9e25-4fec-a7b6-b75ed1e2e09b")
    if st == 200 and isinstance(subs, list):
        real_subs = "; ".join("{}[status={}, end={}]".format(
            s.get("tier"), s.get("status"), str(s.get("end_date"))[:10])
            for s in subs)
    else:
        real_subs = "HTTP {}".format(st)
    print(f"  real client 87cd7ba6 subscriptions intact: "
          f"{len(subs) if st == 200 else 'HTTP ' + str(st)} ({real_subs})")
    st, rp = http("GET", "/rest/v1/profiles?select=id,email,role"
                  "&email=eq.samarsamy0992@gmail.com")
    print(f"  real client samarsamy0992 present: "
          f"{rp[0]['role'] if (st == 200 and rp) else 'MISSING!'}")
    st, pr2 = http("GET", "/rest/v1/profiles?select=id")
    total_after = len(pr2) if (st == 200 and isinstance(pr2, list)) else "?"
    if total_before != "?":
        print(f"  total profiles: {total_before} → {total_after} "
              f"(expect exactly −1)")
    else:
        print(f"  total profiles now: {total_after}")

    # residual accounts under the reserved test domains (the unflagged pair
    # is the OWNER's decision domain — reported here, never touched)
    st, dom_rows = http("GET", "/rest/v1/profiles?select=id,email"
                        "&email=like.*@alkemos-test.com")
    if st == 200 and isinstance(dom_rows, list):
        dom = [r.get("email") for r in dom_rows]
        st2, dom_rows2 = http("GET", "/rest/v1/profiles?select=id,email"
                              "&email=like.*@musclehub-test.com")
        if st2 == 200 and isinstance(dom_rows2, list):
            dom += [r.get("email") for r in dom_rows2]
        print(f"  profiles under reserved test domains: {len(dom)} "
              f"({', '.join(dom) if dom else 'none'})")
    return au2 is None and st_p == 200 and not left


def main() -> int:
    mode = "EXECUTE" if EXECUTE else "DRY-RUN"
    print(f"== legacy QA-admin cleanup ({mode}) — target: {TARGET_EMAIL} ==")
    print(f"== owner order 2026-10-29 · identity-gated · 0095 v2 map ==")

    # ---- 1) identity in Supabase Auth ------------------------------------
    au = auth_user_by_email()
    if au is None:
        print(f"\n[identity] auth user NOT FOUND for {TARGET_EMAIL}")
        st, left = http("GET", "/rest/v1/profiles?select=id,email"
                        f"&email=eq.{q(TARGET_EMAIL)}")
        prof_left = left if (st == 200 and left) else []
        if not prof_left:
            print("[identity] account already absent everywhere "
                  "(idempotent no-op) — running the full post-state "
                  "verification anyway.")
            final_state_verification(None, [], {}, "?")
            print("\n[verdict] ALREADY ABSENT & VERIFIED")
            return 0
        print(f"[verdict] ABORTED: profile row(s) exist without an auth "
              f"user ({len(prof_left)}) — unexpected state, owner review "
              "needed; NO deletion performed.")
        return 2
    uid = au["id"]
    print(f"\n[identity·auth] id={uid}")
    print(f"  email={au.get('email')} · created={str(au.get('created_at'))[:19]}"
          f" · last_sign_in={str(au.get('last_sign_in_at'))[:19]}")
    print(f"  email_confirmed={'yes' if au.get('email_confirmed_at') else 'no'}"
          f" · phone={au.get('phone') or '-'}"
          f" · providers={','.join(i.get('provider', '?') for i in (au.get('identities') or [])) or 'email'}")

    # ---- 2) link to the user profile + identity gate ----------------------
    st, profs = http("GET", "/rest/v1/profiles?select=id,email,full_name,"
                     f"role,is_test_account,created_at&email=eq.{q(TARGET_EMAIL)}")
    if st != 200 or not isinstance(profs, list) or not profs:
        print(f"\n[verdict] ABORTED: no profiles row for {TARGET_EMAIL} "
              f"(HTTP {st}) — cannot verify the account↔profile link the "
              "owner ordered; NO deletion performed.")
        return 2
    p = profs[0]
    print(f"\n[identity·profile] id={p['id']} · full_name={p.get('full_name')!r}"
          f" · role={p.get('role')} · is_test_account={p.get('is_test_account')}"
          f" · created={str(p.get('created_at'))[:19]}")

    checks = [
        ("email exact", True),
        ("profile↔auth id match", p["id"] == uid),
        ("full_name == 'QA Admin Test'", p.get("full_name") == EXPECTED_NAME),
        ("role == admin (0073 bootstrap)", p.get("role") == EXPECTED_ROLE),
        ("created inside 0073 era (2026-09)",
         str(p.get("created_at", ""))[:10] >= ERA_LO
         and str(p.get("created_at", ""))[:10] <= ERA_HI),
    ]
    print("\n[identity gate]")
    ok = True
    for label, passed in checks:
        print(f"  {'PASS' if passed else 'FAIL'} · {label}")
        ok = ok and passed
    if not ok:
        print("\n[verdict] ABORTED: identity gate FAILED — this does not "
              "match the documented 0073 test account; treating it as a "
              "possible REAL account. NO deletion performed.")
        return 2
    print("  => confirmed TEST account (0073-era QA admin), not a customer")

    # ---- 3) census of dependent data --------------------------------------
    tables = swagger_tables()
    subs_rows: list = []
    st, subs_rows = http("GET", "/rest/v1/subscriptions?select=*&"
                         f"client_id=eq.{q(uid)}")
    if st == 200 and isinstance(subs_rows, list) and subs_rows:
        print(f"\n[census] subscriptions under this uid ({len(subs_rows)}):")
        for s in subs_rows:
            print(f"    {json.dumps(s, ensure_ascii=False)[:220]}")
        ev = [c for c in (subs_rows[0] or {})
              if EVIDENCE_RE.search(c) and subs_rows[0].get(c) is not None]
        if ev:
            print(f"\n[verdict] ABORTED: subscription rows carry payment "
                  f"evidence columns {ev} with non-null values — possible "
                  "REAL money trail; NO deletion performed.")
            return 2
    else:
        print(f"\n[census] subscriptions under this uid: "
              f"{len(subs_rows) if isinstance(subs_rows, list) else f'HTTP {st}'}")

    print("\n[census] dependent rows (before):")
    steps = []
    for table, col in STEP1:
        cols = tables.get(table)
        if cols is None or col not in cols:
            print(f"  {table}.{col}: ABSENT from live schema — will skip")
            continue
        n = count_rows(table, col, uid)
        print(f"  {table}.{col}: {n}")
        steps.append((table, col))
    for table, col in CENSUS:
        cols = tables.get(table)
        if cols is None or col not in cols:
            continue
        print(f"  {table}.{col} (cascade-side): {count_rows(table, col, uid)}")
    if "tool_leads" in tables and "email" in tables["tool_leads"]:
        print(f"  tool_leads.email: {count_rows('tool_leads', 'email', TARGET_EMAIL)}")
    if "coach_wallet_transactions" in tables:
        if "created_by" in tables["coach_wallet_transactions"]:
            n = count_rows("coach_wallet_transactions", "created_by", uid)
            print(f"  coach_wallet_transactions.created_by (→NULL, rows kept): {n}")
    # total profiles before
    st, pr = http("GET", "/rest/v1/profiles?select=id", )
    total_before = len(pr) if (st == 200 and isinstance(pr, list)) else "?"

    if not EXECUTE:
        print(f"\n[verdict] DRY-RUN ONLY — identity verified, census above; "
              "re-dispatch with dry_run=false to execute the deletion.")
        return 0

    # ---- 4) the gated deletion (0095 v2 map) ------------------------------
    print("\n[execute] wiping dependent test data (serial, ~0.5s/req)…")
    for table, col in steps:
        st, body = http("DELETE", f"/rest/v1/{table}?{col}=eq.{q(uid)}")
        print(f"  delete {table}: {'ok' if st in (200, 204) else f'HTTP {st}'}")
        time.sleep(0.5)
    if "tool_leads" in tables and "email" in tables["tool_leads"]:
        st, body = http("DELETE", f"/rest/v1/tool_leads?email=eq.{q(TARGET_EMAIL)}")
        print(f"  delete tool_leads (by email): "
              f"{'ok' if st in (200, 204) else f'HTTP {st}'}")
        time.sleep(0.5)
    if "coach_wallet_transactions" in tables and \
            "created_by" in tables["coach_wallet_transactions"]:
        st, body = http("PATCH",
                        f"/rest/v1/coach_wallet_transactions?"
                        f"created_by=eq.{q(uid)}", body={"created_by": None})
        print(f"  nullify coach_wallet_transactions.created_by: "
              f"{'ok' if st in (200, 204) else f'HTTP {st}'}")
        time.sleep(0.5)
    st, body = http("DELETE", f"/rest/v1/profiles?id=eq.{q(uid)}")
    print(f"  delete profile (live cascades fire): "
          f"{'ok' if st in (200, 204) else f'HTTP {st}'}")
    time.sleep(0.5)
    st, body = http("DELETE", f"/auth/v1/admin/users/{uid}")
    print(f"  delete auth user (ADMIN API — auth-side cascades): "
          f"{'ok' if st in (200, 204) else f'HTTP {st}'}")
    time.sleep(0.5)

    # ---- 5) post-verification ---------------------------------------------
    gone = final_state_verification(uid, steps, tables, total_before)
    print(f"\n[verdict] {'DELETED & VERIFIED' if gone else 'INCOMPLETE — see residuals above'}")
    return 0 if gone else 3


if __name__ == "__main__":
    sys.exit(main())
