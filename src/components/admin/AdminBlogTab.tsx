import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { GutenbergEditor } from "@/components/admin/gutenberg/GutenbergEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminDeleteBlogPost,
  adminMergeAstucesBlogSeed,
  adminSaveBlogPost,
  getAdminBlogPosts,
} from "@/lib/fns/admin";
import { createBlankPost } from "@/lib/blog-storage";
import type { StoredBlogPost } from "@/lib/blog-blocks";
import { cn } from "@/lib/utils";

export function AdminBlogTab() {
  const loadFn = useServerFn(getAdminBlogPosts);
  const saveFn = useServerFn(adminSaveBlogPost);
  const deleteFn = useServerFn(adminDeleteBlogPost);
  const mergeAstucesFn = useServerFn(adminMergeAstucesBlogSeed);
  const [posts, setPosts] = useState<StoredBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<StoredBlogPost | null>(null);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const result = await loadFn();
      setPosts(result.posts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

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

  const startCreate = () => {
    setEditing(createBlankPost());
  };

  const saveEditing = async (status?: StoredBlogPost["status"]) => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        ...editing,
        status: status ?? editing.status,
        updatedAt: new Date().toISOString(),
      };
      const result = await saveFn({ data: { post: payload } });
      setPosts(result.posts);
      setEditing(result.post);
      toast.success(
        status === "published" ? "Article publié" : "Article enregistré",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (post: StoredBlogPost) => {
    if (!confirm(`Supprimer « ${post.title} » ?`)) return;
    try {
      const result = await deleteFn({ data: { id: post.id } });
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
      toast.success(`${result.imported} astuces publiées sur le blog BelKou`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <GutenbergEditor
        post={editing}
        onChange={setEditing}
        onSave={saveEditing}
        onClose={() => {
          setEditing(null);
          load().catch(() => undefined);
        }}
        saving={saving}
      />
    );
  }

  if (loading) {
    return (
      <div className="surface rounded-2xl p-10 text-center text-sm text-muted-foreground">
        Chargement des articles…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Blog"
        description="Éditeur type Gutenberg : blocs, SEO, publication, brouillons et aperçu."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={saving}
              onClick={importAstuces}
            >
              Importer astuces 1–10
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
            Aucun article. Créez le premier avec l’éditeur Gutenberg BelKou.
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
                    <FileText className="size-4 shrink-0 text-[#007cba]" />
                    <span className="truncate">{post.title}</span>
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    /blog/{post.slug} · {post.readMinutes} min ·{" "}
                    {post.blocks.length} bloc{post.blocks.length > 1 ? "s" : ""}
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
