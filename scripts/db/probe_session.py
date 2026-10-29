#!/usr/bin/env python3
"""Ephemeral QA-admin probe session — the migration-state gate's own
behavioral-probe identity (QA-TEST-ACCOUNTS-CLOSE 2026-10-29, owner order:
«عالج اعتماد بوابة migration-state-audit على حساب qa.admin بطريقة آمنة …
لا تترك النشر أو التحقق اليومي معطلًا»).

WHY THIS EXISTS:
  The 0102-class behavioral probes must call the admin RPCs through the
  app's own code path (auth + RLS + the function body) — a service-role
  call returns zero rows because is_admin() checks auth.uid(). Until
  2026-10-29 the gate signed in as the PERSISTENT standard test admin
  (qa.admin@alkemos-test.com) via the QA_PROBE_EMAIL/QA_PROBE_PASSWORD
  Actions secrets — which chained the daily gate + every deploy to one
  long-lived account whose password had to be re-synced by hand every
  time a QA round renewed it (the 2026-10-28 incident in issue #2).

THE DESIGN (this module):
  Each gate run SELF-PROVISIONS a throwaway QA admin, uses it once,
  then hard-deletes it — same Test-Accounts Channel guards as
  scripts/qa/test_accounts.py (reserved domain @alkemos-test.com +
  profiles.is_test_account=true, auth users via the Supabase ADMIN API
  only, never direct auth.users SQL):
    1. cleanup_stale()   — best-effort sweep of leftovers from crashed
                           runs (qa.probe.* older than 1h), so the
                           mechanism self-heals on the next daily run.
    2. create()          — qa.probe.<stamp><rand>@alkemos-test.com,
                           random one-time password (never printed),
                           email_confirm=true, then role=admin +
                           is_test_account=true on its profile row.
    3. signin()          — password grant → access token (JWT).
    4. destroy()         — profile row + auth user hard-deleted, then
                           verified. Called in a finally block by the
                           gate — a RED run still cleans up.

  No credential is ever printed, logged, or stored; the password lives
  in process memory for the duration of one sign-in and dies with the
  account. No repo secret is needed anymore.

FUTURE-ACCOUNTS LAW (owner directive 2026-10-29): closing the QA task
  deletes the 18 stale test accounts — it does NOT forbid future ones.
  Creating test accounts when needed (QA rounds, fault verification)
  stays allowed under the channel's security rules; this module is one
  such sanctioned creator, and it deletes what it creates.
"""

from __future__ import annotations

import json
import os
import secrets
import string
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

PROBE_DOMAIN = "@alkemos-test.com"
PROBE_PREFIX = "qa.probe."
STALE_AFTER_HOURS = 1


def _http(method: str, url: str, key: str, token: str | None = None,
          body: dict | None = None, timeout: int = 30):
    """One HTTP call. Returns (status, parsed-json-or-text). Never raises."""
    headers = {"apikey": key, "Authorization": f"Bearer {token or key}"}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
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
            return e.code, raw
    except Exception as e:  # network / dns / timeout
        return 0, str(e)


def _password() -> str:
    alphabet = string.ascii_letters + string.digits
    pw = [secrets.choice(alphabet) for _ in range(24)]
    pw[0], pw[1], pw[2] = "A", "9", "q"   # guarantee character classes
    return "".join(pw)


def _profile(sb: str, service: str, email: str) -> dict | None:
    st, rows = _http(
        "GET",
        sb + "/rest/v1/profiles?select=id,email,role,is_test_account"
        f"&email=eq.{email}", service)
    if st == 200 and isinstance(rows, list):
        return rows[0] if rows else None
    return None


def _destroy_one(sb: str, service: str, uid: str, email: str) -> str:
    """Hard-delete one probe account (profile row, then auth user).
    Returns a short human status. Profile-first order = the 0095 map."""
    notes = []
    st, _ = _http("DELETE", sb + f"/rest/v1/profiles?id=eq.{uid}", service)
    notes.append(f"profile:{'deleted' if st in (200, 204) else f'HTTP {st}'}")
    st, body = _http("DELETE",
                     sb + f"/auth/v1/admin/users/{uid}", service)
    ok = st in (200, 204)
    notes.append(f"auth-user:{'deleted' if ok else f'HTTP {st}'}")
    left = _profile(sb, service, email)
    notes.append("residual:" + ("none" if left is None else "PROFILE STILL THERE"))
    return ", ".join(notes)


def cleanup_stale(sb: str, service: str) -> list[str]:
    """Best-effort sweep of crashed-run leftovers: every qa.probe.* test
    profile older than STALE_AFTER_HOURS (young ones may belong to a
    concurrent run — never touched). Returns per-account notes."""
    cutoff = (datetime.now(timezone.utc)
              - timedelta(hours=STALE_AFTER_HOURS)).isoformat()
    st, rows = _http(
        "GET",
        sb + "/rest/v1/profiles?select=id,email,created_at"
        f"&email=like.{PROBE_PREFIX}*{PROBE_DOMAIN}"
        f"&is_test_account=eq.true&created_at=lt.{cutoff}", service)
    if st != 200 or not isinstance(rows, list) or not rows:
        return []
    out = []
    for r in rows:
        out.append(f"stale {r['email']}: "
                   + _destroy_one(sb, service, r["id"], r["email"]))
    return out


def create(sb: str, service: str) -> tuple[str, str]:
    """Create the ephemeral QA admin. Returns (email, password).
    The password is a one-time process-memory value — never printed."""
    stamp = datetime.now(timezone.utc).strftime("%y%m%d%H%M%S")
    email = (f"{PROBE_PREFIX}{stamp}"
             f"{''.join(secrets.choice(string.ascii_lowercase) for _ in range(4))}"
             f"{PROBE_DOMAIN}")
    password = _password()

    st, body = _http("POST", sb + "/auth/v1/admin/users", service, body={
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Migration-state probe (ephemeral)",
        },
    })
    if st not in (200, 201):
        raise RuntimeError(
            f"admin-API user creation failed (HTTP {st}): {str(body)[:160]}")

    # handle_new_user() creates the profile row (role='client') — wait
    # for it, then set role=admin + the test flag (same writes the
    # guarded channel tool performs).
    uid = None
    for _ in range(10):
        p = _profile(sb, service, email)
        if p:
            uid = p["id"]
            break
        time.sleep(1)
    if uid is None:
        raise RuntimeError(
            "auth user created but no profile row appeared within 10s "
            "(handle_new_user() trigger did not fire?)")

    st, body = _http("PATCH", sb + f"/rest/v1/profiles?id=eq.{uid}", service,
                     body={"role": "admin", "is_test_account": True})
    if st not in (200, 204):
        raise RuntimeError(
            f"profile role/flag update failed (HTTP {st}): {str(body)[:160]}")

    p = _profile(sb, service, email)
    if not p or p.get("role") != "admin" or not p.get("is_test_account"):
        raise RuntimeError("profile verification failed after PATCH")
    return email, password


def signin(sb: str, anon: str, email: str, password: str) -> str:
    """Password grant → access token (JWT). The token/password are never
    printed by the caller either."""
    st, body = _http(
        "POST", sb + "/auth/v1/token?grant_type=password", anon,
        body={"email": email, "password": password})
    if st != 200 or not isinstance(body, dict) or not body.get("access_token"):
        raise RuntimeError(
            f"ephemeral probe sign-in failed (HTTP {st}): {str(body)[:160]}")
    return body["access_token"]


def destroy(sb: str, service: str, email: str) -> str:
    """Delete the probe account by email (idempotent — a missing account
    is a clean no-op). Returns a short human status for the log."""
    p = _profile(sb, service, email)
    if p is None:
        return "already gone (clean)"
    return _destroy_one(sb, service, p["id"], email)


if __name__ == "__main__":  # manual smoke: create → signin → destroy
    sb = (os.environ.get("SUPABASE_URL")
          or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
    service = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    anon = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY",
                          os.environ.get("SUPABASE_ANON_KEY", ""))
    if not (sb and service and anon):
        raise SystemExit("needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY "
                         "+ NEXT_PUBLIC_SUPABASE_ANON_KEY (env only)")
    for note in cleanup_stale(sb, service):
        print(note)
    email, password = create(sb, service)
    print(f"created ephemeral probe admin: {email}")
    jwt = signin(sb, anon, email, password)
    print(f"sign-in OK (token acquired, {len(jwt)} chars — not printed)")
    print("destroy:", destroy(sb, service, email))
