import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { fetchBlogForOG } from "@/lib/blog-server";
import { getComparisonBySlug } from "@/lib/comparisons";
import { fetchRecipeDetail } from "@/lib/recipes-server";

/**
 * Dynamic OG image generator.
 *
 * GET /api/og-image/[slug]?lang=en|ar[&type=compare]
 *
 * Returns a 1200×630 PNG image optimized for social sharing (Twitter,
 * Facebook, LinkedIn, WhatsApp, Telegram). Generated on-the-fly using
 * next/og (Satori under the hood).
 *
 * Design (SOCIAL-OG-3, 2026-09-30): the card now mirrors the REAL brand
 * system — the light monochrome marble identity from globals.css
 * (--bg #FAF8F5, --text #201D1A, --edge #E5DFD6): warm off-white
 * diagonal gradient, near-black circle "A" mark + wordmark, near-black
 * title, warm-gray description/footer, machined hairline rules around
 * the title block. History: every card built before SOCIAL-OG-3 used a
 * dark #1d1d1f → #0071e3 Apple-blue gradient that matched nothing in
 * the brand (the site contains zero blue) — ~354 surfaces shared a card
 * that looked like a generic blue placeholder (the owner-reported
 * «المربع الأزرق»). The static family cards (scripts/generate-og-cards.py)
 * carry the same redesign — guarded visually by og-image-visual.test.ts.
 *
 * SOCIAL-OG-3 (2026-09-30, owner order «ابدأ التنفيذ للخطة»):
 *   7. `type=compare` is now honored: comparison slugs are looked up in
 *      src/lib/comparisons.ts (pure data — edge-safe) and render the
 *      real bilingual H1, not the generic default. Previously the route
 *      looked EVERY slug up in blog_posts, missed the 3 comparison
 *      slugs, and rendered a default-English title on all 6 comparison
 *      cards — even for ?lang=ar. The compare PAGES now ship STATIC
 *      cards (public/images/og/og-compare-<slug>-<lang>.png — no cold
 *      start on the crawler path); this branch keeps every legacy
 *      generator URL that platforms may still have cached correct.
 *   8. AR footer word order fixed: Satori renders flex children in DOM
 *      order and IGNORES `direction` for flex layout (verified
 *      empirically 2026-09-30 by rendering the fragment with next/og:
 *      DOM [مدونة, Alkemos] renders مدونة LEFT of Alkemos — the exact
 *      reversed-word-order defect the 2026-09-30 audit saw). The Arabic
 *      word must come LAST in the DOM so it renders RIGHTMOST: visual
 *      [Alkemos][مدونة] = correct RTL reading order.
 *
 * Phase 151 (2026-09-08 — AR OG bug): the previous implementation imported
 * ImageResponse from @vercel/og (bundled 2023-era Satori without Arabic
 * shaping/bidi). Every ?lang=ar request returned a 0-byte PNG, so ALL
 * Arabic articles shared broken cards — fixed by switching to next/og
 * (modern Satori with harfbuzz shaping + bidi) and self-hosting Cairo
 * (public/fonts/og-cairo-{400,700}.ttf, fetched same-origin on first
 * use, then cached module-level per warm isolate).
 *
 * VERCEL-USAGE-2 (2026-09-16): s-maxage caching (see headers below) so
 * crawler re-fetches stop re-running Satori. SOCIAL-OG (2026-09-22):
 * article og:image is COVER-FIRST (og.shareImage in blog-server.ts —
 * the real featured photo), so this generator is the FALLBACK path for
 * photo-less articles only; s-maxage 86400 keeps the first-platform-
 * fetch warm (the cold 1.7–5.2s render is exactly what crawlers time
 * out on).
 */

export const runtime = "edge";
export const maxDuration = 30;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://alkemos.com";

type CairoFont = {
  name: "Cairo";
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

// Module-level cache: one fetch pair per warm edge isolate.
let cairoFontsPromise: Promise<CairoFont[] | null> | null = null;

function loadCairoFonts(): Promise<CairoFont[] | null> {
  if (!cairoFontsPromise) {
    cairoFontsPromise = Promise.all([
      fetch(`${APP_URL}/fonts/og-cairo-400.ttf`),
      fetch(`${APP_URL}/fonts/og-cairo-700.ttf`),
    ])
      .then(async ([r400, r700]) => {
        if (!r400.ok || !r700.ok) return null;
        const [data400, data700] = await Promise.all([
          r400.arrayBuffer(),
          r700.arrayBuffer(),
        ]);
        return [
          { name: "Cairo", data: data400, weight: 400, style: "normal" },
          { name: "Cairo", data: data700, weight: 700, style: "normal" },
        ] as CairoFont[];
      })
      .catch(() => null);
  }
  return cairoFontsPromise;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const lang = (request.nextUrl.searchParams.get("lang") as "en" | "ar") || "en";
  // SOCIAL-OG-3 item 7: honor type=compare (legacy + fallback path).
  const type = request.nextUrl.searchParams.get("type");

  // Defaults if nothing is found
  let title = "Alkemos — Fitness & Nutrition Platform";
  let description = "AI-powered fitness & nutrition coaching platform";

  if (type === "compare") {
    const comparison = getComparisonBySlug(slug);
    if (comparison) {
      title = lang === "ar" ? comparison.h1Ar : comparison.h1En;
      description = lang === "ar" ? comparison.descriptionAr : comparison.descriptionEn;
    }
  } else if (type === "recipe") {
    // HEALTHY-RECIPES-PLATFORM (plan §7-5): the recipe card. Published
    // recipes are cover-first (the pair's REAL image as og:image — the
    // same file for both languages, the pairing law), so this branch is
    // the honest fallback for a photo-less pair only.
    try {
      const detail = await fetchRecipeDetail(slug, lang);
      if (detail) {
        title = detail.title;
        description = detail.excerpt;
      }
    } catch {
      // keep defaults
    }
  } else {
    try {
      const og = await fetchBlogForOG(slug, lang);
      if (og) {
        title = og.title;
        description = og.description;
      }
    } catch {
      // keep defaults
    }
  }

  // Truncate description to fit
  const descTruncated =
    description.length > 120
      ? description.slice(0, 117) + "…"
      : description;

  // Auto-fit font size based on title length
  const titleLength = title.length;
  const titleFontSize = titleLength > 80 ? 36 : titleLength > 50 ? 48 : titleLength > 30 ? 60 : 72;

  const fonts = await loadCairoFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          // SOCIAL-OG-3: the real brand palette — light warm marble,
          // never the retired blue gradient (visual law test guards it).
          background: "linear-gradient(135deg, #FAF8F5 0%, #EAE3D8 100%)",
          padding: 60,
          fontFamily: fonts ? "Cairo" : "sans-serif",
          color: "#201D1A",
        }}
      >
        {/* Header: brand — near-black circle "A" + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: "#201D1A",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>
            Alkemos
          </div>
        </div>

        {/* Title + description — framed by the machined hairline rules
            (the "1px machined edge" motif from the site's design system) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            borderTop: "2px solid #E5DFD6",
            borderBottom: "2px solid #E5DFD6",
            padding: "30px 0",
            maxWidth: 1080,
          }}
        >
          <div
            style={{
              fontSize: titleFontSize,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: -1,
              maxWidth: 1000,
              color: "#201D1A",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 400,
              color: "#6E675D",
              maxWidth: 900,
              lineHeight: 1.3,
            }}
          >
            {descTruncated}
          </div>
        </div>

        {/* Footer: URL — SOCIAL-OG-3 item 8: Satori renders flex children
            in DOM order and ignores `direction` for flex layout (verified
            empirically), so for AR the Arabic word comes LAST in the DOM
            and therefore renders RIGHTMOST: visual [Alkemos][مدونة] reads
            correctly right-to-left. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "#8A8378",
          }}
        >
          <div>alkemos.com</div>
          {lang === "ar" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div>Alkemos</div>
              <div>مدونة</div>
            </div>
          ) : (
            <div>Alkemos Blog</div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      ...(fonts ? { fonts } : {}),
      headers: {
        // VERCEL-USAGE-2: s-maxage lets Vercel's edge cache the PNG —
        // crawler re-fetches stop re-running Satori. SOCIAL-OG
        // (2026-09-22): 3600 → 86400 — a cold render is what social
        // crawlers time out on; one full edge day per slug+lang keeps
        // the first-platform-fetch warm.
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
