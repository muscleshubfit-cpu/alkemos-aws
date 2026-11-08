/* eslint-disable @next/next/no-img-element -- local, fixed-dimension brand
   assets (QR-asset precedent): a light+dark pair lets CSS pick the right
   one with ZERO hydration flicker (globals.css .theme-img-light/dark);
   next/image would double-preload both variants and cannot CSS-switch. */

/**
 * PageBanner — Phase 127 (owner directive: «الصور الجديدة (12 صورة) في
 * الريبو مخصصة للصفحات وليس للصفحة الرئيسية»).
 *
 * The owner's 12 header artworks (header-{section}-{light,dark}.webp,
 * 1280×477) are PAGE banners: one wide artwork strip at the top of each
 * hub page (tools / exercises / programs / foods / blog / pricing), NOT
 * homepage section banners (removed from LandingView in Phase 127).
 *
 * Server-component safe (plain <img> pair, no hooks). Decorative — the
 * page's real <h1> carries the semantics, so the banner is aria-hidden.
 */
export function PageBanner({
  section,
  className = "",
}: {
  section: "tools" | "exercises" | "programs" | "foods" | "blog" | "pricing";
  className?: string;
}) {
  /* P1-1 (PERFORMANCE-AUDIT-2026-11-08, owner order 2026-11-08): the
   * banner pair now ships responsive srcset (640/828/1280 prebuilt
   * variants — hero-light-* pattern, q85 method 6). Measured before:
   * every phone (390px CSS) downloaded the full 1280w file (exercises
   * 66.5KB = the heaviest image on the worst-LCP page of the audit,
   * 6.2s). Mobile now picks 640w (~50% saving). sizes reflects the
   * widest hub container (max-w-6xl px-4 → 1120px; tools' max-w-4xl
   * displays smaller — over-declaring keeps its desktop pick identical
   * to today's 1280w, zero regression). The layout-side BannerPreloads
   * mirrors these candidates exactly (preload/srcset parity law). */
  const sizes = "(max-width: 1152px) calc(100vw - 2rem), 1120px";
  return (
    <div
      className={`marble-card relative aspect-[1280/477] w-full ${className}`}
      aria-hidden="true"
    >
      {/* SEO-P2-12 (2026-10-01, audit item 12 «إضافة width وheight للصور
          الناقصة الأبعاد»): the banner pair were the ONLY public-SSR
          missing-dimension <img>s with no own aspect-ratio CSS (they rely
          entirely on this div's aspect-[1280/477]). Intrinsic 1280×477 is
          the prebuilt artwork size (phase136 scripts) — pinned here so the
          browser has the aspect hint in markup itself. CSS h-full w-full
          object-cover still governs rendering: zero visual change, and the
          canary seo-image-dimensions.test.ts locks the pair. */}
      <img
        src={`/images/brand/header-${section}-light.webp`}
        srcSet={`/images/brand/header-${section}-light-640.webp 640w, /images/brand/header-${section}-light-828.webp 828w, /images/brand/header-${section}-light.webp 1280w`}
        sizes={sizes}
        alt=""
        width={1280}
        height={477}
        className="theme-img-light h-full w-full object-cover"
        decoding="async"
        /* PHASE 137c: high priority — this banner is the page's LCP element
           (Lighthouse lcp-discovery). The root layout route-scoped preload
           starts the same URL at TTFB; this keeps priority high for the
           pre-hydration discovery path as well. */
        fetchPriority="high"
      />
      {/* PHASE 139 (deep speed audit): the dark variant MUST be
           loading="lazy" — a plain eager <img> is fetched by Chrome even
           while display:none hides it (measured: header-blog-dark.webp
           60KB downloaded in LIGHT mode, pure waste on every hub page).
           ThemeImg's dark img has always been lazy — this is why the
           homepage hero never leaked. lazy + display:none = never fetched;
           flipping the theme to dark reveals it and it loads then. */}
      <img
        src={`/images/brand/header-${section}-dark.webp`}
        srcSet={`/images/brand/header-${section}-dark-640.webp 640w, /images/brand/header-${section}-dark-828.webp 828w, /images/brand/header-${section}-dark.webp 1280w`}
        sizes={sizes}
        alt=""
        width={1280}
        height={477}
        className="theme-img-dark h-full w-full object-cover"
        decoding="async"
        loading="lazy"
      />
    </div>
  );
}
