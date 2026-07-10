import { updateVendorApprovalStatus } from "@/app/vendors/actions";
import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { StatusBadge } from "@/components/StatusBadge";
import { formatNaira } from "@/lib/marketplace-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type VendorRow = {
  id: string;
  profile_id: string;
  branch_id: string;
  business_name: string;
  owner_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  state: string | null;
  city: string | null;
  business_type: string | null;
  status: string;
  rejection_reason: string | null;
  suspension_reason: string | null;
  approved_at: string | null;
  created_at: string;
  branches: { state: string; city: string } | { state: string; city: string }[] | null;
  products: Array<{ id: string; name: string }> | null;
  order_items: Array<{ quantity: number; unit_price: number | string; orders: { status: string } | { status: string }[] | null }> | null;
};

function first<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function contains(value: unknown, needle: string) {
  return String(value ?? "").toLowerCase().includes(needle);
}

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; state?: string; city?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("id, profile_id, branch_id, business_name, owner_name, business_email, business_phone, business_address, state, city, business_type, status, rejection_reason, suspension_reason, approved_at, created_at, branches(state, city), products(id, name), order_items(quantity, unit_price, orders(status))")
    .order("created_at", { ascending: false });

  const q = params.q?.trim().toLowerCase() ?? "";
  const vendors = ((data ?? []) as unknown as VendorRow[]).filter((vendor) => {
    if (params.status && vendor.status !== params.status) return false;
    if (params.state && (vendor.state ?? first(vendor.branches)?.state) !== params.state) return false;
    if (params.city && !contains(vendor.city, params.city)) return false;
    if (q && ![vendor.business_name, vendor.owner_name, vendor.business_email, vendor.business_phone, vendor.status].some((value) => contains(value, q))) return false;
    return true;
  });
  const pending = vendors.filter((vendor) => vendor.status === "pending");

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="admin" />
      <section className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase text-emerald-700">Vendor Management</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Vendor approvals and performance</h1>
        <p className="mt-2 text-sm text-slate-600">Review onboarding applications, manage approval status, and monitor vendor marketplace activity.</p>
        {params.error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{params.error}</p> : null}
        {params.success ? <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{params.success}</p> : null}
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total Vendors", vendors.length],
          ["Pending", pending.length],
          ["Approved", vendors.filter((vendor) => vendor.status === "approved").length],
          ["Suspended", vendors.filter((vendor) => vendor.status === "suspended").length],
          ["Rejected", vendors.filter((vendor) => vendor.status === "rejected").length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 lg:grid-cols-5">
          <input className="h-11 rounded-md border border-slate-300 px-3 lg:col-span-2" name="q" placeholder="Search business, owner, email, phone, status" defaultValue={params.q} />
          <select className="h-11 rounded-md border border-slate-300 px-3" name="status" defaultValue={params.status ?? ""}>
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="h-11 rounded-md border border-slate-300 px-3" name="state" defaultValue={params.state ?? ""}>
            <option value="">All states</option>
            <option>Adamawa</option>
            <option>Yobe</option>
            <option>Borno</option>
          </select>
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white">Apply filters</button>
        </form>
      </section>

      {error ? <p className="mx-auto max-w-7xl rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">Could not load vendors. Run the vendor production SQL upgrade first.</p> : null}

      <section className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-black text-slate-950">Approval queue</h2>
          <p className="mt-1 text-sm text-slate-600">{pending.length === 0 ? "No pending vendor applications." : `${pending.length} vendor applications need review.`}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                {["Business", "Owner", "Contact", "Location", "Products", "Orders Completed", "Revenue", "Rating", "Member Since", "Status", "Actions"].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center"><p className="font-black text-slate-950">No vendors found.</p><p className="mt-1 text-slate-600">Vendor applications will appear here.</p></td></tr>
              ) : vendors.map((vendor) => {
                const completedOrders = (vendor.order_items ?? []).filter((item) => first(item.orders)?.status === "fulfilled");
                const revenue = (vendor.order_items ?? []).reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
                return (
                  <tr key={vendor.id} className="align-top">
                    <td className="px-4 py-3"><a className="font-black text-slate-950 hover:text-emerald-700" href={`/vendors/${vendor.id}`}>{vendor.business_name}</a><p className="text-xs text-slate-500">{vendor.business_type ?? "Vendor"}</p></td>
                    <td className="px-4 py-3">{vendor.owner_name ?? "Not provided"}</td>
                    <td className="px-4 py-3">{vendor.business_email ?? "No email"}<p className="text-xs text-slate-500">{vendor.business_phone ?? "No phone"}</p></td>
                    <td className="px-4 py-3">{vendor.state ?? first(vendor.branches)?.state ?? "Unknown"}<p className="text-xs text-slate-500">{vendor.city ?? first(vendor.branches)?.city}</p></td>
                    <td className="px-4 py-3">{vendor.products?.length ?? 0}</td>
                    <td className="px-4 py-3">{completedOrders.length}</td>
                    <td className="px-4 py-3 font-semibold">{formatNaira(revenue)}</td>
                    <td className="px-4 py-3">New</td>
                    <td className="px-4 py-3">{new Date(vendor.created_at).toLocaleDateString("en-NG")}</td>
                    <td className="px-4 py-3"><StatusBadge status={vendor.status} label={vendor.status === "pending" ? "Pending" : undefined} /></td>
                    <td className="px-4 py-3"><VendorStatusActions status={vendor.status} vendorId={vendor.id} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function VendorStatusActions({ vendorId, status }: { vendorId: string; status: string }) {
  const actionGroups: Array<[string, string, boolean]> =
    status === "pending"
      ? [
          ["approved", "Approve vendor", true],
          ["rejected", "Reject vendor", false],
        ]
      : status === "approved"
        ? [["suspended", "Suspend vendor", false]]
        : status === "suspended"
          ? [["approved", "Reactivate vendor", true]]
          : status === "rejected"
            ? [["pending", "Reconsider", true]]
            : [["approved", "Reactivate vendor", true]];

  return (
    <div className="grid min-w-64 gap-2">
      <a className="rounded-md border border-slate-300 px-3 py-2 text-center text-xs font-bold" href={`/vendors/${vendorId}`}>
        View
      </a>
      {status === "approved" ? (
        <a className="rounded-md border border-slate-300 px-3 py-2 text-center text-xs font-bold" href={`/admin/products?vendor=${vendorId}`}>
          View Products
        </a>
      ) : null}
      {actionGroups.map(([nextStatus, label, primary]) => (
        <form key={label} action={updateVendorApprovalStatus} className="grid gap-2">
          <input type="hidden" name="return_to" value="/admin/vendors" />
          <input type="hidden" name="vendor_id" value={vendorId} />
          <input type="hidden" name="status" value={String(nextStatus)} />
          {(nextStatus === "rejected" || nextStatus === "suspended" || nextStatus === "inactive") ? <input className="h-9 rounded-md border border-slate-300 px-2 text-xs" name="reason" placeholder="Reason" /> : null}
          <button className={primary ? "rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white" : "rounded-md border border-slate-300 px-3 py-2 text-xs font-bold"}>
            {label}
          </button>
        </form>
      ))}
    </div>
  );
}
