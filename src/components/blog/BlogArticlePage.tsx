import { Link } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { BlogBlockContent } from "@/components/blog/BlogBlockContent";
import { BlogCard } from "@/components/blog/BlogCard";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { formatBlogDate, type BlogPost } from "@/lib/blog";
import { cn } from "@/lib/utils";

type BlogArticlePageProps = {
  post: BlogPost & { htmlBody?: string; coverImageUrl?: string };
  related?: BlogPost[];
};

export function BlogArticlePage({ post, related = [] }: BlogArticlePageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" className="site-page-top">
        <article>
          <header className="border-b border-border bg-elevated">
            <div className="site-container py-8 sm:py-10">
              <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 rounded-lg">
                <Link to="/blog">
                  <ArrowLeft className="size-4" aria-hidden />
                  Retour au blog
                </Link>
              </Button>

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {post.category}
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-[2.75rem]">
                {post.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {post.excerpt}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="grid size-9 place-items-center rounded-full bg-card text-xs font-semibold text-primary">
                  {post.author.initials}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{post.author.name}</p>
                  <p className="text-xs">{post.author.role}</p>
                </div>
                <span className="hidden sm:inline" aria-hidden>
                  ·
                </span>
                <span>{formatBlogDate(post.publishedAt)}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden />
                  {post.readMinutes} min de lecture
                </span>
              </div>
            </div>
          </header>

          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt={post.coverLabel || post.title}
              className="mx-auto aspect-[21/9] max-h-[360px] w-full max-w-5xl object-cover sm:rounded-b-2xl"
            />
          ) : (
            <div
              className={cn(
                "mx-auto aspect-[21/9] max-h-[360px] w-full max-w-5xl bg-gradient-to-br sm:rounded-b-2xl",
                post.coverGradient,
              )}
              aria-hidden
            />
          )}

          <div className="site-container py-10 sm:py-12">
            {post.htmlBody ? (
              <BlogBlockContent html={post.htmlBody} />
            ) : (
              <div className="mx-auto max-w-2xl space-y-5 text-base leading-relaxed text-foreground/90">
                {post.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        </article>

        {related.length > 0 ? (
          <section className="border-t border-border bg-elevated/50">
            <div className="site-container py-10 sm:py-12">
              <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
                À lire aussi
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <BlogCard key={item.slug} post={item} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
