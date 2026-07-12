"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DesignSurface } from "@/components/DesignSurface";
import { cartStorageKey, type CartLine } from "@/lib/customer-flow";
import { branches, formatNaira } from "@/lib/marketplace-data";
import type { Product } from "@/lib/types";

function readCart(): CartLine[] {
  const value = window.localStorage.getItem(cartStorageKey);
  console.log("[Cart] source=localStorage key=", cartStorageKey, "raw=", value);
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
  catalogSource,
}: {
  action: (formData: FormData) => void | Promise<void>;
  products: Product[];
  catalogSource: "database" | "seed";
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = readCart();
    console.log("[Cart] item count=", raw.length, "productIds=", raw.map((l) => l.productId));
    console.log("[Catalog] source=", catalogSource, "product count=", products.length, "ids=", products.map((p) => p.id));
    setCart(raw);
    setHydrated(true);

    if (raw.length === 0) {
      console.log("[Checkout] Cart is empty — redirecting to /cart");
      router.replace("/cart");
    }
  }, [catalogSource, products, router]);

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
    const payload = lines.map((l) => ({ productId: l.productId, quantity: l.quantity }));
    console.log("[Checkout] submitting payload=", payload, "total=", total, "catalogSource=", catalogSource);
    const formData = new FormData(event.currentTarget);
    // Mark cart for clearing; actual clear happens in order-confirmation page.
    window.localStorage.setItem("waptek-cart-pending-clear", "1");
    await action(formData);
  }

  // Before hydration, render nothing to avoid flash.
  if (!hydrated) return null;

  if (!hasCartItems) {
    return (
      <DesignSurface className="mt-6 p-8 text-center">
        <p className="font-bold text-slate-950">Your cart is empty.</p>
        <p className="mt-2 text-sm text-slate-600">Add products before checkout.</p>
        <Link
          href="/products"
          className="btn-primary mt-4"
        >
          Browse Products
        </Link>
      </DesignSurface>
    );
  }

  return (
    <div className="mt-6 grid gap-6">
      {/* Cart summary */}
      <DesignSurface className="p-4">
        <p className="text-sm font-black uppercase text-slate-500">Order summary</p>
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
      </DesignSurface>

      <form onSubmit={onSubmit} className="grid gap-4">
        <input name="cart_items" type="hidden" value={cartItems} />
        <input
          className="wcs-input"
          name="customer_name"
          placeholder="Full name"
          required
        />
        <input
          className="wcs-input"
          name="customer_phone"
          placeholder="Phone number"
          required
        />
        <input
          className="wcs-input"
          name="customer_email"
          placeholder="Email address"
          type="email"
        />
        <select
          className="wcs-input"
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
          className="wcs-input min-h-24 rounded-2xl p-3"
          name="support_note"
          placeholder="Delivery or pickup note"
        />
        <label className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
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
          className="btn-primary w-full"
        >
          Submit receipt for confirmation
        </button>
      </form>
    </div>
  );
}
