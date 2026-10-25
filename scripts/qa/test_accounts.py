#!/usr/bin/env python3
"""QA test-accounts channel tool — the ONLY sanctioned agent path for the
test-account lifecycle on production (AGENTS.md §3.3 carve-out + §6
TEST-ACCOUNTS CHANNEL + docs/QA-TEST-ACCOUNTS-2026-10-26.md, owner
directive 2026-10-26).

A QA test account is identified by BOTH:
  * email under the RESERVED domain  @alkemos-test.com
  * profiles.is_test_account = true   (column live since migration 0045)

Hard guards built into this tool (it refuses to run otherwise):
  * every target email MUST end with @alkemos-test.com
  * auth users are created through the Supabase ADMIN API only —
    this tool never issues direct SQL against auth.users
  * profile writes are domain-scoped single-row UPDATEs (role + flag)
  * fixture writes verify the target profile is a test account first
  * NO delete command exists here — cleanup stays an owner-run
    RUN_ON_SUPABASE_* file (the 0095 pattern; `cleanup-sql` prints it)
  * the service key comes from env only; it is never printed or logged
  * passwords are random one-time values printed once at generation

Usage:
  export SUPABASE_SERVICE_ROLE_KEY=<key>     # env only — never commit
  python3 scripts/qa/test_accounts.py <command> [args]

Commands:
  create <role> [local]        create qa.<local|role>@alkemos-test.com
                               role in {admin,coach,member}; prints the
                               one-time password (account is reusable)
  login-check <email> <pass>   verify credentials + print the profile
                               role the app would resolve (read-only)
  reset-password <email>       new random password (prints it once)
  show                         list all test accounts (read-only)
  fixture-subs <member-email>  give a TEST member the reported state:
                               expired premium + active coaching
  fixture-assignment <coach> <member>   link test coach to test member
  verify-client-subs <email>   read-only: the member's subscription rows
                               + what the 0102 active-first pick shows
  cleanup-sql                  print the OWNER-run cleanup SQL file
                               (0095 pattern, scoped to the domain)
"""
import json
import os
import secrets
import string
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

SB = "https://wyopqryzfjifyeyvyxfy.supabase.co"
DOMAIN = "@alkemos-test.com"
ROLES = ("admin", "coach", "member")
KEY = ""  # filled in main() from env


# ---------------------------------------------------------------- helpers
def die(msg: str, code: int = 2) -> None:
    print(f"REFUSED: {msg}", file=sys.stderr)
    raise SystemExit(code)


def guard_test_email(email: str) -> str:
    email = email.strip().lower()
    if not email.endswith(DOMAIN):
        die(f"«{email}» is not under the reserved test domain {DOMAIN} — "
            "the Test-Accounts Channel never touches non-test targets "
            "(AGENTS.md §6 / docs/QA-TEST-ACCOUNTS-2026-10-26.md)")
    if " " in email or ".." in email:
        die(f"«{email}» is not a well-formed test address")
    return email


def http(method: str, path: str, body: dict | list | None = None,
         token: str | None = None) -> tuple[int, object]:
    """One request against Supabase (PostgREST or GoTrue). Returns
    (status, parsed-json-or-text). Never raises for 4xx/5xx."""
    headers = {"apikey": KEY, "Authorization": f"Bearer {token or KEY}"}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{SB}{path}", data=data,
                                 headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw.strip() else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def profile_by_email(email: str) -> dict | None:
    st, rows = http(
        "GET",
        "/rest/v1/profiles?select=id,email,role,is_test_account,full_name"
        f"&email=eq.{email}")
    if st != 200 or not isinstance(rows, list):
        die(f"profile lookup failed for {email} (HTTP {st}): "
            f"{str(rows)[:200]}")
    return rows[0] if rows else None


def must_be_test_profile(email: str, expect_role: str | None = None) -> dict:
    p = profile_by_email(guard_test_email(email))
    if p is None:
        die(f"no profile exists yet for {email} — create it first")
    if not p.get("is_test_account"):
        die(f"profile {email} has is_test_account=false — REFUSING to "
            "touch it (a non-test row was never channel-eligible)")
    if expect_role and p.get("role") != expect_role:
        die(f"profile {email} has role={p.get('role')!r}, expected "
            f"{expect_role!r}")
    return p


def gen_password() -> str:
    alphabet = string.ascii_letters + string.digits + "-_"
    pw = [secrets.choice(alphabet) for _ in range(18)]
    # guarantee the three character classes
    pw[0], pw[1], pw[2] = ("A", "9", "q")
    return "".join(pw)


# ------------------------------------------------------------- commands
def cmd_create(role: str, local: str | None) -> None:
    if role not in ROLES:
        die(f"role must be one of {ROLES}")
    email = guard_test_email(f"qa.{local or role}{DOMAIN}")
    password = gen_password()

    existing = profile_by_email(email)
    if existing:
        if not existing.get("is_test_account"):
            die(f"{email} exists as a NON-test profile — refusing; "
                "investigate before any channel action")
        print(f"account {email} already exists (role="
              f"{existing.get('role')}) — reuse it via `reset-password`, "
              "or pick another local part")
        return

    # 1) auth user via the ADMIN API (never direct auth.users SQL)
    st, body = http("POST", "/auth/v1/admin/users", {
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {"full_name": f"QA {role} (alkemos-test)"},
    })
    if st not in (200, 201):
        die(f"admin-API user creation failed (HTTP {st}): "
            f"{str(body)[:300]}")

    # 2) the handle_new_user() trigger normally creates the profile with
    #    role='client'; wait briefly, then set role + test flag
    uid = None
    for _ in range(6):
        p = profile_by_email(email)
        if p:
            uid = p["id"]
            break
        time.sleep(1)
    if uid is None:
        die("auth user created but no profile row appeared (trigger "
            "handle_new_user() did not fire?) — STOP and report; do not "
            "hand-write rows")

    st, _ = http("PATCH", f"/rest/v1/profiles?id=eq.{uid}", {
        "role": role if role != "member" else "client",
        "is_test_account": True,
    })
    if st not in (200, 204):
        die(f"profile role/flag update failed (HTTP {st})")

    p = must_be_test_profile(email)
    print(f"CREATED test {role}: {email}")
    print(f"  profile id : {p['id']}")
    print(f"  role       : {p['role']}  (is_test_account=true)")
    print("  one-time password (store in session memory / owner report "
          "ONLY — never in the repo):")
    print(f"    {password}")


def cmd_login_check(email: str, password: str) -> None:
    email = guard_test_email(email)
    # the password grant is a public endpoint; the service key doubles
    # as the apikey (GoTrue accepts it) — the response token is never
    # printed.
    st, body = http("POST", "/auth/v1/token?grant_type=password",
                    {"email": email, "password": password})
    if st != 200:
        die(f"login failed (HTTP {st}): {str(body)[:200]}")
    p = profile_by_email(email)
    if p and not p.get("is_test_account"):
        die("logged in, but the profile is NOT a test account — "
            "credentials work for a REAL account; refuse to continue")
    print(f"LOGIN OK: {email} (profile role="
          f"{(p or {}).get('role')}, is_test_account="
          f"{(p or {}).get('is_test_account')})")


def cmd_reset_password(email: str) -> None:
    p = must_be_test_profile(email)
    password = gen_password()
    st, body = http("PUT", f"/auth/v1/admin/users/{p['id']}",
                    {"password": password})
    if st != 200:
        die(f"password reset failed (HTTP {st}): {str(body)[:200]}")
    print(f"PASSWORD RESET for {email}. One-time password "
          "(session memory / owner report only):")
    print(f"    {password}")


def cmd_show() -> None:
    st, rows = http(
        "GET",
        "/rest/v1/profiles?select=id,email,role,created_at"
        "&is_test_account=eq.true&order=created_at.asc")
    if st != 200:
        die(f"list failed (HTTP {st}): {str(rows)[:200]}")
    print(f"== {len(rows)} QA test account(s) (is_test_account=true) ==")
    for r in rows:
        print(f"  {r['email']:<42} role={r['role']:<7} "
              f"created={str(r['created_at'])[:10]}  id={r['id'][:8]}…")


def cmd_fixture_subs(email: str) -> None:
    p = must_be_test_profile(email, expect_role="client")
    now = datetime.now(timezone.utc)
    rows = [
        # the REPORTED state verbatim: an old premium whose end_date is
        # past (effectively expired) + a renewed active coaching row —
        # exactly the samarsamy0992-class display case for 0102.
        {"client_id": p["id"], "tier": "premium", "months": 1,
         "status": "active",
         "start_date": (now - timedelta(days=60)).isoformat(),
         "end_date": (now - timedelta(days=16)).isoformat()},
        {"client_id": p["id"], "tier": "coaching", "months": 1,
         "status": "active",
         "start_date": (now - timedelta(days=14)).isoformat(),
         "end_date": (now + timedelta(days=30)).isoformat()},
    ]
    st, body = http("POST", "/rest/v1/subscriptions", rows)
    if st not in (200, 201):
        die(f"subscription fixture failed (HTTP {st}): {str(body)[:300]}")
    print(f"FIXTURED on {email}: expired premium (end "
          f"{rows[0]['end_date'][:10]}) + active coaching (end "
          f"{rows[1]['end_date'][:10]}) — the 0102 display case")


def cmd_fixture_assignment(coach: str, member: str) -> None:
    c = must_be_test_profile(coach, expect_role="coach")
    m = must_be_test_profile(member, expect_role="client")
    st, body = http("POST", "/rest/v1/coach_assignments",
                    {"coach_id": c["id"], "client_id": m["id"]})
    if st not in (200, 201):
        die(f"assignment fixture failed (HTTP {st}): {str(body)[:300]}")
    print(f"ASSIGNED test coach {coach} to test member {member}")


def cmd_verify_client_subs(email: str) -> None:
    """Read-only. Works for a REAL client email too (read-only SELECTs
    are allowed for verification — AGENTS.md §3.3)."""
    email = email.strip().lower()
    p = profile_by_email(email)
    if p is None:
        die(f"no profile for {email}")
    st, rows = http(
        "GET",
        "subscriptions?select=id,tier,months,start_date,end_date,status,"
        f"subscription_type,created_at&client_id=eq.{p['id']}"
        "&order=created_at.asc")
    if st != 200:
        die(f"subscription read failed (HTTP {st})")

    def eff(r: dict) -> str:
        if r.get("status") != "active" or not r.get("end_date"):
            return "expired"
        end = datetime.fromisoformat(r["end_date"].replace("Z", "+00:00"))
        return "ACTIVE" if end > datetime.now(timezone.utc) else "expired"

    print(f"== {email} ({len(rows)} subscription rows) — read-only ==")
    for r in rows:
        print(f"  {r['tier']:<9} status={r['status']:<8} "
              f"end={str(r['end_date'])[:10]} -> effectively {eff(r)}")
    tier_rank = {"pro": 3, "premium": 2, "coaching": 1}
    active = [r for r in rows if eff(r) == "ACTIVE"]
    pool = active or rows
    pick = max(pool, key=lambda r: tier_rank.get(r["tier"], 0),
               default=None)
    if pick:
        print(f"0102 active-first pick -> {pick['tier']} ({eff(pick)}) "
              "<- what staff surfaces must display as the primary "
              "subscription")


CLEANUP_SQL = """-- =====================================================================
-- RUN_ON_SUPABASE_QA_TEST_ACCOUNTS_CLEANUP.sql  (OWNER-RUN — 0095 pattern)
-- =====================================================================
-- مسح كل حسابات الاختبار تحت النطاق المحجوز @alkemos-test.com
-- (قناة حسابات الاختبار — docs/QA-TEST-ACCOUNTS-2026-10-26.md).
-- التشغيل: Supabase Dashboard -> SQL Editor -> paste -> Run
-- النتيجة المتوقعة: جدول التحقق يرجّع أصفارًا. Idempotent.
-- =====================================================================
do $$
declare
  r record;
begin
  for r in select id, email from public.profiles
            where email like '%@alkemos-test.com'
              and is_test_account = true
  loop
    raise notice 'wiping test account %', r.email;
    delete from public.chat_messages         where client_id = r.id;
    delete from public.saved_results         where user_id   = r.id;
    delete from public.meal_plans            where user_id   = r.id;
    delete from public.plan_swaps            where user_id   = r.id;
    delete from public.coach_presence        where coach_id  = r.id;
    delete from public.progress_photos       where user_id   = r.id;
    delete from public.subscription_requests where user_id   = r.id;
    delete from public.evo_chat_usage        where user_id   = r.id;
    delete from public.ticket_messages       where sender_id = r.id;
    delete from public.evo_call_stats        where user_id   = r.id;
    delete from public.tool_leads            where email     = r.email;
    update public.coach_wallet_transactions set created_by = null
      where created_by = r.id;
    delete from public.profiles              where id        = r.id;
    delete from auth.users                   where id        = r.id;
  end loop;
end $$;
notify pgrst, 'reload schema';
select
  (select count(*) from auth.users    where email like '%@alkemos-test.com') as auth_left,
  (select count(*) from public.profiles where email like '%@alkemos-test.com') as profiles_left;
-- (الجداول ذات الفهارس الحية إلى profiles تمسح كاسكيدًا — نمط 0095)
"""


def cmd_cleanup_sql() -> None:
    print(CLEANUP_SQL)
    print("-- ^ OWNER-RUN ONLY: the agent never executes DELETEs "
          "(AGENTS.md §3.3/§6).", file=sys.stderr)


def main() -> int:
    global KEY
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    cmd, rest = args[0], args[1:]
    if cmd != "cleanup-sql":
        KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not KEY:
            raise SystemExit(
                "missing SUPABASE_SERVICE_ROLE_KEY (env only — see "
                "docs/QA-TEST-ACCOUNTS-2026-10-26.md; never commit it)")
    if cmd == "create" and len(rest) in (1, 2):
        cmd_create(rest[0], rest[1] if len(rest) == 2 else None)
    elif cmd == "login-check" and len(rest) == 2:
        cmd_login_check(rest[0], rest[1])
    elif cmd == "reset-password" and len(rest) == 1:
        cmd_reset_password(rest[0])
    elif cmd == "show" and not rest:
        cmd_show()
    elif cmd == "fixture-subs" and len(rest) == 1:
        cmd_fixture_subs(rest[0])
    elif cmd == "fixture-assignment" and len(rest) == 2:
        cmd_fixture_assignment(rest[0], rest[1])
    elif cmd == "verify-client-subs" and len(rest) == 1:
        cmd_verify_client_subs(rest[0])
    elif cmd == "cleanup-sql" and not rest:
        cmd_cleanup_sql()
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
