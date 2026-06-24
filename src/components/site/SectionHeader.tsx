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
  align = "center",
  className = "",
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";

  return (
    <div className={`max-w-2xl mb-10 sm:mb-14 ${alignClass} ${className}`}>
      <p className={`section-label mb-3 ${align === "center" ? "justify-center" : ""}`}>{label}</p>
      <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-balance">
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground mt-4 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
