import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import type { LiveComment } from "@/lib/live";
import { listLiveComments, postLiveComment } from "@/lib/fns/live";
import { cn } from "@/lib/utils";

type LiveChatProps = {
  sessionId: string;
  canComment: boolean;
  live: boolean;
};

export function LiveChat({ sessionId, canComment, live }: LiveChatProps) {
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
    <div className="flex h-full min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Commentaires</p>
        <p className="text-xs text-muted-foreground">
          {live ? "Le chat est ouvert aux inscrits du cours et aux accès live." : "Le chat est fermé — replay disponible."}
        </p>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {live ? "Soyez le premier à commenter." : "Aucun commentaire pendant ce live."}
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {comment.authorName}
                {comment.mine ? (
                  <span className="ml-1 font-medium text-primary">vous</span>
                ) : null}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {comment.body}
              </p>
            </div>
          ))
        )}
      </div>

      {canComment && live ? (
        <form
          className="border-t border-border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={user ? "Écrire un commentaire…" : "Connectez-vous pour commenter"}
            maxLength={500}
            rows={2}
            className="resize-none"
            disabled={!user || sending}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">{body.length}/500</p>
            <Button type="submit" size="sm" className="rounded-xl" disabled={!body.trim() || sending}>
              <Send className="size-3.5" aria-hidden />
              Envoyer
            </Button>
          </div>
        </form>
      ) : null}

      {!canComment && live ? (
        <p className={cn("border-t border-border px-4 py-3 text-xs text-muted-foreground")}>
          Inscrivez-vous au cours (live offert) ou prenez l&apos;accès live à 9,99 $ pour commenter.
        </p>
      ) : null}
    </div>
  );
}
