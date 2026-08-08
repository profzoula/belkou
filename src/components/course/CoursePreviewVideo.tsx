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
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const shouldLoad = inViewport && activated;

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
    if (!shouldLoad || !lesson || lesson.type !== "video" || (!videoId && !vimeoUrl)) {
      if (!shouldLoad) {
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
  }, [shouldLoad, lesson, loadPlayback, videoId, vimeoUrl]);

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

  const thumbnailUrl = course.thumbnail.imageUrl;

  return (
    <section
      ref={sectionRef}
      className={cn(
        "mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border/80 px-4 py-3 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          Aperçu vidéo
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground sm:text-lg">{lesson.title}</h2>
      </div>

      {!activated ? (
        <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/35 px-6 text-center">
            <Button
              type="button"
              variant="hero"
              size="lg"
              className="gap-2 rounded-full px-6 shadow-lg"
              onClick={() => setActivated(true)}
            >
              <Play className="h-5 w-5 fill-current" aria-hidden />
              Lancer l&apos;aperçu
            </Button>
            <p className="max-w-sm text-xs text-white/90">
              La vidéo se charge uniquement quand vous la demandez.
            </p>
          </div>
        </div>
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
