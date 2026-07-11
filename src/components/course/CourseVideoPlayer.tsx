import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { ChevronRight, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VideoPlaybackSource } from "@/lib/videos";

type CourseVideoPlayerProps = {
  playback: VideoPlaybackSource;
  title: string;
  lessonKey: string;
  startAtSeconds?: number;
  nextLessonTitle?: string;
  onNextLesson?: () => void;
  onLessonComplete?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
};

export function CourseVideoPlayer({
  playback,
  title,
  lessonKey,
  startAtSeconds = 0,
  nextLessonTitle,
  onNextLesson,
  onLessonComplete,
  onTimeUpdate,
}: CourseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const resumeAppliedRef = useRef(false);
  const onLessonCompleteRef = useRef(onLessonComplete);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);

  onLessonCompleteRef.current = onLessonComplete;
  onTimeUpdateRef.current = onTimeUpdate;

  useEffect(() => {
    resumeAppliedRef.current = false;
  }, [lessonKey, startAtSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setEnded(false);
    setLoading(true);
    setBuffering(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const applyResumePosition = () => {
      if (resumeAppliedRef.current) return;
      if (startAtSeconds > 0 && Number.isFinite(startAtSeconds)) {
        try {
          video.currentTime = startAtSeconds;
        } catch {
          /* ignore */
        }
      }
      resumeAppliedRef.current = true;
    };

    const handleLoaded = () => {
      setLoading(false);
      applyResumePosition();
    };

    const handleEnded = () => {
      setEnded(true);
      onLessonCompleteRef.current?.();
    };

    const handleTimeUpdate = () => {
      onTimeUpdateRef.current?.(video.currentTime);
    };

    const handleWaiting = () => setBuffering(true);
    const handlePlaying = () => setBuffering(false);

    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    if (playback.kind === "hls") {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playback.url;
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 120,
        });
        hlsRef.current = hls;
        hls.loadSource(playback.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          applyResumePosition();
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setLoading(false);
            setBuffering(false);
          }
        });
      } else {
        setLoading(false);
      }
    } else {
      video.src = playback.url;
    }

    if (playback.posterUrl) {
      video.poster = playback.posterUrl;
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [lessonKey, playback.kind, playback.posterUrl, playback.url]);

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
    setEnded(false);
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        playsInline
        preload={playback.kind === "mp4" ? "auto" : "metadata"}
      />

      {loading || buffering ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="h-8 w-8 animate-spin text-white/80" />
        </div>
      ) : null}

      {playback.status !== "ready" ? (
        <div className="absolute left-3 top-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-[11px] font-semibold text-white">
          {playback.status === "processing" ? "Conversion HLS…" : "En file d'attente"}
        </div>
      ) : null}

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
