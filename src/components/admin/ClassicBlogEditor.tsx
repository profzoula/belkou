import { useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Expand,
  Eye,
  ImageIcon,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  MoreHorizontal,
  Quote,
  Unlink,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugifyBlog, type StoredBlogPost } from "@/lib/blog-blocks";
import { blogCategories } from "@/lib/blog";
import { sanitizeBlogHtml } from "@/lib/blog-html";
import {
  getPostContentHtml,
  withPostContentHtml,
} from "@/lib/blog-storage";
import { adminUploadBlogImage } from "@/lib/fns/admin";
import { cn } from "@/lib/utils";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Lecture impossible"));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Fichier invalide"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.readAsDataURL(file);
  });
}

type ClassicBlogEditorProps = {
  post: StoredBlogPost;
  onChange: (post: StoredBlogPost) => void;
  onSave: (status?: StoredBlogPost["status"]) => void;
  onClose: () => void;
  saving?: boolean;
  categoryOptions?: string[];
};

type EditorMode = "visual" | "text";

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
  active,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={cn(
        "grid size-8 place-items-center rounded-sm text-[#2c3338] transition-colors hover:bg-[#dcdcde]",
        active && "bg-[#dcdcde]",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-6 w-px bg-[#c3c4c7]" aria-hidden />;
}

export function ClassicBlogEditor({
  post,
  onChange,
  onSave,
  onClose,
  saving,
  categoryOptions,
}: ClassicBlogEditorProps) {
  const categories =
    categoryOptions && categoryOptions.length > 0
      ? categoryOptions
      : [...blogCategories];
  const [mode, setMode] = useState<EditorMode>("visual");
  const [kitchenSink, setKitchenSink] = useState(false);
  const [distractionFree, setDistractionFree] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const lastHtml = useRef<string | null>(null);
  const contentHtml = getPostContentHtml(post);
  const uploadImageFn = useServerFn(adminUploadBlogImage);

  useEffect(() => {
    if (mode !== "visual") return;
    const editor = editorRef.current;
    if (!editor || contentHtml === lastHtml.current) return;
    editor.innerHTML = contentHtml || "<p><br></p>";
    lastHtml.current = contentHtml;
  }, [contentHtml, mode]);

  const patchPost = (patch: Partial<StoredBlogPost>) => {
    onChange({ ...post, ...patch, updatedAt: new Date().toISOString() });
  };

  const setHtml = (html: string) => {
    const cleaned = sanitizeBlogHtml(html);
    lastHtml.current = cleaned;
    onChange(withPostContentHtml(post, cleaned));
  };

  const flushVisual = () => {
    const editor = editorRef.current;
    if (!editor) return contentHtml;
    const html = sanitizeBlogHtml(editor.innerHTML);
    lastHtml.current = html;
    onChange(withPostContentHtml(post, html));
    return html;
  };

  const switchMode = (next: EditorMode) => {
    if (next === mode) return;
    if (mode === "visual") {
      flushVisual();
    } else if (textRef.current) {
      setHtml(textRef.current.value);
    }
    setMode(next);
  };

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    flushVisual();
  };

  const insertHtml = (html: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, sanitizeBlogHtml(html));
    flushVisual();
  };

  const uploadImageFile = async (file: File): Promise<string | null> => {
    if (!IMAGE_ACCEPT.split(",").includes(file.type)) {
      toast.error("Format non supporté (JPG, PNG, WebP, GIF)");
      return null;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image trop volumineuse (max 5 Mo)");
      return null;
    }
    const dataBase64 = await readFileAsBase64(file);
    const result = await uploadImageFn({
      data: {
        postId: post.id,
        contentType: file.type,
        dataBase64,
      },
    });
    return result.publicUrl;
  };

  const insertMediaFromUrl = (url: string, alt = "") => {
    insertHtml(
      `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" /><figcaption></figcaption></figure><p></p>`,
    );
  };

  const insertMedia = () => {
    mediaInputRef.current?.click();
  };

  const handleMediaFile = async (file: File) => {
    setUploadingMedia(true);
    try {
      const publicUrl = await uploadImageFile(file);
      if (!publicUrl) return;
      const alt = window.prompt("Texte alternatif (alt)", file.name.replace(/\.[^.]+$/, "")) ?? "";
      insertMediaFromUrl(publicUrl, alt);
      toast.success("Image ajoutée dans l’article");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  };

  const handleCoverFile = async (file: File) => {
    setUploadingCover(true);
    try {
      const publicUrl = await uploadImageFile(file);
      if (!publicUrl) return;
      patchPost({ coverImageUrl: publicUrl, coverAlt: file.name.replace(/\.[^.]+$/, "") });
      toast.success("Image de couverture enregistrée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const insertLink = () => {
    const url = window.prompt("Collez l’URL du lien (https://…)");
    if (!url?.trim()) return;
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      exec("createLink", url.trim());
      return;
    }
    insertHtml(
      `<a href="${escapeHtml(url.trim())}" target="_blank" rel="noopener noreferrer">${escapeHtml(url.trim())}</a>`,
    );
  };

  const insertMore = () => {
    insertHtml(`<!--more--><hr class="wp-more" /><p></p>`);
  };

  const applyBlockFormat = (tag: string) => {
    if (tag === "p") {
      exec("formatBlock", "p");
      return;
    }
    exec("formatBlock", tag);
  };

  const handleSave = (status?: StoredBlogPost["status"]) => {
    if (mode === "visual") flushVisual();
    else if (textRef.current) setHtml(textRef.current.value);
    onSave(status);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-[#f0f0f1] text-[#1d2327]",
        distractionFree && "bg-white",
      )}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[#c3c4c7] bg-white px-3">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          ← Articles
        </Button>
        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="truncate text-sm font-semibold">{post.title || "Sans titre"}</p>
          <p className="text-[11px] text-[#646970]">
            Classic Editor ·{" "}
            {post.status === "published"
              ? "Publié"
              : post.status === "scheduled"
                ? "Planifié"
                : post.status === "private"
                  ? "Privé"
                  : "Brouillon"}
            {" · "}
            {post.readMinutes} min
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-sm" asChild>
          <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
            <Eye className="size-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-sm"
          disabled={saving}
          onClick={() => handleSave("draft")}
        >
          Enregistrer
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-sm bg-[#2271b1] text-white hover:bg-[#135e96]"
          disabled={saving}
          onClick={() => handleSave("published")}
        >
          {saving ? "…" : "Publier"}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            "min-w-0 flex-1 overflow-y-auto p-4 sm:p-6",
            distractionFree && "mx-auto max-w-3xl",
          )}
        >
          <div className={cn("mx-auto max-w-4xl space-y-4", distractionFree && "max-w-none")}>
            {!distractionFree ? (
              <Input
                value={post.title}
                onChange={(e) => {
                  const title = e.target.value;
                  patchPost({
                    title,
                    slug:
                      !post.slug || post.slug.startsWith("nouvel-article")
                        ? slugifyBlog(title)
                        : post.slug,
                  });
                }}
                placeholder="Ajouter un titre"
                className="h-auto rounded-sm border-[#8c8f94] bg-white px-3 py-3 text-2xl font-normal shadow-none focus-visible:ring-[#2271b1]"
              />
            ) : null}

            {/* Classic Editor chrome */}
            <div className="overflow-hidden rounded-sm border border-[#8c8f94] bg-white shadow-sm">
              <input
                ref={mediaInputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                className="hidden"
                disabled={uploadingMedia || mode !== "visual"}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleMediaFile(file);
                }}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] bg-[#f6f7f7] px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 rounded-sm border-[#8c8f94] bg-white text-xs font-medium"
                    onClick={insertMedia}
                    disabled={mode !== "visual" || uploadingMedia}
                  >
                    {uploadingMedia ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="size-3.5" />
                    )}
                    {uploadingMedia ? "Envoi…" : "Ajouter un média"}
                  </Button>
                  <button
                    type="button"
                    className="text-[11px] text-[#646970] underline-offset-2 hover:text-[#1d2327] hover:underline disabled:opacity-50"
                    disabled={mode !== "visual" || uploadingMedia}
                    onClick={() => {
                      const url = window.prompt("Ou collez une URL d’image (https://…)");
                      if (!url?.trim()) return;
                      const alt = window.prompt("Texte alternatif (alt)", "") ?? "";
                      insertMediaFromUrl(url.trim(), alt);
                    }}
                  >
                    Coller une URL
                  </button>
                </div>
                <div className="flex overflow-hidden rounded-sm border border-[#c3c4c7]">
                  <button
                    type="button"
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium",
                      mode === "visual"
                        ? "bg-white text-[#1d2327]"
                        : "bg-[#dcdcde] text-[#2c3338] hover:bg-[#c3c4c7]",
                    )}
                    onClick={() => switchMode("visual")}
                  >
                    Visuel
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "border-l border-[#c3c4c7] px-3 py-1.5 text-xs font-medium",
                      mode === "text"
                        ? "bg-white text-[#1d2327]"
                        : "bg-[#dcdcde] text-[#2c3338] hover:bg-[#c3c4c7]",
                    )}
                    onClick={() => switchMode("text")}
                  >
                    Texte
                  </button>
                </div>
              </div>

              {mode === "visual" ? (
                <>
                  <div className="flex flex-wrap items-center gap-0.5 border-b border-[#c3c4c7] bg-[#f6f7f7] px-1.5 py-1">
                    <select
                      className="mr-1 h-8 rounded-sm border border-[#8c8f94] bg-white px-2 text-xs"
                      defaultValue="p"
                      onChange={(e) => applyBlockFormat(e.target.value)}
                      aria-label="Format"
                    >
                      <option value="p">Paragraphe</option>
                      <option value="h2">Titre 2</option>
                      <option value="h3">Titre 3</option>
                      <option value="h4">Titre 4</option>
                      <option value="pre">Préformaté</option>
                    </select>
                    <ToolbarButton label="Gras" onClick={() => exec("bold")}>
                      <Bold className="size-3.5" strokeWidth={2.5} />
                    </ToolbarButton>
                    <ToolbarButton label="Italique" onClick={() => exec("italic")}>
                      <Italic className="size-3.5" />
                    </ToolbarButton>
                    <ToolbarDivider />
                    <ToolbarButton label="Liste à puces" onClick={() => exec("insertUnorderedList")}>
                      <List className="size-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Liste numérotée"
                      onClick={() => exec("insertOrderedList")}
                    >
                      <ListOrdered className="size-3.5" />
                    </ToolbarButton>
                    <ToolbarButton label="Citation" onClick={() => applyBlockFormat("blockquote")}>
                      <Quote className="size-3.5" />
                    </ToolbarButton>
                    <ToolbarDivider />
                    <ToolbarButton label="Aligner à gauche" onClick={() => exec("justifyLeft")}>
                      <AlignLeft className="size-3.5" />
                    </ToolbarButton>
                    <ToolbarButton label="Centrer" onClick={() => exec("justifyCenter")}>
                      <AlignCenter className="size-3.5" />
                    </ToolbarButton>
                    <ToolbarButton label="Aligner à droite" onClick={() => exec("justifyRight")}>
                      <AlignRight className="size-3.5" />
                    </ToolbarButton>
                    <ToolbarDivider />
                    <ToolbarButton label="Insérer/modifier un lien" onClick={insertLink}>
                      <Link2 className="size-3.5" />
                    </ToolbarButton>
                    <ToolbarButton label="Supprimer le lien" onClick={() => exec("unlink")}>
                      <Link2Off className="size-3.5" />
                    </ToolbarButton>
                    <ToolbarButton label="Balise « Lire la suite »" onClick={insertMore}>
                      <MoreHorizontal className="size-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Afficher/masquer la barre d’outils"
                      onClick={() => setKitchenSink((v) => !v)}
                      active={kitchenSink}
                    >
                      <Expand className="size-3.5" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Mode sans distraction"
                      onClick={() => setDistractionFree((v) => !v)}
                      active={distractionFree}
                    >
                      <Maximize2 className="size-3.5" />
                    </ToolbarButton>
                  </div>

                  {kitchenSink ? (
                    <div className="flex flex-wrap items-center gap-0.5 border-b border-[#c3c4c7] bg-[#f6f7f7] px-1.5 py-1">
                      <ToolbarButton label="Souligner" onClick={() => exec("underline")}>
                        <span className="text-xs font-semibold underline">U</span>
                      </ToolbarButton>
                      <ToolbarButton label="Barré" onClick={() => exec("strikeThrough")}>
                        <span className="text-xs line-through">S</span>
                      </ToolbarButton>
                      <ToolbarButton
                        label="Couleur du texte"
                        onClick={() => {
                          const color = window.prompt("Couleur CSS (ex. #0056D2)", "#0056D2");
                          if (color?.trim()) exec("foreColor", color.trim());
                        }}
                      >
                        <span className="text-xs font-bold text-[#2271b1]">A</span>
                      </ToolbarButton>
                      <ToolbarButton
                        label="Code"
                        onClick={() =>
                          insertHtml("<pre><code>// votre code</code></pre><p></p>")
                        }
                      >
                        <span className="font-mono text-[10px]">&lt;/&gt;</span>
                      </ToolbarButton>
                      <ToolbarButton
                        label="Ligne horizontale"
                        onClick={() => insertHtml("<hr /><p></p>")}
                      >
                        <Unlink className="size-3.5 rotate-90" />
                      </ToolbarButton>
                      <ToolbarButton label="Annuler" onClick={() => exec("undo")}>
                        <span className="text-xs">↶</span>
                      </ToolbarButton>
                      <ToolbarButton label="Rétablir" onClick={() => exec("redo")}>
                        <span className="text-xs">↷</span>
                      </ToolbarButton>
                    </div>
                  ) : null}

                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline
                    aria-label="Contenu de l’article"
                    className="classic-blog-editor min-h-[420px] bg-white px-4 py-3 text-[15px] leading-7 outline-none sm:px-6 sm:py-5 [&_a]:text-[#2271b1] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[#c3c4c7] [&_blockquote]:pl-4 [&_blockquote]:italic [&_figure]:my-4 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:max-w-full [&_img]:rounded-sm [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-sm [&_pre]:bg-[#f6f7f7] [&_pre]:p-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
                    onInput={flushVisual}
                    onBlur={flushVisual}
                    onPaste={(event) => {
                      event.preventDefault();
                      const html = event.clipboardData.getData("text/html");
                      const text = event.clipboardData.getData("text/plain");
                      if (html) {
                        document.execCommand("insertHTML", false, sanitizeBlogHtml(html));
                      } else {
                        document.execCommand("insertText", false, text);
                      }
                      flushVisual();
                    }}
                  />
                </>
              ) : (
                <Textarea
                  ref={textRef}
                  defaultValue={contentHtml}
                  key={`text-${post.id}-${mode}`}
                  onChange={(e) => setHtml(e.target.value)}
                  className="min-h-[420px] resize-y rounded-none border-0 bg-white font-mono text-[13px] leading-6 shadow-none focus-visible:ring-0"
                  spellCheck={false}
                  aria-label="HTML de l’article"
                />
              )}
            </div>
          </div>
        </div>

        {!distractionFree ? (
          <aside className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-[#c3c4c7] bg-white p-4 lg:block">
            <p className="mb-3 text-[11px] font-semibold tracking-wide text-[#646970] uppercase">
              Article
            </p>
            <div className="space-y-4">
              <Field label="État">
                <select
                  className="flex h-9 w-full rounded-sm border border-[#8c8f94] bg-white px-2 text-sm"
                  value={post.status}
                  onChange={(e) =>
                    patchPost({ status: e.target.value as StoredBlogPost["status"] })
                  }
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="scheduled">Planifié</option>
                  <option value="private">Privé</option>
                </select>
              </Field>
              {post.status === "scheduled" ? (
                <Field label="Publication planifiée">
                  <Input
                    type="datetime-local"
                    value={post.scheduledAt?.slice(0, 16) ?? ""}
                    onChange={(e) => patchPost({ scheduledAt: e.target.value || null })}
                    className="rounded-sm"
                  />
                </Field>
              ) : null}
              <Field label="Slug (URL)">
                <Input
                  value={post.slug}
                  onChange={(e) => patchPost({ slug: slugifyBlog(e.target.value) })}
                  className="rounded-sm"
                />
              </Field>
              <Field label="Extrait">
                <Textarea
                  rows={3}
                  value={post.excerpt}
                  onChange={(e) => patchPost({ excerpt: e.target.value })}
                  className="rounded-sm"
                />
              </Field>
              <Field label="Catégorie">
                <select
                  className="flex h-9 w-full rounded-sm border border-[#8c8f94] bg-white px-2 text-sm"
                  value={post.category}
                  onChange={(e) => patchPost({ category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {!categories.includes(post.category) ? (
                    <option value={post.category}>{post.category}</option>
                  ) : null}
                </select>
              </Field>
              <Field label="Étiquettes (virgules)">
                <Input
                  value={post.tags.join(", ")}
                  onChange={(e) =>
                    patchPost({
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  className="rounded-sm"
                />
              </Field>
              <Field label="Image de couverture">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  disabled={uploadingCover}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleCoverFile(file);
                  }}
                />
                {post.coverImageUrl ? (
                  <div className="mb-2 overflow-hidden rounded-sm border border-[#c3c4c7]">
                    <img
                      src={post.coverImageUrl}
                      alt={post.coverAlt || ""}
                      className="h-28 w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-sm"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {uploadingCover ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    {uploadingCover
                      ? "Envoi…"
                      : post.coverImageUrl
                        ? "Changer (appareil)"
                        : "Choisir sur l’appareil"}
                  </Button>
                  {post.coverImageUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-sm text-destructive"
                      onClick={() => patchPost({ coverImageUrl: undefined })}
                    >
                      Retirer
                    </Button>
                  ) : null}
                </div>
                <Input
                  value={post.coverImageUrl ?? ""}
                  onChange={(e) =>
                    patchPost({ coverImageUrl: e.target.value.trim() || undefined })
                  }
                  className="mt-2 rounded-sm"
                  placeholder="Ou collez une URL https://…"
                />
              </Field>
              <Field label="SEO — titre">
                <Input
                  value={post.seoTitle ?? ""}
                  onChange={(e) => patchPost({ seoTitle: e.target.value })}
                  className="rounded-sm"
                />
              </Field>
              <Field label="SEO — description">
                <Textarea
                  rows={3}
                  value={post.seoDescription ?? ""}
                  onChange={(e) => patchPost({ seoDescription: e.target.value })}
                  className="rounded-sm"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(post.featured)}
                  onChange={(e) => patchPost({ featured: e.target.checked })}
                />
                Article à la une
              </label>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-[#1d2327]">{label}</Label>
      {children}
    </div>
  );
}
