import { formatNaira } from "@/lib/marketplace-data";
import { createClient } from "@/lib/supabase/server";

type Role = "admin" | "manager" | "vendor";

type StaffOrder = {
  order_number: string;
  customer_name: string;
  status: string;
  total: number | string;
  created_at: string;
};

type VendorOrderItem = {
  orders: StaffOrder | StaffOrder[] | null;
};

async function getRows(role: Role) {
  try {
    const supabase = await createClient();

    if (role === "vendor") {
      const { data, error } = await supabase
        .from("order_items")
        .select("orders(order_number, customer_name, status, total, created_at)")
        .order("created_at", { ascending: false })
        .limit(8);

      if (error || !data) return [];

      return (data as unknown as VendorOrderItem[])
        .map((item) => (Array.isArray(item.orders) ? item.orders[0] : item.orders))
        .filter((order): order is StaffOrder => Boolean(order));
    }

    const { data, error } = await supabase
      .from("orders")
      .select("order_number, customer_name, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    if (error || !data) return [];
    return data as StaffOrder[];
  } catch {
    return [];
  }
}

export async function OnlineOrderStatusPanel({ role }: { role: Role }) {
  const rows = await getRows(role);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-emerald-700">Live Supabase orders</p>
          <h2 className="text-xl font-black text-slate-950">Online order status</h2>
        </div>
        <p className="text-sm font-semibold text-slate-500">{rows.length} visible</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-3 pr-4">Order</th>
              <th className="py-3 pr-4">Customer</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 text-slate-600" colSpan={4}>
                  No online orders visible yet. Place a customer order after Supabase is configured.
                </td>
              </tr>
            ) : (
              rows.map((order) => (
                <tr key={`${order.order_number}-${order.created_at}`} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-bold text-slate-950">{order.order_number}</td>
                  <td className="py-3 pr-4 text-slate-700">{order.customer_name}</td>
                  <td className="py-3 pr-4 capitalize text-slate-700">{order.status.replaceAll("_", " ")}</td>
                  <td className="py-3 pr-4 font-bold text-slate-950">{formatNaira(Number(order.total))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
