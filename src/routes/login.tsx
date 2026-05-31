import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — BelKou" },
      { name: "description", content: "Connectez-vous à votre espace étudiant BelKou." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <main className="container mx-auto px-6 pt-[5.5rem] pb-16 max-w-lg">
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
            <p className="text-xs text-center text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Créer un compte
              </Link>
            </p>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
