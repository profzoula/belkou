import { cn } from "@/lib/utils";

type YouTubeVideoPlayerProps = {
  embedUrl: string;
  title: string;
  fill?: boolean;
  nativeFullscreen?: boolean;
};

export function YouTubeVideoPlayer({
  embedUrl,
  title,
  fill = false,
  nativeFullscreen = true,
}: YouTubeVideoPlayerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-black",
        fill ? "h-full w-full" : "aspect-video w-full",
      )}
    >
      <iframe
        src={embedUrl}
        title={title}
        allow={
          nativeFullscreen
            ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            : "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        }
        allowFullScreen={nativeFullscreen}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
