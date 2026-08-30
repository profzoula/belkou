import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getExamEbookForCourse } from "@/lib/exam-ebooks";
import { verifyExamEbookAccessToken } from "@/server/exam-ebook-access";

function examContentRoot(): string {
  return path.join(process.cwd(), "content", "exams");
}

async function readExamQuestionsJson(courseSlug: string): Promise<string | null> {
  const ebook = getExamEbookForCourse(courseSlug);
  if (!ebook) return null;

  const resolvedRoot = path.resolve(examContentRoot());
  const resolvedFile = path.resolve(path.join(resolvedRoot, ebook.questionsPath));
  const rootWithSep = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  if (!resolvedFile.startsWith(rootWithSep) && resolvedFile !== resolvedRoot) {
    return null;
  }

  try {
    return await readFile(resolvedFile, "utf8");
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/exams/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const slug = params.slug?.trim();
        if (!slug || !getExamEbookForCourse(slug)) {
          return new Response(JSON.stringify({ error: "Banque introuvable" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        const url = new URL(request.url);
        const token = url.searchParams.get("token")?.trim() ?? "";
        const verified = verifyExamEbookAccessToken(token, slug);
        if (!verified.ok) {
          return new Response(JSON.stringify({ error: "Accès refusé" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const json = await readExamQuestionsJson(slug);
        if (!json) {
          return new Response(JSON.stringify({ error: "Fichier questions introuvable" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(json, {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "private, no-store",
            "X-Robots-Tag": "noindex, nofollow",
          },
        });
      },
    },
  },
});
