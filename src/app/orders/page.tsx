import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { formatNaira, getBranch } from "@/lib/marketplace-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type OnlineOrder = {
  order_number: string;
  customer_name: string;
  branch_id: string;
  status: string;
  total: number | string;
  created_at: string;
};

async function getOrders() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("order_number, customer_name, branch_id, status, total, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as OnlineOrder[]).map((order) => ({
      id: order.order_number,
      customerName: order.customer_name,
      branchId: order.branch_id,
      status: order.status,
      total: Number(order.total),
      createdAt: new Date(order.created_at).toLocaleDateString("en-NG"),
    }));
  } catch {
    return [];
  }
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/orders");
  }

  const displayedOrders = await getOrders();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase text-emerald-700">Customer orders</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Order tracking</h1>
          <p className="mt-2 text-sm text-slate-600">Track manual bank transfer orders and cashier confirmation status.</p>
        </div>
        <div className="grid gap-4">
          {displayedOrders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-lg font-bold text-slate-950">No orders yet</p>
              <p className="mt-2 text-sm text-slate-600">Place an order and upload a receipt to see it here.</p>
            </div>
          ) : (
            displayedOrders.map((order) => (
              <article key={order.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-slate-950">{order.id}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.customerName} · {getBranch(order.branchId)?.state} · {order.createdAt}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-lg font-black text-slate-950">{formatNaira(order.total)}</p>
                    <p className="mt-1 text-sm capitalize text-slate-600">{order.status.replaceAll("_", " ")}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700" href={`/orders/${order.id}`}>
                    Track order
                  </Link>
                  <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold" href="/products">
                    Buy again
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
