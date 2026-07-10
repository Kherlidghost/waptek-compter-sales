"use client";

import { useEffect, useMemo, useState } from "react";
import { cartStorageKey, type CartLine } from "@/lib/customer-flow";
import { branches } from "@/lib/marketplace-data";

function readCart() {
  const value = window.localStorage.getItem(cartStorageKey);
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as CartLine[];
    return parsed.filter((line) => line.productId && Number(line.quantity) > 0);
  } catch {
    return [];
  }
}

export function CheckoutForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    setCart(readCart());
  }, []);

  const cartItems = useMemo(() => JSON.stringify(cart), [cart]);
  const hasCartItems = cart.length > 0;

  return (
    <form action={action} className="mt-6 grid gap-4">
      <input name="cart_items" type="hidden" value={cartItems} />
      {!hasCartItems ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Your cart is empty. Add products to cart before submitting checkout.
        </div>
      ) : null}
      <input className="h-11 rounded-md border border-slate-300 px-3" name="customer_name" placeholder="Full name" required />
      <input className="h-11 rounded-md border border-slate-300 px-3" name="customer_phone" placeholder="Phone number" required />
      <input className="h-11 rounded-md border border-slate-300 px-3" name="customer_email" placeholder="Email address" type="email" />
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
        className="rounded-md bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={!hasCartItems}
      >
        Submit receipt for confirmation
      </button>
    </form>
  );
}
