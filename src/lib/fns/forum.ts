import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertForumAccess } from "@/server/forum-access";
import {
  createForumPost,
  createForumReply,
  getForumPost,
  listForumPosts,
  listForumReplies,
  listReplyAuthorUserIds,
  type ForumPostKind,
} from "@/server/forum";
import { notifyForumNewPost, notifyForumReply } from "@/server/forum-notifications";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { registrationCourseKey } from "@/lib/course-access";

const forumKindSchema = z.enum(["question", "suggestion"]);

export const listForumCourses = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { loadStudentEnrollments } = await import("@/server/student-enrollments");
    const enrollments = await loadStudentEnrollments(data.accessToken);
    return enrollments
      .filter((enrollment) => enrollment.payment_status === "paid")
      .map((enrollment) => ({
        courseSlug: enrollment.courseSlug,
        courseTitle: enrollment.courseTitle,
        instructor: enrollment.instructor,
        thumbnailGradient: enrollment.thumbnailGradient,
        thumbnailImageUrl: enrollment.thumbnailImageUrl,
      }));
  });

export const listCourseForumPosts = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ accessToken: z.string().min(1), courseSlug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertForumAccess(data.accessToken, data.courseSlug);
    const posts = await listForumPosts(data.courseSlug);
    return { posts };
  });

export const getForumThread = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(1),
        courseSlug: z.string().min(1),
        postId: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { courseTitle } = await assertForumAccess(data.accessToken, data.courseSlug);
    const post = await getForumPost(data.postId);
    if (!post || post.courseSlug !== registrationCourseKey(data.courseSlug)) {
      throw new Error("Sujet introuvable.");
    }
    const replies = await listForumReplies(data.postId);
    return { post, replies, courseTitle };
  });

export const createCourseForumPost = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(1),
        courseSlug: z.string().min(1),
        kind: forumKindSchema,
        title: z.string().trim().min(3).max(200),
        body: z.string().trim().min(1).max(8000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { actor, courseTitle } = await assertForumAccess(data.accessToken, data.courseSlug);
    const post = await createForumPost({
      courseSlug: data.courseSlug,
      kind: data.kind as ForumPostKind,
      actor,
      title: data.title,
      body: data.body,
    });

    void notifyForumNewPost({
      courseSlug: data.courseSlug,
      courseTitle,
      postId: post.id,
      authorUserId: actor.userId,
      authorName: actor.name,
      title: post.title,
    }).catch(() => undefined);

    return { post };
  });

export const createCourseForumReply = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(1),
        courseSlug: z.string().min(1),
        postId: z.string().uuid(),
        body: z.string().trim().min(1).max(8000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { actor, courseTitle } = await assertForumAccess(data.accessToken, data.courseSlug);
    const post = await getForumPost(data.postId);
    if (!post || post.courseSlug !== registrationCourseKey(data.courseSlug)) {
      throw new Error("Sujet introuvable.");
    }

    const reply = await createForumReply({
      postId: data.postId,
      courseSlug: data.courseSlug,
      actor,
      body: data.body,
    });

    const participantUserIds = await listReplyAuthorUserIds(data.postId);

    void notifyForumReply({
      courseSlug: data.courseSlug,
      courseTitle,
      postId: post.id,
      replyId: reply.id,
      authorUserId: actor.userId,
      authorName: actor.name,
      postAuthorUserId: post.authorUserId,
      postTitle: post.title,
      participantUserIds,
    }).catch(() => undefined);

    return { reply };
  });

export const getForumNotifications = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.id) return { notifications: [], unreadCount: 0 };

    const { listNotificationsForUser, countUnreadNotifications } = await import(
      "@/server/forum-notifications"
    );

    const [notifications, unreadCount] = await Promise.all([
      listNotificationsForUser(user.id),
      countUnreadNotifications(user.id),
    ]);

    return { notifications, unreadCount };
  });

export const markForumNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ accessToken: z.string().min(1), notificationId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.id) throw new Error("Connexion requise.");

    const { markNotificationRead } = await import("@/server/forum-notifications");
    await markNotificationRead(data.notificationId, user.id);
    return { ok: true as const };
  });

export const markAllForumNotificationsRead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.id) throw new Error("Connexion requise.");

    const { markAllNotificationsRead } = await import("@/server/forum-notifications");
    await markAllNotificationsRead(user.id);
    return { ok: true as const };
  });
