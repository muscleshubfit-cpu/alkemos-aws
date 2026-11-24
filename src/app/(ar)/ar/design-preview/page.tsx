import type { Metadata } from "next";
import DesignPreview from "@/components/design-preview/DesignPreview";

export const metadata: Metadata = {
  title: "Alkemos — معاينة تصميم الواجهة",
  description: "معاينة مستقلة لاتجاه بصري جديد لواجهة Alkemos.",
  robots: { index: false, follow: false },
};

export default function ArabicDesignPreviewPage() {
  return <DesignPreview lang="ar" />;
}
