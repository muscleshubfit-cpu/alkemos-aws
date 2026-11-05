import type { Metadata } from "next";
import { ContactView } from "@/components/views/ContactView";

/**
 * FULL-SITE AUDIT FIX (2026-08-30): this page previously had no metadata
 * and INHERITED the root canonical (= homepage), telling Google it was a
 * duplicate of "/". Now it owns its identity (title/description/canonical).
 * Access-point fix (2026-09-14): /ar/contact now exists — reciprocal
 * hreflang pair added.
 */
export const metadata: Metadata = {
  title: "Contact Us — Support, Feedback & Partnerships | Alkemos",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 164 → 125 chars — the
    // ≤160 SERP-truncation law now holds (24-hour reply proof kept).
    "Reach the Alkemos team: support, account and payment questions, feedback, or partnerships — we usually reply within 24 hours.",
  alternates: {
    canonical: "/contact",
    languages: {
      en: "https://alkemos.com/contact",
      ar: "https://alkemos.com/ar/contact",
      "x-default": "https://alkemos.com/contact",
    },
  },
  // SEO/GEO audit (2026-09-28): no openGraph block here meant the ROOT
  // homepage og:title/og:description/og:url were inherited (Next.js
  // field-level merging) — social shares of /contact rendered the
  // homepage card text with og:url = "/". Mirrors the AR twin's explicit
  // block (src/app/(ar)/ar/contact/page.tsx).
  openGraph: {
    title: "Contact Us — Support, Feedback & Partnerships | Alkemos",
    description:
      "Reach the Alkemos team: technical support, account and payment questions, feedback, or partnership requests. We usually reply within 24 hours.",
    url: "https://alkemos.com/contact",
    type: "website",
    siteName: "Alkemos",
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
    images: ["/images/og/og-home-en.png?v=4"],
  },
};

export default function Page() {
 return <ContactView />;
}
