type SectionHeaderProps = {
  label: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  label,
  title,
  description,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";

  return (
    <div className={`max-w-2xl mb-8 sm:mb-12 ${alignClass} ${className}`}>
      <p className={`section-label mb-3 ${align === "center" ? "justify-center" : ""}`}>{label}</p>
      <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-semibold tracking-tight text-balance">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
