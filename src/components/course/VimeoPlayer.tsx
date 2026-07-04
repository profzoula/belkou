import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildVimeoPlayerInit, type VimeoRef } from "@/lib/vimeo";

type VimeoPlayerProps = {
  video: VimeoRef;
  title: string;
  lessonKey: string;
  nextLessonTitle?: string;
  onNextLesson?: () => void;
  onLessonComplete?: () => void;
};

export function VimeoPlayer({
  video,
  title,
  lessonKey,
  nextLessonTitle,
  onNextLesson,
  onLessonComplete,
}: VimeoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setEnded(false);

    const player = new Player(container, buildVimeoPlayerInit(video, container.clientWidth || 640));
    playerRef.current = player;

    const handleEnded = () => {
      setEnded(true);
      onLessonComplete?.();
    };
    const handlePlay = () => setEnded(false);

    player.on("ended", handleEnded);
    player.on("play", handlePlay);

    return () => {
      player.off("ended", handleEnded);
      player.off("play", handlePlay);
      void player.destroy();
      playerRef.current = null;
    };
  }, [lessonKey, onLessonComplete, video.id, video.hash]);

  const replay = () => {
    const player = playerRef.current;
    if (!player) return;

    void player
      .setCurrentTime(0)
      .then(() => player.play())
      .catch(() => undefined);
    setEnded(false);
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0 h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />

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
