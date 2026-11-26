/**
 * STORE-LINK — the SINGLE source of every Alkemos Affiliate Store purchase
 * link (governing law §1.5-2/§3.2 — docs/archive/ALKEMOS-STORE-
 * AFFILIATE-READINESS-AUDIT-2026-11-26.md).
 *
 * LAWS (binding):
 *  - The ONLY stored purchase identity is the ASIN (clause (h): ASINs may
 *    be stored for an indefinite period). NO tagged link is ever stored —
 *    `tag=` inside any store text column is a guard violation.
 *  - The link is built HERE, at render time, from
 *    https://www.amazon.com/dp/{asin}?tag={AMAZON_ASSOCIATES_TAG} with the
 *    tag taken from the environment ONLY, merged exactly once.
 *  - Non-standard ASINs and embedded tags are rejected (this function is
 *    the stricter gate; the DB CHECK is the looser [A-Z0-9]{10}).
 *  - The tag value is NOT a secret (it is visible in public link URLs);
 *    it ships in .env.example EMPTY and is documented in SECURITY.md.
 *    Owner-set value (fact ح-3): ahmedzake-20.
 *
 * This module must stay import-safe from both server components and
 * client components (pure functions, no server-only imports).
 */

/** Associates tag env var (documented in .env.example + SECURITY.md §2.1). */
export const AMAZON_ASSOCIATES_TAG_ENV = "AMAZON_ASSOCIATES_TAG";

/**
 * Strict US-ASIN shape: a B-prefixed 10-character code (the modern
 * allocation space) or a 10-digit ISBN-10-derived code. Anything else —
 * lowercase, separators, query fragments, an embedded `tag=` — is
 * rejected BEFORE it ever reaches a URL.
 */
const STRICT_ASIN_RE = /^(?:B[0-9A-Z]{9}|[0-9]{10})$/;

/**
 * Associates tag shape: alphanumeric + dashes, 2–40 chars (the real tag
 * `ahmedzake-20` matches). Rejects URL-special characters so the tag can
 * never smuggle extra query params into the built link.
 */
const ASSOCIATES_TAG_RE = /^[A-Za-z0-9-]{2,40}$/;

const AMAZON_DP_BASE = "https://www.amazon.com/dp/";

export type AffiliateStoreBuyLink = {
  /** The full purchase URL (tag merged exactly once). */
  url: string;
  /** The tag that was merged (for tests + admin previews). */
  tag: string;
  /** The validated ASIN. */
  asin: string;
};

/** true when `asin` matches the strict US-ASIN shape (null-safe). */
export function isValidAsin(asin: string | null | undefined): boolean {
  if (!asin) return false;
  return STRICT_ASIN_RE.test(asin);
}

/**
 * The current Associates tag from the environment (trimmed), or "" when
 * unset/malformed. Malformed values are IGNORED (resolveAmazonBuyLink
 * then returns null) — a broken tag must never produce a broken link.
 */
export function associatesTag(): string {
  const raw = (process.env[AMAZON_ASSOCIATES_TAG_ENV] ?? "").trim();
  return ASSOCIATES_TAG_RE.test(raw) ? raw : "";
}

/**
 * Build the purchase link for a product ASIN — the ONE place the tag is
 * merged. Returns null when:
 *  - the ASIN is missing/non-standard (guard §3.4-1: "reject any
 *    non-standard ASIN"), or
 *  - the Associates tag is not configured (no compliant link exists —
 *    callers render NO buy unit rather than an untagged one).
 *
 * The tag is appended exactly once; the ASIN cannot carry its own query
 * (the strict regex forbids `?`/`=`/`&`), so a double-tag or tag override
 * is structurally impossible.
 */
export function resolveAmazonBuyLink(
  asin: string | null | undefined,
): AffiliateStoreBuyLink | null {
  if (!isValidAsin(asin)) return null;
  const tag = associatesTag();
  if (!tag) return null;
  return {
    url: `${AMAZON_DP_BASE}${asin}?tag=${tag}`,
    tag,
    asin: asin as string,
  };
}

/**
 * STORED-LINK GUARD (§3.4-1): true when a stored text value carries a
 * tagged Amazon link (any `tag=`), a raw amazon.com/dp link, or an
 * amazon URL with affiliate tracking params. Applied to every store
 * text column at write time (the admin API) and by the store-links
 * canary — the purchase destination is ALWAYS built by
 * resolveAmazonBuyLink, never read from storage.
 */
export function containsStoredAmazonLink(text: string | null | undefined): boolean {
  if (!text) return false;
  const value = text.toLowerCase();
  if (value.includes("tag=")) return true;
  if (value.includes("amazon.com/dp/")) return true;
  if (value.includes("amazon.com/exec/obidos")) return true;
  if (value.includes("amzn.to")) return true;
  if (value.includes("/ref=asc_")) return true;
  return false;
}

/**
 * Canonical CTA label (the audit's Phase-1 law: ONE unified English CTA
 * while no API prices exist — no per-product price claims anywhere).
 */
export const AFFILIATE_STORE_BUY_CTA_LABEL = "Check price on Amazon";
