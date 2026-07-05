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
  ],
  ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"],
};

export function isLessonHtml(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  return trimmed.startsWith("<") || /<(?:p|h[2-3]|ul|ol|li|strong|em|br|img)\b/i.test(trimmed);
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
        const title = block.title ? `<h3>${escapeHtml(block.title)}</h3>` : "";
        const body = block.body ? `<p>${inlineMarkdownToHtml(block.body)}</p>` : "";
        return `${title}${body}`;
      }
      return `<p>${inlineMarkdownToHtml(block.text)}</p>`;
    })
    .join("");
}

export function sanitizeLessonHtml(html: string): string {
  return DOMPurify.sanitize(html, LESSON_HTML_CONFIG);
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
