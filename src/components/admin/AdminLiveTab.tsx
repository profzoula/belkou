import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  CalendarClock,
  ImagePlus,
  Loader2,
  Radio,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
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
  adminRemoveLiveRecording,
  adminRemoveLiveThumbnail,
  adminSendLiveReminder,
  adminSetLiveRecording,
  adminSetLiveSessionPrice,
  adminSetLiveSessionSchedule,
  adminStartLiveSession,
  adminUploadLiveThumbnail,
} from "@/lib/fns/live";
import { toDatetimeLocalValue } from "@/lib/course-publish";
import {
  LIVE_TICKET_PRICE_USD,
  detectLiveProvider,
  formatLivePrice,
  formatLiveSchedule,
  liveProviderLabel,
  liveStatusLabel,
  resolveLivePrice,
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

/** `null` means "keep the default price"; `"invalid"` blocks the submit. */
function parsePriceInput(raw: string): number | null | "invalid" {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return "invalid";
  return Math.round(value * 100) / 100;
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
  const setPriceFn = useServerFn(adminSetLiveSessionPrice);
  const setScheduleFn = useServerFn(adminSetLiveSessionSchedule);
  const setRecordingFn = useServerFn(adminSetLiveRecording);
  const removeRecordingFn = useServerFn(adminRemoveLiveRecording);
  const reminderFn = useServerFn(adminSendLiveReminder);
  const coursesFn = useServerFn(getAdminCourses);

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
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
    const parsedPrice = parsePriceInput(price);
    if (parsedPrice === "invalid") {
      toast.error("Prix invalide — entrez un montant en dollars (ex. 9.99).");
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
          ...(parsedPrice == null ? {} : { priceUsd: parsedPrice }),
          ...(thumbFile && thumbnailBase64
            ? { thumbnailContentType: thumbFile.type, thumbnailBase64 }
            : {}),
        },
      });
      setSessions(result.sessions);
      setTitle("");
      setPrice("");
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

  const saveSchedule = async (sessionId: string, scheduledAt: string) => {
    setActingId(sessionId);
    try {
      const result = await setScheduleFn({ data: { sessionId, scheduledAt } });
      setSessions(result.sessions);
      toast.success("Date du live mise à jour");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Date non enregistrée");
    } finally {
      setActingId(null);
    }
  };

  const savePrice = async (sessionId: string, priceUsd: number) => {
    setActingId(sessionId);
    try {
      const result = await setPriceFn({ data: { sessionId, priceUsd } });
      setSessions(result.sessions);
      toast.success(`Prix mis à jour — ${formatLivePrice(priceUsd)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Prix non enregistré");
    } finally {
      setActingId(null);
    }
  };

  const sendReminder = async (session: LiveSession) => {
    const note = window.prompt(
      `Rappel pour « ${session.title} » — message à ajouter (optionnel) :`,
      "",
    );
    // `null` means the admin closed the prompt, so nothing is sent.
    if (note === null) return;

    setActingId(session.id);
    try {
      const result = await reminderFn({
        data: { sessionId: session.id, ...(note.trim() ? { note: note.trim() } : {}) },
      });
      toast.success(
        result.failed > 0
          ? `Rappel envoyé à ${result.sent}/${result.recipients} — ${result.failed} échec(s)`
          : `Rappel envoyé à ${result.sent} personne${result.sent > 1 ? "s" : ""}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rappel non envoyé");
    } finally {
      setActingId(null);
    }
  };

  const saveRecording = async (sessionId: string, recordingUrl: string) => {
    setActingId(sessionId);
    try {
      const result = await setRecordingFn({ data: { sessionId, recordingUrl } });
      setSessions(result.sessions);
      toast.success("Replay publié — visible sur /live");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Replay non enregistré");
    } finally {
      setActingId(null);
    }
  };

  const removeRecording = async (session: LiveSession) => {
    const confirmed = window.confirm(
      `Retirer le replay de « ${session.title} » ?\n\nL'événement disparaît de la page Live. Les places vendues et les commentaires sont conservés, et vous pourrez publier un nouveau lien plus tard.`,
    );
    if (!confirmed) return;

    setActingId(session.id);
    try {
      const result = await removeRecordingFn({ data: { sessionId: session.id } });
      setSessions(result.sessions);
      toast.success("Replay retiré");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setActingId(null);
    }
  };

  const endSession = async (session: LiveSession) => {
    const recordingUrl = window.prompt(
      `Terminer « ${session.title} ».\n\nLien du replay (optionnel) — YouTube, Vimeo ou .m3u8.\nLaissez vide si vous publierez le replay plus tard.`,
      "",
    );
    // `null` means the admin closed the prompt, so the live keeps running.
    if (recordingUrl === null) return;

    setActingId(session.id);
    try {
      const result = await endFn({
        data: {
          sessionId: session.id,
          ...(recordingUrl.trim() ? { recordingUrl: recordingUrl.trim() } : {}),
        },
      });
      setSessions(result.sessions);
      toast.success(
        recordingUrl.trim()
          ? "Live terminé — replay publié sur /live"
          : "Live terminé — publiez le lien du replay quand vous l'aurez",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setActingId(null);
    }
  };

  const runAction = async (id: string, action: "start" | "cancel") => {
    setActingId(id);
    try {
      const result =
        action === "start"
          ? await startFn({ data: { sessionId: id } })
          : await cancelFn({ data: { sessionId: id } });
      setSessions(result.sessions);
      toast.success(
        action === "start" ? "Live démarré — les étudiants voient le player" : "Live annulé",
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
            <Label htmlFor="live-price">Prix de l&apos;événement (USD)</Label>
            <Input
              id="live-price"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder={String(LIVE_TICKET_PRICE_USD)}
              className="rounded-xl sm:max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Chaque live se paie séparément. Laissez vide pour {formatLivePrice(null)}, ou mettez 0
              pour un live gratuit — accessible sans compte. Les membres VIP entrent sans payer
              sur les lives payants.
            </p>
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
            <Select value={provider} onValueChange={(value) => setProvider(value as LiveProvider)}>
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

        <Button
          className="mt-5 rounded-xl"
          onClick={() => void create()}
          disabled={saving || loading}
        >
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
                      <p className="mt-1 text-xs text-success">
                        Replay ajouté au programme du cours.
                      </p>
                    ) : null}
                    {session.status === "scheduled" || session.status === "live" ? (
                      <AdminLiveScheduleField
                        session={session}
                        busy={actingId === session.id}
                        onSave={(scheduledAt) => saveSchedule(session.id, scheduledAt)}
                      />
                    ) : null}
                    <AdminLivePriceField
                      session={session}
                      busy={actingId === session.id}
                      onSave={(priceUsd) => savePrice(session.id, priceUsd)}
                    />
                    {session.status === "ended" ? (
                      <AdminLiveRecordingField
                        session={session}
                        busy={actingId === session.id}
                        onSave={(recordingUrl) => saveRecording(session.id, recordingUrl)}
                        onRemove={() => void removeRecording(session)}
                      />
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
                        onClick={() => void endSession(session)}
                      >
                        <Square className="size-3.5" aria-hidden />
                        Terminer
                      </Button>
                    )
                  ) : null}
                  {session.status === "scheduled" || session.status === "live" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={actingId === session.id}
                        onClick={() => void sendReminder(session)}
                        title="Envoyer un e-mail à toutes les personnes qui ont réservé"
                      >
                        <Bell className="size-3.5" aria-hidden />
                        Rappel
                      </Button>
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
                    </>
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

function AdminLiveScheduleField({
  session,
  busy,
  onSave,
}: {
  session: LiveSession;
  busy: boolean;
  onSave: (scheduledAt: string) => void;
}) {
  const saved = toDatetimeLocalValue(session.scheduledAt);
  const [value, setValue] = useState(saved);

  useEffect(() => {
    setValue(toDatetimeLocalValue(session.scheduledAt));
  }, [session.scheduledAt]);

  const parsed = new Date(value);
  const dirty = value !== saved && !Number.isNaN(parsed.getTime());

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Label htmlFor={`live-when-${session.id}`} className="text-xs text-muted-foreground">
        Date
      </Label>
      <Input
        id={`live-when-${session.id}`}
        type="datetime-local"
        value={value}
        disabled={busy}
        onChange={(event) => setValue(event.target.value)}
        className="h-8 w-[13.5rem] rounded-lg text-xs"
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 rounded-lg px-2.5 text-[11px]"
        disabled={busy || !dirty}
        onClick={() => onSave(parsed.toISOString())}
      >
        Enregistrer
      </Button>
    </div>
  );
}

function AdminLivePriceField({
  session,
  busy,
  onSave,
}: {
  session: LiveSession;
  busy: boolean;
  onSave: (priceUsd: number) => void;
}) {
  const saved = resolveLivePrice(session.priceUsd);
  const [value, setValue] = useState(String(saved));

  useEffect(() => {
    setValue(String(resolveLivePrice(session.priceUsd)));
  }, [session.priceUsd]);

  const parsed = parsePriceInput(value);
  const dirty = parsed !== "invalid" && parsed != null && parsed !== saved;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Label htmlFor={`live-price-${session.id}`} className="text-xs text-muted-foreground">
        Prix
      </Label>
      <div className="flex items-center gap-1">
        <Input
          id={`live-price-${session.id}`}
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={busy}
          className="h-8 w-24 rounded-lg"
        />
        <span className="text-xs text-muted-foreground">USD</span>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 rounded-lg px-2.5 text-[11px]"
        disabled={busy || !dirty}
        onClick={() => {
          if (parsed === "invalid" || parsed == null) return;
          onSave(parsed);
        }}
      >
        Enregistrer
      </Button>
      {session.priceUsd == null ? (
        <span className="text-[11px] text-muted-foreground">
          Prix par défaut ({formatLivePrice(LIVE_TICKET_PRICE_USD)})
        </span>
      ) : saved <= 0 ? (
        <span className="text-[11px] font-medium text-success">
          Live gratuit — accessible sans compte
        </span>
      ) : null}
    </div>
  );
}

function AdminLiveRecordingField({
  session,
  busy,
  onSave,
  onRemove,
}: {
  session: LiveSession;
  busy: boolean;
  onSave: (recordingUrl: string) => void;
  onRemove: () => void;
}) {
  const saved = session.recordingUrl?.trim() ?? "";
  const [value, setValue] = useState(saved);

  useEffect(() => {
    setValue(session.recordingUrl?.trim() ?? "");
  }, [session.recordingUrl]);

  const trimmed = value.trim();
  const dirty = trimmed.length >= 8 && trimmed !== saved;

  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-border/70 bg-muted/30 p-2.5">
      <Label htmlFor={`live-replay-${session.id}`} className="text-xs text-muted-foreground">
        Lien du replay
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={`live-replay-${session.id}`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={busy}
          placeholder="https://vimeo.com/123456789"
          className="h-8 min-w-0 flex-1 rounded-lg text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-lg px-2.5 text-[11px]"
          disabled={busy || !dirty}
          onClick={() => onSave(trimmed)}
        >
          Publier
        </Button>
        {saved ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-lg px-2.5 text-[11px]"
            disabled={busy}
            onClick={onRemove}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Retirer
          </Button>
        ) : null}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {saved
          ? "Replay en ligne sur /live."
          : "Aucun replay — l'événement n'apparaît pas sur /live tant que ce lien est vide."}
      </p>
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
          {busy ? (
            <Loader2 className="size-3 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-3" aria-hidden />
          )}
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
