import { Progress } from "@/components/ui/progress";

type VideoUploadProgressBarProps = {
  phase: string;
  percent: number;
  fileName?: string;
};

export function VideoUploadProgressBar({ phase, percent, fileName }: VideoUploadProgressBarProps) {
  return (
    <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">{phase}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{percent}%</span>
      </div>
      <Progress value={percent} className="h-2.5" />
      {fileName ? (
        <p className="truncate text-[11px] text-muted-foreground">{fileName}</p>
      ) : null}
    </div>
  );
}
