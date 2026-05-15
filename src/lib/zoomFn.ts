import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "./supabaseAdmin";

export const getZoomLink = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const url = process.env.ZOOM_URL;
    if (!url) throw new Error("Lyen Zoom pa konfigire.");

    const admin = getSupabaseAdmin();
    const { data: user, error } = await admin
      .from("users")
      .select("id")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();

    if (error || !user) {
      throw new Error("Aksè refize — kont ou pa rekonèt.");
    }

    return { url };
  });
