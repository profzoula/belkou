import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, CreditCard, Gift, Lock, Radio, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { planDetails, type PlanId } from "@/lib/plans";
import { formatLiveSchedule, liveCtaLabel, liveTicketSlug, resolveLivePrice } from "@/lib/live";
import { formatUsd, toMoney } from "@/lib/money";
import { registrationSchema } from "@/lib/schemas/registration";
import { submitRegistration } from "@/lib/fns/register";
import { getPublicCourse, type PublicCourse } from "@/lib/fns/courses";
import { SiteWordmark } from "@/components/site/SiteWordmark";
import { SiteLogo } from "@/components/site/SiteLogo";
import { getStoredReferralCode, saveReferralCode } from "@/lib/referral-storage";
import { saveRegistrationHandoff } from "@/lib/registration-handoff";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { getCourseIcon } from "@/lib/course-icons";

type CheckoutPageProps = {
  plan?: PlanId;
  courseSlug?: string;
  liveTicket?: boolean;
  liveSessionId?: string;
  liveSessionTitle?: string;
  liveSessionScheduledAt?: string;
  liveSessionPrice?: number;
  refCode?: string;
  initialCourse?: PublicCourse | null;
};

const ORIGINAL_PRICES: Record<PlanId, number> = {
  premium: 399,
  vip: 450,
};

const DEFAULT_COUNTRY = "HT";
const DEFAULT_LEVEL = "beginner";

function discountPercent(price: number, original: number) {
  if (original <= price) return 0;
  return Math.round((1 - price / original) * 100);
}

export function CheckoutPage({
  plan: initialPlan,
  courseSlug,
  liveTicket = false,
  liveSessionId,
  liveSessionTitle,
  liveSessionScheduledAt,
  liveSessionPrice,
  refCode,
  initialCourse = null,
}: CheckoutPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const submitFn = useServerFn(submitRegistration);
  const loadCourseFn = useServerFn(getPublicCourse);
  const [course, setCourse] = useState<PublicCourse | null>(initialCourse);
  const CourseIcon = courseSlug ? getCourseIcon(courseSlug) : null;

  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan ?? "premium");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    whatsapp: "",
    referral_code: "",
  });
  const checkoutTracked = useRef<string | null>(null);

  useEffect(() => {
    if (refCode) saveReferralCode(refCode);
    const stored = getStoredReferralCode();
    if (stored) setForm((s) => ({ ...s, referral_code: stored }));
  }, [refCode]);

  useEffect(() => {
    if (user?.email) {
      setForm((current) => (current.email.trim() ? current : { ...current, email: user.email! }));
    }
  }, [user?.email]);

  useEffect(() => {
    if (!courseSlug) {
      setCourse(null);
      return;
    }

    if (initialCourse && initialCourse.slug === courseSlug) {
      setCourse(initialCourse);
      return;
    }

    loadCourseFn({ data: { slug: courseSlug } })
      .then((loaded) => setCourse(loaded))
      .catch(() => setCourse(null));
  }, [courseSlug, initialCourse, loadCourseFn]);

  const isLiveTicket = Boolean(liveTicket);
  const isVipMembership = Boolean(initialPlan === "vip" && !isLiveTicket && !courseSlug);
  const plan = planDetails[selectedPlan];
  const coursePrice = course?.price;
  const courseOriginalPrice = course?.originalPrice;
  const liveTicketPrice = resolveLivePrice(liveSessionPrice);
  const displayPrice = toMoney(
    isLiveTicket ? liveTicketPrice : courseSlug && course ? coursePrice! : plan.price,
  );
  const displayOriginal = toMoney(
    isLiveTicket
      ? liveTicketPrice
      : courseSlug && course
        ? courseOriginalPrice!
        : ORIGINAL_PRICES[selectedPlan],
  );
  const savings = toMoney(displayOriginal - displayPrice);
  const pctOff = discountPercent(displayPrice, displayOriginal);

  const update = (key: string, value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTermsError(null);
    setFieldErrors({});
    if (!acceptedTerms) {
      setTermsError("Acceptez les conditions pour continuer.");
      toast.error("Acceptez les conditions pour continuer.");
      return;
    }
    if (isLiveTicket && !liveSessionId) {
      toast.error("Choisissez le live que vous voulez réserver.");
      navigate({ to: "/live" });
      return;
    }

    const payload = {
      ...form,
      country: DEFAULT_COUNTRY,
      level: DEFAULT_LEVEL,
      plan: isLiveTicket
        ? "live"
        : isVipMembership
          ? "vip"
          : courseSlug && course
            ? "premium"
            : selectedPlan,
      course_slug: isLiveTicket
        ? liveTicketSlug(liveSessionId ?? "")
        : courseSlug && course
          ? courseSlug
          : undefined,
      referral_code: form.referral_code || undefined,
    };

    const parsed = registrationSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      const firstMessage = Object.values(nextErrors)[0] ?? parsed.error.issues[0]?.message;
      if (firstMessage) toast.error(firstMessage);
      return;
    }

    setLoading(true);
    try {
      const result = await submitFn({ data: parsed.data });

      saveRegistrationHandoff({
        email: parsed.data.email,
        registrationId: result.registrationId,
        courseSlug: parsed.data.course_slug,
        paid: result.free,
      });

      if (result.resumed && !result.free) {
        toast.info("Inscription retrouvée — redirection vers le paiement.");
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      toast[result.free ? "success" : "info"](
        result.free
          ? "Place réservée — rendez-vous le jour du live."
          : "Square indisponible — suivez les instructions de paiement manuel.",
      );
      navigate({
        to: "/success",
        search: {
          registrationId: result.registrationId,
          plan: result.plan,
          course: parsed.data.course_slug || undefined,
          manual: result.manualPayment ? "1" : undefined,
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Paiement impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const productTitle = isVipMembership
    ? "BelKou VIP — Accès illimité"
    : isLiveTicket
      ? (liveSessionTitle ?? course?.title ?? "BelKou Live")
      : (course?.title ?? `Formation BelKou ${plan.name} — Formation en ligne`);
  const liveScheduleLabel = liveSessionScheduledAt
    ? formatLiveSchedule(liveSessionScheduledAt)
    : null;

  const includedFeatures = isLiveTicket
    ? [
        "Place réservée pour ce live",
        "Direct + commentaires sur BelKou",
        "Replay après la session",
      ]
    : courseSlug && course
      ? ["Accès complet au cours", "Vidéos et ressources à vie", "Support communauté BelKou"]
      : plan.features.slice(0, 4);

  useEffect(() => {
    if (courseSlug && !course) return;
    const id = isLiveTicket ? (liveSessionId ?? "live") : (courseSlug ?? selectedPlan);
    if (checkoutTracked.current === id) return;
    checkoutTracked.current = id;
    trackMetaEvent("InitiateCheckout", {
      content_name: productTitle,
      content_ids: [id],
      content_type: "product",
      value: displayPrice,
      currency: "USD",
    });
  }, [course, courseSlug, displayPrice, isLiveTicket, liveSessionId, productTitle, selectedPlan]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex">
            <SiteWordmark size="sm" />
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Paiement sécurisé
          </span>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 max-w-xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
            {isLiveTicket
              ? liveCtaLabel("Réservez votre place", liveTicketPrice)
              : "Finalisez votre inscription"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
            {isLiveTicket
              ? liveSessionId
                ? `Votre place pour ce live${liveScheduleLabel ? ` du ${liveScheduleLabel}` : ""} — direct, commentaires et replay.`
                : "Ce live n'est plus disponible. Choisissez une session sur la page Live."
              : "Trois champs, puis paiement sécurisé via Square."}
          </p>
          {isLiveTicket && !liveSessionId ? (
            <Button asChild variant="hero" size="lg" className="mt-6 touch-target">
              <Link to="/live">Voir les lives</Link>
            </Button>
          ) : null}
        </div>

        <form
          onSubmit={submit}
          className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-16"
        >
          <div className="min-w-0 space-y-10">
            {/* Product */}
            <section className="space-y-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br",
                    course?.thumbnail.gradient ?? "from-primary to-primary/80",
                  )}
                >
                  {isVipMembership ? (
                    <Gift className="h-6 w-6 text-white" aria-hidden />
                  ) : isLiveTicket && !CourseIcon ? (
                    <Radio className="h-6 w-6 text-white" aria-hidden />
                  ) : CourseIcon ? (
                    <CourseIcon className="h-6 w-6 text-white/90" />
                  ) : (
                    <SiteLogo className="h-8 w-8 rounded" alt="" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[0.9375rem] font-medium leading-snug text-foreground">
                    {productTitle}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isLiveTicket
                      ? "Une place · ce live uniquement"
                      : isVipMembership
                        ? "Tous les cours et lives · paiement unique"
                        : "Accès au cours · paiement unique"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {displayPrice > 0 ? formatUsd(displayPrice) : "Gratuit"}
                    </span>
                    {pctOff > 0 ? (
                      <>
                        <span className="text-sm text-muted-foreground line-through tabular-nums">
                          {formatUsd(displayOriginal)}
                        </span>
                        <span className="text-xs font-medium text-success">
                          −{formatUsd(savings)}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              {!isLiveTicket && !isVipMembership && !courseSlug ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["premium", "vip"] as const).map((planId) => {
                    const option = planDetails[planId];
                    const active = selectedPlan === planId;
                    return (
                      <label
                        key={planId}
                        className={cn(
                          "cursor-pointer rounded-2xl border px-4 py-4 transition-colors",
                          active
                            ? "border-primary bg-primary/[0.04]"
                            : "border-border/80 hover:border-foreground/20",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="checkout-plan"
                            checked={active}
                            onChange={() => setSelectedPlan(planId)}
                            className="mt-1 accent-primary"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{option.name}</p>
                            <p className="mt-1 text-lg font-semibold tabular-nums">
                              {formatUsd(option.price)}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : null}

              <ul className="space-y-2.5 border-t border-border/60 pt-6">
                {includedFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Personal info */}
            <section className="space-y-5 border-t border-border/60 pt-10">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  Vos informations
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Utilisez le même email pour créer votre compte après le paiement.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom complet</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => update("full_name", e.target.value)}
                    className="h-11 rounded-xl border-border/80 bg-card"
                    aria-invalid={Boolean(fieldErrors.full_name)}
                    aria-describedby={fieldErrors.full_name ? "checkout-full-name-error" : undefined}
                    autoComplete="name"
                    required
                  />
                  {fieldErrors.full_name ? (
                    <p
                      id="checkout-full-name-error"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {fieldErrors.full_name}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="h-11 rounded-xl border-border/80 bg-card"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={
                        fieldErrors.email ? "checkout-email-error" : "checkout-email-hint"
                      }
                      autoComplete="email"
                      required
                    />
                    {fieldErrors.email ? (
                      <p id="checkout-email-error" className="text-xs text-destructive" role="alert">
                        {fieldErrors.email}
                      </p>
                    ) : (
                      <p id="checkout-email-hint" className="text-xs text-muted-foreground">
                        Requis pour accéder à vos cours
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={form.whatsapp}
                      onChange={(e) => update("whatsapp", e.target.value)}
                      className="h-11 rounded-xl border-border/80 bg-card"
                      aria-invalid={Boolean(fieldErrors.whatsapp)}
                      aria-describedby={
                        fieldErrors.whatsapp ? "checkout-whatsapp-error" : undefined
                      }
                      autoComplete="tel"
                      required
                    />
                    {fieldErrors.whatsapp ? (
                      <p
                        id="checkout-whatsapp-error"
                        className="text-xs text-destructive"
                        role="alert"
                      >
                        {fieldErrors.whatsapp}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {/* Payment note */}
            <section className="space-y-3 border-t border-border/60 pt-10">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-semibold tracking-tight">Paiement</h2>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
                  Square
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5">
                <CreditCard className="h-5 w-5 shrink-0 text-foreground/70" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Carte bancaire</p>
                  <p className="text-xs text-muted-foreground">
                    Visa · Mastercard · Amex — redirection sécurisée
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                BelKou ne stocke jamais vos données bancaires. Si Square est indisponible :
                MonCash, Zelle ou PayPal par email.
              </p>
            </section>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-8">
            <div className="rounded-2xl border border-border/80 bg-card p-6">
              <h2 className="text-sm font-medium text-muted-foreground">Total</h2>
              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {formatUsd(displayPrice)}
              </p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {isLiveTicket
                  ? `Place live — ${productTitle}`
                  : courseSlug && course
                    ? course.title
                    : `Plan ${plan.name}`}
              </p>

              {pctOff > 0 ? (
                <p className="mt-3 text-xs font-medium text-success">
                  Promo −{pctOff}% (−{formatUsd(savings)})
                </p>
              ) : null}

              <div className="mt-6 border-t border-border/60 pt-5">
                {!couponOpen ? (
                  <button
                    type="button"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                    onClick={() => setCouponOpen(true)}
                  >
                    Code parrainage
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="referral_code">Code affilié</Label>
                    <Input
                      id="referral_code"
                      value={form.referral_code}
                      onChange={(e) => update("referral_code", e.target.value.toUpperCase())}
                      placeholder="CODE"
                      className="rounded-xl font-mono uppercase"
                    />
                  </div>
                )}
              </div>

              <label
                className="mt-6 flex cursor-pointer gap-2.5 text-xs leading-relaxed text-muted-foreground"
                htmlFor="accept-terms"
              >
                <input
                  id="accept-terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked) setTermsError(null);
                  }}
                  className="mt-0.5 rounded border-border"
                  aria-invalid={Boolean(termsError)}
                  aria-describedby={termsError ? "checkout-terms-error" : undefined}
                />
                <span>
                  J&apos;accepte les{" "}
                  <Link to="/legal/cgv" className="text-foreground underline underline-offset-2">
                    conditions générales
                  </Link>
                  . Pas de remboursement après paiement.
                </span>
              </label>
              {termsError ? (
                <p id="checkout-terms-error" className="mt-2 text-xs text-destructive" role="alert">
                  {termsError}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={loading || !acceptedTerms}
                size="xl"
                className="mt-5 h-12 w-full rounded-xl"
                aria-describedby={!acceptedTerms ? "checkout-submit-help" : undefined}
              >
                <Lock className="mr-1.5 h-4 w-4" aria-hidden />
                {loading
                  ? "Redirection…"
                  : isLiveTicket
                    ? liveCtaLabel("Réserver ma place", liveTicketPrice)
                    : "Payer et commencer"}
              </Button>
              {!acceptedTerms ? (
                <p
                  id="checkout-submit-help"
                  className="mt-2 text-center text-[11px] text-muted-foreground"
                >
                  Acceptez les conditions pour continuer
                </p>
              ) : (
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Accès personnel après confirmation
                </p>
              )}
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
