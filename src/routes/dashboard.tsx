import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, MessagesSquare, Settings2, Sparkles } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FadeIn } from "@/components/motion/FadeIn";
import { useAuth } from "@/hooks/use-auth";
import { useHashScroll } from "@/hooks/use-hash-scroll";
import { getStudentDashboard, type StudentEnrollment } from "@/lib/fns/dashboard";
import { seoHead } from "@/lib/seo";
import { AffiliatePanel } from "@/components/affiliate/AffiliatePanel";
import { AccountSettingsPanel } from "@/components/dashboard/AccountSettingsPanel";
import { MyCoursesSection } from "@/components/dashboard/MyCoursesSection";
import { claimSignupReferral } from "@/lib/fns/affiliate";
import { clearStoredReferralCode } from "@/lib/referral-storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    seoHead({
      title: "Mes cours — BelKou",
      description: "Accédez à vos cours BelKou et suivez votre progression.",
      path: "/dashboard",
      noindex: true,
    }),
  component: DashboardPage,
});

const quickLinks = [
  { href: "#courses", label: "Mes cours", icon: BookOpen },
  { href: "/forum", label: "Forum", icon: MessagesSquare, route: true },
  { href: "#account", label: "Compte", icon: Settings2 },
  { href: "#affiliate", label: "Affiliation", icon: Sparkles },
] as const;

function DashboardPage() {
  const { user, session, loading, configured } = useAuth();
  const navigate = useNavigate();
  const dashboardFn = useServerFn(getStudentDashboard);
  const claimReferralFn = useServerFn(claimSignupReferral);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[] | undefined>(undefined);

  useEffect(() => {
    if (!loading && configured && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, configured, navigate]);

  useEffect(() => {
    if (!session?.access_token) return;

    void (async () => {
      // Claim referral in the background so dashboard data is not delayed.
      void claimReferralFn({
        data: {
          accessToken: session.access_token,
        },
      })
        .then((claim) => {
          if (claim?.ok) clearStoredReferralCode();
        })
        .catch(() => null);

      const result = await dashboardFn({ data: { accessToken: session.access_token } });
      setEnrollments(result.enrollments);
    })().catch(() => setEnrollments([]));
  }, [session?.access_token, dashboardFn, claimReferralFn]);

  useHashScroll([user?.id, enrollments, loading, configured]);

  const stats = useMemo(() => {
    if (!enrollments) return null;
    const paid = enrollments.filter((item) => item.payment_status === "paid");
    const active = paid.filter((item) => item.contentLive);
    const avgProgress =
      active.length === 0
        ? 0
        : Math.round(active.reduce((sum, item) => sum + item.progressPercent, 0) / active.length);
    return {
      total: enrollments.length,
      active: active.length,
      scheduled: paid.length - active.length,
      avgProgress,
    };
  }, [enrollments]);

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground"
      >
        Chargement…
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="site-container site-page-top max-w-lg pb-12 text-center sm:pb-16">
          <p className="text-muted-foreground">Authentification Supabase non configurée.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Étudiant";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content">
        <section className="relative overflow-hidden border-b border-border bg-gradient-mesh">
          <div className="site-container site-page-top pb-10 pt-8 sm:pb-12">
            <FadeIn>
              <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">Espace étudiant</p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Bonjour, {name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
            </FadeIn>

            <FadeIn delay={0.06} className="mt-6 flex flex-wrap gap-2">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                const className =
                  "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card/90 px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-accent";
                if ("route" in item && item.route) {
                  return (
                    <Link key={item.href} to={item.href} className={className}>
                      <Icon className="h-4 w-4 text-primary" />
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <a key={item.href} href={item.href} className={className}>
                    <Icon className="h-4 w-4 text-primary" />
                    {item.label}
                  </a>
                );
              })}
            </FadeIn>

            <FadeIn delay={0.1} className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Cours inscrits", value: stats?.total ?? "—" },
                { label: "Accès actifs", value: stats?.active ?? "—" },
                { label: "Progression moy.", value: stats ? `${stats.avgProgress}%` : "—" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/80 bg-card/80 px-4 py-4 shadow-sm backdrop-blur"
                >
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </FadeIn>
          </div>
        </section>

        <div className="site-container max-w-7xl space-y-10 py-8 sm:space-y-12 sm:py-12">
          <div id="courses" className="scroll-mt-24">
            <MyCoursesSection enrollments={enrollments} />
          </div>

          <div id="account" className="scroll-mt-24">
            <AccountSettingsPanel user={user} />
          </div>

          {session?.access_token ? (
            <div id="affiliate" className={cn("scroll-mt-24")}>
              <AffiliatePanel accessToken={session.access_token} />
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
