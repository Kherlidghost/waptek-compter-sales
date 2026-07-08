import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { WishlistManager } from "@/components/WishlistManager";

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">Customer wishlist</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Saved products</h1>
            <p className="mt-2 text-sm text-slate-600">Wishlist changes are stored locally for this POC session.</p>
          </div>
          <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold" href="/products">
            Browse products
          </Link>
        </div>
        <WishlistManager />
      </main>
      <PublicFooter />
    </div>
  );
}
