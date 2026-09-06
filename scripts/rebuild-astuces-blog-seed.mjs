import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve("c:/Project/belkou");
const PROTO =
  "c:/Users/ZoulaTech/Desktop/1190-astuces-articles/data/prototype-001-010.mjs";
const TIPS =
  "c:/Users/ZoulaTech/Desktop/1190-astuces-articles/data/tips.json";

const { prototypeArticles } = await import(pathToFileURL(PROTO).href);
const tips = JSON.parse(fs.readFileSync(TIPS, "utf8"));
const tipById = new Map(tips.map((t) => [t.id, t]));

function nid() {
  return `blk_${Math.random().toString(36).slice(2, 10)}`;
}

function blocksFrom(article) {
  const blocks = [];
  // Pas de titre « Introduction » — on commence directement par le texte
  for (const p of article.introduction) {
    blocks.push({ id: nid(), type: "paragraph", content: p });
  }
  blocks.push({
    id: nid(),
    type: "heading",
    level: 2,
    content: "Pourquoi cette astuce est utile ?",
  });
  blocks.push({ id: nid(), type: "list", ordered: false, items: article.whyUseful });
  blocks.push({ id: nid(), type: "heading", level: 2, content: "Prérequis" });
  blocks.push({
    id: nid(),
    type: "list",
    ordered: false,
    items: article.prerequisites,
  });
  blocks.push({ id: nid(), type: "heading", level: 2, content: "Comment faire ?" });
  article.steps.forEach((s, i) => {
    blocks.push({
      id: nid(),
      type: "heading",
      level: 3,
      content: `Étape ${i + 1} — ${s.title}`,
    });
    blocks.push({ id: nid(), type: "paragraph", content: s.body });
  });
  if (article.code) {
    blocks.push({ id: nid(), type: "heading", level: 2, content: "Commande / Code" });
    if (article.originalCodeNote) {
      blocks.push({
        id: nid(),
        type: "callout",
        variant: "info",
        title: "Note",
        content: article.originalCodeNote,
      });
    }
    blocks.push({
      id: nid(),
      type: "code",
      content: article.code,
      language: article.codeLang || "text",
    });
    for (const p of article.codeExplanation || []) {
      blocks.push({ id: nid(), type: "paragraph", content: p });
    }
  }
  if (article.legalNotice) {
    blocks.push({
      id: nid(),
      type: "callout",
      variant: "warning",
      title: "Avertissement",
      content: article.legalNotice,
    });
  }
  if (article.tips?.length) {
    blocks.push({ id: nid(), type: "heading", level: 2, content: "Conseils" });
    blocks.push({ id: nid(), type: "list", ordered: false, items: article.tips });
  }
  if (article.commonErrors?.length) {
    blocks.push({ id: nid(), type: "heading", level: 2, content: "Erreurs fréquentes" });
    blocks.push({
      id: nid(),
      type: "list",
      ordered: false,
      items: article.commonErrors,
    });
  }
  if (article.faq?.length) {
    blocks.push({ id: nid(), type: "heading", level: 2, content: "FAQ" });
    blocks.push({ id: nid(), type: "faq", items: article.faq });
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

const posts = prototypeArticles.map((a, i) => {
  const src = tipById.get(a.id);
  return {
    id: `astuce_${String(a.id).padStart(4, "0")}`,
    tipId: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.metaDescription,
    category: "Windows",
    tags: a.tags,
    status: "published",
    publishedAt: `2026-08-${String(24 - i).padStart(2, "0")}`,
    updatedAt: new Date().toISOString(),
    authorName: "Mackenson Lundi",
    authorRole: "Fondateur BelKou",
    authorInitials: "ML",
    readMinutes: a.estimatedMinutes,
    difficulty: a.difficulty,
    featured: a.id === 1,
    trending: [1, 3, 9, 10].includes(a.id),
    coverGradient: gradients[i % gradients.length],
    coverLabel: `Astuce #${String(a.id).padStart(3, "0")}`,
    coverAlt: a.coverAlt,
    seoTitle: a.seoTitle,
    seoDescription: a.metaDescription,
    ogTitle: a.ogTitle,
    ogDescription: a.ogDescription,
    primaryKeyword: a.primaryKeyword,
    secondaryKeywords: a.secondaryKeywords,
    blocks: blocksFrom(a),
  };
});

const jsonPath = path.join(ROOT, "src/data/astuces-blog-seed.json");
fs.writeFileSync(jsonPath, JSON.stringify(posts, null, 2));
fs.writeFileSync(
  path.join(ROOT, "src/data/astuces-blog-seed.ts"),
  `import type { StoredBlogPost } from "@/lib/blog-blocks";\n\nexport const astucesBlogSeed = ${JSON.stringify(posts, null, 2)} as unknown as StoredBlogPost[];\n`,
);
console.log("OK", posts.length, "sans titre Introduction");
