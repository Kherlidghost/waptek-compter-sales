import { CartManager } from "@/components/CartManager";
import { PublicHeader } from "@/components/PublicHeader";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-black text-slate-950">Shopping cart</h1>
          <p className="mt-2 text-sm text-slate-600">Update quantities locally before manual bank transfer checkout.</p>
          <div className="mt-6">
            <CartManager />
          </div>
        </div>
      </main>
    </div>
  );
}
