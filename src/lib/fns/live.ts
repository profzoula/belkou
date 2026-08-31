import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  LIVE_PROVIDERS,
  LIVE_RECORDING_SECTION_TITLE,
  LIVE_TICKET_PRICE_USD,
  STANDALONE_LIVE_SLUG,
  detectLiveProvider,
  isStandaloneLiveSlug,
  resolveLivePrice,
  type LiveCourseInfo,
  type LiveProvider,
  type PublicLiveListItem,
  type PublicLiveSession,
} from "@/lib/live";
import { isValidVimeoUrl } from "@/lib/vimeo";
import { isValidYoutubeUrl } from "@/lib/youtube";
import { checkRateLimit, RATE_LIMITS } from "@/server/rate-limit";

const providerSchema = z.enum(LIVE_PROVIDERS);
const livePriceSchema = z
  .number()
  .min(0, "Le prix ne peut pas être négatif.")
  .max(5000, "Prix trop élevé.")
  .transform((value) => Math.round(value * 100) / 100);

function validatePlaybackUrl(provider: LiveProvider, url: string) {
  const trimmed = url.trim();
  if (provider === "youtube" && !isValidYoutubeUrl(trimmed)) {
    throw new Error(
      "URL YouTube invalide — collez le lien de la diffusion (youtube.com/live/… ou watch?v=).",
    );
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

function standaloneLiveCourseInfo(): LiveCourseInfo {
  return {
    slug: STANDALONE_LIVE_SLUG,
    title: "BelKou Live",
    instructor: "BelKou",
    price: LIVE_TICKET_PRICE_USD,
    originalPrice: LIVE_TICKET_PRICE_USD,
    studentsCount: 0,
    description: "",
    thumbnail: { gradient: "from-primary/80 to-primary", label: "LIVE" },
  };
}

function toLiveCourseInfo(
  slug: string,
  course: Awaited<ReturnType<typeof import("@/server/site-content").getResolvedCourseBySlug>>,
): LiveCourseInfo {
  if (isStandaloneLiveSlug(slug) || !course) {
    return standaloneLiveCourseInfo();
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
      if (isStandaloneLiveSlug(session.courseSlug)) {
        return { ...session, courseTitle: "" };
      }
      const course = await getResolvedCourseBySlug(session.courseSlug);
      return { ...session, courseTitle: course?.title ?? "" };
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
      if (isStandaloneLiveSlug(session.courseSlug)) {
        const course = standaloneLiveCourseInfo();
        return { ...session, courseTitle: "", course };
      }
      const resolved = await getResolvedCourseBySlug(session.courseSlug);
      const course = toLiveCourseInfo(session.courseSlug, resolved);
      return {
        ...session,
        courseTitle: isStandaloneLiveSlug(course.slug) ? "" : course.title,
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

type LiveTicketContext = {
  userId: string;
  rows: Awaited<ReturnType<typeof import("@/server/db").listRegistrationsByEmail>>;
  isVip: boolean;
};

/** Everything needed to answer "which lives may this student open", fetched once. */
async function loadLiveTicketContext(accessToken?: string): Promise<LiveTicketContext | null> {
  if (!accessToken?.trim()) return null;

  const { getUserFromAccessToken } = await import("@/server/supabase-auth");
  const user = await getUserFromAccessToken(accessToken);
  if (!user?.email || !user.id) return null;

  const { isPaidVipPlan } = await import("@/lib/course-access");
  const { getDb } = await import("@/server/env");
  const { listRegistrationsByEmail } = await import("@/server/db");
  const { normalizeRegistrationEmail } = await import("@/lib/schemas/registration");

  const db = await getDb();
  const rows = await listRegistrationsByEmail(db, normalizeRegistrationEmail(user.email));

  return {
    userId: user.id,
    rows,
    isVip: rows.some((row) => row.payment_status === "paid" && isPaidVipPlan(row.plan)),
  };
}

async function ticketOpensSession(
  context: LiveTicketContext,
  courseSlug: string,
  sessionId: string,
): Promise<boolean> {
  if (context.isVip) return true;
  const { hasLiveTicketForSession } = await import("@/lib/course-access");
  const accessSlug = isStandaloneLiveSlug(courseSlug) ? STANDALONE_LIVE_SLUG : courseSlug;
  return hasLiveTicketForSession(context.rows, sessionId, accessSlug);
}

/**
 * Paid lives need VIP or a ticket for that exact event.
 * Free lives ($0) are open to watch without an account; commenting still needs login.
 */
async function resolveLiveAccess(
  courseSlug: string,
  sessionId: string,
  accessToken: string | undefined,
  priceUsd: number | null | undefined,
): Promise<{
  canWatch: boolean;
  canComment: boolean;
  actorUserId?: string;
}> {
  const free = resolveLivePrice(priceUsd) <= 0;
  const context = await loadLiveTicketContext(accessToken);

  if (free) {
    if (!context) return { canWatch: true, canComment: false };
    return { canWatch: true, canComment: true, actorUserId: context.userId };
  }

  if (!context) return { canWatch: false, canComment: false };

  const canWatch = await ticketOpensSession(context, courseSlug, sessionId);
  return {
    canWatch,
    canComment: canWatch,
    actorUserId: context.userId,
  };
}

function toPublicSession(
  session: Awaited<ReturnType<typeof import("@/server/live").getLiveSession>> & {
    course: LiveCourseInfo;
  },
  access: { canWatch: boolean; canComment: boolean },
  reservedCount: number,
): PublicLiveSession {
  if (!session) {
    throw new Error("Live introuvable.");
  }
  const free = resolveLivePrice(session.priceUsd) <= 0;
  const canSeeStream =
    access.canWatch &&
    (session.status === "live" ||
      session.status === "ended" ||
      (free && session.status === "scheduled"));
  return {
    ...session,
    // An ended event plays its recording or nothing at all. Falling back to the live URL
    // handed viewers a stream that had already stopped — an HLS manifest dies with the
    // broadcast, so the player opened onto a black screen.
    playbackUrl: canSeeStream
      ? session.status === "ended"
        ? session.recordingUrl?.trim() || undefined
        : session.playbackUrl
      : undefined,
    canWatch: access.canWatch,
    canComment: access.canComment && session.status === "live",
    liveTicketPrice: resolveLivePrice(session.priceUsd),
    reservedCount,
    course: session.course,
  };
}

async function countReservedSeats(sessionId: string): Promise<number> {
  try {
    const { getDb } = await import("@/server/env");
    const { countPaidRegistrationsForCourse } = await import("@/server/db");
    const { liveTicketSlug } = await import("@/lib/live");
    return await countPaidRegistrationsForCourse(await getDb(), liveTicketSlug(sessionId));
  } catch {
    return 0;
  }
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

/** Seats sold for a whole page of events, in one query. Never blocks the page. */
async function reservedSeatsBySession(sessionIds: string[]): Promise<Map<string, number>> {
  try {
    const { getDb } = await import("@/server/env");
    const { countPaidRegistrationsForCourses } = await import("@/server/db");
    const { liveTicketSlug } = await import("@/lib/live");

    const bySlug = await countPaidRegistrationsForCourses(
      await getDb(),
      sessionIds.map((id) => liveTicketSlug(id)),
    );

    const bySession = new Map<string, number>();
    for (const id of sessionIds) {
      bySession.set(id, bySlug.get(liveTicketSlug(id)) ?? 0);
    }
    return bySession;
  } catch {
    return new Map();
  }
}

async function listPublicSessions(): Promise<PublicLiveListItem[]> {
  const { listLiveSessions } = await import("@/server/live");
  const sessions = (await withPublicCourse(await listLiveSessions())).filter((session) => {
    if (session.status === "canceled") return false;
    // An ended event with no recording has nothing to sell or show, so listing it would
    // only offer a "Voir le replay" button that leads to an empty player.
    if (session.status === "ended" && !session.recordingUrl?.trim()) return false;
    return true;
  });
  const reserved = await reservedSeatsBySession(sessions.map((session) => session.id));

  return sessions.map((session) => ({
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
    ticketPrice: resolveLivePrice(session.priceUsd),
    reservedCount: reserved.get(session.id) ?? 0,
    course: session.course,
  }));
}

export const listPublicLiveSessions = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicLiveListItem[]> => listPublicSessions(),
);

/**
 * The lives this student already holds — powers the "Réservé" state on cards and the
 * "Mes lives" block, so a paid seat is visible outside the session page itself.
 */
export const listMyLiveSessions = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<{ vip: boolean; sessions: PublicLiveListItem[] }> => {
    const context = await loadLiveTicketContext(data.accessToken);
    if (!context) return { vip: false, sessions: [] };

    const sessions = await listPublicSessions();
    const owned = await Promise.all(
      sessions.map(async (session) =>
        (await ticketOpensSession(context, session.courseSlug, session.id)) ? session : null,
      ),
    );

    return {
      vip: context.isVip,
      sessions: owned.filter((session): session is PublicLiveListItem => session !== null),
    };
  });

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
    // A canceled live still resolves: ticket holders deserve to be told, not 404'd.
    if (!session) {
      throw new Error("Live introuvable.");
    }
    const [withCourse] = await withPublicCourse([session]);
    const [access, reservedCount] = await Promise.all([
      resolveLiveAccess(session.courseSlug, session.id, data.accessToken, session.priceUsd),
      countReservedSeats(session.id),
    ]);
    return toPublicSession(withCourse, access, reservedCount);
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
    const access = await resolveLiveAccess(
      session.courseSlug,
      session.id,
      data.accessToken,
      session.priceUsd,
    );
    if (!access.canWatch && session.status === "live") {
      return { comments: [] as const };
    }
    const comments = await listComments(data.sessionId);
    const { withAuthorAvatars } = await import("@/server/user-avatars");
    const withAvatars = await withAuthorAvatars(comments);
    return {
      comments: withAvatars.map((comment) => ({
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
    const ip =
      getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? "local";
    if (
      !checkRateLimit(
        `live-comment:${ip}`,
        RATE_LIMITS.liveComment.limit,
        RATE_LIMITS.liveComment.windowMs,
      )
    ) {
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

    const access = await resolveLiveAccess(
      session.courseSlug,
      session.id,
      data.accessToken,
      session.priceUsd,
    );
    if (!access.canComment) {
      throw new Error(
        resolveLivePrice(session.priceUsd) <= 0
          ? "Connectez-vous pour commenter."
          : "Réservez votre place pour ce live afin de commenter.",
      );
    }

    const { normalizeRegistrationEmail } = await import("@/lib/schemas/registration");
    const { avatarUrlFromUser } = await import("@/lib/user-avatar");
    const comment = await createLiveComment({
      sessionId: data.sessionId,
      authorUserId: user.id,
      authorEmail: normalizeRegistrationEmail(user.email),
      authorName: displayNameFromUser(user),
      body: data.body,
    });
    return {
      comment: {
        ...comment,
        authorAvatarUrl: avatarUrlFromUser(user),
        mine: true,
      },
    };
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
        title: z.string().trim().min(3).max(160),
        description: z.string().trim().max(1000).optional(),
        provider: providerSchema.optional(),
        playbackUrl: z.string().trim().min(8),
        scheduledAt: z.string().min(1),
        priceUsd: livePriceSchema.optional(),
        thumbnailContentType: z.string().min(1).optional(),
        thumbnailBase64: z.string().min(1).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

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

    const { createLiveSession, listLiveSessions, updateLiveSession } = await import(
      "@/server/live"
    );
    const created = await createLiveSession({
      courseSlug: STANDALONE_LIVE_SLUG,
      title: data.title,
      description: data.description,
      provider,
      playbackUrl,
      scheduledAt: scheduled.toISOString(),
      thumbnailUrl,
      priceUsd: data.priceUsd ?? null,
    });
    if (resolveLivePrice(data.priceUsd) <= 0) {
      await updateLiveSession(created.id, {
        status: "live",
        startedAt: created.startedAt ?? new Date().toISOString(),
      });
    }
    return { sessions: await withCourseTitles(await listLiveSessions()) };
  });

export const adminSetLiveSessionSchedule = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        scheduledAt: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const scheduled = new Date(data.scheduledAt);
    if (Number.isNaN(scheduled.getTime())) {
      throw new Error("Date de programmation invalide.");
    }

    const { getLiveSession, updateLiveSession, listLiveSessions } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session) throw new Error("Live introuvable.");
    if (session.status === "ended" || session.status === "canceled") {
      throw new Error("Impossible de déplacer un live terminé ou annulé.");
    }

    await updateLiveSession(data.sessionId, { scheduledAt: scheduled.toISOString() });
    return { sessions: await withCourseTitles(await listLiveSessions()) };
  });

export const adminSetLiveSessionPrice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        priceUsd: livePriceSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getLiveSession, updateLiveSession, listLiveSessions } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session) throw new Error("Live introuvable.");
    await updateLiveSession(data.sessionId, { priceUsd: data.priceUsd });
    return { sessions: await withCourseTitles(await listLiveSessions()) };
  });

/**
 * Manual reminder blast to everyone holding a seat. Manual on purpose: the app has no
 * scheduler, so an admin fires it the day before or an hour before the event.
 */
export const adminSendLiveReminder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        note: z.string().trim().max(600).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ sent: number; failed: number; recipients: number }> => {
    await requireAdmin();

    const { getLiveSession } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session) throw new Error("Live introuvable.");
    if (session.status === "canceled") {
      throw new Error("Ce live est annulé — aucun rappel n'est envoyé.");
    }

    const { getDb } = await import("@/server/env");
    const { listPaidRegistrationsForCourse } = await import("@/server/db");
    const { liveTicketSlug } = await import("@/lib/live");
    const holders = await listPaidRegistrationsForCourse(await getDb(), liveTicketSlug(session.id));
    if (holders.length === 0) {
      throw new Error("Personne n'a encore réservé ce live.");
    }

    const { liveReminderEmail, sendEmailBatch } = await import("@/server/email");
    const { siteConfig } = await import("@/lib/site-config");
    const url = `${siteConfig.siteUrl.replace(/\/$/, "")}/live/${session.id}`;

    const { sent, failed } = await sendEmailBatch(
      holders.map((holder) => ({
        to: holder.email,
        subject: `Rappel — ${session.title}`,
        html: liveReminderEmail({
          name: holder.full_name,
          title: session.title,
          scheduledAt: session.scheduledAt,
          url,
          ...(data.note ? { note: data.note } : {}),
        }),
      })),
    );

    return { sent, failed, recipients: holders.length };
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

    // An HLS manifest stops existing when the broadcast stops, so reusing the live URL as
    // the recording only produces a dead player. YouTube and Vimeo keep the same address
    // for the replay, so there the old behaviour still holds.
    const provider = data.recordingUrl?.trim()
      ? detectLiveProvider(data.recordingUrl)
      : session.provider;
    const recordingUrl = data.recordingUrl?.trim()
      ? validatePlaybackUrl(provider, data.recordingUrl)
      : session.provider === "hls"
        ? null
        : session.playbackUrl.trim();
    let recordingLessonId = session.recordingLessonId;

    if (
      recordingUrl &&
      !recordingLessonId &&
      provider !== "hls" &&
      !isStandaloneLiveSlug(session.courseSlug)
    ) {
      recordingLessonId = await attachLiveRecordingLesson({
        courseSlug: session.courseSlug,
        title: session.title,
        provider,
        recordingUrl,
      });
    }

    await updateLiveSession(data.sessionId, {
      status: "ended",
      endedAt: new Date().toISOString(),
      provider,
      recordingUrl,
      recordingLessonId,
    });
    return { sessions: await withCourseTitles(await listLiveSessions()) };
  });

/**
 * Replace what an ended event plays. A live broadcast rarely leaves a usable address
 * behind, so the replay is published separately once the admin has it hosted somewhere.
 */
export const adminSetLiveRecording = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        recordingUrl: z.string().trim().min(8),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getLiveSession, updateLiveSession, listLiveSessions } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session) throw new Error("Live introuvable.");
    if (session.status !== "ended") {
      throw new Error("Terminez le live avant de publier son replay.");
    }

    // The replay can live on a different platform than the broadcast did, and the player
    // picks its engine from the provider, so both move together.
    const provider = detectLiveProvider(data.recordingUrl);
    const recordingUrl = validatePlaybackUrl(provider, data.recordingUrl);

    await updateLiveSession(data.sessionId, { provider, recordingUrl });
    return { sessions: await withCourseTitles(await listLiveSessions()) };
  });

/** Take the replay offline once the admin has the recording elsewhere. */
export const adminRemoveLiveRecording = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ sessionId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getLiveSession, updateLiveSession, listLiveSessions } = await import("@/server/live");
    const session = await getLiveSession(data.sessionId);
    if (!session) throw new Error("Live introuvable.");
    if (!session.recordingUrl?.trim()) throw new Error("Ce live n'a aucun replay publié.");

    await updateLiveSession(data.sessionId, { recordingUrl: null });
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
