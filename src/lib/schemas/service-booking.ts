import { z } from "zod";

export const serviceBookingSchema = z.object({
  serviceSlug: z.string().min(1),
  name: z.string().trim().min(2, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().trim().min(5, "Téléphone requis"),
  preferredDate: z.string().trim().min(1, "Date requise"),
  preferredTime: z.string().trim().min(1, "Heure requise"),
  message: z.string().trim().optional(),
});

export type ServiceBookingInput = z.infer<typeof serviceBookingSchema>;
