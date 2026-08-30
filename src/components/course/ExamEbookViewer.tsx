import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpenCheck, Loader2, Maximize2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getExamEbookHtml } from "@/lib/fns/exam-ebook";
import { cn } from "@/lib/utils";

type ExamEbookViewerProps = {
  courseSlug: string;
  title?: string;
  /** Fill the learn player pane vs a dedicated page */
  variant?: "embedded" | "page";
  className?: string;
};

export function ExamEbookViewer({
  courseSlug,
  title,
  variant = "embedded",
  className,
}: ExamEbookViewerProps) {
  const { session, loading: authLoading } = useAuth();
  const loadFn = useServerFn(getExamEbookHtml);
  const [html, setHtml] = useState<string | null>(null);
  const [ebookTitle, setEbookTitle] = useState(title ?? "Banque de questions");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (authLoading) return;
      const token = session?.access_token;
      if (!token) {
        setLoading(false);
        setError("Connectez-vous pour ouvrir la banque de questions.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await loadFn({
          data: { courseSlug, accessToken: token },
        });
        if (cancelled) return;
        setHtml(result.html);
        setEbookTitle(result.title);
      } catch (err) {
        if (cancelled) return;
        setHtml(null);
        setError(err instanceof Error ? err.message : "Chargement impossible");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, courseSlug, loadFn, session?.access_token]);

  if (loading || authLoading) {
    return (
      <div
        className={cn(
          "flex min-h-[360px] flex-col items-center justify-center gap-3 bg-muted/20 text-muted-foreground",
          variant === "page" && "min-h-[70vh]",
          className,
        )}
      >
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p className="text-sm">Chargement de la banque de questions…</p>
      </div>
    );
  }

  if (error || !html) {
    return (
      <div
        className={cn(
          "flex min-h-[360px] flex-col items-center justify-center gap-4 px-6 text-center",
          variant === "page" && "min-h-[70vh]",
          className,
        )}
      >
        <BookOpenCheck className="size-10 text-muted-foreground" aria-hidden />
        <div className="max-w-md space-y-2">
          <p className="font-semibold text-foreground">{ebookTitle}</p>
          <p className="text-sm text-muted-foreground">
            {error ?? "Contenu indisponible."}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {!session ? (
            <Button asChild variant="hero">
              <Link to="/login" search={{ redirect: `/courses/${courseSlug}/ebook` }}>
                Se connecter
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/checkout" search={{ course: courseSlug }}>
              Acheter — $25
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/courses/$slug" params={{ slug: courseSlug }}>
              Voir le cours
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#0e2744]", className)}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-white sm:px-4">
        <p className="truncate text-sm font-medium">{ebookTitle}</p>
        {variant === "embedded" ? (
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="shrink-0 text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/courses/$slug/ebook" params={{ slug: courseSlug }}>
              <Maximize2 className="size-4" aria-hidden />
              Plein écran
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="shrink-0 text-white hover:bg-white/10 hover:text-white"
          >
            <Link
              to="/courses/$slug/learn"
              params={{ slug: courseSlug }}
              search={{ lesson: "banque-questions" }}
            >
              Retour aux leçons
            </Link>
          </Button>
        )}
      </div>
      <iframe
        title={ebookTitle}
        srcDoc={html}
        className={cn(
          "w-full flex-1 border-0 bg-[#f6f1e8]",
          variant === "page" ? "min-h-[calc(100dvh-3.25rem)]" : "min-h-[70vh]",
        )}
        sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
      />
    </div>
  );
}
