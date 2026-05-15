import { useEffect, useState } from "react";

const TARGET = new Date("2026-05-30T00:00:00-05:00").getTime();

function getTimeLeft() {
  const diff = Math.max(0, TARGET - Date.now());
  return {
    j: Math.floor(diff / (1000 * 60 * 60 * 24)),
    h: Math.floor((diff / (1000 * 60 * 60)) % 24),
    m: Math.floor((diff / (1000 * 60)) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

export function Countdown() {
  const [tl, setTl] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTl(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: "Jours",  val: tl.j },
    { label: "Heures", val: tl.h },
    { label: "Min",    val: tl.m },
    { label: "Sec",    val: tl.s },
  ];

  return (
    <div
      className="animate-fade-up inline-flex flex-col rounded-2xl border border-primary/30 bg-gradient-card shadow-glow px-4 py-3"
      style={{ animationDelay: "0.46s" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-2.5">
        Début · 30 mai 2026
      </p>
      <div className="flex items-center gap-2">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-2">
            <div className="text-center w-9">
              <div className="font-display text-2xl font-bold text-foreground tabular-nums leading-none">
                {String(u.val).padStart(2, "0")}
              </div>
              <div className="text-[9px] text-muted-foreground mt-1">{u.label}</div>
            </div>
            {i < units.length - 1 && (
              <span className="text-base font-bold text-primary/40 mb-3">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
