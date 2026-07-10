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
  { id: "analytics", label: "Dashboard" },
  { id: "vendors", label: "Vendors" },
  { id: "products", label: "Products" },
  { id: "categories", label: "Categories" },
  { id: "branches", label: "Branches" },
  { id: "orders", label: "Orders" },
  { id: "repairs", label: "Repairs" },
  { id: "notifications", label: "Notifications" },
  { id: "inventory", label: "Inventory" },
  { id: "reports", label: "Reports" },
];

type DashboardAction = {
  label: string;
  section?: Section;
  href?: string;
};

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
  const todaysOrders = orderRows.filter((order) => {
    const created = new Date(order.createdAt);
    return Number.isFinite(created.getTime()) && created.toDateString() === new Date().toDateString();
  }).length;
  const completedToday = orderRows.filter((order) => {
    const created = new Date(order.createdAt);
    return (order.status === "fulfilled" || order.status === "paid_approved") && Number.isFinite(created.getTime()) && created.toDateString() === new Date().toDateString();
  }).length;
  const dashboardActions: DashboardAction[] =
    role === "admin"
      ? [
          { label: "📦 Add Product", href: "#add-product" },
          { label: "👥 Approve Vendors", section: "vendors" },
          { label: "🧾 View Orders", section: "orders" },
          { label: "💰 Check Payments", section: "orders" },
          { label: "⚙ Manage Branches", section: "branches" },
        ]
      : [
          { label: "📦 Add Branch Product", href: "#add-product" },
          { label: "🧾 View Branch Orders", section: "orders" },
          { label: "💰 Check Branch Payments", section: "orders" },
          { label: "📦 View Inventory", section: "inventory" },
          { label: "🛠 Repair Requests", section: "repairs" },
        ];
  const dashboardCards =
    role === "admin"
      ? [
          { title: "Payments waiting", value: `${stats.pendingOrders}`, description: stats.pendingOrders ? "Receipts need review." : "No payments waiting.", action: "View", section: "orders" as Section },
          { title: "Vendors waiting approval", value: stats.pendingVendors.toString(), description: stats.pendingVendors ? "New sellers need a decision." : "Everything looks good.", action: "Manage", section: "vendors" as Section },
          { title: "Today's orders", value: todaysOrders.toString(), description: todaysOrders ? "Orders placed today." : "No orders yet today.", action: "View", section: "orders" as Section },
          { title: "Low stock products", value: stats.lowStock.toString(), description: stats.lowStock ? "Products need restock attention." : "Stock looks good.", action: "Manage", section: "inventory" as Section },
          { title: "Repair requests", value: "0", description: "No repair requests waiting.", action: "View", section: "repairs" as Section },
        ]
      : [
          { title: "Orders waiting", value: stats.pendingOrders.toString(), description: stats.pendingOrders ? "Branch orders need attention." : "No orders waiting.", action: "View", section: "orders" as Section },
          { title: "Payments waiting", value: `${stats.pendingOrders}`, description: stats.pendingOrders ? "Receipts need branch review." : "No payments waiting.", action: "View", section: "orders" as Section },
          { title: "Products low in stock", value: stats.lowStock.toString(), description: stats.lowStock ? "Restock these products soon." : "Stock looks good.", action: "Manage", section: "inventory" as Section },
          { title: "Repair requests", value: "0", description: "No repair requests waiting.", action: "View", section: "repairs" as Section },
          { title: "Completed orders today", value: completedToday.toString(), description: completedToday ? "Orders completed today." : "No completed orders today.", action: "View", section: "orders" as Section },
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
  const branchOverview = (role === "admin" ? branches : branchRows).map((branch) => {
    const branchOrders = orderRows.filter((order) => order.branchId === branch.id);
    return {
      branch,
      orders: branchOrders.length,
      pendingPayments: branchOrders.filter((order) => order.status === "receipt_uploaded" || order.receiptStatus === "pending").length,
      products: productRows.filter((product) => product.branchId === branch.id).length,
      repairRequests: 0,
    };
  });
  const recentActivity = [
    ...recentOrders.slice(0, 2).map((order) => ({
      title: "New order placed",
      detail: `${order.id} from ${order.customerName}`,
      status: order.status,
    })),
    ...recentReceipts.slice(0, 2).map((order) => ({
      title: "Payment receipt uploaded",
      detail: `${order.id} is awaiting review`,
      status: order.receiptStatus,
    })),
    ...productRows
      .filter((product) => product.stock <= 3)
      .slice(0, 2)
      .map((product) => ({
        title: product.stock === 0 ? "Out of stock warning" : "Low stock warning",
        detail: `${product.name} has ${product.stock} units left`,
        status: product.stock === 0 ? "out_of_stock" : "low_stock",
      })),
    ...productRows.slice(0, 1).map((product) => ({
      title: "Product added",
      detail: product.name,
      status: "in_stock",
    })),
  ].slice(0, 5);

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
        description: "New admin-created category for the marketplace.",
      },
    ]);
    setCategoryName("");
    setNotice("Category added to this workspace.");
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
    setNotice("Branch added to this workspace.");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15">
        <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="w-fit rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-black uppercase text-emerald-200">{role === "admin" ? "Marketplace control" : branchLabel ?? "Assigned branch"}</p>
          <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">{role === "admin" ? "Welcome back, Admin" : "Welcome back, Branch Manager"}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            {role === "admin"
              ? "Choose the next action for the marketplace: review payments, approve vendors, manage products, or check branch activity."
              : "Start with the branch work that needs attention: orders, payments, stock, and repair requests."}
          </p>
        </div>
        <div className="grid min-w-52 gap-2 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm backdrop-blur">
          <span className="font-bold text-slate-300">Workspace</span>
          <span className="text-xl font-black text-white">{role === "admin" ? "All branches" : branchLabel ?? "Assigned branch"}</span>
          <span className="text-emerald-200">Ready for action</span>
        </div>
        </div>
        {notice ? <p className="mt-5 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">{notice}</p> : null}
      </header>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-xl shadow-slate-950/5 backdrop-blur">
        {visibleSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-black ${
              activeSection === section.id ? "bg-slate-950 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
            }`}
            type="button"
          >
            {section.label}
          </button>
        ))}
      </nav>

      {activeSection === "analytics" ? (
        <section className="space-y-6">
          <QuickActions actions={dashboardActions} onSelect={setActiveSection} />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Needs attention</h2>
              <p className="mt-1 text-sm text-slate-600">Start here before opening detailed reports.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">Today’s workspace</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => (
              <SummaryCard key={card.title} {...card} onSelect={setActiveSection} />
            ))}
          </div>
          <RecentActivityPanel rows={recentActivity} />
          {role === "admin" ? (
            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">Branch overview</h2>
                <p className="mt-1 text-sm text-slate-600">A quick view of each branch.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {branchOverview.map((item) => (
                  <BranchOverviewCard key={item.branch.id} {...item} />
                ))}
              </div>
            </section>
          ) : (
            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">Branch summary</h2>
                <p className="mt-1 text-sm text-slate-600">Your assigned branch only.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {branchOverview.map((item) => (
                  <BranchOverviewCard key={item.branch.id} {...item} />
                ))}
              </div>
            </section>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <ActivityPanel title="Recent orders" emptyMessage="No orders yet." rows={recentOrders.map((order) => [order.id, order.customerName, formatNaira(order.total), <StatusBadge key={order.id} status={order.status} />])} />
            <ActivityPanel
              title={role === "admin" ? "Recent payment receipts" : "Branch payment receipts"}
              emptyMessage="No pending receipts."
              rows={recentReceipts.map((order) => [order.id, order.customerName, getBranch(order.branchId)?.state ?? "Unknown", <StatusBadge key={order.id} status={order.receiptStatus} />])}
            />
          </div>
          {role === "manager" ? (
            <ActivityPanel
              title="Cashier activity"
              emptyMessage="No cashier confirmations yet."
              rows={orderRows
                .filter((order) => order.status === "paid_approved" || order.status === "payment_rejected")
                .slice(0, 4)
                .map((order) => [order.id, order.customerName, formatNaira(order.total), <StatusBadge key={order.id} status={order.status} />])}
            />
          ) : null}
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

function QuickActions({ actions, onSelect }: { actions: DashboardAction[]; onSelect: (section: Section) => void }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-950/5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-emerald-700">Next best actions</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">What do you want to do now?</h2>
          <p className="mt-1 text-sm text-slate-600">Pick a task card to jump straight into the work.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) =>
          action.href ? (
            <a
              key={action.label}
              className="group flex min-h-28 items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-5 py-4 text-left text-sm font-black text-slate-800 shadow-sm hover:border-emerald-300 hover:from-emerald-50 hover:to-white"
              href={action.href}
            >
              <span>{action.label}</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white group-hover:bg-emerald-700" aria-hidden="true">Open</span>
            </a>
          ) : (
            <button
              key={action.label}
              className="group flex min-h-28 items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-5 py-4 text-left text-sm font-black text-slate-800 shadow-sm hover:border-emerald-300 hover:from-emerald-50 hover:to-white"
              onClick={() => action.section && onSelect(action.section)}
              type="button"
            >
              <span>{action.label}</span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white group-hover:bg-emerald-700" aria-hidden="true">View</span>
            </button>
          ),
        )}
      </div>
    </section>
  );
}

function SummaryCard({
  title,
  value,
  description,
  action,
  section,
  onSelect,
}: {
  title: string;
  value: string;
  description: string;
  action: string;
  section: Section;
  onSelect: (section: Section) => void;
}) {
  return (
    <article className="flex min-h-52 flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
          {cardIcon(title)}
        </div>
        <p className="text-sm font-black text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <button className="mt-5 w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 hover:bg-emerald-100" onClick={() => onSelect(section)} type="button">
        {action} →
      </button>
    </article>
  );
}

function cardIcon(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("payment")) return "💰";
  if (normalized.includes("vendor")) return "👥";
  if (normalized.includes("order")) return "🧾";
  if (normalized.includes("stock") || normalized.includes("product")) return "📦";
  if (normalized.includes("repair")) return "🛠";
  return "✓";
}

function RecentActivityPanel({ rows }: { rows: Array<{ title: string; detail: string; status: string }> }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-950/5">
      <h2 className="text-2xl font-black text-slate-950">Recent activity</h2>
      <p className="mt-1 text-sm text-slate-600">What happened recently.</p>
      <div className="mt-4 grid gap-3">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">No recent activity yet. Everything looks good.</p>
        ) : rows.map((row, index) => (
          <div key={`${row.title}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm">
            <div>
              <p className="font-black text-slate-950">{row.title}</p>
              <p className="mt-1 text-slate-600">{row.detail}</p>
            </div>
            <StatusBadge status={row.status} />
          </div>
        ))}
      </div>
    </section>
  );
}

function BranchOverviewCard({
  branch,
  orders: orderCount,
  pendingPayments,
  products: productCount,
  repairRequests,
}: {
  branch: Branch;
  orders: number;
  pendingPayments: number;
  products: number;
  repairRequests: number;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-lg font-black text-slate-950">{branch.state} branch</p>
      <p className="mt-1 text-sm text-slate-600">{branch.city}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {[
          ["Orders", orderCount],
          ["Pending payments", pendingPayments],
          ["Products", productCount],
          ["Repair requests", repairRequests],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md bg-slate-50 p-3">
            <p className="text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>
    </article>
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
