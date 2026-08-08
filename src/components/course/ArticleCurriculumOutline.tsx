import { CheckCircle2, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildArticleSubSessionId, type ArticleSession } from "@/lib/lesson-sessions";
import type { CourseLesson } from "@/lib/courses";

type ArticleCurriculumOutlineProps = {
  lesson: CourseLesson;
  sessions: ArticleSession[];
  activeSubSessionId: string | null;
  viewedSubSessionIds: Set<string>;
  lessonCompleted?: boolean;
  locked: boolean;
  onSelectSubSession: (lessonId: string, subSessionId: string) => void;
};

export function ArticleCurriculumOutline({
  lesson,
  sessions,
  activeSubSessionId,
  viewedSubSessionIds,
  lessonCompleted = false,
  locked,
  onSelectSubSession,
}: ArticleCurriculumOutlineProps) {
  return (
    <div className="space-y-1">
      {sessions.map((session) => {
        const visibleSubCount = session.subSessions.filter((sub) => !sub.isQuiz).length;
        const viewedInSession = lessonCompleted
          ? visibleSubCount
          : session.subSessions.filter(
              (sub) =>
                !sub.isQuiz &&
                viewedSubSessionIds.has(
                  buildArticleSubSessionId(lesson.id, session.number, sub.number),
                ),
            ).length;

        return (
          <div key={session.number} className="overflow-hidden rounded-lg border border-border/80">
            <div className="flex items-center justify-between gap-2 bg-success/10 px-3 py-2.5 dark:bg-success/10">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-success">
                  Session {session.number}
                </p>
                <p className="truncate text-xs font-bold leading-snug text-foreground">
                  {session.title}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-medium tabular-nums text-success">
                {viewedInSession}/{visibleSubCount}
              </span>
            </div>

            <ul className="py-1">
              {session.subSessions
                .filter((sub) => !sub.isQuiz)
                .map((sub, index, visibleSubs) => {
                  const subId = buildArticleSubSessionId(lesson.id, session.number, sub.number);
                  const active = activeSubSessionId === subId;
                  const viewed = lessonCompleted || viewedSubSessionIds.has(subId);
                  const last = index === visibleSubs.length - 1;

                  return (
                    <li key={subId} className="relative pl-7">
                      {!last ? (
                        <span
                          aria-hidden
                          className="absolute left-[13px] top-7 bottom-0 w-px border-l border-dashed border-success/40"
                        />
                      ) : null}
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => onSelectSubSession(lesson.id, subId)}
                        className={cn(
                          "flex w-full items-start gap-2 px-3 py-2 text-left text-xs transition-colors",
                          active
                            ? "bg-success/10 font-medium text-foreground dark:bg-success/10"
                            : "hover:bg-muted/50",
                          locked && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <span className="absolute left-2 top-2.5">
                          {locked ? (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                          ) : viewed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-success/70" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">
                          <span className="tabular-nums text-success">{sub.number}</span>{" "}
                          {sub.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
