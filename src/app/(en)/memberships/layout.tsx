import { jsonLd, getFAQSchema } from "@/lib/seo";
import type { Metadata } from "next";
import { Resources } from "@/components/hub-head-resources";
// BILINGUAL-CONTENT Phase 2 (owner order 2026-11-04, audit §3 item 3):
// the memberships FAQ becomes machine-readable — the same single-source
// array that renders the page (src/lib/memberships-faq.ts) is emitted
// here as FAQPage JSON-LD, the coaching-faq.ts precedent (CONTENT-AUDIT
// P1-2). GEO-only value: Google retired FAQ rich results (May 2026) but
// AI answer engines parse JSON-LD from the server HTML.
import { MEMBERSHIPS_FAQ } from "@/lib/memberships-faq";

export const metadata: Metadata = {
  title: "Memberships — Premium & Pro Plans | Alkemos",
  // PHASE 189 (SEO-GEO-10, deep-audit P1-3): was 183 chars — inside the
  // 158 EN budget. Prices match src/lib/memberships.ts exactly (the
  // single source of truth for pricing).
  description:
    // P3-10/م6 (Phase 217): the EN description now lists ALL four tiers —
    // it dropped Coaching while the AR twin lists it. Monthly prices only
    // (mirrors the AR twin; still inside the 158-char EN budget).
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 169 → 128 chars — all
    // four tiers + prices kept, inside the ≤160 SERP-truncation law.
    "Compare Alkemos plans: Free forever, Premium $14.99/mo, Pro $29.99/mo, Coaching $39.99/mo (human coach) — full limits published.",
  keywords: [
    "membership",
    "premium",
    "pro",
    "subscription",
    "fitness membership",
    "AI fitness coach",
    "meal planner",
    "workout plans",
  ],
  openGraph: {
    title: "Alkemos Memberships — Premium & Pro Plans",
    description:
      "Every price and usage limit in plain view: plan generations, swaps, saves, and what each tier adds.",
    type: "website",
    // BILINGUAL-CONTENT Phase 2 (audit gap #6 — live-verified missing):
    // a child openGraph block REPLACES the root one (Next.js merging),
    // so og:site_name was silently dropped on this surface. Pinned here
    // like the AR mirror already does (siteName: "Alkemos").
    siteName: "Alkemos",
    // §12.53 item 4 (2026-09-15): og:image + og:url + og:locale were all
    // absent — a child openGraph block REPLACES the root one (Next.js
    // merging), so the surface showed no card and no canonical og:url.
    // Same-family home card, matching the AR mirror's og-home-ar
    // inheritance.
    locale: "en_US",
    url: "https://alkemos.com/memberships",
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=3.
        url: "/images/og/og-memberships-en.png?v=3",
        width: 1200,
        height: 630,
        alt: "Alkemos — The Smart Fitness & Nutrition Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-memberships-en.png?v=3"],
  },
  alternates: {
    canonical: "https://alkemos.com/memberships",
    // Homepage AR mirror follow-up (2026-08-30): declare the Arabic mirror
    // (src/app/ar/memberships/page.tsx declares the reciprocal pair).
    languages: {
      en: "https://alkemos.com/memberships",
      ar: "https://alkemos.com/ar/memberships",
      "x-default": "https://alkemos.com/memberships",
    },
  },
};

export default function MembershipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // BILINGUAL-CONTENT Phase 2 (audit gap #2): FAQPage JSON-LD from the
  // same single source the page renders — the seven questions/answers
  // become machine-readable for AI answer engines in the server HTML.
  const membershipsFaqSchema = getFAQSchema(MEMBERSHIPS_FAQ.en);

  // GEO (2026-08-30): OfferCatalog with the storefront prices (source of
  // truth: src/lib/memberships.ts MEMBERSHIPS — matches what the page
  // displays). Machine-readable pricing for Google rich results and AI
  // answer engines ("how much is alkemos premium?").
  const offerCatalogSchema = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Alkemos Membership Plans",
    url: "https://alkemos.com/memberships",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Free",
        description: "The full product, free forever: libraries, 8 tools, EVO chat (10 messages/day), and 2 AI plan generations per month.",
        price: "0",
        priceCurrency: "USD",
        url: "https://alkemos.com/memberships",
      },
      {
        "@type": "Offer",
        name: "Premium",
        description:
          "Manage your plans: unlimited EVO chat, 4 AI plan generations/month, 3 swaps/week, export and sync. $14.99/month or $119/year.",
        price: "14.99",
        priceCurrency: "USD",
        url: "https://alkemos.com/memberships",
      },
      {
        "@type": "Offer",
        name: "Pro",
        description:
          "Adapt & optimize: 8 AI plan generations/month, 6 meal/exercise swaps per week, no ads. $29.99/month or $239/year.",
        price: "29.99",
        priceCurrency: "USD",
        url: "https://alkemos.com/memberships",
      },
      {
        "@type": "Offer",
        name: "Coaching",
        description:
          "Human coaching: plans from a real coach, weekly check-ins, manual swaps, priority support + all Pro benefits. $39.99/month or $359/year.",
        price: "39.99",
        priceCurrency: "USD",
        url: "https://alkemos.com/coaching",
      },
    ],
  };

  return (
    <>
      <Resources banner="pricing" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(offerCatalogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(membershipsFaqSchema) }}
      />
      {children}
    </>
  );
}
