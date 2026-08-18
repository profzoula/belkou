import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Check, Radio, Settings } from "lucide-react";
import { YouTubeVideoPlayer } from "@/components/course/YouTubeVideoPlayer";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import type { LiveProvider } from "@/lib/live";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { vimeoUrlToEmbedUrl } from "@/lib/vimeo";
import { youtubeUrlToEmbedUrl } from "@/lib/youtube";

type LiveStreamPlayerProps = {
  provider: LiveProvider;
  url: string;
  title: string;
  live?: boolean;
  fill?: boolean;
};

type QualityLevel = { index: number; height: number };

/** Quality picker for adaptive HLS streams. Hidden when the manifest has a single rendition. */
function HlsQualityMenu({
  levels,
  selected,
  autoHeight,
  onSelect,
}: {
  levels: QualityLevel[];
  selected: number;
  autoHeight: number | null;
  onSelect: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);

  if (levels.length < 2) return null;

  const current = levels.find((level) => level.index === selected);
  const label = current ? `${current.height}p` : autoHeight ? `Auto ${autoHeight}p` : "Auto";

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Fermer le menu qualité"
          className="absolute inset-0 z-20 cursor-default"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="absolute left-3 top-3 z-30">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-md bg-black/65 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Settings className="size-3.5" aria-hidden />
          {label}
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute left-0 top-full mt-1.5 min-w-[8rem] overflow-hidden rounded-lg bg-black/85 py-1 text-sm text-white shadow-lg backdrop-blur-sm"
          >
            {[{ index: -1, height: 0 }, ...levels].map((level) => {
              const active = level.index === selected;
              return (
                <button
                  key={level.index}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    onSelect(level.index);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/15"
                >
                  <Check className={cn("size-3.5 shrink-0", !active && "invisible")} aria-hidden />
                  {level.index === -1
                    ? autoHeight
                      ? `Auto (${autoHeight}p)`
                      : "Auto"
                    : `${level.height}p`}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </>
  );
}

function HlsLivePlayer({
  url,
  title,
  nativeFullscreen,
}: {
  url: string;
  title: string;
  nativeFullscreen: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [selected, setSelected] = useState(-1);
  const [autoHeight, setAutoHeight] = useState<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari picks the rendition itself and exposes no level API.
      video.src = url;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLevels(
          hls.levels
            .map((level, index) => ({ index, height: level.height }))
            .filter((level) => level.height > 0)
            .sort((a, b) => b.height - a.height),
        );
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setAutoHeight(hls.levels[data.level]?.height ?? null);
      });

      hls.loadSource(url);
      hls.attachMedia(video);
      return () => {
        hls.destroy();
        hlsRef.current = null;
        setLevels([]);
        setSelected(-1);
        setAutoHeight(null);
      };
    }
  }, [url]);

  const selectLevel = (index: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = index;
    setSelected(index);
  };

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full bg-black object-contain"
        controls
        controlsList={nativeFullscreen ? undefined : "nofullscreen"}
        playsInline
        autoPlay
        title={title}
      />
      <HlsQualityMenu
        levels={levels}
        selected={selected}
        autoHeight={autoHeight}
        onSelect={selectLevel}
      />
    </>
  );
}

/** Branding bug over the stream. Fades out on hover so it never fights the player controls. */
function LivePlayerWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-3 top-3 z-10 select-none opacity-70 transition-opacity duration-200 group-hover:opacity-0 sm:right-4 sm:top-4"
    >
      <img
        src={siteConfig.logo}
        alt=""
        className="h-7 w-7 drop-shadow-[0_1px_4px_rgb(0_0_0_/_0.7)] sm:h-9 sm:w-9"
      />
    </div>
  );
}

export function LiveStreamPlayer({
  provider,
  url,
  title,
  live = false,
  fill = false,
}: LiveStreamPlayerProps) {
  // Mobile players refuse to start playback when fullscreen is blocked, so only
  // desktop gets the in-page theater treatment.
  const nativeFullscreen = useCoarsePointer();

  const media = (() => {
    if (provider === "youtube") {
      const embed = youtubeUrlToEmbedUrl(url, live, { nativeFullscreen });
      if (!embed) return null;
      return (
        <YouTubeVideoPlayer
          embedUrl={embed}
          title={title}
          fill
          nativeFullscreen={nativeFullscreen}
        />
      );
    }

    if (provider === "vimeo") {
      const embed = vimeoUrlToEmbedUrl(url);
      if (!embed) return null;
      return (
        <iframe
          src={`${embed}${live ? "&autoplay=1" : ""}${nativeFullscreen ? "" : "&fullscreen=0"}`}
          title={title}
          allow={
            nativeFullscreen
              ? "autoplay; picture-in-picture; fullscreen"
              : "autoplay; picture-in-picture"
          }
          allowFullScreen={nativeFullscreen}
          className="absolute inset-0 h-full w-full"
        />
      );
    }

    return <HlsLivePlayer url={url} title={title} nativeFullscreen={nativeFullscreen} />;
  })();

  if (!media) return <LivePlayerFallback fill={fill} />;

  return (
    <div
      className={cn(
        "group relative overflow-hidden bg-black",
        fill ? "h-full w-full" : "aspect-video w-full",
      )}
    >
      {media}
      <LivePlayerWatermark />
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
