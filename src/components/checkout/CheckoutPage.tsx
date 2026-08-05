import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  CreditCard,
  Globe,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { planDetails, type PlanId } from "@/lib/plans";
import { registrationSchema } from "@/lib/schemas/registration";
import { submitRegistration } from "@/lib/fns/register";
import { getPublicCourse, type PublicCourse } from "@/lib/fns/courses";
import { SiteLogo } from "@/components/site/SiteLogo";
import { siteConfig } from "@/lib/site-config";
import { getStoredReferralCode, saveReferralCode } from "@/lib/referral-storage";
import { cn } from "@/lib/utils";
import { getCourseIcon } from "@/lib/course-icons";

type CheckoutPageProps = {
  plan?: PlanId;
  courseSlug?: string;
  refCode?: string;
  initialCourse?: PublicCourse | null;
};

const ORIGINAL_PRICES: Record<PlanId, number> = {
  premium: 399,
  vip: 490,
};

function toMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toMoney(value));
}

function discountPercent(price: number, original: number) {
  if (original <= price) return 0;
  return Math.round((1 - price / original) * 100);
}

export function CheckoutPage({
  plan: initialPlan,
  courseSlug,
  refCode,
  initialCourse = null,
}: CheckoutPageProps) {
  const navigate = useNavigate();
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
    country: "HT",
    level: "beginner",
    referral_code: "",
  });

  useEffect(() => {
    if (refCode) saveReferralCode(refCode);
    const stored = getStoredReferralCode();
    if (stored) setForm((s) => ({ ...s, referral_code: stored }));
  }, [refCode]);

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

  const plan = planDetails[selectedPlan];
  const coursePrice = course?.price;
  const courseOriginalPrice = course?.originalPrice;
  const displayPrice = toMoney(courseSlug && course ? coursePrice! : plan.price);
  const displayOriginal = toMoney(
    courseSlug && course ? courseOriginalPrice! : ORIGINAL_PRICES[selectedPlan],
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

    const payload = {
      ...form,
      plan: courseSlug && course ? "premium" : selectedPlan,
      course_slug: courseSlug && course ? courseSlug : undefined,
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

      if (result.resumed) {
        toast.info("Inscription retrouvée — redirection vers le paiement.");
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      toast.info("Stripe indisponible — suivez les instructions de paiement manuel.");
      navigate({
        to: "/success",
        search: {
          registrationId: result.registrationId,
          plan: result.plan,
          manual: result.manualPayment ? "1" : undefined,
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Paiement impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const productTitle =
    course?.title ??
    `Formation BelKou ${plan.name} — Apps IA & SaaS`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/25">
      <header className="border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="site-container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-sm font-bold">
            <SiteLogo className="h-8 w-8" alt="" />
            {siteConfig.name}
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-primary" />
            Paiement sécurisé
          </span>
        </div>
      </header>

      <main id="main-content" className="site-container px-4 py-6 sm:px-0 sm:py-8 lg:py-10">
        <div className="mb-6 sm:mb-8">
          <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">Checkout</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Finalisez votre inscription
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Quelques informations, puis paiement sécurisé via Stripe.
          </p>
        </div>

        <form onSubmit={submit} className="lg:grid lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start lg:gap-8 xl:gap-10">
          <div className="min-w-0 space-y-6">
            {/* Product */}
            <section className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                    course?.thumbnail.gradient ?? "from-primary/80 to-primary",
                  )}
                >
                  {CourseIcon ? (
                    <CourseIcon className="h-8 w-8 text-white/80" />
                  ) : (
                    <SiteLogo className="h-10 w-10 rounded" alt="" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground">
                    Accès complet à <strong>{productTitle}</strong>.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Paiement unique · accès immédiat après confirmation.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-success/15 px-2 py-1 text-[11px] font-bold text-success">
                  Inclus
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {courseSlug && course ? (
                  <div className="sm:col-span-2 rounded-2xl border border-primary/40 bg-primary/[0.06] p-4">
                    <p className="font-bold text-sm">{course.title}</p>
                    <p className="mt-1 text-2xl font-bold">{formatUsd(course.price)}</p>
                    {course.originalPrice > course.price && (
                      <span className="mt-1 inline-block rounded-md bg-success/15 px-1.5 py-0.5 text-[11px] font-bold text-success">
                        Économisez {formatUsd(course.originalPrice - course.price)}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Paiement unique · accès au cours</p>
                  </div>
                ) : (
                  (["premium", "vip"] as const).map((planId) => {
                    const option = planDetails[planId];
                    const active = selectedPlan === planId;
                    const orig = ORIGINAL_PRICES[planId];
                    const save = orig - option.price;

                    return (
                      <label
                        key={planId}
                        className={cn(
                          "cursor-pointer rounded-xl border p-4 transition-colors",
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                            : "border-border hover:border-primary/50",
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
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm">{option.name}</p>
                            <p className="mt-1 text-xl font-bold">{formatUsd(option.price)}</p>
                            {save > 0 && (
                              <span className="mt-1 inline-block rounded-md bg-success/15 px-1.5 py-0.5 text-[11px] font-bold text-success">
                                Économisez {formatUsd(save)}
                              </span>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Paiement unique · accès au cours</p>
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="mt-5 border-t border-border pt-5">
                <p className="text-sm font-bold mb-3">Ce qui est inclus :</p>
                <ul className="space-y-2">
                  {(courseSlug && course
                    ? [
                        "Accès complet au cours",
                        "Vidéos et ressources à vie",
                        "Support communauté BelKou",
                      ]
                    : plan.features
                  ).map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Personal info */}
            <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">Vos informations</h2>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  className="h-11 rounded-xl"
                  aria-invalid={Boolean(fieldErrors.full_name)}
                  aria-describedby={fieldErrors.full_name ? "checkout-full-name-error" : undefined}
                  required
                />
                {fieldErrors.full_name ? (
                  <p id="checkout-full-name-error" className="text-xs text-destructive" role="alert">
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
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "checkout-email-error" : undefined}
                    required
                  />
                  {fieldErrors.email ? (
                    <p id="checkout-email-error" className="text-xs text-destructive" role="alert">
                      {fieldErrors.email}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={form.whatsapp}
                    onChange={(e) => update("whatsapp", e.target.value)}
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(fieldErrors.whatsapp)}
                    aria-describedby={fieldErrors.whatsapp ? "checkout-whatsapp-error" : undefined}
                    required
                  />
                  {fieldErrors.whatsapp ? (
                    <p id="checkout-whatsapp-error" className="text-xs text-destructive" role="alert">
                      {fieldErrors.whatsapp}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Niveau</Label>
                <Select value={form.level} onValueChange={(v) => update("level", v)}>
                  <SelectTrigger
                    id="level"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(fieldErrors.level)}
                    aria-describedby={fieldErrors.level ? "checkout-level-error" : undefined}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Débutant</SelectItem>
                    <SelectItem value="intermediate">Intermédiaire</SelectItem>
                    <SelectItem value="advanced">Avancé</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.level ? (
                  <p id="checkout-level-error" className="text-xs text-destructive" role="alert">
                    {fieldErrors.level}
                  </p>
                ) : null}
              </div>
            </section>

            {/* Billing */}
            <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-lg font-semibold text-foreground">Adresse de facturation</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Select value={form.country} onValueChange={(v) => update("country", v)}>
                    <SelectTrigger
                      id="country"
                      className="h-11 rounded-xl"
                      aria-invalid={Boolean(fieldErrors.country)}
                      aria-describedby={fieldErrors.country ? "checkout-country-error" : undefined}
                    >
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HT">Haïti</SelectItem>
                      <SelectItem value="US">États-Unis</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="DO">République dominicaine</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="BE">Belgique</SelectItem>
                      <SelectItem value="CH">Suisse</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.country ? (
                    <p id="checkout-country-error" className="text-xs text-destructive" role="alert">
                      {fieldErrors.country}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-foreground">Moyen de paiement</h2>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  Sécurisé & chiffré
                </span>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-primary/70 bg-primary/5 p-4">
                <input type="radio" name="pay" checked readOnly className="accent-primary" />
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="font-semibold text-sm">Carte bancaire</p>
                  <p className="text-xs text-muted-foreground">Visa · Mastercard · Amex — via Stripe</p>
                </div>
              </label>

              <p className="rounded-md bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                Après validation, vous serez redirigé vers <strong>Stripe Checkout</strong> pour saisir votre
                carte en toute sécurité. BelKou ne stocke jamais vos données bancaires.
              </p>
              <p className="text-xs text-muted-foreground">
                Autres options : MonCash, Zelle, PayPal, virement — instructions par email si Stripe est
                indisponible.
              </p>
            </section>
          </div>

          {/* Summary sidebar */}
          <aside className="mt-8 lg:sticky lg:top-6 lg:mt-0">
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-md sm:p-6">
              <h2 className="mb-4 font-display text-lg font-semibold">Récapitulatif</h2>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {courseSlug && course ? course.title : `Plan ${plan.name}`}
                  </dt>
                  <dd className="font-medium">{formatUsd(pctOff > 0 ? displayOriginal : displayPrice)}</dd>
                </div>
                {pctOff > 0 && (
                  <div className="flex justify-between gap-4 text-success">
                    <dt>Promo (−{pctOff}%)</dt>
                    <dd>−{formatUsd(savings)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Taxes estimées</dt>
                  <dd>{formatUsd(0)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-bold">
                  <dt>Total</dt>
                  <dd>{formatUsd(displayPrice)}</dd>
                </div>
              </dl>

              <div className="mt-4">
                {!couponOpen ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/5"
                    onClick={() => setCouponOpen(true)}
                  >
                    Code parrainage
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="referral_code">Code affilié / promo</Label>
                    <Input
                      id="referral_code"
                      value={form.referral_code}
                      onChange={(e) => update("referral_code", e.target.value.toUpperCase())}
                      placeholder="CODE"
                      className="rounded-md font-mono uppercase"
                    />
                  </div>
                )}
              </div>

              <label className="mt-5 flex cursor-pointer gap-2 text-xs text-muted-foreground" htmlFor="accept-terms">
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
                  <Link to="/legal/cgv" className="text-primary underline">
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
                className="mt-5 h-12 w-full shadow-primary"
                aria-describedby={!acceptedTerms ? "checkout-submit-help" : undefined}
              >
                <Lock className="mr-1 h-4 w-4" />
                {loading ? "Redirection…" : "Payer et commencer"}
              </Button>
              <p id="checkout-submit-help" className="mt-2 text-center text-[11px] text-muted-foreground">
                Activez la case des conditions pour débloquer le paiement.
              </p>

              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Paiement sécurisé · accès personnel au cours acheté
              </p>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
