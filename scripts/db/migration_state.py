#!/usr/bin/env python3
"""Migration state gate — is the LATEST repo migration applied on production?

Part of the DB-MIGRATION-PIPELINE-2026-10-27 fix (owner order 2026-10-27:
«عالج جذريًا مشكلة عدم تطبيق ترحيل Supabase تلقائيًا … لا تعتبر نجاح نشر
الكود دليلًا على تطبيق ترحيلات قاعدة البيانات»).

WHAT IT DOES (read-only — zero writes, any environment):
  1. Enumerates the AUTO-APPLIED migration family on disk (timestamped
     `YYYYMMDDHHMMSS_NNNN_<slug>.sql` + the legacy numeric-only `0001..0005`)
     and finds the LATEST applicable migration file.
  2. Runs the declarative probes from `scripts/db/migration_probes.py`
     against PRODUCTION via PostgREST (service-role key) — schema probes from
     the OpenAPI spec, row-state probes, and (strongest) behavioral probes
     that call the real RPCs as the QA admin (Test-Accounts Channel,
     AGENTS.md §6) — the same code path the admin UI uses.
  3. Verdict:
       APPLIED        every probe of the LATEST migration passes
       NOT-APPLIED    a probe fails (measurable drift — the exact 2026-10-27
                      incident class: 0102's active-first pick absent)
       UNVERIFIABLE   the latest migration has no registry row, or a required
                      secret is missing — BOTH are red: the law demands a
                      probe per migration and provisioned probe secrets.

  Exit codes: 0 = green · 1 = drift/red · 2 = configuration error.
  Never prints client PII (matched rows report asserted fields only) and never
  prints any key or password.

USAGE
  SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… [NEXT_PUBLIC_SUPABASE_ANON_KEY=…
  QA_PROBE_EMAIL=… QA_PROBE_PASSWORD=…] python3 scripts/db/migration_state.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from migration_probes import PROBES, TRANSFORMS  # noqa: E402

REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MIGRATIONS_DIR = os.path.join(REPO_ROOT, "supabase", "migrations")

# The auto-applied family = what the apply engine (supabase db push / the old
# integration) recognizes: 14-digit timestamp prefix, or the legacy numeric
# 0001-0005 files. RUN_ON_SUPABASE_*/VERIFY_* stay manual (INDEX.md §1).
APPLICABLE_RE = re.compile(r"^(\d{14}|\d{4})_.+\.sql$")

CONFIG_ERROR = 2
DRIFT = 1
GREEN = 0


def _die_config(msg: str) -> int:
    print(f"::error::migration_state configuration error: {msg}")
    return CONFIG_ERROR


def http(method: str, url: str, key: str, token: str | None = None,
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


def applicable_migrations() -> list[str]:
    try:
        names = sorted(os.listdir(MIGRATIONS_DIR))
    except FileNotFoundError:
        return []
    return [n for n in names if APPLICABLE_RE.match(n)]


def parse_isodate(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def run_probe(check: dict, env: dict, swagger: dict) -> tuple[bool, str]:
    """Run ONE declared check. Returns (passed, detail)."""
    t = check["type"]

    if t in ("swagger_rpc", "swagger_table"):
        if t == "swagger_rpc":
            path, kind = f"/rpc/{check['rpc']}", "rpc"
        else:
            path, kind = f"/{check['table']}", "table"
        present = path in swagger.get("paths", {})
        return present, f"{kind} {path[1:]}: {'present' if present else 'ABSENT'}"

    if t == "swagger_column":
        table, col = check["table"], check["column"]
        props = (swagger.get("definitions", {}).get(table, {})
                 .get("properties", {}))
        present = col in props
        return present, f"column {table}.{col}: " \
                        f"{'present' if present else 'ABSENT'}"

    if t == "rest_rows":
        st, body = http("GET", env["sb"] + check["path"], env["service"])
        if st != 200:
            return False, f"GET {check['path'][:60]}… -> HTTP {st}: " \
                          f"{str(body)[:120]}"
        rows = body if isinstance(body, list) else []
        value = TRANSFORMS[check["transform"]](rows)
        ok = value == check["expect"]
        return ok, f"{check['transform']}={value} (expect {check['expect']})"

    if t == "rpc_behavior":
        if not (env.get("qa_email") and env.get("qa_password")
                and env.get("anon")):
            return False, (
                "QA admin probe secrets missing — provision repo secrets "
                "QA_PROBE_EMAIL + QA_PROBE_PASSWORD (Test-Accounts Channel "
                "credentials) and NEXT_PUBLIC_SUPABASE_ANON_KEY — see "
                "docs/DB-MIGRATION-PIPELINE-2026-10-27.md §5")
        # sign in (password grant) — never print the password
        st, body = http(
            "POST", env["sb"] + "/auth/v1/token?grant_type=password",
            env["anon"],
            body={"email": env["qa_email"], "password": env["qa_password"]})
        if st != 200 or not isinstance(body, dict) or not body.get("access_token"):
            return False, f"QA admin sign-in failed (HTTP {st}): " \
                          f"{str(body)[:140]}"
        jwt = body["access_token"]
        st, rows = http("POST",
                        env["sb"] + f"/rest/v1/rpc/{check['rpc']}",
                        env["anon"], token=jwt, body=check["body"])
        if st != 200:
            return False, f"rpc {check['rpc']} -> HTTP {st}: " \
                          f"{str(rows)[:140]}"
        if not isinstance(rows, list):
            return False, f"rpc {check['rpc']} returned non-list payload"
        row = next((r for r in rows
                    if r.get("client_id") == check["find_client"]), None)
        if row is None:
            return False, f"client {check['find_client'][:8]}… not found in " \
                          f"{check['rpc']} response ({len(rows)} rows)"
        # assert fields — print ONLY the asserted fields (no PII)
        for field, expected in check["expect"].items():
            if row.get(field) != expected:
                return False, (f"client {check['find_client'][:8]}… "
                               f"{field}={row.get(field)!r} "
                               f"(migration expects {expected!r})")
        for rule in check.get("field_rules", []):
            val = row.get(rule["field"])
            if rule["op"] == "gt_now":
                ok = bool(val) and parse_isodate(val) > datetime.now(timezone.utc)
                if not ok:
                    return False, (f"client {check['find_client'][:8]}… "
                                   f"{rule['field']}={val} is not in the "
                                   f"future (expects an ACTIVE row)")
        got = {f: row.get(f) for f in list(check["expect"])
               + [r["field"] for r in check.get("field_rules", [])]}
        return True, f"client {check['find_client'][:8]}… picked {got}"

    return False, f"unknown probe type {t!r}"


def main() -> int:
    sb = (os.environ.get("SUPABASE_URL")
          or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
    service = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    anon = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY",
                          os.environ.get("SUPABASE_ANON_KEY", ""))
    qa_email = os.environ.get("QA_PROBE_EMAIL", "")
    qa_password = os.environ.get("QA_PROBE_PASSWORD", "")

    if not sb or not service:
        return _die_config(
            "SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL + "
            "SUPABASE_SERVICE_ROLE_KEY must be set (repo Actions secrets "
            "already carry them)")

    env = {"sb": sb, "service": service, "anon": anon,
           "qa_email": qa_email, "qa_password": qa_password}

    files = applicable_migrations()
    if not files:
        print("::error::no applicable migration files found under "
              "supabase/migrations/ — cannot compute the latest version")
        return DRIFT
    latest_file = files[-1]

    # fetch the OpenAPI spec once (schema probes)
    st, swagger = http("GET", sb + "/rest/v1/", service)
    if st != 200 or not isinstance(swagger, dict) or "paths" not in swagger:
        print(f"::error::cannot read the PostgREST OpenAPI spec "
              f"(HTTP {st}) — {str(swagger)[:160]}")
        return DRIFT
    env["swagger"] = swagger

    by_file = {p["file"]: p for p in PROBES}
    results = []
    for p in PROBES:  # ordered registry — advisory anchors first
        checks = []
        for c in p["checks"]:
            ok, detail = run_probe(c, env, swagger)
            checks.append({"check": c["type"], "ok": ok, "detail": detail})
        passed = all(c["ok"] for c in checks)
        results.append({"label": p["label"], "strength": p["strength"],
                        "applies_to": p["file"], "passed": passed,
                        "checks": checks})

    # ---- verdict: EVERY registered probe must pass --------------------------
    # (not just the latest — the 2026-10-27 reconciliation proved why: 0103
    # (latest) is a no-op-on-prod reconciliation that passes while the OLDER
    # 0102 is the pending one that breaks the admin list. A retired
    # observable (0083-rollback class) is handled by REMOVING its registry
    # row, per the law in migration_probes.py.)
    latest_probe = by_file.get(latest_file)
    failing = [r for r in results if not r["passed"]]
    unverifiable = any(
        "secrets missing" in c["detail"]
        for r in results for c in r["checks"] if not c["ok"])
    if latest_probe is None:
        verdict = "UNVERIFIABLE"
        reason = (f"latest migration {latest_file} has NO probe row in "
                  f"scripts/db/migration_probes.py — the 2026-10-27 law "
                  f"requires every migration to ship its probe")
    elif failing:
        verdict = "UNVERIFIABLE" if unverifiable else "NOT-APPLIED"
        details = "; ".join(
            f"{r['label']}: " + " | ".join(
                c["detail"] for c in r["checks"] if not c["ok"])
            for r in failing)
        reason = (f"{len(failing)} registered migration probe(s) failing — "
                  f"{details}")
    else:
        verdict, reason = "APPLIED", (
            f"latest migration {latest_file} probes PASS on production "
            f"(all {len(results)} registered probes green)")

    # ---- report ------------------------------------------------------------
    lines = ["## Migration state gate (DB-MIGRATION-PIPELINE)",
             "",
             f"- **Latest applicable migration:** `{latest_file}`",
             f"- **Verdict:** **{verdict}** — {reason}",
             "",
             "| migration | strength | verdict | evidence |",
             "|---|---|---|---|"]
    for r in results:
        ev = "<br>".join(c["detail"] for c in r["checks"])
        lines.append(f"| {r['label']} | {r['strength']} | "
                     f"{'PASS' if r['passed'] else 'FAIL'} | {ev} |")
    summary = "\n".join(lines)
    print(summary)
    step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if step_summary:
        with open(step_summary, "a", encoding="utf-8") as fh:
            fh.write(summary + "\n\n")

    if os.environ.get("MIGRATION_STATE_JSON"):
        payload = {"latest": latest_file, "verdict": verdict,
                   "reason": reason, "probes": results}
        with open(os.environ["MIGRATION_STATE_JSON"], "w",
                  encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2)

    if verdict == "APPLIED":
        return GREEN

    print(f"::error::MIGRATION DRIFT — {verdict}: {reason}")
    print("::error::A code deploy is NOT proof of DB migration application. "
          "Apply the pending migration(s) via the pipeline "
          "(SUPABASE_DB_URL secret → db-migrate) or the documented manual "
          "channel, then this gate turns green automatically.")
    return DRIFT


if __name__ == "__main__":
    raise SystemExit(main())
