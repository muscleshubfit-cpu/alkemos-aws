#!/usr/bin/env python3
"""Accounts orphan audit — auth.users ↔ profiles consistency, READ-ONLY.

WHY THIS EXISTS (ACCOUNTS-ORPHAN-AUDIT, owner order 2026-11-25 — after
deleting test accounts from the admin panel: «افحص مستودع Alkemos
مباشرةً بعد حذف حسابات الاختبار من لوحة الإدارة … تحقق من وجود
حسابات اختبار متبقية في Supabase Auth دون سجلات مقابلة في profiles،
أو العكس … تأكد أن حذف الحسابات لم يترك بيانات يتيمة»):
  The admin panel's account deletion (src/app/api/admin/accounts/route.ts
  DELETE → auth.admin.deleteUser) removes the auth.users row; profiles
  and every client-data table cascade from it (0001_init.sql:50 —
  profiles.id REFERENCES auth.users ON DELETE CASCADE, subscriptions
  FK → profiles ON DELETE CASCADE at 0001_init.sql:103, + the wider
  dependent map). Until now NOTHING in the repo could SEE the two
  failure shapes of that path:
    (a) an auth user left WITHOUT its profile row (handle_new_user
        trigger/transport failure, or a crashed probe run inside the
        profile-DELETE → auth-DELETE window — invisible to the
        profile-driven qa.* stale sweeps);
    (b) a profiles row left WITHOUT its auth user (cascade failure or
        a partial manual deletion).
  This audit makes both measurable on every migration-state gate run —
  the same observability law that turned "is the migration applied?"
  from a guess into a probe (DB-MIGRATION-PIPELINE-2026-10-27).

WHAT IT CHECKS (all read-only; service key; PostgREST + Auth Admin API):
  FAILING buckets (exit 1 — data integrity):
    auth_without_profiles    auth.users rows with no matching profiles row
    profiles_without_auth    profiles rows with no matching auth.users row
    orphaned_dependent_rows  subscriptions.client_id → missing profiles row
  WARNING buckets (reported; exit stays 0 — the owner's decision domain,
    mirroring the 2026-10-29 precedent that flag/domain mismatches are
    reported, never touched):
    test_flag_mismatch       profiles where is_test_account does not
                             match the reserved-test-domain email
    test_domain_auth_users   auth users under the reserved domains whose
                             profile is missing or unflagged
  INFO:
    test_account_inventory   every account under the reserved domains
                             (the QA channel census — the 2026-10-29
                             pattern, extended to both domains)

PRIVACY (the repo is PUBLIC — workflow logs are world-readable):
  emails under the reserved test domains are printed (the QA channel
  convention, not PII); REAL account identifiers are NEVER printed —
  counts, 8-char id prefixes, roles and flags only. No key, token or
  password is ever printed. Nothing is written to the database: this
  tool only DETECTS. Deleting REAL data is owner-only (AGENTS.md §3.3);
  test-channel leftovers are cleaned by probe_session/probe_fixture
  cleanup_stale (the sanctioned channel, ownership-verified).

Exit codes: 0 = clean (warnings allowed) · 1 = orphans detected ·
2 = configuration error · 3 = enumeration INCOMPLETE (pagination cap
reached without an end-of-results proof, a page request failed, or
the pagination contract was broken — verdict WITHHELD, never a CLEAN
on partial data; hardening 2026-11-25).

PAGINATION-COMPLETENESS LAW (hardening 2026-11-25): every census this
audit renders a verdict on must be PROVEN complete by the source API's
own end-of-results signal — a short page (< PAGE rows) for the
PostgREST tables, a null/absent next_page for the Auth Admin API.
Reaching the page-cap safety nets without that proof raises before
analyze() ever runs: a truncated auth or profiles list could hide an
orphan beyond the cap (false CLEAN) or fabricate one (false RED), and
neither is an acceptable verdict. The audit stays READ-ONLY — nothing
here writes, deletes or retries against production.

Usage:
  SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
  python3 scripts/db/accounts_orphan_audit.py [--json out.json]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from probe_session import _http, auth_users_all  # noqa: E402

# Both reserved QA domains (the 2026-10-26 channel + the legacy
# musclehub-test pair surfaced by the 2026-10-29 legacy cleanup census).
TEST_DOMAINS = ("@alkemos-test.com", "@musclehub-test.com")

PAGE = 500          # PostgREST page size for profiles
SUBS_PAGE = 1000    # PostgREST page size for subscriptions
MAX_PAGES = 50      # safety cap for both
DETAIL_CAP = 20     # max detail lines per bucket (log noise guard)

CONFIG_ERROR = 2
ORPHANS = 1
CLEAN = 0
INCOMPLETE = 3  # enumeration not proven complete — verdict withheld


def is_test_email(email: str | None) -> bool:
    e = (email or "").lower()
    return e.endswith(TEST_DOMAINS)


def _id8(uid: str | None) -> str:
    return (uid or "")[:8]


def fetch_profiles(sb: str, service: str) -> list[dict]:
    """All profiles rows (id/email/role/is_test_account/created_at),
    paginated via PostgREST. Read-only.

    PAGINATION-COMPLETENESS LAW (hardening 2026-11-25): the ONLY proof
    of completion is a SHORT page (< PAGE rows). Hitting the MAX_PAGES
    safety cap with every page full raises RuntimeError — a truncated
    profiles list could hide an orphan beyond the cap (false CLEAN) or
    fabricate one (false RED), so partial data is refused."""
    out: list[dict] = []
    offset = 0
    for _ in range(MAX_PAGES):
        st, rows = _http(
            "GET",
            sb + "/rest/v1/profiles?select=id,email,role,is_test_account,created_at"
            f"&limit={PAGE}&offset={offset}", service)
        if st != 200 or not isinstance(rows, list):
            raise RuntimeError(
                f"profiles list failed (HTTP {st}): {str(rows)[:120]}")
        out.extend(rows)
        if len(rows) < PAGE:
            return out  # short page = end-of-results proof
        offset += PAGE
    raise RuntimeError(
        f"profiles enumeration hit the {MAX_PAGES}-page safety cap "
        f"({MAX_PAGES * PAGE:,} rows) without a short page — "
        "enumeration INCOMPLETE, partial data refused")


def fetch_subscription_client_ids(sb: str, service: str) -> list[str | None]:
    """Every subscriptions.client_id, paginated. Read-only.

    Same PAGINATION-COMPLETENESS LAW as fetch_profiles (hardening
    2026-11-25): a short SUBS_PAGE page is the only completion proof;
    the MAX_PAGES cap without one raises instead of truncating."""
    out: list[str | None] = []
    offset = 0
    for _ in range(MAX_PAGES):
        st, rows = _http(
            "GET",
            sb + f"/rest/v1/subscriptions?select=client_id"
                 f"&limit={SUBS_PAGE}&offset={offset}", service)
        if st != 200 or not isinstance(rows, list):
            raise RuntimeError(
                f"subscriptions list failed (HTTP {st}): {str(rows)[:120]}")
        out.extend(r.get("client_id") for r in rows)
        if len(rows) < SUBS_PAGE:
            return out  # short page = end-of-results proof
        offset += SUBS_PAGE
    raise RuntimeError(
        f"subscriptions enumeration hit the {MAX_PAGES}-page safety cap "
        f"({MAX_PAGES * SUBS_PAGE:,} rows) without a short page — "
        "enumeration INCOMPLETE, partial data refused")


def analyze(auth_users: list[dict], profiles: list[dict],
            sub_client_ids: list[str | None]) -> dict:
    """Pure logic — unit-tested directly. Returns the report structure."""
    auth_by_id = {u["id"]: u for u in auth_users if u.get("id")}
    prof_by_id = {p["id"]: p for p in profiles if p.get("id")}
    auth_ids, prof_ids = set(auth_by_id), set(prof_by_id)

    auth_without = [auth_by_id[i] for i in sorted(auth_ids - prof_ids)]
    prof_without = [prof_by_id[i] for i in sorted(prof_ids - auth_ids)]
    auth_without_ids = {u["id"] for u in auth_without}
    sub_orphans = sorted({c for c in sub_client_ids
                          if c and c not in prof_ids})

    # WARNING: flag ↔ reserved-domain mismatches (reported, never touched)
    flag_mismatch = [p for p in profiles
                     if bool(p.get("is_test_account"))
                     != is_test_email(p.get("email"))]
    test_dom_auth = [u for u in auth_users if is_test_email(u.get("email"))]
    test_dom_auth_bad = [u for u in test_dom_auth
                         if u.get("id") in auth_without_ids
                         or not prof_by_id.get(u.get("id"), {})
                         .get("is_test_account")]

    # INFO: the test-account census (profiles side + profile-less auth side)
    inventory = [p for p in profiles if is_test_email(p.get("email"))]
    inventory += [{"id": u.get("id"), "email": u.get("email"),
                   "role": "<no-profile>", "is_test_account": None,
                   "created_at": u.get("created_at")}
                  for u in test_dom_auth if u.get("id") in auth_without_ids]

    return {
        "totals": {"auth_users": len(auth_users),
                   "profiles": len(profiles),
                   "subscription_rows": len(sub_client_ids)},
        "auth_without_profiles": auth_without,
        "profiles_without_auth": prof_without,
        "orphaned_subscription_client_ids": sub_orphans,
        "test_flag_mismatch": flag_mismatch,
        "test_domain_auth_users_flagged_bad": test_dom_auth_bad,
        "test_account_inventory": inventory,
    }


def _fmt_created(s: str | None) -> str:
    return (s or "")[:10]  # date only


def render(report: dict) -> str:
    """Human summary — the ONLY place PII masking is enforced. Real
    (non-test-domain) identifiers never appear: counts, id8, role, flag."""
    t = report["totals"]
    lines = [
        "## Accounts orphan audit (auth ↔ profiles — read-only)",
        "",
        f"- auth users: {t['auth_users']} · profiles: {t['profiles']} · "
        f"subscription rows: {t['subscription_rows']}",
    ]

    failing = [
        ("auth_without_profiles", report["auth_without_profiles"],
         "auth user with NO profiles row"),
        ("profiles_without_auth", report["profiles_without_auth"],
         "profiles row with NO auth user"),
    ]
    for name, rows, what in failing:
        n = len(rows)
        lines.append(f"- {name}: {n}" + ("  **ORPHAN**" if n else " (clean)"))
        if n:
            lines.append(f"::error::accounts orphan audit: {n} × {what}")
        for r in rows[:DETAIL_CAP]:
            email = (r.get("email") or "")
            who = (email if is_test_email(email)
                   else f"<real account — id {_id8(r.get('id'))} only>")
            role = r.get("role", "?")
            flag = r.get("is_test_account")
            lines.append(f"    - {_id8(r.get('id'))} · {who} · role={role}"
                         f" · test={flag}"
                         f" · created={_fmt_created(r.get('created_at'))}")
        if n > DETAIL_CAP:
            lines.append(f"    … and {n - DETAIL_CAP} more (counts only)")

    n = len(report["orphaned_subscription_client_ids"])
    lines.append(f"- orphaned_subscription_client_ids: {n}"
                 + ("  **ORPHAN**" if n else " (clean)"))
    if n:
        lines.append("::error::accounts orphan audit: subscription rows "
                     "pointing at missing profiles")
        for cid in report["orphaned_subscription_client_ids"][:DETAIL_CAP]:
            lines.append(f"    - client_id {_id8(cid)}")

    warn = [
        ("test_flag_mismatch", report["test_flag_mismatch"],
         "is_test_account flag ≠ reserved-domain email"),
        ("test_domain_auth_users_flagged_bad",
         report["test_domain_auth_users_flagged_bad"],
         "reserved-domain auth user missing/unflagged profile"),
    ]
    for name, rows, what in warn:
        n = len(rows)
        lines.append(f"- warn {name}: {n}"
                     + ("" if n else " (clean)"))
        if n:
            lines.append(f"    (WARNING — owner decision domain, reported "
                         f"only: {what})")
        for r in rows[:DETAIL_CAP]:
            email = (r.get("email") or "")
            who = (email if is_test_email(email)
                   else f"<real account — id {_id8(r.get('id'))} only>")
            lines.append(f"    - {_id8(r.get('id'))} · {who}"
                         f" · created={_fmt_created(r.get('created_at'))}")

    inv = report["test_account_inventory"]
    lines.append(f"- test_account_inventory (reserved domains "
                 f"{', '.join(TEST_DOMAINS)}): {len(inv)}")
    for r in inv[:DETAIL_CAP * 2]:
        lines.append(f"    - {_id8(r.get('id'))} · {r.get('email')}"
                     f" · role={r.get('role')}"
                     f" · test={r.get('is_test_account')}"
                     f" · created={_fmt_created(r.get('created_at'))}")
    if len(inv) > DETAIL_CAP * 2:
        lines.append(f"    … and {len(inv) - DETAIL_CAP * 2} more")
    return "\n".join(lines)


def verdict(report: dict) -> int:
    """Exit code: orphans in the FAILING buckets → 1, else 0 (warnings
    are the owner's decision domain and never fail the gate)."""
    if (report["auth_without_profiles"]
            or report["profiles_without_auth"]
            or report["orphaned_subscription_client_ids"]):
        return ORPHANS
    return CLEAN


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--json", dest="json_path", default=None,
                    help="optional path for the machine-readable report")
    args = ap.parse_args()

    sb = (os.environ.get("SUPABASE_URL")
          or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
    service = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not sb or not service:
        print("::error::accounts_orphan_audit configuration error: "
              "SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL + "
              "SUPABASE_SERVICE_ROLE_KEY must be set (the same repo "
              "Actions secrets the migration-state gate uses)")
        return CONFIG_ERROR

    try:
        auth_users = auth_users_all(sb, service)
        profiles = fetch_profiles(sb, service)
        sub_ids = fetch_subscription_client_ids(sb, service)
    except RuntimeError as e:
        # PAGINATION-COMPLETENESS (hardening 2026-11-25): a failed or
        # unprovable enumeration is NOT a clean verdict and NOT an
        # orphan finding — the verdict is WITHHELD with an explicit
        # FAIL so nobody can read partial data as CLEAN.
        print("::error::accounts_orphan_audit enumeration INCOMPLETE — "
              "verdict WITHHELD (never CLEAN on partial data): "
              f"{e}")
        return INCOMPLETE

    report = analyze(auth_users, profiles, sub_ids)
    rc = verdict(report)

    summary = render(report)
    print(summary)
    step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if step_summary:
        with open(step_summary, "a", encoding="utf-8") as fh:
            fh.write(summary + "\n\n")

    if args.json_path:
        safe = dict(report)
        for key in ("auth_without_profiles", "profiles_without_auth",
                    "test_flag_mismatch",
                    "test_domain_auth_users_flagged_bad",
                    "test_account_inventory"):
            safe[key] = [dict(r, email=(r.get("email")
                                        if is_test_email(r.get("email"))
                                        else None))
                         for r in report[key]]
        safe["verdict"] = ("ORPHANS" if rc == ORPHANS else "CLEAN")
        safe["generated_at"] = datetime.now(timezone.utc).isoformat()
        with open(args.json_path, "w", encoding="utf-8") as fh:
            json.dump(safe, fh, ensure_ascii=False, indent=1)

    if rc == ORPHANS:
        print("::error::ACCOUNTS ORPHANS DETECTED — auth.users ↔ profiles "
              "integrity is broken (see buckets above). Real data is "
              "NEVER auto-deleted (AGENTS.md §3.3): the owner decides; "
              "test-channel leftovers self-heal via the qa.* stale "
              "sweeps on the next gate run.")
    else:
        print("accounts orphan audit: CLEAN — every auth user has its "
              "profiles row and every profiles row has its auth user; "
              "no subscription points at a missing profile.")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
