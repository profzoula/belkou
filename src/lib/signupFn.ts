import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(6) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabaseAdmin");
    const admin = getSupabaseAdmin();

    const email = data.email.trim().toLowerCase();

    // 1. Verify the email exists in registrations (proof of payment)
    const { data: reg } = await admin
      .from("registrations")
      .select("full_name, plan, email")
      .eq("email", email)
      .single();

    if (!reg) {
      return {
        success: false as const,
        error: "Imèl sa a pa nan lis enskripsyon yo. Asire w ou te peye epi itilize menm imèl la.",
      };
    }

    // 2. Check if Supabase Auth user already exists
    const { data: listData } = await admin.auth.admin.listUsers();
    const existing = listData?.users?.find((u) => u.email === email);

    if (existing) {
      // Update password for existing user
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        password: data.password,
        email_confirm: true,
      });
      if (error) return { success: false as const, error: error.message };
    } else {
      // Create new auth user
      const { error } = await admin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: reg.full_name, plan: reg.plan },
      });
      if (error) return { success: false as const, error: error.message };
    }

    // 3. Upsert users profile table
    await admin.from("users").upsert(
      { email, full_name: reg.full_name, plan: reg.plan },
      { onConflict: "email" },
    );

    return { success: true as const };
  });
