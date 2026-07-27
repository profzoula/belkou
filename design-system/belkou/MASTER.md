# Belkou Design System — Master

> When building a page, check `design-system/belkou/pages/[page].md` first.
> Page files override this Master. Otherwise follow rules below.

**Project:** Belkou (https://belkou.online)  
**Product:** Premium online education / cohort courses (not a marketplace)  
**Inspiration:** Stripe · Linear · Vercel · Notion · Framer  
**Updated:** 2026-07-26

---

## Product surface map

| Brief term (generic) | Belkou equivalent |
|----------------------|-------------------|
| Landing | `/` |
| Marketplace / Categories / Search | `/courses` catalog |
| Product Details | `/courses/$slug` |
| Buyer Dashboard | `/dashboard` (Mes cours) |
| Seller Dashboard | `/admin` (ops) |
| Messaging | `/forum` |
| Checkout | `/checkout` |
| Auth / Profile | `/login` `/signup` `/dashboard#account` |

Do **not** invent marketplace, seller storefronts, or DMs unless product scope expands.

---

## Color palette (source of truth)

| Role | Hex | Token |
|------|-----|-------|
| Primary | `#0046D5` | `--primary` |
| Secondary / surfaces | `#FFFFFF` | `--card` |
| Accent | `#FFC107` | `--brand-accent` |
| Success | `#16A34A` | `--success` |
| Background | `#F8FAFC` | `--background` |
| Text | `#0F172A` | `--foreground` |
| Muted text | `#64748B` | `--muted-foreground` |

Dark mode: deep slate navy (`#0B1220` bg), primary lightened for contrast (`#3B82F6`), accent unchanged for CTAs that need warmth.

### Contrast (WCAG AA)
- Primary on white / white on primary: body & buttons ≥ 4.5:1
- Accent (`#FFC107`) is for highlights/stars — not primary button text on white
- Focus ring uses primary with 2px offset

---

## Typography

| Role | Family | Weight |
|------|--------|--------|
| Display / H1–H3 | **Poppins** | 600–700 |
| Body / UI | **Inter** | 400–600 |
| Code | IBM Plex Mono | 400–500 |

Scale (mobile → desktop): H1 2.25–3.75rem · H2 1.5–2.25rem · body 0.9375–1rem · large section gaps 4–6rem.

---

## Layout & spacing

- Mobile-first; breakpoints 375 / 768 / 1024 / 1440
- Section vertical: `py-16 md:py-24`
- Content max: `site-container` (~1120–1200px)
- Prefer large whitespace over dense cards
- Hero: one composition — brand, one headline, one line of support, one CTA group, one full-bleed visual plane

---

## Motion

- Library: Framer Motion
- Micro-interactions: 150–300ms, ease-out
- Page reveals: opacity + `translateY(12px)`, staggered ≤ 80ms
- Respect `prefers-reduced-motion: reduce`
- Animate `transform` / `opacity` only

---

## Components (stack)

- React 19 + TanStack Start/Router
- Tailwind CSS v4 + CSS variables
- shadcn/ui in `src/components/ui`
- Lucide icons (no emoji icons)
- Motion primitives in `src/components/motion`
- Theme: `src/components/theme` (light / dark / system)

---

## Anti-patterns

- Purple-indigo default AI look (replaced by `#0046D5`)
- Marketplace UI for a course product
- Hero cards, floating badges, stat strips above the fold
- Infinite decorative bounce animations
- Hardcoded indigo/slate utility colors instead of tokens

---

## Phase roadmap

1. **Foundation** — tokens, fonts, theme, motion, landing shell ✅
2. **Conversion** — courses catalog, course detail, checkout, auth ✅
3. **Learning** — dashboard, forum ✅
4. **Ops / player** — admin shell + course player chrome ✅

Next (optional polish): services pages, remaining admin tab badges, About/FAQ visual pass.
