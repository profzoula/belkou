import { siteConfig } from "@/lib/site-config";
import { SiteLogo } from "@/components/site/SiteLogo";
import { cn } from "@/lib/utils";

type SiteWordmarkProps = {
  className?: string;
  /** Navbar on the dark hero — light title, softer subtitle. */
  inverted?: boolean;
  size?: "sm" | "md";
  showIcon?: boolean;
};

/** Logo lockup: mark + BelKou + ACADEMIC, like the brand sheet. */
export function SiteWordmark({
  className,
  inverted = false,
  size = "md",
  showIcon = true,
}: SiteWordmarkProps) {
  const iconClass = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const titleClass = size === "sm" ? "text-base" : "text-xl";
  const subtitleClass = size === "sm" ? "text-[9px]" : "text-[10px]";

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      {showIcon ? <SiteLogo className={iconClass} alt="" /> : null}
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "font-display font-bold tracking-tight",
            titleClass,
            inverted ? "text-white" : "text-foreground",
          )}
        >
          {siteConfig.brand.title}
        </span>
        <span
          className={cn(
            "mt-0.5 font-semibold uppercase tracking-[0.22em]",
            subtitleClass,
            inverted ? "text-blue-300" : "text-primary",
          )}
        >
          {siteConfig.brand.subtitle}
        </span>
      </span>
    </span>
  );
}
