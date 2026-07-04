import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessagesSquare } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
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
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-container site-page-top pb-12 sm:pb-16 max-w-6xl">
        <header className="mb-8">
          <p className="section-label mb-2">Communauté</p>
          <div className="flex items-start gap-3">
            <MessagesSquare className="mt-1 h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">Forum étudiant</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                Posez une question, partagez une suggestion et débattez avec les autres inscrits. Chaque
                nouveau sujet envoie une notification aux étudiants du cours.
              </p>
            </div>
          </div>
        </header>
        <ForumCoursePicker />
      </main>
      <Footer />
    </div>
  );
}
