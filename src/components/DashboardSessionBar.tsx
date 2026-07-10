import Link from "next/link";
import { getAuthProfile, roleHome } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { SessionNavigation } from "./SessionNavigation";

export async function DashboardSessionBar({ role }: { role: UserRole }) {
  let userSummary = null;
  const roleOrderHref =
    role === "admin" || role === "manager" || role === "cashier" || role === "vendor"
      ? `/${role}/orders`
      : "/orders";

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const profile = await getAuthProfile(supabase, user.id);
      const resolvedRole = profile?.role ?? role;
      userSummary = {
        email: user.email ?? "Signed in",
        role: resolvedRole,
        home: roleHome[resolvedRole],
      };
    }
  }

  return (
    <header className="premium-panel mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-lg font-black text-emerald-300 shadow-lg shadow-slate-950/10" aria-label="CompuMarket NG home">
          CN
        </Link>
        <div>
          <Link href="/" className="text-xl font-black text-slate-950">
            CompuMarket NG
          </Link>
          <p className="mt-1 text-sm font-semibold capitalize text-slate-500">{role} workspace</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex flex-wrap gap-2 text-sm font-bold">
          <Link className="rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-950 hover:text-white" href={roleHome[role]}>
            Dashboard
          </Link>
          {role === "admin" || role === "manager" || role === "vendor" ? (
            <Link className="rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-950 hover:text-white" href={`/${role}/products`}>
              Products
            </Link>
          ) : null}
          {role === "admin" ? (
            <Link className="rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-950 hover:text-white" href="/admin/vendors">
              Vendors
            </Link>
          ) : null}
          {role === "admin" ? (
            <Link className="rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-950 hover:text-white" href="/admin/users">
              Users
            </Link>
          ) : null}
          {role === "admin" || role === "manager" || role === "vendor" ? (
            <Link className="rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-950 hover:text-white" href={`/${role}/inventory`}>
              Inventory
            </Link>
          ) : null}
          <Link className="rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-950 hover:text-white" href={roleOrderHref}>
            Orders
          </Link>
          {role === "admin" || role === "manager" || role === "cashier" || role === "vendor" ? (
            <Link className="rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-950 hover:text-white" href={`/${role}/reports`}>
              Reports
            </Link>
          ) : null}
          {role === "admin" || role === "manager" || role === "cashier" || role === "vendor" ? (
            <Link className="rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-950 hover:text-white" href={`/${role}/settings`}>
              Settings
            </Link>
          ) : null}
        </nav>
        <SessionNavigation mode="dashboard" user={userSummary} />
      </div>
    </header>
  );
}
