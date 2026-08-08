import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArticleSubSessionBody } from "@/components/course/ArticleSubSessionBody";
import type { ArticleSession } from "@/lib/lesson-sessions";

type LessonArticleSessionsProps = {
  sessions: ArticleSession[];
};

export function LessonArticleSessions({ sessions }: LessonArticleSessionsProps) {
  const [openId, setOpenId] = useState<string | null>(
    sessions[0]?.subSessions[0] ? `${sessions[0].number}-${sessions[0].subSessions[0].number}` : null,
  );
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const toggleSub = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
    setReadIds((current) => new Set(current).add(id));
  };

  return (
    <div className="space-y-6">
      {sessions.map((session) => (
        <section key={session.number} className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between gap-3 bg-success/10 px-4 py-3 dark:bg-success/10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-success/40 bg-white text-xs font-bold text-success dark:bg-success/10">
                {session.number}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-success">
                  Session {session.number}
                </p>
                <p className="truncate text-sm font-bold text-foreground">{session.title}</p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-medium text-success">
              {session.subSessions.length} module{session.subSessions.length > 1 ? "s" : ""}
            </span>
          </div>

          {session.introHtml ? (
            <div
              className="lesson-html border-b border-border px-4 py-4 text-sm leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: session.introHtml }}
            />
          ) : null}

          <div className="px-2 py-3 sm:px-4">
            <ul className="space-y-0">
              {session.subSessions.map((sub, index) => {
                const id = `${session.number}-${sub.number}`;
                const open = openId === id;
                const done = readIds.has(id);
                const last = index === session.subSessions.length - 1;

                return (
                  <li key={id} className="relative pl-8">
                    {!last ? (
                      <span
                        aria-hidden
                        className="absolute left-[15px] top-8 bottom-0 w-px border-l border-dashed border-success/40"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleSub(id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors",
                        open ? "bg-success/10 dark:bg-success/10" : "hover:bg-muted/50",
                      )}
                    >
                      <span className="absolute left-1 top-3">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 text-success/70" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">
                          <span className="tabular-nums text-success">{sub.number}</span>{" "}
                          {sub.title}
                        </span>
                      </span>
                    </button>
                    {open ? (
                      <div className="mb-2 ml-2 border-l-2 border-success/30 pl-5 pr-2 pb-3 dark:border-success/40">
                        <ArticleSubSessionBody sub={sub} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}
