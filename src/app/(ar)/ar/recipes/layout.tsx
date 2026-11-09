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
  title: "الوصفات الصحية — بالجرام وقيم محسوبة لكل حصة",
  description:
    "وصفات صحية ثنائية اللغة بقيم غذائية محسوبة برمجيًا بالجرام من مرجع موثق — صفِّ حسب المطبخ والنظام الغذائي والهدف والوجبة والسعرات والبروتين ووقت التحضير. زوج جديد متحقق (عربي + إنجليزي) كل يوم.",
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
      "وصفات ثنائية اللغة بقيم محسوبة بالجرام لكل حصة من مرجع موثق — لهدفك التدريبي والغذائي.",
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
