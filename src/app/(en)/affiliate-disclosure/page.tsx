import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * /affiliate-disclosure — the store's legal disclosure page (EN ONLY —
 * governing law §0/§3.2; the د-4 full text from DISCLOSURES-EN.md).
 *
 * The two Phase-4 clauses (the price/availability statement and the
 * CERTAIN CONTENT API notice) are deliberately NOT rendered: they
 * activate only with API-served prices/content (DISCLOSURES-EN.md §5 —
 * "حتى تفعيل المرحلة 4"). This page carries NO commission rates (the
 * internal-only law — the ninth guard).
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Affiliate Disclosure — Alkemos",
  description:
    "How the Alkemos Affiliate Store earns from qualifying purchases through the Amazon Associates Program.",
  alternates: { canonical: "https://alkemos.com/affiliate-disclosure" },
  robots: { index: true, follow: true },
};

export default function AffiliateDisclosurePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 md:py-20">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <Link href="/affiliate-store" className="hover:opacity-70">Store</Link>
          <span>/</span>
          <span className="text-[var(--text)]">Affiliate disclosure</span>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Affiliate Disclosure
        </h1>

        <div className="mt-8 space-y-5 text-base leading-relaxed">
          <p>
            Alkemos is a participant in the Amazon Associates Program, an affiliate
            advertising program designed to provide a means for sites to earn
            advertising fees by advertising and linking to amazon.com. As an
            Amazon Associate I earn from qualifying purchases.
          </p>
          <p>
            When you buy through links on our site, we may earn an affiliate
            commission at no extra cost to you. Every purchase unit on the store
            carries this disclosure next to its link, so you always know when a
            link earns the site a commission.
          </p>
          <p>
            Product picks, editorial scores, and reviews on Alkemos are our own —
            they are not supplied by Amazon, and earning a commission never
            changes what we recommend or how we score it.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
