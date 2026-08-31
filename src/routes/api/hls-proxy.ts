import { createFileRoute } from "@tanstack/react-router";
import { looksLikeHlsPlaylist, parsePublicHlsUrl, rewriteHlsPlaylist } from "@/lib/hls-proxy";

export const Route = createFileRoute("/api/hls-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const raw = new URL(request.url).searchParams.get("u")?.trim() ?? "";
        const target = parsePublicHlsUrl(raw);
        if (!target) {
          return new Response("URL HLS invalide.", { status: 400 });
        }

        const upstream = await fetch(target, {
          headers: { Accept: "*/*", "User-Agent": "BelKou-HLS" },
          redirect: "follow",
        }).catch(() => null);

        if (!upstream) {
          return new Response("Stream HLS injoignable.", { status: 502 });
        }
        if (!upstream.ok) {
          return new Response("Stream HLS indisponible.", { status: upstream.status });
        }

        const contentType = upstream.headers.get("content-type") ?? "";
        if (looksLikeHlsPlaylist(target, contentType)) {
          const text = await upstream.text();
          return new Response(rewriteHlsPlaylist(text, target), {
            headers: {
              "Content-Type": "application/vnd.apple.mpegurl",
              "Cache-Control": "no-store",
            },
          });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": contentType || "video/mp2t",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
