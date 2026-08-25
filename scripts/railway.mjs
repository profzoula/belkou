import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Readable } from "node:stream";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = join(root, "dist", "client");
const workerUrl = pathToFileURL(join(root, "dist", "server", "index.js")).href;

const execFileAsync = promisify(execFile);

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
const startedAt = Date.now();

function envValue(key) {
  if (key === "SUPABASE_URL") {
    return process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  }
  if (key === "SITE_URL") {
    return process.env.SITE_URL ?? process.env.VITE_SITE_URL;
  }
  return process.env[key];
}

function checkEnvConfig() {
  const required = [
    "SITE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];
  const optional = ["RESEND_API_KEY", "ENABLE_VIDEO_WORKER", "OPS_ALERT_WEBHOOK_URL"];

  const requiredChecks = required.map((key) => ({
    name: key,
    ok: Boolean(envValue(key)),
  }));
  const optionalChecks = optional.map((key) => ({
    name: key,
    ok: Boolean(envValue(key)),
  }));
  const requiredOk = requiredChecks.every((item) => item.ok);

  return {
    requiredOk,
    required: requiredChecks,
    optional: optionalChecks,
  };
}

function healthResponse() {
  const env = checkEnvConfig();
  const status = env.requiredOk ? "ok" : "degraded";
  return new Response(
    JSON.stringify({
      status,
      service: "belkou-web",
      uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      checks: {
        envRequired: env.required,
        envOptional: env.optional,
      },
    }),
    {
      status: env.requiredOk ? 200 : 503,
      headers: { "content-type": "application/json; charset=utf-8" },
    },
  );
}

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

const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com https://checkout.stripe.com",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://www.facebook.com https://connect.facebook.net https://*.facebook.com",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://checkout.stripe.com https://www.facebook.com https://connect.facebook.net",
    "upgrade-insecure-requests",
  ].join("; "),
};

function applySecurityHeaders(res) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!res.getHeader(name)) res.setHeader(name, value);
  }
}

async function sendWebResponse(res, response) {
  res.statusCode = response.status;

  const setCookies =
    typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];

  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "transfer-encoding" || lower === "set-cookie") return;
    res.setHeader(key, value);
  });
  applySecurityHeaders(res);

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

async function logFfmpegStatus() {
  try {
    const { stdout } = await execFileAsync("ffmpeg", ["-version"]);
    const firstLine = stdout.split("\n")[0]?.trim() ?? "ffmpeg OK";
    console.log(`[BelKou] ${firstLine}`);
  } catch {
    console.warn("[BelKou] FFmpeg not found in PATH — HLS conversion disabled until installed");
  }
}

function startVideoWorker() {
  if (process.env.ENABLE_VIDEO_WORKER === "false") {
    console.log("Video worker disabled (ENABLE_VIDEO_WORKER=false)");
    return;
  }

  const workerScript = join(root, "scripts", "process-video-queue.mjs");
  const nodeBin = (process.execPath && process.execPath.trim()) || "node";
  const pollMs = Number(process.env.VIDEO_WORKER_POLL_MS) || 60_000;
  let running = false;

  if (!existsSync(workerScript)) {
    console.warn(`[BelKou] Video worker script missing: ${workerScript}`);
    return;
  }

  const runCycle = () =>
    new Promise((resolve) => {
      try {
        const proc = spawn(nodeBin, [workerScript], {
          cwd: root,
          env: process.env,
          stdio: "inherit",
        });
        proc.on("exit", () => resolve());
        proc.on("error", (error) => {
          console.warn("[BelKou] Video worker unavailable:", error.message);
          resolve();
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn("[BelKou] Video worker spawn failed:", message);
        resolve();
      }
    });

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runCycle();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[BelKou] Video worker cycle failed:", message);
    } finally {
      running = false;
    }
  };

  void tick();
  setInterval(() => void tick(), pollMs);
  console.log(`Video worker active — poll every ${Math.round(pollMs / 1000)}s (requires ffmpeg)`);
}

createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`).pathname;
    if (pathname === "/healthz") {
      await sendWebResponse(res, healthResponse());
      return;
    }
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
    applySecurityHeaders(res);
    res.end("Internal Server Error");
  }
}).listen(port, host, () => {
  console.log(`BelKou server listening on http://${host}:${port}`);
  void logFfmpegStatus();
  startVideoWorker();
});
