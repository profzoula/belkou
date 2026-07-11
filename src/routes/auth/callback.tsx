import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { finishAuthCallback } from "@/lib/supabase/auth-actions";
import { claimSignupReferral } from "@/lib/fns/affiliate";
import { getStoredReferralCode } from "@/lib/referral-storage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/auth/callback")({
  head: () =>
    seoHead({
      title: "Connexion — BelKou",
      description: "Finalisation de la connexion BelKou.",
      path: "/auth/callback",
      noindex: true,
    }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const claimReferralFn = useServerFn(claimSignupReferral);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const search = new URLSearchParams(window.location.search);
      const oauthError =
        search.get("error_description") ?? search.get("error");
      const next = search.get("next") ?? "/dashboard";
      const destination = next.startsWith("/") ? next : `/${next}`;

      if (oauthError) {
        if (!cancelled) {
          setError(decodeURIComponent(oauthError.replace(/\+/g, " ")));
        }
        return;
      }

      const { error: authError, accessToken } = await finishAuthCallback(search);
      if (cancelled) return;

      if (authError) {
        const friendly = authError.includes("PKCE")
          ? "Connexion Google interrompue. Réessayez dans le même navigateur (pas en navigation privée), ou connectez-vous avec email et mot de passe."
          : authError;
        setError(friendly);
        return;
      }

      if (accessToken) {
        await claimReferralFn({
          data: {
            accessToken,
            referralCode: getStoredReferralCode() ?? undefined,
          },
        }).catch(() => undefined);
      }

      window.location.replace(destination);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [claimReferralFn]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-container site-page-top pb-12 sm:pb-16">
        <div className="mx-auto max-w-sm text-center">
          <div className="surface rounded-2xl p-8 flex flex-col items-center gap-3">
            {error ? (
              <>
                <p className="text-sm text-destructive leading-relaxed">{error}</p>
                <Link to="/login" className="text-sm text-primary font-medium hover:underline mt-2">
                  Retour à la connexion
                </Link>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Connexion en cours...</p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
