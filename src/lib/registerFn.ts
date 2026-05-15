import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const registrationSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().min(6).max(30),
  country: z.string().min(1).max(10),
  level: z.string().min(1).max(20),
  plan: z.string().min(1).max(20),
});

function generatePassword(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registrationSchema.parse(data))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabaseAdmin");
    const admin = getSupabaseAdmin();

    // 1. Insert into registrations table
    const { error: regError } = await admin.from("registrations").insert({
      full_name: data.full_name,
      email: data.email.toLowerCase(),
      whatsapp: data.whatsapp,
      country: data.country,
      level: data.level,
      plan: data.plan,
    });
    if (regError) throw new Error(regError.message);

    // 2. Create Supabase Auth user with temp password
    const tempPassword = generatePassword();
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, plan: data.plan },
    });

    if (authError) {
      // If user already exists, update password instead
      if (authError.message.includes("already been registered") || authError.code === "email_exists") {
        const { data: listData } = await admin.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email === data.email.toLowerCase());
        if (existing) {
          await admin.auth.admin.updateUserById(existing.id, { password: tempPassword });
        }
      } else {
        throw new Error(authError.message);
      }
    }

    // 3. Upsert into users table for profile data
    await admin.from("users").upsert({
      email: data.email.toLowerCase(),
      full_name: data.full_name,
      plan: data.plan,
    }, { onConflict: "email" });

    return { success: true as const, tempPassword };
  });
