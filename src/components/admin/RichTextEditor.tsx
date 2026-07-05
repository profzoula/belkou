import { useEffect, useRef, type ReactNode } from "react";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  LayoutTemplate,
  Link2,
  List,
  ListOrdered,
  Minus,
  PanelBottomOpen,
  Quote,
  Table,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizePastedLessonHtml, sanitizeLessonHtml } from "@/lib/lesson-html";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
      aria-label={label}
      title={label}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {children}
    </Button>
  );
}

function ToolbarPill({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-medium"
      title={label}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {icon}
      {label}
    </Button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 hidden h-6 w-px bg-border sm:block" />;
}

export const LESSON_VISUAL_STARTER_HTML = `<h2>Titre du module</h2>
<p>Écrivez une courte introduction ici.</p>
<ul>
<li>Premier point important</li>
<li>Deuxième point important</li>
</ul>
<details>
<summary>Section repliable — cliquez pour ouvrir</summary>
<p>Ajoutez les détails ici. Les élèves verront un accordéon.</p>
</details>`;

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Cliquez « Modèle » pour commencer, ou écrivez directement ici…",
  className,
  minHeightClassName = "min-h-[280px]",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastValue.current) return;
    editor.innerHTML = value || "";
    lastValue.current = value;
  }, [value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = sanitizeLessonHtml(editor.innerHTML);
    lastValue.current = html;
    onChange(html);
  };

  const exec = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const insertHtml = (html: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, sanitizeLessonHtml(html));
    emitChange();
  };

  const insertLink = () => {
    const url = window.prompt("Collez l'URL du lien (https://…)");
    if (!url?.trim()) return;
    exec("createLink", url.trim());
  };

  const insertImage = () => {
    const url = window.prompt("Collez l'URL de l'image (https://…)");
    if (!url?.trim()) return;
    exec("insertImage", url.trim());
  };

  const insertCollapsible = () => {
    const title = window.prompt("Titre de la section repliable (ex. « Kisa yon Development Environment ye? »)");
    if (!title?.trim()) return;
    insertHtml(
      `<details><summary>${escapeHtml(title.trim())}</summary><p>Écrivez le contenu de la section ici…</p></details>`,
    );
  };

  const insertTable = () => {
    insertHtml(
      `<table>
<thead><tr><th>Élément</th><th>Minimòm</th><th>Ideyal</th></tr></thead>
<tbody>
<tr><td>RAM</td><td>8 Go</td><td>16 Go</td></tr>
<tr><td>CPU</td><td>4 kò</td><td>8 kò</td></tr>
</tbody>
</table>`,
    );
  };

  const insertCodeBlock = () => {
    const code = window.prompt("Collez le code (ou laissez vide pour un exemple)")?.trim();
    insertHtml(`<pre><code>${escapeHtml(code || "npm install")}</code></pre>`);
  };

  const insertTemplate = () => {
    const editor = editorRef.current;
    const hasContent = Boolean(editor?.textContent?.trim());
    if (hasContent && !window.confirm("Remplacer le contenu actuel par le modèle ?")) return;
    if (editor) {
      editor.innerHTML = LESSON_VISUAL_STARTER_HTML;
      emitChange();
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-background", className)}>
      <div className="space-y-2 border-b border-border bg-muted/30 px-2 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarPill
            label="Modèle"
            icon={<LayoutTemplate className="h-3.5 w-3.5" />}
            onClick={insertTemplate}
          />
          <ToolbarPill
            label="Section ▾"
            icon={<PanelBottomOpen className="h-3.5 w-3.5" />}
            onClick={insertCollapsible}
          />
          <ToolbarPill label="Tableau" icon={<Table className="h-3.5 w-3.5" />} onClick={insertTable} />
          <ToolbarDivider />
          <ToolbarButton label="Gras" onClick={() => exec("bold")}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Italique" onClick={() => exec("italic")}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Souligné" onClick={() => exec("underline")}>
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Grand titre (H2)" onClick={() => exec("formatBlock", "h2")}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Sous-titre (H3)" onClick={() => exec("formatBlock", "h3")}>
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Liste à puces" onClick={() => exec("insertUnorderedList")}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Liste numérotée" onClick={() => exec("insertOrderedList")}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Citation" onClick={() => exec("formatBlock", "blockquote")}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Bloc de code" onClick={insertCodeBlock}>
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Séparateur" onClick={() => insertHtml("<hr>")}>
            <Minus className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Lien" onClick={insertLink}>
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Image" onClick={insertImage}>
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground px-0.5">
          <strong className="text-foreground">Modèle</strong> = structure prête ·{" "}
          <strong className="text-foreground">Section ▾</strong> = bloc repliable pour les élèves ·
          collez depuis Word/Google Docs — listes et titres sont conservés automatiquement.
        </p>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={(event) => {
          event.preventDefault();
          const html = event.clipboardData.getData("text/html");
          const text = event.clipboardData.getData("text/plain");
          const inserted = normalizePastedLessonHtml(html, text);
          document.execCommand("insertHTML", false, inserted);
          emitChange();
        }}
        className={cn(
          "rich-text-editor lesson-html px-4 py-4 text-sm leading-relaxed text-foreground outline-none",
          minHeightClassName,
        )}
      />
    </div>
  );
}
