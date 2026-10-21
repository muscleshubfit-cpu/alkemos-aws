import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachLandingContent } from "@/components/coach/CoachLandingContent";
import {
  fetchCoachLanding,
  fetchPublishedCoachSlugs,
  coachDisplayName,
  resolveLandingCopy,
} from "@/lib/coach-landing-server";

/**
 * MULTI-COACH PHASE 2B — PUBLIC coach landing page, EN CANONICAL mirror.
 * Owner answer 3 (2026-08-29): each coach has a private-to-promote
 * public page — it is NEVER in any menu; the coach shares the URL
 * himself. Reachable while logged-out (published pages only).
 *
 * BILINGUAL MIRROR LAW (site convention, same as the blog):
 *   EN canonical: /coaches/{slug}      ← this file
 *   AR mirror:    /ar/coaches/{slug}   ← src/app/ar/coaches/[slug]
 * The language follows the URL (server-rendered, never localStorage);
 * LanguageToggle navigates between the two mirrors. Coach content that
 * was only written in one language falls back across mirrors (see
 * resolveLandingCopy).
 *
 * Migration 0031 created coach_pages; migration 0032 added the EN
 * content columns. Unknown or unpublished slugs → proper 404.
 */

// VERCEL-USAGE-9 (2026-10-09): 300 → 86400 + generateStaticParams —
// the route measured ƒ (per-request SSR) on Vercel because in Next 16
// the revalidate export alone never engages ISR on a dynamic route
// without gSP. Coach landing copy changes rarely; a newly published or
// edited page appears via dynamicParams (on-demand render) or the 24h
// revalidate window — never a broken link.
// CACHE-POLICY-AUDIT 2026-10-22: the write paths now ALSO invalidate on
// demand — PUT /api/coach/landing (the coach's own save) and the admin
// review flip (PATCH /api/admin/coach-pages) fire revalidateCoachLanding
// (revalidatePath both mirrors + targeted CF edge purge), so an approved
// edit is live immediately instead of waiting out this 24h window + the
// CF edge_ttl=43200.
export const revalidate = 86400; // 24 hours — landing copy changes rarely
export const runtime = "nodejs";

// VERCEL-USAGE-9 (2026-10-09): prerender every published + approved
// coach landing at build time (fetchPublishedCoachSlugs mirrors the
// public fetch gates exactly). dynamicParams stays true, so a coach
// page published after a build renders on demand and ISR-caches from
// then on.
export async function generateStaticParams() {
  const slugs = await fetchPublishedCoachSlugs();
  return slugs.map((slug) => ({ slug }));
}

const SITE_URL = "https://alkemos.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchCoachLanding(slug);

  if (!data) {
    return {
      title: "Page not found — Alkemos",
      robots: { index: false, follow: false },
    };
  }

  const copy = resolveLandingCopy(data, "en");
  const name = coachDisplayName(data, "en");
  const title = `${name} — ${copy.headline || "Certified coach on Alkemos"}`;
  const description =
    copy.bio.slice(0, 160) || `Coaching subscriptions with ${name} on Alkemos`;

  return {
    title,
    description,
    // H3 (SEO audit 2026-09-07): robots.txt Disallow: /coach prefix-matches
    // /coaches/* but pages still emitted indexable metadata — the
    // "indexed, though blocked" limbo. Explicit noindex matches the
    // owner's robots.txt intent (public shareable links, not search).
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/coaches/${slug}`,
      languages: {
        en: `${SITE_URL}/coaches/${slug}`,
        ar: `${SITE_URL}/ar/coaches/${slug}`,
        "x-default": `${SITE_URL}/coaches/${slug}`,
      },
    },
    openGraph: {
      type: "profile",
      url: `${SITE_URL}/coaches/${slug}`,
      title,
      description,
      siteName: "Alkemos",
      locale: "en_US",
      // D-02 (Phase 218, owner deferred-item reopened 2026-09-17): the page
      // is noindex, but coaches share these URLs DIRECTLY (WhatsApp/X
      // embeds) — and a child openGraph block REPLACES the root card in
      // Next.js metadata merging, so every share rendered cardless. Home
      // card pinned per the list-surface convention (Phase 206); guarded
      // in og-image-coverage.test.ts.
      images: [
        {
          url: "/images/og/og-home-en.png?v=3",
          width: 1200,
          height: 630,
          alt: "Alkemos — The Smart Fitness & Nutrition Platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/images/og/og-home-en.png?v=3"],
    },
  };
}

export default async function CoachLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchCoachLanding(slug);
  if (!data) notFound();

  return <CoachLandingContent data={data} lang="en" />;
}
