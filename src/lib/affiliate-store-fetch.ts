/**
 * STORE-FETCH — the product fetch pipeline of the Alkemos Affiliate Store
 * automation system (Phase 529, owner order 2026-11-27).
 *
 * THE PIPELINE (one run):
 *   1. Credential gate — no Creators API credentials → an HONEST failed
 *      run recorded as 'missing-credentials' (the EXCHANGERATE dormant
 *      law: no fake data, no mock, no invented products).
 *   2. Overlap lock — claimAffiliateStoreFetchRun (DB partial unique).
 *   3. NEW PRODUCTS — for each ACTIVE fetch category (sequential, rate
 *      discipline): creatorsApiSearchItems(keywords) → candidate filter
 *      (valid ASIN, image present, not already in the DB, in-batch
 *      dedupe, per-category target) → creatorsApiGetItems(details) →
 *      transformCandidate → THE FULL STORE GUARDS (527-G: m.media-amazon
 *      image + ASIN + halal blocklist + claims discipline + female/
 *      immodest vocabulary on title/alt) → deterministic EN editorial
 *      draft → insert through the SAME guarded admin path (auto-publish
 *      law 527-L2) → cache flush.
 *   4. SYNC PASS — every PUBLISHED product's ASIN re-checked via
 *      getItems: price (API-served → payload + price_usd +
 *      price_updated_at; public display stays "See price on Amazon" per
 *      the documented Phase-4 decision), availability, image, title.
 *      Unavailable items → HIDE (is_published=false + availability note
 *      — never delete, the slug law) + their inline links deactivated.
 *   5. Run ledger — counters + events + honest status (succeeded /
 *      partial / failed); admin alert on failure (throttled to one per
 *      day); last_run_at stamped; caches flushed.
 *
 * LAWS INHERITED (all binding):
 *  - EN-only store; all generated editorial is English.
 *  - price clause (§3.4-6): ONLY API-served values ever touch price_usd —
 *    the manual/editor path still refuses prices (guard intact); public
 *    price display stays off until the Phase-4 owner order.
 *  - no stored tagged links (§3.4-1); commissions internal-only (§6-c).
 *  - image law (§0.1/§0.2): person-free product photos — the vocabulary
 *    gates reject female/immodest signals in title/alt; the fetch
 *    configs for person-photo-risk apparel classes are seeded OFF.
 *  - System 1 / System 3 untouched (§0).
 */

import {
  creatorsApiSearchItems,
  creatorsApiGetItems,
  creatorsApiCredentialsStatus,
  itemPrimaryImage,
  itemTitle,
  itemBrand,
  itemBuyBox,
  itemFeatures,
  MissingCredentialsError,
  CreatorsRateLimitError,
  type CreatorsApiItem,
  type FetchLike,
} from "./amazon-creators-api";
import {
  getAffiliateStoreAutomationSettings,
  listAffiliateStoreFetchCategories,
  claimAffiliateStoreFetchRun,
  finishAffiliateStoreFetchRun,
  appendAffiliateStoreRunEvent,
  markAffiliateStoreLastRun,
  type RunEvent,
  type AffiliateStoreAutomationSettingsView,
  type AffiliateStoreFetchCategoryView,
} from "./affiliate-store-automation";
import { runAffiliateStoreProductGuards, blocksPublish } from "./affiliate-store-guards";
import { adminUpsertAffiliateStoreProduct, flushAffiliateStoreCaches } from "./affiliate-store-admin";
import { deactivateAffiliateStoreLinksForProducts } from "./affiliate-store-linking";
import { isValidAsin } from "./affiliate-store-link";
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase/admin";
import type { Database } from "./supabase/types";
import { slugifyAscii } from "./slug";

type ProductUpdate = Database["public"]["Tables"]["affiliate_store_products"]["Update"];

/* ───────────────────────── run result shape ───────────────────────── */

export type FetchRunResult = {
  status: "succeeded" | "partial" | "failed" | "skipped";
  reason?: string;
  runId?: string;
  counters: {
    candidates: number;
    inserted: number;
    updated: number;
    unchanged: number;
    rejected: number;
    hidden: number;
  };
  error?: string;
};

const EMPTY_COUNTERS = {
  candidates: 0,
  inserted: 0,
  updated: 0,
  unchanged: 0,
  rejected: 0,
  hidden: 0,
};

/* ───────────────────────── candidate transform (pure) ───────────────────────── */

export type ProductCandidate = {
  asin: string;
  title: string;
  brand: string | null;
  image_url: string;
  image_alt: string;
  summary: string;
  content: string;
  slug: string;
  price_usd: number | null;
  availability: string | null;
  payload: Record<string, unknown>;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
};

/**
 * Distill Amazon feature bullets into SPEC LINES for the editorial body.
 * Drops any line hitting the halal blocklist or claims-discipline
 * patterns BEFORE it can poison the draft (the guards re-check the final
 * text — this is the pre-filter, not a replacement).
 */
export function distillSpecLines(features: string[], cap = 4): string[] {
  const banned = /\b(pork|lard|bacon|ethanol|wine|beer|rum|liquor|liqueur|alcohol\w*)\b/i;
  const claims = /\b(diagnos\w*|treat\w*|cur\w*|heal\w*|prevent\w*|fda[ -]?(approved|certified|endorsed))\b/i;
  const female = /\b(women|woman|girls?|females?|lad(?:y|ies)|feminine|sportswom[ae]n|womens)\b/i;
  const immodest = /\b(sexy|naked|nude|revealing|skimpy|seductive|erotic)\b/i;
  const out: string[] = [];
  for (const raw of features) {
    const line = raw.trim();
    if (!line || line.length < 8 || line.length > 220) continue;
    if (banned.test(line) || claims.test(line) || female.test(line) || immodest.test(line)) continue;
    // Sentence-case the first letter; strip trailing punctuation noise.
    const cleaned = line.replace(/\s+/g, " ").replace(/[.;,]+$/, "");
    out.push(cleaned);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * The deterministic EN editorial draft (the "never Amazon copy" law):
 * structured, unique prose assembled from the item's OWN data points
 * (title, brand, category, distilled specs, buy-box availability) plus
 * category-aware guidance paragraphs. No marketing claims, no disease
 * wording, no pricing text — structure/function register only.
 */
export function draftEditorialContent(input: {
  title: string;
  brand: string | null;
  categoryName: string;
  specs: string[];
}): string {
  const { title, brand, categoryName, specs } = input;
  const brandLine = brand ? `${brand} ` : "";
  const shortTitle = title.length > 90 ? `${title.slice(0, 87)}…` : title;

  const intro = [
    `The ${brandLine}${categoryName.toLowerCase()} category is where this product lives in the Alkemos Affiliate Store, and this page is our honest editorial take on it.`,
    `We link to ${shortTitle} because it fits the equipment and nutrition standards we use when we curate the shelf: clear specifications, a consistent brand behind it, and a listing that matches what shoppers actually receive.`,
    `Below you will find what the product is, who it suits, how to judge quality in this category, and how we think about using it inside a training week.`,
  ].join(" ");

  const what = [
    `## What it is`,
    `${shortTitle} is a ${categoryName.toLowerCase()} product${brand ? ` from ${brand}` : ""}. The listing's key specification lines, distilled from the manufacturer's published details, are:`,
    ...specs.map((s) => `- ${s}`),
  ].join("\n");

  const who = [
    `## Who it suits`,
    `Gear and nutrition choices are training decisions, not impulse buys.`,
    `A product in this category earns its place when it matches your actual training frequency, your space or nutrition targets, and your budget ceiling — not when it is simply the loudest listing on the shelf.`,
    `Read the specification lines above against your own program: if the capacity, size, format, or ingredient profile lines up with what your week demands, this is a candidate worth comparing on Amazon before you commit.`,
  ].join("\n");

  const how = [
    `## How to judge quality here`,
    [
      `Consistency of the brand's lineup and how long the product line has been sold.`,
      `Whether the published specifications match the category's honest baseline (weight ratings, material notes, serving sizes, or format details).`,
      `Whether the listing answers the practical questions you would ask in a shop: dimensions, care, compatibility, and contents.`,
    ]
      .map((s) => `- ${s}`)
      .join("\n"),
  ].join("\n");

  const use = [
    `## Using it in your week`,
    `Whatever the category, the discipline is the same: introduce one change at a time, keep your training log honest, and let two to three weeks of real use tell you whether the purchase is pulling its weight.`,
    `Our tools — the workout tracker, the meal planner, and the macro calculator — are free to use alongside any equipment or nutrition choice you make.`,
  ].join("\n");

  const closing = [
    `## Our editorial position`,
    `This page is editorial: we selected the product for the shelf, we describe it in our own words, and the buy button takes you to the live Amazon listing where the current price, stock, and seller information live.`,
    `As an Amazon Associate, Alkemos earns from qualifying purchases made through the store's links — the disclosure at the top of this page and next to every buy button is part of that arrangement, not a footnote.`,
  ].join("\n");

  return [intro, what, who, how, use, closing].join("\n\n");
}

/** A short card summary (≤200 chars, EN, claim-free). */
export function draftSummary(title: string, categoryName: string, specs: string[]): string {
  const spec = specs[0] ?? "";
  const base = `${categoryName} pick: ${title}`;
  const withSpec = spec ? `${base} — ${spec}` : base;
  return withSpec.length > 200 ? `${withSpec.slice(0, 197)}…` : withSpec;
}

/** Slug with collision avoidance: the products table enforces unique
 *  slugs — a second product with the same titleized slug gets the ASIN
 *  tail appended (deterministic, idempotent per ASIN). */
export function candidateSlug(title: string, asin: string, taken: Set<string>): string {
  const base = slugifyAscii(title).slice(0, 70);
  if (!base) return "";
  if (!taken.has(base)) return base;
  const withAsin = `${base.slice(0, 58)}-${asin.toLowerCase().slice(-4)}`;
  return withAsin;
}

/** Transform one API item into a product candidate (pure; guard-checked
 *  later by the pipeline — this function only shapes data). */
export function transformCandidate(
  item: CreatorsApiItem,
  category: { id: string; slug: string; name: string },
  takenSlugs: Set<string> = new Set(),
): ProductCandidate | null {
  const asin = item.asin ?? "";
  if (!isValidAsin(asin)) return null;
  const title = itemTitle(item);
  if (!title || title.trim().length < 5) return null;
  const image = itemPrimaryImage(item);
  if (!image) return null;
  const brand = itemBrand(item);
  const specs = distillSpecLines(itemFeatures(item));
  const buyBox = itemBuyBox(item);
  const slug = candidateSlug(title.trim(), asin, takenSlugs);
  if (!slug || slug.length < 3) return null;
  return {
    asin,
    title: title.trim().slice(0, 220),
    brand: brand ? brand.trim().slice(0, 120) : null,
    image_url: image,
    image_alt: `${title.trim().slice(0, 120)} — product photo`,
    summary: draftSummary(title.trim(), category.name, specs),
    content: draftEditorialContent({
      title: title.trim(),
      brand,
      categoryName: category.name,
      specs,
    }),
    slug,
    price_usd: buyBox.priceUsd,
    availability: buyBox.availabilityMessage
      ? buyBox.availabilityMessage.slice(0, 200)
      : null,
    payload: {
      source: "creators-api",
      fetched_at: new Date().toISOString(),
      detailPageURL: item.detailPageURL ?? null,
      parentASIN: item.parentASIN ?? null,
      buyBox: {
        priceUsd: buyBox.priceUsd,
        currency: buyBox.currency,
        displayAmount: buyBox.displayAmount,
        availabilityMessage: buyBox.availabilityMessage,
        availabilityType: buyBox.availabilityType,
      },
      features: specs,
    },
    categoryId: category.id,
    categorySlug: category.slug,
    categoryName: category.name,
  };
}

/* ───────────────────────── the pipeline ───────────────────────── */

function log(events: RunEvent[], kind: string, detail?: string) {
  events.push({ at: new Date().toISOString(), kind, detail: detail?.slice(0, 500) });
}

/** One admin bell alert per UTC day (failure visibility without spam). */
async function alertOncePerDay(kind: string, title: string, body: string, link: string): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const dedupe = `affiliate-store-automation:${kind}:${today}`;
    const { data } = await supabaseAdmin
      .from("admin_notifications")
      .select("id")
      .eq("type", "affiliate_store_automation")
      .contains("payload", { dedupe })
      .limit(1);
    if (data && data.length > 0) return;
    await supabaseAdmin.from("admin_notifications").insert({
      type: "affiliate_store_automation",
      title,
      body,
      link,
      target_role: "admin",
      payload: { dedupe, source: "affiliate-store-fetch" },
      read: false,
    });
  } catch {
    // best-effort by design — the run ledger is the durable record
  }
}

async function fetchExistingAsins(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return map;
  const { data } = await supabaseAdmin
    .from("affiliate_store_products")
    .select("id,asin");
  for (const row of (data ?? []) as Array<{ id: string; asin: string | null }>) {
    if (row.asin) map.set(row.asin, row.id);
  }
  return map;
}

async function fetchExistingSlugs(): Promise<Set<string>> {
  const set = new Set<string>();
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return set;
  const { data } = await supabaseAdmin.from("affiliate_store_products").select("slug");
  for (const row of (data ?? []) as Array<{ slug: string }>) set.add(row.slug);
  return set;
}

async function fetchPublishedProductsForSync(): Promise<
  Array<{ id: string; asin: string; image_url: string | null; title: string; is_published: boolean }>
> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("affiliate_store_products")
    .select("id,asin,image_url,title,is_published")
    .not("asin", "is", null);
  return (data ?? []) as Array<{
    id: string; asin: string; image_url: string | null; title: string; is_published: boolean;
  }>;
}

/**
 * THE SYNC PASS: re-check every product ASIN through getItems and write
 * the API-served data (price → payload/price_usd/price_updated_at,
 * availability, image refresh, title). Unavailable → hide + deactivate
 * its inline links (never delete — slug law).
 */
async function syncExistingProducts(
  products: Array<{ id: string; asin: string; image_url: string | null; title: string; is_published: boolean }>,
  fetchImpl: FetchLike,
  events: RunEvent[],
  counters: FetchRunResult["counters"],
): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin || products.length === 0) return;
  const byAsin = new Map(products.map((p) => [p.asin, p]));
  const hiddenIds: string[] = [];

  // chunks of 10 (the API's itemIds page size) — creatorsApiGetItems chunks internally
  const items = await creatorsApiGetItems(products.map((p) => p.asin), fetchImpl);
  const seen = new Set<string>();
  for (const item of items) {
    const product = byAsin.get(item.asin);
    if (!product) continue;
    seen.add(item.asin);
    const buyBox = itemBuyBox(item);
    const image = itemPrimaryImage(item);
    const title = itemTitle(item);
    const update: ProductUpdate = {
      payload: {
        source: "creators-api",
        fetched_at: new Date().toISOString(),
        buyBox: {
          priceUsd: buyBox.priceUsd,
          currency: buyBox.currency,
          displayAmount: buyBox.displayAmount,
          availabilityMessage: buyBox.availabilityMessage,
          availabilityType: buyBox.availabilityType,
        },
      },
      updated_at: new Date().toISOString(),
    };
    // API-served price (the price clause's allowed class — display stays off)
    if (buyBox.priceUsd !== null && buyBox.priceUsd > 0) {
      update.price_usd = buyBox.priceUsd;
      update.price_updated_at = new Date().toISOString();
    }
    if (buyBox.availabilityMessage) {
      update.availability = buyBox.availabilityMessage.slice(0, 200);
    }
    // image refresh ONLY through the trusted CDN host (527-G1)
    if (image && image !== product.image_url && /(^|\.)m\.media-amazon\.com$/.test(new URL(image).hostname)) {
      update.image_url = image;
    }
    if (title && title !== product.title) {
      update.title = title.trim().slice(0, 220);
    }
    // availability verdict: an explicit "unavailable"/"currently unavailable"
    // message hides the product (no dead shelves — 527-L3 spirit)
    const unavailable =
      (buyBox.availabilityType ?? "").toLowerCase().includes("unavailable") ||
      (buyBox.availabilityMessage ?? "").toLowerCase().includes("currently unavailable") ||
      (buyBox.availabilityMessage ?? "").toLowerCase() === "unavailable";
    if (unavailable) {
      update.is_published = false;
      update.availability = "Unavailable on Amazon (auto-hidden by the sync pass)";
      hiddenIds.push(product.id);
      counters.hidden += 1;
      log(events, "sync-hidden", `${item.asin}: unavailable on Amazon → hidden`);
    } else {
      counters.updated += 1;
      log(events, "sync-updated", `${item.asin}: data refreshed`);
    }
    await supabaseAdmin.from("affiliate_store_products").update(update).eq("id", product.id);
  }
  // ASINs the API no longer returns at all (delisted) → hide too
  for (const p of products) {
    if (p.is_published && !seen.has(p.asin)) {
      await supabaseAdmin
        .from("affiliate_store_products")
        .update({
          is_published: false,
          availability: "Not returned by the catalog API (auto-hidden by the sync pass)",
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
      hiddenIds.push(p.id);
      counters.hidden += 1;
      log(events, "sync-hidden", `${p.asin}: no longer in the API catalog → hidden`);
    }
  }
  // propagate hides to the inline-link layer (no dead internal links)
  if (hiddenIds.length > 0) {
    await deactivateAffiliateStoreLinksForProducts(hiddenIds);
  }
}

/**
 * THE FULL FETCH RUN. `fetchImpl` is injectable for tests; production
 * uses global fetch. Sequential, rate-disciplined, guard-gated.
 */
export async function runAffiliateStoreFetch(
  trigger: "cron" | "manual",
  fetchImpl: FetchLike = fetch,
): Promise<FetchRunResult> {
  const settings: AffiliateStoreAutomationSettingsView = await getAffiliateStoreAutomationSettings();
  const counters = { ...EMPTY_COUNTERS };
  const events: RunEvent[] = [];

  // 1) credential gate (honest dormancy — no mock data ever)
  const creds = creatorsApiCredentialsStatus();
  if (!creds.credentialId || !creds.credentialSecret) {
    const claim = await claimAffiliateStoreFetchRun(trigger, {
      ...settings,
      credentials: creds,
    });
    if (claim.ok) {
      await finishAffiliateStoreFetchRun(claim.runId, {
        status: "failed",
        errorSummary: "missing-credentials: Amazon Creators API Credential ID/Secret are not configured (register in Associates Central — requires 10 qualifying sales in the trailing 30 days — then add the two repo secrets)",
        events: [{ at: new Date().toISOString(), kind: "missing-credentials" }],
      });
      await markAffiliateStoreLastRun();
    }
    await alertOncePerDay(
      "missing-credentials",
      "متجر الأفلييت: بيانات اعتماد Amazon Creators API غير مُعدّة",
      "منظومة الجلب التلقائي تعمل بوضع الخمول الصادق: سجّل في Associates Central (يتطلب 10 مبيعات مؤهلة خلال آخر 30 يومًا) ثم أضف AMAZON_CREATORS_API_CREDENTIAL_ID وAMAZON_CREATORS_API_SECRET كأسرار في المستودع.",
      "/admin/affiliate-store/automation",
    );
    return {
      status: "failed",
      reason: "missing-credentials",
      counters,
      error: "Amazon Creators API credentials are not configured",
    };
  }

  // 2) the overlap lock
  const claim = await claimAffiliateStoreFetchRun(trigger, {
    ...settings,
    credentials: creds,
  });
  if (!claim.ok) {
    return {
      status: "skipped",
      reason: claim.reason,
      counters,
    };
  }
  const runId = claim.runId;

  try {
    // 3) NEW PRODUCTS per active fetch category
    const configs: AffiliateStoreFetchCategoryView[] = (await listAffiliateStoreFetchCategories())
      .filter((c) => c.is_active);
    const existingAsins = await fetchExistingAsins();
    const existingSlugs = await fetchExistingSlugs();
    const batchAsins = new Set<string>();
    let newInserted = 0;

    for (const cfg of configs) {
      if (newInserted >= settings.max_new_per_run) {
        log(events, "cap-reached", `max_new_per_run (${settings.max_new_per_run}) — remaining categories skipped`);
        break;
      }
      const keywords = cfg.keywords.slice(0, 3).join(" ");
      const pages = Math.min(Math.ceil(cfg.target_count / 10) || 1, 3);
      let categoryCandidates = 0;
      const candidates: ProductCandidate[] = [];

      for (let page = 1; page <= pages; page++) {
        const items = await creatorsApiSearchItems(
          { keywords, itemCount: 10, itemPage: page, browseNodeId: cfg.browse_node_id ?? undefined },
          fetchImpl,
        );
        for (const item of items) {
          counters.candidates += 1;
          if (!isValidAsin(item.asin)) {
            counters.rejected += 1;
            continue;
          }
          if (existingAsins.has(item.asin) || batchAsins.has(item.asin)) {
            continue; // dedupe by ASIN (the 0115 unique law)
          }
          const candidate = transformCandidate(
            item,
            { id: cfg.category_id, slug: cfg.category_slug, name: cfg.category_name },
            existingSlugs,
          );
          if (!candidate) {
            counters.rejected += 1;
            continue;
          }
          batchAsins.add(candidate.asin);
          candidates.push(candidate);
          categoryCandidates += 1;
        }
        if (items.length < 10) break; // no more pages
      }

      // guard-gate + insert (sequential; auto-publish law 527-L2)
      for (const candidate of candidates) {
        if (newInserted >= settings.max_new_per_run) break;
        const findings = runAffiliateStoreProductGuards({
          asin: candidate.asin,
          title: candidate.title,
          summary: candidate.summary,
          content: candidate.content,
          image_url: candidate.image_url,
          image_alt: candidate.image_alt,
          price_usd: null, // API price lives in payload — the public display law
        });
        if (blocksPublish(findings)) {
          counters.rejected += 1;
          log(
            events,
            "guard-rejected",
            `${candidate.asin}: ${findings.filter((f) => f.severity === "block").map((f) => f.rule).join(",")}`,
          );
          continue;
        }
        const result = await adminUpsertAffiliateStoreProduct({
          category_id: candidate.categoryId,
          asin: candidate.asin,
          slug: candidate.slug,
          title: candidate.title,
          summary: candidate.summary,
          content: candidate.content,
          brand: candidate.brand,
          image_url: candidate.image_url,
          image_alt: candidate.image_alt,
          editorial_rating: null,
        });
        if (result.ok) {
          newInserted += 1;
          counters.inserted += 1;
          existingAsins.set(candidate.asin, result.id);
          existingSlugs.add(candidate.slug);
          // store the API-served payload/price on the inserted row
          if (isSupabaseAdminConfigured && supabaseAdmin) {
            await supabaseAdmin
              .from("affiliate_store_products")
              .update({
                payload: candidate.payload as Database["public"]["Tables"]["affiliate_store_products"]["Update"]["payload"],
                price_usd: candidate.price_usd,
                price_updated_at: candidate.price_usd !== null ? new Date().toISOString() : null,
                availability: candidate.availability,
              })
              .eq("id", result.id);
          }
          log(events, "inserted", `${candidate.asin} → ${candidate.slug}`);
        } else {
          counters.rejected += 1;
          log(events, "insert-failed", `${candidate.asin}: ${result.error.slice(0, 200)}`);
        }
      }
      log(events, "category-done", `${cfg.category_slug}: ${categoryCandidates} candidates`);
    }

    // 4) sync pass over every product ASIN
    const products = await fetchPublishedProductsForSync();
    await syncExistingProducts(products, fetchImpl, events, counters);

    // 5) close the run
    const status: FetchRunResult["status"] =
      counters.rejected > 0 && counters.inserted === 0 && counters.updated === 0 && counters.hidden === 0
        ? "partial"
        : "succeeded";
    await finishAffiliateStoreFetchRun(runId, {
      status,
      counters,
      events,
      errorSummary:
        status === "partial"
          ? `${counters.rejected} candidates rejected by the guards (see events)`
          : null,
    });
    await markAffiliateStoreLastRun();
    await flushAffiliateStoreCaches();
    log(events, "run-closed", status);
    return { status, runId, counters };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const rateLimited = error instanceof CreatorsRateLimitError;
    await finishAffiliateStoreFetchRun(runId, {
      status: "failed",
      counters,
      events: [...events, { at: new Date().toISOString(), kind: rateLimited ? "rate-limited" : "error", detail: message }],
      errorSummary: message.slice(0, 500),
    });
    await markAffiliateStoreLastRun();
    await alertOncePerDay(
      rateLimited ? "rate-limited" : "fetch-failed",
      "متجر الأفلييت: فشل تشغيل الجلب التلقائي",
      rateLimited
        ? "واجهت المنظومة حد المعدل لواجهة Amazon Creators API — سيعيد الجدول المحاولة في الموعد التالي."
        : `فشلت عملية الجلب: ${message.slice(0, 300)}`,
      "/admin/affiliate-store/automation",
    );
    return { status: "failed", runId, counters, error: message };
  }
}

/** Exported for the admin run-now action (skips the due-check). */
export async function runAffiliateStoreFetchManual(): Promise<FetchRunResult> {
  return runAffiliateStoreFetch("manual");
}

// keep the unused-import guard honest (MissingCredentialsError is the
// documented typed error the cron route surfaces as 503)
export type _MissingCredentialsRef = MissingCredentialsError;
