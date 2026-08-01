import { AdminManagerDashboard } from "@/components/AdminManagerDashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OnlineOrderStatusPanel } from "@/components/OnlineOrderStatusPanel";
import { OnlineVendorProductForm } from "@/components/OnlineVendorProductForm";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type VendorOptionRow = {
  id: string;
  business_name: string;
  branch_id: string;
};

async function getAdminProductFormOptions() {
  if (!isSupabaseConfigured()) return { approvedVendors: [], categories: [], branches: [] };

  try {
    const supabase = await createClient();
    const [{ data, error }, { data: categories }, { data: branches }] = await Promise.all([
      supabase
        .from("vendors")
        .select("id, business_name, branch_id")
        .eq("status", "approved")
        .order("business_name", { ascending: true }),
      supabase.from("categories").select("id, name, slug").neq("slug", "repair-services").order("name"),
      supabase.from("branches").select("id, name, state").order("state"),
    ]);

    if (error || !data) return { approvedVendors: [], categories: [], branches: [] };

    return {
      approvedVendors: (data as VendorOptionRow[]).map((vendor) => ({
        id: vendor.id,
        businessName: vendor.business_name,
        branchId: vendor.branch_id,
      })),
      categories: (categories ?? []) as Array<{ id: string; name: string; slug: string }>,
      branches: (branches ?? []) as Array<{ id: string; name: string; state: "Adamawa" | "Yobe" | "Borno" }>,
    };
  } catch {
    return { approvedVendors: [], categories: [], branches: [] };
  }
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [params, options] = await Promise.all([searchParams, getAdminProductFormOptions()]);

  return (
    <DashboardLayout role="admin" title="Dashboard">
      <div className="space-y-8">
        <AdminManagerDashboard role="admin" />
        <OnlineVendorProductForm
          branches={options.branches}
          categories={options.categories}
          error={params.error}
          returnTo="/admin"
          role="admin"
          success={params.success}
          vendors={options.approvedVendors}
        />
        <OnlineOrderStatusPanel role="admin" />
      </div>
    </DashboardLayout>
  );
}
