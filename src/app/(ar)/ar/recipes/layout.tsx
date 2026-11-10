import type { Metadata } from "next";
import { Resources } from "@/components/hub-head-resources";

/**
 * AR RECIPES SECTION LAYOUT (HEALTHY-RECIPES-PLATFORM plan §9.1).
 *
 * The AR foods-layout precedent: Arabic metadata with its own title
 * (the /ar layout template appends «— Alkemos» — no double branding),
 * canonical + the full hreflang pair (complete by construction).
 */
export const metadata: Metadata = {
  title: "الوصفات الصحية — بالجرام وقيم لكل حصة",
  description:
    "وصفات صحية بمكونات موزونة بالجرام وقيم غذائية واضحة لكل حصة من مراجع موثوقة — صفِّ حسب المطبخ والنظام الغذائي والهدف والوجبة والسعرات والبروتين ووقت التحضير. وصفة جديدة كل يوم.",
  keywords: [
    "وصفات صحية",
    "وصفات دايت",
    "وصفات عالية البروتين",
    "وصفات بالسعرات",
    "وصفات مصريه صحيه",
    "وصفات كيتو",
  ],
  alternates: {
    canonical: "/ar/recipes",
    languages: {
      en: "https://alkemos.com/recipes",
      ar: "https://alkemos.com/ar/recipes",
      "x-default": "https://alkemos.com/recipes",
    },
  },
  openGraph: {
    title: "الوصفات الصحية | Alkemos",
    description:
      "وصفات صحية بمكونات موزونة بالجرام وقيم غذائية لكل حصة من مراجع موثوقة — لهدفك التدريبي والغذائي.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/recipes",
    siteName: "Alkemos",
    images: [
      {
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "وصفات Alkemos الصحية",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
};

export default function ArRecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Resources banner="foods">{children}</Resources>;
}
