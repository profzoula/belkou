import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { AuthFormHeading, AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  head: () =>
    seoHead({
      title: "Nouveau mot de passe — BelKou",
      description: "Définissez un nouveau mot de passe pour votre compte BelKou.",
      path: "/reset-password",
      noindex: true,
    }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setHasSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasSession(true);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Authentification non configurée.");
      return;
    }

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setDone(true);
    toast.success("Mot de passe mis à jour avec succès !");
  };

  return (
    <AuthSplitLayout>
      {!isSupabaseConfigured ? (
        <p className="mb-6 rounded-xl border border-brand-accent/40 bg-brand-accent/15 px-4 py-3 text-sm text-brand-accent-foreground">
          Authentification non configurée.
        </p>
      ) : null}

      <AuthFormHeading
        className="text-left"
        title="Nouveau mot de passe."
        subtitle={hasSession ? "Définissez un nouveau mot de passe pour votre compte." : undefined}
      />

      {hasSession === null && <p className="mt-6 text-sm text-white/50">Vérification en cours…</p>}

      {hasSession === false && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-white/50">
            Ce lien est invalide ou a expiré. Veuillez faire une nouvelle demande.
          </p>
          <Button
            asChild
            className="rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            <Link to="/forgot-password">
              <ArrowLeft className="h-4 w-4" />
              Demander un nouveau lien
            </Link>
          </Button>
        </div>
      )}

      {hasSession && !done && (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <AuthField
            id="rp-password"
            label="Nouveau mot de passe"
            type="password"
            required
            minLength={6}
            placeholder="Au moins 6 caractères"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
          />
          <AuthField
            id="rp-confirm"
            label="Confirmer le mot de passe"
            type="password"
            required
            minLength={6}
            placeholder="Répétez le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={passwordMismatch ? "Les mots de passe ne correspondent pas." : null}
          />
          <Button
            type="submit"
            className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] text-base text-white shadow-[0_10px_28px_rgb(37_99_235_/_0.35)] hover:brightness-110"
            size="lg"
            disabled={loading}
          >
            {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
          </Button>
        </form>
      )}

      {done && (
        <div className="mt-8">
          <EmptyState
            icon={Check}
            title="Mot de passe mis à jour !"
            description="Votre mot de passe a été changé avec succès."
            action={
              <Button
                asChild
                className="rounded-xl border-0 bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] text-white hover:brightness-110"
              >
                <Link to="/dashboard">Accéder à mon espace</Link>
              </Button>
            }
          />
        </div>
      )}
    </AuthSplitLayout>
  );
}
