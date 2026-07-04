import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  HelpCircle,
  LogOut,
  MessagesSquare,
  Settings,
  Share2,
  ShoppingBag,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

function displayName(user: NonNullable<ReturnType<typeof useAuth>["user"]>) {
  return (
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Étudiant"
  );
}

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

type UserAccountMenuProps = {
  onNavigate?: () => void;
  triggerClassName?: string;
};

export function UserAccountMenu({ onNavigate, triggerClassName }: UserAccountMenuProps) {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const name = displayName(user);
  const email = user.email ?? "";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  const close = () => onNavigate?.();

  const signOutAndClose = async () => {
    close();
    await signOut();
    window.location.href = "/";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            triggerClassName,
          )}
          aria-label="Menu du compte"
        >
          <Avatar className="h-9 w-9 border border-border">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
              {initials(name, email)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-lg p-0 shadow-lg">
        <DropdownMenuLabel className="px-4 py-3 font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="bg-foreground text-background text-sm font-semibold">
                {initials(name, email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="m-0" />

        <div className="py-1">
          <DropdownMenuItem asChild className="px-4 py-2.5 cursor-pointer">
            <Link to="/dashboard" onClick={close}>
              <BookOpen className="h-4 w-4 mr-3 text-muted-foreground" />
              Mes cours
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="px-4 py-2.5 cursor-pointer">
            <Link to="/courses" onClick={close}>
              <ShoppingBag className="h-4 w-4 mr-3 text-muted-foreground" />
              Catalogue de cours
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="m-0" />

        <div className="py-1">
          <DropdownMenuItem asChild className="px-4 py-2.5 cursor-pointer">
            <Link to="/forum" onClick={close}>
              <MessagesSquare className="h-4 w-4 mr-3 text-muted-foreground" />
              Forum étudiant
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="px-4 py-2.5 cursor-pointer">
            <Link to="/dashboard" hash="affiliate" onClick={close}>
              <Share2 className="h-4 w-4 mr-3 text-muted-foreground" />
              Programme affilié
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="px-4 py-2.5 cursor-pointer">
            <Link to="/dashboard" hash="account" onClick={close}>
              <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
              Paramètres du compte
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="m-0" />

        <div className="py-1">
          <DropdownMenuItem asChild className="px-4 py-2.5 cursor-pointer">
            <a href={`mailto:${siteConfig.contactEmail}`} onClick={close}>
              <HelpCircle className="h-4 w-4 mr-3 text-muted-foreground" />
              Aide et support
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="px-4 py-2.5 cursor-pointer text-foreground"
            onSelect={(event) => {
              event.preventDefault();
              void signOutAndClose();
            }}
          >
            <LogOut className="h-4 w-4 mr-3 text-muted-foreground" />
            Déconnexion
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
