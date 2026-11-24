#!/usr/bin/env python3
"""Ephemeral QA test-client fixture — ISOLATED data for behavioral probes.

WHY THIS EXISTS (MIGRATION-PROBE-0102-ISOLATION, owner order 2026-11-24):
  The 0102 behavioral probe originally asserted the primary-subscription
  pick of a REAL production client — a "strong" probe wired to MUTABLE
  customer data. When that client's coaching subscription lapsed on
  2026-11-22T14:34:19Z the probe's expectation (coaching/active/
  sub_end_date>now) became unsatisfiable forever, and the gate false-RED'd
  from 2026-11-23 (issue #8) while the migration's law was live — the
  third incident of the same family (0101's consciously-weak probe, #3's
  fragile QA session). Probes must never depend on real customer data
  (the PRIVACY law in scripts/db/migration_probes.py) and never on data
  that can rot with time.

THE DESIGN (mirrors scripts/db/probe_session.py — the ephemeral QA admin;
same Test-Accounts Channel guards, owner directive 2026-10-26/29):
  Each gate run SELF-PROVISIONS a throwaway test CLIENT carrying a
  deterministic two-subscription scenario — the EXACT defect shape 0102
  fixed: a HIGHER-tier expired row (premium, end_date in the past) that
  must never mask a LOWER-tier ACTIVE row (coaching, end_date far in the
  future). The probe then calls the real admin RPC and asserts the pick.
  The fixture is used once and hard-deleted inside the same run.

    1. cleanup_stale()  — best-effort sweep of crashed-run leftovers
                          (qa.client.* older than 1h; young ones may
                          belong to a concurrent run — never touched).
    2. create()         — qa.client.<stamp><rand>@alkemos-test.com,
                          random one-time password (never printed),
                          email_confirm=true → handle_new_user() creates
                          the profile (role='client') → PATCH
                          is_test_account=true → INSERT the two
                          subscription rows (service key — test-owned
                          rows, the AGENTS.md §3.3 carve-out; the
                          audit_row() triggers record the fixture's own
                          writes, the same honest trail the ephemeral
                          admin's audited role writes leave).
    3. destroy()        — subscriptions (client_id-scoped) → profile →
                          auth user, then verified. Idempotent.

  The coaching row's end_date is set 10 years out, so the fixture's
  expectation can never rot with time (the 0102 lesson). No credential
  is ever printed, logged, or stored; no real-customer row is ever read
  or written; the search token is unique per run so the RPC lookup can
  only ever match the fixture itself.
"""

from __future__ import annotations

import secrets
import string
import time
from datetime import datetime, timedelta, timezone

from probe_session import _destroy_one, _http, _password, _profile

FIXTURE_DOMAIN = "@alkemos-test.com"
FIXTURE_PREFIX = "qa.client."
STALE_AFTER_HOURS = 1
COACHING_END_YEARS = 10  # far-future ACTIVE row — the probe never rots


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def cleanup_stale(sb: str, service: str) -> list[str]:
    """Best-effort sweep of crashed-run leftovers: every qa.client.* test
    profile older than STALE_AFTER_HOURS (young ones may belong to a
    concurrent run — never touched). Returns per-account notes."""
    cutoff = (datetime.now(timezone.utc)
              - timedelta(hours=STALE_AFTER_HOURS)).isoformat()
    st, rows = _http(
        "GET",
        sb + "/rest/v1/profiles?select=id,email,created_at"
        f"&email=like.{FIXTURE_PREFIX}*{FIXTURE_DOMAIN}"
        f"&is_test_account=eq.true&created_at=lt.{cutoff}", service)
    if st != 200 or not isinstance(rows, list) or not rows:
        return []
    out = []
    for r in rows:
        out.append(f"stale {r['email']}: "
                   + _destroy_with_subs(sb, service, r["id"], r["email"]))
    return out


def _insert_subs(sb: str, service: str, uid: str) -> None:
    """Insert the deterministic 0102 defect shape (service key, test-owned
    rows): premium EXPIRED (higher tier, past end_date) + coaching ACTIVE
    (lower tier, far-future end_date). Under 0102's active-first law the
    pick MUST be the coaching row; under the pre-0102 tier-priority order
    it would be the expired premium — exactly what the probe asserts."""
    now = datetime.now(timezone.utc)
    rows = [
        {   # the masking row: higher tier, already expired
            "client_id": uid,
            "tier": "premium",
            "subscription_type": "membership",
            "status": "active",
            "months": 1,
            "start_date": _iso(now - timedelta(days=40)),
            "end_date": _iso(now - timedelta(days=10)),
            "created_at": _iso(now - timedelta(days=40)),
        },
        {   # the renewal: lower tier, effectively ACTIVE far into the future
            "client_id": uid,
            "tier": "coaching",
            "subscription_type": "coaching",
            "status": "active",
            "months": 1,
            "start_date": _iso(now - timedelta(days=5)),
            "end_date": _iso(now + timedelta(days=365 * COACHING_END_YEARS)),
            "created_at": _iso(now - timedelta(days=5)),
        },
    ]
    st, body = _http("POST", sb + "/rest/v1/subscriptions",
                     service, body=rows)
    if st not in (200, 201):
        raise RuntimeError(
            f"fixture subscriptions insert failed (HTTP {st}): "
            f"{str(body)[:160]}")
    # verify both rows landed (the unique(client_id, tier) index guarantees
    # they are exactly these two tiers)
    st, got = _http(
        "GET",
        sb + "/rest/v1/subscriptions?select=tier&client_id=eq." + uid,
        service)
    tiers = sorted(r.get("tier", "") for r in got) \
        if st == 200 and isinstance(got, list) else []
    if tiers != ["coaching", "premium"]:
        raise RuntimeError(
            f"fixture subscriptions verification failed: {tiers!r}")


def _destroy_with_subs(sb: str, service: str, uid: str, email: str) -> str:
    """Hard-delete one fixture account: subscriptions first (explicit,
    client_id-scoped), then profile + auth user (probe_session's
    _destroy_one order). The profiles FK carries ON DELETE CASCADE, so the
    explicit pass is belt-and-braces. Returns a short human status."""
    st, _ = _http("DELETE",
                  sb + f"/rest/v1/subscriptions?client_id=eq.{uid}", service)
    note = f"subscriptions:{'deleted' if st in (200, 204) else f'HTTP {st}'}"
    left = None
    st2, got = _http(
        "GET",
        sb + "/rest/v1/subscriptions?select=id&client_id=eq." + uid,
        service)
    if st2 == 200 and isinstance(got, list):
        left = len(got)
    return (f"{note} (residual rows: {left}), "
            + _destroy_one(sb, service, uid, email))


def create(sb: str, service: str) -> tuple[str, str, str]:
    """Create the ephemeral test CLIENT + its two-subscription scenario.
    Returns (email, uid, search_token). The password is a one-time
    process-memory value and is discarded here — the fixture is DATA,
    never a signed-in session (the admin session stays probe_session's)."""
    stamp = datetime.now(timezone.utc).strftime("%y%m%d%H%M%S")
    rand = "".join(secrets.choice(string.ascii_lowercase) for _ in range(8))
    email = f"{FIXTURE_PREFIX}{stamp}{rand}{FIXTURE_DOMAIN}"
    search_token = f"{stamp}{rand}"
    password = _password()

    st, body = _http("POST", sb + "/auth/v1/admin/users", service, body={
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Migration-state fixture (ephemeral)",
        },
    })
    if st not in (200, 201):
        raise RuntimeError(
            f"admin-API user creation failed (HTTP {st}): {str(body)[:160]}")

    # handle_new_user() creates the profile row (role='client') — wait
    # for it, then set the test flag (role stays 'client': the fixture
    # must appear in the admin client list as a client).
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

    try:
        st, body = _http("PATCH",
                         sb + f"/rest/v1/profiles?id=eq.{uid}", service,
                         body={"is_test_account": True})
        if st not in (200, 204):
            raise RuntimeError(
                f"profile test-flag update failed (HTTP {st}): "
                f"{str(body)[:160]}")
        p = _profile(sb, service, email)
        if not p or p.get("role") != "client" or not p.get("is_test_account"):
            raise RuntimeError("profile verification failed after PATCH")
        _insert_subs(sb, service, uid)
    except Exception:
        # never leave a half-built fixture behind
        try:
            _destroy_with_subs(sb, service, uid, email)
        except Exception:
            pass
        raise
    return email, uid, search_token


def destroy(sb: str, service: str, email: str) -> str:
    """Delete the fixture account by email (idempotent — a missing account
    is a clean no-op). Returns a short human status for the log."""
    p = _profile(sb, service, email)
    if p is None:
        return "already gone (clean)"
    return _destroy_with_subs(sb, service, p["id"], email)


if __name__ == "__main__":  # manual smoke: create → verify → destroy
    import os
    sb = (os.environ.get("SUPABASE_URL")
          or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
    service = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not (sb and service):
        raise SystemExit("needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY "
                         "(env only)")
    for note in cleanup_stale(sb, service):
        print(note)
    email, uid, token = create(sb, service)
    print(f"created ephemeral fixture client: {email} (search token "
          f"…{token[-6:]})")
    print("destroy:", destroy(sb, service, email))
