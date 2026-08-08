import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileSpreadsheet, FileText, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import {
  inferResourceKind,
  resourceKindLabel,
  sortCourseResources,
  type ClientCourseResource,
} from "@/lib/course-resources";
import { getCourseResourceDownloadUrl } from "@/lib/fns/course-resources";
import { cn } from "@/lib/utils";

type CourseResourcesPanelProps = {
  courseSlug: string;
  accessToken: string;
  resources: ClientCourseResource[];
};

function ResourceIcon({ resource }: { resource: ClientCourseResource }) {
  const kind = inferResourceKind(resource.contentType, resource.fileName);
  const className = "h-5 w-5 shrink-0 text-success";

  if (kind === "spreadsheet") {
    return <FileSpreadsheet className={className} aria-hidden />;
  }

  return <FileText className={className} aria-hidden />;
}

export function CourseResourcesPanel({
  courseSlug,
  accessToken,
  resources,
}: CourseResourcesPanelProps) {
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const downloadFn = useServerFn(getCourseResourceDownloadUrl);
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

  const downloadResource = async (resource: ClientCourseResource) => {
    setDownloadingId(resource.id);
    try {
      const result = await downloadFn({
        data: {
          courseSlug,
          resourceId: resource.id,
          accessToken,
        },
      });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Téléchargement impossible");
    } finally {
      setDownloadingId(null);
    }
  };

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

      <Panel className="mt-6">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <h3 className="font-display text-lg font-bold">Ressources du cours</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            PDF, Word, ebooks et documents à télécharger.
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={resources.length === 0 ? "Aucune ressource disponible" : "Aucun résultat"}
            description={
              resources.length === 0
                ? "Les documents du cours apparaîtront ici dès qu'ils seront publiés."
                : "Aucune ressource ne correspond à votre recherche."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((resource) => {
              const kind = inferResourceKind(resource.contentType, resource.fileName);
              const loading = downloadingId === resource.id;
              return (
                <li key={resource.id}>
                  <button
                    type="button"
                    onClick={() => void downloadResource(resource)}
                    disabled={loading}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors sm:px-5",
                      "hover:bg-muted/40 disabled:opacity-60",
                    )}
                  >
                    <ResourceIcon resource={resource} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{resource.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {resourceKindLabel(kind)} · {resource.fileName}
                      </p>
                    </div>
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-white">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Download className="h-4 w-4" aria-hidden />
                      )}
                      <span className="sr-only">Télécharger</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
