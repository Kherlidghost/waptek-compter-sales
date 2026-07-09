import { AdminManagerDashboard } from "@/components/AdminManagerDashboard";
import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { OnlineOrderStatusPanel } from "@/components/OnlineOrderStatusPanel";
import { getAuthProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

function stateToId(state?: string | null) {
  return state?.toLowerCase() ?? undefined;
}

export default async function ManagerDashboardPage() {
  let branch: { name: string; state: string } | null = null;

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
    } catch {
      branch = null;
    }
  }

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="manager" />
      <OnlineOrderStatusPanel role="manager" />
      <AdminManagerDashboard branchLabel={branch?.name ?? "Assigned branch"} branchScopeId={stateToId(branch?.state)} role="manager" />
    </main>
  );
}
