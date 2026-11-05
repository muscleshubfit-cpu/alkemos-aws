import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Facebook } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { AUTHORS, getAuthorBySlug, getProfilePageSchema } from "@/lib/authors";
import { getBreadcrumbSchema, jsonLd } from "@/lib/seo";

/**
 * /authors/[slug] — Author profile page (EN).
 *
 * Phase SEO-GEO-2 (2026-09-08): every author whose name appears in an
 * Article schema gets a ProfilePage on the site. This page is the `@id`
 * URL referenced by every Person schema across the platform — it makes
 * the author a real, crawlable entity in Google's Knowledge Graph
 * instead of an anonymous byline.
 *
 * The page carries:
 *   - ProfilePage JSON-LD schema (mainEntity = Person)
 *   - Breadcrumb schema (Home / Authors / [name])
 *   - Full bio + credentials + job title
 *   - Avatar image
 *   - Links back to the platform's content (exercises, foods, blog)
 *
 * For now, only Ahmed Zake exists. When additional coaches are onboarded,
 * they will appear here automatically — the page is data-driven from
 * `src/lib/authors.ts` (AUTHORS registry).
 */

export const dynamicParams = true;

export function generateStaticParams() {
  return AUTHORS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) {
    return {
      title: "Author Not Found — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/authors/${author.slug}`;
  // SEO/GEO audit (2026-09-28): the registry jobTitle ends with
  // ", Alkemos" ("Founder & Head Coach, Alkemos"), so the composed title
  // rendered the brand TWICE ("…, Alkemos | Alkemos"). Strip the
  // jobTitle's own brand mention for the <title> — og/twitter keep the
  // full jobTitle (no template appends a brand there). Same class of fix
  // as stripTrailingBrandForArTemplate on the AR mirror.
  const titleJobTitle = author.jobTitleEn.replace(/,\s*Alkemos\s*$/u, "");
  return {
    title: `${author.nameEn} — ${titleJobTitle} | Alkemos`,
    description: author.bioEn.slice(0, 160),
    alternates: {
      canonical: url,
      languages: {
        en: url,
        ar: `https://alkemos.com/ar/authors/${author.slug}`,
        "x-default": url,
      },
    },
    openGraph: {
      type: "profile",
      url,
      title: `${author.nameEn} — ${author.jobTitleEn}`,
      description: author.bioEn.slice(0, 160),
      siteName: "Alkemos",
      locale: "en_US",
      images: author.avatarUrl ? [{ url: `${author.avatarUrl}?v=4`, width: 400, height: 400 }] : [],
    },
    twitter: {
      card: "summary",
      title: `${author.nameEn} — ${author.jobTitleEn}`,
      description: author.bioEn.slice(0, 160),
    },
  };
}

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();

  const profileSchema = getProfilePageSchema(author);
  // SEO/GEO audit (2026-09-28): the "Authors" crumb now targets the real
  // /authors index (was /authors — a 404). Visible nav + JSON-LD match.
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Authors", url: "/authors" },
    { name: author.nameEn, url: `/authors/${author.slug}` },
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(profileSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6 md:py-24">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <Link href="/authors" className="hover:opacity-70">Authors</Link>
          <span>/</span>
          <span className="text-[var(--text)]">{author.nameEn}</span>
        </nav>

        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
          {author.avatarUrl && (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[var(--edge)] bg-[var(--tint)] sm:h-32 sm:w-32">
              <Image
                src={author.avatarUrl}
                alt={author.nameEn}
                fill
                sizes="(max-width: 640px) 96px, 128px"
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              {author.nameEn}
            </h1>
            <p className="mt-2 text-base font-normal text-[var(--muted-2)] md:text-lg">
              {author.jobTitleEn}
            </p>
            <p className="mt-1 text-sm font-normal text-[var(--muted-foreground)]">
              {author.nameAr} · {author.jobTitleAr}
            </p>
          </div>
        </header>

        <div className="mb-8">
          <ShareButtons path={`/authors/${author.slug}`} title={author.nameEn} />
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">About</h2>
          <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-2)] md:text-lg">
            {author.bioEn}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Credentials</h2>
          <ul className="mt-4 space-y-2">
            {author.credentials.map((cred, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-base font-normal leading-relaxed text-[var(--muted-2)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--muted-2)]" />
                <span>
                  {cred.en}
                  <span className="block text-xs text-[var(--muted-foreground)]">{cred.ar}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* P2-11 (2026-09-28): the founder's eight certifications as issued
              (ACSM, ACE, ISSA, NASM) — isolated from the original collage onto
              a clean background. Pixel-exact document scans; no content was
              recreated or altered. */}
          <figure className="mt-8 overflow-hidden rounded-xl border border-[var(--edge)] bg-[var(--tint)] p-2 sm:p-3">
            <Image
              src="/images/founder-certificates.webp"
              alt="The eight professional certifications of Ahmed Zake — ACSM, ACE, ISSA and NASM certificates, shown as issued"
              width={1252}
              height={1884}
              sizes="(max-width: 768px) 100vw, 700px"
              className="h-auto w-full rounded-lg"
            />
            <figcaption className="mt-2 pb-1 text-center text-xs font-normal text-[var(--muted-foreground)]">
              Ahmed Zake&apos;s professional certifications — ACSM · ACE · ISSA · NASM
            </figcaption>
          </figure>
        </section>

        {author.sameAs.length > 0 && (
          <section className="mb-10">
            {/* Owner follow-up (2026-09-28, later the same day): the
                "Find … online" heading removed by owner order. The chips
                open in the SAME tab — target="_blank" tabs die within a
                second in in-app browsers (documented root cause from the
                live investigation), so same-tab navigation is the only
                pattern that works in every environment. */}
            <ul className="flex flex-wrap gap-3">
              {author.sameAs.map((url) => {
                // P2-11: hostname-only labels rendered two identical
                // "facebook.com" chips — include the profile handle so
                // each link is distinguishable.
                const u = new URL(url);
                const handle = u.pathname.replace(/\//g, "").split("/")[0];
                const label = author.sameAsLabels?.[url]?.en;
                const isFacebook = u.hostname.replace(/^www\./, "") === "facebook.com";
                return (
                  <li key={url}>
                    <a
                      href={url}
                      rel="me"
                      className="inline-flex items-center gap-2 rounded-md border border-[var(--edge)] px-3 py-1.5 text-sm hover:border-[var(--muted-2)]"
                    >
                      {isFacebook && <Facebook className="h-4 w-4 shrink-0" aria-hidden="true" />}
                      {label && <span>{label} ·</span>}
                      <span dir="ltr">
                        {u.hostname.replace(/^www\./, "")}
                        {handle ? `/${handle}` : ""}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="marble-card mt-12 p-8 text-center">
          <h2 className="text-xl font-semibold tracking-tight">
            Explore content by {author.nameEn}
          </h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
            Browse the exercise library, food database, training programs, and the fitness blog — all reviewed by {author.nameEn}.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/exercises" className="btn-outline px-4 py-2 text-sm">Exercises</Link>
            <Link href="/foods" className="btn-outline px-4 py-2 text-sm">Foods</Link>
            <Link href="/programs" className="btn-outline px-4 py-2 text-sm">Programs</Link>
            <Link href="/blog" className="btn-outline px-4 py-2 text-sm">Blog</Link>
            <Link href="/evo" className="btn-chrome px-4 py-2 text-sm">EVO AI Coach</Link>
          </div>
        </section>
      </main>

      {/* Access-point fix (2026-09-14): slim copyright line replaced by the
          SHARED marble footer — this public page now carries the same
          persistent link grid as the homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}
