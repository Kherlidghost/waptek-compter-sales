import { AdminManagerDashboard } from "@/components/AdminManagerDashboard";
import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { OnlineOrderStatusPanel } from "@/components/OnlineOrderStatusPanel";
import { OnlineVendorProductForm } from "@/components/OnlineVendorProductForm";
import { getAuthProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function stateToId(state?: string | null) {
  return state?.toLowerCase() ?? undefined;
}

type VendorOptionRow = {
  id: string;
  business_name: string;
  branch_id: string;
};

type ManagerBranchOption = {
  id: string;
  name: string;
  state: "Adamawa" | "Yobe" | "Borno";
};

export default async function ManagerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  let branch: ManagerBranchOption | null = null;
  let approvedVendors: Array<{ id: string; businessName: string; branchId: string }> = [];
  let productCategories: Array<{ id: string; name: string; slug: string }> = [];
  let productBranches: ManagerBranchOption[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const profile = user ? await getAuthProfile(supabase, user.id) : null;
      const { data } = profile?.branch_id
        ? await supabase.from("branches").select("id, name, state").eq("id", profile.branch_id).maybeSingle()
        : { data: null };
      branch = data as ManagerBranchOption | null;
      if (profile?.branch_id) {
        const [{ data: vendorRows }, { data: categoryRows }] = await Promise.all([
          supabase
            .from("vendors")
            .select("id, business_name, branch_id")
            .eq("status", "approved")
            .eq("branch_id", profile.branch_id)
            .order("business_name", { ascending: true }),
          supabase.from("categories").select("id, name, slug").neq("slug", "repair-services").order("name"),
        ]);
        approvedVendors = ((vendorRows ?? []) as VendorOptionRow[]).map((vendor) => ({
          id: vendor.id,
          businessName: vendor.business_name,
          branchId: vendor.branch_id,
        }));
        productCategories = (categoryRows ?? []) as Array<{ id: string; name: string; slug: string }>;
        productBranches = branch ? [branch] : [];
      }
    } catch {
      branch = null;
      approvedVendors = [];
    }
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen space-y-6 dashboard-shell px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="manager" />
      <AdminManagerDashboard branchLabel={branch?.name ?? "Assigned branch"} branchScopeId={stateToId(branch?.state)} role="manager" />
      <OnlineVendorProductForm
        branches={productBranches}
        categories={productCategories}
        error={params.error}
        lockedBranchId={branch?.id ?? null}
        returnTo="/manager"
        role="manager"
        success={params.success}
        vendors={approvedVendors}
      />
      <OnlineOrderStatusPanel role="manager" />
    </main>
  );
}
