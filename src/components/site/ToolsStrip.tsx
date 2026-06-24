const tools = [
  { name: "Cursor", logo: "/logos/cursor.png" },
  { name: "Bolt.new", logo: "/logos/bolt.webp" },
  { name: "Replit", logo: "/logos/Replit.png" },
  { name: "Claude", logo: "/logos/Claude.png" },
  { name: "v0", logo: "/logos/v0.png" },
  { name: "VS Code", logo: "/logos/vscode.png" },
  { name: "GitHub", logo: "/logos/github.svg" },
  { name: "Supabase", logo: "/logos/supabase.png" },
];

function ToolCard({ name, logo, logosOnly }: { name: string; logo: string; logosOnly?: boolean }) {
  if (logosOnly) {
    return (
      <div
        title={name}
        className="group grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-sm"
      >
        <img
          src={logo}
          alt={name}
          className="h-5 w-5 sm:h-6 sm:w-6 object-contain opacity-80 transition-opacity group-hover:opacity-100"
        />
      </div>
    );
  }

  return (
    <div
      title={name}
      className="group flex w-[4.25rem] sm:w-[4.75rem] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card p-2 sm:p-2.5 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <img
        src={logo}
        alt={name}
        className="h-5 w-5 sm:h-6 sm:w-6 object-contain opacity-80 transition-opacity group-hover:opacity-100"
      />
      <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground text-center leading-tight w-full truncate px-0.5">
        {name}
      </span>
    </div>
  );
}

type ToolsStripProps = {
  variant?: "marquee" | "grid";
  align?: "center" | "left";
  bordered?: boolean;
  logosOnly?: boolean;
  showLabel?: boolean;
};

export function ToolsStrip({
  variant = "marquee",
  align = "center",
  bordered = true,
  logosOnly = false,
  showLabel = true,
}: ToolsStripProps) {
  const loop = [...tools, ...tools];
  const labelAlign = align === "left" ? "text-left" : "text-center";

  return (
    <div className={bordered ? "pt-6 sm:pt-8 border-t border-border/70" : ""}>
      {showLabel ? (
        <p
          className={`${labelAlign} text-[11px] sm:text-xs font-medium text-muted-foreground mb-3 sm:mb-4 uppercase tracking-wider`}
        >
          Outils enseignés
        </p>
      ) : null}

      {variant === "grid" ? (
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {tools.map((tool) => (
            <ToolCard key={tool.name} name={tool.name} logo={tool.logo} logosOnly={logosOnly} />
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden marquee-mask">
          <div className="flex w-max gap-2.5 sm:gap-3 animate-marquee py-1">
            {loop.map((tool, i) => (
              <ToolCard key={`${tool.name}-${i}`} name={tool.name} logo={tool.logo} logosOnly={logosOnly} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
