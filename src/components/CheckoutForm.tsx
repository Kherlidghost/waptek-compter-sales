"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cartStorageKey, type CartLine } from "@/lib/customer-flow";
import { branches, formatNaira } from "@/lib/marketplace-data";
import type { Product } from "@/lib/types";

function readCart(): CartLine[] {
  const value = window.localStorage.getItem(cartStorageKey);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as CartLine[];
    return parsed.filter((line) => line.productId && Number(line.quantity) > 0);
  } catch {
    return [];
  }
}

export function CheckoutForm({
  action,
  products,
}: {
  action: (formData: FormData) => void | Promise<void>;
  products: Product[];
}) {
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    setCart(readCart());
  }, []);

  const lines = useMemo(
    () =>
      cart
        .map((line) => ({ ...line, product: products.find((p) => p.id === line.productId) }))
        .filter((line): line is CartLine & { product: Product } => Boolean(line.product)),
    [cart, products],
  );

  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const cartItems = useMemo(() => JSON.stringify(lines.map((l) => ({ productId: l.productId, quantity: l.quantity }))), [lines]);
  const hasCartItems = lines.length > 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // Mark cart for clearing; actual clear happens in order-confirmation page.
    window.localStorage.setItem("waptek-cart-pending-clear", "1");
    await action(formData);
  }

  return (
    <div className="mt-6 grid gap-6">
      {/* Cart summary */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-black uppercase text-slate-500">Order summary</p>
        {!hasCartItems ? (
          <div className="mt-3 text-sm font-semibold text-slate-700">
            Your cart is empty.{" "}
            <Link href="/products" className="text-emerald-700 underline">
              Continue shopping.
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-3 divide-y divide-slate-200">
              {lines.map((line) => (
                <li key={line.productId} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="font-semibold text-slate-900">{line.product.name}</span>
                  <span className="text-slate-500">× {line.quantity}</span>
                  <span className="font-bold text-slate-900">{formatNaira(line.product.price * line.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-slate-300 pt-3">
              <span className="font-black text-slate-950">Total</span>
              <span className="text-xl font-black text-emerald-700">{formatNaira(total)}</span>
            </div>
          </>
        )}
      </div>

      <form onSubmit={onSubmit} className="grid gap-4">
        <input name="cart_items" type="hidden" value={cartItems} />
        <input
          className="h-11 rounded-md border border-slate-300 px-3"
          name="customer_name"
          placeholder="Full name"
          required
        />
        <input
          className="h-11 rounded-md border border-slate-300 px-3"
          name="customer_phone"
          placeholder="Phone number"
          required
        />
        <input
          className="h-11 rounded-md border border-slate-300 px-3"
          name="customer_email"
          placeholder="Email address"
          type="email"
        />
        <select
          className="h-11 rounded-md border border-slate-300 px-3"
          name="branch_state"
          defaultValue={branches[0].state}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.state}>
              {branch.name}
            </option>
          ))}
        </select>
        <textarea
          className="min-h-24 rounded-md border border-slate-300 p-3"
          name="support_note"
          placeholder="Delivery or pickup note"
        />
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
    </div>
  );
}
