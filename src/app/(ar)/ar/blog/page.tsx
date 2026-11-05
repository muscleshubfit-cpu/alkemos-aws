import type { Metadata } from "next";
import { BlogListPage } from "@/components/blog/BlogListPage";
import { listPublishedPostsForListPage } from "@/lib/blog-server";

const SITE_URL = "https://alkemos.com";

/**
 * Arabic mirror of /blog — Arabic-language blog list (independent AR
 * posts, not translations).
 *
 * Homepage AR mirror follow-up (2026-08-30): own title + canonical +
 * hreflang so Google indexes THIS url (the ar/layout alternates block
 * was removed — it leaked the homepage signals onto every /ar/* child).
 */
export const metadata: Metadata = {
  title: "المدونة الرياضية",
  description:
    "مقالات رياضية وتغذية علمية بالعربية — تمارين، تغذية، مكملات، وصحة من فريق Alkemos.",
  // Phase 231 (owner order C2): the AR blog index previously had NO
  // openGraph/twitter block — it inherited the /ar LAYOUT block
  // (og-home-ar + the Arabic HOMEPAGE title), so shares and crawlers saw
  // the blog index as the Arabic homepage. Independent metadata describing
  // the BLOG INDEX itself (og:title mirrors the page title + the /ar
  // template's single " — Alkemos" suffix; og:image is the dedicated blog
  // card). Individual AR article metadata is untouched.
  openGraph: {
    title: "المدونة الرياضية — Alkemos",
    description:
      "مقالات رياضية وتغذية علمية بالعربية — تمارين، تغذية، مكملات، وصحة من فريق Alkemos.",
    siteName: "Alkemos",
    locale: "ar_EG",
    type: "website",
    url: `${SITE_URL}/ar/blog`,
    images: [
      {
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "مدونة Alkemos — مقالات اللياقة والتغذية",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "المدونة الرياضية — Alkemos",
    description:
      "مقالات رياضية وتغذية علمية بالعربية — تمارين، تغذية، مكملات، وصحة من فريق Alkemos.",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
  alternates: {
    canonical: "/ar/blog",
    languages: {
      en: `${SITE_URL}/blog`,
      ar: `${SITE_URL}/ar/blog`,
      "x-default": `${SITE_URL}/blog`,
    },
  },
};

export default async function Page() {
 // SSR fix (H1, audit 2026-09-05) — server-fetched posts seeded into
 // the first render (same as the EN list page).
 const initialPosts = await listPublishedPostsForListPage("ar");
 return <BlogListPage lang="ar" initialPosts={initialPosts} />;
}

// ISR — 5 min freshness (same cadence as the EN list page).
export const revalidate = 300;
