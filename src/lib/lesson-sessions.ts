import { isLessonHtml, sanitizeLessonHtml } from "@/lib/lesson-html";
import { parseInlineMarkdown, parseLessonContent, type LessonContentBlock } from "@/lib/parse-lesson-content";

export type ArticleSubSession = {
  number: string;
  title: string;
  blocks: LessonContentBlock[];
  html?: string;
};

export type ArticleSession = {
  number: number;
  title: string;
  introBlocks: LessonContentBlock[];
  introHtml?: string;
  subSessions: ArticleSubSession[];
};

const SESSION_HEADING_RE = /^session\s*(\d+)(?:\s*[—–-]\s*(.+))?$/i;
const SUBSESSION_HEADING_RE = /^(\d+\.\d+)\s*[—–-]?\s*(.+)$/;

function blocksToHtml(blocks: LessonContentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "heading") return `<h2>${block.text}</h2>`;
      if (block.type === "list") {
        return `<ul>${block.items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
      }
      if (block.type === "accordion") {
        return `<details><summary>${block.title}</summary><p>${block.body}</p></details>`;
      }
      return `<p>${block.text}</p>`;
    })
    .join("");
}

function parseSessionTitle(raw: string): { number: number; title: string } | null {
  const match = raw.trim().match(SESSION_HEADING_RE);
  if (!match) return null;
  const number = Number.parseInt(match[1], 10);
  const title = (match[2]?.trim() || `Session ${number}`).trim();
  return { number, title };
}

function parseSubSessionTitle(raw: string, sessionNumber: number, index: number): { number: string; title: string } {
  const trimmed = raw.trim();
  const explicit = trimmed.match(SUBSESSION_HEADING_RE);
  if (explicit) {
    return { number: explicit[1], title: explicit[2].trim() };
  }
  return { number: `${sessionNumber}.${index}`, title: trimmed };
}

function isSessionHeadingText(text: string): boolean {
  return SESSION_HEADING_RE.test(text.trim());
}

export function hasArticleSessionStructure(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;

  if (isLessonHtml(trimmed)) {
    if (typeof document === "undefined") {
      return /data-lesson-session|lesson-session/i.test(trimmed) || /Session\s*\d+/i.test(trimmed);
    }
    const doc = new DOMParser().parseFromString(sanitizeLessonHtml(trimmed), "text/html");
    for (const h2 of doc.body.querySelectorAll("h2")) {
      if (h2.hasAttribute("data-lesson-session") || isSessionHeadingText(h2.textContent ?? "")) {
        return true;
      }
    }
    return false;
  }

  return trimmed.split(/\r?\n/).some((line) => {
    const text = line.trim().replace(/^##\s+/, "");
    return line.trim().startsWith("## ") && isSessionHeadingText(text);
  });
}

function parseMarkdownSessions(raw: string): ArticleSession[] | null {
  const lines = raw.split(/\r?\n/);
  const sessions: ArticleSession[] = [];
  let current: ArticleSession | null = null;
  let currentSub: { number: string; title: string; lines: string[] } | null = null;
  let introLines: string[] = [];
  let subIndex = 0;

  const flushSub = () => {
    if (!current || !currentSub) return;
    const body = currentSub.lines.join("\n").trim();
    const blocks = body ? parseLessonContent(body) : [];
    current.subSessions.push({
      number: currentSub.number,
      title: currentSub.title,
      blocks,
      html: blocks.length ? blocksToHtml(blocks) : undefined,
    });
    currentSub = null;
  };

  const flushIntro = () => {
    if (!current) return;
    const intro = introLines.join("\n").trim();
    if (intro) {
      current.introBlocks = parseLessonContent(intro);
      current.introHtml = blocksToHtml(current.introBlocks);
    }
    introLines = [];
  };

  const startSession = (number: number, title: string) => {
    flushSub();
    flushIntro();
    current = { number, title, introBlocks: [], subSessions: [] };
    sessions.push(current);
    subIndex = 0;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      const heading = trimmed.slice(3).trim();
      const session = parseSessionTitle(heading);
      if (session) {
        startSession(session.number, session.title);
        continue;
      }
    }

    if (trimmed.startsWith("### ") && current) {
      flushSub();
      subIndex += 1;
      const sub = parseSubSessionTitle(trimmed.slice(4).trim(), current.number, subIndex);
      currentSub = sub;
      continue;
    }

    if (currentSub) {
      currentSub.lines.push(line);
    } else if (current) {
      introLines.push(line);
    }
  }

  flushSub();
  flushIntro();

  return sessions.length ? sessions : null;
}

function collectBlocksUntilHeading(nodes: ChildNode[], start: number): { html: string; next: number } {
  const parts: string[] = [];
  let index = start + 1;
  while (index < nodes.length) {
    const node = nodes[index];
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName.toLowerCase();
      if (tag === "h2" || tag === "h3") break;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      parts.push((node as Element).outerHTML);
    } else if (node.textContent?.trim()) {
      parts.push(`<p>${node.textContent}</p>`);
    }
    index += 1;
  }
  return { html: sanitizeLessonHtml(parts.join("")), next: index };
}

function parseHtmlSessions(raw: string): ArticleSession[] | null {
  if (typeof document === "undefined") return null;

  const doc = new DOMParser().parseFromString(sanitizeLessonHtml(raw), "text/html");
  const nodes = [...doc.body.childNodes];
  const sessions: ArticleSession[] = [];
  let current: ArticleSession | null = null;
  let subIndex = 0;

  const startSession = (number: number, title: string) => {
    current = { number, title, introBlocks: [], subSessions: [] };
    sessions.push(current);
    subIndex = 0;
  };

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const element = node as Element;
    const tag = element.tagName.toLowerCase();

    if (tag === "h2") {
      const fromAttr = element.getAttribute("data-lesson-session");
      const text = element.textContent?.trim() ?? "";
      const parsed = fromAttr
        ? { number: Number.parseInt(fromAttr, 10), title: text.replace(/^Session\s*\d+\s*[—–-]?\s*/i, "").trim() || `Session ${fromAttr}` }
        : parseSessionTitle(text);

      if (parsed) {
        startSession(parsed.number, parsed.title || `Session ${parsed.number}`);
        const intro = collectBlocksUntilHeading(nodes, index);
        if (intro.html) {
          current!.introHtml = intro.html;
        }
        index = intro.next - 1;
        continue;
      }
    }

    if (tag === "h3" && current) {
      subIndex += 1;
      const text = element.textContent?.trim() ?? "";
      const sub = parseSubSessionTitle(text, current.number, subIndex);
      const body = collectBlocksUntilHeading(nodes, index);
      current.subSessions.push({
        number: sub.number,
        title: sub.title,
        blocks: [],
        html: body.html || undefined,
      });
      index = body.next - 1;
    }
  }

  return sessions.length ? sessions : null;
}

export function parseArticleSessions(content: string): ArticleSession[] | null {
  const trimmed = content.trim();
  if (!trimmed || !hasArticleSessionStructure(trimmed)) return null;

  if (isLessonHtml(trimmed)) {
    return parseHtmlSessions(trimmed);
  }

  return parseMarkdownSessions(trimmed);
}

export function formatSessionLabel(session: ArticleSession): string {
  return `Session ${session.number}`;
}

export function formatSubSessionLabel(sub: ArticleSubSession): string {
  return `${sub.number} ${sub.title}`;
}
