import Link from "next/link";
import { DesignSurface } from "@/components/DesignSurface";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { ClearCartOnSuccess } from "@/components/ClearCartOnSuccess";

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params.order ?? "your order";

  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <ClearCartOnSuccess />
      <PublicHeader />
      <main className="grid min-h-[calc(100vh-73px)] place-items-center px-4">
      <DesignSurface className="max-w-xl p-8 text-center">
        <p className="text-sm font-bold uppercase text-emerald-700">Receipt uploaded</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Order {orderNumber} is awaiting cashier confirmation.</h1>
        <p className="mt-4 leading-7 text-slate-600">
          Your receipt has been uploaded to Supabase Storage. The cashier can now confirm or reject the payment online.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link className="btn-dark" href={`/orders/${orderNumber}`}>Track order</Link>
          <Link className="btn-outline" href="/orders">My orders</Link>
          <Link className="btn-outline" href="/">Back home</Link>
        </div>
      </DesignSurface>
    </main>
    <PublicFooter />
    </div>
  );
}
