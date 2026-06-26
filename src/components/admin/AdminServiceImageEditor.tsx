import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminRemoveServiceImage, adminUploadServiceImage } from "@/lib/fns/admin";
import { getServiceIcon, type StoredService } from "@/lib/service-storage";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

type AdminServiceImageEditorProps = {
  slug: string;
  imageUrl?: string;
  gradient: string;
  iconKey: StoredService["iconKey"];
  onUpdated: (services: StoredService[]) => void;
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

export function AdminServiceImageEditor({
  slug,
  imageUrl,
  gradient,
  iconKey,
  onUpdated,
}: AdminServiceImageEditorProps) {
  const uploadFn = useServerFn(adminUploadServiceImage);
  const removeFn = useServerFn(adminRemoveServiceImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const Icon = getServiceIcon(iconKey);

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
          serviceSlug: slug,
          contentType: file.type,
          dataBase64,
        },
      });
      onUpdated(result.services);
      toast.success("Image enregistrée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!imageUrl) return;
    if (!window.confirm("Retirer l'image de ce service ?")) return;

    setRemoving(true);
    try {
      const result = await removeFn({ data: { slug } });
      onUpdated(result.services);
      toast.success("Image retirée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border">
        <div className={cn("relative aspect-[16/10] bg-gradient-to-br", gradient)}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="h-16 w-16 text-white/25" aria-hidden />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`service-image-${slug}`}>Image du service</Label>
        <input
          ref={inputRef}
          id={`service-image-${slug}`}
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
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : imageUrl ? (
              <Upload className="h-4 w-4" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploading ? "Envoi…" : imageUrl ? "Changer l'image" : "Upload image"}
          </Button>
          {imageUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || removing}
              onClick={() => void handleRemove()}
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Retirer
            </Button>
          ) : null}
        </div>
        <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP ou GIF — max 5 Mo.</p>
      </div>
    </div>
  );
}
