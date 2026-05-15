import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { createAccount } from "@/lib/signupFn";
import { Navbar } from "@/components/site/Navbar";
import { Eye, EyeOff, KeyRound, Sparkles, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Créer mon compte — BelKou Formation" }],
  }),
  validateSearch: z.object({ email: z.string().optional() }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { email: prefillEmail } = Route.useSearch();

  const [email, setEmail]         = useState(prefillEmail ?? "");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Modpas yo pa menm."); return; }
    if (password.length < 6)  { setError("Modpas la dwe gen omwen 6 karaktè."); return; }

    setLoading(true);
    try {
      const res = await createAccount({ data: { email, password } });
      if (res.success) {
        setDone(true);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Yon erè te fèt. Eseye ankò.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="flex items-center justify-center px-4 pt-28 pb-20">
          <div className="w-full max-w-sm text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Kont ou prè!</h1>
            <p className="text-muted-foreground text-sm mb-8">
              Ou ka kounye a konekte ak email ak modpas ou te chwazi a.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
            >
              Konekte kounye a →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="flex items-center justify-center px-4 pt-28 pb-20">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Créer mon compte</h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Antre imèl ou te peye avèk la ak yon modpas pou kont ou
            </p>
          </div>

          {/* Notice */}
          <div className="mb-5 rounded-xl border border-primary/30 bg-primary/8 px-4 py-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Pou elèv ki fin peye sèlman.</span>{" "}
            Si ou poko peye,{" "}
            <a
              href="https://buy.stripe.com/9B6aEZ792gOh96ja7G4F202"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-medium"
            >
              klike isit
            </a>.
          </div>

          <form onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-gradient-card p-6 space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email (menm ke pèman an)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Chwazi yon modpas</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 karaktè omwen"
                  required
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors"
                />
                <button type="button" onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Konfime modpas la</label>
              <input
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repete modpas la"
                required
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-primary hover:opacity-90 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity mt-1">
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <><KeyRound className="h-4 w-4" /> Kreye kont mwen</>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Deja gen kont?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Konekte isit
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
