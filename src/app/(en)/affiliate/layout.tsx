import type { Metadata } from "next";
// ORGANIC-GROWTH-P0-E (2026-11-19, roadmap 10 field 4: «FAQPage (4-6
// أسئلة…) + BreadcrumbList»): both language surfaces of /affiliate gain
// the FAQPage JSON-LD (from the SAME single source the page renders —
// src/lib/affiliate-faq.ts, the memberships-faq.ts precedent) + a
// BreadcrumbList with RELATIVE urls (getBreadcrumbSchema prefixes the
// site origin — the diet-plan convention; passing absolute urls doubles
// the origin, the live defect class documented in report 18 §6).
import { getFAQSchema, getBreadcrumbSchema, jsonLd } from "@/lib/seo";
import { AFFILIATE_FAQ } from "@/lib/affiliate-faq";

/**
 * Public Affiliate Program page SEO metadata.
 * Page itself is a client component (uses useI18n), so metadata must live
 * in a server-side layout.tsx — Next.js requirement.
 *
 * EN is the primary language (target: English-speaking audience); the
 * AR mirror has lived at /ar/affiliate since Phase 208 (§12.53 item 11)
 * with its own Arabic layout — this file is the EN half of the reciprocal
 * en/ar/x-default hreflang pair declared below.
 */
export const metadata: Metadata = {
  title: "Alkemos Affiliate Program — Turn Your Influence Into Income",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): the ≤160 SERP-truncation
    // law holds (156 chars).
    // ORGANIC-GROWTH-P0-E (2026-11-19, roadmap 10 field 4: «توحيد
    // 20%/$10 بالنسختين»): the EN description was the only half of the
    // pair deprived of the two strongest numbers (F-8 — the AR twin has
    // carried 20% + 10$ since Phase 208). The numbers join here, mirroring
    // the AR structure (platform-trust + 20% commission + $10 minimum) —
    // «النصان متطابقان رقميًا» (roadmap field 9).
    "Join the Alkemos Affiliate Program: share a platform you trust and earn a 20% commission on eligible purchases through your link, with a $10 minimum payout.",
  keywords: [
    "Alkemos affiliate program",
    "fitness affiliate program",
    "nutrition affiliate program",
    "earn commission fitness",
    "fitness influencer program",
    "personal trainer affiliate",
    "fitness blogger affiliate",
    "workout affiliate",
    "AI fitness coach affiliate",
    "sports affiliate program",
  ],
  openGraph: {
    title: "Alkemos Affiliate Program — Turn Your Influence Into Income",
    description:
      "Share Alkemos with people who trust your recommendations and earn commissions from eligible purchases.",
    type: "website",
    url: "https://alkemos.com/affiliate",
    siteName: "Alkemos",
    // Discovery 208 (§12.56), executed as Phase 209 (owner order
    // 2026-09-16): this layout's own openGraph block REPLACES the root
    // one in Next.js metadata merging, so the surface served no social
    // card at all — the exact §12.53 item 4 defect family fixed for the
    // 9 EN list surfaces in 206 (/affiliate wasn't on that audit list)
    // and for the AR mirror in 208. og-home-en pinned per the same law;
    // og:locale was missing too (og:url was already present).
    locale: "en_US",
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=4 (SOCIAL-OG-4).
        url: "/images/og/og-home-en.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos — The Smart Fitness & Nutrition Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alkemos Affiliate Program — Turn Your Influence Into Income",
    description:
      "Share Alkemos with people who trust your recommendations and earn commissions from eligible purchases.",
    images: ["/images/og/og-home-en.png?v=4"],
  },
  alternates: {
    canonical: "https://alkemos.com/affiliate",
    // SEO audit H2 fix (2026-09-07): was en-US/ar-EG (self-pointing, no
    // x-default) while the whole site cluster uses en/ar + x-default —
    // mixed hreflang codes in one cluster break Google's reciprocal
    // validation. Normalized to the site-wide code pair.
    languages: {
      "en": "https://alkemos.com/affiliate",
      "ar": "https://alkemos.com/ar/affiliate",
      "x-default": "https://alkemos.com/affiliate",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

const faqSchema = getFAQSchema(AFFILIATE_FAQ.en);
const breadcrumbSchema = getBreadcrumbSchema([
  { name: "Home", url: "/" },
  { name: "Affiliate Program", url: "/affiliate" },
]);

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* ORGANIC-GROWTH-P0-E: FAQPage JSON-LD — GEO-only value (Google
          retired FAQ rich results May 2026; AI answer engines still parse
          JSON-LD from the server HTML — the repo's documented decision,
          same as coaching-faq.ts/memberships-faq.ts). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
