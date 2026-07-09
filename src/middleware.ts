import { NextResponse, type NextRequest } from "next/server";
import { getAuthProfile, incompleteProfileMessage, isCashier, isCustomer, isManager, isSafeRedirect, roleHome, routeAccess } from "@/lib/auth";
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
      const next = request.nextUrl.searchParams.get("next");
      const profile = await getAuthProfile(supabase, user.id);
      if (!profile) {
        return response;
      }
      if ((isManager(profile) || isCashier(profile)) && !profile.branch_id) {
        return response;
      }

      if (isCustomer(profile) && isSafeRedirect(next)) {
        return NextResponse.redirect(new URL(next, request.url));
      }

      return NextResponse.redirect(new URL(roleHome[profile.role], request.url));
    }

    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const profile = await getAuthProfile(supabase, user.id);

  if (!profile) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", incompleteProfileMessage);
    return NextResponse.redirect(loginUrl);
  }

  if ((isManager(profile) || isCashier(profile)) && !profile.branch_id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", incompleteProfileMessage);
    return NextResponse.redirect(loginUrl);
  }

  if (!access.roles.includes(profile.role)) {
    return NextResponse.redirect(new URL(roleHome[profile.role], request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
