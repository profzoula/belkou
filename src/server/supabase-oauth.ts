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

  const isSecure = requestUrl.protocol === "https:";

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: {
      secure: isSecure,
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "").map((cookie) => ({
          name: cookie.name,
          value: cookie.value ?? "",
        }));
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
    const message = error.message.includes("PKCE")
      ? "Connexion Google interrompue. Réessayez dans le même navigateur (pas en navigation privée)."
      : error.message;
    return Response.redirect(`${origin}/login?error=${encodeURIComponent(message)}`, 302);
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    const cookieRef = parseCookieHeader(request.headers.get("Cookie") ?? "").find(
      (c) => c.name === "belkou_ref",
    )?.value;
    const ephemeralReferralCode = cookieRef ? decodeURIComponent(cookieRef) : null;

    if (user?.id && user.email) {
      const { claimSignupReferralFromTrustedSources } = await import("@/server/affiliates");
      const { normalizeRegistrationEmail } = await import("@/lib/schemas/registration");
      // Cookie may bind referred_by only for brand-new accounts; late ?ref= is ignored.
      await claimSignupReferralFromTrustedSources({
        userId: user.id,
        email: normalizeRegistrationEmail(user.email),
        createdAt: user.created_at,
        ephemeralReferralCode,
      });
    }

    headers.append(
      "Set-Cookie",
      serializeCookieHeader("belkou_ref", "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: isSecure,
      }),
    );
  } catch (referralError) {
    console.warn("[BelKou] OAuth signup referral:", referralError);
  }

  const destination = next.startsWith("/") ? next : `/${next}`;
  headers.set("Location", `${origin}${destination}`);

  return new Response(null, { status: 302, headers });
}
