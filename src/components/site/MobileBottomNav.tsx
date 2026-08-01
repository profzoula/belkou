import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, MessageCircle, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

function shouldHideBottomNav(pathname: string) {
  if (pathname.startsWith("/admin")) return true;
  if (/\/courses\/[^/]+\/learn/.test(pathname)) return true;
  return false;
}

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const hidden = shouldHideBottomNav(pathname);

  useEffect(() => {
    if (hidden) {
      document.body.classList.remove("has-mobile-bottom-nav");
      return;
    }
    document.body.classList.add("has-mobile-bottom-nav");
    return () => document.body.classList.remove("has-mobile-bottom-nav");
  }, [hidden]);

  if (hidden) return null;

  const tabs = [
    {
      key: "home",
      label: "Accueil",
      icon: Home,
      active: pathname === "/",
      to: "/" as const,
    },
    {
      key: "courses",
      label: "Cours",
      icon: BookOpen,
      active: pathname.startsWith("/courses"),
      to: "/courses" as const,
    },
    {
      key: "support",
      label: "Support",
      icon: MessageCircle,
      active: pathname.startsWith("/forum") || pathname.startsWith("/faq"),
      to: "/faq" as const,
    },
    {
      key: "account",
      label: "Compte",
      icon: UserRound,
      active: pathname.startsWith("/dashboard") || pathname.startsWith("/login"),
      to: (user ? "/dashboard" : "/login") as "/dashboard" | "/login",
    },
  ];

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden pb-[env(safe-area-inset-bottom,0px)]"
    >
      <ul className="mx-auto grid h-14 max-w-lg grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.key}>
              <Link
                to={tab.to}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors",
                  tab.active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("size-5", tab.active && "fill-primary/15")}
                  strokeWidth={tab.active ? 2.25 : 1.75}
                  aria-hidden
                />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
