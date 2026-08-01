"use client";

import { Menu, Search, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type DashboardTopbarProps = {
  showNotificationDot?: boolean;
};

const breadcrumbNames: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  cashier: "Cashier",
  vendor: "Vendor",
  dashboard: "Dashboard",
  orders: "Orders",
  products: "Products",
  vendors: "Vendors",
  inventory: "Inventory",
  branches: "Branches",
  users: "Users",
  repairs: "Repairs",
  reports: "Reports",
  settings: "Settings",
  payments: "Payments",
  notifications: "Notifications",
  "audit-logs": "Audit Logs",
};

export function DashboardTopbar({ showNotificationDot = true }: DashboardTopbarProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: Array<{ label: string; href: string }> = [];

    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const label =
        breadcrumbNames[segment] ??
        segment.charAt(0).toUpperCase() + segment.slice(1);
      crumbs.push({ label, href });
    });

    return crumbs;
  }, [pathname]);

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-6 border-b border-slate-200/80 bg-white/95 px-8 py-4 backdrop-blur">
      <div className="flex items-center gap-4">
        <button
          className="text-slate-700 lg:hidden"
          onClick={() => {
            const event = new Event("toggle-sidebar", { bubbles: true });
            window.dispatchEvent(event);
          }}
          type="button"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-[22px] w-[22px]" />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden text-sm text-slate-500 sm:flex items-center gap-1">
          {breadcrumbs.map((crumb, index) => (
            <>
              {index > 0 ? <span className="mx-1 text-slate-300">/</span> : null}
              <Link
                key={crumb.href}
                href={crumb.href}
                className={`font-medium transition-colors ${
                  index === breadcrumbs.length - 1
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {crumb.label}
              </Link>
            </>
          ))}
        </nav>
        <h1 className="text-lg font-extrabold tracking-tight text-slate-900 sm:hidden">
          {breadcrumbs[breadcrumbs.length - 1]?.label ?? "Dashboard"}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden text-sm font-medium text-slate-500 md:block">{today}</span>

        <div className="relative hidden w-60 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders, products..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 transition-colors placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none"
          />
        </div>

        <button
          className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100"
          type="button"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {showNotificationDot ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-orange-500" />
          ) : null}
        </button>
      </div>
    </header>
  );
}
