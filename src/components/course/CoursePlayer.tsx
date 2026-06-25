import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock,
  FileText,
  Globe,
  Lock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  countLessons,
  formatCount,
  getAllLessons,
  getLessonVimeo,
  getSectionForLesson,
  type CourseLesson,
} from "@/lib/courses";
import { getCourseIcon } from "@/lib/course-icons";
import {
  courseStartsAtLabel,
  isCourseContentLive,
  isScheduledInFuture,
} from "@/lib/course-publish";
import type { PublicCourse } from "@/lib/fns/courses";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { VimeoPlayer } from "@/components/course/VimeoPlayer";

type CoursePlayerProps = {
  course: PublicCourse;
  initialLessonId?: string;
};

function CourseVideoArea({ course, lesson }: { course: PublicCourse; lesson: CourseLesson }) {
  const Icon = getCourseIcon(course.slug);
  const contentLive = isCourseContentLive(course);
  const lockedBySchedule = !lesson.preview && !contentLive;
  const lockedByEnrollment = !lesson.preview && contentLive;
  const locked = lockedBySchedule || lockedByEnrollment;
  const vimeo = getLessonVimeo(lesson);
  const startLabel = courseStartsAtLabel(course);

  if (lesson.type !== "video") {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-muted/40 px-6 text-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <p className="font-semibold">{lesson.title}</p>
        <p className="text-sm text-muted-foreground">
          {lockedBySchedule && startLabel
            ? `Contenu disponible le ${startLabel}`
            : lesson.type === "article"
              ? "Contenu texte — disponible après inscription."
              : "Ressources téléchargeables — disponible après inscription."}
        </p>
        {lockedBySchedule && startLabel ? (
          <Button asChild size="sm">
            <Link to="/checkout" search={course.plan ? { plan: course.plan, course: course.slug } : { course: course.slug }}>
              S&apos;inscrire maintenant
            </Link>
          </Button>
        ) : locked ? (
          <Button asChild size="sm">
            <Link to="/checkout" search={course.plan ? { plan: course.plan, course: course.slug } : { course: course.slug }}>
              S&apos;inscrire
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  if (!locked && vimeo) {
    return <VimeoPlayer video={vimeo} title={lesson.title} lessonKey={lesson.id} />;
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br",
          course.thumbnail.gradient,
          locked && "opacity-60",
        )}
      >
        <Icon className="mb-4 h-16 w-16 text-white/20" aria-hidden />
        <p className="max-w-md px-6 text-center text-lg font-bold text-white">{lesson.title}</p>
        {lockedBySchedule && startLabel ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
            <Lock className="h-4 w-4" />
            Vidéos disponibles le {startLabel}
          </p>
        ) : locked ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
            <Lock className="h-4 w-4" />
            Contenu réservé aux inscrits
          </p>
        ) : (
          <p className="mt-2 text-sm text-white/80">Ajoutez l&apos;ID Vimeo dans courses.ts ou VITE_VIMEO_PREVIEW_ID</p>
        )}
      </div>

      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 px-4">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/checkout" search={course.plan ? { plan: course.plan, course: course.slug } : { course: course.slug }}>
              {lockedBySchedule
                ? `S'inscrire — accès le ${startLabel ?? "bientôt"}`
                : "S'inscrire pour débloquer"}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function CurriculumSidebar({
  course,
  activeLessonId,
  onSelectLesson,
}: {
  course: PublicCourse;
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
}) {
  const defaultSections = course.sections.map((section) => section.id);

  return (
    <div className="flex h-full flex-col border-t border-border bg-card lg:border-t-0 lg:border-l">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold">Contenu du cours</h2>
        <p className="text-xs text-muted-foreground">
          {course.sections.length} sections · {countLessons(course)} leçons · {course.totalDuration}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={defaultSections} className="px-1">
          {course.sections.map((section) => {
            const completed = section.lessons.filter((l) => l.preview).length;
            const sectionDuration = section.lessons.reduce((sum, l) => sum + parseInt(l.duration, 10), 0);

            return (
              <AccordionItem key={section.id} value={section.id} className="border-border">
                <AccordionTrigger className="px-3 py-3 hover:no-underline [&>svg]:hidden">
                  <div className="flex w-full items-start gap-2 text-left">
                    <span className="mt-0.5 text-muted-foreground">▾</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-snug">{section.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {completed}/{section.lessons.length} · {sectionDuration}min
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <ul>
                    {section.lessons.map((lesson, index) => {
                      const active = lesson.id === activeLessonId;
                      const done = Boolean(lesson.preview) && index === 0;

                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            onClick={() => onSelectLesson(lesson.id)}
                            className={cn(
                              "flex w-full items-start gap-2 border-l-2 px-3 py-2.5 text-left text-sm transition-colors",
                              active
                                ? "border-primary bg-primary/10 font-medium text-foreground"
                                : "border-transparent hover:bg-muted/60",
                            )}
                          >
                            {done ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                            )}
                            <span className="min-w-0 flex-1 leading-snug">
                              {index + 1}. {lesson.title}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                              {lesson.duration}
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

export function CoursePlayer({ course, initialLessonId }: CoursePlayerProps) {
  const allLessons = useMemo(() => getAllLessons(course), [course]);
  const defaultLesson = allLessons.find((l) => l.id === initialLessonId) ?? allLessons[0];
  const [activeLessonId, setActiveLessonId] = useState(defaultLesson.id);
  const scheduledSoon = isScheduledInFuture(course);
  const startLabel = courseStartsAtLabel(course);

  const activeLesson = getAllLessons(course).find((l) => l.id === activeLessonId) ?? defaultLesson;
  const activeSection = getSectionForLesson(course, activeLesson.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
          <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1 px-2">
            <Link to="/courses/$slug" params={{ slug: course.slug }}>
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Cours</span>
            </Link>
          </Button>
          <img src={siteConfig.logo} alt="" className="hidden h-7 w-7 rounded-md sm:block" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{course.title}</p>
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <Link to="/courses">Tous les cours</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/checkout" search={course.plan ? { plan: course.plan, course: course.slug } : { course: course.slug }}>
              S&apos;inscrire · ${course.price}
            </Link>
          </Button>
        </div>
      </header>

      {scheduledSoon && startLabel && (
        <div className="border-b border-sky-200 bg-sky-50 px-4 py-2.5 text-center text-sm text-sky-900">
          Inscriptions ouvertes — les vidéos seront disponibles le <strong>{startLabel}</strong>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <main className="min-w-0">
          <CourseVideoArea course={course} lesson={activeLesson} />

          <div className="border-b border-border px-3 sm:px-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-0 bg-transparent p-0">
                {[
                  { value: "overview", label: "Aperçu" },
                  { value: "qa", label: "Q&R" },
                  { value: "notes", label: "Notes" },
                  { value: "announcements", label: "Annonces" },
                  { value: "reviews", label: "Avis" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent px-3 py-3 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-0 px-1 pb-8 pt-6 sm:px-0">
                <h1 className="font-display text-xl font-bold leading-snug sm:text-2xl md:text-3xl">
                  {course.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    {course.rating.toFixed(1)}
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="font-normal text-primary underline">
                      ({formatCount(course.ratingsCount)} avis)
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {formatCount(course.studentsCount)} étudiants
                  </span>
                  <span className="text-muted-foreground">{course.totalDuration}</span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Dernière mise à jour {course.lastUpdated} · {course.language}
                  {course.captions ? " · Sous-titres" : ""}
                </p>

                <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 sm:p-5">
                  <div className="flex gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-semibold">Planifiez votre apprentissage</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Fixez un rappel pour avancer régulièrement — cohorte BelKou :{" "}
                        {siteConfig.cohortStartDate}.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="rounded-full" asChild>
                          <Link to="/checkout" search={course.plan ? { plan: course.plan, course: course.slug } : { course: course.slug }}>
                            Commencer
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-8 md:grid-cols-2">
                  <div>
                    <h2 className="mb-3 text-lg font-bold">Ce que vous apprendrez</h2>
                    <ul className="grid gap-2 sm:grid-cols-1">
                      {course.whatYouLearn.map((item) => (
                        <li key={item} className="flex gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h2 className="mb-3 text-lg font-bold">En chiffres</h2>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Niveau</dt>
                        <dd className="font-medium">{course.skillLevel}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Étudiants</dt>
                        <dd className="font-medium">{formatCount(course.studentsCount)}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Langues</dt>
                        <dd className="font-medium">{course.language}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Sous-titres</dt>
                        <dd className="font-medium">{course.captions ? "Oui" : "Non"}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Leçons</dt>
                        <dd className="font-medium">{countLessons(course)}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2">
                        <dt className="text-muted-foreground">Vidéo</dt>
                        <dd className="font-medium">{course.totalDuration}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="mb-3 text-lg font-bold">Description</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
                  {activeSection && (
                    <p className="mt-4 text-sm">
                      <span className="font-medium">Leçon actuelle :</span>{" "}
                      {activeSection.title} — {activeLesson.title}
                    </p>
                  )}
                </div>
              </TabsContent>

              {["qa", "notes", "announcements", "reviews"].map((tab) => (
                <TabsContent key={tab} value={tab} className="px-1 py-12 text-center sm:px-0">
                  <Globe className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Disponible après inscription à la formation BelKou.
                  </p>
                  <Button asChild className="mt-4" size="sm">
                    <Link to="/checkout" search={course.plan ? { plan: course.plan, course: course.slug } : { course: course.slug }}>
                      S&apos;inscrire maintenant
                    </Link>
                  </Button>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>

        <aside className="lg:sticky lg:top-14 lg:max-h-[calc(100dvh-3.5rem)] lg:overflow-hidden">
          <CurriculumSidebar
            course={course}
            activeLessonId={activeLessonId}
            onSelectLesson={(lessonId) => {
              setActiveLessonId(lessonId);
            }}
          />
        </aside>
      </div>
    </div>
  );
}
