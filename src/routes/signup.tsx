import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthDivider, GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { getAuthCallbackUrl } from "@/lib/supabase/auth-actions";
import { claimSignupReferral } from "@/lib/fns/affiliate";
import {
  clearStoredReferralCode,
  getStoredReferralCode,
  normalizeReferralCode,
} from "@/lib/referral-storage";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { z } from "zod";
import { seoHead } from "@/lib/seo";

const searchSchema = z.object({
  email: z.string().optional(),
});

export const Route = createFileRoute("/signup")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () =>
    seoHead({
      title: "Créer un compte — BelKou",
      description: "Créez votre compte étudiant BelKou pour accéder à votre espace de formation.",
      path: "/signup",
      noindex: true,
    }),
  component: SignupPage,
});

function SignupPage() {
  const { email: emailFromSearch } = Route.useSearch();
  const claimReferralFn = useServerFn(claimSignupReferral);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(emailFromSearch ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = getStoredReferralCode();
    if (stored) setReferralCode(stored);
  }, []);

  useEffect(() => {
    if (emailFromSearch) setEmail(emailFromSearch);
  }, [emailFromSearch]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      toast.error("Authentification non configurée.");
      return;
    }

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    const referredBy = normalizeReferralCode(referralCode) || getStoredReferralCode();

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(referredBy ? { referred_by: referredBy } : {}),
        },
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data.user) {
      toast.error("Impossible de créer le compte. Réessayez.");
      return;
    }

    // referred_by is persisted in user_metadata at signup — clear client storage so late visits can't re-bind.
    if (referredBy) {
      clearStoredReferralCode();
    }

    const alreadyRegistered = data.user.identities?.length === 0;
    const needsEmailConfirmation =
      alreadyRegistered || Boolean(!data.user.email_confirmed_at && !data.session);

    if (needsEmailConfirmation) {
      if (alreadyRegistered) {
        toast.info("Un compte existe déjà avec cet email. Renvoyez la confirmation si besoin.");
      }
      const params = new URLSearchParams({
        check_email: "1",
        email,
      });
      window.location.replace(`/login?${params.toString()}`);
      return;
    }

    if (data.session?.access_token) {
      await claimReferralFn({
        data: {
          accessToken: data.session.access_token,
        },
      }).catch(() => undefined);
    }

    toast.success("Compte créé avec succès.");
    window.location.href = "/dashboard";
  };

  return (
    <AuthSplitLayout>
      <p className="mb-3 text-sm font-semibold tracking-[0.16em] text-primary uppercase">Inscription</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Créez votre compte
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Compte gratuit pour votre espace étudiant. Prêt à acheter un cours ?{" "}
        <Link to="/courses" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
          Parcourir les cours
        </Link>
        .
      </p>

      {!isSupabaseConfigured ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Supabase n&apos;est pas configuré. Ajoutez{" "}
          <code className="text-foreground">VITE_SUPABASE_URL</code> et{" "}
          <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code>.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Pierre"
                className="h-11 rounded-xl"
                required
              />
            </div>

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
                minLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral_code">Code affilié (optionnel)</Label>
              <Input
                id="referral_code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Ex. JEAN1A2B"
                className="h-11 rounded-xl font-mono tracking-wide"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl"
                minLength={8}
                required
              />
            </div>

            <Button type="submit" variant="hero" size="lg" disabled={loading} className="h-11 w-full shadow-primary">
              {loading ? "Création…" : "Créer mon compte"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Après l&apos;inscription, vérifiez votre <strong>Gmail</strong> pour confirmer votre compte.
            </p>
          </form>

          <AuthDivider />

          <GoogleAuthButton label="Continuer avec Google" disabled={loading} variant="dark" />

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/login" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
              Se connecter
            </Link>
          </p>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            En créant un compte, vous acceptez les{" "}
            <Link to="/legal/terms" className="text-primary/80 underline underline-offset-2 hover:text-primary">
              Conditions d&apos;utilisation
            </Link>{" "}
            et la{" "}
            <Link to="/legal/privacy" className="text-primary/80 underline underline-offset-2 hover:text-primary">
              Politique de confidentialité
            </Link>
            .
          </p>
        </div>
      )}
    </AuthSplitLayout>
  );
}
