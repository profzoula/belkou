import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { THUMBNAIL_GRADIENT_PRESETS, type CourseThumbnailData } from "@/lib/course-thumbnails";
import { cn } from "@/lib/utils";

type AdminCourseThumbnailEditorProps = {
  value: CourseThumbnailData;
  slug: string;
  onChange: (patch: Partial<CourseThumbnailData>) => void;
};

export function AdminCourseThumbnailEditor({ value, slug, onChange }: AdminCourseThumbnailEditorProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4 shadow-sm">
      <div>
        <h2 className="font-semibold">Miniature du cours</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Image (URL) ou dégradé de couleur — visible sur l&apos;accueil et la page du cours.
        </p>
      </div>

      <CourseThumbnailBanner
        thumbnail={value}
        slug={slug}
        className="rounded-xl border border-border overflow-hidden max-w-md"
      />

      <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="thumb-image">Image (URL)</Label>
          <Input
            id="thumb-image"
            value={value.imageUrl ?? ""}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            className="rounded-lg"
            placeholder="https://.../mon-image.jpg"
          />
          <p className="text-[11px] text-muted-foreground">
            Collez un lien public (Supabase Storage, Imgur, etc.). Laissez vide pour utiliser le dégradé.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="thumb-label">Étiquette</Label>
          <Input
            id="thumb-label"
            value={value.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="rounded-lg"
            placeholder="Apps IA"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="thumb-gradient">Classes dégradé Tailwind</Label>
          <Input
            id="thumb-gradient"
            value={value.gradient}
            onChange={(e) => onChange({ gradient: e.target.value })}
            className="rounded-lg"
            placeholder="from-violet-600 via-indigo-600 to-blue-700"
            disabled={Boolean(value.imageUrl?.trim())}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Dégradés rapides</Label>
        <div className="flex flex-wrap gap-2">
          {THUMBNAIL_GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              onClick={() => onChange({ gradient: preset.gradient, imageUrl: "" })}
              className={cn(
                "h-9 w-14 rounded-lg bg-gradient-to-br border-2 transition-transform hover:scale-105",
                preset.gradient,
                value.gradient === preset.gradient && !value.imageUrl?.trim()
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent",
              )}
            />
          ))}
        </div>
      </div>

      {value.imageUrl?.trim() && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ imageUrl: "" })}>
          Retirer l&apos;image — utiliser le dégradé
        </Button>
      )}
    </div>
  );
}
