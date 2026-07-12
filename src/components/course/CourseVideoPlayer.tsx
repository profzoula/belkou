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
  onPlay?: () => void;
};

function describeVideoError(video: HTMLVideoElement): string {
  const code = video.error?.code;
  if (code === MediaError.MEDIA_ERR_NETWORK) {
    return "Erreur réseau — vérifiez votre connexion";
  }
  if (code === MediaError.MEDIA_ERR_DECODE) {
    return "Format vidéo non supporté par le navigateur";
  }
  if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
    return "Fichier vidéo introuvable ou accès refusé";
  }
  return "Lecture vidéo impossible";
}

export function CourseVideoPlayer({
  playback,
  title,
  lessonKey,
  startAtSeconds = 0,
  nextLessonTitle,
  onNextLesson,
  onLessonComplete,
  onTimeUpdate,
  onPlay,
}: CourseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const resumeAppliedRef = useRef(false);
  const onLessonCompleteRef = useRef(onLessonComplete);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPlayRef = useRef(onPlay);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  onLessonCompleteRef.current = onLessonComplete;
  onTimeUpdateRef.current = onTimeUpdate;
  onPlayRef.current = onPlay;

  useEffect(() => {
    resumeAppliedRef.current = false;
  }, [lessonKey, startAtSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setEnded(false);
    setLoading(true);
    setBuffering(false);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.removeAttribute("src");
    video.load();

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

    const markReady = () => {
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
    const handlePlaying = () => {
      setBuffering(false);
      setLoading(false);
      onPlayRef.current?.();
    };

    const handleVideoError = () => {
      setLoading(false);
      setBuffering(false);
      setError(describeVideoError(video));
    };

    video.addEventListener("loadedmetadata", markReady);
    video.addEventListener("canplay", markReady);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleVideoError);

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
        hls.on(Hls.Events.MANIFEST_PARSED, markReady);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          setLoading(false);
          setBuffering(false);
          setError(
            data.type === Hls.ErrorTypes.NETWORK_ERROR
              ? "Segments HLS inaccessibles — réessayez ou contactez le support"
              : "Lecture HLS impossible",
          );
        });
      } else {
        setLoading(false);
        setError("HLS non supporté par ce navigateur");
      }
    } else {
      video.src = playback.url;
    }

    if (playback.posterUrl) {
      video.poster = playback.posterUrl;
    }

    const loadTimeout = window.setTimeout(() => {
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        setLoading(false);
        setBuffering(false);
        setError("Chargement trop long — vérifiez votre connexion");
      }
    }, 30_000);

    return () => {
      window.clearTimeout(loadTimeout);
      video.removeEventListener("loadedmetadata", markReady);
      video.removeEventListener("canplay", markReady);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleVideoError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [lessonKey, playback.kind, playback.posterUrl, playback.url, startAtSeconds]);

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
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

      {error ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center">
          <p className="text-sm font-semibold text-white">Lecture impossible</p>
          <p className="max-w-md text-xs text-white/75">{error}</p>
          <Button type="button" size="sm" variant="secondary" onClick={replay}>
            Réessayer
          </Button>
        </div>
      ) : null}

      {playback.status === "processing" ? (
        <div className="absolute left-3 top-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-[11px] font-semibold text-white">
          Optimisation vidéo…
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
