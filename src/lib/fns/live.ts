import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  LIVE_PROVIDERS,
  LIVE_RECORDING_SECTION_TITLE,
  LIVE_TICKET_PRICE_USD,
  detectLiveProvider,
  type LiveCourseInfo,
  type LiveProvider,
  type PublicLiveListItem,
  type PublicLiveSession,
} from "@/lib/live";
import { isValidVimeoUrl } from "@/lib/vimeo";
import { isValidYoutubeUrl } from "@/lib/youtube";
import { checkRateLimit, RATE_LIMITS } from "@/server/rate-limit";

const providerSchema = z.enum(LIVE_PROVIDERS);

function validatePlaybackUrl(provider: LiveProvider, url: string) {
  const trimmed = url.trim();
  if (provider === "youtube" && !isValidYoutubeUrl(trimmed)) {
    throw new Error("URL YouTube invalide — collez le lien de la diffusion (youtube.com/live/… ou watch?v=).");
  }
  if (provider === "vimeo" && !isValidVimeoUrl(trimmed)) {
    throw new Error("URL Vimeo invalide — ex. https://vimeo.com/123456789");
  }
  if (provider === "hls" && !trimmed.includes(".m3u8") && !trimmed.startsWith("https://")) {
    throw new Error("URL HLS invalide — collez le lien .m3u8 HTTPS.");
  }
  return trimmed;
}

async function requireAdmin() {
  const { getCookie, getRequestHeader: header } = await import("@tanstack/react-start/server");
  const { ADMIN_COOKIE_NAME, getAdminFromRequestSources } = await import("@/lib/admin-auth");
  const { getServerEnvResolved } = await import("@/server/env");
  const env = await getServerEnvResolved();
  if (!env.ADMIN_PASSWORD) {
    throw new Error("Admin non configuré");
  }
  const admin = await getAdminFromRequestSources(
    {
      cookieHeader: header("cookie") ?? null,
      cookieValue: getCookie(ADMIN_COOKIE_NAME) ?? null,
      authorization: header("authorization") ?? null,
      adminToken: header("x-admin-token") ?? null,
    },
    env.ADMIN_PASSWORD,
  );
  if (!admin) {
    throw new Error("Non autorisé");
  }
}

function toLiveCourseInfo(
  slug: string,
  course: Awaited<ReturnType<typeof import("@/server/site-content").getResolvedCourseBySlug>>,
): LiveCourseInfo {
  if (!course) {
    return {
      slug,
      title: slug,
      instructor: "",
      price: 0,
      originalPrice: 0,
      studentsCount: 0,
      description: "",
      thumbnail: { gradient: "from-primary/80 to-primary", label: "LIVE" },
    };
  }
  return {
    slug: course.slug,
    title: course.title,
    instructor: course.instructor,
    price: course.price,
    originalPrice: course.originalPrice,
    studentsCount: course.studentsCount,
    description: course.description,
    thumbnail: {
      gradient: course.thumbnail.gradient,
      label: course.thumbnail.label,
      ...(course.thumbnail.imageUrl ? { imageUrl: course.thumbnail.imageUrl } : {}),
    },
  };
}

async function withCourseTitles<T extends { courseSlug: string; courseTitle: string }>(
  sessions: T[],
): Promise<T[]> {
  const { getResolvedCourseBySlug } = await import("@/server/site-content");
  return Promise.all(
    sessions.map(async (session) => {
      const course = await getResolvedCourseBySlug(session.courseSlug);
      return { ...session, courseTitle: course?.title ?? session.courseSlug };
    }),
  );
}

async function withPublicCourse<T extends { courseSlug: string; courseTitle: string }>(
  sessions: T[],
): Promise<(T & { courseTitle: string; course: LiveCourseInfo })[]> {
  const { getResolvedCourseBySlug } = await import("@/server/site-content");
  const { getDisplayedCourseStudentsCount } = await import("@/lib/courses");
  return Promise.all(
    sessions.map(async (session) => {
      const resolved = await getResolvedCourseBySlug(session.courseSlug);
      const course = toLiveCourseInfo(session.courseSlug, resolved);
      return {
        ...session,
        courseTitle: course.title,
        course: {
          ...course,
          studentsCount: getDisplayedCourseStudentsCount({
            studentsCount: course.studentsCount,
            slug: course.slug,
          }),
        },
      };
    }),
  );
}

async function resolveLiveAccess(
  courseSlug: string,
  accessToken?: string,
): Promise<{
  canWatch: boolean;
  canComment: boolean;
  hasCourseAccess: boolean;
  actorUserId?: string;
}> {
  const { getResolvedCourseBySlug } = await import("@/server/site-content");
  const { hasLiveAccessToCourse, hasPaidAccessToCourse, pickRegistrationForCourse } =
    await import("@/lib/course-access");
  const { isFreeCourse } = await import("@/lib/courses");
  const course = await getResolvedCourseBySlug(courseSlug);
  if (!course) {
    return { canWatch: false, canComment: false, hasCourseAccess: false };
  }

  const free = isFreeCourse(course);
  if (!accessToken?.trim()) {
    return { canWatch: free, canComment: false, hasCourseAccess: false };
  }

  const { getUserFromAccessToken } = await import("@/server/supabase-auth");
  const user = await getUserFromAccessToken(accessToken);
  if (!user?.email || !user.id) {
    return { canWatch: free, canComment: false, hasCourseAccess: false };
  }

  const { getDb } = await import("@/server/env");
  const { listRegistrationsByEmail } = await import("@/server/db");
  const { normalizeRegistrationEmail } = await import("@/lib/schemas/registration");
  const db = await getDb();
  const email = normalizeRegistrationEmail(user.email);
  const rows = await listRegistrationsByEmail(db, email);
  const registration = pickRegistrationForCourse(rows, courseSlug);
  const hasCourseAccess = hasPaidAccessToCourse(registration, courseSlug) || free;
  const canWatch = hasLiveAccessToCourse(registration, courseSlug) || free;

  return {
    canWatch,
    canComment: canWatch,
    hasCourseAccess,
    actorUserId: user.id,
  };
}

function toPublicSession(
  session: Awaited<ReturnType<typeof import("@/server/live").getLiveSession>> & {
    course: LiveCourseInfo;
  },
  access: { canWatch: boolean; canComment: boolean; hasCourseAccess: boolean },
): PublicLiveSession {
  if (!session) {
    throw new Error("Live introuvable.");
  }
  const canSeeStream =
    access.canWatch && (session.status === "live" || session.status === "ended");
  return {
    ...session,
    playbackUrl: canSeeStream
      ? session.status === "ended"
        ? (session.recordingUrl ?? session.playbackUrl)
        : session.playbackUrl
      : undefined,
    canWatch: access.canWatch,
    canComment: access.canComment && session.status === "live",
    hasCourseAccess: access.hasCourseAccess,
    liveTicketPrice: LIVE_TICKET_PRICE_USD,
    course: session.course,
  };
}

export const getPublicLiveSummary = createServerFn({ method: "GET" }).handler(async () => {
  const { listLiveSessions } = await import("@/server/live");
  const sessions = await listLiveSessions();
  const live = sessions.find((session) => session.status === "live") ?? null;
  const upcoming = sessions.filter((session) => session.status === "scheduled").length;
  return {
    liveCount: live ? 1 : 0,
    liveId: live?.id ?? null,
    upcomingCount: upcoming,
  };
});

export const listPublicLiveSessions = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicLiveListItem[]> => {
    const { listLiveSessions } = await import("@/server/live");
    const sessions = await withPublicCourse(await listLiveSessions());
    return sessions
      .filter((session) => session.status !== "canceled")
      .map((session) => ({
        id: session.id,
        courseSlug: session.courseSlug,
        courseTitle: session.courseTitle,
        title: session.title,
        description: session.description,
        status: session.status,
        provider: session.provider,
        scheduledAt: session.scheduledAt,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        recordingLessonId: session.recordingLessonId,
        thumbnailUrl: session.thumbnailUrl,
        course: session.course,
      }));
  },
);

export const getPublicLiveSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        accessToken: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { getLiveSession } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session || session.status === "canceled") {
      throw new Error("Live introuvable.");
    }
    const [withCourse] = await withPublicCourse([session]);
    const access = await resolveLiveAccess(session.courseSlug, data.accessToken);
    return toPublicSession(withCourse, access);
  });

export const listLiveComments = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        accessToken: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { getLiveSession, listLiveComments: listComments } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session || session.status === "canceled") {
      throw new Error("Live introuvable.");
    }
    const access = await resolveLiveAccess(session.courseSlug, data.accessToken);
    if (!access.canWatch && session.status === "live") {
      return { comments: [] as const };
    }
    const comments = await listComments(data.sessionId);
    return {
      comments: comments.map((comment) => ({
        ...comment,
        mine: Boolean(access.actorUserId && comment.authorUserId === access.actorUserId),
      })),
    };
  });

export const postLiveComment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        accessToken: z.string().min(1),
        body: z.string().trim().min(1).max(500),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? "local";
    if (!checkRateLimit(`live-comment:${ip}`, RATE_LIMITS.liveComment.limit, RATE_LIMITS.liveComment.windowMs)) {
      throw new Error("Trop de commentaires — patientez un instant.");
    }

    const { getLiveSession, createLiveComment } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session) throw new Error("Live introuvable.");
    if (session.status !== "live") {
      throw new Error("Les commentaires sont ouverts uniquement pendant le direct.");
    }

    const { getUserFromAccessToken } = await import("@/server/supabase-auth");
    const { displayNameFromUser } = await import("@/server/forum-access");
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email || !user.id) throw new Error("Connexion requise.");

    const access = await resolveLiveAccess(session.courseSlug, data.accessToken);
    if (!access.canComment) {
      throw new Error("Inscrivez-vous au cours pour commenter.");
    }

    const { normalizeRegistrationEmail } = await import("@/lib/schemas/registration");
    const comment = await createLiveComment({
      sessionId: data.sessionId,
      authorUserId: user.id,
      authorEmail: normalizeRegistrationEmail(user.email),
      authorName: displayNameFromUser(user),
      body: data.body,
    });
    return { comment: { ...comment, mine: true } };
  });

export const adminListLiveSessions = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { listLiveSessions } = await import("@/server/live");
  const sessions = await withCourseTitles(await listLiveSessions());
  return { sessions };
});

export const adminCreateLiveSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1),
        title: z.string().trim().min(3).max(160),
        description: z.string().trim().max(1000).optional(),
        provider: providerSchema.optional(),
        playbackUrl: z.string().trim().min(8),
        scheduledAt: z.string().min(1),
        thumbnailContentType: z.string().min(1).optional(),
        thumbnailBase64: z.string().min(1).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getResolvedCourseBySlug } = await import("@/server/site-content");
    const course = await getResolvedCourseBySlug(data.courseSlug);
    if (!course) throw new Error("Cours introuvable.");

    const scheduled = new Date(data.scheduledAt);
    if (Number.isNaN(scheduled.getTime())) {
      throw new Error("Date de programmation invalide.");
    }

    const provider = data.provider ?? detectLiveProvider(data.playbackUrl);
    const playbackUrl = validatePlaybackUrl(provider, data.playbackUrl);

    let thumbnailUrl: string | undefined;
    if (data.thumbnailBase64 && data.thumbnailContentType) {
      const { uploadLiveThumbnail } = await import("@/server/course-thumbnail-storage");
      const upload = await uploadLiveThumbnail({
        contentType: data.thumbnailContentType,
        dataBase64: data.thumbnailBase64,
      });
      if (!upload.ok) throw new Error(upload.reason);
      thumbnailUrl = upload.publicUrl;
    }

    const { createLiveSession, listLiveSessions } = await import("@/server/live");
    await createLiveSession({
      courseSlug: data.courseSlug,
      title: data.title,
      description: data.description,
      provider,
      playbackUrl,
      scheduledAt: scheduled.toISOString(),
      thumbnailUrl,
    });
    return { sessions: await withCourseTitles(await listLiveSessions()) };
  });

export const adminStartLiveSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ sessionId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getLiveSession, updateLiveSession, listLiveSessions } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session) throw new Error("Live introuvable.");
    if (session.status === "ended" || session.status === "canceled") {
      throw new Error("Ce live est déjà terminé.");
    }
    await updateLiveSession(data.sessionId, {
      status: "live",
      startedAt: session.startedAt ?? new Date().toISOString(),
    });
    return { sessions: await withCourseTitles(await listLiveSessions()) };
  });

export const adminEndLiveSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        recordingUrl: z.string().trim().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getLiveSession, updateLiveSession, listLiveSessions } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session) throw new Error("Live introuvable.");
    if (session.status === "canceled") throw new Error("Live annulé.");

    const recordingUrl = (data.recordingUrl?.trim() || session.playbackUrl).trim();
    let recordingLessonId = session.recordingLessonId;

    if (!recordingLessonId && session.provider !== "hls") {
      recordingLessonId = await attachLiveRecordingLesson({
        courseSlug: session.courseSlug,
        title: session.title,
        provider: session.provider,
        recordingUrl,
      });
    }

    await updateLiveSession(data.sessionId, {
      status: "ended",
      endedAt: new Date().toISOString(),
      recordingUrl,
      recordingLessonId,
    });
    return { sessions: await withCourseTitles(await listLiveSessions()) };
  });

export const adminCancelLiveSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ sessionId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getLiveSession, updateLiveSession, listLiveSessions } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session) throw new Error("Live introuvable.");
    if (session.status === "ended") throw new Error("Un replay ne peut pas être annulé.");
    await updateLiveSession(data.sessionId, { status: "canceled" });
    return { sessions: await withCourseTitles(await listLiveSessions()) };
  });

export const adminUploadLiveThumbnail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        contentType: z.string().min(1),
        dataBase64: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getLiveSession, updateLiveSession, listLiveSessions } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session) throw new Error("Live introuvable.");

    const { uploadLiveThumbnail } = await import("@/server/course-thumbnail-storage");
    const upload = await uploadLiveThumbnail({
      sessionId: data.sessionId,
      contentType: data.contentType,
      dataBase64: data.dataBase64,
    });
    if (!upload.ok) throw new Error(upload.reason);

    await updateLiveSession(data.sessionId, { thumbnailUrl: upload.publicUrl });
    return { sessions: await withCourseTitles(await listLiveSessions()) };
  });

export const adminRemoveLiveThumbnail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ sessionId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getLiveSession, updateLiveSession, listLiveSessions } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session) throw new Error("Live introuvable.");
    await updateLiveSession(data.sessionId, { thumbnailUrl: null });
    return { sessions: await withCourseTitles(await listLiveSessions()) };
  });

async function attachLiveRecordingLesson(params: {
  courseSlug: string;
  title: string;
  provider: LiveProvider;
  recordingUrl: string;
}): Promise<string | null> {
  const { getResolvedCourseBySlug, addSectionToCourse, addLessonToCourse } =
    await import("@/server/site-content");
  const course = await getResolvedCourseBySlug(params.courseSlug);
  if (!course) return null;

  let section = course.sections.find(
    (item) => item.title.trim().toLowerCase() === LIVE_RECORDING_SECTION_TITLE.toLowerCase(),
  );
  if (!section) {
    const created = await addSectionToCourse({
      courseSlug: params.courseSlug,
      title: LIVE_RECORDING_SECTION_TITLE,
    });
    if (!created.ok || !("sectionId" in created) || !created.sectionId) return null;
    section = { id: created.sectionId, title: LIVE_RECORDING_SECTION_TITLE, lessons: [] };
  }

  const result = await addLessonToCourse({
    courseSlug: params.courseSlug,
    input: {
      sectionId: section.id,
      title: `Replay — ${params.title}`,
      type: "video",
      duration: "",
      ...(params.provider === "vimeo"
        ? { vimeoUrl: params.recordingUrl }
        : { youtubeUrl: params.recordingUrl }),
    },
  });

  if (!result.ok || !("lessonId" in result)) return null;
  return result.lessonId ?? null;
}
