import Link from "next/link";
import { deleteManagedProduct, deleteProductImage, updateManagedProduct, updateProductInventory, updateProductStatus } from "@/app/products/manage/actions";
import { OnlineVendorProductForm } from "@/components/OnlineVendorProductForm";
import { StatusBadge } from "@/components/StatusBadge";
import { getAuthProfile, isManager, isVendor } from "@/lib/auth";
import { formatNaira } from "@/lib/marketplace-data";
import { supabaseConfig } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import type { BranchState, UserRole } from "@/lib/types";

type ProductManagementRole = Extract<UserRole, "admin" | "manager" | "vendor">;

type SearchParams = {
  q?: string;
  category?: string;
  branch?: string;
  vendor?: string;
  status?: string;
  stock?: string;
  featured?: string;
  sort?: string;
  page?: string;
  error?: string;
  success?: string;
};

type ProductRow = {
  id: string;
  vendor_id: string | null;
  category_id: string;
  branch_id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  description: string;
  specifications: string | null;
  price: number | string;
  discount_price: number | string | null;
  warranty: string | null;
  condition: "New" | "UK Used" | "Refurbished";
  status: "draft" | "active" | "inactive" | "archived" | "rejected";
  featured: boolean;
  created_at: string;
  updated_at: string;
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null;
  branches: { name: string; state: BranchState; city: string } | { name: string; state: BranchState; city: string }[] | null;
  vendors: { business_name: string } | { business_name: string }[] | null;
  product_images: Array<{ id: string; storage_path: string; alt_text: string | null; is_primary: boolean }> | null;
  inventory: Array<{ quantity: number; reorder_level: number; updated_at: string }> | null;
};

type OptionRow = {
  id: string;
  name?: string;
  slug?: string;
  state?: BranchState;
  business_name?: string;
  branch_id?: string;
};

function first<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function imageUrl(path?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !supabaseUrl) return "/favicon.ico";
  return `${supabaseUrl}/storage/v1/object/public/${supabaseConfig.storageBuckets.productImages}/${path}`;
}

function publicStatus(status: string, quantity: number, reorderLevel: number, featured: boolean) {
  if (status === "active" && quantity === 0) return "out_of_stock";
  if (status === "active" && quantity <= reorderLevel) return "low_stock";
  if (featured) return "featured";
  if (status === "active") return "published";
  if (status === "inactive") return "hidden";
  return status;
}

function statusForDb(status: string) {
  if (status === "published") return "active";
  if (status === "hidden") return "inactive";
  return status;
}

function asBranchState(value?: string | null): BranchState | undefined {
  return value === "Adamawa" || value === "Yobe" || value === "Borno" ? value : undefined;
}

function contains(value: unknown, needle: string) {
  return String(value ?? "").toLowerCase().includes(needle);
}

export async function ProductManagementPage({
  role,
  searchParams,
}: {
  role: ProductManagementRole;
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getAuthProfile(supabase, user.id) : null;
  const returnTo = `/${role}/products`;

  let scopedBranchId: string | null = null;
  let scopedVendorId: string | null = null;

  if (profile && isManager(profile)) scopedBranchId = profile.branch_id;
  if (profile && isVendor(profile)) {
    const { data: vendor } = await supabase.from("vendors").select("id").eq("profile_id", profile.id).eq("status", "approved").maybeSingle();
    scopedVendorId = vendor?.id ?? null;
  }

  const [{ data: categoryRows }, { data: branchRows }, { data: vendorRows }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("branches").select("id, name, state").order("state"),
    supabase
      .from("vendors")
      .select("id, business_name, branch_id")
      .eq("status", "approved")
      .order("business_name", { ascending: true }),
  ]);

  let query = supabase
    .from("products")
    .select(
      "id, vendor_id, category_id, branch_id, name, slug, sku, brand, description, specifications, price, discount_price, warranty, condition, status, featured, created_at, updated_at, categories(name, slug), branches(name, state, city), vendors(business_name), product_images(id, storage_path, alt_text, is_primary), inventory(quantity, reorder_level, updated_at)",
    )
    .order(searchParams.sort === "price_asc" || searchParams.sort === "price_desc" ? "price" : "updated_at", {
      ascending: searchParams.sort === "price_asc" || searchParams.sort === "name_asc",
    });

  if (scopedBranchId) query = query.eq("branch_id", scopedBranchId);
  if (scopedVendorId) query = query.eq("vendor_id", scopedVendorId);

  const { data: productRows, error } = await query;
  const rawProducts = ((productRows ?? []) as unknown as ProductRow[]).filter((product) => {
    const category = first(product.categories);
    const branch = first(product.branches);
    const vendor = first(product.vendors);
    const inventory = product.inventory?.[0];
    const quantity = inventory?.quantity ?? 0;
    const reorderLevel = inventory?.reorder_level ?? 3;
    const q = searchParams.q?.trim().toLowerCase() ?? "";

    if (q && ![product.name, product.sku, product.brand, category?.name, vendor?.business_name, branch?.state].some((value) => contains(value, q))) return false;
    if (searchParams.category && category?.slug !== searchParams.category) return false;
    if (searchParams.branch && product.branch_id !== searchParams.branch) return false;
    if (searchParams.vendor && product.vendor_id !== searchParams.vendor) return false;
    if (searchParams.status && statusForDb(searchParams.status) !== product.status) return false;
    if (searchParams.stock === "low" && !(quantity > 0 && quantity <= reorderLevel)) return false;
    if (searchParams.stock === "out" && quantity !== 0) return false;
    if (searchParams.featured === "true" && !product.featured) return false;
    return true;
  });

  const pageSize = 12;
  const currentPage = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const totalPages = Math.max(1, Math.ceil(rawProducts.length / pageSize));
  const products = rawProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const canDelete = role === "admin";
  const canChooseVendor = role === "admin" || role === "manager";
  const uploadVendors = ((vendorRows ?? []) as OptionRow[])
    .filter((vendor) => !scopedBranchId || vendor.branch_id === scopedBranchId)
    .map((vendor) => ({ id: vendor.id, businessName: vendor.business_name ?? "Approved vendor", branchId: vendor.branch_id ?? "" }));
  const lockedBranch = scopedBranchId ? ((branchRows ?? []) as OptionRow[]).find((branch) => branch.id === scopedBranchId) : null;
  const uploadCategories = ((categoryRows ?? []) as OptionRow[])
    .filter((category) => category.slug !== "repair-services")
    .map((category) => ({ id: category.id, name: category.name ?? "Category", slug: category.slug ?? category.id }));
  const uploadBranches = ((branchRows ?? []) as OptionRow[])
    .map((branch) => ({ id: branch.id, name: branch.name ?? branch.state ?? "Branch", state: asBranchState(branch.state) ?? "Adamawa" }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardSideNav role={role} />

      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase text-emerald-700">Product Management</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950">
              {role === "admin" ? "All marketplace products" : role === "manager" ? "Branch products" : "My vendor products"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Search, filter, edit, archive, publish, and manage inventory using production Supabase data.
            </p>
          </div>
          <a className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white" href="#add-product">
            Add Product
          </a>
        </div>
        {searchParams.error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{searchParams.error}</p> : null}
        {searchParams.success ? <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{searchParams.success}</p> : null}
      </header>

      <OnlineVendorProductForm
        branches={uploadBranches}
        categories={uploadCategories}
        error={searchParams.error}
        lockedBranchId={lockedBranch?.id ?? null}
        returnTo={returnTo}
        role={role}
        success={searchParams.success}
        vendors={uploadVendors}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 lg:grid-cols-7">
          <input className="h-11 rounded-md border border-slate-300 px-3 lg:col-span-2" name="q" placeholder="Search name, SKU, brand, vendor, branch" defaultValue={searchParams.q} />
          <select className="h-11 rounded-md border border-slate-300 px-3" name="category" defaultValue={searchParams.category ?? ""}>
            <option value="">All categories</option>
            {((categoryRows ?? []) as OptionRow[]).map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
          </select>
          {role === "admin" ? (
            <select className="h-11 rounded-md border border-slate-300 px-3" name="branch" defaultValue={searchParams.branch ?? ""}>
              <option value="">All branches</option>
              {((branchRows ?? []) as OptionRow[]).map((branch) => <option key={branch.id} value={branch.id}>{branch.state}</option>)}
            </select>
          ) : null}
          {canChooseVendor ? (
            <select className="h-11 rounded-md border border-slate-300 px-3" name="vendor" defaultValue={searchParams.vendor ?? ""}>
              <option value="">All vendors</option>
              {uploadVendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.businessName}</option>)}
            </select>
          ) : null}
          <select className="h-11 rounded-md border border-slate-300 px-3" name="status" defaultValue={searchParams.status ?? ""}>
            <option value="">All status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
            <option value="archived">Archived</option>
          </select>
          <select className="h-11 rounded-md border border-slate-300 px-3" name="stock" defaultValue={searchParams.stock ?? ""}>
            <option value="">All stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white">Apply filters</button>
        </form>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">Could not load products. Confirm the production SQL upgrade has been applied.</div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        {role === "admin" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-700">{rawProducts.length} products found</p>
            <p className="text-sm text-slate-600">Bulk actions can be added later; row actions are enabled now.</p>
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                {["Product Image", "Product Name", "SKU", "Category", "Brand", "Price", "Quantity", "Branch", "Vendor", "Status", "Last Updated", "Actions"].map((header) => (
                  <th key={header} className="px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center">
                    <p className="font-black text-slate-950">No products found.</p>
                    <p className="mt-1 text-slate-600">Try another search or add a product.</p>
                  </td>
                </tr>
              ) : products.map((product) => {
                const category = first(product.categories);
                const branch = first(product.branches);
                const vendor = first(product.vendors);
                const primaryImage = product.product_images?.find((image) => image.is_primary) ?? product.product_images?.[0];
                const inventory = product.inventory?.[0];
                const quantity = inventory?.quantity ?? 0;
                const reorderLevel = inventory?.reorder_level ?? 3;
                return (
                  <tr key={product.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="h-14 w-16 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl(primaryImage?.storage_path)})` }} role="img" aria-label={product.name} />
                    </td>
                    <td className="px-4 py-3 font-black text-slate-950">{product.name}</td>
                    <td className="px-4 py-3">{product.sku ?? "Not set"}</td>
                    <td className="px-4 py-3">{category?.name ?? "Unknown"}</td>
                    <td className="px-4 py-3">{product.brand ?? "Not set"}</td>
                    <td className="px-4 py-3 font-semibold">{formatNaira(Number(product.discount_price ?? product.price))}</td>
                    <td className="px-4 py-3">{quantity}</td>
                    <td className="px-4 py-3">{branch?.state ?? "Unknown"}</td>
                    <td className="px-4 py-3">{vendor?.business_name ?? "Company-owned"}</td>
                    <td className="px-4 py-3"><StatusBadge status={publicStatus(product.status, quantity, reorderLevel, product.featured)} /></td>
                    <td className="px-4 py-3">{new Date(product.updated_at).toLocaleDateString("en-NG")}</td>
                    <td className="px-4 py-3">
                      <ProductActions
                        canDelete={canDelete}
                        product={product}
                        primaryImage={primaryImage}
                        quantity={quantity}
                        reorderLevel={reorderLevel}
                        returnTo={returnTo}
                      />
                    </td>
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
    </div>
  );
}

function DashboardSideNav({ role }: { role: ProductManagementRole }) {
  const base = `/${role}`;
  const links = [
    ["Dashboard", base],
    ["Products", `${base}/products`],
    ...(role === "admin" ? [["Vendors", "/admin/vendors"]] : []),
    ["Categories", `${base}#categories`],
    ["Inventory", `${base}/inventory`],
    ["Orders", `${base}/orders`],
    ["Reports", `${base}/reports`],
    ["Settings", `${base}/settings`],
  ];

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-sm">
      {links.map(([label, href]) => (
        <Link key={label} className="whitespace-nowrap rounded-md px-3 py-2 font-bold text-slate-700 hover:bg-slate-100" href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

function ProductActions({
  product,
  primaryImage,
  quantity,
  reorderLevel,
  canDelete,
  returnTo,
}: {
  product: ProductRow;
  primaryImage?: { id: string; storage_path: string; alt_text: string | null; is_primary: boolean };
  quantity: number;
  reorderLevel: number;
  canDelete: boolean;
  returnTo: string;
}) {
  return (
    <div className="grid min-w-64 gap-2">
      <Link className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold" href={`/products/${product.slug}`}>View</Link>
      <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-xs font-black text-slate-900">Edit</summary>
        <form action={updateManagedProduct} className="mt-3 grid gap-2">
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <input className="h-9 rounded-md border border-slate-300 px-2" name="name" defaultValue={product.name} placeholder="Name" />
          <input className="h-9 rounded-md border border-slate-300 px-2" name="sku" defaultValue={product.sku ?? ""} placeholder="SKU" />
          <input className="h-9 rounded-md border border-slate-300 px-2" name="brand" defaultValue={product.brand ?? ""} placeholder="Brand" />
          <input className="h-9 rounded-md border border-slate-300 px-2" name="price" defaultValue={String(product.price)} placeholder="Price" />
          <input className="h-9 rounded-md border border-slate-300 px-2" name="discount_price" defaultValue={product.discount_price ? String(product.discount_price) : ""} placeholder="Discount price" />
          <input className="h-9 rounded-md border border-slate-300 px-2" name="warranty" defaultValue={product.warranty ?? ""} placeholder="Warranty" />
          <select className="h-9 rounded-md border border-slate-300 px-2" name="condition" defaultValue={product.condition}>
            <option>New</option>
            <option>UK Used</option>
            <option>Refurbished</option>
          </select>
          <textarea className="min-h-20 rounded-md border border-slate-300 p-2" name="description" defaultValue={product.description} placeholder="Description" />
          <textarea className="min-h-20 rounded-md border border-slate-300 p-2" name="specifications" defaultValue={product.specifications ?? ""} placeholder="Specifications" />
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input name="featured" type="checkbox" defaultChecked={product.featured} />
            Featured product
          </label>
          <button className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Save edits</button>
        </form>
      </details>
      <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-xs font-black text-slate-900">Inventory</summary>
        <form action={updateProductInventory} className="mt-3 grid gap-2">
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <input className="h-9 rounded-md border border-slate-300 px-2" name="quantity" defaultValue={quantity} placeholder="Quantity" />
          <input className="h-9 rounded-md border border-slate-300 px-2" name="reorder_level" defaultValue={reorderLevel} placeholder="Low stock threshold" />
          <button className="rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white">Update stock</button>
        </form>
      </details>
      <div className="flex flex-wrap gap-2">
        {[
          ["Publish", "active"],
          ["Hide", "inactive"],
          ["Archive", "archived"],
        ].map(([label, status]) => (
          <form key={status} action={updateProductStatus}>
            <input type="hidden" name="product_id" value={product.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <input type="hidden" name="status" value={status} />
            <button className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold">{label}</button>
          </form>
        ))}
      </div>
      {primaryImage ? (
        <form action={deleteProductImage}>
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <input type="hidden" name="image_id" value={primaryImage.id} />
          <input type="hidden" name="storage_path" value={primaryImage.storage_path} />
          <button className="rounded-md border border-red-300 px-3 py-2 text-xs font-bold text-red-700">Delete image</button>
        </form>
      ) : null}
      {canDelete ? (
        <form action={deleteManagedProduct}>
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <button className="rounded-md bg-red-700 px-3 py-2 text-xs font-bold text-white">Delete product</button>
        </form>
      ) : null}
    </div>
  );
}
