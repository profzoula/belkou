type YouTubeVideoPlayerProps = {
  embedUrl: string;
  title: string;
};

export function YouTubeVideoPlayer({ embedUrl, title }: YouTubeVideoPlayerProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
