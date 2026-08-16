import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Info, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthField } from "@/components/auth/AuthField";
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
  const [formError, setFormError] = useState<string | null>(null);
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
    setFormError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        setPendingEmail(email);
        toast.error("Confirmez votre email dans Gmail avant de vous connecter.");
        return;
      }
      const readable =
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message;
      setFormError(readable);
      toast.error(readable);
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
    <AuthSplitLayout activeTab="login" tabRedirect={redirectFromSearch}>
      <h1 className="font-display text-[26px] font-bold tracking-tight text-foreground sm:text-3xl">
        Accédez à votre espace<span className="text-primary">.</span>
      </h1>
      <p className="mt-2 flex gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-[13px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span>
          Déjà payé un cours ? Connectez-vous avec{" "}
          <strong className="font-semibold text-foreground">le même email</strong> que votre
          inscription pour retrouver Mes cours.
        </span>
      </p>

      {!isSupabaseConfigured ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Supabase n&apos;est pas configuré. Ajoutez{" "}
          <code className="text-foreground">VITE_SUPABASE_URL</code> et{" "}
          <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code>.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {pendingEmail ? <EmailConfirmationNotice email={pendingEmail} /> : null}

          {oauthError || formError ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {oauthError ?? formError}
            </p>
          ) : null}

          <GoogleAuthButton label="Continuer avec Google" disabled={loading} />

          <AuthDivider />

          <form onSubmit={submit} className="space-y-4">
            <AuthField
              id="email"
              label="Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@email.com"
              autoComplete="email"
              inputMode="email"
              autoFocus
              required
            />

            <div className="space-y-2">
              <AuthField
                id="password"
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <p className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Mot de passe oublié ?
                </Link>
              </p>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              disabled={loading}
              className="h-12 w-full rounded-full text-base"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

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
