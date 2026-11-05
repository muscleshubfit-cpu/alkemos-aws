import type { Metadata } from "next";
import { ContactView } from "@/components/views/ContactView";

const SITE_URL = "https://alkemos.com";

/**
 * Access-point fix (2026-09-14): /ar/contact — Arabic mirror of /contact.
 *
 * ContactView is a bilingual client page (URL-first Arabic under /ar/*),
 * so the Arabic contact form + support info render automatically. This
 * page adds the indexable URL + Arabic-first metadata + reciprocal
 * hreflang with the EN page. The «تواصل معنا» CTA on /ar/faq and the
 * shared footer's Contact link now resolve here instead of the EN URL.
 */
export const metadata: Metadata = {
  title: "تواصل معنا — الدعم والملاحظات والشراكات",
  description:
    "تواصل مع فريق Alkemos: الدعم الفني، أسئلة الحساب والدفع، الملاحظات، أو طلبات الشراكة. أرسل رسالتك وسنرد عليك عادة خلال 24 ساعة.",
  alternates: {
    canonical: `${SITE_URL}/ar/contact`,
    languages: {
      en: `${SITE_URL}/contact`,
      ar: `${SITE_URL}/ar/contact`,
      "x-default": `${SITE_URL}/contact`,
    },
  },
  openGraph: {
    title: "تواصل معنا — Alkemos",
    description:
      "الدعم الفني، أسئلة الحساب والدفع، الملاحظات، أو طلبات الشراكة — أرسل رسالتك وسنرد عليك.",
    url: `${SITE_URL}/ar/contact`,
    type: "website",
    locale: "ar_EG",
    // Phase 216 (P2-1 — deep-audit confirmed-7): same replace-not-inherit
    // gap as /ar/about — the home card is pinned explicitly.
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
};

export default function Page() {
  return <ContactView />;
}
