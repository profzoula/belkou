import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
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
    // Supabase auto-detects the recovery token from the URL hash
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
    <>
      <Navbar />
      <main className="site-page-top min-h-[calc(100dvh-var(--site-header-height))] flex items-center justify-center px-4 py-8 sm:py-12 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="surface w-full max-w-md p-8 rounded-2xl">
          {!isSupabaseConfigured && (
            <div className="bg-amber-500/10 text-amber-700 rounded-lg p-3 text-sm mb-6">
              Authentification non configurée.
            </div>
          )}

          <h1 className="text-2xl font-display font-bold mb-2">Nouveau mot de passe</h1>

          {hasSession === null && (
            <p className="text-muted-foreground text-sm">Vérification en cours…</p>
          )}

          {hasSession === false && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Ce lien est invalide ou a expiré. Veuillez faire une nouvelle demande.
              </p>
              <Link to="/forgot-password">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Demander un nouveau lien
                </Button>
              </Link>
            </div>
          )}

          {hasSession && !done && (
            <>
              <p className="text-muted-foreground text-sm mb-8">
                Définissez un nouveau mot de passe pour votre compte.
              </p>
              <form onSubmit={submit} className="space-y-5">
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
                      tabIndex={-1}
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
                </Button>
              </form>
            </>
          )}

          {done && (
            <div className="text-center space-y-4 mt-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold">Mot de passe mis à jour !</h2>
              <p className="text-sm text-muted-foreground">
                Votre mot de passe a été changé avec succès.
              </p>
              <Link to="/dashboard">
                <Button className="mt-4">Accéder à mon espace</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
