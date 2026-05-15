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
    const { Pool } = await import("pg");
    const { createHash } = await import("node:crypto");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      const result = await pool.query(
        `INSERT INTO registrations (full_name, email, whatsapp, country, level, plan)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [data.full_name, data.email, data.whatsapp, data.country, data.level, data.plan],
      );

      const tempPassword = generatePassword();
      const hash = createHash("sha256")
        .update(`belkou:${tempPassword}`)
        .digest("hex");

      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, plan)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET full_name=$1, plan=$4`,
        [data.full_name, data.email.toLowerCase(), hash, data.plan],
      );

      return {
        success: true as const,
        id: result.rows[0].id as number,
        tempPassword,
      };
    } finally {
      await pool.end();
    }
  });
