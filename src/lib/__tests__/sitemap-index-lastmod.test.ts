import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SITEMAP_LASTMOD,
  familyLastmod,
} from "@/lib/sitemap-lastmod";
import {
  buildSitemapIndex,
  type SitemapIndexEntry,
} from "@/lib/sitemap-xml";
import { blogIndexLastmod } from "@/lib/blog-sitemap";
import { GET as sitemapIndexRoute } from "@/app/sitemap.xml/route";

/**
 * P-3 / D-4 canaries (2026-11-05) — HONEST sitemap-index lastmod.
 *
 * The defect being pinned (SEO-COLLAPSE-AUDIT-2026-10-18 §2 P-3):
 * /sitemap.xml wrote <lastmod> = today for ALL six children on EVERY
 * regeneration. Google's Search Central docs are explicit that
 * <lastmod> feeds crawl scheduling only while dates look consistently
 * accurate, and gets ignored (or discounted) when they are not — so
 * the daily fabricated date neutralized the site's one programmatic
 * recrawl signal. These tests pin the fixed contract:
 *
 *   1. SERIALIZATION — buildSitemapIndex emits <lastmod> in W3C day
 *      precision when an entry carries a Date, and OMITS the tag when
 *      it does not (absence is honest; fabrication is not).
 *   2. BLOG MAX — blogIndexLastmod returns the greatest real
 *      published_at|updated_at, with NO fallback to "now", null on
 *      empty/absent data, and unparseable rows ignored.
 *   3. ROUTE LEVEL — the index route itself, with the clock FAKED to a
 *      far-future date and no Supabase env, emits the five family
 *      anchors + the blog child WITHOUT inventing that (or any) date:
 *      the old code would have stamped the fake "today" on every child.
 */

const W3C_DAY = /^\d{4}-\d{2}-\d{2}$/;

describe("buildSitemapIndex serialization (P-3)", () => {
  it("emits <lastmod> in W3C day precision when a Date is provided", () => {
    const entries: SitemapIndexEntry[] = [
      {
        loc: "https://alkemos.com/sitemap-pages.xml",
        lastModified: new Date("2026-11-04T14:23:00Z"),
      },
    ];
    const xml = buildSitemapIndex(entries);
    expect(xml).toContain(
      "<loc>https://alkemos.com/sitemap-pages.xml</loc>",
    );
    expect(xml).toContain("<lastmod>2026-11-04</lastmod>");
  });

  it("omits <lastmod> for entries without a date (no fake dates)", () => {
    const xml = buildSitemapIndex([
      { loc: "https://alkemos.com/sitemap-blog.xml" },
      { loc: "https://alkemos.com/sitemap-pages.xml", lastModified: familyLastmod("pages") },
    ]);
    // Blog child: no date supplied → tag absent, <loc> still present.
    expect(xml).toContain("<loc>https://alkemos.com/sitemap-blog.xml</loc>");
    expect(
      xml.match(/<sitemap>\s*<loc>https:\/\/alkemos\.com\/sitemap-blog\.xml<\/loc>\s*<\/sitemap>/),
    ).toBeTruthy();
    // Pages child still carries its anchor.
    expect(xml).toContain(`<lastmod>${SITEMAP_LASTMOD.pages}</lastmod>`);
  });

  it("escapes the loc but never injects markup through it", () => {
    const xml = buildSitemapIndex([
      { loc: "https://alkemos.com/a&b<c>.xml", lastModified: familyLastmod("pages") },
    ]);
    expect(xml).toContain("<loc>https://alkemos.com/a&amp;b&lt;c&gt;.xml</loc>");
  });
});

describe("blogIndexLastmod — the honest blog-child anchor (P-3)", () => {
  it("returns the greatest real date across rows (updated beats published)", () => {
    const max = blogIndexLastmod([
      { published_at: "2026-10-01T00:00:00Z", updated_at: null },
      { published_at: "2026-09-01T00:00:00Z", updated_at: "2026-11-03T08:00:00Z" },
      { published_at: "2026-08-01T00:00:00Z", updated_at: "2026-08-02T00:00:00Z" },
    ]);
    expect(max?.toISOString().slice(0, 10)).toBe("2026-11-03");
  });

  it("uses published_at when there is no updated_at", () => {
    const max = blogIndexLastmod([
      { published_at: "2026-10-31T00:00:00Z", updated_at: null },
    ]);
    expect(max?.toISOString().slice(0, 10)).toBe("2026-10-31");
  });

  it("NEVER falls back to now — empty/absent data returns null", () => {
    expect(blogIndexLastmod([])).toBeNull();
    expect(blogIndexLastmod(null)).toBeNull();
    expect(blogIndexLastmod(undefined)).toBeNull();
    expect(
      blogIndexLastmod([
        { published_at: null, updated_at: null },
        { published_at: null, updated_at: null },
      ]),
    ).toBeNull();
  });

  it("ignores unparseable date strings instead of poisoning the max", () => {
    const max = blogIndexLastmod([
      { published_at: "not-a-date", updated_at: "2026-10-29T00:00:00Z" },
    ]);
    expect(max?.toISOString().slice(0, 10)).toBe("2026-10-29");
  });
});

describe("sitemap.xml route — honest index under a faked clock (P-3)", () => {
  beforeEach(() => {
    // No Supabase env in the test environment → the blog child is
    // emitted WITHOUT <lastmod> (the honest-absence path).
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    // Freeze the clock on a far-future date: the OLD implementation
    // stamped new Date() (= this fake today) on every child.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-03-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("emits all seven children with the six family anchors and NO fabricated date", async () => {
    const res = await sitemapIndexRoute();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/xml");
    const xml = await res.text();

    // All seven children present (SEO-RECOVERY 2026-11-11: the
    // commercial child joined the index — the audit-13 §3 split).
    for (const child of [
      "sitemap-pages.xml",
      "sitemap-commercial.xml",
      "sitemap-collections.xml",
      "sitemap-comparisons.xml",
      "sitemap-exercises.xml",
      "sitemap-foods.xml",
      "sitemap-blog.xml",
    ]) {
      expect(xml).toContain(`<loc>https://alkemos.com/${child}</loc>`);
    }

    // The six static families carry their CENTRAL anchors (same
    // values their child sitemaps emit — index can never drift).
    for (const family of [
      "pages",
      "commercial",
      "collections",
      "comparisons",
      "exercises",
      "foods",
    ] as const) {
      expect(xml).toContain(
        `<lastmod>${SITEMAP_LASTMOD[family]}</lastmod>`,
      );
    }

    // THE P-3 regression guard: no fabricated "today" anywhere — with
    // the old code every child carried this exact fake date.
    expect(xml).not.toContain("2027-03-15");
    const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
      (m) => m[1],
    );
    expect(lastmods.length).toBe(6); // blog omitted (no env → no date)
    for (const value of lastmods) expect(value).toMatch(W3C_DAY);
  });

  it("family anchors and the emitted index dates are identical (no drift)", async () => {
    const res = await sitemapIndexRoute();
    const xml = await res.text();
    const emitted = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
      (m) => m[1],
    );
    const anchors = new Set<string>(
      (Object.keys(SITEMAP_LASTMOD) as Array<keyof typeof SITEMAP_LASTMOD>).map(
        (k) => SITEMAP_LASTMOD[k],
      ),
    );
    // Every emitted lastmod is one of the family anchors (blog absent).
    for (const value of emitted) expect(anchors.has(value)).toBe(true);
  });
});
