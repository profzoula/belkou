import { Link } from "@tanstack/react-router";
import { siteConfig } from "@/lib/site-config";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
};

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col bg-white px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <Link to="/" className="mb-10 inline-flex w-fit items-center gap-2.5">
          <img src={siteConfig.logo} alt={siteConfig.name} className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-semibold tracking-tight text-foreground">{siteConfig.name}</span>
        </Link>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-[400px]">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-indigo-50 to-violet-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(147,197,253,0.45),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(196,181,253,0.35),transparent_50%)]" />

        <div className="relative flex h-full items-center justify-center p-12 xl:p-16">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#1a1d24] p-6 shadow-2xl shadow-slate-900/20">
            <p className="text-sm font-medium text-slate-300">Décrivez votre idée d&apos;application</p>
            <div className="mt-4 rounded-xl border border-slate-700/80 bg-[#0f1117] px-4 py-3.5">
              <p className="text-[15px] leading-relaxed text-slate-400">
                Concevez une application moderne et minimaliste de suivi nutritionnel
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
              <span>Génération de design par IA</span>
              <span>Appuyez sur Entrée pour générer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
