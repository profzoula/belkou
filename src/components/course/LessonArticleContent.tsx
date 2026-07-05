import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArticleSubSessionBody } from "@/components/course/ArticleSubSessionBody";
import { LessonQuiz } from "@/components/course/LessonQuiz";
import { isLessonHtml, sanitizeLessonHtml } from "@/lib/lesson-html";
import { resolveLessonQuiz, readQuizPass } from "@/lib/lesson-quiz";
import {
  findArticleSubSession,
  getArticleSubSessionNav,
  getFirstArticleSubSessionId,
  parseArticleSessions,
  parseArticleSubSessionId,
} from "@/lib/lesson-sessions";
import { parseInlineMarkdown, parseLessonContent } from "@/lib/parse-lesson-content";

type LessonArticleContentProps = {
  title: string;
  content: string;
  lessonId?: string;
  activeSubSessionId?: string | null;
  onSubSessionChange?: (subSessionId: string, options?: { markCurrentAsRead?: boolean }) => void;
  onComplete?: () => void;
};

function InlineText({ text }: { text: string }) {
  const segments = parseInlineMarkdown(text);
  return (
    <>
      {segments.map((segment, index) =>
        segment.type === "bold" ? (
          <strong key={index} className="font-semibold text-foreground">
            {segment.value}
          </strong>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </>
  );
}

type ArticleSubSessionPanelProps = {
  lessonId: string;
  effectiveSubSessionId: string;
  found: NonNullable<ReturnType<typeof findArticleSubSession>>;
  nav: ReturnType<typeof getArticleSubSessionNav>;
  onSubSessionChange?: (subSessionId: string, options?: { markCurrentAsRead?: boolean }) => void;
  onComplete?: () => void;
};

function ArticleSubSessionPanel({
  lessonId,
  effectiveSubSessionId,
  found,
  nav,
  onSubSessionChange,
  onComplete,
}: ArticleSubSessionPanelProps) {
  const quiz = found.sub.quizId || found.sub.quiz ? resolveLessonQuiz(found.sub) : null;
  const quizStorageKey = `${lessonId}::${effectiveSubSessionId}`;
  const [quizPassed, setQuizPassed] = useState(() => (quiz ? readQuizPass(quizStorageKey) : true));

  useEffect(() => {
    setQuizPassed(quiz ? readQuizPass(quizStorageKey) : true);
  }, [quiz, quizStorageKey]);

  const canProceed = !quiz || quizPassed;

  const goToSubSession = (subSessionId: string, markCurrentAsRead = false) => {
    if (markCurrentAsRead && !canProceed) return;
    onSubSessionChange?.(subSessionId, markCurrentAsRead ? { markCurrentAsRead: true } : undefined);
  };

  const handleComplete = () => {
    if (!canProceed) return;
    onComplete?.();
  };

  return (
    <div className="relative border-b border-border bg-card">
      {nav.prevId && onSubSessionChange ? (
        <button
          type="button"
          aria-label="Sous-session précédente"
          onClick={() => goToSubSession(nav.prevId!)}
          className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-emerald-200 bg-white p-2 text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 sm:left-4 sm:flex dark:border-emerald-800 dark:bg-card dark:hover:bg-emerald-950/30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}
      {nav.nextId && onSubSessionChange && canProceed ? (
        <button
          type="button"
          aria-label="Sous-session suivante"
          onClick={() => goToSubSession(nav.nextId!, true)}
          className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-emerald-200 bg-white p-2 text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 sm:right-4 sm:flex dark:border-emerald-800 dark:bg-card dark:hover:bg-emerald-950/30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : null}

      <div className="px-4 py-6 sm:px-10 sm:py-10 md:px-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Session {found.session.number} · {found.sub.number}
        </p>
        <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
          {found.sub.title}
        </h1>

        <div className="mt-6 min-h-[200px] space-y-6">
          {quiz ? (
            <>
              {found.sub.html ? (
                <div
                  className="lesson-html text-sm leading-relaxed text-muted-foreground sm:text-base"
                  dangerouslySetInnerHTML={{ __html: found.sub.html }}
                />
              ) : null}
              <LessonQuiz quiz={quiz} storageKey={quizStorageKey} onPass={() => setQuizPassed(true)} />
            </>
          ) : found.sub.quizId ? (
            <p className="text-sm text-destructive">
              Quiz « {found.sub.quizId} » introvable — kontakte administratè a.
            </p>
          ) : (
            <ArticleSubSessionBody sub={found.sub} />
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <div className="flex gap-2 sm:hidden">
            {nav.prevId && onSubSessionChange ? (
              <Button type="button" variant="outline" size="sm" onClick={() => goToSubSession(nav.prevId!)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Précédent
              </Button>
            ) : null}
            {nav.nextId && onSubSessionChange && canProceed ? (
              <Button type="button" variant="outline" size="sm" onClick={() => goToSubSession(nav.nextId!, true)}>
                Suivant
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : null}
          </div>

          {quiz && !canProceed ? (
            <p className="ml-auto text-xs text-muted-foreground">
              Fè {quiz.passScore}/{quiz.passScore} sou quiz la pou kontinye.
            </p>
          ) : null}

          {onComplete && !nav.nextId && canProceed ? (
            <Button type="button" variant="hero" size="sm" onClick={handleComplete} className="ml-auto">
              Marquer comme terminé
            </Button>
          ) : nav.nextId && onSubSessionChange && canProceed ? (
            <Button
              type="button"
              variant="hero"
              size="sm"
              className="ml-auto hidden sm:inline-flex"
              onClick={() => goToSubSession(nav.nextId!, true)}
            >
              Suivant · {nav.nextTitle}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function LessonArticleContent({
  title,
  content,
  lessonId,
  activeSubSessionId,
  onSubSessionChange,
  onComplete,
}: LessonArticleContentProps) {
  const sessions = parseArticleSessions(content);

  if (sessions?.length && lessonId) {
    const effectiveSubSessionId =
      activeSubSessionId ?? getFirstArticleSubSessionId(lessonId, sessions);

    if (effectiveSubSessionId) {
      const parsed = parseArticleSubSessionId(effectiveSubSessionId);
    const found =
      parsed && parsed.lessonId === lessonId
        ? findArticleSubSession(sessions, parsed.sessionNumber, parsed.subNumber)
        : null;
    const nav = getArticleSubSessionNav(lessonId, sessions, effectiveSubSessionId);

    if (found) {
      return (
        <ArticleSubSessionPanel
          lessonId={lessonId}
          effectiveSubSessionId={effectiveSubSessionId}
          found={found}
          nav={nav}
          onSubSessionChange={onSubSessionChange}
          onComplete={onComplete}
        />
      );
    }
    }
  }

  if (isLessonHtml(content)) {
    const safeHtml = sanitizeLessonHtml(content);

    return (
      <div className="prose-lesson border-b border-border bg-card px-4 py-8 sm:px-8 sm:py-10 md:px-10">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <div
          className="lesson-html mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
        {onComplete ? (
          <div className="mt-8 flex justify-end">
            <Button type="button" variant="hero" size="sm" onClick={onComplete}>
              Marquer comme terminé
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  const blocks = parseLessonContent(content);
  const accordionBlocks = blocks.filter((block) => block.type === "accordion");
  const introBlocks = blocks.filter((block) => block.type !== "accordion");

  return (
    <div className="prose-lesson border-b border-border bg-card px-4 py-8 sm:px-8 sm:py-10 md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>

      <div className="mt-6 space-y-4">
        {introBlocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h2 key={index} className="pt-2 font-display text-xl font-bold text-foreground">
                {block.text}
              </h2>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={index} className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                {block.items.map((item) => (
                  <li key={item}>
                    <InlineText text={item} />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={index} className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              <InlineText text={block.text} />
            </p>
          );
        })}
      </div>

      {accordionBlocks.length > 0 ? (
        <div className="mt-8">
          {introBlocks.length === 0 ? (
            <p className="mb-4 text-sm text-muted-foreground">Sélectionnez un titre pour en savoir plus.</p>
          ) : null}
          <Accordion type="multiple" className="rounded-lg border border-border">
            {accordionBlocks.map((block, index) => (
              <AccordionItem key={`${block.title}-${index}`} value={`item-${index}`} className="px-1">
                <AccordionTrigger className="px-4 text-left text-sm font-semibold hover:no-underline">
                  {block.title}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                  <InlineText text={block.body} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : null}

      {onComplete ? (
        <div className="mt-8 flex justify-end">
          <Button type="button" variant="hero" size="sm" onClick={onComplete}>
            Marquer comme terminé
          </Button>
        </div>
      ) : null}
    </div>
  );
}
