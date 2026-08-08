import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [showPassword, setShowPassword] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

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

      <p className="mb-3 text-sm font-semibold tracking-[0.16em] text-primary uppercase">Mot de passe</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Nouveau mot de passe
      </h1>

      {hasSession === null && (
        <p className="mt-6 text-sm text-muted-foreground">Vérification en cours…</p>
      )}

      {hasSession === false && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">
            Ce lien est invalide ou a expiré. Veuillez faire une nouvelle demande.
          </p>
          <Button asChild variant="outline">
            <Link to="/forgot-password">
              <ArrowLeft className="h-4 w-4" />
              Demander un nouveau lien
            </Link>
          </Button>
        </div>
      )}

      {hasSession && !done && (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            Définissez un nouveau mot de passe pour votre compte.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="rp-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="rp-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Au moins 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-confirm">Confirmer le mot de passe</Label>
              <Input
                id="rp-confirm"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" variant="hero" disabled={loading}>
              {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        </>
      )}

      {done && (
        <div className="mt-8">
          <EmptyState
            icon={Check}
            title="Mot de passe mis à jour !"
            description="Votre mot de passe a été changé avec succès."
            action={
              <Button asChild variant="hero">
                <Link to="/dashboard">Accéder à mon espace</Link>
              </Button>
            }
          />
        </div>
      )}
    </AuthSplitLayout>
  );
}
