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
      className="absolute inset-0 h-full w-full bg-black"
      controls
      playsInline
      autoPlay
      title={title}
    />
  );
}

export function LiveStreamPlayer({ provider, url, title, live = false }: LiveStreamPlayerProps) {
  if (provider === "youtube") {
    const embed = youtubeUrlToEmbedUrl(url, live);
    if (!embed) {
      return <LivePlayerFallback />;
    }
    return <YouTubeVideoPlayer embedUrl={embed} title={title} />;
  }

  if (provider === "vimeo") {
    const embed = vimeoUrlToEmbedUrl(url);
    if (!embed) {
      return <LivePlayerFallback />;
    }
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-black">
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
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <HlsLivePlayer url={url} title={title} />
    </div>
  );
}

function LivePlayerFallback() {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
      <Radio className="size-8" aria-hidden />
      <p className="text-sm">Lien de diffusion invalide.</p>
    </div>
  );
}
