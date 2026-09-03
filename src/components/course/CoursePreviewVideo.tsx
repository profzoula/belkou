import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import {
  getFirstPreviewVideoLesson,
  getLessonVideoId,
  getLessonVimeoUrl,
  getWelcomePreviewLesson,
  lessonHasVideo,
  type CourseLesson,
} from "@/lib/courses";
import { getLessonVideoPlayback, getLessonVimeoPlayback } from "@/lib/fns/videos";
import type { PublicCourse } from "@/lib/fns/courses";
import type { VideoPlaybackSource } from "@/lib/videos";
import { cn } from "@/lib/utils";

const LazyCourseVideoPlayer = lazy(() =>
  import("@/components/course/CourseVideoPlayer").then((module) => ({
    default: module.CourseVideoPlayer,
  })),
);

const LazyVimeoVideoPlayer = lazy(() =>
  import("@/components/course/VimeoVideoPlayer").then((module) => ({
    default: module.VimeoVideoPlayer,
  })),
);

type CoursePreviewVideoProps = {
  course: PublicCourse;
  hasPaidAccess: boolean;
  className?: string;
};

function pickPreviewLesson(course: PublicCourse, hasPaidAccess: boolean): CourseLesson | undefined {
  const publicPreview = getFirstPreviewVideoLesson(course);
  if (publicPreview && lessonHasVideo(publicPreview)) return publicPreview;

  if (hasPaidAccess) {
    const welcome = getWelcomePreviewLesson(course);
    if (welcome && lessonHasVideo(welcome)) return welcome;
  }

  return undefined;
}

function useInViewport(ref: RefObject<HTMLElement | null>, rootMargin = "240px") {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin, visible]);

  return visible;
}

function VideoPlayerFallback() {
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-black text-sm text-white/80">
      Chargement du lecteur…
    </div>
  );
}

export function CoursePreviewVideo({ course, hasPaidAccess, className }: CoursePreviewVideoProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const inViewport = useInViewport(sectionRef);
  const { session } = useAuth();
  const lesson = useMemo(() => pickPreviewLesson(course, hasPaidAccess), [course, hasPaidAccess]);
  const playbackFn = useServerFn(getLessonVideoPlayback);
  const vimeoPlaybackFn = useServerFn(getLessonVimeoPlayback);
  const [activated, setActivated] = useState(false);
  const [playback, setPlayback] = useState<VideoPlaybackSource | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const refreshPlaybackRef = useRef<(() => Promise<VideoPlaybackSource | null>) | null>(null);

  const videoId = lesson ? getLessonVideoId(lesson) : null;
  const vimeoUrl = lesson ? getLessonVimeoUrl(lesson) : null;
  const usePreviewMode = Boolean(lesson?.preview) && !hasPaidAccess;
  const shouldFetchPlayback = inViewport;

  const loadPlayback = useCallback(async (): Promise<VideoPlaybackSource | null> => {
    if (!lesson || lesson.type !== "video") return null;

    if (vimeoUrl) {
      return vimeoPlaybackFn({
        data: {
          courseSlug: course.slug,
          lessonId: lesson.id,
          preview: usePreviewMode ? true : undefined,
          accessToken: hasPaidAccess ? session?.access_token : undefined,
        },
      });
    }

    if (!videoId) return null;

    return playbackFn({
      data: {
        courseSlug: course.slug,
        lessonId: lesson.id,
        videoId,
        preview: usePreviewMode ? true : undefined,
        accessToken: hasPaidAccess ? session?.access_token : undefined,
      },
    });
  }, [
    course.slug,
    hasPaidAccess,
    lesson,
    playbackFn,
    session?.access_token,
    usePreviewMode,
    videoId,
    vimeoPlaybackFn,
    vimeoUrl,
  ]);

  refreshPlaybackRef.current = loadPlayback;

  useEffect(() => {
    if (!shouldFetchPlayback || !lesson || lesson.type !== "video" || (!videoId && !vimeoUrl)) {
      if (!shouldFetchPlayback) {
        setPlayback(null);
        setPlaybackError(null);
        setPlaybackLoading(false);
      }
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
  }, [shouldFetchPlayback, lesson, loadPlayback, videoId, vimeoUrl]);

  useEffect(() => {
    if (!playback?.urlExpiresAt || !lesson || lesson.type !== "video") return;

    const refreshInMs = playback.urlExpiresAt - Date.now() - 5 * 60 * 1000;
    const timer = window.setTimeout(
      () => {
        void refreshPlaybackRef
          .current?.()
          .then((next) => {
            if (next) setPlayback(next);
          })
          .catch(() => undefined);
      },
      Math.max(refreshInMs, 0),
    );

    return () => window.clearTimeout(timer);
  }, [lesson, playback?.urlExpiresAt]);

  if (!lesson) return null;

  const posterUrl = playback?.posterUrl?.trim() || null;

  return (
    <section
      ref={sectionRef}
      className={cn(
        "mb-8 overflow-hidden rounded-lg border border-border bg-white shadow-sm dark:bg-card",
        className,
      )}
    >
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-base font-bold text-foreground sm:text-lg">{lesson.title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Aperçu du cours</p>
      </div>

      {!activated ? (
        playbackLoading ? (
          <div className="aspect-video w-full bg-muted/60" aria-hidden />
        ) : posterUrl ? (
          <button
            type="button"
            className="relative block aspect-video w-full overflow-hidden bg-black"
            onClick={() => setActivated(true)}
            aria-label={`Lire l'aperçu : ${lesson.title}`}
          >
            <img src={posterUrl} alt="" className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted/40 px-6 text-center">
            <p className="text-sm font-medium text-foreground">{lesson.title}</p>
            <p className="text-sm text-muted-foreground">
              {playbackError ?? "Aperçu vidéo indisponible pour le moment."}
            </p>
          </div>
        )
      ) : playbackLoading ? (
        <div className="flex aspect-video w-full items-center justify-center bg-black text-sm text-white/80">
          Chargement de la vidéo…
        </div>
      ) : playback ? (
        <Suspense fallback={<VideoPlayerFallback />}>
          {playback.kind === "vimeo" ? (
            <LazyVimeoVideoPlayer
              embedUrl={playback.url}
              title={lesson.title}
              lessonKey={lesson.id}
            />
          ) : (
            <LazyCourseVideoPlayer playback={playback} title={lesson.title} lessonKey={lesson.id} />
          )}
        </Suspense>
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted/40 px-6 text-center">
          <p className="text-sm font-medium text-foreground">{lesson.title}</p>
          <p className="text-sm text-muted-foreground">
            {playbackError ?? "Aperçu vidéo indisponible pour le moment."}
          </p>
        </div>
      )}
    </section>
  );
}
