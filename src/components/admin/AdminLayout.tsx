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
    <div className="min-h-screen bg-[#eef1f6]">
      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-border bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-5 py-5">
            <div className="flex items-center gap-3">
              <SiteLogo className="h-10 w-10 rounded-xl" alt="" />
              <div className="min-w-0">
                <p className="font-display text-base font-bold truncate">BelKou Admin</p>
                <p className="text-xs text-muted-foreground">Plateforme de formation</p>
              </div>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible lg:px-4 lg:py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const activeState = active === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:w-full",
                    activeState
                      ? "bg-[#1a2744] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto hidden border-t border-border p-4 lg:block space-y-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start rounded-lg"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                Actualiser
              </Button>
            )}
            <Button variant="ghost" size="sm" className="w-full justify-start rounded-lg" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
            <Link to="/" className="block px-3 text-xs text-muted-foreground hover:text-foreground">
              ← Retour au site public
            </Link>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mb-4 flex items-center justify-end gap-2 lg:hidden">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
