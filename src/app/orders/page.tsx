import Link from "next/link";
import { redirect } from "next/navigation";
import { DesignSurface } from "@/components/DesignSurface";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getAuthProfile, isAdmin, isCashier, isCustomer, isManager, isVendor } from "@/lib/auth";
import { formatNaira, getBranch } from "@/lib/marketplace-data";
import { createClient } from "@/lib/supabase/server";
import type { AuthProfile } from "@/lib/auth";

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

async function getScopedOrders(profile: AuthProfile) {
  try {
    const supabase = await createClient();

    if (isVendor(profile)) {
      const { data: vendor } = await supabase.from("vendors").select("id").eq("profile_id", profile.id).eq("status", "approved").maybeSingle();
      if (!vendor) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("orders(order_number, customer_name, branch_id, status, total, created_at)")
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false });
      if (error || !data) return [];

      return data
        .map((item) => (Array.isArray(item.orders) ? item.orders[0] : item.orders))
        .filter((order): order is OnlineOrder => Boolean(order))
        .map((order) => ({
          id: order.order_number,
          customerName: order.customer_name,
          branchId: order.branch_id,
          status: order.status,
          total: Number(order.total),
          createdAt: new Date(order.created_at).toLocaleDateString("en-NG"),
        }));
    }

    let query = supabase
      .from("orders")
      .select("order_number, customer_name, branch_id, status, total, created_at")
      .order("created_at", { ascending: false });

    if (isCustomer(profile)) {
      query = query.eq("profile_id", profile.id);
    } else if ((isManager(profile) || isCashier(profile)) && profile.branch_id) {
      query = query.eq("branch_id", profile.branch_id);
    } else if (!isAdmin(profile)) {
      return [];
    }

    const { data, error } = await query;
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

  const profile = await getAuthProfile(supabase, user.id);
  if (!profile) {
    redirect("/login?error=Your%20account%20profile%20is%20incomplete.%20Please%20contact%20support.");
  }

  const displayedOrders = (await getScopedOrders(profile)) ?? (isCustomer(profile) ? [] : await getOrders());
  const pendingOrders = displayedOrders.filter((order) => order.status === "awaiting_receipt" || order.status === "receipt_uploaded" || order.status === "processing").length;
  const paidOrders = displayedOrders.filter((order) => order.status === "paid_approved" || order.status === "fulfilled").length;
  const rejectedOrders = displayedOrders.filter((order) => order.status === "payment_rejected" || order.status === "rejected").length;
  const totalValue = displayedOrders.reduce((sum, order) => sum + order.total, 0);
  const isCustomerAccount = isCustomer(profile);
  const firstPendingOrder = displayedOrders.find((order) => order.status === "awaiting_receipt" || order.status === "payment_rejected" || order.status === "rejected");

  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15">
          <p className="w-fit rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-black uppercase text-emerald-200">{isCustomerAccount ? "Customer account" : `${profile.role} orders`}</p>
          <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">{isCustomerAccount ? "Welcome to My Account" : "Order tracking"}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            {isCustomerAccount
              ? "Decide what to do next: track orders, upload receipts, continue shopping, or request repair support."
              : "Track manual bank transfer orders and cashier confirmation status for your permitted role scope."}
          </p>
        </section>

        {isCustomerAccount ? (
          <section className="mb-6 grid gap-4 md:grid-cols-4">
            {[
              ["🧾 View My Orders", "/orders", "Check order status"],
              ["📦 Continue Shopping", "/products", "Browse computers and accessories"],
              ["💰 Upload Receipt", firstPendingOrder ? `/orders/${firstPendingOrder.id}` : "/orders", "Send payment proof"],
              ["🛠 Request Repair", "/repair", "Ask for diagnosis or repair"],
            ].map(([label, href, description]) => (
              <Link key={label} className="wcs-card min-h-28 rounded-2xl p-5 hover:border-emerald-300" href={href}>
                <p className="font-black text-slate-950">{label}</p>
                <p className="mt-1 text-sm text-slate-600">{description}</p>
              </Link>
            ))}
          </section>
        ) : null}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(isCustomerAccount
            ? [
                ["Orders waiting payment", pendingOrders.toString()],
                ["Paid orders", paidOrders.toString()],
                ["Repair requests", "0"],
                ["Wishlist items", "0"],
              ]
            : [
                ["Own orders", displayedOrders.length.toString()],
                ["Pending / processing", pendingOrders.toString()],
                ["Paid / confirmed", paidOrders.toString()],
                [rejectedOrders > 0 ? "Rejected payments" : "Order value", rejectedOrders > 0 ? rejectedOrders.toString() : formatNaira(totalValue)],
              ]).map(([label, value]) => (
            <DesignSurface key={label} className="p-6">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
            </DesignSurface>
          ))}
        </section>

        <section className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Recent activity</h2>
          <p className="mt-1 text-sm text-slate-600">{isCustomerAccount ? "Recent order updates for your account." : "Recent order updates for your permitted dashboard scope."}</p>
        </section>

        <div className="grid gap-4">
          {displayedOrders.length === 0 ? (
            <DesignSurface className="p-8 text-center">
              <p className="text-lg font-bold text-slate-950">No orders yet.</p>
              <p className="mt-2 text-sm text-slate-600">Place an order and upload a receipt to see it here.</p>
              <Link className="btn-primary mt-4" href="/products">
                Continue shopping
              </Link>
            </DesignSurface>
          ) : (
            displayedOrders.map((order) => (
              <DesignSurface key={order.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-slate-950">{order.id}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.customerName} · {getBranch(order.branchId)?.state} · {order.createdAt}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-lg font-black text-slate-950">{formatNaira(order.total)}</p>
                    <p className="mt-1"><StatusBadge status={order.status} /></p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link className="btn-dark" href={`/orders/${order.id}`}>
                    Track order
                  </Link>
                  <Link className="btn-outline" href="/products">
                    Buy again
                  </Link>
                </div>
                {isCustomerAccount ? <OrderTimeline status={order.status} /> : null}
              </DesignSurface>
            ))
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function OrderTimeline({ status }: { status: string }) {
  const steps = [
    ["Order placed", ["awaiting_receipt", "receipt_uploaded", "payment_rejected", "rejected", "paid_approved", "processing", "fulfilled"]],
    ["Receipt uploaded", ["receipt_uploaded", "payment_rejected", "rejected", "paid_approved", "processing", "fulfilled"]],
    ["Payment confirmed", ["paid_approved", "processing", "fulfilled"]],
    ["Preparing order", ["processing", "fulfilled"]],
    ["Ready for pickup", ["fulfilled"]],
    ["Completed", ["fulfilled"]],
  ] as const;

  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {steps.map(([label, activeStatuses]) => {
        const isActive = (activeStatuses as readonly string[]).includes(status);
        return (
          <div key={label} className={`rounded-md border px-3 py-2 text-xs font-bold ${isActive ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
            {label}
          </div>
        );
      })}
    </div>
  );
}
