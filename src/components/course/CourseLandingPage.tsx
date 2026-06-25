import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Award,
  Check,
  ChevronRight,
  Globe,
  Play,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  countLessons,
  formatCount,
  getAllLessons,
} from "@/lib/courses";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { isCourseContentLive, isScheduledInFuture, formatScheduledPublishLabel } from "@/lib/course-publish";
import type { PublicCourse } from "@/lib/fns/courses";
import { siteConfig } from "@/lib/site-config";

type CourseLandingPageProps = {
  course: PublicCourse;
};

function discountPercent(price: number, original: number) {
  if (original <= price) return 0;
  return Math.round((1 - price / original) * 100);
}

function CourseThumbnail({ course }: { course: PublicCourse }) {
  const previewLesson = useMemo(
    () => getAllLessons(course).find((lesson) => lesson.preview && lesson.type === "video"),
    [course],
  );

  return (
    <CourseThumbnailBanner
      thumbnail={course.thumbnail}
      slug={course.slug}
      aspectClass="aspect-video"
      className="border-b border-border"
      showLabel={false}
      showIcon={false}
    >
      <Link
        to="/courses/$slug/learn"
        params={{ slug: course.slug }}
        search={previewLesson ? { lesson: previewLesson.id } : undefined}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/15 transition-colors hover:bg-black/25"
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-foreground shadow-lg transition-transform hover:scale-105">
          <Play className="ml-1 h-7 w-7 fill-current" />
        </span>
        <span className="text-sm font-semibold text-white drop-shadow-sm">
          {previewLesson ? "Preview gratuite" : "Voir le cours"}
        </span>
      </Link>
    </CourseThumbnailBanner>
  );
}

export function CourseLandingPage({ course }: CourseLandingPageProps) {
  const courseDiscount = discountPercent(course.price, course.originalPrice);
  const scheduledSoon = isScheduledInFuture(course);
  const contentLive = isCourseContentLive(course);
  const startLabel = course.scheduledPublishAt
    ? formatScheduledPublishLabel(course.scheduledPublishAt)
    : siteConfig.cohortStartDate;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 bg-[#1c1d1f] text-white">
        <div className="site-container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-sm">
            <img src={siteConfig.logo} alt="" className="h-8 w-8 rounded-lg" />
            {siteConfig.name}
          </Link>
          <Button asChild variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link to="/courses">Tous les cours</Link>
          </Button>
        </div>
      </header>

      <section className="bg-[#1c1d1f] text-white pb-10 pt-6">
        <div className="site-container">
          <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-white/70">
            <Link to="/" className="hover:text-white hover:underline">
              {siteConfig.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/courses" className="hover:text-white hover:underline">
              Cours
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/90 line-clamp-1">{course.title}</span>
          </nav>

          {scheduledSoon && course.scheduledPublishAt && (
            <p className="mb-4 inline-flex rounded-lg border border-sky-400/50 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
              Inscriptions ouvertes — les vidéos seront disponibles le{" "}
              {formatScheduledPublishLabel(course.scheduledPublishAt)}
            </p>
          )}

          {!contentLive && !scheduledSoon && (
            <p className="mb-4 inline-flex rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Brouillon — ce cours n&apos;est pas encore visible dans le catalogue public.
            </p>
          )}

          <h1 className="max-w-4xl font-display text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
            {course.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {course.bestseller && (
              <span className="rounded-sm bg-[#eceb98] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#3d3c0a]">
                Bestseller
              </span>
            )}
            <span className="rounded-sm bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
              {course.skillLevel}
            </span>
          </div>

          <p className="mt-3 text-sm">
            Créé par{" "}
            <span className="text-[#c0caff] underline-offset-2 hover:underline">{course.instructor}</span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70">
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              Dernière mise à jour {course.lastUpdated}
            </span>
            <span>{course.language}</span>
            {course.captions && <span>Sous-titres</span>}
          </div>
        </div>
      </section>

      <div className="site-container py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
        <aside className="mb-8 lg:sticky lg:top-6 lg:order-2 lg:mb-0 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <CourseThumbnail course={course} />

            <div className="space-y-4 p-5">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">Prix du cours</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-bold">${course.price}</span>
                  {courseDiscount > 0 && (
                    <>
                      <span className="text-sm text-muted-foreground line-through">${course.originalPrice}</span>
                      <span className="text-xs font-semibold text-emerald-600">{courseDiscount}% off</span>
                    </>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Accès complet au cours · paiement unique</p>
              </div>

              <Button asChild variant="hero" size="lg" className="w-full rounded-lg text-base font-bold">
                <Link to="/checkout" search={{ course: course.slug }}>
                  S&apos;inscrire maintenant
                </Link>
              </Button>

              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/courses/$slug/learn" params={{ slug: course.slug }}>
                  Voir le contenu du cours
                </Link>
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                {scheduledSoon
                  ? `Vidéos disponibles le ${startLabel}`
                  : `Garantie satisfaction · Accès cohorte ${startLabel}`}
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 lg:order-1">
          <div className="mb-8 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm">
            <span className="inline-flex items-center gap-1 rounded-sm bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-900 dark:bg-violet-500/20 dark:text-violet-200">
              <Award className="h-3.5 w-3.5" />
              {course.skillLevel}
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-600">
              {course.rating.toFixed(1)}
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            </span>
            <span className="text-primary underline">{formatCount(course.ratingsCount)} avis</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              {formatCount(course.studentsCount)} étudiants
            </span>
            {courseDiscount > 0 && (
              <span className="text-xs font-semibold text-emerald-600">{courseDiscount}% off aujourd&apos;hui</span>
            )}
          </div>

          {course.whatYouLearn.length > 0 && (
            <section className="mb-10 rounded-xl border border-border p-5 sm:p-6">
              <h2 className="text-xl font-bold mb-4">Ce que vous apprendrez</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {course.whatYouLearn.map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">Contenu du cours</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {course.sections.length} sections · {countLessons(course)} leçons · {course.totalDuration} · Niveau{" "}
              {course.skillLevel}
            </p>
            <Accordion type="multiple" defaultValue={course.sections.slice(0, 1).map((s) => s.id)} className="rounded-xl border border-border px-4">
              {course.sections.map((section) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="font-semibold text-left">{section.title}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pb-2">
                      {section.lessons.map((lesson, index) => (
                        <li
                          key={lesson.id}
                          className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
                        >
                          <span>
                            {index + 1}. {lesson.title}
                            {lesson.preview && (
                              <span className="ml-2 text-[10px] font-bold uppercase text-primary">Preview</span>
                            )}
                          </span>
                          <span className="shrink-0 tabular-nums">{lesson.duration}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold mb-3">Description</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
          </section>

          <section className="rounded-xl border border-border bg-muted/30 p-5 flex gap-3">
            <ShieldCheck className="h-8 w-8 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">
                Formation BelKou
                {scheduledSoon ? ` — début le ${startLabel}` : ` — cohorte ${siteConfig.cohortStartDate}`}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {scheduledSoon
                  ? "Inscrivez-vous dès maintenant. Le contenu vidéo sera débloqué automatiquement à la date prévue."
                  : "Accès WhatsApp, mentorat et projets réels. Paiement sécurisé via Stripe, PayPal, MonCash ou cash."}
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
