import { AdminManagerDashboard } from "@/components/AdminManagerDashboard";
import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { OnlineOrderStatusPanel } from "@/components/OnlineOrderStatusPanel";
import { OnlineVendorProductForm } from "@/components/OnlineVendorProductForm";
import { getAuthProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import type { BranchState } from "@/lib/types";

export const dynamic = "force-dynamic";

function stateToId(state?: string | null) {
  return state?.toLowerCase() ?? undefined;
}

type VendorOptionRow = {
  id: string;
  business_name: string;
  branch_id: string;
};

function asBranchState(value?: string | null): BranchState | undefined {
  return value === "Adamawa" || value === "Yobe" || value === "Borno" ? value : undefined;
}

export default async function ManagerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  let branch: { name: string; state: string } | null = null;
  let approvedVendors: Array<{ id: string; businessName: string; branchId: string }> = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const profile = user ? await getAuthProfile(supabase, user.id) : null;
      const { data } = profile?.branch_id
        ? await supabase.from("branches").select("name, state").eq("id", profile.branch_id).maybeSingle()
        : { data: null };
      branch = data;
      if (profile?.branch_id) {
        const { data: vendorRows } = await supabase
          .from("vendors")
          .select("id, business_name, branch_id")
          .eq("status", "approved")
          .eq("branch_id", profile.branch_id)
          .order("business_name", { ascending: true });
        approvedVendors = ((vendorRows ?? []) as VendorOptionRow[]).map((vendor) => ({
          id: vendor.id,
          businessName: vendor.business_name,
          branchId: vendor.branch_id,
        }));
      }
    } catch {
      branch = null;
      approvedVendors = [];
    }
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="manager" />
      <OnlineVendorProductForm
        error={params.error}
        lockedBranchState={asBranchState(branch?.state)}
        returnTo="/manager"
        role="manager"
        success={params.success}
        vendors={approvedVendors}
      />
      <AdminManagerDashboard branchLabel={branch?.name ?? "Assigned branch"} branchScopeId={stateToId(branch?.state)} role="manager" />
      <OnlineOrderStatusPanel role="manager" />
    </main>
  );
}
