import { useEffect, useState } from "react";

const PROMPT_TEXT = "Koman devni yon PRO nan Vibe Coding sou BelKou?";

export function AuthTypingCard() {
  const [displayed, setDisplayed] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let index = 0;
    let typingTimer: ReturnType<typeof setTimeout>;
    let pauseTimer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const typeNext = () => {
      if (cancelled) return;

      if (index < PROMPT_TEXT.length) {
        index += 1;
        setDisplayed(PROMPT_TEXT.slice(0, index));
        typingTimer = setTimeout(typeNext, 42 + Math.random() * 38);
        return;
      }

      pauseTimer = setTimeout(() => {
        if (cancelled) return;
        index = 0;
        setDisplayed("");
        typingTimer = setTimeout(typeNext, 500);
      }, 2800);
    };

    typingTimer = setTimeout(typeNext, 600);

    return () => {
      cancelled = true;
      clearTimeout(typingTimer);
      clearTimeout(pauseTimer);
    };
  }, []);

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-foreground p-6 shadow-primary">
      <p className="text-sm font-medium text-primary-foreground/75">Posez votre question</p>

      <div className="mt-4 min-h-[88px] rounded-xl border border-primary-foreground/10 bg-black/20 px-4 py-3.5">
        <p className="font-mono text-sm leading-relaxed text-primary-foreground sm:text-[15px]">
          {displayed}
          <span
            className={`ml-px inline-block w-[2px] translate-y-px bg-primary transition-opacity duration-100 ${
              cursorVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{ height: "1.15em" }}
            aria-hidden
          />
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-xs text-primary-foreground/50">
        <span>Formation Vibe Coding par IA</span>
        <span className="shrink-0">Appuyez sur Entrée pour commencer</span>
      </div>
    </div>
  );
}
