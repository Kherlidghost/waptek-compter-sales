import Link from "next/link";
import { getAuthProfile, roleHome } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { NotificationBell } from "./notification-bell";
import { SessionNavigation } from "./SessionNavigation";

const roleLabel: Record<UserRole, string> = {
  admin: "Admin Workspace",
  manager: "Branch Manager Workspace",
  cashier: "Cashier Workspace",
  vendor: "Vendor Workspace",
  customer: "My Account",
};

export async function DashboardSessionBar({ role }: { role: UserRole }) {
  let userSummary = null;
  const roleOrderHref =
    role === "admin" || role === "manager" || role === "cashier" || role === "vendor"
      ? `/${role}/orders`
      : "/orders";

  if (isSupabaseConfigured()) {
    try {
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
    } catch {
      userSummary = null;
    }
  }

  return (
    <header className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-950/8 backdrop-blur-sm">
      {/* Brand + user identity row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-emerald-300 shadow-md shadow-slate-950/20"
            aria-label="WAPTEK COMPUTER SERVICES home"
          >
            WCS
          </Link>
          <div>
            <Link href="/" className="block text-base font-black leading-tight text-slate-950 hover:text-emerald-700">
              WAPTEK COMPUTER SERVICES
            </Link>
            <p className="text-xs font-medium leading-tight text-slate-400">Sales of Computers &amp; Repairs</p>
          </div>
        </div>

        {userSummary ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                {roleLabel[userSummary.role as UserRole] ?? userSummary.role}
              </p>
              <p className="max-w-52 truncate text-xs text-slate-500">{userSummary.email}</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white shadow-sm">
              {userSummary.email.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation + logout row */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <nav className="flex flex-wrap gap-1 text-sm font-semibold" aria-label="Dashboard navigation">
          <Link
            className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-950 hover:text-white"
            href={roleHome[role]}
          >
            Dashboard
          </Link>

          {role === "admin" || role === "manager" || role === "vendor" ? (
            <Link
              className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-950 hover:text-white"
              href={`/${role}/products`}
            >
              📦 Products
            </Link>
          ) : null}

          {role === "admin" ? (
            <Link
              className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-950 hover:text-white"
              href="/admin/vendors"
            >
              👥 Vendors
            </Link>
          ) : null}

          {role === "admin" ? (
            <Link
              className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-950 hover:text-white"
              href="/admin/users"
            >
              ⚙ Users
            </Link>
          ) : null}

          {role === "admin" || role === "manager" || role === "vendor" ? (
            <Link
              className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-950 hover:text-white"
              href={`/${role}/inventory`}
            >
              🏪 Inventory
            </Link>
          ) : null}

          <Link
            className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-950 hover:text-white"
            href={roleOrderHref}
          >
            🧾 Orders
          </Link>

          {role === "cashier" ? (
            <Link
              className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-950 hover:text-white"
              href="/cashier"
            >
              💰 Payments
            </Link>
          ) : null}

          {role === "admin" || role === "manager" || role === "cashier" || role === "vendor" ? (
            <Link
              className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-950 hover:text-white"
              href={`/${role}/reports`}
            >
              📊 Reports
            </Link>
          ) : null}

          {role === "admin" || role === "manager" || role === "cashier" || role === "vendor" ? (
            <Link
              className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-950 hover:text-white"
              href={`/${role}/settings`}
            >
              ⚙ Settings
            </Link>
          ) : null}

          {role === "admin" ? (
            <Link
              className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-950 hover:text-white"
              href="/admin/audit-logs"
            >
              🔐 Audit Logs
            </Link>
          ) : null}

          {role === "admin" ? (
            <Link
              className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-950 hover:text-white"
              href="/admin/inventory/movements"
            >
              📋 Stock Movements
            </Link>
          ) : null}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          {userSummary ? <NotificationBell /> : null}
          <SessionNavigation mode="dashboard" user={userSummary} />
        </div>
      </div>
    </header>
  );
}
