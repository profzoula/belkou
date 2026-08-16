import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize, Minimize } from "lucide-react";
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

async function requestFs(node: HTMLElement) {
  const el = node as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  if (node.requestFullscreen) {
    await node.requestFullscreen();
    return;
  }
  if (el.webkitRequestFullscreen) {
    await el.webkitRequestFullscreen();
  }
}

async function exitFs() {
  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }
  if (doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen();
  }
}

export function LiveWatchStage({ player, chat, caption }: LiveWatchStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const sync = useCallback(() => {
    const node = stageRef.current;
    setFullscreen(Boolean(node && getFullscreenElement() === node));
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, [sync]);

  const toggle = useCallback(() => {
    const node = stageRef.current;
    if (!node) return;
    if (getFullscreenElement() === node) {
      void exitFs().catch(() => undefined);
      return;
    }
    void requestFs(node).catch(() => {
      const video = node.querySelector("video") as
        | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
        | null;
      video?.webkitEnterFullscreen?.();
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "f" && event.key !== "F" && event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (event.key === "Escape") return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <div
      ref={stageRef}
      className={cn(
        "bg-black",
        fullscreen
          ? "flex h-full w-full flex-col md:flex-row"
          : "grid lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:grid-rows-[auto_auto] lg:items-stretch",
      )}
    >
      <div
        className={cn(
          "relative min-h-0 min-w-0 bg-black",
          fullscreen
            ? "h-full flex-1"
            : "aspect-video w-full lg:col-start-1 lg:row-start-1",
        )}
      >
        {player}
        <button
          type="button"
          onClick={toggle}
          className="absolute bottom-14 right-3 z-20 grid size-11 place-items-center rounded-md bg-black/65 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label={fullscreen ? "Quitter le plein écran" : "Plein écran"}
          title={fullscreen ? "Quitter le plein écran (F)" : "Plein écran (F)"}
        >
          {fullscreen ? <Minimize className="size-5" aria-hidden /> : <Maximize className="size-5" aria-hidden />}
        </button>
      </div>
      {caption && !fullscreen ? (
        <div className="bg-[#0a0c10] p-3 sm:p-4 lg:col-start-1 lg:row-start-2">
          {caption}
        </div>
      ) : null}
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-col bg-card",
          fullscreen
            ? "h-[min(40%,22rem)] w-full md:h-full md:w-[22.5rem] md:shrink-0"
            : "min-h-[20rem] w-full lg:col-start-2 lg:row-start-1 lg:h-full lg:min-h-0 lg:w-auto",
        )}
      >
        {chat}
      </div>
    </div>
  );
}
