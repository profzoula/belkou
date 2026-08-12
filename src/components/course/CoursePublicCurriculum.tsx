import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CourseTocCollapsibleSection,
  CourseTocItem,
  CourseTocItemShell,
  CourseTocList,
  CourseTocRow,
} from "@/components/course/CourseTocTimeline";
import { getLessonLockState } from "@/lib/course-access";
import type { PublicCourse } from "@/lib/fns/courses";

type CoursePublicCurriculumProps = {
  course: PublicCourse;
  hasPaidAccess: boolean;
};

function lessonCountLabel(count: number) {
  return count === 1 ? "1 leçon" : `${count} leçons`;
}

export function CoursePublicCurriculum({ course, hasPaidAccess }: CoursePublicCurriculumProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set());
  let globalStep = 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {course.sections.map((section, sectionIndex) => {
        const entries = section.lessons.map((lesson) => {
          const { locked } = getLessonLockState({ lesson, course, hasPaidAccess });

          return {
            key: lesson.id,
            title: lesson.title,
            locked,
            learnSearch: locked ? undefined : ({ lesson: lesson.id } as const),
          };
        });

        const entriesWithSteps = entries.map((entry) => ({
          entry,
          stepNumber: ++globalStep,
        }));

        const isOpen = openSections.has(section.id);

        return (
          <CourseTocCollapsibleSection
            key={section.id}
            title={`Partie ${sectionIndex + 1} · ${section.title}`}
            open={isOpen}
            onOpenChange={(open) => {
              setOpenSections((prev) => {
                const next = new Set(prev);
                if (open) next.add(section.id);
                else next.delete(section.id);
                return next;
              });
            }}
            completedCount={0}
            totalCount={section.lessons.length}
            summaryLabel={lessonCountLabel(section.lessons.length)}
          >
            <CourseTocList markerStyle="timeline">
              {entriesWithSteps.map(({ entry, stepNumber }, index) => {
                const state = entry.locked ? "locked" : "upcoming";
                const isLast = index === entriesWithSteps.length - 1;

                if (entry.learnSearch) {
                  return (
                    <CourseTocItemShell key={entry.key} isLast={isLast} markerStyle="timeline">
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
                          markerStyle="timeline"
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
                    isLast={isLast}
                    disabled={entry.locked}
                    markerStyle="timeline"
                  />
                );
              })}
            </CourseTocList>
          </CourseTocCollapsibleSection>
        );
      })}
    </div>
  );
}
