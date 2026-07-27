# Belkou UI folder structure (target)

```text
design-system/belkou/
  MASTER.md                 # Global tokens & rules
  pages/                    # Page-level overrides
    landing.md
src/
  components/
    ui/                     # shadcn primitives
    motion/                 # Framer Motion wrappers (FadeIn, …)
    theme/                  # ThemeProvider, ThemeToggle
    site/                   # Marketing shell (Navbar, Hero, Footer, …)
    course/                 # Catalog, landing, player
    dashboard/              # Student (“buyer”) dashboard
    checkout/               # Checkout conversion
    auth/                   # Login / signup shells
    forum/                  # Community messaging
    admin/                  # Ops (“seller”) dashboard
    services/               # Service booking
  styles.css                # Design tokens (light/dark)
  routes/                   # TanStack file routes
```
