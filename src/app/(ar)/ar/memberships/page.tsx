import type { Metadata } from "next";
import MembershipsPage from "@/app/(en)/memberships/page";
import { jsonLd, getFAQSchema } from "@/lib/seo";
import { MEMBERSHIPS, type MembershipTier } from "@/lib/memberships";
// BILINGUAL-CONTENT Phase 2 (owner order 2026-11-04, audit §3 item 4): the
// memberships FAQ renders from the single source src/lib/memberships-faq.ts
// and is emitted here as Arabic FAQPage JSON-LD — the coaching-faq.ts
// precedent (GEO-only value: AI answer engines parse JSON-LD in the server
// HTML).
import { MEMBERSHIPS_FAQ } from "@/lib/memberships-faq";

const SITE_URL = "https://alkemos.com";

/**
 * Arabic mirror of /memberships.
 *
 * Passes `lang="ar"` to force Arabic rendering, regardless of the user's
 * localStorage language preference. This matches the established pattern
 * used by `/ar/blog/page.tsx` → `<BlogListPage lang="ar" />`,
 * `/ar/exercises/page.tsx`, and `/ar/foods/page.tsx`.
 *
 * The page is wrapped by `src/app/ar/layout.tsx`'s `<div dir="rtl" lang="ar">`
 * for proper RTL rendering, and by `src/middleware.ts`'s `Content-Language:
 * ar-EG` header for crawler language attribution.
 *
 * Homepage AR mirror follow-up (2026-08-30): own title + canonical +
 * hreflang so Google indexes THIS url (the ar/layout alternates block was
 * removed — it leaked the homepage signals onto every /ar/* child).
 *
 * BILINGUAL-CONTENT Phase 2 (audit gaps #1 + #2, owner-approved title):
 *   - Title: «عضويات Alkemos — الأسعار والباقات والفروق» (owner wording,
 *     ≈41 chars — carries the prices/comparison keywords the old 27-char
 *     title wasted). It contains the brand, so it is pinned with
 *     `absolute` — the /ar layout template would otherwise append a second
 *     « — Alkemos» (the anti-double-brand law, P0-3's class).
 *   - OfferCatalog (AR): the EN twin serves one but /ar/memberships served
 *     none — Arabic answer engines could not read the prices. Same
 *     structure as the EN layout block, Arabic names/descriptions, prices
 *     DERIVED from memberships.ts (never literals — they can never drift).
 *   - FAQPage (AR): from the same single source the page renders.
 */
export const metadata: Metadata = {
  title: {
    absolute: "عضويات Alkemos — الأسعار والباقات والفروق",
  },
  description:
    "قارن باقات Alkemos: مجاني للأبد، بريميوم $14.99/شهر، برو $29.99/شهر، والتدريب الأونلاين مع مدرب خاص $39.99/شهر — كل الحدود منشورة بشفافية، والإلغاء في أي وقت.",
  alternates: {
    canonical: "/ar/memberships",
    languages: {
      en: `${SITE_URL}/memberships`,
      ar: `${SITE_URL}/ar/memberships`,
      "x-default": `${SITE_URL}/memberships`,
    },
  },
  // SEO/GEO audit (2026-09-28): the EN twin pins an explicit OG block
  // ((en)/memberships/layout.tsx — same-family home card), but this page
  // had none — Next.js field-level inheritance served the AR ROOT
  // HOMEPAGE og:title/og:description on /ar/memberships. Pins the AR home
  // card — the mirror of the EN block.
  openGraph: {
    title: "عضويات Alkemos — بريميوم وبرو",
    description:
      "كل الأسعار والحدود بوضوح: توليد الخطط الذكية، التبديلات، الحفظ، وما تضيفه كل باقة.",
    type: "website",
    locale: "ar_EG",
    url: `${SITE_URL}/ar/memberships`,
    siteName: "Alkemos",
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

// BILINGUAL-CONTENT Phase 2 (audit gap #2): FAQPage JSON-LD from the same
// single source the page renders.
const membershipsFaqSchema = getFAQSchema(MEMBERSHIPS_FAQ.ar);

// BILINGUAL-CONTENT Phase 2 (audit gap #1): OfferCatalog in ARABIC — the
// mirror of the EN layout's block. Every price DERIVES from
// src/lib/memberships.ts (the single source of truth — no literals, so a
// price change there flows here automatically); descriptions state only
// documented limits from the same file.
const tierPrice = (id: MembershipTier) =>
  MEMBERSHIPS.find((m) => m.id === id)!.priceMonthly!.toFixed(2);
const tierName = (id: MembershipTier) =>
  MEMBERSHIPS.find((m) => m.id === id)!.nameAr;

const offerCatalogSchema = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: "باقات عضوية Alkemos",
  url: `${SITE_URL}/ar/memberships`,
  itemListElement: [
    {
      "@type": "Offer",
      name: tierName("free"),
      description:
        "المنتج كاملًا ومجاني للأبد: المكتبات، والأدوات، ومحادثة EVO (10 رسائل يوميًا)، وتوليد خطتين بالذكاء الاصطناعي شهريًا.",
      price: tierPrice("free"),
      priceCurrency: "USD",
      url: `${SITE_URL}/ar/memberships`,
    },
    {
      "@type": "Offer",
      name: tierName("premium"),
      description:
        "أدر خططك: محادثة EVO بلا حدود، و4 خطط ذكاء اصطناعي شهريًا، و3 تبديلات أسبوعية، مع التصدير والمزامنة. $14.99 شهريًا أو $119 سنويًا.",
      price: tierPrice("premium"),
      priceCurrency: "USD",
      url: `${SITE_URL}/ar/memberships`,
    },
    {
      "@type": "Offer",
      name: tierName("pro"),
      description:
        "كيّف خططك وارتقِ: 8 خطط ذكاء اصطناعي شهريًا، و6 تبديلات للوجبات أو التمارين أسبوعيًا، بلا إعلانات. $29.99 شهريًا أو $239 سنويًا.",
      price: tierPrice("pro"),
      priceCurrency: "USD",
      url: `${SITE_URL}/ar/memberships`,
    },
    {
      "@type": "Offer",
      name: tierName("coaching"),
      description:
        "تدريب أونلاين خاص: خطط من مدرب حقيقي، ومتابعة أسبوعية، وتبديلات يدوية، ودعم أولوية — مع كل مزايا برو. $39.99 شهريًا أو $359 سنويًا.",
      price: tierPrice("coaching"),
      priceCurrency: "USD",
      url: `${SITE_URL}/ar/coaching`,
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(offerCatalogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(membershipsFaqSchema) }}
      />
      <MembershipsPage lang="ar" />
    </>
  );
}
