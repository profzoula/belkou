import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { VideoUploadProgressBar } from "@/components/admin/VideoUploadProgressBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defaultVideoTitleFromFileName,
  formatVideoUploadMaxLabel,
  getVideoUploadLimitHint,
  uploadVideoToSignedStorage,
  VIDEO_UPLOAD_ACCEPT,
  VIDEO_UPLOAD_MAX_BYTES,
} from "@/lib/admin-video-upload";
import { adminFinalizeVideoUpload, adminUploadVideo } from "@/lib/fns/videos";
import { formatVideoSize, type VideoRecord } from "@/lib/videos";

type LessonVideoUploadProps = {
  courseSlug?: string;
  lessonId?: string;
  defaultTitle?: string;
  disabled?: boolean;
  onUploaded: (video: VideoRecord) => void;
};

export function LessonVideoUpload({
  courseSlug,
  lessonId,
  defaultTitle = "",
  disabled = false,
  onUploaded,
}: LessonVideoUploadProps) {
  const uploadFn = useServerFn(adminUploadVideo);
  const finalizeFn = useServerFn(adminFinalizeVideoUpload);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const upload = async () => {
    if (!selectedFile) {
      toast.error("Sélectionnez un fichier MP4 ou MOV");
      return;
    }
    if (selectedFile.size > VIDEO_UPLOAD_MAX_BYTES) {
      toast.error(`Fichier trop volumineux (max ${formatVideoUploadMaxLabel()})`);
      return;
    }

    const title = (defaultTitle || defaultVideoTitleFromFileName(selectedFile.name)).trim();
    if (!title) {
      toast.error("Titre de leçon requis avant l'upload");
      return;
    }

    setUploading(true);
    setUploadPhase("Préparation de l'upload…");
    setUploadPercent(3);
    try {
      const prepared = await uploadFn({
        data: {
          title,
          contentType: selectedFile.type || "video/mp4",
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          courseSlug,
          lessonId,
        },
      });

      setUploadPhase("Envoi du fichier vers Supabase…");
      setUploadPercent(8);

      await uploadVideoToSignedStorage(
        selectedFile,
        {
          videoId: prepared.video.id,
          signedUrl: prepared.signedUrl,
          token: prepared.token,
          storagePath: prepared.storagePath,
        },
        (filePercent) => {
          setUploadPercent(8 + Math.round(filePercent * 0.84));
        },
      );

      setUploadPhase("Finalisation…");
      setUploadPercent(95);

      const result = await finalizeFn({
        data: {
          videoId: prepared.video.id,
          storagePath: prepared.storagePath,
        },
      });

      setUploadPercent(100);
      setUploadPhase("Terminé");

      onUploaded(result.video);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setUploading(false);
      setUploadPhase(null);
      setUploadPercent(0);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-3 space-y-2">
      <Label className="text-xs text-muted-foreground">Uploader une vidéo pour cette leçon</Label>
      <p className="text-[11px] text-muted-foreground">{getVideoUploadLimitHint()}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          ref={fileRef}
          type="file"
          accept={VIDEO_UPLOAD_ACCEPT}
          disabled={disabled || uploading}
          className="rounded-lg"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          size="sm"
          className="rounded-lg shrink-0"
          disabled={disabled || uploading || !selectedFile}
          onClick={() => void upload()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? "Upload..." : "Uploader"}
        </Button>
      </div>
      {uploading && uploadPhase ? (
        <VideoUploadProgressBar
          phase={uploadPhase}
          percent={uploadPercent}
          fileName={selectedFile?.name}
        />
      ) : null}
      {selectedFile && !uploading ? (
        <p className="text-[11px] text-muted-foreground">
          {selectedFile.name} · {formatVideoSize(selectedFile.size)}
        </p>
      ) : null}
    </div>
  );
}
