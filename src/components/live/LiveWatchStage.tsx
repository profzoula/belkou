import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize, Minimize } from "lucide-react";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { cn } from "@/lib/utils";

type LiveWatchStageProps = {
  player: ReactNode;
  chat: ReactNode;
  caption?: ReactNode;
};

function getFullscreenElement() {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function exitNativeFullscreen() {
  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
  if (document.exitFullscreen && document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (doc.webkitExitFullscreen && getFullscreenElement()) {
    await doc.webkitExitFullscreen();
  }
}

export function LiveWatchStage({ player, chat, caption }: LiveWatchStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const touchDevice = useCoarsePointer();
  const [theater, setTheater] = useState(false);

  const enterTheater = useCallback(() => setTheater(true), []);
  const exitTheater = useCallback(() => setTheater(false), []);
  const toggle = useCallback(() => {
    setTheater((open) => !open);
  }, []);

  useEffect(() => {
    if (!theater) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [theater]);

  useEffect(() => {
    // Phones and tablets keep their real fullscreen; hijacking it breaks playback.
    if (touchDevice) return;

    const onNativeFullscreen = () => {
      const node = stageRef.current;
      const fs = getFullscreenElement();
      if (!fs || !node) return;
      if (node.contains(fs)) {
        void exitNativeFullscreen()
          .catch(() => undefined)
          .finally(() => enterTheater());
      }
    };

    document.addEventListener("fullscreenchange", onNativeFullscreen);
    document.addEventListener("webkitfullscreenchange", onNativeFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", onNativeFullscreen);
      document.removeEventListener("webkitfullscreenchange", onNativeFullscreen);
    };
  }, [enterTheater, touchDevice]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      if (event.key === "Escape" && theater) {
        event.preventDefault();
        exitTheater();
        return;
      }

      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exitTheater, theater, toggle]);

  return (
    <div
      className={cn(
        theater && "h-[calc(100dvh-var(--site-header-height))]",
      )}
    >
      <div
        ref={stageRef}
        className={cn(
          "bg-black",
          theater
            ? "fixed inset-x-0 bottom-0 top-[var(--site-header-height)] z-40 flex flex-col md:flex-row"
            : "grid lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:grid-rows-[auto_auto] lg:items-stretch",
        )}
      >
        <div
          className={cn(
            "relative min-h-0 min-w-0 bg-black",
            theater
              ? "h-[min(56vw,calc(100dvh-var(--site-header-height)-16rem))] flex-none md:h-full md:min-h-0 md:flex-1"
              : // Cap the player so the info card below always peeks above the fold.
                "aspect-video max-h-[calc(100dvh-var(--site-header-height)-7rem)] w-full lg:col-start-1 lg:row-start-1",
          )}
        >
          {player}
          <button
            type="button"
            onClick={toggle}
            className="absolute bottom-14 right-3 z-20 grid size-11 place-items-center rounded-md bg-black/65 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={theater ? "Quitter le plein écran" : "Plein écran"}
            title={theater ? "Quitter le plein écran (F)" : "Plein écran (F)"}
          >
            {theater ? <Minimize className="size-5" aria-hidden /> : <Maximize className="size-5" aria-hidden />}
          </button>
        </div>
        {caption && !theater ? (
          <div className="bg-zinc-950 px-4 py-4 sm:px-5 lg:col-start-1 lg:row-start-2">
            {caption}
          </div>
        ) : null}
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-col bg-zinc-950",
            theater
              ? "min-h-0 flex-1 md:h-full md:w-[22.5rem] md:flex-none md:shrink-0"
              : "h-[min(50vh,24rem)] w-full lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-auto lg:min-h-0 lg:w-auto",
          )}
        >
          {chat}
        </div>
      </div>
    </div>
  );
}
