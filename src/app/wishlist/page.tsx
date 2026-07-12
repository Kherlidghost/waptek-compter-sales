import Link from "next/link";
import { DesignSurface } from "@/components/DesignSurface";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { WishlistManager } from "@/components/WishlistManager";

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DesignSurface className="mb-6 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-700">Customer wishlist</p>
              <h1 className="mt-1 text-3xl font-black text-slate-950">Saved products</h1>
              <p className="mt-2 text-sm text-slate-600">Wishlist changes are saved on this device for quick shopping access.</p>
            </div>
            <Link className="btn-outline" href="/products">
              Browse products
            </Link>
          </div>
        </DesignSurface>
        <WishlistManager />
      </main>
      <PublicFooter />
    </div>
  );
}
