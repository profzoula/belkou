import { cn } from "@/lib/utils";

type YouTubeVideoPlayerProps = {
  embedUrl: string;
  title: string;
  fill?: boolean;
};

export function YouTubeVideoPlayer({ embedUrl, title, fill = false }: YouTubeVideoPlayerProps) {
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
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
