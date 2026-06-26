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
  const { email: emailFromSearch } = Route.useSearch();
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
      toast.error(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message);
      return;
    }

    toast.success("Connexion réussie.");
    window.location.href = "/dashboard";
  };

  return (
    <AuthSplitLayout>
      <p className="section-label mb-3">Connexion</p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Sign in to your account
      </h1>
      <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        Vous avez déjà payé pour un cours ? Connectez-vous avec{" "}
        <strong className="text-foreground">le même email</strong> que votre inscription pour accéder à Mes cours.
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
                placeholder="you@example.com"
                className="h-11 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-lg"
                required
              />
            </div>

            <Button type="submit" variant="hero" size="lg" disabled={loading} className="h-11 w-full rounded-lg">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <AuthDivider />

          <GoogleAuthButton label="Continue with Google" disabled={loading} variant="dark" />

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
              Sign up
            </Link>
          </p>

          <p className="text-center text-sm">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
              Forgot password?
            </Link>
          </p>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By signing in, you agree to the{" "}
            <Link to="/legal/terms" className="text-primary/80 underline underline-offset-2 hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/legal/privacy" className="text-primary/80 underline underline-offset-2 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      )}
    </AuthSplitLayout>
  );
}
