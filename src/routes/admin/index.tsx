import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getRegistrations, deleteRegistration } from "@/lib/adminAuth";
import {
  Users, LogOut, Trash2, Mail, Phone,
  Globe, BookOpen, RefreshCw, Search, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Dashboard Admin — BelKou" }],
  }),
  component: AdminDashboard,
});

type Registration = {
  id: number;
  full_name: string;
  email: string;
  whatsapp: string;
  country: string;
  level: string;
  plan: string;
  created_at: string;
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem("admin_token");
    if (!t) { navigate({ to: "/admin/login" }); return; }
    setToken(t);
    loadData(t);
  }, [navigate]);

  async function loadData(t: string) {
    setLoading(true);
    try {
      const data = await getRegistrations({ data: { token: t } });
      setRows(data);
    } catch {
      localStorage.removeItem("admin_token");
      navigate({ to: "/admin/login" });
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    navigate({ to: "/admin/login" });
  }

  async function handleDelete(id: number) {
    if (!token) return;
    if (!confirm("Ou vle efase enskripsyon sa a?")) return;
    setDeleting(id);
    try {
      await deleteRegistration({ data: { token, id } });
      setRows((r) => r.filter((row) => row.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const filtered = rows.filter((r) =>
    [r.full_name, r.email, r.country, r.whatsapp].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const totalRevenue = rows.length * 199;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0.025 264)" }}>
      {/* Topbar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">BK</span>
          </div>
          <span className="font-semibold text-white">Admin — BelKou Formation</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs text-white/50 hover:text-white/80 transition-colors">
            Voir le site
          </Link>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors border border-white/10 rounded-lg px-3 py-1.5 hover:border-white/25">
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total inscrits", value: rows.length, icon: Users, color: "violet" },
            { label: "Revenu total", value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "green" },
            { label: "Plan actif", value: "Premium $199", icon: BookOpen, color: "blue" },
            { label: "Cours / semaine", value: "2 × Zoom", icon: Globe, color: "orange" },
          ].map((s) => (
            <div key={s.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-white/50 mb-2">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-white/10">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-400" />
              Enskripsyon yo ({filtered.length})
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Chèche..."
                  className="w-full rounded-xl border border-white/15 bg-white/8 pl-8 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <button onClick={() => token && loadData(token)}
                disabled={loading}
                className="p-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-white/40 text-sm">
              {search ? "Pa gen rezilta pou rechèch sa a." : "Pa gen enskripsyon toujou."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {["#", "Non", "Email", "WhatsApp", "Peyi", "Nivo", "Plan", "Dat", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-white/40 px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/4 transition-colors">
                      <td className="px-4 py-3 text-white/30 text-xs">{r.id}</td>
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{r.full_name}</td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${r.email}`} className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{r.email}</span>
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`https://wa.me/${r.whatsapp?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-green-400 hover:text-green-300 transition-colors">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{r.whatsapp}</span>
                        </a>
                      </td>
                      <td className="px-4 py-3 text-white/70 text-xs">{r.country}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">{r.level}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-xs text-violet-300">{r.plan}</span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString("fr-FR", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(r.id)}
                          disabled={deleting === r.id}
                          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          {deleting === r.id
                            ? <span className="h-3.5 w-3.5 block rounded-full border border-red-400/50 border-t-red-400 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
