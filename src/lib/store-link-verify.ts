/**
 * STORE-LINK-VERIFY — the /admin/store editor's link verifier
 * (ALKEMOS-STORE-PHASE1 §1.2 — "StoreLinkVerify (مشتق blog-link-verify)").
 *
 * THE ONE QUESTION IT ANSWERS: does this product's purchase destination
 * build and respond? The link itself is NEVER stored — it is built from
 * the ASIN + the env tag at render time (store-link.ts), so verification
 * means:
 *   1. the ASIN passes the strict shape gate (B + 9 chars / 10 digits);
 *   2. the canonical URL builds (tag present — otherwise the store is
 *      running unconfigured and NO link renders at all);
 *   3. a live HEAD probe (server-side, redirect-following, short
 *      timeout, ONE retry) says amazon.com still serves the page.
 *
 * HONESTY RULES (the blog-link-verify law, kept):
 *   • UNVERIFIED ≠ dead: Amazon routinely rejects HEAD/bot UAs — a
 *     non-2xx/3xx that is NOT 404/410 stays "unverified" and the human
 *     clicks the URL (the editor renders it as a plain link).
 *   • The weekly automated sweep over ALL published products is the
 *     Phase-2 item (audit §5.2); THIS module is the editor's per-product
 *     check wired through /api/admin/store/verify.
 */

import { isValidAsin, resolveAmazonBuyLink } from "./store-link";

export type StoreLinkVerifyResult = {
  asin: string;
  ok: boolean;
  status: "valid" | "invalid-asin" | "no-tag" | "ok" | "dead" | "unverified" | "error";
  url: string | null;
  httpStatus: number | null;
  message: string;
};

const VERIFY_TIMEOUT_MS = 6_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; AlkemosStoreLinkVerify/1.0; +https://alkemos.com)";

/** HEAD with redirect-following + ONE retry (the blog-link-verify shape). */
async function probe(url: string): Promise<{ status: number | null }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timer);
      return { status: res.status };
    } catch {
      if (attempt === 1) return { status: null };
    }
  }
  return { status: null };
}

/** The full verdict for one product's purchase destination. */
export async function verifyStoreProductLink(
  asin: string | null | undefined,
): Promise<StoreLinkVerifyResult> {
  if (!asin) {
    return {
      asin: asin ?? "",
      ok: false,
      status: "invalid-asin",
      url: null,
      httpStatus: null,
      message: "No ASIN captured yet — the product renders without a buy button until one is set (SOP §5.1).",
    };
  }
  if (!isValidAsin(asin)) {
    return {
      asin,
      ok: false,
      status: "invalid-asin",
      url: null,
      httpStatus: null,
      message: "Non-standard ASIN (expected B + 9 chars, or 10 digits) — refused by the link builder.",
    };
  }
  const link = resolveAmazonBuyLink(asin);
  if (!link) {
    return {
      asin,
      ok: false,
      status: "no-tag",
      url: null,
      httpStatus: null,
      message:
        "AMAZON_ASSOCIATES_TAG is not configured in this environment — no compliant link can render (check the server env).",
    };
  }
  const { status } = await probe(link.url);
  if (status === null) {
    return {
      asin,
      ok: true,
      status: "unverified",
      url: link.url,
      httpStatus: null,
      message:
        "URL built; live probe did not answer (Amazon often rejects HEAD probes) — click to verify by eye.",
    };
  }
  if (status >= 200 && status < 400) {
    return {
      asin,
      ok: true,
      status: "ok",
      url: link.url,
      httpStatus: status,
      message: "URL built and answered OK.",
    };
  }
  if (status === 404 || status === 410) {
    return {
      asin,
      ok: false,
      status: "dead",
      url: link.url,
      httpStatus: status,
      message: "Amazon returned 404/410 — the ASIN looks retired. Re-check the product page and update the ASIN.",
    };
  }
  return {
    asin,
    ok: true,
    status: "unverified",
    url: link.url,
    httpStatus: status,
    message: `URL built; probe answered ${status} (treated as unverified, not dead).`,
  };
}
