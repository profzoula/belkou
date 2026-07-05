import { isLessonHtml, sanitizeLessonHtml } from "@/lib/lesson-html";
import type { LessonQuiz } from "@/lib/lesson-quiz";
import { decodeLessonQuizData, extractQuizFromSubSessionHtml } from "@/lib/lesson-quiz";
import { parseInlineMarkdown, parseLessonContent, type LessonContentBlock } from "@/lib/parse-lesson-content";

export type ArticleSubSession = {
  number: string;
  title: string;
  blocks: LessonContentBlock[];
  html?: string;
  quizId?: string;
  quiz?: LessonQuiz;
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
      if (currentSub) {
        currentSub.lines.push(line);
      } else if (current) {
        introLines.push(line);
      }
      continue;
    }

    if (trimmed.startsWith("### ") && current) {
      const heading = trimmed.slice(4).trim();
      if (SUBSESSION_HEADING_RE.test(heading)) {
        flushSub();
        subIndex += 1;
        const sub = parseSubSessionTitle(heading, current.number, subIndex);
        currentSub = sub;
        continue;
      }
      if (currentSub) {
        currentSub.lines.push(line);
      } else {
        introLines.push(line);
      }
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

function isStructuralSessionH2(element: Element): boolean {
  if (element.hasAttribute("data-lesson-session")) return true;
  return parseSessionTitle(element.textContent ?? "") !== null;
}

function isStructuralSubSessionH3(element: Element): boolean {
  if (element.hasAttribute("data-lesson-subsession")) return true;
  const text = element.textContent?.trim() ?? "";
  return SUBSESSION_HEADING_RE.test(text);
}

function collectBlocksUntilHeading(nodes: ChildNode[], start: number): { html: string; next: number } {
  const parts: string[] = [];
  let index = start + 1;
  while (index < nodes.length) {
    const node = nodes[index];
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tag = element.tagName.toLowerCase();
      if (tag === "h2" && isStructuralSessionH2(element)) break;
      if (tag === "h3" && isStructuralSubSessionH3(element)) break;
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
        ? {
            number: Number.parseInt(fromAttr, 10),
            title: readArticleSessionTitle(element, Number.parseInt(fromAttr, 10)),
          }
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
      const legacyQuizId = element.getAttribute("data-lesson-quiz")?.trim() || undefined;
      const quizFromHeading = decodeLessonQuizData(element.getAttribute("data-lesson-quiz-data") ?? "");
      const body = collectBlocksUntilHeading(nodes, index);
      const { quiz: quizFromBody, introHtml } = extractQuizFromSubSessionHtml(body.html || "");
      const quiz = quizFromHeading ?? quizFromBody ?? undefined;
      const quizId = !quiz && legacyQuizId ? legacyQuizId : undefined;
      current.subSessions.push({
        number: sub.number,
        title: sub.title,
        blocks: [],
        html: introHtml || undefined,
        quizId,
        quiz,
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

export function formatArticleSessionHeading(number: number, title: string): string {
  const normalized = title.replace(new RegExp(`^Session\\s*${number}\\s*[—–-]?\\s*`, "i"), "").trim();
  if (!normalized || normalized === `Session ${number}`) {
    return `Session ${number}`;
  }
  return `Session ${number} — ${normalized}`;
}

export function readArticleSessionTitle(element: Element, sessionNumber: number): string {
  const fromAttr = element.getAttribute("data-lesson-session-title")?.trim();
  if (fromAttr) return fromAttr;
  const text = element.textContent?.trim() ?? "";
  return text.replace(new RegExp(`^Session\\s*${sessionNumber}\\s*[—–-]?\\s*`, "i"), "").trim() || `Session ${sessionNumber}`;
}

export function syncArticleSessionHeadingMetadata(root: ParentNode): void {
  root.querySelectorAll("h2[data-lesson-session]").forEach((heading) => {
    const sessionNumber = heading.getAttribute("data-lesson-session");
    if (!sessionNumber) return;
    const number = Number.parseInt(sessionNumber, 10);
    if (!Number.isFinite(number)) return;
    const title = readArticleSessionTitle(heading, number);
    heading.setAttribute("data-lesson-session-title", title);
    heading.textContent = formatArticleSessionHeading(number, title);
  });
}

export function formatSubSessionLabel(sub: ArticleSubSession): string {
  return `${sub.number} ${sub.title}`;
}

export function buildArticleSubSessionId(
  lessonId: string,
  sessionNumber: number,
  subNumber: string,
): string {
  return `${lessonId}::${sessionNumber}::${subNumber}`;
}

export function parseArticleSubSessionId(
  id: string,
): { lessonId: string; sessionNumber: number; subNumber: string } | null {
  const parts = id.split("::");
  if (parts.length !== 3) return null;
  const sessionNumber = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(sessionNumber)) return null;
  return { lessonId: parts[0], sessionNumber, subNumber: parts[2] };
}

export function findArticleSubSession(
  sessions: ArticleSession[],
  sessionNumber: number,
  subNumber: string,
): { session: ArticleSession; sub: ArticleSubSession } | null {
  const session = sessions.find((item) => item.number === sessionNumber);
  if (!session) return null;
  const sub = session.subSessions.find((item) => item.number === subNumber);
  if (!sub) return null;
  return { session, sub };
}

export function getFirstArticleSubSessionId(
  lessonId: string,
  sessions: ArticleSession[],
): string | null {
  const session = sessions[0];
  const sub = session?.subSessions[0];
  if (!session || !sub) return null;
  return buildArticleSubSessionId(lessonId, session.number, sub.number);
}

export type ArticleSubSessionNav = {
  prevId: string | null;
  nextId: string | null;
  prevTitle: string | null;
  nextTitle: string | null;
};

export function getArticleSubSessionNav(
  lessonId: string,
  sessions: ArticleSession[],
  currentId: string,
): ArticleSubSessionNav {
  const flat = sessions.flatMap((session) =>
    session.subSessions.map((sub) => ({
      id: buildArticleSubSessionId(lessonId, session.number, sub.number),
      title: `${sub.number} ${sub.title}`,
    })),
  );
  const index = flat.findIndex((item) => item.id === currentId);
  if (index < 0) {
    return { prevId: null, nextId: null, prevTitle: null, nextTitle: null };
  }
  const prev = flat[index - 1];
  const next = flat[index + 1];
  return {
    prevId: prev?.id ?? null,
    nextId: next?.id ?? null,
    prevTitle: prev?.title ?? null,
    nextTitle: next?.title ?? null,
  };
}

export function flattenArticleSubSessions(
  lessonId: string,
  sessions: ArticleSession[],
): Array<{ id: string; session: ArticleSession; sub: ArticleSubSession }> {
  return sessions.flatMap((session) =>
    session.subSessions.map((sub) => ({
      id: buildArticleSubSessionId(lessonId, session.number, sub.number),
      session,
      sub,
    })),
  );
}
