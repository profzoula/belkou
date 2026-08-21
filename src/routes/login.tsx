import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthFormHeading, AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
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

  const signupSearch = {
    ...(email ? { email } : {}),
    ...(redirectFromSearch ? { redirect: redirectFromSearch } : {}),
  };

  return (
    <AuthSplitLayout activeTab="login" tabRedirect={redirectFromSearch}>
      <AuthFormHeading
        title="Accédez à vos cours."
        subtitle="Entrez votre email pour vous connecter à BelKou ACADEMIC."
      />

      {!isSupabaseConfigured ? (
        <p className="mt-8 text-center text-sm text-white/50">
          Supabase n&apos;est pas configuré. Ajoutez{" "}
          <code className="text-white/80">VITE_SUPABASE_URL</code> et{" "}
          <code className="text-white/80">VITE_SUPABASE_ANON_KEY</code>.
        </p>
      ) : (
        <div className="mt-8 space-y-5">
          {pendingEmail ? <EmailConfirmationNotice email={pendingEmail} /> : null}

          {oauthError || formError ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-300"
            >
              {oauthError ?? formError}
            </p>
          ) : null}

          <GoogleAuthButton label="Continuer avec Google" disabled={loading} variant="dark" />

          <AuthDivider />

          <form onSubmit={submit} className="space-y-4">
            <AuthField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@email.com"
              autoComplete="email"
              inputMode="email"
              autoFocus
              required
            />

            <AuthField
              id="password"
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              labelAction={
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-white/45 transition-colors hover:text-white"
                >
                  Mot de passe oublié ?
                </Link>
              }
            />

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] text-base text-white shadow-[0_10px_28px_rgb(37_99_235_/_0.35)] hover:brightness-110"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          <p className="text-center text-xs leading-relaxed text-white/40">
            En vous connectant, vous acceptez les{" "}
            <Link
              to="/legal/terms"
              className="text-white/70 underline underline-offset-2 hover:text-white"
            >
              Conditions
            </Link>{" "}
            et la{" "}
            <Link
              to="/legal/privacy"
              className="text-white/70 underline underline-offset-2 hover:text-white"
            >
              Confidentialité
            </Link>
            .
          </p>

          <p className="pt-1 text-center text-sm text-white/45">
            Pas encore de compte ?{" "}
            <Link
              to="/signup"
              search={signupSearch}
              className="font-semibold text-white transition-colors hover:text-blue-300"
            >
              S&apos;inscrire
            </Link>
          </p>
        </div>
      )}
    </AuthSplitLayout>
  );
}
