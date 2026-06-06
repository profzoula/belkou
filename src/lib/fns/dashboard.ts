import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getUserFromAccessToken } from "@/server/supabase-auth";
import { supabaseGetByEmail } from "@/server/supabase-registrations";

export const getStudentDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const user = await getUserFromAccessToken(data.accessToken);
    if (!user?.email) return { registration: null };

    const registration = await supabaseGetByEmail(user.email);
    if (!registration) return { registration: null };

    return {
      registration: {
        id: registration.id,
        plan: registration.plan,
        payment_status: registration.payment_status,
        full_name: registration.full_name,
        created_at: registration.created_at,
      },
    };
  });
