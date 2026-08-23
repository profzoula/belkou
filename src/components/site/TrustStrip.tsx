import { BadgeCheck, CircleDollarSign, Headphones, ShieldCheck } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";

const items = [
  { label: "Formateurs\nvérifiés", icon: BadgeCheck },
  { label: "Prix\ntransparents", icon: CircleDollarSign },
  { label: "Accès\nà vie", icon: ShieldCheck },
  { label: "Support\ninclus", icon: Headphones },
] as const;

export function TrustStrip() {
  return (
    <section className="border-y border-border/60 bg-muted/40 py-5 sm:py-7">
      <div className="site-container px-4">
        <FadeIn>
          <ul className="grid grid-cols-4 gap-2 sm:gap-4">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className="flex flex-col items-center gap-2 text-center sm:gap-2.5"
                >
                  <Icon
                    className="size-6 text-muted-foreground sm:size-7"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="whitespace-pre-line text-[10px] font-medium leading-snug text-muted-foreground sm:text-xs md:text-sm">
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
