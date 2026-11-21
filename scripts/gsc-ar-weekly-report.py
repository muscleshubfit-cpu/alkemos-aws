#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""GSC tools weekly report (AR + EN) — the ORGANIC-GROWTH-P1-I operational
monitor, extended by ORGANIC-GROWTH-P1-I-EN.

WHY (owner order 2026-11-21 «نفّذ البند التالي غير المنفّذ بالكامل» —
roadmap 10/P1-I + 08-§2): «مراقبة أدوات AR في GSC أسبوعيًا وفق 08-§2
(تشغيل + سجل)» — acceptance «سجل شهري موثق». This script IS the
«تشغيل»; docs/organic-growth-system-2026-11-18/gsc-ar-weekly-monitoring-log.md
IS the «سجل».

P1-I-EN EXTENSION (owner order 2026-11-21 «نفّذ P1-I-EN بالكامل وفق
§10.5 من التقرير 28، مع الالتزام بالبنية الحالية لمراقبة العربية،
وإنتاج تقرير أسبوعي موحد يقارن أدوات العربية والإنجليزية» — report
28 §10.5): the weekly arm now reads the EN-tools family TOO, with FULL
data separation (§10.5-ب) — each family rides its OWN single and-group
includingRegex RE2 filter (its own expression, own queries/pages/pairs)
— and renders ONE UNIFIED weekly entry (§10.5-ج): both families side
by side + the AR↔EN comparison (the 28d performance gap and the
per-language week-over-week growth) + the monthly documented reading
for BOTH languages. The EN family = the (en) route-group mirrors
measured from the repo (§10.5-أ): /tools (hub + T1-T5 subpaths) +
/meal-planner + /ai-meal-planner + /ai-workout-planner + /macro-tracker
+ /workout-tracker; T11 /diet-plan EXCLUDED (its own family — the AR
decision mirrored). The log stays the SAME file (§10.5-هـ design
decision: expand the existing log — sanctioned verbatim by the plan).
Everything else — the window law, read-only posture, thresholds,
retention, log mechanics, workflow schedule — is UNCHANGED (the owner
order: «مع الالتزام بالبنية الحالية لمراقبة العربية»).

WINDOW LAW (governing, GSC-RE-AUDIT-2026-11-12 + 08 header): GSC
execution opens 2026-11-30 («التنفيذ يُفتح من 2026-11-30 بأمر يسمّي
نطاقه»). The guard below refuses to pull ANY data before that date —
scheduled or manually dispatched — and exits 0 with a notice (a guarded
no-op is the honest state, not a failure). First real reading: Monday
2026-11-30 (the schedule slot lands exactly on the window opening).

WHAT IT READS (read-only, the gsc-connection-test v2 discipline):
  - sites.list discovery (PRIMARY sc-domain:alkemos.com must be visible)
  - searchAnalytics/query ONLY — web, dataState=final — against PRIMARY:
      * AR-tools family totals, 7d + 28d windows        (08-§2.1 item 1)
      * EN-tools family totals, 7d + 28d windows        (P1-I-EN §10.5-ب)
      * whole-property totals, 7d + 28d                 (context)
      * AR-tools top queries 28d                        (item 2 pool)
      * AR-tools top pages 28d                          (item 4 pool)
      * AR-tools query->page pairs 28d                  (item 5 evidence)
      * EN-tools top queries / pages / pairs 28d        (P1-I-EN §10.5-ب)
      * on the first run of a calendar month: previous
        calendar-month totals + queries for BOTH families (acceptance:
                                                        «سجل شهري موثق»)
  Nothing else: no indexing requests, no coverage API, no writes to
  Search Console. The ONLY repository mutation is the monitoring log.

REQUEST SHAPE (P1-I-FIX 2026-11-21 — the dimensionFilterGroups repair):
  The original build attached SIX per-filter groups — one group per
  family pattern, each typed "or" — but the Search Console API ANDs
  the GROUPS (official reference: "All filter groups must match in
  order for a row to be returned") and groupType "or" is documented
  NOT YET SUPPORTED — so the six groups demanded a page containing
  all six family patterns at once: zero matching rows, silently. The repair ships the family as the API
  actually supports it: exactly ONE "and" group holding ONE page
  filter with operator includingRegex, whose single RE2 expression
  alternates the six escaped family patterns — each hard-terminated
  by a REAL PATH BOUNDARY "(?:[/?]|$)" (end of URL, a following
  path separator, or a query string) with the whole alternation
  ^-anchored, so a family page matches ITSELF and its true SUBPATHS
  only, never a longer sibling segment such as /ar/tools-archive-x
  or /ar/meal-planner-extra (the final review 2026-11-21 retired the
  contains-era unanchored substring match precisely because it
  swallowed such siblings). The (?i) inline flag keeps the match
  non-case-sensitive (RE2-supported). Pure
  construction is pinned by `--selftest` (below) and by the canary
  that spawns it — the request STRUCTURE and its SEMANTICS, not
  script-text presence.

ANALYSES (08-§2.1 thresholds, letter of the protocol):
  - rising candidates: queries with >=50 impressions in the 28d window;
    marked «جديدة» when absent from the previous weekly entry's JSON
    (the log is the diff source — no side state).
  - CTR opportunities: impressions >=100 AND ctr <1% AND position 5-20.
  - one-step-away pages: position 11-20.
  - monthly reading: previous calendar month vs the month before it
    (08-§2.1 item 6 — proven expansion needs two consecutive months).

LOG MECHANICS (the gemini-weekly-report pattern): explicit entry
markers, newest entry first, hard retention caps (12 weekly / 12
monthly — older entries live in git history). A weekly JSON block is
embedded in every entry as machine-readable provenance AND the diff
source for «جديدة» detection. A re-run for the SAME window REPLACES
its older copy instead of stacking duplicates. Zone inserts are
surgical: the weekly zone never touches the monthly zone or the
protocol header.

SAFETY: the service-account JSON arrives via GSC_CREDENTIALS (never
echoed), is materialized to a 0600 temp file, and deleted in a finally
block (the workflow also runs an always() cleanup step — defense in
depth). Error text is scrubbed of tokens. Honest failures exit 1 with
Google's exact message; a failed run never writes a partial log entry.

Run:  python3 scripts/gsc-ar-weekly-report.py            (weekly reading)
      python3 scripts/gsc-ar-weekly-report.py --selftest (P1-I-FIX +
      P1-I-EN construction test: builds every real payload, asserts the
      one-group/includingRegex shape per family and matches each
      path-BOUNDED RE2 family expression against a must-match/must-not-
      match URL battery — sibling segments like /ar/tools-archive-x and
      /tools-archive-x are must-NOT-match, and each family rejects the
      OTHER family's pages (full data separation) — plus render pins
      that prove the unified entry — no network, no secrets, no log
      writes; runs before AND after the 2026-11-30 window)
"""

import base64
import datetime as dt
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# ------------------------------------------------------------------ laws
REPO = Path(__file__).resolve().parents[1]
LOG_PATH = REPO / "docs/organic-growth-system-2026-11-18/gsc-ar-weekly-monitoring-log.md"

PRIMARY = "sc-domain:alkemos.com"
SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
API_BASE = "https://searchconsole.googleapis.com/webmasters/v3"
TOKEN_URI_DEFAULT = "https://oauth2.googleapis.com/token"

# GSC execution window (08 header + GSC-RE-AUDIT-2026-11-12 + roadmap 10):
# readings start 2026-11-30. The workflow cron "20 6 * * 1" (Mondays
# 06:20 UTC) first fires 2026-11-23 (guarded no-op) then 2026-11-30
# (first real reading — Monday, verified by the P1-I canary).
WINDOW_OPENS = dt.date(2026, 11, 30)

# The AR-tools family = the AR mirrors of the 06-§1 tool inventory
# (T1-T10 + the /ar/tools hub). T11 (/ar/diet-plan) is its OWN family in
# 08-§2.1 and is deliberately EXCLUDED here. The P1-I canary pins this
# list against the actual src/app/(ar)/ar routes. Renamed off
# *_PAGE_CONTAINS in the final review: the contains-era substring
# semantics are retired — each entry is matched as a BOUNDED page
# prefix (itself + true subpaths only — see ar_page_regex).
AR_TOOLS_FAMILY_PAGES = [
    "https://alkemos.com/ar/tools",               # hub + T1-T5
    "https://alkemos.com/ar/meal-planner",        # T6
    "https://alkemos.com/ar/ai-meal-planner",     # T7
    "https://alkemos.com/ar/ai-workout-planner",  # T8
    "https://alkemos.com/ar/macro-tracker",       # T9
    "https://alkemos.com/ar/workout-tracker",     # T10
]

# The EN-tools family (P1-I-EN — report 28 §10.5-أ): the (en) route
# group maps 1:1 onto the UNPREFIXED URLs (measured from the repo
# tree, not assumed AR mirrors). T11 (/diet-plan) is its OWN family in
# 08-§2.1 and is deliberately EXCLUDED here — the AR decision mirrored.
# The P1-I-EN canary pins this list against the actual src/app/(en)
# routes. Same bounded-prefix semantics as the AR list above.
EN_TOOLS_FAMILY_PAGES = [
    "https://alkemos.com/tools",               # hub + T1-T5
    "https://alkemos.com/meal-planner",        # T6
    "https://alkemos.com/ai-meal-planner",     # T7
    "https://alkemos.com/ai-workout-planner",  # T8
    "https://alkemos.com/macro-tracker",       # T9
    "https://alkemos.com/workout-tracker",     # T10
]

# 08-§2.1 protocol thresholds — letter of the protocol, no invented floors.
RISING_IMPS = 50           # item 2: any new query with >=50 impressions/month
CTR_OPP_IMPS = 100         # item 3: impressions >=100 ...
CTR_OPP_CTR_MAX = 0.01     #            ... CTR <1% ...
CTR_OPP_POS = (5, 20)      #            ... position 5-20
ONE_STEP_POS = (11, 20)    # item 4: position 11-20

RETAIN_WEEKLY = 12   # ~a quarter of weekly entries (older in git history)
RETAIN_MONTHLY = 12  # a year of documented monthly readings

WEEKLY_MARKER = "<!-- P1I:WEEKLY -->"
MONTHLY_MARKER = "<!-- P1I:MONTHLY -->"

SUMMARY = os.environ.get("GITHUB_STEP_SUMMARY", "")


def log(line):
    print(line, flush=True)


def emit(line):
    log(line)
    if SUMMARY:
        with open(SUMMARY, "a", encoding="utf-8") as fh:
            fh.write(line + "\n")


def scrub(text, *secrets):
    out = str(text)
    for s in secrets:
        if s:
            out = out.replace(s, "[REDACTED]")
    return out


def die(summary_line, detail_lines=()):
    log("::error::gsc-ar-weekly-report FAILED — see details below")
    emit("")
    emit("## ❌ GSC AR-tools weekly reading FAILED")
    emit("")
    emit(summary_line)
    for line in detail_lines:
        emit(line)
    emit("")
    emit("_Read-only by construction; the monitoring log was NOT modified._")
    sys.exit(1)


# ------------------------------------------------------------------ auth
def load_sa(creds_raw):
    """Parse the service-account JSON (plain or base64). Never printed."""
    sa = None
    try:
        sa = json.loads(creds_raw)
    except ValueError:
        sa = None
    if not isinstance(sa, dict):
        stripped = creds_raw.strip()
        for decoder in (base64.b64decode, base64.urlsafe_b64decode):
            try:
                sa = json.loads(decoder(stripped + "=" * (-len(stripped) % 4)))
                break
            except ValueError:
                continue
    if not isinstance(sa, dict) or "client_email" not in sa or "private_key" not in sa:
        die("GSC_CREDENTIALS is present but its content is **not a recognizable "
            "service-account JSON** (expected keys: `client_email`, `private_key`). "
            "Nothing was sent to Google.")
    private_key = sa["private_key"]
    if not isinstance(private_key, str) or "PRIVATE KEY" not in private_key:
        die("The service-account JSON is recognizable but its `private_key` is "
            "missing or malformed. Nothing was sent to Google.")
    if "\\n" in private_key and "\n" not in private_key:
        private_key = private_key.replace("\\n", "\n")
    return sa, private_key


def get_access_token(sa, private_key):
    """JWT (RS256 via openssl, stdlib only) -> OAuth token. No installs."""
    def b64url(data):
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

    now = int(time.time())
    token_uri = sa.get("token_uri") or TOKEN_URI_DEFAULT
    head = b64url(json.dumps({"alg": "RS256", "typ": "JWT"}, separators=(",", ":")).encode("utf-8"))
    claims = b64url(json.dumps({
        "iss": sa["client_email"],
        "scope": SCOPE,
        "aud": token_uri,
        "iat": now,
        "exp": now + 3600,
    }, separators=(",", ":")).encode("utf-8"))
    signing_input = (head + "." + claims).encode("ascii")
    # Prefer $RUNNER_TEMP (the gsc-connection-test hygiene: fixed names the
    # workflow's always() cleanup step deletes); fall back to the system
    # temp dir locally. The finally block unlinks either way.
    runner_temp = os.environ.get("RUNNER_TEMP", "").strip()
    if runner_temp and os.path.isdir(runner_temp):
        key_file = os.path.join(runner_temp, "gsc-sa-key.pem")
        with open(key_file, "w", encoding="utf-8") as fh:
            fh.write(private_key)
    else:
        with tempfile.NamedTemporaryFile("w", suffix=".pem", delete=False) as kf:
            kf.write(private_key)
            key_file = kf.name
    os.chmod(key_file, 0o600)
    try:
        proc = subprocess.run(
            ["openssl", "dgst", "-sha256", "-sign", key_file],
            input=signing_input, capture_output=True,
        )
        if proc.returncode != 0:
            die("JWT signing failed — the `private_key` is not a usable RSA key.",
                ["openssl stderr (truncated): `" + scrub(proc.stderr.decode(errors="replace")[:200]) + "`"])
        jwt = signing_input.decode("ascii") + "." + b64url(proc.stdout)
        status, text = http(urllib.request.Request(
            token_uri,
            data=urllib.parse.urlencode({
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": jwt,
            }).encode("utf-8"),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        ), timeout=30)
        if status != 200:
            try:
                err = json.loads(text)
                msg = err.get("error_description") or err.get("error") or text[:300]
            except ValueError:
                msg = text[:300]
            die("**Google OAuth token exchange failed** (HTTP " + str(status) + ").",
                ["Google said: `" + scrub(msg, jwt)[:300] + "`"])
        try:
            return json.loads(text)["access_token"]
        except (ValueError, KeyError):
            die("Token endpoint returned HTTP 200 but an unexpected body (no `access_token`).")
    finally:
        os.unlink(key_file)


def http(req, timeout, tries=2):
    last = None
    for attempt in range(1, tries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status, resp.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as exc:
            return exc.code, exc.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, OSError) as exc:
            last = exc
            if attempt < tries:
                time.sleep(2)
    return 0, "network error: " + type(last).__name__


# ------------------------------------------------------------------ query
class QueryError(Exception):
    def __init__(self, status, detail):
        super().__init__(detail)
        self.status = status
        self.detail = detail


def build_payload(dims=None, filter_group=None, row_limit=None,
                  start_d=None, end_d=None):
    """The exact searchAnalytics/query request body (pure — the P1-I-FIX
    selftest pins its structure and semantics)."""
    payload = {"startDate": start_d.isoformat(),
               "endDate": end_d.isoformat(),
               "searchType": "web",
               "dataState": "final"}
    if dims:
        payload["dimensions"] = dims
    if filter_group is not None:
        # ONE group, ALWAYS. The API ANDs the groups across
        # dimensionFilterGroups (official reference: "All filter groups
        # must match in order for a row to be returned") and groupType
        # "or" is documented NOT YET SUPPORTED — the retired per-family
        # groups therefore demanded a page matching every family
        # pattern at once (zero rows). P1-I-FIX 2026-11-21.
        payload["dimensionFilterGroups"] = [filter_group]
    if row_limit:
        payload["rowLimit"] = row_limit
    return payload


def query_api(prop, auth_headers, dims=None, filter_group=None, row_limit=None,
              start_d=None, end_d=None):
    payload = build_payload(dims=dims, filter_group=filter_group,
                            row_limit=row_limit, start_d=start_d, end_d=end_d)
    url = (API_BASE + "/sites/" + urllib.parse.quote(prop, safe="")
           + "/searchAnalytics/query")
    status, text = http(urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"),
        headers=auth_headers), timeout=60)
    if status != 200:
        raise QueryError(status, scrub(text[:400], auth_headers.get("Authorization", "")))
    try:
        return json.loads(text).get("rows", [])
    except ValueError:
        raise QueryError(0, "HTTP 200 with non-JSON body (truncated): `" + text[:200] + "`")


# A family entry matches the page ITSELF or a true SUBPATH of it —
# never a longer sibling segment. The boundary terminates the escaped
# pattern at: end of URL ($) · a following path separator (/) · a
# query string (?) — so /ar/tools matches /ar/tools, /ar/tools/<sub>
# and /ar/tools?x but NOT /ar/tools-archive-x (final review
# 2026-11-21: the contains-era unanchored substring match was retired
# precisely because it swallowed sibling segments like that).
PATH_BOUNDARY = "(?:[/?]|$)"


def ar_page_regex():
    """One RE2 expression alternating the six path-BOUNDED family
    patterns (the API-compatible family OR). re.escape escapes only
    regex-special characters — for these URLs that is the dots and
    hyphens, and backslash+punctuation is a literal in RE2 exactly as
    in Python re. The whole alternation is ^-anchored and every branch
    is terminated by PATH_BOUNDARY, so a page value matches a family
    pattern only at a real path boundary; the (?i) inline flag keeps
    the match non-case-sensitive."""
    return ("(?i)^(?:" + "|".join(re.escape(p) + PATH_BOUNDARY
                                  for p in AR_TOOLS_FAMILY_PAGES) + ")")


def ar_filter_group():
    """The family filter in the shape the Search Console API actually
    supports: ONE 'and' group (the only supported groupType) holding ONE
    page filter with operator includingRegex — the single RE2 alternation
    of ar_page_regex() with bounded path semantics (^ + PATH_BOUNDARY)."""
    return {"groupType": "and", "filters": [
        {"dimension": "page", "operator": "includingRegex",
         "expression": ar_page_regex()}]}


def en_page_regex():
    """The EN-family mirror of ar_page_regex() (P1-I-EN §10.5-ب: full
    data separation — an INDEPENDENT expression over EN_TOOLS_FAMILY_PAGES,
    never merged with the AR alternation). Identical construction: ^-anchored
    alternation of re.escape'd patterns, each hard-terminated by
    PATH_BOUNDARY, with the (?i) inline flag."""
    return ("(?i)^(?:" + "|".join(re.escape(p) + PATH_BOUNDARY
                                  for p in EN_TOOLS_FAMILY_PAGES) + ")")


def en_filter_group():
    """The EN-family filter — the exact ar_filter_group() shape over the
    EN expression: ONE 'and' group, ONE page filter, includingRegex."""
    return {"groupType": "and", "filters": [
        {"dimension": "page", "operator": "includingRegex",
         "expression": en_page_regex()}]}


def totals_of(rows):
    """Aggregate metric rows -> {clicks,impressions,ctr,position}; position
    is impression-weighted across rows (the gsc-connection-test weekly
    aggregation approach)."""
    if not rows:
        return {"clicks": 0.0, "impressions": 0.0, "ctr": 0.0, "position": 0.0}
    c = sum(r.get("clicks", 0.0) for r in rows)
    i = sum(r.get("impressions", 0.0) for r in rows)
    p = sum(r.get("position", 0.0) * r.get("impressions", 0.0) for r in rows)
    return {"clicks": c, "impressions": i,
            "ctr": (c / i) if i else 0.0,
            "position": (p / i) if i else 0.0}


def fmt(n, spec=".0f"):
    return format(n, spec)


def q_pool(rows):
    """The >=RISING_IMPS query pool — the diff source for «جديدة»."""
    out = []
    for r in rows:
        if r.get("impressions", 0.0) >= RISING_IMPS:
            out.append({"q": (r.get("keys") or [""])[0],
                        "c": r.get("clicks", 0.0),
                        "i": r.get("impressions", 0.0),
                        "ctr": r.get("ctr", 0.0),
                        "pos": r.get("position", 0.0)})
    out.sort(key=lambda x: -x["i"])
    return out


# ------------------------------------------------------------------ render
def md_table(header, rows):
    """First column left-aligned, the rest right-aligned (repo style)."""
    if not rows:
        return ["_لا صفوف لهذه النافذة._", ""]
    cols = header.count("|") - 1
    out = [header, "|---|" + "---:|" * (cols - 1)]
    out.extend(rows)
    out.append("")
    return out


def pct_delta(cur, prev):
    if prev == 0:
        return "—" if cur == 0 else "جديد"
    return "%+.0f%%" % ((cur - prev) / prev * 100.0)


def lang_gap_parts(a, b):
    """§10.5-ج: the AR↔EN performance gap over one window — returns the
    (impressions, ctr, position) phrases for totals a=AR, b=EN."""
    ai, bi = a["impressions"], b["impressions"]
    if ai == 0 and bi == 0:
        imp = "صفر ظهور للغتين"
    elif ai == 0:
        imp = "AR صفر ظهورًا مقابل %s لEN" % fmt(bi)
    elif bi == 0:
        imp = "EN صفر ظهورًا مقابل %s لAR" % fmt(ai)
    else:
        imp = "ظهور EN يساوي %.0f%% من ظهور AR (%s مقابل %s)" % (
            bi / ai * 100.0, fmt(bi), fmt(ai))
    ctr_pp = (b["ctr"] - a["ctr"]) * 100.0
    ctr = "CTR: AR %s مقابل EN %s (فارق %+.2f نقطة — موجب = EN أعلى)" % (
        fmt(a["ctr"], ".2%"), fmt(b["ctr"], ".2%"), ctr_pp)
    if a["position"] and b["position"]:
        closer = "AR" if a["position"] < b["position"] else "EN"
        pos = "الموقع AR %s مقابل EN %s (الأقرب للصدارة %s بفارق %.2f)" % (
            fmt(a["position"], ".2f"), fmt(b["position"], ".2f"), closer,
            abs(a["position"] - b["position"]))
    elif a["position"]:
        pos = "الموقع AR %s (EN بلا ظهور موزون)" % fmt(a["position"], ".2f")
    elif b["position"]:
        pos = "الموقع EN %s (AR بلا ظهور موزون)" % fmt(b["position"], ".2f")
    else:
        pos = "الموقع: — (لا ظهور موزون للغتين)"
    return imp, ctr, pos


def weekly_growth_line(ar7, en7, prev_ar7, prev_en7, first_reading):
    """§10.5-ج: per-language week-over-week growth — this entry's 7d window
    vs the previous weekly entry's 7d (non-overlapping by construction;
    the log JSON is the diff source — no side state)."""
    if (first_reading or not isinstance(prev_ar7, dict)
            or not isinstance(prev_en7, dict)):
        return "أول قراءة (خط الأساس) — لا نمو أسبوعي بعد"
    return ("AR: الظهور %s · النقرات %s — EN: الظهور %s · النقرات %s"
            % (pct_delta(ar7["impressions"], prev_ar7.get("impressions", 0.0)),
               pct_delta(ar7["clicks"], prev_ar7.get("clicks", 0.0)),
               pct_delta(en7["impressions"], prev_en7.get("impressions", 0.0)),
               pct_delta(en7["clicks"], prev_en7.get("clicks", 0.0))))


def family_detail_block(lang_label, q_rows, page_rows, qp_rows,
                        prev_pool, first_reading):
    """One family's 08-§2.1 evidence tables (items 2-5 + the raw evidence)
    — the exact P1-I rendering, parameterized per family. Returns
    (lines, queries_pool, top_pages); the pools feed the entry JSON."""
    lines = []
    # §2.1 item 2 — rising candidates (>=50 imps/28d), NEW ones flagged.
    pool = q_pool(q_rows)
    rows = []
    for item in pool[:15]:
        status = ("أولى" if first_reading
                  else ("**جديدة**" if item["q"] not in prev_pool else "قائمة"))
        rows.append("| %s | %s | %s | %s | %s | %s |" % (
            item["q"].replace("|", "\\|"), fmt(item["i"]), fmt(item["c"]),
            fmt(item["ctr"], ".2%"), fmt(item["pos"], ".2f"), status))
    lines.append("**كلمات صاعدة — %s (≥50 ظهورًا/28ي · §2.1-2):**" % lang_label)
    lines.append("")
    lines.extend(md_table("| الاستعلام | الظهور | النقرات | CTR | الموقع | الحالة |", rows))

    # §2.1 item 3 — CTR opportunities.
    opps = [r for r in q_rows
            if r.get("impressions", 0.0) >= CTR_OPP_IMPS
            and r.get("ctr", 0.0) < CTR_OPP_CTR_MAX
            and CTR_OPP_POS[0] <= r.get("position", 0.0) <= CTR_OPP_POS[1]]
    opps.sort(key=lambda r: -r.get("impressions", 0.0))
    rows = []
    for r in opps[:10]:
        rows.append("| %s | %s | %s | %s | %s |" % (
            (r.get("keys") or [""])[0].replace("|", "\\|"),
            fmt(r.get("impressions", 0.0)), fmt(r.get("clicks", 0.0)),
            fmt(r.get("ctr", 0.0), ".2%"), fmt(r.get("position", 0.0), ".2f")))
    lines.append("**فرص CTR — %s (≥100 ظهور · CTR <1%% · موقع 5-20 · §2.1-3):**" % lang_label)
    lines.append("")
    lines.extend(md_table("| الاستعلام | الظهور | النقرات | CTR | الموقع |", rows))

    # §2.1 item 4 — one-step-away pages.
    steps = [r for r in page_rows
             if ONE_STEP_POS[0] <= r.get("position", 0.0) <= ONE_STEP_POS[1]]
    steps.sort(key=lambda r: -r.get("impressions", 0.0))
    rows = []
    for r in steps[:10]:
        rows.append("| %s | %s | %s | %s | %s |" % (
            (r.get("keys") or [""])[0].replace("|", "\\|"),
            fmt(r.get("impressions", 0.0)), fmt(r.get("clicks", 0.0)),
            fmt(r.get("ctr", 0.0), ".2%"), fmt(r.get("position", 0.0), ".2f")))
    lines.append("**صفحات على بعد خطوة — %s (موقع 11-20 · §2.1-4):**" % lang_label)
    lines.append("")
    lines.extend(md_table("| الصفحة | الظهور | النقرات | CTR | الموقع |", rows))

    # Top queries / pages — the raw evidence.
    top_q = sorted(q_rows, key=lambda r: -r.get("impressions", 0.0))[:15]
    rows = []
    for n, r in enumerate(top_q, 1):
        rows.append("| %d | %s | %s | %s | %s | %s |" % (
            n, (r.get("keys") or [""])[0].replace("|", "\\|"),
            fmt(r.get("impressions", 0.0)), fmt(r.get("clicks", 0.0)),
            fmt(r.get("ctr", 0.0), ".2%"), fmt(r.get("position", 0.0), ".2f")))
    lines.append("**أعلى استعلامات %s (28ي):**" % lang_label)
    lines.append("")
    lines.extend(md_table("| # | الاستعلام | الظهور | النقرات | CTR | الموقع |", rows))

    top_p = sorted(page_rows, key=lambda r: -r.get("impressions", 0.0))[:10]
    rows = []
    for n, r in enumerate(top_p, 1):
        rows.append("| %d | %s | %s | %s | %s | %s |" % (
            n, (r.get("keys") or [""])[0].replace("|", "\\|"),
            fmt(r.get("impressions", 0.0)), fmt(r.get("clicks", 0.0)),
            fmt(r.get("ctr", 0.0), ".2%"), fmt(r.get("position", 0.0), ".2f")))
    lines.append("**أعلى صفحات %s (28ي):**" % lang_label)
    lines.append("")
    lines.extend(md_table("| # | الصفحة | الظهور | النقرات | CTR | الموقع |", rows))

    # §2.1 item 5 — query->page pairs (mapping analysis is a monthly step).
    rows = []
    for r in sorted(qp_rows, key=lambda x: -x.get("impressions", 0.0))[:10]:
        keys = r.get("keys") or ["", ""]
        rows.append("| %s | %s | %s |" % (
            keys[0].replace("|", "\\|"), keys[1].replace("|", "\\|"),
            fmt(r.get("impressions", 0.0))))
    lines.append("**خريطة استعلام←صفحة — %s (أعلى 10 أزواج · دليل §2.1-5):**" % lang_label)
    lines.append("")
    lines.extend(md_table("| الاستعلام | الصفحة الخادمة | الظهور |", rows))
    return lines, pool, top_p


def render_weekly_entry(run_date, w7, w28, ar7, ar28, en7, en28, prop7, prop28,
                        ar_q_rows, ar_page_rows, ar_qp_rows,
                        en_q_rows, en_page_rows, en_qp_rows,
                        prev_data, first_reading):
    """The UNIFIED weekly entry (P1-I-EN §10.5-ج): both families side by
    side in ONE entry + the AR↔EN comparison (28d gap + per-language
    week-over-week growth) + each family's 08-§2.1 evidence tables."""
    stamp = run_date.isoformat()
    prev_ar_pool, prev_en_pool = set(), set()
    prev_ar7 = prev_en7 = None
    if isinstance(prev_data, dict):
        prev_ar_pool = {i["q"] for i in prev_data.get("ar", {}).get("queries_pool", [])
                        if isinstance(i, dict) and "q" in i}
        prev_en_pool = {i["q"] for i in prev_data.get("en", {}).get("queries_pool", [])
                        if isinstance(i, dict) and "q" in i}
        prev_ar7 = prev_data.get("ar_tools", {}).get("7d")
        prev_en7 = prev_data.get("en_tools", {}).get("7d")
    lines = []
    lines.append("<!-- entry:weekly:%s -->" % stamp)
    lines.append("### أسبوع %s — نافذة 7 أيام: %s→%s · نافذة 28 يومًا: %s→%s"
                 % (stamp, w7[0].isoformat(), w7[1].isoformat(),
                    w28[0].isoformat(), w28[1].isoformat()))
    lines.append("")

    # §2.1 item 1 — both families side by side + whole-property context.
    lines.append("| المقياس | أدوات AR ‏7ي | أدوات AR ‏28ي | أدوات EN ‏7ي | أدوات EN ‏28ي | الخاصية كاملة 7ي | الخاصية كاملة 28ي |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|")
    for label, key, spec in (("الظهور", "impressions", ".0f"),
                             ("النقرات", "clicks", ".0f"),
                             ("CTR", "ctr", ".2%"),
                             ("الموقع المتوسط", "position", ".2f")):
        cells = [("—" if (v == 0 and key == "position") else fmt(v, spec))
                 for v in (ar7[key], ar28[key], en7[key], en28[key],
                           prop7[key], prop28[key])]
        lines.append("| %s | %s | %s | %s | %s | %s | %s |" % (label, *cells))
    lines.append("")

    # §10.5-ج — the comparison block: the AR↔EN gap + per-language growth.
    imp, ctr, pos = lang_gap_parts(ar28, en28)
    lines.append("**المقارنة AR↔EN (خطة P1-I-EN — التقرير 28 §10.5-ج):**")
    lines.append("")
    lines.append("- **فجوة الأداء (28ي):** %s · %s · %s" % (imp, ctr, pos))
    lines.append("- **النمو الأسبوعي (7ي مقابل مدخل الأسبوع السابق):** %s"
                 % weekly_growth_line(ar7, en7, prev_ar7, prev_en7, first_reading))
    lines.append("")

    ar_lines, ar_pool, ar_top_p = family_detail_block(
        "أدوات AR", ar_q_rows, ar_page_rows, ar_qp_rows,
        prev_ar_pool, first_reading)
    lines.extend(ar_lines)
    en_lines, en_pool, en_top_p = family_detail_block(
        "أدوات EN", en_q_rows, en_page_rows, en_qp_rows,
        prev_en_pool, first_reading)
    lines.extend(en_lines)

    def pages_json(rows):
        return [{"p": (r.get("keys") or [""])[0],
                 "i": r.get("impressions", 0.0), "c": r.get("clicks", 0.0),
                 "pos": r.get("position", 0.0)}
                for r in rows]

    data = {
        "run_date": stamp,
        "win7": {"start": w7[0].isoformat(), "end": w7[1].isoformat()},
        "win28": {"start": w28[0].isoformat(), "end": w28[1].isoformat()},
        "ar_tools": {"7d": {k: round(v, 4) for k, v in ar7.items()},
                     "28d": {k: round(v, 4) for k, v in ar28.items()}},
        "en_tools": {"7d": {k: round(v, 4) for k, v in en7.items()},
                     "28d": {k: round(v, 4) for k, v in en28.items()}},
        "property": {"7d": {k: round(v, 4) for k, v in prop7.items()},
                     "28d": {k: round(v, 4) for k, v in prop28.items()}},
        "ar": {"queries_pool": ar_pool, "top_pages": pages_json(ar_top_p)},
        "en": {"queries_pool": en_pool, "top_pages": pages_json(en_top_p)},
    }
    lines.append("```json")
    lines.append(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    lines.append("```")
    lines.append("<!-- /entry -->")
    return "\n".join(lines), data


def render_monthly_entry(run_date, month_start, month_end, ar_m, en_m,
                         ar_q_rows, en_q_rows, prev_m):
    """The UNIFIED monthly documented reading (P1-I acceptance «سجل شهري
    موثق» + §10.5-ج monthly-per-language): both languages in ONE entry,
    a month-over-month comparison per language, and the monthly AR↔EN gap."""
    ym = "%04d-%02d" % (month_start.year, month_start.month)
    month_name = {1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل", 5: "مايو",
                  6: "يونيو", 7: "يوليو", 8: "أغسطس", 9: "سبتمبر",
                  10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"}[month_start.month]
    lines = []
    lines.append("<!-- entry:monthly:%s -->" % ym)
    lines.append("### القراءة الشهرية الموثقة — %s %d (نافذة %s→%s · مسحوبة %s)"
                 % (month_name, month_start.year, month_start.isoformat(),
                    month_end.isoformat(), run_date.isoformat()))
    lines.append("")

    lines.append("| المقياس | أدوات AR — الشهر كامل | أدوات EN — الشهر كامل |")
    lines.append("|---|---:|---:|")
    for label, key, spec in (("الظهور", "impressions", ".0f"),
                             ("النقرات", "clicks", ".0f"),
                             ("CTR", "ctr", ".2%"),
                             ("الموقع المتوسط", "position", ".2f")):
        cells = [("—" if (t[key] == 0 and key == "position") else fmt(t[key], spec))
                 for t in (ar_m, en_m)]
        lines.append("| %s | %s | %s |" % (label, *cells))
    lines.append("")

    if (isinstance(prev_m, dict) and "ar_tools" in prev_m
            and "en_tools" in prev_m):
        pa, pe = prev_m["ar_tools"], prev_m["en_tools"]
        lines.append("**مقارنة بالشهر السابق (%s):** AR: الظهور %s · النقرات %s · الموقع %s — EN: الظهور %s · النقرات %s · الموقع %s — «التوسع المثبت» (§2.1-6) يحتاج نموًا شهرين متتاليين لكل لغة."
                     % (prev_m.get("month", "؟"),
                        pct_delta(ar_m["impressions"], pa.get("impressions", 0.0)),
                        pct_delta(ar_m["clicks"], pa.get("clicks", 0.0)),
                        ("%+.2f" % (ar_m["position"] - pa["position"])) if pa.get("position") else "—",
                        pct_delta(en_m["impressions"], pe.get("impressions", 0.0)),
                        pct_delta(en_m["clicks"], pe.get("clicks", 0.0)),
                        ("%+.2f" % (en_m["position"] - pe["position"])) if pe.get("position") else "—"))
        lines.append("")

    imp, ctr, pos = lang_gap_parts(ar_m, en_m)
    lines.append("**فجوة الشهر AR↔EN (§10.5-ج):** %s · %s · %s" % (imp, ctr, pos))
    lines.append("")

    ar_pool = q_pool(ar_q_rows)
    rows = []
    for item in ar_pool[:15]:
        rows.append("| %s | %s | %s | %s | %s |" % (
            item["q"].replace("|", "\\|"), fmt(item["i"]), fmt(item["c"]),
            fmt(item["ctr"], ".2%"), fmt(item["pos"], ".2f")))
    lines.append("**استعلامات الشهر ≥50 ظهورًا — أدوات AR (سجل الفرص §2.1-2):**")
    lines.append("")
    lines.extend(md_table("| الاستعلام | الظهور | النقرات | CTR | الموقع |", rows))

    en_pool = q_pool(en_q_rows)
    rows = []
    for item in en_pool[:15]:
        rows.append("| %s | %s | %s | %s | %s |" % (
            item["q"].replace("|", "\\|"), fmt(item["i"]), fmt(item["c"]),
            fmt(item["ctr"], ".2%"), fmt(item["pos"], ".2f")))
    lines.append("**استعلامات الشهر ≥50 ظهورًا — أدوات EN (سجل الفرص §2.1-2):**")
    lines.append("")
    lines.extend(md_table("| الاستعلام | الظهور | النقرات | CTR | الموقع |", rows))

    data = {
        "month": ym,
        "window": {"start": month_start.isoformat(), "end": month_end.isoformat()},
        "pulled": run_date.isoformat(),
        "ar_tools": {k: round(v, 4) for k, v in ar_m.items()},
        "en_tools": {k: round(v, 4) for k, v in en_m.items()},
        "ar": {"queries_pool": ar_pool},
        "en": {"queries_pool": en_pool},
    }
    lines.append("```json")
    lines.append(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    lines.append("```")
    lines.append("<!-- /entry -->")
    return "\n".join(lines), data


# ------------------------------------------------------------------ log mgmt
def split_zone(text, marker):
    """(head incl. marker, entry blocks newest-first, everything after the
    zone). The zone under a marker ends at the next top-level section
    header or the other P1I marker — inserts never bleed across zones."""
    idx = text.find(marker)
    if idx == -1:
        die("Marker %s not found in the monitoring log (honest red)." % marker)
    head = text[: idx + len(marker)]
    rest = text[idx + len(marker):]
    m = re.search(r"^## |^<!-- P1I:", rest, re.M)
    zone = rest[: m.start()] if m else rest
    after = rest[m.start():] if m else ""
    blocks = [b.strip("\n") for b in
              re.split(r"(?=^<!-- entry:(?:weekly|monthly):)", zone, flags=re.M)
              if b.strip("\n").startswith("<!-- entry:")]
    return head, blocks, after


def insert_entry(text, marker, entry, retain, dedup_prefix):
    """Newest-first insert + same-window dedup + hard retention cap."""
    head, blocks, after = split_zone(text, marker)
    # dedup: a re-run for the SAME window/month REPLACES its older copy
    # (the gemini 343-FIXUP-4 discipline).
    deduped = [b for b in blocks if not b.startswith(dedup_prefix)]
    if len(deduped) != len(blocks):
        log("[dedup] replaced %d existing entry(ies) for %s"
            % (len(blocks) - len(deduped), dedup_prefix))
    kept = ([entry] + deduped)[:retain]
    out = head + "\n\n" + "\n\n".join(kept) + "\n"
    if after.strip():
        out += "\n" + after.lstrip("\n")
    return out


def first_json_of(blocks):
    for b in blocks:
        m = re.search(r"```json\n(\{.*?\})\n```", b, re.S)
        if m:
            try:
                return json.loads(m.group(1))
            except ValueError:
                continue
    return None


# ------------------------------------------------------------------ main
def main():
    run_date = dt.datetime.now(dt.timezone.utc).date()

    # ---- window law: no GSC data before 2026-11-30 (guarded no-op) ----
    if run_date < WINDOW_OPENS:
        emit("## GSC tools weekly monitor (AR+EN) — نافذة التنفيذ لم تُفتح بعد")
        emit("")
        emit("- **اليوم (UTC):** %s — نافذة GSC تُفتح **%s** (قانون GSC-RE-AUDIT-2026-11-12 + رأس 08)."
             % (run_date.isoformat(), WINDOW_OPENS.isoformat()))
        emit("- **لا سحب بيانات ولا تعديل سجل** — هذه حالة no-op محروسة بتصميم (خروج 0).")
        emit("- أول قراءة فعلية: الاثنين 2026-11-30 06:20 UTC (فتحة الجدولة تصادف افتتاح النافذة).")
        emit("")
        emit("_Read-only by construction; nothing was pulled and the monitoring log was NOT modified._")
        log("::notice::Window not open yet (%s < %s) — guarded no-op, no GSC call made."
            % (run_date.isoformat(), WINDOW_OPENS.isoformat()))
        return 0

    creds_raw = os.environ.get("GSC_CREDENTIALS", "").strip()
    if not creds_raw:
        die("GSC_CREDENTIALS is not set — the weekly reading was NOT pulled "
            "(the workflow preflight should have caught this).")

    try:
        log_text = LOG_PATH.read_text(encoding="utf-8")
    except OSError:
        die("Monitoring log not found at %s — run inside the repo (honest red)." % LOG_PATH)

    sa, private_key = load_sa(creds_raw)
    access_token = get_access_token(sa, private_key)
    auth_headers = {"Authorization": "Bearer " + access_token,
                    "Content-Type": "application/json"}
    log("1/5 authenticated OK as the service account (identity not printed)")

    # ---- discovery (exact IDs from the API — nothing guessed) ----
    s_status, s_text = http(urllib.request.Request(
        API_BASE + "/sites", headers=auth_headers), timeout=30)
    if s_status != 200:
        die("**Discovery failed** — `sites.list` returned HTTP " + str(s_status) + ".",
            ["Google said: `" + scrub(s_text[:400], access_token) + "`"])
    try:
        entries = json.loads(s_text).get("siteEntry", [])
    except ValueError:
        die("`sites.list` returned HTTP 200 with a non-JSON body.")
    visible = [e.get("siteUrl", "") for e in entries if e.get("siteUrl")]
    if PRIMARY not in visible:
        die("**Primary property `" + PRIMARY + "` is NOT visible to this service account.**",
            ["Visible properties: " + ", ".join("`" + u + "`" for u in visible)])
    log("2/5 discovery OK — primary property visible")

    # ---- windows: the most recent COMPLETE days (end = yesterday UTC) ----
    end = run_date - dt.timedelta(days=1)
    w7 = (end - dt.timedelta(days=6), end)
    w28 = (end - dt.timedelta(days=27), end)

    try:
        ar7 = totals_of(query_api(PRIMARY, auth_headers,
                                  filter_group=ar_filter_group(),
                                  start_d=w7[0], end_d=w7[1]))
        ar28 = totals_of(query_api(PRIMARY, auth_headers,
                                   filter_group=ar_filter_group(),
                                   start_d=w28[0], end_d=w28[1]))
        en7 = totals_of(query_api(PRIMARY, auth_headers,
                                  filter_group=en_filter_group(),
                                  start_d=w7[0], end_d=w7[1]))
        en28 = totals_of(query_api(PRIMARY, auth_headers,
                                   filter_group=en_filter_group(),
                                   start_d=w28[0], end_d=w28[1]))
        prop7 = totals_of(query_api(PRIMARY, auth_headers,
                                    start_d=w7[0], end_d=w7[1]))
        prop28 = totals_of(query_api(PRIMARY, auth_headers,
                                     start_d=w28[0], end_d=w28[1]))
        ar_q_rows = query_api(PRIMARY, auth_headers, dims=["query"],
                              filter_group=ar_filter_group(), row_limit=500,
                              start_d=w28[0], end_d=w28[1])
        ar_page_rows = query_api(PRIMARY, auth_headers, dims=["page"],
                                 filter_group=ar_filter_group(), row_limit=200,
                                 start_d=w28[0], end_d=w28[1])
        ar_qp_rows = query_api(PRIMARY, auth_headers, dims=["query", "page"],
                               filter_group=ar_filter_group(), row_limit=500,
                               start_d=w28[0], end_d=w28[1])
        en_q_rows = query_api(PRIMARY, auth_headers, dims=["query"],
                              filter_group=en_filter_group(), row_limit=500,
                              start_d=w28[0], end_d=w28[1])
        en_page_rows = query_api(PRIMARY, auth_headers, dims=["page"],
                                 filter_group=en_filter_group(), row_limit=200,
                                 start_d=w28[0], end_d=w28[1])
        en_qp_rows = query_api(PRIMARY, auth_headers, dims=["query", "page"],
                               filter_group=en_filter_group(), row_limit=500,
                               start_d=w28[0], end_d=w28[1])
    except QueryError as exc:
        die("**searchAnalytics/query failed** — HTTP " + str(exc.status) + ".",
            ["Google said: `" + exc.detail + "`",
             "No log entry was written (a failed run never writes a partial entry)."])
    log("3/5 weekly query set finished (AR+EN: 7d/28d totals per family + "
        "queries/pages/pairs per family + property context)")

    # ---- diff source: the previous weekly entry's JSON (per family) ----
    _, weekly_blocks, _ = split_zone(log_text, WEEKLY_MARKER)
    prev_data = first_json_of(weekly_blocks)
    first_reading = not weekly_blocks

    entry_md, _ = render_weekly_entry(
        run_date, w7, w28, ar7, ar28, en7, en28, prop7, prop28,
        ar_q_rows, ar_page_rows, ar_qp_rows,
        en_q_rows, en_page_rows, en_qp_rows, prev_data, first_reading)
    log_text = insert_entry(log_text, WEEKLY_MARKER, entry_md, RETAIN_WEEKLY,
                            "<!-- entry:weekly:%s -->" % run_date.isoformat())
    log("4/5 unified weekly entry rendered (AR 28d: %s impressions, %s clicks · "
        "EN 28d: %s impressions, %s clicks%s)"
        % (fmt(ar28["impressions"]), fmt(ar28["clicks"]),
           fmt(en28["impressions"]), fmt(en28["clicks"]),
           " — FIRST reading (baseline window)" if first_reading else ""))

    # ---- monthly documented reading (acceptance «سجل شهري موثق») ----
    # Documents the previous calendar month on the first run of each month.
    # Window law: only months ENDING on/after 2026-11-30 are in scope —
    # October 2026 and earlier predate the monitoring window entirely
    # (their data lives in the 08-§1 baseline tables, not this log).
    month_added = False
    prev_month_end = run_date.replace(day=1) - dt.timedelta(days=1)
    prev_month_start = prev_month_end.replace(day=1)
    ym = "%04d-%02d" % (prev_month_start.year, prev_month_start.month)
    _, monthly_blocks, _ = split_zone(log_text, MONTHLY_MARKER)
    if prev_month_end < WINDOW_OPENS:
        log("      monthly reading skipped for %s — the month ends before the "
            "2026-11-30 window opening (out of this log's scope)" % ym)
    elif not any(b.startswith("<!-- entry:monthly:%s -->" % ym) for b in monthly_blocks):
        prev_m_json = first_json_of(monthly_blocks)
        try:
            ar_m = totals_of(query_api(PRIMARY, auth_headers,
                                       filter_group=ar_filter_group(),
                                       start_d=prev_month_start, end_d=prev_month_end))
            en_m = totals_of(query_api(PRIMARY, auth_headers,
                                       filter_group=en_filter_group(),
                                       start_d=prev_month_start, end_d=prev_month_end))
            qm_ar_rows = query_api(PRIMARY, auth_headers, dims=["query"],
                                   filter_group=ar_filter_group(), row_limit=500,
                                   start_d=prev_month_start, end_d=prev_month_end)
            qm_en_rows = query_api(PRIMARY, auth_headers, dims=["query"],
                                   filter_group=en_filter_group(), row_limit=500,
                                   start_d=prev_month_start, end_d=prev_month_end)
            m_entry, _ = render_monthly_entry(run_date, prev_month_start,
                                              prev_month_end, ar_m, en_m,
                                              qm_ar_rows, qm_en_rows,
                                              prev_m_json)
            log_text = insert_entry(log_text, MONTHLY_MARKER, m_entry, RETAIN_MONTHLY,
                                    "<!-- entry:monthly:%s -->" % ym)
            month_added = True
            log("      monthly documented reading added for %s (%s→%s)"
                % (ym, prev_month_start.isoformat(), prev_month_end.isoformat()))
        except QueryError as exc:
            die("**Monthly reading query failed** — HTTP " + str(exc.status) + ".",
                ["Google said: `" + exc.detail + "`",
                 "The weekly entry was rendered but NOT written — honest red, no partial log."])

    LOG_PATH.write_text(log_text, encoding="utf-8")
    log("5/5 monitoring log updated: %s (weekly ≤%d, monthly ≤%d%s)"
        % (LOG_PATH.relative_to(REPO), RETAIN_WEEKLY, RETAIN_MONTHLY,
           " — monthly reading ADDED" if month_added else ""))

    # ---- run summary (the report body always lands in the Actions summary) ----
    emit("## GSC tools weekly reading (AR+EN) — %s" % run_date.isoformat())
    emit("")
    emit("- **النوافذ:** 7 أيام %s→%s · 28 يومًا %s→%s (أيام كاملة · dataState=final)"
         % (w7[0].isoformat(), w7[1].isoformat(), w28[0].isoformat(), w28[1].isoformat()))
    emit("- **أدوات AR ‏28ي:** %s ظهورًا · %s نقرة · CTR %s · موقع %s"
         % (fmt(ar28["impressions"]), fmt(ar28["clicks"]),
            fmt(ar28["ctr"], ".2%"), fmt(ar28["position"], ".2f")))
    emit("- **أدوات EN ‏28ي:** %s ظهورًا · %s نقرة · CTR %s · موقع %s"
         % (fmt(en28["impressions"]), fmt(en28["clicks"]),
            fmt(en28["ctr"], ".2%"), fmt(en28["position"], ".2f")))
    gap_imp, gap_ctr, gap_pos = lang_gap_parts(ar28, en28)
    emit("- **فجوة الأداء AR↔EN (28ي · §10.5-ج):** %s · %s · %s"
         % (gap_imp, gap_ctr, gap_pos))
    emit("- **الخاصية كاملة 28ي (سياق):** %s ظهورًا · %s نقرة · CTR %s · موقع %s"
         % (fmt(prop28["impressions"]), fmt(prop28["clicks"]),
            fmt(prop28["ctr"], ".2%"), fmt(prop28["position"], ".2f")))
    if first_reading:
        emit("- **هذه القراءة الأولى** — نافذة خط الأساس (قاعدة 08-§1: أول تقرير نظيف كامل 28ي يصبح خط الأساس الرسمي).")
    if month_added:
        emit("- **القراءة الشهرية الموثقة أُضيفت:** %s" % ym)
    emit("- **السجل:** `docs/organic-growth-system-2026-11-18/gsc-ar-weekly-monitoring-log.md`")
    emit("")
    for line in entry_md.splitlines():
        emit(line)
    return 0


# ------------------------------------------------------------------ selftest
def selftest():
    """P1-I-FIX + P1-I-EN construction test: the ACTUAL request structure
    + semantics + the unified render. No network, no secrets, no log
    writes — runs before AND after the 2026-11-30 window.
    Exit 0 = every pin holds."""
    failures = []

    def check(name, ok, detail=""):
        log(("  OK   " if ok else "  FAIL ") + name +
            (("" if ok else " — " + str(detail))))
        if not ok:
            failures.append(name)

    log("GSC tools weekly selftest (P1-I + P1-I-EN) — structure + semantics + render (no network)")

    # -- 1. the family RE2 expressions (per family) ----------------------
    exprs = {}
    compiled = {}
    for fam, pages in (("AR", AR_TOOLS_FAMILY_PAGES), ("EN", EN_TOOLS_FAMILY_PAGES)):
        expr = (ar_page_regex() if fam == "AR" else en_page_regex())
        exprs[fam] = expr
        check("%s regex: case-insensitive inline flag preserved" % fam,
              expr.startswith("(?i)"))
        check("%s regex: ^-anchored alternation '(?i)^(?:' ... ')'" % fam,
              expr.startswith("(?i)^(?:") and expr.endswith(")"),
              expr[:12] + "..." + expr[-4:])
        check("%s regex: exactly six boundary tokens (one per family branch)" % fam,
              expr.count(PATH_BOUNDARY) == 6, expr.count(PATH_BOUNDARY))
        check("%s regex: every family pattern present exactly once, re.escape'd" % fam,
              all(expr.count(re.escape(p)) == 1 for p in pages))
        try:
            compiled[fam] = re.compile(expr)
            check("%s regex: compiles (RE2-compatible escapes only)" % fam, True)
        except re.error as exc:
            compiled[fam] = None
            check("%s regex: compiles (RE2-compatible escapes only)" % fam, False, exc)
        check("%s regex: <=4096 chars (API filter cap)" % fam, len(expr) <= 4096, len(expr))

    # -- 2/3. semantics per family: MUST match / MUST NOT match -----------
    ar_must_match = [
        "https://alkemos.com/ar/tools",                    # hub
        "https://alkemos.com/ar/tools/",                   # hub trailing /
        "https://alkemos.com/ar/tools/calorie-calculator", # T1
        "https://alkemos.com/ar/tools/bmi-calculator",     # T2
        "https://alkemos.com/ar/tools/macro-calculator",   # T3
        "https://alkemos.com/ar/tools/body-fat-calculator",# T4
        "https://alkemos.com/ar/tools/water-tracker",      # T5
        "https://alkemos.com/ar/meal-planner",             # T6
        "https://alkemos.com/ar/ai-meal-planner",          # T7
        "https://alkemos.com/ar/ai-workout-planner",       # T8
        "https://alkemos.com/ar/macro-tracker",            # T9
        "https://alkemos.com/ar/workout-tracker",          # T10
        "https://ALKEMOS.com/ar/TOOLS",                    # (?i) parity
        "https://alkemos.com/ar/tools?utm_source=menu",    # query-string form
        "https://alkemos.com/ar/tools/water-tracker?week=2",  # subpath + query
        "https://ALKEMOS.com/ar/tools/Calorie-Calculator", # (?i) through subpath
    ]
    ar_must_not_match = [
        "https://alkemos.com/ar/diet-plan",             # T11 — own family
        "https://alkemos.com/tools",                    # EN hub
        "https://alkemos.com/tools/calorie-calculator", # EN T1
        "https://alkemos.com/meal-planner",             # EN T6
        "https://alkemos.com/ai-meal-planner",          # EN T7
        "https://alkemos.com/ai-workout-planner",       # EN T8
        "https://alkemos.com/macro-tracker",            # EN T9
        "https://alkemos.com/workout-tracker",          # EN T10
        "https://alkemos.com/",                         # homepage
        "https://alkemos.com/ar/foods/olive-oil",       # foods family
        "https://alkemos.com/ar/coaching",              # coaching family
        "https://www.alkemos.com/ar/tools",             # www (contains-era parity)
        # final-review boundary negatives: sibling segments that CONTAIN a
        # family pattern as a string prefix must NOT match — the retired
        # unanchored expression swallowed all of these.
        "https://alkemos.com/ar/tools-archive-x",               # hub + '-archive-x'
        "https://alkemos.com/ar/tools-archive-x/weekly",        # sibling subpath
        "https://alkemos.com/ar/toolsmith",                     # same-segment prefix
        "https://alkemos.com/ar/meal-planner-extra",            # T6 + '-extra'
        "https://alkemos.com/ar/meal-planner-extra/weekly-plan",  # sibling subpath
        "https://ALKEMOS.com/ar/TOOLS-ARCHIVE-X",               # (?i) must not weaken the boundary
    ]
    # The EN battery (P1-I-EN): the (en) tree mirrors — T1-T5 live as
    # subpaths of the /tools hub; T11 EN and the WHOLE AR family must be
    # REJECTED (full data separation, §10.5-ب), as must EN sibling segments.
    en_must_match = [
        "https://alkemos.com/tools",                    # hub
        "https://alkemos.com/tools/",                   # hub trailing /
        "https://alkemos.com/tools/calorie-calculator", # T1
        "https://alkemos.com/tools/bmi-calculator",     # T2
        "https://alkemos.com/tools/macro-calculator",   # T3
        "https://alkemos.com/tools/body-fat-calculator",# T4
        "https://alkemos.com/tools/water-tracker",      # T5
        "https://alkemos.com/meal-planner",             # T6
        "https://alkemos.com/ai-meal-planner",          # T7
        "https://alkemos.com/ai-workout-planner",       # T8
        "https://alkemos.com/macro-tracker",            # T9
        "https://alkemos.com/workout-tracker",          # T10
        "https://ALKEMOS.com/TOOLS",                    # (?i) parity
        "https://alkemos.com/tools?utm_source=menu",    # query-string form
        "https://alkemos.com/tools/water-tracker?week=2",  # subpath + query
        "https://ALKEMOS.com/tools/Calorie-Calculator", # (?i) through subpath
    ]
    en_must_not_match = [
        "https://alkemos.com/diet-plan",                # T11 EN — own family
        "https://alkemos.com/ar/tools",                 # AR hub
        "https://alkemos.com/ar/tools/calorie-calculator",  # AR T1
        "https://alkemos.com/ar/meal-planner",          # AR T6
        "https://alkemos.com/ar/ai-meal-planner",       # AR T7
        "https://alkemos.com/ar/ai-workout-planner",    # AR T8
        "https://alkemos.com/ar/macro-tracker",         # AR T9
        "https://alkemos.com/ar/workout-tracker",       # AR T10
        "https://alkemos.com/",                         # homepage
        "https://alkemos.com/foods/olive-oil",          # foods family
        "https://alkemos.com/coaching",                 # coaching family
        "https://www.alkemos.com/tools",                # www (contains-era parity)
        # boundary negatives — the EN mirrors of the AR sibling segments
        "https://alkemos.com/tools-archive-x",               # hub + '-archive-x'
        "https://alkemos.com/tools-archive-x/weekly",        # sibling subpath
        "https://alkemos.com/toolsmith",                     # same-segment prefix
        "https://alkemos.com/meal-planner-extra",            # T6 + '-extra'
        "https://alkemos.com/meal-planner-extra/weekly-plan",  # sibling subpath
        "https://ALKEMOS.com/TOOLS-ARCHIVE-X",               # (?i) must not weaken the boundary
    ]
    for fam, must, must_not in (("AR", ar_must_match, ar_must_not_match),
                                ("EN", en_must_match, en_must_not_match)):
        if compiled[fam] is not None:
            for u in must:
                check("match: %s" % u, bool(compiled[fam].search(u)))
            for u in must_not:
                check("no-match: %s" % u, not compiled[fam].search(u))

    # -- 3b. family separation (§10.5-ب: full data separation) ------------
    check("separation: the two family expressions differ (never merged)",
          exprs["AR"] != exprs["EN"])
    check("separation: AR regex matches NO EN-family URL",
          compiled["AR"] is not None
          and all(not compiled["AR"].search(u) for u in EN_TOOLS_FAMILY_PAGES))
    check("separation: EN regex matches NO AR-family URL",
          compiled["EN"] is not None
          and all(not compiled["EN"].search(u) for u in AR_TOOLS_FAMILY_PAGES))
    check("separation: the EN expression carries no /ar/ path",
          "/ar/" not in exprs["EN"])
    check("separation: the AR expression is all six /ar/ paths",
          exprs["AR"].count("com/ar/") == 6)

    # -- 4. the filter GROUP shape per family (the API contract) ----------
    for fam, grp, expr in (("AR", ar_filter_group(), exprs["AR"]),
                           ("EN", en_filter_group(), exprs["EN"])):
        check("%s group: a single group object (never a list of groups)" % fam,
              isinstance(grp, dict))
        check("%s group: groupType 'and' (the only supported value)" % fam,
              grp.get("groupType") == "and", grp.get("groupType"))
        gf = grp.get("filters", [])
        check("%s group: exactly ONE filter inside" % fam, len(gf) == 1, len(gf))
        f0 = gf[0] if gf else {}
        check("%s filter: dimension 'page'" % fam, f0.get("dimension") == "page")
        check("%s filter: operator 'includingRegex' (RE2)" % fam,
              f0.get("operator") == "includingRegex", f0.get("operator"))
        check("%s filter: expression IS the family alternation" % fam,
              f0.get("expression") == expr)

    # -- 5. every real payload the monitor sends (16: 7 AR + 7 EN + 2 ctx) -
    w7 = (dt.date(2026, 11, 24), dt.date(2026, 11, 30))
    w28 = (dt.date(2026, 11, 3), dt.date(2026, 11, 30))
    mo = (dt.date(2026, 11, 1), dt.date(2026, 11, 30))
    payloads = {
        "weekly ar 7d totals": build_payload(
            filter_group=ar_filter_group(), start_d=w7[0], end_d=w7[1]),
        "weekly ar 28d totals": build_payload(
            filter_group=ar_filter_group(), start_d=w28[0], end_d=w28[1]),
        "weekly en 7d totals": build_payload(
            filter_group=en_filter_group(), start_d=w7[0], end_d=w7[1]),
        "weekly en 28d totals": build_payload(
            filter_group=en_filter_group(), start_d=w28[0], end_d=w28[1]),
        "weekly property 7d totals (context)": build_payload(
            start_d=w7[0], end_d=w7[1]),
        "weekly property 28d totals (context)": build_payload(
            start_d=w28[0], end_d=w28[1]),
        "weekly ar queries 28d": build_payload(
            dims=["query"], filter_group=ar_filter_group(),
            row_limit=500, start_d=w28[0], end_d=w28[1]),
        "weekly ar pages 28d": build_payload(
            dims=["page"], filter_group=ar_filter_group(),
            row_limit=200, start_d=w28[0], end_d=w28[1]),
        "weekly ar query->page pairs 28d": build_payload(
            dims=["query", "page"], filter_group=ar_filter_group(),
            row_limit=500, start_d=w28[0], end_d=w28[1]),
        "weekly en queries 28d": build_payload(
            dims=["query"], filter_group=en_filter_group(),
            row_limit=500, start_d=w28[0], end_d=w28[1]),
        "weekly en pages 28d": build_payload(
            dims=["page"], filter_group=en_filter_group(),
            row_limit=200, start_d=w28[0], end_d=w28[1]),
        "weekly en query->page pairs 28d": build_payload(
            dims=["query", "page"], filter_group=en_filter_group(),
            row_limit=500, start_d=w28[0], end_d=w28[1]),
        "monthly ar totals": build_payload(
            filter_group=ar_filter_group(), start_d=mo[0], end_d=mo[1]),
        "monthly ar queries": build_payload(
            dims=["query"], filter_group=ar_filter_group(),
            row_limit=500, start_d=mo[0], end_d=mo[1]),
        "monthly en totals": build_payload(
            filter_group=en_filter_group(), start_d=mo[0], end_d=mo[1]),
        "monthly en queries": build_payload(
            dims=["query"], filter_group=en_filter_group(),
            row_limit=500, start_d=mo[0], end_d=mo[1]),
    }
    for name, p in payloads.items():
        check("payload '%s': web + final + dates" % name,
              p.get("searchType") == "web" and p.get("dataState") == "final"
              and p.get("startDate") and p.get("endDate"))
        if "(context)" in name:
            check("payload '%s': NO dimensionFilterGroups key" % name,
                  "dimensionFilterGroups" not in p)
        else:
            groups = p.get("dimensionFilterGroups", [])
            check("payload '%s': exactly ONE group" % name, len(groups) == 1)
            g = groups[0] if groups else {}
            check("payload '%s': 'and' group + single includingRegex page filter"
                  % name,
                  g.get("groupType") == "and"
                  and len(g.get("filters", [])) == 1
                  and g["filters"][0].get("dimension") == "page"
                  and g["filters"][0].get("operator") == "includingRegex")
    check("payload: dimensions preserved (query/page/pairs per family)",
          payloads["weekly ar queries 28d"]["dimensions"] == ["query"]
          and payloads["weekly ar pages 28d"]["dimensions"] == ["page"]
          and payloads["weekly ar query->page pairs 28d"]["dimensions"] == ["query", "page"]
          and payloads["weekly en queries 28d"]["dimensions"] == ["query"]
          and payloads["weekly en pages 28d"]["dimensions"] == ["page"]
          and payloads["weekly en query->page pairs 28d"]["dimensions"] == ["query", "page"])
    check("payload: rowLimit preserved (500/200/500 per family)",
          payloads["weekly ar queries 28d"]["rowLimit"] == 500
          and payloads["weekly ar pages 28d"]["rowLimit"] == 200
          and payloads["weekly ar query->page pairs 28d"]["rowLimit"] == 500
          and payloads["weekly en queries 28d"]["rowLimit"] == 500
          and payloads["weekly en pages 28d"]["rowLimit"] == 200
          and payloads["weekly en query->page pairs 28d"]["rowLimit"] == 500)
    # the EN family payloads carry the EN expression — never the AR one
    check("payload: EN payloads carry the EN family expression (separation)",
          payloads["weekly en 28d totals"]["dimensionFilterGroups"][0]["filters"][0]
          ["expression"] == exprs["EN"]
          and payloads["monthly en totals"]["dimensionFilterGroups"][0]["filters"][0]
          ["expression"] == exprs["EN"])

    # -- 6. the retired bug shape can never return -----------------------
    # Needles are assembled at runtime so this check's own source can
    # never satisfy itself (a verbatim literal here would self-trip).
    src = Path(__file__).read_text(encoding="utf-8")
    retired_or_group = '"groupType"' + ": " + '"or"'
    retired_group_lc = '"filters"' + ": [f]} for f in filters"
    retired_contains = '"operator"' + ": " + '"contains"'
    retired_unanchored = 'return "' + '(?i)" + "|".join('
    check("retired: no groupType 'or' literal in the module",
          retired_or_group not in src)
    check("retired: no per-filter group list comprehension in the module",
          retired_group_lc not in src)
    check("retired: no contains-operator family filter in the module",
          retired_contains not in src)
    check("retired: no unanchored contains-era family join in the module",
          retired_unanchored not in src)

    # -- 7. the governing invariants the extension must NOT touch ---------
    check("window law: WINDOW_OPENS still 2026-11-30",
          WINDOW_OPENS == dt.date(2026, 11, 30))
    check("thresholds: 08-§2.1 letter unchanged (50/100/1%/(5,20)/(11,20))",
          (RISING_IMPS, CTR_OPP_IMPS, CTR_OPP_CTR_MAX, CTR_OPP_POS, ONE_STEP_POS)
          == (50, 100, 0.01, (5, 20), (11, 20)))
    check("retention: 12 weekly + 12 monthly unchanged",
          RETAIN_WEEKLY == 12 and RETAIN_MONTHLY == 12)

    # -- 8. the UNIFIED entry render (pure functions, fake data) ----------
    f_ar7 = {"clicks": 10.0, "impressions": 1000.0, "ctr": 0.01, "position": 12.0}
    f_ar28 = {"clicks": 40.0, "impressions": 4000.0, "ctr": 0.01, "position": 11.5}
    f_en7 = {"clicks": 5.0, "impressions": 500.0, "ctr": 0.01, "position": 15.0}
    f_en28 = {"clicks": 20.0, "impressions": 2000.0, "ctr": 0.01, "position": 14.5}
    f_prop7 = {"clicks": 60.0, "impressions": 6000.0, "ctr": 0.01, "position": 10.0}
    f_prop28 = {"clicks": 240.0, "impressions": 24000.0, "ctr": 0.01, "position": 9.5}
    f_ar_q = [{"keys": ["حاسبة سعرات"], "clicks": 5.0, "impressions": 120.0,
               "ctr": 0.0417, "position": 8.0}]
    f_en_q = [{"keys": ["calorie calculator"], "clicks": 4.0, "impressions": 110.0,
               "ctr": 0.0364, "position": 9.0}]
    f_ar_p = [{"keys": ["https://alkemos.com/ar/tools/calorie-calculator"],
               "clicks": 5.0, "impressions": 300.0, "ctr": 0.0167, "position": 12.0}]
    f_en_p = [{"keys": ["https://alkemos.com/tools/calorie-calculator"],
               "clicks": 4.0, "impressions": 250.0, "ctr": 0.016, "position": 13.0}]
    f_ar_qp = [{"keys": ["حاسبة سعرات",
                          "https://alkemos.com/ar/tools/calorie-calculator"],
                "impressions": 120.0}]
    f_en_qp = [{"keys": ["calorie calculator",
                          "https://alkemos.com/tools/calorie-calculator"],
                "impressions": 110.0}]
    md1, js1 = render_weekly_entry(
        dt.date(2026, 11, 30), w7, w28,
        f_ar7, f_ar28, f_en7, f_en28, f_prop7, f_prop28,
        f_ar_q, f_ar_p, f_ar_qp, f_en_q, f_en_p, f_en_qp, None, True)
    check("render: unified entry carries both families side by side",
          "أدوات AR ‏7ي" in md1 and "أدوات EN ‏7ي" in md1
          and "الخاصية كاملة 7ي" in md1)
    check("render: comparison block present (gap + weekly growth)",
          "فجوة الأداء" in md1 and "النمو الأسبوعي" in md1)
    check("render: gap math (EN imps = 50% of AR)", "50%" in md1)
    check("render: first reading flagged as baseline",
          "أول قراءة" in md1 and "خط الأساس" in md1)
    check("render: per-family detail blocks present",
          "كلمات صاعدة — أدوات AR" in md1 and "كلمات صاعدة — أدوات EN" in md1
          and "خريطة استعلام←صفحة — أدوات AR" in md1
          and "خريطة استعلام←صفحة — أدوات EN" in md1)
    check("render: JSON carries both families + per-language pools",
          all(k in js1 for k in ("ar_tools", "en_tools", "ar", "en", "property"))
          and js1["ar"]["queries_pool"][0]["q"] == "حاسبة سعرات"
          and js1["en"]["queries_pool"][0]["q"] == "calorie calculator")
    prev_week = {"ar_tools": {"7d": {"impressions": 500.0, "clicks": 5.0}},
                 "en_tools": {"7d": {"impressions": 125.0, "clicks": 1.0}},
                 "ar": {"queries_pool": []}, "en": {"queries_pool": []}}
    md2, _ = render_weekly_entry(
        dt.date(2026, 12, 7), w7, w28,
        f_ar7, f_ar28, f_en7, f_en28, f_prop7, f_prop28,
        f_ar_q, f_ar_p, f_ar_qp, f_en_q, f_en_p, f_en_qp, prev_week, False)
    check("render: weekly growth per language (AR +100% · EN +300%)",
          "+100%" in md2 and "+300%" in md2)
    m_md, m_js = render_monthly_entry(
        dt.date(2026, 12, 7), dt.date(2026, 11, 1), dt.date(2026, 11, 30),
        f_ar28, f_en28, f_ar_q, f_en_q, None)
    check("render: monthly entry carries both languages",
          "أدوات AR — الشهر كامل" in m_md and "أدوات EN — الشهر كامل" in m_md)
    check("render: monthly JSON carries both families + pools",
          "ar_tools" in m_js and "en_tools" in m_js
          and m_js["ar"]["queries_pool"][0]["q"] == "حاسبة سعرات"
          and m_js["en"]["queries_pool"][0]["q"] == "calorie calculator")
    prev_month = {"month": "2026-10",
                  "ar_tools": {"impressions": 2000.0, "clicks": 20.0, "position": 12.0},
                  "en_tools": {"impressions": 500.0, "clicks": 5.0, "position": 15.0}}
    m_md2, _ = render_monthly_entry(
        dt.date(2026, 12, 7), dt.date(2026, 11, 1), dt.date(2026, 11, 30),
        f_ar28, f_en28, f_ar_q, f_en_q, prev_month)
    check("render: month-over-month comparison per language (AR +100% · EN +300%)",
          "+100%" in m_md2 and "+300%" in m_md2)

    total = len(failures)
    if failures:
        log("GSC tools weekly selftest: %d FAILURE(S)" % total)
        return 1
    log("GSC tools weekly selftest: PASS (all pins hold — structure AND semantics AND render)")
    return 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        sys.exit(selftest())
    sys.exit(main())
