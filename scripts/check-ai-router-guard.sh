#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# AI-ROUTER REGISTRY GUARD — R6 of the approved AI-unification plan
# (owner order 2026-10-31 approving §10 of
# docs/AI-ROUTER-UNIFICATION-AUDIT-2026-10-31.md). Pure bash + node + tsx,
# runs in seconds. Fails CI on:
#
#   1) SOLE-DOOR violations (audit §9-ت1) — any call to the engine doors
#      (callFreeAIFallbackChain · callGroundedSearch · callAIWithFallback ·
#      callAIStream · callAI) in src/ OUTSIDE the engine (ai-provider.ts),
#      the router (ai-router.ts) and the __tests__ canaries. After R3/R4/R5
#      every production AI call rides dispatchAI/dispatchGrounded — this
#      guard keeps it that way (a new direct call would fork routing policy
#      away from the single source).
#   2) UNREGISTERED dispatch ids — every id literal dispatched via
#      dispatchAI/dispatchGrounded/callValidatedChain must resolve through
#      the REAL registry resolver (ai-registry.ts resolveRegistrySpec —
#      never a regex replica: no second copy of resolution logic, the
#      drift risk audit §8-2 warns about).
#   3) DEAD registrations — every registry id must be REACHED by a call
#      site: a direct literal, a language template (blog:topics-${lang})
#      or a template family (ai-job:${tool}), or a DECLARED ت4 ENGINE TWIN
#      (spec.metering.scope points at its dispatched sibling — the
#      blog:draft-generate law). No orphans, no dead specs.
#
# Comments are stripped before scanning (migration frames compressed the
# historic references into comments — those must never count as calls).
# Negative self-test proven (inject a direct engine call / an unregistered
# id / a dead registration → each FAILs its check, cleanup → PASS).
# Rollback: remove the workflow step (documented in CI_GATES.md) — the
# guard is observation-only, zero behavior.
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")/.."

TOKENS_FILE="$(mktemp)"
trap 'rm -f "$TOKENS_FILE"' EXIT
export TOKENS_FILE

# ── Stage 1 (pure node): sole-door scan + dispatch-token extraction ────────
node --input-type=module -e '
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let failures = 0;
const fail = (m) => { console.error("✗ " + m); failures++; };
const ok = (m) => console.log("✓ " + m);

const SKIP = new Set(["node_modules", ".next", ".git", "dist", "coverage"]);
const EXTS = [".ts", ".tsx", ".mts"];
function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (SKIP.has(e)) continue;
    const p = join(dir, e);
    let s; try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) walk(p, out);
    else if (EXTS.some((x) => e.endsWith(x))) out.push(p);
  }
  return out;
}

const stripComments = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");

const files = walk("src");

// ── Check 1: sole door ──
const ENGINE = "src/lib/ai-provider.ts";
const ROUTER = "src/lib/ai-router.ts";
const DOORS = /\b(callFreeAIFallbackChain|callGroundedSearch|callAIWithFallback|callAIStream|callAI)\s*\(/g;
const allowed = (f) => f === ENGINE || f === ROUTER || f.includes("__tests__");
const doorHits = [];
for (const f of files) {
  const text = stripComments(readFileSync(f, "utf8"));
  for (const _ of text.matchAll(DOORS)) { doorHits.push(f); break; }
}
const violations = [...new Set(doorHits.filter((f) => !allowed(f)))];
if (violations.length) {
  fail(`sole-door violation(s) — engine calls outside ${ENGINE}/${ROUTER}/__tests__: ${violations.join(", ")}`);
} else {
  ok(`sole door: ${[...new Set(doorHits)].length} file(s) reference the engine doors — all inside the engine/router/canaries`);
}

// ── Dispatch-token extraction (production files only — tests must not mask
//    dead registrations; comment-stripped) ──
const literals = new Set();
const templates = new Set();
const DISPATCHERS = /\b(dispatchAI|dispatchGrounded|callValidatedChain)\s*\(/g;
const isIdShaped = (s) => /[:\-]/.test(s); // real ids always carry a separator
for (const f of files) {
  if (f.includes("__tests__")) continue;
  const text = stripComments(readFileSync(f, "utf8"));
  for (const m of text.matchAll(DISPATCHERS)) {
    const argArea = text.slice(m.index + m[0].length, m.index + m[0].length + 300);
    // stop at the first top-level comma/closing paren of the FIRST argument
    let depth = 0, end = argArea.length;
    for (let i = 0; i < argArea.length; i++) {
      const c = argArea[i];
      if ("([{".includes(c)) depth++;
      else if (")]}".includes(c)) { if (depth === 0) { end = i; break; } depth--; }
      else if (c === "," && depth === 0) { end = i; break; }
    }
    const firstArg = argArea.slice(0, end).trim();
    // NOTE: \x27 = apostrophe — a literal '\'' would break the bash
    // single-quoted embedding (the check-ui-wiring precedent).
    if (/^["\x27]/.test(firstArg)) {
      const lit = firstArg.match(/^["\x27]([^"\x27]+)["\x27]/);
      if (lit && isIdShaped(lit[1])) literals.add(lit[1]);
    } else if (/^`/.test(firstArg)) {
      const tpl = firstArg.match(/^`([^$`]+)/);
      if (tpl) templates.add(tpl[1]);
    } else {
      // conditional first arg (ternary/variable) — collect the id-shaped
      // string literals of the expression (comparison literals like "ar"
      // are filtered by the id shape)
      for (const q of firstArg.matchAll(/"([^"]+)"/g)) {
        if (isIdShaped(q[1])) literals.add(q[1]);
      }
    }
  }
}
if (!literals.size && !templates.size) {
  fail("dispatch-token scan produced nothing — guard regex drifted (src/ must dispatch via dispatchAI/dispatchGrounded/callValidatedChain)");
}

writeFileSync(process.env.TOKENS_FILE, JSON.stringify({ literals: [...literals], templates: [...templates] }));
ok(`dispatch tokens: ${literals.size} literal id(s) + ${templates.size} template prefix(es) extracted from production code`);

if (failures) {
  console.error(`\nAI-ROUTER GUARD (stage 1): ${failures} failure(s)`);
  process.exit(1);
}
' || exit 1

# ── Stage 2 (tsx — the REAL registry, no regex replica): completeness ──────
npx --no-install tsx -e '
import { readFileSync } from "node:fs";
import {
  AI_FUNCTION_REGISTRY,
  resolveRegistrySpec,
  listRegistryIds,
} from "./src/lib/ai-registry";

let failures = 0;
const fail = (m) => { console.error("✗ " + m); failures++; };
const ok = (m) => console.log("✓ " + m);

const { literals, templates } = JSON.parse(
  readFileSync(process.env.TOKENS_FILE, "utf8"),
) as { literals: string[]; templates: string[] };

// ── Check 2: every dispatched id resolves through the real resolver ──
const unresolved = [];
for (const lit of literals) {
  if (!resolveRegistrySpec(lit)) unresolved.push(lit);
}
for (const tpl of templates) {
  const base = tpl.replace(/[-:]$/, "");
  // a template is valid if its base resolves directly (blog:topics) OR it
  // prefixes a registered family (ai-job: → ai-job:article-generate …)
  const familyHit = listRegistryIds().some(
    (id) => id === base || id.startsWith(base + ":") || id.startsWith(base + "-"),
  );
  if (!resolveRegistrySpec(base) && !familyHit) {
    unresolved.push(`${tpl} (template → base "${base}")`);
  }
}
if (unresolved.length) {
  fail(`unregistered dispatch id(s): ${unresolved.join(", ")} — register in ai-registry.ts (registerFunction) before dispatching`);
} else {
  ok(`registered dispatches: ${literals.length} literal(s) + ${templates.length} template(s) all resolve via resolveRegistrySpec`);
}

// ── Check 3: no dead registrations (used directly / via template / twin) ──
const templateBases = templates.map((t) => t.replace(/[-:]$/, ""));
const usedSpecIds = new Set(
  literals.map((l) => resolveRegistrySpec(l)?.spec.id).filter(Boolean),
);
const reachable = (id) => {
  if (usedSpecIds.has(id)) return "direct";
  for (const base of templateBases) {
    if (id === base || id.startsWith(base + ":") || id.startsWith(base + "-")) return "template";
  }
  // DECLARED ت4 ENGINE TWIN: metering.scope points at a reached sibling
  // (the blog:draft-generate law — one source for both engines).
  const spec = AI_FUNCTION_REGISTRY[id];
  const twin = spec?.metering?.scope;
  if (twin && twin !== id && reachable(twin)) return "twin";
  return null;
};
const dead = [];
const reach = {};
for (const id of listRegistryIds()) {
  const how = reachable(id);
  if (!how) dead.push(id);
  else reach[id] = how;
}
if (dead.length) {
  fail(`dead registration(s): ${dead.join(", ")} — no call site dispatches them (direct, template, or declared twin)`);
} else {
  const byKind = Object.values(reach).reduce((a, k) => ({ ...a, [k]: (a[k] || 0) + 1 }), {});
  ok(`registry complete: ${listRegistryIds().length} id(s) all reached (${Object.entries(byKind).map(([k, v]) => `${v} ${k}`).join(" · ")})`);
}

if (failures) {
  console.error(`\nAI-ROUTER GUARD (stage 2): ${failures} failure(s)`);
  process.exit(1);
}
' || exit 1

echo ""
echo "AI-ROUTER REGISTRY GUARD: all checks passed"
