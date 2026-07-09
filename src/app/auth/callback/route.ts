import { NextResponse, type NextRequest } from "next/server";
import { isSafeRedirect } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");
  const next = isSafeRedirect(rawNext) ? rawNext : "/products";

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Email confirmation failed. Please request a new confirmation email.");
      return NextResponse.redirect(loginUrl);
    }
  }

  const destination = new URL(next, request.url);
  if (destination.pathname === "/login") {
    destination.searchParams.set("success", "Email confirmed. You can now sign in.");
  }
  return NextResponse.redirect(destination);
}
