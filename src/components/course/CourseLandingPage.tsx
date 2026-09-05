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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  countLessons,
  formatCount,
  getContinueLearnSearch,
  getCourseActionLabel,
  getCourseDisplayDuration,
  getDisplayedCourseStudentsCount,
  getPlayableLearnSearch,
  getPreviewLearnSearch,
  getPreviewVideoLessons,
  formatCoursePrice,
  isFreeCourse,
} from "@/lib/courses";
import { CoursePreviewVideo } from "@/components/course/CoursePreviewVideo";
import { CourseLiveBanner } from "@/components/course/CourseLiveBanner";
import { CourseHeroStatsBar } from "@/components/course/CourseHeroStatsBar";
import { CourseHeroEnrollCta } from "@/components/course/CourseHeroEnrollCta";
import { FreeCourseAuthCta } from "@/components/course/FreeCourseAuthCta";
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
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/15">
          <span className="h-9 w-9 rounded-md bg-white/35" />
        </div>
      ) : enrolledWaiting && availabilityLabel && !playableLearnSearch ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/50 px-4 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-md border border-white/20 bg-white text-foreground">
            <CalendarClock className="h-6 w-6" />
          </span>
          <div className="max-w-[240px]">
            <p className="text-xs text-white/75">Inscription confirmée</p>
            <p className="mt-1 text-base font-semibold leading-snug text-white">
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
    <div className="min-h-screen bg-elevated pb-24 dark:bg-background lg:pb-0">
      <Navbar />

      <main id="main-content" className="site-page-top">
        <div className="border-b border-border bg-background">
          <div className="site-container py-6 sm:py-8">
            <nav
              className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
              aria-label="Fil d'Ariane"
            >
              <Link to="/" className="text-primary hover:underline">
                {siteConfig.name}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/courses" className="text-primary hover:underline">
                Cours
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="line-clamp-1 text-foreground">{course.title}</span>
            </nav>

            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
              <div className="min-w-0">
                <CourseLiveBanner courseSlug={course.slug} />

                {!authLoading && !user && (
                  <p className="mb-4 rounded-lg border border-border bg-elevated px-4 py-3 text-sm text-muted-foreground">
                    Déjà payé pour ce cours ?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-primary hover:underline"
                    >
                      Connectez-vous
                    </Link>{" "}
                    avec le même email que votre inscription.
                  </p>
                )}

                {enrolledWaiting && access?.scheduledPublishAt && (
                  <p className="mb-4 rounded border border-success/30 bg-success/10 px-3 py-2 text-sm text-foreground">
                    Vous êtes inscrit — accès complet au cours le{" "}
                    {formatScheduledPublishLabel(access.scheduledPublishAt)}
                  </p>
                )}

                {scheduledSoon && course.scheduledPublishAt && !hasPaidAccess && (
                  <p className="mb-4 rounded border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                    Inscriptions ouvertes — les vidéos seront disponibles le{" "}
                    {formatScheduledPublishLabel(course.scheduledPublishAt)}
                  </p>
                )}

                {!contentLive && !scheduledSoon && !hasPaidAccess && (
                  <p className="mb-4 rounded border border-border px-3 py-2 text-sm text-muted-foreground">
                    Brouillon — ce cours n&apos;est pas encore visible dans le catalogue public.
                  </p>
                )}

                <h1 className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl md:text-[2rem]">
                  {course.title}
                </h1>

                <p className="mt-3 max-w-2xl text-base leading-relaxed text-foreground/80">
                  {course.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-1 font-semibold text-brand-accent">
                    {course.rating.toFixed(1)}
                    <Star className="h-4 w-4 fill-brand-accent text-brand-accent" aria-hidden />
                  </span>
                  <span className="font-semibold text-primary underline-offset-2 hover:underline">
                    {formatCount(course.ratingsCount)} avis
                  </span>
                  <span className="text-muted-foreground">
                    {formatCount(getDisplayedCourseStudentsCount(course))} déjà inscrits
                  </span>
                  {courseDiscount > 0 ? (
                    <Badge variant="success">{courseDiscount}% off</Badge>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center gap-2.5 text-sm">
                  <Avatar className="h-8 w-8 border border-border">
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
                    Proposé par{" "}
                    <span className="font-semibold text-primary">{siteConfig.founder.name}</span>
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" aria-hidden />
                    Mis à jour {course.lastUpdated}
                  </span>
                  <span>{course.language}</span>
                  {course.captions ? <span>Sous-titres disponibles</span> : null}
                  <span>Niveau {course.skillLevel}</span>
                </div>

                <div className="mt-5 lg:hidden">
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
              </div>

              <aside className="mt-8 hidden lg:sticky lg:top-6 lg:mt-0 lg:block lg:self-start">
                <div className="bk-card overflow-hidden">
                  <CourseThumbnail
                    course={course}
                    accessLoading={accessLoading}
                    enrolledWaiting={enrolledWaiting}
                    scheduledPublishAt={access?.scheduledPublishAt ?? course.scheduledPublishAt}
                    playableLearnSearch={playableLearnSearch}
                  />
                  <div className="space-y-4 p-5">
                    {accessLoading ? (
                      <div className="space-y-3" aria-busy="true" aria-label="Chargement de votre accès">
                        <div className="h-10 rounded bg-muted" />
                        <div className="h-11 rounded bg-muted" />
                      </div>
                    ) : (
                      <CourseEnrollSidebar
                        course={course}
                        courseDiscount={courseDiscount}
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
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        <div className="site-container py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
          <div className="min-w-0">
            <div className="mb-8 lg:hidden">
              <div className="bk-card overflow-hidden">
                <CourseThumbnail
                  course={course}
                  accessLoading={accessLoading}
                  enrolledWaiting={enrolledWaiting}
                  scheduledPublishAt={access?.scheduledPublishAt ?? course.scheduledPublishAt}
                  playableLearnSearch={playableLearnSearch}
                />
                <div className="space-y-4 p-5">
                  {!accessLoading ? (
                    <CourseEnrollSidebar
                      course={course}
                      courseDiscount={courseDiscount}
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
                  ) : null}
                </div>
              </div>
            </div>

            <CoursePreviewVideo course={previewCourse} hasPaidAccess={hasPaidAccess} />

            <div className="mb-8">
              <CourseHeroStatsBar course={statsCourse} />
            </div>

            {course.whatYouLearn.length > 0 && (
              <section className="bk-card mb-8 p-5 sm:p-6">
                <h2 className="mb-4 text-xl font-semibold text-foreground">Ce que vous apprendrez</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.whatYouLearn.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-snug text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mb-8">
              <h2 className="mb-1 text-xl font-semibold text-foreground">Programme du cours</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                {course.sections.length} modules · {countLessons(course)} leçons ·{" "}
                {getCourseDisplayDuration(course)}
              </p>
              <CoursePublicCurriculum course={course} hasPaidAccess={hasPaidAccess} />
            </section>

            <section className="bk-card mb-8 p-5">
              <h2 className="mb-3 text-xl font-semibold text-foreground">À propos</h2>
              <p className="text-sm leading-relaxed text-foreground/80">{course.description}</p>
            </section>

            <section className="bk-card mb-4 flex gap-3 p-5">
              <ShieldCheck className="h-7 w-7 shrink-0 text-primary" aria-hidden />
              <div>
                <h3 className="font-semibold text-foreground">
                  {hasPaidAccess
                    ? canStartCourse
                      ? "Vous êtes inscrit à cette formation"
                      : `Inscription confirmée${startLabel ? ` — début le ${startLabel}` : ""}`
                    : scheduledSoon
                      ? `Formation BelKou — début le ${startLabel}`
                      : "Accès à vie après inscription"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasPaidAccess
                    ? canStartCourse
                      ? "Retrouvez toutes vos leçons dans le lecteur ou depuis Mes cours."
                      : "Le contenu vidéo sera débloqué automatiquement à la date prévue."
                    : scheduledSoon
                      ? "Inscrivez-vous dès maintenant. Le contenu vidéo sera débloqué à la date prévue."
                      : "Paiement sécurisé. Support communauté BelKou inclus."}
                </p>
              </div>
            </section>
          </div>

          <div className="hidden lg:block" aria-hidden />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="site-container flex items-center gap-3">
          {accessLoading ? (
            <>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-muted" />
                <div className="h-5 w-1/2 rounded bg-muted" />
              </div>
              <div className="h-11 w-28 rounded bg-muted" />
            </>
          ) : (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted-foreground">{course.title}</p>
                {hasPaidAccess ? (
                  <p className="text-sm font-semibold text-foreground">
                    {canStartCourse
                      ? "Accès actif"
                      : access?.scheduledPublishAt
                        ? `Disponible le ${formatScheduledPublishLabel(access.scheduledPublishAt)}`
                        : "Inscription confirmée"}
                  </p>
                ) : (
                  <p className="text-xl font-semibold tracking-tight text-foreground">
                    {formatCoursePrice(course.price)}
                  </p>
                )}
              </div>
              {canStartCourse ? (
                <Button asChild size="lg" className="shrink-0 rounded-lg px-4 font-semibold">
                  <Link
                    to="/courses/$slug/learn"
                    params={{ slug: course.slug }}
                    search={continueLearnSearch}
                  >
                    {(progress?.progressPercent ?? 0) > 0 ? "Continuer" : "Commencer"}
                  </Link>
                </Button>
              ) : hasPaidAccess ? (
                <Button asChild size="lg" className="shrink-0 rounded-lg px-4 font-semibold">
                  <Link
                    to="/courses/$slug/learn"
                    params={{ slug: course.slug }}
                    search={playableLearnSearch}
                  >
                    {playableLearnSearch ? (hasPublicPreview ? "Preview" : "Bienvenue") : "Cours"}
                  </Link>
                </Button>
              ) : isFreeCourse(course) ? (
                <Button asChild size="lg" className="shrink-0 rounded-lg px-4 font-semibold">
                  <Link to="/login" search={{ redirect: `/courses/${course.slug}/learn` }}>
                    S&apos;inscrire
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="shrink-0 rounded-lg px-4 font-semibold">
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

function CourseEnrollSidebar({
  course,
  courseDiscount,
  hasPaidAccess,
  canStartCourse,
  enrolledWaiting,
  scheduledSoon,
  startLabel,
  hasPublicPreview,
  courseActionLabel,
  continueLearnSearch,
  playableLearnSearch,
  previewLearnSearch,
  progressPercent,
}: {
  course: PublicCourse;
  courseDiscount: number;
  hasPaidAccess: boolean;
  canStartCourse: boolean;
  enrolledWaiting: boolean;
  scheduledSoon: boolean;
  startLabel: string | null;
  hasPublicPreview: boolean;
  courseActionLabel: string;
  continueLearnSearch?: { lesson: string };
  playableLearnSearch?: { lesson: string };
  previewLearnSearch?: { lesson: string };
  progressPercent: number;
}) {
  return (
    <>
      {!hasPaidAccess && (
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight text-foreground">
              {formatCoursePrice(course.price)}
            </span>
            {courseDiscount > 0 && (
              <>
                <span className="text-base text-muted-foreground line-through">
                  ${course.originalPrice}
                </span>
                <span className="text-sm font-semibold text-success">−{courseDiscount}%</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {isFreeCourse(course)
              ? "Accès complet · compte requis"
              : "Paiement unique · accès à vie"}
          </p>
        </div>
      )}

      {canStartCourse ? (
        <Button asChild size="lg" className="h-12 w-full rounded-lg font-semibold">
          <Link
            to="/courses/$slug/learn"
            params={{ slug: course.slug }}
            search={continueLearnSearch}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {courseActionLabel}
            {progressPercent > 0 ? ` · ${progressPercent}%` : ""}
          </Link>
        </Button>
      ) : hasPaidAccess ? (
        <>
          <Button asChild size="lg" className="h-12 w-full rounded-lg font-semibold">
            <Link
              to="/courses/$slug/learn"
              params={{ slug: course.slug }}
              search={playableLearnSearch}
            >
              <Play className="mr-1 h-4 w-4 fill-current" />
              {hasPublicPreview ? "Voir la preview" : "Voir la vidéo de bienvenue"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full rounded">
            <Link to="/dashboard">Mes cours</Link>
          </Button>
        </>
      ) : isFreeCourse(course) ? (
        <>
          <FreeCourseAuthCta slug={course.slug} />
          {hasPublicPreview ? (
            <Button asChild variant="outline" size="lg" className="w-full rounded font-semibold">
              <Link
                to="/courses/$slug/learn"
                params={{ slug: course.slug }}
                search={previewLearnSearch}
              >
                <Play className="mr-1 h-4 w-4 fill-current" />
                Aperçu gratuit
              </Link>
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <Button asChild size="lg" className="h-12 w-full rounded-lg font-semibold">
            <Link to="/checkout" search={{ course: course.slug }}>
              S&apos;inscrire
            </Link>
          </Button>
          {hasPublicPreview ? (
            <Button asChild variant="outline" size="lg" className="w-full rounded font-semibold">
              <Link
                to="/courses/$slug/learn"
                params={{ slug: course.slug }}
                search={previewLearnSearch}
              >
                <Play className="mr-1 h-4 w-4 fill-current" />
                Aperçu gratuit
              </Link>
            </Button>
          ) : null}
        </>
      )}

      {(hasPaidAccess || scheduledSoon) && (
        <p className="text-center text-xs text-muted-foreground">
          {hasPaidAccess
            ? canStartCourse
              ? progressPercent > 0
                ? `${progressPercent}% terminé · progression sauvegardée`
                : "Progression sauvegardée dans Mes cours"
              : enrolledWaiting
                ? `Cours complet le ${startLabel}`
                : "Accès BelKou confirmé"
            : `Cours complet le ${startLabel}`}
        </p>
      )}

      <ul className="space-y-2 border-t border-border pt-4 text-sm text-foreground/80">
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          Accès complet au cours
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          Vidéos et ressources
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          Support communauté BelKou
        </li>
      </ul>
    </>
  );
}
