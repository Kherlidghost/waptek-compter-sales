import Link from "next/link";
import { updateVendorProfile } from "@/app/vendors/actions";
import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { OnlineOrderStatusPanel } from "@/components/OnlineOrderStatusPanel";
import { OnlineVendorProductForm } from "@/components/OnlineVendorProductForm";
import { StatusBadge } from "@/components/StatusBadge";
import { VendorDashboard } from "@/components/VendorDashboard";
import { getAuthProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type VendorRow = {
  id: string;
  branch_id: string;
  business_name: string;
  owner_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  city: string | null;
  business_type: string | null;
  status: string;
  rejection_reason: string | null;
  suspension_reason: string | null;
  approved_at: string | null;
  created_at: string;
};

export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  let vendor: VendorRow | null = null;
  let categoryRows: Array<{ id: string; name: string; slug: string }> = [];
  let branchData: { id: string; name: string; state: "Adamawa" | "Yobe" | "Borno" } | null = null;
  let loadError = "";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const profile = user ? await getAuthProfile(supabase, user.id) : null;
      const { data: vendorData } = profile
        ? await supabase.from("vendors").select("id, branch_id, business_name, owner_name, business_email, business_phone, business_address, city, business_type, status, rejection_reason, suspension_reason, approved_at, created_at").eq("profile_id", profile.id).maybeSingle()
        : { data: null };
      vendor = vendorData as VendorRow | null;
      const [{ data: categories }, { data: branch }] = await Promise.all([
        supabase.from("categories").select("id, name, slug").neq("slug", "repair-services").order("name"),
        vendor?.branch_id ? supabase.from("branches").select("id, name, state").eq("id", vendor.branch_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      categoryRows = (categories ?? []) as Array<{ id: string; name: string; slug: string }>;
      branchData = branch as { id: string; name: string; state: "Adamawa" | "Yobe" | "Borno" } | null;
    } catch {
      loadError = "Vendor dashboard data could not be loaded. Please refresh or sign in again.";
    }
  } else {
    loadError = "Supabase is not configured for this deployment.";
  }

  return (
    <main className="min-h-screen space-y-6 dashboard-shell px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="vendor" />
      {loadError ? <p className="mx-auto max-w-7xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{loadError}</p> : null}
      {!vendor ? (
        <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase text-emerald-700">Vendor onboarding required</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Submit your vendor application</h1>
          <p className="mt-2 text-sm text-slate-600">Vendor tools become available after you submit the registration form and admin approves your business.</p>
          <Link className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white" href="/become-a-vendor">Become a Vendor</Link>
        </section>
      ) : vendor.status !== "approved" ? (
        <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-700">Vendor application</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">{vendor.business_name}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {vendor.status === "pending"
                  ? "Your application is pending admin review."
                  : vendor.status === "rejected"
                    ? "Your application was not approved."
                    : vendor.status === "suspended"
                      ? "Your vendor account is suspended."
                      : "Your vendor account is inactive."}
              </p>
            </div>
            <StatusBadge status={vendor.status} label={vendor.status === "pending" ? "Pending" : undefined} />
          </div>
          {vendor.rejection_reason || vendor.suspension_reason ? (
            <p className="mt-5 rounded-md bg-amber-50 p-4 text-sm font-semibold text-amber-900">{vendor.rejection_reason ?? vendor.suspension_reason}</p>
          ) : null}
          <Link className="mt-5 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-bold" href="/contact">Contact Support</Link>
        </section>
      ) : (
        <>
          <section className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase text-emerald-700">Approved vendor profile</p>
                <h1 className="mt-1 text-3xl font-black text-slate-950">{vendor.business_name}</h1>
                <p className="mt-2 text-sm text-slate-600">Approved {vendor.approved_at ? new Date(vendor.approved_at).toLocaleDateString("en-NG") : "for marketplace selling"}.</p>
              </div>
              <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold" href={`/vendors/${vendor.id}`}>View public profile</Link>
            </div>
            {params.error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{params.error}</p> : null}
            {params.success ? <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{params.success}</p> : null}
            <details className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-black text-slate-950">Edit vendor profile</summary>
              <form action={updateVendorProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="return_to" value="/vendor" />
                <input className="h-11 rounded-md border border-slate-300 px-3" name="business_name" defaultValue={vendor.business_name} placeholder="Business Name" />
                <input className="h-11 rounded-md border border-slate-300 px-3" name="owner_name" defaultValue={vendor.owner_name ?? ""} placeholder="Owner Full Name" />
                <input className="h-11 rounded-md border border-slate-300 px-3" name="business_email" defaultValue={vendor.business_email ?? ""} placeholder="Email" />
                <input className="h-11 rounded-md border border-slate-300 px-3" name="phone" defaultValue={vendor.business_phone ?? ""} placeholder="Phone" />
                <input className="h-11 rounded-md border border-slate-300 px-3 sm:col-span-2" name="business_address" defaultValue={vendor.business_address ?? ""} placeholder="Business Address" />
                <input className="h-11 rounded-md border border-slate-300 px-3" name="city" defaultValue={vendor.city ?? ""} placeholder="City" />
                <input className="h-11 rounded-md border border-slate-300 px-3" name="business_type" defaultValue={vendor.business_type ?? ""} placeholder="Business Type" />
                <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white">Save profile</button>
              </form>
            </details>
          </section>
          <VendorDashboard />
          <OnlineVendorProductForm
            branches={branchData ? [branchData] : []}
            categories={categoryRows}
            error={params.error}
            lockedBranchId={vendor.branch_id}
            returnTo="/vendor"
            success={params.success}
          />
          <OnlineOrderStatusPanel role="vendor" />
        </>
      )}
    </main>
  );
}
