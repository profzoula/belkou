import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { LEGACY_COURSE_SLUG } from "@/lib/course-access";

const searchSchema = z.object({
  plan: z.enum(["premium", "vip"]).optional(),
  ref: z.string().optional(),
});

export const Route = createFileRoute("/register")({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (search.ref) {
      throw redirect({
        to: "/checkout",
        search: { course: LEGACY_COURSE_SLUG, ref: search.ref },
      });
    }

    if (search.plan) {
      throw redirect({
        to: "/checkout",
        search: { plan: search.plan },
      });
    }

    throw redirect({ to: "/courses" });
  },
});
