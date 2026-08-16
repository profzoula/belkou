import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { Radio } from "lucide-react";
import { YouTubeVideoPlayer } from "@/components/course/YouTubeVideoPlayer";
import type { LiveProvider } from "@/lib/live";
import { vimeoUrlToEmbedUrl } from "@/lib/vimeo";
import { youtubeUrlToEmbedUrl } from "@/lib/youtube";

type LiveStreamPlayerProps = {
  provider: LiveProvider;
  url: string;
  title: string;
  live?: boolean;
  fill?: boolean;
};

function HlsLivePlayer({ url, title }: { url: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      return () => {
        hls.destroy();
      };
    }
  }, [url]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full bg-black object-contain"
      controls
      controlsList="nofullscreen"
      playsInline
      autoPlay
      title={title}
    />
  );
}

export function LiveStreamPlayer({
  provider,
  url,
  title,
  live = false,
  fill = false,
}: LiveStreamPlayerProps) {
  const frame = fill ? "relative h-full w-full overflow-hidden bg-black" : "relative aspect-video w-full overflow-hidden bg-black";

  if (provider === "youtube") {
    const embed = youtubeUrlToEmbedUrl(url, live);
    if (!embed) {
      return <LivePlayerFallback fill={fill} />;
    }
    return <YouTubeVideoPlayer embedUrl={embed} title={title} fill={fill} />;
  }

  if (provider === "vimeo") {
    const embed = vimeoUrlToEmbedUrl(url);
    if (!embed) {
      return <LivePlayerFallback fill={fill} />;
    }
    return (
      <div className={frame}>
        <iframe
          src={`${embed}${live ? "&autoplay=1" : ""}`}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className={frame}>
      <HlsLivePlayer url={url} title={title} />
    </div>
  );
}

function LivePlayerFallback({ fill = false }: { fill?: boolean }) {
  return (
    <div
      className={
        fill
          ? "flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground"
          : "flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground"
      }
    >
      <Radio className="size-8" aria-hidden />
      <p className="text-sm">Lien de diffusion invalide.</p>
    </div>
  );
}
