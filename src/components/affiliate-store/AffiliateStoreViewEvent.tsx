"use client";

import { useEffect } from "react";
import { trackGa4Event } from "@/lib/analytics";

/**
 * STORE GA4 VIEW EVENTS (§1.5 — store_view / product_view; zero PII:
 * surface + slug only, the analytics.ts law). A tiny client island so
 * the server pages stay static (ISR) while the event fires in the
 * browser exactly once per view.
 */
export function AffiliateStoreViewEvent({
  event,
  surface,
  slug,
}: {
  event: "affiliate_store_view" | "affiliate_store_product_view";
  surface: string;
  slug?: string;
}) {
  useEffect(() => {
    try {
      trackGa4Event(event, { surface, slug: slug ?? "" });
    } catch {
      // GA4 is best-effort; the page itself never depends on it
    }
  }, [event, surface, slug]);
  return null;
}
