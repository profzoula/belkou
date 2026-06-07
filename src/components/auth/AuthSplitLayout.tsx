import { Link } from "@tanstack/react-router";
import { AuthTypingCard } from "@/components/auth/AuthTypingCard";
import { siteConfig } from "@/lib/site-config";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
};

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex min-h-[100dvh] flex-col px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10 sm:py-8 lg:px-14 xl:px-20">
        <Link to="/" className="mb-10 inline-flex w-fit items-center gap-2.5">
          <img src={siteConfig.logo} alt={siteConfig.name} className="h-8 w-8 rounded-lg" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">{siteConfig.name}</span>
        </Link>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-[400px]">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-mesh lg:block">
        <div className="absolute inset-0 bg-gradient-primary opacity-[0.07]" />

        <div className="relative flex h-full items-center justify-center p-12 xl:p-16">
          <AuthTypingCard />
        </div>
      </div>
    </div>
  );
}
