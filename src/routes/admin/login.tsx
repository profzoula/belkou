import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { adminLogin } from "@/lib/adminAuth";
import { Lock, Eye, EyeOff, LogIn } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Admin — BelKou Formation" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token");
      if (token) navigate({ to: "/admin" });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminLogin({ data: { username, password } });
      if (res.success && res.token) {
        localStorage.setItem("admin_token", res.token);
        navigate({ to: "/admin" });
      } else {
        setError("Non ou modpas la pa kòrèk.");
      }
    } catch {
      setError("Yon erè te fèt. Eseye ankò.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "oklch(0.10 0.025 264)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center mb-4 shadow-lg shadow-violet-900/40">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Espas Admin</h1>
          <p className="text-sm text-white/60 mt-1">BelKou Formation</p>
        </div>

        <form onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">Non itilizatè</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Prof Zoula"
              required
              className="w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">Modpas</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button type="button" onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors mt-2"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Konekte
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
