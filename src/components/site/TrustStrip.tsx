import { BadgeCheck, Headphones, ShieldCheck, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const items = [
  { label: "Formateurs vérifiés", icon: BadgeCheck },
  { label: "Prix transparents", icon: Sparkles },
  { label: "Accès à vie", icon: ShieldCheck },
  { label: "Support inclus", icon: Headphones },
] as const;

export function TrustStrip() {
  return (
    <section className="py-5 sm:py-8">
      <div className="site-container">
        <FadeIn>
          <ul className="grid grid-cols-4 gap-2 sm:gap-4">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:justify-center sm:gap-2.5 sm:rounded-2xl sm:bg-muted/50 sm:px-3 sm:py-3"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-10">
                    <Icon className="size-4 sm:size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="text-[10px] font-semibold leading-tight text-foreground sm:text-sm">
                    {item.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
