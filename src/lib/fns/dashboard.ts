import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type { StudentEnrollment } from "@/server/student-enrollments";

export const getStudentDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessToken: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { loadStudentEnrollments } = await import("@/server/student-enrollments");
    const enrollments = await loadStudentEnrollments(data.accessToken);
    return { enrollments };
  });
