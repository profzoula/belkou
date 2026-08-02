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
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SiteLogo } from "@/components/site/SiteLogo";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export type AdminSection =
  | "overview"
  | "courses"
  | "videos"
  | "services"
  | "students"
  | "inscriptions"
  | "commissions"
  | "settings";

const navItems: { id: AdminSection; label: string; icon: typeof Users; group: "ops" | "catalog" | "finance" }[] =
  [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard, group: "ops" },
    { id: "inscriptions", label: "Inscriptions", icon: Users, group: "ops" },
    { id: "students", label: "Étudiants", icon: GraduationCap, group: "ops" },
    { id: "courses", label: "Cours", icon: BookOpen, group: "catalog" },
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
    <div className="min-h-dvh bg-[#F8FAFC] text-foreground dark:bg-background">
      <div className="lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="sticky top-0 z-30 flex flex-col border-b border-border/80 bg-card/90 backdrop-blur-xl lg:h-dvh lg:border-b-0 lg:border-r">
          <div className="border-b border-border/70 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                <SiteLogo className="size-7 rounded-lg" alt="" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-semibold tracking-tight">
                  {siteConfig.name}
                </p>
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Console admin
                </p>
              </div>
            </div>
          </div>

          <nav
            className="flex gap-1.5 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:gap-5 lg:overflow-y-auto lg:px-3 lg:py-4"
            aria-label="Navigation admin"
          >
            {/* Mobile: flat chips */}
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
                      "flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                      activeState
                        ? "bg-primary text-primary-foreground shadow-primary"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Desktop: grouped nav */}
            <div className="hidden lg:flex lg:flex-col lg:gap-5">
              {groups.map((group) => (
                <div key={group.id} className="space-y-1">
                  <p className="px-3 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
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
                              "group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                              activeState
                                ? "bg-primary text-primary-foreground shadow-[0_8px_20px_rgb(0_70_213_/_0.28)]"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <Icon
                              className={cn(
                                "size-4 shrink-0 transition-transform duration-200",
                                !activeState && "group-hover:scale-105",
                              )}
                              aria-hidden
                            />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="mt-auto hidden space-y-2 border-t border-border/70 p-4 lg:block">
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/40 px-2.5 py-2">
              <span className="px-1 text-xs font-medium text-muted-foreground">Thème</span>
              <ThemeToggle />
            </div>
            {onRefresh ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start rounded-xl"
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
          <header className="sticky top-0 z-20 border-b border-border/70 bg-[#F8FAFC]/85 backdrop-blur-xl dark:bg-background/85">
            <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">{activeLabel}</p>
                <p className="hidden text-[11px] text-muted-foreground sm:block">
                  Console BelKou · opérations
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="lg:hidden">
                  <ThemeToggle />
                </div>
                {onRefresh ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
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
                  className="rounded-xl lg:hidden"
                  onClick={onLogout}
                  aria-label="Déconnexion"
                >
                  <LogOut className="size-4" aria-hidden />
                </Button>
                <Button asChild variant="soft" size="sm" className="hidden rounded-xl sm:inline-flex">
                  <Link to="/">Voir le site</Link>
                </Button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
