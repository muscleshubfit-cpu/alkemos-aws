#!/usr/bin/env python3
"""Controlled migration applier — ledger-driven, transactional, observable.

Part of the DB-MIGRATION-PIPELINE-2026-10-27 fix (owner order 2026-10-27).
Replaces trust in the externally-hosted Supabase–GitHub integration (which
died at the 2026-10-09 repo cutover — last applied: 0100 on 2026-10-02 (commit 5d3b3b2a, on the PRE-cutover repo); the alkemos-aws repo was never re-linked, so 0101/0102/0103 on the new repo were missed) with an
in-repo mechanism the project can SEE.

DESIGN LAWS (docs/DB-MIGRATION-PIPELINE-2026-10-27.md):
  1. LEDGER-DRIVEN — the ONLY source of "what is applied" is
     `supabase_migrations.schema_migrations` on the target database. A
     migration already recorded there is NEVER re-run (no re-execution of
     old migrations, no data damage).
  2. ORDERED — pending applicable migrations apply strictly in version
     order (lexicographic = chronological for the timestamped family).
  3. SAFETY FLOOR — a pending migration OLDER than SAFETY_FLOOR (default:
     20261003060000 = 0100, the last migration PROVEN applied on
     production) means the ledger drifted backward (Phase-61 class). The
     applier HALTS with evidence instead of re-running history. Repair =
     the documented `--mark-applied` channel (the granular 0054 pattern),
     never blind re-application.
  4. ONE TRANSACTION PER MIGRATION — psql --single-transaction +
     ON_ERROR_STOP: a failing migration rolls back fully and is NOT
     recorded — safe to retry.
  5. APPLICABLE FAMILY ONLY — `YYYYMMDDHHMMSS_NNNN_<slug>.sql` +
     legacy numeric `0001..0005`. RUN_ON_SUPABASE_* / VERIFY_* manual
     files are NEVER touched (INDEX.md §1).
  6. OBSERVABLE — every decision prints; the final state lands in
     GITHUB_STEP_SUMMARY; ends with `NOTIFY pgrst, 'reload schema'`.

MODES
  (default)          apply pending (with the safety floor)
  --dry-run          print the ledger↔repo diff, change nothing
  --mark-applied V…  record versions as applied WITHOUT running them
                     (ledger repair for migrations whose effects are
                     already live — the granular 0054 pattern)

ENV
  SUPABASE_DB_URL (required) — postgres://… connection string
  SAFETY_FLOOR (optional, default 20261003060000)

Exit codes: 0 ok · 1 failure · 2 config · 3 safety-floor halt (drift).
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(
    os.path.abspath(__file__)), "..", ".."))
MIGRATIONS_DIR = os.path.join(REPO_ROOT, "supabase", "migrations")
APPLICABLE_RE = re.compile(r"^(\d{14}|\d{4})_.+\.sql$")
DEFAULT_FLOOR = "20261003060000"  # 0100 — last PROVEN applied (probe PASS)
LOCK_TAG = "alkemos_migration_pipeline"
NOTIFY = "NOTIFY pgrst, 'reload schema';"


def die(code: int, msg: str) -> int:
    print(f"::error::{msg}")
    return code


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def psql(db_url: str, sql: str, fatal: bool = True) -> tuple[int, str]:
    """Execute SQL; returns (exit, combined output)."""
    if not shutil.which("psql"):
        print("psql client missing — installing postgresql-client …")
        r = run(["sudo", "apt-get", "install", "-y", "-qq",
                 "postgresql-client"])
        if r.returncode != 0 and not shutil.which("psql"):
            return 2, "postgresql-client install failed: " + r.stderr[-400:]
    p = run(["psql", db_url, "-v", "ON_ERROR_STOP=1", "-tAc", sql])
    out = (p.stdout + p.stderr).strip()
    if p.returncode != 0 and fatal:
        return p.returncode, out
    return p.returncode, out


def applicable_files() -> list[tuple[str, str]]:
    """[(version, filename)] of the auto-applied family, version order."""
    out = []
    for name in os.listdir(MIGRATIONS_DIR):
        m = APPLICABLE_RE.match(name)
        if m:
            out.append((m.group(1), name))
    return sorted(out)


def ledger_columns(db_url: str) -> list[str]:
    _, out = psql(db_url, (
        "select column_name from information_schema.columns "
        "where table_schema='supabase_migrations' "
        "and table_name='schema_migrations' order by ordinal_position"),
        fatal=False)
    return [c.strip() for c in out.splitlines() if c.strip()]


def read_ledger(db_url: str) -> tuple[set[str], str]:
    cols = ledger_columns(db_url)
    if not cols:
        return set(), ("supabase_migrations.schema_migrations not "
                       "readable/found")
    _, out = psql(db_url, (
        "select version from supabase_migrations.schema_migrations "
        "order by version"))
    return {v.strip() for v in out.splitlines() if v.strip()}, ""


def record_version(db_url: str, version: str, name: str,
                   ran: bool) -> tuple[int, str]:
    cols = ledger_columns(db_url)
    if not cols:
        return 1, "schema_migrations table missing — refusing to apply " \
                  "without a ledger to record into"
    # build an INSERT covering whichever of (version, name, statements)
    # exist in this table's DDL (CLI versions differ) — statements may be
    # text[] with a default; supply the minimum safe values.
    cols_l = {c.lower() for c in cols}
    fields, values = [], []
    if "version" in cols_l:
        fields.append("version"); values.append(f"'{version}'")
    if "name" in cols_l:
        fields.append("name"); values.append(f"'{name}'")
    if "statements" in cols_l:
        fields.append("statements"); values.append("'{}'")
    if not fields:
        return 1, f"unexpected schema_migrations columns: {cols}"
    sql = ("insert into supabase_migrations.schema_migrations "
           f"({', '.join(fields)}) values ({', '.join(values)}) "
           "on conflict (version) do nothing")
    return psql(db_url, sql)


def main() -> int:
    args = sys.argv[1:]
    db_url = os.environ.get("SUPABASE_DB_URL", "").strip()
    if not db_url:
        return die(2, "SUPABASE_DB_URL is not set — provision the repo "
                      "secret (one-time; docs/DB-MIGRATION-PIPELINE-"
                      "2026-10-27.md §5 gives the exact click-path)")
    if not os.path.isdir(MIGRATIONS_DIR):
        return die(2, f"migrations directory missing: {MIGRATIONS_DIR}")

    # ---- ledger repair mode -------------------------------------------------
    if args[:1] == ["--mark-applied"]:
        versions = args[1:]
        if not versions:
            return die(2, "--mark-applied needs one or more versions")
        files = {v: n for v, n in applicable_files()}
        for v in versions:
            if v not in files:
                return die(2, f"version {v} has no applicable repo file — "
                              f"refusing to mark")
            rc, out = record_version(db_url, v, files[v], ran=False)
            if rc != 0:
                return die(1, f"mark-applied {v} failed: {out[-300:]}")
            print(f"marked {v} ({files[v]}) as applied (no SQL executed)")
        return 0

    dry_run = "--dry-run" in args
    floor = os.environ.get("SAFETY_FLOOR", DEFAULT_FLOOR)

    # ---- read state ---------------------------------------------------------
    applied, err = read_ledger(db_url)
    if err:
        return die(1, f"cannot read the migration ledger: {err}")
    files = applicable_files()
    pending = [(v, n) for v, n in files if v not in applied]

    print(f"ledger: {len(applied)} recorded · repo applicable family: "
          f"{len(files)} · pending: {len(pending)}")
    for v, n in pending:
        print(f"  pending: {v}  {n}")

    if dry_run:
        print("dry-run: nothing applied")
        return 0

    # ---- safety floor (Phase-61 drift guard) --------------------------------
    below = [v for v, _ in pending if v < floor]
    if below:
        return die(3, (
            f"SAFETY-FLOOR HALT — pending migrations older than the floor "
            f"({floor}): {', '.join(below)}. The production ledger has "
            f"drifted backward (the Phase-61 failure class). Repair via "
            f"--mark-applied for versions whose effects are already live "
            f"(evidence: probe results), NEVER by blind re-application — "
            f"see docs/DB-MIGRATION-PIPELINE-2026-10-27.md §6"))

    # ---- apply --------------------------------------------------------------
    if not pending:
        print("nothing to apply — production ledger is up to date")
        return 0

    for v, name in pending:
        path = os.path.join(MIGRATIONS_DIR, name)
        print(f"applying {v} {name} …")
        p = run(["psql", db_url, "-v", "ON_ERROR_STOP=1",
                 "--single-transaction", "-f", path])
        if p.returncode != 0:
            return die(1, f"migration {name} FAILED (rolled back, not "
                          f"recorded — safe to retry):\n"
                          f"{(p.stdout + p.stderr)[-1500:]}")
        rc, out = record_version(db_url, v, name, ran=True)
        if rc != 0:
            return die(1, f"applied {name} but the ledger insert failed "
                          f"(HALT — fix before continuing): {out[-300:]}")
        print(f"applied + recorded: {v} {name}")

    # ---- verify + reload ----------------------------------------------------
    applied2, err = read_ledger(db_url)
    if err:
        return die(1, f"post-apply ledger read failed: {err}")
    still_pending = [v for v, _ in pending if v not in applied2]
    if still_pending:
        return die(1, f"post-apply verification failed — still unrecorded: "
                      f"{still_pending}")
    psql(db_url, NOTIFY, fatal=False)  # PostgREST schema reload
    print(f"applied {len(pending)} migration(s) in order; ledger verified; "
          f"PostgREST schema cache reloaded")

    summary = (f"### DB migration pipeline\n\n- applied: "
               + ", ".join(f"`{v}`" for v, _ in pending)
               + "\n- ledger verified · schema cache reloaded\n")
    step = os.environ.get("GITHUB_STEP_SUMMARY")
    if step:
        with open(step, "a", encoding="utf-8") as fh:
            fh.write(summary + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
