import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import RootShell from "@/components/root-shell";
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
export const dynamic = "force-dynamic";

/**
 * (APP) ROOT LAYOUT — VERCEL-USAGE-3 (2026-09-21).
 *
 * This group hosts the authenticated/admin surface that the Phase-139
 * ad-free law covers wholesale: /dashboard, /coach/*, /plans,
 * /progress, /questionnaires, /referral, /support (under (authed)/ with
 * its AuthGate + noindex) plus /admin, /profile, /checkout, /auth and
 * /preview (each keeps its own gating exactly as before).
 *
 * AdSense loader: OFF for the entire group — the loader tag disappears
 * from the authenticated surfaces by construction (the isAdFreePath()
 * per-request check it replaces no longer exists anywhere).
 *
 * NOTE: these routes are session-aware and stay server-rendered — that
 * is fine: the traffic-heavy CRAWLER surface (public content) is what
 * the usage crisis was measured on, and it lives in (en)/(ar).
 */
export default function AppGroupRootLayout({ children }: { children: ReactNode }) {
  return (
    // F-5 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6): prePaintLangDir —
    // the account surfaces stay server-static EN/LTR (the SSG/ISR law
    // below) but returning Arabic users now get dir=rtl stamped pre-paint
    // (root-shell's alkemos-app-lang-init), killing the R-5 full-page
    // LTR→RTL re-layout at hydration. The distant «split (app) into
    // language mirrors» idea stays an owner-gated architectural frame —
    // explicitly out of scope here.
    <RootShell lang="en" dir="ltr" showAds={false} prePaintLangDir>
      {children}
    </RootShell>
  );
}
