import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const panelVariants = cva("overflow-hidden border border-border bg-card", {
  variants: {
    variant: {
      default: "rounded-2xl shadow-sm",
      elevated: "rounded-[20px] shadow-md",
      inset: "rounded-xl border-border/80 bg-muted/30 shadow-none",
      dashed: "rounded-2xl border-dashed bg-muted/30 shadow-none",
    },
    padding: {
      none: "",
      sm: "p-4 sm:p-5",
      md: "p-5 sm:p-6",
      lg: "p-8 md:p-10",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "none",
  },
});

export interface PanelProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof panelVariants> {}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div ref={ref} className={cn(panelVariants({ variant, padding }), className)} {...props} />
  ),
);
Panel.displayName = "Panel";

export { Panel, panelVariants };
