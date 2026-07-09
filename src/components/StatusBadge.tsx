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

  if (["paid", "paid_approved", "confirmed", "completed", "fulfilled", "approved", "in_stock", "healthy", "active"].includes(normalized)) {
    return "success";
  }

  if (["pending", "awaiting_receipt", "receipt_uploaded", "processing", "low_stock"].includes(normalized)) {
    return "warning";
  }

  if (["rejected", "payment_rejected", "out_of_stock", "cancelled"].includes(normalized)) {
    return "danger";
  }

  if (["review", "uploaded", "queued"].includes(normalized)) {
    return "info";
  }

  return "neutral";
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const displayLabel = label ?? status.replaceAll("_", " ");

  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold capitalize ${toneClasses[getTone(status)]}`}>
      {displayLabel}
    </span>
  );
}
