import { CheckoutForm } from "@/components/CheckoutForm";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createCheckoutOrder } from "@/app/checkout/actions";
import { getStorefrontCatalog } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BankSettings = {
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  payment_instructions: string | null;
};

async function getBankSettings(): Promise<BankSettings | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("company_settings")
      .select("bank_name, account_name, account_number, payment_instructions")
      .eq("id", 1)
      .maybeSingle();
    if (error) return null;
    return data as BankSettings | null;
  } catch {
    return null;
  }
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const [bankSettings, { products }] = await Promise.all([getBankSettings(), getStorefrontCatalog()]);
  const hasBankDetails = Boolean(bankSettings?.bank_name && bankSettings.account_name && bankSettings.account_number);

  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <PublicHeader />
      <main className="px-4 py-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
          <p className="text-sm font-black uppercase text-emerald-700">Receipt-confirmed payment</p>
          <h1 className="text-3xl font-black text-slate-950">Manual bank transfer checkout</h1>
          <p className="mt-2 text-sm text-slate-600">Pay by manual bank transfer and upload your receipt for cashier confirmation.</p>
          {params.error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {params.error}
            </div>
          ) : null}
          <CheckoutForm action={createCheckoutOrder} products={products} />
        </section>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
          <h2 className="text-lg font-black text-white">Company bank account</h2>
          {hasBankDetails ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-slate-300">Bank</dt><dd className="font-bold">{bankSettings?.bank_name}</dd></div>
              <div><dt className="text-slate-300">Account name</dt><dd className="font-bold">{bankSettings?.account_name}</dd></div>
              <div><dt className="text-slate-300">Account number</dt><dd className="font-bold">{bankSettings?.account_number}</dd></div>
              {bankSettings?.payment_instructions ? (
                <div><dt className="text-slate-300">Instructions</dt><dd className="font-semibold text-slate-100">{bankSettings.payment_instructions}</dd></div>
              ) : null}
            </dl>
          ) : (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              Bank account details will be provided by support.
            </div>
          )}
        </aside>
      </div>
    </main>
    <PublicFooter />
    </div>
  );
}
