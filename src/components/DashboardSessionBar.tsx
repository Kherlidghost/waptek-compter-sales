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
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <Link href="/" className="text-lg font-black text-slate-950">
          CompuMarket NG
        </Link>
        <p className="mt-1 text-sm capitalize text-slate-500">{role} workspace</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex flex-wrap gap-2 text-sm font-bold">
          <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href={roleHome[role]}>
            Dashboard
          </Link>
          {role === "admin" || role === "manager" || role === "vendor" ? (
            <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href={`/${role}/products`}>
              Products
            </Link>
          ) : null}
          {role === "admin" ? (
            <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href="/admin/vendors">
              Vendors
            </Link>
          ) : null}
          {role === "admin" || role === "manager" || role === "vendor" ? (
            <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href={`/${role}/inventory`}>
              Inventory
            </Link>
          ) : null}
          <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href={roleOrderHref}>
            Orders
          </Link>
          {role === "admin" || role === "manager" || role === "cashier" || role === "vendor" ? (
            <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" href={`/${role}/reports`}>
              Reports
            </Link>
          ) : null}
        </nav>
        <SessionNavigation mode="dashboard" user={userSummary} />
      </div>
    </header>
  );
}
