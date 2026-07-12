/**
 * Seed 25 realistic course reviews per published course into site_content.
 *
 * Usage:
 *   node scripts/seed-course-reviews.mjs
 *   node scripts/seed-course-reviews.mjs --dry-run
 *   node scripts/seed-course-reviews.mjs --force   # replace existing reviews
 *
 * Requires VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .dev.vars
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const REVIEWS_KEY = "course_reviews";
const ADMIN_COURSES_KEY = "admin_courses";
const OVERRIDES_KEY = "course_overrides";
const REVIEWS_PER_COURSE = 25;

const BASE_COURSES = [
  {
    slug: "apps-ia-cursor-claude",
    title: "Apps IA avec Cursor & Claude Code",
  },
];

function loadDevVars() {
  const path = join(root, ".dev.vars");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadDevVars();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

if (!url || !key) {
  console.error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .dev.vars");
  process.exit(1);
}

const sb = createClient(url, key);

const REVIEW_AUTHORS = [
  { name: "Marie-Claire D.", country: "Montréal" },
  { name: "Jean-Pierre L.", country: "Port-au-Prince" },
  { name: "Nathalie R.", country: "Paris" },
  { name: "Emmanuel G.", country: "Miami" },
  { name: "Stéphanie M.", country: "Bruxelles" },
  { name: "Marc-Antoine B.", country: "Québec" },
  { name: "Sherlyse P.", country: "New York" },
  { name: "David K.", country: "Lyon" },
  { name: "Claudine V.", country: "Gonaïves" },
  { name: "Roody J.", country: "Boston" },
  { name: "Sophia T.", country: "Genève" },
  { name: "Frantz N.", country: "Cap-Haïtien" },
  { name: "Kimberly A.", country: "Atlanta" },
  { name: "Patrick H.", country: "Toulouse" },
  { name: "Louise C.", country: "Ottawa" },
  { name: "James W.", country: "Chicago" },
  { name: "Mireille F.", country: "Jacmel" },
  { name: "Ricardo S.", country: "Orlando" },
  { name: "Anne-Sophie D.", country: "Nantes" },
  { name: "Bryan O.", country: "New Jersey" },
  { name: "Gislène M.", country: "Liège" },
  { name: "Olivier P.", country: "Fort-de-France" },
  { name: "Widelène L.", country: "Les Cayes" },
  { name: "Christian B.", country: "Dallas" },
  { name: "Jordana E.", country: "Bordeaux" },
];

/** Ratings: mostly 5★, a few 4★ and 2× 3★ for realism */
const RATING_PATTERN = [
  5, 5, 5, 5, 5, 5, 5, 5, 4, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 3, 5, 4, 5, 5,
];

const REVIEW_TEXTS = {
  "apps-ia-cursor-claude": [
    "Je partais de zéro en code. Après 3 semaines j'ai une petite app en ligne — je n'y croyais pas. Les explications sur Cursor et Claude sont claires, pas de jargon inutile.",
    "Le module sur les prompts m'a fait gagner des heures. Avant je tapais n'importe quoi dans l'IA, maintenant je structure mes demandes et le code sort beaucoup plus propre.",
    "Prof Zoula explique lentement quand il faut, sans infantiliser. J'ai enfin compris la différence entre frontend et backend grâce aux démos pas à pas.",
    "J'ai suivi le cours le soir après le travail. Les leçons courtes m'ont permis d'avancer régulièrement sans me décourager.",
    "La partie déploiement sur Railway m'a sauvé — j'avais peur de la mise en ligne. Checklist claire, j'ai publié mon premier projet le week-end.",
    "Contenu à jour avec les outils qu'on utilise vraiment en 2026. Pas de théorie morte, que du concret.",
    "Le forum du cours aide beaucoup quand on bloque sur un bug. Communauté active et bienveillante.",
    "Bon rapport qualité-prix. J'ai comparé avec d'autres formations IA — ici on construit un vrai projet, pas juste des slides.",
    "Les previews gratuites m'ont convaincu. Le reste du programme tient ses promesses.",
    "J'utilise Cursor tous les jours au bureau maintenant. Ce cours m'a donné une méthode, pas seulement des astuces.",
    "Quelques leçons mériteraient 2–3 minutes de plus sur les erreurs courantes, mais globalement très solide.",
    "En tant que graphiste, je voulais coder mes propres landing pages. Mission accomplie en un mois.",
    "Les ressources PDF du module build sont utiles pour réviser. Je les garde ouverts pendant que je code.",
    "Excellente intro à TypeScript via l'IA — je n'avais jamais touché au typage avant.",
    "Mon fils de 19 ans et moi avons suivi ensemble. Format parfait pour débutants motivés.",
    "La leçon sur les API m'a permis de brancher Stripe sur mon side project. Tutoriel direct et applicable.",
    "Parfois le son varie un peu entre les vidéos, mais le fond est excellent.",
    "J'ai arrêté trois formations YouTube avant celle-ci. Enfin un parcours structuré de A à Z.",
    "Le rythme cohorte m'a forcé à finir — sinon j'aurais procrastiné encore des mois.",
    "Petit bémol : j'aurais aimé un chapitre bonus sur mobile. Sinon rien à redire.",
    "Honnêtement, j'ai galéré sur le premier déploiement, mais en relisant la leçon ça a marché. Support réactif.",
    "Mes collègues me demandent comment j'ai sorti un prototype si vite. Je leur ai envoyé le lien BelKou.",
    "Clair, professionnel, en français — rare pour ce type de contenu tech.",
    "4 étoiles parce que j'attends encore plus de leçons avancées, mais la base est vraiment très bonne.",
    "Merci BelKou — première app déployée, premier client potentiel. Ça change la donne pour moi en Haïti.",
  ],
  "koman-enstale-e-aktive-microsoft-office-365": [
    "J'avais acheté Office sans savoir l'activer correctement. En 20 minutes tout était réglé sur mon PC — explications simples.",
    "La vidéo sur la création du compte Microsoft évite plein d'erreurs. Mon père de 62 ans a réussi du premier coup.",
    "Très pratique pour les freelances qui réinstallent Windows souvent. Je garde le cours en favori.",
    "Étapes bien numérotées, pas de saut. On voit exactement où cliquer.",
    "J'ai enfin compris la différence entre abonnement et licence permanente. Personne ne m'avait expliqué ça clairement avant.",
    "Utile aussi pour configurer Outlook sur le téléphone — section bonus appréciée.",
    "Prix correct pour ce que ça dépanne. Un technicien m'aurait facturé bien plus cher.",
    "Quelques termes en anglais à l'écran mais le narrateur explique tout en français.",
    "Parfait pour les étudiants qui ont une licence campus. Activation sans stress.",
    "Le dépannage quand le code ne passe pas m'a sauvé — j'étais bloqué depuis deux jours.",
    "Court, efficace, sans blabla. C'est ce que je voulais.",
    "J'ai partagé avec toute mon équipe admin. On gagne du temps chaque semaine.",
    "La qualité vidéo est nette, on lit les menus Office sans problème.",
    "Je recommande avant d'acheter Office sur un site douteux — évite les mauvaises surprises.",
    "4 étoiles : une version Mac serait un plus, mais la partie Windows est impeccable.",
    "Installation sur laptop neuf HP : zéro accroc grâce au cours.",
    "Explications sur OneDrive en plus d'Office — bonne valeur ajoutée.",
    "Mon cousin en Floride a suivi à distance, aucun souci. Contenu accessible partout.",
    "Support BelKou a répondu vite quand ma clé était déjà utilisée. Pro.",
    "Franchement, je pensais que c'était trop basique — en fait il manque toujours ce genre de tuto bien fait.",
    "Section réactivation après changement de disque dur : exactement ce qu'il me fallait.",
    "3 étoiles car je voulais plus de détails sur Teams, mais pour Word/Excel c'est top.",
    "Format idéal pour envoyé aux nouveaux employés avant leur premier jour.",
    "Bien expliqué pour quelqu'un qui n'est pas du tout à l'aise avec l'informatique.",
    "Office activé, Word ouvert, cloud synchronisé. Objectif atteint en une soirée.",
  ],
  "koman-byen-metrize-obs-studio": [
    "Je faisais des lives Facebook avec l'écran flou. Après ce cours, image nette et son propre — mes viewers ont tout de suite remarqué.",
    "La gestion des scènes OBS était un mystère pour moi. Maintenant je switch entre caméra, écran et logo en un clic.",
    "Très bon pour les pasteurs et animateurs qui streament les cultos ou événements. Explications adaptées à nos besoins.",
    "Le chapitre micro + suppression du bruit a transformé mes podcasts. Qualité studio avec un petit budget.",
    "J'ai testé Streamlabs avant — OBS avec ce cours est plus stable et personnalisable.",
    "Les raccourcis clavier enregistrés dans la leçon 4 me font gagner un temps fou en direct.",
    "Premier live Twitch réussi sans crash. Checklist de lancement du cours = or.",
    "Un peu dense au début, mais en repassant les vidéos tout devient logique.",
    "Prof montre les réglages pour connexion internet moyenne — important pour nous en Caraïbes.",
    "J'ai ajouté overlays et compte à rebours pour mes webinaires. Plus professionnel du jour au lendemain.",
    "4 étoiles : j'aurais voulu un exemple gaming, mais pour présentations et talks c'est parfait.",
    "Le filtre green screen sans green screen (IA) m'a bluffé. Fonctionne mieux que prévu.",
    "Son et vidéo désynchronisés avant — section dépannage a réglé ça en 5 minutes.",
    "Mes élèves voient clairement mon écran et ma face cam. Config copiée mot pour mot.",
    "OBS me faisait peur avec toutes les fenêtres. Le cours décompose tout calmement.",
    "Export MP4 en local pour YouTube : qualité bien meilleure que l'enregistrement natif de Zoom.",
    "J'utilise OBS pour des formations payantes maintenant. ROI immédiat sur le prix du cours.",
    "Communauté BelKou m'a aidé à choisir une carte capture — bon conseil.",
    "3 étoiles sur une leçon où l'audio était un peu bas, mais le contenu reste solide.",
    "Streaming multi-plateforme expliqué sans bullshit. Facebook + YouTube en même temps, ça marche.",
    "Les presets NVENC vs x264 sont enfin clairs. Mon PC plus ancien tient le coup.",
    "Parfait complément si vous animez des cohortes en ligne. Scène présentateur + slides nickel.",
    "J'ai refait toute ma config OBS en suivant le module avancé. Zéro lag depuis.",
    "Tuto honnête : on voit aussi les erreurs et comment les corriger, pas juste la démo parfaite.",
    "Merci — mes lives BelKou et mes propres formations ont enfin le même niveau visuel.",
  ],
};

function randomPastDate(index, total) {
  const end = new Date("2026-06-01T12:00:00Z").getTime();
  const start = new Date("2025-09-15T08:00:00Z").getTime();
  const slot = (end - start) / total;
  const jitter = Math.floor(Math.random() * slot * 0.6);
  return new Date(start + index * slot + jitter).toISOString();
}

function summarizeReviews(reviews) {
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return {
    rating: Math.round((sum / reviews.length) * 10) / 10,
    ratingsCount: reviews.length,
  };
}

function buildReviewsForCourse(course) {
  const texts = REVIEW_TEXTS[course.slug];
  if (!texts || texts.length < REVIEWS_PER_COURSE) {
    throw new Error(`Missing review copy for course: ${course.slug}`);
  }

  return texts.slice(0, REVIEWS_PER_COURSE).map((text, index) => {
    const author = REVIEW_AUTHORS[index];
    const rating = RATING_PATTERN[index] ?? 5;
    return {
      id: randomUUID(),
      courseSlug: course.slug,
      authorEmail: `seed+${course.slug}+${index + 1}@reviews.belkou.local`,
      authorName: author.name,
      rating,
      text: `${text}`,
      createdAt: randomPastDate(index, REVIEWS_PER_COURSE),
    };
  });
}

async function readJson(key, fallback) {
  const { data, error } = await sb.from("site_content").select("value").eq("key", key).maybeSingle();
  if (error || !data?.value) return fallback;
  return data.value;
}

async function writeJson(key, value) {
  const { error } = await sb.from("site_content").upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) throw new Error(`${key}: ${error.message}`);
}

async function main() {
  const adminCourses = await readJson(ADMIN_COURSES_KEY, []);
  const allCourses = [
    ...BASE_COURSES,
    ...adminCourses.map((course) => ({ slug: course.slug, title: course.title })),
  ];

  const unique = new Map();
  for (const course of allCourses) {
    if (!unique.has(course.slug)) unique.set(course.slug, course);
  }
  const courses = [...unique.values()];

  console.log(`Courses to seed: ${courses.map((c) => c.slug).join(", ")}`);

  const existingStore = await readJson(REVIEWS_KEY, {});
  const hasExisting = courses.some((course) => (existingStore[course.slug] ?? []).length > 0);

  if (hasExisting && !force) {
    console.error("Reviews already exist. Use --force to replace.");
    process.exit(1);
  }

  const store = force ? { ...existingStore } : { ...existingStore };
  const summaryBySlug = {};

  for (const course of courses) {
    const reviews = buildReviewsForCourse(course);
    store[course.slug] = reviews;
    summaryBySlug[course.slug] = summarizeReviews(reviews);
    console.log(
      `  ${course.slug}: ${reviews.length} avis, moyenne ${summaryBySlug[course.slug].rating}/5`,
    );
  }

  const overrides = await readJson(OVERRIDES_KEY, {});
  let overridesChanged = false;

  for (const [slug, summary] of Object.entries(summaryBySlug)) {
    if (BASE_COURSES.some((course) => course.slug === slug)) {
      overrides[slug] = {
        ...(overrides[slug] ?? {}),
        meta: {
          ...((overrides[slug] ?? {}).meta ?? {}),
          rating: summary.rating,
          ratingsCount: summary.ratingsCount,
        },
      };
      overridesChanged = true;
      continue;
    }

    const index = adminCourses.findIndex((course) => course.slug === slug);
    if (index !== -1) {
      adminCourses[index] = {
        ...adminCourses[index],
        rating: summary.rating,
        ratingsCount: summary.ratingsCount,
      };
    }
  }

  if (dryRun) {
    console.log("\n[dry-run] Would write course_reviews + update ratings.");
    return;
  }

  await writeJson(REVIEWS_KEY, store);
  if (adminCourses.length) {
    await writeJson(ADMIN_COURSES_KEY, adminCourses);
  }
  if (overridesChanged) {
    await writeJson(OVERRIDES_KEY, overrides);
  }

  console.log("\nDone — reviews seeded and course ratings updated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
