import { z } from "zod";

export function normalizeRegistrationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const registrationSchema = z.object({
  full_name: z.string().trim().min(2, "Nom trop court").max(100),
  email: z.string().trim().email("Email invalide").max(255).transform(normalizeRegistrationEmail),
  whatsapp: z.string().trim().min(6, "Numéro invalide").max(30),
  /** Kept for DB compatibility; checkout no longer asks the student. */
  country: z.string().trim().min(1).default("HT"),
  level: z.string().trim().min(1).default("beginner"),
  plan: z.enum(["premium", "vip", "live"]),
  course_slug: z.string().trim().min(1).optional(),
  referral_code: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v.toUpperCase().replace(/[^A-Z0-9]/g, "") : undefined)),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export type RegistrationPlan = RegistrationInput["plan"];

export function isLiveTicketPlan(plan: string | null | undefined): boolean {
  return plan === "live";
}

export type RegistrationRecord = Omit<RegistrationInput, "course_slug" | "referral_code"> & {
  id: string;
  payment_status: "pending" | "paid" | "manual_pending";
  stripe_session_id: string | null;
  referral_code: string | null;
  course_slug: string | null;
  created_at: string;
  updated_at: string | null;
};
