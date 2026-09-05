import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[background-color,box-shadow,opacity,border-color] duration-300 ease-[cubic-bezier(0,0,0.2,1)] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#0056d2] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[var(--primary-deep)] hover:opacity-95 hover:shadow-[0_3px_10px_rgb(13_15_18_/_0.12)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-elevated",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-elevated hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground hover:bg-[var(--primary-deep)] hover:opacity-95 hover:shadow-[0_3px_10px_rgb(13_15_18_/_0.12)]",
        soft: "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-elevated",
        inverse: "bg-foreground text-background hover:bg-foreground/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 min-h-[2.75rem] rounded-lg px-4 text-base touch-manipulation",
        xl: "h-12 rounded-lg px-4 text-base font-semibold",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
