import { SectionHeader } from "@/components/site/SectionHeader";
import { cn } from "@/lib/utils";

type Testimonial = {
  image: string;
  name: string;
  handle: string;
  text: string;
};

const avatar = (id: string) =>
  `https://images.unsplash.com/${id}?w=200&h=200&auto=format&fit=crop&crop=faces`;

const testimonials: Testimonial[] = [
  {
    image: avatar("photo-1557860867-9c099dafe735"),
    name: "Junior Pierre",
    handle: "@juniorpap · Port-au-Prince",
    text: "En 2 semaines, mwen lanse premye sit mwen an epi mwen jwenn premye kliyan mwen an.",
  },
  {
    image: avatar("photo-1573497019236-7936a840583a"),
    name: "Marie-Claire Désir",
    handle: "@mariecap · Cap-Haïtien",
    text: "Mwen pa t janm panse m te kapab kode. BelKou chanje fason m travay ak teknoloji a.",
  },
  {
    image: avatar("photo-1589156191108-c762ff4f2eb4"),
    name: "Wislande Joseph",
    handle: "@wislandeht · Les Cayes",
    text: "Pi bon envestisman mwen fè ane sa a. Mentorat VIP la vo chak dola.",
  },
  {
    image: avatar("photo-1539577192316-49d0f7156853"),
    name: "Mackenson Étienne",
    handle: "@mackjacmel · Jacmel",
    text: "Kou BelKou yo ede m pase de zewo rive nan premye app mwen lanse an production.",
  },
  {
    image: avatar("photo-1531123897727-8f129e168dce"),
    name: "Sherline Volcy",
    handle: "@sherline509 · Gonaïves",
    text: "Fòmasyon klè, kominote aktif — mwen finalman konprann kijan pou m monetize konpetans tech mwen yo.",
  },
  {
    image: avatar("photo-1619895862022-09114a804692"),
    name: "Roodly Alcé",
    handle: "@roodlydiaspora · Montréal",
    text: "Cursor, Supabase, deplwaman : tout eksplike etap pa etap. M rekòmande BelKou 100 %.",
  },
];

const rowOne = testimonials;
const rowTwo = [...testimonials.slice(3), ...testimonials.slice(0, 3)];

function VerifiedBadge() {
  return (
    <svg
      className="mt-0.5 shrink-0 fill-blue-500"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.555.72a4 4 0 0 1-.297.24c-.179.12-.38.202-.59.244a4 4 0 0 1-.38.041c-.48.039-.721.058-.922.129a1.63 1.63 0 0 0-.992.992c-.071.2-.09.441-.129.922a4 4 0 0 1-.041.38 1.6 1.6 0 0 1-.245.59 3 3 0 0 1-.239.297c-.313.368-.47.551-.56.743-.213.444-.213.96 0 1.404.09.192.247.375.56.743.125.146.187.219.24.297.12.179.202.38.244.59.018.093.026.189.041.38.039.48.058.721.129.922.163.464.528.829.992.992.2.071.441.09.922.129.191.015.287.023.38.041.21.042.411.125.59.245.078.052.151.114.297.239.368.313.551.47.743.56.444.213.96.213 1.404 0 .192-.09.375-.247.743-.56.146-.125.219-.187.297-.24.179-.12.38-.202.59-.244a4 4 0 0 1 .38-.041c.48-.039.721-.058.922-.129.464-.163.829-.528.992-.992.071-.2.09-.441.129-.922a4 4 0 0 1 .041-.38c.042-.21.125-.411.245-.59.052-.078.114-.151.239-.297.313-.368.47-.551.56-.743.213-.444.213-.96 0-1.404-.09-.192-.247-.375-.56-.743a4 4 0 0 1-.24-.297 1.6 1.6 0 0 1-.244-.59 3 3 0 0 1-.041-.38c-.039-.48-.058-.721-.129-.922a1.63 1.63 0 0 0-.992-.992c-.2-.071-.441-.09-.922-.129a4 4 0 0 1-.38-.041 1.6 1.6 0 0 1-.59-.245A3 3 0 0 1 7.445.72C7.077.407 6.894.25 6.702.16a1.63 1.63 0 0 0-1.404 0c-.192.09-.375.247-.743.56m4.07 3.998a.488.488 0 0 0-.691-.69l-2.91 2.91-.958-.957a.488.488 0 0 0-.69.69l1.302 1.302c.19.191.5.191.69 0z"
      />
    </svg>
  );
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <article className="mx-4 w-72 shrink-0 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex gap-2.5">
        <img
          src={item.image}
          alt={item.name}
          width={44}
          height={44}
          className="size-11 rounded-full object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-1">
            <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
            <VerifiedBadge />
          </div>
          <span className="truncate text-xs text-muted-foreground">{item.handle}</span>
        </div>
      </div>
      <p className="py-4 text-sm leading-relaxed text-foreground/90">{item.text}</p>
    </article>
  );
}

function TestimonialMarqueeRow({ items, reverse = false }: { items: Testimonial[]; reverse?: boolean }) {
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-20 md:w-28"
        aria-hidden
      />
      <div
        className={cn(
          "flex w-max py-2",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
        )}
      >
        {loop.map((item, index) => (
          <TestimonialCard key={`${item.handle}-${index}`} item={item} />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-20 md:w-40"
        aria-hidden
      />
    </div>
  );
}

export function Testimonials() {
  return (
    <section id="testimonials" className="site-section-anchor overflow-hidden py-16 sm:py-20 md:py-24">
      <div className="site-container mb-8 sm:mb-10">
        <SectionHeader
          label="Témoignages"
          title="Ce que disent nos étudiants"
          description="Des parcours réels — Pòtoprens, Cap-Haïtien, diaspora."
          className="max-w-lg"
        />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-2">
        <TestimonialMarqueeRow items={rowOne} />
        <TestimonialMarqueeRow items={rowTwo} reverse />
      </div>
    </section>
  );
}
