import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { BlogCard, BlogFeaturedHero } from "@/components/blog/BlogCard";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBlogDate, type BlogPost } from "@/lib/blog";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

function SectionHeading({
  eyebrow,
  title,
  href = "/blog",
}: {
  eyebrow: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
      </div>
      <Link
        to={href}
        className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
      >
        Voir tout
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

type BlogIndexPageProps = {
  posts: BlogPost[];
};

export function BlogIndexPage({ posts }: BlogIndexPageProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => {
    const preferred = ["Windows", "Linux", "IA", "Programmation", "Formation", "Live"];
    const present = Array.from(new Set(posts.map((post) => post.category)));
    return [
      ...preferred.filter((c) => present.includes(c)),
      ...present.filter((c) => !preferred.includes(c)).sort((a, b) => a.localeCompare(b, "fr")),
    ];
  }, [posts]);

  const filtered = useMemo(() => {
    const query = searchQuery
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = activeCategory === "all" || post.category === activeCategory;
      const searchable = [post.title, post.excerpt, post.category, ...(post.tags ?? [])]
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    });
  }, [posts, activeCategory, searchQuery]);

  const featured = filtered.find((post) => post.featured) ?? filtered[0];
  const side = filtered.filter((post) => post.slug !== featured?.slug).slice(0, 2);
  const picks = filtered.filter((post) => post.slug !== featured?.slug).slice(0, 8);
  const latest = [...filtered]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 4);
  const trendingList = filtered.filter((post) => post.trending);
  const trending = (trendingList.length ? trendingList : filtered).slice(0, 4);

  if (!posts.length) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="site-container site-page-top py-16 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Blog BelKou</h1>
          <p className="mt-3 text-muted-foreground">Aucun article publié pour le moment.</p>
          <Button asChild className="mt-6 rounded-lg">
            <Link to="/courses">Voir les cours</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" className="site-page-top">
        <h1 className="sr-only">Blog BelKou</h1>
        <section className="border-b border-border bg-elevated">
          <div className="site-container py-10 sm:py-14">
            <p className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-[1.1]">
              Faites travailler la technologie pour vous.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Guides pratiques Windows, Linux, IA, formation et live — avec BelKou.
            </p>
          </div>
          <div className="site-container border-t border-border py-4">
            <div className="relative mb-4 max-w-xl">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher un article, un outil ou un sujet…"
                className="h-10 rounded-xl pl-9 pr-10"
                aria-label="Rechercher dans le blog"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Effacer la recherche"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            <nav className="flex flex-wrap gap-2" aria-label="Filtrer par catégorie">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  activeCategory === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                Tous
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    activeCategory === category
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>
        </section>

        {!featured ? (
          <div className="site-container py-16 text-center text-sm text-muted-foreground">
            Aucun article dans cette catégorie.
          </div>
        ) : (
          <>
            <section className="site-container py-8 sm:py-10">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-stretch lg:gap-5">
                <BlogFeaturedHero post={featured} />
                <div className="grid h-full grid-rows-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
                  {side.map((post) => (
                    <BlogCard
                      key={post.slug}
                      post={post}
                      variant="side"
                      className="h-full min-h-[200px]"
                    />
                  ))}
                </div>
              </div>
            </section>

            <section id="top-stories" className="border-y border-border bg-elevated/60">
              <div className="site-container py-10 sm:py-12">
                <SectionHeading eyebrow="Sélection" title="Top articles de la semaine" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {picks.map((post) => (
                    <BlogCard key={post.slug} post={post} />
                  ))}
                </div>
              </div>
            </section>

            <section className="site-container py-10 sm:py-12">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
                <div>
                  <SectionHeading eyebrow="Derniers" title="Derniers articles" />
                  <div className="space-y-4">
                    {latest.map((post) => (
                      <BlogCard key={post.slug} post={post} variant="horizontal" />
                    ))}
                  </div>
                </div>

                <aside className="space-y-8">
                  <div>
                    <SectionHeading eyebrow="Tendances" title="Les plus lus" />
                    <ol className="space-y-4">
                      {trending.map((post, index) => (
                        <li key={post.slug}>
                          <Link
                            to="/blog/$slug"
                            params={{ slug: post.slug }}
                            className="group flex gap-3"
                          >
                            <span className="w-8 shrink-0 font-display text-2xl font-semibold tabular-nums text-primary/35">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-primary">
                                {post.category}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                                {post.title}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatBlogDate(post.publishedAt)} · {post.readMinutes} min
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </div>
                </aside>
              </div>
            </section>
          </>
        )}

        <section className="border-t border-border bg-foreground text-background">
          <div className="site-container flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-14">
            <div className="max-w-lg">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Restez à jour avec BelKou
              </h2>
              <p className="mt-2 text-sm text-background/75 sm:text-base">
                Nouveaux articles, lives et conseils de formation — directement dans votre boîte
                mail.
              </p>
            </div>
            <form
              className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                window.location.href = `mailto:${siteConfig.contactEmail}?subject=Newsletter%20BelKou`;
              }}
            >
              <Input
                type="email"
                required
                placeholder="Votre email"
                className="border-white/20 bg-white text-foreground"
                aria-label="Email pour la newsletter"
              />
              <Button type="submit" className="rounded-lg font-semibold sm:shrink-0">
                S&apos;abonner
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
