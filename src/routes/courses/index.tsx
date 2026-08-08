import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { CourseCatalogCard } from "@/components/course/CourseCatalogCard";
import { FadeIn } from "@/components/motion/FadeIn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { isFreeCourse } from "@/lib/courses";
import {
  COURSE_CATEGORIES,
  getCourseCategoryLabel,
  isCourseCategoryId,
} from "@/lib/course-categories";
import { getPublicCourses } from "@/lib/fns/courses";
import { seoHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  category: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/courses/")({
  head: () =>
    seoHead({
      title: "Cours — BelKou",
      description: "Explorez les cours BelKou : apps IA, SaaS, déploiement et monétisation.",
      path: "/courses",
    }),
  validateSearch: searchSchema,
  loader: async () => {
    const publicCourses = await getPublicCourses();
    return { courses: publicCourses };
  },
  component: CoursesIndexPage,
});

type PriceFilter = "all" | "paid" | "free";
type LayoutMode = "grid" | "row";

function CoursesIndexPage() {
  const { courses } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const categoryFilter = isCourseCategoryId(search.category ?? "") ? search.category : undefined;

  const [query, setQuery] = useState(search.q ?? "");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [layout, setLayout] = useState<LayoutMode>("grid");

  const levels = useMemo(() => {
    const set = new Set(courses.map((course) => course.skillLevel).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [courses]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (categoryFilter && !(course.categories ?? []).includes(categoryFilter)) return false;
      if (priceFilter === "free" && !isFreeCourse(course)) return false;
      if (priceFilter === "paid" && isFreeCourse(course)) return false;
      if (levelFilter !== "all" && course.skillLevel !== levelFilter) return false;
      if (!normalized) return true;
      const haystack = `${course.title} ${course.description} ${course.instructor} ${course.skillLevel}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [categoryFilter, courses, levelFilter, priceFilter, query]);

  const clearCategory = () => {
    void navigate({
      to: "/courses",
      search: (prev) => {
        const next = { ...prev };
        delete next.category;
        return next;
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" className="site-page-top">
        <section className="relative overflow-hidden border-b border-border bg-gradient-mesh">
          <div className="site-container py-12 sm:py-16">
            <FadeIn>
              <p className="text-sm font-semibold tracking-[0.18em] text-primary uppercase">Catalogue</p>
              <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {categoryFilter
                  ? getCourseCategoryLabel(categoryFilter)
                  : "Trouvez le parcours qui vous fait avancer"}
              </h1>
              <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
                Formations pratiques pour créer, déployer et monétiser vos applications avec l&apos;IA.
              </p>
            </FadeIn>

            <FadeIn delay={0.08} className="mt-8 max-w-2xl">
              <label className="relative block">
                <span className="sr-only">Rechercher un cours</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un cours, un sujet, un instructeur…"
                  className="h-12 rounded-xl border-border/80 bg-card/90 pl-10 shadow-sm backdrop-blur"
                />
              </label>
            </FadeIn>
          </div>
        </section>

        <div className="site-container py-8 sm:py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtres
              </span>
              {categoryFilter ? (
                <button
                  type="button"
                  onClick={clearCategory}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  {getCourseCategoryLabel(categoryFilter)}
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
              {(
                [
                  { id: "all", label: "Tout" },
                  { id: "paid", label: "Payant" },
                  { id: "free", label: "Gratuit" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPriceFilter(item.id)}
                  className={cn(
                    "cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
                    priceFilter === item.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
              <select
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
                className="h-8 cursor-pointer rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground"
                aria-label="Filtrer par niveau"
              >
                <option value="all">Tous les niveaux</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <select
                value={categoryFilter ?? "all"}
                onChange={(event) => {
                  const value = event.target.value;
                  void navigate({
                    to: "/courses",
                    search: (prev) => {
                      if (value === "all") {
                        const next = { ...prev };
                        delete next.category;
                        return next;
                      }
                      return { ...prev, category: value };
                    },
                  });
                }}
                className="h-8 cursor-pointer rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground"
                aria-label="Filtrer par catégorie"
              >
                <option value="all">Toutes les catégories</option>
                {COURSE_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> cours
              </p>
              <div className="inline-flex rounded-xl border border-border bg-card p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Vue grille"
                  aria-pressed={layout === "grid"}
                  className={cn("h-8 w-8", layout === "grid" && "bg-accent text-foreground")}
                  onClick={() => setLayout("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Vue liste"
                  aria-pressed={layout === "row"}
                  className={cn("h-8 w-8", layout === "row" && "bg-accent text-foreground")}
                  onClick={() => setLayout("row")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <Panel variant="dashed" className="mt-14">
              <EmptyState
                title="Aucun cours trouvé"
                description="Modifiez votre recherche ou réinitialisez les filtres."
                action={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setPriceFilter("all");
                      setLevelFilter("all");
                      clearCategory();
                    }}
                  >
                    Réinitialiser
                  </Button>
                }
              />
            </Panel>
          ) : (
            <div
              className={cn(
                "mt-8",
                layout === "grid"
                  ? "grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3"
                  : "flex flex-col gap-4",
              )}
            >
              {filtered.map((course, index) => (
                <FadeIn key={course.slug} delay={Math.min(index * 0.04, 0.24)}>
                  <CourseCatalogCard course={course} layout={layout} />
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
