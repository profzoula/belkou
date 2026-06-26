import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SerializableService } from "@/lib/service-storage";
import { storedServiceToSerializable } from "@/lib/service-storage";
import { serviceBookingSchema } from "@/lib/schemas/service-booking";
import { siteConfig } from "@/lib/site-config";
import { sendEmail, serviceBookingEmail } from "@/server/email";
import { checkRateLimit, RATE_LIMITS } from "@/server/rate-limit";

export const getPublicServices = createServerFn({ method: "GET" }).handler(async (): Promise<SerializableService[]> => {
  const { getPublishedServices } = await import("@/server/site-content");
  const services = await getPublishedServices();
  return services.map(storedServiceToSerializable);
});

export const getPublicServiceBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<SerializableService | null> => {
    const { getResolvedServiceBySlug } = await import("@/server/site-content");
    const service = await getResolvedServiceBySlug(data.slug);
    if (!service || service.published === false) return null;
    return storedServiceToSerializable(service);
  });

export const submitServiceBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => serviceBookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { getResolvedServiceBySlug } = await import("@/server/site-content");
    const { storedServiceToItem } = await import("@/lib/service-storage");

    const stored = await getResolvedServiceBySlug(data.serviceSlug);
    if (!stored || stored.published === false) {
      throw new Error("Service introuvable.");
    }

    const service = storedServiceToItem(stored);
    if (service.action.type !== "booking") {
      throw new Error("Service introuvable.");
    }

    await checkRateLimit(`service-booking:${data.email.toLowerCase()}`, RATE_LIMITS.register);

    await sendEmail({
      to: siteConfig.contactEmail,
      subject: `[BelKou Services] Rendez-vous — ${service.title} — ${data.name}`,
      html: serviceBookingEmail({
        serviceTitle: service.title,
        name: data.name,
        email: data.email,
        phone: data.phone,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        message: data.message,
      }),
    });

    return { ok: true as const };
  });
