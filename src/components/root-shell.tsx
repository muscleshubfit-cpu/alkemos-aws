import Script from "next/script";
import { Inter, Playfair_Display, Cairo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/use-auth";
import { ReferralCookieChecker } from "@/components/ReferralCookieChecker";
import { CoachSlugClaimer } from "@/components/CoachSlugClaimer";
import { CookieConsent } from "@/components/CookieConsent";
import { EvoWidgetLazy } from "@/components/EvoWidgetLazy";
import { getOrganizationSchema, getWebSiteSchema, jsonLd } from "@/lib/seo";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

/* Phase 136 (PSI variance fix, 2026-09-07) — next/font migration.
 * BEFORE: 13 @fontsource weight CSS imports (Inter 400-800, Cairo 400-800,
 * Playfair 500-700) = 8 woff2 files (~194KB) discovered only AFTER the
 * render-blocking CSS parsed, each with a plain system-font fallback whose
 * metrics differ from the webfont → the FOUT swap reflowed the ENTIRE page
 * container (Lighthouse layout-shifts: 0.187 of the 0.208 CLS, causes
 * "Web font loaded" inter-latin-700 + playfair-500). AFTER: one VARIABLE
 * font file per family (~40KB), preloaded in <head> in parallel with the
 * CSS, and next/font's automatic metric-adjusted fallback (size-adjust /
 * ascent-override) keeps the fallback swap geometrically identical → the
 * font reflow CLS is eliminated while text stays visible during load
 * (display: swap). Cairo keeps preload:false — its @font-face unicode-range
 * means only /ar pages ever download the arabic subset, and preloading it
 * on EN pages would be pure waste (EN homepage downloaded ZERO Cairo files
 * before and still does).
 *
 * PHASE 218 (D-01 — owner deferred-item reopened 2026-09-17): Cairo moved
 * swap → optional. The P2-5 "Arabic Fallback" face (globals.css) carries
 * Cairo's exact metrics, so a fallback render is geometrically identical —
 * which makes optional the radical CLS end-game: the ~0.04 transient swap
 * pulse on cold+slow first visits (the residue P2-5 documented) can no
 * longer occur, because the browser never swaps mid-page. Trade-off the
 * owner accepted by reopening the item: on a first cold+slow visit the
 * Arabic text may render in the metric-adjusted system face (Cairo is
 * downloaded in the background for FUTURE visits, which then render it
 * instantly from cache). Inter/Playfair stay swap — Latin fallbacks here
 * are metric-adjusted by next/font itself and their swap never measably
 * shifted layout (Phase 136 evidence). */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  preload: true,
});
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  // D-01 (Phase 218, owner decision 2026-09-17): optional — zero mid-page
  // swap ⇒ zero Cairo CLS pulse; first cold visit may fall back to the
  // metric-identical "Arabic Fallback" face (see the Phase 136/218 note above).
  display: "optional",
  variable: "--font-cairo",
  preload: false,
});

// Site-wide structured data (JSON-LD) — injected on every page.
// §12.40 (P2-14, audit finding #9): the schemas are LOCALE-AWARE, so they
// are built INSIDE the component from the resolved route locale — the EN
// homepage now carries English Organization/WebSite descriptions, /ar/*
// pages the Arabic ones (previously hardcoded Arabic on every surface).

/**
 * ROOT SHELL (VERCEL-USAGE-3, 2026-09-21) — the former single dynamic
 * root layout (src/app/layout.tsx), now a STATIC component mounted by the
 * per-locale route-group root layouts:
 *
 *   src/app/(en)/layout.tsx  → <html lang="en" dir="ltr"> (ads on)
 *   src/app/(app)/layout.tsx → <html lang="en" dir="ltr"> (ads off —
 *                              the authenticated/admin surface, where the
 *                              Phase-139 ad-free law applies wholesale)
 *   src/app/(ar)/layout.tsx  → <html lang="ar" dir="rtl"> (ads on)
 *
 * WHY: the old layout resolved the locale from middleware headers()
 * (and cookies()) — which opted EVERY route on the site into dynamic
 * rendering (Next.js: dynamic APIs in a layout make the whole tree
 * dynamic). The production build confirms it: ~110 page routes render
 * per-request, so every crawler hit on every one of the 8,830×2 food
 * pages / 868×2 exercise pages / blog / tools invoked a serverless
 * function with full React SSR — the measured driver of the Fluid
 * Active CPU overage (4h33m/4h), the 498K function invocations, and a
 * large share of Fast Origin Transfer.
 *
 * The ONLY inputs this shell needs are properties of the URL subtree —
 * locale, direction, and whether the AdSense loader belongs there — so
 * they arrive as STATIC props and every page under the shell becomes
 * statically prerenderable (ISR exports on the pages finally apply).
 *
 * F-5 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6, executed 2026-11-07):
 * the optional `prePaintLangDir` prop (set ONLY by the (app) group layout)
 * renders a theme-init-style pre-paint script that reads the saved
 * `mhe:lang` preference (browser-language fallback — the UrlLocaleSync
 * chain) and stamps lang/dir on <html> BEFORE first paint, so Arabic
 * returning users on the account surfaces no longer pay the full
 * LTR→RTL re-layout at hydration (the audit's R-5: /auth SSRs zero
 * Arabic then flips the whole page). The (en)/(ar) public groups do NOT
 * set it — their language is pinned by the URL (the audit's R-1 mixed
 * state is F-2, an owner decision, and must not be touched here).
 *
 * Per-route <head> resources moved DOWN to where they are statically
 * known (React 19 hoists <link> elements into <head> wherever they
 * render):
 *   - homepage hero preloads        → (en)/(home)/layout.tsx + (ar)/ar/(home)/layout.tsx
 *   - hub banner preloads           → the section layouts (blog, exercises,
 *                                     tools, foods, programs, memberships)
 *   - blog/exercises/referral preconnects → same places + referral page
 *
 * Lang/dir correctness is preserved EXACTLY: each group's root layout is
 * reached only by URLs of its own locale subtree (all Arabic routes live
 * under /ar/*), so no runtime resolution is needed anywhere.
 */
export default function RootShell({
  lang,
  dir,
  showAds,
  prePaintLangDir = false,
  children,
}: Readonly<{
  lang: "en" | "ar";
  dir: "ltr" | "rtl";
  showAds: boolean;
  /** F-5: (app) group only — stamp the saved/client-detected language
   * direction pre-paint (see the doc comment above). Default off. */
  prePaintLangDir?: boolean;
  children: React.ReactNode;
}>) {
  // §12.40 (P2-14): locale-aware entity schemas — see the note above the
  // component. Same two JSON-LD blocks as before, now describing the
  // entity in the page's own language (the STATIC lang prop).
  const organizationSchema = getOrganizationSchema(lang);
  const websiteSchema = getWebSiteSchema(lang);
  /* Phase 136 — ROUTE-SCOPED preconnects: the pathname-conditional blocks
   * that used to live here (blog/exercises/referral preconnects,
   * homepage hero preloads, hub banner preloads, Phase 137c) moved to the
   * section layouts and home layouts — see the RootShell doc comment.
   * Behavior is identical: React 19 hoists these <link> elements into
   * <head>, and each section layout's subtree matches the old
   * startsWith conditions exactly. */
  return (
    <html
      lang={lang}
      dir={dir}
      className={`${inter.variable} ${playfair.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* RSS autodiscovery (Phase 86) — site-wide feed links so readers,
            aggregators and AI engines discover the 6-articles/day pipeline */}
        <link rel="alternate" type="application/rss+xml" title="Alkemos Blog (English)" href="/rss.xml" />
        <link rel="alternate" type="application/rss+xml" title="مدونة Alkemos (عربي)" href="/ar/rss.xml" />
        {/* Route-scoped preconnects (Phase 136) moved to the section
            layouts — see the RootShell doc comment. */}
        {/* Structured data — Organization + WebSite (site-wide) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }}
        />
        {/* Phase 126 — Marble & Chrome themes: hero artwork preloads.
            P2 fix (2026-09-07): homepage-only (the hero never renders
            elsewhere, so preloading it on /blog etc. was pure waste).
            Phase 135: preloads are OS-SCHEME-SCOPED via the `media`
            attribute. Phase 136 (PSI variance fix): (1) fetchPriority=high
            — Lighthouse lcp-discovery flagged the LCP request un-prioritized;
            (2) imageSrcSet/imageSizes mirror the <img srcset> EXACTLY so the
            preload still matches after the responsive-variant change —
            a preload that stops matching the img's chosen candidate would
            download the ORIGINAL file (e.g. 96.6KB logo) on top of the
            smaller variant the img actually uses. Mobile now fetches
            hero-640 (12.4KB vs 37.3KB) and logo-256 (23.4KB vs 96.6KB). */}
        {/* PHASE 137c — hub banner artwork preloads (see the note above the
            return): PageBanner's own auto-preload arrives with the streamed
            page content (after the server data fetch); these start the same
            URLs at TTFB so the banner is LCP-ready immediately. The preload
            URL matches the <img src> exactly — no double download. */}
      </head>
      <body className="antialiased bg-background text-foreground">
        {/* Phase 126 — theme no-flash script: runs before first paint (first
            element in <body>): resolves the stored manual choice or falls
            back to the OS preference and stamps data-theme on <html>. Keeps
            SSR markup theme-neutral (CSS vars do the rest). */}
        <script
          id="alkemos-theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('alkemos-theme');var d=m==='dark'||m==='light'?m:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',d);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
        {/* F-5 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6): (app) group
            only — pre-paint lang/dir stamp on the theme-init pattern. The
            resolution chain mirrors UrlLocaleSync's non-/ar branch VERBATIM
            (saved mhe:lang → browser language → en) so the pre-paint value
            always matches what hydration will settle on: an Arabic returning
            user gets dir=rtl from the very first paint and only the TEXTS
            flip at hydration (no LTR→RTL re-layout — the audit's R-5).
            Stamps only the 'ar' case: 'en'/'ltr' is already the server's
            static default, so nothing is touched for English users. The
            suppressHydrationWarning on <html> (the theme-init precedent)
            absorbs the attribute delta; the i18n provider's useEffect then
            re-asserts the same values post-hydration. */}
        {prePaintLangDir && (
          <script
            id="alkemos-app-lang-init"
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var m=localStorage.getItem('mhe:lang');var l=(m==='ar'||m==='en')?m:((navigator.language||'').toLowerCase().indexOf('ar')===0?'ar':'en');if(l==='ar'){document.documentElement.lang='ar';document.documentElement.dir='rtl';}}catch(e){}})();`,
            }}
          />
        )}
        <a href="#main-content-skip" className="sr-only-focusable">
          Skip to content
        </a>
        {/* PHASE 137 (deep speed audit 2026-09-07): consent pre-paint script.
            CookieConsent is now SSR-rendered VISIBLE (it used to mount after
            hydration — Lighthouse flagged the late-painted banner as THE LCP
            element on /blog at 7.9s). Returning users with a stored consent
            get html[data-mhe-consent-ok] stamped HERE, before this point in
            the DOM is parsed, so globals.css hides the bar pre-paint — zero
            flash, zero late LCP, and the bar paints with FCP for cold visits. */}
        <script
          id="alkemos-consent-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('mhe_cookie_consent');if(s){var d=JSON.parse(s);if(d&&typeof d.timestamp==='number'&&Date.now()-d.timestamp<31536000000){document.documentElement.setAttribute('data-mhe-consent-ok','1');return;}}}catch(e){}})();`,
          }}
        />
        <ReferralCookieChecker />
        <CookieConsent initialLang={lang} />
        <I18nProvider urlLocale={lang}>
          <AuthProvider>
            {/* COACH ATTRIBUTION (0033) — claims a coach-signup cookie for
                Google OAuth clients (needs useAuth → inside AuthProvider). */}
            <CoachSlugClaimer />
            {/* C23 fix: wrap children in a div with id="main-content-skip"
                so the skip-to-content link always has a target, on both
                public pages (no <main id="main-content">) and app pages
                (AppLayout has its own <main id="main-content">). */}
            <div id="main-content-skip">{children}</div>
            {/* EVO Floating Widget — lazy (H5 audit 2026-09-05): loads
                after first paint via requestIdleCallback, off the critical
                path of every page. PHASE 216 (P2-4): the EvoChatProvider
                now mounts INSIDE EvoWidgetLazy with the widget — the only
                useEvoChat consumer is the widget itself, and mounting it
                here eagerly dragged the whole chat state machine (~48KB:
                tier + intent + persistence) into every page's critical
                bundle (measured). Eager CTAs open the widget via the
                event dispatcher in @/lib/evo-chat-events (zero deps). */}
            <EvoWidgetLazy />
          </AuthProvider>
        </I18nProvider>
        <Toaster position="top-center" richColors />
        <Script id="pwa-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                // Phase 128 cache fix: register with a version query so the
                // browser fetches the NEW worker immediately even if an old
                // /sw.js copy is still sitting in the HTTP cache (the update
                // check would otherwise reuse it for up to 24h). Keep this
                // query in sync with CACHE_VERSION in public/sw.js (v5 —
                // Phase 136 bump to drop pre-compression artwork caches).
                navigator.serviceWorker.register('/sw.js?v=5').then(function(reg) {
                  console.log('[PWA] Service Worker registered');
                }).catch(function(e) {
                  console.warn('[PWA] SW registration failed:', e);
                });
                // Phase 128 cache fix: when a NEW worker activates, it posts
                // SW_UPDATED to every client — reload once so all open tabs
                // pick up the fresh HTML + assets immediately (the old v3
                // worker kept serving stale brand artwork from Cache Storage).
                navigator.serviceWorker.addEventListener('message', function(e) {
                  if (e.data && e.data.type === 'SW_UPDATED') { location.reload(); }
                });
              });
            }
          `}
        </Script>
        {/* PHASE 178 — CONSENT MODE v2 (GDPR/ePrivacy gate), rendered
            ALWAYS (independent of GA_ID): AdSense is live in production
            and reads the gtag consent state; with no gtag on the page
            the banner's consent UPDATE could never reach it. The default
            state must be declared BEFORE any Google tag loads, then the
            visitor's STORED choice (the same mhe_cookie_consent record
            the pre-paint script reads) is applied pre-tag — consented
            traffic keeps serving personalized ads without a lost first
            signal, non-consenting traffic gets cookieless/denied mode.
            The GA loader below still only renders when GA_ID is set. */}
        <Script id="consent-mode-v2" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              wait_for_update: 500
            });
            try {
              var mcs = localStorage.getItem('mhe_cookie_consent');
              if (mcs) {
                var mcd = JSON.parse(mcs);
                if (mcd && typeof mcd.timestamp === 'number' && Date.now() - mcd.timestamp < 31536000000 && typeof mcd.granted === 'boolean') {
                  var st = mcd.granted ? 'granted' : 'denied';
                  gtag('consent', 'update', {
                    ad_storage: st, ad_user_data: st, ad_personalization: st, analytics_storage: st
                  });
                }
              }
            } catch (e) {}
          `}
        </Script>
        {GA_ID && (
          <>
            {/* PHASE 180 (CWV / Vercel Real Experience Score 27) — gtag.js
             * moved afterInteractive → lazyOnload. At 171KB transferred it
             * was ~14% of total page weight competing for bandwidth DURING
             * the LCP window on Egyptian 3G/4G (Lighthouse lab: 1.2MB page
             * → LCP 4.2-5.0s; the LCP image itself renders in <300ms — the
             * remaining seconds are network queuing). lazyOnload fetches
             * the tag only after the load event + browser idle, so it never
             * contends with the render path. Correctness notes:
             *   - Ordering vs consent-mode-v2 above is SAFE: afterInteractive
             *     scripts (consent default) execute right after hydration,
             *     lazyOnload scripts only after the window load event — the
             *     consent default is always pushed into dataLayer BEFORE
             *     gtag.js processes it.
             *   - GA events queue in window.dataLayer regardless of when the
             *     tag arrives; page_view is sent late but attributed
             *     correctly (GA uses its own timestamps). */}
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="ga-init" strategy="lazyOnload">
              {`
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}

        {/* Vercel Analytics — pageview + custom event tracking.
            No-op in dev or when not deployed on Vercel. Kept in
            VERCEL-USAGE-2 (2026-09-16): only 3.4K/50K events used.
            Speed Insights was REMOVED in the same frame — its beacon
            had burned 9.7K of the 10K free monthly events (Vercel
            usage report), and the site's analytics source of record is
            Google Analytics (cookie-policy documented). One-line
            revert: reinstall @vercel/speed-insights + re-mount
            <SpeedInsights /> + restore its CSP entries. */}
        <Analytics />

        {/* Google AdSense — only loaded when NEXT_PUBLIC_ADSENSE_CLIENT env
            var is set. Avoids loading AdSense on local dev or when the
            publisher hasn't been approved yet.
            Phase 136: moved from <head> to BODY-END. The loader is async so
            it never blocks parsing either way, but at body-end its ~240KB
            download (+~510ms of third-party main-thread work observed in
            Lighthouse while ads are under review and not even serving)
            starts AFTER the critical path — CSS, fonts, LCP image and the
            hydration chunks — instead of competing with them during the
            LCP window on slow mobile networks. The tag is still
            server-rendered in the initial HTML (the AdSense site review
            sees the code — do NOT make this client-side-only), and the
            AdSenseAd components queue their pushes in
            window.adsbygoogle, which the loader drains when it arrives.
            PHASE 139 (deep speed audit): route-scoped via the SHARED
            ad-free law (src/lib/ads-routes.ts) — the loader no longer
            ships ~220KB of third-party JS to /admin, /coach, /dashboard,
            /checkout, /auth and the other authenticated surfaces where
            ads are policy-forbidden anyway (AdSenseAd slots there render
            null). Public content pages keep the tag for the site review. */}
        {showAds && ADSENSE_CLIENT && (
          <>
            {/* PHASE 180 (CWV) — AdSense loader fetch DEFERRED to first
             * user interaction or browser idle (2.5s cap), whichever comes
             * first. WHY: adsbygoogle.js (56KB) + show_ads_impl (~163KB,
             * loaded by it) + gtag.js (171KB) ≈ 390KB of third-party JS
             * was fetched during the LCP window on every public page —
             * a third of the page's total weight — and show_ads_impl
             * produced 130-190ms long tasks 7-10s into the load (Lighthouse
             * long-tasks audit), hurting BOTH LCP (bandwidth contention on
             * 3G/4G) and INP. HOW: the script tag stays SERVER-RENDERED in
             * the initial HTML (site-review crawler still pattern-matches
             * the full adsbygoogle.js URL) but carries data-src instead of
             * src; the tiny activator below swaps in the real src on
             * pointerdown/keydown/scroll or requestIdleCallback. The
             * AdSenseAd components keep queueing their pushes in
             * window.adsbygoogle exactly as before — the queue is drained
             * whenever the loader arrives. AdSense below-fold slots lose
             * at most ~1-2s of unfilled time (they only count as viewable
             * when scrolled into view anyway). Absolute 6s safety net so
             * ads NEVER starve on browsers without rIC / background tabs. */}
            <script
              async
              data-src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
              crossOrigin="anonymous"
              id="adsense-loader"
            />
            <script
              id="adsense-activator"
              dangerouslySetInnerHTML={{
                __html: `(function(){
  var el = document.getElementById('adsense-loader');
  if (!el) return;
  var done = false;
  function activate(){
    if (done) return; done = true;
    var s = el.getAttribute('data-src');
    if (s) { el.setAttribute('src', s); el.removeAttribute('data-src'); }
  }
  ['pointerdown','keydown','touchstart','wheel','scroll'].forEach(function(ev){
    window.addEventListener(ev, activate, {once:true, passive:true});
  });
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(activate, {timeout: 2500});
  } else {
    setTimeout(activate, 2500);
  }
  setTimeout(activate, 6000);
})();`,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
