import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { EmailConfirmationNotice } from "@/components/auth/EmailConfirmationNotice";
import { AuthDivider, GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { z } from "zod";
import { seoHead } from "@/lib/seo";

const searchSchema = z.object({
  email: z.string().optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => searchSchema.parse(search),
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
  const { email: emailFromSearch, redirect: redirectFromSearch } = Route.useSearch();
  const [email, setEmail] = useState(emailFromSearch ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (emailFromSearch) setEmail(emailFromSearch);
  }, [emailFromSearch]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("error");
    const checkEmail = params.get("check_email");
    const emailParam = params.get("email");

    if (checkEmail === "1" && emailParam) {
      setPendingEmail(decodeURIComponent(emailParam));
      setEmail(decodeURIComponent(emailParam));
    }

    if (message) {
      const decoded = decodeURIComponent(message);
      setOauthError(decoded);
      toast.error(decoded);
    }

    if (message || checkEmail) {
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
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        setPendingEmail(email);
        toast.error("Confirmez votre email dans Gmail avant de vous connecter.");
        return;
      }
      toast.error(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message,
      );
      return;
    }

    toast.success("Connexion réussie.");
    const redirect =
      redirectFromSearch?.startsWith("/") && !redirectFromSearch.startsWith("//")
        ? redirectFromSearch
        : "/dashboard";
    window.location.href = redirect;
  };

  return (
    <AuthSplitLayout>
      <p className="mb-3 text-sm font-semibold tracking-[0.16em] text-primary uppercase">
        Connexion
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Accédez à votre espace
      </h1>
      <p className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        Vous avez déjà payé pour un cours ? Connectez-vous avec{" "}
        <strong className="text-foreground">le même email</strong> que votre inscription pour
        accéder à Mes cours.
      </p>

      {!isSupabaseConfigured ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Supabase n&apos;est pas configuré. Ajoutez{" "}
          <code className="text-foreground">VITE_SUPABASE_URL</code> et{" "}
          <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code>.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {pendingEmail ? <EmailConfirmationNotice email={pendingEmail} /> : null}

          {oauthError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {oauthError}
            </div>
          ) : null}

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                className="h-11 rounded-xl"
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
                className="h-11 rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              disabled={loading}
              className="h-11 w-full shadow-primary"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          <AuthDivider />

          <GoogleAuthButton label="Continuer avec Google" disabled={loading} variant="dark" />

          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Créer un compte
            </Link>
          </p>

          <p className="text-center text-sm">
            <Link
              to="/forgot-password"
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </p>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            En vous connectant, vous acceptez les{" "}
            <Link
              to="/legal/terms"
              className="text-primary/80 underline underline-offset-2 hover:text-primary"
            >
              Conditions d&apos;utilisation
            </Link>{" "}
            et la{" "}
            <Link
              to="/legal/privacy"
              className="text-primary/80 underline underline-offset-2 hover:text-primary"
            >
              Politique de confidentialité
            </Link>
            .
          </p>
        </div>
      )}
    </AuthSplitLayout>
  );
}
