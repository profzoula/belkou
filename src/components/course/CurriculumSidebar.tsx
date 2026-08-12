import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CourseTocCollapsibleSection,
  CourseTocItem,
  CourseTocList,
} from "@/components/course/CourseTocTimeline";
import type { LessonLockReason } from "@/lib/course-access";
import { countLessons, type CourseLesson } from "@/lib/courses";
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

function sectionContainsActiveLesson(sectionLessons: CourseLesson[], activeLessonId: string) {
  return sectionLessons.some((lesson) => lesson.id === activeLessonId);
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

  const initialOpenSections = useMemo(
    () =>
      new Set(
        course.sections
          .filter((section) => sectionContainsActiveLesson(section.lessons, activeLessonId))
          .map((section) => section.id),
      ),
    [activeLessonId, course.sections],
  );

  const [openSections, setOpenSections] = useState<Set<string>>(initialOpenSections);

  useEffect(() => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      for (const section of course.sections) {
        if (sectionContainsActiveLesson(section.lessons, activeLessonId)) {
          next.add(section.id);
        }
      }
      return next;
    });
  }, [activeLessonId, course.sections]);

  const query = lessonQuery.trim().toLowerCase();
  const isOdinSidebar = variant === "sidebar";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-background",
        variant === "sidebar" ? "h-full" : "",
      )}
    >
      {isOdinSidebar ? (
        <div className="shrink-0 space-y-3 border-b border-border px-4 py-4">
          <h2 className="font-display text-lg font-bold leading-tight tracking-tight text-foreground">
            {course.title}
          </h2>
          <div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progression du cours : ${progressPercent} %`}
            >
              <motion.div
                className="h-full rounded-full bg-success"
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{progressPercent}%</span> complete ·{" "}
              {completedCount}/{totalLessons} leçons
            </p>
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
                className="h-9 rounded-lg border-border bg-background pl-9 text-sm"
                aria-label="Rechercher une leçon"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="shrink-0 space-y-2 border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold tracking-tight">{course.title}</h2>
          <p className="text-xs text-muted-foreground">
            {progressPercent}% · {completedCount}/{totalLessons} leçons
          </p>
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
                className="h-9 rounded-lg pl-9 text-sm"
                aria-label="Rechercher une leçon"
              />
            </div>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          variant === "sidebar" ? "min-h-0 flex-1 overflow-y-auto overscroll-contain" : "min-h-0",
        )}
      >
        {course.sections.map((section) => {
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

          const sectionCompletedCount = section.lessons.filter((lesson) =>
            completedSet.has(lesson.id),
          ).length;
          const isOpen = query ? true : openSections.has(section.id);

          return (
            <CourseTocCollapsibleSection
              key={section.id}
              title={section.title}
              open={isOpen}
              onOpenChange={(open) => {
                setOpenSections((prev) => {
                  const next = new Set(prev);
                  if (open) next.add(section.id);
                  else next.delete(section.id);
                  return next;
                });
              }}
              completedCount={sectionCompletedCount}
              totalCount={section.lessons.length}
            >
              <CourseTocList markerStyle="odin">
                {sectionEntries.map((entry, index) => {
                  const state = getEntryState(entry);
                  const isLast = index === sectionEntries.length - 1;

                  return (
                    <CourseTocItem
                      key={entry.key}
                      title={entry.title}
                      state={state}
                      isQuiz={entry.isQuiz}
                      isLast={isLast}
                      disabled={entry.locked}
                      markerStyle="odin"
                      ariaLabel={`${entry.title}${entry.completed ? ", terminé" : ""}${entry.locked ? ", verrouillé" : ""}`}
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
            </CourseTocCollapsibleSection>
          );
        })}
      </div>
    </div>
  );
}
