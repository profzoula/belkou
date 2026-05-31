import { z } from "zod";

export const registrationSchema = z.object({
  full_name: z.string().trim().min(2, "Nom trop court").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  whatsapp: z.string().trim().min(6, "Numéro invalide").max(30),
  country: z.string().min(1, "Choisissez un pays"),
  level: z.string().min(1, "Choisissez un niveau"),
  plan: z.enum(["premium", "vip"]),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export type RegistrationRecord = RegistrationInput & {
  id: string;
  payment_status: "pending" | "paid" | "manual_pending";
  stripe_session_id: string | null;
  created_at: string;
};
