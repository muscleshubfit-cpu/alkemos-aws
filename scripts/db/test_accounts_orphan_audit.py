#!/usr/bin/env python3
"""Unit tests for the ACCOUNTS-ORPHAN-AUDIT frame (2026-11-25) — the
owner order: «اختبر حالات الحذف الكامل والحذف الجزئي، وتأكد من
التحقق الفعلي من اختفاء حساب Auth وسجلات قاعدة البيانات».

Covers, WITHOUT touching any real account (pure logic + mocked HTTP —
no test account is ever created by this suite):
  * accounts_orphan_audit.analyze/render/verdict — the partial-deletion
    detector: auth-without-profile, profile-without-auth, orphaned
    subscription rows, flag-mismatch warnings, inventory; and the
    privacy law (real emails never rendered).
  * probe_session._destroy_one — the full-deletion ACTUAL verification:
    the auth user must be re-read (not trusted by HTTP status alone).
  * probe_session.sweep_orphan_auth_users — the crash-window cleanup
    guards: ownership (prefix + reserved domain) and age are verified
    before ANY delete; young/profile-present/non-channel accounts are
    never touched.
  * probe_session.auth_users_all — pagination.
  * probe_fixture.cleanup_stale — wires the shared sweep with the
    fixture prefix.

Run:  python3 -m pytest scripts/db/test_accounts_orphan_audit.py -q
"""
from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import accounts_orphan_audit as aoa  # noqa: E402
import probe_fixture  # noqa: E402
import probe_session  # noqa: E402

NOW = datetime.now(timezone.utc)
OLD = (NOW - timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M:%S.000000Z")
YOUNG = (NOW - timedelta(minutes=2)).strftime("%Y-%m-%dT%H:%M:%S.000000Z")


def user(uid, email, created=OLD):
    return {"id": uid, "email": email, "created_at": created}


def prof(pid, email, role="client", test=True, created=OLD):
    return {"id": pid, "email": email, "role": role,
            "is_test_account": test, "created_at": created}


# --------------------------------------------------------------------------
# analyze / verdict / render — the partial-deletion detector (pure logic)
# --------------------------------------------------------------------------

def test_analyze_clean_state():
    a = user("11111111-1111-1111-1111-111111111111",
             "qa.client.x@alkemos-test.com")
    p = prof("11111111-1111-1111-1111-111111111111",
             "qa.client.x@alkemos-test.com")
    r = aoa.analyze([a], [p], ["11111111-1111-1111-1111-111111111111"])
    assert r["auth_without_profiles"] == []
    assert r["profiles_without_auth"] == []
    assert r["orphaned_subscription_client_ids"] == []
    assert r["test_flag_mismatch"] == []
    assert aoa.verdict(r) == aoa.CLEAN


def test_analyze_auth_without_profile_partial_deletion():
    """Partial deletion case (a): the auth user survived, the profile
    row did not (or was never created — trigger failure)."""
    orphan = user("22222222-2222-2222-2222-222222222222",
                  "qa.client.stale@alkemos-test.com")
    paired = user("11111111-1111-1111-1111-111111111111", "real@gmail.com")
    p = prof("11111111-1111-1111-1111-111111111111", "real@gmail.com")
    r = aoa.analyze([orphan, paired], [p], [])
    assert [u["id"] for u in r["auth_without_profiles"]] == [orphan["id"]]
    assert aoa.verdict(r) == aoa.ORPHANS


def test_analyze_profile_without_auth_partial_deletion():
    """Partial deletion case (ب): the profiles row survived, the auth
    user did not (cascade failure / partial manual deletion)."""
    orphan_prof = prof("33333333-3333-3333-3333-333333333333",
                       "qa.client.old@alkemos-test.com")
    paired_u = user("11111111-1111-1111-1111-111111111111", "real@gmail.com")
    paired_p = prof("11111111-1111-1111-1111-111111111111", "real@gmail.com")
    r = aoa.analyze([paired_u], [orphan_prof, paired_p], [])
    assert [p["id"] for p in r["profiles_without_auth"]] == [orphan_prof["id"]]
    assert aoa.verdict(r) == aoa.ORPHANS


def test_analyze_orphaned_subscription_rows():
    p = prof("11111111-1111-1111-1111-111111111111",
             "qa.client.x@alkemos-test.com")
    r = aoa.analyze([], [p], ["11111111-1111-1111-1111-111111111111",
                              "99999999-9999-9999-9999-999999999999", None])
    assert r["orphaned_subscription_client_ids"] == \
        ["99999999-9999-9999-9999-999999999999"]
    assert aoa.verdict(r) == aoa.ORPHANS


def test_analyze_flag_mismatch_is_warning_not_failure():
    """is_test_account on a non-test-domain email (and vice versa) is the
    owner's decision domain — reported loudly, never gate-failing."""
    flagged_real = prof("11111111-1111-1111-1111-111111111111",
                        "real@gmail.com", test=True)
    u = user("11111111-1111-1111-1111-111111111111", "real@gmail.com")
    unflagged_test = prof("22222222-2222-2222-2222-222222222222",
                          "member@alkemos-test.com", test=False)
    u2 = user("22222222-2222-2222-2222-222222222222",
              "member@alkemos-test.com")
    r = aoa.analyze([u, u2], [flagged_real, unflagged_test], [])
    assert len(r["test_flag_mismatch"]) == 2
    assert aoa.verdict(r) == aoa.CLEAN  # warning only


def test_analyze_test_domain_auth_user_unflagged():
    u = user("11111111-1111-1111-1111-111111111111",
             "member@alkemos-test.com")
    p = prof("11111111-1111-1111-1111-111111111111",
             "member@alkemos-test.com", test=False)
    r = aoa.analyze([u], [p], [])
    assert len(r["test_domain_auth_users_flagged_bad"]) == 1
    assert aoa.verdict(r) == aoa.CLEAN  # warning only


def test_analyze_inventory_counts_both_domains_and_orphans():
    u1 = user("11111111-1111-1111-1111-111111111111",
              "a@alkemos-test.com")
    p1 = prof("11111111-1111-1111-1111-111111111111", "a@alkemos-test.com")
    p2 = prof("22222222-2222-2222-2222-222222222222",
              "b@musclehub-test.com")
    u3 = user("33333333-3333-3333-3333-333333333333",
              "c@alkemos-test.com")  # auth orphan under test domain
    r = aoa.analyze([u1, u3], [p1, p2], [])
    emails = sorted(x["email"] for x in r["test_account_inventory"])
    assert emails == ["a@alkemos-test.com", "b@musclehub-test.com",
                      "c@alkemos-test.com"]


def test_render_never_prints_real_emails():
    """PRIVACY LAW (public repo): real identifiers never render — only
    counts, id8 prefixes, roles. Test-domain emails DO render."""
    orphan_real = user("44444444-4444-4444-4444-444444444444",
                       "someone.realsecret@gmail.com")
    p = prof("11111111-1111-1111-1111-111111111111",
             "qa.client.x@alkemos-test.com")
    u = user("11111111-1111-1111-1111-111111111111",
             "qa.client.x@alkemos-test.com")
    r = aoa.analyze([u, orphan_real], [p], [])
    text = aoa.render(r)
    assert "someone.realsecret@gmail.com" not in text
    assert "gmail.com" not in text
    assert "<real account — id 44444444 only>" in text
    assert "qa.client.x@alkemos-test.com" in text  # test domain prints
    assert "::error::accounts orphan audit" in text


def test_render_warns_without_error_annotations():
    u = user("11111111-1111-1111-1111-111111111111",
             "member@alkemos-test.com")
    p = prof("11111111-1111-1111-1111-111111111111",
             "member@alkemos-test.com", test=False)
    r = aoa.analyze([u], [p], [])
    text = aoa.render(r)
    assert "::error::" not in text
    assert "WARNING — owner decision domain" in text


# --------------------------------------------------------------------------
# probe_session._destroy_one — full-deletion ACTUAL verification
# --------------------------------------------------------------------------

class FakeHttp:
    """Scripted (status, body) responses, keyed by (method, url-substr).
    Records every call for assertions."""

    def __init__(self, script):
        self.script = script
        self.calls = []

    def __call__(self, method, url, key, token=None, body=None, timeout=30):
        self.calls.append((method, url))
        for m, frag, resp in self.script:
            if method == m and frag in url:
                return resp
        return 0, "no scripted response"


def test_destroy_one_verifies_auth_user_actually_gone(monkeypatch):
    """The ACCOUNTS-ORPHAN-AUDIT core fix: after DELETE, the auth user
    is RE-READ — disappearance must be verified, not assumed from the
    HTTP status."""
    fake = FakeHttp([
        ("DELETE", "/rest/v1/profiles?", (204, {})),
        ("DELETE", "/auth/v1/admin/users/", (200, {})),
        ("GET", "/rest/v1/profiles?select=id,email,role", (200, [])),
        ("GET", "/auth/v1/admin/users/", (404, {"code": 404})),
    ])
    monkeypatch.setattr(probe_session, "_http", fake)
    note = probe_session._destroy_one("https://sb", "K",
                                      "11111111-1111", "qa.probe.x@t")
    assert "profile:deleted" in note
    assert "auth-user:deleted" in note
    assert "residual:none" in note
    assert "auth-residual:none" in note
    # the verification GET really happened (not just the DELETE)
    assert any(m == "GET" and "/auth/v1/admin/users/" in u
               for m, u in fake.calls)


def test_destroy_one_flags_auth_user_still_there(monkeypatch):
    """The silent-orphan case the old code could NOT see: DELETE returns
    200 yet the user still exists — must be reported loudly."""
    fake = FakeHttp([
        ("DELETE", "/rest/v1/profiles?", (204, {})),
        ("DELETE", "/auth/v1/admin/users/", (200, {})),
        ("GET", "/rest/v1/profiles?select=id,email,role", (200, [])),
        ("GET", "/auth/v1/admin/users/", (200, {"id": "still-here"})),
    ])
    monkeypatch.setattr(probe_session, "_http", fake)
    note = probe_session._destroy_one("https://sb", "K",
                                      "11111111-1111", "qa.probe.x@t")
    assert "AUTH USER STILL THERE" in note


def test_destroy_one_handles_pre_deleted_auth_user(monkeypatch):
    """Profile present but auth user already gone (the owner's panel
    deletion half-done for a probe account): DELETE 404 is clean, the
    re-read proves gone."""
    fake = FakeHttp([
        ("DELETE", "/rest/v1/profiles?", (204, {})),
        ("DELETE", "/auth/v1/admin/users/", (404, {})),
        ("GET", "/rest/v1/profiles?select=id,email,role", (200, [])),
        ("GET", "/auth/v1/admin/users/", (404, {})),
    ])
    monkeypatch.setattr(probe_session, "_http", fake)
    note = probe_session._destroy_one("https://sb", "K",
                                      "11111111-1111", "qa.probe.x@t")
    assert "auth-residual:none" in note


# --------------------------------------------------------------------------
# probe_session.sweep_orphan_auth_users — crash-window cleanup guards
# --------------------------------------------------------------------------

def test_sweep_deletes_only_verified_orphans(monkeypatch):
    """Ownership on three axes (prefix + reserved domain + age) AND
    profile-gone — only then delete, and verify the disappearance."""
    orphan = user("aaaaaaaa-0000-0000-0000-000000000000",
                  "qa.probe.crash@alkemos-test.com", created=OLD)
    young = user("bbbbbbbb-0000-0000-0000-000000000000",
                 "qa.probe.active@alkemos-test.com", created=YOUNG)
    other_channel = user("cccccccc-0000-0000-0000-000000000000",
                         "qa.client.other@alkemos-test.com", created=OLD)
    profile_present = user("dddddddd-0000-0000-0000-000000000000",
                           "qa.probe.hasprofile@alkemos-test.com",
                           created=OLD)
    real = user("eeeeeeee-0000-0000-0000-000000000000",
                "someone@gmail.com", created=OLD)
    real_testdom = user("ffffffff-0000-0000-0000-000000000000",
                        "plain@alkemos-test.com", created=OLD)

    script = [
        ("GET", "per_page=200&page=1",
         (200, {"users": [orphan, young, other_channel,
                          profile_present, real, real_testdom],
                "next_page": None})),
        # profile lookups: only profile_present has one
        ("GET", "email=eq.qa.probe.crash@alkemos-test.com", (200, [])),
        ("GET", "email=eq.qa.probe.hasprofile@alkemos-test.com",
         (200, [{"id": profile_present["id"]}])),
        # the single delete + its verification
        ("DELETE", "/auth/v1/admin/users/aaaaaaaa", (200, {})),
        ("GET", "/auth/v1/admin/users/aaaaaaaa", (404, {})),
    ]
    fake = FakeHttp(script)
    monkeypatch.setattr(probe_session, "_http", fake)
    notes = probe_session.sweep_orphan_auth_users(
        "https://sb", "K", probe_session.PROBE_PREFIX)
    assert len(notes) == 1
    assert "qa.probe.crash@alkemos-test.com" in notes[0]
    assert "auth-residual:none" in notes[0]
    deleted = [u for m, u in fake.calls if m == "DELETE"]
    assert len(deleted) == 1 and "aaaaaaaa" in deleted[0]
    # the other five accounts were never deleted
    for uid in ("bbbbbbbb", "cccccccc", "dddddddd", "eeeeeeee", "ffffffff"):
        assert not any(m == "DELETE" and uid in u
                       for m, u in fake.calls)


def test_sweep_skips_unknown_age(monkeypatch):
    """Unknown created_at (unparseable) = MAY be an active run → never
    touched (conservative)."""
    weird = user("aaaaaaaa-0000-0000-0000-000000000000",
                 "qa.probe.weird@alkemos-test.com", created="not-a-date")
    fake = FakeHttp([
        ("GET", "per_page=200&page=1",
         (200, {"users": [weird], "next_page": None})),
    ])
    monkeypatch.setattr(probe_session, "_http", fake)
    notes = probe_session.sweep_orphan_auth_users(
        "https://sb", "K", probe_session.PROBE_PREFIX)
    assert notes == []
    assert not any(m == "DELETE" for m, _ in fake.calls)


def test_sweep_listing_failure_never_crashes(monkeypatch):
    fake = FakeHttp([("GET", "per_page=200&page=1", (500, "boom"))])
    monkeypatch.setattr(probe_session, "_http", fake)
    notes = probe_session.sweep_orphan_auth_users(
        "https://sb", "K", probe_session.PROBE_PREFIX)
    assert len(notes) == 1 and "skipped" in notes[0]


def test_auth_users_all_paginates(monkeypatch):
    page1 = {"users": [user(f"u{i}", f"u{i}@x.com") for i in range(200)],
             "next_page": 2}
    page2 = {"users": [user("last", "last@x.com")], "next_page": None}
    fake = FakeHttp([
        ("GET", "page=1", (200, page1)),
        ("GET", "page=2", (200, page2)),
    ])
    monkeypatch.setattr(probe_session, "_http", fake)
    users = probe_session.auth_users_all("https://sb", "K")
    assert len(users) == 201
    assert users[-1]["id"] == "last"


def test_fixture_cleanup_wires_shared_sweep(monkeypatch):
    """probe_fixture.cleanup_stale sweeps with the FIXTURE prefix (its
    own crash-window orphans) — wiring test."""
    seen = {}

    def fake_sweep(sb, service, prefix):
        seen["prefix"] = prefix
        return ["orphaned auth user x: auth-user:deleted, auth-residual:none"]

    monkeypatch.setattr(probe_fixture, "sweep_orphan_auth_users", fake_sweep)
    fake = FakeHttp([
        ("GET", "email=like.qa.client.*", (200, [])),  # no stale profiles
    ])
    monkeypatch.setattr(probe_fixture, "_http", fake)
    notes = probe_fixture.cleanup_stale("https://sb", "K")
    assert seen["prefix"] == probe_fixture.FIXTURE_PREFIX
    assert notes == ["orphaned auth user x: auth-user:deleted, "
                     "auth-residual:none"]


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-q"]))
