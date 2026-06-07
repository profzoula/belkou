import { Globe, Smartphone } from "lucide-react";

const appTypeLabels = [
  "App Fitness",
  "Suivi d'habitudes",
  "Galerie digitale",
  "Journal",
  "FinTech",
  "Films & séries",
  "Football",
  "Pariage foot",
] as const;

const appTemplates = [
  {
    name: "NutriTrack",
    category: "Santé & nutrition",
    image: "/images/app-nutritrack.png",
    alt: "Application mobile NutriTrack — scan alimentaire, calories et suivi du poids",
  },
  {
    name: "LinguaGo",
    category: "Apprentissage des langues",
    image: "/images/app-linguago.png",
    alt: "Application LinguaGo — flashcards, quiz et prononciation",
  },
  {
    name: "MoneyFlow",
    category: "Finance personnelle",
    image: "/images/app-moneyflow.png",
    alt: "Application MoneyFlow — budget, transactions et profil",
  },
  {
    name: "DreamLog",
    category: "Suivi du sommeil",
    image: "/images/app-dreamlog.png",
    alt: "Application DreamLog — suivi du sommeil et statistiques",
  },
  {
    name: "Mindful",
    category: "Méditation & bien-être",
    image: "/images/app-mindful.png",
    alt: "Application Mindful — méditation guidée et progression",
  },
  {
    name: "TaskPro",
    category: "Gestion de tâches",
    image: "/images/app-taskpro.png",
    alt: "Application TaskPro — tâches, catégories et productivité",
  },
] as const;

const webTemplates = [
  {
    name: "Admin Dashboard",
    category: "Back-office & analytics",
    image: "/images/website/web-dashboard.png",
    alt: "Dashboard SaaS — graphiques, ventes et analytics en temps réel",
  },
  {
    name: "Spark Cards",
    category: "FinTech & paiements",
    image: "/images/website/web-fintech.png",
    alt: "Landing page FinTech — cartes virtuelles, cashback et intégrations bancaires",
  },
  {
    name: "Creative Minds",
    category: "Galerie digitale",
    image: "/images/website/web-gallery.png",
    alt: "Plateforme créative — inspirations, collections et communauté",
  },
  {
    name: "Podcaster",
    category: "Site vitrine & contenu",
    image: "/images/website/web-podcast.png",
    alt: "Landing page podcast — épisodes, hôtes et abonnement",
  },
] as const;

function AppTypeLabels() {
  return (
    <div className="mb-8 sm:mb-10 flex flex-wrap justify-center gap-2">
      {appTypeLabels.map((label) => (
        <span
          key={label}
          className="rounded-full border border-border/80 bg-card/90 px-4 py-2 text-sm font-medium text-muted-foreground"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function AppTemplateCard({ template }: { template: (typeof appTemplates)[number] }) {
  return (
    <article className="surface surface-hover group overflow-hidden rounded-2xl min-w-0">
      <div className="border-b border-border/60 bg-muted/30 px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{template.category}</p>
          <h3 className="font-display text-base font-bold mt-0.5">{template.name}</h3>
        </div>
        <div className="icon-box h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          <Smartphone className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="p-3 sm:p-4 bg-gradient-to-b from-muted/20 to-background">
        <img
          src={template.image}
          alt={template.alt}
          loading="lazy"
          className="w-full h-auto rounded-xl ring-1 ring-border/50 shadow-sm transition-transform duration-300 group-hover:scale-[1.01]"
        />
      </div>
    </article>
  );
}

function WebTemplateCard({ template }: { template: (typeof webTemplates)[number] }) {
  return (
    <article className="surface surface-hover group overflow-hidden rounded-2xl min-w-0">
      <div className="border-b border-border/60 bg-muted/30 px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{template.category}</p>
          <h3 className="font-display text-base font-bold mt-0.5">{template.name}</h3>
        </div>
        <div className="icon-box h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          <Globe className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="p-3 sm:p-4 bg-gradient-to-b from-muted/20 to-background">
        <img
          src={template.image}
          alt={template.alt}
          loading="lazy"
          className="w-full h-auto rounded-xl ring-1 ring-border/50 shadow-sm transition-transform duration-300 group-hover:scale-[1.01]"
        />
      </div>
    </article>
  );
}

export function TemplateShowcase() {
  return (
    <section id="templates" className="section-divider py-16 sm:py-20 md:py-28 bg-gradient-mesh">
      <div className="site-container">
        <AppTypeLabels />

        <div className="mb-10 sm:mb-14">
          <div className="flex items-center gap-2 mb-5 sm:mb-6">
            <Smartphone className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Applications mobile</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {appTemplates.map((t) => (
              <AppTemplateCard key={t.name} template={t} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-5 sm:mb-6">
            <Globe className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Sites web & SaaS</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {webTemplates.map((t) => (
              <WebTemplateCard key={t.name} template={t} />
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10 sm:mt-12 max-w-lg mx-auto leading-relaxed">
          Fitness, habitudes, galeries, journaux, SaaS… vous apprendrez à générer et déployer ces types de produits avec
          Cursor, Replit et l&apos;IA.
        </p>
      </div>
    </section>
  );
}
