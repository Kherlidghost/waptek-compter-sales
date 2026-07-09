"use client";

import { useMemo, useState } from "react";
import type { Branch, Category, Order, OrderStatus, Product, Vendor, VendorStatus } from "@/lib/types";
import { branches, categories, formatNaira, getBranch, getCategory, orders, products, vendors } from "@/lib/marketplace-data";
import { NotificationLog } from "@/components/NotificationLog";
import { RepairRequestsPanel } from "@/components/RepairRequestsPanel";
import { StatusBadge } from "@/components/StatusBadge";

type DashboardRole = "admin" | "manager";

type Section =
  | "analytics"
  | "vendors"
  | "products"
  | "categories"
  | "branches"
  | "orders"
  | "repairs"
  | "notifications"
  | "inventory"
  | "reports";

const sections: Array<{ id: Section; label: string }> = [
  { id: "analytics", label: "Analytics" },
  { id: "vendors", label: "Vendors" },
  { id: "products", label: "Products" },
  { id: "categories", label: "Categories" },
  { id: "branches", label: "Branches" },
  { id: "orders", label: "Orders" },
  { id: "repairs", label: "Repairs" },
  { id: "notifications", label: "Notifications" },
  { id: "inventory", label: "Inventory" },
  { id: "reports", label: "Sales reports" },
];

const orderStatuses: OrderStatus[] = ["awaiting_receipt", "receipt_uploaded", "paid_approved", "payment_rejected", "fulfilled"];

function inventoryStatus(stock: number) {
  if (stock === 0) return { label: "Out of stock", status: "out_of_stock" };
  if (stock <= 3) return { label: "Low stock", status: "low_stock" };
  return { label: "In Stock", status: "in_stock" };
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function AdminManagerDashboard({ role, branchScopeId, branchLabel }: { role: DashboardRole; branchScopeId?: string; branchLabel?: string }) {
  const canApprove = role === "admin";
  const isBranchScoped = role === "manager" && Boolean(branchScopeId);
  const visibleSections = role === "admin" ? sections : sections.filter((section) => ["analytics", "products", "orders", "repairs", "inventory", "reports"].includes(section.id));
  const scopedVendors = isBranchScoped ? vendors.filter((vendor) => vendor.branchId === branchScopeId) : vendors;
  const scopedProducts = isBranchScoped ? products.filter((product) => product.branchId === branchScopeId) : products;
  const scopedBranches = isBranchScoped ? branches.filter((branch) => branch.id === branchScopeId) : branches;
  const scopedOrders = isBranchScoped ? orders.filter((order) => order.branchId === branchScopeId) : orders;
  const [activeSection, setActiveSection] = useState<Section>("analytics");
  const [vendorRows, setVendorRows] = useState<Vendor[]>(scopedVendors);
  const [productRows, setProductRows] = useState<Product[]>(scopedProducts);
  const [categoryRows, setCategoryRows] = useState<Category[]>(categories);
  const [branchRows, setBranchRows] = useState<Branch[]>(scopedBranches);
  const [orderRows, setOrderRows] = useState<Order[]>(scopedOrders);
  const [categoryName, setCategoryName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [notice, setNotice] = useState("");

  const stats = useMemo(() => {
    const revenue = orderRows.reduce((sum, order) => sum + order.total, 0);
    const paidRevenue = orderRows.filter((order) => order.status === "paid_approved" || order.status === "fulfilled").reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orderRows.filter((order) => order.status === "receipt_uploaded").length;
    const confirmedPayments = orderRows.filter((order) => order.status === "paid_approved" || order.status === "fulfilled").length;
    const lowStock = productRows.filter((product) => product.stock <= 3).length;
    const outOfStock = productRows.filter((product) => product.stock === 0).length;
    const approvedVendors = vendorRows.filter((vendor) => vendor.status === "approved").length;
    const pendingVendors = vendorRows.filter((vendor) => vendor.status === "pending").length;

    return { revenue, paidRevenue, pendingOrders, confirmedPayments, lowStock, outOfStock, approvedVendors, pendingVendors };
  }, [orderRows, productRows, vendorRows]);

  const recentOrders = orderRows.slice(0, 5);
  const recentReceipts = orderRows.filter((order) => order.receiptStatus === "pending").slice(0, 5);
  const pendingVendorRows = vendorRows.filter((vendor) => vendor.status === "pending");
  const dashboardCards =
    role === "admin"
      ? [
          ["Total orders", orderRows.length.toString()],
          ["Pending payments", stats.pendingOrders.toString()],
          ["Confirmed payments", stats.confirmedPayments.toString()],
          ["Total vendors", vendorRows.length.toString()],
          ["Pending vendor approvals", stats.pendingVendors.toString()],
          ["Total products", productRows.length.toString()],
          ["Total branches", branchRows.length.toString()],
          ["Total repair requests", "Open repairs panel"],
        ]
      : [
          ["Branch name", branchLabel ?? "Assigned branch"],
          ["Branch orders", orderRows.length.toString()],
          ["Pending payments for branch", stats.pendingOrders.toString()],
          ["Confirmed payments for branch", stats.confirmedPayments.toString()],
          ["Branch products", productRows.length.toString()],
          ["Low-stock products", stats.lowStock.toString()],
          ["Out-of-stock products", stats.outOfStock.toString()],
          ["Branch sales overview", formatNaira(stats.paidRevenue)],
        ];

  const branchSales = branchRows.map((branch) => ({
    branch,
    sales: orderRows.filter((order) => order.branchId === branch.id).reduce((sum, order) => sum + order.total, 0),
    orders: orderRows.filter((order) => order.branchId === branch.id).length,
  }));

  const categorySales = categoryRows.map((category) => {
    const productIds = productRows.filter((product) => product.categoryId === category.id).map((product) => product.id);
    const sales = orderRows.reduce(
      (sum, order) =>
        sum +
        order.items
          .filter((item) => productIds.includes(item.productId))
          .reduce((itemSum, item) => itemSum + item.price * item.quantity, 0),
      0,
    );
    return { category, sales };
  });

  function updateVendorStatus(vendorId: string, status: VendorStatus) {
    if (!canApprove) {
      setNotice("Only admin can approve or reject vendors.");
      return;
    }

    setVendorRows((current) => current.map((vendor) => (vendor.id === vendorId ? { ...vendor, status } : vendor)));
    setNotice(`Vendor ${status}.`);
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    setOrderRows((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
    setNotice(`Order ${orderId} updated to ${status.replaceAll("_", " ")}.`);
  }

  function updateProductStock(productId: string, stock: number) {
    setProductRows((current) => current.map((product) => (product.id === productId ? { ...product, stock } : product)));
  }

  function toggleProductFeatured(productId: string) {
    setProductRows((current) => current.map((product) => (product.id === productId ? { ...product, featured: !product.featured } : product)));
  }

  function updateProductPrice(productId: string, price: number) {
    setProductRows((current) => current.map((product) => (product.id === productId ? { ...product, price } : product)));
  }

  function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) return;

    setCategoryRows((current) => [
      ...current,
      {
        id: slugify(name),
        name,
        description: "New admin-created category for the local POC.",
      },
    ]);
    setCategoryName("");
    setNotice("Category added locally.");
  }

  function addBranch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = branchName.trim();
    if (!name) return;

    setBranchRows((current) => [
      ...current,
      {
        id: slugify(name),
        name,
        state: "Adamawa",
        city: "Yola",
        manager: "Unassigned",
      },
    ]);
    setBranchName("");
    setNotice("Branch added locally.");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-emerald-700">Role: {role}</p>
          <h1 className="text-3xl font-black text-slate-950">{role === "admin" ? "Admin operations dashboard" : `${branchLabel ?? "Branch"} manager dashboard`}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {role === "admin"
              ? "Full marketplace control across branches, vendors, products, orders, payments, repairs, inventory, analytics, and sales reports."
              : "Daily branch operations for products, orders, payment visibility, repair requests, inventory, and branch sales reports."}
          </p>
        </div>
        {notice ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{notice}</p> : null}
      </header>

      <nav className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        {visibleSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold ${
              activeSection === section.id ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
            type="button"
          >
            {section.label}
          </button>
        ))}
      </nav>

      {activeSection === "analytics" ? (
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ActivityPanel title="Recent orders" emptyMessage="No orders yet." rows={recentOrders.map((order) => [order.id, order.customerName, formatNaira(order.total), <StatusBadge key={order.id} status={order.status} />])} />
            <ActivityPanel
              title={role === "admin" ? "Recent payment receipts" : "Branch payment receipts"}
              emptyMessage="No pending receipts."
              rows={recentReceipts.map((order) => [order.id, order.customerName, getBranch(order.branchId)?.state ?? "Unknown", <StatusBadge key={order.id} status={order.receiptStatus} />])}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ReportPanel title={role === "admin" ? "Branch overview" : "Assigned branch overview"} rows={branchSales.map(({ branch, sales, orders: count }) => [`${branch.state} (${count} orders)`, formatNaira(sales)])} />
            <ReportPanel title="Sales overview by category" rows={categorySales.map(({ category, sales }) => [category.name, formatNaira(sales)])} />
          </div>
        </section>
      ) : null}

      {activeSection === "vendors" ? (
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Vendor approval queue</h2>
            <p className="mt-1 text-sm text-slate-600">Admin reviews vendor applications before products are listed publicly.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {pendingVendorRows.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No pending vendor approvals.</p>
              ) : pendingVendorRows.map((vendor) => (
                <div key={vendor.id} className="rounded-md bg-slate-50 p-4">
                  <p className="font-black text-slate-950">{vendor.businessName}</p>
                  <p className="mt-1 text-sm text-slate-600">{vendor.ownerName} · {getBranch(vendor.branchId)?.state}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white" onClick={() => updateVendorStatus(vendor.id, "approved")}>Approve</button>
                    <button className="rounded-md border border-red-300 px-3 py-2 text-sm font-bold text-red-700" onClick={() => updateVendorStatus(vendor.id, "rejected")}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
          {vendorRows.map((vendor) => (
            <article key={vendor.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-lg font-black text-slate-950">{vendor.businessName}</p>
              <p className="mt-1 text-sm text-slate-600">Owner: {vendor.ownerName}</p>
              <p className="mt-1 text-sm text-slate-600">Branch: {getBranch(vendor.branchId)?.state}</p>
              <p className="mt-3"><StatusBadge status={vendor.status} /></p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:bg-slate-300" disabled={!canApprove} onClick={() => updateVendorStatus(vendor.id, "approved")}>
                  Approve
                </button>
                <button className="rounded-md border border-red-300 px-3 py-2 text-sm font-bold text-red-700 disabled:border-slate-200 disabled:text-slate-400" disabled={!canApprove} onClick={() => updateVendorStatus(vendor.id, "rejected")}>
                  Reject
                </button>
              </div>
            </article>
          ))}
          </div>
        </section>
      ) : null}

      {activeSection === "products" ? (
        <DataTable
          headers={["Product", "Category", "Branch", "Price", "Featured", "Actions"]}
          rows={productRows.map((product) => [
            product.name,
            getCategory(product.categoryId)?.name ?? "Unknown",
            getBranch(product.branchId)?.state ?? "Unknown",
            <input
              key={`${product.id}-price`}
              className="h-9 w-32 rounded-md border border-slate-300 px-2"
              inputMode="numeric"
              onChange={(event) => updateProductPrice(product.id, Number(event.target.value))}
              value={product.price}
            />,
            product.featured ? "Yes" : "No",
            <button key={`${product.id}-featured`} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold" onClick={() => toggleProductFeatured(product.id)}>
              Toggle featured
            </button>,
          ])}
        />
      ) : null}

      {activeSection === "categories" ? (
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={addCategory} className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Add category</h2>
            <input className="mt-4 h-11 w-full rounded-md border border-slate-300 px-3" onChange={(event) => setCategoryName(event.target.value)} placeholder="Category name" value={categoryName} />
            <button className="mt-3 rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Add category</button>
          </form>
          <DataTable headers={["Category", "Description", "Products"]} rows={categoryRows.map((category) => [category.name, category.description, productRows.filter((product) => product.categoryId === category.id).length])} />
        </section>
      ) : null}

      {activeSection === "branches" ? (
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={addBranch} className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Add branch</h2>
            <input className="mt-4 h-11 w-full rounded-md border border-slate-300 px-3" onChange={(event) => setBranchName(event.target.value)} placeholder="Branch name" value={branchName} />
            <button className="mt-3 rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Add branch</button>
          </form>
          <DataTable headers={["Branch", "State", "City", "Manager", "Orders"]} rows={branchRows.map((branch) => [branch.name, branch.state, branch.city, branch.manager, orderRows.filter((order) => order.branchId === branch.id).length])} />
        </section>
      ) : null}

      {activeSection === "orders" ? (
        <DataTable
          headers={["Order", "Customer", "Branch", "Receipt", "Status", "Total", "Update"]}
          rows={orderRows.map((order) => [
            order.id,
            order.customerName,
            getBranch(order.branchId)?.state ?? "Unknown",
            <StatusBadge key={`${order.id}-receipt`} status={order.receiptStatus} />,
            <StatusBadge key={`${order.id}-status-badge`} status={order.status} />,
            formatNaira(order.total),
            <select key={`${order.id}-status`} className="h-9 rounded-md border border-slate-300 px-2" onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)} value={order.status}>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>,
          ])}
        />
      ) : null}

      {activeSection === "inventory" ? (
        <DataTable
          headers={["Product", "Branch", "Stock", "Status", "Reorder action"]}
          rows={productRows.map((product) => {
            const status = inventoryStatus(product.stock);
            return [
              product.name,
              getBranch(product.branchId)?.state ?? "Unknown",
              <input key={`${product.id}-stock`} className="h-9 w-24 rounded-md border border-slate-300 px-2" inputMode="numeric" onChange={(event) => updateProductStock(product.id, Number(event.target.value))} value={product.stock} />,
              <StatusBadge key={`${product.id}-status`} status={status.status} label={status.label} />,
              product.stock <= 3 ? "Restock recommended" : "No action",
            ];
          })}
        />
      ) : null}

      {activeSection === "repairs" ? <RepairRequestsPanel /> : null}

      {activeSection === "notifications" ? <NotificationLog title="Dashboard notification logs" /> : null}

      {activeSection === "reports" ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <ReportPanel title="Branch sales report" rows={branchSales.map(({ branch, sales, orders: count }) => [`${branch.state} (${count} orders)`, formatNaira(sales)])} />
          <ReportPanel title="Category sales report" rows={categorySales.map(({ category, sales }) => [category.name, formatNaira(sales)])} />
          <ReportPanel
            title="Order status report"
            rows={orderStatuses.map((status) => [
              status.replaceAll("_", " "),
              orderRows.filter((order) => order.status === status).length.toString(),
            ])}
          />
        </section>
      ) : null}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<React.ReactNode>> }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center">
                <p className="font-bold text-slate-950">No records found.</p>
                <p className="mt-1 text-sm text-slate-600">Relevant marketplace activity will appear here when available.</p>
              </td>
            </tr>
          ) : rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityPanel({ title, emptyMessage, rows }: { title: string; emptyMessage: string; rows: Array<Array<React.ReactNode>> }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3">
        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">{emptyMessage}</p>
        ) : rows.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm sm:grid-cols-4 sm:items-center">
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} className={cellIndex === 0 ? "font-black text-slate-950" : "text-slate-700"}>
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportPanel({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3">
        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No report data yet.</p>
        ) : rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-2 text-sm">
            <span className="font-semibold text-slate-700 capitalize">{label}</span>
            <span className="font-black text-slate-950">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
