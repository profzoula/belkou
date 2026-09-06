import { siteConfig } from "@/lib/site-config";

export type BlogCategory =
  | "Windows"
  | "Technologie"
  | "IA"
  | "Formation"
  | "Programmation"
  | "Live"
  | "Tutoriels"
  | "Actualités";

export type BlogAuthor = {
  name: string;
  initials: string;
  role: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: BlogAuthor;
  publishedAt: string;
  readMinutes: number;
  featured?: boolean;
  trending?: boolean;
  coverGradient: string;
  coverLabel: string;
  body: string[];
  htmlBody?: string;
  coverImageUrl?: string;
};

const founder: BlogAuthor = {
  name: siteConfig.founder.name,
  initials: "ML",
  role: "Fondateur BelKou",
};

export const blogCategories: BlogCategory[] = [
  "Windows",
  "Technologie",
  "IA",
  "Formation",
  "Programmation",
  "Live",
  "Tutoriels",
  "Actualités",
];

export const blogPosts: BlogPost[] = [
  {
    slug: "ia-transforme-travail-2026",
    title: "Comment l’IA transforme notre façon de travailler en 2026",
    excerpt:
      "L’IA n’est plus seulement un outil — elle devient un collègue. Voici comment les entreprises réorganisent équipes, budgets et recrutements.",
    category: "IA",
    author: founder,
    publishedAt: "2026-08-24",
    readMinutes: 8,
    featured: true,
    trending: true,
    coverGradient: "from-primary via-primary/80 to-[#7ed874]",
    coverLabel: "IA × Travail",
    body: [
      "En 2026, les entreprises qui prennent de l’avance traitent l’IA comme un membre de l’équipe, pas comme un gadget dans la stack technique.",
      "Chez BelKou, on le voit aussi en formation : les élèves qui maîtrisent Cursor, Claude et de bonnes pratiques produisent plus vite que ceux qui restent sur les tutos classiques.",
      "La première étape consiste à redéfinir les rôles. Au lieu de supprimer des postes, on change ce qu’une personne fait dans une journée : plus de décisions, moins de tâches répétitives.",
      "La deuxième étape, c’est le budget. Les équipes qui obtiennent des résultats investissent dans la formation et les outils, pas seulement dans des licences logicielles.",
      "La troisième étape, c’est le recrutement. Les compétences les plus précieuses aujourd’hui : clarté, jugement, et capacité à diriger un assistant IA sans perdre en qualité.",
    ],
  },
  {
    slug: "remote-equipes-globales",
    title: "Travail à distance et équipes globales : ce qui marche vraiment",
    excerpt:
      "Le recrutement distribué est passé d’un avantage à la norme. Les entreprises qui gagnent réécrivent leur manuel d’opération.",
    category: "Technologie",
    author: founder,
    publishedAt: "2026-08-23",
    readMinutes: 6,
    trending: true,
    coverGradient: "from-[#0045a8] to-primary",
    coverLabel: "Remote",
    body: [
      "Le remote ne veut pas dire « chacun fait ce qu’il veut ». Il exige un rythme, de la documentation et des réunions avec un objectif clair.",
      "Le remote est une vraie opportunité — si vous avez des compétences faciles à démontrer via portfolio et démos.",
      "Chez BelKou, les cours sont conçus pour que vous puissiez apprendre et travailler depuis là où vous êtes, sans bureau physique.",
    ],
  },
  {
    slug: "menaces-securite-equipes-2026",
    title: "10 menaces de sécurité qui frappent les équipes aujourd’hui",
    excerpt:
      "Du credential stuffing à la supply chain : les attaques qui pénètrent vraiment les entreprises modernes — et les contrôles qui les stoppent.",
    category: "Technologie",
    author: founder,
    publishedAt: "2026-08-22",
    readMinutes: 7,
    trending: true,
    coverGradient: "from-[#0d0f12] to-primary",
    coverLabel: "Sécurité",
    body: [
      "La plupart des brèches n’arrivent pas à cause d’un « hacker parfait ». Elles arrivent à cause de mots de passe faibles, du phishing et d’accès trop larges.",
      "Pour les élèves BelKou, on commence par les bases : reset de mot de passe PC, 2FA, et habitudes qui protègent votre compte.",
      "Ensuite, on passe aux pratiques pour les développeurs : ne pas mettre de clés API dans un dépôt, vérifier les dépendances, et limiter les droits admin.",
    ],
  },
  {
    slug: "javascript-tips-dev",
    title: "10 conseils JavaScript pour éliminer des bugs en silence",
    excerpt:
      "De petits détails du langage qui retirent toute une classe d’erreurs de votre code — sans nouveau framework.",
    category: "Programmation",
    author: founder,
    publishedAt: "2026-08-20",
    readMinutes: 6,
    trending: true,
    coverGradient: "from-[#f0d78c] to-primary",
    coverLabel: "JS",
    body: [
      "JavaScript pardonne beaucoup de choses — jusqu’au moment où il ne pardonne plus. Ces conseils aident à écrire un code plus prévisible.",
      "Utiliser `===`, éviter les mutations et choisir des noms clairs sont trois habitudes qui font gagner plus de temps que n’importe quelle librairie.",
      "Dans les cours BelKou, on mélange théorie et projets réels pour voir les erreurs avant qu’elles n’arrivent en production.",
    ],
  },
  {
    slug: "assistants-ia-ce-qui-change",
    title: "Assistants IA nouvelle génération : ce qui a vraiment changé",
    excerpt:
      "Contexte plus long, vrais outils, latence plus basse. Ce qui a changé sous le capot cette année.",
    category: "IA",
    author: founder,
    publishedAt: "2026-08-19",
    readMinutes: 7,
    coverGradient: "from-primary to-[#87b8ff]",
    coverLabel: "Assistants",
    body: [
      "Les assistants IA ne sont plus seulement du « chat ». Ils peuvent lire des fichiers, écrire du code et agir dans vos outils.",
      "L’essentiel pour vous : savoir donner un brief clair, vérifier les résultats et garder la responsabilité.",
      "BelKou enseigne à utiliser ces outils dans un workflow professionnel, pas dans un mode « copier-coller » improvisé.",
    ],
  },
  {
    slug: "obs-live-belkou",
    title: "OBS + BelKou Live : diffuser sans prise de tête",
    excerpt:
      "Comment connecter OBS, choisir YouTube ou HLS, et lancer un live gratuit ou payant sur BelKou.",
    category: "Live",
    author: founder,
    publishedAt: "2026-08-18",
    readMinutes: 5,
    coverGradient: "from-red-600 to-primary",
    coverLabel: "OBS Live",
    body: [
      "Le live est l’une des meilleures façons d’enseigner en temps réel. Mais beaucoup de personnes bloquent sur la configuration.",
      "Sur BelKou, vous pouvez lancer un Live gratuit via YouTube, ou un Live payant avec billet.",
      "La règle est simple : OBS envoie la vidéo, BelKou gère l’accès, et les élèves regardent sur le site.",
    ],
  },
  {
    slug: "portfolio-qui-obtient-des-reponses",
    title: "Construire un portfolio qui obtient des réponses",
    excerpt:
      "Structure, études de cas et performance — un plan pratique à terminer en un week-end.",
    category: "Tutoriels",
    author: founder,
    publishedAt: "2026-08-16",
    readMinutes: 8,
    coverGradient: "from-[#0045a8] via-primary to-[#7ed874]",
    coverLabel: "Portfolio",
    body: [
      "Un portfolio n’est pas une galerie de captures d’écran. C’est une histoire : problème, solution, résultat.",
      "Trois projets bien expliqués valent mieux que vingt liens sans contexte.",
      "Chez BelKou, chaque cours mène à un livrable que vous pouvez montrer — c’est ce qui ouvre des portes.",
    ],
  },
  {
    slug: "cloud-explique",
    title: "L’avenir du cloud computing, expliqué sans jargon",
    excerpt:
      "Runtimes edge, facturation à la demande, et le lent dégroupage de la stack hyperscaler.",
    category: "Actualités",
    author: founder,
    publishedAt: "2026-08-14",
    readMinutes: 6,
    coverGradient: "from-[#1a2744] to-primary",
    coverLabel: "Cloud",
    body: [
      "Le cloud ne disparaît pas — il change de forme. Vous payez ce que vous utilisez, et vous déployez plus près des utilisateurs.",
      "Pour créer une app rapidement, cela signifie : coût de démarrage plus bas, MVP en ligne plus vite.",
      "On montre ces pratiques de déploiement dans les cours BelKou, pas seulement la théorie.",
    ],
  },
  {
    slug: "comment-choisir-premier-cours",
    title: "Comment choisir votre premier cours BelKou",
    excerpt:
      "Gratuit ou payant, preview, niveau — un guide simple pour ne pas perdre de temps ni d’argent.",
    category: "Formation",
    author: founder,
    publishedAt: "2026-08-12",
    readMinutes: 5,
    coverGradient: "from-primary/90 to-[#0045a8]",
    coverLabel: "Guide",
    body: [
      "Commencez par un cours gratuit si vous avez besoin de confiance. Connectez-vous et entrez directement dans le lecteur.",
      "Pour un cours payant, regardez d’abord la preview gratuite. Si vous ne voyez pas la valeur en 5 minutes, n’achetez pas.",
      "Choisissez selon votre objectif : reset PC, OBS, IA ou construire une app — chaque chemin a une prochaine étape claire.",
    ],
  },
];

export function formatBlogDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getFeaturedPost(): BlogPost {
  return blogPosts.find((post) => post.featured) ?? blogPosts[0];
}

export function getSideFeaturedPosts(limit = 2): BlogPost[] {
  const featured = getFeaturedPost();
  return blogPosts.filter((post) => post.slug !== featured.slug).slice(0, limit);
}

export function getEditorPicks(limit = 8): BlogPost[] {
  const featured = getFeaturedPost();
  return blogPosts.filter((post) => post.slug !== featured.slug).slice(0, limit);
}

export function getLatestPosts(limit = 4): BlogPost[] {
  return [...blogPosts]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, limit);
}

export function getTrendingPosts(limit = 4): BlogPost[] {
  const trending = blogPosts.filter((post) => post.trending);
  return (trending.length ? trending : blogPosts).slice(0, limit);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}
