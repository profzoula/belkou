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

function ToolCard({ name, logo }: { name: string; logo: string }) {
  return (
    <div
      title={name}
      className="group flex w-[5.5rem] shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-xs transition-all hover:border-primary/25 hover:shadow-sm"
    >
      <img
        src={logo}
        alt={name}
        className="h-6 w-6 object-contain opacity-80 transition-opacity group-hover:opacity-100"
      />
      <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
        {name}
      </span>
    </div>
  );
}

export function ToolsStrip() {
  const loop = [...tools, ...tools];

  return (
    <div className="mt-16 pt-8 border-t border-border/70">
      <p className="text-center text-xs font-medium text-muted-foreground mb-5 uppercase tracking-wider">
        Outils enseignés
      </p>
      <div className="relative overflow-hidden marquee-mask">
        <div className="flex w-max gap-3 animate-marquee py-1">
          {loop.map((tool, i) => (
            <ToolCard key={`${tool.name}-${i}`} name={tool.name} logo={tool.logo} />
          ))}
        </div>
      </div>
    </div>
  );
}
