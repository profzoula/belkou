import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCourseLessonNotes, saveCourseLessonNote } from "@/lib/fns/lesson-notes";
import type { CourseLesson } from "@/lib/courses";

type CourseNotesPanelProps = {
  courseSlug: string;
  lessons: CourseLesson[];
  activeLessonId: string;
  accessToken: string;
};

export function CourseNotesPanel({
  courseSlug,
  lessons,
  activeLessonId,
  accessToken,
}: CourseNotesPanelProps) {
  const loadNotesFn = useServerFn(getCourseLessonNotes);
  const saveNoteFn = useServerFn(saveCourseLessonNote);
  const [selectedLessonId, setSelectedLessonId] = useState(activeLessonId);
  const [notesByLessonId, setNotesByLessonId] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedLessonId(activeLessonId);
  }, [activeLessonId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void loadNotesFn({ data: { accessToken, courseSlug } })
      .then((result) => {
        if (!cancelled) setNotesByLessonId(result.notesByLessonId);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Chargement impossible");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, courseSlug, loadNotesFn]);

  useEffect(() => {
    setDraft(notesByLessonId[selectedLessonId] ?? "");
  }, [notesByLessonId, selectedLessonId]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const persistNote = (lessonId: string, text: string) => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      setSaving(true);
      void saveNoteFn({
        data: {
          accessToken,
          courseSlug,
          lessonId,
          text,
        },
      })
        .then(() => {
          setNotesByLessonId((current) => {
            const next = { ...current };
            if (text.trim()) next[lessonId] = text;
            else delete next[lessonId];
            return next;
          });
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Enregistrement impossible");
        })
        .finally(() => setSaving(false));
    }, 700);
  };

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId);

  return (
    <div className="mx-auto max-w-2xl space-y-4 text-left">
      <div>
        <h3 className="font-semibold text-foreground">Notes de cours</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos notes sont enregistrées automatiquement et synchronisées avec votre compte BelKou.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes-lesson">Leçon</Label>
        <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
          <SelectTrigger id="notes-lesson">
            <SelectValue placeholder="Choisir une leçon" />
          </SelectTrigger>
          <SelectContent>
            {lessons.map((lesson) => (
              <SelectItem key={lesson.id} value={lesson.id}>
                {lesson.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des notes…
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="lesson-note">{selectedLesson?.title ?? "Notes"}</Label>
          <Textarea
            id="lesson-note"
            value={draft}
            onChange={(event) => {
              const next = event.target.value;
              setDraft(next);
              persistNote(selectedLessonId, next);
            }}
            placeholder="Résumé, idées, questions personnelles…"
            rows={10}
            className="min-h-[220px] resize-y"
          />
          <p className="text-xs text-muted-foreground">
            {saving ? "Enregistrement…" : "Sauvegarde automatique"}
          </p>
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
