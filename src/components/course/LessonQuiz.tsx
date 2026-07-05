import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  onPass?: () => void;
};

export function LessonQuiz({ quiz, storageKey, onPass }: LessonQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(() => readQuizPass(storageKey));

  useEffect(() => {
    if (passed) onPass?.();
  }, [passed, onPass]);

  const result = useMemo(() => {
    if (!submitted && !passed) return null;
    return gradeLessonQuiz(quiz, answers);
  }, [answers, passed, quiz, submitted]);

  const handleSubmit = () => {
    const missing = quiz.questions.some((question) => !answers[question.id]);
    if (missing) return;

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
    try {
      window.localStorage.removeItem(`belkou:quiz-pass:${storageKey}`);
    } catch {
      /* ignore */
    }
  };

  if (passed) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-5 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-foreground">Quiz reyisi — {quiz.passScore}/{quiz.passScore}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ou ka kontinye ak rès kou a. Klike <strong>Suivant</strong> oswa{" "}
              <strong>Marquer comme terminé</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/20">
        <p className="text-sm text-foreground">
          Reponn <strong>tout {quiz.questions.length} kesyon yo</strong> kòrèkteman ({quiz.passScore}/
          {quiz.passScore}) pou w ka pase ak kontinye fòmasyon an.
        </p>
      </div>

      {quiz.questions.map((question, index) => {
        const selected = answers[question.id];
        const showFeedback = submitted;
        const isCorrect = showFeedback && selected === question.correctOptionId;
        const isWrong = showFeedback && selected && selected !== question.correctOptionId;

        return (
          <fieldset
            key={question.id}
            className={cn(
              "rounded-xl border px-4 py-4",
              isCorrect && "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20",
              isWrong && "border-red-300 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20",
              !showFeedback && "border-border bg-card",
            )}
          >
            <legend className="px-1 text-sm font-semibold text-foreground">
              {index + 1}. {question.prompt}
            </legend>

            <RadioGroup
              value={selected ?? ""}
              onValueChange={(value) => {
                setAnswers((current) => ({ ...current, [question.id]: value }));
                if (submitted) setSubmitted(false);
              }}
              className="mt-3 space-y-2"
            >
              {question.options.map((option) => {
                const optionCorrect = showFeedback && option.id === question.correctOptionId;
                const optionWrong =
                  showFeedback && selected === option.id && option.id !== question.correctOptionId;

                return (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      optionCorrect && "border-emerald-400 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
                      optionWrong && "border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
                      !showFeedback && "border-transparent hover:bg-muted/40",
                    )}
                  >
                    <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} className="mt-0.5" />
                    <Label htmlFor={`${question.id}-${option.id}`} className="cursor-pointer text-sm leading-relaxed">
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>

            {showFeedback && !isCorrect && question.explanation ? (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{question.explanation}</p>
            ) : null}
          </fieldset>
        );
      })}

      {submitted && result && !result.passed ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/60 px-4 py-4 dark:border-red-900 dark:bg-red-950/20">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">
              {result.score}/{result.total} — ou bezwen {quiz.passScore}/{quiz.passScore} pou pase
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Reli sous-session yo ki mal, epi eseye ankò.
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={handleRetry}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Refè quiz la
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            {Object.keys(answers).length}/{quiz.questions.length} kesyon reponn
          </p>
          <Button
            type="button"
            variant="hero"
            size="sm"
            disabled={quiz.questions.some((question) => !answers[question.id])}
            onClick={handleSubmit}
          >
            Verifye repons yo
          </Button>
        </div>
      )}
    </div>
  );
}
