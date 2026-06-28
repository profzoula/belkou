import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  ADMIN_COOKIE_NAME,
  adminCookieHeader,
  clearAdminCookieHeader,
  createAdminToken,
  getAdminCookie,
  getAdminFromRequestSources,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { serializeCourseForAdmin } from "@/lib/admin-courses";
import { siteConfig, getWhatsappGroupUrl } from "@/lib/site-config";
import { getDb, getServerEnvResolved } from "@/server/env";
import { registrationSchema } from "@/lib/schemas/registration";
import { normalizeRegistrationEmail } from "@/lib/schemas/registration";
import {
  getRegistrationByEmail,
  getRegistrationByEmailAndCourse,
  getRegistrationById,
  getRegistrationStats,
  listRegistrations,
  saveRegistration,
  updateRegistrationGrant,
  updateRegistrationPayment,
} from "@/server/db";
import { paymentConfirmedEmail, sendEmail } from "@/server/email";
import { checkRateLimit, RATE_LIMITS } from "@/server/rate-limit";

async function sendPaymentConfirmed(
  fullName: string,
  email: string,
  plan: "premium" | "vip",
) {
  try {
    await sendEmail({
      to: email,
      subject: "Paiement confirmé — BelKou",
      html: paymentConfirmedEmail(
        fullName,
        plan,
        getWhatsappGroupUrl(plan),
        siteConfig.cohortStartDate,
      ),
    });
  } catch (error) {
    console.error("Payment confirmation email error:", error);
  }
}

function isSecureRequest(): boolean {
  return getRequestHeader("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";
}

async function resolveAdminUsername(env: { ADMIN_PASSWORD?: string }): Promise<string | null> {
  return getAdminFromRequestSources(
    {
      cookieHeader: getRequestHeader("cookie") ?? null,
      cookieValue: getCookie(ADMIN_COOKIE_NAME) ?? null,
      authorization: getRequestHeader("authorization") ?? null,
      adminToken: getRequestHeader("x-admin-token") ?? null,
    },
    env.ADMIN_PASSWORD,
  );
}

async function requireAdmin(): Promise<void> {
  const env = await getServerEnvResolved();
  if (!env.ADMIN_PASSWORD) {
    throw new Error("Admin non configuré");
  }
  const admin = await resolveAdminUsername(env);
  if (!admin) {
    throw new Error("Non autorisé");
  }
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        username: z.string().trim().min(1),
        password: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const allowed = checkRateLimit(`admin-login:${data.username}`, RATE_LIMITS.adminLogin.limit, RATE_LIMITS.adminLogin.windowMs);
    if (!allowed) {
      throw new Error("Trop de tentatives. Veuillez réessayer dans quelques minutes.");
    }

    const env = await getServerEnvResolved();
    if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
      throw new Error("Admin non configuré sur le serveur");
    }

    if (data.username !== env.ADMIN_USERNAME || data.password !== env.ADMIN_PASSWORD) {
      throw new Error("Identifiants incorrects");
    }

    const token = await createAdminToken(data.username, env.ADMIN_PASSWORD);
    setResponseHeader("Set-Cookie", adminCookieHeader(token, isSecureRequest()));
    return { ok: true as const, token };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  setResponseHeader("Set-Cookie", clearAdminCookieHeader(isSecureRequest()));
  return { ok: true as const };
});

export const getAdminDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  const [registrations, stats] = await Promise.all([
    listRegistrations(db),
    getRegistrationStats(db),
  ]);

  return {
    stats,
    registrations: registrations.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      email: r.email,
      whatsapp: r.whatsapp,
      country: r.country,
      level: r.level,
      plan: r.plan,
      payment_status: r.payment_status,
      created_at: r.created_at,
    })),
  };
});

export const getAdminOverview = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  const { getResolvedCourses, getServiceBookings } = await import("@/server/site-content");
  const [registrations, stats, courses, serviceBookings] = await Promise.all([
    listRegistrations(db),
    getRegistrationStats(db),
    getResolvedCourses(),
    getServiceBookings(),
  ]);

  let totalLessons = 0;
  let videoLessons = 0;
  let lessonsWithoutVideo = 0;
  let previewLessons = 0;

  const courseSummaries = courses.map((course) => {
    const lessons = course.sections.flatMap((section) => section.lessons);
    const videos = lessons.filter((lesson) => lesson.type === "video");
    const missingVimeo = videos.filter((lesson) => !lesson.vimeo?.trim()).length;
    const previews = lessons.filter((lesson) => lesson.preview).length;

    totalLessons += lessons.length;
    videoLessons += videos.length;
    lessonsWithoutVideo += missingVimeo;
    previewLessons += previews;

    return {
      slug: course.slug,
      title: course.title,
      plan: course.plan ?? "premium",
      lessonCount: lessons.length,
      videoCount: videos.length,
      missingVimeo,
    };
  });

  let affiliateCount = 0;
  let pendingWithdrawals = 0;
  try {
    const { getAdminAffiliateOverview } = await import("@/server/affiliates");
    const affiliateData = await getAdminAffiliateOverview();
    affiliateCount = affiliateData.affiliates.length;
    pendingWithdrawals = affiliateData.withdrawals.filter((w) => w.status === "pending").length;
  } catch {
    // Affiliate tables optional
  }

  return {
    stats,
    content: {
      courseCount: courses.length,
      totalLessons,
      videoLessons,
      lessonsWithoutVideo,
      previewLessons,
      courses: courseSummaries,
    },
    affiliate: {
      affiliateCount,
      pendingWithdrawals,
    },
    services: {
      newBookings: serviceBookings.filter((booking) => booking.status === "new").length,
      totalBookings: serviceBookings.length,
    },
    recentRegistrations: registrations.slice(0, 8).map((r) => ({
      id: r.id,
      full_name: r.full_name,
      email: r.email,
      country: r.country,
      plan: r.plan,
      payment_status: r.payment_status,
      created_at: r.created_at,
    })),
  };
});

export const adminAddCashRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        registration: registrationSchema,
        sendEmail: z.boolean().optional().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();

    const existing = await getRegistrationByEmailAndCourse(
      db,
      data.registration.email,
      data.registration.course_slug ?? null,
    );
    if (existing) {
      throw new Error(
        "Cet email est déjà inscrit à ce cours. Utilisez « Marquer payé » sur l'inscription existante.",
      );
    }

    const record = await saveRegistration(db, data.registration, { payment_status: "paid" });

    if (data.sendEmail) {
      await sendPaymentConfirmed(record.full_name, record.email, record.plan);
    }

    return {
      ok: true as const,
      registration: {
        id: record.id,
        email: record.email,
        full_name: record.full_name,
        plan: record.plan,
        payment_status: record.payment_status,
      },
    };
  });

export const adminMarkCashPaid = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        registrationId: z.string().min(1),
        sendEmail: z.boolean().optional().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();
    const record = await getRegistrationById(db, data.registrationId);

    if (!record) {
      throw new Error("Inscription introuvable");
    }

    if (record.payment_status === "paid") {
      throw new Error("Cette inscription est déjà marquée comme payée");
    }

    await updateRegistrationPayment(db, record.id, { payment_status: "paid" });

    if (data.sendEmail) {
      await sendPaymentConfirmed(record.full_name, record.email, record.plan);
    }

    const { earnAffiliateCommission } = await import("@/server/affiliates");
    await earnAffiliateCommission(record.id);

    return { ok: true as const };
  });

export const adminGrantFreeVip = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        registrationId: z.string().min(1).optional(),
        email: z.string().email().optional(),
        sendEmail: z.boolean().optional().default(true),
      })
      .refine((d) => d.registrationId || d.email, {
        message: "registrationId ou email requis",
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();

    const record = data.registrationId
      ? await getRegistrationById(db, data.registrationId)
      : await getRegistrationByEmail(db, data.email!);

    if (!record) {
      throw new Error("Inscription introuvable");
    }

    const updated = await updateRegistrationGrant(db, record.id, {
      plan: "vip",
      payment_status: "paid",
    });

    if (!updated) {
      throw new Error("Mise à jour impossible");
    }

    if (data.sendEmail) {
      await sendPaymentConfirmed(updated.full_name, updated.email, "vip");
    }

    const { earnAffiliateCommission } = await import("@/server/affiliates");
    await earnAffiliateCommission(updated.id);

    return {
      ok: true as const,
      registration: {
        id: updated.id,
        email: updated.email,
        full_name: updated.full_name,
        plan: updated.plan,
        payment_status: updated.payment_status,
      },
    };
  });

export const getAdminAffiliateOverview = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { getAdminAffiliateOverview: loadOverview } = await import("@/server/affiliates");
  return loadOverview();
});

export const getAdminStudents = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { listAdminStudents } = await import("@/server/admin-students");
  const { getResolvedCourses } = await import("@/server/site-content");
  const [students, courses] = await Promise.all([listAdminStudents(), getResolvedCourses()]);

  return {
    students,
    courses: courses.map((course) => ({
      slug: course.slug,
      title: course.title,
      published: course.published !== false,
    })),
  };
});

export const adminGrantCourseAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().trim().email(),
        courseSlug: z.string().min(1),
        fullName: z.string().trim().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { grantCourseAccessToStudent } = await import("@/server/admin-students");
    const { getResolvedCourseBySlug } = await import("@/server/site-content");

    const course = await getResolvedCourseBySlug(data.courseSlug);
    if (!course) {
      throw new Error("Cours introuvable");
    }

    const record = await grantCourseAccessToStudent({
      email: normalizeRegistrationEmail(data.email),
      courseSlug: data.courseSlug,
      fullName: data.fullName,
    });

    return {
      ok: true as const,
      registration: {
        id: record.id,
        email: record.email,
        full_name: record.full_name,
        course_slug: record.course_slug,
        payment_status: record.payment_status,
      },
      courseTitle: course.title,
    };
  });

export const adminProcessWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        withdrawalId: z.string().min(1),
        action: z.enum(["paid", "rejected"]),
        adminNote: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { processWithdrawal } = await import("@/server/affiliate-withdrawals");
    const result = await processWithdrawal({
      withdrawalId: data.withdrawalId,
      action: data.action,
      adminNote: data.adminNote,
    });

    if (!result.ok) {
      throw new Error(
        result.reason === "not_found"
          ? "Demande introuvable ou déjà traitée"
          : "Impossible de traiter la demande",
      );
    }

    return { ok: true as const };
  });

export const checkAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const env = await getServerEnvResolved();
  if (!env.ADMIN_PASSWORD) return { authenticated: false as const };
  const admin = await resolveAdminUsername(env);
  return { authenticated: Boolean(admin) };
});

export const refreshAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const env = await getServerEnvResolved();
  if (!env.ADMIN_PASSWORD) return { ok: false as const };

  const auth = getRequestHeader("authorization");
  const rawToken =
    getCookie(ADMIN_COOKIE_NAME) ??
    getAdminCookie(getRequestHeader("cookie") ?? null) ??
    (auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : undefined) ??
    getRequestHeader("x-admin-token") ??
    undefined;

  if (!rawToken) return { ok: false as const };
  const admin = await verifyAdminSessionToken(rawToken, env.ADMIN_PASSWORD);
  if (!admin) return { ok: false as const };
  return { ok: true as const, token: rawToken };
});

export const getAdminCourses = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { getCourseOverrides, getResolvedCourses } = await import("@/server/site-content");
  const [courses, overrides] = await Promise.all([getResolvedCourses(), getCourseOverrides()]);
  return {
    courses: courses.map(serializeCourseForAdmin),
    overrides,
  };
});

function adminCoursesResponse(courses: Awaited<ReturnType<typeof import("@/server/site-content").getResolvedCourses>>) {
  return courses.map(serializeCourseForAdmin);
}

export const adminCreateCourse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().min(3),
        slug: z.string().min(2),
        description: z.string().optional(),
        plan: z.enum(["premium", "vip"]).optional(),
        instructor: z.string().optional(),
        free: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { createAdminCourse, getResolvedCourses } = await import("@/server/site-content");

    const result = await createAdminCourse(data);
    if (!result.ok) {
      throw new Error(result.reason ?? "Création impossible");
    }

    return { ok: true as const, courses: adminCoursesResponse(await getResolvedCourses()), createdSlug: data.slug };
  });

export const adminDeleteCourse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { deleteAdminCourse, getResolvedCourses } = await import("@/server/site-content");

    const result = await deleteAdminCourse(data.slug);
    if (!result.ok) {
      throw new Error(result.reason ?? "Suppression impossible");
    }

    return { ok: true as const, courses: adminCoursesResponse(await getResolvedCourses()) };
  });

export const adminUpdateLesson = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1),
        lessonId: z.string().min(1),
        vimeo: z.string().optional(),
        preview: z.boolean().optional(),
        title: z.string().optional(),
        duration: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { updateLessonOverride, getResolvedCourses } = await import("@/server/site-content");

    const result = await updateLessonOverride({
      courseSlug: data.courseSlug,
      lessonId: data.lessonId,
      patch: {
        vimeo: data.vimeo,
        preview: data.preview,
        title: data.title,
        duration: data.duration,
      },
    });

    if (!result.ok) {
      throw new Error(result.reason ?? "Sauvegarde impossible");
    }

    return { ok: true as const, courses: adminCoursesResponse(await getResolvedCourses()) };
  });

export const adminUpdateCourse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        instructor: z.string().optional(),
        price: z.number().min(0).optional(),
        originalPrice: z.number().min(0).optional(),
        plan: z.enum(["premium", "vip"]).optional(),
        skillLevel: z.string().optional(),
        totalDuration: z.string().optional(),
        bestseller: z.boolean().optional(),
        whatYouLearn: z.array(z.string().min(1)).optional(),
        thumbnailLabel: z.string().optional(),
        thumbnailGradient: z.string().optional(),
        thumbnailImageUrl: z.string().optional(),
        published: z.boolean().optional(),
        scheduledPublishAt: z.string().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { updateCourseMeta, getResolvedCourses } = await import("@/server/site-content");
    const { courseSlug, ...patch } = data;

    const result = await updateCourseMeta({ courseSlug, patch });
    if (!result.ok) {
      throw new Error(result.reason ?? "Sauvegarde impossible");
    }

    return { ok: true as const, courses: adminCoursesResponse(await getResolvedCourses()) };
  });

export const adminSetCoursePublished = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ courseSlug: z.string().min(1), published: z.boolean() }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { updateCourseMeta, getResolvedCourses } = await import("@/server/site-content");

    const patch: { published: boolean; scheduledPublishAt?: null } = { published: data.published };
    if (data.published) {
      patch.scheduledPublishAt = null;
    }

    const result = await updateCourseMeta({
      courseSlug: data.courseSlug,
      patch,
    });
    if (!result.ok) {
      throw new Error(result.reason ?? "Mise à jour impossible");
    }

    return { ok: true as const, courses: adminCoursesResponse(await getResolvedCourses()) };
  });

export const adminScheduleCoursePublish = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1),
        scheduledPublishAt: z.string().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { updateCourseMeta, getResolvedCourses } = await import("@/server/site-content");

    let scheduledPublishAt: string | null = null;
    if (data.scheduledPublishAt) {
      const at = Date.parse(data.scheduledPublishAt);
      if (Number.isNaN(at)) {
        throw new Error("Date de publication invalide");
      }
      if (at <= Date.now()) {
        throw new Error("Choisissez une date et une heure dans le futur");
      }
      scheduledPublishAt = new Date(at).toISOString();
    }

    const result = await updateCourseMeta({
      courseSlug: data.courseSlug,
      patch: {
        scheduledPublishAt,
        ...(scheduledPublishAt ? { published: false } : {}),
      },
    });
    if (!result.ok) {
      throw new Error(result.reason ?? "Programmation impossible");
    }

    return { ok: true as const, courses: adminCoursesResponse(await getResolvedCourses()) };
  });

export const adminAddLesson = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1),
        sectionId: z.string().min(1),
        title: z.string().min(1),
        duration: z.string().optional(),
        vimeo: z.string().optional(),
        preview: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { addLessonToCourse, getResolvedCourses } = await import("@/server/site-content");

    const result = await addLessonToCourse({
      courseSlug: data.courseSlug,
      input: {
        sectionId: data.sectionId,
        title: data.title,
        duration: data.duration,
        vimeo: data.vimeo,
        preview: data.preview,
      },
    });

    if (!result.ok) {
      throw new Error(result.reason ?? "Ajout impossible");
    }

    return {
      ok: true as const,
      courses: adminCoursesResponse(await getResolvedCourses()),
      lessonId: result.lessonId,
    };
  });

export const adminAddSection = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ courseSlug: z.string().min(1), title: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { addSectionToCourse, getResolvedCourses } = await import("@/server/site-content");

    const result = await addSectionToCourse({
      courseSlug: data.courseSlug,
      title: data.title,
    });

    if (!result.ok) {
      throw new Error(result.reason ?? "Ajout impossible");
    }

    return {
      ok: true as const,
      courses: adminCoursesResponse(await getResolvedCourses()),
      sectionId: result.sectionId,
    };
  });

export const adminDeleteLesson = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ courseSlug: z.string().min(1), lessonId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { deleteLessonFromCourse, getResolvedCourses } = await import("@/server/site-content");

    const result = await deleteLessonFromCourse({
      courseSlug: data.courseSlug,
      lessonId: data.lessonId,
    });

    if (!result.ok) {
      throw new Error(result.reason ?? "Suppression impossible");
    }

    return { ok: true as const, courses: adminCoursesResponse(await getResolvedCourses()) };
  });

export const adminDeleteSection = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ courseSlug: z.string().min(1), sectionId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { deleteSectionFromCourse, getResolvedCourses } = await import("@/server/site-content");

    const result = await deleteSectionFromCourse({
      courseSlug: data.courseSlug,
      sectionId: data.sectionId,
    });

    if (!result.ok) {
      throw new Error(result.reason ?? "Suppression impossible");
    }

    return { ok: true as const, courses: adminCoursesResponse(await getResolvedCourses()) };
  });

export const adminUploadCourseThumbnail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        courseSlug: z.string().min(1),
        contentType: z.string().min(1),
        dataBase64: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { uploadCourseThumbnail } = await import("@/server/course-thumbnail-storage");
    const { updateCourseMeta, getResolvedCourses } = await import("@/server/site-content");

    const upload = await uploadCourseThumbnail({
      courseSlug: data.courseSlug,
      contentType: data.contentType,
      dataBase64: data.dataBase64,
    });
    if (!upload.ok) {
      throw new Error(upload.reason);
    }

    const result = await updateCourseMeta({
      courseSlug: data.courseSlug,
      patch: { thumbnailImageUrl: upload.publicUrl },
    });
    if (!result.ok) {
      throw new Error(result.reason ?? "Sauvegarde impossible");
    }

    return { ok: true as const, courses: adminCoursesResponse(await getResolvedCourses()) };
  });

export const adminRemoveCourseThumbnail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ courseSlug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { updateCourseMeta, getResolvedCourses } = await import("@/server/site-content");

    const result = await updateCourseMeta({
      courseSlug: data.courseSlug,
      patch: { thumbnailImageUrl: "" },
    });
    if (!result.ok) {
      throw new Error(result.reason ?? "Suppression impossible");
    }

    return { ok: true as const, courses: adminCoursesResponse(await getResolvedCourses()) };
  });

export const getAdminSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { getSiteSettings, getDefaultSiteSettings } = await import("@/server/site-content");
  const settings = await getSiteSettings();
  return { settings, defaults: getDefaultSiteSettings() };
});

export const adminSaveSiteSettings = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        cohortStartDate: z.string().optional(),
        statsStudentsBase: z.number().int().min(0).optional(),
        promoEnabled: z.boolean().optional(),
        promoMessage: z.string().optional(),
        promoMessageShort: z.string().optional(),
        vimeoPreviewDefault: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getSiteSettings, saveSiteSettings } = await import("@/server/site-content");
    const current = await getSiteSettings();
    const next = { ...current, ...data };
    const result = await saveSiteSettings(next);

    if (!result.ok) {
      throw new Error(result.reason ?? "Sauvegarde impossible");
    }

    return { ok: true as const, settings: next };
  });

export const getAdminServices = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { ensureServicesInitialized } = await import("@/server/site-content");
  const services = await ensureServicesInitialized();
  return { services };
});

export const adminCreateService = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().min(2),
        slug: z.string().optional(),
        description: z.string().optional(),
        priceLabel: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { createAdminService, ensureServicesInitialized } = await import("@/server/site-content");

    const result = await createAdminService(data);
    if (!result.ok) {
      throw new Error(result.reason ?? "Création impossible");
    }

    return {
      ok: true as const,
      services: await ensureServicesInitialized(),
      createdSlug: result.service.slug,
    };
  });

export const adminUpdateService = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        slug: z.string().min(1),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        priceLabel: z.string().optional(),
        rating: z.number().min(0).max(5).optional(),
        ratingsCount: z.number().int().min(0).optional(),
        provider: z.string().optional(),
        iconKey: z.enum(["building", "code", "globe", "calculator", "megaphone", "graduation"]).optional(),
        gradient: z.string().optional(),
        imageUrl: z.string().optional(),
        premium: z.boolean().optional(),
        published: z.boolean().optional(),
        deliverables: z.array(z.string().min(1)).optional(),
        deliverablesText: z.string().optional(),
        actionType: z.enum(["booking", "link"]).optional(),
        linkHref: z.string().optional(),
        linkLabel: z.string().optional(),
        sortOrder: z.number().int().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { updateAdminService, ensureServicesInitialized } = await import("@/server/site-content");
    const { slug, ...patch } = data;

    const result = await updateAdminService(slug, patch);
    if (!result.ok) {
      throw new Error(result.reason ?? "Sauvegarde impossible");
    }

    return { ok: true as const, services: await ensureServicesInitialized() };
  });

export const adminDeleteService = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { deleteAdminService, ensureServicesInitialized } = await import("@/server/site-content");

    const result = await deleteAdminService(data.slug);
    if (!result.ok) {
      throw new Error(result.reason ?? "Suppression impossible");
    }

    return { ok: true as const, services: await ensureServicesInitialized() };
  });

export const adminSetServicePublished = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string().min(1), published: z.boolean() }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { updateAdminService, ensureServicesInitialized } = await import("@/server/site-content");

    const result = await updateAdminService(data.slug, { published: data.published });
    if (!result.ok) {
      throw new Error(result.reason ?? "Mise à jour impossible");
    }

    return { ok: true as const, services: await ensureServicesInitialized() };
  });

export const adminUploadServiceImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        serviceSlug: z.string().min(1),
        contentType: z.string().min(1),
        dataBase64: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { uploadServiceImage } = await import("@/server/service-image-storage");
    const { updateAdminService, ensureServicesInitialized } = await import("@/server/site-content");

    const upload = await uploadServiceImage({
      serviceSlug: data.serviceSlug,
      contentType: data.contentType,
      dataBase64: data.dataBase64,
    });
    if (!upload.ok) {
      throw new Error(upload.reason);
    }

    const result = await updateAdminService(data.serviceSlug, { imageUrl: upload.publicUrl });
    if (!result.ok) {
      throw new Error(result.reason ?? "Sauvegarde impossible");
    }

    return { ok: true as const, services: await ensureServicesInitialized() };
  });

export const adminRemoveServiceImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { updateAdminService, ensureServicesInitialized } = await import("@/server/site-content");

    const result = await updateAdminService(data.slug, { imageUrl: "" });
    if (!result.ok) {
      throw new Error(result.reason ?? "Suppression impossible");
    }

    return { ok: true as const, services: await ensureServicesInitialized() };
  });

export const getAdminServiceBookings = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { getServiceBookings } = await import("@/server/site-content");
  const bookings = await getServiceBookings();
  return {
    bookings,
    newCount: bookings.filter((booking) => booking.status === "new").length,
  };
});

export const adminUpdateServiceBookingStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().min(1),
        status: z.enum(["new", "contacted", "closed"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { updateServiceBookingStatus, getServiceBookings } = await import("@/server/site-content");
    const result = await updateServiceBookingStatus(data.id, data.status);
    if (!result.ok) {
      throw new Error(result.reason ?? "Mise à jour impossible");
    }
    const bookings = await getServiceBookings();
    return {
      ok: true as const,
      bookings,
      newCount: bookings.filter((booking) => booking.status === "new").length,
    };
  });
