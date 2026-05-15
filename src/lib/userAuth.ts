import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const studentLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().email(), password: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("./supabaseAdmin");
    const admin = getSupabaseAdmin();

    // Sign in via Supabase Auth using service role client
    const { createClient } = await import("@supabase/supabase-js");
    const anonClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
    );

    const { data: authData, error } = await anonClient.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password.trim(),
    });

    if (error || !authData.user) {
      return { success: false as const, user: null };
    }

    // Fetch profile from users table
    const { data: profile } = await admin
      .from("users")
      .select("id, full_name, email, plan")
      .eq("email", data.email.trim().toLowerCase())
      .single();

    const user = {
      id: profile?.id ?? authData.user.id,
      full_name: profile?.full_name ?? authData.user.user_metadata?.full_name ?? "",
      email: authData.user.email ?? "",
      plan: profile?.plan ?? authData.user.user_metadata?.plan ?? "premium",
    };

    return { success: true as const, user };
  });
