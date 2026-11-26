/**
 * STORE-GUARDS — the Alkemos Affiliate Store's publishing gates as PURE,
 * testable functions (governing law §3.4 — the eight guards — PLUS the
 * two ratified Phase-1 additions: the absolute image law v2 §0 and the
 * NINTH guard "commissions are internal-only").
 *
 * PHASE 527 (owner order 2026-11-27 «إعادة بناء تجربة Affiliate Store
 * تجاريًا») — two guard amendments, both owner-ordered:
 *
 *   527-G1 — AMAZON PRODUCT IMAGES ARE THE TRUSTED SOURCE. The owner's
 *   order «استخدام صور المنتجات الأصلية من مصادر موثوقة ومسموح
 *   باستخدامها» + «عرض صورة المنتج الفعلية في كل بطاقة وكل صفحة
 *   تفاصيل»: for an Amazon Associates store the ORIGINAL product photo
 *   hosted on Amazon's own image CDN (m.media-amazon.com) IS the trusted,
 *   permitted source — it is the very image the Associates program
 *   surfaces for the listing we link to. The old clause-(h) blanket ban
 *   on Amazon image hosts is RETIRED; the CDN host list below now feeds
 *   the ALLOWLIST check (https + m.media-amazon.com only). All other
 *   external image hosts stay blocked. The absolute person-free law
 *   (§0.1/§0.2 — no women, no immodest imagery) is UNTOUCHED and still
 *   rejects any female-subject/immodest signal in the URL/alt text.
 *
 *   527-G2 — THE SHELF GATE: image_url AND a valid ASIN are REQUIRED to
 *   publish (owner order: «لا تسمح بالنشر إلا بعد اجتياز التحقق الآلي
 *   من البيانات الأساسية والصورة ورابط الشراء، دون تدخل يدوي» +
 *   «عدم نشر منتج في واجهة المتجر... إذا كانت صورته الفعلية
 *   مفقودة»). A product without its real image or buy path cannot
 *   appear on any public surface — with auto-publish (527-L2) these
 *   guards are the ONLY publish gate, so they must carry the weight.
 *
 * SOURCES (each rule cites its binding law):
 *  - IMAGE-POLICY-EN.md v2 §0 (owner order 2026-11-26): absolute ban on
 *    women/girls in ANY store image (incl. product, lifestyle, AI,
 *    background, partial, reflections) + immodest/NSFW content for both
 *    genders; when in doubt → REJECT.
 *  - IMAGE-POLICY-EN.md §2/§4 + clause (h) AS AMENDED BY 527-G1: the
 *    ONLY allowed external image host is m.media-amazon.com (the
 *    original product photo); every other Amazon domain (cart pages,
 *    dp links, tagged URLs) stays forbidden by the stored-link guard.
 *  - Governing law §3.4-5 + SUPPLEMENTS-FOOD-SCREENING-EN.md §2-1: the
 *    operational halal blocklist (pork/alcohol wording) on description +
 *    ingredients = automatic publish rejection.
 *  - SUPPLEMENTS-FOOD-SCREENING-EN.md §2-2: animal-source UNKNOWN-origin
 *    ingredients (gelatin…) are REVIEW FLAGS (owner decision), not bans.
 *  - SUPPLEMENTS-FOOD-SCREENING-EN.md §3: claims discipline — no disease
 *    claims, no FDA-approved-style wording (structure/function only).
 *  - Governing law §3.4-6: NO manual price (price_usd must stay NULL
 *    until a trusted API serves it — 527 keeps the no-invented-prices
 *    law; cards show "See price on Amazon" instead).
 *  - Owner order 2026-11-26 (ratified §6-c — the NINTH guard): commission
 *    RATES are internal-only — no rate may appear on any public store
 *    surface (COMMISSION-RATES.md is the internal single source).
 *  - Governing law §3.4-8: ≥300 editorial words is an ADVISORY floor —
 *    it warns, it never blocks.
 *
 * Every function here is pure + shared by the admin save API, the
 * seed validation, and the vitest canaries (store-guards.test.ts).
 */

import {
  hasFemaleSubjectSignal,
  hasImmodestSignal,
  hasNsfwVocabulary,
} from "./image-safety";
import { containsStoredAmazonLink, isValidAsin } from "./affiliate-store-link";

/* ───────────── 1) IMAGE GUARDS (law v2 §0 + clause (h)) ───────────── */

/**
 * The ALLOWED external image host (527-G1): Amazon's official product
 * image CDN — the ORIGINAL product photo of the exact listing the store
 * links to (the trusted, permitted source for an Associates store).
 * Everything else external stays rejected (an unknown host can serve
 * anything — wrong product, people, immodest content).
 */
const ALLOWED_IMAGE_HOST = "m.media-amazon.com";

/**
 * Legacy Amazon hosts that are NOT the product-image CDN (media-amazon
 * mirrors, ssl-images CDNs, the legacy cloudfront) — still blocked: the
 * trusted surface is exactly m.media-amazon.com, nothing else.
 */
const BLOCKED_AMAZON_HOSTS = [
  "images-amazon.com",
  "images-na.ssl-images-amazon.com",
  "ecx.images-amazon.com",
  "images-eu.ssl-images-amazon.com",
  "images-fe.ssl-images-amazon.com",
  "d1k5w7mbrh6vq5.cloudfront.net",
] as const;

/** true when the URL points at the ALLOWED original-product-image CDN (527-G1). */
export function isTrustedAmazonProductImage(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === ALLOWED_IMAGE_HOST;
  } catch {
    return false;
  }
}

/** true when the URL points at a NON-CDN Amazon host (still blocked). */
export function isBlockedAmazonHost(url: string | null | undefined): boolean {
  if (!url) return false;
  const value = url.toLowerCase();
  return BLOCKED_AMAZON_HOSTS.some((host) => value.includes(host));
}

export type AffiliateStoreImageCheck = {
  ok: boolean;
  violations: string[];
};

/**
 * The FULL image gate (IMAGE-POLICY-EN.md v2 §0 + §4, as amended by
 * 527-G1) for one image candidate: its URL + its alt/description text.
 * Rejects:
 *  - any external host EXCEPT m.media-amazon.com (the trusted original
 *    product photo CDN — 527-G1); legacy Amazon non-CDN hosts stay
 *    blocked;
 *  - ANY female-subject signal in the alt/URL text (§0.1 absolute ban —
 *    incl. "woman", "women", "girl", "female", "model"…);
 *  - immodest/NSFW signals (§0.2 — both genders);
 * When in doubt (any signal present) → REJECT: the fallback is the
 * neutral professional placeholder, never a maybe-noncompliant photo.
 */
export function checkAffiliateStoreImage(
  imageUrl: string | null | undefined,
  imageAlt: string | null | undefined,
): AffiliateStoreImageCheck {
  const violations: string[] = [];
  if (imageUrl) {
    let hostOk = false;
    let hostBlocked = false;
    try {
      const parsed = new URL(imageUrl);
      const host = parsed.hostname;
      hostOk =
        parsed.protocol === "https:" &&
        (host === ALLOWED_IMAGE_HOST || host === "alkemos.com" || host.endsWith(".alkemos.com"));
      hostBlocked =
        BLOCKED_AMAZON_HOSTS.some((h) => host.includes(h)) ||
        (host.endsWith("amazon.com") || host.endsWith("amazon.es") || host.endsWith("amazon.de"));
    } catch {
      hostBlocked = true;
    }
    if (!hostOk && hostBlocked) {
      violations.push("image_url points at a blocked Amazon host — only the original product-image CDN m.media-amazon.com is allowed (527-G1)");
    } else if (!hostOk) {
      violations.push("image_url host is not a trusted source — only https://m.media-amazon.com product images (or alkemos.com self-hosted assets) are allowed (527-G1)");
    }
  }
  const text = `${imageUrl ?? ""} ${imageAlt ?? ""}`;
  if (hasFemaleSubjectSignal(text)) {
    violations.push("image text carries a female-subject signal (IMAGE-POLICY v2 §0.1 — absolute ban; pick a product-only photo)");
  }
  if (hasImmodestSignal(text)) {
    violations.push("image text carries an immodest signal (IMAGE-POLICY v2 §0.2 — immodest imagery is banned for both genders)");
  }
  if (hasNsfwVocabulary(text)) {
    violations.push("image text carries NSFW vocabulary (IMAGE-POLICY v2 §0.2)");
  }
  return { ok: violations.length === 0, violations };
}

/* ── 1b) DIRECT-IMAGE URL SHAPE (VISIBILITY-PREVIEW 2026-11-26) ─────── */

/**
 * The direct-image shape gate (owner order 2026-11-26 — «التأكد من أنه
 * رابط صورة مباشر وليس رابط صفحة عادية»): image_url must point at an
 * IMAGE FILE, never a product/HTML page. Extension-based classification:
 *   - IMAGE extensions (.jpg/.jpeg/.png/.webp/.avif/.gif/.svg) → ok;
 *   - PAGE/DOCUMENT extensions (.html/.htm/.php/.aspx/.jsp/.pdf…) → BLOCK
 *     (clear evidence the URL is a page, not an image);
 *   - NO extension (query-string CDN URLs exist) → WARN: ambiguous — the
 *     editor's "Verify image" probe (content-type: image/*) settles it.
 * Non-https schemes and malformed URLs are BLOCKED outright.
 */
const IMAGE_EXT_RE = /\.(jpe?g|png|webp|avif|gif|svg)(?:[?#]|$)/i;
const NON_IMAGE_DOC_RE = /\.(html?|php|aspx?|jsp|xhtml|pdf|docx?|xlsx?|txt|json|xml)(?:[?#]|$)/i;

export type AffiliateStoreImageUrlShape =
  | { verdict: "ok"; message: string }
  | { verdict: "warn"; message: string }
  | { verdict: "block"; message: string };

/** Shape-verdict for one image_url candidate (null/empty = the carved-icon default, ok). */
export function checkAffiliateStoreImageUrlShape(
  imageUrl: string | null | undefined,
): AffiliateStoreImageUrlShape {
  if (!imageUrl || imageUrl.trim() === "") {
    return { verdict: "ok", message: "no image — the carved category icon renders (IMAGE-POLICY ص-1 default)" };
  }
  const value = imageUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { verdict: "block", message: "image_url is not a valid absolute URL (expected https://…)" };
  }
  if (parsed.protocol !== "https:") {
    return { verdict: "block", message: `image_url must use https (got "${parsed.protocol}//")` };
  }
  if (NON_IMAGE_DOC_RE.test(parsed.pathname)) {
    return {
      verdict: "block",
      message: "image_url looks like a PAGE/DOCUMENT link, not a direct image (html/php/pdf/… rejected — use the image file URL)",
    };
  }
  if (IMAGE_EXT_RE.test(parsed.pathname)) {
    return { verdict: "ok", message: "image_url carries a direct image extension" };
  }
  return {
    verdict: "warn",
    message: "image_url has no image extension — ambiguous: run “Verify image” (the probe requires content-type image/*)",
  };
}

/* ───────────── 2) HALAL BLOCKLIST (§3.4-5 + screening §2-1) ───────── */

/**
 * The OPERATIONAL hard blocklist, verbatim from SUPPLEMENTS-FOOD-
 * SCREENING-EN.md §2-1 (the 2026-11-12 pork/alcohol deletion law):
 * any occurrence in the description/ingredients = automatic publish
 * rejection. NOTE: "alcohol-free"/"non-alcoholic" are handled by
 * hasHalalBlocklistHit being context-aware (see below).
 */
const HALAL_BLOCKLIST = [
  "pork",
  "lard",
  "bacon",
  "ethanol",
  "wine",
  "beer",
  "rum",
  "liquor",
  "liqueur",
] as const;

/**
 * Animal-derived UNKNOWN-origin ingredients — REVIEW FLAGS ONLY
 * (screening §2-2: the owner decides per product; never an auto-ban).
 */
export const ANIMAL_SOURCE_REVIEW_FLAGS = [
  "gelatin",
  "porcine",
  "rennet",
  "carmine",
  "shellac",
  "l-cysteine",
] as const;

const ALCOHOL_WORD = "alcohol";
/** Explicit alcohol-free markers (screening §2-2: «alcohol-free» الصريح مقبول). */
const ALCOHOL_FREE_MARKERS = [
  "alcohol-free",
  "alcohol free",
  "non-alcoholic",
  "nonalcoholic",
  "0% alcohol",
  "zero-alcohol",
];

/**
 * true when the text hits a halal blocklist word (WORD-BOUNDARY match —
 * "thumb" must never trip "rum", "swine" never trips "wine": the
 * blocklist is the screening doc's literal list, not a substring trap).
 * "alcohol"-family words are a hard hit UNLESS the phrase is an explicit
 * alcohol-free marker (the screening law allows the explicit
 * alcohol-free statement).
 * Returns the hit word (for the message) or null.
 */
export function hasHalalBlocklistHit(
  text: string | null | undefined,
): string | null {
  if (!text) return null;
  const value = text.toLowerCase();
  for (const word of HALAL_BLOCKLIST) {
    if (new RegExp(`\\b${word}\\b`, "i").test(value)) return word;
  }
  // alcohol-family: alcohol\w* covers "alcohol", "alcoholic",
  // "alcohols" — while the explicit markers stay allowed.
  if (/\balcohol\w*/i.test(value)) {
    const isExplicitlyFree = ALCOHOL_FREE_MARKERS.some((marker) =>
      new RegExp(`\\b${marker.replace(/[-%\d\s]/g, (m) => (m === " " ? "\\s" : m))}\\b`, "i").test(value) ||
        value.includes(marker),
    );
    if (!isExplicitlyFree) return ALCOHOL_WORD;
  }
  return null;
}

/** Returns the first animal-source review flag found (advisory), or null. */
export function findAnimalSourceReviewFlag(
  text: string | null | undefined,
): string | null {
  if (!text) return null;
  const value = text.toLowerCase();
  for (const flag of ANIMAL_SOURCE_REVIEW_FLAGS) {
    if (new RegExp(`\\b${flag}\\b`, "i").test(value)) return flag;
  }
  return null;
}

/* ───────────── 3) CLAIMS DISCIPLINE (screening §3) ───────────── */

/**
 * Disease-claim patterns (screening §3-1 — banned for ALL products):
 * diagnose/treat/cure/prevent/heal a disease/condition, or "FDA
 * approved"-style authority claims. Structure/function wording ("supports
 * muscle recovery", per the manufacturer) is the allowed register.
 */
const DISEASE_CLAIM_RE =
  /\b(diagnos\w*|treat\w*|cur\w*|heal\w*|prevent\w*)\b[^.]{0,40}\b(disease|illness|cancer|diabetes|diabetic|covid|obesity|arthritis|osteoporosis|hypertension|depression|anxiety|alzheimer|heart disease|stroke|infection|inflammation)\b/i;

const FDA_AUTHORITY_RE = /\bfda[ -]?(approved|certified|endorsed)\b/i;

/** true when the text carries a disease/authority claim. */
export function hasBannedClaim(text: string | null | undefined): boolean {
  if (!text) return false;
  return DISEASE_CLAIM_RE.test(text) || FDA_AUTHORITY_RE.test(text);
}

/* ───── 4) PRICE GUARD (§3.4-6 — no prices before the Phase-4 API) ──── */

/**
 * The Phase-1 law: price_usd MUST be null until the Creators-API order
 * (Phase 4) flips it. A manual price on publish is a BLOCKING violation
 * (the price clause: only API-served or API-obtained prices may display).
 */
export function hasManualPriceViolation(
  priceUsd: number | null | undefined,
): boolean {
  return priceUsd !== null && priceUsd !== undefined;
}

/* ── 5) NINTH GUARD: commissions are internal-only (§6-c, ratified) ── */

/**
 * Commission-rate context: any percentage tied to commission/earnings
 * wording. The internal rates live ONLY in docs/affiliate-store/COMMISSION-RATES.md
 * (admin docs + internal reports); the OWNER ORDER (2026-11-26) forbids
 * any rate on public store surfaces or as a marketing hook.
 */
const COMMISSION_CONTEXT_RE =
  /\b(commission|commissions|payout|payouts|referral fee|advertising fee|we earn|you earn|earning rate|fee rate)s?\b[^.]{0,60}\d{1,2}(?:\.\d{1,2})?\s*%/i;

const RATE_NEAR_COMMISSION_RE =
  /\d{1,2}(?:\.\d{1,2})?\s*%[^.]{0,40}\b(commission|commissions|payout|payouts)\b/i;

/** Documented rate strings from the internal table (COMMISSION-RATES.md). */
const DOCUMENTED_RATES = [
  "10.00%",
  "5.00%",
  "4.50%",
  "4.00%",
  "3.00%",
  "2.50%",
  "2.00%",
  "1.00%",
  "0.00%",
];

/**
 * NINTH GUARD: true when a text shows a commission RATE (either an
 * explicit documented rate string, or any % in commission/earnings
 * context). Applied to product title/summary/content at publish time
 * and to rendered public surfaces by the store canary. The mandated
 * disclosure sentences (no percentages) never match.
 */
export function hasCommissionRateText(
  text: string | null | undefined,
): boolean {
  if (!text) return false;
  if (COMMISSION_CONTEXT_RE.test(text)) return true;
  if (RATE_NEAR_COMMISSION_RE.test(text)) return true;
  return DOCUMENTED_RATES.some((rate) => text.includes(rate));
}

/* ───── 6) EDITORIAL FLOOR (§3.4-8 — advisory, NEVER a block) ──────── */

/** The advisory editorial floor (words) — a guideline, not Amazon policy. */
export const EDITORIAL_FLOOR_WORDS = 300;

/** Word count of the editorial content (whitespace-separated). */
export function editorialWordCount(
  content: string | null | undefined,
): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

/* ───────────── 7) THE AGGREGATED PUBLISH GATE ───────────── */

export type AffiliateStoreGuardSeverity = "block" | "warn";

export type AffiliateStoreGuardFinding = {
  rule: string;
  severity: AffiliateStoreGuardSeverity;
  message: string;
};

export type AffiliateStoreProductGuardInput = {
  asin?: string | null;
  title?: string | null;
  summary?: string | null;
  content?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  price_usd?: number | null;
};

/**
 * The full publish gate for one product (used by the admin publish API
 * and the seed validation). Returns findings; ANY "block" finding means
 * the product CANNOT be published. The editorial floor and the
 * animal-source flags are WARNINGS (the real owner-review gate is the
 * 0097 flow — review_status pending → reviewed).
 *
 * Guards applied (by law §3.4):
 *   1. stored tagged links (affiliate-store-link.ts §3.4-1)
 *   2. ASIN validity (non-standard ASIN = block)
 *   4. image law v2 §0 + Amazon domains (§3.4-4)
 *   5. halal blocklist (§3.4-5)
 *   6. manual price (§3.4-6)
 *   9. commission rates (ratified §6-c)
 *   +  claims discipline (screening §3) — block
 *   +  editorial floor (§3.4-8) — advisory warn only
 *   +  animal-source flags (screening §2-2) — advisory warn only
 */
export function runAffiliateStoreProductGuards(
  product: AffiliateStoreProductGuardInput,
): AffiliateStoreGuardFinding[] {
  const findings: AffiliateStoreGuardFinding[] = [];
  const fields: Array<[string, string | null | undefined]> = [
    ["title", product.title],
    ["summary", product.summary],
    ["content", product.content],
    ["image_url", product.image_url],
  ];
  // 527-G2 — THE SHELF GATE: no real image, no valid buy path → no
  // publish. These are BLOCKING findings (the auto-publish law 527-L2
  // means these guards are the only gate the product passes through).
  if (!product.image_url || product.image_url.trim() === "") {
    findings.push({
      rule: "shelf-image-required",
      severity: "block",
      message:
        "image_url is required — a product without its real image never appears on a public store surface (527-G2: «عدم نشر منتج... إذا كانت صورته الفعلية مفقودة»)",
    });
  }
  if (!isValidAsin(product.asin)) {
    findings.push({
      rule: "shelf-buy-link-required",
      severity: "block",
      message:
        "a valid ASIN is required — the product needs its real Amazon purchase path before it can publish (527-G2)",
    });
  }
  for (const [field, value] of fields) {
    if (value) {
      if (containsStoredAmazonLink(value)) {
        findings.push({
          rule: "stored-tagged-link",
          severity: "block",
          message: `${field}: contains a stored Amazon/tagged link — links are built from the ASIN at render time only (§3.4-1)`,
        });
      }
      if (hasCommissionRateText(value)) {
        findings.push({
          rule: "commissions-internal-only",
          severity: "block",
          message: `${field}: shows a commission rate — rates are internal-only and never public (§6-c, owner order 2026-11-26)`,
        });
      }
    }
  }
  if (product.asin) {
    if (!isValidAsin(product.asin)) {
      findings.push({
        rule: "asin-format",
        severity: "block",
        message: "asin: non-standard ASIN (expected B + 9 chars, or 10 digits) (§3.4-1)",
      });
    }
  }
  const image = checkAffiliateStoreImage(product.image_url, product.image_alt);
  for (const violation of image.violations) {
    findings.push({
      rule: "image-policy",
      severity: "block",
      message: violation,
    });
  }
  // DIRECT-IMAGE SHAPE (VISIBILITY-PREVIEW 2026-11-26): a page URL in
  // image_url is a BLOCK; an extension-less URL is a WARN (the editor's
  // content-type probe settles it).
  const imageShape = checkAffiliateStoreImageUrlShape(product.image_url);
  if (imageShape.verdict !== "ok") {
    findings.push({
      rule: imageShape.verdict === "block" ? "image-url-shape" : "image-url-ambiguous",
      severity: imageShape.verdict,
      message: `image_url: ${imageShape.message}`,
    });
  }
  const halalHit = hasHalalBlocklistHit(
    `${product.summary ?? ""}\n${product.content ?? ""}`,
  );
  if (halalHit) {
    findings.push({
      rule: "halal-blocklist",
      severity: "block",
      message: `description/content contains the blocklisted word "${halalHit}" (pork/alcohol law 2026-11-12 — §3.4-5)`,
    });
  }
  if (hasBannedClaim(`${product.summary ?? ""}\n${product.content ?? ""}`)) {
    findings.push({
      rule: "claims-discipline",
      severity: "block",
      message: "content carries a disease/authority claim (screening §3 — structure/function wording only)",
    });
  }
  if (hasManualPriceViolation(product.price_usd)) {
    findings.push({
      rule: "price-before-api",
      severity: "block",
      message: "price_usd is set — prices stay NULL until the Phase-4 Creators-API order (§3.4-6)",
    });
  }
  const animalFlag = findAnimalSourceReviewFlag(product.content ?? "");
  if (animalFlag) {
    findings.push({
      rule: "animal-source-flag",
      severity: "warn",
      message: `content mentions "${animalFlag}" (unknown animal origin — screening §2-2: owner review required, not an auto-ban)`,
    });
  }
  const words = editorialWordCount(product.content);
  if (words < EDITORIAL_FLOOR_WORDS) {
    findings.push({
      rule: "editorial-floor",
      severity: "warn",
      message: `editorial content is ${words} words (advisory floor ${EDITORIAL_FLOOR_WORDS} — §3.4-8: a guideline, never a publish blocker)`,
    });
  }
  return findings;
}

/** true when any finding blocks publishing (the admin API's hard stop). */
export function blocksPublish(findings: AffiliateStoreGuardFinding[]): boolean {
  return findings.some((f) => f.severity === "block");
}
