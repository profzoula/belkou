/**
 * Generate SVG UI mockup templates for each design style (course article assets).
 *
 * Usage: node scripts/generate-ui-style-templates.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/images/course/ui-design-styles");

mkdirSync(outDir, { recursive: true });

const W = 960;
const H = 540;

function shell({ bg, body, label, accent = "#2563eb" }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <text x="32" y="44" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="${accent}" font-weight="700" letter-spacing="0.12em">TEMPLATE · ${label.toUpperCase()}</text>
  ${body}
  <rect x="0" y="${H - 4}" width="${W}" height="4" fill="${accent}" opacity="0.85"/>
</svg>`;
}

const templates = [
  {
    slug: "minimalist",
    label: "Minimalist",
    svg: shell({
      bg: "#ffffff",
      accent: "#111827",
      label: "Minimalist",
      body: `
  <rect x="48" y="72" width="864" height="420" rx="16" fill="#ffffff" stroke="#e5e7eb"/>
  <rect x="88" y="112" width="180" height="12" rx="6" fill="#111827"/>
  <rect x="88" y="140" width="320" height="8" rx="4" fill="#d1d5db"/>
  <rect x="88" y="200" width="784" height="1" fill="#f3f4f6"/>
  <rect x="88" y="240" width="240" height="160" rx="12" fill="#fafafa" stroke="#e5e7eb"/>
  <rect x="360" y="240" width="240" height="160" rx="12" fill="#fafafa" stroke="#e5e7eb"/>
  <rect x="632" y="240" width="240" height="160" rx="12" fill="#fafafa" stroke="#e5e7eb"/>
  <rect x="88" y="430" width="120" height="36" rx="18" fill="#111827"/>
  <text x="118" y="453" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#ffffff" text-anchor="middle">Action</text>`,
    }),
  },
  {
    slug: "modern",
    label: "Modern",
    svg: shell({
      bg: "#f8fafc",
      accent: "#0ea5e9",
      label: "Modern",
      body: `
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0ea5e9"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs>
  <rect x="48" y="72" width="864" height="420" rx="24" fill="#ffffff" filter="url(#none)"/>
  <rect x="88" y="112" width="220" height="14" rx="7" fill="#0f172a"/>
  <rect x="88" y="142" width="380" height="10" rx="5" fill="#94a3b8"/>
  <rect x="88" y="190" width="784" height="180" rx="20" fill="url(#g)" opacity="0.12"/>
  <rect x="120" y="220" width="280" height="120" rx="16" fill="#ffffff"/>
  <rect x="120" y="244" width="160" height="10" rx="5" fill="#0f172a"/>
  <rect x="120" y="268" width="220" height="8" rx="4" fill="#cbd5e1"/>
  <rect x="120" y="304" width="96" height="32" rx="10" fill="url(#g)"/>
  <rect x="440" y="220" width="380" height="120" rx="16" fill="#ffffff"/>
  <rect x="472" y="252" width="300" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="472" y="276" width="260" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="472" y="300" width="220" height="8" rx="4" fill="#e2e8f0"/>`,
    }),
  },
  {
    slug: "clean-ui",
    label: "Clean UI",
    svg: shell({
      bg: "#f1f5f9",
      accent: "#059669",
      label: "Clean UI",
      body: `
  <rect x="48" y="72" width="864" height="420" rx="12" fill="#ffffff"/>
  <rect x="48" y="72" width="864" height="56" rx="12" fill="#ffffff"/>
  <rect x="88" y="92" width="120" height="16" rx="4" fill="#059669"/>
  <rect x="720" y="88" width="72" height="28" rx="8" fill="#ecfdf5" stroke="#a7f3d0"/>
  <rect x="88" y="160" width="200" height="280" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>
  <rect x="312" y="160" width="560" height="128" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>
  <rect x="336" y="188" width="200" height="12" rx="6" fill="#0f172a"/>
  <rect x="336" y="212" width="320" height="8" rx="4" fill="#94a3b8"/>
  <rect x="312" y="312" width="268" height="128" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>
  <rect x="604" y="312" width="268" height="128" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>`,
    }),
  },
  {
    slug: "neumorphism",
    label: "Neumorphism",
    svg: shell({
      bg: "#e0e5ec",
      accent: "#64748b",
      label: "Neumorphism",
      body: `
  <defs>
    <filter id="out" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="-8" dy="-8" stdDeviation="8" flood-color="#ffffff"/><feDropShadow dx="8" dy="8" stdDeviation="8" flood-color="#a3b1c6"/></filter>
  </defs>
  <rect x="120" y="120" width="720" height="320" rx="32" fill="#e0e5ec" filter="url(#out)"/>
  <circle cx="240" cy="220" r="48" fill="#e0e5ec" filter="url(#out)"/>
  <rect x="340" y="180" width="420" height="24" rx="12" fill="#e0e5ec" filter="url(#out)"/>
  <rect x="340" y="220" width="320" height="16" rx="8" fill="#e0e5ec" filter="url(#out)"/>
  <rect x="340" y="260" width="180" height="48" rx="24" fill="#e0e5ec" filter="url(#out)"/>
  <rect x="560" y="260" width="180" height="48" rx="24" fill="#e0e5ec" filter="url(#out)"/>`,
    }),
  },
  {
    slug: "glassmorphism",
    label: "Glassmorphism",
    svg: shell({
      bg: "#1e3a8a",
      accent: "#93c5fd",
      label: "Glassmorphism",
      body: `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#312e81"/><stop offset="50%" stop-color="#2563eb"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="780" cy="140" r="120" fill="#ffffff" opacity="0.15"/>
  <circle cx="180" cy="420" r="90" fill="#ffffff" opacity="0.1"/>
  <rect x="120" y="140" width="720" height="280" rx="24" fill="#ffffff" opacity="0.18" stroke="#ffffff" stroke-opacity="0.35"/>
  <rect x="160" y="180" width="280" height="200" rx="16" fill="#ffffff" opacity="0.22" stroke="#ffffff" stroke-opacity="0.4"/>
  <rect x="480" y="180" width="320" height="24" rx="12" fill="#ffffff" opacity="0.85"/>
  <rect x="480" y="220" width="260" height="12" rx="6" fill="#ffffff" opacity="0.55"/>
  <rect x="480" y="260" width="140" height="40" rx="20" fill="#ffffff" opacity="0.75"/>`,
    }),
  },
  {
    slug: "bento-grid",
    label: "Bento Grid",
    svg: shell({
      bg: "#0f172a",
      accent: "#f97316",
      label: "Bento Grid",
      body: `
  <rect x="64" y="96" width="420" height="180" rx="20" fill="#1e293b"/>
  <rect x="504" y="96" width="200" height="180" rx="20" fill="#334155"/>
  <rect x="724" y="96" width="172" height="84" rx="16" fill="#475569"/>
  <rect x="724" y="192" width="172" height="84" rx="16" fill="#64748b"/>
  <rect x="64" y="296" width="200" height="160" rx="20" fill="#334155"/>
  <rect x="284" y="296" width="200" height="160" rx="20" fill="#475569"/>
  <rect x="504" y="296" width="392" height="160" rx="20" fill="#1e293b"/>
  <rect x="96" y="128" width="160" height="12" rx="6" fill="#f8fafc"/>
  <rect x="96" y="152" width="280" height="8" rx="4" fill="#94a3b8"/>`,
    }),
  },
  {
    slug: "dark-mode",
    label: "Dark Mode",
    svg: shell({
      bg: "#09090b",
      accent: "#a78bfa",
      label: "Dark Mode",
      body: `
  <rect x="48" y="72" width="864" height="420" rx="16" fill="#18181b" stroke="#27272a"/>
  <rect x="88" y="112" width="200" height="14" rx="7" fill="#fafafa"/>
  <rect x="88" y="140" width="340" height="8" rx="4" fill="#71717a"/>
  <rect x="88" y="190" width="784" height="220" rx="12" fill="#27272a"/>
  <rect x="120" y="222" width="720" height="8" rx="4" fill="#3f3f46"/>
  <rect x="120" y="246" width="640" height="8" rx="4" fill="#3f3f46"/>
  <rect x="120" y="270" width="560" height="8" rx="4" fill="#3f3f46"/>
  <rect x="120" y="330" width="140" height="40" rx="10" fill="#a78bfa"/>
  <rect x="280" y="330" width="140" height="40" rx="10" fill="#27272a" stroke="#52525b"/>`,
    }),
  },
  {
    slug: "brutalist",
    label: "Brutalist",
    svg: shell({
      bg: "#ffff00",
      accent: "#000000",
      label: "Brutalist",
      body: `
  <rect x="48" y="72" width="864" height="420" fill="#ffffff" stroke="#000000" stroke-width="4"/>
  <text x="88" y="140" font-family="Arial Black, Arial, sans-serif" font-size="48" fill="#000000">BRUTAL UI</text>
  <rect x="88" y="170" width="520" height="8" fill="#000000"/>
  <rect x="88" y="210" width="360" height="200" fill="#000000"/>
  <rect x="468" y="210" width="380" height="96" fill="#ff00ff" stroke="#000000" stroke-width="4"/>
  <rect x="468" y="314" width="380" height="96" fill="#00ffff" stroke="#000000" stroke-width="4"/>
  <text x="108" y="320" font-family="Courier New, monospace" font-size="22" fill="#ffff00">RAW · BOLD · GRID</text>`,
    }),
  },
  {
    slug: "swiss-style",
    label: "Swiss Style",
    svg: shell({
      bg: "#ffffff",
      accent: "#dc2626",
      label: "Swiss Style",
      body: `
  <rect x="48" y="72" width="864" height="420" fill="#ffffff"/>
  <line x1="48" y1="72" x2="48" y2="492" stroke="#dc2626" stroke-width="6"/>
  <rect x="88" y="112" width="8" height="120" fill="#dc2626"/>
  <text x="112" y="150" font-family="Helvetica, Arial, sans-serif" font-size="42" font-weight="700" fill="#111827">Grid</text>
  <text x="112" y="195" font-family="Helvetica, Arial, sans-serif" font-size="42" font-weight="700" fill="#111827">System</text>
  <line x1="88" y1="240" x2="880" y2="240" stroke="#e5e7eb" stroke-width="2"/>
  <rect x="88" y="280" width="250" height="8" fill="#111827"/>
  <rect x="88" y="304" width="380" height="6" fill="#6b7280"/>
  <rect x="88" y="324" width="340" height="6" fill="#6b7280"/>
  <rect x="520" y="280" width="320" height="160" fill="#f3f4f6"/>
  <line x1="680" y1="280" x2="680" y2="440" stroke="#dc2626" stroke-width="2"/>`,
    }),
  },
  {
    slug: "editorial",
    label: "Editorial",
    svg: shell({
      bg: "#faf7f2",
      accent: "#92400e",
      label: "Editorial",
      body: `
  <rect x="48" y="72" width="864" height="420" fill="#faf7f2"/>
  <text x="88" y="130" font-family="Georgia, serif" font-size="14" fill="#92400e" letter-spacing="0.2em">MAGAZINE · FEATURE</text>
  <text x="88" y="190" font-family="Georgia, serif" font-size="52" fill="#1c1917">Design</text>
  <text x="88" y="248" font-family="Georgia, serif" font-size="52" fill="#1c1917">as Story</text>
  <rect x="520" y="120" width="340" height="260" fill="#d6d3d1"/>
  <rect x="88" y="320" width="380" height="8" fill="#78716c"/>
  <rect x="88" y="344" width="420" height="6" fill="#a8a29e"/>
  <rect x="88" y="364" width="400" height="6" fill="#a8a29e"/>
  <rect x="88" y="384" width="360" height="6" fill="#a8a29e"/>`,
    }),
  },
  {
    slug: "material-design",
    label: "Material Design",
    svg: shell({
      bg: "#eceff1",
      accent: "#6200ee",
      label: "Material Design",
      body: `
  <rect x="48" y="72" width="864" height="420" rx="8" fill="#ffffff"/>
  <rect x="48" y="72" width="864" height="64" fill="#6200ee"/>
  <rect x="88" y="96" width="160" height="16" rx="4" fill="#ffffff"/>
  <rect x="88" y="168" width="784" height="120" rx="12" fill="#ffffff" stroke="#e0e0e0"/>
  <rect x="120" y="200" width="200" height="12" rx="6" fill="#212121"/>
  <rect x="120" y="228" width="320" height="8" rx="4" fill="#757575"/>
  <rect x="88" y="320" width="240" height="120" rx="12" fill="#ffffff" stroke="#e0e0e0"/>
  <rect x="352" y="320" width="240" height="120" rx="12" fill="#ffffff" stroke="#e0e0e0"/>
  <rect x="616" y="320" width="256" height="120" rx="12" fill="#ffffff" stroke="#e0e0e0"/>
  <rect x="120" y="400" width="96" height="36" rx="18" fill="#6200ee"/>`,
    }),
  },
  {
    slug: "flat-design",
    label: "Flat Design",
    svg: shell({
      bg: "#3498db",
      accent: "#ffffff",
      label: "Flat Design",
      body: `
  <rect x="48" y="72" width="864" height="420" fill="#ecf0f1"/>
  <rect x="88" y="112" width="784" height="80" fill="#3498db"/>
  <rect x="120" y="140" width="200" height="24" fill="#ffffff"/>
  <rect x="88" y="220" width="240" height="160" fill="#e74c3c"/>
  <rect x="352" y="220" width="240" height="160" fill="#2ecc71"/>
  <rect x="616" y="220" width="256" height="160" fill="#f39c12"/>
  <rect x="120" y="252" width="160" height="12" fill="#ffffff" opacity="0.9"/>
  <rect x="384" y="252" width="160" height="12" fill="#ffffff" opacity="0.9"/>
  <rect x="648" y="252" width="180" height="12" fill="#ffffff" opacity="0.9"/>`,
    }),
  },
  {
    slug: "3d-ui",
    label: "3D UI",
    svg: shell({
      bg: "#111827",
      accent: "#38bdf8",
      label: "3D UI",
      body: `
  <defs><linearGradient id="cube" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs>
  <polygon points="480,140 620,210 480,280 340,210" fill="url(#cube)"/>
  <polygon points="340,210 480,280 480,380 340,310" fill="#2563eb"/>
  <polygon points="480,280 620,210 620,310 480,380" fill="#1d4ed8"/>
  <rect x="120" y="320" width="220" height="120" rx="16" fill="#1f2937" stroke="#374151"/>
  <rect x="620" y="320" width="220" height="120" rx="16" fill="#1f2937" stroke="#374151"/>
  <text x="230" y="392" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#e5e7eb" text-anchor="middle">Depth</text>`,
    }),
  },
  {
    slug: "futuristic",
    label: "Futuristic",
    svg: shell({
      bg: "#020617",
      accent: "#22d3ee",
      label: "Futuristic",
      body: `
  <defs><linearGradient id="fut" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs>
  <rect x="64" y="120" width="832" height="300" rx="8" fill="none" stroke="url(#fut)" stroke-width="2"/>
  <rect x="96" y="152" width="768" height="2" fill="url(#fut)" opacity="0.5"/>
  <text x="96" y="210" font-family="Segoe UI, Arial, sans-serif" font-size="36" fill="#e0f2fe">NEXT GEN INTERFACE</text>
  <rect x="96" y="240" width="320" height="8" rx="4" fill="#22d3ee" opacity="0.6"/>
  <rect x="96" y="264" width="420" height="8" rx="4" fill="#a855f7" opacity="0.5"/>
  <circle cx="820" cy="180" r="6" fill="#22d3ee"/>
  <circle cx="848" cy="180" r="6" fill="#a855f7"/>
  <rect x="96" y="320" width="160" height="44" rx="4" fill="none" stroke="#22d3ee" stroke-width="2"/>`,
    }),
  },
  {
    slug: "aurora-gradient",
    label: "Aurora Gradient UI",
    svg: shell({
      bg: "#0b1020",
      accent: "#f472b6",
      label: "Aurora Gradient UI",
      body: `
  <defs>
    <radialGradient id="a1" cx="30%" cy="30%"><stop offset="0%" stop-color="#22d3ee" stop-opacity="0.8"/><stop offset="100%" stop-color="transparent"/></radialGradient>
    <radialGradient id="a2" cx="70%" cy="60%"><stop offset="0%" stop-color="#a855f7" stop-opacity="0.7"/><stop offset="100%" stop-color="transparent"/></radialGradient>
    <radialGradient id="a3" cx="50%" cy="80%"><stop offset="0%" stop-color="#f472b6" stop-opacity="0.6"/><stop offset="100%" stop-color="transparent"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0b1020"/>
  <rect width="${W}" height="${H}" fill="url(#a1)"/>
  <rect width="${W}" height="${H}" fill="url(#a2)"/>
  <rect width="${W}" height="${H}" fill="url(#a3)"/>
  <rect x="120" y="160" width="720" height="240" rx="28" fill="#ffffff" opacity="0.08" stroke="#ffffff" stroke-opacity="0.2"/>
  <rect x="160" y="210" width="280" height="14" rx="7" fill="#ffffff" opacity="0.9"/>
  <rect x="160" y="244" width="420" height="10" rx="5" fill="#ffffff" opacity="0.55"/>`,
    }),
  },
  {
    slug: "claymorphism",
    label: "Claymorphism",
    svg: shell({
      bg: "#dbeafe",
      accent: "#3b82f6",
      label: "Claymorphism",
      body: `
  <defs>
    <filter id="clay" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#93c5fd" flood-opacity="0.8"/>
      <feDropShadow dx="0" dy="-6" stdDeviation="8" flood-color="#ffffff" flood-opacity="0.9"/>
    </filter>
  </defs>
  <rect x="140" y="130" width="680" height="300" rx="40" fill="#bfdbfe" filter="url(#clay)"/>
  <rect x="200" y="190" width="240" height="180" rx="32" fill="#dbeafe" filter="url(#clay)"/>
  <rect x="480" y="190" width="280" height="56" rx="28" fill="#dbeafe" filter="url(#clay)"/>
  <rect x="480" y="264" width="220" height="56" rx="28" fill="#dbeafe" filter="url(#clay)"/>
  <rect x="480" y="338" width="160" height="56" rx="28" fill="#3b82f6" filter="url(#clay)"/>`,
    }),
  },
  {
    slug: "retro-vintage",
    label: "Retro Vintage",
    svg: shell({
      bg: "#f5e6c8",
      accent: "#b45309",
      label: "Retro Vintage",
      body: `
  <rect x="48" y="72" width="864" height="420" fill="#f5e6c8" stroke="#92400e" stroke-width="3"/>
  <rect x="88" y="112" width="784" height="340" fill="#fff7ed" stroke="#d97706" stroke-width="2"/>
  <text x="480" y="180" font-family="Courier New, monospace" font-size="28" fill="#92400e" text-anchor="middle">★ RETRO TERMINAL ★</text>
  <rect x="140" y="210" width="680" height="180" rx="4" fill="#1c1917"/>
  <text x="160" y="250" font-family="Courier New, monospace" font-size="18" fill="#84cc16">&gt; load design_vintage.exe</text>
  <text x="160" y="285" font-family="Courier New, monospace" font-size="18" fill="#fde68a">Welcome to 1986 UI kit</text>
  <rect x="140" y="410" width="120" height="28" fill="#d97706"/>`,
    }),
  },
  {
    slug: "cyberpunk",
    label: "Cyberpunk",
    svg: shell({
      bg: "#0a0014",
      accent: "#ff0080",
      label: "Cyberpunk",
      body: `
  <rect width="${W}" height="${H}" fill="#0a0014"/>
  <line x1="0" y1="120" x2="${W}" y2="120" stroke="#ff0080" stroke-width="1" opacity="0.4"/>
  <line x1="0" y1="240" x2="${W}" y2="240" stroke="#00ffff" stroke-width="1" opacity="0.25"/>
  <text x="88" y="180" font-family="Segoe UI, Arial, sans-serif" font-size="40" fill="#00ffff">CYBER</text>
  <text x="248" y="180" font-family="Segoe UI, Arial, sans-serif" font-size="40" fill="#ff0080">PUNK</text>
  <rect x="88" y="220" width="784" height="200" fill="none" stroke="#ff0080" stroke-width="2"/>
  <rect x="120" y="260" width="300" height="12" fill="#ff0080"/>
  <rect x="120" y="292" width="420" height="8" fill="#00ffff" opacity="0.7"/>
  <rect x="120" y="320" width="180" height="36" fill="none" stroke="#00ffff" stroke-width="2"/>
  <text x="210" y="344" font-family="monospace" font-size="14" fill="#00ffff" text-anchor="middle">JACK IN</text>`,
    }),
  },
  {
    slug: "luxury-premium",
    label: "Luxury Premium",
    svg: shell({
      bg: "#0c0a09",
      accent: "#d4af37",
      label: "Luxury Premium",
      body: `
  <rect x="48" y="72" width="864" height="420" fill="#0c0a09"/>
  <rect x="88" y="112" width="120" height="1" fill="#d4af37"/>
  <text x="88" y="160" font-family="Georgia, serif" font-size="14" fill="#d4af37" letter-spacing="0.35em">PREMIUM COLLECTION</text>
  <text x="88" y="220" font-family="Georgia, serif" font-size="46" fill="#fafaf9">Refined</text>
  <text x="88" y="278" font-family="Georgia, serif" font-size="46" fill="#fafaf9">Experience</text>
  <rect x="88" y="260" width="360" height="1" fill="#44403c"/>
  <rect x="520" y="140" width="360" height="280" fill="none" stroke="#d4af37" stroke-width="1" opacity="0.6"/>
  <rect x="560" y="180" width="280" height="8" fill="#78716c"/>
  <rect x="560" y="204" width="240" height="6" fill="#57534e"/>
  <rect x="88" y="400" width="160" height="40" rx="0" fill="none" stroke="#d4af37" stroke-width="1"/>
  <text x="168" y="426" font-family="Georgia, serif" font-size="13" fill="#d4af37" text-anchor="middle">Discover</text>`,
    }),
  },
];

for (const template of templates) {
  const path = join(outDir, `${template.slug}.svg`);
  writeFileSync(path, template.svg.trim() + "\n", "utf8");
  console.log(`Wrote ${path}`);
}

console.log(`\nDone — ${templates.length} templates in ${outDir}`);
