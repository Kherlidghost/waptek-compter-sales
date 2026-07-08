"use client";

import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/ProductCard";
import { defaultWishlist, wishlistStorageKey } from "@/lib/customer-flow";
import { products } from "@/lib/marketplace-data";

export function WishlistManager() {
  const [wishlist, setWishlist] = useState(defaultWishlist);

  useEffect(() => {
    const value = window.localStorage.getItem(wishlistStorageKey);
    if (value) {
      try {
        setWishlist(JSON.parse(value) as string[]);
      } catch {
        setWishlist(defaultWishlist);
      }
    }
  }, []);

  const wishlistProducts = products.filter((product) => wishlist.includes(product.id));

  return <ProductGrid products={wishlistProducts} />;
}
