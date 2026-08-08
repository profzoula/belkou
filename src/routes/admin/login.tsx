import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SiteLogo } from "@/components/site/SiteLogo";
import { adminLogin } from "@/lib/fns/admin";
import { setAdminSessionToken } from "@/lib/admin-session";
import { siteConfig } from "@/lib/site-config";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/login")({
  head: () =>
    seoHead({
      title: "Admin — BelKou",
      path: "/admin/login",
      noindex: true,
    }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const loginFn = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await loginFn({ data: { username, password } });
      if (result.token) {
        setAdminSessionToken(result.token);
      }
      toast.success("Connexion admin réussie");
      navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(0_70_213_/_0.12),transparent_55%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-70" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <main id="main-content" className="relative w-full max-w-[420px] py-10">
        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 shadow-sm backdrop-blur">
            <SiteLogo className="size-6 rounded-md" alt="" />
            <span className="font-display text-sm font-semibold">{siteConfig.name}</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase">
              Admin
            </span>
          </div>
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-primary">
            <Lock className="size-5" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[28px]">
            Console administration
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Accès sécurisé réservé à l&apos;équipe BelKou.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-[20px] border border-border/80 bg-card/95 p-6 shadow-[0_16px_48px_rgb(15_23_42_/_0.08)] backdrop-blur sm:p-7"
        >
          <div className="space-y-2">
            <Label htmlFor="username">Identifiant</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <Button type="submit" variant="hero" className="w-full rounded-xl shadow-primary" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
          <p className="inline-flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" aria-hidden />
            Session chiffrée · accès formateur uniquement
          </p>
        </form>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
            ← Retour au site
          </Link>
        </p>
      </main>
    </div>
  );
}
