import { useState } from "react";
import { Calendar, CheckCircle2, Clock, Mail, MessageSquare, Phone, User } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitServiceBooking } from "@/lib/fns/services";
import type { ServiceItem } from "@/lib/service-storage";

type ServiceBookingFormProps = {
  service: ServiceItem;
};

export function ServiceBookingForm({ service }: ServiceBookingFormProps) {
  const bookingFn = useServerFn(submitServiceBooking);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    setSubmitting(true);

    try {
      await bookingFn({
        data: {
          serviceSlug: service.slug,
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          preferredDate: String(form.get("preferredDate") ?? ""),
          preferredTime: String(form.get("preferredTime") ?? ""),
          message: String(form.get("message") ?? "") || undefined,
        },
      });
      setSubmitted(true);
      toast.success("Demande envoyée — nous vous contacterons sous 24 h.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'envoyer la demande.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h3 className="mt-4 font-display text-xl font-bold text-emerald-950">Demande reçue</h3>
        <p className="mt-2 text-sm text-emerald-900">
          Merci ! Nous vous contacterons dans les 24 heures pour confirmer votre rendez-vous pour{" "}
          <strong>{service.title}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
      <h2 className="font-display text-xl font-bold">Remplir le formulaire</h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" name="name" required placeholder="Jean Pierre" className="pl-10 bg-muted/40" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="jean@example.com"
              className="pl-10 bg-muted/40"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="phone" name="phone" type="tel" required placeholder="+1 (555) 123-4567" className="pl-10 bg-muted/40" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="preferredDate">Date préférée</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="preferredDate" name="preferredDate" type="date" required className="pl-10 bg-muted/40" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredTime">Heure préférée</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="preferredTime" name="preferredTime" type="time" required className="pl-10 bg-muted/40" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message (optionnel)</Label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Parlez-nous plus de votre projet ou posez vos questions..."
              className="pl-10 bg-muted/40 resize-none"
            />
          </div>
        </div>

        <Button type="submit" variant="hero" size="lg" className="w-full rounded-lg" disabled={submitting}>
          {submitting ? "Envoi..." : "Confirmer le rendez-vous"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Nous vous contacterons dans les 24 heures pour confirmer votre rendez-vous.
        </p>
      </form>
    </div>
  );
}
