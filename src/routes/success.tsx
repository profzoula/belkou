import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { CheckCircle2, MessageCircle, Calendar, Mail, ArrowRight, CreditCard } from "lucide-react";
import { getRegistrationStatus, verifyStripeSession } from "@/lib/fns/register";
import { siteConfig, getWhatsappGroupUrl, getWhatsappGroupLabel } from "@/lib/site-config";
import { seoHead } from "@/lib/seo";

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
  component: SuccessPage,
});

function ManualPaymentInfo() {
  const mp = siteConfig.manualPayment;
  const items = [
    mp.moncash && { label: "MonCash", value: mp.moncash },
    mp.zelle && { label: "Zelle", value: mp.zelle },
    mp.paypal && { label: "PayPal", value: mp.paypal },
    mp.bankNote && { label: "Bank", value: mp.bankNote },
  ].filter(Boolean) as { label: string; value: string }[];

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">Contactez-nous sur WhatsApp pour les détails de paiement.</p>;
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
  const statusFn = useServerFn(getRegistrationStatus);
  const verifyFn = useServerFn(verifyStripeSession);
  const [status, setStatus] = useState<{ payment_status: string; full_name?: string; plan?: string } | null>(null);
  const [verifiedPaid, setVerifiedPaid] = useState(false);
  const [verifiedPlan, setVerifiedPlan] = useState<string | undefined>();

  useEffect(() => {
    if (!registrationId) return;

    const load = async () => {
      if (session_id) {
        try {
          const v = await verifyFn({ data: { sessionId: session_id, registrationId } });
          if (v.paid) {
            setVerifiedPaid(true);
            if (v.plan) setVerifiedPlan(v.plan);
          }
        } catch (e) {
          console.error(e);
        }
      }
      try {
        const r = await statusFn({ data: { registrationId } });
        setStatus(r);
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, [registrationId, session_id, statusFn, verifyFn]);

  const isPaid = verifiedPaid || status?.payment_status === "paid" || !!session_id;
  const showManual = manual === "1" || status?.payment_status === "manual_pending";
  const displayPlan = (status?.plan ?? plan)?.toUpperCase();
  const planId = (status?.plan ?? verifiedPlan ?? plan)?.toLowerCase();
  const whatsappUrl = isPaid ? getWhatsappGroupUrl(planId) : "";
  const whatsappLabel = getWhatsappGroupLabel(planId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pt-[5.5rem] pb-16 max-w-lg text-center">
        <div className="inline-grid place-items-center h-14 w-14 rounded-full bg-primary/10 text-primary mb-5">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="section-label justify-center mb-3">Inscription reçue</p>
        <h1 className="text-2xl md:text-[1.75rem] font-semibold mb-2">
          {isPaid ? "Paiement confirmé !" : "Inscription enregistrée"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {displayPlan ? `Plan ${displayPlan}. ` : ""}
          {isPaid
            ? "Bienvenue dans la formation. Suivez les étapes ci-dessous."
            : "Consultez votre email pour les instructions de paiement. Après paiement, vous rejoindrez le groupe."}
        </p>

        <div className="space-y-3 text-left">
          {showManual && !isPaid && (
            <div className="surface rounded-xl p-5 flex gap-4">
              <div className="icon-box shrink-0 h-10 w-10">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-sm mb-2">Instructions de paiement</div>
                <ManualPaymentInfo />
              </div>
            </div>
          )}

          {isPaid && whatsappUrl && (
            <div className="surface rounded-xl p-5 flex gap-4">
              <div className="icon-box shrink-0 h-10 w-10">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-sm mb-1">Groupe WhatsApp {whatsappLabel}</div>
                <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                  Rejoignez le groupe {whatsappLabel} pour commencer avec les autres étudiants.
                </p>
                <Button asChild variant="neon" size="sm">
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    Rejoindre {whatsappLabel}
                  </a>
                </Button>
              </div>
            </div>
          )}

          {!isPaid && (
            <div className="surface rounded-xl p-5 flex gap-4">
              <div className="icon-box shrink-0 h-10 w-10">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-sm mb-1">Groupe WhatsApp</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Après paiement, vous recevrez le lien du groupe Premium VibeCode ou VIP VibeCode selon votre plan.
                </p>
              </div>
            </div>
          )}

          <div className="surface rounded-xl p-5 flex gap-4">
            <div className="icon-box shrink-0 h-10 w-10">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">Date de la formation</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Début : <strong className="text-foreground">{siteConfig.cohortStartDate}</strong>
              </p>
            </div>
          </div>

          <div className="surface rounded-xl p-5 flex gap-4">
            <div className="icon-box shrink-0 h-10 w-10">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">Email de confirmation</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Un email a été envoyé dans votre boîte avec tous les détails. Si vous ne le voyez pas, vérifiez les spams.
              </p>
            </div>
          </div>
        </div>

        <Button asChild variant="hero" size="lg" className="mt-8">
          <Link to="/">
            Retour à l'accueil <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
