import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { formatBlogDate, type BlogPost } from "@/lib/blog";
import { cn } from "@/lib/utils";

type BlogCardProps = {
  post: BlogPost;
  variant?: "default" | "compact" | "horizontal" | "side";
  className?: string;
};

const CATEGORY_PILL: Record<string, string> = {
  Windows: "bg-[#0056D2]",
  Technologie: "bg-[#0056D2]",
  IA: "bg-emerald-600",
  Formation: "bg-sky-600",
  Programmation: "bg-violet-600",
  Live: "bg-rose-600",
  Tutoriels: "bg-amber-600",
  Actualités: "bg-teal-600",
  Cyberdéfense: "bg-violet-700",
  Sécurité: "bg-violet-700",
};

function categoryPillClass(category: string) {
  return CATEGORY_PILL[category] ?? "bg-[#0056D2]";
}

function CoverMedia({
  post,
  className,
}: {
  post: BlogPost;
  className?: string;
}) {
  if (post.coverImageUrl) {
    return (
      <img
        src={post.coverImageUrl}
        alt={post.coverAlt || post.coverLabel || post.title}
        className={cn("absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]", className)}
      />
    );
  }
  return (
    <div
      className={cn("absolute inset-0 bg-gradient-to-br", post.coverGradient, className)}
      aria-hidden
    />
  );
}

function AuthorMeta({
  post,
  className,
}: {
  post: BlogPost;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2 text-xs text-white/80", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-black/35 text-[10px] font-bold tracking-wide text-white ring-1 ring-white/25">
        {post.author.initials}
      </span>
      <p className="min-w-0 truncate">
        <span className="font-semibold text-white">Par {post.author.name}</span>
        <span className="mx-1.5 opacity-60">•</span>
        {formatBlogDate(post.publishedAt)}
        <span className="mx-1.5 opacity-60">•</span>
        {post.readMinutes} min
      </p>
    </div>
  );
}

/** Carte éditoriale plein cadre (comme TechNews) — image + texte blanc par-dessus */
function OverlayCard({
  post,
  className,
  featured = false,
}: {
  post: BlogPost;
  className?: string;
  featured?: boolean;
}) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={cn(
        "group relative flex overflow-hidden rounded-[22px] shadow-[0_12px_40px_rgb(0_0_0_/_0.18)]",
        featured ? "min-h-[340px] sm:min-h-[440px]" : "min-h-[200px] sm:min-h-[210px]",
        className,
      )}
    >
      <CoverMedia post={post} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
      <div
        className={cn(
          "relative z-[1] flex w-full flex-col justify-end",
          featured ? "p-6 sm:p-8 lg:p-9" : "p-5",
        )}
      >
        <span
          className={cn(
            "mb-3 inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase",
            categoryPillClass(post.category),
          )}
        >
          {post.category}
        </span>
        <h2
          className={cn(
            "font-semibold leading-tight tracking-tight text-white",
            featured
              ? "max-w-2xl text-2xl sm:text-3xl md:text-[2.1rem]"
              : "line-clamp-3 text-lg sm:text-xl",
          )}
        >
          {post.title}
        </h2>
        {featured ? (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
            {post.excerpt}
          </p>
        ) : null}
        <div
          className={cn(
            "mt-5 flex flex-wrap items-center gap-3",
            featured && "justify-between",
          )}
        >
          <AuthorMeta post={post} />
          {featured ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#0056D2] px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-[#0046b0]">
              Lire l&apos;article
              <ArrowRight className="size-4" aria-hidden />
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function BlogCard({ post, variant = "default", className }: BlogCardProps) {
  if (variant === "side") {
    return <OverlayCard post={post} className={cn("h-full", className)} />;
  }

  if (variant === "compact") {
    return (
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className={cn(
          "group flex gap-3 rounded-2xl border border-border bg-card p-3 transition-[border-color] hover:border-primary/40",
          className,
        )}
      >
        <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl">
          <CoverMedia post={post} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold text-primary">{post.category}</span>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
            {post.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatBlogDate(post.publishedAt)} · {post.readMinutes} min
          </p>
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className={cn(
          "group grid overflow-hidden rounded-[22px] border border-border bg-card transition-[border-color] hover:border-primary/40 sm:grid-cols-[240px_1fr]",
          className,
        )}
      >
        <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[160px]">
          <CoverMedia post={post} />
        </div>
        <div className="flex flex-col justify-center gap-2 p-5">
          <span
            className={cn(
              "inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase",
              categoryPillClass(post.category),
            )}
          >
            {post.category}
          </span>
          <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
            {post.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
          <p className="text-xs text-muted-foreground">
            Par {post.author.name} · {formatBlogDate(post.publishedAt)} · {post.readMinutes} min
          </p>
        </div>
      </Link>
    );
  }

  // Grille « Top stories » — carte blanche: image / titre / extrait / auteur / date
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[20px] border border-border/80 bg-card shadow-[0_8px_28px_rgb(15_23_42_/_0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgb(15_23_42_/_0.1)]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <CoverMedia post={post} />
        <span
          className={cn(
            "absolute left-3 top-3 z-[1] inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase shadow-sm",
            categoryPillClass(post.category),
          )}
        >
          {post.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
        <h3 className="line-clamp-2 text-[1.05rem] font-semibold leading-snug text-foreground group-hover:text-primary">
          {post.title}
        </h3>
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-1 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-elevated text-[10px] font-bold text-primary">
            {post.author.initials}
          </span>
          <span className="text-sm font-semibold text-foreground">{post.author.name}</span>
        </div>
        <div className="border-t border-border pt-3 text-xs text-muted-foreground">
          {formatBlogDate(post.publishedAt)}
          <span className="mx-1.5 opacity-50">•</span>
          {post.readMinutes} min
        </div>
      </div>
    </Link>
  );
}

export function BlogFeaturedHero({ post }: { post: BlogPost }) {
  return <OverlayCard post={post} featured className="h-full" />;
}
