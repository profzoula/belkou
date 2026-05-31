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

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Créer un compte — BelKou" },
      { name: "description", content: "Créez votre compte étudiant BelKou." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const [fullName, setFullName] = useState("");
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Compte créé. Vérifiez votre email si la confirmation est activée.");
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
          <p className="section-label mb-3">Inscription</p>
          <h1 className="text-2xl md:text-3xl font-semibold">Créer un compte</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Créez votre compte pour accéder à la formation. Pour acheter un plan, utilisez{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              la page d&apos;inscription
            </Link>
            .
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
              <Label htmlFor="full_name">Nom complet</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Pierre"
                className="rounded-lg"
                required
              />
            </div>
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
                placeholder="8 caractères minimum"
                className="rounded-lg"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Création..." : "Créer mon compte"} <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Déjà un compte ?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
