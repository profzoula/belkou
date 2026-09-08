/**
 * Fetch CC-licensed cover images (Openverse) for blog seed articles missing covers.
 * Saves under public/blog/covers/ and updates seed JSON + TS.
 *
 * Usage: node scripts/assign-blog-cover-images.mjs
 *        node scripts/assign-blog-cover-images.mjs --force
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED_JSON = path.join(ROOT, "src/data/astuces-blog-seed.json");
const SEED_TS = path.join(ROOT, "src/data/astuces-blog-seed.ts");
const OUT_DIR = path.join(ROOT, "public/blog/covers");
const OPENVERSE = "https://api.openverse.org/v1/images/";
const UA = "BelKouBlogCovers/1.0 (https://belkou.online; blog cover assignment)";
const FORCE = process.argv.includes("--force");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function searchQueries(post) {
  const title = String(post.title ?? "");
  const cat = String(post.category ?? "");
  const primary = [];

  const push = (q) => {
    if (q && !primary.includes(q)) primary.push(q);
  };

  const rules = [
    [/presse-papiers|clipboard/i, "clipboard keyboard desk"],
    [/god mode/i, "windows settings desk"],
    [/\bRAM\b|Gestionnaire des tâches/i, "computer RAM memory"],
    [/IP publique/i, "public internet laptop"],
    [/\bSSD\b|TRIM|défragment/i, "SSD solid state drive"],
    [/\bVHD\b|disque virtuel/i, "hard disk storage"],
    [/Démarrage rapide|démarrage Windows/i, "computer power button"],
    [/cipher|espace libre/i, "data privacy security"],
    [/\bSFC\b|fichiers système/i, "windows system repair"],
    [/\bDISM\b/i, "windows system image"],
    [/Planificateur de tâches/i, "task schedule calendar"],
    [/\bnetstat\b|\bss\b|ports ouverts/i, "server network ports"],
    [/point de restauration/i, "system backup restore"],
    [/Windows \+ P|mode d’affichage|mode d'affichage/i, "dual monitor desk"],
    [/WinRE|récupération Windows/i, "computer recovery"],
    [/Prefetch/i, "windows cleanup"],
    [/clé produit|WMIC/i, "windows software license"],
    [/\battrib\b|Masquer un fichier/i, "hidden folder files"],
    [/\bchkdsk\b/i, "hard drive check"],
    [/PowerToys|Color Picker/i, "windows desktop tools"],
    [/Wi‑Fi|Wi-Fi|WiFi|wifi/i, "wifi router wireless"],
    [/\bUSMT\b/i, "laptop data migration"],
    [/\bDNS\b|Cloudflare|DNS-over/i, "dns server network"],
    [/Sandbox/i, "virtual machine security"],
    [/RemoteSigned|scripts PowerShell/i, "powershell terminal"],
    [/Registre Windows/i, "windows registry"],
    [/msinfo32/i, "computer hardware"],
    [/télémétrie/i, "privacy settings"],
    [/Media Creation|USB bootable|\bISO\b/i, "usb boot windows"],
    [/\btmux\b/i, "linux terminal multiplexer"],
    [/plus de 100 Mo|espace disque|\bdu\b(?!\s+temps)/i, "disk usage storage"],
    [/journalctl/i, "linux server logs"],
    [/\brsync\b/i, "file backup sync"],
    [/\bchmod\b/i, "linux permissions"],
    [/Ed25519|clé SSH|ssh-copy-id|tunnel SSH|hosts\.allow|clés SSH/i, "ssh keys security"],
    [/\bhtop\b|nice \/ cpulimit|Limiter l’impact CPU/i, "cpu monitoring"],
    [/apt autoremove|paquets inutiles/i, "linux packages"],
    [/\bawk\b/i, "linux awk terminal"],
    [/\bsed\b/i, "linux sed text"],
    [/\bcron\b/i, "linux cron schedule"],
    [/\bnetcat\b|\bnc\b/i, "network port testing"],
    [/tar \+|gzip|Compresser/i, "file archive compression"],
    [/\bgrep\b/i, "grep search code"],
    [/script Bash|shebang/i, "bash shell script"],
    [/\balias\b/i, "linux alias terminal"],
    [/TestDisk/i, "disk partition recovery"],
    [/nethogs/i, "network bandwidth monitor"],
    [/plusieurs serveurs en SSH/i, "servers ssh admin"],
    [/\bfzf\b/i, "developer terminal search"],
    [/\bwatch\b/i, "linux watch command"],
    [/Docker/i, "docker containers"],
    [/mysqldump|MySQL/i, "mysql database backup"],
    [/traceroute/i, "network traceroute"],
    [/\bNmap\b/i, "network security scan"],
    [/\bdig\b|nslookup/i, "dns lookup"],
    [/iperf3/i, "network speed test"],
    [/tcpdump/i, "packet capture network"],
    [/WireGuard/i, "vpn network security"],
    [/iptables/i, "firewall network"],
    [/table ARP/i, "local network"],
    [/Netplan|IP statique/i, "linux network config"],
    [/intelligence artificielle|ChatGPT|Gemini|Claude|Prompt Engineering|IA générative/i, "artificial intelligence"],
    [/créer des images avec/i, "ai art generation"],
    [/réseaux sociaux/i, "social media laptop"],
    [/programmeurs|apprendre à programmer|créer une application/i, "software developer coding"],
    [/cybersécurité/i, "cybersecurity"],
    [/automatiser des tâches/i, "automation workflow"],
    [/métiers qui évoluent|avenir de l/i, "future technology"],
    [/étudiants/i, "students learning laptop"],
    [/outils d’IA|outils d'IA|gagner du temps/i, "ai productivity"],
    [/détecter un contenu/i, "content authenticity"],
    [/apprendre plus rapidement/i, "online learning"],
    [/avantages et les limites/i, "ai technology balance"],
  ];

  for (const [re, q] of rules) {
    if (re.test(title)) push(q);
  }

  if (cat === "Windows") {
    push("windows computer");
    push("desktop PC technology");
  } else if (cat === "Linux") {
    push("linux terminal");
    push("open source computer");
  } else if (cat === "IA") {
    push("artificial intelligence");
    push("machine learning technology");
    push("futuristic technology");
  } else {
    push("technology computer");
  }

  return primary;
}

async function searchOpenverse(query, usedIds, page = 1) {
  const url = new URL(OPENVERSE);
  url.searchParams.set("q", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", "20");
  url.searchParams.set("mature", "false");

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (res.status === 429) {
    await sleep(3000);
    return searchOpenverse(query, usedIds, page);
  }
  if (!res.ok) {
    throw new Error(`Openverse ${res.status}`);
  }
  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];
  for (const item of results) {
    const id = String(item.id || item.identifier || "");
    const src = item.url || item.thumbnail;
    if (!id || !src || usedIds.has(id)) continue;
    if (!/^https?:\/\//i.test(src)) continue;
    return {
      id,
      url: String(src),
      title: String(item.title || ""),
      creator: String(item.creator || ""),
      license: String(item.license || ""),
      foreign_landing_url: String(item.foreign_landing_url || ""),
    };
  }
  return null;
}

async function findImage(queries, usedIds) {
  for (const query of queries) {
    for (const page of [1, 2, 3]) {
      const hit = await searchOpenverse(query, usedIds, page);
      await sleep(1100);
      if (hit) return { hit, query };
    }
  }
  return null;
}

async function downloadImage(url, destBase) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*,*/*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const type = (res.headers.get("content-type") || "").toLowerCase();
  let ext = ".jpg";
  if (type.includes("png")) ext = ".png";
  else if (type.includes("webp")) ext = ".webp";
  else if (type.includes("gif")) ext = ".gif";
  else {
    const m = url.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
    if (m) ext = `.${m[1].toLowerCase().replace("jpeg", "jpg")}`;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1500) throw new Error(`Image too small (${buf.length}b)`);
  const dest = `${destBase}${ext}`;
  fs.writeFileSync(dest, buf);
  return dest;
}

function writeSeed(posts) {
  fs.writeFileSync(SEED_JSON, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    SEED_TS,
    `import type { StoredBlogPost } from "@/lib/blog-blocks";\n\nexport const astucesBlogSeed = ${JSON.stringify(posts, null, 2)} as unknown as StoredBlogPost[];\n`,
    "utf8",
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const posts = JSON.parse(fs.readFileSync(SEED_JSON, "utf8"));
  const usedIds = new Set();
  const metaPath = path.join(OUT_DIR, "_attribution.json");
  const meta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, "utf8"))
    : [];
  for (const m of meta) if (m.openverseId) usedIds.add(m.openverseId);

  // Mark existing local covers as used so we don't re-download unless --force
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const existingFile =
      typeof post.coverImageUrl === "string" &&
      post.coverImageUrl.startsWith("/blog/covers/") &&
      fs.existsSync(path.join(ROOT, "public", post.coverImageUrl.replace(/^\//, "")));

    if (existingFile && !FORCE) {
      skip += 1;
      process.stdout.write(`[${i + 1}/${posts.length}] ${post.id} skip (already set)\n`);
      continue;
    }

    const queries = searchQueries(post);
    process.stdout.write(`[${i + 1}/${posts.length}] ${post.id} ← ${queries[0]} … `);

    try {
      const found = await findImage(queries, usedIds);
      if (!found) throw new Error("No image found");
      const { hit, query } = found;
      usedIds.add(hit.id);

      const destBase = path.join(OUT_DIR, post.id);
      for (const ext of [".jpg", ".jpeg", ".png", ".webp", ".gif"]) {
        const p = destBase + ext;
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
      const saved = await downloadImage(hit.url, destBase);
      const publicPath = `/blog/covers/${path.basename(saved)}`;
      post.coverImageUrl = publicPath;
      if (!post.coverAlt) post.coverAlt = post.title;

      const entry = {
        id: post.id,
        query,
        openverseId: hit.id,
        license: hit.license,
        creator: hit.creator,
        source: hit.foreign_landing_url,
        file: publicPath,
      };
      const idx = meta.findIndex((m) => m.id === post.id);
      if (idx >= 0) meta[idx] = entry;
      else meta.push(entry);

      ok += 1;
      console.log(`OK ${publicPath}`);
      // Persist incrementally so a crash doesn't lose progress
      if (ok % 5 === 0) {
        writeSeed(posts);
        fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
      }
    } catch (err) {
      fail += 1;
      console.log(`FAIL ${err instanceof Error ? err.message : err}`);
    }
  }

  writeSeed(posts);
  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  console.log(`\nDone: ${ok} new, ${skip} skipped, ${fail} failures.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
