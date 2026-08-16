import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, ImagePlus, Loader2, Radio, Square, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
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
import { Textarea } from "@/components/ui/textarea";
import type { AdminCourse } from "@/lib/admin-courses";
import { getAdminCourses } from "@/lib/fns/admin";
import {
  adminCancelLiveSession,
  adminCreateLiveSession,
  adminEndLiveSession,
  adminListLiveSessions,
  adminRemoveLiveThumbnail,
  adminStartLiveSession,
  adminUploadLiveThumbnail,
} from "@/lib/fns/live";
import {
  detectLiveProvider,
  formatLiveSchedule,
  liveProviderLabel,
  liveStatusLabel,
  type LiveProvider,
  type LiveSession,
} from "@/lib/live";
import { cn } from "@/lib/utils";

const THUMB_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const THUMB_MAX_BYTES = 5 * 1024 * 1024;

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

function defaultScheduleValue() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function statusClass(status: LiveSession["status"]) {
  if (status === "live") return "bg-red-500/15 text-red-600 dark:text-red-400";
  if (status === "ended") return "bg-success/15 text-success";
  if (status === "canceled") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary";
}

export function AdminLiveTab() {
  const listFn = useServerFn(adminListLiveSessions);
  const createFn = useServerFn(adminCreateLiveSession);
  const startFn = useServerFn(adminStartLiveSession);
  const endFn = useServerFn(adminEndLiveSession);
  const cancelFn = useServerFn(adminCancelLiveSession);
  const uploadThumbFn = useServerFn(adminUploadLiveThumbnail);
  const removeThumbFn = useServerFn(adminRemoveLiveThumbnail);
  const coursesFn = useServerFn(getAdminCourses);

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleValue);
  const [provider, setProvider] = useState<LiveProvider>("youtube");
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listFn(), coursesFn()])
      .then(([live, catalog]) => {
        if (cancelled) return;
        setSessions(live.sessions);
        setCourses(catalog.courses);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Chargement impossible");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coursesFn, listFn]);

  const detected = useMemo(() => detectLiveProvider(playbackUrl), [playbackUrl]);

  const create = async () => {
    if (!title.trim() || !playbackUrl.trim()) {
      toast.error("Titre et lien de diffusion sont requis.");
      return;
    }
    setSaving(true);
    try {
      let thumbnailBase64: string | undefined;
      if (thumbFile) {
        thumbnailBase64 = await readFileAsBase64(thumbFile);
      }
      const result = await createFn({
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          provider,
          playbackUrl: playbackUrl.trim(),
          scheduledAt: new Date(scheduledAt).toISOString(),
          ...(thumbFile && thumbnailBase64
            ? { thumbnailContentType: thumbFile.type, thumbnailBase64 }
            : {}),
        },
      });
      setSessions(result.sessions);
      setTitle("");
      setDescription("");
      setPlaybackUrl("");
      setScheduledAt(defaultScheduleValue());
      setThumbFile(null);
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
      setThumbPreview(null);
      if (thumbInputRef.current) thumbInputRef.current.value = "";
      toast.success("Live programmé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Programmation impossible");
    } finally {
      setSaving(false);
    }
  };

  const pickCreateThumb = (file: File) => {
    if (!THUMB_ACCEPT.split(",").includes(file.type)) {
      toast.error("Format non supporté (JPG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > THUMB_MAX_BYTES) {
      toast.error("Image trop volumineuse (max 5 Mo)");
      return;
    }
    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const uploadSessionThumb = async (sessionId: string, file: File) => {
    if (!THUMB_ACCEPT.split(",").includes(file.type)) {
      toast.error("Format non supporté (JPG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > THUMB_MAX_BYTES) {
      toast.error("Image trop volumineuse (max 5 Mo)");
      return;
    }
    setActingId(sessionId);
    try {
      const dataBase64 = await readFileAsBase64(file);
      const result = await uploadThumbFn({
        data: { sessionId, contentType: file.type, dataBase64 },
      });
      setSessions(result.sessions);
      toast.success("Thumbnail du live enregistrée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setActingId(null);
    }
  };

  const removeSessionThumb = async (sessionId: string) => {
    setActingId(sessionId);
    try {
      const result = await removeThumbFn({ data: { sessionId } });
      setSessions(result.sessions);
      toast.success("Thumbnail retirée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setActingId(null);
    }
  };

  const runAction = async (id: string, action: "start" | "end" | "cancel") => {
    setActingId(id);
    try {
      const result =
        action === "start"
          ? await startFn({ data: { sessionId: id } })
          : action === "end"
            ? await endFn({ data: { sessionId: id } })
            : await cancelFn({ data: { sessionId: id } });
      setSessions(result.sessions);
      toast.success(
        action === "start"
          ? "Live démarré — les étudiants voient le player"
          : action === "end"
            ? "Live terminé — replay disponible sur /live"
            : "Live annulé",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Live"
        description="Programmez un direct OBS. Les étudiants regardent et commentent sur BelKou. À la fin, le replay reste sur la page live."
      />

      <section className="rounded-[20px] border border-border/80 bg-card p-5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <CalendarClock className="size-4 text-primary" aria-hidden />
          Programmer un live
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dans OBS : YouTube Live (non répertorié) ou Vimeo Live. Collez ensuite le lien public de
          la diffusion ici — le live se joue sur le site, pas sur YouTube.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="live-when">Date et heure</Label>
            <Input
              id="live-when"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="live-title">Titre du live</Label>
            <Input
              id="live-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Session live — Q&A Dropshipping"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="live-thumb">Thumbnail du live</Label>
            <p className="text-xs text-muted-foreground">
              Image 16:9 affichée sur /live et dans le player tant que le direct n&apos;a pas
              commencé.
            </p>
            <CourseThumbnailBanner
              thumbnail={{
                gradient: "from-primary/80 to-primary",
                label: "LIVE",
                imageUrl: thumbPreview || undefined,
              }}
              slug="live"
              aspectClass="aspect-video max-w-md"
              className="overflow-hidden rounded-xl border border-border"
              showLabel={false}
              showIcon={!thumbPreview}
            />
            <input
              ref={thumbInputRef}
              id="live-thumb"
              type="file"
              accept={THUMB_ACCEPT}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) pickCreateThumb(file);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => thumbInputRef.current?.click()}
              >
                <ImagePlus className="size-4" aria-hidden />
                {thumbFile ? "Changer l'image" : "Choisir une image"}
              </Button>
              {thumbFile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
                    setThumbFile(null);
                    setThumbPreview(null);
                    if (thumbInputRef.current) thumbInputRef.current.value = "";
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Retirer
                </Button>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP ou GIF — max 5 Mo.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Source OBS</Label>
            <Select
              value={provider}
              onValueChange={(value) => setProvider(value as LiveProvider)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube Live (recommandé)</SelectItem>
                <SelectItem value="vimeo">Vimeo Live</SelectItem>
                <SelectItem value="hls">HLS (.m3u8 Mux / Cloudflare)</SelectItem>
              </SelectContent>
            </Select>
            {playbackUrl && detected !== provider ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Le lien ressemble à {liveProviderLabel(detected)}.
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="live-url">Lien de diffusion</Label>
            <Input
              id="live-url"
              value={playbackUrl}
              onChange={(event) => setPlaybackUrl(event.target.value)}
              placeholder="https://youtube.com/live/…"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="live-desc">Description (optionnel)</Label>
            <Textarea
              id="live-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="rounded-xl"
            />
          </div>
        </div>

        <Button className="mt-5 rounded-xl" onClick={() => void create()} disabled={saving || loading}>
          {saving ? "Enregistrement…" : "Programmer le live"}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Programmation</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : sessions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Aucun live pour l’instant.
          </p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="rounded-2xl border border-border bg-card p-4 sm:flex sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="flex min-w-0 gap-3">
                  <AdminLiveSessionThumb
                    session={session}
                    course={courses.find((course) => course.slug === session.courseSlug)}
                    busy={actingId === session.id}
                    onPick={(file) => void uploadSessionThumb(session.id, file)}
                    onRemove={() => void removeSessionThumb(session.id)}
                  />
                  <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                        statusClass(session.status),
                      )}
                    >
                      {liveStatusLabel(session.status)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {liveProviderLabel(session.provider)}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-foreground">{session.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {session.courseTitle
                      ? `${session.courseTitle} · ${formatLiveSchedule(session.scheduledAt)}`
                      : formatLiveSchedule(session.scheduledAt)}
                  </p>
                  {session.recordingLessonId ? (
                    <p className="mt-1 text-xs text-success">Replay ajouté au programme du cours.</p>
                  ) : session.status === "ended" ? (
                    <p className="mt-1 text-xs text-success">Replay disponible sur /live.</p>
                  ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
                  {session.status === "scheduled" || session.status === "live" ? (
                    session.status === "scheduled" ? (
                      <Button
                        size="sm"
                        className="rounded-xl"
                        disabled={actingId === session.id}
                        onClick={() => void runAction(session.id, "start")}
                      >
                        <Radio className="size-3.5" aria-hidden />
                        Démarrer
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-xl"
                        disabled={actingId === session.id}
                        onClick={() => void runAction(session.id, "end")}
                      >
                        <Square className="size-3.5" aria-hidden />
                        Terminer + record
                      </Button>
                    )
                  ) : null}
                  {session.status === "scheduled" || session.status === "live" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      disabled={actingId === session.id}
                      onClick={() => void runAction(session.id, "cancel")}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Annuler
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AdminLiveSessionThumb({
  session,
  course,
  busy,
  onPick,
  onRemove,
}: {
  session: LiveSession;
  course?: AdminCourse;
  busy: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageUrl = session.thumbnailUrl || course?.thumbnail.imageUrl;

  return (
    <div className="w-28 shrink-0 sm:w-32">
      <CourseThumbnailBanner
        thumbnail={{
          gradient: course?.thumbnail.gradient ?? "from-primary/80 to-primary",
          label: course?.thumbnail.label ?? "LIVE",
          imageUrl,
        }}
        slug={session.courseSlug}
        aspectClass="aspect-video"
        className="overflow-hidden rounded-lg border border-border"
        showLabel={false}
        showIcon={!imageUrl}
      />
      <input
        ref={inputRef}
        type="file"
        accept={THUMB_ACCEPT}
        className="hidden"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.currentTarget.value = "";
        }}
      />
      <div className="mt-1.5 flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 rounded-lg px-2 text-[11px]"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-3 animate-spin" aria-hidden /> : <Upload className="size-3" aria-hidden />}
          {session.thumbnailUrl ? "Changer" : "Image"}
        </Button>
        {session.thumbnailUrl ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 rounded-lg px-2 text-[11px]"
            disabled={busy}
            onClick={onRemove}
          >
            <Trash2 className="size-3" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
