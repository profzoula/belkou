import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Award,
  BookOpen,
  CalendarClock,
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
  getWelcomePreviewLesson,
} from "@/lib/courses";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { isCourseContentLive, isScheduledInFuture, formatScheduledPublishLabel } from "@/lib/course-publish";
import { getCourseAccess, type CourseAccessStatus } from "@/lib/fns/course-access";
import type { PublicCourse } from "@/lib/fns/courses";
import { UserAccountMenu } from "@/components/auth/UserAccountMenu";
import { useAuth } from "@/hooks/use-auth";
import { siteConfig } from "@/lib/site-config";

type CourseLandingPageProps = {
  course: PublicCourse;
};

function discountPercent(price: number, original: number) {
  if (original <= price) return 0;
  return Math.round((1 - price / original) * 100);
}

function CourseThumbnail({
  course,
  hasPaidAccess,
  contentLive,
  scheduledPublishAt,
  accessLoading = false,
}: {
  course: PublicCourse;
  hasPaidAccess: boolean;
  contentLive: boolean;
  scheduledPublishAt?: string;
  accessLoading?: boolean;
}) {
  const enrolledWaiting = hasPaidAccess && !contentLive;
  const canStartCourse = hasPaidAccess && contentLive;
  const previewLesson = useMemo(() => {
    if (enrolledWaiting) {
      return getWelcomePreviewLesson(course);
    }
    return getAllLessons(course).find((lesson) => lesson.preview && lesson.type === "video");
  }, [course, enrolledWaiting]);

  const availabilityLabel = scheduledPublishAt
    ? formatScheduledPublishLabel(scheduledPublishAt)
    : null;

  return (
    <CourseThumbnailBanner
      thumbnail={course.thumbnail}
      slug={course.slug}
      aspectClass="aspect-video"
      className="border-b border-border"
      showLabel={false}
      showIcon={false}
    >
      {accessLoading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
          <span className="h-10 w-10 animate-pulse rounded-full bg-white/40" />
        </div>
      ) : enrolledWaiting && availabilityLabel ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/45 px-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-primary shadow-lg">
            <CalendarClock className="h-7 w-7" />
          </span>
          <div className="max-w-[240px]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
              Inscription confirmée
            </p>
            <p className="mt-1 text-base font-bold leading-snug text-white drop-shadow-sm">
              Disponible le {availabilityLabel}
            </p>
          </div>
          <Link
            to="/courses/$slug/learn"
            params={{ slug: course.slug }}
            search={previewLesson ? { lesson: previewLesson.id } : undefined}
            className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Voir la vidéo de bienvenue
          </Link>
        </div>
      ) : canStartCourse ? (
        <Link
          to="/courses/$slug/learn"
          params={{ slug: course.slug }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/15 transition-colors hover:bg-black/25"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-foreground shadow-lg transition-transform hover:scale-105">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </span>
          <span className="text-sm font-semibold text-white drop-shadow-sm">Commencer le cours</span>
        </Link>
      ) : (
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
      )}
    </CourseThumbnailBanner>
  );
}

export function CourseLandingPage({ course }: CourseLandingPageProps) {
  const { user, session, loading: authLoading } = useAuth();
  const accessFn = useServerFn(getCourseAccess);
  const [access, setAccess] = useState<CourseAccessStatus | null>(null);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setAccess(null);

    void accessFn({
      data: {
        courseSlug: course.slug,
        accessToken: session?.access_token,
      },
    })
      .then((result) => {
        if (!cancelled) setAccess(result);
      })
      .catch(() => {
        if (!cancelled) {
          setAccess({
            hasPaidAccess: false,
            contentLive: isCourseContentLive(course),
            scheduledPublishAt: course.scheduledPublishAt,
            paymentStatus: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessFn, course, session?.access_token, authLoading]);

  const accessLoading = authLoading || (Boolean(user) && access === null);
  const hasPaidAccess = access?.hasPaidAccess ?? false;
  const contentLive = access?.contentLive ?? isCourseContentLive(course);
  const enrolledWaiting = hasPaidAccess && !contentLive;
  const canStartCourse = hasPaidAccess && contentLive;

  const welcomeLesson = useMemo(() => getWelcomePreviewLesson(course), [course]);
  const welcomeLearnSearch = welcomeLesson ? { lesson: welcomeLesson.id } : undefined;

  const courseDiscount = discountPercent(course.price, course.originalPrice);
  const scheduledSoon = isScheduledInFuture(course);
  const startLabel = course.scheduledPublishAt
    ? formatScheduledPublishLabel(course.scheduledPublishAt)
    : siteConfig.cohortStartDate;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <header className="border-b border-white/10 bg-course-hero text-white">
        <div className="site-container flex h-14 items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-display font-bold text-sm">
            <img src={siteConfig.logo} alt="" className="h-8 w-8 shrink-0 rounded-lg" />
            {siteConfig.name}
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link to="/courses">Tous les cours</Link>
            </Button>
            {!authLoading && !user ? (
              <Button asChild variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link to="/login">Connexion</Link>
              </Button>
            ) : null}
            {!authLoading && user ? <UserAccountMenu /> : null}
          </div>
        </div>
      </header>

      <section className="bg-course-hero text-white pb-10 pt-6">
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

          {enrolledWaiting && access?.scheduledPublishAt && (
            <p className="mb-4 inline-flex rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              Vous êtes inscrit — accès complet au cours le{" "}
              {formatScheduledPublishLabel(access.scheduledPublishAt)}
            </p>
          )}

          {scheduledSoon && course.scheduledPublishAt && !hasPaidAccess && (
            <p className="mb-4 inline-flex rounded-lg border border-sky-400/50 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
              Inscriptions ouvertes — les vidéos seront disponibles le{" "}
              {formatScheduledPublishLabel(course.scheduledPublishAt)}
            </p>
          )}

          {!contentLive && !scheduledSoon && !hasPaidAccess && (
            <p className="mb-4 inline-flex rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-white/80">
              Brouillon — ce cours n&apos;est pas encore visible dans le catalogue public.
            </p>
          )}

          <h1 className="max-w-4xl font-display text-xl font-bold leading-tight sm:text-3xl md:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
            {course.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {course.bestseller && (
              <span className="rounded-sm bg-white/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Bestseller
              </span>
            )}
            <span className="rounded-sm bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
              {course.skillLevel}
            </span>
          </div>

          <p className="mt-3 text-sm">
            Créé par{" "}
            <span className="text-indigo-200 underline-offset-2 hover:underline">{course.instructor}</span>
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
            <CourseThumbnail
              course={course}
              hasPaidAccess={accessLoading ? false : hasPaidAccess}
              contentLive={contentLive}
              scheduledPublishAt={access?.scheduledPublishAt ?? course.scheduledPublishAt}
              accessLoading={accessLoading}
            />

            <div className="space-y-4 p-5">
              {accessLoading ? (
                <div className="space-y-3" aria-busy="true" aria-label="Chargement de votre accès">
                  <div className="h-24 animate-pulse rounded-lg bg-muted" />
                  <div className="h-11 animate-pulse rounded-full bg-muted" />
                  <div className="h-9 animate-pulse rounded-full bg-muted/70" />
                </div>
              ) : (
                <>
              {hasPaidAccess ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    {canStartCourse ? "Accès actif" : "Inscription confirmée"}
                  </p>
                  <p className="mt-2 text-sm text-emerald-900">
                    {canStartCourse
                      ? "Vous avez accès à toutes les leçons de ce cours."
                      : enrolledWaiting && access?.scheduledPublishAt
                        ? `Les vidéos seront disponibles le ${formatScheduledPublishLabel(access.scheduledPublishAt)}.`
                        : "Votre accès sera activé dès le lancement du cours."}
                  </p>
                </div>
              ) : (
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
              )}

              {canStartCourse ? (
                <Button asChild variant="hero" size="lg" className="w-full rounded-lg text-base font-bold">
                  <Link to="/courses/$slug/learn" params={{ slug: course.slug }}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Commencer le cours
                  </Link>
                </Button>
              ) : hasPaidAccess ? (
                <>
                  <Button asChild variant="hero" size="lg" className="w-full rounded-lg text-base font-bold">
                    <Link
                      to="/courses/$slug/learn"
                      params={{ slug: course.slug }}
                      search={welcomeLearnSearch}
                    >
                      <Play className="h-4 w-4 mr-1 fill-current" />
                      Voir la vidéo de bienvenue
                    </Link>
                  </Button>
                  <Button asChild variant="soft" size="sm" className="w-full">
                    <Link to="/dashboard">Mes cours</Link>
                  </Button>
                </>
              ) : (
                <>
                  {scheduledSoon ? (
                    <>
                      <Button asChild variant="hero" size="lg" className="w-full rounded-lg text-base font-bold">
                        <Link
                          to="/courses/$slug/learn"
                          params={{ slug: course.slug }}
                          search={welcomeLearnSearch}
                        >
                          <Play className="h-4 w-4 mr-1 fill-current" />
                          Voir la preview gratuite
                        </Link>
                      </Button>
                      <Button asChild variant="soft" size="lg" className="w-full rounded-lg text-base font-bold">
                        <Link to="/checkout" search={{ course: course.slug }}>
                          S&apos;inscrire maintenant
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="hero" size="lg" className="w-full rounded-lg text-base font-bold">
                        <Link to="/checkout" search={{ course: course.slug }}>
                          S&apos;inscrire maintenant
                        </Link>
                      </Button>

                      <Button asChild variant="soft" size="lg" className="w-full rounded-lg">
                        <Link
                          to="/courses/$slug/learn"
                          params={{ slug: course.slug }}
                          search={welcomeLearnSearch}
                        >
                          <Play className="h-4 w-4 mr-1 fill-current" />
                          Voir la preview gratuite
                        </Link>
                      </Button>
                    </>
                  )}

                  {!user ? (
                    <p className="text-center text-xs text-muted-foreground">
                      Déjà inscrit ?{" "}
                      <Link to="/login" className="font-semibold text-primary underline">
                        Connectez-vous
                      </Link>{" "}
                      avec l&apos;email utilisé à l&apos;inscription.
                    </p>
                  ) : !hasPaidAccess && access?.paymentStatus !== "paid" ? (
                    <p className="text-center text-xs text-amber-800">
                      Ce compte n&apos;a pas encore accès à ce cours. Vérifiez l&apos;email de votre inscription
                      ou contactez le support BelKou.
                    </p>
                  ) : null}
                </>
              )}

              <p className="text-center text-[11px] text-muted-foreground">
                {hasPaidAccess
                  ? canStartCourse
                    ? "Progression sauvegardée dans Mes cours"
                    : enrolledWaiting
                      ? `Vidéo de bienvenue disponible · cours complet le ${startLabel}`
                      : "Accès BelKou confirmé"
                  : scheduledSoon
                    ? `Preview gratuite · cours complet le ${startLabel}`
                    : `Garantie satisfaction · Accès cohorte ${startLabel}`}
              </p>
                </>
              )}
            </div>
          </div>
        </aside>

        <main className="min-w-0 lg:order-1">
          <div className="mb-8 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm">
            <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
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
                {hasPaidAccess
                  ? canStartCourse
                    ? "Vous êtes inscrit à cette formation"
                    : `Inscription confirmée — début le ${startLabel}`
                  : scheduledSoon
                    ? `Formation BelKou — début le ${startLabel}`
                    : `Formation BelKou — cohorte ${siteConfig.cohortStartDate}`}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasPaidAccess
                  ? canStartCourse
                    ? "Retrouvez toutes vos leçons dans le lecteur ou depuis Mes cours."
                    : "Le contenu vidéo sera débloqué automatiquement à la date prévue. En attendant, la vidéo de bienvenue reste accessible."
                  : scheduledSoon
                    ? "Inscrivez-vous dès maintenant. Le contenu vidéo sera débloqué automatiquement à la date prévue."
                    : "Accès WhatsApp, mentorat et projets réels. Paiement sécurisé via Stripe, PayPal, MonCash ou cash."}
              </p>
            </div>
          </section>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="site-container flex items-center gap-3">
          {accessLoading ? (
            <>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-11 w-28 animate-pulse rounded-lg bg-muted" />
            </>
          ) : (
            <>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{course.title}</p>
            {hasPaidAccess ? (
              <p className="text-sm font-semibold text-emerald-700">
                {canStartCourse
                  ? "Accès actif"
                  : access?.scheduledPublishAt
                    ? `Disponible le ${formatScheduledPublishLabel(access.scheduledPublishAt)}`
                    : "Inscription confirmée"}
              </p>
            ) : (
              <p className="text-xl font-bold">${course.price}</p>
            )}
          </div>
          {canStartCourse ? (
            <Button asChild variant="hero" size="lg" className="shrink-0 rounded-lg px-5">
              <Link to="/courses/$slug/learn" params={{ slug: course.slug }}>
                Commencer
              </Link>
            </Button>
          ) : hasPaidAccess ? (
            <Button asChild variant="hero" size="lg" className="shrink-0 rounded-lg px-5">
              <Link
                to="/courses/$slug/learn"
                params={{ slug: course.slug }}
                search={welcomeLesson ? { lesson: welcomeLesson.id } : undefined}
              >
                Bienvenue
              </Link>
            </Button>
          ) : scheduledSoon || welcomeLesson ? (
            <Button asChild variant="hero" size="lg" className="shrink-0 rounded-lg px-5">
              <Link
                to="/courses/$slug/learn"
                params={{ slug: course.slug }}
                search={welcomeLearnSearch}
              >
                Preview
              </Link>
            </Button>
          ) : (
            <Button asChild variant="hero" size="lg" className="shrink-0 rounded-lg px-5">
              <Link to="/checkout" search={{ course: course.slug }}>
                S&apos;inscrire
              </Link>
            </Button>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
