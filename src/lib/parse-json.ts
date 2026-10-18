/**
 * Pure LLM-JSON parser — leaf module (SEO-COLLAPSE-AUDIT-2026-10-18 fix).
 *
 * WHY THIS FILE EXISTS (topology fix, zero behavior change):
 * `parseJSON` + `repairTruncatedJSON` lived in `ai-provider.ts`, which
 * since BLOG-PROVIDER-FAILOVER (2026-10-16) statically imports
 * `ai-provider-cooldown.ts` → `node:fs/os/path` (the cooldown state file
 * — server-only by design). Two CLIENT-bundled libs (`ai-meal-planner`,
 * `ai-workout-planner` — their demo pages are "use client") import
 * `parseJSON` from `ai-provider`, so the client chunk graph gained a
 * `node:fs` external and `next build` (Turbopack) DIED on
 * /(ar)/ar/ai-meal-planner/page with «the chunking context does not
 * support external modules (request: node:fs)» — first surfaced at the
 * 2026-10-18 deploy (no full build had run since 2026-10-10 because the
 * Oct-16/17 GROQ-2 commits touched src/ under `[vercel skip]`).
 *
 * THE FIX: the two PURE functions moved here verbatim (same code, same
 * exported name). Client libs import from THIS leaf; `ai-provider.ts`
 * re-exports `parseJSON` from here so every server-side importer keeps
 * working unchanged. `node:*` stays out of every client chunk.
 */

/**
 * Parse a JSON response from any LLM. Handles:
 * - Plain JSON
 * - ```json fenced blocks
 * - JSON embedded inside surrounding prose (extracts the outermost {…} or […])
 * - Truncated JSON (auto-closes any open {/[/") — useful when the LLM hits
 * max_tokens mid-response and we want to salvage as much as possible.
 */
export function parseJSON<T = unknown>(text: string): T | null {
  if (!text) return null;
  let cleaned = text.trim();

  // Strip ```json … ``` or ``` … ``` fences.
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) cleaned = fence[1].trim();

  // Find the outermost {…} or […].
  const open = cleaned.search(/[{[]/);
  if (open === -1) return null;
  const openChar = cleaned[open];
  const closeChar = openChar === "{" ? "}" : "]";

  // First try strict parsing of the slice between the first opener and the
  // last closer — this is the happy path.
  const close = cleaned.lastIndexOf(closeChar);
  if (close !== -1 && close > open) {
    const slice = cleaned.slice(open, close + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {
      // fall through to truncation repair
    }
  }

  // Truncation repair: take everything from the first opener to the end of
  // the response, then balance the brackets/braces/quotes.
  const partial = cleaned.slice(open);
  let repaired = repairTruncatedJSON(partial);
  // Strip trailing commas inside objects/arrays: {"a":1,} → {"a":1}
  repaired = repaired.replace(/,\s*([\]}])/g, "$1");
  try {
    return JSON.parse(repaired) as T;
  } catch {
    return null;
  }
}

/**
 * Best-effort repair of truncated JSON. Closes open strings, objects, and
 * arrays. Doesn't handle every edge case (e.g. trailing commas after the
 * last complete value), but recovers most of the structured data.
 */
function repairTruncatedJSON(s: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  // PHASE 161.5 (2026-09-09, live runs 34358207261 + 34361832706): the
  // old closure-only repair could NOT fix raw control characters INSIDE
  // string values — a literal newline the model emitted in the markdown
  // field makes JSON.parse throw «Bad control character» even after every
  // bracket is closed, so article_generate failed permanently with
  // «JSON غير صالح» twice AFTER the 161.4 timeout fix. The scan now builds
  // the output incrementally and escapes control characters inside
  // strings (\n \r \t, others as \uXXXX) — turning the most common
  // soft-JSON-mode defect into a parseable document without discarding
  // any content. Outside strings the scan is byte-exact as before.
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      out += ch;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      out += ch;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString) {
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      if (ch === "\r") {
        out += "\\r";
        continue;
      }
      if (ch === "\t") {
        out += "\\t";
        continue;
      }
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        out += "\\u" + code.toString(16).padStart(4, "0");
        continue;
      }
      out += ch;
      continue;
    }
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") {
      // pop matching opener if present
      for (let j = stack.length - 1; j >= 0; j--) {
        const opener = stack[j];
        if ((ch === "}" && opener === "{") || (ch === "]" && opener === "[")) {
          stack.length = j;
          break;
        }
      }
    }
    out += ch;
  }
  if (inString) out += '"'; // close dangling string
  // Close remaining open structures in reverse order.
  for (let i = stack.length - 1; i >= 0; i--) {
    out += stack[i] === "{" ? "}" : "]";
  }
  return out;
}
