import * as React from "react";

import { cn } from "@/lib/utils";

type PageSectionProps = React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "div";
  contained?: boolean;
};

export function PageSection({
  as: Tag = "section",
  contained = true,
  className,
  children,
  ...props
}: PageSectionProps) {
  return (
    <Tag className={cn("py-16 md:py-24", className)} {...props}>
      {contained ? <div className="site-container">{children}</div> : children}
    </Tag>
  );
}
