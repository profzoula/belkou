import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthFormHeading, AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
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
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la connexion
      </Link>

      <AuthFormHeading
        className="text-left"
        title="Mot de passe oublié."
        subtitle="Entrez votre email et nous vous enverrons un lien de réinitialisation."
      />

      {!isSupabaseConfigured ? (
        <p className="mt-6 rounded-xl border border-brand-accent/40 bg-brand-accent/15 px-4 py-3 text-sm text-brand-accent-foreground">
          Authentification non configurée. Définissez les variables Supabase pour activer cette
          fonctionnalité.
        </p>
      ) : null}

      {sent ? (
        <div className="mt-8">
          <EmptyState
            icon={Mail}
            title="Email envoyé !"
            description={`Si un compte existe avec l'adresse ${email}, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.`}
            action={
              <Button
                asChild
                className="rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
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
            className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] text-base text-white shadow-[0_10px_28px_rgb(37_99_235_/_0.35)] hover:brightness-110"
            size="lg"
            disabled={loading || !isSupabaseConfigured}
          >
            {loading ? "Envoi en cours…" : "Envoyer le lien"}
          </Button>
        </form>
      )}
    </AuthSplitLayout>
  );
}
