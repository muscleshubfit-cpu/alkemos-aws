import type { Metadata } from "next";

/**
 * COACH REGISTRATION — SEO layout for /for-coaches/register.
 * EN CANONICAL of the twin pair (2026-08-30 — mirrors /ar/about & /ar/faq):
 *   EN canonical: /for-coaches/register      ← this layout (EN-first)
 *   AR mirror:    /ar/for-coaches/register   (Arabic-first)
 * Indexed deliberately: coaches searching "register as a coach" land
 * straight on the form (the /auth block in robots.txt does NOT apply —
 * this is a public recruitment surface, owner-approved).
 */

const SITE = "https://alkemos.com";
const PAGE_URL = `${SITE}/for-coaches/register`;

export const metadata: Metadata = {
  title: "Coach registration — create your free Alkemos account",
  description:
    "Register as a coach on Alkemos in one minute: instant activation, add your clients, set your own prices and collect directly — zero commission from your income.",
  keywords: [
    "coach sign up",
    "register as a coach",
    "online coaching platform",
    "Alkemos coach",
  ],
  alternates: {
    canonical: PAGE_URL,
    languages: {
      en: PAGE_URL,
      ar: `${SITE}/ar/for-coaches/register`,
      "x-default": PAGE_URL,
    },
  },
  openGraph: {
    title: "Coach registration — Alkemos",
    description:
      "Create your free coach account — instant activation, your clients at your prices, your money in your hands.",
    url: PAGE_URL,
    siteName: "Alkemos",
    locale: "en_US",
    type: "website",
    // Phase 216 (P2-1 — deep-audit confirmed-7): a child openGraph block
    // replaces the root one in Next.js merging, so this surface served NO
    // og:image; the twitter card was "summary" (ignores images) — the
    // home card is pinned + the card upgraded to summary_large_image.
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
  robots: { index: true, follow: true },
};

export default function CoachRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
