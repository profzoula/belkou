import { registrationCourseKey } from "@/lib/course-access";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import { getSupabaseAdmin, supabaseListRegistrations } from "@/server/supabase-registrations";

export type BelKouNotification = {
  id: string;
  type: "forum_post" | "forum_reply" | "course_lesson";
  title: string;
  body: string | null;
  courseSlug: string | null;
  postId: string | null;
  replyId: string | null;
  lessonId: string | null;
  readAt: string | null;
  createdAt: string;
};

function mapNotification(row: Record<string, unknown>): BelKouNotification {
  return {
    id: String(row.id),
    type: row.type as BelKouNotification["type"],
    title: String(row.title),
    body: row.body ? String(row.body) : null,
    courseSlug: row.course_slug ? String(row.course_slug) : null,
    postId: row.post_id ? String(row.post_id) : null,
    replyId: row.reply_id ? String(row.reply_id) : null,
    lessonId: row.lesson_id ? String(row.lesson_id) : null,
    readAt: row.read_at ? String(row.read_at) : null,
    createdAt: String(row.created_at),
  };
}

async function buildEmailToUserIdMap(): Promise<Map<string, string>> {
  const sb = getSupabaseAdmin();
  const map = new Map<string, string>();
  if (!sb) return map;

  let page = 1;
  while (page <= 25) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    if (!data.users.length) break;

    for (const user of data.users) {
      if (!user.email || !user.id) continue;
      map.set(normalizeRegistrationEmail(user.email), user.id);
    }

    if (data.users.length < 200) break;
    page += 1;
  }

  return map;
}

export async function listEnrolledUserIdsForCourse(
  courseSlug: string,
  excludeUserId?: string,
): Promise<string[]> {
  const key = registrationCourseKey(courseSlug);
  const rows = await supabaseListRegistrations();
  const emails = new Set<string>();

  for (const row of rows) {
    if (row.payment_status !== "paid") continue;
    if (registrationCourseKey(row.course_slug) !== key) continue;
    emails.add(normalizeRegistrationEmail(row.email));
  }

  if (!emails.size) return [];

  const emailToUserId = await buildEmailToUserIdMap();
  const userIds: string[] = [];

  for (const email of emails) {
    const userId = emailToUserId.get(email);
    if (!userId || userId === excludeUserId) continue;
    userIds.push(userId);
  }

  return [...new Set(userIds)];
}

export async function insertNotifications(
  items: Array<{
    userId: string;
    type: BelKouNotification["type"];
    title: string;
    body?: string;
    courseSlug?: string;
    postId?: string;
    replyId?: string;
    lessonId?: string;
  }>,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb || !items.length) return;

  const payload = items.map((item) => ({
    user_id: item.userId,
    type: item.type,
    title: item.title,
    body: item.body ?? null,
    course_slug: item.courseSlug ?? null,
    post_id: item.postId ?? null,
    reply_id: item.replyId ?? null,
    lesson_id: item.lessonId ?? null,
    created_at: new Date().toISOString(),
  }));

  const { error } = await sb.from("notifications").insert(payload);
  if (error && !error.message.includes("notifications")) {
    console.error("[BelKou] insert notifications:", error.message);
  }
}

export async function notifyForumNewPost(params: {
  courseSlug: string;
  courseTitle: string;
  postId: string;
  authorUserId: string;
  authorName: string;
  title: string;
}): Promise<void> {
  const recipients = await listEnrolledUserIdsForCourse(params.courseSlug, params.authorUserId);
  if (!recipients.length) return;

  await insertNotifications(
    recipients.map((userId) => ({
      userId,
      type: "forum_post" as const,
      title: `Nouveau sujet — ${params.courseTitle}`,
      body: `${params.authorName} : ${params.title}`,
      courseSlug: params.courseSlug,
      postId: params.postId,
    })),
  );
}

export async function notifyForumReply(params: {
  courseSlug: string;
  courseTitle: string;
  postId: string;
  replyId: string;
  authorUserId: string;
  authorName: string;
  postAuthorUserId: string;
  postTitle: string;
  participantUserIds: string[];
}): Promise<void> {
  const recipientSet = new Set<string>([
    params.postAuthorUserId,
    ...params.participantUserIds,
  ]);
  recipientSet.delete(params.authorUserId);

  if (!recipientSet.size) return;

  await insertNotifications(
    [...recipientSet].map((userId) => ({
      userId,
      type: "forum_reply" as const,
      title: `Nouvelle réponse — ${params.courseTitle}`,
      body: `${params.authorName} a répondu à « ${params.postTitle} »`,
      courseSlug: params.courseSlug,
      postId: params.postId,
      replyId: params.replyId,
    })),
  );
}

export async function notifyCourseNewLesson(params: {
  courseSlug: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
}): Promise<void> {
  const recipients = await listEnrolledUserIdsForCourse(params.courseSlug);
  if (!recipients.length) return;

  await insertNotifications(
    recipients.map((userId) => ({
      userId,
      type: "course_lesson" as const,
      title: `Nouvelle vidéo — ${params.courseTitle}`,
      body: `${params.lessonTitle} est maintenant disponible`,
      courseSlug: params.courseSlug,
      lessonId: params.lessonId,
    })),
  );
}

export async function notifyCourseLessonIfVideoAdded(params: {
  courseSlug: string;
  lessonId: string;
  hadVideo: boolean;
}): Promise<void> {
  if (params.hadVideo) return;

  const { getResolvedCourseBySlug } = await import("@/server/site-content");
  const { getLessonById, lessonHasVideo } = await import("@/lib/courses");

  const course = await getResolvedCourseBySlug(params.courseSlug);
  if (!course) return;

  const lesson = getLessonById(course, params.lessonId);
  if (!lesson || lesson.type !== "video") return;
  if (!lessonHasVideo(lesson)) return;

  await notifyCourseNewLesson({
    courseSlug: params.courseSlug,
    courseTitle: course.title,
    lessonId: params.lessonId,
    lessonTitle: lesson.title,
  });
}

export async function listNotificationsForUser(
  userId: string,
  limit = 30,
): Promise<BelKouNotification[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (!error.message.includes("notifications")) {
      console.error("[BelKou] list notifications:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => mapNotification(row));
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;

  const { count, error } = await sb
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
