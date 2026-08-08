import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessagesSquare } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FadeIn } from "@/components/motion/FadeIn";
import { ForumCoursePicker } from "@/components/forum/ForumCoursePicker";
import { useAuth } from "@/hooks/use-auth";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/forum/")({
  head: () =>
    seoHead({
      title: "Forum étudiant — BelKou",
      description: "Posez vos questions et échangez avec les autres étudiants inscrits.",
      path: "/forum",
      noindex: true,
    }),
  component: ForumIndexPage,
});

function ForumIndexPage() {
  const { user, loading, configured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && configured && !user) {
      navigate({ to: "/login", search: { redirect: "/forum" } });
    }
  }, [user, loading, configured, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main id="main-content">
        <section className="relative overflow-hidden border-b border-border bg-gradient-mesh">
          <div className="site-container site-page-top pb-8 pt-8 sm:pb-10">
            <FadeIn>
              <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">
                Communauté
              </p>
              <div className="mt-3 flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <MessagesSquare className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Forum étudiant
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                    Posez une question, partagez une idée et échangez avec les autres inscrits. Chaque
                    nouveau sujet notifie les étudiants du cours.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <div className="site-container py-8 sm:py-10">
          <ForumCoursePicker />
        </div>
      </main>
      <Footer />
    </div>
  );
}
