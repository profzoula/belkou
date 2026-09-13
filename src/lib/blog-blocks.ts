/** Modèle Gutenberg-like pour les articles BelKou */

export type BlogBlockAlign = "left" | "center" | "right";

export type BlogBlock =
  | {
      id: string;
      type: "paragraph";
      content: string;
      align?: BlogBlockAlign;
      dropCap?: boolean;
    }
  | {
      id: string;
      type: "heading";
      level: 1 | 2 | 3 | 4;
      content: string;
      align?: BlogBlockAlign;
    }
  | {
      id: string;
      type: "list";
      ordered: boolean;
      items: string[];
    }
  | {
      id: string;
      type: "quote";
      content: string;
      citation?: string;
    }
  | {
      id: string;
      type: "pullquote";
      content: string;
      citation?: string;
    }
  | {
      id: string;
      type: "code";
      content: string;
      language?: string;
    }
  | {
      id: string;
      type: "preformatted";
      content: string;
    }
  | {
      id: string;
      type: "image";
      url: string;
      alt: string;
      caption?: string;
      linkUrl?: string;
      size?: "default" | "wide" | "full";
    }
  | {
      id: string;
      type: "gallery";
      images: Array<{ url: string; alt: string }>;
      columns?: 2 | 3 | 4;
    }
  | {
      id: string;
      type: "cover";
      url?: string;
      overlay?: string;
      title: string;
      subtitle?: string;
      minHeight?: number;
    }
  | {
      id: string;
      type: "separator";
      style?: "default" | "wide" | "dots";
    }
  | {
      id: string;
      type: "spacer";
      height: number;
    }
  | {
      id: string;
      type: "buttons";
      buttons: Array<{
        label: string;
        url: string;
        style: "fill" | "outline";
      }>;
      align?: BlogBlockAlign;
    }
  | {
      id: string;
      type: "columns";
      count: 2 | 3;
      columns: string[];
    }
  | {
      id: string;
      type: "table";
      header?: boolean;
      rows: string[][];
    }
  | {
      id: string;
      type: "html";
      content: string;
    }
  | {
      id: string;
      type: "embed";
      url: string;
      caption?: string;
      provider?: string;
    }
  | {
      id: string;
      type: "video";
      url: string;
      caption?: string;
    }
  | {
      id: string;
      type: "audio";
      url: string;
    }
  | {
      id: string;
      type: "file";
      url: string;
      label: string;
    }
  | {
      id: string;
      type: "callout";
      variant: "info" | "tip" | "warning" | "success";
      title?: string;
      content: string;
    }
  | {
      id: string;
      type: "faq";
      items: Array<{ q: string; a: string }>;
    }
  | {
      id: string;
      type: "toc";
    }
  | {
      id: string;
      type: "more";
    }
  | {
      id: string;
      type: "countdown";
      target: string;
      label?: string;
    }
  | {
      id: string;
      type: "progress";
      value: number;
      label?: string;
    }
  | {
      id: string;
      type: "tabs";
      items: Array<{ title: string; content: string }>;
    }
  | {
      id: string;
      type: "testimonial";
      quote: string;
      author: string;
      role?: string;
    }
  | {
      id: string;
      type: "pricing";
      plans: Array<{ name: string; price: string; features: string; url?: string }>;
    }
  | {
      id: string;
      type: "iconbox";
      icon: string;
      title: string;
      content: string;
    }
  | {
      id: string;
      type: "numberbox";
      number: string;
      title: string;
      content: string;
    };

export type BlogBlockType = BlogBlock["type"];

export type BlogPostStatus = "draft" | "published" | "scheduled" | "private";

export type StoredBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: BlogPostStatus;
  scheduledAt?: string | null;
  publishedAt: string;
  updatedAt: string;
  authorName: string;
  authorRole: string;
  authorInitials: string;
  readMinutes: number;
  difficulty?: "Débutant" | "Intermédiaire" | "Avancé" | "Expert";
  featured?: boolean;
  trending?: boolean;
  sticky?: boolean;
  allowComments?: boolean;
  coverGradient: string;
  coverLabel: string;
  coverImageUrl?: string;
  coverAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  blocks: BlogBlock[];
};

export const BLOG_BLOCK_CATALOG: Array<{
  type: BlogBlockType;
  label: string;
  description: string;
  group: "texte" | "media" | "mise-en-page" | "widgets" | "embed";
  keywords: string[];
}> = [
  {
    type: "paragraph",
    label: "Paragraphe",
    description: "Bloc de texte principal",
    group: "texte",
    keywords: ["p", "texte", "paragraph"],
  },
  {
    type: "heading",
    label: "Titre",
    description: "Titre H1–H4",
    group: "texte",
    keywords: ["h2", "titre", "heading"],
  },
  {
    type: "list",
    label: "Liste",
    description: "Liste à puces ou numérotée",
    group: "texte",
    keywords: ["ul", "ol", "liste"],
  },
  {
    type: "quote",
    label: "Citation",
    description: "Citation classique",
    group: "texte",
    keywords: ["blockquote", "quote"],
  },
  {
    type: "pullquote",
    label: "Citation mise en avant",
    description: "Citation large et marquée",
    group: "texte",
    keywords: ["pullquote"],
  },
  {
    type: "code",
    label: "Code",
    description: "Bloc de code syntaxique",
    group: "texte",
    keywords: ["code", "pre"],
  },
  {
    type: "preformatted",
    label: "Préformaté",
    description: "Texte à espacement fixe",
    group: "texte",
    keywords: ["pre", "preformatted"],
  },
  {
    type: "image",
    label: "Image",
    description: "Image avec légende et alt",
    group: "media",
    keywords: ["img", "image", "photo"],
  },
  {
    type: "gallery",
    label: "Galerie",
    description: "Plusieurs images en grille",
    group: "media",
    keywords: ["gallery", "galerie"],
  },
  {
    type: "cover",
    label: "Bannière (Cover)",
    description: "Image de fond avec titre",
    group: "media",
    keywords: ["cover", "hero"],
  },
  {
    type: "video",
    label: "Vidéo",
    description: "URL vidéo (mp4 / YouTube)",
    group: "media",
    keywords: ["video", "youtube"],
  },
  {
    type: "audio",
    label: "Audio",
    description: "Fichier ou URL audio",
    group: "media",
    keywords: ["audio", "mp3"],
  },
  {
    type: "file",
    label: "Fichier",
    description: "Lien de téléchargement",
    group: "media",
    keywords: ["file", "pdf", "download"],
  },
  {
    type: "separator",
    label: "Séparateur",
    description: "Ligne de séparation",
    group: "mise-en-page",
    keywords: ["hr", "separator"],
  },
  {
    type: "spacer",
    label: "Espaceur",
    description: "Espace vertical",
    group: "mise-en-page",
    keywords: ["spacer", "espace"],
  },
  {
    type: "columns",
    label: "Colonnes",
    description: "2 ou 3 colonnes de texte",
    group: "mise-en-page",
    keywords: ["columns", "colonnes"],
  },
  {
    type: "buttons",
    label: "Boutons",
    description: "Boutons d’appel à l’action",
    group: "mise-en-page",
    keywords: ["button", "cta"],
  },
  {
    type: "table",
    label: "Tableau",
    description: "Tableau simple",
    group: "mise-en-page",
    keywords: ["table", "tableau"],
  },
  {
    type: "html",
    label: "Classique",
    description: "Zone de texte comme l’éditeur classique",
    group: "widgets",
    keywords: ["html", "custom"],
  },
  {
    type: "callout",
    label: "Encadré",
    description: "Info, conseil, alerte…",
    group: "widgets",
    keywords: ["callout", "notice", "tip"],
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Questions / réponses",
    group: "widgets",
    keywords: ["faq", "accordion"],
  },
  {
    type: "toc",
    label: "Sommaire",
    description: "Table des matières auto",
    group: "widgets",
    keywords: ["toc", "sommaire"],
  },
  {
    type: "more",
    label: "Lire la suite",
    description: "Coupe l’extrait sur l’index",
    group: "widgets",
    keywords: ["more", "excerpt"],
  },
  {
    type: "embed",
    label: "Contenu embarqué",
    description: "URL YouTube, Vimeo, etc.",
    group: "embed",
    keywords: ["embed", "iframe", "youtube"],
  },
  {
    type: "countdown",
    label: "Compte à rebours",
    description: "Date cible",
    group: "widgets",
    keywords: ["countdown", "timer"],
  },
  {
    type: "progress",
    label: "Progression",
    description: "Barre de pourcentage",
    group: "widgets",
    keywords: ["progress", "barre"],
  },
  {
    type: "tabs",
    label: "Onglets",
    description: "Contenu en onglets",
    group: "widgets",
    keywords: ["tabs", "onglets"],
  },
  {
    type: "testimonial",
    label: "Témoignage",
    description: "Avis client",
    group: "widgets",
    keywords: ["testimonial", "avis"],
  },
  {
    type: "pricing",
    label: "Tarifs",
    description: "Tableau de prix",
    group: "widgets",
    keywords: ["pricing", "prix"],
  },
  {
    type: "iconbox",
    label: "Boîte icône",
    description: "Icône + titre + texte",
    group: "widgets",
    keywords: ["icon", "box"],
  },
  {
    type: "numberbox",
    label: "Boîte chiffre",
    description: "Chiffre + titre + texte",
    group: "widgets",
    keywords: ["number", "stat"],
  },
];

export function newBlockId(): string {
  return `blk_${crypto.randomUUID().slice(0, 12)}`;
}

export function createEmptyBlock(type: BlogBlockType): BlogBlock {
  const id = newBlockId();
  switch (type) {
    case "paragraph":
      return { id, type, content: "" };
    case "heading":
      return { id, type, level: 2, content: "" };
    case "list":
      return { id, type, ordered: false, items: [""] };
    case "quote":
      return { id, type, content: "", citation: "" };
    case "pullquote":
      return { id, type, content: "", citation: "" };
    case "code":
      return { id, type, content: "", language: "text" };
    case "preformatted":
      return { id, type, content: "" };
    case "image":
      return { id, type, url: "", alt: "", caption: "", size: "default" };
    case "gallery":
      return {
        id,
        type,
        columns: 3,
        images: [
          { url: "", alt: "" },
          { url: "", alt: "" },
        ],
      };
    case "cover":
      return {
        id,
        type,
        title: "Titre de couverture",
        subtitle: "",
        overlay: "rgba(0,0,0,0.45)",
        minHeight: 280,
      };
    case "separator":
      return { id, type, style: "default" };
    case "spacer":
      return { id, type, height: 40 };
    case "buttons":
      return {
        id,
        type,
        buttons: [{ label: "En savoir plus", url: "#", style: "fill" }],
      };
    case "columns":
      return { id, type, count: 2, columns: ["Colonne 1…", "Colonne 2…"] };
    case "table":
      return {
        id,
        type,
        header: true,
        rows: [
          ["Colonne A", "Colonne B"],
          ["", ""],
        ],
      };
    case "html":
      return { id, type, content: "" };
    case "embed":
      return { id, type, url: "", caption: "", provider: "generic" };
    case "video":
      return { id, type, url: "", caption: "" };
    case "audio":
      return { id, type, url: "" };
    case "file":
      return { id, type, url: "", label: "Télécharger" };
    case "callout":
      return { id, type, variant: "info", title: "Note", content: "" };
    case "faq":
      return {
        id,
        type,
        items: [
          { q: "Question ?", a: "Réponse…" },
          { q: "", a: "" },
        ],
      };
    case "toc":
      return { id, type };
    case "more":
      return { id, type };
    case "countdown":
      return {
        id,
        type,
        target: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        label: "Compte à rebours",
      };
    case "progress":
      return { id, type, value: 60, label: "Progression" };
    case "tabs":
      return {
        id,
        type,
        items: [
          { title: "Onglet 1", content: "Contenu…" },
          { title: "Onglet 2", content: "" },
        ],
      };
    case "testimonial":
      return { id, type, quote: "Citation du client…", author: "Nom", role: "Rôle" };
    case "pricing":
      return {
        id,
        type,
        plans: [
          { name: "Essentiel", price: "0 €", features: "Fonction A\nFonction B", url: "#" },
          { name: "Pro", price: "19 €", features: "Tout l’essentiel\nSupport", url: "#" },
        ],
      };
    case "iconbox":
      return { id, type, icon: "★", title: "Titre", content: "Description…" };
    case "numberbox":
      return { id, type, number: "01", title: "Titre", content: "Description…" };
  }
}

function elementText(el: Element | null): string {
  return (el?.textContent ?? "").replace(/\u00a0/g, " ").trim();
}

/** Convertit un HTML Classic Editor en blocs Gutenberg éditables. */
export function htmlToBlocks(html: string): BlogBlock[] {
  const cleaned = String(html ?? "").trim();
  if (!cleaned) return [createEmptyBlock("paragraph")];
  if (typeof DOMParser === "undefined") {
    return [{ id: newBlockId(), type: "html", content: cleaned }];
  }

  const doc = new DOMParser().parseFromString(`<div id="bk-root">${cleaned}</div>`, "text/html");
  const root = doc.getElementById("bk-root") ?? doc.body;
  const blocks: BlogBlock[] = [];

  const pushImage = (img: Element, caption = "") => {
    const url = img.getAttribute("src")?.trim() ?? "";
    if (!url) return;
    blocks.push({
      id: newBlockId(),
      type: "image",
      url,
      alt: img.getAttribute("alt")?.trim() ?? "",
      caption,
      size: "default",
    });
  };

  const consume = (node: ChildNode) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\u00a0/g, " ").trim();
      if (text) blocks.push({ id: newBlockId(), type: "paragraph", content: text });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
      blocks.push({
        id: newBlockId(),
        type: "heading",
        level: Number(tag.slice(1)) as 1 | 2 | 3 | 4,
        content: elementText(el),
      });
      return;
    }
    if (tag === "p") {
      const imgs = Array.from(el.querySelectorAll("img"));
      if (imgs.length && !elementText(el)) {
        imgs.forEach((img) => pushImage(img));
        return;
      }
      const text = elementText(el);
      if (text) blocks.push({ id: newBlockId(), type: "paragraph", content: text });
      imgs.forEach((img) => pushImage(img));
      return;
    }
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(el.querySelectorAll(":scope > li")).map((li) => elementText(li));
      blocks.push({
        id: newBlockId(),
        type: "list",
        ordered: tag === "ol",
        items: items.length ? items : [""],
      });
      return;
    }
    if (tag === "blockquote") {
      blocks.push({
        id: newBlockId(),
        type: "quote",
        content: elementText(el.querySelector("p") ?? el),
        citation: elementText(el.querySelector("cite")),
      });
      return;
    }
    if (tag === "pre") {
      blocks.push({
        id: newBlockId(),
        type: "code",
        content: el.textContent ?? "",
        language: "text",
      });
      return;
    }
    if (tag === "figure") {
      const img = el.querySelector("img");
      if (img) {
        pushImage(img, elementText(el.querySelector("figcaption")));
        return;
      }
    }
    if (tag === "img") {
      pushImage(el);
      return;
    }
    if (tag === "hr") {
      blocks.push({ id: newBlockId(), type: "separator", style: "default" });
      return;
    }
    if (tag === "div" || tag === "section" || tag === "article") {
      Array.from(el.childNodes).forEach(consume);
      return;
    }
    const inner = el.innerHTML.trim();
    if (inner) blocks.push({ id: newBlockId(), type: "html", content: inner });
  };

  Array.from(root.childNodes).forEach(consume);
  return blocks.length ? blocks : [createEmptyBlock("paragraph")];
}

export function paragraphsToBlocks(paragraphs: string[]): BlogBlock[] {
  if (!paragraphs.length) return [createEmptyBlock("paragraph")];
  return paragraphs.map((content) => ({
    id: newBlockId(),
    type: "paragraph" as const,
    content,
  }));
}

export function slugifyBlog(text: string): string {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}
