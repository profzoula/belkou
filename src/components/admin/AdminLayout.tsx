import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  DollarSign,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export type AdminSection = "overview" | "inscriptions" | "courses" | "commissions" | "settings";

const navItems: { id: AdminSection; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "inscriptions", label: "Inscriptions", icon: Users },
  { id: "courses", label: "Cours & vidéos", icon: BookOpen },
  { id: "commissions", label: "Commissions", icon: DollarSign },
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
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-card pt-[env(safe-area-inset-top,0px)]">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={siteConfig.logo} alt="" className="h-8 w-8 rounded-lg" />
            <div className="min-w-0">
              <p className="font-display text-sm font-bold truncate">Admin BelKou</p>
              <p className="text-[11px] text-muted-foreground hidden sm:block">Gestion de la formation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                <span className="hidden sm:inline ml-2">Actualiser</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Sortir</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-card lg:border-b-0 lg:border-r lg:min-h-[calc(100dvh-3.5rem)]">
          <nav className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible lg:p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:w-full",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="hidden lg:block p-4 pt-0">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Retour au site public
            </Link>
          </div>
        </aside>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
