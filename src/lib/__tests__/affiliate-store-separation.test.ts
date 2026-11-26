import { describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { hasCommissionRateText } from "../affiliate-store-guards";

// The sitemap-route canary executes the REAL route handler; under
// vitest there is no Next incremental cache, so unstable_cache passes
// through (the pure query logic is what the canary exercises).
vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
  revalidateTag: () => undefined,
  revalidatePath: () => undefined,
}));

/**
 * AFFILIATE-STORE SEPARATION CANARIES (governing law §0 + §3.4-2/§3.4-3,
 * Phase-1 spec item 1.7; naming law UPDATED by the owner's rename order
 * 2026-11-26 «اعتمد affiliate_store الاسم البرمجي الرسمي والموحد لمتجر
 * منتجات الأفلييت» — migration 0118):
 *
 *  1. LANGUAGE SEPARATION (§0/§3.4-2): the (ar) tree carries NO store
 *     reference — no /affiliate-store (or legacy /store) path, no
 *     affiliate_store_ (or legacy store_) table, no store link, no
 *     store footer line. The store is English-only; the future Arabic
 *     store (System 3) is a separate namespace decided by its own
 *     founding order — zero of its entities exist.
 *  2. ARCHITECTURAL SEPARATION (§0/§3.4-3): affiliate-store code never
 *     touches the System-1 partner-referral family. NAMING LAW (post-
 *     0118): the store's entity family is affiliate_store_* (tables),
 *     /affiliate-store + /admin/affiliate-store (routes) and the
 *     affiliate-store-* libs/components — the owner's unified
 *     programmatic name. The word "affiliate" is allowed in these
 *     entity names because the prefix "affiliate_store_" is DISTINCT
 *     BY CONSTRUCTION from every System-1 entity (the partner family
 *     is affiliate_transactions, affiliate_commissions, referrals,
 *     referral_earnings, referral_payouts and the /referral routes —
 *     none of which the store may approach) and from the legal
 *     /affiliate-disclosure page.
 *  3. THE NINTH GUARD, SOURCE LEVEL (ratified §6-c): no public store
 *     surface source renders a commission rate — the internal table's
 *     rates live only in docs/store/COMMISSION-RATES.md (internal docs).
 */

const REPO_ROOT = resolve(__dirname, "../../../");
const AR_TREE = join(REPO_ROOT, "src/app/(ar)");
const STORE_SURFACES = [
  join(REPO_ROOT, "src/app/(en)/affiliate-store"),
  join(REPO_ROOT, "src/app/(en)/affiliate-disclosure"),
  join(REPO_ROOT, "src/components/affiliate-store"),
];
const STORE_CODE = [
  join(REPO_ROOT, "src/lib/affiliate-store-link.ts"),
  join(REPO_ROOT, "src/lib/affiliate-store-guards.ts"),
  join(REPO_ROOT, "src/lib/affiliate-store-server.ts"),
  join(REPO_ROOT, "src/lib/affiliate-store-admin.ts"),
  join(REPO_ROOT, "src/lib/affiliate-store-link-verify.ts"),
  join(REPO_ROOT, "src/app/(en)/affiliate-store"),
  join(REPO_ROOT, "src/app/(en)/affiliate-disclosure"),
  join(REPO_ROOT, "src/components/affiliate-store"),
  join(REPO_ROOT, "src/app/api/affiliate-store"),
  join(REPO_ROOT, "src/app/api/admin/affiliate-store"),
  join(REPO_ROOT, "src/app/(app)/admin/affiliate-store"),
  join(REPO_ROOT, "src/components/views/AffiliateStoreAdminView.tsx"),
  join(REPO_ROOT, "src/components/views/AffiliateStoreEditorView.tsx"),
];

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function existingRoots(roots: string[]): string[] {
  const out: string[] = [];
  for (const root of roots) {
    if (existsSync(root) && statSync(root).isFile()) {
      out.push(root);
    } else {
      out.push(...walk(root));
    }
  }
  return out;
}

describe("LANGUAGE SEPARATION (§0/§3.4-2) — the (ar) tree never references the affiliate store", () => {
  it("no /affiliate-store (or legacy /store) path, affiliate_store_ (or legacy store_) table, or store component appears in any (ar) source", () => {
    const offenders: string[] = [];
    for (const file of walk(AR_TREE)) {
      const text = readFileSync(file, "utf-8");
      if (
        text.includes("/affiliate-store") ||
        text.includes("affiliate_store") ||
        // legacy pre-0118 names — equally banned from the Arabic tree
        text.includes("/store") ||
        text.includes("store_")
      ) {
        offenders.push(file);
      }
    }
    expect(offenders, `affiliate-store references leaked into the Arabic tree: ${offenders.join(", ")}`).toEqual([]);
  });
});

describe("ARCHITECTURAL SEPARATION (§0/§3.4-3) — affiliate-store code never touches System 1", () => {
  it("no System-1 affiliate_/referral_ table or /referral route inside affiliate-store code", () => {
    const offenders: string[] = [];
    for (const file of existingRoots(STORE_CODE)) {
      const text = readFileSync(file, "utf-8");
      const usesSystem1 =
        /\b(affiliate_transactions|affiliate_commissions|referrals|referral_earnings|referral_payouts)\b/.test(
          text,
        ) || text.includes('"/referral') || text.includes("'/referral");
      if (usesSystem1) {
        offenders.push(file);
      }
    }
    expect(offenders, `System-1 references leaked into affiliate-store code: ${offenders.join(", ")}`).toEqual([]);
  });

  it("the affiliate_store_* family stays distinct from System-1 entity names (the 0118 naming law)", () => {
    // The unified programmatic name may carry the word "affiliate" ONLY
    // under the affiliate_store prefix. A bare System-1-shaped entity
    // (affiliate_<something-else> as a TABLE/ENTITY reference) inside
    // store code would be a naming-separation violation.
    const offenders: string[] = [];
    for (const file of existingRoots(STORE_CODE)) {
      const text = readFileSync(file, "utf-8");
      // flags affiliate_<X> where X is neither the literal "store"
      // word nor the "store_…" family — the bare prefix in prose
      // ("the affiliate_store name") is the LEGITIMATE unified name.
      const bareAffiliateEntity = /\baffiliate_(?!store(?:\b|_))[a-z][a-z_]*\b/.test(text);
      if (bareAffiliateEntity) {
        offenders.push(file);
      }
    }
    expect(offenders, `non-affiliate_store affiliate_* entity references inside store code: ${offenders.join(", ")}`).toEqual([]);
  });
});

describe("NINTH GUARD, SOURCE LEVEL (§6-c) — public store surfaces show no commission rates", () => {
  it("no public store surface source carries a commission rate", () => {
    const offenders: string[] = [];
    for (const file of existingRoots(STORE_SURFACES)) {
      const text = readFileSync(file, "utf-8");
      if (hasCommissionRateText(text)) {
        offenders.push(file);
      }
    }
    expect(offenders, `commission rates leaked onto public store surfaces: ${offenders.join(", ")}`).toEqual([]);
  });

  it("the internal rates table stays out of src/ entirely (it is docs-internal)", () => {
    // The documented rate strings (10.00% … 0.00%) appear in src/ only in
    // the guard's own detection list (affiliate-store-guards.ts) — never
    // in pages, components, or the public data layer.
    const offenders: string[] = [];
    for (const file of [
      ...walk(join(REPO_ROOT, "src/app/(en)/affiliate-store")),
      ...walk(join(REPO_ROOT, "src/components/affiliate-store")),
      ...walk(join(REPO_ROOT, "src/lib")).filter((f) => f.endsWith("affiliate-store-server.ts")),
    ]) {
      const text = readFileSync(file, "utf-8");
      for (const rate of ["10.00%", "5.00%", "4.50%", "4.00%", "3.00%", "2.50%", "2.00%", "1.00%"]) {
        if (text.includes(rate)) {
          offenders.push(`${file}: ${rate}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("SITEMAP-AFFILIATE-STORE (§1.6 + §0) — the EN-only sitemap child", () => {
  it("GET /sitemap-affiliate-store.xml emits the store hub with NO Arabic mirrors or hreflang", async () => {
    const { GET } = await import("../../app/sitemap-affiliate-store.xml/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(xml).toContain("<loc>https://alkemos.com/affiliate-store</loc>");
    expect(xml).not.toContain("/ar/");
    expect(xml).not.toContain("xhtml:link");
  });

  it("the sitemap INDEX declares the affiliate-store child, and robots.txt lists it", async () => {
    const { GET } = await import("../../app/sitemap.xml/route");
    const res = await GET();
    const xml = await res.text();
    expect(xml).toContain("https://alkemos.com/sitemap-affiliate-store.xml");
    const robots = readFileSync(join(REPO_ROOT, "public/robots.txt"), "utf-8");
    expect(robots).toContain("https://alkemos.com/sitemap-affiliate-store.xml");
  });
});
