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
      if (/youtube\.com|youtube-nocookie\.com|player\.vimeo\.com/i.test(block)) {
        return block;
      }
      return "";
    })
    .replace(/<iframe\b[^>]*\/?>/gi, (tag) => {
      if (/youtube\.com|youtube-nocookie\.com|player\.vimeo\.com/i.test(tag)) {
        return tag;
      }
      return "";
    })
    .replace(/\son\w+\s*=\s*(['"])[\s\S]*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "");
}
