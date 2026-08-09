import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type SiteWordmarkProps = {
  className?: string;
};

/** Coursera-style site name — bold primary wordmark, no icon box. */
export function SiteWordmark({ className }: SiteWordmarkProps) {
  return (
    <span
      className={cn(
        "font-display text-3xl font-bold leading-none tracking-[-0.005em] text-primary",
        className,
      )}
    >
      {siteConfig.name}
    </span>
  );
}
