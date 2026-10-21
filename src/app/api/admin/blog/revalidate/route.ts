import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { adminBlogRevalidateBodySchema } from "@/lib/validation/schemas";
import { revalidateBlogPost } from "@/lib/blog-cache-revalidate";

/**
 * POST /api/admin/blog/revalidate — BLOG-CACHE-REFRESH (2026-10-21).
 *
 * The cache-refresh action for ONE blog post: invalidates the Next.js
 * data-cache tags (blog-og / blog-full / blog-slug-pools), the ISR
 * caches of the article + its listing + its RSS + the blog sitemap, and
 * (env-gated, fail-soft) purges the Cloudflare edge copy of those URLs.
 * Full story: docs/BLOG-CONTENT-CACHE-REFRESH-2026-10-21.md.
 *
 * WHY A SEPARATE ROUTE: the blog editor saves DIRECTLY from the browser
 * to Supabase (adminUpdatePost — there is no server write route to hook),
 * so the client needs a server-side invalidation endpoint to call after
 * a successful save. It is also the manual lever for direct Supabase
 * dashboard edits (no app hook fires there at all).
 *
 * Deliberately narrow: NO write to the DB (a pure cache action — the
 * row was already updated by whoever calls this), admin-gated exactly
 * like every /admin/* surface, and never fatal on a cache failure (the
 * outcome is reported honestly in the echo).
 *
 * Body: { post_id } (row re-read for slug+language)
 *    or { slug, language } (no DB read at all)
 *   → 200 { ok, slug, language, refreshed }
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
  const parsed = adminBlogRevalidateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  let slug: string;
  let language: "en" | "ar";

  if (parsed.data.post_id) {
    const postId = parsed.data.post_id.trim();
    if (!UUID_RE.test(postId)) {
      return NextResponse.json(
        { error: "post_id غير صالح — يجب أن يكون UUID" },
        { status: 400 },
      );
    }
    // Read-only row lookup — this route never writes.
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("slug, language")
      .eq("id", postId)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });
    }
    slug = data.slug;
    language = data.language === "ar" ? "ar" : "en";
  } else {
    // Shape two: slug + language ride the body directly (manual lever).
    slug = (parsed.data.slug ?? "").trim();
    language = parsed.data.language === "ar" ? "ar" : "en";
  }

  // The helper is never-throwing by contract; failures ride the outcome.
  const refreshed = await revalidateBlogPost({ slug, language });

  return NextResponse.json({ ok: true, slug, language, refreshed });
}
