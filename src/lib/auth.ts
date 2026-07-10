import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "./types";

export const incompleteProfileMessage = "Your account profile is incomplete. Please contact support.";
export const emailNotConfirmedMessage = "Please confirm your email before accessing your account.";

export type AuthProfile = {
  id: string;
  role: UserRole;
  branch_id: string | null;
  is_active: boolean;
};

export const roleHome: Record<UserRole, string> = {
  admin: "/admin",
  manager: "/manager",
  cashier: "/cashier",
  vendor: "/vendor",
  customer: "/products",
};

export const protectedRoutes: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/manager", roles: ["manager"] },
  { prefix: "/cashier", roles: ["cashier"] },
  { prefix: "/vendor", roles: ["vendor"] },
  { prefix: "/checkout", roles: ["customer"] },
  { prefix: "/orders", roles: ["admin", "manager", "cashier", "vendor", "customer"] },
  { prefix: "/wishlist", roles: ["customer"] },
  { prefix: "/dashboard", roles: ["admin", "manager", "cashier", "vendor", "customer"] },
];

export function routeAccess(pathname: string) {
  return protectedRoutes.find((route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`));
}

export function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "manager" || value === "cashier" || value === "vendor" || value === "customer";
}

export function isAdmin(profileOrRole: AuthProfile | UserRole | null | undefined) {
  return getRoleValue(profileOrRole) === "admin";
}

export function isManager(profileOrRole: AuthProfile | UserRole | null | undefined) {
  return getRoleValue(profileOrRole) === "manager";
}

export function isCashier(profileOrRole: AuthProfile | UserRole | null | undefined) {
  return getRoleValue(profileOrRole) === "cashier";
}

export function isVendor(profileOrRole: AuthProfile | UserRole | null | undefined) {
  return getRoleValue(profileOrRole) === "vendor";
}

export function isCustomer(profileOrRole: AuthProfile | UserRole | null | undefined) {
  return getRoleValue(profileOrRole) === "customer";
}

export function canViewBranch(profile: AuthProfile | null | undefined, branchId: string | null | undefined) {
  if (!profile || !branchId) return false;
  if (isAdmin(profile)) return true;
  if (isManager(profile) || isCashier(profile)) return profile.branch_id === branchId;
  return false;
}

export function canConfirmPayment(profile: AuthProfile | null | undefined, branchId: string | null | undefined) {
  if (!profile || !branchId) return false;
  return isAdmin(profile) || (isCashier(profile) && profile.branch_id === branchId);
}

export function canManageVendor(profile: AuthProfile | null | undefined) {
  return isAdmin(profile);
}

export function canManageProduct(profile: AuthProfile | null | undefined, ownerVendorProfileId?: string | null) {
  if (!profile) return false;
  if (isAdmin(profile)) return true;
  if (isManager(profile)) return Boolean(profile.branch_id);
  if (isVendor(profile)) return ownerVendorProfileId === profile.id;
  return false;
}

export async function getAuthProfile(supabase: SupabaseClient, userId: string): Promise<AuthProfile | null> {
  const { data } = await supabase.from("profiles").select("id, role, branch_id, is_active").eq("id", userId).maybeSingle();
  if (!data || !isUserRole(data.role)) return null;
  if (data.is_active === false) return null;

  return {
    id: data.id,
    role: data.role,
    branch_id: data.branch_id ?? null,
    is_active: data.is_active ?? true,
  };
}

export function isEmailConfirmed(user: User | null | undefined) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

function getRoleValue(profileOrRole: AuthProfile | UserRole | null | undefined) {
  if (!profileOrRole) return null;
  return typeof profileOrRole === "string" ? profileOrRole : profileOrRole.role;
}

const allowedRedirectPrefixes = [
  "/",
  ...protectedRoutes.map((r) => r.prefix),
  ...Object.values(roleHome),
  "/products",
  "/categories",
  "/repairs",
  "/cart",
  "/order-confirmation",
  "/orders",
];

export function isSafeRedirect(next: string | null): next is string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return false;
  return allowedRedirectPrefixes.some((prefix) => next === prefix || next.startsWith(`${prefix}/`));
}
