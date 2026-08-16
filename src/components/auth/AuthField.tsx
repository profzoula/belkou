import { forwardRef, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthFieldProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  icon?: LucideIcon;
  hint?: ReactNode;
  error?: string | null;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ id, label, icon: Icon, hint, error, type = "text", className, ...props }, ref) => {
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === "password";
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
      <div className="space-y-1.5">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border bg-card px-4 py-2 shadow-xs transition-colors",
            "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25",
            error ? "border-destructive" : "border-input",
          )}
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor={id}
              className="block cursor-text text-[11px] font-medium tracking-wide text-muted-foreground"
            >
              {label}
            </label>
            <input
              ref={ref}
              id={id}
              type={isPassword && revealed ? "text" : type}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className={cn(
                "h-6 w-full border-0 bg-transparent p-0 text-base text-foreground outline-none placeholder:text-muted-foreground/70 sm:text-sm",
                className,
              )}
              {...props}
            />
          </div>

          {isPassword ? (
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              aria-label={revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={revealed}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {revealed ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          ) : Icon ? (
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
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
