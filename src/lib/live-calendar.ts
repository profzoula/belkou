/** Default block reserved in a student's calendar when no end time is known. */
const DEFAULT_DURATION_MS = 90 * 60 * 1000;

function toIcsDate(value: Date): string {
  return `${value.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 caps lines at 75 octets; folded continuations start with a space. */
function foldIcsLine(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    chunks.push(rest.slice(0, 73));
    rest = rest.slice(73);
  }
  chunks.push(rest);
  return chunks.join("\r\n ");
}

export type LiveCalendarEvent = {
  id: string;
  title: string;
  description?: string;
  url: string;
  startIso: string;
  endIso?: string | null;
};

export function buildLiveIcs(event: LiveCalendarEvent): string {
  const start = new Date(event.startIso);
  const end = event.endIso
    ? new Date(event.endIso)
    : new Date(start.getTime() + DEFAULT_DURATION_MS);
  const description = [event.description?.trim(), event.url].filter(Boolean).join("\n\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BelKou//Live//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:live-${event.id}@belkou`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `URL:${escapeIcsText(event.url)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(`${event.title} commence dans 30 minutes`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldIcsLine).join("\r\n");
}

export function icsFileName(title: string): string {
  const slug =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "live";
  return `belkou-${slug}.ics`;
}

export function downloadIcs(event: LiveCalendarEvent): void {
  const blob = new Blob([buildLiveIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = icsFileName(event.title);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
