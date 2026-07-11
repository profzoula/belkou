import { parseInlineMarkdown } from "@/lib/parse-lesson-content";
import type { ArticleSubSession } from "@/lib/lesson-sessions";

function InlineText({ text }: { text: string }) {
  const segments = parseInlineMarkdown(text);
  return (
    <>
      {segments.map((segment, index) =>
        segment.type === "bold" ? (
          <strong key={index} className="font-semibold text-foreground">
            {segment.value}
          </strong>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </>
  );
}

export function ArticleSubSessionBody({ sub }: { sub: ArticleSubSession }) {
  if (sub.html) {
    return (
      <div
        className="lesson-html lesson-article-rich text-sm leading-relaxed text-muted-foreground sm:text-base"
        dangerouslySetInnerHTML={{ __html: sub.html }}
      />
    );
  }

  if (!sub.blocks.length) {
    return <p className="text-sm italic text-muted-foreground">Contenu à venir.</p>;
  }

  return (
    <div className="lesson-article-rich space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
      {sub.blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h4
              key={index}
              className="mt-4 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/60 px-4 py-2 font-display text-base font-bold text-foreground dark:bg-emerald-950/25"
            >
              {block.text}
            </h4>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="lesson-rich-list space-y-2 rounded-xl border border-border bg-muted/25 p-4">
              {block.items.map((item) => (
                <li key={item} className="relative list-none pl-5 before:absolute before:left-0 before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-emerald-500">
                  <InlineText text={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "accordion") {
          return (
            <details
              key={index}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
              <summary className="cursor-pointer bg-muted/30 px-4 py-3 font-semibold text-foreground transition-colors group-open:bg-primary/5">
                {block.title}
              </summary>
              <p className="border-t border-border px-4 py-3">
                <InlineText text={block.body} />
              </p>
            </details>
          );
        }
        return (
          <p key={index} className="leading-relaxed">
            <InlineText text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
