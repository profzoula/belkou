import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock,
  FileText,
  Globe,
  Lock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  getLessonVimeo,
  getSectionForLesson,
  getWelcomePreviewLesson,
  type CourseLesson,
} from "@/lib/courses";
import { getCourseIcon } from "@/lib/course-icons";
import {
  courseStartsAtLabel,
  formatScheduledPublishLabel,
  isCourseContentLive,
  isScheduledInFuture,
} from "@/lib/course-publish";
import { getLessonLockState } from "@/lib/course-access";
import { getCourseAccess, type CourseAccessStatus } from "@/lib/fns/course-access";
import { completeLesson, getCourseProgress } from "@/lib/fns/progress";
import type { PublicCourse } from "@/lib/fns/courses";
import { useAuth } from "@/hooks/use-auth";
import { SiteLogo } from "@/components/site/SiteLogo";
import { siteConfig, getWhatsappGroupUrl } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { VimeoPlayer } from "@/components/course/VimeoPlayer";
import { LessonArticleContent } from "@/components/course/LessonArticleContent";
import { CourseResourcesPanel } from "@/components/course/CourseResourcesPanel";

type CoursePlayerProps = {
  course: PublicCourse;
  initialLessonId?: string;
};

function CourseVideoArea({
  course,
  lesson,
  hasPaidAccess,
  welcomeLessonId,
}: {
  course: PublicCourse;
  lesson: CourseLesson;
  hasPaidAccess: boolean;
  welcomeLessonId?: string;
}) {
  const Icon = getCourseIcon(course.slug);
  const { locked, reason } = getLessonLockState({
    lesson,
    course,
    hasPaidAccess,
  });
  const vimeo = getLessonVimeo(lesson);
  const startLabel = courseStartsAtLabel(course);
  const enrolledWaiting = hasPaidAccess && reason === "schedule";

  if (lesson.type === "article") {
    if (!locked) {
      return (
        <LessonArticleContent
          title={lesson.title}
          content={lesson.content?.trim() || "Contenu en cours de rédaction."}
        />
      );
    }

    return (
      <div className="flex min-h-[280px] w-full flex-col items-center justify-center gap-3 border-b border-border bg-muted/30 px-6 py-12 text-center sm:min-h-[360px]">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <p className="font-semibold">{lesson.title}</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {enrolledWaiting && startLabel
            ? `Vous êtes inscrit — contenu disponible le ${startLabel}`
            : reason === "schedule" && startLabel
              ? `Contenu disponible le ${startLabel}`
              : "Module texte — disponible après inscription."}
        </p>
        {enrolledWaiting ? (
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard">Voir Mes cours</Link>
          </Button>
        ) : reason === "schedule" && startLabel ? (
          <Button asChild size="sm">
            <Link to="/checkout" search={{ course: course.slug }}>
              S&apos;inscrire maintenant
            </Link>
          </Button>
        ) : locked ? (
          <Button asChild size="sm">
            <Link to="/checkout" search={{ course: course.slug }}>
              S&apos;inscrire
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  if (lesson.type !== "video") {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-muted/40 px-6 text-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <p className="font-semibold">{lesson.title}</p>
        <p className="text-sm text-muted-foreground">
          {enrolledWaiting && startLabel
            ? `Vous êtes inscrit — contenu disponible le ${startLabel}`
            : reason === "schedule" && startLabel
              ? `Contenu disponible le ${startLabel}`
              : lesson.type === "article"
                ? "Contenu texte — disponible après inscription."
                : "Ressources téléchargeables — disponible après inscription."}
        </p>
        {enrolledWaiting ? (
          welcomeLessonId && lesson.id !== welcomeLessonId ? (
            <Button asChild size="sm" variant="outline">
              <Link
                to="/courses/$slug/learn"
                params={{ slug: course.slug }}
                search={{ lesson: welcomeLessonId }}
              >
                Voir la vidéo de bienvenue
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard">Voir Mes cours</Link>
            </Button>
          )
        ) : reason === "schedule" && startLabel ? (
          <Button asChild size="sm">
            <Link to="/checkout" search={{ course: course.slug }}>
              S&apos;inscrire maintenant
            </Link>
          </Button>
        ) : locked ? (
          <Button asChild size="sm">
            <Link to="/checkout" search={{ course: course.slug }}>
              S&apos;inscrire
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  if (!locked && vimeo) {
    return <VimeoPlayer video={vimeo} title={lesson.title} lessonKey={lesson.id} />;
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br",
          course.thumbnail.gradient,
          locked && "opacity-60",
        )}
      >
        <Icon className="mb-4 h-16 w-16 text-white/20" aria-hidden />
        <p className="max-w-md px-6 text-center text-lg font-bold text-white">{lesson.title}</p>
        {enrolledWaiting && startLabel ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
            <Lock className="h-4 w-4" />
            Inscription confirmée — vidéos le {startLabel}
          </p>
        ) : reason === "schedule" && startLabel ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
            <Lock className="h-4 w-4" />
            Vidéos disponibles le {startLabel}
          </p>
        ) : locked ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
            <Lock className="h-4 w-4" />
            Contenu réservé aux inscrits
          </p>
        ) : hasPaidAccess ? (
          <p className="mt-2 text-sm text-white/80">
            Vidéo en cours de préparation — disponible au lancement du cours.
          </p>
        ) : (
          <p className="mt-2 text-sm text-white/80">Preview bientôt disponible</p>
        )}
      </div>

      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 px-4">
          {enrolledWaiting ? (
            welcomeLessonId && lesson.id !== welcomeLessonId ? (
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link
                  to="/courses/$slug/learn"
                  params={{ slug: course.slug }}
                  search={{ lesson: welcomeLessonId }}
                >
                  Voir la vidéo de bienvenue
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link to="/dashboard">Retour à Mes cours</Link>
              </Button>
            )
          ) : (
            <Button asChild size="lg" className="rounded-full">
              <Link to="/checkout" search={{ course: course.slug }}>
                {reason === "schedule"
                  ? `S'inscrire — accès le ${startLabel ?? "bientôt"}`
                  : "S'inscrire pour débloquer"}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function EnrolledExtraTab({
  tab,
  course,
  contentLive,
  startLabel,
}: {
  tab: string;
  course: PublicCourse;
  contentLive: boolean;
  startLabel: string | null;
}) {
  const whatsappUrl = getWhatsappGroupUrl("premium");

  if (tab === "qa") {
    return (
      <div className="mx-auto max-w-lg space-y-3 text-left text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground">Questions & réponses</h3>
        <p>Posez vos questions dans le groupe WhatsApp de la cohorte ou écrivez à {siteConfig.contactEmail}.</p>
        {whatsappUrl && (
          <Button asChild variant="soft" size="sm">
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              Ouvrir WhatsApp
            </a>
          </Button>
        )}
      </div>
    );
  }

  if (tab === "notes") {
    return (
      <div className="mx-auto max-w-lg space-y-3 text-left text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground">Notes de cours</h3>
        <p>
          Prenez vos notes dans votre app préférée (Notion, Google Docs, carnet). Les notes intégrées BelKou arrivent
          bientôt.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 text-left text-sm text-muted-foreground">
      <h3 className="font-semibold text-foreground">Avis</h3>
      <p>
        Merci pour votre confiance sur <strong className="text-foreground">{course.title}</strong>. Vous pourrez laisser
        un avis après avoir suivi une partie du cours.
      </p>
    </div>
  );
}

function CurriculumSidebar({
  course,
  activeLessonId,
  hasPaidAccess,
  completedLessonIds,
  onSelectLesson,
}: {
  course: PublicCourse;
  activeLessonId: string;
  hasPaidAccess: boolean;
  completedLessonIds: string[];
  onSelectLesson: (lessonId: string) => void;
}) {
  const defaultSections = course.sections.map((section) => section.id);
  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);

  return (
    <div className="flex h-full flex-col border-t border-border bg-card lg:border-t-0 lg:border-l">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold">Contenu du cours</h2>
        <p className="text-xs text-muted-foreground">
          {course.sections.length} sections · {countLessons(course)} leçons · {course.totalDuration}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={defaultSections} className="px-1">
          {course.sections.map((section) => {
            const completed = section.lessons.filter((lesson) => completedSet.has(lesson.id)).length;
            const sectionDuration = section.lessons.reduce((sum, l) => sum + parseInt(l.duration, 10), 0);

            return (
              <AccordionItem key={section.id} value={section.id} className="border-border">
                <AccordionTrigger className="px-3 py-3 hover:no-underline [&>svg]:hidden">
                  <div className="flex w-full items-start gap-2 text-left">
                    <span className="mt-0.5 text-muted-foreground">▾</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-snug">{section.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {completed}/{section.lessons.length} · {sectionDuration}min
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <ul>
                    {section.lessons.map((lesson, index) => {
                      const active = lesson.id === activeLessonId;
                      const { locked } = getLessonLockState({ lesson, course, hasPaidAccess });
                      const done = completedSet.has(lesson.id);

                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            onClick={() => {
                              const { locked } = getLessonLockState({ lesson, course, hasPaidAccess });
                              if (!locked) onSelectLesson(lesson.id);
                            }}
                            className={cn(
                              "flex w-full items-start gap-2 border-l-2 px-3 py-2.5 text-left text-sm transition-colors",
                              active
                                ? "border-primary bg-primary/10 font-medium text-foreground"
                                : "border-transparent hover:bg-muted/60",
                              locked && !active && "opacity-70",
                            )}
                          >
                            {done ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            ) : locked ? (
                              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                            ) : lesson.type === "article" ? (
                              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                            )}
                            <span className="min-w-0 flex-1 leading-snug">
                              {index + 1}. {lesson.title}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                              {lesson.duration}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

export function CoursePlayer({ course, initialLessonId }: CoursePlayerProps) {
  const { session } = useAuth();
  const accessFn = useServerFn(getCourseAccess);
  const completeFn = useServerFn(completeLesson);
  const progressFn = useServerFn(getCourseProgress);
  const [access, setAccess] = useState<CourseAccessStatus | null>(null);
  const [progress, setProgress] = useState<{ completedLessonIds: string[]; progressPercent: number } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

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
  }, [accessFn, course, session?.access_token]);

  const hasPaidAccess = access?.hasPaidAccess ?? false;
  const contentLive = access?.contentLive ?? isCourseContentLive(course);

  useEffect(() => {
    if (!session?.access_token || !hasPaidAccess) {
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
          setProgress({ completedLessonIds: [], progressPercent: 0 });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [course.slug, hasPaidAccess, progressFn, session?.access_token]);

  const allLessons = useMemo(() => getAllLessons(course), [course]);
  const welcomeLesson = useMemo(() => getWelcomePreviewLesson(course), [course]);

  const resolveLessonId = (lessonId?: string) => {
    const requested = lessonId ? allLessons.find((lesson) => lesson.id === lessonId) : undefined;
    if (requested) {
      const { locked } = getLessonLockState({
        lesson: requested,
        course,
        hasPaidAccess,
      });
      if (!locked) return requested.id;
    }

    const firstUnlocked = allLessons.find((lesson) => {
      const { locked } = getLessonLockState({ lesson, course, hasPaidAccess });
      return !locked;
    });

    return firstUnlocked?.id ?? welcomeLesson?.id ?? allLessons[0]?.id ?? "";
  };

  const [activeLessonId, setActiveLessonId] = useState(() => resolveLessonId(initialLessonId));
  const scheduledSoon = isScheduledInFuture(course);
  const startLabel = courseStartsAtLabel(course);
  const enrolledWaiting = hasPaidAccess && !contentLive;

  useEffect(() => {
    if (!access) return;

    setActiveLessonId((current) => {
      const currentLesson = allLessons.find((lesson) => lesson.id === current);
      if (currentLesson) {
        const { locked } = getLessonLockState({
          lesson: currentLesson,
          course,
          hasPaidAccess,
        });
        if (!locked) return current;
      }

      return resolveLessonId(initialLessonId);
    });
  }, [access, hasPaidAccess, contentLive, initialLessonId, allLessons, welcomeLesson, course]);

  const activeLesson = allLessons.find((lesson) => lesson.id === activeLessonId) ?? allLessons[0];
  const activeSection = getSectionForLesson(course, activeLesson.id);
  const activeLock = getLessonLockState({ lesson: activeLesson, course, hasPaidAccess });

  useEffect(() => {
    if (!session?.access_token || !hasPaidAccess || activeLock.locked) return;
    void completeFn({
      data: {
        accessToken: session.access_token,
        courseSlug: course.slug,
        lessonId: activeLesson.id,
      },
    })
      .then((result) => {
        setProgress((current) => ({
          completedLessonIds: [...new Set([...(current?.completedLessonIds ?? []), activeLesson.id])],
          progressPercent: result.progressPercent,
        }));
      })
      .catch(() => undefined);
  }, [activeLesson.id, activeLock.locked, completeFn, course.slug, hasPaidAccess, session?.access_token]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="site-container flex h-14 items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1 px-2">
            <Link to="/courses/$slug" params={{ slug: course.slug }}>
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Cours</span>
            </Link>
          </Button>
          <SiteLogo className="hidden h-7 w-7 rounded-md sm:inline-flex" alt="" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{course.title}</p>
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <Link to="/courses">Tous les cours</Link>
          </Button>
          {hasPaidAccess ? (
            <Button asChild size="sm" variant="hero">
              <Link to="/dashboard">Mes cours</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/checkout" search={{ course: course.slug }}>
                S&apos;inscrire · ${course.price}
              </Link>
            </Button>
          )}
        </div>
      </header>

      {scheduledSoon && startLabel && !enrolledWaiting && (
        <div className="border-b border-sky-200 bg-sky-50 px-4 py-2.5 text-center text-sm text-sky-900">
          Inscriptions ouvertes — les vidéos seront disponibles le <strong>{startLabel}</strong>
        </div>
      )}

      {enrolledWaiting && access?.scheduledPublishAt && (
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm text-emerald-900">
          Vous êtes inscrit — accès complet au cours le{" "}
          <strong>{formatScheduledPublishLabel(access.scheduledPublishAt)}</strong>
        </div>
      )}

      {hasPaidAccess && contentLive ? (
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <div className="site-container flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-foreground">
              Progression · {progress?.progressPercent ?? 0}% terminé
            </p>
            <div className="h-1.5 w-full max-w-md rounded-full bg-muted overflow-hidden sm:ml-4">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.max(progress?.progressPercent ?? 0, 2)}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="site-container py-4 sm:py-6">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:grid lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <main className="min-w-0">
          <CourseVideoArea
            course={course}
            lesson={activeLesson}
            hasPaidAccess={hasPaidAccess}
            welcomeLessonId={welcomeLesson?.id}
          />

          <div className="border-b border-border px-3 sm:px-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-0 bg-transparent p-0">
                {[
                  { value: "overview", label: "Aperçu" },
                  { value: "qa", label: "Q&R" },
                  { value: "notes", label: "Notes" },
                  { value: "resources", label: "Ressources" },
                  { value: "reviews", label: "Avis" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent px-3 py-3 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-0 px-1 pb-8 pt-6 sm:px-0">
                <h1 className="font-display text-xl font-bold leading-snug sm:text-2xl md:text-3xl">
                  {course.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    {course.rating.toFixed(1)}
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="font-normal text-primary underline">
                      ({formatCount(course.ratingsCount)} avis)
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {formatCount(course.studentsCount)} étudiants
                  </span>
                  <span className="text-muted-foreground">{course.totalDuration}</span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Dernière mise à jour {course.lastUpdated} · {course.language}
                  {course.captions ? " · Sous-titres" : ""}
                </p>

                <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 sm:p-5">
                  <div className="flex gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-semibold">Planifiez votre apprentissage</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Fixez un rappel pour avancer régulièrement — cohorte BelKou :{" "}
                        {siteConfig.cohortStartDate}.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="rounded-full" asChild>
                          <Link to="/checkout" search={{ course: course.slug }}>
                            Commencer
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-8 md:grid-cols-2">
                  <div>
                    <h2 className="mb-3 text-lg font-bold">Ce que vous apprendrez</h2>
                    <ul className="grid gap-2 sm:grid-cols-1">
                      {course.whatYouLearn.map((item) => (
                        <li key={item} className="flex gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h2 className="mb-3 text-lg font-bold">En chiffres</h2>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Niveau</dt>
                        <dd className="font-medium">{course.skillLevel}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Étudiants</dt>
                        <dd className="font-medium">{formatCount(course.studentsCount)}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Langues</dt>
                        <dd className="font-medium">{course.language}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Sous-titres</dt>
                        <dd className="font-medium">{course.captions ? "Oui" : "Non"}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Leçons</dt>
                        <dd className="font-medium">{countLessons(course)}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2">
                        <dt className="text-muted-foreground">Vidéo</dt>
                        <dd className="font-medium">{course.totalDuration}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="mb-3 text-lg font-bold">Description</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
                  {activeSection && (
                    <p className="mt-4 text-sm">
                      <span className="font-medium">Leçon actuelle :</span>{" "}
                      {activeSection.title} — {activeLesson.title}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="resources" className="mt-0 px-1 pb-8 pt-6 sm:px-0">
                {hasPaidAccess ? (
                  <CourseResourcesPanel resources={course.resources ?? []} />
                ) : (
                  <div className="px-1 py-12 text-center sm:px-0">
                    <Globe className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Les ressources (PDF, Word, ebook…) sont disponibles après inscription au cours.
                    </p>
                    <Button asChild className="mt-4" size="sm">
                      <Link to="/checkout" search={{ course: course.slug }}>
                        S&apos;inscrire maintenant
                      </Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {["qa", "notes", "reviews"].map((tab) => (
                <TabsContent key={tab} value={tab} className="px-1 py-12 text-center sm:px-0">
                  {hasPaidAccess ? (
                    <EnrolledExtraTab
                      tab={tab}
                      course={course}
                      contentLive={contentLive}
                      startLabel={courseStartsAtLabel(course)}
                    />
                  ) : (
                    <>
                      <Globe className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Disponible après inscription à ce cours.
                      </p>
                      <Button asChild className="mt-4" size="sm">
                        <Link to="/checkout" search={{ course: course.slug }}>
                          S&apos;inscrire maintenant
                        </Link>
                      </Button>
                    </>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>

        <aside className="lg:sticky lg:top-[calc(var(--site-header-height,3.5rem)+1rem)] lg:max-h-[calc(100dvh-var(--site-header-height,3.5rem)-2rem)] lg:overflow-hidden">
          <CurriculumSidebar
            course={course}
            activeLessonId={activeLessonId}
            hasPaidAccess={hasPaidAccess}
            completedLessonIds={progress?.completedLessonIds ?? []}
            onSelectLesson={(lessonId) => {
              setActiveLessonId(lessonId);
            }}
          />
        </aside>
        </div>
      </div>
    </div>
  );
}
