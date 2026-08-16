import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteLogo } from "@/components/site/SiteLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  /** Renders the Inscription / Connexion switch when set. */
  activeTab?: "login" | "signup";
  /** Kept across the tab switch so the post-auth destination survives. */
  tabRedirect?: string;
};

const tabClass = (active: boolean) =>
  cn(
    "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors",
    active
      ? "bg-primary text-primary-foreground shadow-primary"
      : "border border-border bg-card text-muted-foreground hover:text-foreground",
  );

export function AuthSplitLayout({ children, activeTab, tabRedirect }: AuthSplitLayoutProps) {
  const tabSearch = tabRedirect ? { redirect: tabRedirect } : {};

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-mesh" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(0_70_213_/_0.10),transparent_60%)]"
      />

      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-[1060px] rounded-[28px] border border-border/70 bg-card shadow-[0_28px_90px_rgb(15_23_42_/_0.14)] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:p-3">
        <div className="flex flex-col px-5 py-8 sm:px-10 sm:py-10 lg:px-11 lg:py-12">
          <Link to="/" className="mx-auto inline-flex flex-col items-center gap-1.5 text-center">
            <span className="inline-flex items-center gap-2.5">
              <SiteLogo className="size-8" alt="" />
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                {siteConfig.name}
              </span>
            </span>
            <span className="text-[11px] tracking-wide text-muted-foreground">
              {siteConfig.tagline}
            </span>
          </Link>

          {activeTab ? (
            <div className="mx-auto mt-7 grid w-full max-w-[300px] grid-cols-2 gap-2">
              <Link
                to="/signup"
                search={tabSearch}
                className={tabClass(activeTab === "signup")}
                aria-current={activeTab === "signup" ? "page" : undefined}
              >
                Inscription
              </Link>
              <Link
                to="/login"
                search={tabSearch}
                className={tabClass(activeTab === "login")}
                aria-current={activeTab === "login" ? "page" : undefined}
              >
                Connexion
              </Link>
            </div>
          ) : null}

          <main id="main-content" className="mx-auto mt-8 w-full max-w-[380px]">
            {children}
          </main>
        </div>

        <div className="relative hidden flex-col overflow-hidden rounded-[22px] border border-border/60 bg-gradient-mesh p-8 lg:flex">
          <div
            aria-hidden
            className="absolute -top-16 -right-10 size-56 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative">
            <h2 className="font-display text-2xl font-bold leading-snug tracking-tight text-foreground text-balance">
              Apprenez la tech, en kreyòl et en français
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              Cours pratiques, lives avec questions-réponses, et un espace étudiant qui garde votre
              progression.
            </p>
          </div>

          <img
            src="/images/auth-illustration.webp"
            alt=""
            className="relative mx-auto my-5 w-full max-w-[330px] flex-1 object-contain"
            loading="eager"
            decoding="async"
          />

          <Link
            to="/courses"
            className="relative inline-flex h-10 w-fit items-center gap-1.5 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            Découvrir les cours
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
