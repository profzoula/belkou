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
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-[#1a2744] p-1 shadow-sm",
        className ?? "h-8 w-8",
      )}
    >
      <img src={siteConfig.logo} alt={alt} className="h-full w-full object-contain" />
    </span>
  );
}
