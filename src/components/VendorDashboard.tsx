"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { branches, categories, formatNaira, getBranch, getCategory, orders, products } from "@/lib/marketplace-data";
import { StatusBadge } from "@/components/StatusBadge";

const vendorProductsStorageKey = "computermarket-vendor-products";
const activeVendorId = "vendor-1";

type ProductForm = {
  id?: string;
  name: string;
  price: string;
  categoryId: string;
  branchId: string;
  stock: string;
  condition: Product["condition"];
  image: string;
  description: string;
  specs: string;
};

const emptyForm: ProductForm = {
  name: "",
  price: "",
  categoryId: "laptops",
  branchId: "adamawa",
  stock: "",
  condition: "New",
  image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
  description: "",
  specs: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function inventoryLabel(stock: number) {
  if (stock === 0) return { label: "Out of stock", status: "out_of_stock" };
  if (stock <= 3) return { label: "Low stock", status: "low_stock" };
  return { label: "In Stock", status: "in_stock" };
}

export function VendorDashboard() {
  const seededProducts = useMemo(() => products.filter((product) => product.vendorId === activeVendorId), []);
  const [vendorProducts, setVendorProducts] = useState<Product[]>(seededProducts);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const storedProducts = window.localStorage.getItem(vendorProductsStorageKey);
    if (!storedProducts) return;

    try {
      setVendorProducts(JSON.parse(storedProducts) as Product[]);
    } catch {
      setVendorProducts(seededProducts);
    }
  }, [seededProducts]);

  const vendorOrders = orders.filter((order) =>
    order.items.some((item) => vendorProducts.some((product) => product.id === item.productId)),
  );

  const lowStockCount = vendorProducts.filter((product) => product.stock <= 3).length;
  const pendingOrderCount = vendorOrders.filter((order) => order.status === "awaiting_receipt" || order.status === "receipt_uploaded").length;
  const paidOrderCount = vendorOrders.filter((order) => order.status === "paid_approved" || order.status === "fulfilled").length;
  const lowStockProducts = vendorProducts.filter((product) => product.stock <= 3);

  function persist(nextProducts: Product[]) {
    setVendorProducts(nextProducts);
    window.localStorage.setItem(vendorProductsStorageKey, JSON.stringify(nextProducts));
  }

  function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name || !Number.isFinite(price) || !Number.isFinite(stock)) {
      setNotice("Enter a product name, valid price, and valid stock quantity.");
      return;
    }

    const product: Product = {
      id: form.id ?? `vendor-local-${Date.now()}`,
      vendorId: activeVendorId,
      categoryId: form.categoryId,
      branchId: form.branchId,
      name,
      slug: slugify(name),
      description: form.description.trim() || "Vendor-submitted product awaiting richer description.",
      price,
      condition: form.condition,
      stock,
      image: form.image.trim() || emptyForm.image,
      specs: form.specs
        .split(",")
        .map((spec) => spec.trim())
        .filter(Boolean),
    };

    const nextProducts = form.id
      ? vendorProducts.map((item) => (item.id === form.id ? product : item))
      : [product, ...vendorProducts];

    persist(nextProducts);
    setForm(emptyForm);
    setNotice(form.id ? "Product updated locally." : "Product added locally.");
  }

  function editProduct(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      price: String(product.price),
      categoryId: product.categoryId,
      branchId: product.branchId,
      stock: String(product.stock),
      condition: product.condition,
      image: product.image,
      description: product.description,
      specs: product.specs.join(", "),
    });
    setNotice(`Editing ${product.name}.`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15">
        <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="w-fit rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-black uppercase text-emerald-200">Selling tools</p>
          <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">Welcome back, Vendor</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Focus on the next selling task: add products, update stock, or check customer orders.</p>
        </div>
        <Link className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20" href="/products">
          View public listing
        </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-950/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-emerald-700">Next best actions</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">What can I do here?</h2>
            <p className="mt-1 text-sm text-slate-600">Choose the selling task you want to handle now.</p>
          </div>
          <Link className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm shadow-emerald-950/10" href="#add-product">
            Add Product
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["📦 Add Product", "Create a live marketplace listing", "#add-product"],
            ["📦 Manage Products", "View and edit your listings", "#vendor-products"],
            ["⚙ Update Stock", `${lowStockCount} low-stock items`, "#vendor-inventory"],
            ["🧾 View Orders", "Orders for your products", "#vendor-orders"],
          ].map(([label, description, href]) => (
            <Link key={label} className="min-h-28 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm hover:border-emerald-300 hover:from-emerald-50 hover:to-white" href={href}>
              <p className="font-black text-slate-950">{label}</p>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["My products", vendorProducts.length.toString(), vendorProducts.length ? "Products listed by your business." : "No products added yet.", "Manage"],
          ["Orders waiting", pendingOrderCount.toString(), pendingOrderCount ? "Orders still waiting for payment." : "No orders waiting.", "View"],
          ["Paid orders", paidOrderCount.toString(), paidOrderCount ? "Confirmed customer orders." : "No paid orders yet.", "View"],
          ["Low stock products", lowStockCount.toString(), lowStockCount ? "Products need stock attention." : "Everything looks good.", "Manage"],
        ].map(([label, value, description, action]) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">{String(label).includes("product") ? "📦" : String(label).includes("order") ? "🧾" : "⚙"}</div>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            <p className="mt-5 w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">{action} →</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-950/5">
          <h2 className="text-2xl font-black text-slate-950">Recent activity</h2>
          <div className="mt-4 grid gap-3">
            {vendorProducts.length === 0 && vendorOrders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">No recent activity yet.</p>
            ) : [
                ...vendorProducts.slice(0, 2).map((product) => ({ title: "Vendor product added", detail: product.name, status: inventoryLabel(product.stock).status })),
                ...vendorOrders.slice(0, 2).map((order) => ({ title: "Order for vendor product", detail: `${order.id} · ${order.customerName}`, status: order.status })),
              ].map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm">
                  <div>
                    <p className="font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-slate-600">{item.detail}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
          </div>
        </div>
      </section>

      <section id="vendor-products" className="grid scroll-mt-24 gap-8 lg:grid-cols-[420px_1fr]">
        <form onSubmit={submitProduct} className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase text-emerald-700">{form.id ? "Edit local planner item" : "Local inventory planner"}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{form.id ? "Update planner item" : "Plan stock locally"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This local planner helps preview inventory data on the dashboard. Use the live online upload form above to publish products to Supabase.
          </p>
          <Link className="mt-4 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white" href="#add-product">
            Go to live product upload
          </Link>
          <div className="mt-6 grid gap-4">
            <input
              className="h-11 rounded-md border border-slate-300 px-3"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Product name"
              value={form.name}
            />
            <input
              className="h-11 rounded-md border border-slate-300 px-3"
              inputMode="numeric"
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              placeholder="Price in NGN"
              value={form.price}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className="h-11 rounded-md border border-slate-300 px-3"
                onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                value={form.categoryId}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                className="h-11 rounded-md border border-slate-300 px-3"
                onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))}
                value={form.branchId}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="h-11 rounded-md border border-slate-300 px-3"
                inputMode="numeric"
                onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                placeholder="Stock quantity"
                value={form.stock}
              />
              <select
                className="h-11 rounded-md border border-slate-300 px-3"
                onChange={(event) => setForm((current) => ({ ...current, condition: event.target.value as Product["condition"] }))}
                value={form.condition}
              >
                <option>New</option>
                <option>UK Used</option>
                <option>Refurbished</option>
              </select>
            </div>
            <input
              className="h-11 rounded-md border border-slate-300 px-3"
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
              placeholder="Image URL"
              value={form.image}
            />
            <input
              className="h-11 rounded-md border border-slate-300 px-3"
              onChange={(event) => setForm((current) => ({ ...current, specs: event.target.value }))}
              placeholder="Specs, comma separated"
              value={form.specs}
            />
            <textarea
              className="min-h-28 rounded-md border border-slate-300 p-3"
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
              value={form.description}
            />
            <div className="flex flex-wrap gap-3">
              <button className="rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white" type="submit">
                {form.id ? "Save planner changes" : "Add planner item"}
              </button>
              {form.id ? (
                <button
                  className="rounded-md border border-slate-300 px-5 py-3 text-sm font-bold"
                  onClick={() => {
                    setForm(emptyForm);
                    setNotice("");
                  }}
                  type="button"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
            {notice ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{notice}</p> : null}
          </div>
        </form>

        <section id="vendor-inventory" className="scroll-mt-24 space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-950">Own products and inventory</h2>
            <p className="mt-1 text-sm text-slate-600">Only products for the active approved vendor are shown here.</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Inventory status</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <p className="font-bold text-slate-950">No products listed yet.</p>
                      <p className="mt-1 text-sm text-slate-600">Add your first product so customers can discover it on the marketplace.</p>
                    </td>
                  </tr>
                ) : vendorProducts.map((product) => {
                  const status = inventoryLabel(product.stock);
                  return (
                    <tr key={product.id}>
                      <td className="px-4 py-3 font-semibold text-slate-950">{product.name}</td>
                      <td className="px-4 py-3">{getCategory(product.categoryId)?.name}</td>
                      <td className="px-4 py-3">{getBranch(product.branchId)?.state}</td>
                      <td className="px-4 py-3">{product.stock}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status.status} label={status.label} />
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatNaira(product.price)}</td>
                      <td className="px-4 py-3">
                        <button className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold" onClick={() => editProduct(product)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Low stock products</h2>
          <p className="mt-1 text-sm text-slate-600">Prioritize stock updates before customers place new orders.</p>
          <div className="mt-4 grid gap-3">
            {lowStockProducts.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">Everything looks good.</p>
            ) : lowStockProducts.map((product) => {
              const status = inventoryLabel(product.stock);
              return (
                <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-3 text-sm">
                  <div>
                    <p className="font-bold text-slate-950">{product.name}</p>
                    <p className="text-slate-600">{product.stock} units · {getBranch(product.branchId)?.state}</p>
                  </div>
                  <button className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold" onClick={() => editProduct(product)} type="button">
                    Update inventory
                  </button>
                  <StatusBadge status={status.status} label={status.label} />
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Recent product activity</h2>
          <p className="mt-1 text-sm text-slate-600">Latest listings and stock condition for your own catalogue.</p>
          <div className="mt-4 grid gap-3">
            {vendorProducts.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No products listed yet.</p>
            ) : vendorProducts.slice(0, 4).map((product) => {
              const status = inventoryLabel(product.stock);
              return (
                <div key={product.id} className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-3 text-sm">
                  <div>
                    <p className="font-bold text-slate-950">{product.name}</p>
                    <p className="text-slate-600">{getCategory(product.categoryId)?.name} · {getBranch(product.branchId)?.state}</p>
                  </div>
                  <StatusBadge status={status.status} label={status.label} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="vendor-orders" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">Orders for own products</h2>
          <p className="mt-1 text-sm text-slate-600">Filtered to orders that include products owned by this vendor.</p>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Vendor items</th>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Vendor total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendorOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <p className="font-bold text-slate-950">No orders yet.</p>
                    <p className="mt-1 text-sm text-slate-600">Orders that contain your products will appear here after customers checkout.</p>
                  </td>
                </tr>
              ) : vendorOrders.map((order) => {
                const ownedItems = order.items.filter((item) => vendorProducts.some((product) => product.id === item.productId));
                const vendorTotal = ownedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
                return (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-semibold text-slate-950">{order.id}</td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3">{ownedItems.length}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.receiptStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 font-semibold">{formatNaira(vendorTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
