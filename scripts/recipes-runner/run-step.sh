#!/usr/bin/env bash
# =====================================================================
# scripts/recipes-runner/run-step.sh
#
# Retry wrapper around run-step.mts for GitHub Actions (the blog-runner
# pattern adapted to the recipes PAIR pipeline — plan §6.3):
#   • up to MAX_ATTEMPTS tries per pipeline step
#   • linear backoff: 120s after attempt 1, 240s after attempt 2
#   • captures queueId from any step's JSON into $GITHUB_ENV so later
#     steps receive it automatically
#   • honest-skip propagation: a step answering ok:true + skipped:true
#     prints SKIPPED=1; the wrapper exports RECIPES_SKIPPED=1 so the
#     workflow's later stages (`if: env.RECIPES_SKIPPED != '1'`) stop
#     gracefully instead of failing on a missing queue row (the daily
#     quota / circuit-breaker / kill-switch honest exits).
#
# REPAIR CONTRACT (the blog R1 repair-loop law, 2026-09-29 — adapted):
#   • a DETERMINISTIC hold (exit code 3 from run-step.mts + a
#     "RERUN_TARGET=<step>" stdout line) is a REPAIR DIRECTIVE, not a
#     transient error. The blind ×3 retry re-runs the SAME stage on the
#     SAME immutable bundle and fails byte-identically — so this wrapper
#     EXECUTES the directive in-run: it re-runs the targeted stage and
#     every stage between it and the failing one on the SAME queue row,
#     then re-attempts the failing stage. Budget: ≤ MAX_REPAIRS (2)
#     repair cycles, then the honest held/failed verdict (the route
#     already wrote it). No gate/threshold changed.
#   • UNLIKE the blog (where only P5 emits the contract), the recipes
#     routes R1→R5 can each hold with a rerunTarget — the loop below
#     handles any emitter.
#   • row reset: the failing route set status='held' + rerun_target.
#     Before re-running a targeted stage the row must go back to the
#     status that stage accepts (scripts/recipes-runner/run-step.mts
#     --requeue → resetRecipeRowForRepair, which also INCREMENTS
#     repair_cycles). EXCEPTIONS:
#       - target r1-structure with the FAILING step == r1-structure:
#         NO reset — R1 accepts 'held' and reads its own error_message
#         as the one-shot missing-refs repair directive.
#       - target r0-idea: no reset exists (R0's RESUME protocol never
#         picks up held rows) — the wrapper re-runs r0 WITHOUT a
#         queueId, a FRESH row is created, and the held row stays
#         behind as the honest failure record; the new QUEUE_ID is
#         captured from the fresh r0 output.
#   • recursive repair calls pin MAX_REPAIRS=0 — the repair chain never
#     nests another repair loop.
#
# REPAIR OBSERVABILITY (the blog R5 law): each repair cycle appends
# REPAIRS_USED=<n> to $GITHUB_ENV — the workflow's Summary step prints
# it as the run's repair-loop line.
#
# Usage:  bash scripts/recipes-runner/run-step.sh <step-name> [max-attempts]
# Env:    QUEUE_ID (optional input from previous steps)
#         GITHUB_ENV (provided by Actions runtime)
#         MAX_REPAIRS (default 2 — repair-cycle budget)
# Exit:   0 on success (incl. honest skip), 1 if all attempts/repairs failed
# =====================================================================
set -uo pipefail

STEP="${1:?usage: run-step.sh <step-name> [max-attempts]}"
MAX_ATTEMPTS="${2:-3}"
MAX_REPAIRS="${MAX_REPAIRS:-2}"

# The ordered pipeline. The repair chain re-runs everything from the
# rerunTarget through the step BEFORE the failing step; the failing step
# itself is re-attempted by this loop right after the chain.
PIPELINE_STEPS=(r0-idea r1-structure r2-nutrition r3-authoring r4-image r5-gates r6-publish r7-indexing)

ARGS=(--step "$STEP")
if [ -n "${QUEUE_ID:-}" ]; then
  ARGS+=(--queueId "$QUEUE_ID")
fi

capture_queue_id() {
  # $1 = step name (its tee'd output file)
  local qid
  qid="$(grep -o '"queueId":"[^"]*"' /tmp/"$1".out 2>/dev/null | head -1 | cut -d'"' -f4)"
  if [ -n "$qid" ] && [ -n "${GITHUB_ENV:-}" ]; then
    echo "QUEUE_ID=$qid" >> "$GITHUB_ENV"
    echo "[$1] captured QUEUE_ID=$qid"
  fi
  printf '%s' "$qid"
}

attempt=1
repairs_used=0
while :; do
  echo "--- [$STEP] attempt $attempt / $MAX_ATTEMPTS ---"

  set +e
  npx --no-install tsx scripts/recipes-runner/run-step.mts "${ARGS[@]}" 2>&1 | tee /tmp/"$STEP".out
  CODE=${PIPESTATUS[0]}
  set -u

  if [ "$CODE" -eq 0 ]; then
    capture_queue_id "$STEP" >/dev/null
    # Honest-skip propagation (R0 daily-quota/circuit-breaker, R6
    # kill-switch): later workflow stages stop gracefully.
    if grep -q '^SKIPPED=1$' /tmp/"$STEP".out 2>/dev/null && [ -n "${GITHUB_ENV:-}" ]; then
      echo "RECIPES_SKIPPED=1" >> "$GITHUB_ENV"
      echo "[$STEP] honest skip — RECIPES_SKIPPED=1 exported"
    fi
    echo "✓ $STEP succeeded"
    exit 0
  fi

  # ── REPAIR CONTRACT: exit 3 = deterministic hold ───────────────────
  if [ "$CODE" -eq 3 ]; then
    TARGET="$(grep -a -o '^RERUN_TARGET=[a-z0-9-]*' /tmp/"$STEP".out | tail -1 | cut -d= -f2)"

    # Contract sanity — anything off is an honest exit-1 failure.
    if [ -z "$TARGET" ]; then
      echo "❌ [$STEP] exit 3 without a parseable RERUN_TARGET line — honest failure"
      exit 1
    fi
    case "$TARGET" in
      r0-idea|r1-structure|r2-nutrition|r3-authoring|r4-image) ;;
      *)
        echo "❌ [$STEP] RERUN_TARGET '$TARGET' outside the repair contract — honest failure"
        exit 1
        ;;
    esac
    if [ -z "${QUEUE_ID:-}" ] && [ "$TARGET" != "r0-idea" ]; then
      echo "❌ [$STEP] repair contract without QUEUE_ID — honest failure"
      exit 1
    fi
    if [ "$repairs_used" -ge "$MAX_REPAIRS" ]; then
      echo "❌ [$STEP] repair budget exhausted ($MAX_REPAIRS cycle(s), last target: $TARGET) — honest failure (the route's held/failed verdict stands)"
      exit 1
    fi

    repairs_used=$((repairs_used + 1))
    if [ -n "${GITHUB_ENV:-}" ]; then
      echo "REPAIRS_USED=$repairs_used" >> "$GITHUB_ENV"
    fi
    echo "🔁 [$STEP] repair cycle $repairs_used/$MAX_REPAIRS: re-running from $TARGET${QUEUE_ID:+ on queue row $QUEUE_ID}"

    if [ "$TARGET" = "r0-idea" ]; then
      # A held row can never be resumed by R0 (RESUME only picks open
      # rows) — run a FRESH r0 without the old queueId; the held row
      # stays as the honest failure record and the new row's id is
      # captured (GITHUB_ENV + this shell) for the chain below.
      echo "   └─ r0 target: fresh idea row (the held row stays as the failure record)"
      if ! MAX_REPAIRS=0 env -u QUEUE_ID bash "$0" r0-idea "$MAX_ATTEMPTS"; then
        echo "   └─ fresh r0-idea failed — chain stops (the failing step re-evaluates next)"
      else
        NEW_QID="$(grep -o '"queueId":"[^"]*"' /tmp/r0-idea.out 2>/dev/null | head -1 | cut -d'"' -f4)"
        if [ -n "$NEW_QID" ]; then
          export QUEUE_ID="$NEW_QID"
          ARGS=(--step "$STEP" --queueId "$QUEUE_ID")
          echo "   └─ fresh row captured: QUEUE_ID=$QUEUE_ID"
        fi
      fi
    else
      # Row reset: back to the status the TARGET stage accepts (unless
      # the failing step IS r1-structure — R1 keeps its held row and its
      # missing-refs feedback directive).
      if [ "$TARGET" = "r1-structure" ] && [ "$STEP" = "r1-structure" ]; then
        echo "   └─ r1 self-hold: no reset (R1 re-runs on the held row with its own feedback)"
      else
        echo "   └─ row reset → the status $TARGET accepts"
        if ! npx --no-install tsx scripts/recipes-runner/run-step.mts --requeue --queueId "$QUEUE_ID"; then
          echo "❌ [$STEP] requeue reset failed — honest failure"
          exit 1
        fi
      fi

      # Re-run every stage from TARGET through the stage BEFORE the
      # failing step (status gates advance naturally). If a repair step
      # fails, the chain stops — the failing step below re-evaluates the
      # unchanged row and either exits 3 again (next repair cycle /
      # honest failure) or succeeds.
      CHAIN_FROM=-1
      FAILING_INDEX=-1
      for i in "${!PIPELINE_STEPS[@]}"; do
        if [ "${PIPELINE_STEPS[$i]}" = "$TARGET" ]; then CHAIN_FROM=$i; fi
        if [ "${PIPELINE_STEPS[$i]}" = "$STEP" ]; then FAILING_INDEX=$i; fi
      done
      if [ "$CHAIN_FROM" -lt 0 ] || [ "$FAILING_INDEX" -lt 0 ] || [ "$CHAIN_FROM" -gt "$FAILING_INDEX" ]; then
        echo "❌ [$STEP] RERUN_TARGET '$TARGET' not before the failing step — honest failure"
        exit 1
      fi

      i="$CHAIN_FROM"
      while [ "$i" -lt "$FAILING_INDEX" ]; do
        RS="${PIPELINE_STEPS[$i]}"
        echo "   └─ repair step: $RS"
        if ! MAX_REPAIRS=0 bash "$0" "$RS" "$MAX_ATTEMPTS"; then
          echo "   └─ repair step $RS failed — chain stops (the failing step re-evaluates next)"
          break
        fi
        i=$((i + 1))
      done
    fi

    # Re-attempt the failing step immediately — the repair IS the
    # strategy change; no backoff sleep between repair cycles.
    attempt=$((attempt + 1))
    continue
  fi

  # ── transient failure (exit 1/2): the legacy ×3 + backoff policy ──
  echo "↻ [$STEP] attempt $attempt failed (exit $CODE)"
  if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
    WAIT=$((120 * attempt))
    echo "   retrying in ${WAIT}s ..."
    sleep "$WAIT"
    attempt=$((attempt + 1))
    continue
  fi
  break
done

echo "❌ [$STEP] failed after $MAX_ATTEMPTS attempts"
exit 1
