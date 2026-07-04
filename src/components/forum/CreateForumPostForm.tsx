import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCourseForumPost } from "@/lib/fns/forum";

type CreateForumPostFormProps = {
  courseSlug: string;
  accessToken: string;
  onCreated?: () => void;
};

export function CreateForumPostForm({ courseSlug, accessToken, onCreated }: CreateForumPostFormProps) {
  const navigate = useNavigate();
  const createFn = useServerFn(createCourseForumPost);
  const [kind, setKind] = useState<"question" | "suggestion">("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Remplissez le titre et le message.");
      return;
    }

    setLoading(true);
    try {
      const result = await createFn({
        data: {
          accessToken,
          courseSlug,
          kind,
          title: title.trim(),
          body: body.trim(),
        },
      });
      toast.success("Sujet publié — les autres étudiants seront notifiés.");
      setTitle("");
      setBody("");
      onCreated?.();
      void navigate({
        to: "/forum/$courseSlug/$postId",
        params: { courseSlug, postId: result.post.id },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publication impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="text-lg font-bold">Nouveau sujet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Posez une question ou proposez une idée — les autres inscrits recevront une notification.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Type de sujet</Label>
        <Select value={kind} onValueChange={(value) => setKind(value as "question" | "suggestion")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="question">Question</SelectItem>
            <SelectItem value="suggestion">Suggestion / idée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="forum-title">Titre</Label>
        <Input
          id="forum-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Comment déployer mon app sur Railway ?"
          maxLength={200}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="forum-body">Message</Label>
        <Textarea
          id="forum-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Décrivez votre question ou suggestion en détail..."
          rows={5}
          maxLength={8000}
        />
      </div>

      <Button type="submit" variant="hero" disabled={loading}>
        {loading ? "Publication..." : "Publier le sujet"}
      </Button>
    </form>
  );
}
