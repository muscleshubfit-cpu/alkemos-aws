"use client";

import { useState } from "react";
import { useI18n, type Lang } from "@/lib/i18n";
import { weeksUnitAr } from "@/lib/utils";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import {
  getRelatedPrograms,
  LOCATION_LABELS,
  LEVEL_LABELS,
  GOAL_LABELS,
  type WorkoutProgram,
} from "@/lib/workout-programs";
import { getExerciseImages, getFallbackSVG } from "@/lib/exercise-images";
import type { ExerciseMini } from "@/lib/exercises-shared";
import { ArrowLeft, Clock, Calendar, Dumbbell, Coffee } from "lucide-react";
import Image from "next/image";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

/**
 * Client component for program detail page.
 * Receives the program as a prop from the server component
 * (which generates metadata + JSON-LD schemas server-side).
 * Accepts an optional `lang` prop — the /ar/programs/[slug] mirror
 * passes lang="ar" to force Arabic rendering (ExercisesPage pattern).
 */
export default function ProgramDetailClient({
  program,
  exerciseIndex,
  lang: langProp,
}: {
  program: WorkoutProgram | null;
  /** slug → mini exercise record — resolved server-side (image/category lookup). */
  exerciseIndex?: Record<string, ExerciseMini>;
  lang?: Lang;
}) {
  const { lang: ctxLang } = useI18n();
  const lang = langProp ?? ctxLang;
  const isAr = lang === "ar";
  // Internal links stay inside the current language's URL space so the AR
  // mirror never bounces Arabic users back to the EN canonical route.
  const base = isAr ? "/ar/programs" : "/programs";
  const [activeDay, setActiveDay] = useState(0);

  if (!program) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <SiteHeader variant="landing" />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            {isAr ? "البرنامج غير موجود" : "Program not found"}
          </h1>
          <a
            href={base}
            className="mt-6 inline-block rounded-full btn-chrome px-6 py-2.5 text-sm"
          >
            {isAr ? "العودة للبرامج" : "Back to programs"}
          </a>
        </main>
      </div>
    );
  }

  const related = getRelatedPrograms(program);
  const locationLabel = isAr ? LOCATION_LABELS[program.location].ar : LOCATION_LABELS[program.location].en;
  const levelLabel = isAr ? LEVEL_LABELS[program.level].ar : LEVEL_LABELS[program.level].en;
  const goalLabel = isAr ? GOAL_LABELS[program.goal].ar : GOAL_LABELS[program.goal].en;
  const shareTitle = isAr ? program.nameAr : program.nameEn;
  const shareText = isAr ? program.descriptionAr : program.descriptionEn;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* #17 fix: visible breadcrumb trail — locale-aware home link
            (2026-09-14 audit: AR program pages linked the EN homepage). */}
        <nav aria-label="breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
          <a href={isAr ? "/ar" : "/"} className="hover:opacity-70">{isAr ? "الرئيسية" : "Home"}</a>
          <span className="text-[#d2d2d7]">›</span>
          <a href={base} className="hover:opacity-70">{isAr ? "البرامج" : "Programs"}</a>
          <span className="text-[#d2d2d7]">›</span>
          <span className="font-medium text-[#1d1d1f]">{isAr ? program.nameAr : program.nameEn}</span>
        </nav>

        {/* Header */}
        <div className="mt-6 overflow-hidden rounded-3xl bg-[#f5f5f7]">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={program.image}
              alt={isAr ? program.imageAltAr : program.imageAltEn}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full seal-chip px-3 py-1">
                {locationLabel}
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${LEVEL_LABELS[program.level].color}15`,
                  color: LEVEL_LABELS[program.level].color,
                }}
              >
                {levelLabel}
              </span>
              <span className="rounded-full bg-[#6e6e73]/10 px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                {goalLabel}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {isAr ? program.nameAr : program.nameEn}
            </h1>
            <p className="mt-2 text-base font-normal text-[var(--muted-foreground)]" dir="auto">
              {isAr ? program.descriptionAr : program.descriptionEn}
            </p>

            {/* CONTENT-AUDIT P1-9 (2026-09-28, audit §2.3 + GEO §3-3): a
                definition-first methodology paragraph BEFORE the schedule
                table — the quotable line AI engines can lift, plus the
                progression guidance the program pages lacked. */}
            <section className="mt-4 rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4">
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text)]">
                {isAr ? "منهجية البرنامج وكيف تتقدم" : "How this program works — and how to progress"}
              </h2>
              <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]" dir="auto">
                {isAr ? program.methodologyAr : program.methodologyEn}
              </p>
            </section>

            {/* PRIORITY-PAGES-2 (2026-10-19, audit §D-2 + report §9.4-1):
                the numeric load progression the P1-9 paragraph generalized
                — start point, increment, stall rule. The quotable numbers
                every program page was measured to lack. */}
            {(isAr ? program.progressionAr : program.progressionEn) && (
              <section className="mt-4 rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4">
                <h2 className="text-sm font-semibold tracking-tight text-[var(--text)]">
                  {isAr ? "تدرّج الحمل بالأرقام" : "Load progression, by the numbers"}
                </h2>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]" dir="auto">
                  {isAr ? program.progressionAr : program.progressionEn}
                </p>
              </section>
            )}

            {/* PRIORITY-PAGES-2 (2026-10-19, audit §D-2): the honest
                for-whom / not-for-whom card with plain-text cross-program
                pointers — the decision section the audit measured missing
                ("لمن هذا البرنامج / لمن ليس"). */}
            {(isAr ? program.forWhomAr : program.forWhomEn) && (
              <section className="mt-4 rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4">
                <h2 className="text-sm font-semibold tracking-tight text-[var(--text)]">
                  {isAr ? "لمن هذا البرنامج — ولمن ليس" : "Who this program is for — and who it is not"}
                </h2>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]" dir="auto">
                  {isAr ? program.forWhomAr : program.forWhomEn}
                </p>
              </section>
            )}

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[var(--card)] border border-[var(--edge)] p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--muted-2)]" />
                  <span className="text-xs font-medium text-[var(--muted-foreground)]">
                    {isAr ? "المدة" : "Duration"}
                  </span>
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {program.durationWeeks} {isAr ? weeksUnitAr(program.durationWeeks) : "weeks"}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--card)] border border-[var(--edge)] p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--muted-2)]" />
                  <span className="text-xs font-medium text-[var(--muted-foreground)]">
                    {isAr ? "التكرار" : "Frequency"}
                  </span>
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {program.daysPerWeek} {isAr ? "أيام/أسبوع" : "days/week"}
                </p>
              </div>
              <div className="col-span-2 rounded-2xl bg-[var(--card)] border border-[var(--edge)] p-4 sm:col-span-1">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-[var(--muted-2)]" />
                  <span className="text-xs font-medium text-[var(--muted-foreground)]">
                    {isAr ? "الهدف" : "Goal"}
                  </span>
                </div>
                <p className="mt-1 text-lg font-semibold">{goalLabel}</p>
              </div>
            </div>

            {/* Share buttons */}
            <div className="mt-6">
              <ShareButtons path={`/programs/${program.slug}`} title={shareTitle} text={shareText} />
            </div>
          </div>
        </div>

        {/* Weekly schedule */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            {isAr ? "الجدول الأسبوعي" : "Weekly Schedule"}
          </h2>
          <div className="mt-4 space-y-4">
            {program.days.map((day) => (
              <div
                key={day.day}
                className={`rounded-3xl p-6 ${
                  day.isRest ? "bg-[#ff9500]/5 border border-[#ff9500]/20" : "bg-[#f5f5f7]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1d1d1f] text-sm font-semibold text-white">
                      {day.day}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold">
                        {isAr ? day.titleAr : day.titleEn}
                      </h3>
                      {day.isRest && (
                        <p className="text-xs font-normal text-[#ff9500]">
                          {isAr ? "يوم راحة — استرح أو امشي" : "Rest day — relax or walk"}
                        </p>
                      )}
                    </div>
                  </div>
                  {!day.isRest && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                      {day.exercises.length} {isAr ? "تمارين" : "exercises"}
                    </span>
                  )}
                </div>

                {/* Exercises list */}
                {!day.isRest && (
                  <div className="mt-4 space-y-2">
                    {day.exercises.map((ex, i) => {
                      // Try to find the exercise in our DB to get its image
                      // Server-resolved exercise mini record (prop) — the
                      // 868-exercise array never ships to the browser.
                      const exerciseData = exerciseIndex?.[ex.exerciseSlug];
                      const imgUrls = exerciseData ? getExerciseImages(exerciseData.imageKey) : [];
                      return (
                        <a
                          key={i}
                          href={`${isAr ? "/ar" : ""}/exercises/${ex.exerciseSlug}`}
                          className="block overflow-hidden rounded-2xl bg-white transition-colors hover:bg-[#fafafa]"
                        >
                          {/* Exercise image — ABOVE the text, full width */}
                          {imgUrls.length > 0 && (
                            <div className="flex h-24 w-full items-center justify-center gap-1 bg-[#f5f5f7]">
                              {imgUrls.slice(0, 2).map((url, idx) => (
                                <div key={idx} className="relative h-full w-1/2">
                                  <ImageWithFallback
                                    src={url}
                                    alt={`${isAr ? ex.nameAr : ex.nameEn} ${idx + 1}`}
                                    fill
                                    className="object-contain"
                                    fallbackSrc={getFallbackSVG(exerciseData?.category || "default")}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Exercise info — below the image */}
                          <div className="flex items-center justify-between gap-3 p-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {isAr ? ex.nameAr : ex.nameEn}
                              </p>
                              <p className="mt-0.5 text-xs font-normal text-[var(--muted-foreground)]">
                                {ex.sets} × {ex.reps}
                              </p>
                            </div>
                            {/* Rest */}
                            <div className="shrink-0 text-end">
                              <p className="text-xs font-normal text-[var(--muted-foreground)]">
                                {isAr ? "راحة" : "Rest"}
                              </p>
                              <p className="text-xs font-medium" dir="ltr">
                                {isAr ? ex.restAr : ex.restEn}
                              </p>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}

                {day.isRest && (
                  <div className="mt-3 flex items-center gap-2 text-[#ff9500]">
                    <Coffee className="h-4 w-4" />
                    <p className="text-sm font-normal">
                      {isAr ? "احصل على قسط من الراحة — جسدك يحتاجها للتعافي" : "Take a rest — your body needs it to recover"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* PRIORITY-PAGES-2 (2026-10-19, audit §D-2): the per-program
            decision FAQs the audit measured missing. Plain visible HTML
            (marble-card pattern from the EVO FAQ) so the answers ship in
            the server HTML; the [slug] layouts emit the same array as
            FAQPage JSON-LD per language. */}
        {program.faq && program.faq.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">
              {isAr ? "أسئلة شائعة حول البرنامج" : `About the ${program.nameEn} — common questions`}
            </h2>
            <div className="mt-4 space-y-4">
              {program.faq.map((f) => (
                <div key={f.q.en} className="marble-card p-5">
                  <h3 className="text-sm font-semibold text-[var(--text)]" dir="auto">
                    {isAr ? f.q.ar : f.q.en}
                  </h3>
                  <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]" dir="auto">
                    {isAr ? f.a.ar : f.a.en}
                  </p>
                </div>
              ))}
            </div>
            {/* Destination chips (audit §D-2 internal-linking ask): the
                three next steps every program reader shares — the hub for
                the other programs, the AI planner for a personalized split,
                and the free tools. Language-aware hrefs keep the AR mirror
                inside /ar. */}
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={base}
                className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
              >
                {isAr ? "كل برامج التدريب" : "All workout programs"}
              </a>
              <a
                href={isAr ? "/ar/ai-workout-planner" : "/ai-workout-planner"}
                className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
              >
                {isAr ? "ولّد خطة مخصصة بالذكاء الاصطناعي" : "Generate a personalized AI split"}
              </a>
              <a
                href={isAr ? "/ar/tools" : "/tools"}
                className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
              >
                {isAr ? "الأدوات المجانية" : "Free tools"}
              </a>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-10 rounded-3xl bg-[#f5f5f7] p-6 text-center text-[#1d1d1f] md:p-8">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            {isAr ? "تريد خطة مخصصة لك؟" : "Want a personalized plan?"}
          </h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
              {/* CONTENT-AUDIT 5.7 (audit §2.3): the ghost-voice
                  "Alkemos creates…" was the only third-person sentence on
                  the site — restored the platform's we/you voice. */}
              {isAr
              ? "ابنِ خطتك أنت بالذكاء الاصطناعي: أهدافك ومستواك وتفضيلاتك مدخلًا، وجدول كامل مخرجًا."
              : "Build your own plan with AI: your goals, level, and preferences in — a full schedule out."}
          </p>
          <a
            href={isAr ? "/ar/memberships" : "/memberships"}
            className="mt-4 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-normal text-[#1d1d1f] transition-opacity hover:opacity-90"
          >
            {isAr ? "احصل على خطة مخصصة ›" : "Get a personalized plan ›"}
          </a>
        </section>

        {/* Related programs */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">
              {isAr ? "برامج مشابهة" : "Related programs"}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((rel) => (
                <a
                  key={rel.slug}
                  href={`${base}/${rel.slug}`}
                  className="group overflow-hidden rounded-2xl bg-[#f5f5f7] transition-opacity hover:opacity-90"
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={rel.image}
                      alt={isAr ? rel.imageAltAr : rel.imageAltEn}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold">{isAr ? rel.nameAr : rel.nameEn}</p>
                    <p className="mt-0.5 text-xs font-normal text-[var(--muted-foreground)]">
                      {isAr ? LEVEL_LABELS[rel.level].ar : LEVEL_LABELS[rel.level].en} · {rel.durationWeeks} {isAr ? weeksUnitAr(rel.durationWeeks) : "wks"}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>


      {/* Access-point fix (2026-09-14): shared marble footer — this
          public page now carries the same persistent link grid as the
          homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}