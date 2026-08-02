import { Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { UserAccountMenu } from "@/components/auth/UserAccountMenu";
import { SiteLogo } from "@/components/site/SiteLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type LearnHeaderProps = {
  courseTitle: string;
  courseSlug: string;
  progressPercent: number;
  hasPaidAccess: boolean;
  coursePrice: number;
  lessonQuery: string;
  onLessonQueryChange: (query: string) => void;
  className?: string;
};

export function LearnHeader({
  courseTitle,
  courseSlug,
  progressPercent,
  hasPaidAccess,
  coursePrice,
  lessonQuery,
  onLessonQueryChange,
  className,
}: LearnHeaderProps) {
  const { user } = useAuth();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1.5 rounded-xl px-2.5">
          <Link to="/courses" aria-label="Retour aux cours">
            <ArrowLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">Retour aux cours</span>
          </Link>
        </Button>

        <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />

        <Link
          to="/courses/$slug"
          params={{ slug: courseSlug }}
          className="hidden min-w-0 items-center gap-2 sm:flex"
        >
          <SiteLogo className="size-8 rounded-xl" alt="" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold tracking-tight">{courseTitle}</p>
            {hasPaidAccess ? (
              <p className="text-[11px] text-muted-foreground tabular-nums">
                Progression {progressPercent}%
              </p>
            ) : null}
          </div>
        </Link>

        <p className="min-w-0 flex-1 truncate font-display text-sm font-semibold sm:hidden">
          {courseTitle}
        </p>

        <div className="relative ml-auto hidden w-full max-w-[220px] md:block lg:max-w-[260px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={lessonQuery}
            onChange={(event) => onLessonQueryChange(event.target.value)}
            placeholder="Rechercher une leçon…"
            className="h-10 rounded-xl border-border/80 bg-muted/40 pl-9"
            aria-label="Rechercher une leçon"
          />
        </div>

        <ThemeToggle />

        {user ? <UserAccountMenu /> : null}

        {hasPaidAccess ? (
          <Button asChild size="sm" variant="soft" className="hidden rounded-xl sm:inline-flex">
            <Link to="/dashboard">Mes cours</Link>
          </Button>
        ) : (
          <Button asChild size="sm" className="hidden rounded-xl sm:inline-flex">
            <Link to="/checkout" search={{ course: courseSlug }}>
              S&apos;inscrire · ${coursePrice}
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
