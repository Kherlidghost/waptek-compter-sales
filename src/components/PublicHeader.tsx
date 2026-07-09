import Link from "next/link";
import { getAuthProfile, roleHome } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import { SessionNavigation } from "./SessionNavigation";

const navItems = [
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/repairs", label: "Repairs" },
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
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-black text-slate-950">
          CompuMarket NG
        </Link>
        <div className="hidden flex-wrap items-center gap-2 text-sm font-semibold md:flex">
          {navItems.map((item) => (
            <Link key={item.href} className="rounded-md px-3 py-2 hover:bg-slate-100" href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/cart">
            Cart
          </Link>
          <SessionNavigation user={userSummary} />
        </div>
        <details className="w-full md:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-slate-200 px-3 py-2 text-sm font-bold">
            Menu
          </summary>
          <div className="mt-3 grid gap-2 text-sm">
            {navItems.map((item) => (
              <Link key={item.href} className="rounded-md px-3 py-2 font-semibold hover:bg-slate-100" href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link className="rounded-md px-3 py-2 font-semibold hover:bg-slate-100" href="/cart">
              Cart
            </Link>
            <SessionNavigation mode="mobile" user={userSummary} />
          </div>
        </details>
      </nav>
    </header>
  );
}
