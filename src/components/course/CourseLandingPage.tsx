import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  countLessons,
  formatCount,
  getAllLessons,
  getContinueLearnSearch,
  getCourseActionLabel,
  getCourseDisplayDuration,
  getDisplayedCourseStudentsCount,
  getFirstPreviewVideoLesson,
  getPlayableLearnSearch,
  getPreviewLearnSearch,
  getPreviewVideoLessons,
} from "@/lib/courses";
import { CoursePreviewVideo } from "@/components/course/CoursePreviewVideo";
import { CourseLiveBanner } from "@/components/course/CourseLiveBanner";
import { CourseHeroStatsBar } from "@/components/course/CourseHeroStatsBar";
import { CourseHeroEnrollCta } from "@/components/course/CourseHeroEnrollCta";
import { CoursePublicCurriculum } from "@/components/course/CoursePublicCurriculum";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import {
  isCourseContentLive,
  isScheduledInFuture,
  formatScheduledPublishLabel,
} from "@/lib/course-publish";
import { getCourseAccess, type CourseAccessStatus } from "@/lib/fns/course-access";
import { getEnrolledCourse, type PublicCourse } from "@/lib/fns/courses";
import { getCourseProgress } from "@/lib/fns/progress";
import { Navbar } from "@/components/site/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { siteConfig } from "@/lib/site-config";
import { trackMetaEvent } from "@/lib/meta-pixel";

type CourseLandingPageProps = {
  course: PublicCourse;
};

function discountPercent(price: number, original: number) {
  if (original <= price) return 0;
  return Math.round((1 - price / original) * 100);
}

function CourseThumbnail({
  course,
  accessLoading = false,
  enrolledWaiting = false,
  scheduledPublishAt,
  playableLearnSearch,
}: {
  course: PublicCourse;
  accessLoading?: boolean;
  enrolledWaiting?: boolean;
  scheduledPublishAt?: string;
  playableLearnSearch?: { lesson: string };
}) {
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
      showOverlay={false}
    >
      {accessLoading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
          <span className="h-10 w-10 animate-pulse rounded-full bg-white/40" />
        </div>
      ) : enrolledWaiting && availabilityLabel && !playableLearnSearch ? (
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
        </div>
      ) : null}
    </CourseThumbnailBanner>
  );
}

export function CourseLandingPage({ course }: CourseLandingPageProps) {
  const { user, session, loading: authLoading } = useAuth();
  const accessFn = useServerFn(getCourseAccess);
  const enrolledCourseFn = useServerFn(getEnrolledCourse);
  const progressFn = useServerFn(getCourseProgress);
  const [access, setAccess] = useState<CourseAccessStatus | null>(null);
  const [enrolledCourse, setEnrolledCourse] = useState<PublicCourse | null>(null);
  const [progress, setProgress] = useState<{
    completedLessonIds: string[];
    progressPercent: number;
    lastLessonId?: string | null;
  } | null>(null);

  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_name: course.title,
      content_ids: [course.slug],
      content_type: "product",
      value: course.price,
      currency: "USD",
    });
  }, [course.price, course.slug, course.title]);

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

  useEffect(() => {
    if (authLoading || !session?.access_token) {
      setProgress(null);
      return;
    }

    let cancelled = false;
    setProgress(null);

    void progressFn({
      data: {
        accessToken: session.access_token,
        courseSlug: course.slug,
      },
    })
      .then((result) => {
        if (!cancelled) setProgress(result);
      })
      .catch(() => {
        if (!cancelled) {
          setProgress({ completedLessonIds: [], progressPercent: 0, lastLessonId: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, course.slug, progressFn, session?.access_token]);

  const accessLoading = authLoading || (Boolean(user) && access === null);
  const hasPaidAccess = access?.hasPaidAccess ?? false;
  const contentLive = access?.contentLive ?? isCourseContentLive(course);
  const previewCourse = enrolledCourse ?? course;
  const statsCourse = enrolledCourse ?? course;

  useEffect(() => {
    if (!session?.access_token || !hasPaidAccess) {
      setEnrolledCourse(null);
      return;
    }

    let cancelled = false;

    void enrolledCourseFn({
      data: {
        courseSlug: course.slug,
        accessToken: session.access_token,
      },
    })
      .then((result) => {
        if (!cancelled) setEnrolledCourse(result);
      })
      .catch(() => {
        if (!cancelled) setEnrolledCourse(null);
      });

    return () => {
      cancelled = true;
    };
  }, [course.slug, enrolledCourseFn, hasPaidAccess, session?.access_token]);

  const enrolledWaiting = hasPaidAccess && !contentLive;
  const canStartCourse = hasPaidAccess && contentLive;

  const playableLearnSearch = getPlayableLearnSearch(course);
  const previewLearnSearch = getPreviewLearnSearch(course);
  const hasPublicPreview = getPreviewVideoLessons(course).length > 0;
  const continueLearnSearch = getContinueLearnSearch(
    course,
    progress?.completedLessonIds ?? [],
    progress?.lastLessonId,
  );
  const courseActionLabel = getCourseActionLabel(progress?.progressPercent ?? 0);

  const courseDiscount = discountPercent(course.price, course.originalPrice);
  const scheduledSoon = isScheduledInFuture(course);
  const startLabel = course.scheduledPublishAt
    ? formatScheduledPublishLabel(course.scheduledPublishAt)
    : null;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Navbar />

      <main id="main-content" className="site-page-top">
        <section className="relative overflow-hidden border-b border-border bg-course-hero text-foreground pb-16 pt-6 sm:pb-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-60"
          />
          <div className="site-container relative">
            <nav
              className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
              aria-label="Fil d'Ariane"
            >
              <Link to="/" className="hover:text-foreground hover:underline">
                {siteConfig.name}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/courses" className="hover:text-foreground hover:underline">
                Cours
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="line-clamp-1 text-foreground/90">{course.title}</span>
            </nav>

            <CourseLiveBanner courseSlug={course.slug} />

            {!authLoading && !user && (
              <p className="mb-4 inline-flex w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-brand-accent/40 bg-brand-accent/15 px-4 py-3 text-sm text-foreground">
                <span>Déjà payé pour ce cours ?</span>
                <Link
                  to="/login"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  Connectez-vous
                </Link>
                <span>avec le même email que votre inscription.</span>
              </p>
            )}

            {enrolledWaiting && access?.scheduledPublishAt && (
              <p className="mb-4 inline-flex rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs text-foreground">
                Vous êtes inscrit — accès complet au cours le{" "}
                {formatScheduledPublishLabel(access.scheduledPublishAt)}
              </p>
            )}

            {scheduledSoon && course.scheduledPublishAt && !hasPaidAccess && (
              <p className="mb-4 inline-flex rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-foreground">
                Inscriptions ouvertes — les vidéos seront disponibles le{" "}
                {formatScheduledPublishLabel(course.scheduledPublishAt)}
              </p>
            )}

            {!contentLive && !scheduledSoon && !hasPaidAccess && (
              <p className="mb-4 inline-flex rounded-xl border border-border bg-card/80 px-3 py-2 text-xs text-muted-foreground">
                Brouillon — ce cours n&apos;est pas encore visible dans le catalogue public.
              </p>
            )}

            <h1 className="max-w-4xl font-display text-3xl font-bold leading-[1.15] tracking-[-0.01em] md:text-4xl">
              {course.title}
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-normal text-muted-foreground">
              {course.description}
            </p>

            <div className="mt-3 flex items-center gap-2.5 text-sm">
              <Avatar className="h-7 w-7 border border-border/60">
                <AvatarImage
                  src={siteConfig.founder.avatarUrl}
                  alt={siteConfig.founder.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-[10px] font-semibold">
                  {siteConfig.founder.name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-muted-foreground">
                Instructeur:{" "}
                <span className="font-medium text-primary underline underline-offset-2">
                  {siteConfig.founder.name}
                </span>
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Dernière mise à jour {course.lastUpdated}
              </span>
              <span>{course.language}</span>
              {course.captions && <span>Sous-titres</span>}
            </div>

            <CourseHeroEnrollCta
              courseSlug={course.slug}
              price={course.price}
              studentCount={getDisplayedCourseStudentsCount(course)}
              accessLoading={accessLoading}
              hasPaidAccess={hasPaidAccess}
              canStartCourse={canStartCourse}
              enrolledWaiting={enrolledWaiting}
              scheduledSoon={scheduledSoon}
              startLabel={startLabel}
              hasPublicPreview={hasPublicPreview}
              courseActionLabel={courseActionLabel}
              continueLearnSearch={continueLearnSearch}
              playableLearnSearch={playableLearnSearch}
              previewLearnSearch={previewLearnSearch}
              progressPercent={progress?.progressPercent ?? 0}
            />
          </div>
        </section>

        <div className="site-container relative z-10 -mt-8 sm:-mt-10">
          <CourseHeroStatsBar course={statsCourse} />
        </div>

        <div className="site-container py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10 lg:pt-10">
          <aside className="mb-8 lg:sticky lg:top-6 lg:order-2 lg:mb-0 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <CourseThumbnail
                course={course}
                accessLoading={accessLoading}
                enrolledWaiting={enrolledWaiting}
                scheduledPublishAt={access?.scheduledPublishAt ?? course.scheduledPublishAt}
                playableLearnSearch={playableLearnSearch}
              />

              <div className="space-y-4 p-5">
                {accessLoading ? (
                  <div
                    className="space-y-3"
                    aria-busy="true"
                    aria-label="Chargement de votre accès"
                  >
                    <div className="h-24 animate-pulse rounded-xl bg-muted" />
                    <div className="h-11 animate-pulse rounded-xl bg-muted" />
                    <div className="h-9 animate-pulse rounded-xl bg-muted/70" />
                  </div>
                ) : (
                  <>
                    {!hasPaidAccess && (
                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <p className="text-xs font-medium text-muted-foreground">Prix du cours</p>
                        <div className="mt-2 flex flex-wrap items-baseline gap-2">
                          <span className="font-display text-3xl font-bold">${course.price}</span>
                          {courseDiscount > 0 && (
                            <>
                              <span className="text-sm text-muted-foreground line-through">
                                ${course.originalPrice}
                              </span>
                              <span className="text-xs font-semibold text-success">
                                −{courseDiscount}%
                              </span>
                            </>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Accès complet au cours · paiement unique
                        </p>
                      </div>
                    )}

                    {canStartCourse ? (
                      <Button
                        asChild
                        variant="hero"
                        size="lg"
                        className="w-full rounded-lg text-base font-bold"
                      >
                        <Link
                          to="/courses/$slug/learn"
                          params={{ slug: course.slug }}
                          search={continueLearnSearch}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          {courseActionLabel}
                        </Link>
                      </Button>
                    ) : hasPaidAccess ? (
                      <>
                        <Button
                          asChild
                          variant="hero"
                          size="lg"
                          className="w-full rounded-lg text-base font-bold"
                        >
                          <Link
                            to="/courses/$slug/learn"
                            params={{ slug: course.slug }}
                            search={playableLearnSearch}
                          >
                            <Play className="h-4 w-4 mr-1 fill-current" />
                            {hasPublicPreview ? "Voir la preview" : "Voir la vidéo de bienvenue"}
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
                            {hasPublicPreview ? (
                              <Button
                                asChild
                                variant="hero"
                                size="lg"
                                className="w-full rounded-lg text-base font-bold"
                              >
                                <Link
                                  to="/courses/$slug/learn"
                                  params={{ slug: course.slug }}
                                  search={previewLearnSearch}
                                >
                                  <Play className="h-4 w-4 mr-1 fill-current" />
                                  Voir la preview gratuite
                                </Link>
                              </Button>
                            ) : null}
                            <Button
                              asChild
                              variant="soft"
                              size="lg"
                              className="w-full rounded-lg text-base font-bold"
                            >
                              <Link to="/checkout" search={{ course: course.slug }}>
                                S&apos;inscrire maintenant
                              </Link>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              asChild
                              variant="hero"
                              size="lg"
                              className="w-full rounded-lg text-base font-bold"
                            >
                              <Link to="/checkout" search={{ course: course.slug }}>
                                S&apos;inscrire maintenant
                              </Link>
                            </Button>

                            {hasPublicPreview ? (
                              <Button
                                asChild
                                variant="soft"
                                size="lg"
                                className="w-full rounded-lg"
                              >
                                <Link
                                  to="/courses/$slug/learn"
                                  params={{ slug: course.slug }}
                                  search={previewLearnSearch}
                                >
                                  <Play className="h-4 w-4 mr-1 fill-current" />
                                  Voir la preview gratuite
                                </Link>
                              </Button>
                            ) : null}
                          </>
                        )}
                      </>
                    )}

                    {hasPaidAccess || scheduledSoon ? (
                      <p className="text-center text-[11px] text-muted-foreground">
                        {hasPaidAccess
                          ? canStartCourse
                            ? (progress?.progressPercent ?? 0) > 0
                              ? `${progress?.progressPercent}% terminé · progression sauvegardée`
                              : "Progression sauvegardée dans Mes cours"
                            : enrolledWaiting
                              ? hasPublicPreview
                                ? `Preview disponible · cours complet le ${startLabel}`
                                : `Vidéo de bienvenue disponible · cours complet le ${startLabel}`
                              : "Accès BelKou confirmé"
                          : `Preview gratuite · cours complet le ${startLabel}`}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </aside>

          <div className="min-w-0 lg:order-1">
            <CoursePreviewVideo course={previewCourse} hasPaidAccess={hasPaidAccess} />

            <div className="mb-8 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm">
              <span className="inline-flex items-center gap-1 font-bold text-foreground">
                {course.rating.toFixed(1)}
                <Star className="h-4 w-4 fill-brand-accent text-brand-accent" />
              </span>
              <span className="text-primary underline">
                {formatCount(course.ratingsCount)} avis
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                {formatCount(getDisplayedCourseStudentsCount(course))} étudiants
              </span>
              {courseDiscount > 0 && (
                <Badge variant="success">{courseDiscount}% off aujourd&apos;hui</Badge>
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
              <h2 className="text-xl font-bold mb-1">Table des matières</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {course.sections.length} parties · {countLessons(course)} leçons ·{" "}
                {getCourseDisplayDuration(course)} · Niveau {course.skillLevel}
              </p>
              <CoursePublicCurriculum course={course} hasPaidAccess={hasPaidAccess} />
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
                      : `Inscription confirmée${startLabel ? ` — début le ${startLabel}` : ""}`
                    : scheduledSoon
                      ? `Formation BelKou — début le ${startLabel}`
                      : "Cours BelKou — accès à vie après achat"}
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
          </div>
        </div>
      </main>

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
                  <p className="text-sm font-semibold text-success">
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
                  <Link
                    to="/courses/$slug/learn"
                    params={{ slug: course.slug }}
                    search={continueLearnSearch}
                  >
                    {(progress?.progressPercent ?? 0) > 0 ? "Continuer" : "Commencer"}
                  </Link>
                </Button>
              ) : hasPaidAccess ? (
                <Button asChild variant="hero" size="lg" className="shrink-0 rounded-lg px-5">
                  <Link
                    to="/courses/$slug/learn"
                    params={{ slug: course.slug }}
                    search={playableLearnSearch}
                  >
                    {playableLearnSearch ? (hasPublicPreview ? "Preview" : "Bienvenue") : "Cours"}
                  </Link>
                </Button>
              ) : hasPublicPreview ? (
                <Button asChild variant="hero" size="lg" className="shrink-0 rounded-lg px-5">
                  <Link
                    to="/courses/$slug/learn"
                    params={{ slug: course.slug }}
                    search={previewLearnSearch}
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
