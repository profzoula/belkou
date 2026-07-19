import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type VimeoVideoPlayerProps = {
  embedUrl: string;
  title: string;
  lessonKey: string;
  nextLessonTitle?: string;
  onNextLesson?: () => void;
  onLessonComplete?: () => void;
  onPlay?: () => void;
};

const VIMEO_ORIGIN = "https://player.vimeo.com";

function postToVimeo(iframe: HTMLIFrameElement, payload: Record<string, unknown>) {
  iframe.contentWindow?.postMessage(JSON.stringify(payload), VIMEO_ORIGIN);
}

export function VimeoVideoPlayer({
  embedUrl,
  title,
  lessonKey,
  nextLessonTitle,
  onNextLesson,
  onLessonComplete,
  onPlay,
}: VimeoVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onLessonCompleteRef = useRef(onLessonComplete);
  const onPlayRef = useRef(onPlay);
  const completedRef = useRef(false);
  const [ended, setEnded] = useState(false);

  onLessonCompleteRef.current = onLessonComplete;
  onPlayRef.current = onPlay;

  const markComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setEnded(true);
    onLessonCompleteRef.current?.();
  }, []);

  useEffect(() => {
    completedRef.current = false;
    setEnded(false);
  }, [lessonKey, embedUrl]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let ready = false;

    const subscribe = () => {
      for (const event of ["finish", "ended", "playProgress", "play"] as const) {
        postToVimeo(iframe, { method: "addEventListener", value: event });
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== VIMEO_ORIGIN) return;

      let data: { event?: string; method?: string; data?: { seconds?: number; duration?: number } };
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (data?.event === "ready") {
        ready = true;
        subscribe();
        return;
      }

      if (data?.event === "play") {
        onPlayRef.current?.();
        return;
      }

      if (data?.event === "finish" || data?.event === "ended") {
        markComplete();
        return;
      }

      if (data?.event === "playProgress") {
        const seconds = data.data?.seconds ?? 0;
        const duration = data.data?.duration ?? 0;
        if (duration > 0 && seconds >= duration - 0.75) {
          markComplete();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    iframe.addEventListener("load", subscribe);

    const pollTimer = window.setInterval(() => {
      if (!ready || completedRef.current) return;
      postToVimeo(iframe, { method: "getCurrentTime" });
      postToVimeo(iframe, { method: "getDuration" });
    }, 4000);

    return () => {
      window.clearInterval(pollTimer);
      window.removeEventListener("message", handleMessage);
      iframe.removeEventListener("load", subscribe);
    };
  }, [embedUrl, lessonKey, markComplete]);

  const replay = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    completedRef.current = false;
    setEnded(false);
    postToVimeo(iframe, { method: "setCurrentTime", value: 0 });
    postToVimeo(iframe, { method: "play" });
  };

  const handleNext = () => {
    if (onNextLesson) {
      onNextLesson();
      return;
    }
    markComplete();
  };

  return (
    <div
      className="relative aspect-video w-full select-none overflow-hidden bg-black"
      onContextMenu={(event) => event.preventDefault()}
    >
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />

      {ended ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/95 px-6 text-center">
          <p className="text-sm font-semibold text-white">Leçon terminée</p>
          <p className="max-w-md text-xs text-white/75">{title}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="secondary" className="gap-2" onClick={replay}>
              <RotateCcw className="h-4 w-4" />
              Revoir la leçon
            </Button>
            {nextLessonTitle ? (
              <Button type="button" variant="hero" className="gap-2" onClick={handleNext}>
                Leçon suivante
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
