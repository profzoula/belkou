import { useEffect } from "react";

function scrollToCurrentHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return;

  const target = document.getElementById(hash);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function useHashScroll(deps: unknown[] = []) {
  useEffect(() => {
    const frame = window.requestAnimationFrame(scrollToCurrentHash);
    const timeout = window.setTimeout(scrollToCurrentHash, 150);
    window.addEventListener("hashchange", scrollToCurrentHash);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.removeEventListener("hashchange", scrollToCurrentHash);
    };
  }, deps);
}
