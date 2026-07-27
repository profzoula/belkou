import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Briefcase,
  DollarSign,
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

const navItems: { id: AdminSection; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "courses", label: "Cours", icon: BookOpen },
  { id: "videos", label: "Vidéos", icon: Film },
  { id: "services", label: "Services", icon: Briefcase },
  { id: "students", label: "Étudiants", icon: GraduationCap },
  { id: "inscriptions", label: "Inscriptions", icon: Users },
  { id: "commissions", label: "Revenus", icon: DollarSign },
  { id: "settings", label: "Paramètres", icon: Settings },
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
  return (
    <div className="min-h-screen bg-background">
      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-border bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-5 py-5">
            <div className="flex items-center gap-3">
              <SiteLogo className="h-10 w-10 rounded-xl" alt="" />
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold">{siteConfig.name} Admin</p>
                <p className="text-xs text-muted-foreground">Ops · formations</p>
              </div>
            </div>
          </div>

          <nav
            className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible lg:px-4 lg:py-5"
            aria-label="Navigation admin"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const activeState = active === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:w-full",
                    activeState
                      ? "bg-primary text-primary-foreground shadow-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto hidden space-y-2 border-t border-border p-4 lg:block">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-2 py-1.5">
              <span className="px-1 text-xs text-muted-foreground">Thème</span>
              <ThemeToggle />
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start rounded-xl"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                Actualiser
              </Button>
            )}
            <Button variant="ghost" size="sm" className="w-full justify-start rounded-xl" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
            <Link to="/" className="block px-3 text-xs text-muted-foreground hover:text-foreground">
              ← Retour au site public
            </Link>
          </div>
        </aside>

        <main className="min-w-0 bg-muted/20 p-4 sm:p-6 lg:p-8">
          <div className="mb-4 flex items-center justify-end gap-2 lg:hidden">
            <ThemeToggle />
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
