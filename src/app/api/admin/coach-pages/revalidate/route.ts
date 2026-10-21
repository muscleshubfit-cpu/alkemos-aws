import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import { adminCoachPagesRevalidateBodySchema } from "@/lib/validation/schemas";
import { revalidateCoachLanding } from "@/lib/coach-landing-revalidate";

/**
 * POST /api/admin/coach-pages/revalidate — CACHE-POLICY-AUDIT 2026-10-22
 * (the coach-landing twin of /api/admin/blog/revalidate).
 *
 * The cache-refresh action for ONE coach landing: invalidates the ISR
 * caches of both language mirrors (/coaches/<slug> + /ar/coaches/<slug>,
 * revalidate=86400) and (env-gated, fail-soft) purges the Cloudflare
 * edge copies (edge_ttl=43200 — measured live 2026-10-22).
 *
 * WHY A SEPARATE ROUTE: the /admin/coach-pages review surface (the
 * approve/reject buttons) writes DIRECTLY from the browser to Supabase
 * (the view's own supabase.update — there is no server write route to
 * hook), so the client needs a server-side invalidation endpoint to
 * call after a successful review action. It is also the manual lever
 * after direct Supabase dashboard edits.
 *
 * Deliberately narrow: NO write to the DB (a pure cache action — the
 * row was already updated by whoever calls this), admin-gated exactly
 * like every /admin/* surface, and never fatal on a cache failure (the
 * outcome is reported honestly in the echo).
 *
 * Body: { slug }
 *   → 200 { ok, slug, refreshed }
 */
export const maxDuration = 20;

export async function POST(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = adminCoachPagesRevalidateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  // The helper is never-throwing by contract; failures ride the outcome.
  const refreshed = await revalidateCoachLanding(parsed.data.slug);

  // A bad slug shape (after the zod gate, e.g. a defensive future drift)
  // reports honestly instead of pretending success.
  if (!refreshed.ok && refreshed.invalidated.paths.length === 0) {
    return NextResponse.json(
      { error: refreshed.error ?? "invalid slug", slug: parsed.data.slug },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, slug: refreshed.slug, refreshed });
}
