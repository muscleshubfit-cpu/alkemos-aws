import type { Metadata } from "next";
import { StaticPageView } from "@/components/views/StaticPageView";
import { fetchSiteContentOverrides } from "@/lib/site-content/server";

// SITE-CONTENT-281: admin-editable page copy — Supabase overrides fetched
// server-side (anon key + RLS public-read, migration 0094) and passed down;
// the code defaults in site-content/static-pages.ts are the eternal fallback.
// The SAME 300 s ISR window the blog article pages use: an admin save is
// live within ~5 minutes with ZERO deploys, and a failed fetch renders the
// defaults verbatim (the fallback law).
export const revalidate = 300;

const SITE_URL = "https://alkemos.com";

/**
 * Arabic mirror of /about.
 *
 * AR EXPANSION (2026-08-30): StaticPageView already contains the full
 * Arabic "عن المنصة" content — it renders Arabic whenever the URL is
 * under /ar/* (I18nProvider is URL-first since the homepage AR mirror
 * fix). This page gives that content its own indexable Arabic URL with
 * Arabic-first metadata + reciprocal hreflang with the EN page.
 *
 * No hreflang self-references and no inherited signals — the pair
 * (en→/about, ar→/ar/about, x-default→/about) is declared on BOTH sides.
 */
export const metadata: Metadata = {
  // SEO-GEO-4: no brand suffix in title — the /ar layout template appends
  // exactly one "— Alkemos" (the old string produced "… — Alkemos — Alkemos").
  title: "عن المنصة — من نحن، رؤيتنا ورسالتنا",
  // PHASE 189 (SEO-GEO-10, deep-audit P1-3): كانت 239 حرفًا — الميزانية
  // 160 للعربية (قانون أوصاف 178 مطبقًا على سطح تحويلي ثابت). هوية الصفحة
  // نفسها بجملة فصحى واحدة مكتملة المعنى داخل الميزانية.
  description:
    "تعرّف على منصة Alkemos: مكتبة تمارين، وقاعدة أطعمة، وأدوات مجانية، وبرامج وخطط جاهزة، ومدرّب ذكاء اصطناعي (EVO)، والتدريب الأونلاين — بالعربية والإنجليزية.",
  alternates: {
    canonical: `${SITE_URL}/ar/about`,
    languages: {
      en: `${SITE_URL}/about`,
      ar: `${SITE_URL}/ar/about`,
      "x-default": `${SITE_URL}/about`,
    },
  },
  openGraph: {
    title: "عن Alkemos — من نحن، رؤيتنا ورسالتنا",
    description:
      "منصة لياقة وتغذية متكاملة: تمارين وأطعمة وأدوات وبرامج ومدرّب ذكاء اصطناعي — بالعربية والإنجليزية.",
    url: `${SITE_URL}/ar/about`,
    type: "website",
    locale: "ar_EG",
    // Phase 216 (P2-1 — deep-audit confirmed-7): a child openGraph block
    // replaces the parent's in Next.js merging, so this page served NO
    // og:image while twitter:image was still inherited — pin the home
    // card explicitly (what /ar/layout.tsx intends for every AR page).
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=4 (SOCIAL-OG-4).
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos — منصة اللياقة والتغذية الذكية المتكاملة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
};

export default async function Page() {
  const content = await fetchSiteContentOverrides();
  return <StaticPageView page="about" content={content} />;
}
