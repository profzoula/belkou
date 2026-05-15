import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-12 mt-12">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-display font-bold text-foreground">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-primary"><Sparkles className="h-3.5 w-3.5 text-primary-foreground" /></span>
          BelKou Formation
        </div>
        <p>© {new Date().getFullYear()} BelKou France. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
