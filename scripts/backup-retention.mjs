#!/usr/bin/env node
/**
 * backup-retention — GD-2 GFS working-tree pruner (2026-10-04)
 *
 * The retention half of the unified backup strategy
 * (docs/BACKUP-STRATEGY-2026-10-03.md §3.4 + §5 GD-2 — owner order
 * «نفّذ GD-2»): the private backup repo musclehubeg-backups had NO
 * deletion rule at all (blocker BS-2 — 29 + 14 + 14 full copies
 * accumulating monotonically since 2026-09-05). This script prunes
 * the working tree to the GFS keep-set:
 *
 *   daily   — every copy younger than BACKUP_RETENTION_DAILY days (7)
 *   weekly  — per each of the last BACKUP_RETENTION_WEEKLY (5) Sundays
 *             strictly before today: the NEWEST copy of that ISO week
 *             (Mon..Sun) — with complete daily data that IS Sunday's
 *             copy; if a Sunday run ever fails, the latest copy of the
 *             week still provides the weekly restore point
 *   monthly — per each of the last BACKUP_RETENTION_MONTHLY (6) months:
 *             the copy dated the 1st when present, else the OLDEST copy
 *             of that month (first-available fallback — September 2026
 *             has no 09-01 copy: backups began 09-05)
 *   floor   — the NEWEST copy of each type is ALWAYS kept, whatever the
 *             windows say (a paused backup pipeline must never lose its
 *             latest point to the pruner)
 *
 * SAFETY LAWS (measured against the repo, 2026-10-04):
 *   * Only the three whitelisted top-level dirs are ever touched —
 *     snapshots/ · storage-backups/ · storage-inventory/ — and only
 *     subdirectories named YYYY-MM-DD that are REAL dates. Everything
 *     else (README.md, malformed names, loose files) is listed as
 *     ignored and never modified.
 *   * Deletion is WORKING-TREE ONLY: one git commit removing the date
 *     dirs. Git history keeps every byte (blocker BS-5 stays deferred
 *     to an explicit owner decision) — a pruned copy is still
 *     recoverable from history.
 *   * A dirty checkout or HEAD != origin/main refuses to run (loud
 *     RED); a push rejected by a concurrent writer (the daily backup
 *     jobs fire 05:30–06:00 UTC nominal, but GitHub schedule lag
 *     measured them as late as 11:25 UTC) re-fetches, recomputes the
 *     plan deterministically and retries ONCE — then fails loudly.
 *   * PII law: the log prints directory NAMES and dates only — file
 *     contents (emails, photos, receipts) are never read, so nothing
 *     can leak into a public repo's Actions log.
 *   * An all-three-types-empty repo is a loud RED (the backup pipeline
 *     itself is broken — an honest RED beats a silently-wrong GREEN).
 *
 * Scheduled by .github/workflows/backup-retention.yml — Saturday
 * 03:30 UTC (the documented quiet window, 13 min after
 * notifications-prune 03:17, before the earliest nominal daily backup
 * fire at 05:30 UTC). Manual dispatch defaults to DRY-RUN; uncheck
 * dry_run to actually prune.
 *
 * Lean by design (the db-backup.mjs / notifications-prune.mjs pattern):
 * plain node, zero dependency installs, exports are side-effect-free
 * (main-guard) so local validation imports the core directly.
 *
 * Usage:
 *   node scripts/backup-retention.mjs            (env-driven, see below)
 * Env:
 *   RETENTION_REPO_PATH — path of the private-repo checkout (required;
 *                         the workflow checks it out at backup-repo/)
 *   DRY_RUN             — "true" = report + verify only, no commit/push
 *   BACKUP_RETENTION_DAILY / _WEEKLY / _MONTHLY — optional integers,
 *                         defaults 7 / 5 / 6, clamped to [1,30] /
 *                         [1,26] / [1,24] (non-integer = honest RED)
 * Exit codes: 0 = pruned (or nothing-to-do / clean dry-run) ·
 *             2 = missing env / bad retention value ·
 *             1 = operational failure (dirty tree, drift, push
 *                 rejected twice, post-verify mismatch, empty repo).
 */

import { spawnSync } from "node:child_process";
import { readdirSync, statSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const TYPES = ["snapshots", "storage-backups", "storage-inventory"];
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULTS = { daily: 7, weekly: 5, monthly: 6 };
export const CLAMPS = {
  daily: [1, 30],
  weekly: [1, 26],
  monthly: [1, 24],
};

function clampInt(raw, [lo, hi], fallback, name) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return fallback;
  }
  const n = Number(String(raw).trim());
  if (!Number.isInteger(n)) {
    throw new Error(
      `backup-retention: ${name} must be an integer, got: ${JSON.stringify(raw)}`,
    );
  }
  return Math.min(Math.max(n, lo), hi);
}

/** Resolve the GFS config from env-style raw strings (clamped, honest). */
export function resolveConfig(env) {
  return {
    daily: clampInt(env.BACKUP_RETENTION_DAILY, CLAMPS.daily, DEFAULTS.daily, "BACKUP_RETENTION_DAILY"),
    weekly: clampInt(env.BACKUP_RETENTION_WEEKLY, CLAMPS.weekly, DEFAULTS.weekly, "BACKUP_RETENTION_WEEKLY"),
    monthly: clampInt(env.BACKUP_RETENTION_MONTHLY, CLAMPS.monthly, DEFAULTS.monthly, "BACKUP_RETENTION_MONTHLY"),
  };
}

// ---------------------------------------------------------------------------
// Date helpers (UTC only — the runner and the backup dates are UTC)
// ---------------------------------------------------------------------------

/** "YYYY-MM-DD" -> UTC day number, or null when not a REAL calendar date. */
export function parseDay(s) {
  if (!DATE_RE.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d);
  const dt = new Date(t);
  // rejects 2026-13-45 / 2026-02-30 style phantom dates
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return Math.floor(t / 86400000);
}

/** UTC day number -> "YYYY-MM-DD". */
export function fmtDay(n) {
  return new Date(n * 86400000).toISOString().slice(0, 10);
}

/** UTC day number -> weekday, 0 = Sunday (matches Date#getUTCDay). */
export function weekday(n) {
  return new Date(n * 86400000).getUTCDay();
}

/** UTC day number -> {y, m} month key + "YYYY-MM" prefix. */
function monthOf(n) {
  const d = new Date(n * 86400000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), prefix: d.toISOString().slice(0, 7) };
}

/** First day (UTC day number) of the month `back` months before today. */
export function firstOfMonth(todayN, back) {
  const d = new Date(todayN * 86400000);
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - back, 1) / 86400000,
  );
}

// ---------------------------------------------------------------------------
// Listing (working tree = the exact truth of what would be deleted)
// ---------------------------------------------------------------------------

/**
 * Read the three whitelisted dirs of a checkout. Returns per type:
 *   dates   — sorted valid YYYY-MM-DD directory names
 *   ignored — everything else found there (never touched)
 * plus rootIgnored — top-level entries outside the whitelist.
 */
export function listCopies(repoPath) {
  const out = {};
  const rootIgnored = [];
  for (const entry of readdirSync(repoPath)) {
    if (entry === ".git") continue;
    if (!TYPES.includes(entry)) rootIgnored.push(entry);
  }
  for (const t of TYPES) {
    const dir = path.join(repoPath, t);
    const dates = [];
    const ignored = [];
    if (!existsSync(dir)) {
      out[t] = { dates, ignored, missing: true };
      continue;
    }
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      let isDir = false;
      try {
        isDir = statSync(full).isDirectory();
      } catch {
        ignored.push(name);
        continue;
      }
      if (isDir && parseDay(name) !== null) dates.push(name);
      else ignored.push(name);
    }
    dates.sort();
    out[t] = { dates, ignored, missing: false };
  }
  return { types: out, rootIgnored };
}

// ---------------------------------------------------------------------------
// GFS keep-set computation (pure — the exact law of the header)
// ---------------------------------------------------------------------------

export function computeGfs(dates, todayN, cfg) {
  const keep = new Map(); // date -> Set(reasons)
  const add = (d, why) => {
    if (!keep.has(d)) keep.set(d, new Set());
    keep.get(d).add(why);
  };
  const days = dates.map((d) => ({ name: d, n: parseDay(d) }));

  // floor: newest copy always kept
  if (days.length > 0) add(days[days.length - 1].name, "floor:newest");

  // daily window: age in [0, daily)
  for (const d of days) {
    const age = todayN - d.n;
    if (age >= 0 && age < cfg.daily) add(d.name, `daily:${age}d`);
  }

  // weekly: last `weekly` Sundays strictly before today; per anchor the
  // newest copy of [anchor-6, anchor] (the ISO week ending that Sunday)
  let anchor = todayN - 1;
  let found = 0;
  while (anchor > todayN - 400 && found < cfg.weekly) {
    if (weekday(anchor) === 0) {
      found++;
      const lo = anchor - 6;
      const inWeek = days.filter((d) => d.n >= lo && d.n <= anchor);
      if (inWeek.length > 0) add(inWeek[inWeek.length - 1].name, `weekly:${fmtDay(anchor)}`);
    }
    anchor--;
  }

  // monthly: last `monthly` months incl the current one; the 1st when
  // present, else the oldest copy of that month (first-available)
  for (let back = 0; back < cfg.monthly; back++) {
    const first = firstOfMonth(todayN, back);
    const prefix = fmtDay(first).slice(0, 7);
    const inMonth = days.filter((d) => d.name.startsWith(prefix));
    if (inMonth.length === 0) continue;
    const firsts = inMonth.filter((d) => parseDay(d.name) === first);
    if (firsts.length > 0) add(firsts[0].name, `monthly:${prefix}:1st`);
    else add(inMonth[0].name, `monthly:${prefix}:oldest`);
  }

  const keepNames = [...keep.keys()].sort();
  const deletes = dates.filter((d) => !keep.has(d));
  return { keep: keepNames, reasons: keep, deletes };
}

/** Full plan: list + GFS per type + stale-pipeline warnings. */
export function planRetention(repoPath, todayN, cfg) {
  const listing = listCopies(repoPath);
  const plans = {};
  for (const t of TYPES) {
    const { dates, ignored, missing } = listing.types[t];
    plans[t] = {
      dates,
      ignored,
      missing,
      stale: false,
      newestAge: null,
      ...computeGfs(dates, todayN, cfg),
    };
    if (dates.length > 0) {
      const age = todayN - parseDay(dates[dates.length - 1]);
      plans[t].newestAge = age;
      if (age >= 2 * cfg.daily) plans[t].stale = true; // pipeline stalled?
    }
  }
  return { plans, rootIgnored: listing.rootIgnored };
}

// ---------------------------------------------------------------------------
// Git driver
// ---------------------------------------------------------------------------

export function realGit(repoPath, args) {
  const r = spawnSync("git", ["-C", repoPath, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { code: r.status, stdout: (r.stdout || "").trim(), stderr: (r.stderr || "").trim() };
}

function gitRun(git, repoPath, args, what) {
  const r = git(repoPath, args);
  if (r.code !== 0) {
    throw new Error(`backup-retention: git ${what} failed (${r.code}): ${r.stderr.slice(0, 300)}`);
  }
  return r.stdout;
}

/**
 * Apply (or rehearse) a plan on the checkout.
 * dryRun: report + safety verifications only — no commit, no push.
 * Returns {commit, pushed, removed, remaining} for the final summary.
 */
export async function applyRetention(repoPath, planIn, { dryRun, git = realGit, today, cfg }) {
  let plan = planIn;
  let deletePaths = planPaths(plan);

  // pre-flight: clean tree + synced with origin
  const dirty = git(repoPath, ["status", "--porcelain"]).stdout;
  if (dirty !== "") {
    throw new Error(`backup-retention: checkout is dirty — refusing to prune:\n${dirty.slice(0, 400)}`);
  }
  const head = git(repoPath, ["rev-parse", "HEAD"]).stdout;
  const originHead = git(repoPath, ["rev-parse", "origin/main"]).stdout;
  if (!head || !originHead || head !== originHead) {
    throw new Error(
      `backup-retention: HEAD != origin/main (${head ? head.slice(0, 12) : "?"} vs ${originHead ? originHead.slice(0, 12) : "?"}) — refusing to prune a drifted checkout`,
    );
  }

  if (deletePaths.length === 0) return { commit: null, pushed: false, removed: {}, remaining: countRemaining(repoPath) };
  if (dryRun) {
    verifyKeepsIntact(repoPath, plan);
    return { commit: null, pushed: false, removed: {}, remaining: countRemaining(repoPath) };
  }

  // identity (same as db-backup.yml — consistent history in the private repo)
  gitRun(git, repoPath, ["config", "user.name", "alkemos-backup-bot"], "config user.name");
  gitRun(git, repoPath, ["config", "user.email", "actions@github.com"], "config user.email");

  let pushed = false;
  let commitSha = null;
  for (let attempt = 1; attempt <= 2 && !pushed; attempt++) {
    if (attempt === 2) {
      // a concurrent writer won the race — resync + recompute deterministically
      console.log("backup-retention: push rejected — re-fetching origin/main and recomputing the plan (attempt 2)");
      gitRun(git, repoPath, ["fetch", "origin"], "fetch");
      gitRun(git, repoPath, ["reset", "--hard", "origin/main"], "reset");
      plan = planRetention(repoPath, todayNOf(today), cfg);
      deletePaths = planPaths(plan);
      printPlan(plan, cfg, true);
      if (deletePaths.length === 0) return { commit: null, pushed: false, removed: {}, remaining: countRemaining(repoPath) };
    }
    gitRun(git, repoPath, ["rm", "-r", "-q", "--", ...deletePaths], "rm");
    verifyDeletionsApplied(repoPath, plan);
    verifyKeepsIntact(repoPath, plan);
    const msg =
      `retention: GFS prune ${today} (D${cfg.daily}/W${cfg.weekly}/M${cfg.monthly}) — ` +
      `removed ${deletePaths.length} date-dir(s) (working tree only; git history intact — BS-5 deferred)`;
    gitRun(git, repoPath, ["commit", "-q", "-m", msg], "commit");
    commitSha = gitRun(git, repoPath, ["rev-parse", "HEAD"], "rev-parse");
    // explicit refspec: no upstream-tracking dependency (works identically
    // on Actions checkouts and local fixtures); main = the measured default
    // branch of musclehubeg-backups
    const push = git(repoPath, ["push", "origin", "HEAD:refs/heads/main"]);
    if (push.code === 0) pushed = true;
    else if (attempt === 2) {
      throw new Error(`backup-retention: push rejected twice — giving up loudly: ${push.stderr.slice(0, 300)}`);
    } else {
      console.log(`backup-retention: push attempt 1 rejected (${push.stderr.split("\n")[0].slice(0, 160)})`);
    }
  }

  // post-verify: the remote main actually carries our commit
  gitRun(git, repoPath, ["fetch", "origin"], "fetch origin (post-verify)");
  const remoteHead = gitRun(git, repoPath, ["rev-parse", "origin/main"], "rev-parse origin/main");
  if (remoteHead !== commitSha) {
    throw new Error(`backup-retention: post-verify mismatch — origin/main ${remoteHead.slice(0, 12)} != our commit ${commitSha.slice(0, 12)}`);
  }
  return { commit: commitSha, pushed, removed: removedCounts(plan), remaining: countRemaining(repoPath) };
}

function planPaths(plan) {
  const out = [];
  for (const t of TYPES) for (const d of plan.plans[t].deletes) out.push(`${t}/${d}`);
  return out;
}

function todayNOf(todayStr) {
  return parseDay(todayStr);
}

function countRemaining(repoPath) {
  const out = {};
  for (const t of TYPES) {
    const dir = path.join(repoPath, t);
    if (!existsSync(dir)) {
      out[t] = 0;
      continue;
    }
    out[t] = readdirSync(dir).filter((n) => parseDay(n) !== null).length;
  }
  return out;
}

function removedCounts(plan) {
  const out = {};
  for (const t of TYPES) out[t] = plan.plans[t].deletes.length;
  return out;
}

/** After git rm: every planned delete is gone from the working tree. */
function verifyDeletionsApplied(repoPath, plan) {
  for (const t of TYPES) {
    for (const d of plan.plans[t].deletes) {
      if (existsSync(path.join(repoPath, t, d))) {
        throw new Error(`backup-retention: verify failed — ${t}/${d} still present after git rm`);
      }
    }
  }
}

/** Every keep is still present (the floor + windows deleted nothing kept). */
function verifyKeepsIntact(repoPath, plan) {
  for (const t of TYPES) {
    for (const d of plan.plans[t].keep) {
      if (!existsSync(path.join(repoPath, t, d))) {
        throw new Error(`backup-retention: verify failed — keep ${t}/${d} missing from working tree`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export function printPlan(ret, cfg, retry = false) {
  console.log(`\n=== GFS retention plan (D${cfg.daily}/W${cfg.weekly}/M${cfg.monthly})${retry ? " — recomputed" : ""} ===`);
  for (const t of TYPES) {
    const p = ret.plans[t];
    console.log(`\n--- ${t}: ${p.dates.length} copy(ies) ${p.dates[0] ?? "-"} .. ${p.dates[p.dates.length - 1] ?? "-"}${p.missing ? " [DIR MISSING — skipped]" : ""} ---`);
    if (p.stale) {
      console.log(`  ⚠ STALE: newest copy is ${p.newestAge} days old — the backup pipeline itself may be broken (this prune keeps the newest floor, but the daily jobs need attention)`);
    }
    for (const d of p.keep) {
      console.log(`  KEEP   ${d}  [${[...(p.reasons.get(d) ?? [])].join(", ")}]`);
    }
    for (const d of p.deletes) {
      console.log(`  delete ${d}`);
    }
    if (p.ignored.length > 0) {
      console.log(`  ignored (never touched): ${p.ignored.join(", ")}`);
    }
    console.log(`  -> keep ${p.keep.length} / delete ${p.deletes.length} / remaining ${p.dates.length - p.deletes.length}`);
  }
  if (ret.rootIgnored.length > 0) {
    console.log(`\nroot-level entries outside the whitelist (never touched): ${ret.rootIgnored.join(", ")}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const repoPath = process.env.RETENTION_REPO_PATH;
  if (!repoPath) {
    console.error("backup-retention: RETENTION_REPO_PATH is required (path of the private-repo checkout)");
    process.exit(2);
  }
  if (!existsSync(repoPath)) {
    console.error(`backup-retention: RETENTION_REPO_PATH does not exist: ${repoPath}`);
    process.exit(2);
  }
  const dryRun = String(process.env.DRY_RUN ?? "").toLowerCase() === "true";

  let cfg;
  try {
    cfg = resolveConfig(process.env);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }

  const now = new Date();
  const todayN = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000);
  const today = fmtDay(todayN);

  // all-three-empty = the pipeline is broken: honest RED
  const ret = planRetention(repoPath, todayN, cfg);
  ret.cfg = cfg; // carried for the retry recompute
  const nonEmpty = TYPES.filter((t) => ret.plans[t].dates.length > 0);
  if (nonEmpty.length === 0) {
    console.error("backup-retention: all three backup dirs are EMPTY — the daily backup pipeline is broken; refusing to be green");
    process.exit(1);
  }
  for (const t of TYPES) {
    if (ret.plans[t].missing) {
      console.log(`backup-retention: WARN — dir ${t}/ missing entirely (skipped, not a failure)`);
    } else if (ret.plans[t].dates.length === 0) {
      console.log(`backup-retention: WARN — dir ${t}/ has no dated copies (skipped, not a failure)`);
    }
  }

  printPlan(ret, cfg);

  try {
    const res = await applyRetention(repoPath, ret, { dryRun, today, cfg });
    if (dryRun) {
      console.log(`\nDRY-RUN complete — nothing committed, nothing pushed (set the workflow dry_run input to false to prune for real).`);
      console.log(JSON.stringify({ ok: true, dry_run: true, today, cfg, remaining: res.remaining }));
    } else if (res.pushed) {
      console.log(`\nretention applied — commit ${res.commit.slice(0, 12)} pushed to the private repo (working tree only; history intact).`);
      console.log(JSON.stringify({ ok: true, dry_run: false, today, cfg, removed: res.removed, remaining: res.remaining, commit: res.commit.slice(0, 12) }));
    } else {
      console.log(`\nnothing to prune — every copy is inside the GFS keep-set.`);
      console.log(JSON.stringify({ ok: true, dry_run: false, today, cfg, removed: {}, remaining: res.remaining, commit: null }));
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
