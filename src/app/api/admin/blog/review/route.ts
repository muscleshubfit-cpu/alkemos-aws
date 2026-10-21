import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { adminBlogReviewBodySchema } from "@/lib/validation/schemas";
import { revalidateBlogPost } from "@/lib/blog-cache-revalidate";

/**
 * POST /api/admin/blog/review — AUDIT_REPORT.md §9-المرحلة 2, item 1
 * (2026-09-29 · migration 0097): the OWNER REVIEW action.
 *
 * The audit (C2/F2) measured a fabricated E-E-A-T surface on every
 * published article — "Reviewed by Ahmed Zake" + "Last reviewed" = the
 * publish date — while P5 publishes with ZERO human review. The honest
 * workflow:
 *
 *   • P5 publishes every pipeline article with review_status='pending'
 *     (last_reviewed_at stays null — never set automatically).
 *   • The article page then shows the honest byline
 *     «AI-generated · medical review pending» and the Article schema
 *     OMITS reviewedBy/lastReviewed (seo.ts honest-review law).
 *   • THIS route is the review action: the owner (admin session —
 *     /admin/* is admin-exclusive, same law as every admin surface)
 *     reads the article and approves it → review_status='reviewed' +
 *     last_reviewed_at=now() → the byline/schema flip to the REAL
 *     review claims.
 *
 * Deliberately narrow (no unpublish/edit surface here — the editor is
 * the editor): one row, two columns, one timestamp. Idempotent: a
 * re-review re-approves and refreshes the timestamp (an honest re-read
 * — the latest review date is the truthful one).
 *
 * Body: { post_id: string, note?: string }
 *   → 200 { ok, post: { id, title, review_status, last_reviewed_at } }
 */
export const maxDuration = 20;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = adminBlogReviewBodySchema.safeParse(body);
  if (!parsed.success) {
    const postId = (body as { post_id?: unknown } | null)?.post_id;
    if (typeof postId !== "string" || !postId.trim()) {
      return NextResponse.json(
        { error: "post_id مطلوب (معرّف المقال المراد اعتماد مراجعته)" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const postId = parsed.data.post_id.trim();
  if (!UUID_RE.test(postId)) {
    return NextResponse.json(
      { error: "post_id غير صالح — يجب أن يكون UUID" },
      { status: 400 },
    );
  }

  // One atomic update: flip the state + stamp the REAL review date.
  // select() after update returns the row for the response echo.
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .update({ review_status: "reviewed", last_reviewed_at: new Date().toISOString() })
    .eq("id", postId)
    .select("id, title, language, slug, review_status, last_reviewed_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });
  }

  // BLOG-CACHE-REFRESH (2026-10-21 root-cause fix): the flip must also
  // REACH THE READER. Measured incident: the owner approved here and the
  // live page kept saying «AI-generated · medical review pending» for
  // hours — the row was updated but the three cache layers (unstable_cache
  // data 3600s → ISR 3600s → Cloudflare s-maxage 3600 + SWR 86400) had no
  // invalidation hook at all. Fail-soft BY DESIGN: the approval already
  // succeeded; a cache refresh failure is reported in the echo, never
  // fatal (docs/BLOG-CONTENT-CACHE-REFRESH-2026-10-21.md).
  let cacheRefresh: Awaited<ReturnType<typeof revalidateBlogPost>> | null =
    null;
  try {
    cacheRefresh = await revalidateBlogPost({
      slug: data.slug,
      language: data.language === "ar" ? "ar" : "en",
    });
  } catch {
    cacheRefresh = null;
  }

  return NextResponse.json({
    ok: true,
    post: data,
    ...(cacheRefresh ? { cache_refresh: cacheRefresh } : {}),
    ...(parsed.data.note ? { note: parsed.data.note } : {}),
  });
}
