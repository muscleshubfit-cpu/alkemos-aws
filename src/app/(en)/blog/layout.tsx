import type { ReactNode } from "react";
import { Resources } from "@/components/hub-head-resources";

/**
 * EN BLOG SECTION LAYOUT (PERFORMANCE-AUDIT-2026-11-08 P0-2, owner order
 * 2026-11-08 — parity fix with the AR mirror).
 *
 * The AR mirror ((ar)/ar/blog/layout.tsx, VERCEL-USAGE-3) mounts the
 * Pexels/Pixabay/Unsplash preconnects + the blog banner preload. The EN
 * side had NO section layout, so every /blog/* page (index, 141 articles,
 * category pages) loaded the Pexels featured image (usually the LCP) with
 * NO preconnect to the external origin and no banner preload at TTFB —
 * measured on the audit: article-EN LCP 4.0s with 1,396ms simulated
 * discovery latency vs 121ms on the AR homepage. This layout is the
 * byte-for-byte mirror of the AR one: same hosts, same banner section,
 * React 19 hoists the <link> tags into <head> identically.
 */
export default function EnBlogLayout({ children }: { children: ReactNode }) {
  return (
    <Resources
      hosts={["https://images.pexels.com", "https://cdn.pixabay.com", "https://images.unsplash.com"]}
      banner="blog"
    >
      {children}
    </Resources>
  );
}
