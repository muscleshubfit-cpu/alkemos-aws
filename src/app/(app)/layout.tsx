import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import RootShell from "@/components/root-shell";
import { LANG_COOKIE, normalizeLang } from "@/lib/surface-locale";
import { metadata, viewport } from "../metadata";

export { metadata, viewport };

// VERCEL-USAGE-3 (2026-09-21): the whole (app) subtree is session-aware
// (auth gates, admin panels, checkout). Under the old single dynamic root
// layout these pages were dynamic by inheritance; now that the root shell
// is static they must declare it EXPLICITLY or the build prerenders them
// (and session-dependent client code then explodes during export).
// Being dynamic is CORRECT for these surfaces — they are login-gated,
// excluded from the Cloudflare public-HTML cache, and a negligible share
// of crawler traffic (the usage-critical surface is the public content
// in (en)/(ar), which stays static/ISR).
//
// 449 NOTE: this `force-dynamic` is also what makes the cookie read below
// FREE — the subtree already renders per request, so resolving the UI
// language from the preference cookie adds zero rendering-mode cost (the
// exact reason the PUBLIC layouts must NOT do the same is pinned in
// surface-locale.ts + canaries: their static/ISR + edge-cache law).
export const dynamic = "force-dynamic";

/**
 * (APP) ROOT LAYOUT — VERCEL-USAGE-3 (2026-09-21) · 449 SURFACE LOCALE
 * LAW (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §11 — owner order
 * 2026-11-07).
 *
 * This group hosts the authenticated/admin surface that the Phase-139
 * ad-free law covers wholesale: /dashboard, /coach/*, /plans,
 * /progress, /questionnaires, /referral, /support (under (authed)/ with
 * its AuthGate + noindex) plus /admin, /profile, /checkout, /auth and
 * /preview (each keeps its own gating exactly as before).
 *
 * 449 — WHY THIS LAYOUT NOW READS THE PREFERENCE COOKIE: these are the
 * MIRROR-LESS special surfaces (documented owner decision — their URLs
 * carry NO language dimension; the LanguageToggle is the change
 * mechanism there). Pre-449 the shell was pinned to a static
 * lang="en" dir="ltr" and the client sync force-reset every non-/ar
 * pathname to English, so the admin panel could not stay Arabic
 * (live-reproduced on production: toggle → one sidebar link → full
 * revert to en/ltr; reload booted English even with mhe:lang=ar saved).
 * The surfaces are ALREADY force-dynamic + noindex + excluded from the
 * Cloudflare public-HTML cache (the SEO-GEO-4 private-path list), so
 * resolving the shell's lang/dir from the mhe:lang cookie here costs
 * NOTHING and server-renders the owner's language from the FIRST HTML:
 * no post-hydration flip on the account surfaces, correct RTL from
 * first paint, and the toggle's choice survives reloads.
 *
 * The PUBLIC trees are UNTOUCHED: (en)/(ar) stay static and NEVER read
 * cookies (F-2 Option A byte-identical — the URL governs public pages;
 * pinned by canaries in surface-locale.test.ts). The cookie itself is
 * CLIENT-written only (setLang / the legacy backfill) — this layout
 * only READS it; no server Set-Cookie is added anywhere.
 */
export default async function AppGroupRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // normalizeLang: only "ar" survives as Arabic; absent/invalid → "en"
  // (the documented default — no browser-language sniffing anywhere).
  const lang = normalizeLang((await cookies()).get(LANG_COOKIE)?.value);
  return (
    <RootShell lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} showAds={false}>
      {children}
    </RootShell>
  );
}
