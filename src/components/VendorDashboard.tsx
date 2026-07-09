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

  const stockTotal = vendorProducts.reduce((sum, product) => sum + product.stock, 0);
  const lowStockCount = vendorProducts.filter((product) => product.stock <= 3).length;
  const outOfStockCount = vendorProducts.filter((product) => product.stock === 0).length;
  const activeProductsCount = vendorProducts.filter((product) => product.stock > 0).length;
  const pendingOrderCount = vendorOrders.filter((order) => order.status === "awaiting_receipt" || order.status === "receipt_uploaded").length;
  const paidOrderCount = vendorOrders.filter((order) => order.status === "paid_approved" || order.status === "fulfilled").length;
  const lowStockProducts = vendorProducts.filter((product) => product.stock <= 3);
  const topProduct = vendorProducts
    .map((product) => {
      const orderedUnits = vendorOrders.reduce(
        (sum, order) => sum + order.items.filter((item) => item.productId === product.id).reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      );
      return { product, orderedUnits };
    })
    .sort((a, b) => b.orderedUnits - a.orderedUnits)[0];
  const revenue = vendorOrders.reduce((sum, order) => {
    const orderVendorTotal = order.items.reduce((itemSum, item) => {
      const belongsToVendor = vendorProducts.some((product) => product.id === item.productId);
      return belongsToVendor ? itemSum + item.price * item.quantity : itemSum;
    }, 0);
    return sum + orderVendorTotal;
  }, 0);

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
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-emerald-700">Role: Vendor</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Vendor dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Manage your own product listings, inventory, and order visibility. Vendors cannot confirm payments or view other vendors’ orders.</p>
        </div>
        <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold" href="/products">
          View public listing
        </Link>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-600">Manage listings, inventory, and vendor order visibility.</p>
          </div>
          <Link className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white" href="#add-product">
            Add Product
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Manage Products", "Own products and inventory", "#vendor-products"],
            ["View Orders", "Orders for own products", "#vendor-orders"],
            ["Update Inventory", `${lowStockCount} low-stock items`, "#vendor-inventory"],
            ["Add Product", "Create a live marketplace listing", "#add-product"],
          ].map(([label, description, href]) => (
            <Link key={label} className="rounded-md border border-slate-200 bg-slate-50 p-4 hover:border-emerald-300 hover:bg-emerald-50" href={href}>
              <p className="font-black text-slate-950">{label}</p>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Own products", vendorProducts.length.toString(), "Your active catalogue in the marketplace.", "Manage"],
          ["Active products", activeProductsCount.toString(), "Products currently available to buyers.", "View"],
          ["Low stock products", lowStockCount.toString(), "Products that need stock attention.", "Manage"],
          ["Orders for vendor products", vendorOrders.length.toString(), "Orders containing your listings.", "View"],
          ["Pending orders", pendingOrderCount.toString(), "Orders awaiting payment completion.", "View"],
          ["Paid orders", paidOrderCount.toString(), "Confirmed orders ready for processing.", "View"],
          ["Product performance", formatNaira(revenue), "Order value tied to your products.", "View"],
          ["Top product", topProduct?.product.name ?? "No orders yet", "Best performing item by ordered units.", "View"],
        ].map(([label, value, description, action]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            <p className="mt-4 text-sm font-black text-emerald-800">{action} →</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Product performance cards</h2>
          <div className="mt-4 grid gap-3">
            {[
              ["Order value", formatNaira(revenue)],
              ["Inventory units", stockTotal.toString()],
              ["Out of stock", outOfStockCount.toString()],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-3 text-sm">
                <span className="font-semibold text-slate-700">{label}</span>
                <span className="font-black text-slate-950">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Recent activity</h2>
          <div className="mt-4 grid gap-3">
            {vendorProducts.length === 0 && vendorOrders.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No recent activity yet.</p>
            ) : [
                ...vendorProducts.slice(0, 2).map((product) => ({ title: "Vendor product added", detail: product.name, status: inventoryLabel(product.stock).status })),
                ...vendorOrders.slice(0, 2).map((order) => ({ title: "Order for vendor product", detail: `${order.id} · ${order.customerName}`, status: order.status })),
              ].map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-3 text-sm">
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
              <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No low stock products.</p>
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
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Product performance summary</h2>
          <p className="mt-1 text-sm text-slate-600">A simple view of order value tied to your own items.</p>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between rounded-md bg-slate-50 px-3 py-3">
              <span className="font-semibold text-slate-700">Vendor order value</span>
              <span className="font-black text-slate-950">{formatNaira(revenue)}</span>
            </div>
            <div className="flex justify-between rounded-md bg-slate-50 px-3 py-3">
              <span className="font-semibold text-slate-700">Inventory units</span>
              <span className="font-black text-slate-950">{stockTotal}</span>
            </div>
            <div className="flex justify-between rounded-md bg-slate-50 px-3 py-3">
              <span className="font-semibold text-slate-700">Orders awaiting payment review</span>
              <span className="font-black text-slate-950">{pendingOrderCount}</span>
            </div>
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
