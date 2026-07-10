"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cartStorageKey, defaultCart, type CartLine } from "@/lib/customer-flow";
import { formatNaira } from "@/lib/marketplace-data";
import type { Product } from "@/lib/types";

function readCart() {
  const value = window.localStorage.getItem(cartStorageKey);
  if (!value) return defaultCart;

  try {
    return JSON.parse(value) as CartLine[];
  } catch {
    return defaultCart;
  }
}

function writeCart(cart: CartLine[]) {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
}

export function CartManager({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartLine[]>(defaultCart);

  useEffect(() => {
    setCart(readCart());
  }, []);

  const lines = useMemo(
    () =>
      cart
        .map((line) => ({ ...line, product: products.find((product) => product.id === line.productId) }))
        .filter((line): line is CartLine & { product: Product } => Boolean(line.product)),
    [cart, products],
  );

  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  function updateQuantity(productId: string, quantity: number) {
    const nextCart = cart
      .map((line) => (line.productId === productId ? { ...line, quantity } : line))
      .filter((line) => line.quantity > 0);
    setCart(nextCart);
    writeCart(nextCart);
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
        {lines.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg font-bold text-slate-950">Your cart is empty</p>
            <p className="mt-2 text-sm text-slate-600">Browse products and add items before checkout.</p>
          </div>
        ) : null}
        {lines.map((line) => (
          <div key={line.product.id} className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-[1fr_140px_120px] md:items-center">
            <div>
              <Link href={`/products/${line.product.slug}`} className="font-bold text-slate-950 hover:text-emerald-700">
                {line.product.name}
              </Link>
              <p className="text-sm text-slate-500">{line.product.condition} · {line.product.stock} in stock</p>
            </div>
            <input
              min={0}
              max={line.product.stock}
              onChange={(event) => updateQuantity(line.product.id, Number(event.target.value))}
              type="number"
              value={line.quantity}
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold"
            />
            <p className="font-bold">{formatNaira(line.product.price * line.quantity)}</p>
          </div>
        ))}
        <div className="flex items-center justify-between p-5">
          <p className="text-lg font-black">Total</p>
          <p className="text-2xl font-black">{formatNaira(total)}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-sm shadow-emerald-950/10" href="/checkout">
          Continue to checkout
        </Link>
        <Link className="rounded-lg border border-slate-300 bg-white/80 px-6 py-3 text-sm font-black" href="/products">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
