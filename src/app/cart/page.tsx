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
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
          <p className="section-eyebrow mb-1">Secure cart</p>
          <h1 className="text-3xl font-black text-slate-950">Shopping Cart</h1>
          <p className="mt-2 text-sm text-slate-600">
            Review your items before proceeding to receipt-confirmed manual bank transfer checkout.
          </p>
        </section>
        <CartManager products={products} />
      </main>
      <PublicFooter />
    </div>
  );
}
