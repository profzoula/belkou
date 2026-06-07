import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { handleOAuthCallback } from "@/server/supabase-oauth";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => handleOAuthCallback(request),
    },
  },
  head: () =>
    seoHead({
      title: "Connexion — BelKou",
      description: "Finalisation de la connexion BelKou.",
      path: "/auth/callback",
      noindex: true,
    }),
  component: AuthCallbackFallback,
});

/** Shown only if the server handler did not redirect (misconfiguration or dev edge case). */
function AuthCallbackFallback() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-container site-page-top pb-12 sm:pb-16">
        <div className="mx-auto max-w-sm text-center">
          <div className="surface rounded-2xl p-8 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Connexion en cours...</p>
            <Link to="/login" className="text-sm text-primary font-medium hover:underline mt-2">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
