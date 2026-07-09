"use client";

export function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
    >
      Print invoice
    </button>
  );
}
