import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

type StudentAvatarProps = {
  name: string;
  src?: string | null;
  className?: string;
};

export function StudentAvatar({ name, src, className }: StudentAvatarProps) {
  return (
    <Avatar className={cn("size-6 border border-border/60", className)}>
      {src ? (
        <AvatarImage src={src} alt="" referrerPolicy="no-referrer" className="object-cover" />
      ) : null}
      <AvatarFallback
        className={cn("text-[10px] font-bold text-white", avatarTone(name))}
        aria-hidden
      >
        {initial(name)}
      </AvatarFallback>
    </Avatar>
  );
}
