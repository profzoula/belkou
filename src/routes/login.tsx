import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthDivider, GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () =>
    seoHead({
      title: "Connexion — BelKou",
      description: "Connectez-vous à votre espace étudiant BelKou.",
      path: "/login",
      noindex: true,
    }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get("error");
    if (message) {
      const decoded = decodeURIComponent(message);
      setOauthError(decoded);
      toast.error(decoded);
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Authentification non configurée.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message);
      return;
    }

    toast.success("Connexion réussie.");
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-container site-page-top pb-12 sm:pb-16">
        <div className="mx-auto w-full max-w-sm sm:max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="mb-8">
          <p className="section-label mb-3">Connexion</p>
          <h1 className="text-2xl md:text-3xl font-semibold">Accédez à votre espace</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Connectez-vous pour accéder à la formation après votre inscription.
          </p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="surface rounded-2xl p-6 text-sm text-muted-foreground">
            Supabase n&apos;est pas encore configuré. Ajoutez{" "}
            <code className="text-foreground">VITE_SUPABASE_URL</code> et{" "}
            <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code> dans vos variables d&apos;environnement.
          </div>
        ) : (
          <div className="space-y-4">
            {oauthError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {oauthError}
              </div>
            ) : null}
            <GoogleAuthButton label="Se connecter avec Google" disabled={loading} />
            <AuthDivider />
            <form onSubmit={submit} className="space-y-5 surface rounded-2xl p-6 md:p-8">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                className="rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg"
                required
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"} <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                S'inscrire
              </Link>
            </p>
          </form>
          </div>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
