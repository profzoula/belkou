import { useEffect, useRef, useState } from "react";
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
  const [ended, setEnded] = useState(false);

  onLessonCompleteRef.current = onLessonComplete;
  onPlayRef.current = onPlay;

  useEffect(() => {
    setEnded(false);
  }, [lessonKey, embedUrl]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const subscribe = () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ method: "addEventListener", value: "finish" }),
        "https://player.vimeo.com",
      );
      iframe.contentWindow?.postMessage(
        JSON.stringify({ method: "addEventListener", value: "play" }),
        "https://player.vimeo.com",
      );
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://player.vimeo.com") return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.event === "finish") {
          setEnded(true);
          onLessonCompleteRef.current?.();
        }
        if (data?.event === "play") {
          onPlayRef.current?.();
        }
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("message", handleMessage);
    iframe.addEventListener("load", subscribe);
    subscribe();

    return () => {
      window.removeEventListener("message", handleMessage);
      iframe.removeEventListener("load", subscribe);
    };
  }, [embedUrl, lessonKey]);

  const replay = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    setEnded(false);
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: "setCurrentTime", value: 0 }),
      "https://player.vimeo.com",
    );
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: "play" }),
      "https://player.vimeo.com",
    );
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
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/95 px-6 text-center">
          <p className="text-sm font-semibold text-white">Leçon terminée</p>
          <p className="max-w-md text-xs text-white/75">{title}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="secondary" className="gap-2" onClick={replay}>
              <RotateCcw className="h-4 w-4" />
              Revoir la leçon
            </Button>
            {onNextLesson && nextLessonTitle ? (
              <Button type="button" variant="hero" className="gap-2" onClick={onNextLesson}>
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
