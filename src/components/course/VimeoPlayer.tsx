import { buildVimeoEmbedUrl, type VimeoRef } from "@/lib/vimeo";

type VimeoPlayerProps = {
  video: VimeoRef;
  title: string;
  lessonKey: string;
};

export function VimeoPlayer({ video, title, lessonKey }: VimeoPlayerProps) {
  const src = buildVimeoEmbedUrl(video);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <iframe
        key={lessonKey}
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
