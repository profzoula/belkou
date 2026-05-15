import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const studentLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().email(), password: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { Pool } = await import("pg");
    const { createHash } = await import("node:crypto");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      const hash = createHash("sha256")
        .update(`belkou:${data.password.trim()}`)
        .digest("hex");
      const result = await pool.query(
        "SELECT id, full_name, email, plan FROM users WHERE email = $1 AND password_hash = $2",
        [data.email.trim().toLowerCase(), hash],
      );
      if (result.rows.length === 0) {
        return { success: false as const, user: null };
      }
      const user = result.rows[0] as {
        id: number; full_name: string; email: string; plan: string;
      };
      return { success: true as const, user };
    } finally {
      await pool.end();
    }
  });
