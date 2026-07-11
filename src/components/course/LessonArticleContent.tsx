import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";
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
import { findLessonQuizInLesson, lessonQuizPassStorageKey, readQuizPass } from "@/lib/lesson-quiz";
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
  nextLessonTitle?: string;
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
  lessonQuiz: ReturnType<typeof findLessonQuizInLesson>;
  nextLessonTitle?: string;
  onSubSessionChange?: (subSessionId: string, options?: { markCurrentAsRead?: boolean }) => void;
  onComplete?: () => void;
};

function CompleteLessonButton({
  nextLessonTitle,
  onComplete,
}: {
  nextLessonTitle?: string;
  onComplete: () => void;
}) {
  const label = nextLessonTitle ? `Leçon suivante · ${nextLessonTitle}` : "Marquer comme terminé";

  return (
    <Button type="button" variant="hero" size="sm" onClick={onComplete} className="gap-2">
      {label}
      {nextLessonTitle ? <ChevronRight className="h-4 w-4" /> : null}
    </Button>
  );
}

function ArticleSubSessionPanel({
  lessonId,
  effectiveSubSessionId,
  found,
  nav,
  lessonQuiz,
  nextLessonTitle,
  onSubSessionChange,
  onComplete,
}: ArticleSubSessionPanelProps) {
  const quizSectionRef = useRef<HTMLDivElement>(null);
  const isLastStudentSub = !nav.nextId;
  const requiresLessonQuiz = Boolean(lessonQuiz && isLastStudentSub);
  const quizPassKey = lessonQuizPassStorageKey(lessonId);
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizPassed, setQuizPassed] = useState(() =>
    requiresLessonQuiz ? readQuizPass(quizPassKey) : true,
  );

  useEffect(() => {
    setQuizPassed(requiresLessonQuiz ? readQuizPass(quizPassKey) : true);
    setQuizVisible(false);
  }, [effectiveSubSessionId, quizPassKey, requiresLessonQuiz]);

  const canCompleteLesson = !requiresLessonQuiz || quizPassed;

  const goToSubSession = (subSessionId: string, markCurrentAsRead = false) => {
    onSubSessionChange?.(subSessionId, markCurrentAsRead ? { markCurrentAsRead: true } : undefined);
  };

  const handleComplete = () => {
    if (!canCompleteLesson) return;
    onComplete?.();
  };

  const openQuiz = () => {
    setQuizVisible(true);
    window.requestAnimationFrame(() => {
      quizSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const showInlineQuiz = requiresLessonQuiz && lessonQuiz && (quizVisible || quizPassed);

  const renderCompleteButton = () => (
    <CompleteLessonButton nextLessonTitle={nextLessonTitle} onComplete={handleComplete} />
  );

  const isFirstSubInSession = found.sub.number === found.session.subSessions[0]?.number;
  const sessionIntro = isFirstSubInSession ? found.session.introHtml?.trim() : "";

  return (
    <div className="lesson-article-panel relative border-b border-border bg-gradient-to-b from-emerald-50/40 via-card to-card dark:from-emerald-950/20">
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
      {nav.nextId && onSubSessionChange ? (
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
        <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 p-[1px] shadow-sm dark:border-emerald-800">
          <div className="rounded-[15px] bg-card/95 px-5 py-4 backdrop-blur-sm sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Session {found.session.number} · {found.sub.number}
            </p>
            <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
              {found.sub.title}
            </h1>
          </div>
        </div>

        <div className="mt-2 min-h-[200px]">
          {sessionIntro ? (
            <div
              className="lesson-html lesson-article-rich lesson-session-intro mb-8 overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/90 via-card to-card p-5 shadow-sm dark:border-emerald-800/40 dark:from-emerald-950/30 sm:p-6"
              dangerouslySetInnerHTML={{ __html: sessionIntro }}
            />
          ) : null}
          <ArticleSubSessionBody sub={found.sub} />

          {showInlineQuiz ? (
            <div ref={quizSectionRef} className="scroll-mt-24 pt-4">
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
                <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Evalyasyon
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
              </div>
              <LessonQuiz
                quiz={lessonQuiz.quiz}
                storageKey={quizPassKey}
                nextLessonTitle={nextLessonTitle}
                onPass={() => {
                  setQuizPassed(true);
                  setQuizVisible(true);
                }}
              />
            </div>
          ) : null}

          {requiresLessonQuiz && !lessonQuiz ? (
            <p className="text-sm text-destructive">
              Quiz pa disponib — admin: klike « Questions », ajoute kesyon yo, epi Enregistrer.
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <div className="flex gap-2 sm:hidden">
            {nav.prevId && onSubSessionChange ? (
              <Button type="button" variant="outline" size="sm" onClick={() => goToSubSession(nav.prevId!)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Précédent
              </Button>
            ) : null}
            {nav.nextId && onSubSessionChange ? (
              <Button type="button" variant="outline" size="sm" onClick={() => goToSubSession(nav.nextId!, true)}>
                Suivant
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : null}
          </div>

          {requiresLessonQuiz && !canCompleteLesson ? (
            <p className="text-xs text-muted-foreground">
              Fè {lessonQuiz!.quiz.passScore}/{lessonQuiz!.quiz.passScore} sou quiz la pou kontinye kou a.
            </p>
          ) : null}

          {onComplete && isLastStudentSub && requiresLessonQuiz && !canCompleteLesson ? (
            <Button type="button" variant="hero" size="sm" onClick={openQuiz} className="ml-auto gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Quiz
            </Button>
          ) : onComplete && isLastStudentSub && canCompleteLesson ? (
            <div className="ml-auto">{renderCompleteButton()}</div>
          ) : nav.nextId && onSubSessionChange ? (
            <Button
              type="button"
              variant="hero"
              size="sm"
              className="ml-auto hidden sm:inline-flex"
              onClick={() => goToSubSession(nav.nextId!, true)}
            >
              Suivant · {nav.nextTitle}
            </Button>
          ) : onComplete && isLastStudentSub ? (
            <div className="ml-auto">{renderCompleteButton()}</div>
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
  nextLessonTitle,
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
    const lessonQuiz = findLessonQuizInLesson(lessonId, sessions);

    if (found) {
      return (
        <ArticleSubSessionPanel
          lessonId={lessonId}
          effectiveSubSessionId={effectiveSubSessionId}
          found={found}
          nav={nav}
          lessonQuiz={lessonQuiz}
          nextLessonTitle={nextLessonTitle}
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
            <CompleteLessonButton nextLessonTitle={nextLessonTitle} onComplete={onComplete} />
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
          <CompleteLessonButton nextLessonTitle={nextLessonTitle} onComplete={onComplete} />
        </div>
      ) : null}
    </div>
  );
}
