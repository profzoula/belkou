import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import type { LiveComment } from "@/lib/live";
import { listLiveComments, postLiveComment } from "@/lib/fns/live";
import { cn } from "@/lib/utils";

type LiveChatProps = {
  sessionId: string;
  canComment: boolean;
  live: boolean;
  className?: string;
};

const AVATAR_TONES = [
  "bg-sky-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-indigo-600",
];

function avatarTone(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_TONES.length;
  return AVATAR_TONES[hash] ?? AVATAR_TONES[0];
}

function initial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}

export function LiveChat({ sessionId, canComment, live, className }: LiveChatProps) {
  const { session, user } = useAuth();
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
        "flex h-full min-h-0 flex-col overflow-hidden border-border bg-card lg:border-l",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <p className="text-sm font-semibold text-foreground">Chat en direct</p>
        <p className="text-[11px] text-muted-foreground">
          {live ? `${comments.length} message${comments.length > 1 ? "s" : ""}` : "Replay"}
        </p>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        {live ? (
          <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs leading-relaxed text-foreground">
            Restez respectueux. Les commentaires sont visibles par les autres étudiants.
          </p>
        ) : null}
        {comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {live ? "Soyez le premier à commenter." : "Aucun commentaire pendant ce live."}
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <span
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white",
                  avatarTone(comment.authorName),
                )}
                aria-hidden
              >
                {initial(comment.authorName)}
              </span>
              <p className="min-w-0 text-sm leading-snug">
                <span className="font-semibold text-foreground">
                  {comment.authorName}
                  {comment.mine ? <span className="ml-1 font-medium text-primary">(vous)</span> : null}
                </span>{" "}
                <span className="whitespace-pre-wrap break-words text-muted-foreground">
                  {comment.body}
                </span>
              </p>
            </div>
          ))
        )}
      </div>

      {canComment && live ? (
        <form
          className="flex items-center gap-2 border-t border-border p-2.5"
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
            className="h-10 rounded-full"
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
        <p className="border-t border-border px-3 py-3 text-xs text-muted-foreground">
          Inscrivez-vous pour commenter.
        </p>
      ) : (
        <p className="border-t border-border px-3 py-3 text-xs text-muted-foreground">
          Le chat est fermé.
        </p>
      )}
    </div>
  );
}
