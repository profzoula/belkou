import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, Send } from "lucide-react";
import { toast } from "sonner";
import { StudentAvatar } from "@/components/auth/StudentAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import type { LiveComment } from "@/lib/live";
import { listLiveComments, postLiveComment } from "@/lib/fns/live";
import { avatarUrlFromUser } from "@/lib/user-avatar";
import { cn } from "@/lib/utils";

type LiveChatProps = {
  sessionId: string;
  canWatch?: boolean;
  canComment: boolean;
  live: boolean;
  loggedIn?: boolean;
  className?: string;
};

/** Distance from the bottom under which we consider the reader "following" the chat. */
const FOLLOW_THRESHOLD_PX = 48;

function commentTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function LiveChat({
  sessionId,
  canWatch = false,
  canComment,
  live,
  loggedIn = false,
  className,
}: LiveChatProps) {
  const { session, user } = useAuth();
  const myAvatarUrl = avatarUrlFromUser(user);
  const listFn = useServerFn(listLiveComments);
  const postFn = useServerFn(postLiveComment);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [pinnedToBottom, setPinnedToBottom] = useState(true);
  const [unread, setUnread] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const seenCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const result = await listFn({
          data: { sessionId, accessToken: session?.access_token },
        });
        if (!cancelled) setComments(result.comments);
      } catch {
        /* keep previous comments */
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), live ? 2500 : 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [listFn, session?.access_token, sessionId, live]);

  const scrollToBottom = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
    setPinnedToBottom(true);
    setUnread(0);
  }, []);

  // Only follow the stream when the reader is already at the bottom — scrolling up
  // to read something during a live must not be undone every 2.5 s.
  useEffect(() => {
    const arrived = comments.length - seenCountRef.current;
    seenCountRef.current = comments.length;
    if (arrived <= 0) return;

    if (pinnedToBottom) {
      const node = scrollerRef.current;
      if (node) node.scrollTop = node.scrollHeight;
      setUnread(0);
    } else {
      setUnread((count) => count + arrived);
    }
  }, [comments.length, pinnedToBottom]);

  const onScroll = () => {
    const node = scrollerRef.current;
    if (!node) return;
    const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight <= FOLLOW_THRESHOLD_PX;
    setPinnedToBottom(atBottom);
    if (atBottom) setUnread(0);
  };

  const submit = async () => {
    const text = body.trim();
    if (!text || !session?.access_token) return;
    setSending(true);
    try {
      const result = await postFn({
        data: { sessionId, accessToken: session.access_token, body: text },
      });
      setComments((current) => [...current, result.comment]);
      setBody("");
      scrollToBottom();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Commentaire impossible");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100 lg:border-l",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <p className="text-sm font-semibold">Chat en direct</p>
        <p className="text-[11px] text-zinc-500">
          {live ? `${comments.length} message${comments.length > 1 ? "s" : ""}` : "Replay"}
        </p>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          role="log"
          aria-live="polite"
          aria-label="Messages du live"
          className="h-full space-y-3 overflow-y-auto px-3 py-3"
        >
          {live ? (
            <p className="rounded-lg bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-400">
              Restez respectueux. Les commentaires sont visibles par les autres étudiants.
            </p>
          ) : null}
          {comments.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">
              {live ? "Soyez le premier à commenter." : "Aucun commentaire pendant ce live."}
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                <StudentAvatar
                  name={comment.authorName}
                  src={comment.authorAvatarUrl ?? (comment.mine ? myAvatarUrl : undefined)}
                  className="mt-0.5 border-zinc-700"
                />
                <p className="min-w-0 text-sm leading-snug">
                  <span className="font-semibold text-zinc-100">
                    {comment.authorName}
                    {comment.mine ? (
                      <span className="ml-1 font-medium text-sky-400">(vous)</span>
                    ) : null}
                  </span>
                  <span className="ml-1.5 text-[11px] font-normal tabular-nums text-zinc-600">
                    {commentTime(comment.createdAt)}
                  </span>{" "}
                  <span className="whitespace-pre-wrap break-words text-zinc-400">
                    {comment.body}
                  </span>
                </p>
              </div>
            ))
          )}
        </div>

        {unread > 0 ? (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute inset-x-0 bottom-2 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            <ArrowDown className="size-3.5" aria-hidden />
            {unread} nouveau{unread > 1 ? "x" : ""} message{unread > 1 ? "s" : ""}
          </button>
        ) : null}
      </div>

      {canComment && live ? (
        <form
          className="flex items-center gap-2 border-t border-zinc-800 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Chat..."
            maxLength={500}
            className="h-10 rounded-full border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-500"
            disabled={!user || sending}
            aria-label="Écrire un commentaire"
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 shrink-0 rounded-full"
            disabled={!body.trim() || sending}
            aria-label="Envoyer"
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </form>
      ) : live ? (
        <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-4 py-3">
          <p className="text-xs text-zinc-400">
            {canWatch || !loggedIn
              ? "Connectez-vous pour commenter."
              : "Réservez votre place pour commenter."}
          </p>
          <Button asChild size="sm" className="h-8 shrink-0 rounded-full px-3 text-xs">
            {canWatch || !loggedIn ? (
              <Link to="/login" search={{ redirect: `/live/${sessionId}` }}>
                Se connecter
              </Link>
            ) : (
              <Link to="/checkout" search={{ plan: "live", session: sessionId }}>
                Réserver
              </Link>
            )}
          </Button>
        </div>
      ) : (
        <p className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
          Le chat est fermé.
        </p>
      )}
    </div>
  );
}
