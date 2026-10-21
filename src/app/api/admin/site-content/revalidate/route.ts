import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import { revalidateSiteContent } from "@/lib/site-content/revalidate";

/**
 * POST /api/admin/site-content/revalidate — CACHE-POLICY-AUDIT
 * 2026-10-22 (the site-content twin of /api/admin/blog/revalidate).
 *
 * The cache-refresh action for the site-content override map:
 * invalidates the Next.js data-cache tag (site-content), the ISR caches
 * of every consuming page (home/about/faq/terms/privacy × EN/AR), and
 * (env-gated, fail-soft) purges the Cloudflare edge copy of those URLs.
 *
 * WHY A SEPARATE ROUTE: the /admin/site-content editor saves DIRECTLY
 * from the browser to Supabase (adminUpsertSiteContent — there is no
 * server write route to hook), so the client needs a server-side
 * invalidation endpoint to call after a successful save/reset. It is
 * also the manual lever for direct Supabase dashboard edits.
 *
 * Deliberately narrow: NO write to the DB (a pure cache action),
 * admin-gated exactly like every /admin/* surface, and never fatal on
 * a cache failure (the outcome is reported honestly in the echo).
 * No body is expected — the affected paths are static and complete.
 *
 *   → 200 { ok, refreshed }
 */
export const maxDuration = 20;

export async function POST(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  // A body is not part of the contract — drain it defensively so a
  // stray client payload can never wedge the connection, then ignore it.
  await request.json().catch(() => null);

  // The helper is never-throwing by contract; failures ride the outcome.
  const refreshed = await revalidateSiteContent();

  return NextResponse.json({ ok: true, refreshed });
}
