import type { Metadata } from "next";
import DesignPreview from "@/components/design-preview/DesignPreview";

export const metadata: Metadata = {
  title: "Alkemos — Independent Homepage Design Preview",
  description: "A reversible visual direction study for the Alkemos homepage.",
  robots: { index: false, follow: false },
};

export default function DesignPreviewPage() {
  return <DesignPreview lang="en" />;
}
