import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink, Plus, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCreateService,
  adminDeleteService,
  adminSetServicePublished,
  adminUpdateService,
  getAdminServices,
} from "@/lib/fns/admin";
import { AdminServiceImageEditor } from "@/components/admin/AdminServiceImageEditor";
import {
  SERVICE_GRADIENT_PRESETS,
  SERVICE_ICON_OPTIONS,
  type StoredService,
} from "@/lib/service-storage";
import { cn } from "@/lib/utils";

type ServiceDraft = {
  title: string;
  description: string;
  priceLabel: string;
  rating: string;
  ratingsCount: string;
  provider: string;
  iconKey: StoredService["iconKey"];
  gradient: string;
  imageUrl: string;
  premium: boolean;
  published: boolean;
  deliverablesText: string;
  actionType: StoredService["actionType"];
  linkHref: string;
  linkLabel: string;
  sortOrder: string;
};

function serviceToDraft(service: StoredService): ServiceDraft {
  return {
    title: service.title,
    description: service.description,
    priceLabel: service.priceLabel,
    rating: String(service.rating),
    ratingsCount: String(service.ratingsCount),
    provider: service.provider,
    iconKey: service.iconKey,
    gradient: service.gradient,
    imageUrl: service.imageUrl ?? "",
    premium: service.premium,
    published: service.published,
    deliverablesText: service.deliverables.join("\n"),
    actionType: service.actionType,
    linkHref: service.linkHref ?? "",
    linkLabel: service.linkLabel ?? "",
    sortOrder: String(service.sortOrder),
  };
}

export function AdminServicesTab() {
  const loadFn = useServerFn(getAdminServices);
  const createFn = useServerFn(adminCreateService);
  const updateFn = useServerFn(adminUpdateService);
  const deleteFn = useServerFn(adminDeleteService);
  const publishFn = useServerFn(adminSetServicePublished);

  const [services, setServices] = useState<StoredService[]>([]);
  const [view, setView] = useState<"list" | "edit">("list");
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [draft, setDraft] = useState<ServiceDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const result = await loadFn();
      setServices(result.services);
    } catch {
      toast.error("Impossible de charger les services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (service) =>
        service.title.toLowerCase().includes(q) ||
        service.slug.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q),
    );
  }, [services, search]);

  const selected = services.find((service) => service.slug === selectedSlug);

  const openEdit = (slug: string) => {
    const service = services.find((item) => item.slug === slug);
    if (!service) return;
    setSelectedSlug(slug);
    setDraft(serviceToDraft(service));
    setView("edit");
  };

  const syncServices = (next: StoredService[]) => {
    setServices(next);
    const updated = next.find((service) => service.slug === selectedSlug);
    if (updated) {
      setDraft(serviceToDraft(updated));
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error("Titre requis");
      return;
    }
    setCreating(true);
    try {
      const result = await createFn({
        data: {
          title: newTitle.trim(),
          slug: newSlug.trim() || undefined,
        },
      });
      setServices(result.services);
      setNewTitle("");
      setNewSlug("");
      toast.success("Service créé");
      openEdit(result.createdSlug);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Création impossible");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selected || !draft) return;
    setSaving(true);
    try {
      const result = await updateFn({
        data: {
          slug: selected.slug,
          title: draft.title.trim(),
          description: draft.description.trim(),
          priceLabel: draft.priceLabel.trim(),
          rating: Number.parseFloat(draft.rating) || 0,
          ratingsCount: Number.parseInt(draft.ratingsCount, 10) || 0,
          provider: draft.provider.trim(),
          iconKey: draft.iconKey,
          gradient: draft.gradient.trim(),
          imageUrl: draft.imageUrl.trim(),
          premium: draft.premium,
          published: draft.published,
          deliverablesText: draft.deliverablesText,
          actionType: draft.actionType,
          linkHref: draft.linkHref.trim(),
          linkLabel: draft.linkLabel.trim(),
          sortOrder: Number.parseInt(draft.sortOrder, 10) || 0,
        },
      });
      setServices(result.services);
      toast.success("Service enregistré");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!window.confirm("Supprimer ce service ?")) return;
    try {
      const result = await deleteFn({ data: { slug } });
      setServices(result.services);
      if (selectedSlug === slug) {
        setView("list");
        setSelectedSlug("");
        setDraft(null);
      }
      toast.success("Service supprimé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    }
  };

  const handleTogglePublished = async (slug: string, published: boolean) => {
    setTogglingSlug(slug);
    try {
      const result = await publishFn({ data: { slug, published } });
      setServices(result.services);
      if (selectedSlug === slug && draft) {
        setDraft((current) => (current ? { ...current, published } : current));
      }
      toast.success(published ? "Service publié" : "Service masqué");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mise à jour impossible");
    } finally {
      setTogglingSlug(null);
    }
  };

  if (view === "edit" && selected && draft) {
    const IconPreview = SERVICE_ICON_OPTIONS.find((item) => item.key === draft.iconKey)?.icon;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/services/$slug" params={{ slug: selected.slug }} target="_blank">
                <ExternalLink className="h-4 w-4" />
                Voir sur le site
              </Link>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">Modifier le service</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Slug : <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{selected.slug}</code>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="published" className="text-sm">
                Publié
              </Label>
              <Switch
                id="published"
                checked={draft.published}
                onCheckedChange={(published) => setDraft((current) => (current ? { ...current, published } : current))}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={draft.title}
                  onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => (current ? { ...current, description: event.target.value } : current))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priceLabel">Prix affiché</Label>
                  <Input
                    id="priceLabel"
                    value={draft.priceLabel}
                    onChange={(event) =>
                      setDraft((current) => (current ? { ...current, priceLabel: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Prestataire</Label>
                  <Input
                    id="provider"
                    value={draft.provider}
                    onChange={(event) =>
                      setDraft((current) => (current ? { ...current, provider: event.target.value } : current))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rating">Note (0–5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={draft.rating}
                    onChange={(event) =>
                      setDraft((current) => (current ? { ...current, rating: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ratingsCount">Nombre d&apos;avis</Label>
                  <Input
                    id="ratingsCount"
                    type="number"
                    min={0}
                    value={draft.ratingsCount}
                    onChange={(event) =>
                      setDraft((current) => (current ? { ...current, ratingsCount: event.target.value } : current))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Icône</Label>
                <Select
                  value={draft.iconKey}
                  onValueChange={(value) =>
                    setDraft((current) =>
                      current ? { ...current, iconKey: value as StoredService["iconKey"] } : current,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dégradé (classes Tailwind)</Label>
                <Select
                  value={draft.gradient}
                  onValueChange={(value) => setDraft((current) => (current ? { ...current, gradient: value } : current))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_GRADIENT_PRESETS.map((preset) => (
                      <SelectItem key={preset} value={preset}>
                        {preset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <AdminServiceImageEditor
                  slug={selected.slug}
                  imageUrl={draft.imageUrl.trim() || undefined}
                  gradient={draft.gradient}
                  iconKey={draft.iconKey}
                  onUpdated={syncServices}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="premium"
                  checked={draft.premium}
                  onCheckedChange={(premium) => setDraft((current) => (current ? { ...current, premium } : current))}
                />
                <Label htmlFor="premium">Badge Premium</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordre d&apos;affichage</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={draft.sortOrder}
                  onChange={(event) =>
                    setDraft((current) => (current ? { ...current, sortOrder: event.target.value } : current))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Type d&apos;action</Label>
                <Select
                  value={draft.actionType}
                  onValueChange={(value) =>
                    setDraft((current) =>
                      current ? { ...current, actionType: value as StoredService["actionType"] } : current,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booking">Formulaire de rendez-vous</SelectItem>
                    <SelectItem value="link">Lien externe / interne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.actionType === "link" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="linkHref">URL du lien</Label>
                    <Input
                      id="linkHref"
                      placeholder="/courses"
                      value={draft.linkHref}
                      onChange={(event) =>
                        setDraft((current) => (current ? { ...current, linkHref: event.target.value } : current))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkLabel">Texte du bouton</Label>
                    <Input
                      id="linkLabel"
                      value={draft.linkLabel}
                      onChange={(event) =>
                        setDraft((current) => (current ? { ...current, linkLabel: event.target.value } : current))
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="deliverables">Livrables (une ligne par item)</Label>
            <Textarea
              id="deliverables"
              rows={6}
              value={draft.deliverablesText}
              onChange={(event) =>
                setDraft((current) => (current ? { ...current, deliverablesText: event.target.value } : current))
              }
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <div className={cn("relative aspect-[16/10] bg-gradient-to-br", draft.gradient)}>
              {draft.imageUrl ? (
                <img src={draft.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : IconPreview ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <IconPreview className="h-16 w-16 text-white/25" />
                </div>
              ) : null}
            </div>
            <div className="p-4">
              <p className="font-display text-lg font-bold">{draft.title || "Titre du service"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{draft.priceLabel}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="destructive" size="sm" onClick={() => handleDelete(selected.slug)}>
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les services affichés sur la page publique /services.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold">Nouveau service</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Titre du service"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            className="sm:flex-1"
          />
          <Input
            placeholder="Slug (optionnel)"
            value={newSlug}
            onChange={(event) => setNewSlug(event.target.value)}
            className="sm:w-48"
          />
          <Button onClick={handleCreate} disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? "Création…" : "Ajouter"}
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un service…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
          Aucun service trouvé.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((service) => {
            const Icon = SERVICE_ICON_OPTIONS.find((item) => item.key === service.iconKey)?.icon;
            return (
              <article
                key={service.slug}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <div className={cn("relative aspect-[16/10] bg-gradient-to-br", service.gradient)}>
                  {service.imageUrl ? (
                    <img src={service.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : Icon ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="h-12 w-12 text-white/25" />
                    </div>
                  ) : null}
                  <span
                    className={cn(
                      "absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      service.published ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {service.published ? "Publié" : "Masqué"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display font-bold">{service.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
                  <p className="mt-2 text-sm font-semibold">{service.priceLabel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {service.actionType === "link" ? "Lien" : "Rendez-vous"} · ordre {service.sortOrder}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(service.slug)}>
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={togglingSlug === service.slug}
                      onClick={() => handleTogglePublished(service.slug, !service.published)}
                    >
                      {service.published ? "Masquer" : "Publier"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
