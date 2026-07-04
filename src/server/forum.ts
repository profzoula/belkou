import { registrationCourseKey } from "@/lib/course-access";
import { getSupabaseAdmin } from "@/server/supabase-registrations";
import type { ForumActor } from "@/server/forum-access";

export type ForumPostKind = "question" | "suggestion";

export type ForumPost = {
  id: string;
  courseSlug: string;
  kind: ForumPostKind;
  authorUserId: string;
  authorEmail: string;
  authorName: string;
  title: string;
  body: string;
  replyCount: number;
  lastActivityAt: string;
  createdAt: string;
};

export type ForumReply = {
  id: string;
  postId: string;
  courseSlug: string;
  authorUserId: string;
  authorEmail: string;
  authorName: string;
  body: string;
  createdAt: string;
};

function mapPost(row: Record<string, unknown>): ForumPost {
  return {
    id: String(row.id),
    courseSlug: String(row.course_slug),
    kind: (row.kind as ForumPostKind) ?? "question",
    authorUserId: String(row.author_user_id),
    authorEmail: String(row.author_email),
    authorName: String(row.author_name),
    title: String(row.title),
    body: String(row.body),
    replyCount: Number(row.reply_count ?? 0),
    lastActivityAt: String(row.last_activity_at),
    createdAt: String(row.created_at),
  };
}

function mapReply(row: Record<string, unknown>): ForumReply {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    courseSlug: String(row.course_slug),
    authorUserId: String(row.author_user_id),
    authorEmail: String(row.author_email),
    authorName: String(row.author_name),
    body: String(row.body),
    createdAt: String(row.created_at),
  };
}

export async function listForumPosts(courseSlug: string): Promise<ForumPost[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const slug = registrationCourseKey(courseSlug);
  const { data, error } = await sb
    .from("forum_posts")
    .select("*")
    .eq("course_slug", slug)
    .order("last_activity_at", { ascending: false });

  if (error) {
    if (!error.message.includes("forum_posts")) {
      console.error("[BelKou] list forum posts:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => mapPost(row));
}

export async function getForumPost(postId: string): Promise<ForumPost | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb.from("forum_posts").select("*").eq("id", postId).maybeSingle();
  if (error || !data) return null;
  return mapPost(data);
}

export async function listForumReplies(postId: string): Promise<ForumReply[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("forum_replies")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    if (!error.message.includes("forum_replies")) {
      console.error("[BelKou] list forum replies:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => mapReply(row));
}

export async function createForumPost(params: {
  courseSlug: string;
  kind: ForumPostKind;
  actor: ForumActor;
  title: string;
  body: string;
}): Promise<ForumPost> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Forum indisponible.");

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("forum_posts")
    .insert({
      course_slug: registrationCourseKey(params.courseSlug),
      kind: params.kind,
      author_user_id: params.actor.userId,
      author_email: params.actor.email,
      author_name: params.actor.name,
      title: params.title.trim(),
      body: params.body.trim(),
      reply_count: 0,
      last_activity_at: now,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de publier le sujet.");
  }

  return mapPost(data);
}

export async function createForumReply(params: {
  postId: string;
  courseSlug: string;
  actor: ForumActor;
  body: string;
}): Promise<ForumReply> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Forum indisponible.");

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("forum_replies")
    .insert({
      post_id: params.postId,
      course_slug: registrationCourseKey(params.courseSlug),
      author_user_id: params.actor.userId,
      author_email: params.actor.email,
      author_name: params.actor.name,
      body: params.body.trim(),
      created_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de publier la réponse.");
  }

  const post = await getForumPost(params.postId);
  if (post) {
    await sb
      .from("forum_posts")
      .update({
        reply_count: post.replyCount + 1,
        last_activity_at: now,
        updated_at: now,
      })
      .eq("id", params.postId);
  }

  return mapReply(data);
}

export async function listReplyAuthorUserIds(postId: string): Promise<string[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("forum_replies")
    .select("author_user_id")
    .eq("post_id", postId);

  if (error || !data) return [];
  return [...new Set(data.map((row) => String(row.author_user_id)).filter(Boolean))];
}
