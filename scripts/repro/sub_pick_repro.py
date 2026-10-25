#!/usr/bin/env python3
"""SUB-PICK repro (read-only) — re-subscribes the reported state on live rows.

The owner-reported state (2026-10-26 order, item 3): «اشتراك التدريب المجدد
يظهر منتهيًا مع استمرار ظهور اشتراك Premium قديم» — the renewed training
subscription renders EXPIRED while an old Premium keeps being shown.

ROOT CAUSE hypothesis this script MEASURES (before any code change):
every staff-side "primary subscription" pick orders by tier priority
(pro > premium > coaching) with NO expiry term, so an EXPIRED premium
masks a RENEWED-ACTIVE coaching row. The 0030D RPC additionally builds a
Frankenstein row (tier from the priority-ordered subquery, status /
end_date / months from the created_at-ordered subquery — different rows).

The script replays, on the LIVE rows (read-only SELECTs):
  A. get_coach_client_list_paged / get_coach_client_stats (0047) lateral
  B. get_coach_client_list (0030D) subqueries (incl. the Frankenstein mix)
  C. lib/subscription-view.ts pickPrimarySubscription (TS pick law)
  D. the FIXED active-first law (expiry-aware pick) for comparison
and prints each client's displayed tier + effective status under A/B/C vs D.

Usage:
  SUPABASE_SERVICE_ROLE_KEY=<key> python3 scripts/repro/sub_pick_repro.py
Zero DB writes. Secrets come from env only — never committed, never printed.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

SB = "https://wyopqryzfjifyeyvyxfy.supabase.co"
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


def rest(path: str):
    req = urllib.request.Request(
        f"{SB}/rest/v1/{path}",
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def parse_ts(v: str) -> datetime:
    # PostgREST timestamptz → "2026-10-22T14:34:57.123456+00:00"
    return datetime.fromisoformat(v.replace("Z", "+00:00"))


def is_effectively_active(row) -> bool:
    # SQL convention of _is_active in 0047: status='active' AND end_date > now()
    # (NULL end_date is NOT active — same convention as every server filter).
    if row.get("status") != "active":
        return False
    end = row.get("end_date")
    if not end:
        return False
    return parse_ts(end) > datetime.now(timezone.utc)


def tier_priority(tier: str) -> int:
    return {"pro": 3, "premium": 2, "coaching": 1}.get(tier, 0)


def pick_0047_lateral(rows, admin_view: bool):
    """0047 get_coach_client_list_paged / stats lateral: tier priority desc,
    created_at desc, limit 1 — NO expiry term. Coach (non-admin) sees only
    the coaching row (the RPC's WHERE clause)."""
    visible = rows if admin_view else [r for r in rows if r["tier"] == "coaching"]
    if not visible:
        return None
    return sorted(
        visible,
        key=lambda r: (tier_priority(r["tier"]), parse_ts(r["created_at"])),
        reverse=True,
    )[0]


def pick_0030d_frankenstein(rows):
    """0030D get_coach_client_list: tier subquery orders by tier priority,
    status/end_date/months subqueries order by created_at desc — the four
    fields can come from DIFFERENT rows."""
    if not rows:
        return None
    by_priority = sorted(
        rows,
        key=lambda r: (tier_priority(r["tier"]), parse_ts(r["created_at"])),
        reverse=True,
    )[0]
    by_created = sorted(rows, key=lambda r: parse_ts(r["created_at"]), reverse=True)[0]
    return {
        "tier": by_priority["tier"],
        "status": by_created["status"],
        "end_date": by_created["end_date"],
        "months": by_created["months"],
        "_note": "tier≠rest whenever the two subqueries disagree",
    }


def pick_ts_law(rows):
    """lib/subscription-view.ts pickPrimarySubscription: best membership
    (pro > premium) else first coaching — NO expiry term (current code)."""
    if not rows:
        return None
    members = [r for r in rows if r["tier"] in ("premium", "pro")]
    if members:
        return sorted(members, key=lambda r: tier_priority(r["tier"]), reverse=True)[0]
    coaching = [r for r in rows if r["tier"] == "coaching"]
    return coaching[0] if coaching else None


def pick_fixed_active_first(rows):
    """THE FIX: effectively-active rows first (best membership among them),
    else the best expired row — an expired premium can never mask an
    active coaching renewal."""
    if not rows:
        return None
    active = [r for r in rows if is_effectively_active(r)]
    pool = active if active else rows
    members = [r for r in pool if r["tier"] in ("premium", "pro")]
    if members:
        return sorted(members, key=lambda r: tier_priority(r["tier"]), reverse=True)[0]
    coaching = [r for r in pool if r["tier"] == "coaching"]
    return coaching[0] if coaching else None


def eff_label(row):
    return "ACTIVE" if is_effectively_active(row) else "expired"


def main():
    if not KEY:
        raise SystemExit("missing SUPABASE_SERVICE_ROLE_KEY (env only — see .env.example)")

    subs = rest(
        "subscriptions?select=id,client_id,tier,months,start_date,end_date,"
        "status,subscription_type,created_at&order=created_at.asc"
    )
    by_client: dict = {}
    for r in subs:
        by_client.setdefault(r["client_id"], []).append(r)

    print(f"== SUB-PICK repro on {len(subs)} live subscription rows, "
          f"{len(by_client)} clients (read-only) ==\n")

    reproduced = False
    for cid, rows in by_client.items():
        if len(rows) < 2:
            continue  # single-sub clients cannot show the masking defect
        a = pick_0047_lateral(rows, admin_view=True)
        b = pick_0030d_frankenstein(rows)
        c = pick_ts_law(rows)
        d = pick_fixed_active_first(rows)
        summary = " | ".join(
            f"{r['tier']}({eff_label(r)}, end={str(r['end_date'])[:10]})"
            for r in sorted(rows, key=lambda r: r["created_at"])
        )
        print(f"client {cid[:8]}: {summary}")
        print(f"  A 0047 lateral (admin)  → {a['tier']} {eff_label(a)} — list badge: "
              f"{'active' if is_effectively_active(a) else 'منتهي/EXPIRED'}")
        if isinstance(b, dict):
            b_eff = "ACTIVE" if (
                b["status"] == "active" and b["end_date"]
                and parse_ts(b["end_date"]) > datetime.now(timezone.utc)
            ) else "expired"
            frankenstein = b["tier"] != {
                r["tier"] for r in rows if r["status"] == b["status"]
                and r["end_date"] == b["end_date"] and r["months"] == b["months"]
            }
            print(f" B 0030D frankenstein    → tier={b['tier']} status={b['status']} "
                  f"end={str(b['end_date'])[:10]} eff={b_eff}"
                  f"{'  ← MIXED-ROW (tier from another sub row)' if frankenstein else ''}")
        print(f"  C TS pick law (header)  → {c['tier']} {eff_label(c)}")
        print(f"  D FIXED active-first    → {d['tier']} {eff_label(d)}  ← the law after this frame")
        # The reported state: a RENEWED (effectively active) coaching row is
        # masked by an EXPIRED higher-tier row in A/B/C.
        renewed_coaching_active = any(
            r["tier"] == "coaching" and is_effectively_active(r) for r in rows
        )
        shown_masks_it = renewed_coaching_active and a and a["tier"] != "coaching"
        if renewed_coaching_active:
            tag = "REPRODUCED ✗" if shown_masks_it else "already honest ✓"
            print(f"  renewed-active-coaching client → staff pick shows "
                  f"{'the EXPIRED ' + a['tier'] + ' (the reported bug)' if shown_masks_it else 'the active row'}"
                  f"  [{tag}]")
            reproduced = reproduced or shown_masks_it
        print()

    print(f"== verdict: reported state "
          f"{'REPRODUCED on live data — root cause confirmed' if reproduced else 'not present in the current live rows'}"
          f" ==")
    return 0


if __name__ == "__main__":
    sys.exit(main())
