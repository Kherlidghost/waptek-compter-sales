"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, ReceiptText, Search, XCircle, type LucideIcon } from "lucide-react";
import type { Order, OrderStatus, ReceiptStatus } from "@/lib/types";
import { formatNaira, getBranch, orders } from "@/lib/marketplace-data";
import { InAppNotice } from "@/components/InAppNotice";
import { StatusBadge } from "@/components/StatusBadge";
import { appendNotifications } from "@/lib/notification-flow";

type ReviewState = {
  receiptStatus: ReceiptStatus;
  orderStatus: OrderStatus;
  note: string;
};

export type CashierOrder = Order & {
  dbId?: string;
  receiptId?: string;
  receiptUrl?: string;
  reviewNote?: string;
};

const receiptPreviews: Record<string, string> = {
  "ORD-2407-001":
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
  "ORD-2407-002":
    "https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=900&q=80",
};

function initialReviewState(order: Order): ReviewState {
  return {
    receiptStatus: order.receiptStatus,
    orderStatus: order.status,
    note: order.receiptStatus === "pending" ? "Awaiting cashier review" : "Already reviewed",
  };
}

export function CashierDashboard({
  initialOrders = orders,
  reviewAction,
}: {
  initialOrders?: CashierOrder[];
  reviewAction?: (orderId: string, receiptId: string, decision: "confirmed" | "rejected") => Promise<void>;
}) {
  const [reviewState, setReviewState] = useState<Record<string, ReviewState>>(() =>
    Object.fromEntries(initialOrders.map((order) => [order.id, initialReviewState(order)])),
  );
  const [openReceiptId, setOpenReceiptId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [isPending, startTransition] = useTransition();

  const reviewedOrders = useMemo(
    () =>
      initialOrders.map((order) => ({
        ...order,
        receiptStatus: reviewState[order.id]?.receiptStatus ?? order.receiptStatus,
        status: reviewState[order.id]?.orderStatus ?? order.status,
        reviewNote: reviewState[order.id]?.note ?? order.reviewNote ?? "",
      })),
    [initialOrders, reviewState],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const visibleOrders = (showAll ? reviewedOrders : reviewedOrders.filter((order) => order.receiptStatus === "pending")).filter((order) => {
    if (!normalizedQuery) return true;
    return [order.id, order.customerName, order.receiptStatus, order.status, getBranch(order.branchId)?.name, getBranch(order.branchId)?.state]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalizedQuery));
  });
  const pendingCount = reviewedOrders.filter((order) => order.receiptStatus === "pending").length;
  const confirmedCount = reviewedOrders.filter((order) => order.receiptStatus === "confirmed").length;
  const rejectedCount = reviewedOrders.filter((order) => order.receiptStatus === "rejected").length;
  const awaitingConfirmationCount = reviewedOrders.filter((order) => order.status === "receipt_uploaded").length;
  const openOrder = openReceiptId ? reviewedOrders.find((order) => order.id === openReceiptId) : undefined;

  function confirmPayment(orderId: string) {
    const order = reviewedOrders.find((item) => item.id === orderId);

    setReviewState((current) => ({
      ...current,
      [orderId]: {
        receiptStatus: "confirmed",
        orderStatus: "paid_approved",
        note: "Payment confirmed. Order status updated to paid approved.",
      },
    }));
    appendNotifications([
      {
        channel: "dashboard",
        recipient: "seekergur@gmail.com",
        message: `Payment confirmed for ${orderId}. Order moved to paid approved${order ? ` for ${formatNaira(order.total)}` : ""}.`,
        status: "sent_simulated",
        source: "cashier",
      },
      {
        channel: "email",
        recipient: "scotfield382@gmail.com",
        message: `Payment confirmed for ${orderId}. Your order is now approved and visible to the vendor/admin team.`,
        status: "sent_simulated",
        source: "cashier",
      },
    ]);
    setNotice("Payment confirmed. Dashboard and email notification logs were updated.");

    if (reviewAction && order?.dbId && order.receiptId) {
      startTransition(async () => {
        await reviewAction(order.dbId!, order.receiptId!, "confirmed");
      });
    }
  }

  function rejectPayment(orderId: string) {
    const order = reviewedOrders.find((item) => item.id === orderId);

    setReviewState((current) => ({
      ...current,
      [orderId]: {
        receiptStatus: "rejected",
        orderStatus: "payment_rejected",
        note: "Receipt rejected. Customer should upload a clearer or matching receipt.",
      },
    }));
    setNotice("Receipt rejected. Order status was updated online when connected to Supabase.");

    if (reviewAction && order?.dbId && order.receiptId) {
      startTransition(async () => {
        await reviewAction(order.dbId!, order.receiptId!, "rejected");
      });
    }
  }

  return (
    <div className="space-y-6">
      <InAppNotice message={notice} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-ink-950">Receipt Review</h2>
          <p className="mt-1 text-sm text-ink-600">Start with receipts waiting for review, then confirm or reject customer payments clearly.</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => setShowAll((current) => !current)}
          type="button"
        >
          {showAll ? "Show pending only" : "Show all receipts"}
        </button>
      </div>
      {isPending ? <p className="rounded-md bg-warm-100 p-3 text-sm font-semibold text-warm-600">Saving payment review online...</p> : null}

      <section className="rounded-3xl border border-ink-200 bg-white/95 p-6 shadow-xl shadow-ink-950/5">
        <p className="text-sm font-black uppercase text-accent-700">Next best actions</p>
        <h2 className="mt-1 text-2xl font-black text-ink-950">What can I do here?</h2>
        <p className="mt-1 text-sm text-ink-600">Choose the payment task you want to handle now.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            [ReceiptText, "Review Pending Receipts", () => { setShowAll(false); setQuery(""); }],
            [Search, "Search Order", () => { setShowAll(true); }],
            [CheckCircle2, "View Confirmed Payments", () => { setShowAll(true); setQuery("confirmed"); }],
            [XCircle, "View Rejected Payments", () => { setShowAll(true); setQuery("rejected"); }],
          ] as Array<[LucideIcon, string, () => void]>).map(([Icon, label, action]) => (
            <button
              key={label}
              className="group flex min-h-28 items-center justify-between rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-5 py-4 text-left text-sm font-black text-slate-800 shadow-sm hover:border-emerald-300 hover:from-emerald-50 hover:to-white"
              onClick={action}
              type="button"
            >
              <span className="flex items-center gap-2"><Icon className="h-5 w-5 text-accent-700" />{label}</span>
              <span className="rounded-full bg-primary-700 px-3 py-1 text-xs text-white group-hover:bg-accent-600" aria-hidden="true">View</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {([
          { icon: ReceiptText, title: "Receipts waiting", value: pendingCount.toString(), description: pendingCount ? "Customers are waiting for review." : "No payments waiting.", action: () => { setShowAll(false); setQuery(""); } },
          { icon: CheckCircle2, title: "Confirmed today", value: confirmedCount.toString(), description: "Payments marked as confirmed.", action: () => { setShowAll(true); setQuery("confirmed"); } },
          { icon: XCircle, title: "Rejected today", value: rejectedCount.toString(), description: "Receipts rejected after review.", action: () => { setShowAll(true); setQuery("rejected"); } },
          { icon: ReceiptText, title: "Orders needing payment", value: awaitingConfirmationCount.toString(), description: awaitingConfirmationCount ? "Orders need payment action." : "Everything looks good.", action: () => { setShowAll(true); setQuery(""); } },
        ] as Array<{ icon: LucideIcon; title: string; value: string; description: string; action: () => void }>).map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="wcs-card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-700"><Icon className="h-6 w-6" /></div>
              <p className="text-sm font-semibold text-ink-500">{card.title}</p>
              <p className="mt-2 text-3xl font-black text-ink-950">{card.value}</p>
              <p className="mt-2 text-sm text-ink-600">{card.description}</p>
              <button className="btn btn-outline mt-5" onClick={card.action} type="button">View →</button>
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-ink-200 bg-white/95 p-6 shadow-xl shadow-ink-950/5">
        <h2 className="text-2xl font-black text-ink-950">Recent activity</h2>
        <div className="mt-4 grid gap-3">
          {reviewedOrders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink-300 p-5 text-sm text-ink-600">No recent activity yet.</p>
          ) : reviewedOrders.slice(0, 4).map((order) => (
            <div key={`${order.id}-activity`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-50 px-4 py-4 text-sm">
              <div>
                <p className="font-black text-ink-950">Payment receipt uploaded</p>
                <p className="mt-1 text-ink-600">{order.id} · {order.customerName} · {formatNaira(order.total)}</p>
              </div>
              <StatusBadge status={order.receiptStatus} />
            </div>
          ))}
        </div>
      </section>

      <section className="wcs-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink-950">Payments waiting for confirmation</h2>
            <p className="mt-1 text-sm text-ink-600">Search by order number, customer, or branch before opening a receipt.</p>
          </div>
          <input
            className="wcs-input h-11 w-full sm:w-80"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order number or customer"
            value={query}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]">
        {visibleOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg font-bold text-ink-950">{query ? "No receipts match your search." : "No pending receipts."}</p>
            <p className="mt-2 text-sm text-ink-600">Everything looks good.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-ink-100 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3">Order reference</th>
                  <th className="px-4 py-3">Customer name</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Receipt status</th>
                  <th className="px-4 py-3">Uploaded date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {visibleOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-black text-ink-950">{order.id}</td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3 font-semibold">{formatNaira(order.total)}</td>
                    <td className="px-4 py-3">{getBranch(order.branchId)?.name ?? order.branchId}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.receiptStatus} /></td>
                    <td className="px-4 py-3">{order.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button className="btn btn-outline h-10 px-3 py-2 text-xs" onClick={() => setOpenReceiptId(order.id)} type="button">
                          View receipt
                        </button>
                        <button className="btn btn-primary h-10 px-3 py-2 text-xs disabled:opacity-60" disabled={order.receiptStatus !== "pending"} onClick={() => confirmPayment(order.id)} type="button">
                          Confirm
                        </button>
                        <button className="btn btn-outline h-10 border-rose-300 px-3 py-2 text-xs text-rose-700 disabled:border-slate-200 disabled:text-slate-400" disabled={order.receiptStatus !== "pending"} onClick={() => rejectPayment(order.id)} type="button">
                          Reject
                        </button>
                        <Link className="rounded-md border border-ink-300 px-3 py-2 text-xs font-bold" href={`/orders/${order.id}`}>
                          Order
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {openOrder ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/70 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 p-4">
              <div>
                <p className="text-sm font-bold uppercase text-accent-700">Receipt image</p>
                <h2 className="text-xl font-black text-ink-950">{openOrder.id}</h2>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => setOpenReceiptId(null)}
                type="button"
              >
                Close
              </button>
            </div>
            <div
              className="h-[520px] bg-ink-100 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${openOrder.receiptUrl ?? receiptPreviews[openOrder.id] ?? receiptPreviews["ORD-2407-001"]})` }}
              role="img"
              aria-label={`Receipt preview for ${openOrder.id}`}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}