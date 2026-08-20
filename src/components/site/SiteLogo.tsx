import { siteConfig } from "@/lib/site-config";
import { SiteLogoMark } from "@/components/site/SiteLogoMark";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
  alt?: string;
  /** Navbar on a dark background — white mark on a translucent chip. */
  inverted?: boolean;
};

export function SiteLogo({ className, alt = siteConfig.name, inverted = false }: SiteLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg border p-1",
        inverted
          ? "border-white/15 bg-white/10 text-white"
          : "border-primary/15 bg-primary-soft text-primary",
        className ?? "h-8 w-8",
      )}
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
    >
      <SiteLogoMark className="size-full" />
    </span>
  );
}
