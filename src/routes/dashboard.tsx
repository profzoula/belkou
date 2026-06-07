import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Gift,
  LogOut,
  MessageCircle,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/use-auth";
import { getStudentDashboard } from "@/lib/fns/dashboard";
import { siteConfig, getWhatsappGroupLabel, getWhatsappGroupUrl } from "@/lib/site-config";
import { pricingPlans } from "@/lib/plans";
import { seoHead } from "@/lib/seo";
import { AffiliatePanel } from "@/components/affiliate/AffiliatePanel";
import { claimSignupReferral } from "@/lib/fns/affiliate";
import { getStoredReferralCode } from "@/lib/referral-storage";

type StudentRegistration = {
  id: string;
  plan: "premium" | "vip";
  payment_status: "pending" | "paid" | "manual_pending";
  full_name: string;
  created_at: string;
};

const previewModules = [
  { n: "01", t: "Fondations de l'IA", week: "Semaine 1" },
  { n: "02", t: "Votre première application", week: "Semaine 2" },
  { n: "03", t: "SaaS et Backend", week: "Semaine 3" },
  { n: "04", t: "Lancer et vendre", week: "Semaine 4" },
];

export const Route = createFileRoute("/dashboard")({
  head: () =>
    seoHead({
      title: "Mon espace — BelKou",
      description: "Espace étudiant BelKou — accédez à votre formation.",
      path: "/dashboard",
      noindex: true,
    }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, session, loading, configured, signOut } = useAuth();
  const navigate = useNavigate();
  const dashboardFn = useServerFn(getStudentDashboard);
  const claimReferralFn = useServerFn(claimSignupReferral);
  const [registration, setRegistration] = useState<StudentRegistration | null | undefined>(undefined);

  useEffect(() => {
    if (!loading && configured && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, configured, navigate]);

  useEffect(() => {
    if (!session?.access_token) return;

    const storedRef = getStoredReferralCode();
    void claimReferralFn({
      data: {
        accessToken: session.access_token,
        referralCode: storedRef ?? undefined,
      },
    }).catch(() => undefined);

    dashboardFn({ data: { accessToken: session.access_token } })
      .then((result) => setRegistration(result.registration))
      .catch(() => setRegistration(null));
  }, [session?.access_token, dashboardFn, claimReferralFn]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="site-container site-page-top pb-12 sm:pb-16 max-w-lg text-center">
          <p className="text-muted-foreground">Authentification Supabase non configurée.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Étudiant";

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-container site-page-top pb-12 sm:pb-16 max-w-5xl">
        <DashboardHeader name={name} email={user.email ?? ""} onSignOut={handleSignOut} />

        {session?.access_token ? (
          <div className="mb-8 sm:mb-10">
            <AffiliatePanel accessToken={session.access_token} />
          </div>
        ) : null}

        {registration === undefined ? (
          <div className="surface rounded-2xl p-8 text-center text-sm text-muted-foreground">
            Chargement de votre espace...
          </div>
        ) : registration?.payment_status === "paid" ? (
          <EnrolledDashboard registration={registration} />
        ) : registration ? (
          <PendingEnrollmentDashboard registration={registration} />
        ) : (
          <OnboardingDashboard name={name} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function DashboardHeader({
  name,
  email,
  onSignOut,
}: {
  name: string;
  email: string;
  onSignOut: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
      <div>
        <p className="section-label mb-2">Espace étudiant</p>
        <h1 className="text-2xl md:text-3xl font-semibold">Bonjour, {name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{email}</p>
      </div>
      <Button variant="outline" size="sm" className="shrink-0 self-start touch-target w-full sm:w-auto" onClick={onSignOut}>
        <LogOut className="h-4 w-4" /> Déconnexion
      </Button>
    </div>
  );
}

function OnboardingDashboard({ name }: { name: string }) {
  return (
    <div className="space-y-8">
      <div className="brand-feature surface rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <div className="badge mb-4">
              <span className="badge-dot" />
              Compte activé
            </div>
            <h2 className="text-xl md:text-2xl font-semibold mb-2">
              Bienvenue {name} — il ne reste qu&apos;une étape
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Votre compte est prêt. Vous pouvez déjà parrainer des amis avec votre code affilié ci-dessus
              — pas besoin d&apos;être inscrit à la formation. Pour rejoindre la cohorte du{" "}
              <strong className="text-foreground">{siteConfig.cohortStartDate}</strong>, choisissez un plan
              ci-dessous.
            </p>
          </div>
          <Button asChild variant="hero" size="lg" className="shrink-0 touch-target w-full md:w-auto">
            <Link to="/register">
              S&apos;inscrire à la formation <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StepCard step={1} title="Compte créé" status="done" detail="Vous êtes connecté" />
        <StepCard step={2} title="Choisir un plan" status="current" detail="Premium ou VIP" />
        <StepCard
          step={3}
          title="Rejoindre la cohorte"
          status="upcoming"
          detail={siteConfig.cohortStartDate}
        />
      </div>

      {siteConfig.promo.enabled && (
        <div className="surface rounded-2xl p-5 flex gap-4 items-start border-primary/20 bg-primary-soft/30">
          <div className="icon-box shrink-0">
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-1">Offre de lancement</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {siteConfig.promo.message} —{" "}
              <Link to="/register" search={{ plan: "vip" }} className="text-primary font-semibold hover:underline">
                Réserver ma place VIP
              </Link>
            </p>
          </div>
        </div>
      )}

      <section>
        <div className="mb-5">
          <p className="section-label mb-2">Tarifs</p>
          <h2 className="text-lg font-semibold">Choisissez votre plan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Les deux plans incluent la formation complète sur 8 semaines.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`surface surface-hover rounded-2xl p-5 sm:p-6 flex flex-col ${
                plan.highlight ? "border-primary/30 ring-1 ring-primary/10" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                </div>
                {plan.badge && (
                  <span className="rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2.5 py-1 shrink-0">
                    {plan.badge}
                  </span>
                )}
              </div>
              <div className="mb-4">
                <span className="font-display text-3xl font-bold">${plan.price}</span>
                <span className="text-sm text-muted-foreground ml-1">USD</span>
              </div>
              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs sm:text-sm">
                    <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant={plan.highlight ? "hero" : "soft"} size="sm" className="w-full">
                <Link to="/register" search={{ plan: plan.id }}>
                  Choisir {plan.name}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="section-label mb-2">Aperçu</p>
          <h2 className="text-lg font-semibold">Ce qui vous attend</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <InfoStat icon={Clock} label="Durée" value={siteConfig.formation.durationRecommended} />
          <InfoStat icon={Calendar} label="Rythme" value={siteConfig.formation.schedule} />
          <InfoStat icon={Sparkles} label="Outils" value={siteConfig.stats.tools} />
          <InfoStat icon={Users} label="Note" value={`${siteConfig.stats.rating}/5`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {previewModules.map((module) => (
            <div key={module.n} className="surface rounded-xl p-4 flex gap-3 items-center">
              <div className="module-num grid h-9 w-9 place-items-center rounded-lg text-xs font-bold shrink-0">
                {module.n}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{module.week}</p>
                <p className="text-sm font-medium truncate">{module.t}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface rounded-2xl p-6">
        <div className="flex gap-4 items-start">
          <div className="icon-box shrink-0">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold mb-3">Objectifs de la formation</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {siteConfig.formation.objectives.map((objective) => (
                <li key={objective} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="surface rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">Une question avant de vous inscrire ?</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Écrivez-nous à{" "}
            <a href={`mailto:${siteConfig.contactEmail}`} className="text-primary hover:underline">
              {siteConfig.contactEmail}
            </a>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/register">Commencer l&apos;inscription</Link>
        </Button>
      </div>
    </div>
  );
}

function PendingEnrollmentDashboard({ registration }: { registration: StudentRegistration }) {
  const plan = pricingPlans.find((p) => p.id === registration.plan) ?? pricingPlans[0];
  const isManual = registration.payment_status === "manual_pending";

  return (
    <div className="space-y-6">
      <div className="surface rounded-2xl p-6 md:p-8 border-amber-200/60 dark:border-amber-500/25 bg-amber-50/40 dark:bg-amber-500/10">
        <div className="flex gap-4">
          <div className="icon-box shrink-0 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold mb-1">Inscription en cours — plan {plan.name}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {isManual
                ? "Votre inscription est enregistrée. Finalisez le paiement manuel pour confirmer votre place."
                : "Votre paiement est en attente de confirmation. Vous recevrez un email dès validation."}
            </p>
            <Button asChild variant="soft" size="sm">
              <Link to="/register" search={{ plan: registration.plan }}>
                {isManual ? "Voir les options de paiement" : "Reprendre l'inscription"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <EnrollmentSummary registration={registration} />
    </div>
  );
}

function EnrolledDashboard({ registration }: { registration: StudentRegistration }) {
  const plan = pricingPlans.find((p) => p.id === registration.plan) ?? pricingPlans[0];
  const whatsappUrl = getWhatsappGroupUrl(registration.plan);

  return (
    <div className="space-y-6">
      <div className="brand-feature surface rounded-2xl p-6 md:p-8">
        <div className="flex gap-4">
          <div className="icon-box shrink-0 bg-green-100 dark:bg-emerald-500/20 text-green-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold mb-1">Inscription confirmée — {plan.name}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Vous êtes inscrit à la cohorte du{" "}
              <strong className="text-foreground">{siteConfig.cohortStartDate}</strong>. Rejoignez le
              groupe WhatsApp pour commencer.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="hero" size="sm">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Rejoindre {getWhatsappGroupLabel(registration.plan)}
                </a>
              </Button>
              <Button asChild variant="soft" size="sm">
                <Link to="/success" search={{ registrationId: registration.id, plan: registration.plan }}>
                  Voir ma confirmation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StepCard step={1} title="Compte créé" status="done" detail="Connecté" />
        <StepCard step={2} title={`Plan ${plan.name}`} status="done" detail="Payé" />
        <StepCard step={3} title="Cohorte" status="current" detail={siteConfig.cohortStartDate} />
      </div>

      <EnrollmentSummary registration={registration} />

      <div className="surface rounded-2xl p-6">
        <div className="flex gap-4">
          <div className="icon-box shrink-0">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold mb-1">Modules de formation</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le contenu détaillé des 8 modules sera disponible ici à partir du{" "}
              {siteConfig.cohortStartDate}. En attendant, restez actif dans le groupe WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnrollmentSummary({ registration }: { registration: StudentRegistration }) {
  const plan = pricingPlans.find((p) => p.id === registration.plan) ?? pricingPlans[0];

  return (
    <div className="surface rounded-2xl p-5 sm:p-6">
      <h3 className="font-semibold mb-4">Récapitulatif</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Plan</dt>
          <dd className="font-medium">{plan.name} — ${plan.price} USD</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Statut</dt>
          <dd className="font-medium capitalize">
            {registration.payment_status === "paid"
              ? "Payé"
              : registration.payment_status === "manual_pending"
                ? "Paiement manuel en attente"
                : "En attente"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Début de cohorte</dt>
          <dd className="font-medium">{siteConfig.cohortStartDate}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Durée</dt>
          <dd className="font-medium">{siteConfig.formation.durationRecommended}</dd>
        </div>
      </dl>
    </div>
  );
}

function StepCard({
  step,
  title,
  detail,
  status,
}: {
  step: number;
  title: string;
  detail: string;
  status: "done" | "current" | "upcoming";
}) {
  return (
    <div
      className={`surface rounded-xl p-4 ${
        status === "current" ? "border-primary/30 ring-1 ring-primary/10" : ""
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold shrink-0 ${
            status === "done"
              ? "bg-primary text-primary-foreground"
              : status === "current"
                ? "bg-primary-soft text-primary border border-primary/20"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {status === "done" ? <Check className="h-4 w-4" /> : step}
        </div>
        <p className="font-semibold text-sm">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground pl-11">{detail}</p>
    </div>
  );
}

function InfoStat({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="stat-card text-left !p-4">
      <Icon className="h-4 w-4 text-primary mb-2" />
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
