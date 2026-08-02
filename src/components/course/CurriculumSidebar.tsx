import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Lock,
  PlayCircle,
  Search,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { ArticleCurriculumOutline } from "@/components/course/ArticleCurriculumOutline";
import type { LessonLockReason } from "@/lib/course-access";
import {
  countLessons,
  formatCourseDurationLabel,
  getCourseDisplayDuration,
  getLessonDisplayDuration,
  getSectionDurationMinutes,
  parseLessonDurationMinutes,
  type CourseLesson,
} from "@/lib/courses";
import type { PublicCourse } from "@/lib/fns/courses";
import { parseArticleSessions } from "@/lib/lesson-sessions";
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

function LessonTypeIcon({
  lesson,
  done,
  locked,
  active,
}: {
  lesson: CourseLesson;
  done: boolean;
  locked: boolean;
  active: boolean;
}) {
  if (done) {
    return <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />;
  }
  if (locked) {
    return <Lock className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />;
  }
  if (lesson.type === "article") {
    return (
      <FileText
        className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
        aria-hidden
      />
    );
  }
  if (active) {
    return <PlayCircle className="size-4 shrink-0 text-primary" aria-hidden />;
  }
  return <Circle className="size-4 shrink-0 text-muted-foreground/45" aria-hidden />;
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
  const defaultSections = useMemo(() => {
    if (!query) return course.sections.map((section) => section.id);
    return course.sections
      .filter((section) =>
        section.lessons.some(
          (lesson) =>
            lesson.title.toLowerCase().includes(query) ||
            section.title.toLowerCase().includes(query),
        ),
      )
      .map((section) => section.id);
  }, [course.sections, query]);

  const [openSections, setOpenSections] = useState<string[]>(defaultSections);

  // Keep accordion open for active/search matches without fighting user collapses aggressively
  const accordionValue = query ? defaultSections : openSections;

  const summary = `${course.sections.length} modules · ${totalLessons} leçons · ${getCourseDisplayDuration(course)}`;

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
            <h2 className="font-display text-[15px] font-semibold tracking-tight">Programme</h2>
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
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
            : "min-h-0 px-2 py-2",
        )}
      >
        <Accordion
          type="multiple"
          value={accordionValue}
          onValueChange={setOpenSections}
          className="space-y-2"
        >
          {course.sections.map((section) => {
            const sectionLessons = query
              ? section.lessons.filter(
                  (lesson) =>
                    lesson.title.toLowerCase().includes(query) ||
                    section.title.toLowerCase().includes(query),
                )
              : section.lessons;
            if (query && sectionLessons.length === 0) return null;

            const completed = section.lessons.filter((lesson) => completedSet.has(lesson.id)).length;
            const sectionDuration = getSectionDurationMinutes(section);

            return (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="overflow-hidden rounded-[16px] border border-border/80 border-b border-b-border/80 bg-background/60 px-0"
              >
                <AccordionTrigger className="px-3.5 py-3.5 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <div className="flex w-full items-start gap-2 pr-2 text-left">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug">{section.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {completed}/{section.lessons.length}
                        {sectionDuration > 0 ? ` · ${sectionDuration} min` : ""}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <ul className="space-y-1.5 px-2">
                    {sectionLessons.map((lesson) => {
                      const globalIndex =
                        course.sections
                          .flatMap((item) => item.lessons)
                          .findIndex((item) => item.id === lesson.id) + 1;
                      const active = lesson.id === activeLessonId;
                      const { locked } = getLockState(lesson);
                      const done = completedSet.has(lesson.id);
                      const lessonDuration = getLessonDisplayDuration(lesson);
                      const articleSessions =
                        lesson.type === "article" && lesson.content
                          ? parseArticleSessions(lesson.content)
                          : null;

                      if (articleSessions?.length) {
                        return (
                          <li key={lesson.id} className="rounded-xl px-1 py-1">
                            <p
                              className={cn(
                                "mb-2 px-1 text-[11px] font-semibold tracking-wide uppercase",
                                active ? "text-primary" : "text-muted-foreground",
                              )}
                            >
                              {globalIndex}. {lesson.title}
                            </p>
                            <ArticleCurriculumOutline
                              lesson={lesson}
                              sessions={articleSessions}
                              activeSubSessionId={active ? activeArticleSubSessionId : null}
                              viewedSubSessionIds={viewedArticleSubSessionIds}
                              lessonCompleted={done}
                              locked={locked}
                              onSelectSubSession={onSelectArticleSubSession}
                            />
                          </li>
                        );
                      }

                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => {
                              if (!locked) onSelectLesson(lesson.id);
                            }}
                            aria-current={active ? "true" : undefined}
                            aria-label={`Leçon ${globalIndex} : ${lesson.title}${done ? ", terminée" : ""}${locked ? ", verrouillée" : ""}`}
                            className={cn(
                              "group flex w-full cursor-pointer items-start gap-3 rounded-[14px] border px-3 py-3 text-left text-sm transition-all duration-200",
                              active
                                ? "border-primary/30 bg-primary/10 shadow-sm"
                                : "border-transparent bg-card/40 hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-sm",
                              locked && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-none",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold tabular-nums",
                                active
                                  ? "bg-primary text-primary-foreground"
                                  : done
                                    ? "bg-success/15 text-success"
                                    : "bg-muted text-muted-foreground",
                              )}
                            >
                              {globalIndex}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start gap-2">
                                <LessonTypeIcon
                                  lesson={lesson}
                                  done={done}
                                  locked={locked}
                                  active={active}
                                />
                                <span
                                  className={cn(
                                    "leading-snug",
                                    active ? "font-semibold text-foreground" : "text-foreground/90",
                                  )}
                                >
                                  {lesson.title}
                                </span>
                              </span>
                              {lessonDuration ? (
                                <span className="mt-1.5 block pl-6 text-[11px] text-muted-foreground tabular-nums">
                                  {lessonDuration}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
