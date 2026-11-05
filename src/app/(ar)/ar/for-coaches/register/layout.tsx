import type { Metadata } from "next";

/**
 * AR MIRROR of /for-coaches/register — SEO layout.
 * Arabic-first metadata + reciprocal hreflang with the EN page
 * (src/app/for-coaches/register/layout.tsx). Indexed deliberately:
 * coaches searching «تسجيل مدرب alkemos» land straight on the form.
 */

const SITE_URL = "https://alkemos.com";

export const metadata: Metadata = {
  // SEO-GEO-4: the intermediate /ar/for-coaches/layout.tsx title absorbs
  // the /ar template chain, so the brand is appended explicitly here
  // (live-verified: this deep layout receives NO template).
  title: "تسجيل مدرب — أنشئ حسابك المجاني | Alkemos",
  description:
    "سجّل كمدرب على Alkemos في دقيقة: تفعيل فوري بدون انتظار، أضف عملاءك وحدد أسعارك بنفسك واحصل منهم مباشرة — بدون أي نسبة من دخلك.",
  keywords: ["تسجيل مدرب", "إنشاء حساب مدرب", "انضم كمدرب"],
  alternates: {
    canonical: `${SITE_URL}/ar/for-coaches/register`,
    languages: {
      en: `${SITE_URL}/for-coaches/register`,
      ar: `${SITE_URL}/ar/for-coaches/register`,
      "x-default": `${SITE_URL}/for-coaches/register`,
    },
  },
  openGraph: {
    title: "تسجيل مدرب — Alkemos",
    description:
      "أنشئ حسابك كمدرب مجانًا — تفعيل فوري، عملاؤك بأسعارك، وأموالك بين يديك.",
    url: `${SITE_URL}/ar/for-coaches/register`,
    siteName: "Alkemos",
    locale: "ar_EG",
    type: "website",
    // Phase 216 (P2-1 — deep-audit confirmed-7): same replace-not-inherit
    // gap as the EN twin — the home card is pinned explicitly (the twitter
    // card was already summary_large_image but carried no image).
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=4 (SOCIAL-OG-4).
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "منصة Alkemos الرياضية الشاملة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
  robots: { index: true, follow: true },
};

export default function ArForCoachesRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
