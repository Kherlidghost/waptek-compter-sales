"use client";

import Link from "next/link";

export function DashboardErrorFallback({
  title = "Dashboard could not load",
  reset,
}: {
  title?: string;
  reset: () => void;
}) {
  return (
    <main className="min-h-screen dashboard-shell px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <section className="premium-panel mx-auto max-w-3xl rounded-2xl p-6 shadow-xl shadow-slate-950/5">
        <p className="text-sm font-black uppercase text-red-700">Dashboard recovery</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
        <p className="mt-3 leading-7 text-slate-600">
          We could not load this workspace just now. Refresh the page, or sign in again if your session has expired.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800"
            onClick={reset}
            type="button"
          >
            Try Again
          </button>
          <Link className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-900 hover:border-emerald-500" href="/login">
            Sign In Again
          </Link>
          <Link className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-900 hover:border-emerald-500" href="/">
            Go Home
          </Link>
        </div>
      </section>
    </main>
  );
}
