import { CartManager } from "@/components/CartManager";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { getStorefrontCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const { products } = await getStorefrontCatalog();

  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <PublicHeader />
      <main className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-950/5">
            <p className="text-sm font-black uppercase text-emerald-700">Secure cart</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Shopping cart</h1>
            <p className="mt-2 text-sm text-slate-600">Review your items before receipt-confirmed manual bank transfer checkout.</p>
          </section>
          <div className="mt-6">
            <CartManager products={products} />
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
