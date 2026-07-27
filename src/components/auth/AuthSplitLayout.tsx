import { Link } from "@tanstack/react-router";
import { AuthTypingCard } from "@/components/auth/AuthTypingCard";
import { SiteLogo } from "@/components/site/SiteLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { siteConfig } from "@/lib/site-config";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
};

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex min-h-[100dvh] flex-col px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10 sm:py-8 lg:px-14 xl:px-20">
        <div className="mb-10 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex w-fit items-center gap-2.5">
            <SiteLogo className="h-8 w-8" alt={siteConfig.name} />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-[400px]">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-gradient-mesh lg:block">
        <div className="absolute inset-0 bg-gradient-primary opacity-[0.08]" />
        <div
          aria-hidden
          className="absolute -right-16 top-20 size-72 rounded-full bg-brand-accent/20 blur-3xl"
        />
        <div className="relative flex h-full items-center justify-center p-12 xl:p-16">
          <AuthTypingCard />
        </div>
      </div>
    </div>
  );
}
