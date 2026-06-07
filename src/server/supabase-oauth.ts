import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";

function getSupabasePublicEnv() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  return { url, anonKey };
}

/** Exchange OAuth ?code= on the server — PKCE verifier must be in request cookies. */
export async function handleOAuthCallback(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const oauthError =
    requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");

  if (oauthError) {
    const message = decodeURIComponent(oauthError.replace(/\+/g, " "));
    return Response.redirect(`${origin}/login?error=${encodeURIComponent(message)}`, 302);
  }

  if (!code) {
    return Response.redirect(`${origin}/login?error=${encodeURIComponent("Connexion impossible.")}`, 302);
  }

  const { url, anonKey } = getSupabasePublicEnv();
  if (!url || !anonKey) {
    return Response.redirect(
      `${origin}/login?error=${encodeURIComponent("Authentification non configurée.")}`,
      302,
    );
  }

  const headers = new Headers();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          headers.append("Set-Cookie", serializeCookieHeader(name, value, options));
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback:", error.message);
    return Response.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`, 302);
  }

  const destination = next.startsWith("/") ? next : `/${next}`;
  headers.set("Location", `${origin}${destination}`);

  return new Response(null, { status: 302, headers });
}
