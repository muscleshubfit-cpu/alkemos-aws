#!/bin/sh
# =====================================================================
# VERCEL-IGNORE-HARDENING-2026-10-04 — Vercel Ignored Build Step.
#
# vercel.json delegates here (sh scripts/vercel/ignore-step.sh) because
# the inline ignoreCommand field is HARD-CAPPED at 256 chars by Vercel's
# official schema (measured against https://openapi.vercel.sh/vercel.json,
# 2026-10-04) — the hardened law below does not fit inline (498 chars —
# the d7be1a6 deployment was rejected instantly for exceeding the cap;
# the old 251-char command had sat just under it the whole time).
#
# MEASURED LAWS this script enforces (full record:
# docs/VERCEL-IGNORE-STEP-ACTIVATION-2026-09-20.md §6):
#   * Vercel: exit 0 = SKIP · exit 1 = BUILD · ANY OTHER CODE = the
#     deployment itself FAILS. The bare `git diff $PREV HEAD` exited 128
#     (fatal: bad object) at afc4d40 when VERCEL_GIT_PREVIOUS_SHA sat 27
#     commits behind HEAD — outside Vercel's shallow clone — so nothing
#     but 0/1 may ever escape this script.
#   * GitHub allows fetching an old commit by full SHA
#     (git fetch origin <sha> --depth=1 — measured 2026-10-04), which
#     restores skip accuracy across long docs-only streaks.
#   * The 12 root-anchored excludes are the owner-approved polarity
#     (2026-09-20 activation §2): unknown/future files force a deploy.
#
# The common case (gap <= clone depth) makes ZERO network calls.
# =====================================================================

P="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"

# 1) resolve PREV locally; if absent, fetch exactly that one commit
git cat-file -e "$P" 2>/dev/null || git fetch -q origin "$P" --depth=1 2>/dev/null || true

# 2) diff against PREV when resolvable — exit 0 (docs-only -> SKIP) or
#    1 (watched paths changed -> BUILD); any git crash is sanitized to 1
if git cat-file -e "$P" 2>/dev/null; then
  git diff --quiet "$P" HEAD -- . \
    ':!docs' ':!archive' \
    ':!/AGENTS.md' ':!/CHANGELOG.md' ':!/CONTRIBUTING.md' ':!/DESIGN.md' \
    ':!/DEVELOPER_GUIDE.md' ':!/LICENSE' ':!/README.md' ':!/SECURITY.md' \
    ':!/STATE.md' ':!/worklog.md' || exit 1
  exit 0
fi

# 3) PREV unresolvable (beyond shallow depth / rewritten history) ->
#    BUILD (the safe direction; a build also resets the PREV gap)
echo "ignore-step: PREV $P unresolvable in clone (shallow depth) -> BUILD fallback"
exit 1
