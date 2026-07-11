import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Film, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAdminCourses } from "@/lib/fns/admin";
import { adminDeleteVideo, adminListVideos, adminUploadVideo } from "@/lib/fns/videos";
import type { AdminCourse } from "@/lib/admin-courses";
import {
  formatVideoDuration,
  formatVideoSize,
  formatVideoStatusLabel,
  type VideoRecord,
} from "@/lib/videos";

const ACCEPT = "video/mp4,video/quicktime,.mp4,.mov";
const MAX_BYTES = 2 * 1024 * 1024 * 1024;

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

function statusBadgeClass(status: VideoRecord["status"]): string {
  switch (status) {
    case "ready":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "processing":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function AdminVideosTab() {
  const listVideosFn = useServerFn(adminListVideos);
  const uploadFn = useServerFn(adminUploadVideo);
  const deleteFn = useServerFn(adminDeleteVideo);
  const listCoursesFn = useServerFn(getAdminCourses);
  const fileRef = useRef<HTMLInputElement>(null);

  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [courseSlug, setCourseSlug] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const selectedCourse = courses.find((course) => course.slug === courseSlug);
  const lessons = selectedCourse
    ? selectedCourse.sections.flatMap((section) => section.lessons.filter((lesson) => lesson.type === "video"))
    : [];

  const load = async () => {
    setLoading(true);
    try {
      const [videoResult, courseResult] = await Promise.all([
        listVideosFn(),
        listCoursesFn(),
      ]);
      setVideos(videoResult.videos);
      setCourses(courseResult.courses);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onFileChange = (file: File | null) => {
    setSelectedFile(file);
    if (file && !title.trim()) {
      setTitle(defaultTitleFromFileName(file.name));
    }
  };

  const upload = async () => {
    if (!selectedFile) {
      toast.error("Sélectionnez un fichier MP4");
      return;
    }
    if (!title.trim()) {
      toast.error("Titre requis");
      return;
    }
    if (selectedFile.size > MAX_BYTES) {
      toast.error("Fichier trop volumineux (max 2 Go)");
      return;
    }

    setUploading(true);
    try {
      const dataBase64 = await readFileAsBase64(selectedFile);
      const result = await uploadFn({
        data: {
          title: title.trim(),
          contentType: selectedFile.type || "video/mp4",
          dataBase64,
          fileName: selectedFile.name,
          courseSlug: courseSlug || undefined,
          lessonId: lessonId || undefined,
        },
      });
      toast.success("Vidéo uploadée — en file d'attente pour traitement HLS");
      setVideos((current) => [result.video, ...current.filter((item) => item.id !== result.video.id)]);
      setSelectedFile(null);
      setTitle("");
      setLessonId("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setUploading(false);
    }
  };

  const removeVideo = async (video: VideoRecord) => {
    if (
      !window.confirm(
        `Supprimer « ${video.title} » ?\n\nLe fichier MP4/HLS sera effacé. Les leçons liées devront être reliées à une autre vidéo.`,
      )
    ) {
      return;
    }

    setDeletingId(video.id);
    try {
      await deleteFn({ data: { videoId: video.id } });
      setVideos((current) => current.filter((item) => item.id !== video.id));
      toast.success("Vidéo supprimée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Vidéos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload MP4 — conversion HLS (1080/720/480) aktivite nan Sprint 2.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Upload vidéo</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="video-title">Titre</Label>
            <Input
              id="video-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Enstalasyon Editè Kod & Kont AI"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Cours (optionnel)</Label>
            <Select
              value={courseSlug || "__none__"}
              onValueChange={(value) => {
                const next = value === "__none__" ? "" : value;
                setCourseSlug(next);
                setLessonId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un cours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Aucun —</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.slug} value={course.slug}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Leçon (optionnel)</Label>
            <Select
              value={lessonId || "__none__"}
              onValueChange={(value) => setLessonId(value === "__none__" ? "" : value)}
              disabled={!courseSlug}
            >
              <SelectTrigger>
                <SelectValue placeholder={courseSlug ? "Choisir une leçon" : "Cours requis"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Aucune —</SelectItem>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="video-file">Fichier MP4</Label>
            <Input
              id="video-file"
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
            {selectedFile ? (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} · {formatVideoSize(selectedFile.size)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="button" variant="hero" disabled={uploading} onClick={() => void upload()}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Bibliothèque</h3>
          </div>
          <span className="text-xs text-muted-foreground">{videos.length} vidéo(s)</span>
        </div>

        {loading ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Chargement...</p>
        ) : videos.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Aucune vidéo uploadée.</p>
        ) : (
          <ul className="divide-y divide-border">
            {videos.map((video) => (
              <li key={video.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium">{video.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {video.filename} · {formatVideoSize(video.originalSize)}
                    {video.durationSeconds ? ` · ${formatVideoDuration(video.durationSeconds)}` : ""}
                  </p>
                  {video.courseSlug ? (
                    <p className="text-xs text-muted-foreground">
                      {video.courseSlug}
                      {video.lessonId ? ` · ${video.lessonId}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(video.status)}`}
                  >
                    {formatVideoStatusLabel(video.status)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={deletingId === video.id}
                    onClick={() => void removeVideo(video)}
                    aria-label={`Supprimer ${video.title}`}
                  >
                    {deletingId === video.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
