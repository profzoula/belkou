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
        "font-display text-[1.625rem] font-bold leading-none tracking-tight text-primary sm:text-[1.75rem]",
        className,
      )}
    >
      {siteConfig.name}
    </span>
  );
}
