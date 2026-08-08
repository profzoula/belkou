import { Link } from "@tanstack/react-router";
import {
  CourseTocItem,
  CourseTocItemShell,
  CourseTocList,
  CourseTocPartHeader,
  CourseTocRow,
} from "@/components/course/CourseTocTimeline";
import { getLessonLockState } from "@/lib/course-access";
import type { PublicCourse } from "@/lib/fns/courses";
import { flattenArticleSubSessions, parseArticleSessions } from "@/lib/lesson-sessions";

type CoursePublicCurriculumProps = {
  course: PublicCourse;
  hasPaidAccess: boolean;
};

export function CoursePublicCurriculum({ course, hasPaidAccess }: CoursePublicCurriculumProps) {
  let globalStep = 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {course.sections.map((section, sectionIndex) => {
        const entries = section.lessons.flatMap((lesson) => {
          const { locked } = getLessonLockState({ lesson, course, hasPaidAccess });
          const sessions =
            lesson.type === "article" && lesson.content ? parseArticleSessions(lesson.content) : null;

          if (sessions?.length) {
            return flattenArticleSubSessions(lesson.id, sessions).map(({ id, sub }) => ({
              key: id,
              title: sub.title,
              isQuiz: Boolean(sub.isQuiz),
              locked,
              learnSearch: locked ? undefined : ({ lesson: lesson.id } as const),
            }));
          }

          return [
            {
              key: lesson.id,
              title: lesson.title,
              isQuiz: false,
              locked,
              learnSearch: locked ? undefined : ({ lesson: lesson.id } as const),
            },
          ];
        });

        const entriesWithSteps = entries.map((entry) => ({
          entry,
          stepNumber: entry.isQuiz ? null : ++globalStep,
        }));

        return (
          <section key={section.id} className="border-b border-border/60 last:border-b-0">
            <CourseTocPartHeader partNumber={sectionIndex + 1} title={section.title} />
            <CourseTocList>
              {entriesWithSteps.map(({ entry, stepNumber }, index) => {
                const state = entry.locked ? "locked" : entry.isQuiz ? "quiz" : "upcoming";
                const isLast = index === entriesWithSteps.length - 1;

                if (entry.learnSearch) {
                  return (
                    <CourseTocItemShell key={entry.key} isLast={isLast}>
                      <Link
                        to="/courses/$slug/learn"
                        params={{ slug: course.slug }}
                        search={entry.learnSearch}
                        className="block transition-colors hover:bg-muted/45"
                      >
                        <CourseTocRow
                          title={entry.title}
                          stepNumber={stepNumber}
                          state={state}
                          isQuiz={entry.isQuiz}
                        />
                      </Link>
                    </CourseTocItemShell>
                  );
                }

                return (
                  <CourseTocItem
                    key={entry.key}
                    title={entry.title}
                    stepNumber={stepNumber}
                    state={state}
                    isQuiz={entry.isQuiz}
                    isLast={isLast}
                    disabled={entry.locked}
                  />
                );
              })}
            </CourseTocList>
          </section>
        );
      })}
    </div>
  );
}
