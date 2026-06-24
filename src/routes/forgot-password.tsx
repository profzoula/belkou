import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/forgot-password")({
  head: () =>
    seoHead({
      title: "Mot de passe oublié — BelKou",
      description: "Réinitialisez votre mot de passe BelKou.",
      path: "/forgot-password",
      noindex: true,
    }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Authentification non configurée.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
    toast.success("Email envoyé ! Vérifiez votre boîte de réception.");
  };

  return (
    <>
      <Navbar />
      <main className="site-page-top min-h-[calc(100dvh-var(--site-header-height))] flex items-center justify-center px-4 py-8 sm:py-12 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="surface w-full max-w-md p-6 sm:p-8 rounded-2xl">
          {!isSupabaseConfigured && (
            <div className="bg-amber-500/10 text-amber-700 rounded-lg p-3 text-sm mb-6">
              Authentification non configurée. Définissez les variables Supabase pour activer cette fonctionnalité.
            </div>
          )}

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>

          <h1 className="text-2xl font-display font-bold mb-2">Mot de passe oublié</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold">Email envoyé !</h2>
              <p className="text-sm text-muted-foreground">
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fp-email">Adresse email</Label>
                <Input
                  id="fp-email"
                  type="email"
                  required
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !isSupabaseConfigured}>
                {loading ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
