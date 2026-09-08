import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { INVITE_COOKIE } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/join" ||
    pathname.startsWith("/join/") ||
    pathname.startsWith("/auth/")
  );
}

function copySessionCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });

  from.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === "cache-control" ||
      lower === "expires" ||
      lower === "pragma"
    ) {
      to.headers.set(key, value);
    }
  });
}

function redirectWithSession(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirectResponse = NextResponse.redirect(url);
  copySessionCookies(supabaseResponse, redirectResponse);
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const { pathname } = request.nextUrl;
  const inviteCode = request.nextUrl.searchParams.get("code");

  if (pathname === "/join" && inviteCode) {
    const compact = inviteCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (compact.length >= 6) {
      supabaseResponse.cookies.set(INVITE_COOKIE, compact, {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  }

  if (pathname === "/") {
    return redirectWithSession(
      request,
      supabaseResponse,
      user ? "/dashboard" : "/login",
    );
  }

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(url);
    copySessionCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    return redirectWithSession(request, supabaseResponse, "/dashboard");
  }

  return supabaseResponse;
}
