import { cn } from "@/lib/utils";

type OverviewGaugeProps = {
  centerValue: number;
  defaultLabel: string;
  formatOptions?: Intl.NumberFormatOptions;
  inactiveFillOpacity?: number;
  spacing?: number;
  value: number;
  className?: string;
};

export function OverviewGauge({
  centerValue,
  defaultLabel,
  formatOptions = { style: "currency", currency: "USD", maximumFractionDigits: 0 },
  inactiveFillOpacity = 0.4,
  spacing = 25,
  value,
  className,
}: OverviewGaugeProps) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const radius = 92;
  const stroke = 18;
  const start = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  const clamped = Math.min(100, Math.max(0, value));
  const activeSweep = sweep * (clamped / 100);

  const arc = (from: number, length: number) => {
    const x1 = cx + radius * Math.cos(from);
    const y1 = cy + radius * Math.sin(from);
    const x2 = cx + radius * Math.cos(from + length);
    const y2 = cy + radius * Math.sin(from + length);
    const large = length > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const formatted = new Intl.NumberFormat("en-US", formatOptions).format(centerValue);

  return (
    <div
      className={cn("flex min-w-[300px] flex-1 items-center justify-center", className)}
      style={{ padding: spacing }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full max-h-[280px] max-w-[280px]">
        <circle
          cx={cx}
          cy={cy}
          r={54}
          className="fill-primary/8 dark:fill-primary/15"
        />
        <path
          d={arc(start, sweep)}
          fill="none"
          className="stroke-primary"
          strokeWidth={stroke}
          strokeLinecap="butt"
          opacity={inactiveFillOpacity}
        />
        {clamped > 0 ? (
          <path
            d={arc(start, Math.max(0.04, activeSweep))}
            fill="none"
            className="stroke-primary"
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
        ) : null}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-foreground text-[28px] font-bold tracking-[-0.04em]"
        >
          {formatted}
        </text>
        <text
          x={cx}
          y={cy + 22}
          textAnchor="middle"
          className="fill-muted-foreground text-[12px]"
        >
          {defaultLabel}
        </text>
      </svg>
    </div>
  );
}
