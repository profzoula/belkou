import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AdminCourse } from "@/lib/admin-courses";
import { adminRemoveCourseThumbnail, adminUploadCourseThumbnail } from "@/lib/fns/admin";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

type AdminCourseThumbnailEditorProps = {
  slug: string;
  imageUrl?: string;
  gradient: string;
  label: string;
  onUpdated: (courses: AdminCourse[]) => void;
};

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

export function AdminCourseThumbnailEditor({
  slug,
  imageUrl,
  gradient,
  label,
  onUpdated,
}: AdminCourseThumbnailEditorProps) {
  const uploadFn = useServerFn(adminUploadCourseThumbnail);
  const removeFn = useServerFn(adminRemoveCourseThumbnail);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleFile = async (file: File) => {
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Format non supporté (JPG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image trop volumineuse (max 5 Mo)");
      return;
    }

    setUploading(true);
    try {
      const dataBase64 = await readFileAsBase64(file);
      const result = await uploadFn({
        data: {
          courseSlug: slug,
          contentType: file.type,
          dataBase64,
        },
      });
      onUpdated(result.courses);
      toast.success("Miniature enregistrée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!imageUrl) return;
    if (!window.confirm("Retirer la miniature de ce cours ?")) return;

    setRemoving(true);
    try {
      const result = await removeFn({ data: { courseSlug: slug } });
      onUpdated(result.courses);
      toast.success("Miniature retirée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4 shadow-sm">
      <div>
        <h2 className="font-semibold">Miniature du cours</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Uploadez une image — elle sera enregistrée sur Supabase et visible sur l&apos;accueil et la page du cours.
        </p>
      </div>

      <CourseThumbnailBanner
        thumbnail={{ gradient, label, imageUrl }}
        slug={slug}
        className="rounded-xl border border-border overflow-hidden max-w-md"
        showLabel={false}
        showIcon={!imageUrl}
      />

      <div className="space-y-2 max-w-md">
        <Label htmlFor="thumb-upload">Image</Label>
        <input
          ref={inputRef}
          id="thumb-upload"
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={uploading || removing}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="hero"
            size="sm"
            disabled={uploading || removing}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : imageUrl ? (
              <Upload className="h-4 w-4 mr-2" />
            ) : (
              <ImagePlus className="h-4 w-4 mr-2" />
            )}
            {uploading ? "Envoi..." : imageUrl ? "Changer l'image" : "Upload image"}
          </Button>
          {imageUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || removing}
              onClick={() => void handleRemove()}
            >
              {removing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Retirer
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP ou GIF — max 5 Mo.</p>
      </div>
    </div>
  );
}
