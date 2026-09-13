import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type OverviewBarChartProps = {
  data: Array<{ day: string; value: number }>;
  className?: string;
};

export function OverviewBarChart({ data, className }: OverviewBarChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 800;
  const height = 200;
  const margin = { top: 8, right: 8, bottom: 40, left: 8 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const max = Math.max(1, ...data.map((row) => row.value));
  const slot = data.length ? innerW / data.length : innerW;
  const gap = slot * 0.1;
  const barW = Math.max(1, slot - gap);
  const labels = useMemo(() => {
    if (data.length === 0) return [];
    const count = Math.min(8, data.length);
    return Array.from({ length: count }, (_, i) =>
      Math.round((i * (data.length - 1)) / Math.max(1, count - 1)),
    );
  }, [data.length]);

  return (
    <div className={cn("relative w-full", className)} style={{ aspectRatio: "4 / 1" }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="size-full" role="img" aria-label="Revenus sur 90 jours">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {[0.25, 0.5, 0.75, 1].map((step) => {
            const y = innerH - innerH * step;
            return (
              <line
                key={step}
                x1={0}
                x2={innerW}
                y1={y}
                y2={y}
                className="stroke-[#e8eaed] dark:stroke-border"
                strokeWidth={1}
              />
            );
          })}
          {data.map((row, index) => {
            const h = (row.value / max) * innerH;
            const x = index * slot + gap / 2;
            const y = innerH - h;
            const active = hover === index;
            return (
              <rect
                key={`${row.day}-${index}`}
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, row.value > 0 ? 2 : 0)}
                className={active ? "fill-primary" : "fill-primary/70"}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
          {labels.map((index) => {
            const row = data[index];
            if (!row) return null;
            return (
              <text
                key={`label-${index}`}
                x={index * slot + slot / 2}
                y={innerH + 24}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px]"
              >
                {row.day}
              </text>
            );
          })}
        </g>
      </svg>
      {hover != null && data[hover] ? (
        <div className="pointer-events-none absolute top-2 right-3 rounded-lg border border-border bg-card px-3 py-1.5 text-xs shadow-md">
          <p className="font-medium text-foreground">{data[hover].day}</p>
          <p className="tabular-nums text-muted-foreground">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(data[hover].value)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
