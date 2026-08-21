import { forwardRef, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthFieldProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  icon?: LucideIcon;
  hint?: ReactNode;
  error?: string | null;
  /** Right-aligned control on the label row (e.g. forgot password). */
  labelAction?: ReactNode;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  (
    { id, label, icon: Icon, hint, error, labelAction, type = "text", className, ...props },
    ref,
  ) => {
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === "password";
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </label>
          {labelAction ? <div className="shrink-0">{labelAction}</div> : null}
        </div>

        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={isPassword && revealed ? "text" : type}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "h-12 w-full rounded-xl border border-input bg-muted/60 px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 sm:text-sm",
              "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25",
              error &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25",
              (isPassword || Icon) && "pr-11",
              className,
            )}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              aria-label={revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={revealed}
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {revealed ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          ) : Icon ? (
            <Icon
              className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </div>

        {error ? (
          <p id={`${id}-error`} className="text-xs font-medium text-destructive">
            {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
AuthField.displayName = "AuthField";
