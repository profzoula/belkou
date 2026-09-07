import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Clock, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { BlogBlockContent } from "@/components/blog/BlogBlockContent";
import { BlogCard } from "@/components/blog/BlogCard";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { formatBlogDate, type BlogPost } from "@/lib/blog";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type ArticlePost = BlogPost & {
  htmlBody?: string;
  coverImageUrl?: string;
  coverAlt?: string;
};

type BlogArticlePageProps = {
  post: ArticlePost;
  related?: BlogPost[];
  popular?: BlogPost[];
};

function CoverBlock({ post }: { post: ArticlePost }) {
  if (post.coverImageUrl) {
    return (
      <img
        src={post.coverImageUrl}
        alt={post.coverAlt || post.coverLabel || post.title}
        className="aspect-video w-full rounded-xl object-cover"
      />
    );
  }
  return (
    <div
      className={cn(
        "aspect-video w-full rounded-xl bg-gradient-to-br",
        post.coverGradient,
      )}
      role="img"
      aria-label={post.coverAlt || post.coverLabel || post.title}
    />
  );
}

function PopularThumb({ post }: { post: BlogPost }) {
  if (post.coverImageUrl) {
    return <img src={post.coverImageUrl} alt="" className="size-full object-cover" />;
  }
  return <div className={cn("size-full bg-gradient-to-br", post.coverGradient)} aria-hidden />;
}

/** Carte Facebook native BelKou — évite le plugin iframe qui clippe. */
function FacebookSidebar() {
  const facebookUrl = siteConfig.founder.facebookUrl;
  if (!facebookUrl) return null;
  const name = "Prof Zoula";
  const avatar = siteConfig.founder.avatarUrl;

  return (
    <aside className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <img
          src={avatar}
          alt=""
          className="size-12 shrink-0 rounded-full object-cover ring-2 ring-[#1877F2]/30"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#1877F2]">{name}</p>
          <p className="text-xs text-muted-foreground">Page Facebook BelKou</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-muted/40 p-3">
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-elevated"
        >
          <svg viewBox="0 0 24 24" className="size-4 fill-[#1877F2]" aria-hidden>
            <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07" />
          </svg>
          Suivre la page
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
          aria-label="Ouvrir sur Facebook"
        >
          <Share2 className="size-4" aria-hidden />
        </a>
      </div>
    </aside>
  );
}

export function BlogArticlePage({
  post,
  related = [],
  popular = [],
}: BlogArticlePageProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
  const share = async () => {
    const data = { title: post.title, text: post.excerpt, url: shareUrl };
    if (canNativeShare) {
      await navigator.share(data);
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" className="site-page-top">
        <div className="site-container py-6 sm:py-8 lg:py-10">
          <Button asChild variant="ghost" size="sm" className="mb-5 -ml-2 rounded-lg">
            <Link to="/blog">
              <ArrowLeft className="size-4" aria-hidden />
              Retour au blog
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start lg:gap-10">
            <div className="min-w-0 space-y-8">
              <article>
                <CoverBlock post={post} />

                <header className="border-b border-border py-6 sm:py-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    {post.category}
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                    {post.title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {post.excerpt}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="grid size-9 place-items-center rounded-full bg-elevated text-xs font-semibold text-primary">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-auto rounded-lg"
                      onClick={() => void share()}
                    >
                      {copied ? (
                        <Check className="size-3.5" />
                      ) : canNativeShare ? (
                        <Share2 className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      {copied ? "Lien copié" : "Partager"}
                    </Button>
                  </div>

                  {post.tags?.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {post.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </header>

                <div className="py-8 sm:py-10">
                  {post.htmlBody ? (
                    <BlogBlockContent html={post.htmlBody} className="mx-0 max-w-none" />
                  ) : (
                    <div className="space-y-5 text-base leading-relaxed text-foreground/90">
                      {post.body.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              </article>

              {related.length > 0 ? (
                <section aria-labelledby="related-heading">
                  <h2
                    id="related-heading"
                    className="mb-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                  >
                    À lire aussi
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((item) => (
                      <BlogCard key={item.slug} post={item} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="space-y-8 lg:sticky lg:top-24">
              {popular.length > 0 ? (
                <section aria-labelledby="popular-heading">
                  <h2
                    id="popular-heading"
                    className="mb-3 text-sm font-semibold tracking-tight text-foreground"
                  >
                    Articles populaires
                  </h2>
                  <ul className="space-y-4">
                    {popular.map((item) => (
                      <li key={item.slug}>
                        <Link
                          to="/blog/$slug"
                          params={{ slug: item.slug }}
                          className="group flex gap-3"
                        >
                          <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-elevated">
                            <PopularThumb post={item} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="text-[11px] font-semibold text-primary">
                              {item.category}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-sm font-medium leading-snug text-foreground group-hover:text-primary">
                              {item.title}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {formatBlogDate(item.publishedAt)} · {item.readMinutes} min
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <FacebookSidebar />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
