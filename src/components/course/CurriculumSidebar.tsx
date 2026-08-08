import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock3, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CourseTocItem,
  CourseTocList,
  CourseTocPartHeader,
} from "@/components/course/CourseTocTimeline";
import type { LessonLockReason } from "@/lib/course-access";
import {
  countLessons,
  formatCourseDurationLabel,
  getCourseDisplayDuration,
  parseLessonDurationMinutes,
  type CourseLesson,
} from "@/lib/courses";
import type { PublicCourse } from "@/lib/fns/courses";
import { flattenArticleSubSessions, parseArticleSessions } from "@/lib/lesson-sessions";
import { cn } from "@/lib/utils";

export type CurriculumSidebarProps = {
  course: PublicCourse;
  activeLessonId: string;
  activeArticleSubSessionId: string | null;
  viewedArticleSubSessionIds: Set<string>;
  getLockState: (lesson: CourseLesson) => { locked: boolean; reason: LessonLockReason };
  completedLessonIds: string[];
  progressPercent: number;
  onSelectLesson: (lessonId: string) => void;
  onSelectArticleSubSession: (lessonId: string, subSessionId: string) => void;
  variant?: "sidebar" | "tab";
  lessonQuery?: string;
  onLessonQueryChange?: (query: string) => void;
};

type TocEntry = {
  key: string;
  title: string;
  isQuiz: boolean;
  lessonId: string;
  subSessionId?: string;
  locked: boolean;
  completed: boolean;
  active: boolean;
};

function buildLessonEntries(
  lesson: CourseLesson,
  activeLessonId: string,
  activeArticleSubSessionId: string | null,
  viewedArticleSubSessionIds: Set<string>,
  lessonCompleted: boolean,
  locked: boolean,
): TocEntry[] {
  const sessions =
    lesson.type === "article" && lesson.content ? parseArticleSessions(lesson.content) : null;

  if (sessions?.length) {
    return flattenArticleSubSessions(lesson.id, sessions).map(({ id, sub }) => ({
      key: id,
      title: sub.title,
      isQuiz: Boolean(sub.isQuiz),
      lessonId: lesson.id,
      subSessionId: id,
      locked,
      completed: lessonCompleted || viewedArticleSubSessionIds.has(id),
      active: lesson.id === activeLessonId && activeArticleSubSessionId === id,
    }));
  }

  return [
    {
      key: lesson.id,
      title: lesson.title,
      isQuiz: false,
      lessonId: lesson.id,
      locked,
      completed: lessonCompleted,
      active: lesson.id === activeLessonId && !activeArticleSubSessionId,
    },
  ];
}

function getEntryState(entry: TocEntry): "completed" | "active" | "upcoming" | "quiz" | "locked" {
  if (entry.locked) return "locked";
  if (entry.completed) return "completed";
  if (entry.active) return "active";
  if (entry.isQuiz) return "quiz";
  return "upcoming";
}

export function CurriculumSidebar({
  course,
  activeLessonId,
  activeArticleSubSessionId,
  viewedArticleSubSessionIds,
  getLockState,
  completedLessonIds,
  progressPercent,
  onSelectLesson,
  onSelectArticleSubSession,
  variant = "sidebar",
  lessonQuery = "",
  onLessonQueryChange,
}: CurriculumSidebarProps) {
  const reduceMotion = useReducedMotion();
  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);
  const totalLessons = countLessons(course);
  const completedCount = completedLessonIds.filter((id) =>
    course.sections.some((section) => section.lessons.some((lesson) => lesson.id === id)),
  ).length;

  const remainingMinutes = useMemo(() => {
    let minutes = 0;
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (completedSet.has(lesson.id)) continue;
        minutes += parseLessonDurationMinutes(lesson.duration ?? "");
      }
    }
    return minutes;
  }, [completedSet, course.sections]);

  const query = lessonQuery.trim().toLowerCase();
  const summary = `${course.sections.length} parties · ${totalLessons} leçons · ${getCourseDisplayDuration(course)}`;

  let globalStep = 0;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-card/80 backdrop-blur-sm",
        variant === "sidebar" ? "h-full" : "",
      )}
    >
      {variant === "sidebar" ? (
        <div className="shrink-0 space-y-4 border-b border-border/80 p-5">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
              Table des matières
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{summary}</p>
          </div>

          <div className="rounded-[20px] border border-border bg-background/80 p-4 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Progression</p>
                <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">
                  {progressPercent}
                  <span className="text-lg text-muted-foreground">%</span>
                </p>
              </div>
              <p className="pb-1 text-right text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{completedCount}</span> / {totalLessons}{" "}
                leçons
              </p>
            </div>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progression du cours : ${progressPercent} %`}
            >
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            {remainingMinutes > 0 && completedCount < totalLessons ? (
              <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock3 className="size-3.5" aria-hidden />
                ~{formatCourseDurationLabel(remainingMinutes)} restantes
              </p>
            ) : null}
          </div>

          {onLessonQueryChange ? (
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={lessonQuery}
                onChange={(event) => onLessonQueryChange(event.target.value)}
                placeholder="Rechercher une leçon…"
                className="h-10 rounded-xl border-border bg-background pl-9"
                aria-label="Rechercher une leçon"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="shrink-0 space-y-2 border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold tracking-tight">Table des matières</h2>
          <p className="text-xs text-muted-foreground">{summary}</p>
          {onLessonQueryChange ? (
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={lessonQuery}
                onChange={(event) => onLessonQueryChange(event.target.value)}
                placeholder="Rechercher…"
                className="h-9 rounded-xl pl-9 text-sm"
                aria-label="Rechercher une leçon"
              />
            </div>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          variant === "sidebar"
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain"
            : "min-h-0",
        )}
      >
        {course.sections.map((section, sectionIndex) => {
          const sectionEntries = section.lessons.flatMap((lesson) => {
            const matchesQuery =
              !query ||
              lesson.title.toLowerCase().includes(query) ||
              section.title.toLowerCase().includes(query);
            if (!matchesQuery) return [];

            const { locked } = getLockState(lesson);
            const lessonCompleted = completedSet.has(lesson.id);
            return buildLessonEntries(
              lesson,
              activeLessonId,
              activeArticleSubSessionId,
              viewedArticleSubSessionIds,
              lessonCompleted,
              locked,
            ).filter((entry) => !query || entry.title.toLowerCase().includes(query));
          });

          if (query && sectionEntries.length === 0) return null;

          const entriesWithSteps = sectionEntries.map((entry) => {
            const stepNumber = entry.isQuiz ? null : ++globalStep;
            return { entry, stepNumber };
          });

          return (
            <section key={section.id} className="border-b border-border/60 last:border-b-0">
              <CourseTocPartHeader partNumber={sectionIndex + 1} title={section.title} />
              <CourseTocList>
                {entriesWithSteps.map(({ entry, stepNumber }, index) => {
                  const state = getEntryState(entry);
                  const isLast = index === entriesWithSteps.length - 1;

                  return (
                    <CourseTocItem
                      key={entry.key}
                      title={entry.title}
                      stepNumber={stepNumber}
                      state={state}
                      isQuiz={entry.isQuiz}
                      isLast={isLast}
                      disabled={entry.locked}
                      ariaLabel={`${entry.isQuiz ? "Quiz" : `Étape ${stepNumber}`} : ${entry.title}${entry.completed ? ", terminé" : ""}${entry.locked ? ", verrouillé" : ""}`}
                      onClick={
                        entry.locked
                          ? undefined
                          : () => {
                              if (entry.subSessionId) {
                                onSelectArticleSubSession(entry.lessonId, entry.subSessionId);
                              } else {
                                onSelectLesson(entry.lessonId);
                              }
                            }
                      }
                    />
                  );
                })}
              </CourseTocList>
            </section>
          );
        })}
      </div>
    </div>
  );
}
