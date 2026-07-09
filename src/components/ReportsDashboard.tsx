import Link from "next/link";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { getAuthProfile, isCashier, isManager, isVendor } from "@/lib/auth";
import { formatNaira } from "@/lib/marketplace-data";
import { createClient } from "@/lib/supabase/server";
import type { BranchState, UserRole } from "@/lib/types";

type ReportsRole = Extract<UserRole, "admin" | "manager" | "cashier" | "vendor">;

type SearchParams = {
  date?: string;
  from?: string;
  to?: string;
  status?: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  branch_id: string;
  status: string;
  total: number | string;
  created_at: string;
  branches: { name: string; state: BranchState } | { name: string; state: BranchState }[] | null;
  payment_receipts: Array<{ status: "pending" | "confirmed" | "rejected"; reviewed_at: string | null; created_at: string }> | null;
  order_items: Array<{ quantity: number; unit_price: number | string; vendor_id: string; products: { name: string } | { name: string }[] | null; vendors: { business_name: string } | { business_name: string }[] | null }> | null;
};

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  branch_id: string;
  vendor_id: string;
  branches: { state: BranchState } | { state: BranchState }[] | null;
  vendors: { business_name: string } | { business_name: string }[] | null;
  inventory: Array<{ quantity: number; reorder_level: number; status?: string }> | null;
};

type VendorRow = {
  id: string;
  business_name: string;
  status: string;
  products: Array<{ id: string }> | null;
  order_items: Array<{ quantity: number; unit_price: number | string; orders: { status: string; created_at: string } | { status: string; created_at: string }[] | null }> | null;
};

type BranchRow = {
  id: string;
  name: string;
  state: BranchState;
};

type RepairRow = {
  id: string;
  branch_id: string;
  status: string;
  created_at: string;
};

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

function dateInRange(value: string, params: SearchParams) {
  const date = new Date(value);
  const now = new Date();

  if (params.from) {
    const from = new Date(params.from);
    if (date < from) return false;
  }
  if (params.to) {
    const to = new Date(params.to);
    to.setHours(23, 59, 59, 999);
    if (date > to) return false;
  }
  if (params.date === "today") return date.toDateString() === now.toDateString();
  if (params.date === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo;
  }
  if (params.date === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  return true;
}

function paidLike(status: string) {
  return ["paid_approved", "processing", "ready_for_pickup", "fulfilled"].includes(status);
}

function paymentStatus(order: OrderRow) {
  const receipt = order.payment_receipts?.[0];
  if (paidLike(order.status)) return "paid_approved";
  if (order.status === "payment_rejected" || receipt?.status === "rejected") return "payment_rejected";
  if (order.status === "receipt_uploaded") return "receipt_uploaded";
  return "awaiting_receipt";
}

function stockStatus(product: ProductRow) {
  const inventory = product.inventory?.[0];
  const quantity = inventory?.quantity ?? 0;
  const reorderLevel = inventory?.reorder_level ?? 3;
  if (inventory?.status === "archived") return "archived";
  if (inventory?.status === "damaged") return "damaged";
  if (quantity === 0) return "out_of_stock";
  if (quantity <= reorderLevel) return "low_stock";
  return "in_stock";
}

function csvHref(rows: string[][]) {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n"))}`;
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-bold text-slate-800">{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export async function ReportsDashboard({ role, searchParams }: { role: ReportsRole; searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getAuthProfile(supabase, user.id) : null;

  let scopedBranchId: string | null = null;
  let scopedVendorId: string | null = null;
  if (profile && (isManager(profile) || isCashier(profile))) scopedBranchId = profile.branch_id;
  if (profile && isVendor(profile)) {
    const { data: vendor } = await supabase.from("vendors").select("id").eq("profile_id", profile.id).maybeSingle();
    scopedVendorId = vendor?.id ?? null;
  }

  let ordersQuery = supabase
    .from("orders")
    .select("id, order_number, customer_name, branch_id, status, total, created_at, branches(name, state), payment_receipts(status, reviewed_at, created_at), order_items(quantity, unit_price, vendor_id, products(name), vendors(business_name))")
    .order("created_at", { ascending: false });
  if (scopedBranchId) ordersQuery = ordersQuery.eq("branch_id", scopedBranchId);
  if (role === "vendor" && scopedVendorId) ordersQuery = ordersQuery.eq("order_items.vendor_id", scopedVendorId);

  let productsQuery = supabase
    .from("products")
    .select("id, name, sku, branch_id, vendor_id, branches(state), vendors(business_name), inventory(quantity, reorder_level, status)")
    .order("updated_at", { ascending: false });
  if (scopedBranchId) productsQuery = productsQuery.eq("branch_id", scopedBranchId);
  if (role === "vendor" && scopedVendorId) productsQuery = productsQuery.eq("vendor_id", scopedVendorId);

  let repairsQuery = supabase.from("repair_requests").select("id, branch_id, status, created_at").order("created_at", { ascending: false });
  if (scopedBranchId) repairsQuery = repairsQuery.eq("branch_id", scopedBranchId);

  const [{ data: orderRows, error: ordersError }, { data: productRows, error: productsError }, { data: repairRows }, { data: branchRows }, { data: vendorRows }] = await Promise.all([
    ordersQuery,
    productsQuery,
    repairsQuery,
    supabase.from("branches").select("id, name, state").order("state"),
    role === "admin"
      ? supabase.from("vendors").select("id, business_name, status, products(id), order_items(quantity, unit_price, orders(status, created_at))").order("business_name")
      : Promise.resolve({ data: [] }),
  ]);

  const orders = ((orderRows ?? []) as unknown as OrderRow[])
    .filter((order) => dateInRange(order.created_at, searchParams))
    .filter((order) => !searchParams.status || order.status === searchParams.status)
    .filter((order) => role !== "vendor" || !scopedVendorId || order.order_items?.some((item) => item.vendor_id === scopedVendorId));
  const products = ((productRows ?? []) as unknown as ProductRow[]).filter((product) => role !== "vendor" || !scopedVendorId || product.vendor_id === scopedVendorId);
  const repairs = ((repairRows ?? []) as RepairRow[]).filter((repair) => dateInRange(repair.created_at, searchParams));
  const vendors = (vendorRows ?? []) as unknown as VendorRow[];
  const branches = (branchRows ?? []) as BranchRow[];

  const confirmed = orders.filter((order) => paidLike(order.status));
  const totalSales = confirmed.reduce((sum, order) => sum + Number(order.total), 0);
  const pendingPayments = orders.filter((order) => order.status === "awaiting_receipt" || order.status === "receipt_uploaded").length;
  const rejectedPayments = orders.filter((order) => order.status === "payment_rejected").length;
  const completedOrders = orders.filter((order) => order.status === "fulfilled").length;
  const cancelledOrders = orders.filter((order) => order.status === "cancelled").length;
  const lowStockProducts = products.filter((product) => stockStatus(product) === "low_stock");
  const outOfStockProducts = products.filter((product) => stockStatus(product) === "out_of_stock");

  const cashierReceiptRows = orders.flatMap((order) => (order.payment_receipts ?? []).map((receipt) => ({ order, receipt })));
  const todayReceiptRows = cashierReceiptRows.filter((row) => row.receipt.reviewed_at && dateInRange(row.receipt.reviewed_at, { date: "today" }));
  const vendorProductSales = products.map((product) => {
    const units = orders.reduce((sum, order) => sum + (order.order_items ?? []).filter((item) => item.vendor_id === product.vendor_id && first(item.products)?.name === product.name).reduce((inner, item) => inner + item.quantity, 0), 0);
    return { product, units };
  }).sort((a, b) => b.units - a.units);

  const summaryCards =
    role === "cashier"
      ? [
          ["Confirmed Today", todayReceiptRows.filter((row) => row.receipt.status === "confirmed").length.toString(), "Payments confirmed today."],
          ["Rejected Today", todayReceiptRows.filter((row) => row.receipt.status === "rejected").length.toString(), "Payments rejected today."],
          ["Pending Receipts", cashierReceiptRows.filter((row) => row.receipt.status === "pending").length.toString(), "Awaiting confirmation."],
          ["Awaiting Payment", orders.filter((order) => order.status === "receipt_uploaded").length.toString(), "Orders needing review."],
        ]
      : role === "vendor"
        ? [
            ["Products Listed", products.length.toString(), "Own products only."],
            ["Products Sold", orders.reduce((sum, order) => sum + (order.order_items ?? []).filter((item) => item.vendor_id === scopedVendorId).reduce((inner, item) => inner + item.quantity, 0), 0).toString(), "Units ordered."],
            ["Orders Received", orders.length.toString(), "Orders containing own products."],
            ["Revenue Estimate", formatNaira(orders.reduce((sum, order) => sum + (order.order_items ?? []).filter((item) => item.vendor_id === scopedVendorId).reduce((inner, item) => inner + Number(item.unit_price) * item.quantity, 0), 0)), "Own item value."],
            ["Low Stock", lowStockProducts.length.toString(), "Own low-stock products."],
          ]
        : [
            [role === "admin" ? "Total Sales" : "Branch Sales", formatNaira(totalSales), "Confirmed order value."],
            [role === "admin" ? "Total Orders" : "Branch Orders", orders.length.toString(), "Orders in selected period."],
            ["Pending Payments", pendingPayments.toString(), "Awaiting receipt or review."],
            ["Confirmed Payments", confirmed.length.toString(), "Paid or processing orders."],
            ["Rejected Payments", rejectedPayments.toString(), "Rejected receipts."],
            ["Completed Orders", completedOrders.toString(), "Fulfilled orders."],
            ["Cancelled Orders", cancelledOrders.toString(), "Cancelled orders."],
            ["Products", products.length.toString(), "Products in scope."],
            ["Low Stock", lowStockProducts.length.toString(), "At or below threshold."],
            ["Out of Stock", outOfStockProducts.length.toString(), "Unavailable products."],
            ...(role === "admin"
              ? [
                  ["Total Vendors", vendors.length.toString(), "All vendor records."],
                  ["Approved Vendors", vendors.filter((vendor) => vendor.status === "approved").length.toString(), "Approved sellers."],
                  ["Pending Vendors", vendors.filter((vendor) => vendor.status === "pending").length.toString(), "Awaiting review."],
                ]
              : []),
            ["Repair Requests", repairs.length.toString(), "Repair requests in scope."],
          ];

  const salesCsv = csvHref([
    ["Date", "Order Reference", "Customer", "Branch", "Vendor", "Amount", "Payment Status", "Order Status"],
    ...orders.map((order) => [
      new Date(order.created_at).toLocaleDateString("en-NG"),
      order.order_number,
      order.customer_name,
      first(order.branches)?.state ?? "Unknown",
      [...new Set((order.order_items ?? []).map((item) => first(item.vendors)?.business_name ?? "Vendor"))].join("; "),
      String(order.total),
      paymentStatus(order),
      order.status,
    ]),
  ]);

  const maxOrderCount = Math.max(1, orders.length);
  const branchPerformance = branches
    .filter((branch) => !scopedBranchId || branch.id === scopedBranchId)
    .map((branch) => {
      const branchOrders = orders.filter((order) => order.branch_id === branch.id);
      return {
        branch,
        orders: branchOrders.length,
        sales: branchOrders.filter((order) => paidLike(order.status)).reduce((sum, order) => sum + Number(order.total), 0),
        pending: branchOrders.filter((order) => order.status === "awaiting_receipt" || order.status === "receipt_uploaded").length,
        products: products.filter((product) => product.branch_id === branch.id).length,
        repairs: repairs.filter((repair) => repair.branch_id === branch.id).length,
      };
    });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <ReportsNav role={role} />
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase text-emerald-700">Business Reports</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {role === "admin" ? "Marketplace analytics" : role === "manager" ? "Assigned branch reports" : role === "cashier" ? "Payment confirmation reports" : "Vendor performance reports"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">Date-filtered production reports with role-safe visibility and lightweight visual analytics.</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-5">
          <select className="h-11 rounded-md border border-slate-300 px-3" name="date" defaultValue={searchParams.date ?? ""}>
            <option value="">All dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <input className="h-11 rounded-md border border-slate-300 px-3" name="from" type="date" defaultValue={searchParams.from ?? ""} />
          <input className="h-11 rounded-md border border-slate-300 px-3" name="to" type="date" defaultValue={searchParams.to ?? ""} />
          {role !== "vendor" ? (
            <select className="h-11 rounded-md border border-slate-300 px-3" name="status" defaultValue={searchParams.status ?? ""}>
              <option value="">All order status</option>
              <option value="awaiting_receipt">Pending Payment</option>
              <option value="receipt_uploaded">Receipt Uploaded</option>
              <option value="paid_approved">Payment Confirmed</option>
              <option value="payment_rejected">Rejected</option>
              <option value="fulfilled">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          ) : null}
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white">Apply filters</button>
        </form>
      </section>

      {ordersError || productsError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">Could not load report data. Check Supabase production schema and role permissions.</p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map(([title, value, description]) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Order status breakdown</h2>
          <div className="mt-5 grid gap-4">
            <Bar label="Pending" value={pendingPayments} max={maxOrderCount} />
            <Bar label="Confirmed" value={confirmed.length} max={maxOrderCount} />
            <Bar label="Rejected" value={rejectedPayments} max={maxOrderCount} />
            <Bar label="Completed" value={completedOrders} max={maxOrderCount} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">{role === "admin" ? "Branch comparison" : role === "vendor" ? "Best-performing products" : "Inventory risk"}</h2>
          <div className="mt-5 grid gap-4">
            {role === "vendor"
              ? vendorProductSales.slice(0, 5).map((item) => <Bar key={item.product.id} label={item.product.name} value={item.units} max={Math.max(1, vendorProductSales[0]?.units ?? 1)} />)
              : branchPerformance.map((item) => <Bar key={item.branch.id} label={item.branch.state} value={item.orders} max={Math.max(1, ...branchPerformance.map((branch) => branch.orders))} />)}
            {role === "vendor" && vendorProductSales.length === 0 ? <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No product sales yet.</p> : null}
          </div>
        </div>
      </section>

      {role === "cashier" ? (
        <ReportTable title="Receipt confirmation history" exportHref={salesCsv} headers={["Date", "Order", "Customer", "Amount", "Receipt Status", "Order Status"]}>
          {cashierReceiptRows.length === 0 ? <EmptyRow colSpan={6} message="No receipt history yet." /> : cashierReceiptRows.map((row) => (
            <tr key={`${row.order.id}-${row.receipt.created_at}`}>
              <td className="px-4 py-3">{new Date(row.receipt.reviewed_at ?? row.receipt.created_at).toLocaleDateString("en-NG")}</td>
              <td className="px-4 py-3 font-bold">{row.order.order_number}</td>
              <td className="px-4 py-3">{row.order.customer_name}</td>
              <td className="px-4 py-3">{formatNaira(Number(row.order.total))}</td>
              <td className="px-4 py-3"><StatusBadge status={row.receipt.status} /></td>
              <td className="px-4 py-3"><StatusBadge status={row.order.status} /></td>
            </tr>
          ))}
        </ReportTable>
      ) : (
        <>
          <ReportTable title="Sales report" exportHref={salesCsv} headers={["Date", "Order Reference", "Customer", "Branch", "Vendor", "Amount", "Payment Status", "Order Status"]}>
            {orders.length === 0 ? <EmptyRow colSpan={8} message="No orders found for this report." /> : orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString("en-NG")}</td>
                <td className="px-4 py-3 font-bold">{order.order_number}</td>
                <td className="px-4 py-3">{order.customer_name}</td>
                <td className="px-4 py-3">{first(order.branches)?.state ?? "Unknown"}</td>
                <td className="px-4 py-3">{[...new Set((order.order_items ?? []).map((item) => first(item.vendors)?.business_name ?? "Vendor"))].join(", ")}</td>
                <td className="px-4 py-3">{formatNaira(Number(order.total))}</td>
                <td className="px-4 py-3"><StatusBadge status={paymentStatus(order)} /></td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
              </tr>
            ))}
          </ReportTable>

          <ReportTable title="Inventory report" exportHref={csvHref([["Product", "SKU", "Branch", "Vendor", "Quantity", "Threshold", "Status"], ...products.map((product) => [product.name, product.sku ?? "", first(product.branches)?.state ?? "", first(product.vendors)?.business_name ?? "", String(product.inventory?.[0]?.quantity ?? 0), String(product.inventory?.[0]?.reorder_level ?? 3), stockStatus(product)])])} headers={["Product", "SKU", "Branch", "Vendor", "Quantity", "Low Stock Threshold", "Status"]}>
            {products.length === 0 ? <EmptyRow colSpan={7} message="No inventory records found." /> : products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 font-bold">{product.name}</td>
                <td className="px-4 py-3">{product.sku ?? "Not set"}</td>
                <td className="px-4 py-3">{first(product.branches)?.state ?? "Unknown"}</td>
                <td className="px-4 py-3">{first(product.vendors)?.business_name ?? "Company-owned"}</td>
                <td className="px-4 py-3">{product.inventory?.[0]?.quantity ?? 0}</td>
                <td className="px-4 py-3">{product.inventory?.[0]?.reorder_level ?? 3}</td>
                <td className="px-4 py-3"><StatusBadge status={stockStatus(product)} /></td>
              </tr>
            ))}
          </ReportTable>
        </>
      )}

      {role === "admin" ? (
        <>
          <ReportTable title="Vendor performance" exportHref={csvHref([["Vendor", "Products", "Orders", "Revenue", "Status", "Rating"], ...vendors.map((vendor) => [vendor.business_name, String(vendor.products?.length ?? 0), String(vendor.order_items?.length ?? 0), String((vendor.order_items ?? []).reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0)), vendor.status, "New"])])} headers={["Vendor Name", "Products Listed", "Orders", "Revenue Estimate", "Status", "Rating"]}>
            {vendors.length === 0 ? <EmptyRow colSpan={6} message="No vendors found." /> : vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td className="px-4 py-3 font-bold">{vendor.business_name}</td>
                <td className="px-4 py-3">{vendor.products?.length ?? 0}</td>
                <td className="px-4 py-3">{vendor.order_items?.length ?? 0}</td>
                <td className="px-4 py-3">{formatNaira((vendor.order_items ?? []).reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0))}</td>
                <td className="px-4 py-3"><StatusBadge status={vendor.status} label={vendor.status === "pending" ? "Pending" : undefined} /></td>
                <td className="px-4 py-3">New</td>
              </tr>
            ))}
          </ReportTable>

          <ReportTable title="Branch performance" exportHref={csvHref([["Branch", "Orders", "Sales", "Pending Payments", "Products", "Repair Requests"], ...branchPerformance.map((item) => [item.branch.state, String(item.orders), String(item.sales), String(item.pending), String(item.products), String(item.repairs)])])} headers={["Branch", "Orders", "Sales", "Pending Payments", "Products", "Repair Requests"]}>
            {branchPerformance.map((item) => (
              <tr key={item.branch.id}>
                <td className="px-4 py-3 font-bold">{item.branch.state}</td>
                <td className="px-4 py-3">{item.orders}</td>
                <td className="px-4 py-3">{formatNaira(item.sales)}</td>
                <td className="px-4 py-3">{item.pending}</td>
                <td className="px-4 py-3">{item.products}</td>
                <td className="px-4 py-3">{item.repairs}</td>
              </tr>
            ))}
          </ReportTable>
        </>
      ) : null}
    </div>
  );
}

function ReportsNav({ role }: { role: ReportsRole }) {
  const base = `/${role}`;
  const links = [
    ["Dashboard", base],
    ...(role !== "cashier" ? [["Products", `${base}/products`]] : []),
    ...(role === "admin" ? [["Vendors", "/admin/vendors"]] : []),
    ...(role !== "cashier" ? [["Inventory", `${base}/inventory`]] : []),
    ["Orders", `${base}/orders`],
    ["Reports", `${base}/reports`],
    ["Settings", `${base}/settings`],
  ];
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-sm">
      {links.map(([label, href]) => <Link key={label} className="whitespace-nowrap rounded-md px-3 py-2 font-bold text-slate-700 hover:bg-slate-100" href={href}>{label}</Link>)}
    </nav>
  );
}

function ReportTable({ title, headers, children, exportHref }: { title: string; headers: string[]; children: ReactNode; exportHref: string }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">Export is available as a simple CSV download.</p>
        </div>
        <a className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold" href={exportHref} download={`${title.toLowerCase().replaceAll(" ", "-")}.csv`}>Export CSV</a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center">
        <p className="font-black text-slate-950">{message}</p>
        <p className="mt-1 text-slate-600">Adjust filters or wait for new marketplace activity.</p>
      </td>
    </tr>
  );
}
