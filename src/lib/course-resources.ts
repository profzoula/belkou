export type CourseResource = {
  id: string;
  title: string;
  /** @deprecated Legacy public URL — use storagePath + signed downloads. */
  fileUrl?: string;
  /** Supabase Storage object path inside the course-resources bucket. */
  storagePath?: string;
  fileName: string;
  contentType: string;
  sortOrder: number;
};

export type ClientCourseResource = Pick<
  CourseResource,
  "id" | "title" | "fileName" | "contentType" | "sortOrder"
>;

const STORAGE_PATH_MARKER = "/course-resources/";

/** Resolve the storage object path from a resource record (new or legacy). */
export function resolveResourceStoragePath(resource: CourseResource): string | null {
  if (resource.storagePath?.trim()) {
    return resource.storagePath.trim();
  }

  const fileUrl = resource.fileUrl?.trim();
  if (!fileUrl) return null;

  try {
    const url = new URL(fileUrl);
    const idx = url.pathname.indexOf(STORAGE_PATH_MARKER);
    if (idx >= 0) {
      return decodeURIComponent(url.pathname.slice(idx + STORAGE_PATH_MARKER.length));
    }
  } catch {
    if (fileUrl.includes(STORAGE_PATH_MARKER)) {
      return decodeURIComponent(fileUrl.split(STORAGE_PATH_MARKER).pop() ?? "");
    }
    if (!fileUrl.includes("://")) {
      return fileUrl;
    }
  }

  return null;
}

export type CourseResourceKind = "pdf" | "word" | "ebook" | "spreadsheet" | "archive" | "file";

export function inferResourceKind(contentType: string, fileName: string): CourseResourceKind {
  const type = contentType.toLowerCase();
  const name = fileName.toLowerCase();

  if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (
    type.includes("word") ||
    type.includes("msword") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return "word";
  }
  if (type.includes("epub") || name.endsWith(".epub") || name.endsWith(".mobi")) return "ebook";
  if (
    type.includes("sheet") ||
    type.includes("excel") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  ) {
    return "spreadsheet";
  }
  if (type.includes("zip") || name.endsWith(".zip") || name.endsWith(".rar")) return "archive";
  return "file";
}

export function resourceKindLabel(kind: CourseResourceKind): string {
  switch (kind) {
    case "pdf":
      return "PDF";
    case "word":
      return "Word";
    case "ebook":
      return "Ebook";
    case "spreadsheet":
      return "Tableur";
    case "archive":
      return "Archive";
    default:
      return "Fichier";
  }
}

export function sortCourseResources(resources: CourseResource[]): CourseResource[] {
  return [...resources].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "fr"),
  );
}
