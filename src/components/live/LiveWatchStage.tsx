import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize, Minimize } from "lucide-react";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { cn } from "@/lib/utils";

type LiveWatchStageProps = {
  player: ReactNode;
  chat: ReactNode;
  caption?: ReactNode;
  /** Rangée d’événements sous le player (pas sous le chat). */
  events?: ReactNode;
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

/**
 * Layout watch : [player | chat] à même hauteur, puis événements sous le player.
 * Topbar/Navbar restent hors de ce composant (Navbar parent).
 */
export function LiveWatchStage({ player, chat, caption, events }: LiveWatchStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const touchDevice = useCoarsePointer();
  const [theaterRequested, setTheater] = useState(false);
  const theater = theaterRequested && !touchDevice;

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

  if (theater) {
    return (
      <div className="h-[calc(100dvh-var(--site-header-height))]">
        <div
          ref={stageRef}
          className="fixed inset-x-0 bottom-0 top-[var(--site-header-height)] z-40 flex flex-col bg-black md:flex-row"
        >
          <div className="relative h-[min(56vw,calc(100dvh-var(--site-header-height)-16rem))] flex-none bg-black md:h-full md:min-h-0 md:flex-1">
            {player}
            <button
              type="button"
              onClick={toggle}
              className="absolute bottom-14 right-3 z-20 grid size-11 place-items-center rounded-md bg-black/65 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Quitter le plein écran"
              title="Quitter le plein écran (F)"
            >
              <Minimize className="size-5" aria-hidden />
            </button>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-950 md:h-full md:w-[22.5rem] md:flex-none md:shrink-0">
            {chat}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={stageRef} className="bg-zinc-950">
      <div className="site-container px-0 sm:px-4 lg:px-6">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22.5rem)] lg:grid-rows-[auto_auto_auto] lg:items-stretch">
          {/* Live streaming play */}
          <div className="relative aspect-video w-full min-w-0 bg-black lg:col-start-1 lg:row-start-1">
            {player}
            {touchDevice ? null : (
              <button
                type="button"
                onClick={toggle}
                className="absolute bottom-14 right-3 z-20 grid size-11 place-items-center rounded-md bg-black/65 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Plein écran"
                title="Plein écran (F)"
              >
                <Maximize className="size-5" aria-hidden />
              </button>
            )}
          </div>

          {/* Chat — même hauteur que le player (ligne 1 uniquement) */}
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-col border-t border-white/10 bg-zinc-950",
              "h-[min(50vh,24rem)] w-full",
              "lg:col-start-2 lg:row-start-1 lg:h-auto lg:min-h-0 lg:border-t-0 lg:border-l lg:border-white/10",
            )}
          >
            {chat}
          </div>

          {caption ? (
            <div className="border-t border-white/10 px-4 py-4 sm:px-5 lg:col-start-1 lg:row-start-2">
              {caption}
            </div>
          ) : null}

          {events ? (
            <div
              className={cn(
                "border-t border-white/10 bg-background px-4 py-5 sm:px-5",
                "lg:col-start-1 lg:row-start-3",
                !caption && "lg:row-start-2",
              )}
            >
              {events}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
