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
  const [quantity, setQuantity] = useState(1);
  const outOfStock = product.stock <= 0;
  const maxQuantity = Math.max(1, product.stock);

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
    const safeQuantity = Math.min(maxQuantity, Math.max(1, quantity));
    const nextCart = existing
      ? cart.map((line) => (line.productId === product.id ? { ...line, quantity: Math.min(maxQuantity, line.quantity + safeQuantity) } : line))
      : [...cart, { productId: product.id, quantity: safeQuantity }];

    writeJson(cartStorageKey, nextCart);
    setMessage(`${safeQuantity} × ${product.name} added to cart.`);
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
      <div className="wcs-card p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Quantity</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{product.stock} available</p>
          </div>
          <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white">
            <button
              aria-label="Reduce quantity"
              className="h-10 w-10 text-lg font-black text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
              disabled={quantity <= 1 || outOfStock}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              type="button"
            >
              −
            </button>
            <input
              aria-label="Quantity"
              className="h-10 w-14 border-x border-slate-200 text-center text-sm font-black outline-none"
              max={maxQuantity}
              min={1}
              onChange={(event) => {
                const next = Math.floor(Number(event.target.value));
                setQuantity(Number.isFinite(next) ? Math.min(maxQuantity, Math.max(1, next)) : 1);
              }}
              type="number"
              value={quantity}
              disabled={outOfStock}
            />
            <button
              aria-label="Increase quantity"
              className="h-10 w-10 text-lg font-black text-slate-700 hover:bg-slate-100 disabled:text-slate-300"
              disabled={quantity >= maxQuantity || outOfStock}
              onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
              type="button"
            >
              +
            </button>
          </div>
        </div>
      </div>
      <button
        onClick={addToCart}
        className="btn-dark w-full"
        type="button"
        disabled={outOfStock}
      >
        {outOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
      <button
        onClick={buyNow}
        className="btn-primary w-full"
        type="button"
        disabled={outOfStock}
      >
        Buy Now
      </button>
      <button
        onClick={toggleWishlist}
        className="btn-outline w-full"
        type="button"
      >
        {inWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
      </button>
      <Link className="btn-outline w-full" href="/login?next=/checkout">
        Pay by Bank Transfer
      </Link>
      {whatsAppUrl ? (
        <a
          className="btn-outline w-full border-emerald-700 text-emerald-800 hover:bg-emerald-50"
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
