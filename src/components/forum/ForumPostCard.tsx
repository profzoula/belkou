import { Link } from "@tanstack/react-router";
import { Lightbulb, MessageCircle } from "lucide-react";
import { SiteLogo } from "@/components/site/SiteLogo";
import {
  formatForumTimestamp,
  forumAuthorHandle,
  forumAuthorInitials,
} from "@/lib/forum-display";
import { cn } from "@/lib/utils";

type ForumPostCardData = {
  id: string;
  kind: "question" | "suggestion";
  authorName: string;
  authorEmail?: string;
  title: string;
  body: string;
  replyCount: number;
  createdAt: string;
};

type ForumPostCardProps = {
  post: ForumPostCardData;
  courseSlug: string;
  className?: string;
  linkToThread?: boolean;
};

export function ForumPostCard({
  post,
  courseSlug,
  className,
  linkToThread = true,
}: ForumPostCardProps) {
  const handle = forumAuthorHandle(post.authorName, post.authorEmail);
  const initials = forumAuthorInitials(post.authorName, post.authorEmail);

  const card = (
    <article
      className={cn(
        "w-full rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-shadow duration-200",
        linkToThread && "hover:shadow-md hover:border-primary/25",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-gradient-to-br from-primary/15 to-indigo-500/15 text-sm font-semibold text-primary"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-bold text-foreground">{post.authorName}</p>
              {post.kind === "suggestion" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                  <Lightbulb className="h-3 w-3" />
                  Idée
                </span>
              ) : null}
            </div>
            <p className="truncate text-sm text-muted-foreground">{handle}</p>
          </div>
        </div>
        <SiteLogo className="h-8 w-8 shrink-0" alt="BelKou" />
      </div>

      <div className="mb-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {post.title ? (
            <>
              <span className="font-semibold">{post.title}</span>
              {"\n\n"}
            </>
          ) : null}
          {post.body}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <time className="text-xs text-muted-foreground" dateTime={post.createdAt}>
          {formatForumTimestamp(post.createdAt)}
        </time>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-muted-foreground transition-colors",
            linkToThread && "group-hover:text-primary",
          )}
          aria-label={`${post.replyCount} réponse${post.replyCount > 1 ? "s" : ""}`}
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
          <span className="text-xs font-medium">{post.replyCount}</span>
        </div>
      </div>
    </article>
  );

  if (!linkToThread) return card;

  return (
    <Link
      to="/forum/$courseSlug/$postId"
      params={{ courseSlug, postId: post.id }}
      className="group block"
    >
      {card}
    </Link>
  );
}

type ForumReplyCardProps = {
  authorName: string;
  authorEmail?: string;
  body: string;
  createdAt: string;
  className?: string;
};

export function ForumReplyCard({
  authorName,
  authorEmail,
  body,
  createdAt,
  className,
}: ForumReplyCardProps) {
  const handle = forumAuthorHandle(authorName, authorEmail);
  const initials = forumAuthorInitials(authorName, authorEmail);

  return (
    <article
      className={cn(
        "w-full rounded-xl border border-border/60 bg-muted/20 p-4 shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-primary"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-sm text-foreground">{authorName}</p>
          <p className="truncate text-xs text-muted-foreground">{handle}</p>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{body}</p>
      <time className="mt-3 block text-xs text-muted-foreground" dateTime={createdAt}>
        {formatForumTimestamp(createdAt)}
      </time>
    </article>
  );
}
