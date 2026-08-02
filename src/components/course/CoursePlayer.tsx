import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, FileText, Globe, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  computeCourseProgressPercent,
  countLessons,
  formatCount,
  getAllLessons,
  getCourseDisplayDuration,
  getDisplayedCourseStudentsCount,
  getLessonDisplayDuration,
  getLessonVideoId,
  getLessonVimeoUrl,
  getSectionForLesson,
  getWelcomePreviewLesson,
  lessonHasVideo,
  lessonIsCompletable,
  type CourseLesson,
} from "@/lib/courses";
import { getLessonLockState, type LessonLockReason } from "@/lib/course-access";
import { getCourseIcon } from "@/lib/course-icons";
import {
  courseStartsAtLabel,
  formatScheduledPublishLabel,
  isCourseContentLive,
  isScheduledInFuture,
} from "@/lib/course-publish";
import { getCourseAccess, type CourseAccessStatus } from "@/lib/fns/course-access";
import { completeLesson, getCourseProgress, saveLessonPlayback } from "@/lib/fns/progress";
import type { PublicCourse } from "@/lib/fns/courses";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { getLessonVideoPlayback, getLessonVimeoPlayback } from "@/lib/fns/videos";
import type { VideoPlaybackSource } from "@/lib/videos";
import { CourseVideoPlayer } from "@/components/course/CourseVideoPlayer";
import { VimeoVideoPlayer } from "@/components/course/VimeoVideoPlayer";
import { CourseNotesPanel } from "@/components/course/CourseNotesPanel";
import { CourseReviewsPanel } from "@/components/course/CourseReviewsPanel";
import { LessonArticleContent } from "@/components/course/LessonArticleContent";
import { CourseResourcesPanel } from "@/components/course/CourseResourcesPanel";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { CurriculumSidebar } from "@/components/course/CurriculumSidebar";
import { LearnHeader } from "@/components/course/LearnHeader";
import { LessonContextHeader } from "@/components/course/LessonContextHeader";
import { LessonNavControls } from "@/components/course/LessonNavControls";
import {
  getFirstArticleSubSessionId,
  parseArticleSessions,
} from "@/lib/lesson-sessions";
import {
  isLessonQuizRequirementMet,
  lessonHasRequiredQuiz,
  requestOpenLessonQuiz,
} from "@/lib/lesson-quiz";

type CoursePlayerProps = {
  course: PublicCourse;
  initialLessonId?: string;
};

function CourseVideoArea({
  course,
  lesson,
  hasPaidAccess,
  welcomeLessonId,
  nextLessonTitle,
  onNextLesson,
  onLessonComplete,
  getLockState,
  startAtSeconds = 0,
  onPlaybackTimeUpdate,
  activeArticleSubSessionId,
  onArticleSubSessionChange,
  onVideoPlay,
  onQuizGateChange,
}: {
  course: PublicCourse;
  lesson: CourseLesson;
  hasPaidAccess: boolean;
  welcomeLessonId?: string;
  nextLessonTitle?: string;
  onNextLesson?: () => void;
  onLessonComplete?: () => void;
  getLockState: (lesson: CourseLesson) => { locked: boolean; reason: LessonLockReason };
  startAtSeconds?: number;
  onPlaybackTimeUpdate?: (currentTime: number) => void;
  activeArticleSubSessionId?: string | null;
  onArticleSubSessionChange?: (subSessionId: string, options?: { markCurrentAsRead?: boolean }) => void;
  onVideoPlay?: () => void;
  onQuizGateChange?: (passed: boolean) => void;
}) {
  const { session } = useAuth();
  const Icon = getCourseIcon(course.slug);
  const { locked, reason } = getLockState(lesson);
  const videoId = getLessonVideoId(lesson);
  const vimeoUrl = getLessonVimeoUrl(lesson);
  const playbackFn = useServerFn(getLessonVideoPlayback);
  const vimeoPlaybackFn = useServerFn(getLessonVimeoPlayback);
  const [playback, setPlayback] = useState<VideoPlaybackSource | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const refreshPlaybackRef = useRef<(() => Promise<VideoPlaybackSource | null>) | null>(null);
  const startLabel = courseStartsAtLabel(course);
  const enrolledWaiting = hasPaidAccess && reason === "schedule";

  const loadPlayback = useCallback(async (): Promise<VideoPlaybackSource | null> => {
    if (locked || lesson.type !== "video") return null;

    if (vimeoUrl) {
      return vimeoPlaybackFn({
        data: {
          courseSlug: course.slug,
          lessonId: lesson.id,
          preview: lesson.preview,
          accessToken: session?.access_token,
        },
      });
    }

    if (!videoId) return null;

    const result = await playbackFn({
      data: {
        courseSlug: course.slug,
        lessonId: lesson.id,
        videoId,
        preview: lesson.preview,
        accessToken: session?.access_token,
      },
    });
    return result;
  }, [
    course.slug,
    lesson.id,
    lesson.preview,
    lesson.type,
    locked,
    playbackFn,
    session?.access_token,
    videoId,
    vimeoPlaybackFn,
    vimeoUrl,
  ]);

  refreshPlaybackRef.current = loadPlayback;

  useEffect(() => {
    if (locked || lesson.type !== "video" || (!videoId && !vimeoUrl)) {
      setPlayback(null);
      setPlaybackError(null);
      setPlaybackLoading(false);
      return;
    }

    let cancelled = false;
    setPlaybackLoading(true);
    setPlaybackError(null);

    void loadPlayback()
      .then((result) => {
        if (!cancelled) setPlayback(result);
      })
      .catch((error) => {
        if (!cancelled) {
          setPlayback(null);
          setPlaybackError(error instanceof Error ? error.message : "Lecture impossible");
        }
      })
      .finally(() => {
        if (!cancelled) setPlaybackLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lesson.id, lesson.type, loadPlayback, locked, videoId, vimeoUrl]);

  useEffect(() => {
    if (!playback?.urlExpiresAt || locked || lesson.type !== "video") return;

    const refreshInMs = playback.urlExpiresAt - Date.now() - 5 * 60 * 1000;
    const scheduleRefresh = (delay: number) =>
      window.setTimeout(() => {
        void refreshPlaybackRef.current?.()
          .then((next) => {
            if (next) setPlayback(next);
          })
          .catch(() => undefined);
      }, Math.max(delay, 0));

    const timer = scheduleRefresh(refreshInMs);
    return () => window.clearTimeout(timer);
  }, [lesson.type, locked, playback?.urlExpiresAt]);

  if (lesson.type === "article") {
    if (!locked) {
      const articleContent = lesson.content?.trim() || "Contenu en cours de rédaction.";
      const sessions = parseArticleSessions(articleContent);

      return (
        <LessonArticleContent
          title={lesson.title}
          content={articleContent}
          lessonId={lesson.id}
          activeSubSessionId={sessions?.length ? activeArticleSubSessionId : undefined}
          nextLessonTitle={nextLessonTitle}
          onSubSessionChange={onArticleSubSessionChange}
          onComplete={onLessonComplete}
          onQuizGateChange={onQuizGateChange}
        />
      );
    }

    return (
      <div className="flex min-h-[280px] w-full flex-col items-center justify-center gap-3 border-b border-border bg-muted/30 px-6 py-12 text-center sm:min-h-[360px]">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <p className="font-semibold">{lesson.title}</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {reason === "sequential"
            ? "Terminez la leçon précédente pour débloquer ce module."
            : enrolledWaiting && startLabel
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
              : lesson.type === "resource"
                ? "Ressources téléchargeables — disponible après inscription."
                : "Contenu texte — disponible après inscription."}
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

  if (!locked && playback) {
    const player =
      playback.kind === "vimeo" ? (
        <VimeoVideoPlayer
          embedUrl={playback.url}
          title={lesson.title}
          lessonKey={lesson.id}
          nextLessonTitle={nextLessonTitle}
          onNextLesson={onNextLesson}
          onLessonComplete={onLessonComplete}
          onPlay={onVideoPlay}
        />
      ) : (
        <CourseVideoPlayer
          playback={playback}
          title={lesson.title}
          lessonKey={lesson.id}
          startAtSeconds={startAtSeconds}
          onTimeUpdate={onPlaybackTimeUpdate}
          nextLessonTitle={nextLessonTitle}
          onNextLesson={onNextLesson}
          onLessonComplete={onLessonComplete}
          onPlay={onVideoPlay}
          onPlaybackError={() => {
            void refreshPlaybackRef.current?.()
              .then((next) => {
                if (next) {
                  setPlayback(next);
                  setPlaybackError(null);
                }
              })
              .catch(() => undefined);
          }}
        />
      );

    return player;
  }

  if (!locked && lesson.type === "video" && (videoId || vimeoUrl) && playbackLoading) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-black text-sm text-white/80">
        Chargement de la vidéo…
      </div>
    );
  }

  if (!locked && lesson.type === "video" && (videoId || vimeoUrl) && playbackError) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted/40 px-6 text-center">
        <p className="font-semibold">{lesson.title}</p>
        <p className="text-sm text-muted-foreground">{playbackError}</p>
      </div>
    );
  }

  const placeholderStatus = enrolledWaiting && startLabel
    ? `Inscription confirmée — vidéos le ${startLabel}`
    : reason === "schedule" && startLabel
      ? `Vidéos disponibles le ${startLabel}`
      : reason === "sequential"
        ? "Terminez la leçon précédente pour continuer"
        : locked
          ? "Contenu réservé aux inscrits"
          : hasPaidAccess
            ? "Vidéo en cours de préparation."
            : "Preview bientôt disponible";

  return (
    <CourseThumbnailBanner
      thumbnail={course.thumbnail}
      slug={course.slug}
      icon={Icon}
      aspectClass="aspect-video"
      showLabel={false}
      showIcon={!course.thumbnail.imageUrl}
      className="w-full"
    >
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/30 px-6 text-center">
        <p className="max-w-md text-lg font-bold text-white drop-shadow-sm">{lesson.title}</p>
        <p className="flex items-center gap-1.5 text-sm text-white/90 drop-shadow-sm">
          {(locked || reason === "sequential" || enrolledWaiting || reason === "schedule") && (
            <Lock className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {placeholderStatus}
        </p>
        {locked && reason !== "sequential" ? (
          enrolledWaiting ? (
            welcomeLessonId && lesson.id !== welcomeLessonId ? (
              <Button asChild size="lg" variant="secondary" className="mt-2 rounded-full">
                <Link
                  to="/courses/$slug/learn"
                  params={{ slug: course.slug }}
                  search={{ lesson: welcomeLessonId }}
                >
                  Voir la vidéo de bienvenue
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="secondary" className="mt-2 rounded-full">
                <Link to="/dashboard">Retour à Mes cours</Link>
              </Button>
            )
          ) : (
            <Button asChild size="lg" className="mt-2 rounded-full">
              <Link to="/checkout" search={{ course: course.slug }}>
                {reason === "schedule"
                  ? `S'inscrire — accès le ${startLabel ?? "bientôt"}`
                  : "S'inscrire pour débloquer"}
              </Link>
            </Button>
          )
        ) : null}
      </div>
    </CourseThumbnailBanner>
  );
}

function EnrolledExtraTab({
  tab,
  course,
  contentLive,
  startLabel,
  activeLessonId,
  allLessons,
  accessToken,
}: {
  tab: string;
  course: PublicCourse;
  contentLive: boolean;
  startLabel: string | null;
  activeLessonId: string;
  allLessons: CourseLesson[];
  accessToken: string;
}) {
  if (tab === "qa") {
    return (
      <div className="mx-auto max-w-lg space-y-3 text-left text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground">Questions & réponses</h3>
        <p>
          Posez vos questions sur le forum du cours — les réponses et discussions restent accessibles à toute la communauté.
        </p>
        <Button asChild variant="soft" size="sm">
          <Link to="/forum/$courseSlug" params={{ courseSlug: course.slug }}>
            Ouvrir le forum
          </Link>
        </Button>
      </div>
    );
  }

  if (tab === "notes") {
    if (!contentLive && startLabel) {
      return (
        <div className="mx-auto max-w-lg space-y-3 text-left text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground">Notes de cours</h3>
          <p>Les notes seront disponibles quand le contenu complet sera publié le {startLabel}.</p>
        </div>
      );
    }

    return (
      <CourseNotesPanel
        courseSlug={course.slug}
        lessons={allLessons}
        activeLessonId={activeLessonId}
        accessToken={accessToken}
      />
    );
  }

  return (
    <CourseReviewsPanel
      courseSlug={course.slug}
      courseTitle={course.title}
      accessToken={accessToken}
      fallbackRating={course.rating}
      fallbackCount={course.ratingsCount}
    />
  );
}

export function CoursePlayer({ course, initialLessonId }: CoursePlayerProps) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const accessFn = useServerFn(getCourseAccess);
  const completeFn = useServerFn(completeLesson);
  const progressFn = useServerFn(getCourseProgress);
  const savePlaybackFn = useServerFn(saveLessonPlayback);
  const [access, setAccess] = useState<CourseAccessStatus | null>(null);
  const [progress, setProgress] = useState<{
    completedLessonIds: string[];
    playbackByLessonId: Record<string, number>;
    progressPercent: number;
  } | null>(null);
  const markedLessonsRef = useRef(new Set<string>());
  const lastPlaybackSaveRef = useRef(0);

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
        if (!cancelled) {
          setProgress(result);
          markedLessonsRef.current = new Set(result.completedLessonIds);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProgress({ completedLessonIds: [], playbackByLessonId: {}, progressPercent: 0 });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [course.slug, hasPaidAccess, progressFn, session?.access_token]);

  const allLessons = useMemo(() => getAllLessons(course), [course]);
  const welcomeLesson = useMemo(() => getWelcomePreviewLesson(course), [course]);
  const orderedLessonIds = useMemo(() => allLessons.map((lesson) => lesson.id), [allLessons]);
  const completedLessonIds = progress?.completedLessonIds ?? [];
  const playbackByLessonId = progress?.playbackByLessonId ?? {};

  const handlePlaybackTimeUpdate = useCallback(
    (lessonId: string, currentTime: number) => {
      if (!session?.access_token || !hasPaidAccess) return;
      if (currentTime < 5) return;

      const now = Date.now();
      if (now - lastPlaybackSaveRef.current < 15_000) return;
      lastPlaybackSaveRef.current = now;

      setProgress((current) =>
        current
          ? {
              ...current,
              playbackByLessonId: {
                ...current.playbackByLessonId,
                [lessonId]: Math.floor(currentTime),
              },
            }
          : current,
      );

      void savePlaybackFn({
        data: {
          accessToken: session.access_token,
          courseSlug: course.slug,
          lessonId,
          currentTimeSeconds: currentTime,
        },
      }).catch(() => undefined);
    },
    [course.slug, hasPaidAccess, savePlaybackFn, session?.access_token],
  );

  const getLockState = useCallback(
    (lesson: CourseLesson) =>
      getLessonLockState({
        lesson,
        course,
        hasPaidAccess,
        ...(hasPaidAccess && contentLive ? { completedLessonIds, orderedLessonIds } : {}),
      }),
    [completedLessonIds, contentLive, course, hasPaidAccess, orderedLessonIds],
  );

  const resolveLessonId = (lessonId?: string) => {
    const requested = lessonId ? allLessons.find((lesson) => lesson.id === lessonId) : undefined;
    if (requested) {
      const { locked } = getLockState(requested);
      if (!locked) return requested.id;
    }

    const firstUnlocked = allLessons.find((lesson) => !getLockState(lesson).locked);

    return firstUnlocked?.id ?? welcomeLesson?.id ?? allLessons[0]?.id ?? "";
  };

  const [activeLessonId, setActiveLessonId] = useState(() => resolveLessonId(initialLessonId));
  const [activeArticleSubSessionId, setActiveArticleSubSessionId] = useState<string | null>(null);
  const [viewedArticleSubSessionIds, setViewedArticleSubSessionIds] = useState<Set<string>>(new Set());
  const [resumeAtSeconds, setResumeAtSeconds] = useState(0);

  useEffect(() => {
    setResumeAtSeconds(playbackByLessonId[activeLessonId] ?? 0);
    // Only restore saved position when switching lessons — not on every 15s autosave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLessonId]);

  useEffect(() => {
    lastPlaybackSaveRef.current = 0;
  }, [activeLessonId]);

  const selectLesson = useCallback(
    (lessonId: string) => {
      setActiveLessonId(lessonId);
      void navigate({
        to: "/courses/$slug/learn",
        params: { slug: course.slug },
        search: { lesson: lessonId },
        replace: true,
      });
    },
    [course.slug, navigate],
  );
  const scheduledSoon = isScheduledInFuture(course);
  const startLabel = courseStartsAtLabel(course);
  const enrolledWaiting = hasPaidAccess && !contentLive;

  useEffect(() => {
    if (!access) return;

    setActiveLessonId((current) => {
      const currentLesson = allLessons.find((lesson) => lesson.id === current);
      if (currentLesson) {
        const { locked } = getLockState(currentLesson);
        if (!locked) return current;
      }

      return resolveLessonId(initialLessonId);
    });
  }, [access, getLockState, initialLessonId, allLessons, welcomeLesson, course]);

  const activeLesson = allLessons.find((lesson) => lesson.id === activeLessonId) ?? allLessons[0];
  const [activeQuizPassed, setActiveQuizPassed] = useState(() =>
    isLessonQuizRequirementMet(activeLesson),
  );

  useEffect(() => {
    setActiveQuizPassed(isLessonQuizRequirementMet(activeLesson));
  }, [activeLesson]);

  const quizBlocksComplete = lessonHasRequiredQuiz(activeLesson) && !activeQuizPassed;

  const [playerTab, setPlayerTab] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      const lesson = allLessons.find((l) => l.id === activeLessonId) ?? allLessons[0];
      return lesson?.type === "video" ? "curriculum" : "overview";
    }
    return "overview";
  });

  const openCurriculumTab = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setPlayerTab("curriculum");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 1023px)").matches) return;
    setPlayerTab(activeLesson.type === "video" ? "curriculum" : "overview");
  }, [activeLesson.id, activeLesson.type]);
  const activeArticleSessions = useMemo(() => {
    if (activeLesson?.type !== "article" || !activeLesson.content) return null;
    return parseArticleSessions(activeLesson.content);
  }, [activeLesson]);

  useEffect(() => {
    if (!activeLesson || !activeArticleSessions?.length) {
      setActiveArticleSubSessionId(null);
      return;
    }

    setActiveArticleSubSessionId((current) => {
      if (current?.startsWith(`${activeLesson.id}::`)) return current;
      return getFirstArticleSubSessionId(activeLesson.id, activeArticleSessions);
    });
  }, [activeLesson, activeArticleSessions]);

  const markArticleSubSessionRead = useCallback((subSessionId: string) => {
    setViewedArticleSubSessionIds((current) => new Set(current).add(subSessionId));
  }, []);

  const handleArticleSubSessionChange = useCallback(
    (subSessionId: string, options?: { markCurrentAsRead?: boolean }) => {
      if (options?.markCurrentAsRead && activeArticleSubSessionId) {
        markArticleSubSessionRead(activeArticleSubSessionId);
      }
      setActiveArticleSubSessionId(subSessionId);
    },
    [activeArticleSubSessionId, markArticleSubSessionRead],
  );

  const handleSelectArticleSubSession = useCallback(
    (lessonId: string, subSessionId: string) => {
      if (lessonId !== activeLessonId) {
        selectLesson(lessonId);
      }
      setActiveArticleSubSessionId(subSessionId);
    },
    [activeLessonId, selectLesson],
  );

  const activeSection = getSectionForLesson(course, activeLesson.id);
  const [lessonQuery, setLessonQuery] = useState("");
  const lessonNumber =
    allLessons.findIndex((lesson) => lesson.id === activeLessonId) + 1;
  const activeLessonCompleted = completedLessonIds.includes(activeLesson.id);

  const previousLesson = useMemo(() => {
    const currentIndex = allLessons.findIndex((lesson) => lesson.id === activeLessonId);
    if (currentIndex <= 0) return null;

    for (let index = currentIndex - 1; index >= 0; index -= 1) {
      const candidate = allLessons[index];
      if (!candidate) continue;
      const { locked } = getLockState(candidate);
      if (!locked) return candidate;
    }

    return null;
  }, [activeLessonId, allLessons, getLockState]);

  const nextLesson = useMemo(() => {
    const currentIndex = allLessons.findIndex((lesson) => lesson.id === activeLessonId);
    if (currentIndex < 0) return null;

    for (let index = currentIndex + 1; index < allLessons.length; index += 1) {
      const candidate = allLessons[index];
      if (!candidate) continue;
      const { locked } = getLockState(candidate);
      if (!locked) return candidate;
    }

    return null;
  }, [activeLessonId, allLessons, getLockState]);

  const goToPreviousLesson = useCallback(() => {
    if (!previousLesson) return;
    selectLesson(previousLesson.id);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [previousLesson, selectLesson]);

  const goToNextLesson = useCallback(() => {
    if (!nextLesson) return;
    selectLesson(nextLesson.id);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [nextLesson, selectLesson]);

  const recordLessonComplete = useCallback(
    (lessonId: string) => {
      if (!session?.access_token || !hasPaidAccess) return;
      if (markedLessonsRef.current.has(lessonId)) return;
      markedLessonsRef.current.add(lessonId);

      void completeFn({
        data: {
          accessToken: session.access_token,
          courseSlug: course.slug,
          lessonId,
        },
      })
        .then((result) => {
          setProgress((current) => ({
            completedLessonIds: [...new Set([...(current?.completedLessonIds ?? []), lessonId])],
            playbackByLessonId: current?.playbackByLessonId ?? {},
            progressPercent: result.progressPercent,
          }));
        })
        .catch(() => {
          markedLessonsRef.current.delete(lessonId);
          setProgress((current) => {
            const completedLessonIds = (current?.completedLessonIds ?? []).filter((id) => id !== lessonId);
            return {
              completedLessonIds,
              playbackByLessonId: current?.playbackByLessonId ?? {},
              progressPercent: computeCourseProgressPercent(course, completedLessonIds),
            };
          });
        });
    },
    [completeFn, course, hasPaidAccess, session?.access_token],
  );

  const handleActiveLessonComplete = useCallback(() => {
    if (lessonHasRequiredQuiz(activeLesson) && !isLessonQuizRequirementMet(activeLesson)) {
      setActiveQuizPassed(false);
      requestOpenLessonQuiz();
      return;
    }

    if (activeArticleSubSessionId) {
      markArticleSubSessionRead(activeArticleSubSessionId);
    }

    const completedId = activeLesson.id;
    const optimisticCompleted = [...new Set([...completedLessonIds, completedId])];

    setProgress((current) => ({
      completedLessonIds: optimisticCompleted,
      playbackByLessonId: current?.playbackByLessonId ?? {},
      progressPercent: computeCourseProgressPercent(course, optimisticCompleted),
    }));

    recordLessonComplete(completedId);

    const currentIndex = allLessons.findIndex((lesson) => lesson.id === completedId);
    if (currentIndex < 0) return;

    for (let index = currentIndex + 1; index < allLessons.length; index += 1) {
      const candidate = allLessons[index]!;
      if (!lessonIsCompletable(candidate)) continue;

      const { locked } = getLessonLockState({
        lesson: candidate,
        course,
        hasPaidAccess,
        completedLessonIds: optimisticCompleted,
        orderedLessonIds,
      });

      if (!locked) {
        selectLesson(candidate.id);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }
    }
  }, [
    activeArticleSubSessionId,
    activeLesson,
    allLessons,
    completedLessonIds,
    course,
    hasPaidAccess,
    markArticleSubSessionRead,
    orderedLessonIds,
    recordLessonComplete,
    selectLesson,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousLesson();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        // Do not auto-complete; only navigate when the next lesson is already unlocked.
        goToNextLesson();
      }
      if ((event.key === "c" || event.key === "C") && hasPaidAccess && contentLive && !activeLessonCompleted) {
        event.preventDefault();
        handleActiveLessonComplete();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeLessonCompleted,
    contentLive,
    goToNextLesson,
    goToPreviousLesson,
    handleActiveLessonComplete,
    hasPaidAccess,
  ]);

  const progressPercent = progress?.progressPercent ?? 0;
  const remainingLessons = Math.max(countLessons(course) - completedLessonIds.length, 0);

  return (
    <div
      className={cn(
        "min-h-dvh text-foreground dark:bg-background",
        activeLesson.type === "article" ? "bg-white" : "bg-[#F8FAFC]",
      )}
    >
      <LearnHeader
        courseTitle={course.title}
        courseSlug={course.slug}
        progressPercent={progressPercent}
        hasPaidAccess={hasPaidAccess}
        coursePrice={course.price}
        lessonQuery={lessonQuery}
        onLessonQueryChange={setLessonQuery}
      />

      {scheduledSoon && startLabel && !enrolledWaiting && (
        <div className="border-b border-primary/20 bg-primary/10 px-4 py-2.5 text-center text-sm text-foreground">
          Inscriptions ouvertes — les vidéos seront disponibles le <strong>{startLabel}</strong>
        </div>
      )}

      {enrolledWaiting && access?.scheduledPublishAt && (
        <div className="border-b border-success/25 bg-success/10 px-4 py-2.5 text-center text-sm text-foreground">
          Vous êtes inscrit — accès complet au cours le{" "}
          <strong>{formatScheduledPublishLabel(access.scheduledPublishAt)}</strong>
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-4 py-4 pb-24 sm:px-6 sm:py-6 lg:pb-8">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="hidden lg:sticky lg:top-[calc(4rem+1rem)] lg:flex lg:h-[calc(100dvh-5rem)] lg:max-h-[calc(100dvh-5rem)] lg:flex-col lg:overflow-hidden lg:rounded-[20px] lg:border lg:border-border lg:bg-card lg:shadow-[0_8px_30px_rgb(15_23_42_/_0.06)]">
            <CurriculumSidebar
              course={course}
              activeLessonId={activeLessonId}
              activeArticleSubSessionId={activeArticleSubSessionId}
              viewedArticleSubSessionIds={viewedArticleSubSessionIds}
              getLockState={getLockState}
              completedLessonIds={completedLessonIds}
              progressPercent={progressPercent}
              onSelectLesson={selectLesson}
              onSelectArticleSubSession={handleSelectArticleSubSession}
              lessonQuery={lessonQuery}
              onLessonQueryChange={setLessonQuery}
            />
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_12px_40px_rgb(15_23_42_/_0.08)]">
              <div className="space-y-4 border-b border-border px-4 py-4 sm:px-6 sm:py-5">
                <LessonContextHeader
                  courseTitle={course.title}
                  moduleTitle={activeSection?.title}
                  lessonNumber={Math.max(lessonNumber, 1)}
                  lessonTitle={activeLesson.title}
                  instructor={course.instructor}
                  duration={getLessonDisplayDuration(activeLesson)}
                  publishedLabel={course.lastUpdated}
                />
              </div>

              <div className={activeLesson.type === "article" ? "bg-white" : "bg-black/95"}>
                <CourseVideoArea
                  course={course}
                  lesson={activeLesson}
                  hasPaidAccess={hasPaidAccess}
                  welcomeLessonId={welcomeLesson?.id}
                  nextLessonTitle={nextLesson?.title}
                  onNextLesson={
                    nextLesson && !quizBlocksComplete ? handleActiveLessonComplete : undefined
                  }
                  onLessonComplete={handleActiveLessonComplete}
                  getLockState={getLockState}
                  startAtSeconds={resumeAtSeconds}
                  onPlaybackTimeUpdate={(currentTime) =>
                    handlePlaybackTimeUpdate(activeLesson.id, currentTime)
                  }
                  activeArticleSubSessionId={activeArticleSubSessionId}
                  onArticleSubSessionChange={handleArticleSubSessionChange}
                  onVideoPlay={openCurriculumTab}
                  onQuizGateChange={setActiveQuizPassed}
                />
              </div>

              <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
                {hasPaidAccess && contentLive ? (
                  <div className="rounded-[16px] border border-border bg-muted/40 p-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Progression du cours</p>
                        <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                          {progressPercent}%
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>
                          <span className="font-semibold text-foreground">
                            {completedLessonIds.length}
                          </span>{" "}
                          terminées
                        </p>
                        <p className="mt-0.5">{remainingLessons} restantes</p>
                      </div>
                    </div>
                    <div
                      className="mt-3 h-2.5 overflow-hidden rounded-full bg-background"
                      role="progressbar"
                      aria-valuenow={progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progression : ${progressPercent} %`}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                        style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <LessonNavControls
                  canGoPrevious={Boolean(previousLesson)}
                  canGoNext={Boolean(nextLesson)}
                  canMarkComplete={
                    hasPaidAccess &&
                    contentLive &&
                    lessonIsCompletable(activeLesson) &&
                    !quizBlocksComplete
                  }
                  isCompleted={activeLessonCompleted}
                  previousTitle={previousLesson?.title}
                  nextTitle={nextLesson?.title}
                  onPrevious={goToPreviousLesson}
                  onNext={goToNextLesson}
                  onMarkComplete={handleActiveLessonComplete}
                />

                {(course.resources?.length ?? 0) > 0 && hasPaidAccess ? (
                  <p className="text-sm text-muted-foreground">
                    Ressources disponibles dans l&apos;onglet{" "}
                    <button
                      type="button"
                      className="font-semibold text-primary underline-offset-2 hover:underline"
                      onClick={() => setPlayerTab("resources")}
                    >
                      Téléchargements
                    </button>
                    .
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[20px] border border-border bg-card p-3 shadow-sm sm:p-4">
              <Tabs value={playerTab} onValueChange={setPlayerTab} className="w-full">
                <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-[14px] bg-muted/70 p-1">
                  {[
                    { value: "overview", label: "Aperçu" },
                    { value: "curriculum", label: "Programme", mobileOnly: true },
                    { value: "notes", label: "Notes" },
                    { value: "resources", label: "Fichiers" },
                    { value: "qa", label: "Q&R" },
                    { value: "reviews", label: "Avis" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={cn(
                        "shrink-0 rounded-[12px] px-3 py-2 text-xs font-semibold text-muted-foreground transition data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:text-sm",
                        tab.mobileOnly && "lg:hidden",
                      )}
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="curriculum" className="mt-4 pb-12 lg:hidden">
                  <CurriculumSidebar
                    variant="tab"
                    course={course}
                    activeLessonId={activeLessonId}
                    activeArticleSubSessionId={activeArticleSubSessionId}
                    viewedArticleSubSessionIds={viewedArticleSubSessionIds}
                    getLockState={getLockState}
                    completedLessonIds={completedLessonIds}
                    progressPercent={progressPercent}
                    onSelectLesson={selectLesson}
                    onSelectArticleSubSession={handleSelectArticleSubSession}
                    lessonQuery={lessonQuery}
                    onLessonQueryChange={setLessonQuery}
                  />
                </TabsContent>

                <TabsContent value="overview" className="mt-4 space-y-8 px-1 pb-12 sm:px-2">
                  <div>
                    <h2 className="font-display text-[22px] font-bold tracking-tight">{course.title}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        {course.rating.toFixed(1)}
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        <span className="font-normal text-primary underline">
                          ({formatCount(course.ratingsCount)} avis)
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        {formatCount(getDisplayedCourseStudentsCount(course))} étudiants
                      </span>
                      <span className="text-muted-foreground">{getCourseDisplayDuration(course)}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Dernière mise à jour {course.lastUpdated} · {course.language}
                      {course.captions ? " · Sous-titres" : ""}
                    </p>
                  </div>

                  <div className="rounded-[16px] border border-border bg-muted/30 p-4 sm:p-5">
                    <div className="flex gap-3">
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="font-semibold">Continuez votre apprentissage</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activeSection
                            ? `${activeSection.title} — ${activeLesson.title}`
                            : "Avancez à votre rythme sur ce parcours BelKou."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div>
                      <h3 className="mb-3 font-display text-[22px] font-bold">Ce que vous apprendrez</h3>
                      <ul className="grid gap-2">
                        {course.whatYouLearn.map((item) => (
                          <li key={item} className="flex gap-2 text-sm sm:text-base">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-3 font-display text-[22px] font-bold">En chiffres</h3>
                      <dl className="space-y-2 text-sm sm:text-base">
                        <div className="flex justify-between gap-4 border-b border-border py-2">
                          <dt className="text-muted-foreground">Niveau</dt>
                          <dd className="font-medium">{course.skillLevel}</dd>
                        </div>
                        <div className="flex justify-between gap-4 border-b border-border py-2">
                          <dt className="text-muted-foreground">Étudiants</dt>
                          <dd className="font-medium">
                            {formatCount(getDisplayedCourseStudentsCount(course))}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 border-b border-border py-2">
                          <dt className="text-muted-foreground">Leçons</dt>
                          <dd className="font-medium">{countLessons(course)}</dd>
                        </div>
                        <div className="flex justify-between gap-4 py-2">
                          <dt className="text-muted-foreground">Durée</dt>
                          <dd className="font-medium">{getCourseDisplayDuration(course)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 font-display text-[22px] font-bold">Description</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {course.description}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="mt-4 px-1 pb-12 sm:px-2">
                  {hasPaidAccess ? (
                    <CourseResourcesPanel resources={course.resources ?? []} />
                  ) : (
                    <div className="py-12 text-center">
                      <Globe className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Les ressources sont disponibles après inscription au cours.
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
                  <TabsContent key={tab} value={tab} className="mt-4 px-1 py-8 pb-12 text-center sm:px-2">
                    {hasPaidAccess && session?.access_token ? (
                      <EnrolledExtraTab
                        tab={tab}
                        course={course}
                        contentLive={contentLive}
                        startLabel={courseStartsAtLabel(course)}
                        activeLessonId={activeLessonId}
                        allLessons={allLessons}
                        accessToken={session.access_token}
                      />
                    ) : hasPaidAccess ? (
                      <p className="text-sm text-muted-foreground">
                        Reconnectez-vous pour accéder à cette section.
                      </p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
