import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Lightbulb, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { createCourseForumReply, getForumThread } from "@/lib/fns/forum";
import { useAuth } from "@/hooks/use-auth";
import { seoHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/forum/$courseSlug/$postId")({
  head: () =>
    seoHead({
      title: "Discussion — Forum BelKou",
      description: "Fil de discussion entre étudiants.",
      path: "/forum",
      noindex: true,
    }),
  component: ForumThreadPage,
});

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function ForumThreadPage() {
  const { courseSlug, postId } = Route.useParams();
  const { user, session, loading, configured } = useAuth();
  const navigate = useNavigate();
  const loadFn = useServerFn(getForumThread);
  const replyFn = useServerFn(createCourseForumReply);
  const [thread, setThread] = useState<Awaited<ReturnType<typeof getForumThread>> | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    if (!session?.access_token) return;
    void loadFn({ data: { accessToken: session.access_token, courseSlug, postId } })
      .then((result) => setThread(result))
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Discussion introuvable.");
        void navigate({ to: "/forum/$courseSlug", params: { courseSlug } });
      });
  };

  useEffect(() => {
    if (!loading && configured && !user) {
      navigate({ to: "/login", search: { redirect: `/forum/${courseSlug}/${postId}` } });
    }
  }, [user, loading, configured, navigate, courseSlug, postId]);

  useEffect(() => {
    refresh();
  }, [session?.access_token, courseSlug, postId]);

  const submitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.access_token || !replyBody.trim()) return;

    setSubmitting(true);
    try {
      await replyFn({
        data: {
          accessToken: session.access_token,
          courseSlug,
          postId,
          body: replyBody.trim(),
        },
      });
      setReplyBody("");
      toast.success("Réponse publiée — les participants seront notifiés.");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Réponse impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || !session?.access_token || !thread) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  const { post, replies, courseTitle } = thread;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-container site-page-top pb-12 sm:pb-16 max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Button asChild variant="ghost" size="sm" className="gap-1 px-0">
            <Link to="/forum/$courseSlug" params={{ courseSlug }}>
              <ArrowLeft className="h-4 w-4" />
              Forum — {courseTitle}
            </Link>
          </Button>
        </div>

        <article className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge
              variant="secondary"
              className={cn("gap-1", post.kind === "suggestion" && "bg-amber-100 text-amber-900")}
            >
              {post.kind === "suggestion" ? (
                <Lightbulb className="h-3 w-3" />
              ) : (
                <MessageCircle className="h-3 w-3" />
              )}
              {post.kind === "suggestion" ? "Suggestion" : "Question"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {post.authorName} · {formatWhen(post.createdAt)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold leading-snug">{post.title}</h1>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{post.body}</p>
        </article>

        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-bold">
            {replies.length} réponse{replies.length > 1 ? "s" : ""}
          </h2>

          {replies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Personne n&apos;a encore répondu. Lancez le débat !
            </p>
          ) : (
            <ul className="space-y-3">
              {replies.map((reply) => (
                <li key={reply.id} className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {reply.authorName} · {formatWhen(reply.createdAt)}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={submitReply} className="mt-8 rounded-lg border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold">Votre réponse</h3>
          <Textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Partagez votre avis, votre expérience ou une piste de solution..."
            rows={4}
            maxLength={8000}
          />
          <Button type="submit" variant="hero" disabled={submitting || !replyBody.trim()}>
            {submitting ? "Envoi..." : "Publier la réponse"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
