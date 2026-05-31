import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Readable } from "node:stream";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = join(root, "dist", "client");
const workerUrl = pathToFileURL(join(root, "dist", "server", "index.js")).href;

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
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });
  if (!response.body) {
    res.end();
    return;
  }
  Readable.fromWeb(response.body).pipe(res);
}

async function tryStatic(pathname) {
  const safePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(clientRoot, safePath === "/" ? "index.html" : safePath);
  if (!filePath.startsWith(clientRoot) || !existsSync(filePath)) {
    return null;
  }
  const body = await readFile(filePath);
  const type = MIME[extname(filePath)] ?? "application/octet-stream";
  return new Response(body, {
    status: 200,
    headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" },
  });
}

function shouldTryStatic(pathname) {
  return (
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/favicon/") ||
    pathname.startsWith("/logos/") ||
    pathname === "/favicon.ico" ||
    pathname === "/og-image.svg" ||
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
