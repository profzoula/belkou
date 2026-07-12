import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { CreateForumPostForm } from "@/components/forum/CreateForumPostForm";
import { ForumPostCard } from "@/components/forum/ForumPostCard";
import { listCourseForumPosts } from "@/lib/fns/forum";
import { useAuth } from "@/hooks/use-auth";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/forum/$courseSlug/")({
  head: () =>
    seoHead({
      title: "Forum du cours — BelKou",
      description: "Discussions entre étudiants inscrits.",
      path: "/forum",
      noindex: true,
    }),
  component: ForumCoursePage,
});

type ForumPostItem = {
  id: string;
  kind: "question" | "suggestion";
  authorName: string;
  authorEmail?: string;
  title: string;
  body: string;
  replyCount: number;
  lastActivityAt: string;
  createdAt: string;
};

function ForumCoursePage() {
  const { courseSlug } = Route.useParams();
  const { user, session, loading, configured } = useAuth();
  const navigate = useNavigate();
  const listFn = useServerFn(listCourseForumPosts);
  const [posts, setPosts] = useState<ForumPostItem[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!session?.access_token) return;
    void listFn({ data: { accessToken: session.access_token, courseSlug } })
      .then((result) => {
        setPosts(result.posts);
        setError(null);
      })
      .catch((err) => {
        setPosts([]);
        setError(err instanceof Error ? err.message : "Chargement impossible.");
      });
  };

  useEffect(() => {
    if (!loading && configured && !user) {
      navigate({ to: "/login", search: { redirect: `/forum/${courseSlug}` } });
    }
  }, [user, loading, configured, navigate, courseSlug]);

  useEffect(() => {
    refresh();
  }, [session?.access_token, courseSlug]);

  if (loading || !user || !session?.access_token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-container site-page-top pb-12 sm:pb-16 max-w-lg mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-1 px-0">
            <Link to="/forum">
              <ArrowLeft className="h-4 w-4" />
              Tous les forums
            </Link>
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="space-y-6">
          <CreateForumPostForm
            courseSlug={courseSlug}
            accessToken={session.access_token}
            onCreated={refresh}
          />

          <section className="space-y-4">
            <h2 className="text-lg font-bold">Publications</h2>
            {posts === undefined ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : posts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                Aucune publication pour le moment. Soyez le premier à lancer la discussion !
              </div>
            ) : (
              <ul className="space-y-4">
                {posts.map((post) => (
                  <li key={post.id}>
                    <ForumPostCard post={post} courseSlug={courseSlug} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
