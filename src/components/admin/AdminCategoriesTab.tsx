import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  adminSaveCourseCategories,
  getAdminCourseCategories,
} from "@/lib/fns/admin";
import {
  slugifyCategoryId,
  type CourseCategory,
} from "@/lib/course-categories";

export function AdminCategoriesTab() {
  const loadFn = useServerFn(getAdminCourseCategories);
  const saveFn = useServerFn(adminSaveCourseCategories);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [defaults, setDefaults] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const result = await loadFn();
      setCategories(result.categories);
      setDefaults(result.defaults);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const updateLabel = (id: string, label: string) => {
    setCategories((current) =>
      current.map((item) => (item.id === id ? { ...item, label } : item)),
    );
  };

  const removeCategory = (id: string) => {
    setCategories((current) => current.filter((item) => item.id !== id));
  };

  const addCategory = () => {
    const label = newLabel.trim();
    if (label.length < 2) {
      toast.error("Nom trop court");
      return;
    }
    let id = slugifyCategoryId(label);
    if (!id) {
      toast.error("Nom invalide");
      return;
    }
    if (categories.some((item) => item.id === id)) {
      id = `${id}-${categories.length + 1}`;
    }
    setCategories((current) => [...current, { id, label }]);
    setNewLabel("");
  };

  const resetDefaults = () => {
    if (!confirm("Remettre les catégories par défaut BelKou ?")) return;
    setCategories(defaults);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) {
      toast.error("Ajoutez au moins une catégorie");
      return;
    }
    setSaving(true);
    try {
      const result = await saveFn({ data: { categories } });
      setCategories(result.categories);
      toast.success("Catégories enregistrées");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="surface rounded-2xl p-10 text-center text-sm text-muted-foreground">
        Chargement des catégories...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Catégories"
        description="Ajoutez ou modifiez les catégories affichées sur le site et dans les cours."
      />

      <form onSubmit={save} className="surface space-y-5 rounded-2xl p-5 sm:p-6">
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/10 p-3 sm:flex-row sm:items-end"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor={`cat-label-${category.id}`}>Nom</Label>
                <Input
                  id={`cat-label-${category.id}`}
                  value={category.label}
                  onChange={(e) => updateLabel(category.id, e.target.value)}
                  className="rounded-lg"
                  required
                />
                <p className="truncate text-[11px] text-muted-foreground">ID : {category.id}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeCategory(category.id)}
                aria-label={`Supprimer ${category.label}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
          <Label htmlFor="new-category">Nouvelle catégorie</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="new-category"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ex. Intelligence Artificielle"
              className="rounded-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
            />
            <Button type="button" variant="outline" className="shrink-0" onClick={addCategory}>
              <Plus className="mr-1.5 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="hero" disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
          <Button type="button" variant="ghost" onClick={resetDefaults}>
            Réinitialiser défauts
          </Button>
        </div>
      </form>
    </div>
  );
}
