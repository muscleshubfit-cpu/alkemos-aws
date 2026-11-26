/**
 * AMAZON CREATORS API CLIENT — the OFFICIAL Amazon product-data interface
 * for the Alkemos Affiliate Store's automation system (Phase 529, owner
 * order 2026-11-27 «نفّذ مرحلة بناء منظومة الأتمتة والتسويق الداخلي»).
 *
 * WHY THIS CLIENT EXISTS (the critical 2026 fact):
 *   Amazon RETIRED the Product Advertising API 5.0 (PA-API 5.0,
 *   webservices.amazon.com/paapi5/*) on 2026-05-15. The official — and
 *   ONLY sanctioned — successor for Associates product data is the
 *   **Amazon Creators API** (affiliate-program.amazon.com/creatorsapi):
 *
 *     base      https://creatorsapi.amazon/catalog/v1/{searchItems|getItems}
 *     auth      OAuth 2.0 client_credentials (Credential ID + Secret →
 *               bearer token, 1 h, cacheable)
 *     token     NA region: https://api.amazon.com/auth/o2/token
 *               (scope "creatorsapi::default", grant_type
 *               "client_credentials" — Login with Amazon's token host)
 *     headers   Authorization: Bearer … · Content-Type: application/json
 *               · x-marketplace: www.amazon.com
 *     params    lowerCamelCase (keywords, itemIds, partnerTag, resources)
 *     offers    offersV2.* resources (the PA-API Offers.* shape is gone)
 *
 *   Source: the official migration guide + API reference (fetched and
 *   documented in docs/store/AUTOMATION-EN.md §1). NO scraping anywhere —
 *   this module talks ONLY to the official endpoints above.
 *
 * ELIGIBILITY (external requirement, honestly reported):
 *   API access requires the Associates account to have ≥10 qualifying
 *   sales in the trailing 30 days and a Creators API registration in
 *   Associates Central. Until the owner provides Credential ID/Secret as
 *   environment secrets, every call fails with the typed
 *   MissingCredentialsError and the automation records an honest
 *   missing-credentials run (the EXCHANGERATE_API_KEY dormant precedent).
 *
 * LAWS:
 *  - SERVER-ONLY use (the fetch pipeline + admin routes); the credentials
 *    are never NEXT_PUBLIC, never logged, never echoed in errors
 *    (redacted messages only — the SECURITY.md discipline).
 *  - Pure + testable: fetch is injectable; the token cache is a plain
 *    module-level object that tests can reset.
 *  - Failures are TYPED (never swallowed): MissingCredentialsError,
 *    AuthError, RateLimitError, ApiError, InvalidResponseError — the
 *    pipeline maps each to an honest run outcome.
 *  - Rate discipline: sequential calls only (the caller loops), a 429
 *    raises RateLimitError after ONE bounded retry with backoff — the
 *    caller decides to skip/log, never to hammer.
 */

/* ───────────────────────── environment contract ───────────────────────── */

/**
 * The credential pair issued by Associates Central (Tools → Creators API).
 * Server-side only. Documented EMPTY in .env.example (the owner stages
 * them as GitHub repo secrets; deploy-aws.yml env-sync carries them to
 * /srv/alkemos/shared/.env when present).
 */
export const CREATORS_API_CREDENTIAL_ID_ENV = "AMAZON_CREATORS_API_CREDENTIAL_ID";
export const CREATORS_API_SECRET_ENV = "AMAZON_CREATORS_API_SECRET";

/** Optional region override: "na" (default) | "eu" | "fe" — selects the
 *  token host (credential-version regional endpoints from the docs). */
export const CREATORS_API_REGION_ENV = "AMAZON_CREATORS_API_REGION";

/** Optional marketplace override (default www.amazon.com — the store is
 *  a US-ASIN store by law, so this stays fixed unless the owner says). */
export const CREATORS_API_MARKETPLACE_ENV = "AMAZON_CREATORS_API_MARKETPLACE";

const TOKEN_HOSTS: Record<string, string> = {
  na: "https://api.amazon.com/auth/o2/token",
  eu: "https://api.amazon.co.uk/auth/o2/token",
  fe: "https://api.amazon.co.jp/auth/o2/token",
};

const API_BASE = "https://creatorsapi.amazon/catalog/v1";
const DEFAULT_MARKETPLACE = "www.amazon.com";
const TOKEN_TTL_MARGIN_MS = 5 * 60 * 1000; // refresh 5 min before expiry

export function creatorsApiTokenEndpoint(region?: string): string {
  const key = (region ?? "na").toLowerCase();
  return TOKEN_HOSTS[key] ?? TOKEN_HOSTS.na;
}

export function creatorsApiMarketplace(): string {
  return (process.env[CREATORS_API_MARKETPLACE_ENV] ?? "").trim() || DEFAULT_MARKETPLACE;
}

/* ───────────────────────── typed errors ───────────────────────── */

export class MissingCredentialsError extends Error {
  constructor() {
    super(
      "Amazon Creators API credentials are not configured (AMAZON_CREATORS_API_CREDENTIAL_ID / AMAZON_CREATORS_API_SECRET) — register for API access in Associates Central (requires 10 qualifying sales in the trailing 30 days), add the two repo secrets, and the automation activates on its next run",
    );
    this.name = "MissingCredentialsError";
  }
}

export class CreatorsAuthError extends Error {
  constructor(message: string) {
    super(`Creators API authentication failed: ${message}`);
    this.name = "CreatorsAuthError";
  }
}

export class CreatorsRateLimitError extends Error {
  constructor() {
    super("Creators API rate limit (HTTP 429) — the run yields; the next scheduled run retries");
    this.name = "CreatorsRateLimitError";
  }
}

export class CreatorsApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(`Creators API HTTP ${status}: ${message}`);
    this.name = "CreatorsApiError";
    this.status = status;
  }
}

export class CreatorsInvalidResponseError extends Error {
  constructor(message: string) {
    super(`Creators API returned an unexpected payload: ${message}`);
    this.name = "CreatorsInvalidResponseError";
  }
}

/* ───────────────────────── the OAuth2 token layer ───────────────────────── */

type CachedToken = { token: string; expiresAt: number };

/** Module-level token cache (one process = one token; refreshed 5 min
 *  early). Tests reset via __resetCreatorsApiTokenCacheForTests. */
let cachedToken: CachedToken | null = null;

export function __resetCreatorsApiTokenCacheForTests(): void {
  cachedToken = null;
}

export type FetchLike = typeof fetch;

async function fetchAccessToken(fetchImpl: FetchLike): Promise<string> {
  const credentialId = (process.env[CREATORS_API_CREDENTIAL_ID_ENV] ?? "").trim();
  const credentialSecret = (process.env[CREATORS_API_SECRET_ENV] ?? "").trim();
  if (!credentialId || !credentialSecret) {
    throw new MissingCredentialsError();
  }
  const region = (process.env[CREATORS_API_REGION_ENV] ?? "").trim();
  const tokenUrl = creatorsApiTokenEndpoint(region);
  const res = await fetchImpl(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: credentialId,
      client_secret: credentialSecret,
      scope: "creatorsapi::default",
    }),
  });
  if (!res.ok) {
    // Never include the body (it can echo credential fragments).
    throw new CreatorsAuthError(`token endpoint HTTP ${res.status}`);
  }
  const body = (await res.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number }
    | null;
  if (!body?.access_token || typeof body.expires_in !== "number") {
    throw new CreatorsInvalidResponseError("token response missing access_token/expires_in");
  }
  cachedToken = {
    token: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000 - TOKEN_TTL_MARGIN_MS,
  };
  return body.access_token;
}

async function accessToken(fetchImpl: FetchLike): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  return fetchAccessToken(fetchImpl);
}

/* ───────────────────────── response shapes ───────────────────────── */

/** The item subset this system consumes (the resources we request). */
export type CreatorsApiItem = {
  asin: string;
  detailPageURL?: string | null;
  images?: {
    primary?: {
      large?: { url?: string; width?: number; height?: number } | null;
      medium?: { url?: string; width?: number; height?: number } | null;
      small?: { url?: string; width?: number; height?: number } | null;
    } | null;
    variants?: Array<{
      large?: { url?: string; width?: number; height?: number } | null;
    }> | null;
  } | null;
  itemInfo?: {
    title?: { displayValue?: string } | null;
    features?: { displayValues?: string[] } | null;
    byLineInfo?: {
      brand?: { displayValue?: string } | null;
      manufacturer?: { displayValue?: string } | null;
    } | null;
  } | null;
  offersV2?: {
    listings?: Array<{
      price?: { amount?: number; currency?: string; displayAmount?: string } | null;
      availability?: { message?: string; type?: string } | null;
      isBuyBoxWinner?: boolean;
    }> | null;
  } | null;
  parentASIN?: string | null;
};

type ItemsResponse = {
  itemsResult?: { items?: CreatorsApiItem[] | null };
  errors?: Array<{ code?: string; message?: string }>;
};

/** The resources the fetch pipeline requests (documented set). */
export const FETCH_RESOURCES = [
  "images.primary.large",
  "itemInfo.title",
  "itemInfo.features",
  "itemInfo.byLineInfo",
  "offersV2.listings.price",
  "offersV2.listings.availability",
  "parentASIN",
] as const;

/* ───────────────────────── the API calls ───────────────────────── */

async function callApi(
  path: string,
  payload: Record<string, unknown>,
  fetchImpl: FetchLike,
): Promise<ItemsResponse> {
  const token = await accessToken(fetchImpl);
  const res = await fetchImpl(`${API_BASE}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-marketplace": creatorsApiMarketplace(),
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 429) {
    // ONE bounded backoff retry, then the typed error (the caller logs
    // and yields — hammering a throttled API is forbidden).
    await new Promise((r) => setTimeout(r, 1500));
    const retry = await fetchImpl(`${API_BASE}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-marketplace": creatorsApiMarketplace(),
      },
      body: JSON.stringify(payload),
    });
    if (retry.status === 429) throw new CreatorsRateLimitError();
    return consumeResponse(retry);
  }
  return consumeResponse(res);
}

async function consumeResponse(res: Response): Promise<ItemsResponse> {
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new CreatorsAuthError(`HTTP ${res.status} on the catalog call`);
    }
    throw new CreatorsApiError(res.status, "catalog call failed");
  }
  const body = (await res.json().catch(() => null)) as ItemsResponse | null;
  if (!body || typeof body !== "object") {
    throw new CreatorsInvalidResponseError("non-JSON body");
  }
  return body;
}

export type SearchItemsParams = {
  keywords: string;
  itemCount?: number; // 1..10 (docs)
  itemPage?: number; // 1..10 (docs)
  browseNodeId?: string;
  brand?: string;
  searchIndex?: string;
};

/**
 * searchItems — keyword search (availability: Available by default per
 * the docs, which is exactly the store's need: never list dead items).
 */
export async function creatorsApiSearchItems(
  params: SearchItemsParams,
  fetchImpl: FetchLike = fetch,
): Promise<CreatorsApiItem[]> {
  const payload: Record<string, unknown> = {
    keywords: params.keywords,
    itemCount: Math.min(Math.max(params.itemCount ?? 10, 1), 10),
    itemPage: Math.min(Math.max(params.itemPage ?? 1, 1), 10),
    partnerTag: (process.env.AMAZON_ASSOCIATES_TAG ?? "").trim(),
    marketplace: creatorsApiMarketplace(),
    resources: [...FETCH_RESOURCES],
  };
  if (params.browseNodeId) payload.browseNodeId = params.browseNodeId;
  if (params.brand) payload.brand = params.brand;
  if (params.searchIndex) payload.searchIndex = params.searchIndex;
  const body = await callApi("searchItems", payload, fetchImpl);
  return body.itemsResult?.items ?? [];
}

/**
 * getItems — details for a known ASIN set (batches of ≤10 per the docs;
 * this function chunks internally so callers can pass any list).
 */
export async function creatorsApiGetItems(
  asins: string[],
  fetchImpl: FetchLike = fetch,
): Promise<CreatorsApiItem[]> {
  const valid = asins.filter((a) => /^[A-Z0-9]{10}$/.test(a));
  if (valid.length === 0) return [];
  const out: CreatorsApiItem[] = [];
  for (let i = 0; i < valid.length; i += 10) {
    const chunk = valid.slice(i, i + 10);
    const body = await callApi(
      "getItems",
      {
        itemIds: chunk,
        itemIdType: "ASIN",
        partnerTag: (process.env.AMAZON_ASSOCIATES_TAG ?? "").trim(),
        marketplace: creatorsApiMarketplace(),
        resources: [...FETCH_RESOURCES],
      },
      fetchImpl,
    );
    out.push(...(body.itemsResult?.items ?? []));
  }
  return out;
}

/* ───────────────────────── field extractors ───────────────────────── */

/** The best available primary image URL (large → medium → small → first
 *  variant). Returns null when the item carries no image at all. */
export function itemPrimaryImage(item: CreatorsApiItem): string | null {
  const primary = item.images?.primary;
  const candidate =
    primary?.large?.url ?? primary?.medium?.url ?? primary?.small?.url ?? null;
  if (candidate) return candidate;
  const variant = item.images?.variants?.find((v) => v?.large?.url);
  return variant?.large?.url ?? null;
}

/** The item title (null-safe). */
export function itemTitle(item: CreatorsApiItem): string | null {
  return item.itemInfo?.title?.displayValue ?? null;
}

/** The brand (byLineInfo.brand → manufacturer). */
export function itemBrand(item: CreatorsApiItem): string | null {
  return (
    item.itemInfo?.byLineInfo?.brand?.displayValue ??
    item.itemInfo?.byLineInfo?.manufacturer?.displayValue ??
    null
  );
}

/** The buy-box listing (price + availability) — the first buy-box winner,
 *  else the first listing. */
export function itemBuyBox(item: CreatorsApiItem): {
  priceUsd: number | null;
  currency: string | null;
  displayAmount: string | null;
  availabilityMessage: string | null;
  availabilityType: string | null;
} {
  const listings = item.offersV2?.listings ?? [];
  const listing =
    listings.find((l) => l.isBuyBoxWinner === true) ?? listings[0] ?? null;
  return {
    priceUsd: listing?.price?.amount ?? null,
    currency: listing?.price?.currency ?? null,
    displayAmount: listing?.price?.displayAmount ?? null,
    availabilityMessage: listing?.availability?.message ?? null,
    availabilityType: listing?.availability?.type ?? null,
  };
}

/** Features (bullet points) — capped to keep payloads sane. */
export function itemFeatures(item: CreatorsApiItem, cap = 8): string[] {
  return (item.itemInfo?.features?.displayValues ?? []).slice(0, cap);
}

/* ───────────────────────── credentials status (booleans only) ────────── */

/** For the admin panel: which env pieces are present. NEVER the values. */
export function creatorsApiCredentialsStatus(): {
  credentialId: boolean;
  credentialSecret: boolean;
  associatesTag: boolean;
  region: string;
  marketplace: string;
} {
  return {
    credentialId: Boolean((process.env[CREATORS_API_CREDENTIAL_ID_ENV] ?? "").trim()),
    credentialSecret: Boolean((process.env[CREATORS_API_SECRET_ENV] ?? "").trim()),
    associatesTag: Boolean((process.env.AMAZON_ASSOCIATES_TAG ?? "").trim()),
    region: (process.env[CREATORS_API_REGION_ENV] ?? "").trim() || "na",
    marketplace: creatorsApiMarketplace(),
  };
}
