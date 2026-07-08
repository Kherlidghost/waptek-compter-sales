import { branches, dashboardStats, formatNaira, orders, products, vendors } from "@/lib/marketplace-data";

export function DashboardCards() {
  const cards = [
    ["Revenue", formatNaira(dashboardStats.revenue)],
    ["Pending receipts", dashboardStats.pendingReceipts.toString()],
    ["Approved vendors", dashboardStats.approvedVendors.toString()],
    ["Inventory units", dashboardStats.inventoryUnits.toString()],
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function OrdersTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Branch</th>
            <th className="px-4 py-3">Receipt</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-semibold text-slate-950">{order.id}</td>
              <td className="px-4 py-3">{order.customerName}</td>
              <td className="px-4 py-3">{branches.find((branch) => branch.id === order.branchId)?.state}</td>
              <td className="px-4 py-3 capitalize">{order.receiptStatus}</td>
              <td className="px-4 py-3 capitalize">{order.status.replaceAll("_", " ")}</td>
              <td className="px-4 py-3 font-semibold">{formatNaira(order.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VendorsTable() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {vendors.map((vendor) => (
        <div key={vendor.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-lg font-semibold text-slate-950">{vendor.businessName}</p>
          <p className="mt-1 text-sm text-slate-600">Owner: {vendor.ownerName}</p>
          <p className="mt-1 text-sm text-slate-600">Status: {vendor.status}</p>
          <button className="mt-4 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
            {vendor.status === "pending" ? "Approve vendor" : "View vendor"}
          </button>
        </div>
      ))}
    </div>
  );
}

export function InventoryTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Branch</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-4 py-3 font-semibold text-slate-950">{product.name}</td>
              <td className="px-4 py-3">{branches.find((branch) => branch.id === product.branchId)?.state}</td>
              <td className="px-4 py-3">{product.stock}</td>
              <td className="px-4 py-3">{formatNaira(product.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
