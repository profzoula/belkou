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
import { getPublicSiteDisplay } from "@/lib/fns/site-display";
import { SiteLogo } from "@/components/site/SiteLogo";
import { siteConfig } from "@/lib/site-config";
import { getStoredReferralCode, saveReferralCode } from "@/lib/referral-storage";
import { cn } from "@/lib/utils";
import { getCourseIcon } from "@/lib/course-icons";

type CheckoutPageProps = {
  plan?: PlanId;
  courseSlug?: string;
  refCode?: string;
};

const ORIGINAL_PRICES: Record<PlanId, number> = {
  premium: 399,
  vip: 490,
};

function discountPercent(price: number, original: number) {
  if (original <= price) return 0;
  return Math.round((1 - price / original) * 100);
}

export function CheckoutPage({ plan: initialPlan, courseSlug, refCode }: CheckoutPageProps) {
  const navigate = useNavigate();
  const submitFn = useServerFn(submitRegistration);
  const loadCourseFn = useServerFn(getPublicCourse);
  const siteDisplayFn = useServerFn(getPublicSiteDisplay);
  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [cohortStartDate, setCohortStartDate] = useState(siteConfig.cohortStartDate);
  const CourseIcon = courseSlug ? getCourseIcon(courseSlug) : null;

  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan ?? "premium");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
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
    void siteDisplayFn({})
      .then((result) => setCohortStartDate(result.cohortStartDate))
      .catch(() => undefined);
  }, [siteDisplayFn]);

  useEffect(() => {
    if (!courseSlug) {
      setCourse(null);
      return;
    }

    loadCourseFn({ data: { slug: courseSlug } })
      .then((loaded) => setCourse(loaded))
      .catch(() => setCourse(null));
  }, [courseSlug, loadCourseFn]);

  const plan = planDetails[selectedPlan];
  const coursePrice = course?.price;
  const courseOriginalPrice = course?.originalPrice;
  const displayPrice = courseSlug && course ? coursePrice! : plan.price;
  const displayOriginal = courseSlug && course ? courseOriginalPrice! : ORIGINAL_PRICES[selectedPlan];
  const savings = displayOriginal - displayPrice;
  const pctOff = discountPercent(displayPrice, displayOriginal);

  const update = (key: string, value: string) => setForm((s) => ({ ...s, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
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
      toast.error(parsed.error.issues[0].message);
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
    <div className="min-h-screen bg-[#f7f9fa]">
      <header className="border-b border-border bg-white">
        <div className="site-container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-sm">
            <SiteLogo className="h-8 w-8" alt="" />
            {siteConfig.name}
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Paiement sécurisé
          </span>
        </div>
      </header>

      <main className="site-container py-6 sm:py-8 lg:py-10 px-0 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8 px-4 sm:px-0">Checkout to start learning</h1>

        <form onSubmit={submit} className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 lg:items-start px-4 sm:px-0">
          <div className="space-y-6 min-w-0">
            {/* Product */}
            <section className="rounded border border-border bg-white p-5">
              <div className="flex gap-4">
                <div
                  className={cn(
                    "flex h-16 w-24 shrink-0 items-center justify-center rounded bg-gradient-to-br",
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
                    Accès complet à <strong>{productTitle}</strong>
                    {course ? "" : ", formation BelKou en cohorte"}.
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold text-emerald-700">Inclus</span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {courseSlug && course ? (
                  <div className="sm:col-span-2 rounded border border-primary bg-primary/5 p-4">
                    <p className="font-bold text-sm">{course.title}</p>
                    <p className="text-xl font-bold mt-1">${course.price}</p>
                    {course.originalPrice > course.price && (
                      <span className="inline-block mt-1 rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        Économisez ${course.originalPrice - course.price}
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
                          "cursor-pointer rounded border p-4 transition-colors",
                          active
                            ? "border-primary ring-1 ring-primary/40 bg-primary/5"
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
                            <p className="text-xl font-bold mt-1">${option.price}</p>
                            {save > 0 && (
                              <span className="inline-block mt-1 rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                Économisez ${save}
                              </span>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Paiement unique · accès cohorte</p>
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-border">
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
            <section className="rounded border border-border bg-white p-5 space-y-4">
              <h2 className="font-bold text-foreground">Vos informations</h2>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  className="rounded-md"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="rounded-md"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={form.whatsapp}
                    onChange={(e) => update("whatsapp", e.target.value)}
                    className="rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select value={form.level} onValueChange={(v) => update("level", v)}>
                  <SelectTrigger className="rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Débutant</SelectItem>
                    <SelectItem value="intermediate">Intermédiaire</SelectItem>
                    <SelectItem value="advanced">Avancé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* Billing */}
            <section className="rounded border border-border bg-white p-5 space-y-4">
              <h2 className="font-bold text-foreground">Billing address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={form.country} onValueChange={(v) => update("country", v)}>
                    <SelectTrigger className="rounded-md">
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HT">Haïti</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="DO">République dominicaine</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="BE">Belgique</SelectItem>
                      <SelectItem value="CH">Suisse</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded border border-border bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-foreground">Payment Method</h2>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure and encrypted
                </span>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded border-2 border-primary bg-primary/5 p-4">
                <input type="radio" name="pay" checked readOnly className="accent-primary" />
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="font-semibold text-sm">Carte bancaire</p>
                  <p className="text-xs text-muted-foreground">Visa · Mastercard · Amex — via Stripe</p>
                </div>
              </label>

              <p className="text-xs text-muted-foreground leading-relaxed rounded-md bg-muted/50 p-3">
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
          <aside className="mt-8 lg:mt-0 lg:sticky lg:top-6">
            <div className="rounded border border-border bg-white p-5 shadow-sm">
              <h2 className="font-bold text-lg mb-4">Summary</h2>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {courseSlug && course ? course.title : `Plan ${plan.name}`}
                  </dt>
                  <dd>${displayPrice}</dd>
                </div>
                {pctOff > 0 && (
                  <div className="flex justify-between gap-4 text-emerald-700">
                    <dt>Promo ({pctOff}% off)</dt>
                    <dd>-${savings}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Estimated tax</dt>
                  <dd>$0.00</dd>
                </div>
                <div className="flex justify-between gap-4 pt-3 border-t border-border text-base font-bold">
                  <dt>Total:</dt>
                  <dd>${displayPrice}</dd>
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

              <label className="mt-5 flex gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-border"
                />
                <span>
                  J&apos;accepte les{" "}
                  <Link to="/legal/cgv" className="text-primary underline">
                    conditions générales
                  </Link>
                  . Cohorte BelKou — début {cohortStartDate}. Pas de remboursement après paiement.
                </span>
              </label>

              <Button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="mt-5 w-full h-12 rounded-md bg-primary hover:bg-primary/90 text-base font-bold"
              >
                <Lock className="h-4 w-4 mr-2" />
                {loading ? "Redirection..." : "Complete purchase"}
              </Button>

              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Début cohorte : {cohortStartDate}
              </p>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
