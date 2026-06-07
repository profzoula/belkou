import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/auth/callback")({
  head: () =>
    seoHead({
      title: "Connexion — BelKou",
      description: "Finalisation de la connexion BelKou.",
      path: "/auth/callback",
      noindex: true,
    }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const supabase = getSupabase();
    if (!supabase) {
      setError("Authentification non configurée.");
      return;
    }

    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error_description") ?? params.get("error");

      if (oauthError) {
        setError(decodeURIComponent(oauthError.replace(/\+/g, " ")));
        return;
      }

      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        window.location.replace("/dashboard");
        return;
      }

      setError("Connexion impossible. Réessayez.");
    };

    finish().catch(() => setError("Connexion impossible. Réessayez."));
  }, [mounted]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-container site-page-top pb-12 sm:pb-16">
        <div className="mx-auto max-w-sm text-center">
          {!mounted || (!error && isSupabaseConfigured) ? (
            <div className="surface rounded-2xl p-8 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Connexion en cours...</p>
            </div>
          ) : (
            <div className="surface rounded-2xl p-8">
              <p className="text-sm text-destructive mb-4">{error ?? "Configuration manquante."}</p>
              <Link to="/login" className="text-sm text-primary font-medium hover:underline">
                Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
