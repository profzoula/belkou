import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Ticket, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthField } from "@/components/auth/AuthField";
import { EmailConfirmationNotice } from "@/components/auth/EmailConfirmationNotice";
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
  redirect: z.string().optional(),
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
  const { email: emailFromSearch, redirect: redirectFromSearch } = Route.useSearch();
  const claimReferralFn = useServerFn(claimSignupReferral);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(emailFromSearch ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showReferralField, setShowReferralField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    const stored = getStoredReferralCode();
    if (stored) {
      setReferralCode(stored);
      setShowReferralField(true);
    }
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
      setPendingConfirmationEmail(email);
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
    const redirect =
      redirectFromSearch?.startsWith("/") && !redirectFromSearch.startsWith("//")
        ? redirectFromSearch
        : "/dashboard";
    window.location.href = redirect;
  };

  if (pendingConfirmationEmail) {
    return (
      <AuthSplitLayout>
        <p className="mb-3 text-sm font-semibold tracking-[0.16em] text-primary uppercase">
          Inscription
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Presque terminé<span className="text-primary">.</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Confirmez votre email pour activer votre compte et accéder à vos cours.
        </p>
        <div className="mt-8 space-y-4">
          <EmailConfirmationNotice email={pendingConfirmationEmail} />
          <Button asChild variant="soft" size="lg" className="h-12 w-full rounded-full">
            <Link
              to="/login"
              search={{
                email: pendingConfirmationEmail,
                ...(redirectFromSearch ? { redirect: redirectFromSearch } : {}),
              }}
            >
              Aller à la connexion
            </Link>
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout activeTab="signup" tabRedirect={redirectFromSearch}>
      <h1 className="font-display text-[26px] font-bold tracking-tight text-foreground sm:text-3xl">
        Créez votre compte<span className="text-primary">.</span>
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Compte gratuit pour votre espace étudiant. Prêt à acheter un cours ?{" "}
        <Link
          to="/courses"
          className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
        >
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
        <div className="mt-6 space-y-5">
          <GoogleAuthButton label="Continuer avec Google" disabled={loading} />

          <AuthDivider />

          <form onSubmit={submit} className="space-y-4">
            <AuthField
              id="full_name"
              label="Nom complet"
              icon={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jean Pierre"
              autoComplete="name"
              autoFocus
              required
            />

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
              hint="Déjà payé un cours ? Utilisez la même adresse pour retrouver vos accès."
              required
            />

            <AuthField
              id="password"
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
              hint="8 caractères minimum."
              required
            />

            <AuthField
              id="confirm_password"
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
              error={passwordMismatch ? "Les mots de passe ne correspondent pas." : null}
              required
            />

            {showReferralField ? (
              <AuthField
                id="referral_code"
                label="Code affilié (optionnel)"
                icon={Ticket}
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Ex. JEAN1A2B"
                className="font-mono tracking-wide"
                autoComplete="off"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowReferralField(true)}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                J&apos;ai un code affilié
              </button>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              disabled={loading}
              className="h-12 w-full rounded-full text-base"
            >
              {loading ? "Création…" : "Créer mon compte"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Après l&apos;inscription, vérifiez votre <strong>Gmail</strong> pour confirmer votre
              compte.
            </p>
          </form>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            En créant un compte, vous acceptez les{" "}
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
