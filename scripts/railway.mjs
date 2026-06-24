import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Readable } from "node:stream";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = join(root, "dist", "client");
const workerUrl = pathToFileURL(join(root, "dist", "server", "index.js")).href;

function loadDevVars() {
  const devVarsPath = join(root, ".dev.vars");
  if (!existsSync(devVarsPath)) return;

  for (const line of readFileSync(devVarsPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDevVars();

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

if (!existsSync(join(root, "dist", "server", "index.js"))) {
  console.error("Build output missing. Run: npm run build");
  process.exit(1);
}

const worker = (await import(workerUrl)).default;
const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

function toWebRequest(req) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return new Request(url, {
    method: req.method,
    headers: req.headers,
    body: hasBody ? Readable.toWeb(req) : undefined,
    duplex: hasBody ? "half" : undefined,
  });
}

async function sendWebResponse(res, response) {
  res.statusCode = response.status;

  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "transfer-encoding" || lower === "set-cookie") return;
    res.setHeader(key, value);
  });

  for (const cookie of setCookies) {
    res.appendHeader("Set-Cookie", cookie);
  }
  if (!response.body) {
    res.end();
    return;
  }
  Readable.fromWeb(response.body).pipe(res);
}

async function resolveStaticPath(pathname) {
  const relativePath = normalize(pathname)
    .replace(/^(\.\.(\/|\\|$))+/, "")
    .replace(/^[/\\]+/, "");
  if (!relativePath) return null;

  const filePath = join(clientRoot, relativePath);
  if (!filePath.startsWith(clientRoot)) return null;
  if (existsSync(filePath)) return filePath;

  const assetsDir = join(clientRoot, "assets");
  const fileName = relativePath.split(/[/\\]/).pop() ?? "";
  if (fileName.startsWith("styles-") && fileName.endsWith(".css") && existsSync(assetsDir)) {
    const fallback = readdirSync(assetsDir).find(
      (name) => name.startsWith("styles-") && name.endsWith(".css"),
    );
    if (fallback) return join(assetsDir, fallback);
  }

  return null;
}

async function tryStatic(pathname) {
  const filePath = await resolveStaticPath(pathname);
  if (!filePath) return null;
  const relativePath = filePath.slice(clientRoot.length + 1).replace(/\\/g, "/");
  const body = await readFile(filePath);
  const type = MIME[extname(filePath)] ?? "application/octet-stream";
  const cacheControl =
    relativePath === "robots.txt" || relativePath === "sitemap.xml"
      ? "public, max-age=3600"
      : "public, max-age=31536000, immutable";
  return new Response(body, {
    status: 200,
    headers: { "content-type": type, "cache-control": cacheControl },
  });
}

function shouldTryStatic(pathname) {
  return (
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/favicon/") ||
    pathname.startsWith("/logos/") ||
    pathname === "/favicon.ico" ||
    pathname === "/og-image.svg" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    Boolean(extname(pathname))
  );
}

createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`).pathname;
    if (shouldTryStatic(pathname)) {
      const staticResponse = await tryStatic(pathname);
      if (staticResponse) {
        await sendWebResponse(res, staticResponse);
        return;
      }
    }

    const response = await worker.fetch(toWebRequest(req), process.env, {
      waitUntil: (promise) => promise.catch(console.error),
    });
    await sendWebResponse(res, response);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
}).listen(port, host, () => {
  console.log(`BelKou server listening on http://${host}:${port}`);
});
