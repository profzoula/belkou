import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { registrationSchema } from "@/lib/schemas/registration";
import { submitRegistration } from "@/lib/fns/register";
import { planDetails } from "@/lib/plans";
import { seoHead } from "@/lib/seo";
import { PlanDetailsCard } from "@/components/site/PlanDetailsCard";

const searchSchema = z.object({
  plan: z.enum(["premium", "vip"]).optional(),
});

export const Route = createFileRoute("/register")({
  head: () =>
    seoHead({
      title: "Inscription — BelKou",
      description:
        "Inscrivez-vous à la formation BelKou : apprenez à créer, lancer et vendre votre premier produit digital avec l'IA. Plans Premium et VIP.",
      path: "/register",
    }),
  validateSearch: searchSchema,
  component: RegisterPage,
});

function RegisterPage() {
  const { plan } = Route.useSearch();
  const navigate = useNavigate();
  const submitFn = useServerFn(submitRegistration);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    whatsapp: "",
    country: "",
    level: "",
    plan: plan ?? "premium",
  });

  const update = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registrationSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const result = await submitFn({ data: parsed.data });

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      navigate({
        to: "/success",
        search: {
          registrationId: result.registrationId,
          plan: result.plan,
          manual: result.manualPayment ? "1" : undefined,
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("L'inscription a échoué. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-container site-page-top pb-12 sm:pb-16 max-w-5xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="mb-8">
          <p className="section-label mb-3">Inscription</p>
          <h1 className="text-2xl md:text-3xl font-semibold">Rejoignez la cohorte</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Remplissez ce formulaire. Vous recevrez les instructions de paiement par email.
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,340px)_1fr] gap-6 lg:gap-8 items-start">
          <PlanDetailsCard
            planId={form.plan}
            className="hidden lg:block lg:sticky lg:top-24"
          />

          <form onSubmit={submit} className="space-y-5 surface rounded-2xl p-4 sm:p-6 md:p-8 min-w-0">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input id="full_name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Jean Pierre" className="rounded-lg" />
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="vous@email.com" className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="+509 3X XX XX XX" className="rounded-lg" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Pays</Label>
              <Select value={form.country} onValueChange={(v) => update("country", v)}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Choisissez votre pays" /></SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label>Niveau d'expérience</Label>
              <Select value={form.level} onValueChange={(v) => update("level", v)}>
                <SelectTrigger className="rounded-lg"><SelectValue placeholder="Votre niveau" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Plan</Label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: "premium" as const, label: planDetails.premium.name, price: `$${planDetails.premium.price}` },
                  { id: "vip" as const, label: planDetails.vip.name, price: `$${planDetails.vip.price}` },
                ] as const
              ).map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => update("plan", p.id)}
                  className={`rounded-xl border p-3.5 text-center transition-all ${
                    form.plan === p.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="font-semibold text-sm">{p.label}</div>
                  <div className={`text-sm font-semibold mt-0.5 ${form.plan === p.id ? "text-primary" : "text-muted-foreground"}`}>
                    {p.price}
                  </div>
                </button>
              ))}
            </div>
            <PlanDetailsCard planId={form.plan} className="lg:hidden mt-3" />
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full touch-target" disabled={loading}>
            {loading ? "Inscription en cours..." : "Compléter l'inscription"} <ArrowRight />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Pas de remboursement. Vérifiez vos informations avant de soumettre.
          </p>
        </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
