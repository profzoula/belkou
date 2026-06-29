import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  inferResourceKind,
  resourceKindLabel,
  sortCourseResources,
  type CourseResource,
} from "@/lib/course-resources";
import { cn } from "@/lib/utils";

type CourseResourcesPanelProps = {
  resources: CourseResource[];
};

function ResourceIcon({ resource }: { resource: CourseResource }) {
  const kind = inferResourceKind(resource.contentType, resource.fileName);
  const className = "h-5 w-5 shrink-0 text-emerald-600";

  if (kind === "spreadsheet") {
    return <FileSpreadsheet className={className} aria-hidden />;
  }

  return <FileText className={className} aria-hidden />;
}

export function CourseResourcesPanel({ resources }: CourseResourcesPanelProps) {
  const [search, setSearch] = useState("");
  const sorted = useMemo(() => sortCourseResources(resources), [resources]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter(
      (resource) =>
        resource.title.toLowerCase().includes(query) ||
        resource.fileName.toLowerCase().includes(query) ||
        resourceKindLabel(inferResourceKind(resource.contentType, resource.fileName))
          .toLowerCase()
          .includes(query),
    );
  }, [search, sorted]);

  return (
    <div className="mx-auto max-w-3xl px-1 pb-8 pt-2 sm:px-0">
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher une ressource…"
          className="pl-9"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <h3 className="font-display text-lg font-bold">Ressources du cours</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            PDF, Word, ebooks et documents à télécharger.
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground sm:px-5">
            {resources.length === 0
              ? "Aucune ressource disponible pour le moment."
              : "Aucune ressource ne correspond à votre recherche."}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((resource) => {
              const kind = inferResourceKind(resource.contentType, resource.fileName);
              return (
                <li key={resource.id}>
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={resource.fileName}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 transition-colors sm:px-5",
                      "hover:bg-muted/40",
                    )}
                  >
                    <ResourceIcon resource={resource} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{resource.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {resourceKindLabel(kind)} · {resource.fileName}
                      </p>
                    </div>
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Download className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Télécharger</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
