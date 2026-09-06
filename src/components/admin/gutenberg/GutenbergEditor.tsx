import { useMemo, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  GripVertical,
  ListTree,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BLOG_BLOCK_CATALOG,
  createEmptyBlock,
  slugifyBlog,
  type BlogBlock,
  type BlogBlockType,
  type StoredBlogPost,
} from "@/lib/blog-blocks";
import { estimateReadMinutes } from "@/lib/blog-storage";
import { blogCategories } from "@/lib/blog";
import { cn } from "@/lib/utils";

type GutenbergEditorProps = {
  post: StoredBlogPost;
  onChange: (post: StoredBlogPost) => void;
  onSave: (status?: StoredBlogPost["status"]) => void;
  onClose: () => void;
  saving?: boolean;
};

const GROUP_LABELS = {
  texte: "Texte",
  media: "Médias",
  "mise-en-page": "Mise en page",
  widgets: "Widgets",
  embed: "Embarqué",
} as const;

export function GutenbergEditor({
  post,
  onChange,
  onSave,
  onClose,
  saving,
}: GutenbergEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(post.blocks[0]?.id ?? null);
  const [inserterOpen, setInserterOpen] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [listView, setListView] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"document" | "block">("document");
  const [query, setQuery] = useState("");

  const selected = post.blocks.find((b) => b.id === selectedId) ?? null;

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BLOG_BLOCK_CATALOG;
    return BLOG_BLOCK_CATALOG.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q)),
    );
  }, [query]);

  const patchPost = (patch: Partial<StoredBlogPost>) => {
    onChange({ ...post, ...patch, updatedAt: new Date().toISOString() });
  };

  const setBlocks = (blocks: BlogBlock[]) => {
    patchPost({
      blocks,
      readMinutes: estimateReadMinutes(blocks),
    });
  };

  const updateBlock = (id: string, next: BlogBlock) => {
    setBlocks(post.blocks.map((b) => (b.id === id ? next : b)));
  };

  const removeBlock = (id: string) => {
    const next = post.blocks.filter((b) => b.id !== id);
    setBlocks(next.length ? next : [createEmptyBlock("paragraph")]);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  };

  const duplicateBlock = (id: string) => {
    const index = post.blocks.findIndex((b) => b.id === id);
    if (index < 0) return;
    const copy = { ...structuredClone(post.blocks[index]), id: createEmptyBlock("paragraph").id };
    const next = [...post.blocks];
    next.splice(index + 1, 0, copy);
    setBlocks(next);
    setSelectedId(copy.id);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const index = post.blocks.findIndex((b) => b.id === id);
    const target = index + dir;
    if (index < 0 || target < 0 || target >= post.blocks.length) return;
    const next = [...post.blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setBlocks(next);
  };

  const insertBlock = (type: BlogBlockType) => {
    const block = createEmptyBlock(type);
    const at = insertAt ?? post.blocks.length;
    const next = [...post.blocks];
    next.splice(at, 0, block);
    setBlocks(next);
    setSelectedId(block.id);
    setInserterOpen(false);
    setInsertAt(null);
    setSidebarTab("block");
  };

  const openInserter = (at: number) => {
    setInsertAt(at);
    setInserterOpen(true);
    setQuery("");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f0f0f1] text-foreground dark:bg-background">
      {/* Top bar — style Gutenberg */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-black/10 bg-white px-3 dark:border-border dark:bg-card">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          ← Articles
        </Button>
        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="truncate text-sm font-semibold">{post.title || "Sans titre"}</p>
          <p className="text-[11px] text-muted-foreground">
            {post.status === "published"
              ? "Publié"
              : post.status === "scheduled"
                ? "Planifié"
                : post.status === "private"
                  ? "Privé"
                  : "Brouillon"}
            {" · "}
            {post.readMinutes} min de lecture
          </p>
        </div>
        <Button
          type="button"
          variant={listView ? "default" : "outline"}
          size="sm"
          className="rounded-md"
          onClick={() => setListView((v) => !v)}
          title="Vue liste"
        >
          <ListTree className="size-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-md" asChild>
          <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
            <Eye className="size-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-md"
          disabled={saving}
          onClick={() => onSave("draft")}
        >
          Enregistrer
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-md bg-[#007cba] text-white hover:bg-[#006ba1]"
          disabled={saving}
          onClick={() => onSave("published")}
        >
          {saving ? "…" : "Publier"}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* List view */}
        {listView ? (
          <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-black/10 bg-white p-3 dark:border-border dark:bg-card md:block">
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Structure
            </p>
            <ul className="space-y-1">
              {post.blocks.map((block, index) => {
                const meta = BLOG_BLOCK_CATALOG.find((c) => c.type === block.type);
                const label =
                  ("content" in block && block.content
                    ? String(block.content).slice(0, 28)
                    : meta?.label) || block.type;
                return (
                  <li key={block.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(block.id);
                        setSidebarTab("block");
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs",
                        selectedId === block.id
                          ? "bg-[#007cba]/10 text-[#007cba] font-semibold"
                          : "hover:bg-muted",
                      )}
                    >
                      <GripVertical className="size-3.5 shrink-0 opacity-40" />
                      <span className="truncate">
                        {index + 1}. {label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full rounded-md"
              onClick={() => openInserter(post.blocks.length)}
            >
              <Plus className="size-4" /> Ajouter
            </Button>
          </aside>
        ) : null}

        {/* Canvas */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
            <Input
              value={post.title}
              onChange={(e) => {
                const title = e.target.value;
                const autoSlug =
                  !post.slug || post.slug.startsWith("nouvel-article")
                    ? slugifyBlog(title)
                    : post.slug;
                patchPost({ title, slug: autoSlug || post.slug });
              }}
              placeholder="Ajouter un titre"
              className="mb-6 h-auto border-0 bg-transparent px-0 text-3xl font-bold shadow-none focus-visible:ring-0 sm:text-4xl"
            />

            <div className="space-y-2">
              {post.blocks.map((block, index) => (
                <div key={block.id} className="group relative">
                  <button
                    type="button"
                    aria-label="Ajouter un bloc ici"
                    className="absolute -left-2 top-1/2 z-10 hidden size-7 -translate-x-full -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-[#007cba] opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-[#007cba] hover:text-white md:flex dark:bg-card"
                    onClick={() => openInserter(index)}
                  >
                    <Plus className="size-4" />
                  </button>
                  <div
                    className={cn(
                      "rounded-xl border bg-white p-3 transition dark:bg-card",
                      selectedId === block.id
                        ? "border-[#007cba] shadow-[0_0_0_1px_#007cba]"
                        : "border-transparent hover:border-border",
                    )}
                    onClick={() => {
                      setSelectedId(block.id);
                      setSidebarTab("block");
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                        {BLOG_BLOCK_CATALOG.find((c) => c.type === block.type)?.label ??
                          block.type}
                      </span>
                      <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                        <IconBtn label="Monter" onClick={() => moveBlock(block.id, -1)}>
                          <ChevronUp className="size-3.5" />
                        </IconBtn>
                        <IconBtn label="Descendre" onClick={() => moveBlock(block.id, 1)}>
                          <ChevronDown className="size-3.5" />
                        </IconBtn>
                        <IconBtn label="Dupliquer" onClick={() => duplicateBlock(block.id)}>
                          <Copy className="size-3.5" />
                        </IconBtn>
                        <IconBtn label="Supprimer" onClick={() => removeBlock(block.id)}>
                          <Trash2 className="size-3.5" />
                        </IconBtn>
                      </div>
                    </div>
                    <BlockEditor
                      block={block}
                      onChange={(next) => updateBlock(block.id, next)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full rounded-xl border-dashed py-6 text-[#007cba]"
              onClick={() => openInserter(post.blocks.length)}
            >
              <Plus className="size-4" /> Ajouter un bloc
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-black/10 bg-white dark:border-border dark:bg-card lg:block">
          <div className="flex border-b border-border">
            <button
              type="button"
              className={cn(
                "flex-1 px-3 py-3 text-xs font-semibold",
                sidebarTab === "document" ? "border-b-2 border-[#007cba] text-[#007cba]" : "text-muted-foreground",
              )}
              onClick={() => setSidebarTab("document")}
            >
              Article
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 px-3 py-3 text-xs font-semibold",
                sidebarTab === "block" ? "border-b-2 border-[#007cba] text-[#007cba]" : "text-muted-foreground",
              )}
              onClick={() => setSidebarTab("block")}
            >
              Bloc
            </button>
          </div>

          <div className="space-y-4 p-4">
            {sidebarTab === "document" ? (
              <DocumentSettings post={post} onChange={patchPost} />
            ) : selected ? (
              <BlockSettings
                block={selected}
                onChange={(next) => updateBlock(selected.id, next)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Sélectionnez un bloc.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Inserter modal */}
      {inserterOpen ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[10vh]">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-card">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <Plus className="size-4 text-[#007cba]" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un bloc… (/, paragraphe, image, FAQ…)"
                className="border-0 shadow-none focus-visible:ring-0"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => setInserterOpen(false)}>
                Fermer
              </Button>
            </div>
            <div className="max-h-[calc(80vh-56px)] overflow-y-auto p-3">
              {(Object.keys(GROUP_LABELS) as Array<keyof typeof GROUP_LABELS>).map((group) => {
                const items = filteredCatalog.filter((item) => item.group === group);
                if (!items.length) return null;
                return (
                  <div key={group} className="mb-4">
                    <p className="mb-2 px-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      {GROUP_LABELS[group]}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {items.map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => insertBlock(item.type)}
                          className="rounded-xl border border-border p-3 text-left transition hover:border-[#007cba] hover:bg-[#007cba]/5"
                        >
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function DocumentSettings({
  post,
  onChange,
}: {
  post: StoredBlogPost;
  onChange: (patch: Partial<StoredBlogPost>) => void;
}) {
  return (
    <>
      <Field label="État">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={post.status}
          onChange={(e) =>
            onChange({ status: e.target.value as StoredBlogPost["status"] })
          }
        >
          <option value="draft">Brouillon</option>
          <option value="published">Publié</option>
          <option value="scheduled">Planifié</option>
          <option value="private">Privé</option>
        </select>
      </Field>
      {post.status === "scheduled" ? (
        <Field label="Date de publication planifiée">
          <Input
            type="datetime-local"
            value={post.scheduledAt?.slice(0, 16) ?? ""}
            onChange={(e) => onChange({ scheduledAt: e.target.value || null })}
          />
        </Field>
      ) : null}
      <Field label="Slug (URL)">
        <Input
          value={post.slug}
          onChange={(e) => onChange({ slug: slugifyBlog(e.target.value) })}
        />
      </Field>
      <Field label="Extrait">
        <Textarea
          rows={3}
          value={post.excerpt}
          onChange={(e) => onChange({ excerpt: e.target.value })}
        />
      </Field>
      <Field label="Catégorie">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={post.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          {blogCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          {!blogCategories.includes(post.category as (typeof blogCategories)[number]) ? (
            <option value={post.category}>{post.category}</option>
          ) : null}
        </select>
      </Field>
      <Field label="Étiquettes (virgules)">
        <Input
          value={post.tags.join(", ")}
          onChange={(e) =>
            onChange({
              tags: e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>
      <Field label="Date de publication">
        <Input
          type="date"
          value={post.publishedAt.slice(0, 10)}
          onChange={(e) => onChange({ publishedAt: e.target.value })}
        />
      </Field>
      <Field label="Niveau">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={post.difficulty ?? "Débutant"}
          onChange={(e) =>
            onChange({
              difficulty: e.target.value as StoredBlogPost["difficulty"],
            })
          }
        >
          <option>Débutant</option>
          <option>Intermédiaire</option>
          <option>Avancé</option>
          <option>Expert</option>
        </select>
      </Field>
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(post.featured)}
            onChange={(e) => onChange({ featured: e.target.checked })}
          />
          À la une
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(post.trending)}
            onChange={(e) => onChange({ trending: e.target.checked })}
          />
          Tendance
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(post.sticky)}
            onChange={(e) => onChange({ sticky: e.target.checked })}
          />
          Épinglé
        </label>
      </div>
      <div className="border-t border-border pt-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Settings2 className="size-3.5" /> Image à la une
        </p>
        <Field label="URL image de couverture">
          <Input
            value={post.coverImageUrl ?? ""}
            onChange={(e) => onChange({ coverImageUrl: e.target.value })}
            placeholder="https://…"
          />
        </Field>
        <Field label="Texte alternatif">
          <Input
            value={post.coverAlt ?? ""}
            onChange={(e) => onChange({ coverAlt: e.target.value })}
          />
        </Field>
        <Field label="Libellé couverture">
          <Input
            value={post.coverLabel}
            onChange={(e) => onChange({ coverLabel: e.target.value })}
          />
        </Field>
        <Field label="Gradient CSS (si pas d’image)">
          <Input
            value={post.coverGradient}
            onChange={(e) => onChange({ coverGradient: e.target.value })}
          />
        </Field>
      </div>
      <div className="border-t border-border pt-4">
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          SEO / Open Graph
        </p>
        <Field label="SEO Title">
          <Input
            value={post.seoTitle ?? ""}
            onChange={(e) => onChange({ seoTitle: e.target.value })}
          />
        </Field>
        <Field label="Meta description">
          <Textarea
            rows={3}
            value={post.seoDescription ?? ""}
            onChange={(e) => onChange({ seoDescription: e.target.value })}
          />
        </Field>
        <Field label="Mot-clé principal">
          <Input
            value={post.primaryKeyword ?? ""}
            onChange={(e) => onChange({ primaryKeyword: e.target.value })}
          />
        </Field>
        <Field label="Mots-clés secondaires (virgules)">
          <Input
            value={(post.secondaryKeywords ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                secondaryKeywords: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
        <Field label="OG Title">
          <Input
            value={post.ogTitle ?? ""}
            onChange={(e) => onChange({ ogTitle: e.target.value })}
          />
        </Field>
        <Field label="OG Description">
          <Textarea
            rows={2}
            value={post.ogDescription ?? ""}
            onChange={(e) => onChange({ ogDescription: e.target.value })}
          />
        </Field>
      </div>
      <div className="border-t border-border pt-4">
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Auteur
        </p>
        <Field label="Nom">
          <Input
            value={post.authorName}
            onChange={(e) => onChange({ authorName: e.target.value })}
          />
        </Field>
        <Field label="Rôle">
          <Input
            value={post.authorRole}
            onChange={(e) => onChange({ authorRole: e.target.value })}
          />
        </Field>
        <Field label="Initiales">
          <Input
            value={post.authorInitials}
            onChange={(e) => onChange({ authorInitials: e.target.value.slice(0, 3) })}
          />
        </Field>
      </div>
    </>
  );
}

function BlockSettings({
  block,
  onChange,
}: {
  block: BlogBlock;
  onChange: (block: BlogBlock) => void;
}) {
  if (block.type === "paragraph") {
    return (
      <>
        <AlignButtons
          value={block.align ?? "left"}
          onChange={(align) => onChange({ ...block, align })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(block.dropCap)}
            onChange={(e) => onChange({ ...block, dropCap: e.target.checked })}
          />
          Lettrine
        </label>
      </>
    );
  }
  if (block.type === "heading") {
    return (
      <>
        <Field label="Niveau">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={block.level}
            onChange={(e) =>
              onChange({ ...block, level: Number(e.target.value) as 1 | 2 | 3 | 4 })
            }
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
          </select>
        </Field>
        <AlignButtons
          value={block.align ?? "left"}
          onChange={(align) => onChange({ ...block, align })}
        />
      </>
    );
  }
  if (block.type === "image") {
    return (
      <Field label="Taille">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={block.size ?? "default"}
          onChange={(e) =>
            onChange({
              ...block,
              size: e.target.value as "default" | "wide" | "full",
            })
          }
        >
          <option value="default">Normale</option>
          <option value="wide">Large</option>
          <option value="full">Pleine largeur</option>
        </select>
      </Field>
    );
  }
  if (block.type === "spacer") {
    return (
      <Field label={`Hauteur (${block.height}px)`}>
        <Input
          type="range"
          min={8}
          max={240}
          value={block.height}
          onChange={(e) => onChange({ ...block, height: Number(e.target.value) })}
        />
      </Field>
    );
  }
  if (block.type === "callout") {
    return (
      <Field label="Variante">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={block.variant}
          onChange={(e) =>
            onChange({
              ...block,
              variant: e.target.value as typeof block.variant,
            })
          }
        >
          <option value="info">Info</option>
          <option value="tip">Conseil</option>
          <option value="warning">Alerte</option>
          <option value="success">Succès</option>
        </select>
      </Field>
    );
  }
  if (block.type === "list") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={block.ordered}
          onChange={(e) => onChange({ ...block, ordered: e.target.checked })}
        />
        Liste numérotée
      </label>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      Réglages spécifiques au bloc «{" "}
      {BLOG_BLOCK_CATALOG.find((c) => c.type === block.type)?.label ?? block.type} ».
    </p>
  );
}

function AlignButtons({
  value,
  onChange,
}: {
  value: "left" | "center" | "right";
  onChange: (v: "left" | "center" | "right") => void;
}) {
  return (
    <div className="flex gap-1">
      {(
        [
          ["left", AlignLeft],
          ["center", AlignCenter],
          ["right", AlignRight],
        ] as const
      ).map(([align, Icon]) => (
        <button
          key={align}
          type="button"
          className={cn(
            "grid size-9 place-items-center rounded-md border",
            value === align ? "border-[#007cba] text-[#007cba]" : "border-border",
          )}
          onClick={() => onChange(align)}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
}: {
  block: BlogBlock;
  onChange: (block: BlogBlock) => void;
}) {
  switch (block.type) {
    case "paragraph":
    case "quote":
    case "pullquote":
    case "code":
    case "preformatted":
    case "html":
      return (
        <Textarea
          rows={block.type === "paragraph" ? 3 : 5}
          value={block.content}
          placeholder={
            block.type === "paragraph"
              ? "Écrivez votre paragraphe… Tapez / pour ajouter un bloc"
              : undefined
          }
          className={cn(
            "border-0 bg-transparent shadow-none focus-visible:ring-0",
            block.type === "code" || block.type === "preformatted" || block.type === "html"
              ? "font-mono text-sm"
              : "",
            block.type === "quote" || block.type === "pullquote" ? "italic" : "",
          )}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
        />
      );
    case "heading":
      return (
        <Input
          value={block.content}
          placeholder={`Titre H${block.level}`}
          className={cn(
            "border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0",
            block.level === 1 && "text-3xl",
            block.level === 2 && "text-2xl",
            block.level === 3 && "text-xl",
            block.level === 4 && "text-lg",
          )}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
        />
      );
    case "list":
      return (
        <Textarea
          rows={4}
          value={block.items.join("\n")}
          placeholder="Un élément par ligne"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          onChange={(e) =>
            onChange({
              ...block,
              items: e.target.value.split("\n"),
            })
          }
        />
      );
    case "image":
      return (
        <div className="space-y-2">
          <Input
            placeholder="URL de l’image"
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
          />
          <Input
            placeholder="Texte alternatif"
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
          />
          <Input
            placeholder="Légende"
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
          />
          {block.url ? (
            <img src={block.url} alt={block.alt} className="max-h-56 rounded-lg object-cover" />
          ) : null}
        </div>
      );
    case "gallery":
      return (
        <Textarea
          rows={4}
          value={block.images.map((img) => `${img.url}|${img.alt}`).join("\n")}
          placeholder={"url|alt (une image par ligne)"}
          className="font-mono text-xs"
          onChange={(e) =>
            onChange({
              ...block,
              images: e.target.value.split("\n").map((line) => {
                const [url, ...rest] = line.split("|");
                return { url: url?.trim() ?? "", alt: rest.join("|").trim() };
              }),
            })
          }
        />
      );
    case "cover":
      return (
        <div className="space-y-2">
          <Input
            placeholder="Titre"
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
          <Input
            placeholder="Sous-titre"
            value={block.subtitle ?? ""}
            onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
          />
          <Input
            placeholder="URL image de fond"
            value={block.url ?? ""}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
          />
        </div>
      );
    case "separator":
      return <hr className="my-4 border-border" />;
    case "spacer":
      return (
        <div
          className="rounded-lg border border-dashed border-border bg-muted/30"
          style={{ height: block.height }}
        />
      );
    case "buttons":
      return (
        <div className="space-y-2">
          {block.buttons.map((btn, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-3">
              <Input
                placeholder="Libellé"
                value={btn.label}
                onChange={(e) => {
                  const buttons = [...block.buttons];
                  buttons[i] = { ...btn, label: e.target.value };
                  onChange({ ...block, buttons });
                }}
              />
              <Input
                placeholder="URL"
                value={btn.url}
                onChange={(e) => {
                  const buttons = [...block.buttons];
                  buttons[i] = { ...btn, url: e.target.value };
                  onChange({ ...block, buttons });
                }}
              />
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={btn.style}
                onChange={(e) => {
                  const buttons = [...block.buttons];
                  buttons[i] = {
                    ...btn,
                    style: e.target.value as "fill" | "outline",
                  };
                  onChange({ ...block, buttons });
                }}
              >
                <option value="fill">Plein</option>
                <option value="outline">Contour</option>
              </select>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...block,
                buttons: [...block.buttons, { label: "Bouton", url: "#", style: "fill" }],
              })
            }
          >
            + Bouton
          </Button>
        </div>
      );
    case "columns":
      return (
        <div className={cn("grid gap-3", block.count === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {block.columns.map((col, i) => (
            <Textarea
              key={i}
              rows={4}
              value={col}
              onChange={(e) => {
                const columns = [...block.columns];
                columns[i] = e.target.value;
                onChange({ ...block, columns });
              }}
            />
          ))}
        </div>
      );
    case "table":
      return (
        <Textarea
          rows={5}
          className="font-mono text-xs"
          value={block.rows.map((r) => r.join(" | ")).join("\n")}
          placeholder="cellule | cellule"
          onChange={(e) =>
            onChange({
              ...block,
              rows: e.target.value.split("\n").map((line) =>
                line.split("|").map((c) => c.trim()),
              ),
            })
          }
        />
      );
    case "embed":
    case "video":
    case "audio":
      return (
        <div className="space-y-2">
          <Input
            placeholder="URL"
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
          />
          {"caption" in block ? (
            <Input
              placeholder="Légende"
              value={block.caption ?? ""}
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
            />
          ) : null}
        </div>
      );
    case "file":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="URL fichier"
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
          />
          <Input
            placeholder="Libellé"
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
          />
        </div>
      );
    case "callout":
      return (
        <div className="space-y-2">
          <Input
            placeholder="Titre"
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
          <Textarea
            rows={3}
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
          />
        </div>
      );
    case "faq":
      return (
        <Textarea
          rows={6}
          className="font-mono text-xs"
          value={block.items.map((item) => `${item.q} || ${item.a}`).join("\n")}
          placeholder="Question || Réponse"
          onChange={(e) =>
            onChange({
              ...block,
              items: e.target.value.split("\n").map((line) => {
                const [q, ...rest] = line.split("||");
                return { q: q?.trim() ?? "", a: rest.join("||").trim() };
              }),
            })
          }
        />
      );
    case "toc":
      return (
        <p className="text-sm text-muted-foreground">
          Le sommaire sera généré automatiquement à partir des titres.
        </p>
      );
    case "more":
      return (
        <p className="rounded-lg border border-dashed border-border py-3 text-center text-xs text-muted-foreground">
          — Lire la suite —
        </p>
      );
    default:
      return null;
  }
}
