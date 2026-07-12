"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DesignSurface } from "@/components/DesignSurface";
import { cartStorageKey, defaultCart, type CartLine } from "@/lib/customer-flow";
import { formatNaira } from "@/lib/marketplace-data";
import type { Product } from "@/lib/types";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80";

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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readCart());
    setHydrated(true);
  }, []);

  const lines = useMemo(
    () =>
      cart
        .map((line) => ({ ...line, product: products.find((p) => p.id === line.productId) }))
        .filter((line): line is CartLine & { product: Product } => Boolean(line.product)),
    [cart, products],
  );

  const total = lines.reduce((sum, line) => sum + (line.product.discountPrice ?? line.product.price) * line.quantity, 0);

  function updateQuantity(productId: string, quantity: number) {
    const nextCart = cart
      .map((line) => (line.productId === productId ? { ...line, quantity } : line))
      .filter((line) => line.quantity > 0);
    setCart(nextCart);
    writeCart(nextCart);
  }

  function removeLine(productId: string) {
    const nextCart = cart.filter((line) => line.productId !== productId);
    setCart(nextCart);
    writeCart(nextCart);
  }

  if (!hydrated) {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <DesignSurface className="p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
          🛒
        </div>
        <p className="text-lg font-black text-slate-950">Your cart is empty</p>
        <p className="mt-2 text-sm text-slate-600">Browse products and add items before checkout.</p>
        <Link
          href="/products"
          className="btn-primary mt-5"
        >
          Browse Products
        </Link>
      </DesignSurface>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Line items */}
      <DesignSurface className="overflow-hidden p-0">
        {lines.map((line, index) => {
          const unitPrice = line.product.discountPrice ?? line.product.price;
          const hasDiscount = line.product.discountPrice != null && line.product.discountPrice < line.product.price;
          return (
            <div
              key={line.product.id}
              className={`grid gap-4 p-4 sm:grid-cols-[80px_1fr_140px_100px_40px] sm:items-center ${index > 0 ? "border-t border-slate-100" : ""}`}
            >
              {/* Image */}
              <div className="relative hidden h-16 w-20 overflow-hidden rounded-xl bg-slate-100 sm:block">
                <Image
                  src={line.product.image || FALLBACK_IMAGE}
                  alt={line.product.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={line.product.image?.startsWith("https://images.unsplash.com")}
                />
              </div>

              {/* Name */}
              <div>
                <Link
                  href={`/products/${line.product.slug}`}
                  className="font-black text-slate-950 hover:text-emerald-700"
                >
                  {line.product.name}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">
                  {line.product.condition}
                  {line.product.stock <= 3 && line.product.stock > 0
                    ? ` · Only ${line.product.stock} left`
                    : ""}
                </p>
                {hasDiscount ? (
                  <p className="mt-0.5 text-xs text-slate-400 line-through">{formatNaira(line.product.price)}</p>
                ) : null}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(line.product.id, Math.max(0, line.quantity - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-sm font-bold hover:bg-slate-100"
                  aria-label="Decrease quantity"
                  type="button"
                >
                  −
                </button>
                <input
                  min={1}
                  max={line.product.stock}
                  onChange={(e) => updateQuantity(line.product.id, Math.max(1, Number(e.target.value)))}
                  type="number"
                  value={line.quantity}
                  className="h-8 w-14 rounded-lg border border-slate-300 text-center text-sm font-semibold"
                  aria-label="Quantity"
                />
                <button
                  onClick={() => updateQuantity(line.product.id, Math.min(line.product.stock, line.quantity + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-sm font-bold hover:bg-slate-100"
                  aria-label="Increase quantity"
                  type="button"
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <p className="font-black text-slate-950">{formatNaira(unitPrice * line.quantity)}</p>

              {/* Remove */}
              <button
                onClick={() => removeLine(line.product.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                aria-label={`Remove ${line.product.name}`}
                type="button"
              >
                ×
              </button>
            </div>
          );
        })}
      </DesignSurface>

      {/* Summary */}
      <DesignSurface className="h-fit p-5">
        <p className="text-sm font-black uppercase text-slate-500">Order summary</p>
        <div className="mt-4 space-y-2 text-sm">
          {lines.map((line) => (
            <div key={line.product.id} className="flex justify-between gap-2 text-slate-700">
              <span className="truncate">{line.product.name} × {line.quantity}</span>
              <span className="shrink-0 font-semibold">
                {formatNaira((line.product.discountPrice ?? line.product.price) * line.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="font-black text-slate-950">Total</p>
          <p className="text-2xl font-black text-slate-950">{formatNaira(total)}</p>
        </div>
        <div className="mt-5 grid gap-2">
          <Link
            href="/checkout"
            className="btn-primary w-full"
          >
            Proceed to Checkout
          </Link>
          <Link
            href="/products"
            className="btn-outline w-full"
          >
            Continue Shopping
          </Link>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Payment by manual bank transfer. Receipt upload required.
        </p>
      </DesignSurface>
    </div>
  );
}
