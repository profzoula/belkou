import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmptyLessonQuiz,
  normalizeLessonQuiz,
  validateLessonQuizDraft,
  type LessonQuiz,
  type LessonQuizQuestion,
} from "@/lib/lesson-quiz";

type LessonQuizBuilderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuiz: LessonQuiz;
  onSave: (quiz: LessonQuiz) => void;
};

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export function LessonQuizBuilderDialog({
  open,
  onOpenChange,
  initialQuiz,
  onSave,
}: LessonQuizBuilderDialogProps) {
  const [quiz, setQuiz] = useState<LessonQuiz>(initialQuiz);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuiz(initialQuiz);
      setError(null);
    }
  }, [initialQuiz, open]);

  const updateQuestion = (questionId: string, patch: Partial<LessonQuizQuestion>) => {
    setQuiz((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId ? { ...question, ...patch } : question,
      ),
    }));
  };

  const updateOption = (questionId: string, optionId: string, label: string) => {
    setQuiz((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId ? { ...option, label } : option,
              ),
            }
          : question,
      ),
    }));
  };

  const addQuestion = () => {
    setQuiz((current) => {
      const nextIndex = current.questions.length + 1;
      return {
        ...current,
        questions: [
          ...current.questions,
          {
            id: `q${nextIndex}`,
            prompt: "",
            options: [
              { id: "a", label: "" },
              { id: "b", label: "" },
              { id: "c", label: "" },
              { id: "d", label: "" },
            ],
            correctOptionId: "a",
            explanation: "",
          },
        ],
      };
    });
  };

  const removeQuestion = (questionId: string) => {
    setQuiz((current) => {
      const nextQuestions = current.questions.filter((question) => question.id !== questionId);
      return {
        ...current,
        questions: nextQuestions.length ? nextQuestions : createEmptyLessonQuiz(1).questions,
      };
    });
  };

  const handleSave = () => {
    const normalized = normalizeLessonQuiz({
      ...quiz,
      passScore: quiz.questions.length,
    });
    if (!normalized) {
      setError("Ajoutez au moins une question complète.");
      return;
    }

    const validationError = validateLessonQuizDraft(normalized);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(normalized);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Questions du quiz</DialogTitle>
          <DialogDescription>
            Choix multiple (A, B, C, D). L&apos;élève doit avoir{" "}
            <strong>{quiz.questions.length}/{quiz.questions.length}</strong> pour passer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {quiz.questions.map((question, index) => (
            <div key={question.id} className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <Label className="text-sm font-semibold">Question {index + 1}</Label>
                {quiz.questions.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Supprimer
                  </Button>
                ) : null}
              </div>

              <Textarea
                value={question.prompt}
                onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })}
                rows={2}
                placeholder="Énoncé de la question…"
                className="mb-4 text-sm"
              />

              <RadioGroup
                value={question.correctOptionId}
                onValueChange={(value) => updateQuestion(question.id, { correctOptionId: value })}
                className="space-y-2"
              >
                {question.options.map((option, optionIndex) => (
                  <div key={option.id} className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2">
                    <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} className="mt-2.5" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <Label htmlFor={`${question.id}-${option.id}`} className="text-xs font-semibold text-muted-foreground">
                        Réponse {OPTION_LABELS[optionIndex]} {question.correctOptionId === option.id ? "· bonne réponse" : ""}
                      </Label>
                      <Input
                        value={option.label}
                        onChange={(event) => updateOption(question.id, option.id, event.target.value)}
                        placeholder={`Réponse ${OPTION_LABELS[optionIndex]}…`}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
              </RadioGroup>

              <div className="mt-4 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Explication (optionnel, après mauvaise réponse)</Label>
                <Input
                  value={question.explanation ?? ""}
                  onChange={(event) => updateQuestion(question.id, { explanation: event.target.value })}
                  placeholder="Pourquoi cette réponse est correcte…"
                  className="text-sm"
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une question
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" variant="hero" onClick={handleSave}>
            Enregistrer le quiz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
