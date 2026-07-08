"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { cartStorageKey, defaultCart, defaultWishlist, wishlistStorageKey, type CartLine } from "@/lib/customer-flow";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function ProductCustomerActions({ product }: { product: Product }) {
  const [message, setMessage] = useState("");
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    setInWishlist(readJson(wishlistStorageKey, defaultWishlist).includes(product.id));
  }, [product.id]);

  function addToCart() {
    const cart = readJson<CartLine[]>(cartStorageKey, defaultCart);
    const existing = cart.find((line) => line.productId === product.id);
    const nextCart = existing
      ? cart.map((line) => (line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line))
      : [...cart, { productId: product.id, quantity: 1 }];

    writeJson(cartStorageKey, nextCart);
    setMessage(`${product.name} added to cart.`);
  }

  function toggleWishlist() {
    const wishlist = readJson(wishlistStorageKey, defaultWishlist);
    const nextWishlist = wishlist.includes(product.id)
      ? wishlist.filter((productId) => productId !== product.id)
      : [...wishlist, product.id];

    writeJson(wishlistStorageKey, nextWishlist);
    setInWishlist(nextWishlist.includes(product.id));
    setMessage(nextWishlist.includes(product.id) ? "Saved to wishlist." : "Removed from wishlist.");
  }

  return (
    <div className="mt-6 grid gap-3">
      <button
        onClick={addToCart}
        className="rounded-md bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white hover:bg-emerald-700"
        type="button"
      >
        Add to cart
      </button>
      <button
        onClick={toggleWishlist}
        className="rounded-md border border-slate-300 px-4 py-3 text-center text-sm font-bold hover:bg-slate-100"
        type="button"
      >
        {inWishlist ? "Remove from wishlist" : "Save to wishlist"}
      </button>
      <Link className="rounded-md border border-slate-300 px-4 py-3 text-center text-sm font-bold hover:bg-slate-100" href="/login?next=/checkout">
        Buy with bank transfer
      </Link>
      <a
        className="rounded-md border border-emerald-700 px-4 py-3 text-center text-sm font-bold text-emerald-800 hover:bg-emerald-50"
        href="https://wa.me/2348000000000?text=Hello%2C%20I%20need%20help%20with%20this%20marketplace%20order"
      >
        Simulated WhatsApp support
      </a>
      {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{message}</p> : null}
    </div>
  );
}
