import type { Metadata } from "next";
import { BlogListPage } from "@/components/blog/BlogListPage";
import { listPublishedPostsForListPage } from "@/lib/blog-server";

const SITE_URL = "https://alkemos.com";

/**
 * Blog list (EN).
 *
 * Homepage AR mirror follow-up (2026-08-30): this page previously had NO
 * metadata, so it inherited the ROOT canonical "/" — telling Google the
 * blog list was a duplicate of the homepage. It now declares its own
 * canonical + hreflang pair with the Arabic mirror
 * (src/app/ar/blog/page.tsx declares the reciprocal side).
 */
export const metadata: Metadata = {
  // §12.53 item 12 (2026-09-15, deep audit): brand suffix added — the
  // AR mirror carries it via the /ar template ("المدونة الرياضية —
  // Alkemos"); the EN list title was the only indexable EN surface with
  // a brandless SERP title.
  title: "Fitness & Nutrition Blog | Alkemos",
  description:
    "Science-based workout, nutrition, and supplement articles from the Alkemos team — English editions.",
  // Phase 231 (owner order C2): the blog index previously had NO
  // openGraph/twitter block — it inherited the ROOT homepage card
  // (og-home-en + og:url = https://alkemos.com), so social shares and
  // crawlers saw the blog as the homepage. Independent metadata: every
  // field (title/description/url/image) now describes the BLOG INDEX
  // itself. Article metadata is untouched (each article owns its own).
  openGraph: {
    title: "Fitness & Nutrition Blog | Alkemos",
    description:
      "Science-based workout, nutrition, and supplement articles from the Alkemos team — English editions.",
    siteName: "Alkemos",
    locale: "en_US",
    type: "website",
    url: `${SITE_URL}/blog`,
    images: [
      {
        url: "/images/og/og-home-en.png?v=4",
        width: 1200,
        height: 630,
        alt: "The Alkemos Blog — Fitness & Nutrition Articles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fitness & Nutrition Blog | Alkemos",
    description:
      "Science-based workout, nutrition, and supplement articles from the Alkemos team — English editions.",
    images: ["/images/og/og-home-en.png?v=4"],
  },
  alternates: {
    canonical: "/blog",
    languages: {
      en: `${SITE_URL}/blog`,
      ar: `${SITE_URL}/ar/blog`,
      "x-default": `${SITE_URL}/blog`,
    },
  },
};

export default async function Page() {
 // SSR fix (H1, audit 2026-09-05): posts are fetched server-side and
 // seeded into the first render — crawlers see real article links in
 // the HTML (previously an empty client-rendered shell) and LCP no
 // longer waits on a second round trip.
 const initialPosts = await listPublishedPostsForListPage("en");
 return <BlogListPage lang="en" initialPosts={initialPosts} />;
}

// ISR — 5 min freshness (same cadence as the article pages).
export const revalidate = 300;
