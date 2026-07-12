import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  BookOpen,
  CheckCircle2,
  CreditCard,
  LogIn,
  Mail,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { getRegistrationStatus, verifyStripeSession, getSuccessPageContext } from "@/lib/fns/register";
import { siteConfig, getWhatsappGroupUrl, getWhatsappGroupLabel } from "@/lib/site-config";
import { seoHead } from "@/lib/seo";
import { useAuth } from "@/hooks/use-auth";
import { LEGACY_COURSE_SLUG } from "@/lib/course-access";

const searchSchema = z.object({
  registrationId: z.string().optional(),
  plan: z.string().optional(),
  manual: z.string().optional(),
  session_id: z.string().optional(),
});

export const Route = createFileRoute("/success")({
  head: () =>
    seoHead({
      title: "Inscription confirmée — BelKou",
      description: "Votre inscription BelKou est confirmée.",
      path: "/success",
      noindex: true,
    }),
  validateSearch: searchSchema,
  loader: async ({ location }) => {
    const params = new URLSearchParams(location.search);
    const registrationId = params.get("registrationId") ?? undefined;
    return getSuccessPageContext({ data: { registrationId } });
  },
  component: SuccessPage,
});

type RegistrationStatus = {
  payment_status: string;
  full_name?: string;
  plan?: string;
  email?: string;
  course_slug?: string | null;
};

function ManualPaymentInfo() {
  const mp = siteConfig.manualPayment;
  const items = [
    mp.moncash && { label: "MonCash", value: mp.moncash },
    mp.zelle && { label: "Zelle", value: mp.zelle },
    mp.paypal && { label: "PayPal", value: mp.paypal },
    mp.bankNote && { label: "Bank", value: mp.bankNote },
  ].filter(Boolean) as { label: string; value: string }[];

  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Contactez-nous sur WhatsApp ou par email ({siteConfig.contactEmail}) pour les détails de paiement.
      </p>
    );
  }

  return (
    <ul className="text-sm space-y-1.5 text-muted-foreground">
      {items.map((i) => (
        <li key={i.label}>
          <span className="font-medium text-foreground">{i.label}:</span> {i.value}
        </li>
      ))}
    </ul>
  );
}

function SuccessPage() {
  const { registrationId, plan, manual, session_id } = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const { user, loading: authLoading } = useAuth();
  const statusFn = useServerFn(getRegistrationStatus);
  const verifyFn = useServerFn(verifyStripeSession);
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [verifiedPaid, setVerifiedPaid] = useState(false);
  const [loading, setLoading] = useState(Boolean(registrationId));

  useEffect(() => {
    if (!registrationId) return;

    void (async () => {
      if (session_id) {
        try {
          const v = await verifyFn({ data: { sessionId: session_id, registrationId } });
          if (v.paid) setVerifiedPaid(true);
        } catch (error) {
          console.error(error);
        }
      }

      try {
        const r = await statusFn({ data: { registrationId } });
        setStatus(r);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [registrationId, session_id, statusFn, verifyFn]);

  const isPaid = verifiedPaid || status?.payment_status === "paid";
  const showManual = manual === "1" || status?.payment_status === "manual_pending";
  const courseSlug = status?.course_slug ?? loaderData.courseSlug ?? LEGACY_COURSE_SLUG;
  const welcomeLessonId = loaderData.welcomeLessonId;
  const planId = (status?.plan ?? plan)?.toLowerCase();
  const whatsappUrl = isPaid ? getWhatsappGroupUrl(planId) : "";
  const whatsappLabel = getWhatsappGroupLabel(planId);
  const registrationEmail = status?.email;
  const emailMatchesUser = Boolean(
    user?.email && registrationEmail && user.email.toLowerCase() === registrationEmail.toLowerCase(),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-container site-page-top pb-12 sm:pb-16 max-w-lg text-center">
        <div className="inline-grid place-items-center h-14 w-14 rounded-full bg-primary/10 text-primary mb-5">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="section-label justify-center mb-3">Inscription reçue</p>
        <h1 className="text-2xl md:text-[1.75rem] font-semibold mb-2">
          {loading ? "Vérification..." : isPaid ? "Paiement confirmé !" : "Inscription enregistrée"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {isPaid
            ? "Votre accès au cours sera disponible selon le calendrier du programme. Créez votre compte avec le même email que l'inscription."
            : "Consultez votre email pour les instructions de paiement."}
        </p>

        <div className="space-y-3 text-left">
          {isPaid && !authLoading && !user && registrationEmail && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
              <div className="font-semibold text-sm mb-2 text-amber-900">Étape importante</div>
              <p className="text-sm text-amber-900/90 mb-3">
                Créez un compte ou connectez-vous avec <strong>{registrationEmail}</strong> pour accéder à vos cours.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild variant="hero" size="sm" className="flex-1">
                  <Link to="/signup" search={{ email: registrationEmail }}>
                    <UserPlus className="h-4 w-4" />
                    Créer mon compte
                  </Link>
                </Button>
                <Button asChild variant="soft" size="sm" className="flex-1">
                  <Link to="/login" search={{ email: registrationEmail }}>
                    <LogIn className="h-4 w-4" />
                    Se connecter
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {isPaid && user && !emailMatchesUser && registrationEmail && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Vous êtes connecté en tant que <strong>{user.email}</strong>, mais l&apos;inscription utilise{" "}
              <strong>{registrationEmail}</strong>. Connectez-vous avec le bon email pour voir vos cours.
            </div>
          )}

          {showManual && !isPaid && (
            <div className="surface rounded-xl p-4 sm:p-5 flex gap-4">
              <CreditCard className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <div className="font-semibold text-sm mb-2">Instructions de paiement</div>
                <ManualPaymentInfo />
              </div>
            </div>
          )}

          {isPaid && whatsappUrl && (
            <div className="surface rounded-xl p-4 sm:p-5 flex gap-4">
              <MessageCircle className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <div className="font-semibold text-sm mb-1">Groupe WhatsApp {whatsappLabel}</div>
                <Button asChild variant="soft" size="sm" className="mt-2">
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    Rejoindre {whatsappLabel}
                  </a>
                </Button>
              </div>
            </div>
          )}

          <div className="surface rounded-xl p-4 sm:p-5 flex gap-4">
            <Mail className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <div>
              <div className="font-semibold text-sm mb-1">Email de confirmation</div>
              <p className="text-sm text-muted-foreground">
                Un email a été envoyé si la messagerie est configurée. Vérifiez aussi les spams.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {isPaid && (emailMatchesUser || !registrationEmail) && (
            <>
              <Button asChild variant="hero" size="lg" className="touch-target">
                <Link to="/dashboard">
                  <BookOpen className="h-4 w-4" />
                  Mes cours
                </Link>
              </Button>
              <Button asChild variant="soft" size="lg" className="touch-target">
                <Link
                  to="/courses/$slug/learn"
                  params={{ slug: courseSlug }}
                  search={welcomeLessonId ? { lesson: welcomeLessonId } : undefined}
                >
                  Voir le cours
                </Link>
              </Button>
            </>
          )}
          {!isPaid && (
            <Button asChild variant="hero" size="lg" className="touch-target">
              <Link to="/">Retour à l&apos;accueil</Link>
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
