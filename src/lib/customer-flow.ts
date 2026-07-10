import { orders, products } from "./marketplace-data";

export const cartStorageKey = "waptek-cart";
export const wishlistStorageKey = "waptek-wishlist";
export const reviewStorageKey = "waptek-reviews";

export type CartLine = {
  productId: string;
  quantity: number;
};

export type LocalReview = {
  productId: string;
  name: string;
  rating: number;
  comment: string;
};

export const defaultCart: CartLine[] = [];

export const defaultWishlist = [products[1].id, products[4].id];

export const sampleReviews: LocalReview[] = [
  {
    productId: products[0].id,
    name: "Fatima Ahmed",
    rating: 5,
    comment: "Clean laptop and quick pickup from Yola branch.",
  },
  {
    productId: products[2].id,
    name: "Daniel Yakubu",
    rating: 4,
    comment: "Keyboard and mouse worked well for office setup.",
  },
];

export const trackedOrders = [
  ...orders,
  {
    id: "ORD-2407-003",
    customerName: "Sample Customer",
    branchId: "adamawa",
    status: "receipt_uploaded" as const,
    total: products[0].price + products[2].price,
    receiptStatus: "pending" as const,
    createdAt: "2026-07-07",
    items: [
      { productId: products[0].id, quantity: 1, price: products[0].price },
      { productId: products[2].id, quantity: 1, price: products[2].price },
    ],
  },
];

export const orderSteps = [
  { key: "awaiting_receipt", label: "Order placed" },
  { key: "receipt_uploaded", label: "Receipt uploaded" },
  { key: "paid_approved", label: "Payment confirmed" },
  { key: "processing", label: "Preparing order" },
  { key: "ready_for_pickup", label: "Ready" },
  { key: "fulfilled", label: "Completed" },
];

export function getTrackedOrder(id: string) {
  return trackedOrders.find((order) => order.id.toLowerCase() === id.toLowerCase());
}
