import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminDeleteCourseResource,
  adminUpdateCourseResource,
  adminUploadCourseResource,
} from "@/lib/fns/admin";
import type { AdminCourse } from "@/lib/admin-courses";
import {
  inferResourceKind,
  resourceKindLabel,
  sortCourseResources,
  type CourseResource,
} from "@/lib/course-resources";

const ACCEPT =
  ".pdf,.doc,.docx,.epub,.xls,.xlsx,.csv,.txt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 25 * 1024 * 1024;

type AdminCourseResourcesEditorProps = {
  courseSlug: string;
  resources: CourseResource[];
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

function defaultTitleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function mimeFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".epub")) return "application/epub+zip";
  if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
  if (lower.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}

export function AdminCourseResourcesEditor({
  courseSlug,
  resources,
  onUpdated,
}: AdminCourseResourcesEditorProps) {
  const uploadFn = useServerFn(adminUploadCourseResource);
  const deleteFn = useServerFn(adminDeleteCourseResource);
  const updateFn = useServerFn(adminUpdateCourseResource);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [pendingTitle, setPendingTitle] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const sorted = sortCourseResources(resources);

  const handlePickFile = (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error("Fichier trop volumineux (max 25 Mo)");
      return;
    }
    setPendingFile(file);
    setPendingTitle(titleDraft.trim() || defaultTitleFromFileName(file.name));
  };

  const uploadResource = async () => {
    if (!pendingFile) {
      toast.error("Choisissez un fichier");
      return;
    }
    if (!pendingTitle.trim()) {
      toast.error("Titre requis");
      return;
    }

    setUploading(true);
    try {
      const dataBase64 = await readFileAsBase64(pendingFile);
      const result = await uploadFn({
        data: {
          courseSlug,
          title: pendingTitle.trim(),
          contentType: pendingFile.type || mimeFromFileName(pendingFile.name),
          dataBase64,
          fileName: pendingFile.name,
        },
      });
      onUpdated(result.courses);
      setPendingFile(null);
      setPendingTitle("");
      setTitleDraft("");
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Ressource ajoutée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setUploading(false);
    }
  };

  const deleteResource = async (resourceId: string, label: string) => {
    if (!window.confirm(`Supprimer « ${label} » ?`)) return;
    setDeletingId(resourceId);
    try {
      const result = await deleteFn({ data: { courseSlug, resourceId } });
      onUpdated(result.courses);
      toast.success("Ressource supprimée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setDeletingId(null);
    }
  };

  const renameResource = async (resourceId: string, title: string) => {
    if (!title.trim()) {
      toast.error("Titre requis");
      return;
    }
    setRenamingId(resourceId);
    try {
      const result = await updateFn({ data: { courseSlug, resourceId, title: title.trim() } });
      onUpdated(result.courses);
      toast.success("Titre mis à jour");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mise à jour impossible");
    } finally {
      setRenamingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-semibold">Ressources téléchargeables</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF, Word, ebook, Excel… visibles par les inscrits dans l&apos;onglet Ressources du lecteur.
        </p>
      </div>

      {sorted.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {sorted.map((resource) => (
            <li key={resource.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  defaultValue={resource.title}
                  onBlur={(event) => {
                    const next = event.target.value.trim();
                    if (next && next !== resource.title) {
                      void renameResource(resource.id, next);
                    }
                  }}
                  disabled={renamingId === resource.id}
                  className="rounded-lg"
                />
                <p className="text-xs text-muted-foreground">
                  {resourceKindLabel(inferResourceKind(resource.contentType, resource.fileName))} ·{" "}
                  {resource.fileName}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={resource.fileUrl} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={deletingId === resource.id}
                  onClick={() => deleteResource(resource.id, resource.title)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune ressource pour ce cours.
        </p>
      )}

      <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
        <p className="text-sm font-semibold">Ajouter un fichier</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`resource-title-${courseSlug}`}>Titre affiché</Label>
            <Input
              id={`resource-title-${courseSlug}`}
              value={pendingFile ? pendingTitle : titleDraft}
              onChange={(event) => {
                if (pendingFile) setPendingTitle(event.target.value);
                else setTitleDraft(event.target.value);
              }}
              placeholder="Ex. Guide PDF du module"
              className="rounded-lg"
            />
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handlePickFile(file);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Choisir un fichier
          </Button>
          {pendingFile ? (
            <span className="self-center text-sm text-muted-foreground">{pendingFile.name}</span>
          ) : null}
          <Button type="button" size="sm" disabled={uploading || !pendingFile} onClick={() => uploadResource()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {uploading ? "Envoi…" : "Publier la ressource"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">PDF, Word, EPUB, Excel, TXT, CSV, ZIP — max 25 Mo.</p>
      </div>
    </div>
  );
}
