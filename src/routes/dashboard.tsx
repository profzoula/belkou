import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/use-auth";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Mon espace — BelKou" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading, configured, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && configured && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, configured, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-6 pt-[5.5rem] pb-16 max-w-lg text-center">
          <p className="text-muted-foreground">Authentification Supabase non configurée.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "Étudiant";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pt-[5.5rem] pb-16 max-w-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="section-label mb-2">Espace étudiant</p>
            <h1 className="text-2xl md:text-3xl font-semibold">Bonjour, {name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>

        <div className="surface rounded-2xl p-6 md:p-8">
          <div className="flex gap-4">
            <div className="icon-box shrink-0 h-10 w-10">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold mb-1">Formation BelKou</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Votre espace de formation sera disponible ici. Début de la cohorte :{" "}
                <strong className="text-foreground">{siteConfig.cohortStartDate}</strong>.
              </p>
              <Button asChild variant="neon" size="sm">
                <Link to="/register">Voir les plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
