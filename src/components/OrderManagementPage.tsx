import Link from "next/link";
import { assignOrderBranch, cancelManagedOrder, reviewManagedPayment, updateManagedOrderStatus } from "@/app/orders/manage/actions";
import { StatusBadge } from "@/components/StatusBadge";
import { getAuthProfile, isCashier, isManager, isVendor } from "@/lib/auth";
import { formatNaira } from "@/lib/marketplace-data";
import { supabaseConfig } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, UserRole } from "@/lib/types";

type OrderManagementRole = Extract<UserRole, "admin" | "manager" | "cashier" | "vendor">;

type SearchParams = {
  q?: string;
  status?: string;
  date?: string;
  branch?: string;
  error?: string;
  success?: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  profile_id: string | null;
  branch_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  status: OrderStatus;
  total: number | string;
  delivery_method: string | null;
  payment_method: string | null;
  cashier_note: string | null;
  support_note: string | null;
  created_at: string;
  updated_at: string;
  branches: { name: string; state: string; city: string } | { name: string; state: string; city: string }[] | null;
  payment_receipts: Array<{ id: string; storage_path: string; status: "pending" | "confirmed" | "rejected"; review_note: string | null; created_at: string; reviewed_at: string | null }>;
  order_items: Array<{ quantity: number; unit_price: number | string; vendor_id: string | null; products: { name: string; slug: string } | { name: string; slug: string }[] | null; vendors: { business_name: string } | { business_name: string }[] | null }>;
  order_events: Array<{ event_type: string; note: string | null; created_at: string }>;
};

function first<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function contains(value: unknown, needle: string) {
  return String(value ?? "").toLowerCase().includes(needle);
}

function paymentStatus(order: OrderRow) {
  const receipt = order.payment_receipts?.[0];
  if (order.status === "paid_approved" || order.status === "processing" || order.status === "ready_for_pickup" || order.status === "fulfilled") return "paid_approved";
  if (order.status === "payment_rejected" || receipt?.status === "rejected") return "payment_rejected";
  if (order.status === "receipt_uploaded") return "receipt_uploaded";
  return "awaiting_receipt";
}

function orderStatusLabel(status: string) {
  if (status === "paid_approved") return "Payment Confirmed";
  if (status === "processing") return "Preparing";
  if (status === "ready_for_pickup") return "Ready for Pickup";
  if (status === "fulfilled") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "payment_rejected") return "Rejected";
  return status;
}

function dateMatches(createdAt: string, filter?: string) {
  if (!filter) return true;
  const created = new Date(createdAt);
  const now = new Date();
  if (filter === "today") return created.toDateString() === now.toDateString();
  if (filter === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    return created >= weekAgo;
  }
  if (filter === "month") return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  return true;
}

async function signedReceiptUrl(path?: string) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(supabaseConfig.storageBuckets.paymentReceipts).createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}

export async function OrderManagementPage({ role, searchParams }: { role: OrderManagementRole; searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getAuthProfile(supabase, user.id) : null;
  const returnTo = `/${role}/orders`;

  let vendorId: string | null = null;
  if (profile && isVendor(profile)) {
    const { data: vendor } = await supabase.from("vendors").select("id").eq("profile_id", profile.id).eq("status", "approved").maybeSingle();
    vendorId = vendor?.id ?? null;
  }

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, profile_id, branch_id, customer_name, customer_phone, customer_email, status, total, delivery_method, payment_method, cashier_note, support_note, created_at, updated_at, branches(name, state, city), payment_receipts(id, storage_path, status, review_note, created_at, reviewed_at), order_items(quantity, unit_price, vendor_id, products(name, slug), vendors(business_name)), order_events(event_type, note, created_at)",
    )
    .order("created_at", { ascending: false });

  if (profile && (isManager(profile) || isCashier(profile)) && profile.branch_id) query = query.eq("branch_id", profile.branch_id);
  if (role === "vendor" && vendorId) query = query.eq("order_items.vendor_id", vendorId);

  const { data, error } = await query;
  const orders = ((data ?? []) as unknown as OrderRow[]).filter((order) => {
    const branch = first(order.branches);
    const vendors = order.order_items.map((item) => first(item.vendors)?.business_name).filter(Boolean).join(" ");
    const q = searchParams.q?.trim().toLowerCase() ?? "";
    if (role === "vendor" && vendorId && !order.order_items.some((item) => item.vendor_id === vendorId)) return false;
    if (q && ![order.order_number, order.customer_name, order.customer_phone, vendors, branch?.state, branch?.name].some((value) => contains(value, q))) return false;
    if (searchParams.status && order.status !== searchParams.status) return false;
    if (searchParams.branch && order.branch_id !== searchParams.branch) return false;
    if (!dateMatches(order.created_at, searchParams.date)) return false;
    return true;
  });

  const receiptUrls = new Map<string, string>();
  for (const order of orders) {
    const receipt = order.payment_receipts?.[0];
    const url = await signedReceiptUrl(receipt?.storage_path);
    if (url) receiptUrls.set(order.id, url);
  }

  const totalSales = orders.filter((order) => ["paid_approved", "processing", "ready_for_pickup", "fulfilled"].includes(order.status)).reduce((sum, order) => sum + Number(order.total), 0);
  const completed = orders.filter((order) => order.status === "fulfilled").length;
  const cancelled = orders.filter((order) => order.status === "cancelled").length;
  const pending = orders.filter((order) => order.status === "awaiting_receipt" || order.status === "receipt_uploaded").length;
  const productsSold = orders.reduce((sum, order) => sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase text-emerald-700">Order Management</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {role === "admin" ? "All marketplace orders" : role === "manager" ? "Branch orders" : role === "cashier" ? "Payment review queue" : "Vendor orders"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">Track payment, fulfillment, receipt history, branch scope, and customer delivery status.</p>
        {searchParams.error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{searchParams.error}</p> : null}
        {searchParams.success ? <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{searchParams.success}</p> : null}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [role === "vendor" ? "Products Sold" : role === "cashier" ? "Confirmed Today" : "Total Orders", role === "vendor" ? productsSold : role === "cashier" ? orders.filter((order) => order.status === "paid_approved").length : orders.length],
          [role === "manager" ? "Branch Sales" : role === "vendor" ? "Revenue" : "Total Sales", formatNaira(totalSales)],
          ["Pending Orders", pending],
          ["Completed Orders", completed],
          [role === "cashier" ? "Rejected Today" : "Cancelled Orders", role === "cashier" ? orders.filter((order) => order.status === "payment_rejected").length : cancelled],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 lg:grid-cols-6">
          <input className="h-11 rounded-md border border-slate-300 px-3 lg:col-span-2" name="q" placeholder="Search order, customer, phone, vendor, branch" defaultValue={searchParams.q} />
          <select className="h-11 rounded-md border border-slate-300 px-3" name="status" defaultValue={searchParams.status ?? ""}>
            <option value="">All status</option>
            <option value="awaiting_receipt">Pending</option>
            <option value="receipt_uploaded">Receipt Uploaded</option>
            <option value="paid_approved">Confirmed</option>
            <option value="payment_rejected">Rejected</option>
            <option value="fulfilled">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="h-11 rounded-md border border-slate-300 px-3" name="date" defaultValue={searchParams.date ?? ""}>
            <option value="">Any date</option>
            <option value="today">Today&apos;s Orders</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white">Apply filters</button>
          {role === "admin" ? <a className="rounded-md border border-slate-300 px-4 py-3 text-center text-sm font-bold" href={`data:text/csv;charset=utf-8,${encodeURIComponent(orders.map((order) => `${order.order_number},${order.customer_name},${order.status},${order.total}`).join("\n"))}`} download="orders.csv">Export orders</a> : null}
        </form>
      </section>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">Could not load orders. Confirm production SQL has been applied.</p> : null}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                {["Order Reference", "Customer", "Branch", "Vendor", "Items", "Total", "Payment Status", "Order Status", "Created Date", "Actions"].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center"><p className="font-black text-slate-950">No orders found.</p><p className="mt-1 text-slate-600">New orders will appear here.</p></td></tr>
              ) : orders.map((order) => {
                const branch = first(order.branches);
                const vendors = [...new Set(order.order_items.map((item) => first(item.vendors)?.business_name ?? "Vendor"))].join(", ");
                const receipt = order.payment_receipts?.[0];
                return (
                  <tr key={order.id} className="align-top">
                    <td className="px-4 py-3 font-black text-slate-950">{order.order_number}</td>
                    <td className="px-4 py-3">{order.customer_name}<p className="text-xs text-slate-500">{order.customer_phone}</p></td>
                    <td className="px-4 py-3">{branch?.state ?? "Unknown"}</td>
                    <td className="px-4 py-3">{vendors}</td>
                    <td className="px-4 py-3">{order.order_items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td className="px-4 py-3 font-semibold">{formatNaira(Number(order.total))}</td>
                    <td className="px-4 py-3"><StatusBadge status={paymentStatus(order)} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} label={orderStatusLabel(order.status)} /></td>
                    <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString("en-NG")}</td>
                    <td className="px-4 py-3">
                      <OrderRowActions order={order} receiptUrl={receiptUrls.get(order.id)} receiptId={receipt?.id} returnTo={returnTo} role={role} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function OrderRowActions({ order, role, receiptUrl, receiptId, returnTo }: { order: OrderRow; role: OrderManagementRole; receiptUrl?: string; receiptId?: string; returnTo: string }) {
  const canProcess = role === "admin" || role === "manager";
  const canReviewPayment = (role === "admin" || role === "cashier") && receiptId;
  const canAssign = role === "admin";

  return (
    <div className="grid min-w-72 gap-2">
      <Link className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold" href={`/orders/${order.order_number}`}>View details</Link>
      {receiptUrl ? <a className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold" href={receiptUrl} target="_blank" rel="noreferrer">View receipt</a> : null}
      <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-xs font-black text-slate-900">Order details</summary>
        <div className="mt-3 space-y-3 text-xs text-slate-700">
          <p><strong>Email:</strong> {order.customer_email ?? "Not provided"}</p>
          <p><strong>Delivery:</strong> {order.delivery_method ?? "Pickup"}</p>
          <p><strong>Payment:</strong> {order.payment_method ?? "Manual bank transfer"}</p>
          <p><strong>Cashier note:</strong> {order.cashier_note ?? order.payment_receipts?.[0]?.review_note ?? "No note"}</p>
          <div>
            <strong>Products</strong>
            {order.order_items.map((item, index) => {
              const product = first(item.products);
              return <p key={`${product?.slug ?? "item"}-${index}`}>{product?.name ?? "Product"} · Qty {item.quantity} · {formatNaira(Number(item.unit_price) * item.quantity)}</p>;
            })}
          </div>
          <div>
            <strong>Timeline</strong>
            {["Order Created", "Receipt Uploaded", "Payment Confirmed", "Preparing Order", "Ready", "Completed"].map((label) => <p key={label}>✓ {label}</p>)}
          </div>
        </div>
      </details>
      {canReviewPayment ? (
        <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-xs font-black text-slate-900">Review receipt</summary>
          <div className="mt-3 grid gap-2">
            {[
              ["confirmed", "Confirm payment"],
              ["rejected", "Reject payment"],
            ].map(([decision, label]) => (
              <form key={decision} action={reviewManagedPayment} className="grid gap-2">
                <input type="hidden" name="return_to" value={returnTo} />
                <input type="hidden" name="order_id" value={order.id} />
                <input type="hidden" name="receipt_id" value={receiptId} />
                <input type="hidden" name="decision" value={decision} />
                <input className="h-9 rounded-md border border-slate-300 px-2 text-xs" name="note" placeholder="Payment note" />
                <button className={decision === "confirmed" ? "rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white" : "rounded-md border border-red-300 px-3 py-2 text-xs font-bold text-red-700"}>{label}</button>
              </form>
            ))}
          </div>
        </details>
      ) : null}
      {canProcess ? (
        <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-xs font-black text-slate-900">Update status</summary>
          <form action={updateManagedOrderStatus} className="mt-3 grid gap-2">
            <input type="hidden" name="return_to" value={returnTo} />
            <input type="hidden" name="order_id" value={order.id} />
            <select className="h-9 rounded-md border border-slate-300 px-2 text-xs" name="status" defaultValue={order.status}>
              {role === "admin" ? <option value="paid_approved">Payment Confirmed</option> : null}
              <option value="processing">Preparing Order</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="fulfilled">Completed</option>
              {role === "admin" ? <option value="cancelled">Cancelled</option> : null}
            </select>
            <input className="h-9 rounded-md border border-slate-300 px-2 text-xs" name="note" placeholder="Status note" />
            <button className="rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white">Update</button>
          </form>
        </details>
      ) : null}
      {canAssign ? (
        <form action={assignOrderBranch} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="order_id" value={order.id} />
          <input className="h-9 rounded-md border border-slate-300 px-2 text-xs" name="branch_id" placeholder="Branch UUID" />
          <input className="h-9 rounded-md border border-slate-300 px-2 text-xs" name="manager_id" placeholder="Manager UUID optional" />
          <button className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold">Assign branch</button>
        </form>
      ) : null}
      {role === "admin" ? (
        <form action={cancelManagedOrder}>
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="order_id" value={order.id} />
          <button className="rounded-md border border-red-300 px-3 py-2 text-xs font-bold text-red-700">Cancel order</button>
        </form>
      ) : null}
    </div>
  );
}
