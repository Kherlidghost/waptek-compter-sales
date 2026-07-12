import Link from "next/link";
import { getAuthProfile, roleHome } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { NotificationBell } from "./notification-bell";
import { SessionNavigation } from "./SessionNavigation";
import { WaptekBrand } from "./WaptekBrand";

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
    <header className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-950/10 backdrop-blur-sm">
      {/* Brand + user identity row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-4 py-4 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <WaptekBrand theme="dark" className="items-center gap-3" />
        </div>

        {userSummary ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-200">
                {roleLabel[userSummary.role as UserRole] ?? userSummary.role}
              </p>
              <p className="max-w-52 truncate text-xs text-slate-300">{userSummary.email}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xs font-black text-slate-950 shadow-sm">
              {userSummary.email.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation + logout row */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
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
