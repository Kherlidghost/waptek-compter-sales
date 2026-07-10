"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
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
    <div className="mx-auto max-w-6xl space-y-6">
      <InAppNotice message={notice} />
      <header className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15">
        <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="w-fit rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-black uppercase text-emerald-200">Payments</p>
          <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">Welcome back, Cashier</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Start with receipts waiting for review, then confirm or reject customer payments clearly.</p>
        </div>
        <button
          className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20"
          onClick={() => setShowAll((current) => !current)}
          type="button"
        >
          {showAll ? "Show pending only" : "Show all receipts"}
        </button>
        </div>
      </header>
      {isPending ? <p className="rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">Saving payment review online...</p> : null}

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-950/5">
        <p className="text-sm font-black uppercase text-emerald-700">Next best actions</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">What can I do here?</h2>
        <p className="mt-1 text-sm text-slate-600">Choose the payment task you want to handle now.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["🧾 Review Pending Receipts", () => { setShowAll(false); setQuery(""); }],
            ["🔎 Search Order", () => { setShowAll(true); }],
            ["💰 View Confirmed Payments", () => { setShowAll(true); setQuery("confirmed"); }],
          ].map(([label, action]) => (
            <button
              key={String(label)}
              className="group flex min-h-28 items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-5 py-4 text-left text-sm font-black text-slate-800 shadow-sm hover:border-emerald-300 hover:from-emerald-50 hover:to-white"
              onClick={action as () => void}
              type="button"
            >
              <span>{String(label)}</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white group-hover:bg-emerald-700" aria-hidden="true">View</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Receipts waiting", value: pendingCount.toString(), description: pendingCount ? "Customers are waiting for review." : "No payments waiting.", action: () => { setShowAll(false); setQuery(""); } },
          { title: "Confirmed today", value: confirmedCount.toString(), description: "Payments marked as confirmed.", action: () => { setShowAll(true); setQuery("confirmed"); } },
          { title: "Rejected today", value: rejectedCount.toString(), description: "Receipts rejected after review.", action: () => { setShowAll(true); setQuery("rejected"); } },
          { title: "Orders needing payment", value: awaitingConfirmationCount.toString(), description: awaitingConfirmationCount ? "Orders need payment action." : "Everything looks good.", action: () => { setShowAll(true); setQuery(""); } },
        ].map((card) => (
          <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">{card.title.includes("Receipt") ? "🧾" : card.title.includes("Confirmed") ? "💰" : card.title.includes("Rejected") ? "!" : "🧾"}</div>
            <p className="text-sm font-semibold text-slate-500">{card.title}</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{card.value}</p>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            <button className="mt-5 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800" onClick={card.action} type="button">View →</button>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-950/5">
        <h2 className="text-2xl font-black text-slate-950">Recent activity</h2>
        <div className="mt-4 grid gap-3">
          {reviewedOrders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">No recent activity yet.</p>
          ) : reviewedOrders.slice(0, 4).map((order) => (
            <div key={`${order.id}-activity`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm">
              <div>
                <p className="font-black text-slate-950">Payment receipt uploaded</p>
                <p className="mt-1 text-slate-600">{order.id} · {order.customerName} · {formatNaira(order.total)}</p>
              </div>
              <StatusBadge status={order.receiptStatus} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Payments waiting for confirmation</h2>
            <p className="mt-1 text-sm text-slate-600">Search by order number, customer, or branch before opening a receipt.</p>
          </div>
          <input
            className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm sm:w-80"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order number or customer"
            value={query}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {visibleOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg font-bold text-slate-950">{query ? "No receipts match your search." : "No pending receipts."}</p>
            <p className="mt-2 text-sm text-slate-600">Everything looks good.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
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
              <tbody className="divide-y divide-slate-100">
                {visibleOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-black text-slate-950">{order.id}</td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3 font-semibold">{formatNaira(order.total)}</td>
                    <td className="px-4 py-3">{getBranch(order.branchId)?.name ?? order.branchId}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.receiptStatus} /></td>
                    <td className="px-4 py-3">{order.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold" onClick={() => setOpenReceiptId(order.id)} type="button">
                          View receipt
                        </button>
                        <button className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-300" disabled={order.receiptStatus !== "pending"} onClick={() => confirmPayment(order.id)} type="button">
                          Confirm
                        </button>
                        <button className="rounded-md border border-red-300 px-3 py-2 text-xs font-bold text-red-700 disabled:border-slate-200 disabled:text-slate-400" disabled={order.receiptStatus !== "pending"} onClick={() => rejectPayment(order.id)} type="button">
                          Reject
                        </button>
                        <Link className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold" href={`/orders/${order.id}`}>
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <p className="text-sm font-bold uppercase text-emerald-700">Receipt image</p>
                <h2 className="text-xl font-black text-slate-950">{openOrder.id}</h2>
              </div>
              <button
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold"
                onClick={() => setOpenReceiptId(null)}
                type="button"
              >
                Close
              </button>
            </div>
            <div
              className="h-[520px] bg-slate-100 bg-contain bg-center bg-no-repeat"
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
