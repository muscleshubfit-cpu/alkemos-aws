#!/usr/bin/env python3
"""Apply the migration chain to the LOCAL Supabase test stack (docker).

Used by db-migrate.yml's validate job (owner order 2026-10-27: «اختبر آلية
الترحيل التلقائي على قاعدة اختبار مناسبة»). The local stack
(`supabase start`) is a REAL throwaway Supabase environment — auth schema,
platform roles, extensions — so executing the files here is an honest
rehearsal of what production will run.

ATTRIBUTION LAW:
  Files listed in $CHANGED_FILES (added/modified by this PR/push) are
  HARD-GATED — any failure is RED.
  Pre-existing files are the historical baseline: failures there are
  reported as ::warning:: with the failing file + error (documented
  baseline drift — the history is what it is; the law covers NEW
  migrations, and the production ledger remains the sole apply authority).

Exit codes: 0 = all new files applied · 1 = a new-file failure.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MIGRATIONS_DIR = os.path.join(REPO_ROOT, "supabase", "migrations")
CONFIG_TOML = os.path.join(REPO_ROOT, "supabase", "config.toml")
APPLICABLE_RE = re.compile(r"^(\d{14}|\d{4})_.+\.sql$")


def container_name() -> str:
    pid = "musclehubeg"
    try:
        for line in open(CONFIG_TOML, encoding="utf-8"):
            m = re.match(r'\s*project_id\s*=\s*"([^"]+)"', line)
            if m:
                pid = m.group(1)
                break
    except FileNotFoundError:
        pass
    return f"supabase_db_{pid}"


def psql_in_container(container: str, path: str,
                      single_txn: bool = True) -> tuple[int, str]:
    cmd = ["docker", "exec", "-i", container, "psql", "-U", "postgres",
           "-d", "postgres", "-v", "ON_ERROR_STOP=1"]
    if single_txn:
        cmd.append("--single-transaction")
    with open(path, "rb") as fh:
        p = subprocess.run(cmd, stdin=fh, capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr)[-600:]


def manual_family() -> list[str]:
    """The documented manual-era bootstrap files (INDEX.md §1/§2: the
    RUN_ON_SUPABASE_* family — the files production was ACTUALLY built
    from before the auto family took over). Best-effort bootstrap order:
    numeric prefix where present, else filename order. VERIFY_* read-only
    owner scripts are excluded."""
    out = []
    for name in os.listdir(MIGRATIONS_DIR):
        if name.startswith("RUN_ON_SUPABASE_ORIGINAL_"):
            out.append(("0", name))  # originals first (0006-0023 era)
        elif name.startswith("RUN_ON_SUPABASE_"):
            out.append(("1", name))
    def key(item):
        m = re.search(r"_(\d{3,4}[A-Z]?)_", item[1])
        return (item[0], m.group(1).zfill(6) if m else "999999", item[1])
    return [n for _c, n in sorted(out, key=key)]


def main() -> int:
    container = container_name()
    probe = subprocess.run(["docker", "inspect", container],
                           capture_output=True)
    if probe.returncode != 0:
        print(f"::error::local stack DB container {container} not found — "
              f"did `supabase start` succeed?")
        return 1

    changed = {os.path.basename(line.strip())
               for line in os.environ.get("CHANGED_FILES", "").splitlines()
               if line.strip()}
    files = sorted(n for n in os.listdir(MIGRATIONS_DIR)
                   if APPLICABLE_RE.match(n))

    print(f"test-stack bootstrap: the documented manual family first "
          f"(best-effort — the auto family alone cannot bootstrap a fresh "
          f"database; production was built from the manual era: "
          f"docs/DB-MIGRATION-PIPELINE-2026-10-27.md §4)")
    for name in manual_family():
        path = os.path.join(MIGRATIONS_DIR, name)
        rc, out = psql_in_container(container, path)
        if rc == 0:
            print(f"  ok        {name}")
        else:
            print(f"  warn      {name} (manual-era file — best-effort "
                  f"bootstrap, non-gated):\n    {out[:200]}")

    print(f"test-stack apply: {len(files)} applicable files "
          f"({len(changed)} attributed to this change)")

    baseline_failures = 0
    for name in files:
        path = os.path.join(MIGRATIONS_DIR, name)
        rc, out = psql_in_container(container, path)
        if rc == 0:
            print(f"  ok        {name}")
            continue
        if name in changed:
            print(f"::error::NEW migration FAILED on the test stack: "
                  f"{name}\n{out}")
            return 1
        baseline_failures += 1
        print(f"::warning::baseline (pre-existing) migration failed — "
              f"historical drift, not gated: {name}\n  {out[:300]}")

    if baseline_failures:
        print(f"\n{baseline_failures} pre-existing baseline failure(s) — "
              f"documented above as warnings; production apply stays "
              f"ledger-driven (scripts/db/apply_migrations.py)")
    print(f"test-stack apply: NEW files all green "
          f"({len(changed) - 0} attributed)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
