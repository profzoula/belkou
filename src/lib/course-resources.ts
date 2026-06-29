export type CourseResource = {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string;
  contentType: string;
  sortOrder: number;
};

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
  return [...resources].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "fr"));
}
