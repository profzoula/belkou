import { useState } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resendSignupConfirmation } from "@/lib/supabase/auth-actions";

type EmailConfirmationNoticeProps = {
  email: string;
};

export function EmailConfirmationNotice({ email }: EmailConfirmationNoticeProps) {
  const [resending, setResending] = useState(false);

  const resend = async () => {
    setResending(true);
    const { error } = await resendSignupConfirmation(email);
    setResending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Email de confirmation renvoyé. Vérifiez Gmail (et Spam).");
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/10 px-5 py-6">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-primary">
        <Mail className="h-5 w-5" aria-hidden />
      </div>
      <h2 className="font-display text-xl font-bold text-foreground">Confirmez votre email avant de vous connecter</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Votre compte est créé. Nous avons envoyé un lien de confirmation à{" "}
        <span className="font-medium text-foreground">{email}</span>.
      </p>
      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
        <li>
          1. Ouvrez <strong className="font-medium text-foreground">Gmail</strong> (ou votre boîte mail).
        </li>
        <li>
          2. Cherchez l&apos;email de <strong className="font-medium text-foreground">BelKou</strong> ou{" "}
          <strong className="font-medium text-foreground">profzoula@gmail.com</strong>.
        </li>
        <li>
          3. Cliquez sur <strong className="font-medium text-foreground">Confirmez votre mail</strong>.
        </li>
        <li>4. Revenez ici et connectez-vous.</li>
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Rien reçu ? Vérifiez <strong>Spam</strong>, <strong>Promotions</strong> et <strong>Tous les messages</strong>.
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4 w-full rounded-lg"
        disabled={resending}
        onClick={resend}
      >
        <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
        {resending ? "Envoi..." : "Renvoyer l'email de confirmation"}
      </Button>
    </div>
  );
}
