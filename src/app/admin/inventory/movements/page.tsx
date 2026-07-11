import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { StatusBadge } from "@/components/StatusBadge";
import { getAuthProfile, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MovementRow = {
  id: string;
  movement_type: string;
  quantity: number;
  reason: string | null;
  role: string | null;
  created_at: string;
  products: { name: string; sku: string | null } | { name: string; sku: string | null }[] | null;
  branches: { name: string; state: string } | { name: string; state: string }[] | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

export default async function InventoryMovementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getAuthProfile(supabase, user.id) : null;

  if (!isAdmin(profile)) {
    return (
      <main className="min-h-screen dashboard-shell px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
        <DashboardSessionBar role="admin" />
        <section className="mx-auto max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-900 shadow-sm">
          Only admin users can view stock movement history.
        </section>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("inventory_movements")
    .select("id, movement_type, quantity, reason, role, created_at, products(name, sku), branches(name, state), profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as unknown as MovementRow[];

  return (
    <main className="min-h-screen space-y-6 dashboard-shell px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="admin" />
      <section className="premium-panel mx-auto max-w-7xl rounded-2xl p-6">
        <p className="text-sm font-black uppercase text-emerald-700">Inventory Audit</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Stock Movement History</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Review stock additions, removals, transfers, damage records, sales, and manual adjustments.
        </p>
      </section>
      {error ? (
        <section className="mx-auto max-w-7xl rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          Could not load stock movements. Details: {error.message}
        </section>
      ) : (
        <section className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Movement</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No stock movement records yet.</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const product = first(row.products);
                    const branch = first(row.branches);
                    const actor = first(row.profiles);
                    return (
                      <tr key={row.id} className="align-top hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                          {new Date(row.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                        </td>
                        <td className="px-4 py-3 font-black text-slate-950">
                          {product?.name ?? "Product"}
                          <p className="text-xs font-medium text-slate-500">{product?.sku ?? "No SKU"}</p>
                        </td>
                        <td className="px-4 py-3">{branch ? `${branch.name} (${branch.state})` : "Unknown"}</td>
                        <td className="px-4 py-3"><StatusBadge status={row.movement_type} label={label(row.movement_type)} /></td>
                        <td className="px-4 py-3 font-black">{row.quantity}</td>
                        <td className="px-4 py-3">{actor?.full_name ?? "System"}<p className="text-xs capitalize text-slate-500">{row.role ?? "role unknown"}</p></td>
                        <td className="px-4 py-3 text-slate-600">{row.reason ?? "No reason provided"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

