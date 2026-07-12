"use client";

import { useState } from "react";
import { cartStorageKey, defaultCart, type CartLine } from "@/lib/customer-flow";

function readCart() {
  const value = window.localStorage.getItem(cartStorageKey);
  if (!value) return defaultCart;

  try {
    return JSON.parse(value) as CartLine[];
  } catch {
    return defaultCart;
  }
}

export function AddToCartButton({ productId, productName, disabled }: { productId: string; productName: string; disabled?: boolean }) {
  const [message, setMessage] = useState("");

  function addToCart() {
    const cart = readCart();
    const existing = cart.find((line) => line.productId === productId);
    const nextCart = existing
      ? cart.map((line) => (line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line))
      : [...cart, { productId, quantity: 1 }];

    window.localStorage.setItem(cartStorageKey, JSON.stringify(nextCart));
    setMessage(`${productName} added to cart.`);
    window.setTimeout(() => setMessage(""), 3000);
  }

  return (
    <div>
      <button
        className="btn-primary w-full"
        disabled={disabled}
        onClick={addToCart}
        type="button"
      >
        Add to Cart
      </button>
      {message ? <p className="mt-2 text-xs font-semibold text-emerald-700">{message}</p> : null}
    </div>
  );
}
