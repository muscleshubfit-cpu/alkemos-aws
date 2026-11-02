#!/usr/bin/env node
/**
 * Retroactive blog pairing — Proposal 3 (owner «نفذ المقترح ٣» 2026-09-09).
 *
 * Fills blog_posts.linked_post_id BIDIRECTIONALLY for the approved
 * translation pairs in scripts/retro-pair-blog.pairs.json — the exact
 * same semantic operation the Phase-157 P5 handshake performs for new
 * pairs, applied to the pre-157 library (29 EN + 34 AR posts).
 *
 * LAWS (mirror AGENTS §8 + p5-publish handshake):
 *   1. Both posts must exist with is_published=true and language en/ar.
 *   2. NEVER overwrite an existing linked_post_id that points elsewhere
 *      (skip loudly instead) — idempotent re-runs are safe no-ops.
 *   3. One post can only be paired once across the whole file (uniqueness
 *      validated before any write).
 *   4. hreflang/LanguageToggle only surface pairs when BOTH sides are
 *      published (sitemap C1 law) — enforced here by validation.
 *   5. Fail loudly (exit 1) on any missing/mismatched post; SKIPs are
 *      reported but do not fail the run.
 *
 * Usage:
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/retro-pair-blog.mjs
 *   DRY_RUN=1 … same → validate + report only, zero writes
 */

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const dryRun = process.env.DRY_RUN === "1";

if (!url || !key) {
  console.error("retro-pair: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(2);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function rest(path, method = "GET", body = undefined) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: { ...headers, ...(body ? {} : { Prefer: "return=representation" }) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${path}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

async function fetchPost(slug, language) {
  const rows = await rest(
    `/rest/v1/blog_posts?select=id,slug,language,is_published,linked_post_id&slug=eq.${encodeURIComponent(slug)}&language=eq.${language}`,
  );
  return rows[0] ?? null;
}

async function setLinked(id, linkedId) {
  if (dryRun) return;
  await fetch(`${url}/rest/v1/blog_posts?id=eq.${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ linked_post_id: linkedId }),
  }).then(async (res) => {
    if (!res.ok) throw new Error(`PATCH blog_posts/${id}: HTTP ${res.status} ${(await res.text()).slice(0, 160)}`);
  });
}

async function main() {
  const fs = await import("node:fs/promises");
  const { pairs } = JSON.parse(await fs.readFile(new URL("./retro-pair-blog.pairs.json", import.meta.url), "utf8"));
  console.log(`retro-pair: ${pairs.length} approved pairs · mode=${dryRun ? "DRY_RUN" : "APPLY"}\n`);

  // ---- pre-flight: resolve + validate every post BEFORE any write ----
  const seen = new Map(); // postId -> pair index (uniqueness law)
  const resolved = [];
  const failures = [];

  for (const [i, p] of pairs.entries()) {
    const en = await fetchPost(p.enSlug, "en");
    const ar = await fetchPost(p.arSlug, "ar");

    // per-pair failure flag (E21 fix, 2026-11-02): the old `if (failures.length)
    // continue` read the GLOBAL accumulator, so one dead-record pair silently
    // dropped every pair after it from resolution — a latent script defect
    // measured live when registering the home-program successor pair.
    let pairFailed = false;
    for (const [label, post] of [["en", en], ["ar", ar]]) {
      const slug = label === "en" ? p.enSlug : p.arSlug;
      if (!post) {
        failures.push(`pair ${i + 1}: ${label.toUpperCase()} post not found (slug=${slug})`);
        pairFailed = true;
      } else if (!post.is_published) {
        failures.push(`pair ${i + 1}: ${label.toUpperCase()} post not published (slug=${slug})`);
        pairFailed = true;
      }
    }
    if (pairFailed) continue;

    if (en.language !== "en" || ar.language !== "ar") {
      failures.push(`pair ${i + 1}: language mismatch (en.slug→${en.language}, ar.slug→${ar.language})`);
      continue;
    }
    if (en.id === ar.id) {
      failures.push(`pair ${i + 1}: both slugs resolve to the same row`);
      continue;
    }
    for (const post of [en, ar]) {
      const owner = seen.get(post.id);
      if (owner !== undefined && owner !== i) {
        failures.push(`pair ${i + 1}: post ${post.slug} already used by pair ${owner + 1} (uniqueness law)`);
      }
      seen.set(post.id, i);
    }
    resolved.push({ i, p, en, ar });
  }

  if (failures.length) {
    console.error("PRE-FLIGHT FAILURES:");
    for (const f of failures) console.error("  ✗ " + f);
    if (!dryRun) {
      console.error("\nretro-pair: aborting — zero writes performed (pre-flight law)");
      process.exit(1);
    }
  }

  // ---- apply (only pairs that passed pre-flight) ----
  let paired = 0;
  let already = 0;
  let skipped = 0;

  for (const { i, p, en, ar } of resolved) {
    const mineIsSet = en.linked_post_id != null;
    const twinIsSet = ar.linked_post_id != null;
    const correct = en.linked_post_id === ar.id && ar.linked_post_id === en.id;

    if (correct) {
      already++;
      console.log(`  = pair ${i + 1} already paired: ${en.slug} ↔ ${ar.slug}`);
      continue;
    }
    if ((mineIsSet && en.linked_post_id !== ar.id) || (twinIsSet && ar.linked_post_id !== en.id)) {
      skipped++;
      console.warn(`  ⚠ pair ${i + 1} SKIP (linked_post_id already points elsewhere: en→${en.linked_post_id}, ar→${ar.linked_post_id}): ${en.slug} ↔ ${ar.slug}`);
      continue;
    }

    // one side may legitimately be pre-filled with the correct twin
    await setLinked(en.id, ar.id);
    await setLinked(ar.id, en.id);
    paired++;
    console.log(`  ✓ pair ${i + 1} linked: ${en.slug} ↔ ${ar.slug}  (${p.topic})`);
  }

  // ---- post-verify (re-read every applied pair) ----
  let verified = 0;
  if (!dryRun && paired > 0) {
    for (const { i, p, en, ar } of resolved) {
      const reEn = await fetchPost(p.enSlug, "en");
      const reAr = await fetchPost(p.arSlug, "ar");
      if (reEn?.linked_post_id === reAr?.id && reAr?.linked_post_id === reEn?.id) verified++;
      else console.error(`  ✗ VERIFY FAILED pair ${i + 1}: ${p.enSlug} ↔ ${p.arSlug}`);
    }
  }

  console.log(`\nretro-pair summary: paired=${paired}${dryRun ? " (dry-run — nothing written)" : ` · verified=${verified}`} · already=${already} · skipped=${skipped} · failed=${failures.length}`);
  process.exit(failures.length > 0 && !dryRun ? 1 : 0);
}

main().catch((e) => {
  console.error("retro-pair: fatal:", e.message);
  process.exit(1);
});
