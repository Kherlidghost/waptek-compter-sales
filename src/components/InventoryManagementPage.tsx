import Link from "next/link";
import { transferInventoryStock, updateInventoryStock } from "@/app/inventory/manage/actions";
import { StatusBadge } from "@/components/StatusBadge";
import { getAuthProfile, isManager, isVendor } from "@/lib/auth";
import { formatNaira } from "@/lib/marketplace-data";
import { supabaseConfig } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import type { BranchState, UserRole } from "@/lib/types";

type InventoryRole = Extract<UserRole, "admin" | "manager" | "vendor">;

type SearchParams = {
  q?: string;
  branch?: string;
  vendor?: string;
  category?: string;
  status?: string;
  page?: string;
  error?: string;
  success?: string;
};

type InventoryProduct = {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  price: number | string;
  vendor_id: string | null;
  category_id: string;
  branch_id: string;
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null;
  vendors: { business_name: string } | { business_name: string }[] | null;
  product_images: Array<{ storage_path: string; is_primary: boolean }> | null;
};

type InventoryRow = {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
  reorder_level: number;
  status: "active" | "damaged" | "archived";
  damaged_quantity: number;
  updated_at: string;
  products: InventoryProduct | InventoryProduct[] | null;
  branches: { name: string; state: BranchState; city: string } | { name: string; state: BranchState; city: string }[] | null;
};

type MovementRow = {
  id: string;
  product_id: string;
  branch_id: string;
  movement_type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  role: string | null;
  products: { name: string } | { name: string }[] | null;
  branches: { state: BranchState } | { state: BranchState }[] | null;
};

type TransferRow = {
  id: string;
  quantity: number;
  status: string;
  created_at: string;
  products: { name: string } | { name: string }[] | null;
  source: { state: BranchState } | { state: BranchState }[] | null;
  destination: { state: BranchState } | { state: BranchState }[] | null;
};

type OptionRow = {
  id: string;
  name?: string;
  slug?: string;
  state?: BranchState;
  business_name?: string;
};

function first<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function contains(value: unknown, needle: string) {
  return String(value ?? "").toLowerCase().includes(needle);
}

function imageUrl(path?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !supabaseUrl) return "/favicon.ico";
  return `${supabaseUrl}/storage/v1/object/public/${supabaseConfig.storageBuckets.productImages}/${path}`;
}

function stockStatus(row: InventoryRow) {
  if (row.status === "archived") return "archived";
  if (row.status === "damaged") return "damaged";
  if (row.quantity === 0) return "out_of_stock";
  if (row.quantity <= row.reorder_level) return "low_stock";
  return "in_stock";
}

function movementLabel(type: string) {
  const labels: Record<string, string> = {
    stock_added: "Stock Added",
    stock_removed: "Stock Removed",
    sale: "Sale",
    transfer_out: "Transfer Out",
    transfer_in: "Transfer In",
    damaged: "Damaged",
    adjustment: "Adjustment",
  };
  return labels[type] ?? type.replaceAll("_", " ");
}

export async function InventoryManagementPage({
  role,
  searchParams,
}: {
  role: InventoryRole;
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getAuthProfile(supabase, user.id) : null;
  const returnTo = `/${role}/inventory`;

  let scopedBranchId: string | null = null;
  let scopedVendorId: string | null = null;
  if (profile && isManager(profile)) scopedBranchId = profile.branch_id;
  if (profile && isVendor(profile)) {
    const { data: vendor } = await supabase.from("vendors").select("id").eq("profile_id", profile.id).eq("status", "approved").maybeSingle();
    scopedVendorId = vendor?.id ?? null;
  }

  const [{ data: branchRows }, { data: categoryRows }, { data: vendorRows }] = await Promise.all([
    supabase.from("branches").select("id, name, state").order("state"),
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("vendors").select("id, business_name").eq("status", "approved").order("business_name"),
  ]);

  let inventoryQuery = supabase
    .from("inventory")
    .select(
      "id, product_id, branch_id, quantity, reorder_level, status, damaged_quantity, updated_at, branches(name, state, city), products(id, name, sku, brand, price, vendor_id, category_id, branch_id, categories(name, slug), vendors(business_name), product_images(storage_path, is_primary))",
    )
    .order("updated_at", { ascending: false });

  if (scopedBranchId) inventoryQuery = inventoryQuery.eq("branch_id", scopedBranchId);
  if (scopedVendorId) inventoryQuery = inventoryQuery.eq("products.vendor_id", scopedVendorId);

  const { data: inventoryRows, error } = await inventoryQuery;
  const allRows = ((inventoryRows ?? []) as unknown as InventoryRow[]).filter((row) => {
    const product = first(row.products);
    if (!product) return false;
    const category = first(product.categories);
    const vendor = first(product.vendors);
    const branch = first(row.branches);
    const q = searchParams.q?.trim().toLowerCase() ?? "";

    if (scopedVendorId && product.vendor_id !== scopedVendorId) return false;
    if (q && ![product.name, product.sku, product.brand, category?.name, vendor?.business_name, branch?.state, branch?.name].some((value) => contains(value, q))) return false;
    if (searchParams.branch && row.branch_id !== searchParams.branch) return false;
    if (searchParams.vendor && product.vendor_id !== searchParams.vendor) return false;
    if (searchParams.category && category?.slug !== searchParams.category) return false;
    if (searchParams.status === "low_stock" && !(row.quantity > 0 && row.quantity <= row.reorder_level)) return false;
    if (searchParams.status === "out_of_stock" && row.quantity !== 0) return false;
    if (searchParams.status === "damaged" && row.status !== "damaged") return false;
    if (searchParams.status === "archived" && row.status !== "archived") return false;
    return true;
  });

  const pageSize = 12;
  const currentPage = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const totalPages = Math.max(1, Math.ceil(allRows.length / pageSize));
  const rows = allRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalUnits = allRows.reduce((sum, row) => sum + row.quantity, 0);
  const stockValue = allRows.reduce((sum, row) => {
    const product = first(row.products);
    return sum + row.quantity * Number(product?.price ?? 0);
  }, 0);
  const lowStock = allRows.filter((row) => row.quantity > 0 && row.quantity <= row.reorder_level).length;
  const outOfStock = allRows.filter((row) => row.quantity === 0).length;
  const recentlyUpdated = allRows.filter((row) => Date.now() - new Date(row.updated_at).getTime() < 1000 * 60 * 60 * 24 * 7).length;

  let movementQuery = supabase
    .from("inventory_movements")
    .select("id, product_id, branch_id, movement_type, quantity, reason, created_at, role, products(name), branches(state)")
    .order("created_at", { ascending: false })
    .limit(8);
  if (scopedBranchId) movementQuery = movementQuery.eq("branch_id", scopedBranchId);
  if (scopedVendorId) movementQuery = movementQuery.in("product_id", allRows.map((row) => row.product_id));
  const { data: movementRows } = await movementQuery;

  let transferQuery = supabase
    .from("stock_transfers")
    .select("id, quantity, status, created_at, products(name), source:branches!stock_transfers_source_branch_id_fkey(state), destination:branches!stock_transfers_destination_branch_id_fkey(state)")
    .order("created_at", { ascending: false })
    .limit(6);
  if (scopedBranchId) transferQuery = transferQuery.or(`source_branch_id.eq.${scopedBranchId},destination_branch_id.eq.${scopedBranchId}`);
  const { data: transferRows } = await transferQuery;
  const pendingTransfers = ((transferRows ?? []) as unknown as TransferRow[]).filter((transfer) => transfer.status === "pending").length;

  const productOptions = allRows.map((row) => {
    const product = first(row.products);
    return { id: row.product_id, name: product?.name ?? "Product" };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <InventoryNav role={role} />

      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase text-emerald-700">Inventory Management</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {role === "admin" ? "All branch inventory" : role === "manager" ? "Branch stock control" : "My product inventory"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Track branch stock, vendor inventory, damaged items, transfer history, and low-stock risk using production Supabase data.
        </p>
        {searchParams.error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{searchParams.error}</p> : null}
        {searchParams.success ? <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{searchParams.success}</p> : null}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["Total Products", allRows.length.toString(), "Inventory records in scope."],
          ["Total Stock Units", totalUnits.toString(), "Available stock units."],
          ["Low Stock Items", lowStock.toString(), "At or below threshold."],
          ["Out of Stock", outOfStock.toString(), "Cannot be ordered."],
          ["Recently Updated", recentlyUpdated.toString(), "Changed within 7 days."],
          ["Pending Transfers", pendingTransfers.toString(), "Awaiting receipt."],
        ].map(([title, value, description]) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">{role === "admin" ? "Stock by branch" : role === "manager" ? "Branch inventory report" : "Own inventory report"}</h2>
          <p className="mt-1 text-sm text-slate-600">Estimated stock value: <span className="font-bold text-slate-950">{formatNaira(stockValue)}</span></p>
          <div className="mt-4 grid gap-3">
            {((branchRows ?? []) as OptionRow[]).map((branch) => {
              const branchRowsForCard = allRows.filter((row) => row.branch_id === branch.id);
              const units = branchRowsForCard.reduce((sum, row) => sum + row.quantity, 0);
              const maxUnits = Math.max(1, totalUnits);
              return (
                <div key={branch.id}>
                  <div className="flex justify-between text-sm"><span className="font-bold text-slate-800">{branch.state}</span><span>{units} units</span></div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.min(100, (units / maxUnits) * 100)}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        {role === "admin" ? (
          <form action={transferInventoryStock} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Transfer stock</h2>
            <p className="mt-1 text-sm text-slate-600">Move stock between Adamawa, Yobe, and Borno.</p>
            <input type="hidden" name="return_to" value={returnTo} />
            <div className="mt-4 grid gap-3">
              <select className="h-11 rounded-md border border-slate-300 px-3" name="product_id" required>
                <option value="">Select product</option>
                {productOptions.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
              <select className="h-11 rounded-md border border-slate-300 px-3" name="source_branch_id" required>
                <option value="">Source branch</option>
                {((branchRows ?? []) as OptionRow[]).map((branch) => <option key={branch.id} value={branch.id}>{branch.state}</option>)}
              </select>
              <select className="h-11 rounded-md border border-slate-300 px-3" name="destination_branch_id" required>
                <option value="">Destination branch</option>
                {((branchRows ?? []) as OptionRow[]).map((branch) => <option key={branch.id} value={branch.id}>{branch.state}</option>)}
              </select>
              <input className="h-11 rounded-md border border-slate-300 px-3" name="quantity" inputMode="numeric" placeholder="Quantity" required />
              <input className="h-11 rounded-md border border-slate-300 px-3" name="reason" placeholder="Transfer reason" />
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white">Transfer</button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 lg:grid-cols-7">
          <input className="h-11 rounded-md border border-slate-300 px-3 lg:col-span-2" name="q" placeholder="Search product, SKU, vendor, branch, category" defaultValue={searchParams.q} />
          {role === "admin" ? (
            <select className="h-11 rounded-md border border-slate-300 px-3" name="branch" defaultValue={searchParams.branch ?? ""}>
              <option value="">All branches</option>
              {((branchRows ?? []) as OptionRow[]).map((branch) => <option key={branch.id} value={branch.id}>{branch.state}</option>)}
            </select>
          ) : null}
          {role === "admin" ? (
            <select className="h-11 rounded-md border border-slate-300 px-3" name="vendor" defaultValue={searchParams.vendor ?? ""}>
              <option value="">All vendors</option>
              {((vendorRows ?? []) as OptionRow[]).map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.business_name}</option>)}
            </select>
          ) : null}
          <select className="h-11 rounded-md border border-slate-300 px-3" name="category" defaultValue={searchParams.category ?? ""}>
            <option value="">All categories</option>
            {((categoryRows ?? []) as OptionRow[]).map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
          </select>
          <select className="h-11 rounded-md border border-slate-300 px-3" name="status" defaultValue={searchParams.status ?? ""}>
            <option value="">All status</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="damaged">Damaged</option>
            <option value="archived">Archived</option>
          </select>
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white">Apply filters</button>
          {role === "admin" ? <a className="rounded-md border border-slate-300 px-4 py-3 text-center text-sm font-bold" href={`data:text/csv;charset=utf-8,${encodeURIComponent(allRows.map((row) => `${first(row.products)?.name},${first(row.branches)?.state},${row.quantity},${stockStatus(row)}`).join("\n"))}`} download="inventory.csv">Export</a> : null}
        </form>
      </section>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">Could not load inventory. Run the production inventory SQL upgrade first.</p> : null}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                {["Image", "Product", "SKU", "Branch", "Vendor", "Category", "Current Quantity", "Low Stock Threshold", "Status", "Last Updated", "Actions"].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center"><p className="font-black text-slate-950">No inventory records found.</p><p className="mt-1 text-slate-600">Try another search or add stock from a product record.</p></td></tr>
              ) : rows.map((row) => {
                const product = first(row.products);
                const branch = first(row.branches);
                const category = first(product?.categories ?? null);
                const vendor = first(product?.vendors ?? null);
                const primaryImage = product?.product_images?.find((image) => image.is_primary) ?? product?.product_images?.[0];
                return (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3"><div className="h-14 w-16 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl(primaryImage?.storage_path)})` }} /></td>
                    <td className="px-4 py-3 font-black text-slate-950">{product?.name ?? "Product"}</td>
                    <td className="px-4 py-3">{product?.sku ?? "Not set"}</td>
                    <td className="px-4 py-3">{branch?.state ?? "Unknown"}</td>
                    <td className="px-4 py-3">{vendor?.business_name ?? "Company-owned"}</td>
                    <td className="px-4 py-3">{category?.name ?? "Unknown"}</td>
                    <td className="px-4 py-3 font-bold">{row.quantity}</td>
                    <td className="px-4 py-3">{row.reorder_level}</td>
                    <td className="px-4 py-3"><StatusBadge status={stockStatus(row)} /></td>
                    <td className="px-4 py-3">{new Date(row.updated_at).toLocaleDateString("en-NG")}</td>
                    <td className="px-4 py-3"><InventoryActions row={row} returnTo={returnTo} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <p className="font-semibold text-slate-700">Page {currentPage} of {totalPages}</p>
        <div className="flex gap-2">
          <Link className="rounded-md border border-slate-300 px-3 py-2 font-bold" href={`${returnTo}?page=${Math.max(1, currentPage - 1)}`}>Previous</Link>
          <Link className="rounded-md border border-slate-300 px-3 py-2 font-bold" href={`${returnTo}?page=${Math.min(totalPages, currentPage + 1)}`}>Next</Link>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Stock movement history</h2>
          <div className="mt-4 grid gap-3">
            {((movementRows ?? []) as unknown as MovementRow[]).length === 0 ? <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No movement history yet.</p> : null}
            {((movementRows ?? []) as unknown as MovementRow[]).map((movement) => (
              <div key={movement.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <p className="font-black text-slate-950">{movementLabel(movement.movement_type)} · {movement.quantity} units</p>
                <p className="mt-1 text-slate-600">{first(movement.products)?.name ?? "Product"} · {first(movement.branches)?.state ?? "Branch"} · {new Date(movement.created_at).toLocaleString("en-NG")}</p>
                <p className="mt-1 text-xs text-slate-500">{movement.reason ?? "No reason provided"}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Recent branch transfers</h2>
          <div className="mt-4 grid gap-3">
            {((transferRows ?? []) as unknown as TransferRow[]).length === 0 ? <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No stock transfers yet.</p> : null}
            {((transferRows ?? []) as unknown as TransferRow[]).map((transfer) => (
              <div key={transfer.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <p className="font-black text-slate-950">{first(transfer.products)?.name ?? "Product"} · {transfer.quantity} units</p>
                <p className="mt-1 text-slate-600">{first(transfer.source)?.state ?? "Source"} to {first(transfer.destination)?.state ?? "Destination"}</p>
                <p className="mt-1"><StatusBadge status={transfer.status} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function InventoryNav({ role }: { role: InventoryRole }) {
  const base = `/${role}`;
  const links = [
    ["Dashboard", base],
    ["Products", `${base}/products`],
    ...(role === "admin" ? [["Vendors", "/admin/vendors"]] : []),
    ["Inventory", `${base}/inventory`],
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

function InventoryActions({ row, returnTo }: { row: InventoryRow; returnTo: string }) {
  const product = first(row.products);
  if (!product) return null;
  return (
    <details className="min-w-72 rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-xs font-black text-slate-900">Manage stock</summary>
      <form action={updateInventoryStock} className="mt-3 grid gap-2">
        <input type="hidden" name="return_to" value={returnTo} />
        <input type="hidden" name="product_id" value={row.product_id} />
        <input type="hidden" name="branch_id" value={row.branch_id} />
        <select className="h-9 rounded-md border border-slate-300 px-2 text-xs" name="stock_action" defaultValue="add">
          <option value="add">Increase stock</option>
          <option value="remove">Reduce stock</option>
          <option value="set">Update quantity</option>
          <option value="damaged">Mark damaged</option>
          <option value="out_of_stock">Mark out of stock</option>
          <option value="archive">Archive inventory</option>
        </select>
        <input className="h-9 rounded-md border border-slate-300 px-2 text-xs" name="quantity" inputMode="numeric" placeholder="Quantity" defaultValue="1" />
        <input className="h-9 rounded-md border border-slate-300 px-2 text-xs" name="reorder_level" inputMode="numeric" placeholder="Low stock threshold" defaultValue={row.reorder_level} />
        <input className="h-9 rounded-md border border-slate-300 px-2 text-xs" name="reason" placeholder="Reason" />
        <button className="rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white">Save movement</button>
      </form>
    </details>
  );
}
