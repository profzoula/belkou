import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type NavbarCourseSearchProps = {
  className?: string;
  dark?: boolean;
  hero?: boolean;
  onSubmit?: () => void;
};

export function NavbarCourseSearch({
  className,
  dark = false,
  hero = false,
  onSubmit,
}: NavbarCourseSearchProps) {
  const navigate = useNavigate();
  const urlQuery = useRouterState({
    select: (state) =>
      state.location.pathname === "/courses"
        ? ((state.location.search as { q?: string }).q ?? "")
        : "",
  });
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const q = query.trim();
    void navigate({
      to: "/courses",
      search: q ? { q } : {},
    });
    onSubmit?.();
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      className={cn(
        "relative flex h-10 w-full items-center rounded-full border pr-1 sm:h-11",
        dark
          ? "border-white/15 bg-white/10"
          : hero
            ? "border-border/80 bg-card/90 shadow-xs"
            : "border-border bg-card shadow-xs",
        className,
      )}
    >
      <label htmlFor="navbar-course-search" className="sr-only">
        Rechercher un cours
      </label>
      <input
        id="navbar-course-search"
        type="search"
        enterKeyHint="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Que voulez-vous apprendre ?"
        className={cn(
          "min-w-0 flex-1 bg-transparent pl-3.5 text-sm focus:outline-none sm:pl-4 sm:text-base",
          dark
            ? "text-white placeholder:text-white/50"
            : "text-foreground placeholder:text-muted-foreground",
        )}
        autoComplete="off"
      />
      <button
        type="submit"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full transition sm:size-9",
          dark
            ? "bg-white text-nav-dark hover:bg-white/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
        aria-label="Rechercher"
      >
        <Search className="size-4" aria-hidden />
      </button>
    </form>
  );
}
