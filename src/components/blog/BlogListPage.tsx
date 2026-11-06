"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageBanner } from "@/components/PageBanner";
import { ShareButtons } from "@/components/ShareButtons";
import { sizedRemoteImage } from "@/lib/remote-image-size";

import { useEffect, useState } from "react";
import { listBlogPosts, BLOG_CATEGORIES, getCategoryLabel, type BlogPostCard } from "@/lib/blog";

export function BlogListPage({
  lang,
  initialPosts,
}: {
  lang: "en" | "ar";
  /** Server-fetched posts (SSR, H1 audit fix) — seed the first render. */
  initialPosts?: BlogPostCard[];
}) {
  const isAr = lang === "ar";
  const [posts, setPosts] = useState<BlogPostCard[]>(initialPosts ?? []);
  const [loading, setLoading] = useState(!initialPosts);
  const [search, setSearch] = useState("");

  // §12.40 (P2-14, audit finding #8): the WebSite schema's SearchAction
  // declares /blog?search={search_term_string} as the site search target —
  // landing on that URL must actually SHOW filtered results. Previously the
  // param was ignored: the visitor (or AI engine following the schema) got
  // the full unfiltered list. One-shot deep-link seed, client-side AFTER
  // hydration: reads ?search= from the address bar and feeds it into the
  // existing search state → the posts effect below refetches the filtered
  // list through the SAME path as a typed search (matchesBlogSearch law).
  //
  // Deliberately NOT useSearchParams(): that hook would force the whole
  // /blog route out of ISR into per-request dynamic rendering (and needs a
  // Suspense boundary on static pages). window.location in an effect is
  // client-only and hydration-safe (initial SSR state stays ""), so the
  // static shell + SSR'd post grid keep their 5-minute revalidate cache.
  // The ?search= variant keeps its clean /blog canonical — search result
  // URLs stay deliberately non-indexable (audit verified Google
  // canonicalizes them); the target is now FUNCTIONAL for every real
  // visitor, which is what the SearchAction contract promises.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search");
    if (q && q.trim()) setSearch(q.trim());
  }, []);

  useEffect(() => {
    (async () => {
      // SSR seed (H1 audit fix): the default view (no search) is fully
      // covered by the server-provided posts — no network round trip
      // until the user actually searches.
      if (initialPosts && !search) {
        setPosts(initialPosts);
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await listBlogPosts(lang, "all", search);
      setPosts(data);
      setLoading(false);
    })();
  }, [lang, search, initialPosts]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-20 sm:px-6 md:py-28">
        {/* Owner artwork page banner (Phase 127 — 12 header images are PAGE banners) */}
        <div className="mb-12">
          <PageBanner section="blog" />
        </div>

        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            {isAr ? "مدونة Alkemos" : "Alkemos Blog"}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg font-normal text-[var(--muted-foreground)] md:text-xl">
            {isAr
              ? "نصائح وإرشادات علمية للتغذية واللياقة من فريق Alkemos"
              : "Science-backed nutrition and fitness tips from the Alkemos team"}
          </p>
        </div>

        <div className="mb-12 flex justify-center">
          <ShareButtons path="/blog" title={isAr ? "مدونة Alkemos" : "The Alkemos Blog"} />
        </div>

        {/* Search + Categories */}
        <div className="mb-16 flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث في المقالات..." : "Search articles..."}
            className="flex-1 rounded-full border border-[var(--edge)] bg-[var(--tint)] px-5 py-2.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
          />
          {/* P2-11 (§12.36): category chips are real LINKS to the crawlable
              category pages — the client filter buttons they replaced were
              invisible to the link graph. Search stays client-side (search
              result URLs are correctly non-indexable). */}
          <nav aria-label={isAr ? "تصنيفات المدونة" : "Blog categories"} className="flex flex-wrap gap-2">
            <Link
              href={isAr ? "/ar/blog" : "/blog"}
              className="rounded-full bg-[var(--tint)] px-4 py-2 text-xs font-normal text-[var(--muted-foreground)] transition-all hover:text-[var(--text)]"
            >
              {isAr ? "الكل" : "All"}
            </Link>
            {BLOG_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`${isAr ? "/ar/blog" : "/blog"}/category/${cat.id}`}
                className="rounded-full bg-[var(--tint)] px-4 py-2 text-xs font-normal text-[var(--muted-foreground)] transition-all hover:text-[var(--text)]"
              >
                {isAr ? cat.ar : cat.en}
              </Link>
            ))}
          </nav>
        </div>

        {/* Posts grid */}
        {loading ? (
          <div className="py-20 text-center text-base font-normal text-[var(--muted-foreground)]">
            {isAr ? "جارٍ التحميل..." : "Loading..."}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-base font-normal text-[var(--muted-foreground)]">
            {isAr ? "لا توجد مقالات حاليًا" : "No articles yet"}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <a
                key={post.id}
                href={isAr ? `/ar/blog/${post.slug}` : `/blog/${post.slug}`}
                className="marble-card group block overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
              >
                {post.featured_image && (
                  <div className="relative aspect-video overflow-hidden">
                    {/* PHASE 139: render-time Pexels resize (w=800 webp,
                        aspect-video crop) — cards rendered at ≤400 CSS px
                        used to download the full 1200×627 JPEG. */}
                    <Image
                      src={sizedRemoteImage(post.featured_image, 800, 16 / 9) || post.featured_image}
                      alt={post.cover_alt || post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs font-normal text-[var(--muted-foreground)]">
                    <span className="seal-chip">
                      {getCategoryLabel(post.category, lang)}
                    </span>
                    <span>{post.reading_time} {isAr ? "دقائق" : "min"}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold leading-tight tracking-tight">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm font-normal text-[var(--muted-foreground)]">{post.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-normal text-[var(--muted-foreground)]">{post.author}</span>
                    <span className="chrome-text text-xs font-semibold">
                      {isAr ? "اقرأ المزيد ›" : "Read more ›"}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Access-point fix (2026-09-14): slim copyright line replaced by the
          SHARED marble footer — this public page now carries the same
          persistent link grid as the homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}
