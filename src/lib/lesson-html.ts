import DOMPurify from "isomorphic-dompurify";
import TurndownService from "turndown";
import { parseInlineMarkdown, parseLessonContent } from "@/lib/parse-lesson-content";

const LESSON_HTML_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "ul",
    "ol",
    "li",
    "a",
    "h2",
    "h3",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "blockquote",
    "pre",
    "code",
    "details",
    "summary",
    "hr",
  ],
  ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class", "data-lesson-session", "data-lesson-session-title", "data-lesson-subsession", "data-lesson-quiz"],
};

export function isLessonHtml(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  return trimmed.startsWith("<") || /<(?:p|h[2-3]|ul|ol|li|strong|em|br|img|table|details|blockquote|pre)\b/i.test(trimmed);
}

function stripClipboardArtifacts(html: string): string {
  return html
    .replace(/<!--\s*StartFragment\s*-->/gi, "")
    .replace(/<!--\s*EndFragment\s*-->/gi, "")
    .replace(/\bStartFragment\b/gi, "")
    .replace(/\bEndFragment\b/gi, "");
}

function stripClipboardArtifactsText(text: string): string {
  return text
    .replace(/<!--\s*StartFragment\s*-->/gi, "")
    .replace(/<!--\s*EndFragment\s*-->/gi, "")
    .replace(/\bStartFragment\b/gi, "")
    .replace(/\bEndFragment\b/gi, "")
    .trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdownToHtml(text: string): string {
  return parseInlineMarkdown(text)
    .map((segment) =>
      segment.type === "bold"
        ? `<strong>${escapeHtml(segment.value)}</strong>`
        : escapeHtml(segment.value),
    )
    .join("");
}

export function markdownToLessonHtml(raw: string): string {
  if (isLessonHtml(raw)) return raw;

  const blocks = parseLessonContent(raw);
  if (!blocks.length) return "";

  return blocks
    .map((block) => {
      if (block.type === "heading") {
        return `<h2>${escapeHtml(block.text)}</h2>`;
      }
      if (block.type === "list") {
        return `<ul>${block.items.map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`).join("")}</ul>`;
      }
      if (block.type === "accordion") {
        const body = block.body ? `<p>${inlineMarkdownToHtml(block.body)}</p>` : "<p></p>";
        return `<details><summary>${escapeHtml(block.title)}</summary>${body}</details>`;
      }
      return `<p>${inlineMarkdownToHtml(block.text)}</p>`;
    })
    .join("");
}

function normalizeLessonLinks(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    const withoutTarget = attrs.replace(/\btarget\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    const withoutRel = withoutTarget.replace(/\brel\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    return `<a${withoutRel} target="_blank" rel="noopener noreferrer">`;
  });
}

export function sanitizeLessonHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(stripClipboardArtifacts(html), LESSON_HTML_CONFIG);
  return normalizeLessonLinks(sanitized);
}

function unwrapElement(element: Element) {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}

function isWordOrDocsHtml(html: string): boolean {
  return /mso-|WordSection|docs-internal|SpellE|GramE|o:p>|xmlns:w=/i.test(html);
}

function plainTextToLessonHtml(text: string): string {
  const lines = stripClipboardArtifactsText(text).replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let listItems: string[] | null = null;
  let listOrdered = false;

  const flushList = () => {
    if (!listItems?.length) {
      listItems = null;
      return;
    }
    const tag = listOrdered ? "ol" : "ul";
    blocks.push(`<${tag}>${listItems.map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`).join("")}</${tag}>`);
    listItems = null;
    listOrdered = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\u00a0/g, " ");
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    const bullet = trimmed.match(/^[•●◦▪\-*–—]\s+(.+)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (bullet) {
      if (listOrdered && listItems) flushList();
      listItems ??= [];
      listItems.push(bullet[1].trim());
      continue;
    }
    if (numbered) {
      if (!listOrdered && listItems) flushList();
      listOrdered = true;
      listItems ??= [];
      listItems.push(numbered[1].trim());
      continue;
    }

    flushList();

    if (trimmed.length <= 90 && trimmed.endsWith("?") && !trimmed.includes(". ")) {
      blocks.push(`<h2>${inlineMarkdownToHtml(trimmed)}</h2>`);
      continue;
    }

    if (trimmed.length <= 70 && trimmed.endsWith(":")) {
      blocks.push(`<p><strong>${inlineMarkdownToHtml(trimmed.slice(0, -1))}</strong> :</p>`);
      continue;
    }

    blocks.push(`<p>${inlineMarkdownToHtml(trimmed)}</p>`);
  }

  flushList();
  return blocks.join("");
}

function mapHeadingTag(tag: string): string {
  if (tag === "h1" || tag === "h4" || tag === "h5" || tag === "h6") return "h2";
  return tag;
}

function normalizePastedDom(root: HTMLElement) {
  root.querySelectorAll("style, meta, link, script, xml").forEach((node) => node.remove());

  const comments: Comment[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
  let comment = walker.nextNode();
  while (comment) {
    comments.push(comment as Comment);
    comment = walker.nextNode();
  }
  for (const node of comments) {
    node.remove();
  }

  const stripTags = new Set(["span", "font", "u", "o:p", "w:sdt"]);
  const toProcess = [...root.querySelectorAll("*")];

  for (const element of toProcess) {
    const tag = element.tagName.toLowerCase();

    if (stripTags.has(tag)) {
      unwrapElement(element);
      continue;
    }

    if (tag === "h1" || tag === "h4" || tag === "h5" || tag === "h6") {
      const replacement = document.createElement(mapHeadingTag(tag));
      replacement.innerHTML = element.innerHTML;
      element.replaceWith(replacement);
      continue;
    }

    if (tag === "div" && !element.querySelector("ul, ol, table, details, pre, blockquote")) {
      const replacement = document.createElement("p");
      replacement.innerHTML = element.innerHTML;
      element.replaceWith(replacement);
      continue;
    }

    for (const attr of [...element.attributes]) {
      element.removeAttribute(attr.name);
    }
  }

  groupBulletParagraphs(root);
}

function groupBulletParagraphs(root: HTMLElement) {
  const children = [...root.childNodes];
  root.innerHTML = "";

  let listItems: string[] | null = null;
  let listOrdered = false;

  const flushList = () => {
    if (!listItems?.length) {
      listItems = null;
      return;
    }
    const list = document.createElement(listOrdered ? "ol" : "ul");
    for (const item of listItems) {
      const li = document.createElement("li");
      li.innerHTML = item;
      list.appendChild(li);
    }
    root.appendChild(list);
    listItems = null;
    listOrdered = false;
  };

  const appendBlock = (node: Node) => {
    flushList();
    root.appendChild(node);
  };

  for (const child of children) {
    if (child.nodeType !== Node.ELEMENT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        const p = document.createElement("p");
        p.textContent = text;
        appendBlock(p);
      }
      continue;
    }

    const element = child as HTMLElement;
    if (element.tagName.toLowerCase() !== "p") {
      appendBlock(element);
      continue;
    }

    const text = element.textContent?.trim() ?? "";
    const bullet = text.match(/^[•●◦▪\-*–—]\s+(.+)$/);
    const numbered = text.match(/^\d+[.)]\s+(.+)$/);

    if (bullet) {
      if (listOrdered && listItems) flushList();
      listItems ??= [];
      listItems.push(inlineMarkdownToHtml(bullet[1].trim()));
      element.remove();
      continue;
    }

    if (numbered) {
      if (!listOrdered && listItems) flushList();
      listOrdered = true;
      listItems ??= [];
      listItems.push(inlineMarkdownToHtml(numbered[1].trim()));
      element.remove();
      continue;
    }

    appendBlock(element);
  }

  flushList();
}

function cleanPastedHtmlDocument(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  normalizePastedDom(doc.body);
  return doc.body.innerHTML.trim();
}

/** Normalize clipboard content — keeps lists/headings, strips Word/Docs spell-check styling. */
export function normalizePastedLessonHtml(html: string, plainText: string): string {
  const trimmedHtml = stripClipboardArtifacts(html.trim());
  const trimmedText = stripClipboardArtifactsText(plainText);

  if (typeof document === "undefined") {
    return sanitizeLessonHtml(trimmedHtml ? trimmedHtml : plainTextToLessonHtml(trimmedText));
  }

  if (!trimmedHtml || isWordOrDocsHtml(trimmedHtml)) {
    return sanitizeLessonHtml(plainTextToLessonHtml(trimmedText));
  }

  const cleaned = cleanPastedHtmlDocument(trimmedHtml);
  if (!cleaned.replace(/<[^>]+>/g, "").trim() && trimmedText) {
    return sanitizeLessonHtml(plainTextToLessonHtml(trimmedText));
  }

  return sanitizeLessonHtml(cleaned);
}

export function lessonContentForEditor(content: string): string {
  return markdownToLessonHtml(content);
}

let turndown: TurndownService | null = null;

function getTurndown(): TurndownService {
  if (!turndown) {
    turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });
    turndown.addRule("underline", {
      filter: ["u"],
      replacement: (content) => `_${content}_`,
    });
    turndown.addRule("h3Accordion", {
      filter: ["h3"],
      replacement: (content) => `### ${content}\n\n`,
    });
    turndown.addRule("detailsAccordion", {
      filter: (node) => node.nodeName === "DETAILS",
      replacement: (_content, node) => {
        const element = node as HTMLElement;
        const summary = element.querySelector("summary")?.textContent?.trim() ?? "";
        const clone = element.cloneNode(true) as HTMLElement;
        clone.querySelector("summary")?.remove();
        const body = getTurndown().turndown(clone.innerHTML).trim();
        return `### ${summary}\n\n${body}\n\n`;
      },
    });
  }
  return turndown;
}

export function lessonHtmlToMarkdown(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";
  if (!isLessonHtml(trimmed)) return trimmed;
  return getTurndown().turndown(sanitizeLessonHtml(trimmed)).trim();
}

export function lessonContentEditorMode(content: string): "visual" | "markdown" {
  return isLessonHtml(content) ? "visual" : "markdown";
}

export function lessonContentForVisualEditor(content: string): string {
  return markdownToLessonHtml(content);
}

export function lessonContentForMarkdownEditor(content: string): string {
  return isLessonHtml(content) ? lessonHtmlToMarkdown(content) : content;
}

export function isLessonContentEmpty(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  if (isLessonHtml(trimmed)) {
    const text = trimmed
      .replace(/<br\s*\/?>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    return !text;
  }
  return !trimmed;
}
