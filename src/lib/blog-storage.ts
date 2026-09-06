import {
  createEmptyBlock,
  paragraphsToBlocks,
  slugifyBlog,
  type BlogBlock,
  type StoredBlogPost,
} from "@/lib/blog-blocks";
import { blogPosts, type BlogPost } from "@/lib/blog";
import { siteConfig } from "@/lib/site-config";
import { astucesBlogSeed } from "@/data/astuces-blog-seed";

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {
    /* ignore */
  }
  return null;
}

export function blocksToHtml(blocks: BlogBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "paragraph": {
        const align = block.align ? ` style="text-align:${block.align}"` : "";
        const drop = block.dropCap ? ` class="has-drop-cap"` : "";
        parts.push(`<p${drop}${align}>${esc(block.content).replace(/\n/g, "<br>")}</p>`);
        break;
      }
      case "heading": {
        const tag = `h${block.level}`;
        const align = block.align ? ` style="text-align:${block.align}"` : "";
        parts.push(`<${tag}${align}>${esc(block.content)}</${tag}>`);
        break;
      }
      case "list": {
        const tag = block.ordered ? "ol" : "ul";
        parts.push(
          `<${tag}>${block.items.map((item) => `<li>${esc(item)}</li>`).join("")}</${tag}>`,
        );
        break;
      }
      case "quote":
        parts.push(
          `<blockquote><p>${esc(block.content)}</p>${block.citation ? `<cite>${esc(block.citation)}</cite>` : ""}</blockquote>`,
        );
        break;
      case "pullquote":
        parts.push(
          `<blockquote class="pullquote"><p>${esc(block.content)}</p>${block.citation ? `<cite>${esc(block.citation)}</cite>` : ""}</blockquote>`,
        );
        break;
      case "code":
        parts.push(
          `<pre><code class="language-${esc(block.language || "text")}">${esc(block.content)}</code></pre>`,
        );
        break;
      case "preformatted":
        parts.push(`<pre>${esc(block.content)}</pre>`);
        break;
      case "image": {
        if (!block.url) break;
        const img = `<img src="${esc(block.url)}" alt="${esc(block.alt)}" loading="lazy" />`;
        const linked = block.linkUrl ? `<a href="${esc(block.linkUrl)}">${img}</a>` : img;
        parts.push(
          `<figure class="wp-block-image size-${esc(block.size || "default")}">${linked}${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ""}</figure>`,
        );
        break;
      }
      case "gallery": {
        const cols = block.columns ?? 3;
        parts.push(
          `<div class="wp-block-gallery columns-${cols}">${block.images
            .filter((img) => img.url)
            .map(
              (img) =>
                `<figure><img src="${esc(img.url)}" alt="${esc(img.alt)}" loading="lazy" /></figure>`,
            )
            .join("")}</div>`,
        );
        break;
      }
      case "cover":
        parts.push(
          `<section class="wp-block-cover" style="min-height:${block.minHeight ?? 280}px;background:${block.url ? `center/cover url('${esc(block.url)}')` : "linear-gradient(135deg,#0056D2,#7ED874)"};"><div class="wp-block-cover__inner" style="background:${esc(block.overlay || "rgba(0,0,0,0.4)")}"><h2>${esc(block.title)}</h2>${block.subtitle ? `<p>${esc(block.subtitle)}</p>` : ""}</div></section>`,
        );
        break;
      case "separator":
        parts.push(`<hr class="wp-block-separator is-style-${esc(block.style || "default")}" />`);
        break;
      case "spacer":
        parts.push(`<div class="wp-block-spacer" style="height:${block.height}px" aria-hidden="true"></div>`);
        break;
      case "buttons":
        parts.push(
          `<div class="wp-block-buttons">${block.buttons
            .map(
              (btn) =>
                `<a class="wp-block-button is-style-${esc(btn.style)}" href="${esc(btn.url)}">${esc(btn.label)}</a>`,
            )
            .join("")}</div>`,
        );
        break;
      case "columns":
        parts.push(
          `<div class="wp-block-columns count-${block.count}">${block.columns
            .map((col) => `<div class="wp-block-column"><p>${esc(col).replace(/\n/g, "<br>")}</p></div>`)
            .join("")}</div>`,
        );
        break;
      case "table": {
        const rows = block.rows
          .map((row, ri) => {
            const cell = block.header && ri === 0 ? "th" : "td";
            return `<tr>${row.map((c) => `<${cell}>${esc(c)}</${cell}>`).join("")}</tr>`;
          })
          .join("");
        parts.push(`<table class="wp-block-table"><tbody>${rows}</tbody></table>`);
        break;
      }
      case "html":
        parts.push(block.content);
        break;
      case "embed": {
        const yt = youtubeId(block.url);
        if (yt) {
          parts.push(
            `<figure class="wp-block-embed"><div class="ratio"><iframe src="https://www.youtube.com/embed/${esc(yt)}" title="Vidéo" loading="lazy" allowfullscreen></iframe></div>${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ""}</figure>`,
          );
        } else if (block.url) {
          parts.push(
            `<p class="wp-block-embed"><a href="${esc(block.url)}" rel="noopener noreferrer" target="_blank">${esc(block.url)}</a></p>`,
          );
        }
        break;
      }
      case "video":
        if (!block.url) break;
        if (youtubeId(block.url)) {
          const yt = youtubeId(block.url)!;
          parts.push(
            `<figure class="wp-block-video"><div class="ratio"><iframe src="https://www.youtube.com/embed/${esc(yt)}" title="Vidéo" loading="lazy" allowfullscreen></iframe></div>${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ""}</figure>`,
          );
        } else {
          parts.push(
            `<figure class="wp-block-video"><video controls src="${esc(block.url)}"></video>${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ""}</figure>`,
          );
        }
        break;
      case "audio":
        if (block.url) parts.push(`<audio class="wp-block-audio" controls src="${esc(block.url)}"></audio>`);
        break;
      case "file":
        if (block.url)
          parts.push(
            `<div class="wp-block-file"><a href="${esc(block.url)}" download>${esc(block.label || "Télécharger")}</a></div>`,
          );
        break;
      case "callout":
        parts.push(
          `<aside class="wp-block-callout is-${esc(block.variant)}">${block.title ? `<strong>${esc(block.title)}</strong>` : ""}<p>${esc(block.content)}</p></aside>`,
        );
        break;
      case "faq":
        parts.push(
          `<div class="wp-block-faq">${block.items
            .filter((item) => item.q.trim())
            .map(
              (item) =>
                `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`,
            )
            .join("")}</div>`,
        );
        break;
      case "toc": {
        const headings = blocks.filter(
          (b): b is Extract<BlogBlock, { type: "heading" }> =>
            b.type === "heading" && b.content.trim().length > 0,
        );
        if (!headings.length) break;
        parts.push(
          `<nav class="wp-block-toc" aria-label="Sommaire"><ol>${headings
            .map((h, i) => `<li class="level-${h.level}"><a href="#heading-${i}">${esc(h.content)}</a></li>`)
            .join("")}</ol></nav>`,
        );
        break;
      }
      case "more":
        parts.push(`<!--more-->`);
        break;
    }
  }
  return parts.join("\n");
}

export function estimateReadMinutes(blocks: BlogBlock[]): number {
  const text = blocks
    .map((b) => {
      if ("content" in b && typeof b.content === "string") return b.content;
      if (b.type === "list") return b.items.join(" ");
      if (b.type === "faq") return b.items.map((i) => `${i.q} ${i.a}`).join(" ");
      if (b.type === "columns") return b.columns.join(" ");
      if (b.type === "table") return b.rows.flat().join(" ");
      return "";
    })
    .join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function seedStoredPostsFromStatic(): StoredBlogPost[] {
  const now = new Date().toISOString();
  const tipSeed = loadAstucesSeed();
  const legacy = blogPosts.map((post) => staticPostToStored(post, now));
  // Astuces d’abord (blog BelKou), puis anciens articles éditoriaux
  const bySlug = new Map<string, StoredBlogPost>();
  for (const post of [...tipSeed, ...legacy]) {
    bySlug.set(post.slug, post);
  }
  return [...bySlug.values()];
}

function loadAstucesSeed(): StoredBlogPost[] {
  return astucesBlogSeed
    .map((item) => sanitizeStoredPost(item))
    .filter((item): item is StoredBlogPost => Boolean(item));
}

export function staticPostToStored(post: BlogPost, now = new Date().toISOString()): StoredBlogPost {
  return {
    id: `static_${post.slug}`,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    tags: [post.category],
    status: "published",
    publishedAt: post.publishedAt,
    updatedAt: now,
    authorName: post.author.name,
    authorRole: post.author.role,
    authorInitials: post.author.initials,
    readMinutes: post.readMinutes,
    featured: post.featured,
    trending: post.trending,
    coverGradient: post.coverGradient,
    coverLabel: post.coverLabel,
    seoTitle: `${post.title} — Blog BelKou`,
    seoDescription: post.excerpt,
    blocks: paragraphsToBlocks(post.body),
  };
}

export function createBlankPost(): StoredBlogPost {
  const now = new Date().toISOString();
  const title = "Nouvel article";
  return {
    id: crypto.randomUUID(),
    slug: slugifyBlog(`${title}-${Date.now().toString(36)}`),
    title,
    excerpt: "",
    category: "Actualités",
    tags: [],
    status: "draft",
    publishedAt: now.slice(0, 10),
    updatedAt: now,
    authorName: siteConfig.founder.name,
    authorRole: "Fondateur BelKou",
    authorInitials: "ML",
    readMinutes: 3,
    difficulty: "Débutant",
    coverGradient: "from-primary via-primary/80 to-[#7ed874]",
    coverLabel: "BelKou",
    coverAlt: "",
    seoTitle: "",
    seoDescription: "",
    blocks: [createEmptyBlock("paragraph"), createEmptyBlock("heading")],
  };
}

export function sanitizeStoredPost(raw: unknown): StoredBlogPost | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<StoredBlogPost>;
  if (!p.id || !p.slug || !p.title) return null;
  const blocks = Array.isArray(p.blocks) && p.blocks.length
    ? (p.blocks as BlogBlock[])
    : [createEmptyBlock("paragraph")];
  return {
    id: String(p.id),
    slug: slugifyBlog(String(p.slug)) || `article-${String(p.id).slice(0, 8)}`,
    title: String(p.title).trim() || "Sans titre",
    excerpt: String(p.excerpt ?? "").trim(),
    category: String(p.category ?? "Actualités").trim() || "Actualités",
    tags: Array.isArray(p.tags) ? p.tags.map(String).filter(Boolean).slice(0, 24) : [],
    status: (["draft", "published", "scheduled", "private"] as const).includes(
      p.status as StoredBlogPost["status"],
    )
      ? (p.status as StoredBlogPost["status"])
      : "draft",
    scheduledAt: p.scheduledAt ?? null,
    publishedAt: String(p.publishedAt ?? new Date().toISOString().slice(0, 10)).slice(0, 10),
    updatedAt: String(p.updatedAt ?? new Date().toISOString()),
    authorName: String(p.authorName ?? siteConfig.founder.name),
    authorRole: String(p.authorRole ?? "Auteur BelKou"),
    authorInitials: String(p.authorInitials ?? "BK").slice(0, 3),
    readMinutes: Math.max(1, Number(p.readMinutes) || estimateReadMinutes(blocks)),
    difficulty: p.difficulty,
    featured: Boolean(p.featured),
    trending: Boolean(p.trending),
    sticky: Boolean(p.sticky),
    allowComments: Boolean(p.allowComments),
    coverGradient: String(p.coverGradient ?? "from-primary to-[#0045a8]"),
    coverLabel: String(p.coverLabel ?? "BelKou"),
    coverImageUrl: p.coverImageUrl?.trim() || undefined,
    coverAlt: p.coverAlt?.trim() || undefined,
    seoTitle: p.seoTitle?.trim() || undefined,
    seoDescription: p.seoDescription?.trim() || undefined,
    ogTitle: p.ogTitle?.trim() || undefined,
    ogDescription: p.ogDescription?.trim() || undefined,
    primaryKeyword: p.primaryKeyword?.trim() || undefined,
    secondaryKeywords: Array.isArray(p.secondaryKeywords)
      ? p.secondaryKeywords.map(String).filter(Boolean)
      : undefined,
    blocks,
  };
}

export function storedToPublicPost(post: StoredBlogPost): BlogPost & {
  htmlBody: string;
  coverImageUrl?: string;
} {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category as BlogPost["category"],
    author: {
      name: post.authorName,
      initials: post.authorInitials,
      role: post.authorRole,
    },
    publishedAt: post.publishedAt,
    readMinutes: post.readMinutes,
    featured: post.featured,
    trending: post.trending,
    coverGradient: post.coverGradient,
    coverLabel: post.coverLabel,
    body: post.blocks
      .filter((b): b is Extract<BlogBlock, { type: "paragraph" }> => b.type === "paragraph")
      .map((b) => b.content)
      .filter(Boolean),
    htmlBody: blocksToHtml(post.blocks),
    coverImageUrl: post.coverImageUrl,
  };
}
