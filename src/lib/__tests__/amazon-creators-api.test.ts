import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * AMAZON CREATORS API CLIENT CANARIES (Phase 529 — the official
 * interface after Amazon retired PA-API 5.0 on 2026-05-15).
 *
 * Covers: the OAuth2 token flow (client_credentials, the LwA endpoint,
 * 1-hour caching), searchItems/getItems request shapes (lowerCamelCase
 * params + the documented resources), the field extractors, and every
 * typed honest-failure path (missing credentials / auth failure / rate
 * limit with the single bounded retry / invalid payload).
 */

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.stubEnv("AMAZON_CREATORS_API_CREDENTIAL_ID", "test-credential-id");
vi.stubEnv("AMAZON_CREATORS_API_SECRET", "test-credential-secret");
vi.stubEnv("AMAZON_ASSOCIATES_TAG", "ahmedzake-20");

import {
  __resetCreatorsApiTokenCacheForTests,
  creatorsApiSearchItems,
  creatorsApiGetItems,
  creatorsApiCredentialsStatus,
  itemPrimaryImage,
  itemTitle,
  itemBrand,
  itemBuyBox,
  itemFeatures,
  creatorsApiTokenEndpoint,
  MissingCredentialsError,
  CreatorsAuthError,
  CreatorsRateLimitError,
  type CreatorsApiItem,
} from "../amazon-creators-api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SAMPLE_ITEM: CreatorsApiItem = {
  asin: "B08EXAMPLE",
  detailPageURL: "https://www.amazon.com/dp/B08EXAMPLE?tag=ahmedzake-20",
  images: {
    primary: {
      large: { url: "https://m.media-amazon.com/images/I/51example._SL1200_.jpg", width: 1200, height: 1200 },
      medium: null,
      small: null,
    },
    variants: null,
  },
  itemInfo: {
    title: { displayValue: "Example Adjustable Dumbbell, 25 lb (Pair)" },
    features: { displayValues: ["Heavy duty handle", "Quick weight selection"] },
    byLineInfo: { brand: { displayValue: "ExampleFit" }, manufacturer: null },
  },
  offersV2: {
    listings: [
      {
        price: { amount: 129.99, currency: "USD", displayAmount: "$129.99" },
        availability: { message: "In Stock.", type: "Now" },
        isBuyBoxWinner: true,
      },
    ],
  },
  parentASIN: "B08PARENT",
};

beforeEach(() => {
  __resetCreatorsApiTokenCacheForTests();
  fetchMock.mockReset();
});

afterEach(() => {
  __resetCreatorsApiTokenCacheForTests();
});

describe("the OAuth2 token flow", () => {
  it("posts client_credentials to the regional LwA endpoint and caches the token", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "token-1", expires_in: 3600, token_type: "bearer" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ itemsResult: { items: [SAMPLE_ITEM] } }),
      );
    const items = await creatorsApiSearchItems({ keywords: "dumbbell" }, fetchMock);
    expect(items).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const tokenCall = fetchMock.mock.calls[0];
    expect(tokenCall[0]).toBe("https://api.amazon.com/auth/o2/token");
    const tokenBody = JSON.parse(String(tokenCall[1].body)) as Record<string, string>;
    expect(tokenBody.grant_type).toBe("client_credentials");
    expect(tokenBody.scope).toBe("creatorsapi::default");
    expect(tokenBody.client_id).toBe("test-credential-id");
    expect(tokenBody.client_secret).toBe("test-credential-secret");
    // the SECOND call reuses the cached token (no second token fetch)
    const catalogCall = fetchMock.mock.calls[1];
    const headers = catalogCall[1].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-1");
    expect(headers["x-marketplace"]).toBe("www.amazon.com");
  });

  it("maps the EU region to the uk token host", () => {
    expect(creatorsApiTokenEndpoint("eu")).toBe("https://api.amazon.co.uk/auth/o2/token");
    expect(creatorsApiTokenEndpoint("na")).toBe("https://api.amazon.com/auth/o2/token");
    expect(creatorsApiTokenEndpoint("unknown")).toBe("https://api.amazon.com/auth/o2/token");
  });

  it("raises CreatorsAuthError when the token endpoint rejects", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 401 }));
    await expect(
      creatorsApiSearchItems({ keywords: "x" }, fetchMock),
    ).rejects.toBeInstanceOf(CreatorsAuthError);
  });
});

describe("request shapes (the documented Creators API contract)", () => {
  it("searchItems sends lowerCamelCase params + the fetch resources", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "t", expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({ itemsResult: { items: [] } }));
    await creatorsApiSearchItems(
      { keywords: "whey protein", itemCount: 10, itemPage: 2, browseNodeId: "123456" },
      fetchMock,
    );
    const call = fetchMock.mock.calls[1];
    expect(call[0]).toBe("https://creatorsapi.amazon/catalog/v1/searchItems");
    const body = JSON.parse(String(call[1].body)) as Record<string, unknown>;
    expect(body.keywords).toBe("whey protein");
    expect(body.itemCount).toBe(10);
    expect(body.itemPage).toBe(2);
    expect(body.browseNodeId).toBe("123456");
    expect(body.partnerTag).toBe("ahmedzake-20");
    expect(body.marketplace).toBe("www.amazon.com");
    const resources = body.resources as string[];
    expect(resources).toContain("images.primary.large");
    expect(resources).toContain("itemInfo.title");
    expect(resources).toContain("offersV2.listings.price");
    expect(resources).toContain("offersV2.listings.availability");
  });

  it("getItems chunks ASIN batches of 10 and filters invalid ids", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "t", expires_in: 3600 }));
    // 25 valid + 2 invalid → 3 catalog calls
    for (let i = 0; i < 3; i++) {
      fetchMock.mockResolvedValueOnce(jsonResponse({ itemsResult: { items: [] } }));
    }
    const asins = [
      ...Array.from({ length: 25 }, (_, i) => `B08EXAMP${String(i).padStart(2, "0")}`),
      "bad",
      "",
    ];
    await creatorsApiGetItems(asins, fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(4); // 1 token + 3 chunks
    const second = JSON.parse(String(fetchMock.mock.calls[1][1].body)) as {
      itemIds: string[];
      itemIdType: string;
    };
    expect(second.itemIds).toHaveLength(10);
    expect(second.itemIdType).toBe("ASIN");
  });
});

describe("the honest failure paths", () => {
  it("throws MissingCredentialsError without any network call when the pair is absent", async () => {
    const original = process.env.AMAZON_CREATORS_API_CREDENTIAL_ID;
    vi.stubEnv("AMAZON_CREATORS_API_CREDENTIAL_ID", "");
    try {
      await expect(
        creatorsApiSearchItems({ keywords: "x" }, fetchMock),
      ).rejects.toBeInstanceOf(MissingCredentialsError);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.stubEnv("AMAZON_CREATORS_API_CREDENTIAL_ID", original ?? "");
    }
  });

  it("retries a 429 ONCE then raises CreatorsRateLimitError", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "t", expires_in: 3600 }))
      .mockResolvedValueOnce(new Response("{}", { status: 429 }))
      .mockResolvedValueOnce(new Response("{}", { status: 429 }));
    await expect(
      creatorsApiSearchItems({ keywords: "x" }, fetchMock),
    ).rejects.toBeInstanceOf(CreatorsRateLimitError);
    // token + first attempt + one retry = exactly 3 calls (no hammering)
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("succeeds when the 429 retry lands", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "t", expires_in: 3600 }))
      .mockResolvedValueOnce(new Response("{}", { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ itemsResult: { items: [SAMPLE_ITEM] } }));
    const items = await creatorsApiSearchItems({ keywords: "x" }, fetchMock);
    expect(items).toHaveLength(1);
  });
});

describe("the field extractors", () => {
  it("reads image/title/brand/buybox/features null-safely", () => {
    expect(itemPrimaryImage(SAMPLE_ITEM)).toBe(
      "https://m.media-amazon.com/images/I/51example._SL1200_.jpg",
    );
    expect(itemTitle(SAMPLE_ITEM)).toContain("Adjustable Dumbbell");
    expect(itemBrand(SAMPLE_ITEM)).toBe("ExampleFit");
    const buyBox = itemBuyBox(SAMPLE_ITEM);
    expect(buyBox.priceUsd).toBe(129.99);
    expect(buyBox.currency).toBe("USD");
    expect(buyBox.availabilityMessage).toBe("In Stock.");
    expect(buyBox.availabilityType).toBe("Now");
    expect(itemFeatures(SAMPLE_ITEM)).toHaveLength(2);
    // the null item
    const empty: CreatorsApiItem = { asin: "B000000000" };
    expect(itemPrimaryImage(empty)).toBeNull();
    expect(itemTitle(empty)).toBeNull();
    expect(itemBrand(empty)).toBeNull();
    expect(itemBuyBox(empty).priceUsd).toBeNull();
  });

  it("falls back to a variant image when primary is missing", () => {
    const item: CreatorsApiItem = {
      asin: "B08VARIANT",
      images: {
        primary: null,
        variants: [{ large: { url: "https://m.media-amazon.com/images/I/41variant.jpg" } }],
      },
    };
    expect(itemPrimaryImage(item)).toBe("https://m.media-amazon.com/images/I/41variant.jpg");
  });
});

describe("credentialsStatus (booleans only — never values)", () => {
  it("reports presence flags", () => {
    const status = creatorsApiCredentialsStatus();
    expect(status.credentialId).toBe(true);
    expect(status.credentialSecret).toBe(true);
    expect(status.associatesTag).toBe(true);
    expect(status.region).toBe("na");
    expect(status.marketplace).toBe("www.amazon.com");
    expect(JSON.stringify(status)).not.toContain("test-credential-secret");
  });
});
