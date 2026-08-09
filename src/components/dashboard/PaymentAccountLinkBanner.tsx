import { Link } from "@tanstack/react-router";
import { AlertTriangle, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type { RegistrationHandoff } from "@/lib/registration-handoff";

type PaymentAccountLinkBannerProps = {
  handoff: RegistrationHandoff;
  userEmail: string;
  hasEnrollments: boolean;
};

export function PaymentAccountLinkBanner({
  handoff,
  userEmail,
  hasEnrollments,
}: PaymentAccountLinkBannerProps) {
  if (!handoff.paid || hasEnrollments) return null;

  const sameEmail = handoff.email === userEmail.trim().toLowerCase();

  if (sameEmail) {
    return (
      <Panel className="border-amber-200 bg-amber-50/80">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <div className="space-y-3 text-left">
            <div>
              <p className="font-semibold text-amber-950">Paiement confirmé — accès en attente</p>
              <p className="mt-1 text-sm text-amber-900/90">
                Votre paiement est enregistré pour <strong>{handoff.email}</strong>. Si vos cours
                n&apos;apparaissent pas sous quelques minutes, actualisez la page ou contactez le
                support.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="border-amber-300 bg-white/80">
              <Link to="/courses">Explorer le catalogue</Link>
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="border-amber-200 bg-amber-50/80">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        <div className="space-y-3 text-left">
          <div>
            <p className="font-semibold text-amber-950">Email de paiement différent</p>
            <p className="mt-1 text-sm text-amber-900/90">
              Vous êtes connecté en tant que <strong>{userEmail}</strong>, mais votre inscription
              utilise <strong>{handoff.email}</strong>. Connectez-vous avec l&apos;email du paiement
              pour voir vos cours.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="hero" size="sm">
              <Link to="/login" search={{ email: handoff.email }}>
                <LogIn className="h-4 w-4" />
                Se connecter avec {handoff.email}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-amber-300 bg-white/80">
              <Link to="/signup" search={{ email: handoff.email }}>
                <UserPlus className="h-4 w-4" />
                Créer un compte
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
}
