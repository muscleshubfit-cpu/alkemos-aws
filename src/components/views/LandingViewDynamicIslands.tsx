"use client";

// ============================================================
// LandingViewDynamicIslands — SEO-P1-6 (frame 315, plan §5 steps
// 1–2): the homepage's two DATA-FETCH sections, split out of the
// old 1,851-line "use client" LandingView and loaded through
// next/dynamic (WITHOUT ssr:false — not allowed in a server
// component; the coaches strip still renders nothing on the
// server — its markup is gated on the fetched data).
//
// WHY a separate file from LandingViewIslands.tsx: the static
// islands (Reveal/CountUp/…) are imported by the server view at
// module level, so anything living in that file would ride the
// initial bundle. Keeping these islands in THEIR OWN module behind
// the dynamic() boundary takes them off the hydration-critical path
// (Next ships them as a NON-BLOCKING async script) and out of the
// page's main chunk graph — the KPI mandate of plan §2/§6 (islands
// file layout refinement, documented in the frame's worklog entry;
// the plan's island inventory and behavior contract are untouched).
//
// F-4 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6, executed
// 2026-11-07): BlogSection NO LONGER fetches — the carousel posts
// arrive as SERVER props (see its doc block below), so the section
// server-renders with the first HTML. The coaches strip keeps its
// mount-time fetch with silent failure (out of F-4's scope — it is
// the ad-gated «أعلن معنا» strip, not the content island). The
// locale arrives as an `isAr` prop from the server pages (the
// BlogListPage precedent: server-resolved, URL-pinned — see the
// plan's §3 boundary analysis).
// ============================================================

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { getCategoryLabel, type BlogPostCard } from "@/lib/blog";
import { EngravedIcon } from "@/components/ThemeImg";
import { CarouselShell, Reveal } from "./LandingViewIslands";

// ============================================================
// Site palette — the Marble & Chrome identity resolves through
// the CSS variables in globals.css (:root + [data-theme="dark"]).
// (Duplicated verbatim from the server view — plan §4.4.)
// ============================================================
const PALETTE = {
  textPrim: "var(--text)",
  textSec: "var(--muted-foreground)",
  textMuted: "var(--muted-foreground)",
  border: "var(--edge)",
  surface: "var(--card)",
  sectionWhite: "var(--bg)",
  sectionGray: "var(--tint)",
  halo: "var(--tint)",
};

function BlogCarousel({
  posts,
  featuredSlugs = [],
  isAr,
}: {
  posts: BlogPostCard[];
  /** Featured slugs render as the dark lead card; ONE carousel since
      Phase 198 Batch 2 (selection logic untouched). */
  featuredSlugs?: string[];
  isAr: boolean;
}) {
  const featuredSet = new Set(featuredSlugs);

  return (
    <CarouselShell isAr={isAr} ariaLabel={isAr ? "أحدث المقالات" : "Latest articles"}>
      {posts.map((post) => {
        const isFeatured = featuredSet.has(post.slug);
        return (
          <a
            key={post.id}
            href={`${isAr ? "/ar" : ""}/blog/${encodeURIComponent(post.slug)}`}
            className="marble-card card-lift group block shrink-0"
            style={{
              color: isFeatured ? "#F5F5F7" : PALETTE.textPrim,
              width: isFeatured ? "18rem" : "20rem",
              backgroundColor: isFeatured ? "#0B0B0D" : undefined,
            }}
          >
            {post.featured_image && (
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={post.featured_image}
                  alt={post.cover_alt || post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-5">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: isFeatured ? "rgba(245,245,247,0.65)" : "var(--muted-foreground)" }}
              >
                {getCategoryLabel(post.category, isAr ? "ar" : "en")}
              </p>
              <h3 className="mt-2 text-lg font-semibold leading-tight tracking-tight line-clamp-2">
                {post.title}
              </h3>
              {post.excerpt && (
                <p
                  className="mt-2 line-clamp-2 text-sm font-normal"
                  style={{ color: isFeatured ? "rgba(255,255,255,0.7)" : PALETTE.textSec }}
                >
                  {post.excerpt}
                </p>
              )}
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: isFeatured ? "#F5F5F7" : PALETTE.textPrim }}>
                <EngravedIcon name="scroll" alt="" size={14} className="h-3.5 w-3.5" />
                {isAr ? "اقرأ ›" : "Read ›"}
              </p>
            </div>
          </a>
        );
      })}
    </CarouselShell>
  );
}

// ── BlogSection — the #learn island. F-4
//    (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6, executed 2026-11-07):
//    the carousel posts now arrive as SERVER props (the two home route
//    pages fetch listPublishedPostsForListPage + run selectHomeBlogCarousels
//    at ISR time — the /blog list-page precedent and the getHomeSamples
//    pattern) instead of the old deferIdle(2500) + client REST fetch, so
//    the section renders inside the FIRST HTML (kills the audit's R-3
//    late layout shift) and every visit saves one Supabase REST round
//    trip. The copy strings still arrive as props from the server
//    (site-content registry). An empty `latestPosts` (failed/empty server
//    fetch) keeps the honest null render — the section simply doesn't
//    appear, exactly as before. ──
export function BlogSection({
  learnTitle,
  learnCta,
  isAr,
  latestPosts = [],
  featuredPosts = [],
}: {
  learnTitle: string;
  learnCta: string;
  isAr: boolean;
  /** F-4: server-selected newest posts (selectHomeBlogCarousels().latest). */
  latestPosts?: BlogPostCard[];
  /** F-4: server-selected rotating featured posts (… .featured). */
  featuredPosts?: BlogPostCard[];
}) {
  const { isCoach } = useAuth();

  const blogHref = isCoach ? "/admin/blog" : isAr ? "/ar/blog" : "/blog";

  if (latestPosts.length === 0) return null;
  return (
    <section id="learn" className="scroll-mt-20 bg-[var(--bg)] px-4 py-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {learnTitle}
          </h2>
        </Reveal>
        <div className="mt-10">
          <BlogCarousel
            posts={[...latestPosts, ...featuredPosts].slice(0, 10)}
            featuredSlugs={featuredPosts.map((p) => p.slug)}
            isAr={isAr}
          />
        </div>
        <div className="mt-6 text-center">
          <a href={blogHref} className="btn-outline px-6 py-2.5 text-sm font-medium">
            {learnCta}
            <span className="chev rtl:rotate-180" aria-hidden="true">›</span>
          </a>
        </div>
      </div>
    </section>
  );
}

// ── FeaturedCoachesStrip — the 0037 «أعلن معنا» paid-ad island
//    (moved verbatim: fetch at mount, silent failure, renders only
//    when active ads exist — a failed/empty call never affects the
//    homepage). The section copy arrives as props from the server
//    registry. ──
type FeaturedCoach = { slug: string | null; name: string; headline: string; photo: string | null };

export function FeaturedCoachesStrip({
  coachesTitle,
  coachesBody,
  isAr,
}: {
  coachesTitle: string;
  coachesBody: string;
  isAr: boolean;
}) {
  const [featuredCoaches, setFeaturedCoaches] = useState<FeaturedCoach[]>([]);

  useEffect(() => {
    // Silent fetch — the strip only renders when active ads exist, so a
    // failed/empty call must never affect the homepage.
    fetch("/api/coaches/featured")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setFeaturedCoaches(json?.coaches ?? []))
      .catch(() => setFeaturedCoaches([]));
  }, []);

  if (featuredCoaches.length === 0) return null;
  return (
    <section className="bg-[var(--bg)] px-4 pb-10 md:pb-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: PALETTE.textPrim }}>
          {coachesTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-base font-normal" style={{ color: PALETTE.textSec }}>
          {coachesBody}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {featuredCoaches.map((coach, i) => {
            const href = coach.slug ? `${isAr ? "/ar" : ""}/coaches/${coach.slug}` : "/coaching";
            return (
              <a
                key={`${coach.slug || coach.name}-${i}`}
                href={href}
                className="marble-card card-lift group block p-5 text-center"
              >
                {coach.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coach.photo}
                    alt={coach.name}
                    className="mx-auto h-16 w-16 rounded-full object-cover ring-4 ring-[var(--tint)]"
                  />
                ) : (
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[var(--edge)] bg-[var(--tint)] text-xl font-semibold text-[var(--text)]">
                    {(coach.name.trim().charAt(0) || "M")}
                  </div>
                )}
                <p className="mt-3 truncate text-sm font-semibold" style={{ color: PALETTE.textPrim }}>
                  {coach.name}
                </p>
                {coach.headline && (
                  <p className="mt-1 line-clamp-2 text-xs font-normal" style={{ color: PALETTE.textSec }}>
                    {coach.headline}
                  </p>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
