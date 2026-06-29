export type LessonContentBlock =
  | { type: "heading"; level: 2; text: string }
  | { type: "paragraph"; text: string }
  | { type: "accordion"; title: string; body: string }
  | { type: "list"; items: string[] };

export type InlineSegment = { type: "text"; value: string } | { type: "bold"; value: string };

function flushParagraph(lines: string[], blocks: LessonContentBlock[]) {
  const text = lines.join("\n").trim();
  if (text) {
    blocks.push({ type: "paragraph", text });
  }
  lines.length = 0;
}

function flushAccordion(accordion: { title: string; lines: string[] } | null, blocks: LessonContentBlock[]) {
  if (!accordion) return;
  const body = accordion.lines.join("\n").trim();
  if (accordion.title || body) {
    blocks.push({ type: "accordion", title: accordion.title, body });
  }
}

export function parseLessonContent(raw: string): LessonContentBlock[] {
  const blocks: LessonContentBlock[] = [];
  const paragraphLines: string[] = [];
  let accordion: { title: string; lines: string[] } | null = null;
  let listItems: string[] | null = null;

  const flushList = () => {
    if (listItems?.length) {
      blocks.push({ type: "list", items: listItems });
    }
    listItems = null;
  };

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      flushList();
      flushParagraph(paragraphLines, blocks);
      flushAccordion(accordion, blocks);
      accordion = { title: trimmed.slice(4).trim(), lines: [] };
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      flushParagraph(paragraphLines, blocks);
      flushAccordion(accordion, blocks);
      accordion = null;
      blocks.push({ type: "heading", level: 2, text: trimmed.slice(3).trim() });
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph(paragraphLines, blocks);
      flushAccordion(accordion, blocks);
      accordion = null;
      if (!listItems) listItems = [];
      listItems.push(trimmed.slice(2).trim());
      continue;
    }

    if (listItems) {
      flushList();
    }

    if (accordion) {
      accordion.lines.push(line);
    } else {
      paragraphLines.push(line);
    }
  }

  flushList();
  flushParagraph(paragraphLines, blocks);
  flushAccordion(accordion, blocks);

  return blocks;
}

export function parseInlineMarkdown(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**")) {
      segments.push({ type: "bold", value: part.slice(2, -2) });
    } else {
      segments.push({ type: "text", value: part });
    }
  }

  return segments;
}
