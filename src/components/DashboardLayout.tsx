import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardTopbar } from "@/components/DashboardTopbar";
import { getAuthProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

type DashboardLayoutProps = {
  role: "admin" | "manager" | "cashier" | "vendor";
  title: string;
  children: React.ReactNode;
};

const roleLabels: Record<string, string> = {
  admin: "Super Admin",
  manager: "Branch Manager",
  cashier: "Cashier",
  vendor: "Vendor",
  customer: "Customer",
};

export async function DashboardLayout({ role, children }: DashboardLayoutProps) {
  let userName = roleLabels[role] ?? role;
  let userInitials = role.charAt(0).toUpperCase();
  let userRoleLabel = roleLabels[role] ?? role;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const profile = await getAuthProfile(supabase, user.id);
        const emailName = user.email?.split("@")[0] ?? userName;
        userName = emailName ?? userName;
        userInitials = userName
          .split(" ")
          .map((part) => part.charAt(0).toUpperCase())
          .slice(0, 2)
          .join("");
        userRoleLabel = roleLabels[profile?.role ?? role] ?? roleLabels[role] ?? role;
      }
    } catch {
      // keep defaults
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] dashboard-shell">
      <DashboardSidebar
        role={role}
        userName={userName}
        userRoleLabel={userRoleLabel}
        userInitials={userInitials}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-[280px]">
        <DashboardTopbar />
        <main className="mx-auto w-full max-w-[1560px] flex-1 px-5 py-8 sm:px-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}
