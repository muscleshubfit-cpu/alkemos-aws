#!/usr/bin/env python3
"""Migration edit guard — an applicable migration file is IMMUTABLE after
landing: only ADDED is legal; MODIFIED / RENAMED / DELETED is a hard gate.

ROOT CAUSE THIS GUARD KILLS (2026-11-05 — the 42804 class,
docs/MIGRATION-GATE-ISSUE3-RESOLUTION-2026-11-10.md):
  Production applied the FIRST 0105 (role_audit_log with old_role/new_role
  of type public.user_role) and recorded version 20261105140000 in the
  ledger. The repo file was then EDITED IN PLACE (enum → text + ::text
  casts, commit 20d47281 — the 0104 portability law) AFTER the apply. The
  ledger keeps the version recorded, so no channel would ever re-run the
  edited file: production kept the enum-shaped table while every later
  artifact (0106's ::text-cast trigger, from the EDITED file's shape)
  assumed text. Result: EVERY role write failed 42804
  («column "old_role" is of type user_role but expression is of type
  text») — the state gate's ephemeral QA session could not be provisioned
  (its role PATCH runs through the same trigger), the 0102/0105 behavioral
  probes turned UNVERIFIABLE, and the deploy gate blocked a release within
  minutes (run 42041387938). 0107 reconciled production by converting the
  columns to text.

  Why neither existing gate caught the edit: the ledger only keys on the
  VERSION (unchanged by an edit), and the local test stack applies the
  file FRESH — the edit looked perfectly valid there. The desync class is
  file-CONTENT drift against an already-applied version.

THE LAW (AGENTS.md §6 — 2026-11-10 update): an applicable migration file
  is never renamed (Phase 61) and never EDITED after landing — corrections
  ship as a NEW migration (the 0107 pattern: reconcile the live shape with
  the intended one). This guard turns the law into a hard push/PR gate.

SCOPE: only the auto-applied family (YYYYMMDDHHMMSS_NNNN_*.sql + legacy
  0001..0005). The manual RUN_ON_SUPABASE_*/VERIFY_* family is not
  ledger-applied and stays outside this law (INDEX.md §1).

USAGE (db-migrate.yml validate · deploy-aws.yml migrate):
  MIGRATION_EDIT_RANGE="<git-range>" python3 scripts/db/migration_edit_guard.py
  Exit 0 = only additions (or nothing) · 1 = edited/renamed/deleted
  applicable file(s) listed · 2 = range unusable (reported, not gated).
"""

from __future__ import annotations

import os
import re
import subprocess
import sys

APPLICABLE_RE = re.compile(r"supabase/migrations/(\d{14}|\d{4})_.+\.sql$")


def git(args: list[str]) -> tuple[int, str]:
    p = subprocess.run(["git"] + args, capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr)


def main() -> int:
    rng = os.environ.get("MIGRATION_EDIT_RANGE", "").strip()
    if not rng:
        print("migration edit guard: no diff range provided — skipped "
              "(nothing to check)")
        return 0

    rc, out = git(["diff", "--name-status", rng, "--", "supabase/migrations/"])
    if rc != 0:
        # An unusable range must never silently pass: report it loudly but
        # do not invent a violation (the state gate stays the DB authority).
        print(f"::error::migration edit guard: git diff failed for range "
              f"{rng!r}: {out[-300:]}")
        return 2
    if not out.strip():
        print("migration edit guard: no migration files in the push diff "
              "— CLEAN")
        return 0

    violations: list[str] = []
    additions = 0
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        status, paths = parts[0], parts[1:]
        # A100/C100/R100 style codes: the letter is the change class
        kind = status[0].upper()
        applicable = [p for p in paths if APPLICABLE_RE.search(p)]
        if not applicable:
            continue  # RUN_ON_*/VERIFY_* manual family — outside this law
        if kind == "A":
            additions += 1
            continue
        # M / D / R / C / T on an applicable file = the desync class
        for p in applicable:
            violations.append(f"{status}\t{p}")

    print(f"migration edit guard: {additions} added · "
          f"{len(violations)} modified/renamed/deleted applicable "
          f"migration file(s)")
    if violations:
        print("::error::migration edit guard: applicable migration file(s) "
              "MODIFIED / RENAMED / DELETED after landing. The production "
              "ledger records the ORIGINAL version as applied, so the edit "
              "will NEVER run — the file and the applied shape "
              "desynchronize (the 2026-11-05 42804 class: every role write "
              "failed, the gate turned UNVERIFIABLE, a deploy was blocked). "
              "Ship a NEW migration instead (the 0107 pattern) — "
              "AGENTS.md §6 · docs/MIGRATION-GATE-ISSUE3-RESOLUTION-"
              "2026-11-10.md:")
        for v in violations:
            print(f"::error::  {v}")
        return 1
    print("migration edit guard: only additions — CLEAN")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
