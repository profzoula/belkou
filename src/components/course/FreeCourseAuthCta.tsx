import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { freeCourseLearnRedirect } from "@/lib/courses";
import { cn } from "@/lib/utils";

type FreeCourseAuthCtaProps = {
  slug: string;
  className?: string;
  stacked?: boolean;
  size?: "sm" | "lg";
};

export function FreeCourseAuthCta({
  slug,
  className,
  stacked = true,
  size = "lg",
}: FreeCourseAuthCtaProps) {
  const redirect = freeCourseLearnRedirect(slug);

  return (
    <div className={cn(stacked ? "flex w-full flex-col gap-2" : "flex flex-wrap gap-2", className)}>
      <Button
        asChild
        variant="hero"
        size={size}
        className={cn("rounded-lg font-semibold", stacked && "w-full")}
      >
        <Link to="/login" search={{ redirect }}>
          Connexion
        </Link>
      </Button>
      <Button
        asChild
        variant="soft"
        size={size}
        className={cn("rounded-lg font-semibold", stacked && "w-full")}
      >
        <Link to="/signup" search={{ redirect }}>
          Créer un compte
        </Link>
      </Button>
    </div>
  );
}
