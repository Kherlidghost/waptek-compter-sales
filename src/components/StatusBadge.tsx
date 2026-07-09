type StatusBadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<StatusBadgeTone, string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

function getTone(status: string): StatusBadgeTone {
  const normalized = status.toLowerCase();

  if (["paid", "paid_approved", "confirmed", "completed", "fulfilled", "approved", "in_stock", "healthy", "active", "published", "featured"].includes(normalized)) {
    return "success";
  }

  if (["pending", "awaiting_receipt", "receipt_uploaded", "processing", "low_stock"].includes(normalized)) {
    return "warning";
  }

  if (["rejected", "payment_rejected", "out_of_stock", "cancelled", "archived"].includes(normalized)) {
    return "danger";
  }

  if (["review", "uploaded", "queued"].includes(normalized)) {
    return "info";
  }

  return "neutral";
}

function getDisplayLabel(status: string) {
  const labels: Record<string, string> = {
    awaiting_receipt: "Pending Payment",
    receipt_uploaded: "Receipt Uploaded",
    paid_approved: "Payment Confirmed",
    payment_rejected: "Payment Rejected",
    processing: "Processing",
    ready_for_pickup: "Ready for Pickup",
    fulfilled: "Completed",
    completed: "Completed",
    confirmed: "Payment Confirmed",
    pending: "Pending Payment",
    rejected: "Payment Rejected",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
    in_stock: "In Stock",
    active: "Published",
    published: "Published",
    inactive: "Hidden",
    archived: "Archived",
    featured: "Featured",
  };

  return labels[status.toLowerCase()] ?? status.replaceAll("_", " ");
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const displayLabel = label ?? getDisplayLabel(status);

  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold capitalize ${toneClasses[getTone(status)]}`}>
      {displayLabel}
    </span>
  );
}
