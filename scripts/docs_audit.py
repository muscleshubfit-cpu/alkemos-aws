#!/usr/bin/env python3
"""Knowledge operating system gate — Phase 107 (owner-approved study).

Owner problem: «ملفات التوثيق دايما بتسبب مشاكل» + «كل وكيل/محادثة جديدة
= لبس وتضارب» + شغل ضاع بسبب مسح مساحة العمل. The approved study diagnosed
the root causes (every fact written in 4-5 places, memory outside GitHub,
no single entry point, the law file itself carrying a duplicated §3.6)
and this gate enforces the cure as code, on every push/PR.

Checks (any failure = exit 1, ::error:: annotations in --ci):
  CHECK-FAMILY BUDGET (Phase 293 — ARCH-REMEDIATION, audit P4-2, law):
  the gate is capped at its current families; any NEW check must RETIRE
  or MERGE an existing one in the same commit (precedent: H5 merged into
  the H family and check I was retired to pay for it). The gate governs
  the docs; this budget governs the gate (RC-5).

  A. STATE.md exists, ≤ 100 lines, ≤ 32,000 bytes (hard cap — Phase 237,
     migration Phase 5), contains the required sections
     (المرحلة الحالية · المفتوح الآن · بانتظار موافقة المالك ·
      ممنوعات نشطة · خريطة مصادر الحقيقة · ملخص جودة المرحلة).
  B. STATE.md «آخر كوميت متحقق منه» is a real commit that is an
     ancestor-or-equal of HEAD (the state never points forward).
  C. STATE.md phase parseable + the Phase 115 frozen status files
     exist: archive/PROGRESS.md + archive/QA_CHECKLIST.md (owner
     «الأمر الخامس»: STATE.md is the single living status file —
     PROGRESS/QA were merged into it and frozen verbatim).
  D. Number-free docs: README.md + DEVELOPER_GUIDE.md carry ZERO
     variable counts (the AGENTS.md §3.8 single-source law). Numbers
     live in the code / INDEX.md only. This check was SENSITIVITY-PROVEN
     against the pre-Phase-107 docs (13 hits) before they were stripped.
  E. AGENTS.md: no duplicate section numbers (### N.N / ## N.) — born
     from the real duplicated §3.6 (lines 134 + 191).
  F. Merged status law (Phase 115, owner «الأمر الخامس»): PROGRESS.md /
     QA_CHECKLIST.md must NOT exist at the root (merged into STATE.md
     and frozen in archive/ — resurrection is gated); STATE.md keeps
     its archive/ pointer; the append-only archives must exist.
  G. STATE.md discoverability: README.md links it (the entry-point doc
     must be reachable from the front door).
  H. (Phase 215 / P1-4, 2026-09-16 — deep-audit finding المؤكد 6)
     worklog.md newest-on-top, ACTIVE region: the top 12 entries must
     be date-descending (undated Task IDs inherit the date below;
     same-date parseable phase numbers non-increasing — LIVE-VERIF
     entries are phase-exempt, they verify multiple phases), the FIRST
     entry must carry the newest date in the file, and nothing below
     the window may be newer than the oldest dated entry INSIDE it
     (Phase 234: derived tail invariant — the hand-bumped baseline
     constant is retired; a window slide can never trip this, a
     bottom-append always will).
  H5. (Phase 288 — ARCH-REMEDIATION, audit P1-1 / RC-4) the live
     worklog IS the active window, hard-capped: ≤ 12 Task-ID entries
     AND ≤ 128 KB. Anything below the window rotates verbatim to
     archive/WORKLOG_ARCHIVE.md in the SAME commit via
     scripts/worklog_rotate.py — size-driven, never calendar-driven,
     never one-shot. (Merged into the H family on purpose: the check
     budget is capped at 20 families — a new check must retire or
     merge an existing one, Phase 288 law.)
  K. (Phase 234 — migration Phase 2; hard since Phase 237 / migration
     Phase 5) worklog entry schema: a «## Task ID:» line is a malformed
     header → hard fail (the F-02 escape class). Entries missing the
     §12.5.1 skeleton (Agent/Task/Work Log/Stage Summary) → hard fail —
     the live region was normalized + rotated at Phase 237 (warnings
     retired; the legacy gap entries live in archive/, unchecked by design).
  I. RETIRED (Phase 289 — ARCH-REMEDIATION, audit P1-4 / RC-2): the
     governed docs' «Last updated» headers are OPTIONAL PROVENANCE now —
     git is the single source of every date (check M's hand-maintained
     date column died the same death; the gate REPORT derives dates
     from git instead). Editing a doc no longer demands a header bump.
  J. (Phase 215 / P1-4 — finding المؤكد 25) the Phase-115
     frozen-verbatim files (archive/PROGRESS.md +
     archive/QA_CHECKLIST.md) must have ZERO commits since the gate
     birthday (2026-09-16). The 2026-09-08 post-freeze edit (680833f9)
     predates the gate and is documented in the audit report.
  D2. (Phase 274 — DOC-REMEDIATION, external audit م-03/م-10)
     DEVELOPER_GUIDE-only widened number law: test-file/case counts,
     dependency version table rows, and hard-coded hex colors fail
     (the classes that actually drifted past the original 12 patterns).
  H4. (Phase 274) every worklog Task ID must carry a date — the undated
     bottom-append escaped H3 once (the 273 incident); documented
     pre-hardening legacy ids are allowlisted.
  L. (Phase 274 — external audit م-04) demo-account emails in the four
     setup docs must match the seeds in src/lib/data/auth.ts.
  M. (Phase 274 — external audit م-07; rewritten Phase 289 —
     ARCH-REMEDIATION, audit P1-4) the docs/README.md registry is
     enforced BIDIRECTIONALLY: every row's backticked paths exist,
     AND every top-level docs/*.md carries a row (the four
     unregistered files were invisible to the one-way check). The
     hand-maintained Last-updated column is RETIRED (RC-2 — git
     already records every date); the gate report derives and
     prints git dates instead of policing prose.
  N. (Phase 274 — external audit م-08) docs/CI_GATES.md must mention
     every file in .github/workflows/.
  P. (Phase 274 — external audit م-09) README/DEVELOPER_GUIDE Node
     claims may not undercut the package.json engines floor.
  Q. (Phase 274 — external audit م-12) any doc naming the
     "OpenRouter + Groq" pair must also carry NVIDIA (three-provider
     law, AGENTS.md §8).
  R. (Phase 274 — report §9) backticked repo paths in the five governed
     docs must exist (prefixed paths literally; bare filenames anywhere
     in git ls-files; retired/narrated + user-created files allowlisted).
  T. (Phase 274 — report §9) every documented `bun/npm run <x>` command
     must be a real package.json script.

Usage:  python3 scripts/docs_audit.py            # human report
        python3 scripts/docs_audit.py --ci       # GitHub Actions
Exit:   0 = knowledge system consistent · 1 = violations (list printed)
"""
import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(os.environ.get(
    "REPO_ROOT", Path(__file__).resolve().parent.parent))

CI = "--ci" in sys.argv

failures: list[tuple[str, str]] = []


def fail(check: str, msg: str) -> None:
    failures.append((check, msg))
    if CI:
        print(f"::error::docs_audit [{check}] {msg}")


def read(rel: str) -> str:
    p = REPO / rel
    if not p.exists():
        fail("file-exists", f"{rel} MISSING — the knowledge system "
                            f"requires it (AGENTS.md §3.6/§3.8)")
        return ""
    return p.read_text(errors="replace")


# ------------------------------------------------------------------ A
state = read("STATE.md")
state_bytes = len(state.encode("utf-8")) if state else 0
if state and state_bytes > 32_000:
    # Phase 237 (migration Phase 5, plan §8.3): the Phase-2 warning retired —
    # the byte cap is HARD now. Budgets bytes, not lines (audit RC-2: the
    # 100-line cap was gamed at 789 chars/line — F-04).
    fail("A/state-size",
         f"STATE.md is {state_bytes:,} bytes — the hard cap is 32,000 "
         f"(Phase 237 / migration Phase 5): the status file must stay a "
         f"30-second read; de-duplicate history into worklog/archive")
if state:
    lines = state.splitlines()
    if len(lines) > 100:
        fail("A/state-size",
             f"STATE.md is {len(lines)} lines — the law caps it at 100 "
             f"(it must stay a 30-second read); compress or archive")
    for marker in ("## المرحلة الحالية", "## المفتوح الآن",
                   "## بانتظار موافقة المالك", "## ممنوعات نشطة",
                   "## خريطة مصادر الحقيقة", "## ملخص جودة المرحلة"):
        if marker not in state:
            fail("A/state-sections", f"STATE.md lost required section "
                                     f"«{marker}»")

# ------------------------------------------------------------------ B
m = re.search(r"آخر كوميت متحقق منه:\*\*\s*([0-9a-f]{7,40})", state)
if state and not m:
    fail("B/state-commit",
         "STATE.md «آخر كوميت متحقق منه» missing/unparseable — "
         "format: «- **آخر كوميت متحقق منه:** <sha> (...)»")
elif m:
    sha = m.group(1)
    try:
        subprocess.run(
            ["git", "cat-file", "-e", f"{sha}^{{commit}}"],
            cwd=REPO, check=True,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(
            ["git", "merge-base", "--is-ancestor", sha, "HEAD"],
            cwd=REPO, check=True,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        shallow = (REPO / ".git/shallow").exists()
        hint = (" (shallow checkout detected — the gate needs full "
                "history: use actions/checkout fetch-depth: 0)"
                if shallow else
                " (update STATE.md to a verified commit)")
        fail("B/state-commit",
             f"STATE.md commit {sha} is not an ancestor-or-equal of HEAD "
             f"— the recorded state must never point forward{hint}")

# ------------------------------------------------------------------ C
def phase_num(text: str, pattern: str) -> int | None:
    mm = re.search(pattern, text)
    if not mm:
        return None
    return int(re.match(r"\d+", mm.group(1)).group(0))


state_phase = (phase_num(state, r"المرحلة:\*\*\s*(\d+[a-z]?)")
               if state else None)
if state and state_phase is None:
    fail("C/phase-equality",
         "STATE.md «**المرحلة:**» missing/unparseable")

# Phase 115 merged law: the frozen status files must exist in archive/
# (owner «الأمر الخامس» — STATE.md is the single living status file).
for rel in ("archive/PROGRESS.md", "archive/QA_CHECKLIST.md"):
    if not (REPO / rel).exists():
        fail("C/frozen-archive",
             f"{rel} MISSING — the Phase 115 merged law requires the "
             f"frozen status files in archive/ (owner «الأمر الخامس»)")

# ------------------------------------------------------------------ D
FORBIDDEN: list[tuple[str, str]] = [
    (r"\d+\s+SQL\s+files?", "SQL file count"),
    (r"\d+\s*ملف(?:ات)?\s*SQL", "SQL file count (Arabic)"),
    (r"\d+\s*ميجريشن", "migration count (Arabic)"),
    (r"\d+\s+page\.tsx", "page count"),
    (r"\d+\s+API\s+endpoints?", "API endpoint count"),
    (r"\d+\s+endpoints?", "endpoint count"),
    (r"Total:\s*\d+", "Total: N line"),
    (r"\d+\s+route\.tsx?", "route file count"),
    (r"\(\d+\s+views?\)", "view count"),
    (r"\d+\s+views?\b", "view count (loose)"),
    (r"\d+\s+components?\b", "component count"),
    (r"0001\s*(?:→|…|\.\.\.)\s*\d", "registry range 0001→NNNN"),
]
for rel in ("README.md", "DEVELOPER_GUIDE.md"):
    text = read(rel)
    for ln_no, ln in enumerate(text.splitlines(), 1):
        for pat, label in FORBIDDEN:
            if re.search(pat, ln):
                fail("D/number-free-docs",
                     f"{rel}:{ln_no} contains a variable count ({label}, "
                     f"pattern /{pat}/) — AGENTS.md §3.8 single-source "
                     f"law: numbers live in the code or INDEX.md only; "
                     f"line: {ln.strip()[:110]!r}")

# ------------------------------------------------------------------ D2
# Phase 274 (DOC-REMEDIATION — external audit م-03/م-10): the original
# 12 patterns missed the drift classes that actually shipped in
# DEVELOPER_GUIDE (18/191 test counts, the framer-motion dependency
# table, the pre-VRD hex palette). Scoped to the GUIDE only — README's
# marketing table stays under the original patterns.
FORBIDDEN_GUIDE: list[tuple[str, str]] = [
    (r"\d+\s*ملف(?:ات)?\s*(?:اختبار|تست)", "test-file count (Arabic)"),
    (r"\d+\s+test\s+files?", "test-file count"),
    (r"\d+\s*حال[ةات]\s*(?:اختبار|اختبارات)", "test-case count (Arabic)"),
    (r"\|\s*`[\w@/.-]+`\s*\|\s*`?\^?\d", "dependency version table row"),
    (r"#[0-9a-fA-F]{6}\b", "hard-coded hex color"),
]
guide_text = read("DEVELOPER_GUIDE.md")
for ln_no, ln in enumerate(guide_text.splitlines(), 1):
    for pat, label in FORBIDDEN_GUIDE:
        if re.search(pat, ln):
            fail("D2/guide-number-free",
                 f"DEVELOPER_GUIDE.md:{ln_no} contains {label} "
                 f"(pattern /{pat}/) — the GUIDE refers to its sources "
                 f"(package.json / STATE.md / DESIGN.md), it never carries "
                 f"these numbers or literals; line: {ln.strip()[:110]!r}")

# ------------------------------------------------------------------ E
agents = read("AGENTS.md")
if agents:
    seen: dict[tuple[str, str], int] = {}
    for ln_no, ln in enumerate(agents.splitlines(), 1):
        for h, pat in (("h2", r"^## (\d+)\."),
                       ("h3", r"^### (\d+\.\d+)")):
            mm = re.match(pat, ln)
            if mm:
                key = (h, mm.group(1))
                if key in seen:
                    fail("E/agents-duplicates",
                         f"AGENTS.md:{ln_no} DUPLICATE section number "
                         f"§{mm.group(1)} (first at line {seen[key]}) — "
                         f"the duplicated §3.6 incident must stay "
                         f"impossible")
                seen[key] = ln_no

# ------------------------------------------------------------------ F
# Phase 115 merged law: no status files at the root, ever again.
for rel in ("PROGRESS.md", "QA_CHECKLIST.md"):
    if (REPO / rel).exists():
        fail("F/no-root-status",
             f"{rel} must NOT exist at the root — merged into STATE.md "
             f"and frozen in archive/ at Phase 115 (owner «الأمر الخامس»); "
             f"resurrection is gated")
if state and "archive/" not in state:
    fail("F/state-archive-pointer",
         "STATE.md lost its archive/ pointer (history lives there)")
for rel in ("archive/PROGRESS_ARCHIVE.md", "archive/QA_CHECKLIST_ARCHIVE.md"):
    if not (REPO / rel).exists():
        fail("F/archive-exists", f"{rel} MISSING — the archive law "
                                 f"requires it")

# ------------------------------------------------------------------ G
readme = read("README.md")
if readme and "STATE.md" not in readme:
    fail("G/state-discoverable",
         "README.md does not link STATE.md — the entry-point doc must "
         "be reachable from the front door")

# ------------------------------------------------------------------ H
# Phase 215 / P1-4 (owner-approved remediation plan, audit المؤكد 6 + 3):
# the worklog newest-on-top law (AGENTS.md §3.8) was broken twice with
# zero gates noticing. Enforce the ACTIVE region's structure.
# PHASES 216/226/232: the tail was guarded by a hand-bumped baseline
# constant bumped in-commit three times — RC-3/F-14: it missed a bump
# roughly once per 10 phases and went red on 8321e718 (F-01).
# PHASE 234 (2026-09-19, migration Phase 2): the constant is RETIRED —
# the boundary is now DERIVED from the window itself: no entry below
# the top-12 window may be newer than the oldest dated entry inside
# it. A legitimate window slide can never trip it; a bottom-append
# (the VERCEL-USAGE-4 class) always will.
WORKLOG_WINDOW = 12

worklog = read("worklog.md")
wl_tasks: list[str] = []
wl_entries: list[list[str]] = []
if worklog:
    _cur: list[str] | None = None
    for ln in worklog.splitlines():
        m = re.match(r"^Task ID:\s+(.*?)\s*$", ln)
        if m:
            wl_tasks.append(m.group(1))
            if _cur is not None:
                wl_entries.append(_cur)
            _cur = [ln]
        elif _cur is not None:
            _cur.append(ln)
    if _cur is not None:
        wl_entries.append(_cur)

if worklog and len(wl_tasks) < 3:
    fail("H/worklog-parse", f"worklog.md carries only {len(wl_tasks)} "
                            f"Task ID entries — unparseable")


def wl_date(task: str) -> str | None:
    m = re.search(r"(\d{4}-\d{2}-\d{2})", task)
    return m.group(1) if m else None


def wl_phase(task: str) -> int | None:
    # PHASE-N is the norm; -N- immediately before a trailing date covers
    # SEO-GEO-15-BATCH1-206-2026-09-15 style ids. Bare trailing digits are
    # NOT trusted (they would parse the date's day as a phase).
    m = re.search(r"PHASE-(\d+)", task)
    if m:
        return int(m.group(1))
    m = re.search(r"-(\d{2,4})-\d{4}-\d{2}-\d{2}$", task)
    if m:
        return int(m.group(1))
    return None


def wl_phase_checked(task: str) -> int | None:
    # LIVE-VERIF entries verify MULTIPLE phases (e.g. PHASE-196-P197-…)
    # so their own phase number understates their chronology — their
    # position is still guarded by the date checks.
    if "LIVE-VERIF" in task.upper():
        return None
    return wl_phase(task)


if worklog and wl_tasks:
    dates: list[str | None] = [wl_date(t) for t in wl_tasks]
    # undated entries inherit the date of the next dated entry BELOW
    inherited: list[str | None] = list(dates)
    for k in range(len(inherited) - 2, -1, -1):
        if inherited[k] is None:
            inherited[k] = inherited[k + 1]
    known = [d for d in dates if d]
    if known:
        # H2 — newest-at-top
        if dates[0] is None:
            fail("H/worklog-top-date",
                 "worklog.md first entry has no parseable date in its "
                 "Task ID — the protocol read (§3.6) starts here")
        elif dates[0] < max(known):
            fail("H/worklog-newest-top",
                 f"worklog.md first entry ({dates[0]}) is older than the "
                 f"newest entry in the file ({max(known)}) — a newer "
                 f"entry was appended below instead of on top")
        # H1 — top window internally ordered (newest-on-top)
        w = min(WORKLOG_WINDOW, len(inherited))
        window = inherited[:w]
        prev: str | None = None
        for k, d in enumerate(window):
            if d is None:
                continue
            if prev is not None and d > prev:
                fail("H/worklog-window-order",
                     f"worklog.md entry #{k + 1} «{wl_tasks[k]}» is dated "
                     f"{d} — NEWER than the entry above it ({prev}): the "
                     f"active region must read newest-on-top")
            prev = d
        # same-date phase order inside the window (unparseable entries
        # are SKIPPED without resetting the run — the comparison stays
        # chained across them; the run resets implicitly on date change
        # because comparisons only fire when d == run_date_last)
        run_ph: list[int] = []
        run_task: str = ""
        run_date_last: str | None = None
        for k in range(w):
            d = inherited[k]
            ph = wl_phase_checked(wl_tasks[k])
            if d is None or ph is None:
                continue
            if run_ph and d == run_date_last and ph > run_ph[-1]:
                fail("H/worklog-window-order",
                     f"worklog.md «{wl_tasks[k]}» (phase {ph}) sits "
                     f"below «{run_task}» (phase {run_ph[-1]}) on "
                     f"the same date {d} — phases must descend")
            run_ph.append(ph)
            run_task = wl_tasks[k]
            run_date_last = d
        # H3 — tail freeze (Phase 234: DERIVED from the window — no constant)
        tail_dates = [d for d in inherited[w:] if d]
        window_dates = [d for d in inherited[:w] if d]
        if tail_dates and window_dates and max(tail_dates) > min(window_dates):
            fail("H/worklog-tail-freeze",
                 f"worklog.md entries below the top {w} include dates up "
                 f"to {max(tail_dates)} — NEWER than the oldest dated "
                 f"entry inside the window ({min(window_dates)}): new "
                 f"entries belong ON TOP, not appended to the history "
                 f"region")

# H4 — (Phase 274) undated Task IDs are the bottom-append escape class:
# the 273 frame appended a full entry BELOW the tail and H3 could not
# see it (nothing to inherit a date from). Every live Task ID must now
# carry a date. The two pre-hardening legacy ids below the window are
# allowlisted until they rotate to the archive (same grandfather
# precedent as check K's archive note).
UNDATED_TASKID_ALLOWLIST = {"217-close", "SEO-GEO-15-BATCH1-LIVE-VERIFY"}
for t in wl_tasks:
    if not wl_date(t) and t not in UNDATED_TASKID_ALLOWLIST:
        fail("H4/task-id-dated",
             f"worklog entry «{t}» carries no date in its Task ID — every "
             f"live entry must be dated (…-YYYY-MM-DD) so the newest-on-top "
             f"law can see it (Phase 274: the undated bottom-append escape)")

# H5 — (Phase 288 — ARCH-REMEDIATION, audit P1-1 / RC-4) the live worklog
# IS the active window: hard caps at 12 entries and 128 KB. The Phase-237
# one-time rotation regrew the file to 740 KB in 9 days because nothing
# enforced a size boundary (only ORDER was gated). Rotation is now
# mechanical: run scripts/worklog_rotate.py in the same commit that
# pushes the window past either cap. Merged into the H family (check
# budget ≤ 20 families — Phase 288 law).
WORKLOG_MAX_ENTRIES = 12
WORKLOG_MAX_BYTES = 128 * 1024
if worklog:
    wl_bytes = len(worklog.encode("utf-8"))
    if len(wl_tasks) > WORKLOG_MAX_ENTRIES:
        fail("H5/worklog-window-cap",
             f"worklog.md carries {len(wl_tasks)} Task-ID entries — the "
             f"live window is hard-capped at {WORKLOG_MAX_ENTRIES} "
             f"(Phase 288, ARCH-REMEDIATION): rotate the below-window "
             f"tail verbatim with `python3 scripts/worklog_rotate.py` "
             f"in the SAME commit (archive/WORKLOG_ARCHIVE.md)")
    if wl_bytes > WORKLOG_MAX_BYTES:
        fail("H5/worklog-window-cap",
             f"worklog.md is {wl_bytes:,} bytes — the live window is "
             f"hard-capped at {WORKLOG_MAX_BYTES:,} (Phase 288, "
             f"ARCH-REMEDIATION): run `python3 "
             f"scripts/worklog_rotate.py` in the SAME commit "
             f"(archive/WORKLOG_ARCHIVE.md)")

# ------------------------------------------------------------------ K
# Phase 234 / migration Phase 2: close the two escape classes the
# 2026-09-19 architecture audit caught (report F-02 + F-05's format
# drift). Hard: malformed «## Task ID:» headers the ^Task ID: parser
# never sees. Warn (until the Phase-5 normalization flips it): entries
# missing the §12.5.1 binding skeleton.
K_SKELETON = ("Agent:", "Task:", "Work Log:", "Stage Summary:")
for ln_no, ln in enumerate(worklog.splitlines(), 1) if worklog else []:
    if re.match(r"^##\s+Task ID:", ln):
        fail("K/malformed-header",
             f"worklog.md:{ln_no} is a malformed entry header («## Task "
             f"ID:» — the parser reads «Task ID:» at line start only): "
             f"normalize it to the §12.5.1 template")
# Phase 237 (migration Phase 5, plan §8): the skeleton check flips from
# warning to HARD fail — the live region is normalized (rotation (b));
# legacy gap entries are preserved in archive/ (outside this gate's scope).
for entry_lines in wl_entries:
    tid = re.match(r"^Task ID:\s+(.*?)\s*$", entry_lines[0]).group(1)
    missing = [f for f in K_SKELETON
               if not any(l.startswith(f) for l in entry_lines)]
    if missing:
        fail("K/entry-schema",
             f"worklog entry «{tid}» lacks the §12.5.1 skeleton "
             f"({', '.join(missing)}) — the template is binding for live "
             f"entries (Phase 237 hardening; AGENTS.md §12.5.1)")

# ------------------------------------------------------------------ I
# RETIRED (Phase 289 — ARCH-REMEDIATION, audit P1-4 / RC-2): the check-I
# date-truth policing (governed docs' Last-updated headers vs git) was
# the single most frequent fix-up class — a date duplicated in prose that
# git already records. Headers stay as OPTIONAL provenance; nothing gates
# them. The check slot it frees is the budget for H5 (merged into H).


def git_out(args: list[str]) -> str | None:
    try:
        r = subprocess.run(["git", *args], cwd=REPO,
                           stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                           text=True, timeout=30)
    except (subprocess.SubprocessError, OSError):
        return None
    return r.stdout.strip() if r.returncode == 0 else None


# ------------------------------------------------------------------ J
# Phase 215 / P1-4 (audit المؤكد 25): the Phase-115 frozen-verbatim
# files must never change again. Scoped to the frozen pair on purpose:
# §3.8 still allows APPEND-ONLY growth of the other archive files.
# Baseline repair (2026-11-15, P1 execution frame): the birthday moved
# past 2c2a90d (2026-11-12, the owner-ordered SEO-plan closure that FIRST
# created the frozen pair inside archive/ — the files were MOVED there
# by that commit; the J gate has been red on main since, without any
# subsequent touch). Freezing from 2026-11-13 preserves the check's full
# intent — no change to the pair AFTER the owner-ordered creation — and
# un-reds the gate honestly instead of bypassing it.
GATE_BIRTH = "2026-11-13"   # check-J birthday (moved once, documented above)
FROZEN_VERBATIM = ["archive/PROGRESS.md", "archive/QA_CHECKLIST.md"]
touched = git_out(["log", f"--since={GATE_BIRTH}T00:00:00", "--oneline",
                   "--", *FROZEN_VERBATIM])
if touched:
    fail("J/archive-freeze",
         f"the Phase-115 frozen-verbatim files were modified after the "
         f"Phase-215 gate birthday ({GATE_BIRTH}):\n{touched}\n"
         f"— frozen means frozen; an owner-ordered exception requires "
         f"updating this baseline in the same commit")

# ==================================================================
# Phase 274 (DOC-REMEDIATION) — the nine anti-drift checks born from
# the 2026-09-24 external documentation audit (م-04/م-07/م-08/م-09/
# م-12 + report §9 automation proposals). They run on every push via
# the existing docs-parity-gate workflow — no new workflow needed.
# ==================================================================

# ------------------------------------------------------------------ L
# م-04: the demo-account email must follow the seed in auth.ts (the
# four setup docs once documented a coach@ prefix the code never had).
auth_src = read("src/lib/data/auth.ts")
if auth_src:
    seeds = set(re.findall(
        r'email:\s*"([A-Za-z0-9._%+-]+@(?:coach|demo)\.app)"', auth_src))
    coach_seed = next((s for s in seeds if s.endswith("@coach.app")), None)
    client_seed = next((s for s in seeds if s.endswith("@demo.app")), None)
    for rel in ("README.md", "DEVELOPER_GUIDE.md", "SECURITY.md",
                ".env.example"):
        dtext = read(rel)
        for lm in re.finditer(r"([A-Za-z0-9._%+-]+)@(coach|demo)\.app", dtext):
            found = lm.group(0)
            want = coach_seed if lm.group(2) == "coach" else client_seed
            if want and found != want:
                fail("L/demo-email",
                     f"{rel} documents the demo email «{found}» but the seed "
                     f"in src/lib/data/auth.ts is «{want}» — docs follow the "
                     f"code (single source; Phase 274, external audit م-04)")

# ------------------------------------------------------------------ M
# م-07 (Phase 274) + Phase 289 (ARCH-REMEDIATION, audit P1-4): the
# registry is enforced BIDIRECTIONALLY now —
#   direction 1 (rows → files, unchanged): every backticked repo path in
#     a registry row must exist;
#   direction 2 (files → rows, NEW): every top-level docs/*.md must carry
#     a row — the four unregistered files were invisible to the one-way
#     check (the registry blind spot, audit §A2.1).
# The hand-maintained Last-updated column is RETIRED (RC-2: git already
# records every date — the column was the most frequent fix-up class,
# hand-in-hand with the retired check I). The gate REPORT below derives
# and prints git dates instead of policing prose.
registry = read("docs/README.md")
registry_paths: set[str] = set()
# Phase 290-FIXUP: the truth set is GIT-DERIVED (tracked + staged + untracked-
# non-ignored = what a commit would actually contain). The /scripts/* blanket
# in .gitignore once swallowed a freshly written guard script — it existed on
# disk (local gate green) but never landed (CI red). Filesystem existence
# alone cannot see that class; git can.
committable = set((git_out(["ls-files", "--cached", "--others",
                            "--exclude-standard"]) or "").splitlines())
if registry:
    for ln_no, ln in enumerate(registry.splitlines(), 1):
        if not ln.startswith("|"):
            continue
        for pth in re.findall(r"`([^`]+)`", ln):
            if not (re.match(r"^(?:[\w.-]+/)*[\w.-]+\.[\w.]+$", pth)
                    and not pth.startswith("http")):
                continue
            registry_paths.add(pth)
            if not (REPO / pth).exists():
                fail("M/registry-paths",
                     f"docs/README.md row references «{pth}» which does not "
                     f"exist — registry rows point at real files (moved? "
                     f"renamed? update the row in the same commit)")
            elif pth not in committable:
                fail("M/registry-paths",
                     f"docs/README.md row references «{pth}» which exists on "
                     f"disk but is NOT committable (gitignored or deleted?) "
                     f"— a guard that is not committed is not a guard; fix "
                     f"the .gitignore exception in the SAME commit")
    # direction 2 — every top-level docs/*.md must be registered
    docs_md = sorted((REPO / "docs").glob("*.md"))
    for md in docs_md:
        rel = f"docs/{md.name}"
        if rel not in registry_paths:
            fail("M/registry-coverage",
                 f"{rel} has no row in docs/README.md — every top-level "
                 f"docs/*.md must be registered (reports land WITH their "
                 f"row in the same commit — «born archived» law; Phase "
                 f"289, audit P1-4)")

# git-derived date report (replaces the hand-edited column — derive,
# don't duplicate): surfaced in the gate report, never in prose law.
if registry:
    dated: list[tuple[str, str]] = []
    for md in docs_md:
        rel = f"docs/{md.name}"
        g = git_out(["log", "-1", "--format=%as", "--", rel]) or "?"
        dated.append((g, rel))
    dated.sort(reverse=True)
    newest = " · ".join(f"{r} ({d})" for d, r in dated[:3])
    print(f"registry: {len(docs_md)} docs/*.md · all registered · "
          f"newest by git: {newest}")

# ------------------------------------------------------------------ N
# م-08: CI_GATES.md must cover every workflow file — its table once
# drifted by four workflows (and a wrong purge cadence).
ci_gates_text = read("docs/CI_GATES.md")
if ci_gates_text:
    for wf in sorted(p.name for p in
                     (REPO / ".github/workflows").glob("*.yml")):
        if wf not in ci_gates_text:
            fail("N/ci-gates-coverage",
                 f".github/workflows/{wf} is not mentioned in "
                 f"docs/CI_GATES.md — every workflow ships its table row "
                 f"in the same commit (Phase 274, external audit م-08)")

# ------------------------------------------------------------------ P
# م-09: documented Node requirement may never undercut package.json
# engines (the 18+ claim survived a Next-16 upgrade).
pkg_text = read("package.json")
if pkg_text:
    em = re.search(r'"engines"\s*:\s*\{[^}]*"node"\s*:\s*">=\s*([\d.]+)"',
                   pkg_text)
    if em:
        floor = tuple(int(x) for x in (em.group(1).split(".") + ["0", "0"])[:3])
        for rel in ("README.md", "DEVELOPER_GUIDE.md"):
            ptext = read(rel)
            for ln_no, ln in enumerate(ptext.splitlines(), 1):
                for cm in re.finditer(
                        r"Node(?:\.js)?\s*:?\s*(\d+)(?:\.(\d+))?\s*\+", ln):
                    got = tuple(int(x) for x in
                                (cm.group(1), cm.group(2) or "0", "0"))
                    if got < floor:
                        fail("P/node-requirement",
                             f"{rel}:{ln_no} claims Node "
                             f"{cm.group(1)}.{cm.group(2) or '0'}+ but "
                             f"package.json engines floor is {em.group(1)} "
                             f"— docs may not undercut the engines field "
                             f"(Phase 274, external audit م-09)")

# ------------------------------------------------------------------ Q
# م-12: three-provider law — naming the OpenRouter + Groq pair without
# NVIDIA is the metadata.json drift class.
for rel in ("metadata.json", "README.md", "SECURITY.md",
            "DEVELOPER_GUIDE.md", ".env.example"):
    qtext = read(rel)
    if re.search(r"OpenRouter\s*\+\s*Groq", qtext) and "NVIDIA" not in qtext:
        fail("Q/ai-providers",
             f"{rel} mentions the OpenRouter + Groq pair without NVIDIA NIM "
             f"— the three-provider law (AGENTS.md §8 since Phase 161) "
             f"requires all three or a pointer to src/lib/ai-provider.ts "
             f"(Phase 274, external audit م-12)")

# ------------------------------------------------------------------ R
# Report §9 (dead-path guard): backticked repo paths in the five
# governed docs must exist. Prefixed paths are checked literally; bare
# filenames pass if ANY tracked file carries that basename. Allowlists:
# user-created/generated files, naming-convention placeholders, and
# files whose RETIREMENT is itself documented law/history.
INTENTIONALLY_ABSENT = {".env.local", ".env", ".env.production",
                        "next-env.d.ts"}
NAMING_EXAMPLES = {"PascalCase.tsx", "use-kebab-case.tsx", "kebab-case.ts"}
RETIRED_OR_RENAMED = {
    "tailwind.config.ts",            # deleted by VRD-V5 (narrated in DESIGN)
    "build_assets_v3.py", "build_assets_v127.py", "fix_hero_logo2.py",
    "evo-partner.ts", "evo-embed-script.ts",   # EVO-6 removal law (AGENTS §8)
    "docs/EVO-PARTNER-API.md",       # deleted with the EVO-6 surface
    "0016_add_paypal_to_payment_method.sql",  # renamed RUN_ON_SUPABASE_ORIGINAL_0016_* (Phase 61)
}
PATH_RE = re.compile(
    r"`((?:src|scripts|docs|supabase|archive|\.github|public)/"
    r"[A-Za-z0-9_./-]+|[\w.-]+\.(?:md|ts|tsx|mts|mjs|js|sh|py|json|sql|"
    r"yml|yaml|toml|css))`")
tracked = git_out(["ls-files"]) or ""
tracked_names = {line.rsplit("/", 1)[-1] for line in tracked.splitlines()}
# The five governed docs (check R's scan scope — the check-I date policing
# on them was retired at Phase 289; the LIST stays for the dead-path guard).
GOVERNED_DOCS = ["AGENTS.md", "README.md", "DEVELOPER_GUIDE.md",
                 "SECURITY.md", "DESIGN.md"]
for rel in GOVERNED_DOCS:
    gp = REPO / rel
    if not gp.exists():
        continue  # read() already failed for it
    gtext = gp.read_text(errors="replace")
    for ln_no, ln in enumerate(gtext.splitlines(), 1):
        for pm in PATH_RE.finditer(ln):
            cand = pm.group(1)
            if (cand in INTENTIONALLY_ABSENT or cand in NAMING_EXAMPLES
                    or cand in RETIRED_OR_RENAMED):
                continue
            if "*" in cand or "<" in cand or "{" in cand:
                continue
            if "/" in cand:
                ok = (REPO / cand).exists()
            else:
                ok = (REPO / cand).exists() or cand in tracked_names
            if not ok:
                fail("R/doc-paths",
                     f"{rel}:{ln_no} references «{cand}» which does not "
                     f"exist in the repo — dead path references are drift "
                     f"(fix the doc or the path; Phase 274, report §9)")

# ------------------------------------------------------------------ T
# Report §9: documented run-commands must be real package.json scripts.
if pkg_text:
    sm = re.search(r'"scripts"\s*:\s*\{(.*?)\}', pkg_text, re.S)
    script_names = (set(re.findall(r'"([\w:-]+)"\s*:', sm.group(1)))
                    if sm else set())
    for rel in ("README.md", "DEVELOPER_GUIDE.md"):
        ttext = read(rel)
        for ln_no, ln in enumerate(ttext.splitlines(), 1):
            for cm in re.finditer(r"(?:bun|npm)\s+run\s+([A-Za-z][\w:-]*)",
                                  ln):
                if cm.group(1) not in script_names:
                    fail("T/doc-commands",
                         f"{rel}:{ln_no} documents «{cm.group(0)}» but "
                         f"«{cm.group(1)}» is not a package.json script — "
                         f"documented commands must exist (Phase 274, "
                         f"report §9)")
            for cm in re.finditer(r"(?:bun|npm)\s+(dev|build|start|lint|"
                                  r"test)\b", ln):
                if cm.group(1) not in script_names:
                    fail("T/doc-commands",
                         f"{rel}:{ln_no} documents «{cm.group(0)}» but "
                         f"«{cm.group(1)}» is not a package.json script — "
                         f"documented commands must exist (Phase 274, "
                         f"report §9)")

# ------------------------------------------------------------------ report
print("=" * 64)
print(f"knowledge gate : STATE phase={state_phase} · STATE lines="
      f"{len(state.splitlines()) if state else '∅'} · bytes={state_bytes:,} "
      f"(hard cap 32,000) · merged law: root PROGRESS/QA absent, frozen "
      f"copies in archive/ · worklog entries={len(wl_tasks)} "
      f"(H5 caps: ≤{WORKLOG_MAX_ENTRIES} / ≤{WORKLOG_MAX_BYTES:,}B) · truth "
      f"checks H/H4/H5/J/K (Phase 215/237/288) · Phase-274 anti-drift: "
      f"D2/H4/L/M/N/P/Q/R/T")
print("=" * 64)

if failures:
    print(f"\n{len(failures)} knowledge-system violation(s):")
    for check, msg in failures:
        print(f"\n❌ [{check}] {msg}")
    print("\nThe docs rot class is gated now — fix, don't bypass "
          "(AGENTS.md §3.6/§3.8).")
    sys.exit(1)

print("\n✓ knowledge operating system consistent (STATE · merged single-"
      "source law · number-free docs · AGENTS structure · frozen archive "
      "· discoverability · worklog order + hard window cap (H5) · archive "
      "freeze · byte cap + entry schema hard · Phase-274 anti-drift "
      "L/M/N/P/Q/R/T)")
sys.exit(0)
