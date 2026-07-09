import { AdminManagerDashboard } from "@/components/AdminManagerDashboard";
import { DashboardSessionBar } from "@/components/DashboardSessionBar";
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

async function getApprovedVendors() {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vendors")
      .select("id, business_name, branch_id")
      .eq("status", "approved")
      .order("business_name", { ascending: true });

    if (error || !data) return [];

    return (data as VendorOptionRow[]).map((vendor) => ({
      id: vendor.id,
      businessName: vendor.business_name,
      branchId: vendor.branch_id,
    }));
  } catch {
    return [];
  }
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [params, approvedVendors] = await Promise.all([searchParams, getApprovedVendors()]);

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="admin" />
      <OnlineVendorProductForm error={params.error} returnTo="/admin" role="admin" success={params.success} vendors={approvedVendors} />
      <AdminManagerDashboard role="admin" />
      <OnlineOrderStatusPanel role="admin" />
    </main>
  );
}
