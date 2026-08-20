import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
  alt?: string;
};

export function SiteLogo({ className, alt = siteConfig.name }: SiteLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary-soft p-1",
        className ?? "h-8 w-8",
      )}
    >
      <img src={siteConfig.logo} alt={alt} className="h-full w-full object-contain" />
    </span>
  );
}
