import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUserRole, roleHome, routeAccess } from "@/lib/auth";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const session = await updateSession(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const { response, supabase, user } = session;
  const pathname = request.nextUrl.pathname;
  const access = routeAccess(pathname);

  if (!access) {
    if (pathname === "/login" && user) {
      const role = await getRole(supabase, user.id);
      return NextResponse.redirect(new URL(roleHome[role], request.url));
    }

    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = await getRole(supabase, user.id);

  if (!access.roles.includes(role)) {
    return NextResponse.redirect(new URL(roleHome[role], request.url));
  }

  return response;
}

async function getRole(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return isUserRole(data?.role) ? data.role : "customer";
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
