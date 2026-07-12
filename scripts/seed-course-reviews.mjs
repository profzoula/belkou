/**
 * Seed realistic course reviews (mostly Kreyòl) with varied counts per course.
 *
 * Usage:
 *   node scripts/seed-course-reviews.mjs
 *   node scripts/seed-course-reviews.mjs --dry-run
 *   node scripts/seed-course-reviews.mjs --force
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

const BASE_COURSES = [
  { slug: "apps-ia-cursor-claude", title: "Apps IA avec Cursor & Claude Code" },
];

/** Varied review counts per course — feels more organic on the site */
const REVIEW_COUNT_BY_SLUG = {
  "apps-ia-cursor-claude": 38,
  "koman-enstale-e-aktive-microsoft-office-365": 14,
  "koman-byen-metrize-obs-studio": 27,
};

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
  "Marie-Claire D.",
  "Jean-Pierre L.",
  "Nathalie R.",
  "Emmanuel G.",
  "Stéphanie M.",
  "Marc-Antoine B.",
  "Sherlyse P.",
  "David K.",
  "Claudine V.",
  "Roody J.",
  "Sophia T.",
  "Frantz N.",
  "Kimberly A.",
  "Patrick H.",
  "Louise C.",
  "James W.",
  "Mireille F.",
  "Ricardo S.",
  "Anne-Sophie D.",
  "Bryan O.",
  "Gislène M.",
  "Olivier P.",
  "Widelène L.",
  "Christian B.",
  "Jordana E.",
  "Junior M.",
  "Fabienne S.",
  "Wisly T.",
  "Geraldine P.",
  "Stanley B.",
  "Nadege C.",
  "Ronaldo F.",
  "Yolande G.",
  "Michel-Ange L.",
  "Carline J.",
  "Duckens R.",
  "Samara V.",
  "Bertrand N.",
];

const RATING_POOL = [
  5, 5, 5, 5, 5, 5, 5, 4, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 3, 5, 4, 5, 5, 5, 5, 4, 5, 5, 5, 4, 5, 5, 3, 5, 5, 4, 5,
];

const REVIEW_TEXTS = {
  "apps-ia-cursor-claude": [
    "Mwen te konn anyen nan kòd. Apre 3 semèn mwen gen yon ti app sou entènèt — mwen pa t kwè sa. Eksplikasyon sou Cursor ak Claude klè, san jargon.",
    "Modil sou prompt yo fè mwen ekonomize èdtan. Anvan mwen tap nenpòt bagay nan IA a, kounye a kòd la soti pi pwòp.",
    "Prof Zoula eksplike dousman lè sa nesesè. Mwen finalman konprann diferans ant frontend ak backend.",
    "Mwen swiv kou a aswè apre travay. Leçon yo kout, sa ede mwen avanse san dekouraje.",
    "Patie deploy sou Railway sove mwen — mwen te pè mete pwojè a sou entènèt. Premye app mwen lanse wikenn nan.",
    "Kontni ajou ak zouti nou itilize vre an 2026. Pa gen teyori mò, sèlman pratik.",
    "Forum kou a ede anpil lè ou bloke sou yon bug. Kominote aktif.",
    "Bon rapò kalite-pri. Mwen konpare ak lòt fòmasyon IA — isit nou bati yon vre pwojè.",
    "Preview gratis la konvenk mwen. Rès program lan kenbe pwomès li.",
    "Mwen itilize Cursor chak jou nan biwo kounye a. Kou a ban mwen yon metòd, pa sèlman tricks.",
    "Kèk leçon ta merite 2-3 minit plis sou erè komen, men globalman solid.",
    "Kòm grafis, mwen te vle kode pwòp landing page mwen. Misyon reyisi nan yon mwa.",
    "PDF modil build la itil pou revize. Mwen kenbe l ouvri pandan mwen kode.",
    "Bon intro TypeScript ak IA — mwen pa janm manyen typing anvan.",
    "Pitit gason 19 an mwen ak mwen swiv ansanm. Fòma pafè pou debutan motive.",
    "Leçon API a pèmèt mwen konekte Stripe sou side project mwen. Dirèk ak pratik.",
    "Pafwa son an varye ant videyo yo, men fond la ekselan.",
    "Mwen te kite twa fòmasyon YouTube anvan sa. Finalman yon parcours estriktire A rive Z.",
    "Ritm cohort la fè mwen fini — sinon mwen ta pwokastine ankò.",
    "Ti bémol : mwen ta renmen yon chapit bonus sou mobile. Sinon anyen pou di.",
    "Mwen te galere sou premye deploy la, men lè mwen reli leçon an sa mache. Sipò reponn vit.",
    "Kolèg yo mande kijan mwen soti yon prototype vit konsa. Mwen voye lyen BelKou ba yo.",
    "Klè, pwofesyonèl, an franse — ra pou kontni tech konsa.",
    "4 zetwal paske mwen tann plis leçon avanse, men baz la vrèman bon.",
    "Mèsi BelKou — premye app deploye, premye kliyan potansyèl. Sa chanje jwèt pou mwen ann Ayiti.",
    "Kou sa a fè mwen santi mwen ka bati yon SaaS menm si mwen pa dev.",
    "Mwen renmen fason yo montre erè yo epi kijan pou korije yo — pa sèlman demo pafè.",
    "Apre kou a mwen fè yon ti sit pou biznis fanmi mwen. Yo kwè mwen anboche yon dev.",
    "Cursor + Claude se konbinezon ki mache pou mwen. Metòd BelKou senp pou swiv.",
    "Mwen te gen dout sou pri a, men valè a pi gwo pase sa.",
    "Leçon sou fòm ak validasyon ede mwen anpil pou app kliyan mwen.",
    "3 zetwal sou yon videyo kote son te ba, men kontni an rete solid.",
    "Mwen rekòmande pou tout moun ki vle antre nan tech san pèdi tan.",
    "Kou a montre w kijan pou òganize pwojè a — pa sèlman kopye-kole kòd.",
    "Mwen fini 60% kou a deja e mwen gen de pwojè ki mache. Sa motive.",
    "Eksplikasyon sou env ak secrets an prod enpòtan anpil — mwen pa t konnen sa anvan.",
    "Bon melanj franse ak kreyòl nan kominote a, sa fè mwen konfòtab.",
    "Premye fwa mwen mete yon app sou Railway. Checklist lanse a saved my life.",
    "Mwen swete plis egzanp sou backend, men pou debutan sa a 5 zetwal.",
  ],
  "koman-enstale-e-aktive-microsoft-office-365": [
    "Mwen te achte Office san konnen kijan pou aktive l byen. Nan 20 minit tout te regle sou PC mwen.",
    "Videyo sou kreyasyon kont Microsoft anpeche anpil erè. Papa mwen 62 an reyisi premye esè.",
    "Trè pratik pou freelancer ki reenstale Windows souvan. Mwen kenbe kou a nan favori.",
    "Etap byen nimewote, pa gen saut. Ou wè egzakteman ki kote pou klike.",
    "Mwen finalman konprann diferans ant abònman ak lisans pèmanan. Personn pa t eksplike sa klè anvan.",
    "Itil tou pou konfigire Outlook sou telefòn — seksyon bonus apresye.",
    "Pri kòrèk pou sa li rezoud. Yon teknisyen ta faktire mwen pi chè.",
    "Pafè pou etidyan ki gen lisans campus. Aktivasyon san stress.",
    "Depanaj lè kòd la pa pase sove mwen — mwen te bloke depi de jou.",
    "Kout, efikas, san blabla. Se sa mwen te vle.",
    "Mwen pataje ak tout ekip admin mwen. Nou ekonomize tan chak semèn.",
    "Kalite videyo net, ou li meni Office san pwoblèm.",
    "4 zetwal : vèsyon Mac ta bon, men pati Windows la impeccable.",
    "Enstalasyon sou laptop HP neuf : zero pwoblèm gras ak kou a.",
    "Kouzen mwen nan Florid swiv a distans, pa gen souci. Kontni aksesib tout kote.",
  ],
  "koman-byen-metrize-obs-studio": [
    "Mwen te fè live Facebook ak ekran flou. Apre kou sa a, imaj net ak son pwòp — viewers yo remake tout swit.",
    "Jesyon sèn OBS te yon mistè pou mwen. Kounye a mwen switch ant kamera, ekran ak logo yon klik.",
    "Trè bon pou pastè ak animateur ki stream sèvis oswa evènman. Eksplikasyon adapte ak bezwen nou.",
    "Chapit micro + retire bri transfòme podcast mwen. Kalite studio ak ti bidjè.",
    "Mwen te eseye Streamlabs anvan — OBS ak kou sa a pi stable.",
    "Raccourci klavye nan leçon 4 fè mwen ekonomize tan an dirèk.",
    "Premye live Twitch reyisi san crash. Checklist lansman = lò.",
    "Yon ti dans nan kòmansman, men lè ou rewatch videyo yo tout vin logik.",
    "Prof montre reglaj pou koneksyon entènèt mwayen — enpòtan pou nou Karayib.",
    "Mwen ajoute overlays ak compte à rebours pou webinaire mwen. Plis pwofesyonèl lendemain.",
    "4 zetwal : mwen ta vle yon egzanp gaming, men pou prezantasyon se pafè.",
    "Green screen san green screen (IA) se te bluff. Mache pi byen pase mwen te panse.",
    "Son ak videyo pa t sync anvan — seksyon depanaj rezoud sa nan 5 minit.",
    "Elèv yo wè ekran mwen ak face cam klè. Config kopye mo pou mo.",
    "OBS te fè mwen pè ak tout fenèt yo. Kou a dekoupe tout bagay kalmman.",
    "Export MP4 lokal pou YouTube : kalite pi bon pase anrejistreman Zoom.",
    "Mwen itilize OBS pou fòmasyon peye kounye a. ROI imedya sou pri kou a.",
    "Kominote BelKou ede mwen chwazi kat capture — bon konsèy.",
    "3 zetwal sou yon leçon kote odyo te ba, men kontni solid.",
    "Streaming multi-platfòm eksplike san bullshit. Facebook + YouTube an menm tan, sa mache.",
    "Preset NVENC vs x264 finalman klè. PC pi ansyen mwen kenbe.",
    "Konpleman pafè si ou anime cohort sou entènèt. Sèn prezantatè + slides nickel.",
    "Mwen refè tout config OBS mwen ak modil avanse a. Zero lag depi.",
    "Tuto onèt : ou wè erè yo tou epi kijan pou korije, pa sèlman demo pafè.",
    "Mèsi — live BelKou mwen ak pwòp fòmasyon mwen gen menm nivo vizyèl.",
    "Mwen fè live legliz mwen kounye a san wont. Son ak videyo pwòp.",
    "Kou a montre w kijan pou teste anvan live — sa anpeche anbarasman.",
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
  const count = REVIEW_COUNT_BY_SLUG[course.slug];

  if (!texts?.length || !count) {
    throw new Error(`Missing review config for course: ${course.slug}`);
  }
  if (texts.length < count) {
    throw new Error(`Need ${count} review texts for ${course.slug}, only have ${texts.length}`);
  }

  return texts.slice(0, count).map((text, index) => ({
    id: randomUUID(),
    courseSlug: course.slug,
    authorEmail: `seed+${course.slug}+${index + 1}@reviews.belkou.local`,
    authorName: REVIEW_AUTHORS[index % REVIEW_AUTHORS.length],
    rating: RATING_POOL[index] ?? 5,
    text,
    createdAt: randomPastDate(index, count),
  }));
}

async function readJson(key, fallback) {
  const { data, error } = await sb.from("site_content").select("value").eq("key", key).maybeSingle();
  if (error || !data?.value) return fallback;
  return data.value;
}

async function writeJson(key, value) {
  const { error } = await sb.from("site_content").upsert(
    { key, value, updated_at: new Date().toISOString() },
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

  const store = { ...existingStore };
  const summaryBySlug = {};

  for (const course of courses) {
    const reviews = buildReviewsForCourse(course);
    store[course.slug] = reviews;
    summaryBySlug[course.slug] = summarizeReviews(reviews);
    console.log(`  ${course.slug}: ${reviews.length} avis, moyenne ${summaryBySlug[course.slug].rating}/5`);
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
  if (adminCourses.length) await writeJson(ADMIN_COURSES_KEY, adminCourses);
  if (overridesChanged) await writeJson(OVERRIDES_KEY, overrides);

  console.log("\nDone — Kreyòl reviews seeded with varied counts.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
