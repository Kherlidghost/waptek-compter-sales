import Link from "next/link";
import { notFound } from "next/navigation";
import { reuploadOrderReceipt, cancelManagedOrder } from "@/app/orders/manage/actions";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { OrderTimeline } from "@/components/order-timeline";
import { PrintInvoiceButton } from "@/components/PrintInvoiceButton";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { getAuthProfile, isAdmin, isCashier, isCustomer, isManager, isVendor, type AuthProfile } from "@/lib/auth";
import { formatNaira, getBranch, products } from "@/lib/marketplace-data";
import { getTrackedOrder } from "@/lib/customer-flow";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import { orderSupportMessage, resolveWhatsAppNumber } from "@/lib/whatsapp";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type OnlineOrderDetail = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  branch_id: string;
  status: OrderStatus;
  total: number | string;
  profile_id: string | null;
  delivery_method: string | null;
  payment_method: string | null;
  cashier_note: string | null;
  support_note: string | null;
  created_at: string;
  payment_receipts: Array<{ status: "pending" | "confirmed" | "rejected"; review_note: string | null; created_at: string }>;
  order_events: Array<{ event_type: string; note: string | null; created_at: string }>;
  order_items: Array<{
    product_id: string;
    vendor_id: string | null;
    quantity: number;
    unit_price: number | string;
    products: { name: string; slug: string } | Array<{ name: string; slug: string }> | null;
  }>;
};

type OrderView = {
  id: string;
  dbId?: string;
  customerName: string;
  customerPhone?: string;
  branchId: string;
  status: OrderStatus;
  total: number;
  receiptStatus: "pending" | "confirmed" | "rejected";
  cashierNote?: string | null;
  deliveryMethod: string;
  paymentMethod: string;
  createdAt: string;
  items: Array<{ productId: string; productName?: string; productSlug?: string; quantity: number; price: number }>;
  events?: Array<{ event_type: string; note: string | null; created_at: string }>;
};

async function getOnlineOrder(id: string, profile: AuthProfile) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, customer_email, profile_id, branch_id, status, total, delivery_method, payment_method, cashier_note, support_note, created_at, payment_receipts(status, review_note, created_at), order_events(event_type, note, created_at), order_items(product_id, vendor_id, quantity, unit_price, products(name, slug))")
      .eq("order_number", id)
      .maybeSingle();

    if (error || !data) return null;
    const order = data as unknown as OnlineOrderDetail;
    const { data: vendor } = isVendor(profile)
      ? await supabase.from("vendors").select("id").eq("profile_id", profile.id).eq("status", "approved").maybeSingle()
      : { data: null };
    const canView =
      isAdmin(profile) ||
      (isCustomer(profile) && order.profile_id === profile.id) ||
      ((isManager(profile) || isCashier(profile)) && profile.branch_id === order.branch_id) ||
      (isVendor(profile) && Boolean(vendor?.id) && order.order_items.some((item) => item.vendor_id === vendor?.id));

    if (!canView) return null;

    return {
      id: order.order_number,
      dbId: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      branchId: order.branch_id,
      status: order.status,
      total: Number(order.total),
      receiptStatus: order.payment_receipts?.[0]?.status ?? "pending",
      cashierNote: order.cashier_note ?? order.payment_receipts?.[0]?.review_note ?? null,
      supportNote: order.support_note,
      deliveryMethod: order.delivery_method ?? "Pickup",
      paymentMethod: order.payment_method ?? "Manual bank transfer",
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
      events: order.order_events ?? [],
    };
  } catch {
    return null;
  }
}

function normalizeFallbackOrder(order: ReturnType<typeof getTrackedOrder>): OrderView | null {
  if (!order) return null;
  return {
    id: order.id,
    customerName: order.customerName,
    branchId: order.branchId,
    status: order.status as OrderStatus,
    total: order.total,
    receiptStatus: order.receiptStatus,
    deliveryMethod: "Pickup",
    paymentMethod: "Manual bank transfer",
    createdAt: order.createdAt,
        items: order.items,
    events: [],
  };
}

async function getWhatsAppNumber(): Promise<string | null> {
  try {
    if (!isSupabaseConfigured()) return resolveWhatsAppNumber();
    const supabase = await createClient();
    const { data } = await supabase
      .from("company_settings")
      .select("whatsapp_number")
      .eq("id", 1)
      .maybeSingle();
    return resolveWhatsAppNumber((data as { whatsapp_number?: string | null } | null)?.whatsapp_number);
  } catch {
    return resolveWhatsAppNumber();
  }
}

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }
  const profile = await getAuthProfile(supabase, user.id);
  if (!profile) {
    notFound();
  }

  const onlineOrder = await getOnlineOrder(id, profile);
  const order: OrderView | null = onlineOrder ?? (isCustomer(profile) ? normalizeFallbackOrder(getTrackedOrder(id)) : null);

  if (!order) {
    notFound();
  }

  const [waNumber] = await Promise.all([getWhatsAppNumber()]);
  const branch = getBranch(order.branchId);
  const canReuploadReceipt = isCustomer(profile) && order.status === "payment_rejected" && Boolean(order.dbId);
  const canCancel = isCustomer(profile) && Boolean(order.dbId) && ["awaiting_receipt", "receipt_uploaded", "payment_rejected"].includes(order.status);

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
          <div className="flex flex-wrap gap-2">
            <PrintInvoiceButton />
            <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold" href="/orders">
              All orders
            </Link>
          </div>
        </div>

        <OrderTimeline status={order.status} events={order.events} />

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
              <div><dt className="text-slate-500">Order status</dt><dd className="mt-1"><StatusBadge status={order.status} /></dd></div>
              <div><dt className="text-slate-500">Receipt status</dt><dd className="font-bold capitalize">{order.receiptStatus}</dd></div>
              <div><dt className="text-slate-500">Delivery method</dt><dd className="font-bold">{order.deliveryMethod}</dd></div>
              <div><dt className="text-slate-500">Payment method</dt><dd className="font-bold">{order.paymentMethod}</dd></div>
              <div><dt className="text-slate-500">Customer</dt><dd className="font-bold">{order.customerName}</dd><dd className="text-slate-600">{order.customerPhone ?? "Phone not provided"}</dd></div>
              <div><dt className="text-slate-500">Cashier note</dt><dd className="font-bold">{order.cashierNote ?? "No cashier note yet."}</dd></div>
              <div><dt className="text-slate-500">Support</dt><dd className="font-bold">In-app order notifications</dd></div>
            </dl>
            {waNumber ? (
              <div className="mt-5">
                <WhatsAppLink
                  number={waNumber}
                  message={orderSupportMessage({
                    orderRef: order.id,
                    status: order.status.replaceAll("_", " "),
                    total: formatNaira(order.total),
                  })}
                  label="Ask About This Order"
                  className="w-full justify-center"
                />
              </div>
            ) : null}
            {canReuploadReceipt ? (
              <form action={reuploadOrderReceipt} className="mt-5 grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
                <input type="hidden" name="return_to" value={`/orders/${order.id}`} />
                <input type="hidden" name="order_id" value={order.dbId ?? ""} />
                <label className="text-sm font-bold text-slate-950" htmlFor="receipt">Upload another receipt</label>
                <input id="receipt" name="receipt" type="file" accept="image/*,.pdf" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" required />
                <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Submit receipt</button>
              </form>
            ) : null}
            {canCancel ? (
              <form action={cancelManagedOrder} className="mt-3">
                <input type="hidden" name="return_to" value="/orders" />
                <input type="hidden" name="order_id" value={order.dbId ?? ""} />
                <button className="rounded-md border border-red-300 px-4 py-2 text-sm font-bold text-red-700">Cancel order</button>
              </form>
            ) : null}
          </aside>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
