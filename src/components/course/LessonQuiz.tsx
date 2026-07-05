import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  gradeLessonQuiz,
  readQuizPass,
  writeQuizPass,
  type LessonQuiz as LessonQuizData,
} from "@/lib/lesson-quiz";
import { cn } from "@/lib/utils";

type LessonQuizProps = {
  quiz: LessonQuizData;
  storageKey: string;
  nextLessonTitle?: string;
  onPass?: () => void;
};

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

function optionLetter(index: number): string {
  return OPTION_LETTERS[index] ?? String.fromCharCode(65 + index);
}

export function LessonQuiz({ quiz, storageKey, nextLessonTitle, onPass }: LessonQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(() => readQuizPass(storageKey));
  const [stepError, setStepError] = useState<string | null>(null);

  const total = quiz.questions.length;
  const answeredCount = quiz.questions.filter((question) => answers[question.id]).length;
  const progressPercent = Math.round((answeredCount / total) * 100);
  const currentQuestion = quiz.questions[currentIndex];

  useEffect(() => {
    if (passed) onPass?.();
  }, [passed, onPass]);

  const result = useMemo(() => {
    if (!submitted && !passed) return null;
    return gradeLessonQuiz(quiz, answers);
  }, [answers, passed, quiz, submitted]);

  const selectAnswer = (questionId: string, optionId: string) => {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    setStepError(null);
    if (submitted) setSubmitted(false);
  };

  const handleSubmit = () => {
    const missing = quiz.questions.some((question) => !answers[question.id]);
    if (missing) {
      setStepError("Reponn tout kesyon yo anvan ou verifye.");
      return;
    }

    setSubmitted(true);
    const graded = gradeLessonQuiz(quiz, answers);
    if (graded.passed) {
      writeQuizPass(storageKey);
      setPassed(true);
      onPass?.();
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setPassed(false);
    setCurrentIndex(0);
    setStepError(null);
    try {
      window.localStorage.removeItem(`belkou:quiz-pass:${storageKey}`);
    } catch {
      /* ignore */
    }
  };

  const goNext = () => {
    if (!currentQuestion) return;
    if (!answers[currentQuestion.id]) {
      setStepError("Chwazi yon repons pou kontinye.");
      return;
    }
    setStepError(null);
    setCurrentIndex((index) => Math.min(index + 1, total - 1));
  };

  const goPrev = () => {
    setStepError(null);
    setCurrentIndex((index) => Math.max(index - 1, 0));
  };

  if (passed) {
    return (
      <div className="lesson-quiz lesson-quiz--success overflow-hidden rounded-2xl border border-emerald-200/80 bg-card shadow-md dark:border-emerald-900/60">
        <div className="lesson-quiz-success-banner relative overflow-hidden px-6 py-8 sm:px-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-emerald-400/5 to-primary/10" />
          <div className="relative flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Trophy className="h-8 w-8" />
            </div>
            <p className="mt-4 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Felisitasyon!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ou reyisi quiz la ak yon nòt pafè
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Sparkles className="h-4 w-4" />
              {quiz.passScore}/{quiz.passScore} bon repons
            </div>
          </div>
        </div>
        <div className="border-t border-emerald-100 px-6 py-5 dark:border-emerald-900/50 sm:px-8">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ou pare pou kontinye fòmasyon an. Klike{" "}
            <strong className="text-foreground">
              {nextLessonTitle ? `Leçon suivante · ${nextLessonTitle}` : "Marquer comme terminé"}
            </strong>{" "}
            anba a.
          </p>
        </div>
      </div>
    );
  }

  if (submitted && result && !result.passed) {
    return (
      <div className="lesson-quiz space-y-5">
        <div className="overflow-hidden rounded-2xl border border-red-200/80 bg-card shadow-md dark:border-red-900/60">
          <div className="relative overflow-hidden border-b border-red-100 px-6 py-6 dark:border-red-900/40 sm:px-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/5" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-md">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-foreground">Pa ankò — eseye ankò</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ou gen{" "}
                  <strong className="text-foreground">
                    {result.score}/{result.total}
                  </strong>{" "}
                  bon repons. Ou bezwen{" "}
                  <strong className="text-foreground">
                    {quiz.passScore}/{quiz.passScore}
                  </strong>{" "}
                  pou pase.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {quiz.questions.map((question, index) => {
              const selected = answers[question.id];
              const isCorrect = selected === question.correctOptionId;

              return (
                <div key={question.id} className="px-6 py-5 sm:px-8">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        isCorrect
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{question.prompt}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Repons ou:{" "}
                        <span className={cn("font-medium", isCorrect ? "text-emerald-700" : "text-red-700")}>
                          {question.options.find((option) => option.id === selected)?.label ?? "—"}
                        </span>
                      </p>
                      {!isCorrect && question.explanation ? (
                        <div className="mt-3 flex gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/20">
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <p className="text-xs leading-relaxed text-muted-foreground">{question.explanation}</p>
                        </div>
                      ) : null}
                    </div>
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border bg-muted/20 px-6 py-5 sm:px-8">
            <Button type="button" variant="hero" size="sm" className="gap-2" onClick={handleRetry}>
              <RotateCcw className="h-4 w-4" />
              Refè quiz la
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const selected = answers[currentQuestion.id];
  const isLastQuestion = currentIndex === total - 1;
  const allAnswered = answeredCount === total;

  return (
    <div className="lesson-quiz overflow-hidden rounded-2xl border border-border bg-card shadow-md">
      <div className="lesson-quiz-header relative overflow-hidden border-b border-border px-5 py-5 sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Award className="h-3.5 w-3.5" />
                Quiz chapit la
              </div>
              <h2 className="mt-1 font-display text-lg font-bold leading-snug text-foreground sm:text-xl">
                {quiz.title}
              </h2>
            </div>
            <div className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold tabular-nums text-muted-foreground backdrop-blur">
              {answeredCount}/{total} reponn
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>
                Kesyon {currentIndex + 1} sou {total}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${Math.max(((currentIndex + 1) / total) * 100, 8)}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {quiz.questions.map((question, index) => {
                const done = Boolean(answers[question.id]);
                const active = index === currentIndex;

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => {
                      setStepError(null);
                      setCurrentIndex(index);
                    }}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition-all",
                      active &&
                        "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20",
                      !active &&
                        done &&
                        "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
                      !active &&
                        !done &&
                        "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                    aria-label={`Kesyon ${index + 1}`}
                    aria-current={active ? "step" : undefined}
                  >
                    {done && !active ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
            {currentIndex + 1}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Chwazi yon sèl repons
            </p>
            <p className="mt-1 text-base font-semibold leading-relaxed text-foreground sm:text-lg">
              {currentQuestion.prompt}
            </p>
          </div>
        </div>

        <div
          className="space-y-2.5"
          role="radiogroup"
          aria-label={`Kesyon ${currentIndex + 1}`}
        >
          {currentQuestion.options.map((option, optionIndex) => {
            const isSelected = selected === option.id;
            const letter = optionLetter(optionIndex);

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => selectAnswer(currentQuestion.id, option.id)}
                className={cn(
                  "lesson-quiz-option group flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10 ring-1 ring-primary/20"
                    : "border-border bg-background hover:border-primary/35 hover:bg-accent/40",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                  )}
                >
                  {letter}
                </span>
                <span className="pt-1.5 text-sm leading-relaxed text-foreground">{option.label}</span>
              </button>
            );
          })}
        </div>

        {stepError ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-destructive">
            <CircleHelp className="h-4 w-4 shrink-0" />
            {stepError}
          </p>
        ) : null}

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CircleHelp className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Ou bezwen <strong className="text-foreground">{quiz.passScore}/{quiz.passScore}</strong> bon repons pou
            debloke pwochen etap kou a.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/15 px-5 py-4 sm:px-7">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {!isLastQuestion ? (
            <Button type="button" variant="hero" size="sm" onClick={goNext} className="gap-1.5">
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="hero"
              size="sm"
              disabled={!allAnswered}
              onClick={handleSubmit}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Verifye repons yo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
