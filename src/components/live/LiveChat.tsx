import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
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
  canComment: boolean;
  live: boolean;
  className?: string;
};

export function LiveChat({ sessionId, canComment, live, className }: LiveChatProps) {
  const { session, user } = useAuth();
  const myAvatarUrl = avatarUrlFromUser(user);
  const listFn = useServerFn(listLiveComments);
  const postFn = useServerFn(postLiveComment);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [comments.length]);

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

      <div ref={scrollerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
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
                  {comment.mine ? <span className="ml-1 font-medium text-sky-400">(vous)</span> : null}
                </span>{" "}
                <span className="whitespace-pre-wrap break-words text-zinc-400">{comment.body}</span>
              </p>
            </div>
          ))
        )}
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
        <p className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
          Inscrivez-vous pour commenter.
        </p>
      ) : (
        <p className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">Le chat est fermé.</p>
      )}
    </div>
  );
}
