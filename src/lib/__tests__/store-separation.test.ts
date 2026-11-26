import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { hasCommissionRateText } from "../store-guards";

/**
 * STORE-SEPARATION CANARIES (governing law §0 + §3.4-2/§3.4-3, Phase-1
 * spec item 1.7):
 *
 *  1. LANGUAGE SEPARATION (§0/§3.4-2): the (ar) tree carries NO store
 *     reference — no /store path, no store_ table, no store link, no
 *     store footer line. The store is English-only; the future Arabic
 *     store is a separate namespace decided by its own founding order.
 *  2. ARCHITECTURAL SEPARATION (§0/§3.4-3): store code never touches the
 *     System-1 partner-referral family (affiliate_* tables, referral_*
 *     tables, /referral routes) — naming law: store_* + /store +
 *     /admin/store + AMAZON_ASSOCIATES_TAG belong to the product store
 *     ONLY; the word "affiliate" is allowed solely in non-entity names
 *     (the legal /affiliate-disclosure page + the mandated disclosure
 *     sentences themselves).
 *  3. THE NINTH GUARD, SOURCE LEVEL (ratified §6-c): no public store
 *     surface source renders a commission rate — the internal table's
 *     rates live only in docs/store/COMMISSION-RATES.md (internal docs).
 */

const REPO_ROOT = resolve(__dirname, "../../../");
const AR_TREE = join(REPO_ROOT, "src/app/(ar)");
const STORE_SURFACES = [
  join(REPO_ROOT, "src/app/(en)/store"),
  join(REPO_ROOT, "src/app/(en)/affiliate-disclosure"),
  join(REPO_ROOT, "src/components/store"),
];
const STORE_CODE = [
  join(REPO_ROOT, "src/lib/store-link.ts"),
  join(REPO_ROOT, "src/lib/store-guards.ts"),
  join(REPO_ROOT, "src/lib/store-server.ts"),
  join(REPO_ROOT, "src/lib/store-admin.ts"),
  join(REPO_ROOT, "src/app/(en)/store"),
  join(REPO_ROOT, "src/app/(en)/affiliate-disclosure"),
  join(REPO_ROOT, "src/components/store"),
  join(REPO_ROOT, "src/app/api/store"),
  join(REPO_ROOT, "src/app/(app)/admin/store"),
  join(REPO_ROOT, "src/components/views/StoreAdminView.tsx"),
  join(REPO_ROOT, "src/components/views/StoreEditorView.tsx"),
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

describe("LANGUAGE SEPARATION (§0/§3.4-2) — the (ar) tree never references the store", () => {
  it("no /store path, store_ table, or store component appears in any (ar) source", () => {
    const offenders: string[] = [];
    for (const file of walk(AR_TREE)) {
      const text = readFileSync(file, "utf-8");
      if (text.includes("/store") || text.includes("store_")) {
        offenders.push(file);
      }
    }
    expect(offenders, `store references leaked into the Arabic tree: ${offenders.join(", ")}`).toEqual([]);
  });
});

describe("ARCHITECTURAL SEPARATION (§0/§3.4-3) — store code never touches System 1", () => {
  it("no affiliate_/referral_ table or /referral route inside store code", () => {
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
    expect(offenders, `System-1 references leaked into store code: ${offenders.join(", ")}`).toEqual([]);
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
    // the guard's own detection list (store-guards.ts) — never in pages,
    // components, or the public data layer.
    const offenders: string[] = [];
    for (const file of [
      ...walk(join(REPO_ROOT, "src/app/(en)/store")),
      ...walk(join(REPO_ROOT, "src/components/store")),
      ...walk(join(REPO_ROOT, "src/lib")).filter((f) => f.endsWith("store-server.ts")),
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
