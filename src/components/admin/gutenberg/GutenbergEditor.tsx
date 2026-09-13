import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AppWindow,
  AudioLines,
  BadgeDollarSign,
  Bold,
  Box,
  ChevronDown,
  ChevronUp,
  Cloud,
  Code,
  Columns2,
  Columns3,
  Copy,
  Eye,
  Facebook,
  File,
  FileText,
  Gauge,
  Github,
  Globe,
  GripVertical,
  Group,
  Hash,
  Heading,
  Image,
  Images,
  Instagram,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTree,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  MoreHorizontal,
  MoveVertical,
  PanelBottomOpen,
  PanelTop,
  Plus,
  Quote,
  RectangleHorizontal,
  Settings2,
  Table,
  TextQuote,
  Timer,
  Trash2,
  TriangleAlert,
  Twitter,
  Upload,
  Video,
  Volume2,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  BLOG_INSERTER_ITEMS,
  createBlockFromInserter,
  INSERTER_GROUP_LABELS,
  type BlogInserterItem,
  type InserterGroup,
} from "@/lib/blog-inserter";
import { blogCategories } from "@/lib/blog";
import { clipboardToHtml, sanitizeBlogHtml } from "@/lib/blog-html";
import { adminUploadBlogImage } from "@/lib/fns/admin";
import { cn } from "@/lib/utils";

const INSERTER_ICONS: Record<string, LucideIcon> = {
  heading: Heading,
  "align-left": AlignLeft,
  list: List,
  quote: Quote,
  "text-quote": TextQuote,
  code: Code,
  "file-text": FileText,
  image: Image,
  images: Images,
  "panel-top": PanelTop,
  video: Video,
  "volume-2": Volume2,
  file: File,
  minus: Minus,
  "move-vertical": MoveVertical,
  "columns-2": Columns2,
  "columns-3": Columns3,
  "rectangle-horizontal": RectangleHorizontal,
  table: Table,
  group: Group,
  timer: Timer,
  gauge: Gauge,
  "app-window": AppWindow,
  "panel-bottom-open": PanelBottomOpen,
  "triangle-alert": TriangleAlert,
  box: Box,
  hash: Hash,
  "message-circle": MessageCircle,
  "badge-dollar-sign": BadgeDollarSign,
  "list-tree": ListTree,
  "more-horizontal": MoreHorizontal,
  youtube: Youtube,
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  "audio-lines": AudioLines,
  cloud: Cloud,
  globe: Globe,
  "map-pin": MapPin,
  github: Github,
};

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function isAllowedImageFile(file: File) {
  return (
    ALLOWED_IMAGE_TYPES.has(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name)
  );
}

function imageFilesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) return [];
  const fromFiles = Array.from(data.files ?? []).filter(isAllowedImageFile);
  if (fromFiles.length) return fromFiles;
  return Array.from(data.items ?? [])
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file && isAllowedImageFile(file)));
}

function imageUrlFromDataTransfer(data: DataTransfer | null): string | null {
  if (!data) return null;
  const uri = (data.getData("text/uri-list") || data.getData("text/plain")).trim();
  if (/^https?:\/\//i.test(uri) && /\.(jpe?g|png|webp|gif)(\?|#|$)/i.test(uri)) {
    return uri;
  }
  const html = data.getData("text/html");
  return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

function preventImageDrag(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
}

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

type GutenbergEditorProps = {
  post: StoredBlogPost;
  onChange: (post: StoredBlogPost) => void;
  onSave: (status?: StoredBlogPost["status"], next?: StoredBlogPost) => void;
  onClose: () => void;
  saving?: boolean;
  categoryOptions?: string[];
};

const GROUP_LABELS = INSERTER_GROUP_LABELS;

export function GutenbergEditor({
  post,
  onChange,
  onSave,
  onClose,
  saving,
  categoryOptions,
}: GutenbergEditorProps) {
  const categories =
    categoryOptions && categoryOptions.length > 0
      ? categoryOptions
      : [...blogCategories];
  const [selectedId, setSelectedId] = useState<string | null>(post.blocks[0]?.id ?? null);
  const [inserterOpen, setInserterOpen] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [listView, setListView] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"document" | "block">("document");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [inserterTab, setInserterTab] = useState<"blocs" | "motifs" | "media">("blocs");
  const [tagsDraft, setTagsDraft] = useState(() => post.tags.join(", "));
  const blocksRef = useRef(post.blocks);
  const [dropOver, setDropOver] = useState(false);
  const [dropBusy, setDropBusy] = useState(false);
  const uploadImageFn = useServerFn(adminUploadBlogImage);
  blocksRef.current = post.blocks;

  const selected = post.blocks.find((b) => b.id === selectedId) ?? null;

  useEffect(() => {
    setTagsDraft(post.tags.join(", "));
  }, [post.id]);

  useEffect(() => {
    const only = post.blocks[0];
    if (
      post.blocks.length === 1 &&
      only?.type === "paragraph" &&
      !only.content.trim()
    ) {
      onChange({
        ...post,
        blocks: [{ id: only.id, type: "html", content: "" }],
        updatedAt: new Date().toISOString(),
      });
    }
    // One-shot: empty drafts keep a single classic writing area.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const filteredCatalog = useMemo(() => {
    if (inserterTab === "motifs") return [];
    const q = query.trim().toLowerCase();
    const source =
      inserterTab === "media"
        ? BLOG_INSERTER_ITEMS.filter((item) => item.group === "media")
        : BLOG_INSERTER_ITEMS;
    if (!q) return source;
    return source.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q)),
    );
  }, [query, inserterTab]);

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

  const insertBlock = (item: BlogInserterItem | BlogBlockType) => {
    const block =
      typeof item === "string" ? createEmptyBlock(item) : createBlockFromInserter(item);
    const at = insertAt ?? post.blocks.length;
    const next = [...post.blocks];
    const existing = next[at];
    const replaceEmpty =
      existing?.type === "paragraph" && !existing.content.trim();
    if (replaceEmpty) next[at] = block;
    else next.splice(at, 0, block);
    setBlocks(next);
    setSelectedId(block.id);
    setInserterOpen(false);
    setInsertAt(null);
    setSidebarTab("block");
  };

  const openInserter = (at: number) => {
    setInsertAt(at);
    setListView(false);
    setInserterOpen(true);
    setInserterTab("blocs");
    setQuery("");
  };

  const parsedTags = () =>
    tagsDraft
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

  const handleSave = (status?: StoredBlogPost["status"]) => {
    const tags = parsedTags();
    setTagsDraft(tags.join(", "));
    onSave(status, { ...post, tags, updatedAt: new Date().toISOString() });
  };

  const uploadImageFile = async (file: File): Promise<string | null> => {
    if (!isAllowedImageFile(file)) {
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
        contentType: file.type || "image/jpeg",
        dataBase64,
      },
    });
    return result.publicUrl;
  };

  const applyImageBlocks = (
    incoming: Array<{ url: string; alt: string }>,
    at?: number,
    replaceId?: string,
  ) => {
    if (!incoming.length) return;
    const current = [...blocksRef.current];
    const created = incoming.map((item) => {
      const block = createEmptyBlock("image");
      return { ...block, url: item.url, alt: item.alt } as BlogBlock;
    });

    if (replaceId) {
      const index = current.findIndex((block) => block.id === replaceId);
      if (index >= 0) {
        const existing = current[index];
        if (existing?.type === "image") {
          current[index] = {
            ...existing,
            url: incoming[0]!.url,
            alt: existing.alt || incoming[0]!.alt,
          };
          const extras = created.slice(1);
          if (extras.length) current.splice(index + 1, 0, ...extras);
          setBlocks(current);
          setSelectedId(current[index]!.id);
          return;
        }
        if (existing?.type === "cover") {
          current[index] = { ...existing, url: incoming[0]!.url };
          setBlocks(current);
          setSelectedId(existing.id);
          return;
        }
        if (existing?.type === "paragraph" && !existing.content.trim()) {
          current.splice(index, 1, ...created);
          setBlocks(current);
          setSelectedId(created[0]!.id);
          return;
        }
      }
    }

    const index = Math.min(Math.max(at ?? current.length, 0), current.length);
    current.splice(index, 0, ...created);
    setBlocks(current);
    setSelectedId(created[0]!.id);
  };

  const applyClassicHtml = (html: string, replaceId?: string | null) => {
    const cleaned = html.trim();
    if (!cleaned) return;
    const current = [...blocksRef.current];
    const targetId = replaceId ?? selectedId;
    if (targetId) {
      const index = current.findIndex((block) => block.id === targetId);
      const existing = index >= 0 ? current[index] : null;
      if (existing?.type === "html") {
        current[index] = {
          ...existing,
          content: existing.content.trim() ? `${existing.content}${cleaned}` : cleaned,
        };
        setBlocks(current);
        setSelectedId(existing.id);
        return;
      }
      if (existing?.type === "paragraph" && !existing.content.trim()) {
        current[index] = { id: existing.id, type: "html", content: cleaned };
        setBlocks(current);
        setSelectedId(existing.id);
        return;
      }
    }
    const emptyClassic = current.findIndex(
      (block) => block.type === "html" && !block.content.replace(/<[^>]+>/g, "").trim(),
    );
    if (emptyClassic >= 0) {
      const existing = current[emptyClassic];
      if (existing?.type === "html") {
        current[emptyClassic] = { ...existing, content: cleaned };
        setBlocks(current);
        setSelectedId(existing.id);
        return;
      }
    }
    const block = { ...createEmptyBlock("html"), content: cleaned };
    current.push(block);
    setBlocks(current);
    setSelectedId(block.id);
  };

  const ingestDroppedImages = async (
    files: File[],
    url?: string | null,
    at?: number,
    replaceId?: string,
  ) => {
    if (!files.length && !url) return;
    setDropBusy(true);
    try {
      const incoming: Array<{ url: string; alt: string }> = [];
      for (const file of files) {
        const publicUrl = await uploadImageFile(file);
        if (publicUrl) {
          incoming.push({ url: publicUrl, alt: file.name.replace(/\.[^.]+$/, "") });
        }
      }
      if (!incoming.length && url) {
        incoming.push({ url, alt: "" });
      }
      applyImageBlocks(incoming, at, replaceId);
      if (incoming.length) {
        toast.success(
          incoming.length === 1 ? "Image ajoutée dans l’éditeur" : `${incoming.length} images ajoutées`,
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import image impossible");
    } finally {
      setDropBusy(false);
      setDropOver(false);
    }
  };

  const inserterGroups = (Object.keys(GROUP_LABELS) as InserterGroup[]).filter((group) => {
    if (inserterTab === "motifs") return false;
    if (inserterTab === "media") return group === "media";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-[#1e1e1e]">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-[#e0e0e0] bg-white px-2">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-sm text-[#1e1e1e] hover:bg-[#f0f0f0]"
          onClick={onClose}
          aria-label="Retour aux articles"
        >
          ←
        </button>
        <button
          type="button"
          title="Ajouter un bloc"
          aria-pressed={inserterOpen}
          className={cn(
            "grid size-9 place-items-center rounded-sm hover:bg-[#f0f0f0]",
            inserterOpen ? "bg-[#1e1e1e] text-white" : "text-[#1e1e1e]",
          )}
          onClick={() => {
            setListView(false);
            setInserterOpen((open) => !open);
            setInsertAt(post.blocks.length);
          }}
        >
          <Plus className="size-5" />
        </button>
        <button
          type="button"
          title="Vue liste"
          className={cn(
            "grid size-9 place-items-center rounded-sm hover:bg-[#f0f0f0]",
            listView && "bg-[#f0f0f0]",
          )}
          onClick={() => {
            setInserterOpen(false);
            setListView((v) => !v);
          }}
        >
          <ListTree className="size-4" />
        </button>
        <div className="flex min-w-0 flex-1 justify-center px-2">
          <span className="max-w-md truncate rounded-full bg-[#f0f0f0] px-4 py-1 text-[13px] text-[#757575]">
            {post.title || "Sans titre"}
          </span>
        </div>
        <Button type="button" variant="ghost" size="sm" className="rounded-sm text-[#1e1e1e]" asChild>
          <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
            <Eye className="size-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </a>
        </Button>
        <Button
          type="button"
          variant="ghost"
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
          className="rounded-sm bg-[#3858e9] text-white hover:bg-[#2145e6]"
          disabled={saving}
          onClick={() => handleSave("published")}
        >
          {saving ? "…" : "Publier"}
        </Button>
        <button
          type="button"
          title="Réglages"
          aria-pressed={sidebarOpen}
          className={cn(
            "grid size-9 place-items-center rounded-sm hover:bg-[#f0f0f0]",
            sidebarOpen && "bg-[#f0f0f0]",
          )}
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <Settings2 className="size-4" />
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {inserterOpen ? (
          <aside className="absolute inset-y-0 left-0 z-30 flex w-full max-w-[350px] shrink-0 flex-col border-r border-[#ddd] bg-white shadow-lg md:static md:shadow-none">
            <div className="flex items-stretch border-b border-[#ddd]">
              {(
                [
                  ["blocs", "Blocs"],
                  ["motifs", "Motifs"],
                  ["media", "Médias"],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  className={cn(
                    "flex-1 px-2 py-3 text-[13px]",
                    inserterTab === tab
                      ? "border-b-2 border-[#1e1e1e] font-medium text-[#1e1e1e]"
                      : "text-[#757575] hover:text-[#1e1e1e]",
                  )}
                  onClick={() => setInserterTab(tab)}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                aria-label="Fermer l’inserter"
                className="grid w-10 place-items-center text-[#757575] hover:bg-[#f0f0f0]"
                onClick={() => setInserterOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="border-b border-[#ddd] p-3">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher"
                className="h-10 rounded-full border-[#ddd] bg-[#f0f0f0] px-4 text-[13px] shadow-none"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {inserterTab === "motifs" ? (
                <p className="py-10 text-center text-[13px] text-[#757575]">
                  Aucun motif enregistré.
                </p>
              ) : (
                inserterGroups.map((group) => {
                  const items = filteredCatalog.filter((item) => item.group === group);
                  if (!items.length) return null;
                  return (
                    <div key={group} className="mb-6">
                      <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-[#1e1e1e] uppercase">
                        {GROUP_LABELS[group]}
                      </p>
                      <div className="grid grid-cols-3 gap-x-1 gap-y-4">
                        {items.map((item) => {
                          const Icon = INSERTER_ICONS[item.icon] ?? Plus;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              title={item.description}
                              onClick={() => insertBlock(item)}
                              className="flex flex-col items-center gap-1.5 rounded-sm px-1 py-2 text-center hover:bg-[#f0f0f0]"
                            >
                              <span className="grid size-9 place-items-center text-[#1e1e1e]">
                                <Icon className="size-6 stroke-[1.4]" />
                              </span>
                              <span className="text-[12px] leading-tight text-[#1e1e1e]">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        ) : listView ? (
          <aside className="absolute inset-y-0 left-0 z-30 w-full max-w-[280px] shrink-0 overflow-y-auto border-r border-[#ddd] bg-white p-3 shadow-lg md:static md:shadow-none">
            <p className="mb-2 px-1 text-[11px] font-semibold tracking-wide text-[#757575] uppercase">
              Structure
            </p>
            <ul>
              {post.blocks.map((block, index) => {
                const meta = BLOG_BLOCK_CATALOG.find((c) => c.type === block.type);
                const label =
                  ("content" in block && block.content
                    ? String(block.content).slice(0, 36)
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
                        "flex w-full items-center gap-2 px-2 py-2 text-left text-[13px]",
                        selectedId === block.id
                          ? "bg-[#f0f0f0] font-medium"
                          : "hover:bg-[#f6f6f6]",
                      )}
                    >
                      <GripVertical className="size-3.5 shrink-0 text-[#949494]" />
                      <span className="truncate">
                        {index + 1}. {label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        ) : null}

        <div
          className={cn(
            "relative min-w-0 flex-1 overflow-y-auto bg-white",
            dropOver && "bg-[#f0f6fc]",
          )}
          onDragEnter={(event) => {
            preventImageDrag(event);
            setDropOver(true);
          }}
          onDragOver={preventImageDrag}
          onDragLeave={(event) => {
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
            setDropOver(false);
          }}
          onDrop={(event) => {
            preventImageDrag(event);
            void ingestDroppedImages(
              imageFilesFromDataTransfer(event.dataTransfer),
              imageUrlFromDataTransfer(event.dataTransfer),
            );
          }}
          onPaste={(event) => {
            if ((event.target as HTMLElement | null)?.closest("[contenteditable=true]")) {
              return;
            }
            const files = Array.from(event.clipboardData?.files ?? []).filter(isAllowedImageFile);
            if (files.length) {
              event.preventDefault();
              void ingestDroppedImages(files);
              return;
            }
            const html = event.clipboardData?.getData("text/html") ?? "";
            const text = event.clipboardData?.getData("text/plain") ?? "";
            const content = clipboardToHtml(html, text);
            if (!content) return;
            event.preventDefault();
            applyClassicHtml(content);
          }}
        >
          {dropOver || dropBusy ? (
            <div className="pointer-events-none sticky top-3 z-20 mx-auto mb-2 max-w-[680px] px-6">
              <p className="border border-dashed border-[#3858e9] bg-white px-3 py-2 text-center text-[13px] font-medium text-[#3858e9]">
                {dropBusy ? "Import de l’image…" : "Déposez l’image ici pour l’ajouter"}
              </p>
            </div>
          ) : null}
          <div className="mx-auto max-w-[680px] px-6 py-16">
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
              className="mb-8 h-auto border-0 bg-transparent px-0 text-[42px] leading-[1.15] font-normal text-[#1e1e1e] shadow-none placeholder:text-[#ccc] focus-visible:ring-0"
            />

            <div>
              {post.blocks.map((block, index) => {
                const emptyParagraph =
                  (block.type === "paragraph" && !block.content.trim()) ||
                  (block.type === "html" && !block.content.replace(/<[^>]+>/g, "").trim());
                const selected = selectedId === block.id;
                return (
                  <div key={block.id} className="group relative">
                    {selected ? (
                      <div className="absolute -top-9 left-0 z-10 flex items-center border border-[#ddd] bg-white shadow-sm">
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
                    ) : null}
                    <div
                      className={cn(
                        "relative min-h-10 px-1 py-1",
                        selected &&
                          block.type !== "html" &&
                          "outline outline-2 outline-[#3858e9] -outline-offset-2",
                      )}
                      onClick={() => {
                        setSelectedId(block.id);
                        setSidebarTab("block");
                      }}
                      onDragOver={preventImageDrag}
                      onDrop={(event) => {
                        preventImageDrag(event);
                        void ingestDroppedImages(
                          imageFilesFromDataTransfer(event.dataTransfer),
                          imageUrlFromDataTransfer(event.dataTransfer),
                          index + 1,
                          block.id,
                        );
                      }}
                    >
                      <BlockEditor
                        block={block}
                        onChange={(next) => updateBlock(block.id, next)}
                        onUploadImage={uploadImageFile}
                        onDropFiles={(files) =>
                          ingestDroppedImages(files, null, index + 1, block.id)
                        }
                        onSlash={() => openInserter(index)}
                        onPasteHtml={(html) => applyClassicHtml(html, block.id)}
                      />
                    </div>
                    {emptyParagraph || selected ? (
                      <button
                        type="button"
                        aria-label="Ajouter un bloc"
                        className="absolute top-1/2 right-0 z-10 hidden size-8 -translate-y-1/2 translate-x-12 items-center justify-center rounded-full border border-[#ddd] bg-white text-[#1e1e1e] shadow-sm hover:bg-[#f0f0f0] md:flex"
                        onClick={() => openInserter(index)}
                      >
                        <Plus className="size-4" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {sidebarOpen ? (
          <aside className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-[#e0e0e0] bg-white text-[#1e1e1e] lg:block">
            <div className="flex items-stretch border-b border-[#e0e0e0]">
              <button
                type="button"
                className={cn(
                  "flex-1 px-3 py-2.5 text-[13px] font-medium",
                  sidebarTab === "document"
                    ? "border-b-2 border-[#1e1e1e] text-[#1e1e1e]"
                    : "text-[#757575] hover:text-[#1e1e1e]",
                )}
                onClick={() => setSidebarTab("document")}
              >
                Document
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 px-3 py-2.5 text-[13px] font-medium",
                  sidebarTab === "block"
                    ? "border-b-2 border-[#1e1e1e] text-[#1e1e1e]"
                    : "text-[#757575] hover:text-[#1e1e1e]",
                )}
                onClick={() => setSidebarTab("block")}
              >
                Bloc
              </button>
              <button
                type="button"
                aria-label="Fermer les réglages"
                className="grid w-10 place-items-center text-[#757575] hover:bg-[#f0f0f0] hover:text-[#1e1e1e]"
                onClick={() => setSidebarOpen(false)}
              >
                ×
              </button>
            </div>

            {sidebarTab === "document" ? (
              <DocumentSettings
                post={post}
                onChange={patchPost}
                categoryOptions={categories}
                tagsDraft={tagsDraft}
                onTagsDraftChange={setTagsDraft}
                onTagsCommit={() => patchPost({ tags: parsedTags() })}
                onUploadImage={uploadImageFile}
              />
            ) : (
              <div className="p-4">
                {selected ? (
                  <BlockSettings
                    block={selected}
                    onChange={(next) => updateBlock(selected.id, next)}
                  />
                ) : (
                  <p className="text-[13px] text-[#757575]">Sélectionnez un bloc.</p>
                )}
              </div>
            )}
          </aside>
        ) : null}
      </div>

    </div>
  );
}

function ClassicBlockField({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);
  const [hasText, setHasText] = useState(
    Boolean(value.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()),
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.innerHTML = value || "";
    lastEmitted.current = value;
  }, []);

  const flush = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = sanitizeBlogHtml(editor.innerHTML);
    setHasText(Boolean(html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()));
    if (html === lastEmitted.current) return;
    lastEmitted.current = html;
    onChange(html);
  };

  const run = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    flush();
  };

  return (
    <div className="relative">
      <div className="mb-2 flex flex-wrap items-center gap-0.5 border-b border-[#ddd] pb-1">
        <IconBtn label="Gras" onClick={() => run("bold")}>
          <Bold className="size-3.5" />
        </IconBtn>
        <IconBtn label="Italique" onClick={() => run("italic")}>
          <Italic className="size-3.5" />
        </IconBtn>
        <IconBtn label="Titre 2" onClick={() => run("formatBlock", "h2")}>
          <span className="text-[11px] font-semibold">H2</span>
        </IconBtn>
        <IconBtn label="Titre 3" onClick={() => run("formatBlock", "h3")}>
          <span className="text-[11px] font-semibold">H3</span>
        </IconBtn>
        <IconBtn label="Liste" onClick={() => run("insertUnorderedList")}>
          <List className="size-3.5" />
        </IconBtn>
        <IconBtn label="Liste numérotée" onClick={() => run("insertOrderedList")}>
          <ListOrdered className="size-3.5" />
        </IconBtn>
        <IconBtn label="Citation" onClick={() => run("formatBlock", "blockquote")}>
          <Quote className="size-3.5" />
        </IconBtn>
        <IconBtn
          label="Lien"
          onClick={() => {
            const url = window.prompt("Adresse du lien", "https://");
            if (url?.trim()) run("createLink", url.trim());
          }}
        >
          <Link2 className="size-3.5" />
        </IconBtn>
      </div>
      {!hasText ? (
        <p className="pointer-events-none absolute top-[46px] left-0 text-base text-[#949494]">
          Écrivez ou collez votre texte. Le format est conservé.
        </p>
      ) : null}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        aria-label="Contenu de l’article"
        className="classic-block-field min-h-[280px] bg-transparent px-0 py-1 text-[16px] leading-7 text-[#1e1e1e] outline-none [&_a]:text-[#2271b1] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[#c3c4c7] [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_pre]:overflow-x-auto [&_pre]:bg-[#f6f7f7] [&_pre]:p-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
        onInput={flush}
        onBlur={flush}
        onPaste={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const html = clipboardToHtml(
            event.clipboardData.getData("text/html"),
            event.clipboardData.getData("text/plain"),
          );
          if (!html) return;
          document.execCommand("insertHTML", false, html);
          flush();
        }}
      />
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
      className="grid size-8 place-items-center text-[#1e1e1e] hover:bg-[#f0f0f0]"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function SidebarPanel({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#e0e0e0]">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-medium text-[#1e1e1e] hover:bg-[#f6f6f6]"
        aria-expanded={open}
        onClick={onToggle}
      >
        {title}
        <ChevronDown
          className={cn("size-4 text-[#757575] transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? <div className="space-y-3 px-4 pb-4">{children}</div> : null}
    </section>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="shrink-0 text-[#757575]">{label}</span>
      <div className="min-w-0 flex-1 text-right">{children}</div>
    </div>
  );
}

const wpControl =
  "h-8 w-full rounded-sm border border-[#8c8f94] bg-white px-2 text-[13px] text-[#1e1e1e] shadow-none placeholder:text-[#757575] focus-visible:ring-[#007cba] focus-visible:shadow-[0_0_0_1px_#007cba]";

function DocumentSettings({
  post,
  onChange,
  categoryOptions,
  tagsDraft,
  onTagsDraftChange,
  onTagsCommit,
  onUploadImage,
}: {
  post: StoredBlogPost;
  onChange: (patch: Partial<StoredBlogPost>) => void;
  categoryOptions: string[];
  tagsDraft: string;
  onTagsDraftChange: (value: string) => void;
  onTagsCommit: () => void;
  onUploadImage: (file: File) => Promise<string | null>;
}) {
  const [open, setOpen] = useState({
    status: true,
    permalink: false,
    categories: false,
    tags: false,
    featured: false,
    excerpt: false,
    seo: false,
    author: false,
  });
  const toggle = (key: keyof typeof open) =>
    setOpen((current) => ({ ...current, [key]: !current[key] }));

  const visibilityLabel =
    post.status === "published"
      ? "Public"
      : post.status === "private"
        ? "Privé"
        : post.status === "scheduled"
          ? "Planifié"
          : "Brouillon";

  return (
    <div>
      <SidebarPanel
        title="État et visibilité"
        open={open.status}
        onToggle={() => toggle("status")}
      >
        <SettingRow label="Visibilité">
          <select
            className={cn(wpControl, "max-w-[148px]")}
            value={post.status}
            onChange={(e) =>
              onChange({ status: e.target.value as StoredBlogPost["status"] })
            }
          >
            <option value="published">Public</option>
            <option value="private">Privé</option>
            <option value="draft">Brouillon</option>
            <option value="scheduled">Planifié</option>
          </select>
        </SettingRow>
        <SettingRow label="Publication">
          {post.status === "scheduled" ? (
            <Input
              type="datetime-local"
              value={post.scheduledAt?.slice(0, 16) ?? ""}
              onChange={(e) => onChange({ scheduledAt: e.target.value || null })}
              className={cn(wpControl, "max-w-[148px]")}
            />
          ) : (
            <button
              type="button"
              className="text-[13px] text-[#007cba] hover:underline"
              onClick={() => onChange({ status: "scheduled" })}
            >
              Immédiatement
            </button>
          )}
        </SettingRow>
        <SettingRow label="Format">
          <select
            className={cn(wpControl, "max-w-[148px]")}
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
        </SettingRow>
        <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e]">
          <input
            type="checkbox"
            checked={Boolean(post.sticky)}
            onChange={(e) => onChange({ sticky: e.target.checked })}
          />
          Épingler en page d’accueil
        </label>
        <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e]">
          <input
            type="checkbox"
            checked={Boolean(post.featured)}
            onChange={(e) => onChange({ featured: e.target.checked })}
          />
          Article à la une
        </label>
        <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e]">
          <input
            type="checkbox"
            checked={Boolean(post.trending)}
            onChange={(e) => onChange({ trending: e.target.checked })}
          />
          Tendance
        </label>
        <SettingRow label="Auteur">
          <Input
            value={post.authorName}
            onChange={(e) => onChange({ authorName: e.target.value })}
            className={cn(wpControl, "max-w-[148px]")}
          />
        </SettingRow>
        <Field label="Date de publication">
          <Input
            type="date"
            value={post.publishedAt.slice(0, 10)}
            onChange={(e) => onChange({ publishedAt: e.target.value })}
            className={wpControl}
          />
        </Field>
      </SidebarPanel>

      <SidebarPanel title="Permalien" open={open.permalink} onToggle={() => toggle("permalink")}>
        <p className="break-all text-[12px] text-[#757575]">/blog/{post.slug}</p>
        <Field label="Slug">
          <Input
            value={post.slug}
            onChange={(e) => onChange({ slug: slugifyBlog(e.target.value) })}
            className={wpControl}
          />
        </Field>
      </SidebarPanel>

      <SidebarPanel
        title="Catégories"
        open={open.categories}
        onToggle={() => toggle("categories")}
      >
        <ul className="max-h-40 space-y-1.5 overflow-y-auto">
          {categoryOptions.map((cat) => (
            <li key={cat}>
              <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e]">
                <input
                  type="radio"
                  name="blog-category"
                  checked={post.category === cat}
                  onChange={() => onChange({ category: cat })}
                />
                {cat}
              </label>
            </li>
          ))}
          {!categoryOptions.includes(post.category) ? (
            <li>
              <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e]">
                <input type="radio" name="blog-category" checked readOnly />
                {post.category}
              </label>
            </li>
          ) : null}
        </ul>
      </SidebarPanel>

      <SidebarPanel title="Étiquettes" open={open.tags} onToggle={() => toggle("tags")}>
        <Input
          value={tagsDraft}
          placeholder="Ajoutez des étiquettes, séparées par des virgules"
          onChange={(e) => onTagsDraftChange(e.target.value)}
          onBlur={onTagsCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className={wpControl}
        />
        {post.tags.length ? (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-sm bg-[#f0f0f0] px-1.5 py-0.5 text-[11px] text-[#1e1e1e]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </SidebarPanel>

      <SidebarPanel
        title="Image mise en avant"
        open={open.featured}
        onToggle={() => toggle("featured")}
      >
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={post.coverAlt || ""}
            className="h-28 w-full rounded-sm object-cover"
          />
        ) : null}
        <DeviceImageButton
          label={post.coverImageUrl ? "Remplacer l’image" : "Définir l’image mise en avant"}
          onUpload={async (file) => {
            const url = await onUploadImage(file);
            if (!url) return;
            onChange({
              coverImageUrl: url,
              coverAlt: file.name.replace(/\.[^.]+$/, ""),
            });
            toast.success("Image de couverture enregistrée");
          }}
        />
        {post.coverImageUrl ? (
          <button
            type="button"
            className="text-[13px] text-[#cc1818] hover:underline"
            onClick={() => onChange({ coverImageUrl: undefined })}
          >
            Retirer l’image mise en avant
          </button>
        ) : null}
        <Field label="Ou URL">
          <Input
            value={post.coverImageUrl ?? ""}
            onChange={(e) => onChange({ coverImageUrl: e.target.value })}
            placeholder="https://…"
            className={wpControl}
          />
        </Field>
        <Field label="Texte alternatif">
          <Input
            value={post.coverAlt ?? ""}
            onChange={(e) => onChange({ coverAlt: e.target.value })}
            className={wpControl}
          />
        </Field>
      </SidebarPanel>

      <SidebarPanel title="Extrait" open={open.excerpt} onToggle={() => toggle("excerpt")}>
        <Textarea
          rows={4}
          value={post.excerpt}
          onChange={(e) => onChange({ excerpt: e.target.value })}
          placeholder="Écrivez un extrait (facultatif)"
          className={wpControl}
        />
      </SidebarPanel>

      <SidebarPanel title="SEO" open={open.seo} onToggle={() => toggle("seo")}>
        <Field label="Titre SEO">
          <Input
            value={post.seoTitle ?? ""}
            onChange={(e) => onChange({ seoTitle: e.target.value })}
            className={wpControl}
          />
        </Field>
        <Field label="Meta description">
          <Textarea
            rows={3}
            value={post.seoDescription ?? ""}
            onChange={(e) => onChange({ seoDescription: e.target.value })}
            className={wpControl}
          />
        </Field>
        <Field label="Mot-clé principal">
          <Input
            value={post.primaryKeyword ?? ""}
            onChange={(e) => onChange({ primaryKeyword: e.target.value })}
            className={wpControl}
          />
        </Field>
      </SidebarPanel>

      <SidebarPanel title="Auteur" open={open.author} onToggle={() => toggle("author")}>
        <Field label="Nom">
          <Input
            value={post.authorName}
            onChange={(e) => onChange({ authorName: e.target.value })}
            className={wpControl}
          />
        </Field>
        <Field label="Rôle">
          <Input
            value={post.authorRole}
            onChange={(e) => onChange({ authorRole: e.target.value })}
            className={wpControl}
          />
        </Field>
        <Field label="Initiales">
          <Input
            value={post.authorInitials}
            onChange={(e) => onChange({ authorInitials: e.target.value.slice(0, 3) })}
            className={wpControl}
          />
        </Field>
      </SidebarPanel>
    </div>
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

function DeviceImageButton({
  label,
  onUpload,
  onFiles,
}: {
  label: string;
  onUpload?: (file: File) => Promise<void>;
  onFiles?: (files: File[]) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const take = async (files: File[]) => {
    const images = files.filter(isAllowedImageFile);
    if (!images.length) {
      toast.error("Glissez une image JPG, PNG, WebP ou GIF");
      return;
    }
    setBusy(true);
    try {
      if (onFiles) await onFiles(images);
      else if (onUpload) await onUpload(images[0]!);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "mb-2 rounded-md border border-dashed px-3 py-4 text-center transition",
        over ? "border-[#007cba] bg-[#007cba]/5" : "border-[#c3c4c7] bg-[#f6f7f7]",
      )}
      onDragEnter={(event) => {
        preventImageDrag(event);
        setOver(true);
      }}
      onDragOver={preventImageDrag}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setOver(false);
      }}
      onDrop={(event) => {
        preventImageDrag(event);
        setOver(false);
        void take(imageFilesFromDataTransfer(event.dataTransfer));
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple={Boolean(onFiles)}
        className="hidden"
        disabled={busy}
        onChange={(event) => {
          void take(Array.from(event.target.files ?? []));
        }}
      />
      <p className="mb-2 text-[12px] text-[#757575]">
        Glissez-déposez une image ici, ou cliquez pour en choisir une.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-md"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
        {busy ? "Envoi…" : label}
      </Button>
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
  onUploadImage,
  onDropFiles,
  onSlash,
  onPasteHtml,
}: {
  block: BlogBlock;
  onChange: (block: BlogBlock) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  onDropFiles?: (files: File[]) => Promise<void>;
  onSlash?: () => void;
  onPasteHtml?: (html: string) => void;
}) {
  switch (block.type) {
    case "html":
      return (
        <ClassicBlockField
          value={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      );
    case "paragraph":
    case "quote":
    case "pullquote":
    case "code":
    case "preformatted":
      return (
        <Textarea
          rows={block.type === "paragraph" ? 2 : 5}
          value={block.content}
          placeholder={
            block.type === "paragraph" ? "Tapez / pour choisir un bloc" : undefined
          }
          className={cn(
            "min-h-10 resize-none border-0 bg-transparent px-0 py-1 text-base leading-7 text-[#1e1e1e] shadow-none placeholder:text-[#949494] focus-visible:ring-0",
            block.type === "code" || block.type === "preformatted"
              ? "font-mono text-sm"
              : "",
            block.type === "quote" || block.type === "pullquote" ? "italic" : "",
          )}
          onPaste={(event) => {
            if (block.type !== "paragraph") return;
            const html = event.clipboardData.getData("text/html");
            const text = event.clipboardData.getData("text/plain");
            const content = clipboardToHtml(html, text);
            if (!content) return;
            event.preventDefault();
            event.stopPropagation();
            onPasteHtml?.(content);
          }}
          onChange={(e) => {
            const value = e.target.value;
            if (block.type === "paragraph" && value === "/") {
              onChange({ ...block, content: "" });
              onSlash?.();
              return;
            }
            onChange({ ...block, content: value });
          }}
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
          <DeviceImageButton
            label={block.url ? "Remplacer l’image" : "Choisir sur l’appareil"}
            onFiles={onDropFiles}
            onUpload={async (file) => {
              const url = await onUploadImage(file);
              if (!url) return;
              onChange({
                ...block,
                url,
                alt: block.alt || file.name.replace(/\.[^.]+$/, ""),
              });
              toast.success("Image ajoutée");
            }}
          />
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
          {block.type === "embed" && block.provider && block.provider !== "generic" ? (
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#757575]">
              {block.provider}
            </p>
          ) : null}
          <Input
            placeholder={
              block.type === "embed"
                ? `URL ${block.provider && block.provider !== "generic" ? block.provider : "à embarquer"}`
                : "URL"
            }
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
    case "countdown":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            type="datetime-local"
            value={block.target}
            onChange={(e) => onChange({ ...block, target: e.target.value })}
          />
          <Input
            placeholder="Libellé"
            value={block.label ?? ""}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
          />
        </div>
      );
    case "progress":
      return (
        <div className="space-y-2">
          <Input
            placeholder="Libellé"
            value={block.label ?? ""}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
          />
          <Input
            type="number"
            min={0}
            max={100}
            value={block.value}
            onChange={(e) => onChange({ ...block, value: Number(e.target.value) })}
          />
        </div>
      );
    case "tabs":
      return (
        <Textarea
          rows={6}
          className="font-mono text-xs"
          value={block.items.map((item) => `${item.title} || ${item.content}`).join("\n")}
          placeholder="Titre || Contenu"
          onChange={(e) =>
            onChange({
              ...block,
              items: e.target.value.split("\n").map((line) => {
                const [title, ...rest] = line.split("||");
                return { title: title?.trim() ?? "", content: rest.join("||").trim() };
              }),
            })
          }
        />
      );
    case "testimonial":
      return (
        <div className="space-y-2">
          <Textarea
            rows={3}
            value={block.quote}
            onChange={(e) => onChange({ ...block, quote: e.target.value })}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Auteur"
              value={block.author}
              onChange={(e) => onChange({ ...block, author: e.target.value })}
            />
            <Input
              placeholder="Rôle"
              value={block.role ?? ""}
              onChange={(e) => onChange({ ...block, role: e.target.value })}
            />
          </div>
        </div>
      );
    case "pricing":
      return (
        <Textarea
          rows={6}
          className="font-mono text-xs"
          value={block.plans
            .map((plan) => `${plan.name} | ${plan.price} | ${plan.features.replace(/\n/g, " / ")} | ${plan.url ?? ""}`)
            .join("\n")}
          placeholder="Nom | Prix | fonction / fonction | url"
          onChange={(e) =>
            onChange({
              ...block,
              plans: e.target.value.split("\n").map((line) => {
                const [name, price, features, url] = line.split("|").map((p) => p.trim());
                return {
                  name: name ?? "",
                  price: price ?? "",
                  features: (features ?? "").replace(/ \/ /g, "\n"),
                  url,
                };
              }),
            })
          }
        />
      );
    case "iconbox":
    case "numberbox":
      return (
        <div className="space-y-2">
          <Input
            placeholder={block.type === "iconbox" ? "Icône" : "Chiffre"}
            value={block.type === "iconbox" ? block.icon : block.number}
            onChange={(e) =>
              onChange(
                block.type === "iconbox"
                  ? { ...block, icon: e.target.value }
                  : { ...block, number: e.target.value },
              )
            }
          />
          <Input
            placeholder="Titre"
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
          <Textarea
            rows={2}
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
          />
        </div>
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
