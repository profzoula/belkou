import { useEffect, useState } from "react";

const TARGET = new Date("2026-05-30T00:00:00-05:00").getTime();

function getTimeLeft() {
  const diff = Math.max(0, TARGET - Date.now());
  return {
    jou:     Math.floor(diff / (1000 * 60 * 60 * 24)),
    èdtan:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minit:   Math.floor((diff / (1000 * 60)) % 60),
    segonn:  Math.floor((diff / 1000) % 60),
  };
}

export function Countdown() {
  const [tl, setTl] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTl(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: "Jou",    val: tl.jou },
    { label: "Èdtan",  val: tl.èdtan },
    { label: "Minit",  val: tl.minit },
    { label: "Segonn", val: tl.segonn },
  ];

  return (
    <div className="animate-fade-up rounded-2xl border border-primary/30 bg-gradient-card shadow-glow px-5 py-4" style={{ animationDelay: "0.46s" }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-3">
        Kòmansman · 30 Me 2026
      </p>
      <div className="flex items-center gap-3">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-3">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground tabular-nums leading-none">
                {String(u.val).padStart(2, "0")}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{u.label}</div>
            </div>
            {i < units.length - 1 && (
              <span className="text-xl font-bold text-primary/40 mb-3">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
