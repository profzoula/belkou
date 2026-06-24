import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminSaveSiteSettings, getAdminSiteSettings } from "@/lib/fns/admin";
import type { SiteSettings } from "@/lib/site-settings";

export function AdminSettingsTab() {
  const loadFn = useServerFn(getAdminSiteSettings);
  const saveFn = useServerFn(adminSaveSiteSettings);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await loadFn();
      setSettings(result.settings);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const result = await saveFn({ data: settings });
      setSettings(result.settings);
      toast.success("Paramètres enregistrés");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="surface rounded-2xl p-10 text-center text-sm text-muted-foreground">
        Chargement des paramètres...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Paramètres du site</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dates, promo et Vimeo par défaut. Sauvegardé dans Supabase (prioritaire sur le code).
        </p>
      </div>

      <form onSubmit={save} className="surface rounded-xl p-5 sm:p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="cohort">Date de début de cohorte</Label>
          <Input
            id="cohort"
            value={settings.cohortStartDate ?? ""}
            onChange={(e) => setSettings((s) => s && { ...s, cohortStartDate: e.target.value })}
            className="rounded-lg"
            placeholder="28 juin 2026"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="students">Base compteur étudiants (site public)</Label>
          <Input
            id="students"
            type="number"
            min={0}
            value={settings.statsStudentsBase ?? 0}
            onChange={(e) =>
              setSettings((s) => s && { ...s, statsStudentsBase: Number(e.target.value) || 0 })
            }
            className="rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vimeo-default">Vimeo preview par défaut (ID ou URL)</Label>
          <Input
            id="vimeo-default"
            value={settings.vimeoPreviewDefault ?? ""}
            onChange={(e) => setSettings((s) => s && { ...s, vimeoPreviewDefault: e.target.value })}
            className="rounded-lg"
            placeholder="1204014571"
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(settings.promoEnabled)}
            onChange={(e) => setSettings((s) => s && { ...s, promoEnabled: e.target.checked })}
            className="rounded border-border"
          />
          Bandeau promo actif
        </label>

        <div className="space-y-2">
          <Label htmlFor="promo">Message promo (complet)</Label>
          <Textarea
            id="promo"
            value={settings.promoMessage ?? ""}
            onChange={(e) => setSettings((s) => s && { ...s, promoMessage: e.target.value })}
            className="rounded-lg min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="promo-short">Message promo (court)</Label>
          <Input
            id="promo-short"
            value={settings.promoMessageShort ?? ""}
            onChange={(e) => setSettings((s) => s && { ...s, promoMessageShort: e.target.value })}
            className="rounded-lg"
          />
        </div>

        <Button type="submit" variant="hero" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        Pour que <code className="rounded bg-muted px-1">VITE_*</code> change aussi au build, mettez à jour Railway
        et redeployez. Les valeurs Supabase s&apos;appliquent côté serveur et admin immédiatement.
      </p>
    </div>
  );
}
