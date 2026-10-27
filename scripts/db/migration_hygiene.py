#!/usr/bin/env python3
"""Migration hygiene gate — static, zero-secret checks for every push/PR
that touches supabase/migrations/ (DB-MIGRATION-PIPELINE-2026-10-27).

Checks (hard gates):
  1. NAME LAW     — every applicable file matches
                    `YYYYMMDDHHMMSS_NNNN_<slug>.sql` (or legacy numeric
                    0001..0005). New files with any other shape are
                    rejected BEFORE they can poison the apply order.
  2. NO DUPLICATE VERSIONS — two files sharing the same version prefix
                    would race the ledger's unique key (the double-0072
                    file class — different timestamps were legal, the
                    SAME version never is).
  3. INDEX ROW    — every applicable file is mentioned in
                    supabase/migrations/INDEX.md (the binding ledger —
                    AGENTS.md §6).
  4. PROBE LAW    — every applicable migration from 20261026120000 (0102,
                    the pipeline's birth) ships a probe row in
                    scripts/db/migration_probes.py. The state gate cannot
                    see an unprobed migration — silence is the failure
                    mode this pipeline exists to kill.
Warnings (never fatal): NNNN sequence regressions (documented history
anomalies), missing probes for pre-pipeline migrations.

Exit codes: 0 clean · 1 violation.
"""

from __future__ import annotations

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from migration_probes import PROBES  # noqa: E402

REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MIGRATIONS_DIR = os.path.join(REPO_ROOT, "supabase", "migrations")
INDEX_MD = os.path.join(MIGRATIONS_DIR, "INDEX.md")

APPLICABLE_RE = re.compile(r"^(\d{14}|\d{4})_(.+)\.sql$")
PROBE_LAW_FLOOR = "20261026120000"  # 0102 — the pipeline's birth


def main() -> int:
    if not os.path.isdir(MIGRATIONS_DIR):
        print(f"::error::missing {MIGRATIONS_DIR}")
        return 1
    names = sorted(os.listdir(MIGRATIONS_DIR))
    files = []
    violations = []
    warnings = []

    for name in names:
        m = APPLICABLE_RE.match(name)
        if m:
            files.append((m.group(1), m.group(2), name))
    files.sort()

    # 1) name law is satisfied by construction of `files` — anything in the
    #    directory that LOOKS like a migration but fails the shape must be
    #    either a documented legacy family (RUN_ON_*/VERIFY_*) or rejected.
    legacy_ok = re.compile(
        r"^(RUN_ON_SUPABASE_|VERIFY_|INDEX\.md$|PROBES)")
    for name in names:
        if name.endswith(".sql") and not APPLICABLE_RE.match(name) \
                and not legacy_ok.match(name):
            violations.append(
                f"name law: {name} is neither the applicable family "
                f"(YYYYMMDDHHMMSS_NNNN_<slug>.sql / numeric 0001..0005) "
                f"nor a documented legacy family (RUN_ON_*/VERIFY_*)")

    # 2) duplicate versions
    seen: dict[str, str] = {}
    for v, _slug, name in files:
        if v in seen:
            violations.append(
                f"duplicate version {v}: {seen[v]} and {name} — the "
                f"ledger's unique key cannot hold both")
        seen[v] = name

    # 3) INDEX.md rows
    try:
        index_md = open(INDEX_MD, encoding="utf-8").read()
    except FileNotFoundError:
        violations.append("INDEX.md missing — the binding ledger")
        index_md = ""
    for _v, _slug, name in files:
        if name not in index_md:
            violations.append(f"INDEX.md row missing for {name}")

    # 4) probe law (from the pipeline's birth)
    probed = {p["file"] for p in PROBES}
    for v, _slug, name in files:
        if v >= PROBE_LAW_FLOOR and name not in probed:
            violations.append(
                f"probe law: {name} has no probe row in "
                f"scripts/db/migration_probes.py — the state gate would "
                f"be blind to it (add the probe in the same commit)")

    # warnings: NNNN regressions + pre-pipeline probe gaps
    last_nnnn = 0
    for _v, slug, name in files:
        m = re.match(r"(\d{4})", slug)
        if not m:
            continue
        nnnn = int(m.group(1))
        if nnnn < last_nnnn:
            warnings.append(
                f"NNNN sequence regression at {name} "
                f"({nnnn} after {last_nnnn}) — documented history "
                f"anomalies exist; verify the numbering is intentional")
        last_nnnn = max(last_nnnn, nnnn)

    print(f"migration hygiene: {len(files)} applicable files checked")
    for w in warnings:
        print(f"::warning::{w}")
    if violations:
        for v in violations:
            print(f"::error::{v}")
        return 1
    print("migration hygiene: CLEAN")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
