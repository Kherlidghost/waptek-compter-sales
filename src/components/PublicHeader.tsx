import Link from "next/link";
import { getAuthProfile, roleHome } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "./notification-bell";
import { SessionNavigation } from "./SessionNavigation";
import { WaptekBrand } from "./WaptekBrand";

const navItems = [
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/repairs", label: "Repairs" },
  { href: "/vendor/register", label: "Become a Vendor" },
];

export async function PublicHeader() {
  let userSummary = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const profile = await getAuthProfile(supabase, user.id);
      if (profile) {
        userSummary = {
          email: user.email ?? "Signed in",
          role: profile.role,
          home: roleHome[profile.role],
        };
      }
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="bg-gradient-to-r from-slate-950 via-primary-900 to-accent-700 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] sm:px-6 lg:px-8">
          <p>Sales of Computers & Repairs across Adamawa, Yobe, and Borno</p>
          <p className="text-slate-200">Receipt-confirmed payments • Verified vendors • Branch support</p>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <WaptekBrand />

        <nav className="hidden items-center gap-1 text-sm font-semibold md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className="rounded-full px-3.5 py-2.5 text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-primary-400"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {userSummary ? <NotificationBell /> : null}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-primary-300 hover:text-primary-700 focus-visible:outline-primary-400"
            aria-label="Shopping cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>
          <SessionNavigation user={userSummary} />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {userSummary ? <NotificationBell /> : null}
          <Link
            href="/cart"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            aria-label="Cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>
          <details className="relative">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Open menu">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </summary>
            <div className="absolute right-0 top-12 z-50 w-72 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-2xl shadow-slate-900/10">
              <nav className="grid gap-1 text-sm" aria-label="Mobile navigation">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    className="rounded-2xl px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-1 border-t border-slate-100" />
                <SessionNavigation mode="mobile" user={userSummary} />
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
