import { Fragment } from "react";
import type { ReactNode } from "react";

/**
 * HUB HEAD RESOURCES (VERCEL-USAGE-3, 2026-09-21).
 *
 * The former single dynamic root layout rendered route-scoped preconnects
 * and hub-banner artwork preloads in <head> by reading the request path
 * from middleware headers() — the same call that forced EVERY page on the
 * site into dynamic rendering (the Fluid CPU / invocation driver behind
 * the Vercel Hobby usage overage).
 *
 * With the static RootShell those resources moved DOWN to the section
 * layouts where the subtree is statically known. React 19 hoists <link>
 * elements into <head> wherever they render, so the emitted markup and
 * load behavior are identical to the old layout-rendered tags.
 *
 * Section names mirror the old hubBannerSection chain in the root layout:
 * blog | exercises | tools | foods | programs | pricing (memberships).
 */

export function Preconnects({ hosts }: { hosts: string[] }) {
  return (
    <>
      {hosts.map((host) => (
        <Fragment key={host}>
          <link rel="preconnect" href={host} />
          <link rel="dns-prefetch" href={host} />
        </Fragment>
      ))}
    </>
  );
}

export function BannerPreloads({ section }: { section: string }) {
  /* P1-1 (PERFORMANCE-AUDIT-2026-11-08): the preloads now carry
   * imageSrcSet/imageSizes mirroring PageBanner's srcset/sizes exactly
   * (preload/srcset parity law — same as the homepage hero preloads):
   * the preloaded candidate is the one the <img> will pick, so mobile
   * preloads the 640w file instead of the old single 1280w URL. */
  const imageSrcSet = (theme: "light" | "dark") =>
    `/images/brand/header-${section}-${theme}-640.webp 640w, /images/brand/header-${section}-${theme}-828.webp 828w, /images/brand/header-${section}-${theme}.webp 1280w`;
  return (
    <>
      <link
        rel="preload"
        as="image"
        href={`/images/brand/header-${section}-light.webp`}
        imageSrcSet={imageSrcSet("light")}
        imageSizes="(max-width: 1152px) calc(100vw - 2rem), 1120px"
        media="(prefers-color-scheme: light)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={`/images/brand/header-${section}-dark.webp`}
        imageSrcSet={imageSrcSet("dark")}
        imageSizes="(max-width: 1152px) calc(100vw - 2rem), 1120px"
        media="(prefers-color-scheme: dark)"
        fetchPriority="high"
      />
    </>
  );
}

export function Resources({
  hosts = [],
  banner,
  children,
}: {
  hosts?: string[];
  banner?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <Preconnects hosts={hosts} />
      {banner && <BannerPreloads section={banner} />}
      {children}
    </>
  );
}
