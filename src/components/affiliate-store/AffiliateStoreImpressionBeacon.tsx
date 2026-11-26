"use client";

import { useEffect, useRef } from "react";

/**
 * STORE IMPRESSION BEACON (Phase 529 — the clicks twin): a tiny client
 * island that counts the products a visitor ACTUALLY SEES (Intersection
 *Observer ≥50% for 1s) and sends ONE batched beacon per page view —
 * never per card (no beacon storms). Zero PII by law: the payload is
 * product ids + surface only (the affiliate_store_click_events design,
 * applied to impressions through the aggregated 0120 table).
 */
export function AffiliateStoreImpressionBeacon({
  productIds,
  surfaceType,
  surfaceKey,
}: {
  productIds: string[];
  surfaceType: string;
  surfaceKey: string;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || productIds.length === 0) return;
    sent.current = true;

    const visible = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      timer = null;
      if (visible.size === 0) return;
      const payload = JSON.stringify({
        productIds: [...visible].slice(0, 24),
        surfaceType,
        surfaceKey,
      });
      try {
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon(
            "/api/affiliate-store/impressions",
            new Blob([payload], { type: "application/json" }),
          );
        } else {
          void fetch("/api/affiliate-store/impressions", {
            method: "POST",
            body: payload,
            headers: { "Content-Type": "application/json" },
            keepalive: true,
          });
        }
      } catch {
        // best-effort by design
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.storeProductId;
            if (id) visible.add(id);
          }
        }
        if (visible.size > 0 && timer === null) {
          // debounce: collect everything visible in the first second
          timer = setTimeout(flush, 1000);
        }
      },
      { threshold: 0.5 },
    );

    // observe every rendered product card on this surface
    const nodes = document.querySelectorAll<HTMLElement>("[data-store-product-id]");
    for (const node of nodes) {
      const id = node.dataset.storeProductId ?? "";
      if (productIds.includes(id)) observer.observe(node);
    }

    // flush on unload for short visits
    const onHide = () => {
      if (timer !== null) clearTimeout(timer);
      flush();
    };
    window.addEventListener("pagehide", onHide);

    return () => {
      observer.disconnect();
      window.removeEventListener("pagehide", onHide);
      if (timer !== null) clearTimeout(timer);
    };
  }, [productIds, surfaceType, surfaceKey]);

  return null;
}
