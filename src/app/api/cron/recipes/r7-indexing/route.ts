import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  getRecipeQueueIdParam,
  fetchRecipeQueueItem,
} from "@/lib/recipes-queue";

export const maxDuration = 60;

/**
 * RECIPES PIPELINE · R7 — the indexing handoff (plan §6.2).
 *
 * Submits BOTH mirror URLs of the fresh pair to IndexNow (the API the
 * daily indexnow-submit workflow already uses — same key file under
 * public/, same documented JSON shape). The sitemap side needs no
 * action: sitemap-recipes.xml is generated LIVE from the database with
 * an honest lastmod, so the new pair is in it on the next crawl.
 *
 * Failures are WARNINGS, never holds (plan: «تحذير غير حاجز») — the
 * pages are published and crawled regardless via the sitemap.
 *
 * GET /api/cron/recipes/r7-indexing?queueId=<uuid>
 */
const SITE_URL = "https://alkemos.com";

async function readIndexNowKey(): Promise<string | null> {
  try {
    const { readFile, readdir } = await import("node:fs/promises");
    const path = await import("node:path");
    const pubDir = path.join(process.cwd(), "public");
    for (const f of await readdir(pubDir)) {
      if (/^[0-9a-f]{16,64}\.txt$/i.test(f)) {
        const content = (await readFile(`${pubDir}/${f}`, "utf8")).trim();
        const key = f.replace(/\.txt$/i, "");
        if (content === key) return key;
      }
    }
  } catch {
    /* no key file — a warning, not a failure */
  }
  return null;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queueId = getRecipeQueueIdParam(request);
  if (!queueId) return NextResponse.json({ error: "Missing queueId query parameter" }, { status: 400 });

  try {
    const { data: qi, error: fetchErr } = await fetchRecipeQueueItem(queueId);
    if (fetchErr) throw new Error(fetchErr);
    if (!qi || !qi.recipe_id) {
      return NextResponse.json({ ok: true, step: "r7", queueId, skipped: true, reason: "nothing_to_index" });
    }
    const recipeId: string = qi.recipe_id;

    // The pair's slug from the version rows (ONE latin slug per pair).
    const { supabaseAdmin } = await import("@/lib/supabase/admin");
    const slug = await (async () => {
      if (!supabaseAdmin) return null;
      const { data } = await supabaseAdmin
        .from("recipe_versions")
        .select("slug")
        .eq("recipe_id", recipeId)
        .eq("language", "en")
        .maybeSingle();
      return data ? (data as { slug: string }).slug : null;
    })();
    if (!slug) {
      return NextResponse.json({ ok: true, step: "r7", queueId, skipped: true, reason: "no_slug" });
    }

    const key = await readIndexNowKey();
    if (!key) {
      console.warn("[recipes/r7] no IndexNow key file found — sitemap crawl covers the pair");
      return NextResponse.json({ ok: true, step: "r7", queueId, submitted: false, reason: "no_key_file" });
    }

    const urls = [`${SITE_URL}/recipes/${slug}`, `${SITE_URL}/ar/recipes/${slug}`];
    let submitted = false;
    let status = 0;
    try {
      const res = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: new URL(SITE_URL).host,
          key,
          keyLocation: `${SITE_URL}/${key}.txt`,
          urlList: urls,
        }),
      });
      status = res.status;
      submitted = res.ok || res.status === 202;
      if (!submitted) console.warn(`[recipes/r7] IndexNow HTTP ${status} — warning only (non-blocking)`);
    } catch (err) {
      console.warn(`[recipes/r7] IndexNow submit failed: ${err instanceof Error ? err.message : err} — warning only`);
    }

    return NextResponse.json({ ok: true, step: "r7", queueId, submitted, status, urls });
  } catch (err) {
    // R7 failures are NEVER holds — the pair is published and sitemap-covered.
    console.warn("[recipes/r7] warning:", err);
    return NextResponse.json({ ok: true, step: "r7", queueId, submitted: false, warning: err instanceof Error ? err.message : "unknown" });
  }
}
