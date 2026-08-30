import { Link } from "@tanstack/react-router";
import {
  AppWindow,
  BookOpen,
  ChevronRight,
  LayoutGrid,
  Megaphone,
  Package,
  Store,
  Target,
  Terminal,
} from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";
import type { CourseCategory } from "@/lib/course-categories";

const categoryIcons: Record<string, typeof Package> = {
  dropshipping: Package,
  "developpement-app": AppWindow,
  "marketing-digital": Megaphone,
  "shopify-shop": Store,
  "facebook-ads": Target,
  "powershell-cmd": Terminal,
  ebook: BookOpen,
};

type PopularCoursesProps = {
  categories: CourseCategory[];
};

export function PopularCourses({ categories }: PopularCoursesProps) {
  return (
    <section className="py-6 sm:py-12 md:py-16">
      <div className="site-container">
        <FadeIn className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
            Cours populaires
          </h2>
          <Link
            to="/courses"
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary sm:text-sm"
          >
            Voir tout
            <ChevronRight className="size-3.5 sm:size-4" aria-hidden />
          </Link>
        </FadeIn>

        <div className="mt-4 grid grid-cols-4 gap-2.5 sm:mt-8 sm:gap-4 md:gap-5">
          {categories.map((category, index) => {
            const Icon = categoryIcons[category.id] ?? LayoutGrid;
            return (
              <FadeIn key={category.id} delay={Math.min(index * 0.03, 0.18)}>
                <Link
                  to="/courses"
                  search={{ category: category.id }}
                  className="group flex flex-col items-center justify-start gap-2 rounded-2xl bg-muted/70 px-1.5 py-3 text-center transition-colors active:bg-muted hover:bg-muted sm:gap-3 sm:px-3 sm:py-7"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15 sm:size-14">
                    <Icon className="size-5 sm:size-7" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="line-clamp-2 min-h-[2rem] text-[10px] font-semibold leading-tight text-foreground sm:min-h-0 sm:max-w-[9.5rem] sm:text-sm">
                    {category.label}
                  </span>
                </Link>
              </FadeIn>
            );
          })}
          <FadeIn delay={0.21}>
            <Link
              to="/courses"
              className="group flex flex-col items-center justify-start gap-2 rounded-2xl bg-muted/70 px-1.5 py-3 text-center transition-colors active:bg-muted hover:bg-muted sm:gap-3 sm:px-3 sm:py-7"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15 sm:size-14">
                <LayoutGrid className="size-5 sm:size-7" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="line-clamp-2 min-h-[2rem] text-[10px] font-semibold leading-tight text-foreground sm:min-h-0 sm:max-w-[9.5rem] sm:text-sm">
                Plus de cours
              </span>
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
