import { createOnlineVendorProduct } from "@/app/vendor/actions";
import { ProductImageUploadField } from "@/components/ProductImageUploadField";
import { branches, categories } from "@/lib/marketplace-data";
import type { BranchState, UserRole } from "@/lib/types";

type ProductUploadVendor = {
  id: string;
  businessName: string;
  branchId: string;
};

export function OnlineVendorProductForm({
  error,
  success,
  role = "vendor",
  returnTo = "/vendor",
  vendors = [],
  lockedBranchState,
}: {
  error?: string;
  success?: string;
  role?: Extract<UserRole, "admin" | "manager" | "vendor">;
  returnTo?: string;
  vendors?: ProductUploadVendor[];
  lockedBranchState?: BranchState;
}) {
  const isStaffUpload = role === "admin" || role === "manager";
  const visibleBranches = lockedBranchState ? branches.filter((branch) => branch.state === lockedBranchState) : branches;

  return (
    <section id="add-product" className="scroll-mt-24 rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold uppercase text-emerald-700">Online product upload</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">{isStaffUpload ? "Add marketplace product" : "Create product with Supabase Storage image"}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Use this live form to publish products to the marketplace. The image is uploaded to the `product-images` bucket and appears online after creation.
      </p>
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
      {success ? <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{success}</p> : null}
      <form action={createOnlineVendorProduct} className="mt-5 grid gap-3 lg:grid-cols-2">
        <input type="hidden" name="return_to" value={returnTo} />
        <input className="h-11 rounded-md border border-slate-300 px-3" name="name" placeholder="Product name" required />
        <input className="h-11 rounded-md border border-slate-300 px-3" name="brand" placeholder="Brand" required />
        <input className="h-11 rounded-md border border-slate-300 px-3" name="sku" placeholder="SKU (auto-generated if empty)" />
        <input className="h-11 rounded-md border border-slate-300 px-3" name="price" placeholder="Price in NGN" inputMode="numeric" required />
        <input className="h-11 rounded-md border border-slate-300 px-3" name="discount_price" placeholder="Discount price (optional)" inputMode="numeric" />
        {isStaffUpload ? (
          <select className="h-11 rounded-md border border-slate-300 px-3" name="vendor_id" required defaultValue="">
            <option value="" disabled>
              Select approved vendor
            </option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.businessName}
              </option>
            ))}
          </select>
        ) : null}
        <select className="h-11 rounded-md border border-slate-300 px-3" name="category_slug" defaultValue="laptops">
          {categories.filter((category) => category.id !== "repairs").map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select className="h-11 rounded-md border border-slate-300 px-3" name="branch_state" defaultValue={lockedBranchState ?? "Adamawa"}>
          {visibleBranches.map((branch) => (
            <option key={branch.id} value={branch.state}>{branch.name}</option>
          ))}
        </select>
        <select className="h-11 rounded-md border border-slate-300 px-3" name="condition" defaultValue="New">
          <option>New</option>
          <option>UK Used</option>
          <option>Refurbished</option>
        </select>
        <select className="h-11 rounded-md border border-slate-300 px-3" name="status" defaultValue="active">
          <option value="draft">Draft</option>
          <option value="active">Published</option>
          <option value="inactive">Hidden</option>
        </select>
        <input className="h-11 rounded-md border border-slate-300 px-3" name="quantity" placeholder="Stock quantity" inputMode="numeric" required />
        <input className="h-11 rounded-md border border-slate-300 px-3" name="low_stock_threshold" placeholder="Low stock threshold" inputMode="numeric" defaultValue="3" />
        <input className="h-11 rounded-md border border-slate-300 px-3 lg:col-span-2" name="warranty" placeholder="Warranty e.g. 6 months" />
        <textarea className="min-h-24 rounded-md border border-slate-300 p-3 lg:col-span-2" name="specifications" placeholder="Specifications" />
        <textarea className="min-h-24 rounded-md border border-slate-300 p-3 lg:col-span-2" name="description" placeholder="Description" required />
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input name="featured" type="checkbox" />
          Featured Product
        </label>
        <ProductImageUploadField />
        <button className="rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white lg:w-fit" type="submit">
          {isStaffUpload ? "Add product" : "Create online product"}
        </button>
      </form>
      {isStaffUpload && vendors.length === 0 ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          No approved vendors are available for this scope yet. Approve a vendor before adding products.
        </p>
      ) : null}
    </section>
  );
}
