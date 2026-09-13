/**
 * Sanitize blog HTML without isomorphic-dompurify/jsdom.
 * Those can throw `Cannot read properties of undefined (reading 'bind')`
 * on some Node/SSR runtimes and break /blog.
 *
 * Content is authored by admins; we still strip the common XSS vectors.
 */
export function sanitizeBlogHtml(html: string): string {
  const input = String(html ?? "");
  if (!input.trim()) return "";

  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, (block) => {
      if (
        /youtube\.com|youtube-nocookie\.com|player\.vimeo\.com|open\.spotify\.com|google\.[^"' ]*\/maps|maps\.google/i.test(
          block,
        )
      ) {
        return block;
      }
      return "";
    })
    .replace(/<iframe\b[^>]*\/?>/gi, (tag) => {
      if (
        /youtube\.com|youtube-nocookie\.com|player\.vimeo\.com|open\.spotify\.com|google\.[^"' ]*\/maps|maps\.google/i.test(
          tag,
        )
      ) {
        return tag;
      }
      return "";
    })
    .replace(/\son\w+\s*=\s*(['"])[\s\S]*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "");
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Word / Docs paste: keep headings, lists, bold — drop MSO wrappers. */
export function cleanPastedHtml(html: string): string {
  let input = String(html ?? "");
  if (!input.trim()) return "";
  input = input
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<o:p\b[^>]*>[\s\S]*?<\/o:p>/gi, "")
    .replace(/<\/?o:\w+[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "")
    .replace(/<xml[\s\S]*?<\/xml>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<link\b[^>]*>/gi, "");

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(input, "text/html");
    input = doc.body?.innerHTML ?? input;
  }

  return sanitizeBlogHtml(input);
}

export function markdownishToHtml(text: string): string {
  const lines = String(text ?? "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  const para: string[] = [];

  const closeList = () => {
    if (!list) return;
    out.push(list === "ul" ? "</ul>" : "</ol>");
    list = null;
  };
  const flushPara = () => {
    if (!para.length) return;
    out.push(`<p>${para.map(escapeHtmlText).join("<br>")}</p>`);
    para.length = 0;
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      flushPara();
      const level = heading[1].length;
      out.push(`<h${level}>${escapeHtmlText(heading[2] ?? "")}</h${level}>`);
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      closeList();
      flushPara();
      out.push("<hr />");
      continue;
    }
    const ul = line.match(/^\s*[-*]\s+(.+)$/);
    if (ul) {
      flushPara();
      if (list !== "ul") {
        closeList();
        out.push("<ul>");
        list = "ul";
      }
      out.push(`<li>${escapeHtmlText(ul[1] ?? "")}</li>`);
      continue;
    }
    const ol = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ol) {
      flushPara();
      if (list !== "ol") {
        closeList();
        out.push("<ol>");
        list = "ol";
      }
      out.push(`<li>${escapeHtmlText(ol[1] ?? "")}</li>`);
      continue;
    }
    if (!line.trim()) {
      closeList();
      flushPara();
      continue;
    }
    closeList();
    para.push(line);
  }
  closeList();
  flushPara();
  return out.join("");
}

function looksLikeRichHtml(html: string): boolean {
  return /<(h[1-6]|ul|ol|li|table|blockquote|strong|b|em|i|a\s|img|p\b)/i.test(html);
}

/** Clipboard → HTML that keeps headings, lists and line breaks. */
export function clipboardToHtml(html: string, text: string): string {
  const rawHtml = String(html ?? "").trim();
  const rawText = String(text ?? "");
  if (rawHtml && looksLikeRichHtml(rawHtml)) {
    return cleanPastedHtml(rawHtml);
  }
  if (rawText.trim()) return markdownishToHtml(rawText);
  return rawHtml ? cleanPastedHtml(rawHtml) : "";
}
