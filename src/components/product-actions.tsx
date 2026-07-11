"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { buildWhatsAppUrl, productInquiryMessage } from "@/lib/whatsapp";
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

export function ProductActions({
  product,
  whatsAppNumber,
  formattedPrice,
  location,
  productUrl,
}: {
  product: Product;
  whatsAppNumber?: string | null;
  formattedPrice: string;
  location: string;
  productUrl: string;
}) {
  const [message, setMessage] = useState("");
  const [inWishlist, setInWishlist] = useState(false);
  const outOfStock = product.stock <= 0;

  useEffect(() => {
    setInWishlist(readJson(wishlistStorageKey, defaultWishlist).includes(product.id));
  }, [product.id]);

  function addToCart() {
    if (outOfStock) {
      setMessage("This product is currently out of stock.");
      return false;
    }

    const cart = readJson<CartLine[]>(cartStorageKey, defaultCart);
    const existing = cart.find((line) => line.productId === product.id);
    const nextCart = existing
      ? cart.map((line) => (line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line))
      : [...cart, { productId: product.id, quantity: 1 }];

    writeJson(cartStorageKey, nextCart);
    setMessage(`${product.name} added to cart.`);
    return true;
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

  function buyNow() {
    if (addToCart()) {
      window.location.href = "/cart";
    }
  }

  const whatsAppUrl = whatsAppNumber
    ? buildWhatsAppUrl(
        whatsAppNumber,
        productInquiryMessage({
          productName: product.name,
          price: formattedPrice,
          location,
          vendorName: product.vendorName ?? "WAPTEK COMPUTER SERVICES",
          url: productUrl,
        }),
      )
    : null;

  return (
    <div className="mt-6 grid gap-3">
      <button
        onClick={addToCart}
        className="rounded-lg bg-slate-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        type="button"
        disabled={outOfStock}
      >
        {outOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
      <button
        onClick={buyNow}
        className="rounded-lg bg-emerald-700 px-4 py-3 text-center text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        type="button"
        disabled={outOfStock}
      >
        Buy Now
      </button>
      <button
        onClick={toggleWishlist}
        className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-black hover:bg-slate-100"
        type="button"
      >
        {inWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
      </button>
      <Link className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-black hover:bg-slate-100" href="/login?next=/checkout">
        Pay by Bank Transfer
      </Link>
      {whatsAppUrl ? (
        <a
          className="rounded-lg border border-emerald-700 px-4 py-3 text-center text-sm font-black text-emerald-800 hover:bg-emerald-50"
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ask on WhatsApp
        </a>
      ) : null}
      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{message}</p> : null}
    </div>
  );
}

