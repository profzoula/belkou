export function forumAuthorHandle(authorName: string, authorEmail?: string): string {
  const fromEmail = authorEmail?.split("@")[0]?.trim();
  if (fromEmail) {
    return `@${fromEmail.toLowerCase().replace(/[^a-z0-9_]/g, "")}`;
  }

  const slug = authorName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);

  return slug ? `@${slug}` : "@etudiant";
}

export function forumAuthorInitials(authorName: string, authorEmail?: string): string {
  const parts = authorName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (authorEmail ?? "??").slice(0, 2).toUpperCase();
}

export function formatForumTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    const time = new Intl.DateTimeFormat("fr-FR", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
    const day = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
    return `${time} · ${day}`;
  } catch {
    return "";
  }
}
