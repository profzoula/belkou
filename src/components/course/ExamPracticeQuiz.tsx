import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExamBankPayload, ExamQuestion } from "@/lib/exam-ebooks";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "unanswered" | "missed";

type ExamPracticeQuizProps = {
  bank: ExamBankPayload;
  className?: string;
};

type AnswerState = {
  selected: string | null;
  checked: boolean;
};

function storageKey(slug: string) {
  return `belkou:exam-progress:${slug}`;
}

function loadProgress(slug: string): Record<string, AnswerState> {
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, AnswerState>;
  } catch {
    return {};
  }
}

function saveProgress(slug: string, progress: Record<string, AnswerState>) {
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(progress));
  } catch {
    // ignore quota
  }
}

export function ExamPracticeQuiz({ bank, className }: ExamPracticeQuizProps) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, AnswerState>>({});
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    setProgress(loadProgress(bank.slug));
  }, [bank.slug]);

  useEffect(() => {
    saveProgress(bank.slug, progress);
  }, [bank.slug, progress]);

  const filtered = useMemo(() => {
    return bank.questions.filter((q) => {
      const state = progress[q.id];
      if (tab === "unanswered") return !state?.checked;
      if (tab === "missed") {
        return Boolean(state?.checked && state.selected && state.selected !== q.answer);
      }
      return true;
    });
  }, [bank.questions, progress, tab]);

  useEffect(() => {
    setIndex(0);
    setHintOpen(false);
  }, [tab]);

  const question: ExamQuestion | undefined = filtered[index];
  const state = question ? progress[question.id] : undefined;
  const selected = state?.selected ?? null;
  const checked = Boolean(state?.checked);

  const answeredCount = bank.questions.filter((q) => progress[q.id]?.checked).length;
  const correctCount = bank.questions.filter((q) => {
    const s = progress[q.id];
    return s?.checked && s.selected === q.answer;
  }).length;
  const missedCount = bank.questions.filter((q) => {
    const s = progress[q.id];
    return s?.checked && s.selected && s.selected !== q.answer;
  }).length;
  const unansweredCount = bank.questionCount - answeredCount;

  const updateQuestion = (id: string, patch: Partial<AnswerState>) => {
    setProgress((prev) => {
      const current = prev[id] ?? { selected: null, checked: false };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  };

  const resetAll = () => {
    if (!confirm("Réinitialiser toutes vos réponses pour cette banque ?")) return;
    setProgress({});
    setIndex(0);
    setHintOpen(false);
    setTab("all");
  };

  const go = (dir: -1 | 1) => {
    setHintOpen(false);
    setIndex((i) => Math.min(filtered.length - 1, Math.max(0, i + dir)));
  };

  return (
    <div className={cn("min-h-0 bg-[#f4f6f9] text-foreground", className)}>
      <header className="bg-[#0b1c31] text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#d4a017] uppercase">
              Practice Exam · {bank.examCode}
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {bank.questionCount}+ questions CompTIA A+ Core 1
            </h1>
            <p className="mt-2 text-sm text-white/75 sm:text-base">{bank.subtitle}</p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
              <li className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-[#d4a017]" aria-hidden />
                Réponses instantanées
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-[#d4a017]" aria-hidden />
                Explications détaillées
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-[#d4a017]" aria-hidden />
                Suivi de progression
              </li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a017]/40 bg-[#d4a017]/10 px-3 py-1.5 text-xs font-semibold text-[#f0d78c]">
              Score {correctCount}/{answeredCount || 0}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white">
              {bank.questionCount} questions
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white">
              Accès à vie
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8 lg:py-8">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", label: "Toutes", count: bank.questionCount },
                { id: "unanswered", label: "Sans réponse", count: unansweredCount },
                { id: "missed", label: "Ratées", count: missedCount },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition",
                  tab === item.id
                    ? "border-[#d4a017] bg-white text-foreground shadow-sm"
                    : "border-transparent bg-white/70 text-muted-foreground hover:bg-white",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    tab === item.id
                      ? "bg-[#d4a017] text-[#1b1404]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.count}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={resetAll}
              className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white hover:text-foreground"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Reset
            </button>
          </div>

          {!question ? (
            <div className="rounded-2xl border border-border bg-white px-6 py-16 text-center text-sm text-muted-foreground shadow-sm">
              Aucune question dans ce filtre.
            </div>
          ) : (
            <article className="overflow-hidden rounded-2xl border border-[#d4a017]/35 bg-white shadow-[0_8px_30px_rgb(15_23_42_/_0.06)]">
              <div className="flex items-center justify-between gap-3 bg-[#0b1c31] px-4 py-3 text-sm text-white sm:px-5">
                <p className="font-semibold">
                  Question {index + 1}
                  <span className="ml-2 font-normal text-white/55">
                    / {filtered.length}
                    {question.num ? ` · ${question.num}` : ""}
                  </span>
                </p>
                <p className="tabular-nums text-white/80">
                  Score : {correctCount}/{answeredCount}
                </p>
              </div>

              <div className="space-y-5 p-4 sm:p-6">
                {question.sectionTitle ? (
                  <p className="text-xs font-semibold tracking-wide text-[#d4a017] uppercase">
                    {question.sectionTitle}
                  </p>
                ) : null}
                <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
                  {question.stem}
                </h2>

                <ul className="space-y-2.5">
                  {question.choices.map((choice) => {
                    const isSelected = selected === choice.letter;
                    const isCorrect = choice.letter === question.answer;
                    const showResult = checked;

                    return (
                      <li key={choice.letter}>
                        <button
                          type="button"
                          disabled={checked}
                          onClick={() =>
                            updateQuestion(question.id, {
                              selected: choice.letter,
                              checked: false,
                            })
                          }
                          className={cn(
                            "flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition sm:px-4",
                            !showResult &&
                              (isSelected
                                ? "border-[#0b1c31] bg-[#0b1c31]/5 ring-1 ring-[#0b1c31]/20"
                                : "border-border bg-white hover:border-[#0b1c31]/30 hover:bg-muted/30"),
                            showResult &&
                              isCorrect &&
                              "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
                            showResult &&
                              isSelected &&
                              !isCorrect &&
                              "border-destructive/50 bg-destructive/5",
                            showResult &&
                              !isSelected &&
                              !isCorrect &&
                              "border-border bg-white opacity-70",
                            checked && "cursor-default",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                              showResult && isCorrect
                                ? "bg-emerald-600 text-white"
                                : showResult && isSelected && !isCorrect
                                  ? "bg-destructive text-white"
                                  : isSelected
                                    ? "bg-[#0b1c31] text-white"
                                    : "bg-muted text-muted-foreground",
                            )}
                          >
                            {choice.letter}
                          </span>
                          <span className="pt-1 text-sm leading-relaxed sm:text-[15px]">
                            {choice.text}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {checked ? (
                  <div
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm",
                      selected === question.answer
                        ? "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                        : "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
                    )}
                  >
                    <p className="font-semibold">
                      {selected === question.answer
                        ? "Bonne réponse"
                        : `Incorrect — réponse : ${question.answer}`}
                    </p>
                    {question.explanation ? (
                      <p className="mt-1.5 leading-relaxed opacity-90">{question.explanation}</p>
                    ) : null}
                  </div>
                ) : null}

                {hintOpen && !checked && question.explanation ? (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-100">
                    <p className="font-semibold">Indice</p>
                    <p className="mt-1 leading-relaxed opacity-90">
                      {question.explanation.length > 160
                        ? `${question.explanation.slice(0, 160).trim()}…`
                        : question.explanation}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <Button
                    type="button"
                    disabled={!selected || checked}
                    className="rounded-xl bg-[#0b1c31] text-white hover:bg-[#0b1c31]/90 disabled:opacity-40"
                    onClick={() => updateQuestion(question.id, { checked: true })}
                  >
                    Vérifier la réponse
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300"
                    onClick={() => setHintOpen((v) => !v)}
                    disabled={checked || !question.explanation}
                  >
                    <Lightbulb className="size-4" aria-hidden />
                    Indice
                  </Button>
                  <div className="ml-auto flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      disabled={index <= 0}
                      onClick={() => go(-1)}
                      aria-label="Question précédente"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      disabled={index >= filtered.length - 1}
                      onClick={() => go(1)}
                      aria-label="Question suivante"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-[#0b1c31] text-white">
                <BookOpen className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold">CompTIA A+ Core 1</p>
                <p className="text-xs text-muted-foreground">{bank.examCode}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="rounded-xl bg-[#d4a017] px-3 py-2.5 text-center text-sm font-bold text-[#1b1404]">
                Practice · {bank.questionCount} questions
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-border px-2.5 py-2">
                  <p className="text-muted-foreground">Répondues</p>
                  <p className="mt-0.5 text-base font-semibold tabular-nums">{answeredCount}</p>
                </div>
                <div className="rounded-xl border border-border px-2.5 py-2">
                  <p className="text-muted-foreground">Correctes</p>
                  <p className="mt-0.5 text-base font-semibold tabular-nums text-emerald-600">
                    {correctCount}
                  </p>
                </div>
              </div>
            </div>
            {bank.sections.length > 0 ? (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Domaines
                </p>
                <ul className="mt-2 max-h-56 space-y-1.5 overflow-y-auto text-xs">
                  {bank.sections.map((section) => (
                    <li key={section.id} className="leading-snug text-foreground/90">
                      {section.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
