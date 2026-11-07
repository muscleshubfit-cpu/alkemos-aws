"use client";

import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getBlogPost, getLinkedPost } from "@/lib/blog";
import { mirrorPath } from "@/lib/surface-locale";

/**
 * Site-wide language toggle. M31 fix: navigates to the /ar/ mirror (or
 * back to the English URL) when a mirror exists, so the URL matches the
 * language and can be shared/bookmarked correctly.
 *
 * 450 UNIFIED CHOICE LAW: the mirror resolution now goes through the
 * CENTRAL structural map (mirrorPath in src/lib/surface-locale.ts) —
 * the same single source the UrlLocaleSync safety net and the
 * middleware redirect consume — instead of this component's private
 * route-table copies (which could silently drift from the routes; the
 * /authors index pair was in fact missing from them).
 * The map covers every index pair and every same-slug subtree
 * (exercises, foods, muscles, equipment, collections, authors, guides,
 * coaches, programs, compare, tools, diet-plan cells, blog
 * categories…) and is canary-pinned against the filesystem. ONE
 * deliberate exception stays local: blog ARTICLE pages
 * (/blog/[slug] ↔ /ar/blog/[slug]) whose mirror depends on a live
 * linked_post_id lookup — resolved below with the DB, exactly as
 * before; articles without a linked twin land on the blog list in the
 * new language.
 *
 * Pages without Arabic mirrors (private surfaces like /checkout,
 * /profile, /admin, /auth): just toggle the UI language (the page
 * content is already bilingual via useI18n, so the user sees the new
 * language without a URL change). 449 SURFACE LOCALE LAW: the swap is
 * PERSISTENT — setLang writes the choice to localStorage AND the
 * mhe:lang cookie (persistLangChoice), the (app) root layout
 * server-renders it from the first HTML, and the 450 law keeps the
 * public trees in sync with the choice (the middleware redirects
 * cross-tree RSC navigations to the chosen tree's mirror).
 */
export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  const pathname = usePathname() || "/";
  const router = useRouter();

  const handleToggle = async () => {
    const nextLang = lang === "ar" ? "en" : "ar";

    // P3-10/م8 (deep-audit Phase 217): usePathname() carries no search, so
    // toggling the language used to DROP the query string (/exercises?
    // equipment=barbell lost its filters). Read it from window.location at
    // click time and carry it to the mirror — deliberately NOT
    // useSearchParams(): that hook would involve every page in a
    // client-side re-render/suspense for data used by one button click.
    const qs =
      typeof window !== "undefined" && window.location.search
        ? window.location.search
        : "";
    const withQs = (path: string) =>
      qs && !path.includes("?") ? `${path}${qs}` : path;

    // Blog article page: /blog/[slug] <-> /ar/blog/[slug] (via linked_post_id)
    const enMatch = pathname.match(/^\/blog\/([^/]+)$/);
    const arMatch = pathname.match(/^\/ar\/blog\/([^/]+)$/);
    if (enMatch || arMatch) {
      const currentSlug = (enMatch || arMatch)![1];
      const currentArticleLang: "en" | "ar" = enMatch ? "en" : "ar";
      setLang(nextLang);
      try {
        const post = await getBlogPost(currentArticleLang, currentSlug);
        const linked = post ? await getLinkedPost(post) : null;
        if (linked) {
          router.push(withQs(linked.language === "ar" ? `/ar/blog/${linked.slug}` : `/blog/${linked.slug}`));
          return;
        }
      } catch {
        // fall through to list-page fallback below
      }
      // No translated version exists yet — land on the blog list in the new language.
      router.push(withQs(nextLang === "ar" ? "/ar/blog" : "/blog"));
      return;
    }

    // 450: every structural mirror (index pairs + same-slug subtrees —
    // exercises, foods, muscles, equipment, collections, authors,
    // guides, coaches, programs, compare, tools, diet-plan cells, blog
    // categories…) resolves through the CENTRAL map. setLang runs
    // BEFORE the push so the stored choice already matches the target
    // tree when its RSC fetch reaches the middleware (no self-redirect).
    const mirror = mirrorPath(pathname, nextLang);
    if (mirror) {
      setLang(nextLang);
      router.push(withQs(mirror));
      return;
    }

    // Pages without Arabic mirrors: just toggle the UI language.
    // The page content is already bilingual via useI18n, so the user sees
    // the new language immediately without a URL change.
    setLang(nextLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={handleToggle}
      aria-label={lang === "ar" ? "تبديل اللغة" : "Toggle language"}
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-semibold">{lang === "ar" ? "EN" : "ع"}</span>
    </Button>
  );
}
