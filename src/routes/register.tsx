import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ArrowLeft, Rocket, Monitor, BookOpen, Check } from "lucide-react";
import { toast } from "sonner";
import { submitRegistration } from "@/lib/registerFn";

const searchSchema = z.object({
  plan: z.string().optional(),
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

const requirements = [
  { icon: Monitor,   label: "Un PC ou ordinateur portable est obligatoire" },
  { icon: BookOpen,  label: "Le livre (eBook) sera acheté ensemble durant le cours" },
];

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    whatsapp: "",
    country: "",
    level: "",
    plan: "premium",
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
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        {/* Header */}
        <div className="mb-8">
          <span className="chip mb-3 inline-flex">Inscription</span>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Rejoignez la <span className="text-gradient">cohorte</span>
          </h1>
          <p className="text-muted-foreground">
            Remplissez ce formulaire — vous recevrez les détails de paiement et le lien WhatsApp par email.
          </p>
        </div>

        {/* Price summary */}
        <div className="mb-6 rounded-2xl border-2 border-primary/50 bg-primary/6 px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Formation BelKou — Accès complet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Paiement unique · Accès à vie · Zoom 2× / semaine</p>
          </div>
          <div className="shrink-0 text-3xl font-display font-bold text-gradient-orange">$199</div>
        </div>

        {/* Requirements notice */}
        <div className="mb-6 rounded-xl border border-border/60 bg-gradient-card p-4 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Ce qu'il vous faut</p>
          {requirements.map((r) => (
            <div key={r.label} className="flex items-start gap-3 text-sm">
              <div className="h-5 w-5 rounded-full bg-primary/15 border border-primary/30 grid place-items-center shrink-0 mt-0.5">
                <r.icon className="h-3 w-3 text-primary" />
              </div>
              <span className="text-foreground/85">{r.label}</span>
            </div>
          ))}
        </div>

        {/* Form */}
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
                  {/* Caraïbes */}
                  <SelectItem value="HT">🇭🇹 Haïti</SelectItem>
                  <SelectItem value="GP">🇬🇵 Guadeloupe</SelectItem>
                  <SelectItem value="MQ">🇲🇶 Martinique</SelectItem>
                  <SelectItem value="GF">🇬🇫 Guyane française</SelectItem>
                  <SelectItem value="RE">🇷🇪 La Réunion</SelectItem>
                  <SelectItem value="DO">🇩🇴 République Dominicaine</SelectItem>
                  <SelectItem value="CU">🇨🇺 Cuba</SelectItem>
                  <SelectItem value="JM">🇯🇲 Jamaïque</SelectItem>
                  <SelectItem value="TT">🇹🇹 Trinidad et Tobago</SelectItem>
                  {/* Afrique francophone */}
                  <SelectItem value="SN">🇸🇳 Sénégal</SelectItem>
                  <SelectItem value="CI">🇨🇮 Côte d'Ivoire</SelectItem>
                  <SelectItem value="CM">🇨🇲 Cameroun</SelectItem>
                  <SelectItem value="ML">🇲🇱 Mali</SelectItem>
                  <SelectItem value="BF">🇧🇫 Burkina Faso</SelectItem>
                  <SelectItem value="GN">🇬🇳 Guinée</SelectItem>
                  <SelectItem value="TG">🇹🇬 Togo</SelectItem>
                  <SelectItem value="BJ">🇧🇯 Bénin</SelectItem>
                  <SelectItem value="NE">🇳🇪 Niger</SelectItem>
                  <SelectItem value="CD">🇨🇩 Congo (RDC)</SelectItem>
                  <SelectItem value="CG">🇨🇬 Congo (Brazzaville)</SelectItem>
                  <SelectItem value="GA">🇬🇦 Gabon</SelectItem>
                  <SelectItem value="MG">🇲🇬 Madagascar</SelectItem>
                  <SelectItem value="MU">🇲🇺 Maurice</SelectItem>
                  <SelectItem value="DZ">🇩🇿 Algérie</SelectItem>
                  <SelectItem value="MA">🇲🇦 Maroc</SelectItem>
                  <SelectItem value="TN">🇹🇳 Tunisie</SelectItem>
                  {/* Europe */}
                  <SelectItem value="FR">🇫🇷 France</SelectItem>
                  <SelectItem value="BE">🇧🇪 Belgique</SelectItem>
                  <SelectItem value="CH">🇨🇭 Suisse</SelectItem>
                  <SelectItem value="LU">🇱🇺 Luxembourg</SelectItem>
                  {/* Amérique du Nord */}
                  <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                  <SelectItem value="US">🇺🇸 États-Unis</SelectItem>
                  <SelectItem value="MX">🇲🇽 Mexique</SelectItem>
                  {/* Amérique du Sud */}
                  <SelectItem value="BR">🇧🇷 Brésil</SelectItem>
                  <SelectItem value="CO">🇨🇴 Colombie</SelectItem>
                  <SelectItem value="VE">🇻🇪 Venezuela</SelectItem>
                  {/* Autre */}
                  <SelectItem value="OTHER">🌍 Autre</SelectItem>
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary text-primary-foreground shadow-glow font-semibold rounded-xl h-12 text-base hover:opacity-90 transition-opacity gap-2"
          >
            <Rocket className="h-4 w-4" />
            {loading ? "Inscription en cours..." : "Compléter l'inscription — $199"}
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            {["Remboursement 7 jours", "Accès immédiat", "Support WhatsApp"].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary/70" /> {t}
              </div>
            ))}
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
