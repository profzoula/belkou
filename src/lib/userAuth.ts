import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const studentLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().email(), password: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    const SUPA_URL =
      process.env.VITE_SUPABASE_URL ?? "https://jxubkuskszpzsllkbmzv.supabase.co";
    const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

    if (!ANON_KEY) {
      throw new Error(`VITE_SUPABASE_ANON_KEY manke (URL=${SUPA_URL})`);
    }

    const email = data.email.trim().toLowerCase();

    // Call Supabase Auth REST API directly (avoids SSR issues with supabase-js client)
    let res: Response;
    try {
      res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: data.password.trim() }),
      });
    } catch (fetchErr) {
      throw new Error(`fetch echwe: ${String(fetchErr)}`);
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as {
        error_description?: string;
        msg?: string;
      };
      const errorMsg = errBody.error_description ?? errBody.msg ?? `HTTP ${res.status}`;
      return { success: false as const, user: null, errorMsg };
    }

    const authData = await res.json() as {
      user: {
        id: string;
        email: string;
        user_metadata: { full_name?: string; plan?: string };
      };
    };

    if (!authData.user) {
      return { success: false as const, user: null, errorMsg: "Pa gen itilizatè nan repons la" };
    }

    // Fetch profile from users table
    const { getSupabaseAdmin } = await import("./supabaseAdmin");
    const admin = getSupabaseAdmin();

    const { data: profile } = await admin
      .from("users")
      .select("id, full_name, email, plan")
      .eq("email", email)
      .single();

    const user = {
      id: profile?.id ?? authData.user.id,
      full_name:
        profile?.full_name ?? authData.user.user_metadata?.full_name ?? "",
      email: authData.user.email ?? email,
      plan: profile?.plan ?? authData.user.user_metadata?.plan ?? "premium",
    };

    return { success: true as const, user, errorMsg: undefined };
  });
