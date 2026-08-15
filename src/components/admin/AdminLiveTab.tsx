import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Radio, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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
  adminStartLiveSession,
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
  const coursesFn = useServerFn(getAdminCourses);

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const [courseSlug, setCourseSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleValue);
  const [provider, setProvider] = useState<LiveProvider>("youtube");

  useEffect(() => {
    let cancelled = false;
    Promise.all([listFn(), coursesFn()])
      .then(([live, catalog]) => {
        if (cancelled) return;
        setSessions(live.sessions);
        setCourses(catalog.courses);
        setCourseSlug((current) => current || catalog.courses[0]?.slug || "");
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
    if (!courseSlug || !title.trim() || !playbackUrl.trim()) {
      toast.error("Cours, titre et lien de diffusion sont requis.");
      return;
    }
    setSaving(true);
    try {
      const result = await createFn({
        data: {
          courseSlug,
          title: title.trim(),
          description: description.trim() || undefined,
          provider,
          playbackUrl: playbackUrl.trim(),
          scheduledAt: new Date(scheduledAt).toISOString(),
        },
      });
      setSessions(result.sessions);
      setTitle("");
      setDescription("");
      setPlaybackUrl("");
      setScheduledAt(defaultScheduleValue());
      toast.success("Live programmé");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Programmation impossible");
    } finally {
      setSaving(false);
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
            ? "Live terminé — replay ajouté au cours"
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
        title="Live cours"
        description="Programmez un direct OBS pour un cours. Les étudiants regardent et commentent sur BelKou. À la fin, un replay est enregistré dans le programme."
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
          <div className="space-y-1.5">
            <Label htmlFor="live-course">Cours</Label>
            <Select value={courseSlug} onValueChange={setCourseSlug}>
              <SelectTrigger id="live-course" className="rounded-xl">
                <SelectValue placeholder="Choisir un cours" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.slug} value={course.slug}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
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
                    {session.courseTitle} · {formatLiveSchedule(session.scheduledAt)}
                  </p>
                  {session.recordingLessonId ? (
                    <p className="mt-1 text-xs text-success">Replay ajouté au programme du cours.</p>
                  ) : null}
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
