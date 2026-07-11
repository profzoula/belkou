import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  ADMIN_COOKIE_NAME,
  getAdminFromRequestSources,
} from "@/lib/admin-auth";
import type { VideoRecord } from "@/lib/videos";

async function requireAdmin(): Promise<void> {
  const { getServerEnvResolved } = await import("@/server/env");
  const env = await getServerEnvResolved();
  if (!env.ADMIN_PASSWORD) {
    throw new Error("Admin non configuré");
  }
  const admin = await getAdminFromRequestSources(
    {
      cookieHeader: getRequestHeader("cookie") ?? null,
      cookieValue: getCookie(ADMIN_COOKIE_NAME) ?? null,
      authorization: getRequestHeader("authorization") ?? null,
      adminToken: getRequestHeader("x-admin-token") ?? null,
    },
    env.ADMIN_PASSWORD,
  );
  if (!admin) {
    throw new Error("Non autorisé");
  }
}

export const adminListVideos = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { listVideoRecords } = await import("@/server/videos");
  const videos = await listVideoRecords();
  return { videos };
});

export const adminUploadVideo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().min(1),
        contentType: z.string().min(1),
        dataBase64: z.string().min(1),
        fileName: z.string().min(1),
        courseSlug: z.string().optional(),
        lessonId: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { createVideoRecord, listVideoRecords, updateVideoRecord } = await import("@/server/videos");
    const { uploadSourceVideo } = await import("@/server/video-storage");

    const created = await createVideoRecord({
      title: data.title,
      filename: data.fileName,
      originalSize: Math.ceil((data.dataBase64.length * 3) / 4),
      storagePath: "",
      courseSlug: data.courseSlug,
      lessonId: data.lessonId,
    });
    if (!created.ok) {
      throw new Error(created.reason);
    }

    const uploaded = await uploadSourceVideo({
      videoId: created.video.id,
      contentType: data.contentType,
      dataBase64: data.dataBase64,
      fileName: data.fileName,
    });
    if (!uploaded.ok) {
      await updateVideoRecord(created.video.id, {
        status: "failed",
        errorMessage: uploaded.reason,
      });
      throw new Error(uploaded.reason);
    }

    await updateVideoRecord(created.video.id, {
      status: "queued",
      storagePath: uploaded.storagePath,
      errorMessage: null,
    });

    const videos = await listVideoRecords();
    const video = videos.find((item) => item.id === created.video.id) ?? created.video;
    return { ok: true as const, video };
  });

export type AdminVideosResponse = { videos: VideoRecord[] };

export const adminDeleteVideo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ videoId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { deleteVideoRecord, getVideoRecord } = await import("@/server/videos");
    const { deleteVideoStorageFiles } = await import("@/server/video-storage");

    const video = await getVideoRecord(data.videoId);
    if (!video) {
      throw new Error("Vidéo introuvable");
    }

    const storageResult = await deleteVideoStorageFiles(video);
    if (!storageResult.ok) {
      throw new Error(storageResult.reason);
    }

    const deleted = await deleteVideoRecord(data.videoId);
    if (!deleted.ok) {
      throw new Error(deleted.reason);
    }

    return { ok: true as const };
  });

export const getLessonVideoPlayback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1),
        lessonId: z.string().min(1),
        videoId: z.string().uuid(),
        preview: z.boolean().optional(),
        accessToken: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { getResolvedCourseBySlug } = await import("@/server/site-content");
    const { getLessonById, getLessonVideoId } = await import("@/lib/courses");
    const { hasPaidAccessToCourse, pickRegistrationForCourse } = await import("@/lib/course-access");
    const { getUserFromAccessToken } = await import("@/server/supabase-auth");
    const { listRegistrationsByEmail } = await import("@/server/db");
    const { normalizeRegistrationEmail } = await import("@/lib/schemas/registration");
    const { getDb } = await import("@/server/env");
    const { getVideoRecord } = await import("@/server/videos");
    const { resolveVideoPlayback } = await import("@/server/video-storage");

    const course = await getResolvedCourseBySlug(data.courseSlug);
    if (!course) throw new Error("Cours introuvable");

    const lesson = getLessonById(course, data.lessonId);
    if (!lesson || lesson.type !== "video") throw new Error("Leçon introuvable");

    const lessonVideoId = getLessonVideoId(lesson);
    if (!lessonVideoId || lessonVideoId !== data.videoId) {
      throw new Error("Vidéo non autorisée pour cette leçon");
    }

    if (!data.preview) {
      const token = data.accessToken?.trim();
      if (!token) throw new Error("Connexion requise");

      const user = await getUserFromAccessToken(token);
      if (!user?.email) throw new Error("Connexion requise");

      const db = await getDb();
      const email = normalizeRegistrationEmail(user.email);
      const rows = await listRegistrationsByEmail(db, email);
      const registration = pickRegistrationForCourse(rows, data.courseSlug);
      if (!hasPaidAccessToCourse(registration, data.courseSlug)) {
        throw new Error("Accès non autorisé");
      }
    } else if (!lesson.preview) {
      throw new Error("Preview non disponible");
    }

    const video = await getVideoRecord(data.videoId);
    if (!video) throw new Error("Vidéo introuvable");

    const resolved = await resolveVideoPlayback(video);
    if (!resolved.ok) throw new Error(resolved.reason);

    return resolved.playback;
  });
