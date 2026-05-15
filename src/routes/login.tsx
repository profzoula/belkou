import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { studentLogin } from "@/lib/userAuth";
import { Navbar } from "@/components/site/Navbar";
import { Eye, EyeOff, LogIn, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Se connecter — BelKou Formation" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const u = sessionStorage.getItem("student_user");
      if (u) navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await studentLogin({ data: { email, password } });
      if (res.success && res.user) {
        sessionStorage.setItem("student_user", JSON.stringify(res.user));
        navigate({ to: "/dashboard" });
      } else {
        const detail = (res as { errorMsg?: string }).errorMsg;
        setError(detail ? `Erè: ${detail}` : "Email ou modpas la pa kòrèk.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erè sèvè: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="flex items-center justify-center px-4 pt-28 pb-20">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Se connecter</h1>
            <p className="text-sm text-muted-foreground mt-1">Accédez à votre espace BelKou</p>
          </div>

          <form onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-gradient-card p-6 space-y-4">

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Modpas</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors"
                />
                <button type="button" onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-primary hover:opacity-90 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity mt-2">
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <><LogIn className="h-4 w-4" /> Konekte</>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-muted-foreground mt-6 space-y-2">
            <p>
              Deja peye men pa gen kont?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Kreye kont ou isit
              </Link>
            </p>
            <p>
              Pa gen kont toujou?{" "}
              <a href="https://buy.stripe.com/9B6aEZ792gOh96ja7G4F202" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                Enskri pou $199
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
