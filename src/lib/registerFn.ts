import { createServerFn } from "@tanstack/react-start";
import { Pool } from "pg";
import { z } from "zod";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const registrationSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().min(6).max(30),
  country: z.string().min(1).max(10),
  level: z.string().min(1).max(20),
  plan: z.string().min(1).max(20),
});

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registrationSchema.parse(data))
  .handler(async ({ data }) => {
    const result = await pool.query(
      `INSERT INTO registrations (full_name, email, whatsapp, country, level, plan)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [data.full_name, data.email, data.whatsapp, data.country, data.level, data.plan],
    );
    return { success: true as const, id: result.rows[0].id as number };
  });
