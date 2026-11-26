/**
 * STORE-LINK-VERIFY — the /admin/affiliate-store editor's link verifier
 * (ALKEMOS-STORE-PHASE1 §1.2 — "StoreLinkVerify (مشتق blog-link-verify)").
 *
 * THE ONE QUESTION IT ANSWERS: does this product's purchase destination
 * build and respond? The link itself is NEVER stored — it is built from
 * the ASIN + the env tag at render time (affiliate-store-link.ts), so verification
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
 *     check wired through /api/admin/affiliate-store/verify.
 */

import { isValidAsin, resolveAmazonBuyLink } from "./affiliate-store-link";
import { checkAffiliateStoreImageUrlShape } from "./affiliate-store-guards";

export type AffiliateStoreLinkVerifyResult = {
  asin: string;
  ok: boolean;
  status: "valid" | "invalid-asin" | "no-tag" | "ok" | "dead" | "unverified" | "error";
  url: string | null;
  httpStatus: number | null;
  message: string;
};

export type AffiliateStoreImageVerifyResult = {
  ok: boolean;
  status: "ok" | "shape-block" | "dead" | "unverified" | "error";
  url: string | null;
  httpStatus: number | null;
  contentType: string | null;
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
export async function verifyAffiliateStoreProductLink(
  asin: string | null | undefined,
): Promise<AffiliateStoreLinkVerifyResult> {
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

/**
 * IMAGE VERIFY (VISIBILITY-PREVIEW 2026-11-26 — owner order «التأكد من أنه
 * رابط صورة مباشر»): does image_url serve an IMAGE? The shape gate runs
 * first (a page URL never pays a probe); a live HEAD then requires
 * content-type image/*. 404/410 = dead; other non-2xx/3xx or a non-image
 * content-type = dead (a 200 text/html answer is a PAGE, exactly what
 * the owner asked to catch); unreachable = unverified (CDN bot-blocks
 * exist — the human clicks the URL to settle it).
 */
export async function verifyAffiliateStoreImageUrl(
  imageUrl: string | null | undefined,
): Promise<AffiliateStoreImageVerifyResult> {
  const shape = checkAffiliateStoreImageUrlShape(imageUrl);
  if (shape.verdict === "block") {
    return {
      ok: false,
      status: "shape-block",
      url: imageUrl ?? null,
      httpStatus: null,
      contentType: null,
      message: shape.message,
    };
  }
  if (!imageUrl || imageUrl.trim() === "") {
    return {
      ok: true,
      status: "ok",
      url: null,
      httpStatus: null,
      contentType: null,
      message: "No image set — the carved category icon renders (IMAGE-POLICY ص-1 default; nothing to verify).",
    };
  }
  const url = imageUrl.trim();
  let status: number | null = null;
  let contentType: string | null = null;
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
      status = res.status;
      contentType = res.headers.get("content-type");
      break;
    } catch {
      if (attempt === 1) status = null;
    }
  }
  if (status === null) {
    return {
      ok: true,
      status: "unverified",
      url,
      httpStatus: null,
      contentType: null,
      message: "Probe did not answer (some CDNs block HEAD) — open the URL and check it by eye.",
    };
  }
  if (status >= 200 && status < 400 && contentType && /^image\//i.test(contentType)) {
    return {
      ok: true,
      status: "ok",
      url,
      httpStatus: status,
      contentType,
      message: `Direct image confirmed (content-type ${contentType}).`,
    };
  }
  if (status === 404 || status === 410) {
    return {
      ok: false,
      status: "dead",
      url,
      httpStatus: status,
      contentType,
      message: "Image URL returned 404/410 — the link is broken; fix it or leave it empty for the carved icon.",
    };
  }
  if (status >= 200 && status < 400) {
    return {
      ok: false,
      status: "dead",
      url,
      httpStatus: status,
      contentType,
      message: `URL answered 2xx but content-type is "${contentType ?? "unknown"}" — that is a PAGE/file, not a direct image.`,
    };
  }
  return {
    ok: true,
    status: "unverified",
    url,
    httpStatus: status,
    contentType,
    message: `Probe answered ${status} (treated as unverified, not dead) — check by eye.`,
  };
}
