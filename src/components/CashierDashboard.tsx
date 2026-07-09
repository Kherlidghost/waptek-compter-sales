"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Order, OrderStatus, ReceiptStatus } from "@/lib/types";
import { formatNaira, getBranch, orders } from "@/lib/marketplace-data";
import { InAppNotice } from "@/components/InAppNotice";
import { NotificationLog } from "@/components/NotificationLog";
import { RepairRequestsPanel } from "@/components/RepairRequestsPanel";
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
    return [order.id, order.customerName, getBranch(order.branchId)?.name, getBranch(order.branchId)?.state]
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
      {
        channel: "whatsapp",
        recipient: "+2348000000005",
        message: `Simulated WhatsApp: Payment confirmed for ${orderId}. Your order has been approved.`,
        status: "queued",
        source: "cashier",
      },
    ]);
    setNotice("Payment confirmed. Simulated email, WhatsApp, and dashboard notifications were logged.");

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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-emerald-700">Role: Cashier</p>
          <h1 className="text-3xl font-black text-slate-950">Payment receipt confirmation</h1>
          <p className="mt-2 text-sm text-slate-600">
            Confirm or reject uploaded bank transfer receipts for your assigned branch. Cashiers do not manage products, vendors, or global reports.
          </p>
        </div>
        <button
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-white"
          onClick={() => setShowAll((current) => !current)}
          type="button"
        >
          {showAll ? "Show pending only" : "Show all receipts"}
        </button>
      </header>
      {isPending ? <p className="rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">Saving payment review online...</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Pending receipts", pendingCount.toString()],
          ["Confirmed payments", confirmedCount.toString()],
          ["Rejected receipts", rejectedCount.toString()],
          ["Awaiting confirmation", awaitingConfirmationCount.toString()],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Recent payment receipts</h2>
            <p className="mt-1 text-sm text-slate-600">Search by order number, customer, or branch before opening a receipt image.</p>
          </div>
          <input
            className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm sm:w-80"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order number or customer"
            value={query}
          />
        </div>
      </section>

      <section className="grid gap-4">
        {visibleOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-lg font-bold text-slate-950">{query ? "No receipts match your search." : "No pending receipts."}</p>
            <p className="mt-2 text-sm text-slate-600">Confirmed and rejected receipts can be viewed with the all receipts toggle.</p>
          </div>
        ) : (
          visibleOrders.map((order) => (
            <article key={order.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-slate-950">{order.id}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {order.customerName} uploaded receipt for {formatNaira(order.total)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {getBranch(order.branchId)?.name ?? order.branchId} · {order.createdAt}
                  </p>
                </div>
                <StatusBadge status={order.receiptStatus} />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
                <button
                  className="h-36 rounded-md border border-slate-200 bg-cover bg-center text-left shadow-sm"
                  onClick={() => setOpenReceiptId(order.id)}
                  style={{ backgroundImage: `url(${order.receiptUrl ?? receiptPreviews[order.id] ?? receiptPreviews["ORD-2407-001"]})` }}
                  type="button"
                  aria-label={`Open receipt for ${order.id}`}
                />
                <div className="rounded-md bg-slate-50 p-4 text-sm">
                  <dl className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <dt className="text-slate-500">Order status</dt>
                      <dd className="mt-1">
                        <StatusBadge status={order.status} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Receipt file</dt>
                      <dd className="mt-1 font-bold text-slate-950">{order.receiptId ? "Supabase Storage receipt" : `${order.id.toLowerCase()}-receipt.jpg`}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Review note</dt>
                      <dd className="mt-1 font-bold text-slate-950">{order.reviewNote}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      disabled={order.receiptStatus !== "pending"}
                      onClick={() => confirmPayment(order.id)}
                      type="button"
                    >
                      Confirm payment
                    </button>
                    <button
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      disabled={order.receiptStatus !== "pending"}
                      onClick={() => rejectPayment(order.id)}
                      type="button"
                    >
                      Reject receipt
                    </button>
                    <button
                      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold"
                      onClick={() => setOpenReceiptId(order.id)}
                      type="button"
                    >
                      Open receipt image
                    </button>
                    <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold" href={`/orders/${order.id}`}>
                      View order details
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))
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

      <RepairRequestsPanel compact />

      <NotificationLog title="Cashier notification logs" />
    </div>
  );
}
