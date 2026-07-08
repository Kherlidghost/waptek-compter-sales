import { CartManager } from "@/components/CartManager";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { getStorefrontCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const { products } = await getStorefrontCatalog();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-black text-slate-950">Shopping cart</h1>
          <p className="mt-2 text-sm text-slate-600">Update quantities locally before manual bank transfer checkout.</p>
          <div className="mt-6">
            <CartManager products={products} />
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
