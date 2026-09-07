/**
 * Convertit des articles Markdown (modèle BelKou) en posts seed,
 * puis les fusionne avec les astuces existantes.
 *
 * Usage:
 *   node scripts/import-md-articles-to-seed.mjs "C:/Users/.../belkou-20-articles-ai"
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("c:/Project/belkou");
const SEED_JSON = path.join(ROOT, "src/data/astuces-blog-seed.json");
const SEED_TS = path.join(ROOT, "src/data/astuces-blog-seed.ts");

const inputDir = process.argv[2];
if (!inputDir || !fs.existsSync(inputDir)) {
  console.error("Usage: node scripts/import-md-articles-to-seed.mjs <dossier-md>");
  process.exit(1);
}

function nid() {
  return `blk_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(input) {
  return String(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function mapCategory(raw) {
  const c = String(raw || "").trim();
  if (/^ai$/i.test(c) || /intelligence artificielle/i.test(c)) return "IA";
  return c || "Technologie";
}

function mapTags(tags) {
  return (tags || []).map((t) => (/^ai$/i.test(String(t).trim()) ? "IA" : String(t).trim()));
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Frontmatter YAML manquant");
  const yaml = match[1];
  const body = match[2];
  const meta = {};
  let listKey = null;
  for (const line of yaml.split(/\r?\n/)) {
    if (/^\s+-\s+/.test(line) && listKey) {
      meta[listKey].push(line.replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, ""));
      continue;
    }
    listKey = null;
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val === "") {
      meta[key] = [];
      listKey = key;
      continue;
    }
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }
  return { meta, body };
}

function section(body, heading) {
  const re = new RegExp(
    `## ${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n## |$)`,
  );
  const m = body.match(re);
  return m ? m[1].trim() : "";
}

function paragraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, " ").replace(/\*\*/g, "").trim())
    .filter(Boolean)
    .filter((p) => !p.startsWith("##") && !p.startsWith("###"));
}

function bullets(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*]\s+/, "").replace(/\*\*/g, "").trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("`"));
}

function parseSteps(text) {
  const steps = [];
  const parts = text.split(/\r?\n### /).slice(1);
  for (const part of parts) {
    const lines = part.split(/\r?\n/);
    const titleLine = lines[0] || "";
    const title = titleLine.replace(/^Étape\s+\d+\s+[—–-]\s*/i, "").trim();
    const body = lines
      .slice(1)
      .join("\n")
      .trim()
      .replace(/\*\*/g, "");
    if (title && body) steps.push({ title, body });
  }
  return steps;
}

function parseFaq(text) {
  const items = [];
  const parts = text.split(/\r?\n### /).slice(1);
  for (const part of parts) {
    const lines = part.split(/\r?\n/);
    const q = (lines[0] || "").replace(/\?$/, "?").trim();
    const a = lines
      .slice(1)
      .join(" ")
      .replace(/\*\*/g, "")
      .trim();
    if (q && a) items.push({ q, a });
  }
  return items;
}

function parseCode(text) {
  const langMatch = text.match(/Langage\s*:\s*`([^`]+)`/i);
  const codeMatch = text.match(/````\w*\r?\n([\s\S]*?)````/);
  const explainSec = text.match(/### Explication du code\s*\r?\n([\s\S]*?)(?=\r?\n### |\r?\n## |$)/);
  const noteSec = text.match(/### Note\s*\r?\n([\s\S]*?)(?=\r?\n### |\r?\n## |$)/);
  return {
    lang: langMatch?.[1]?.trim() || "text",
    code: codeMatch?.[1]?.trim() || "",
    explanation: explainSec ? bullets(explainSec[1]) : [],
    note: noteSec
      ? noteSec[1]
          .trim()
          .replace(/\*\*/g, "")
          .replace(/\n+/g, " ")
      : "",
  };
}

function blocksFromMd(body) {
  const blocks = [];
  const intro = section(body, "Introduction");
  for (const p of paragraphs(intro)) {
    blocks.push({ id: nid(), type: "paragraph", content: p });
  }

  const why = section(body, "Pourquoi cette astuce est utile ?");
  if (why) {
    blocks.push({
      id: nid(),
      type: "heading",
      level: 2,
      content: "Pourquoi cette astuce est utile ?",
    });
    blocks.push({ id: nid(), type: "list", ordered: false, items: bullets(why) });
  }

  const prereq = section(body, "Prérequis");
  if (prereq) {
    blocks.push({ id: nid(), type: "heading", level: 2, content: "Prérequis" });
    blocks.push({ id: nid(), type: "list", ordered: false, items: bullets(prereq) });
  }

  const how = section(body, "Comment faire ?");
  if (how) {
    blocks.push({ id: nid(), type: "heading", level: 2, content: "Comment faire ?" });
    parseSteps(how).forEach((s, i) => {
      blocks.push({
        id: nid(),
        type: "heading",
        level: 3,
        content: `Étape ${i + 1} — ${s.title}`,
      });
      blocks.push({ id: nid(), type: "paragraph", content: s.body });
    });
  }

  const codeSec = section(body, "Commande / Code");
  if (codeSec) {
    const { lang, code, explanation, note } = parseCode(codeSec);
    blocks.push({ id: nid(), type: "heading", level: 2, content: "Commande / Code" });
    if (note) {
      blocks.push({
        id: nid(),
        type: "callout",
        variant: "info",
        title: "Note",
        content: note,
      });
    }
    if (code) {
      blocks.push({ id: nid(), type: "code", content: code, language: lang });
    }
    for (const line of explanation) {
      blocks.push({ id: nid(), type: "paragraph", content: line });
    }
  }

  const tips = section(body, "Conseils");
  if (tips) {
    blocks.push({ id: nid(), type: "heading", level: 2, content: "Conseils" });
    blocks.push({ id: nid(), type: "list", ordered: false, items: bullets(tips) });
  }

  const errors = section(body, "Erreurs fréquentes");
  if (errors) {
    blocks.push({ id: nid(), type: "heading", level: 2, content: "Erreurs fréquentes" });
    blocks.push({ id: nid(), type: "list", ordered: false, items: bullets(errors) });
  }

  const faq = section(body, "FAQ");
  if (faq) {
    const items = parseFaq(faq);
    if (items.length) {
      blocks.push({ id: nid(), type: "heading", level: 2, content: "FAQ" });
      blocks.push({ id: nid(), type: "faq", items });
    }
  }

  return blocks;
}

const gradients = [
  "from-primary via-primary/80 to-[#7ed874]",
  "from-[#0056D2] to-[#003d99]",
  "from-primary/90 to-[#7ed874]",
  "from-[#0c1520] to-primary",
  "from-[#0045a8] to-primary",
];

const files = fs
  .readdirSync(inputDir)
  .filter((f) => f.endsWith(".md"))
  .sort();

const existing = JSON.parse(fs.readFileSync(SEED_JSON, "utf8"));
const tipPosts = existing.filter((p) => String(p.id).startsWith("astuce_"));
const usedSlugs = new Set(tipPosts.map((p) => p.slug));

const iaPosts = files.map((file, index) => {
  const raw = fs.readFileSync(path.join(inputDir, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const n = index + 1;
  // Toujours dériver le slug du titre FR (les slugs source perdent souvent les accents).
  let slug = slugify(meta.title || meta.slug);
  if (!slug) slug = `article-ia-${n}`;
  if (usedSlugs.has(slug)) slug = `${slug}-${n}`;
  usedSlugs.add(slug);

  const day = Math.max(1, 28 - (n % 27));
  return {
    id: `ia_${String(n).padStart(4, "0")}`,
    tipId: 9000 + n,
    slug,
    title: meta.title,
    excerpt: meta.metaDescription || "",
    category: mapCategory(meta.category),
    tags: mapTags(Array.isArray(meta.tags) ? meta.tags : []),
    status: "published",
    publishedAt: `2026-09-${String(day).padStart(2, "0")}`,
    updatedAt: new Date().toISOString(),
    authorName: "Mackenson Lundi",
    authorRole: "Fondateur BelKou",
    authorInitials: "ML",
    readMinutes: Number(meta.estimatedMinutes) || 7,
    difficulty: meta.difficulty || "Débutant",
    featured: n === 1,
    trending: [1, 2, 5, 12, 19].includes(n),
    coverGradient: gradients[index % gradients.length],
    coverLabel: `IA #${String(n).padStart(2, "0")}`,
    coverAlt: meta.coverAlt || meta.title,
    seoTitle: meta.seoTitle || meta.title,
    seoDescription: meta.metaDescription || "",
    ogTitle: meta.ogTitle || meta.title,
    ogDescription: meta.ogDescription || meta.metaDescription || "",
    primaryKeyword: meta.primaryKeyword || "",
    secondaryKeywords: Array.isArray(meta.secondaryKeywords) ? meta.secondaryKeywords : [],
    blocks: blocksFromMd(body),
  };
});

// Un seul featured : garder l’astuce #1 si présente, sinon le 1er IA.
const merged = [...tipPosts, ...iaPosts].map((p) => ({
  ...p,
  featured: p.id === "astuce_0001" || (tipPosts.length === 0 && p.id === "ia_0001"),
}));

fs.writeFileSync(SEED_JSON, JSON.stringify(merged, null, 2));
fs.writeFileSync(
  SEED_TS,
  `import type { StoredBlogPost } from "@/lib/blog-blocks";\n\nexport const astucesBlogSeed = ${JSON.stringify(merged, null, 2)} as unknown as StoredBlogPost[];\n`,
);

console.log(
  `OK ${merged.length} posts (tips ${tipPosts.length} + IA ${iaPosts.length})`,
);
console.log(iaPosts.map((p) => `${p.id} ${p.slug}`).join("\n"));
