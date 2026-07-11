import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { getAdminSessionToken } from "./lib/admin-session";

const oauthCallbackMiddleware = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url);
  const isGoogleOAuthReturn =
    url.pathname === "/auth/callback" &&
    request.method === "GET" &&
    url.searchParams.has("code") &&
    !url.searchParams.has("token_hash");

  if (isGoogleOAuthReturn) {
    const { handleOAuthCallback } = await import("@/server/supabase-oauth");
    return handleOAuthCallback(request);
  }

  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [oauthCallbackMiddleware, errorMiddleware],
  serverFns: {
    fetch: (url, init) => {
      const headers = new Headers(init?.headers);
      const token = getAdminSessionToken();
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
        headers.set("X-Admin-Token", token);
      }
      return fetch(url, {
        ...init,
        credentials: "include",
        headers,
      });
    },
  },
}));
