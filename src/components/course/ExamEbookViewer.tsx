import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpenCheck, Loader2, Maximize2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ExamPracticeQuiz } from "@/components/course/ExamPracticeQuiz";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { ExamBankPayload } from "@/lib/exam-ebooks";
import { getExamEbookAccess } from "@/lib/fns/exam-ebook";
import { cn } from "@/lib/utils";

type ExamEbookViewerProps = {
  courseSlug: string;
  title?: string;
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
  const loadFn = useServerFn(getExamEbookAccess);
  const [bank, setBank] = useState<ExamBankPayload | null>(null);
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
        const access = await loadFn({
          data: { courseSlug, accessToken: token },
        });
        if (cancelled) return;
        setEbookTitle(access.title);

        const res = await fetch(access.url, { credentials: "same-origin" });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Chargement des questions impossible");
        }
        const data = (await res.json()) as ExamBankPayload;
        if (cancelled) return;
        if (!data?.questions?.length) {
          throw new Error("Aucune question disponible");
        }
        setBank(data);
      } catch (err) {
        if (cancelled) return;
        setBank(null);
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
          "flex min-h-[360px] flex-col items-center justify-center gap-3 bg-[#f4f6f9] text-muted-foreground",
          variant === "page" && "min-h-[70vh]",
          className,
        )}
      >
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p className="text-sm">Chargement des questions…</p>
      </div>
    );
  }

  if (error || !bank) {
    return (
      <div
        className={cn(
          "flex min-h-[360px] flex-col items-center justify-center gap-4 bg-[#f4f6f9] px-6 text-center",
          variant === "page" && "min-h-[70vh]",
          className,
        )}
      >
        <BookOpenCheck className="size-10 text-muted-foreground" aria-hidden />
        <div className="max-w-md space-y-2">
          <p className="font-semibold text-foreground">{ebookTitle}</p>
          <p className="text-sm text-muted-foreground">{error ?? "Contenu indisponible."}</p>
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
    <div className={cn("flex min-h-0 flex-col", className)}>
      {variant === "embedded" ? (
        <div className="flex shrink-0 items-center justify-end border-b border-border bg-white px-3 py-2">
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link to="/courses/$slug/ebook" params={{ slug: courseSlug }}>
              <Maximize2 className="size-4" aria-hidden />
              Plein écran
            </Link>
          </Button>
        </div>
      ) : null}
      <ExamPracticeQuiz bank={bank} className="min-h-0 flex-1" />
    </div>
  );
}
