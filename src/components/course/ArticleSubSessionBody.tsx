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
        className="lesson-html text-sm leading-relaxed text-muted-foreground sm:text-base"
        dangerouslySetInnerHTML={{ __html: sub.html }}
      />
    );
  }

  if (!sub.blocks.length) {
    return <p className="text-sm italic text-muted-foreground">Contenu à venir.</p>;
  }

  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
      {sub.blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h4 key={index} className="font-display text-base font-bold text-foreground">
              {block.text}
            </h4>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item) => (
                <li key={item}>
                  <InlineText text={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "accordion") {
          return (
            <details key={index} className="rounded-md border border-border px-3 py-2">
              <summary className="cursor-pointer font-semibold text-foreground">{block.title}</summary>
              <p className="mt-2">
                <InlineText text={block.body} />
              </p>
            </details>
          );
        }
        return (
          <p key={index}>
            <InlineText text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
