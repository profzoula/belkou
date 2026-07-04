import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import {
  getForumNotifications,
  markAllForumNotificationsRead,
  markForumNotificationRead,
} from "@/lib/fns/forum";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: "forum_post" | "forum_reply";
  title: string;
  body: string | null;
  courseSlug: string | null;
  postId: string | null;
  readAt: string | null;
  createdAt: string;
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function NotificationBell({ className }: { className?: string }) {
  const { session } = useAuth();
  const notifyFn = useServerFn(getForumNotifications);
  const markReadFn = useServerFn(markForumNotificationRead);
  const markAllFn = useServerFn(markAllForumNotificationsRead);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    if (!session?.access_token) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    const result = await notifyFn({ data: { accessToken: session.access_token } });
    setItems(result.notifications);
    setUnreadCount(result.unreadCount);
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(interval);
  }, [session?.access_token]);

  useEffect(() => {
    if (open) void refresh();
  }, [open]);

  if (!session?.access_token) return null;

  const handleOpenNotification = async (item: NotificationItem) => {
    if (!item.readAt) {
      await markReadFn({ data: { accessToken: session.access_token!, notificationId: item.id } }).catch(
        () => undefined,
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      setItems((list) =>
        list.map((entry) => (entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry)),
      );
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("relative h-9 w-9 rounded-full", className)}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-lg p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => {
                void markAllFn({ data: { accessToken: session.access_token! } })
                  .then(() => refresh())
                  .catch(() => undefined);
              }}
            >
              Tout marquer lu
            </button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Aucune notification</p>
        ) : (
          <div className="max-h-80 overflow-y-auto py-1">
            {items.map((item) => {
              const href =
                item.courseSlug && item.postId
                  ? { to: "/forum/$courseSlug/$postId" as const, params: { courseSlug: item.courseSlug, postId: item.postId } }
                  : item.courseSlug
                    ? { to: "/forum/$courseSlug" as const, params: { courseSlug: item.courseSlug } }
                    : { to: "/forum" as const };

              return (
                <DropdownMenuItem key={item.id} asChild className="cursor-pointer px-4 py-3">
                  <Link
                    {...href}
                    onClick={() => void handleOpenNotification(item)}
                    className={cn("flex flex-col items-start gap-1", !item.readAt && "bg-primary/5")}
                  >
                    <span className="text-sm font-medium leading-snug">{item.title}</span>
                    {item.body ? (
                      <span className="text-xs text-muted-foreground line-clamp-2">{item.body}</span>
                    ) : null}
                    <span className="text-[10px] text-muted-foreground">{formatWhen(item.createdAt)}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem asChild className="px-4 py-2.5">
          <Link to="/forum" onClick={() => setOpen(false)}>
            Ouvrir le forum
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
