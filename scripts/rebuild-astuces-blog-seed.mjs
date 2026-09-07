import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve("c:/Project/belkou");
const DESKTOP_DATA = "c:/Users/ZoulaTech/Desktop/1190-astuces-articles/data";
const PROTO_A = path.join(DESKTOP_DATA, "prototype-001-010.mjs");
const PROTO_B = path.join(DESKTOP_DATA, "prototype-011-020.mjs");
const PROTO_C = path.join(DESKTOP_DATA, "prototype-021-030.mjs");
const PROTO_D = path.join(DESKTOP_DATA, "prototype-031-040.mjs");
const PROTO_E = path.join(DESKTOP_DATA, "prototype-041-050.mjs");
const PROTO_F = path.join(DESKTOP_DATA, "prototype-051-060.mjs");
const PROTO_G = path.join(DESKTOP_DATA, "prototype-061-070.mjs");
const TIPS = path.join(DESKTOP_DATA, "tips.json");

const { prototypeArticles } = await import(pathToFileURL(PROTO_A).href);
const { prototypeArticles011020 } = await import(pathToFileURL(PROTO_B).href);
const { prototypeArticles021030 } = await import(pathToFileURL(PROTO_C).href);
const { prototypeArticles031040 } = await import(pathToFileURL(PROTO_D).href);
const { prototypeArticles041050 } = await import(pathToFileURL(PROTO_E).href);
const { prototypeArticles051060 } = await import(pathToFileURL(PROTO_F).href);
const { prototypeArticles061070 } = await import(pathToFileURL(PROTO_G).href);
const tips = JSON.parse(fs.readFileSync(TIPS, "utf8"));
const tipById = new Map(tips.map((t) => [t.id, t]));

const allArticles = [
  ...prototypeArticles,
  ...prototypeArticles011020,
  ...prototypeArticles021030,
  ...prototypeArticles031040,
  ...prototypeArticles041050,
  ...prototypeArticles051060,
  ...prototypeArticles061070,
].sort((a, b) => a.id - b.id);

function nid() {
  return `blk_${Math.random().toString(36).slice(2, 10)}`;
}

function blocksFrom(article) {
  const blocks = [];
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

const posts = allArticles.map((a, i) => {
  tipById.get(a.id); // ensure tip exists in source catalog
  const day = Math.max(1, 24 - (a.id - 1));
  return {
    id: `astuce_${String(a.id).padStart(4, "0")}`,
    tipId: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.metaDescription,
    category: a.category || tipById.get(a.id)?.tag || "Windows",
    tags: a.tags,
    status: "published",
    publishedAt: `2026-08-${String(day).padStart(2, "0")}`,
    updatedAt: new Date().toISOString(),
    authorName: "Mackenson Lundi",
    authorRole: "Fondateur BelKou",
    authorInitials: "ML",
    readMinutes: a.estimatedMinutes,
    difficulty: a.difficulty,
    featured: a.id === 1,
    trending: [
      1, 3, 9, 10, 12, 20, 22, 25, 30, 31, 35, 37, 43, 46, 49, 55, 57, 58, 62,
      66,
    ].includes(a.id),
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

const progressPath = path.join(
  "c:/Users/ZoulaTech/Desktop/1190-astuces-articles/progress.json",
);
fs.writeFileSync(
  progressPath,
  JSON.stringify(
    {
      total: 1190,
      completed: posts.length,
      failed: 0,
      remaining: 1190 - posts.length,
      last_processed_id: posts[posts.length - 1]?.tipId ?? 0,
      prototype_batch: "001-070",
      status: "batch_061_070_ready",
      batches: [
        {
          name: "LOT-PROTOTYPE",
          from: 1,
          to: 10,
          count: 10,
          at: "2026-09-06T21:21:33.743Z",
        },
        {
          name: "LOT-011-020",
          from: 11,
          to: 20,
          count: 10,
          at: "2026-09-07T00:00:00.000Z",
        },
        {
          name: "LOT-021-030",
          from: 21,
          to: 30,
          count: 10,
          at: "2026-09-07T00:30:00.000Z",
        },
        {
          name: "LOT-031-040",
          from: 31,
          to: 40,
          count: 10,
          at: "2026-09-07T14:00:00.000Z",
        },
        {
          name: "LOT-041-050",
          from: 41,
          to: 50,
          count: 10,
          at: "2026-09-07T14:20:00.000Z",
        },
        {
          name: "LOT-051-060",
          from: 51,
          to: 60,
          count: 10,
          at: "2026-09-07T14:40:00.000Z",
        },
        {
          name: "LOT-061-070",
          from: 61,
          to: 70,
          count: 10,
          at: new Date().toISOString(),
        },
      ],
      updated_at: new Date().toISOString(),
    },
    null,
    2,
  ),
);

console.log("OK", posts.length, "articles (astuces 1–" + posts.length + ")");
