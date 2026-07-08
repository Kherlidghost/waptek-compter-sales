import type { UserRole } from "./types";

export const roleHome: Record<UserRole, string> = {
  admin: "/admin",
  manager: "/manager",
  cashier: "/cashier",
  vendor: "/vendor",
  customer: "/",
};

export const protectedRoutes: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/manager", roles: ["admin", "manager"] },
  { prefix: "/cashier", roles: ["admin", "manager", "cashier"] },
  { prefix: "/vendor", roles: ["vendor"] },
  { prefix: "/cart", roles: ["admin", "manager", "cashier", "vendor", "customer"] },
  { prefix: "/checkout", roles: ["admin", "manager", "cashier", "vendor", "customer"] },
  { prefix: "/orders", roles: ["admin", "manager", "cashier", "vendor", "customer"] },
  { prefix: "/wishlist", roles: ["admin", "manager", "cashier", "vendor", "customer"] },
  { prefix: "/dashboard", roles: ["admin", "manager", "cashier", "vendor", "customer"] },
];

export function routeAccess(pathname: string) {
  return protectedRoutes.find((route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`));
}

export function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "manager" || value === "cashier" || value === "vendor" || value === "customer";
}
