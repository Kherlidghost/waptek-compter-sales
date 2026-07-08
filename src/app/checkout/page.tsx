import { CheckoutForm } from "@/components/CheckoutForm";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createCheckoutOrder } from "@/app/checkout/actions";
import { formatNaira, products } from "@/lib/marketplace-data";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const total = products[0].price + products[2].price;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="px-4 py-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-slate-950">Manual bank transfer checkout</h1>
          <p className="mt-2 text-sm text-slate-600">No Paystack or Flutterwave in this POC. Upload a transfer receipt for cashier confirmation.</p>
          {params.error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {params.error}
            </div>
          ) : null}
          <CheckoutForm action={createCheckoutOrder} />
        </section>
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Company bank account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-slate-500">Bank</dt><dd className="font-bold">POC Trust Bank</dd></div>
            <div><dt className="text-slate-500">Account name</dt><dd className="font-bold">CompuMarket Nigeria Ltd</dd></div>
            <div><dt className="text-slate-500">Account number</dt><dd className="font-bold">0123456789</dd></div>
            <div><dt className="text-slate-500">Amount</dt><dd className="text-2xl font-black">{formatNaira(total)}</dd></div>
          </dl>
        </aside>
      </div>
    </main>
    <PublicFooter />
    </div>
  );
}
