import { branches, formatNaira, products } from "@/lib/marketplace-data";

export function CheckoutForm({ action }: { action: (formData: FormData) => void }) {
  const total = products[0].price + products[2].price;

  return (
    <form action={action} className="mt-6 grid gap-4">
      <input className="h-11 rounded-md border border-slate-300 px-3" name="customer_name" placeholder="Full name" defaultValue="Fatima Ahmed" required />
      <input className="h-11 rounded-md border border-slate-300 px-3" name="customer_phone" placeholder="Phone number" defaultValue="+2348000000005" required />
      <input className="h-11 rounded-md border border-slate-300 px-3" name="customer_email" placeholder="Email address" type="email" defaultValue="customer@computermarket.local" />
      <select className="h-11 rounded-md border border-slate-300 px-3" name="branch_state" defaultValue={branches[0].state}>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.state}>{branch.name}</option>
        ))}
      </select>
      <textarea className="min-h-24 rounded-md border border-slate-300 p-3" name="support_note" placeholder="Delivery or pickup note" />
      <label className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-600">
        Upload receipt image/PDF
        <input
          className="mt-3 block w-full text-sm"
          name="receipt"
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          required
        />
      </label>
      <button
        type="submit"
        className="rounded-md bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white hover:bg-emerald-700"
      >
        Submit {formatNaira(total)} receipt for confirmation
      </button>
    </form>
  );
}
