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
import {
  findLessonQuizInLesson,
  lessonQuizPassStorageKey,
  OPEN_LESSON_QUIZ_EVENT,
  readQuizPass,
} from "@/lib/lesson-quiz";
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
  onQuizGateChange?: (passed: boolean) => void;
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
  onQuizGateChange?: (passed: boolean) => void;
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
  onQuizGateChange,
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
    const lessonQuizMet = !lessonQuiz || readQuizPass(quizPassKey);
    const localPassed = !requiresLessonQuiz || readQuizPass(quizPassKey);
    setQuizPassed(localPassed);
    setQuizVisible(false);
    onQuizGateChange?.(lessonQuizMet);
  }, [effectiveSubSessionId, lessonQuiz, onQuizGateChange, quizPassKey, requiresLessonQuiz]);

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

  useEffect(() => {
    if (!requiresLessonQuiz || quizPassed) return;
    const onOpenQuiz = () => openQuiz();
    window.addEventListener(OPEN_LESSON_QUIZ_EVENT, onOpenQuiz);
    return () => window.removeEventListener(OPEN_LESSON_QUIZ_EVENT, onOpenQuiz);
  }, [quizPassed, requiresLessonQuiz]);

  const showInlineQuiz = requiresLessonQuiz && lessonQuiz && (quizVisible || quizPassed);

  const renderCompleteButton = () => (
    <CompleteLessonButton nextLessonTitle={nextLessonTitle} onComplete={handleComplete} />
  );

  const isFirstSubInSession = found.sub.number === found.session.subSessions[0]?.number;
  const sessionIntro = isFirstSubInSession ? found.session.introHtml?.trim() : "";

  return (
    <article className="lesson-article-panel bg-white px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {found.sub.title}
        </h1>

        {sessionIntro ? (
          <div
            className="lesson-html lesson-article-rich lesson-session-intro mt-6 text-base leading-relaxed text-foreground/90"
            dangerouslySetInnerHTML={{ __html: sessionIntro }}
          />
        ) : null}

        <div className="mt-8 min-h-[200px]">
          <ArticleSubSessionBody sub={found.sub} />

          {showInlineQuiz ? (
            <div ref={quizSectionRef} className="scroll-mt-24 mt-10 border-t border-border pt-8">
              <h2 className="mb-4 font-display text-lg font-bold text-foreground">Evalyasyon</h2>
              <LessonQuiz
                quiz={lessonQuiz.quiz}
                storageKey={quizPassKey}
                nextLessonTitle={nextLessonTitle}
                onPass={() => {
                  setQuizPassed(true);
                  setQuizVisible(true);
                  onQuizGateChange?.(true);
                }}
              />
            </div>
          ) : null}

          {requiresLessonQuiz && !lessonQuiz ? (
            <p className="mt-6 text-sm text-destructive">
              Quiz pa disponib — admin: klike « Questions », ajoute kesyon yo, epi Enregistrer.
            </p>
          ) : null}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <div className="flex gap-2">
            {nav.prevId && onSubSessionChange ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => goToSubSession(nav.prevId!)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Précédent
              </Button>
            ) : null}
            {nav.nextId && onSubSessionChange ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => goToSubSession(nav.nextId!, true)}
              >
                Suivant
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : null}
          </div>

          {requiresLessonQuiz && !canCompleteLesson ? (
            <p className="text-xs text-muted-foreground">
              Fè {lessonQuiz!.quiz.passScore}/{lessonQuiz!.quiz.passScore} sou quiz la pou kontinye
              kou a.
            </p>
          ) : null}

          {onComplete && isLastStudentSub && requiresLessonQuiz && !canCompleteLesson ? (
            <Button type="button" variant="hero" size="sm" onClick={openQuiz} className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Quiz
            </Button>
          ) : onComplete && isLastStudentSub && canCompleteLesson ? (
            renderCompleteButton()
          ) : nav.nextId && onSubSessionChange ? (
            <Button
              type="button"
              variant="hero"
              size="sm"
              onClick={() => goToSubSession(nav.nextId!, true)}
            >
              Suivant · {nav.nextTitle}
            </Button>
          ) : onComplete && isLastStudentSub ? (
            renderCompleteButton()
          ) : null}
        </div>
      </div>
    </article>
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
  onQuizGateChange,
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
            onQuizGateChange={onQuizGateChange}
          />
        );
      }
    }
  }

  if (isLessonHtml(content)) {
    const safeHtml = sanitizeLessonHtml(content);

    return (
      <article className="prose-lesson bg-white px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <div
            className="lesson-html mt-6 space-y-4 text-base leading-relaxed text-foreground/90"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
          {onComplete ? (
            <div className="mt-10 flex justify-end border-t border-border pt-6">
              <CompleteLessonButton nextLessonTitle={nextLessonTitle} onComplete={onComplete} />
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  const blocks = parseLessonContent(content);
  const accordionBlocks = blocks.filter((block) => block.type === "accordion");
  const introBlocks = blocks.filter((block) => block.type !== "accordion");

  return (
    <article className="prose-lesson bg-white px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>

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
                <ul
                  key={index}
                  className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-foreground/90"
                >
                  {block.items.map((item) => (
                    <li key={item}>
                      <InlineText text={item} />
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={index} className="text-base leading-relaxed text-foreground/90">
                <InlineText text={block.text} />
              </p>
            );
          })}
        </div>

        {accordionBlocks.length > 0 ? (
          <div className="mt-8">
            {introBlocks.length === 0 ? (
              <p className="mb-4 text-sm text-muted-foreground">
                Sélectionnez un titre pour en savoir plus.
              </p>
            ) : null}
            <Accordion type="multiple" className="rounded-lg border border-border">
              {accordionBlocks.map((block, index) => (
                <AccordionItem
                  key={`${block.title}-${index}`}
                  value={`item-${index}`}
                  className="px-1"
                >
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
          <div className="mt-10 flex justify-end border-t border-border pt-6">
            <CompleteLessonButton nextLessonTitle={nextLessonTitle} onComplete={onComplete} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
