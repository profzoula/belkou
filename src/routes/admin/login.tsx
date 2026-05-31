import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin } from "@/lib/fns/admin";
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
      await loginFn({ data: { username, password } });
      toast.success("Connexion admin réussie");
      navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-grid place-items-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-4">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold">Administration BelKou</h1>
          <p className="text-sm text-muted-foreground mt-1">Accès réservé au formateur</p>
        </div>

        <form onSubmit={submit} className="surface rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Identifiant</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="rounded-lg"
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
              className="rounded-lg"
              required
            />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}
