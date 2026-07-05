import { useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Textarea } from "@/components/ui/textarea";
import {
  lessonContentEditorMode,
  lessonContentForMarkdownEditor,
  lessonContentForVisualEditor,
} from "@/lib/lesson-html";
import { cn } from "@/lib/utils";

type LessonContentEditorProps = {
  value: string;
  onChange: (content: string) => void;
  className?: string;
};

type EditorMode = "visual" | "markdown";

export function LessonContentEditor({ value, onChange, className }: LessonContentEditorProps) {
  const [mode, setMode] = useState<EditorMode>(() =>
    value.trim() ? lessonContentEditorMode(value) : "visual",
  );
  const [showMarkdown, setShowMarkdown] = useState(false);

  const switchMode = (next: EditorMode) => {
    if (next === mode) return;

    if (next === "markdown") {
      onChange(lessonContentForMarkdownEditor(value));
    } else {
      onChange(lessonContentForVisualEditor(value));
    }

    setMode(next);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "visual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => {
              setShowMarkdown(false);
              switchMode("visual");
            }}
          >
            Visuel
          </button>
          {showMarkdown ? (
            <button
              type="button"
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "markdown"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => switchMode("markdown")}
            >
              Markdown
            </button>
          ) : null}
        </div>
        {!showMarkdown ? (
          <button
            type="button"
            className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={() => {
              setShowMarkdown(true);
              switchMode("markdown");
            }}
          >
            Mode Markdown (avancé)
          </button>
        ) : null}
      </div>

      {mode === "visual" ? (
        <RichTextEditor
          value={lessonContentForVisualEditor(value)}
          onChange={onChange}
        />
      ) : (
        <>
          <Textarea
            value={lessonContentForMarkdownEditor(value)}
            onChange={(event) => onChange(event.target.value)}
            rows={12}
            className="rounded-lg font-mono text-xs"
            placeholder={
              "## Introduction\n\nTexte du module…\n\n### Section repliable\nContenu accordéon.\n\n- Point 1\n- **Gras**"
            }
          />
          <p className="text-[11px] text-muted-foreground">
            ## titre · ### section repliable · - liste · **gras** · _italique_
          </p>
        </>
      )}
    </div>
  );
}
