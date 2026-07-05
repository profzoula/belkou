import { CheckCircle2, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildArticleSubSessionId,
  type ArticleSession,
} from "@/lib/lesson-sessions";
import type { CourseLesson } from "@/lib/courses";

type ArticleCurriculumOutlineProps = {
  lesson: CourseLesson;
  sessions: ArticleSession[];
  activeSubSessionId: string | null;
  viewedSubSessionIds: Set<string>;
  locked: boolean;
  onSelectSubSession: (lessonId: string, subSessionId: string) => void;
};

export function ArticleCurriculumOutline({
  lesson,
  sessions,
  activeSubSessionId,
  viewedSubSessionIds,
  locked,
  onSelectSubSession,
}: ArticleCurriculumOutlineProps) {
  return (
    <div className="space-y-1">
      {sessions.map((session) => {
        const viewedInSession = session.subSessions.filter(
          (sub) =>
            !sub.isQuiz &&
            viewedSubSessionIds.has(buildArticleSubSessionId(lesson.id, session.number, sub.number)),
        ).length;
        const visibleSubCount = session.subSessions.filter((sub) => !sub.isQuiz).length;

        return (
          <div key={session.number} className="overflow-hidden rounded-lg border border-border/80">
            <div className="flex items-center justify-between gap-2 bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/30">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  Session {session.number}
                </p>
                <p className="truncate text-xs font-bold leading-snug text-foreground">{session.title}</p>
              </div>
              <span className="shrink-0 text-[10px] font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                {viewedInSession}/{visibleSubCount}
              </span>
            </div>

            <ul className="py-1">
              {session.subSessions
                .filter((sub) => !sub.isQuiz)
                .map((sub, index, visibleSubs) => {
                const subId = buildArticleSubSessionId(lesson.id, session.number, sub.number);
                const active = activeSubSessionId === subId;
                const viewed = viewedSubSessionIds.has(subId);
                const last = index === visibleSubs.length - 1;

                return (
                  <li key={subId} className="relative pl-7">
                    {!last ? (
                      <span
                        aria-hidden
                        className="absolute left-[13px] top-7 bottom-0 w-px border-l border-dashed border-emerald-300/80"
                      />
                    ) : null}
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => onSelectSubSession(lesson.id, subId)}
                      className={cn(
                        "flex w-full items-start gap-2 px-3 py-2 text-left text-xs transition-colors",
                        active
                          ? "bg-emerald-50 font-medium text-foreground dark:bg-emerald-950/25"
                          : "hover:bg-muted/50",
                        locked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <span className="absolute left-2 top-2.5">
                        {locked ? (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                        ) : viewed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-emerald-500/70" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">
                        <span className="tabular-nums text-emerald-700 dark:text-emerald-400">{sub.number}</span>{" "}
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
