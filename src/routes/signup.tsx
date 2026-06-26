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
import { getStoredReferralCode, normalizeReferralCode } from "@/lib/referral-storage";
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
          referralCode: referredBy ?? undefined,
        },
      }).catch(() => undefined);
    }

    toast.success("Compte créé avec succès.");
    window.location.href = "/dashboard";
  };

  return (
    <AuthSplitLayout>
      <p className="section-label mb-3">Sign up</p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Create your account
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
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Pierre"
                className="h-11 rounded-lg"
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
                className="h-11 rounded-lg font-mono tracking-wide"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-lg"
                minLength={8}
                required
              />
            </div>

            <Button type="submit" variant="hero" size="lg" disabled={loading} className="h-11 w-full rounded-lg">
              {loading ? "Creating account..." : "Sign up"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Après l&apos;inscription, vérifiez votre <strong>Gmail</strong> pour confirmer votre compte.
            </p>
          </form>

          <AuthDivider />

          <GoogleAuthButton label="Continue with Google" disabled={loading} variant="dark" />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By signing up, you agree to the{" "}
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
