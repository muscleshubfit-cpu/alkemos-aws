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
                           TWO passes (ACCOUNTS-ORPHAN-AUDIT 2026-11-25):
                           profile-driven (stale test profiles) AND
                           auth-driven (auth users of this channel whose
                           profile is ALREADY gone — the crash window
                           between the two DELETEs that the profile-driven
                           pass alone could never see).
    2. create()          — qa.probe.<stamp><rand>@alkemos-test.com,
                           random one-time password (never printed),
                           email_confirm=true, then role=admin +
                           is_test_account=true on its profile row.
    3. signin()          — password grant → access token (JWT).
    4. destroy()         — profile row + auth user hard-deleted, then
                           VERIFIED: both re-read after deletion (not
                           just the HTTP status — ACCOUNTS-ORPHAN-AUDIT
                           2026-11-25). Called in a finally block by the
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

# PAGINATION-COMPLETENESS (hardening 2026-11-25): the Admin-API user
# enumeration's page geometry. The cap is a SAFETY NET, not an
# end-of-results signal — reaching it while next_page still points
# forward means the enumeration could not be proven complete.
AUTH_USERS_PER_PAGE = 200
AUTH_USERS_MAX_PAGES = 100


class EnumerationIncomplete(RuntimeError):
    """Raised when an enumeration cannot be PROVEN complete (hardening
    2026-11-25): the page cap was reached without the API's
    end-of-results signal, a page request failed, or the pagination
    contract (next_page) was violated. Subclasses RuntimeError so the
    best-effort sweeps keep surfacing-and-surviving it, while the
    accounts orphan audit (the verdict path) maps it to an explicit
    FAIL — a truncated enumeration must NEVER yield a CLEAN verdict."""


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


def _auth_user_exists(sb: str, service: str, uid: str) -> bool | None:
    """ACTUAL post-delete verification: re-read the auth user through the
    Admin API. True = still present, False = gone, None = indeterminate
    (any other HTTP status). ACCOUNTS-ORPHAN-AUDIT 2026-11-25: a delete
    whose only proof is "HTTP 200" can still leave an invisible orphan."""
    st, _ = _http("GET", sb + f"/auth/v1/admin/users/{uid}", service)
    if st == 200:
        return True
    if st == 404:
        return False
    return None


def _destroy_one(sb: str, service: str, uid: str, email: str) -> str:
    """Hard-delete one probe account (profile row, then auth user), then
    VERIFY BOTH actually disappeared by re-reading them (not just the
    HTTP status of the DELETE — ACCOUNTS-ORPHAN-AUDIT 2026-11-25).
    Profile-first order = the 0095 map. Returns a short human status."""
    notes = []
    st, _ = _http("DELETE", sb + f"/rest/v1/profiles?id=eq.{uid}", service)
    notes.append(f"profile:{'deleted' if st in (200, 204) else f'HTTP {st}'}")
    st, body = _http("DELETE",
                     sb + f"/auth/v1/admin/users/{uid}", service)
    ok = st in (200, 204)
    notes.append(f"auth-user:{'deleted' if ok else f'HTTP {st}'}")
    left = _profile(sb, service, email)
    notes.append("residual:" + ("none" if left is None else "PROFILE STILL THERE"))
    gone = _auth_user_exists(sb, service, uid)
    notes.append("auth-residual:" + (
        "none" if gone is False
        else "AUTH USER STILL THERE" if gone is True
        else "unknown(HTTP)"))
    return ", ".join(notes)


def auth_users_all(sb: str, service: str) -> list[dict]:
    """Every auth user through the Admin API, paginated (id/email/
    created_at kept — everything else dropped). READ-ONLY.

    PAGINATION-COMPLETENESS LAW (hardening 2026-11-25): the ONLY proof
    of completion is the API's own end-of-results signal — a response
    whose next_page is null/absent. Anything else raises
    EnumerationIncomplete instead of returning partial rows:
      * page cap (AUTH_USERS_MAX_PAGES) reached while next_page still
        points forward — the cap is a safety net, NOT an end signal;
      * a page request failing (non-200 / non-dict body);
      * a broken pagination contract: next_page not coercible to an
        int, next_page that does not advance past the current page,
        an empty page that still claims a next page, or a user entry
        that is not a dict carrying an id (the audit's whole
        comparison keys on id — an id-less entry would silently
        vanish from it).
    Shared by the stale sweeps (best-effort: they surface the skip)
    and the accounts orphan audit (which FAILS the gate on it)."""
    out: list[dict] = []
    page = 1
    while page <= AUTH_USERS_MAX_PAGES:
        st, body = _http(
            "GET",
            sb + f"/auth/v1/admin/users?per_page={AUTH_USERS_PER_PAGE}"
                 f"&page={page}", service)
        if st != 200 or not isinstance(body, dict):
            raise EnumerationIncomplete(
                f"admin user list failed (HTTP {st}): {str(body)[:120]}")
        users = body.get("users")
        if not isinstance(users, list):
            raise EnumerationIncomplete(
                "admin user list returned an invalid payload (users is "
                f"{type(users).__name__}, not a list) — enumeration "
                "cannot be proven complete")
        for u in users:
            if not isinstance(u, dict) or not u.get("id"):
                raise EnumerationIncomplete(
                    f"admin user list page {page} carries an invalid "
                    f"entry ({str(u)[:60]!r}) — every auth user must be "
                    "an object with an id; enumeration cannot be proven "
                    "complete")
        out.extend({"id": u.get("id"), "email": u.get("email"),
                    "created_at": u.get("created_at")} for u in users)
        nxt = body.get("next_page")
        if nxt is None:
            return out  # the API's end-of-results proof
        try:
            nxt = int(nxt)
        except (TypeError, ValueError):
            raise EnumerationIncomplete(
                f"admin user list returned an invalid next_page "
                f"({nxt!r}) — pagination contract broken, enumeration "
                "cannot be proven complete")
        if not users:
            raise EnumerationIncomplete(
                f"admin user list page {page} is empty while next_page "
                "still points forward — pagination contract broken")
        if nxt <= page:
            raise EnumerationIncomplete(
                f"admin user list next_page={nxt} does not advance past "
                f"page {page} — pagination contract broken, enumeration "
                "cannot be proven complete")
        page = nxt
    raise EnumerationIncomplete(
        f"admin user enumeration hit the {AUTH_USERS_MAX_PAGES}-page "
        f"safety cap ({AUTH_USERS_PER_PAGE * AUTH_USERS_MAX_PAGES:,} "
        "users) with next_page still pointing forward — enumeration "
        "INCOMPLETE, partial data refused")


def sweep_orphan_auth_users(sb: str, service: str, prefix: str) -> list[str]:
    """Clean up the leftovers the profile-driven sweep CANNOT see: auth
    users carrying THIS channel's prefix + the reserved test domain,
    older than STALE_AFTER_HOURS, whose profile row is ALREADY GONE (the
    crash window between the profile DELETE and the auth DELETE).
    Ownership is verified on THREE axes before any delete — email
    prefix, reserved domain, and age; a profile-present account is never
    touched here (the profile-driven pass above owns it, with its own
    is_test_account guard). Returns per-account notes."""
    notes: list[str] = []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=STALE_AFTER_HOURS)
    try:
        users = auth_users_all(sb, service)
    except RuntimeError as e:
        # best-effort sweep: surface, never crash the gate
        return [f"orphan-auth sweep skipped: {e}"]
    for u in users:
        email = (u.get("email") or "").lower()
        if not (email.startswith(prefix) and email.endswith(PROBE_DOMAIN)):
            continue  # not this channel's account — NEVER touched
        created = u.get("created_at") or ""
        when = None
        try:
            if created:
                when = datetime.fromisoformat(created.replace("Z", "+00:00"))
        except ValueError:
            when = None
        if when is not None and when.tzinfo is None:
            when = when.replace(tzinfo=timezone.utc)
        if when is None or when >= cutoff:
            continue  # young (or unknown age) — may be an ACTIVE run
        if _profile(sb, service, email) is not None:
            continue  # profile exists — not an orphan (profile sweep owns it)
        st, _ = _http("DELETE", sb + f"/auth/v1/admin/users/{u['id']}",
                      service)
        gone = _auth_user_exists(sb, service, u["id"])
        notes.append(
            f"orphaned auth user {email}: auth-user:"
            f"{'deleted' if st in (200, 204) else f'HTTP {st}'}, "
            f"auth-residual:"
            f"{'none' if gone is False else 'AUTH USER STILL THERE' if gone is True else 'unknown'}")
    return notes


def cleanup_stale(sb: str, service: str) -> list[str]:
    """Best-effort sweep of crashed-run leftovers: every qa.probe.* test
    profile older than STALE_AFTER_HOURS (young ones may belong to a
    concurrent run — never touched), PLUS the profile-less auth users of
    the same channel+age (the crash-window orphans — see
    sweep_orphan_auth_users). Returns per-account notes."""
    cutoff = (datetime.now(timezone.utc)
              - timedelta(hours=STALE_AFTER_HOURS)).isoformat()
    st, rows = _http(
        "GET",
        sb + "/rest/v1/profiles?select=id,email,created_at"
        f"&email=like.{PROBE_PREFIX}*{PROBE_DOMAIN}"
        f"&is_test_account=eq.true&created_at=lt.{cutoff}", service)
    out: list[str] = []
    if st == 200 and isinstance(rows, list):
        for r in rows:
            out.append(f"stale {r['email']}: "
                       + _destroy_one(sb, service, r["id"], r["email"]))
    out.extend(sweep_orphan_auth_users(sb, service, PROBE_PREFIX))
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
