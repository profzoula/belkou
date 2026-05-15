import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ArrowLeft, Rocket } from "lucide-react";
import { toast } from "sonner";
import { submitRegistration } from "@/lib/registerFn";

const searchSchema = z.object({
  plan: z.enum(["basic", "premium", "vip"]).optional(),
});

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Enskripsyon — BelKou Formation" },
      { name: "description", content: "Enskri nan fòmasyon BelKou pou aprann kreye AI Apps ak SaaS." },
    ],
  }),
  validateSearch: searchSchema,
  component: RegisterPage,
});

const formSchema = z.object({
  full_name: z.string().trim().min(2, "Non twò kout").max(100),
  email: z.string().trim().email("Imèl pa valid").max(255),
  whatsapp: z.string().trim().min(6, "Nimewo pa valid").max(30),
  country: z.string().min(1, "Chwazi yon peyi"),
  level: z.string().min(1, "Chwazi yon nivo"),
  plan: z.string().min(1),
});

function RegisterPage() {
  const { plan } = Route.useSearch();
  const navigate = useNavigate();
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
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await submitRegistration({ data: parsed.data });
      navigate({ to: "/success", search: { plan: form.plan } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-6 pt-32 pb-20 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">S'inscrire</p>
          <h1 className="text-4xl md:text-5xl font-bold">Rejoignez la <span className="text-gradient">cohorte</span></h1>
          <p className="text-muted-foreground mt-3">Remplissez ce formulaire et vous recevrez le lien WhatsApp et les détails de paiement.</p>
        </div>

        <form onSubmit={submit} className="space-y-5 rounded-2xl bg-gradient-card border border-border p-6 md:p-8">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input id="full_name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Jean Pierre" />
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="vous@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="+33 6 12 34 56 78" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Pays</Label>
              <Select value={form.country} onValueChange={(v) => update("country", v)}>
                <SelectTrigger><SelectValue placeholder="Choisissez votre pays" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="BE">Belgique</SelectItem>
                  <SelectItem value="CH">Suisse</SelectItem>
                  <SelectItem value="LU">Luxembourg</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Niveau d'expérience</Label>
              <Select value={form.level} onValueChange={(v) => update("level", v)}>
                <SelectTrigger><SelectValue placeholder="Votre niveau" /></SelectTrigger>
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
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "basic", label: "Basic", price: "$29" },
                { id: "premium", label: "Premium", price: "$99" },
                { id: "vip", label: "VIP", price: "$299" },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => update("plan", p.id)}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    form.plan === p.id
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-sm text-gradient-orange font-bold">{p.price}</div>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={loading}>
            <Rocket /> {loading ? "Inscription en cours..." : "Compléter l'inscription"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Après avoir cliqué, vous serez redirigé vers la page de paiement et les détails de confirmation.
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
