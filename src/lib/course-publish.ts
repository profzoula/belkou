export function parseScheduledPublishAt(value?: string): number | null {
  if (!value?.trim()) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

export function isScheduledInFuture(
  course: { scheduledPublishAt?: string },
  now = Date.now(),
): boolean {
  const at = parseScheduledPublishAt(course.scheduledPublishAt);
  return at !== null && at > now;
}

/** True when the course should appear on the public site. */
export function isCourseLive(
  course: { published?: boolean; scheduledPublishAt?: string },
  now = Date.now(),
): boolean {
  const scheduled = parseScheduledPublishAt(course.scheduledPublishAt);
  if (scheduled !== null && scheduled <= now) return true;
  if (isScheduledInFuture(course, now)) return false;
  return course.published !== false;
}

export function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

export function formatScheduledPublishLabel(iso: string, locale = "fr-FR"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
