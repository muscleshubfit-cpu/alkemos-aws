import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Facebook } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { AUTHORS, getAuthorBySlug, getProfilePageSchema } from "@/lib/authors";
import { getBreadcrumbSchema, jsonLd, stripTrailingBrandForArTemplate } from "@/lib/seo";

/**
 * /ar/authors/[slug] — Arabic mirror of /authors/[slug].
 *
 * Targets Arabic searches for the founder's name + Arabic author-bio
 * queries. hreflang pair is reciprocal with the EN mirror.
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
      title: "الكاتب غير موجود — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/ar/authors/${author.slug}`;
  return {
    // SEO-GEO-4: strip the trailing brand — the /ar template appends "— Alkemos".
    title: stripTrailingBrandForArTemplate(`${author.nameAr} — ${author.jobTitleAr} | Alkemos`),
    description: author.bioAr.slice(0, 160),
    alternates: {
      canonical: url,
      languages: {
        en: `https://alkemos.com/authors/${author.slug}`,
        ar: url,
        "x-default": `https://alkemos.com/authors/${author.slug}`,
      },
    },
    openGraph: {
      type: "profile",
      url,
      title: `${author.nameAr} — ${author.jobTitleAr}`,
      description: author.bioAr.slice(0, 160),
      siteName: "Alkemos",
      locale: "ar_EG",
      images: author.avatarUrl ? [{ url: `${author.avatarUrl}?v=4`, width: 400, height: 400 }] : [],
    },
    twitter: {
      card: "summary",
      title: `${author.nameAr} — ${author.jobTitleAr}`,
      description: author.bioAr.slice(0, 160),
    },
  };
}

export default async function ArabicAuthorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();

  const profileSchema = getProfilePageSchema(author);
  // SEO/GEO audit (2026-09-28): crumb «الكُتّاب» now targets the real
  // /ar/authors index (was a self-link to the ahmed-zake profile).
  // Visible nav + JSON-LD match.
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "الكُتّاب", url: "/ar/authors" },
    { name: author.nameAr, url: `/ar/authors/${author.slug}` },
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]" dir="rtl">
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
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)]" aria-label="مسار التنقل">
          <Link href="/ar" className="hover:opacity-70">الرئيسية</Link>
          <span>/</span>
          <Link href="/ar/authors" className="hover:opacity-70">الكُتّاب</Link>
          <span>/</span>
          <span className="text-[var(--text)]">{author.nameAr}</span>
        </nav>

        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
          {author.avatarUrl && (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[var(--edge)] bg-[var(--tint)] sm:h-32 sm:w-32">
              <Image
                src={author.avatarUrl}
                alt={author.nameAr}
                fill
                sizes="(max-width: 640px) 96px, 128px"
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              {author.nameAr}
            </h1>
            <p className="mt-2 text-base font-normal text-[var(--muted-2)] md:text-lg">
              {author.jobTitleAr}
            </p>
            <p className="mt-1 text-sm font-normal text-[var(--muted-foreground)]">
              {author.nameEn} · {author.jobTitleEn}
            </p>
          </div>
        </header>

        <div className="mb-8">
          <ShareButtons path={`/authors/${author.slug}`} title={author.nameAr} />
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">عن الكاتب</h2>
          <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-2)] md:text-lg">
            {author.bioAr}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">الشهادات والخبرات</h2>
          <ul className="mt-4 space-y-2">
            {author.credentials.map((cred, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-base font-normal leading-relaxed text-[var(--muted-2)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--muted-2)]" />
                <span>
                  {cred.ar}
                  <span className="block text-xs text-[var(--muted-foreground)]" dir="ltr">{cred.en}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* P2-11 (2026-09-28): شهادات المؤسس الثماني كما صدرت (ACSM وACE وISSA وNASM)
              — معزولة من المونتاج الأصلي على خلفية نظيفة. قصّ بكسلي دقيق؛
              لم يُعَد إنشاء أو تعديل أي محتوى. */}
          <figure className="mt-8 overflow-hidden rounded-xl border border-[var(--edge)] bg-[var(--tint)] p-2 sm:p-3">
            <Image
              src="/images/founder-certificates.webp"
              alt="الشهادات المهنية الثماني لأحمد زكي — شهادات ACSM و ACE و ISSA و NASM كما صدرت"
              width={1252}
              height={1884}
              sizes="(max-width: 768px) 100vw, 700px"
              className="h-auto w-full rounded-lg"
            />
            <figcaption className="mt-2 pb-1 text-center text-xs font-normal text-[var(--muted-foreground)]">
              شهادات أحمد زكي المهنية — ACSM · ACE · ISSA · NASM
            </figcaption>
          </figure>
        </section>

        {author.sameAs.length > 0 && (
          <section className="mb-10">
            {/* متابعة أمر المالك (2026-09-28، لاحقًا في اليوم نفسه): عنوان
                «على الإنترنت» حُذف بأمر المالك. البطاقات تفتح في نفس التبويب —
                تبويبات target="_blank" تُقتل خلال أقل من ثانية في متصفحات
                التطبيقات (الجذر الموثّق من التحقيق الحي)، فالتنقل في نفس
                التبويب هو النمط الوحيد الذي يعمل في كل البيئات. */}
            <ul className="flex flex-wrap gap-3">
              {author.sameAs.map((url) => {
                // P2-11: بطاقات بأسماء المضيف فقط كانت تعرض «facebook.com»
                // مرتين متطابقتين — نُظهر معرّف الحساب لتمييز كل رابط.
                const u = new URL(url);
                const handle = u.pathname.replace(/\//g, "").split("/")[0];
                const label = author.sameAsLabels?.[url]?.ar;
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
            تصفّح محتوى {author.nameAr}
          </h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
            تصفّح مكتبة التمارين، قاعدة الأطعمة، برامج التدريب، والمدوّنة الرياضية — كلها راجعها {author.nameAr}.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/ar/exercises" className="btn-outline px-4 py-2 text-sm">التمارين</Link>
            <Link href="/ar/foods" className="btn-outline px-4 py-2 text-sm">الأطعمة</Link>
            <Link href="/ar/programs" className="btn-outline px-4 py-2 text-sm">البرامج</Link>
            <Link href="/ar/blog" className="btn-outline px-4 py-2 text-sm">المدوّنة</Link>
            {/* Locale-leak fix (2026-09-15 audit): linked /evo (the EN page)
                from the AR surface — now the AR mirror, matching the other
                links in this strip. */}
            <Link href="/ar/evo" className="btn-chrome px-4 py-2 text-sm">مدرب EVO الذكي</Link>
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
