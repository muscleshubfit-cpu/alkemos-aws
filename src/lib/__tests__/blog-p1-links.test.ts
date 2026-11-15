import { describe, it, expect } from "vitest";
import { insertToolLinks } from "@/lib/blog-tool-links";
import { verifyInternalLinks, collectInternalBlogLinks } from "@/lib/blog-link-verify";

/**
 * P1 canaries — ART-5 (language-aware tool links + the AR mirror rewrite)
 * and ART-7 (deterministic internal-link verification).
 */

describe("ART-5 — tool links", () => {
  it("an AR article's model-planted EN tool link is REWRITTEN to the /ar mirror", () => {
    const md =
      "احسب سعراتك عبر [حاسبة السعرات](/tools/calorie-calculator) يوميًا لمتابعة التقدم.";
    const out = insertToolLinks(md, "ar");
    expect(out.md).toContain("](/ar/tools/calorie-calculator)");
    expect(out.md).not.toContain("](/tools/calorie-calculator)");
  });

  it("an AR article with no tool link gains the /ar mirror deterministically", () => {
    const md = "متابعة السعرات اليومية وكمية الماء أساس أي خطة ناجحة.";
    const out = insertToolLinks(md, "ar");
    expect(out.inserted.length).toBeGreaterThan(0);
    for (const ins of out.inserted) {
      expect(ins.url.startsWith("/ar/")).toBe(true);
    }
  });

  it("an EN article keeps the EN destinations", () => {
    const md = "tracking daily calories and water intake matters.";
    const out = insertToolLinks(md, "en");
    expect(out.inserted.length).toBeGreaterThan(0);
    for (const ins of out.inserted) {
      expect(ins.url.startsWith("/ar/")).toBe(false);
    }
  });
});

describe("ART-7 — internal link verification", () => {
  const loader = new Map<"en" | "ar", Set<string>>([
    ["en", new Set(["real-post", "another-post"])],
    ["ar", new Set(["real-ar-post"])],
  ]);
  const loadSlugs = async (lang: "en" | "ar") => loader.get(lang) ?? new Set<string>();

  it("a dead internal slug is unwrapped to its anchor text", async () => {
    const md = "See [the guide](/blog/real-post) and [the hallucinated one](/blog/ghost-post).";
    const out = await verifyInternalLinks(md, "en", { loadSlugs });
    expect(out.removed).toEqual(["/blog/ghost-post"]);
    expect(out.md).toContain("the hallucinated one");
    expect(out.md).not.toContain("](/blog/ghost-post)");
    expect(out.md).toContain("](/blog/real-post)");
  });

  it("a wrong-language prefix is unwrapped (EN article linking /ar/blog/...)", async () => {
    const md = "See [الدليل](/ar/blog/real-ar-post) for details.";
    const out = await verifyInternalLinks(md, "en", { loadSlugs });
    expect(out.removed).toEqual(["/ar/blog/real-ar-post"]);
  });

  it("the correct language's link survives", async () => {
    const md = "شاهد [الدليل](/ar/blog/real-ar-post).";
    const out = await verifyInternalLinks(md, "ar", { loadSlugs });
    expect(out.removed).toEqual([]);
    expect(out.md).toContain("](/ar/blog/real-ar-post)");
  });

  it("no loader → fail-open (nothing removed)", async () => {
    const md = "See [x](/blog/anything).";
    const out = await verifyInternalLinks(md, "en");
    expect(out.removed).toEqual([]);
  });

  it("collectInternalBlogLinks picks internal blog links only", () => {
    const md = "[a](/blog/x) [b](/ar/blog/y) [c](/tools/z) [d](https://ext.com/w) [e](/recipes/r)";
    expect(collectInternalBlogLinks(md).sort()).toEqual(["/ar/blog/y", "/blog/x"]);
  });
});
