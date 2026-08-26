import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Briefcase,
  DollarSign,
  ExternalLink,
  Film,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Radio,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SiteWordmark } from "@/components/site/SiteWordmark";
import { cn } from "@/lib/utils";

export type AdminSection =
  | "overview"
  | "courses"
  | "videos"
  | "live"
  | "services"
  | "students"
  | "inscriptions"
  | "commissions"
  | "settings";

const navItems: {
  id: AdminSection;
  label: string;
  icon: typeof Users;
  group: "ops" | "catalog" | "finance";
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "ops" },
  { id: "inscriptions", label: "Inscriptions", icon: Users, group: "ops" },
  { id: "students", label: "Étudiants", icon: GraduationCap, group: "ops" },
  { id: "courses", label: "Cours", icon: BookOpen, group: "catalog" },
  { id: "live", label: "Live", icon: Radio, group: "catalog" },
  { id: "videos", label: "Vidéos", icon: Film, group: "catalog" },
  { id: "services", label: "Services", icon: Briefcase, group: "catalog" },
  { id: "commissions", label: "Revenus", icon: DollarSign, group: "finance" },
  { id: "settings", label: "Paramètres", icon: Settings, group: "finance" },
];

const groups: { id: "ops" | "catalog" | "finance"; label: string }[] = [
  { id: "ops", label: "Opérations" },
  { id: "catalog", label: "Catalogue" },
  { id: "finance", label: "Finance" },
];

type AdminLayoutProps = {
  active: AdminSection;
  onNavigate: (section: AdminSection) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onLogout: () => void;
  children: React.ReactNode;
};

export function AdminLayout({
  active,
  onNavigate,
  onRefresh,
  refreshing,
  onLogout,
  children,
}: AdminLayoutProps) {
  const activeLabel = navItems.find((item) => item.id === active)?.label ?? "Admin";

  return (
    <div className="min-h-dvh bg-[#eef1f6] text-foreground dark:bg-background">
      <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-0 z-30 flex flex-col border-b border-black/5 bg-white dark:border-border dark:bg-card lg:h-dvh lg:border-b-0 lg:border-r lg:border-black/5">
          <div className="px-5 py-5">
            <SiteWordmark size="sm" />
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">Console admin</p>
          </div>

          <nav
            className="flex gap-1.5 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:gap-5 lg:overflow-y-auto lg:pb-4"
            aria-label="Navigation admin"
          >
            <div className="flex gap-1.5 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const activeState = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    aria-current={activeState ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                      activeState
                        ? "bg-foreground text-background"
                        : "bg-[#f3f5f9] text-muted-foreground hover:bg-[#e8ecf3] hover:text-foreground dark:bg-muted dark:hover:bg-muted/80",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:flex lg:flex-col lg:gap-6">
              {groups.map((group) => (
                <div key={group.id} className="space-y-1">
                  <p className="px-3 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {navItems
                      .filter((item) => item.group === group.id)
                      .map((item) => {
                        const Icon = item.icon;
                        const activeState = active === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onNavigate(item.id)}
                            aria-current={activeState ? "page" : undefined}
                            className={cn(
                              "group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                              activeState
                                ? "bg-[#eef2ff] text-primary dark:bg-primary/15 dark:text-primary"
                                : "text-muted-foreground hover:bg-[#f3f5f9] hover:text-foreground dark:hover:bg-muted",
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-8 place-items-center rounded-lg transition-colors",
                                activeState
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-[#f3f5f9] text-muted-foreground group-hover:bg-white group-hover:text-foreground dark:bg-muted",
                              )}
                            >
                              <Icon className="size-4" aria-hidden />
                            </span>
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="mt-auto hidden space-y-2 border-t border-black/5 p-4 dark:border-border lg:block">
            <div className="flex items-center justify-between rounded-2xl bg-[#f3f5f9] px-3 py-2.5 dark:bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground">Thème</span>
              <ThemeToggle />
            </div>
            {onRefresh ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start rounded-xl border-black/8 bg-white dark:border-border"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn("size-4", refreshing && "animate-spin")} aria-hidden />
                Actualiser
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start rounded-xl text-muted-foreground hover:text-foreground"
              onClick={onLogout}
            >
              <LogOut className="size-4" aria-hidden />
              Déconnexion
            </Button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 text-xs font-medium text-muted-foreground transition hover:text-primary"
            >
              Site public
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-black/5 bg-[#eef1f6]/90 backdrop-blur-xl dark:border-border dark:bg-background/85">
            <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">
                  BelKou <span className="mx-1 text-border">/</span> {activeLabel}
                </p>
                <p className="truncate text-base font-semibold tracking-tight">{activeLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="lg:hidden">
                  <ThemeToggle />
                </div>
                {onRefresh ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-black/8 bg-white dark:border-border dark:bg-card"
                    onClick={onRefresh}
                    disabled={refreshing}
                    aria-label="Actualiser"
                  >
                    <RefreshCw className={cn("size-4", refreshing && "animate-spin")} aria-hidden />
                    <span className="hidden sm:inline">Actualiser</span>
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full lg:hidden"
                  onClick={onLogout}
                  aria-label="Déconnexion"
                >
                  <LogOut className="size-4" aria-hidden />
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="hidden rounded-full bg-primary px-4 text-primary-foreground shadow-[0_8px_20px_rgb(0_70_213_/_0.28)] hover:bg-primary/90 sm:inline-flex"
                >
                  <Link to="/">Voir le site</Link>
                </Button>
              </div>
            </div>
          </header>

          <main
            id="main-content"
            className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
