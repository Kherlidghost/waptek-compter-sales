"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Store,
  Boxes,
  MapPin,
  Users,
  Wrench,
  BarChart3,
  Settings,
  FileText,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

type DashboardSidebarProps = {
  role: "admin" | "manager" | "cashier" | "vendor";
  userName: string;
  userRoleLabel: string;
  userInitials: string;
};

const rolePanels: Record<DashboardSidebarProps["role"], { label: string; sections: NavSection[] }> = {
  admin: {
    label: "Admin Panel",
    sections: [
      {
        label: "Main",
        items: [
          { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "8" },
          { href: "/admin/products", label: "Products", icon: Package },
          { href: "/admin/vendors", label: "Vendors", icon: Store, badge: "3" },
          { href: "/admin/inventory", label: "Inventory", icon: Boxes },
        ],
      },
      {
        label: "Management",
        items: [
          { href: "/admin/inventory/movements", label: "Branches", icon: MapPin },
          { href: "/admin/users", label: "Staff / Users", icon: Users },
          { href: "/admin/repairs", label: "Repairs", icon: Wrench, badge: "2" },
          { href: "/admin/reports", label: "Reports", icon: BarChart3 },
        ],
      },
      {
        label: "System",
        items: [
          { href: "/admin/settings", label: "Settings", icon: Settings },
          { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
        ],
      },
    ],
  },
  manager: {
    label: "Manager Panel",
    sections: [
      {
        label: "Main",
        items: [
          { href: "/manager", label: "Dashboard", icon: LayoutDashboard },
          { href: "/manager/orders", label: "Orders", icon: ShoppingBag },
          { href: "/manager/products", label: "Products", icon: Package },
          { href: "/manager/inventory", label: "Inventory", icon: Boxes },
        ],
      },
      {
        label: "Management",
        items: [
          { href: "/manager/repairs", label: "Repairs", icon: Wrench },
          { href: "/manager/reports", label: "Reports", icon: BarChart3 },
          { href: "/manager/settings", label: "Settings", icon: Settings },
        ],
      },
    ],
  },
  cashier: {
    label: "Cashier Panel",
    sections: [
      {
        label: "Main",
        items: [
          { href: "/cashier", label: "Dashboard", icon: LayoutDashboard },
          { href: "/cashier/orders", label: "Orders", icon: ShoppingBag },
          { href: "/cashier/reports", label: "Reports", icon: BarChart3 },
        ],
      },
      {
        label: "System",
        items: [
          { href: "/cashier/settings", label: "Settings", icon: Settings },
        ],
      },
    ],
  },
  vendor: {
    label: "Vendor Panel",
    sections: [
      {
        label: "Main",
        items: [
          { href: "/vendor", label: "Dashboard", icon: LayoutDashboard },
          { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
          { href: "/vendor/products", label: "Products", icon: Package },
          { href: "/vendor/inventory", label: "Inventory", icon: Boxes },
        ],
      },
      {
        label: "Management",
        items: [
          { href: "/vendor/reports", label: "Reports", icon: BarChart3 },
          { href: "/vendor/settings", label: "Settings", icon: Settings },
        ],
      },
    ],
  },
};

function clearAuthCache() {
  const authKeyParts = ["supabase.auth.token", "auth-token", "auth.user", "auth.profile", "auth.role"];

  [window.localStorage, window.sessionStorage].forEach((storage) => {
    try {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (!key) continue;

        const isSupabaseSessionKey = key.startsWith("sb-") && key.endsWith("-auth-token");
        const isAppAuthKey = authKeyParts.some((part) => key.includes(part));

        if (isSupabaseSessionKey || isAppAuthKey) storage.removeItem(key);
      }
    } catch {
      storage.clear();
    }
  });
}

export function DashboardSidebar({ role, userName, userRoleLabel, userInitials }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const panel = rolePanels[role];

  useEffect(() => {
    const handler = () => setIsOpen((current) => !current);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  function isActive(href: string) {
    if (href === `/${role}`) return pathname === href;
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    setIsSigningOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      clearAuthCache();
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
      router.refresh();
      window.location.assign("/?signed_out=1");
    } catch {
      clearAuthCache();
      router.refresh();
      window.location.assign("/?signed_out=1");
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-white/10 bg-[#06253b] text-white shadow-2xl shadow-slate-950/20 transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-[92px] items-center gap-4 border-b border-white/10 px-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b72b9] text-xl font-black text-white shadow-lg shadow-sky-950/30">
            W
          </div>
          <div className="leading-tight">
            <div className="text-lg font-black tracking-tight text-white">WAPTEK</div>
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
              {panel.label}
            </div>
          </div>
          <button
            className="ml-auto rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setIsOpen(false)}
            type="button"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-7">
          {panel.sections.map((section) => (
            <div key={section.label}>
              <span className="block px-3 pb-2 pt-5 text-[11px] font-black uppercase tracking-[0.16em] text-white/35">
                {section.label}
              </span>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-bold transition-all ${
                      active
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="ml-auto rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-black text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/15 text-sm font-black text-emerald-200">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-white">{userName}</div>
              <div className="truncate text-xs capitalize text-slate-300">{userRoleLabel}</div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isSigningOut}
              className="flex items-center justify-center rounded-xl p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Logout"
              type="button"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
