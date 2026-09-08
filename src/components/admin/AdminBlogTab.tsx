import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ExternalLink,
  FileText,
  FolderOpen,
  ImageIcon,
  Plus,
  Settings2,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ClassicBlogEditor } from "@/components/admin/ClassicBlogEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminDeleteBlogPost,
  adminMergeAstucesBlogSeed,
  adminRecoverBlogImages,
  adminSaveBlogCategories,
  adminSaveBlogPost,
  getAdminBlogCategories,
  getAdminBlogPosts,
  getAdminBlogSeedStatus,
} from "@/lib/fns/admin";
import {
  slugifyBlogCategoryId,
  type BlogCategoryItem,
} from "@/lib/blog-categories";
import { createBlankPost } from "@/lib/blog-storage";
import type { StoredBlogPost } from "@/lib/blog-blocks";
import { cn } from "@/lib/utils";

export type BlogPanel = "articles" | "categories" | "tags" | "media" | "settings";

export const BLOG_SECONDARY_NAV: Array<{
  id: BlogPanel;
  label: string;
  icon: typeof FileText;
}> = [
  { id: "articles", label: "Articles", icon: FileText },
  { id: "categories", label: "Catégories", icon: FolderOpen },
  { id: "tags", label: "Étiquettes", icon: Tags },
  { id: "media", label: "Médias", icon: ImageIcon },
  { id: "settings", label: "Réglages", icon: Settings2 },
];

export function blogPanelLabel(panel: BlogPanel): string {
  return BLOG_SECONDARY_NAV.find((item) => item.id === panel)?.label ?? "Articles";
}

export function AdminBlogSecondaryNav({
  panel,
  onPanelChange,
}: {
  panel: BlogPanel;
  onPanelChange: (panel: BlogPanel) => void;
}) {
  return (
    <div className="flex h-full flex-col px-3 py-4">
      <p className="mb-3 px-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/70 uppercase">
        Blog
      </p>
      <nav
        className="flex gap-1.5 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible"
        aria-label="Navigation blog"
      >
        {BLOG_SECONDARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = panel === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPanelChange(item.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:w-full",
                active
                  ? "bg-[#f3f4f6] text-foreground dark:bg-muted"
                  : "text-muted-foreground hover:bg-[#f8f9fa] hover:text-foreground dark:hover:bg-muted/60",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

type AdminBlogTabProps = {
  panel: BlogPanel;
  onEditingChange?: (editing: boolean) => void;
};

export function AdminBlogTab({ panel, onEditingChange }: AdminBlogTabProps) {
  const [posts, setPosts] = useState<StoredBlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategoryItem[]>([]);
  const [defaults, setDefaults] = useState<BlogCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<StoredBlogPost | null>(null);
  const [query, setQuery] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [seedStatus, setSeedStatus] = useState<{
    seedCount: number;
    cmsCount: number;
    inSync: boolean;
    missingFromCms: number;
    extraInCms: number;
    lastImportedAt: string | null;
  } | null>(null);

  const loadPostsFn = useServerFn(getAdminBlogPosts);
  const savePostFn = useServerFn(adminSaveBlogPost);
  const deletePostFn = useServerFn(adminDeleteBlogPost);
  const mergeAstucesFn = useServerFn(adminMergeAstucesBlogSeed);
  const recoverImagesFn = useServerFn(adminRecoverBlogImages);
  const loadCatsFn = useServerFn(getAdminBlogCategories);
  const saveCatsFn = useServerFn(adminSaveBlogCategories);
  const loadSeedStatusFn = useServerFn(getAdminBlogSeedStatus);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [postsResult, catsResult, statusResult] = await Promise.all([
        loadPostsFn(),
        loadCatsFn(),
        loadSeedStatusFn().catch(() => null),
      ]);
      setPosts(postsResult.posts);
      setCategories(catsResult.categories);
      setDefaults(catsResult.defaults);
      setSeedStatus(statusResult);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll().catch(() => undefined);
  }, []);

  useEffect(() => {
    onEditingChange?.(Boolean(editing));
  }, [editing, onEditingChange]);

  const tags = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) {
        const key = tag.trim();
        if (!key) continue;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [posts]);

  const filtered = posts.filter((post) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      post.title.toLowerCase().includes(q) ||
      post.slug.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q) ||
      post.status.toLowerCase().includes(q)
    );
  });

  const startCreate = () => setEditing(createBlankPost());

  const saveEditing = async (status?: StoredBlogPost["status"]) => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        ...editing,
        status: status ?? editing.status,
        updatedAt: new Date().toISOString(),
      };
      const result = await savePostFn({ data: { post: payload } });
      setPosts(result.posts);
      setEditing(result.post);
      toast.success(status === "published" ? "Article publié" : "Article enregistré");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (post: StoredBlogPost) => {
    if (!confirm(`Supprimer « ${post.title} » ?`)) return;
    try {
      const result = await deletePostFn({ data: { id: post.id } });
      setPosts(result.posts);
      if (editing?.id === post.id) setEditing(null);
      toast.success("Article supprimé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    }
  };

  const importAstuces = async () => {
    setSaving(true);
    try {
      const result = await mergeAstucesFn();
      setPosts(result.posts);
      setSeedStatus({
        seedCount: result.imported,
        cmsCount: result.posts.length,
        inSync: true,
        missingFromCms: 0,
        extraInCms: Math.max(0, result.posts.length - result.imported),
        lastImportedAt: result.importedAt,
      });
      toast.success(
        `${result.imported} articles synchronisés — couvertures et images CMS sont conservées.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible");
    } finally {
      setSaving(false);
    }
  };

  const recoverImages = async () => {
    setSaving(true);
    try {
      const result = await recoverImagesFn();
      setPosts(result.posts);
      toast.success(
        `Images restaurées : ${result.coversRestored} couverture(s), ${result.bodiesRestored} article(s) · ${result.imagesFound} fichier(s) trouvés`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Récupération impossible");
    } finally {
      setSaving(false);
    }
  };

  const saveCategories = async () => {
    if (categories.length === 0) {
      toast.error("Ajoutez au moins une catégorie");
      return;
    }
    setSaving(true);
    try {
      const result = await saveCatsFn({ data: { categories } });
      setCategories(result.categories);
      toast.success("Catégories enregistrées");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <ClassicBlogEditor
        post={editing}
        onChange={setEditing}
        onSave={saveEditing}
        onClose={() => {
          setEditing(null);
          loadAll().catch(() => undefined);
        }}
        saving={saving}
        categoryOptions={categories.map((c) => c.label)}
      />
    );
  }

  if (loading) {
    return (
      <div className="surface rounded-2xl p-10 text-center text-sm text-muted-foreground">
        Chargement du blog…
      </div>
    );
  }

  if (panel === "articles") {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <AdminPageHeader
          eyebrow="Blog"
          title="Articles"
          description="Liste des articles déjà dans le CMS (pas une file d’attente d’import). Après sync seed, ils restent ici parce qu’ils sont publiés."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={saving}
                onClick={importAstuces}
              >
                {seedStatus?.inSync
                  ? `Resynchroniser (${seedStatus.seedCount})`
                  : `Synchroniser le seed (${seedStatus?.seedCount ?? 90})`}
              </Button>
              <Button type="button" className="rounded-full" onClick={startCreate}>
                <Plus className="size-4" /> Nouvel article
              </Button>
            </div>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un article…"
            className="sm:max-w-sm"
          />
          <p className="text-sm text-muted-foreground">
            {posts.length} article{posts.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="surface overflow-hidden rounded-2xl">
          <div className="hidden grid-cols-[1fr_120px_110px_120px] gap-3 border-b border-border px-4 py-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:grid">
            <span>Titre</span>
            <span>État</span>
            <span>Catégorie</span>
            <span className="text-right">Actions</span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Aucun article. Créez le premier avec l’éditeur.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((post) => (
                <li
                  key={post.id}
                  className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_120px_110px_120px] sm:items-center"
                >
                  <button
                    type="button"
                    className="min-w-0 text-left"
                    onClick={() => setEditing(post)}
                  >
                    <p className="flex items-center gap-2 font-semibold">
                      <FileText className="size-4 shrink-0 text-primary" />
                      <span className="truncate">{post.title}</span>
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      /blog/{post.slug} · {post.readMinutes} min · {post.blocks.length} blocs
                    </p>
                  </button>
                  <span
                    className={cn(
                      "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold",
                      post.status === "published"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : post.status === "scheduled"
                          ? "bg-amber-500/10 text-amber-700"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {post.status}
                  </span>
                  <span className="text-sm text-muted-foreground">{post.category}</span>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      asChild
                    >
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-destructive"
                      onClick={() => remove(post)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (panel === "categories") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <AdminPageHeader
          eyebrow="Blog"
          title="Catégories"
          description="Gérez les catégories affichées sur le blog et dans l’éditeur."
        />
        <div className="surface space-y-4 rounded-2xl p-5 sm:p-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/10 p-3 sm:flex-row sm:items-end"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor={`blog-cat-${category.id}`}>Nom</Label>
                <Input
                  id={`blog-cat-${category.id}`}
                  value={category.label}
                  onChange={(e) =>
                    setCategories((current) =>
                      current.map((item) =>
                        item.id === category.id
                          ? { ...item, label: e.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-destructive"
                onClick={() =>
                  setCategories((current) =>
                    current.filter((item) => item.id !== category.id),
                  )
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="new-blog-cat">Nouvelle catégorie</Label>
              <Input
                id="new-blog-cat"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ex. Cybersécurité"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                const label = newCategory.trim();
                if (label.length < 2) {
                  toast.error("Nom trop court");
                  return;
                }
                let id = slugifyBlogCategoryId(label);
                if (categories.some((c) => c.id === id)) {
                  id = `${id}-${categories.length + 1}`;
                }
                setCategories((current) => [...current, { id, label }]);
                setNewCategory("");
              }}
            >
              <Plus className="size-4" /> Ajouter
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              className="rounded-full"
              disabled={saving}
              onClick={saveCategories}
            >
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setCategories(defaults)}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (panel === "tags") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <AdminPageHeader
          eyebrow="Blog"
          title="Étiquettes"
          description="Étiquettes utilisées dans vos articles. Ajoutez-en depuis l’éditeur d’article."
        />
        <div className="surface rounded-2xl p-5 sm:p-6">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune étiquette pour le moment.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {tags.map(([tag, count]) => (
                <li
                  key={tag}
                  className="rounded-full border border-border bg-muted/20 px-3 py-1.5 text-sm"
                >
                  <span className="font-medium">{tag}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (panel === "media") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <AdminPageHeader
          eyebrow="Blog"
          title="Médias"
          description="Uploadez des images depuis votre appareil dans l’éditeur (Ajouter un média) ou en image de couverture."
        />
        <div className="surface space-y-3 rounded-2xl p-5 text-sm text-muted-foreground sm:p-6">
          <p>
            Ouvrez un article → <strong>Ajouter un média</strong> choisit une image sur votre
            téléphone ou ordinateur (JPG, PNG, WebP, GIF — max 5 Mo).
          </p>
          <p>
            L’image de couverture se règle aussi depuis le panneau Article (upload appareil ou URL).
          </p>
          <p className="text-xs">
            Prérequis Supabase : bucket public <code>blog-images</code> (
            <code>supabase/blog_images_storage.sql</code>).
          </p>
          <div className="border-t border-border pt-3">
            <p className="text-foreground">
              Si un sync seed a effacé vos images : les fichiers restent souvent dans le bucket.
              Reliez-les aux articles :
            </p>
            <Button
              type="button"
              className="mt-3 rounded-full"
              disabled={saving}
              onClick={recoverImages}
            >
              Restaurer les images depuis Supabase
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AdminPageHeader
        eyebrow="Blog"
        title="Réglages"
        description="Imports et options du blog BelKou."
      />
      <div className="surface space-y-4 rounded-2xl p-5 sm:p-6">
        <div>
          <h3 className="font-semibold text-foreground">Seed blog (astuces + IA)</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Met à jour le texte depuis le pack seed ({seedStatus?.seedCount ?? 90} articles). Les{" "}
            <strong>couvertures</strong> et le HTML avec images uploadées sont{" "}
            <strong>conservés</strong>. Les articles hors seed restent aussi.
          </p>
          {seedStatus ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {seedStatus.inSync ? (
                <>
                  État : <span className="font-medium text-emerald-600">synchronisé</span> (
                  {seedStatus.cmsCount}/{seedStatus.seedCount}
                  {seedStatus.lastImportedAt
                    ? ` · dernier sync ${new Date(seedStatus.lastImportedAt).toLocaleString("fr-FR")}`
                    : ""}
                  )
                </>
              ) : (
                <>
                  État : <span className="font-medium text-amber-600">à synchroniser</span> — CMS{" "}
                  {seedStatus.cmsCount}, seed {seedStatus.seedCount}
                  {seedStatus.missingFromCms
                    ? ` · ${seedStatus.missingFromCms} manquant(s) dans le CMS`
                    : ""}
                  {seedStatus.extraInCms
                    ? ` · ${seedStatus.extraInCms} hors seed dans le CMS`
                    : ""}
                </>
              )}
            </p>
          ) : null}
          <Button
            type="button"
            className="mt-3 rounded-full"
            disabled={saving}
            onClick={importAstuces}
          >
            {seedStatus?.inSync
              ? `Resynchroniser les ${seedStatus.seedCount} articles`
              : `Synchroniser les ${seedStatus?.seedCount ?? 90} articles du seed`}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="mt-3 ml-2 rounded-full"
            disabled={saving}
            onClick={recoverImages}
          >
            Restaurer images perdues
          </Button>
        </div>
        <div className="border-t border-border pt-4">
          <h3 className="font-semibold text-foreground">Site public</h3>
          <Button type="button" variant="outline" className="mt-3 rounded-full" asChild>
            <a href="/blog" target="_blank" rel="noreferrer">
              Ouvrir /blog
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
