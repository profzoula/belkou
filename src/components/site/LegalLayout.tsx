import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { siteConfig } from "@/lib/site-config";

type LegalLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="site-container pt-20 sm:pt-[5.5rem] pb-12 sm:pb-16 max-w-2xl">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 sm:mb-8 inline-block touch-target">
          ← Retour
        </Link>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6 sm:mb-8 text-balance">{title}</h1>
        <div className="prose-legal space-y-4 text-sm text-muted-foreground leading-relaxed">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function legalSections() {
  return { siteName: siteConfig.name, email: siteConfig.contactEmail };
}
