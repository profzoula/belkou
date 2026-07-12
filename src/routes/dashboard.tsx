import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useHashScroll } from "@/hooks/use-hash-scroll";
import { getStudentDashboard, type StudentEnrollment } from "@/lib/fns/dashboard";
import { seoHead } from "@/lib/seo";
import { AffiliatePanel } from "@/components/affiliate/AffiliatePanel";
import { AccountSettingsPanel } from "@/components/dashboard/AccountSettingsPanel";
import { MyCoursesSection } from "@/components/dashboard/MyCoursesSection";
import { claimSignupReferral } from "@/lib/fns/affiliate";
import { getStoredReferralCode } from "@/lib/referral-storage";

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

    const storedRef = getStoredReferralCode();
    void (async () => {
      await claimReferralFn({
        data: {
          accessToken: session.access_token,
          referralCode: storedRef ?? undefined,
        },
      }).catch(() => undefined);

      const result = await dashboardFn({ data: { accessToken: session.access_token } });
      setEnrollments(result.enrollments);
    })().catch(() => setEnrollments([]));
  }, [session?.access_token, dashboardFn, claimReferralFn]);

  useHashScroll([user?.id, enrollments, loading, configured]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="site-container site-page-top pb-12 sm:pb-16 max-w-lg text-center">
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
      <main className="site-container site-page-top pb-12 sm:pb-16 max-w-7xl">
        <header className="mb-8">
          <p className="section-label mb-2">Mon compte</p>
          <h1 className="text-2xl md:text-3xl font-semibold">Bonjour, {name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        </header>

        <div className="mb-8 sm:mb-10">
          <MyCoursesSection enrollments={enrollments} />
        </div>

        <div id="account" className="mb-8 scroll-mt-24 sm:mb-10">
          <AccountSettingsPanel user={user} />
        </div>

        {session?.access_token ? (
          <div id="affiliate" className="scroll-mt-24">
            <AffiliatePanel accessToken={session.access_token} />
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
