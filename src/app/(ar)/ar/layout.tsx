import type { Metadata } from "next";

/**
 * Arabic nested layout.
 *
 * Provides Arabic-specific SEO metadata for all /ar/* routes:
 *   - Arabic title + description for search engines
 *   - og:locale = ar_EG for social sharing
 *   - hreflang alternates pointing to EN + AR versions
 *
 * The root `<html lang dir>` attributes are set by `src/app/layout.tsx`
 * via `resolveLocale()` reading the `x-pathname` header from middleware.
 *
 * The `<div dir="rtl" lang="ar">` wrapper is RETAINED as a defensive
 * safety net for deeply-nested components / third-party libraries.
 */

export const metadata: Metadata = {
  title: {
    default: "Alkemos | منصة اللياقة والتغذية الذكية المتكاملة",
    template: "%s — Alkemos",
  },
  // Content-strategy v1 (2026-09-20): canonical AR positioning line
  // «تدرّب بذكاء، وتغذَّ بدقة، وتقدّم والأرقام في صفك» — mirrors the hero
  // H1 — followed by the concrete proof numbers instead of repeating the
  // category label (the title already carries it). The three copies in
  // this file stay identical (this file's established pattern).
  // SEO-P2-10 (2026-10-01, SEO audit item 10): 195 → 157 chars — the ≤160
  // SERP-truncation law now holds; all three proof numbers kept (868+/8,830+/8).
  // BILINGUAL-CONTENT Phase 2 (audit gap #5): tanween orthography unified
  // to «تمرينًا/صنفًا» (the correct modern rendering) — the three copies
  // below previously wrote «تمريناً/صنفاً» (old style), inconsistent with
  // the /ar homepage's OWN OG card which already writes «تمرينًا/صنفًا».
  description:
    "تدرّب بذكاء، وتغذَّ بدقة، وتقدّم والأرقام في صفك — منصتك المتكاملة للتمارين والتغذية: 868+ تمرينًا، و8,830+ صنفًا غذائيًا، و8 أدوات مجانية، ومدربك الذكي EVO.",
  openGraph: {
    title: "Alkemos | منصة اللياقة والتغذية الذكية المتكاملة",
    description:
      "تدرّب بذكاء، وتغذَّ بدقة، وتقدّم والأرقام في صفك — منصتك المتكاملة للتمارين والتغذية: 868+ تمرينًا، و8,830+ صنفًا غذائيًا، و8 أدوات مجانية، ومدربك الذكي EVO.",
    siteName: "Alkemos",
    locale: "ar_EG",
    type: "website",
    // PHASE 187 (deep-audit P0-2): og:image for the AR root — the EN root
    // had one via metadata.ts (/logo.png) but the AR layout declared its
    // own openGraph without images, so every AR page without its own
    // block shared NO social card. Static branded home card (mirrors
    // /api/og-image design).
    images: [
      {
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos — منصة اللياقة والتغذية الذكية المتكاملة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alkemos | منصة اللياقة والتغذية الذكية المتكاملة",
    description:
      "تدرّب بذكاء، وتغذَّ بدقة، وتقدّم والأرقام في صفك — منصتك المتكاملة للتمارين والتغذية: 868+ تمرينًا، و8,830+ صنفًا غذائيًا، و8 أدوات مجانية، ومدربك الذكي EVO.",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
  // NOTE: NO `alternates` here (homepage AR mirror follow-up, 2026-08-30).
  // Next.js metadata inheritance is field-level: an `alternates` block in
  // this nested layout is inherited verbatim by EVERY /ar/* child page,
  // which made /ar/blog, /ar/exercises, /ar/foods and /ar/memberships
  // declare the HOMEPAGE canonical + hreflang (telling Google they are
  // duplicates of /ar). Each Arabic page now declares its own canonical +
  // languages in its own `metadata` export (see the pages' files), same
  // pattern as `src/app/ar/coaches/[slug]/page.tsx`.
};

export default function ArLayout({ children }: { children: React.ReactNode }) {
  return <div dir="rtl" lang="ar">{children}</div>;
}
