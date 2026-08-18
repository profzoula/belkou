import { useEffect, useState } from "react";
import { liveCountdownLabel } from "@/lib/live";

/**
 * Client-only countdown to a live. Returns null on the server and on the first
 * render so the markup stays stable through hydration, then ticks every 30 s.
 */
export function useLiveCountdown(iso: string | null | undefined, active = true): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!iso || !active) {
      setLabel(null);
      return;
    }
    const update = () => setLabel(liveCountdownLabel(iso));
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, [iso, active]);

  return label;
}
