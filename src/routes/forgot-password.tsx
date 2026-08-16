import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
    <AuthSplitLayout>
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la connexion
      </Link>

      {!isSupabaseConfigured ? (
        <p className="rounded-xl border border-brand-accent/40 bg-brand-accent/15 px-4 py-3 text-sm text-brand-accent-foreground">
          Authentification non configurée. Définissez les variables Supabase pour activer cette
          fonctionnalité.
        </p>
      ) : null}

      <p className="mb-3 text-sm font-semibold tracking-[0.16em] text-primary uppercase">
        Mot de passe
      </p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Mot de passe oublié<span className="text-primary">.</span>
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de
        passe.
      </p>

      {sent ? (
        <div className="mt-8">
          <EmptyState
            icon={Mail}
            title="Email envoyé !"
            description={`Si un compte existe avec l'adresse ${email}, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.`}
            action={
              <Button asChild variant="outline">
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <AuthField
            id="fp-email"
            label="Adresse email"
            type="email"
            icon={Mail}
            required
            placeholder="vous@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            autoFocus
          />
          <Button
            type="submit"
            className="h-12 w-full rounded-full text-base"
            size="lg"
            variant="hero"
            disabled={loading || !isSupabaseConfigured}
          >
            {loading ? "Envoi en cours…" : "Envoyer le lien"}
          </Button>
        </form>
      )}
    </AuthSplitLayout>
  );
}
