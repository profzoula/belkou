import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CourseVideoPlayer } from "@/components/course/CourseVideoPlayer";
import { VimeoVideoPlayer } from "@/components/course/VimeoVideoPlayer";
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

export function CoursePreviewVideo({ course, hasPaidAccess, className }: CoursePreviewVideoProps) {
  const { session } = useAuth();
  const lesson = useMemo(() => pickPreviewLesson(course, hasPaidAccess), [course, hasPaidAccess]);
  const playbackFn = useServerFn(getLessonVideoPlayback);
  const vimeoPlaybackFn = useServerFn(getLessonVimeoPlayback);
  const [playback, setPlayback] = useState<VideoPlaybackSource | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const refreshPlaybackRef = useRef<(() => Promise<VideoPlaybackSource | null>) | null>(null);

  const videoId = lesson ? getLessonVideoId(lesson) : null;
  const vimeoUrl = lesson ? getLessonVimeoUrl(lesson) : null;
  const usePreviewMode = Boolean(lesson?.preview) && !hasPaidAccess;

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
    if (!lesson || lesson.type !== "video" || (!videoId && !vimeoUrl)) {
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
  }, [lesson, loadPlayback, videoId, vimeoUrl]);

  useEffect(() => {
    if (!playback?.urlExpiresAt || !lesson || lesson.type !== "video") return;

    const refreshInMs = playback.urlExpiresAt - Date.now() - 5 * 60 * 1000;
    const timer = window.setTimeout(
      () => {
        void refreshPlaybackRef.current?.()
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

  return (
    <section className={cn("mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
      <div className="border-b border-border/80 px-4 py-3 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Aperçu vidéo</p>
        <h2 className="mt-1 text-base font-semibold text-foreground sm:text-lg">{lesson.title}</h2>
      </div>

      {playbackLoading ? (
        <div className="flex aspect-video w-full items-center justify-center bg-black text-sm text-white/80">
          Chargement de la vidéo…
        </div>
      ) : playback ? (
        playback.kind === "vimeo" ? (
          <VimeoVideoPlayer embedUrl={playback.url} title={lesson.title} lessonKey={lesson.id} />
        ) : (
          <CourseVideoPlayer playback={playback} title={lesson.title} lessonKey={lesson.id} />
        )
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
