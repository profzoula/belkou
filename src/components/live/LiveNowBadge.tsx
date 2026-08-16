import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LiveStatus } from "@/lib/live";
import { liveStatusLabel } from "@/lib/live";

export function LiveNowBadge({
  status,
  className,
}: {
  status?: LiveStatus;
  className?: string;
}) {
  const live = !status || status === "live";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
        live ? "bg-red-600" : "bg-black/75",
        className,
      )}
    >
      {live ? <Radio className="size-2.5" aria-hidden /> : null}
      {status && status !== "live" ? liveStatusLabel(status) : "Live"}
    </span>
  );
}
