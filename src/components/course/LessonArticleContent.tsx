import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { isLessonHtml, sanitizeLessonHtml } from "@/lib/lesson-html";
import { parseInlineMarkdown, parseLessonContent } from "@/lib/parse-lesson-content";

type LessonArticleContentProps = {
  title: string;
  content: string;
  onComplete?: () => void;
};

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

export function LessonArticleContent({ title, content, onComplete }: LessonArticleContentProps) {
  if (isLessonHtml(content)) {
    const safeHtml = sanitizeLessonHtml(content);

    return (
      <div className="prose-lesson border-b border-border bg-card px-4 py-8 sm:px-8 sm:py-10 md:px-10">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <div
          className="lesson-html mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
        {onComplete ? (
          <div className="mt-8 flex justify-end">
            <Button type="button" variant="hero" size="sm" onClick={onComplete}>
              Marquer comme terminé
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  const blocks = parseLessonContent(content);
  const accordionBlocks = blocks.filter((block) => block.type === "accordion");
  const introBlocks = blocks.filter((block) => block.type !== "accordion");

  return (
    <div className="prose-lesson border-b border-border bg-card px-4 py-8 sm:px-8 sm:py-10 md:px-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>

      <div className="mt-6 space-y-4">
        {introBlocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h2 key={index} className="pt-2 font-display text-xl font-bold text-foreground">
                {block.text}
              </h2>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={index} className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                {block.items.map((item) => (
                  <li key={item}>
                    <InlineText text={item} />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={index} className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              <InlineText text={block.text} />
            </p>
          );
        })}
      </div>

      {accordionBlocks.length > 0 ? (
        <div className="mt-8">
          {introBlocks.length === 0 ? (
            <p className="mb-4 text-sm text-muted-foreground">
              Sélectionnez un titre pour en savoir plus.
            </p>
          ) : null}
          <Accordion type="multiple" className="rounded-lg border border-border">
            {accordionBlocks.map((block, index) => (
              <AccordionItem key={`${block.title}-${index}`} value={`item-${index}`} className="px-1">
                <AccordionTrigger className="px-4 text-left text-sm font-semibold hover:no-underline">
                  {block.title}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                  <InlineText text={block.body} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : null}

      {onComplete ? (
        <div className="mt-8 flex justify-end">
          <Button type="button" variant="hero" size="sm" onClick={onComplete}>
            Marquer comme terminé
          </Button>
        </div>
      ) : null}
    </div>
  );
}
