import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { formatNaira, getBranch, products } from "@/lib/marketplace-data";
import { getTrackedOrder, orderSteps, trackedOrders } from "@/lib/customer-flow";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type OnlineOrderDetail = {
  order_number: string;
  customer_name: string;
  branch_id: string;
  status: (typeof trackedOrders)[number]["status"];
  total: number | string;
  created_at: string;
  payment_receipts: Array<{ status: "pending" | "confirmed" | "rejected" }>;
  order_items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number | string;
    products: { name: string; slug: string } | Array<{ name: string; slug: string }> | null;
  }>;
};

async function getOnlineOrder(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("order_number, customer_name, branch_id, status, total, created_at, payment_receipts(status), order_items(product_id, quantity, unit_price, products(name, slug))")
      .eq("order_number", id)
      .maybeSingle();

    if (error || !data) return null;
    const order = data as unknown as OnlineOrderDetail;

    return {
      id: order.order_number,
      customerName: order.customer_name,
      branchId: order.branch_id,
      status: order.status,
      total: Number(order.total),
      receiptStatus: order.payment_receipts?.[0]?.status ?? "pending",
      createdAt: new Date(order.created_at).toLocaleDateString("en-NG"),
      items: order.order_items.map((item) => {
        const joinedProduct = Array.isArray(item.products) ? item.products[0] : item.products;

        return {
          productId: item.product_id,
          productName: joinedProduct?.name ?? "Product",
          productSlug: joinedProduct?.slug,
          quantity: item.quantity,
          price: Number(item.unit_price),
        };
      }),
    };
  } catch {
    return null;
  }
}

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = (await getOnlineOrder(id)) ?? getTrackedOrder(id);

  if (!order) {
    notFound();
  }

  const currentIndex = Math.max(0, orderSteps.findIndex((step) => step.key === order.status));
  const branch = getBranch(order.branchId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">Tracking {order.id}</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Order status: {order.status.replaceAll("_", " ")}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {branch?.name} · Receipt {order.receiptStatus} · {order.createdAt}
            </p>
          </div>
          <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold" href="/orders">
            All orders
          </Link>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-5">
            {orderSteps.map((step, index) => {
              const isDone = index <= currentIndex;
              return (
                <div key={step.key} className="rounded-md border border-slate-200 p-4">
                  <div className={`mb-3 size-8 rounded-full ${isDone ? "bg-emerald-600" : "bg-slate-200"}`} />
                  <p className="font-bold text-slate-950">{step.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{isDone ? "Reached" : "Pending"}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {order.items.map((item) => {
              const product = products.find((entry) => entry.id === item.productId);
              const onlineItem = item as typeof item & { productName?: string; productSlug?: string };
              const productName = onlineItem.productName ?? product?.name;
              const productSlug = onlineItem.productSlug ?? product?.slug;
              if (!productName) return null;

              return (
                <div key={item.productId} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
                  <div>
                    {productSlug ? (
                      <Link href={`/products/${productSlug}`} className="font-bold text-slate-950 hover:text-emerald-700">
                        {productName}
                      </Link>
                    ) : (
                      <p className="font-bold text-slate-950">{productName}</p>
                    )}
                    <p className="text-sm text-slate-600">Qty {item.quantity} · {formatNaira(item.price)}</p>
                  </div>
                  <p className="font-black">{formatNaira(item.price * item.quantity)}</p>
                </div>
              );
            })}
          </div>
          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Payment summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-slate-500">Order total</dt><dd className="font-bold">{formatNaira(order.total)}</dd></div>
              <div><dt className="text-slate-500">Receipt status</dt><dd className="font-bold capitalize">{order.receiptStatus}</dd></div>
              <div><dt className="text-slate-500">Support</dt><dd className="font-bold">Simulated WhatsApp + dashboard alerts</dd></div>
            </dl>
          </aside>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
