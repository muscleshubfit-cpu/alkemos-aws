"use client";

import { useCallback } from "react";
import { ExternalLink } from "lucide-react";
import { OaDisclosureLine } from "./disclosure";
import { trackGa4Event } from "@/lib/analytics";

/**
 * AMAZONBUYBUTTON (ALKEMOS-STORE-PHASE1 §1.4 — the governing law §1.5-6):
 * the store's ONE purchase unit.
 *
 * COMPLIANCE SHAPE (each line is a law, not a preference):
 *  - DIRECT anchor to amazon.com (rel="sponsored noopener") — the URL is
 *    built by affiliate-store-link.ts from the ASIN + the env tag at render time;
 *    there is NO redirect endpoint anywhere (clause (v) — no Redirecting
 *    Links, no cloaking).
 *  - The click NEVER intercepts the transition: a fire-and-forget
 *    sendBeacon to /api/affiliate-store/clicks + a GA4 affiliate_store_click event ride
 *    alongside; the browser navigates to Amazon immediately.
 *  - م-1: the OA disclosure line renders ABOVE the button, attached —
 *    never separated, never hidden (FTC "close to the claim" + OA
 *    "clearly and prominently").
 *  - ONE unified CTA (no prices before the Phase-4 API): "Check price
 *    on Amazon".
 *  - No ASIN (or unconfigured tag) → NO buy unit at all — the product
 *    page still renders its editorial content.
 */

export function AmazonBuyButton({
  buyUrl,
  productId,
  surfaceType = "product",
  surfaceKey = "",
  ctaLabel = "Check price on Amazon",
  variant = "default",
}: {
  buyUrl: string;
  productId: string;
  surfaceType?: string;
  surfaceKey?: string;
  ctaLabel?: string;
  /** 527: "large" is the product page's prominent buy unit. */
  variant?: "default" | "large";
}) {
  const onClick = useCallback(() => {
    // Fire-and-forget, never intercepting the navigation (clause (v)).
    try {
      const payload = JSON.stringify({
        productId,
        surfaceType,
        surfaceKey,
      });
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/affiliate-store/clicks", new Blob([payload], { type: "application/json" }));
      } else {
        void fetch("/api/affiliate-store/clicks", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        });
      }
    } catch {
      // the beacon is best-effort by design — the link always wins
    }
    try {
      trackGa4Event("affiliate_store_click", {
        surface: surfaceType,
        surface_key: surfaceKey,
      });
    } catch {
      // GA4 is best-effort too
    }
  }, [productId, surfaceType, surfaceKey]);

  return (
    <div className="store-buy-unit" data-store-buy-unit="">
      {/* م-1 — attached ABOVE the button (the FTC/OA placement law) */}
      <OaDisclosureLine className="mb-1" />
      <a
        href={buyUrl}
        target="_blank"
        rel="sponsored noopener"
        onClick={onClick}
        className={
          variant === "large"
            ? "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--text)] px-6 py-3.5 text-base font-semibold text-[var(--bg)] transition-opacity hover:opacity-85"
            : "inline-flex items-center gap-2 rounded-lg border border-[var(--edge)] bg-[var(--card)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition-shadow hover:shadow-md"
        }
      >
        <ExternalLink className={variant === "large" ? "size-5" : "size-4"} aria-hidden="true" />
        {ctaLabel}
      </a>
    </div>
  );
}
