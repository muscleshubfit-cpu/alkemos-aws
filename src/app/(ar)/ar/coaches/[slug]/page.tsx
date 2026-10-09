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
 * MULTI-COACH PHASE 2B — PUBLIC coach landing page, AR MIRROR.
 * Owner answer 3 (2026-08-29): each coach has a private-to-promote
 * public page — it is NEVER in any menu; the coach shares the URL
 * himself. Reachable while logged-out (published pages only).
 *
 * BILINGUAL MIRROR LAW (site convention, same as /ar/blog/[slug]):
 *   EN canonical: /coaches/{slug}
 *   AR mirror:    /ar/coaches/{slug}   ← this file
 * Root layout + middleware already serve `lang="ar" dir="rtl"` for
 * /ar/* via the x-pathname header; this page renders Arabic chrome and
 * resolves coach content with the cross-language fallback (AR copy, or
 * EN copy when the coach only wrote English). Unknown or unpublished
 * slugs → proper 404.
 */

// VERCEL-USAGE-9 (2026-10-09): 300 → 86400 + generateStaticParams —
// mirrors the EN fix: the route measured ƒ (per-request SSR) on Vercel
// because in Next 16 the revalidate export alone never engages ISR on a
// dynamic route without gSP. See the EN mirror for the full rationale.
export const revalidate = 86400; // 24 hours — landing copy changes rarely
export const runtime = "nodejs";

// VERCEL-USAGE-9 (2026-10-09): prerender every published + approved
// coach landing at build time (same law as the EN mirror —
// dynamicParams stays true so newly published pages render on demand).
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
      title: "الصفحة غير موجودة — Alkemos",
      robots: { index: false, follow: false },
    };
  }

  const copy = resolveLandingCopy(data, "ar");
  const name = coachDisplayName(data, "ar");
  const title = `${name} — ${copy.headline || "مدرب معتمد على Alkemos"}`;
  const description =
    copy.bio.slice(0, 160) || `اشترك في متابعة خاصة مع ${name} على Alkemos`;

  return {
    title,
    description,
    // H3 (SEO audit 2026-09-07): explicit noindex — matches the owner's
    // robots.txt Disallow: /coach intent (public share links, not search).
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/ar/coaches/${slug}`,
      languages: {
        en: `${SITE_URL}/coaches/${slug}`,
        ar: `${SITE_URL}/ar/coaches/${slug}`,
        "x-default": `${SITE_URL}/coaches/${slug}`,
      },
    },
    openGraph: {
      type: "profile",
      url: `${SITE_URL}/ar/coaches/${slug}`,
      title,
      description,
      siteName: "Alkemos",
      locale: "ar_EG",
      // D-02 (Phase 218, owner deferred-item reopened 2026-09-17): AR half
      // of the coach-landing pair — same replace-not-inherit gap as the EN
      // twin (a child openGraph block discards the /ar/layout.tsx card).
      // og-home-ar pinned per the AR convention; guarded in
      // og-image-coverage.test.ts.
      images: [
        {
          url: "/images/og/og-home-ar.png?v=3",
          width: 1200,
          height: 630,
          alt: "منصة Alkemos الرياضية الشاملة",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/images/og/og-home-ar.png?v=3"],
    },
  };
}

export default async function CoachLandingPageAr({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchCoachLanding(slug);
  if (!data) notFound();

  return <CoachLandingContent data={data} lang="ar" />;
}
