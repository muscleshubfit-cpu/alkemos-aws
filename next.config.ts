import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: Do NOT set output: "standalone" — Vercel handles the build
  // output natively and expects the standard .next/ structure. Setting
  // standalone mode breaks Vercel's onBuildComplete step which looks
  // for .next/next-server.js.nft.json at its standard location.
  // TypeScript strict checks enabled — all @ts-nocheck removed, 0 errors
  typescript: {
  },
  // Allow dev origins for cloud preview environment
  allowedDevOrigins: [
    "*.run.app",
    "*.googleusercontent.com",
    "ais-dev-ye7h33vm5ffgyr4lhgmnmh-108459420502.europe-west3.run.app",
    "ais-pre-ye7h33vm5ffgyr4lhgmnmh-108459420502.europe-west3.run.app",
    "localhost:3000",
  ],
  // (Next.js 16 dropped support for `eslint` config in next.config.ts —
  // we now run eslint via `bun run lint` instead.)
  reactStrictMode: true,
  // Image optimization
  images: {
    // VERCEL FREE-TIER QUOTA GUARD (Phase 97, owner directive 2026-09-02):
    // the blog pipeline adds 3-5 photos per article × 6 articles/day across
    // EN+AR plus tool/landing/admin imagery — thousands of source images.
    // Vercel's free-tier Image Optimization quota would be exhausted almost
    // immediately and then EVERY next/image on the site starts failing/
    // throttling. `unoptimized: true` makes next/image render plain <img>
    // and serve the SOURCE URL directly — no /_next/image hop, no quota.
    // The load is already carried by the origin CDNs (Pexels/Pixabay/
    // Unsplash URLs ship compressed+resized via their own query params;
    // Supabase Storage serves originals). VERCEL-USAGE-2 (2026-09-16):
    // `sharp` was removed from the DIRECT dependencies (zero importers —
    // next@16 ships it itself via optionalDependencies when its optimizer
    // needs it). REVERTING optimization later = flip this flag AND
    // `bun add sharp` again. remotePatterns/formats/minimumCacheTTL
    // are kept untouched — dead under this flag but re-activating paid
    // optimization later is a ONE-LINE revert.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "randomuser.me" },
      { protocol: "https", hostname: "z-cdn.chatglm.cn" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // VERCEL-USAGE cleanup (2026-09-16): wger.de pattern removed with
      // its only consumer /api/exercise-image (dead route — exercise
      // images are self-hosted from public/images/exercises/ since
      // Batch 2 §12.53 item 2; zero live wger references remain).
      // Batch 2 (§12.53 item 2, 2026-09-16): exercise images are now
      // self-hosted from public/images/exercises/ — this pattern is DEAD
      // config kept only as the documented one-line rollback path (revert
      // exercise-images.ts IMAGE_BASE to the GitHub raw URL).
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "alkemos.com" },
      // Blog image pipeline (2026-08-28): Pexels is the PRIMARY featured
      // image source (real photography, people OK / NSFW screened) and
      // Pixabay a fallback. NOTE Phase 97: with images.unoptimized=true
      // these URLs are served as-is — their own CDN query params
      // (?auto=compress&cs=tinysrgb&w=…) are what keeps them lightweight.
      // image.pollinations.ai stays allow-listed only so legacy DB rows
      // render until the migration runner rewrites them to Pexels URLs.
      { protocol: "https", hostname: "image.pollinations.ai" },
      { protocol: "https", hostname: "pixabay.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      // Supabase Storage — hosts user-uploaded avatars, questionnaire photos,
      // and progress photos referenced via next/image in profile/admin views.
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
    minimumCacheTTL: 86400, // 24 hours
  },
  // Compression
  compress: true,
  // VERCEL-USAGE-3 (2026-09-21): function-trace hygiene for the Hobby
  // Functions Storage budget (14/10GB overage in the Sept cycle). Nothing
  // in the server trace legitimately needs static site assets or repo
  // housekeeping — these globs keep accidental references (a fs.read of
  // public/, an import of a fixture) from inflating every serverless
  // bundle across all retained deployments. Kept broad and cheap on
  // purpose: exclusions here never affect client bundles or static files.
  outputFileTracingExcludes: {
    "/**": [
      "public/**",
      "src/**/__tests__/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "docs/**",
      "archive/**",
      "**/*.md",
    ],
  },
  // EVO CHAT SURFACE LAW (2026-08-27): the floating widget is the ONLY
  // chat surface. The old full-page /chat route was removed — legacy
  // links/bookmarks land on the EVO page whose CTAs open the widget.
  async redirects() {
    return [
      { source: "/chat", destination: "/evo", statusCode: 301 },
      // ↑ P3-10/المؤكد-27 (deep-audit Phase 217 evaluation): was
      // `permanent: true` → HTTP 308, while this file's own documented
      // preference (the Phase-178/192 consolidation block below) is
      // statusCode 301 «for maximum crawler compatibility». The /chat
      // legacy redirect now follows the same law — one legacy GET
      // navigation, method-preservation is irrelevant.
      // ─────────────────────────────────────────────────────────────
      // PHASE 178 (§12.42) — keyword-cannibalization consolidation
      // (owner-approved 2026-09-12). The AR blog published 7 sleep
      // articles — FOUR answering literally «كم ساعة نوم أحتاجها لبناء
      // العضلات؟» — plus a duplicated beginners pair with IDENTICAL
      // titles. The 5 consolidated posts below are unpublished by
      // migration 0084 (sitemap/RSS/listings drop them automatically);
      // these permanent redirects route legacy URLs + search-engine
      // equity to the kept canonicals:
      //   - sleep-recovery-gym-results (impact angle) — kept
      //   - how-many-hours-sleep-for-muscle-growth (hours question) — kept
      //   - sleep-muscle-growth-science (science angle) — kept
      // The suffixed -1bbi/--3pc8 variants were slug-collision artifacts
      // of the same topic brief (documented pending decision in STATE.md,
      // resolved by the owner's batch approval).
      // ─────────────────────────────────────────────────────────────
      // 301 (statusCode) rather than `permanent: true` (→ HTTP 308):
      // every crawler and legacy client understands 301 — maximum
      // compatibility for search-engine equity transfer.
      { source: "/ar/blog/sleep-recovery-gym-results-3pc8", destination: "/ar/blog/sleep-recovery-gym-results", statusCode: 301 },
      { source: "/ar/blog/sleep-recovery-gym-results-1bbi", destination: "/ar/blog/how-many-hours-sleep-for-muscle-growth", statusCode: 301 },
      { source: "/ar/blog/sleep-hours-muscle-growth", destination: "/ar/blog/how-many-hours-sleep-for-muscle-growth", statusCode: 301 },
      { source: "/ar/blog/sleep-muscle-recovery-gym", destination: "/ar/blog/how-many-hours-sleep-for-muscle-growth", statusCode: 301 },
      { source: "/ar/blog/muscle-building-beginners-step-by-step", destination: "/ar/blog/how-to-start-muscle-building-beginners", statusCode: 301 },
      // ─────────────────────────────────────────────────────────────
      // PHASE 192 (2026-09-14 SEO/GEO audit — items 1+9, owner directive
      // «أعد توجيه المقالات المتطابقة فقط عندما يكون الدمج منطقيًا»):
      // two near-identical-intent duplicates consolidated — one primary
      // page per search intent. Migration 0087 unpublishes both rows
      // (content preserved in-table, same law as 0084); sitemap/RSS/
      // listings drop them automatically. Decisions + evidence (H2
      // structure comparison of both members in each pair) documented in
      // docs/SEO-GEO-MASTER-PLAN.md §12.49:
      //   - ar bodyweight guide → the no-equipment guide (same "complete
      //     no-equipment/bodyweight home guide" intent; survivor carries
      //     the movement library + weekly table + nutrition + recovery)
      //   - en 4-week beginner hypertrophy → the 4-week beginner
      //     day-by-day plan (same "beginner 4-week muscle plan" intent;
      //     survivor carries the schedule + overview + nutrition +
      //     recovery; the overload/split-design angle lives inside it)
      // 301 (not 308) for maximum crawler compatibility — same as 178.
      // ─────────────────────────────────────────────────────────────
      { source: "/ar/blog/muscle-building-bodyweight-home", destination: "/ar/blog/home-muscle-building-guide-no-equipment", statusCode: 301 },
      { source: "/blog/4-week-beginner-hypertrophy-plan", destination: "/blog/4-week-beginner-muscle-building-plan", statusCode: 301 },
      // ─────────────────────────────────────────────────────────────
      // AUDIT_REPORT.md §9-المرحلة 1, item 5 (2026-09-29) — the two
      // audit-CONFIRMED duplicate-intent pairs (F4) consolidated. The
      // four-article EN recovery cluster gets INTENT DIFFERENTIATION
      // instead (retitled by migration 0096 — each modality keeps its
      // own long-tail); the AR "دليل شامل" equipment pair (no-equipment
      // vs simple-weights) stays as legitimately distinct search
      // intents. Decisions + live evidence (H2-skeleton comparison)
      // documented in migration 0096 and the PHASE1-QUALITY-2026-09-29
      // worklog entry:
      //   - EN calories pair (title Jaccard 0.78 — both answer literally
      //     «How many calories should I eat to lose weight»): the
      //     7-day planner survives (exact-match question title,
      //     calculator/planner structure, no stuffing evidence); the
      //     beginner twin carried the audit's §10.2 keyword-stuffing
      //     live evidence.
      //   - AR design pair (same «تصميم برنامج تمارين بناء العضلات في
      //     المنزل» intent): the step-by-step guide survives; the
      //     plan twin's no-equipment angle is already comprehensively
      //     served by home-muscle-building-guide-no-equipment.
      // 301 (not 308) for maximum crawler compatibility — same as
      // 178/192. Migration 0096 unpublishes both rows (sitemap/RSS/
      // listings drop them automatically) in the same push.
      // ─────────────────────────────────────────────────────────────
      { source: "/blog/calories-to-lose-weight-build-muscle-beginner", destination: "/blog/calculate-daily-calories-fuel-fat-loss-bulking", statusCode: 301 },
      { source: "/ar/blog/muscle-building-home-workout-plan", destination: "/ar/blog/muscle-building-home-workout-guide", statusCode: 301 },
    ];
  },
  // COACH PUBLIC PHOTOS (Phase 56): CoachLandingEditor stores the
  // coach-public photo as a SAME-ORIGIN RELATIVE path
  // (/storage/v1/object/public/coach-public/<uid>/…) but nothing served
  // that path, so every coach-uploaded photo 404'd on the public page
  // (real-test finding, 2026-08-31). Proxy it to Supabase Storage —
  // guarded on the env being present at build time.
  async rewrites() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return [];
    return [
      {
        source: "/storage/v1/object/public/coach-public/:path*",
        destination: `${supabaseUrl}/storage/v1/object/public/coach-public/:path*`,
      },
    ];
  },
  // Enable experimental features for better performance
  experimental: {
    // Phase 139 removed framer-motion (zero importers, dead weight) and
    // Phase 140 dropped it here too — optimizePackageImports entries for
    // absent packages are dead config (guard-stale-refs philosophy).
    optimizePackageImports: ["lucide-react"],
  },
  // Async headers — support dynamic routes via function form
  async headers() {
    return [
      {
        // Service worker — must ALWAYS revalidate: the browser's SW update
        // check consults the HTTP cache for /sw.js; a cached copy would keep
        // running the previous phase's worker for up to 24h. Phase 128 cache
        // fix (owner: «الكاش أصبح صعب التحديث») — sw.js left the 24h group
        // below and got its own always-revalidate rule (mirrored in
        // vercel.json).
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        // Brand artwork pair changes between phases but KEEPS its filenames
        // (/images/brand/hero-light.webp etc.). Phase 128 set max-age=0
        // must-revalidate because the old blanket immutable 1y rule left the
        // owner staring at a stale hero for days. Phase 136 (speed variance
        // report): always-revalidate meant every repeat visit re-downloaded
        // the FULL hero+logo pair through Vercel (cf REVALIDATED + Vercel
        // MISS, full 200 body) — the exact "site feels slow" symptom.
        // NEW LAW: 5 minutes of freshness + 7 days of stale-while-revalidate.
        // Repeat visits serve the pair from cache instantly (0ms, no network
        // on the LCP path) while a phase flip propagates within ≤5 minutes
        // of normal browsing (hard refresh is still immediate). Cloudflare
        // and Vercel both honor stale-while-revalidate, so the edge behaves
        // the same way. (Also in vercel.json.)
        source: "/images/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Batch 2 — §12.53 item 2 (2026-09-16): the 868×2 self-hosted
        // exercise WebP assets (public/images/exercises/). The source
        // dataset is frozen (MIT, yuhonas/free-exercise-db) and the file
        // names are stable, so this is a legitimately immutable family —
        // long-cache law the audit recommended («كاش طويل»). Any future
        // re-encode ships under new filenames (or a versioned dir) to
        // avoid stale-cache conflicts. (Mirrored in vercel.json.)
        source: "/images/exercises/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Long-cache static assets (including ads.txt — served to Google's
        // AdSense crawler, same Cache-Control as robots.txt/sitemap.xml).
        // NOTE: sw.js is NOT here anymore (see its dedicated rule above).
        source: "/(sitemap.xml|robots.txt|ads.txt|manifest.json|favicon.ico|favicon.png|logo.png|logo.svg|icon-32.png|icon-192.png|icon-512.png|apple-touch-icon.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, must-revalidate",
          },
        ],
      },
      {
        // SEO-GEO-4 (2026-09-08, owner directive «ابدأ (ج) ثم (أ)» — audit
        // finding #5): the ORIGIN-side public-HTML cache policy. Phase 215
        // P1-5 verification (2026-09-16, owner decision «اعتمد الخيار (ب)»):
        // in PRODUCTION this header is NOT what browsers ultimately see —
        // Cloudflare sits in front and the zone cache rule «alkemos cache
        // rules» (created SEO-GEO-4 — expression = the private-path
        // exclusion list below + no-dot paths) is the OFFICIAL cache
        // layer: it rewrites the browser Cache-Control to `max-age=300`
        // and serves HTML from the edge. CACHE-POLICY-AUDIT 2026-10-22
        // (measured live via the CF API): edge_ttl is **43200** (raised
        // 3600 → 14400 (T-3) → 43200 (T-3b VERCEL-USAGE-4)) — NOT 3600.
        // This rule still governs what the ORIGIN emits and every
        // non-CF access path (preview URLs, direct hits) — the
        // documented intent:
        //   - Browsers (origin-direct): max-age=0 + must-revalidate →
        //     revalidate every visit (identical freshness to no-store).
        //   - CDN edge: s-maxage=3600 + stale-while-revalidate=86400.
        // Edge cacheability also requires NO Set-Cookie — the middleware
        // writes `mhe:locale` only when it changes (SEO-GEO-4), so the
        // vast majority of public responses are cacheable.
        // PRIVATE surfaces are EXCLUDED via the lookahead (api, admin,
        // auth, checkout, dashboard, questionnaires, progress, plans,
        // profile, support, referral, preview, coach — segment-exact
        // so /coaching and /coaches/* stay public) and keep no-store.
        // (The former `embed` segment was the EVO-6 partner surface —
        // removed 2026-09-10 by owner order.) The [^.]* tail keeps file
        // paths (robots.txt, sitemaps, llms.txt, rss.xml, assets) out —
        // they have their own rules above.
        source: "/((?!(?:api|admin|auth|checkout|dashboard|questionnaires|progress|plans|profile|support|referral|preview|coach)(?:/|$))[^.]*)",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
