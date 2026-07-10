import { createOnlineVendorProduct } from "@/app/vendor/actions";
import { ProductImageUploadField } from "@/components/ProductImageUploadField";
import type { BranchState, UserRole } from "@/lib/types";

type ProductUploadVendor = {
  id: string;
  businessName: string;
  branchId: string;
};

type ProductUploadCategory = {
  id: string;
  name: string;
  slug: string;
};

type ProductUploadBranch = {
  id: string;
  name: string;
  state: BranchState;
};

export function OnlineVendorProductForm({
  error,
  success,
  role = "vendor",
  returnTo = "/vendor",
  vendors = [],
  categories = [],
  branches = [],
  lockedBranchId,
}: {
  error?: string;
  success?: string;
  role?: Extract<UserRole, "admin" | "manager" | "vendor">;
  returnTo?: string;
  vendors?: ProductUploadVendor[];
  categories?: ProductUploadCategory[];
  branches?: ProductUploadBranch[];
  lockedBranchId?: string | null;
}) {
  const isStaffUpload = role === "admin" || role === "manager";
  const visibleBranches = lockedBranchId ? branches.filter((branch) => branch.id === lockedBranchId) : branches;
  const defaultCategory = categories[0]?.slug ?? "laptops";
  const defaultBranch = lockedBranchId ?? visibleBranches[0]?.id ?? "";

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
        <Field label="Product name *" name="name" placeholder="HP EliteBook 840 G6" required />
        <Field label="Brand *" name="brand" placeholder="HP, Dell, Lenovo..." required />
        <Field label="SKU" name="sku" placeholder="Auto-generated if empty" />
        <Field label="Price in NGN *" name="price" placeholder="285000" inputMode="numeric" required />
        <Field label="Discount price" name="discount_price" placeholder="Optional" inputMode="numeric" />
        {isStaffUpload ? (
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Vendor ownership
          <select className="h-11 rounded-md border border-slate-300 px-3 font-medium" name="vendor_id" defaultValue="">
            <option value="">Company-owned product</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.businessName}
              </option>
            ))}
          </select>
          </label>
        ) : null}
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Category *
        <select className="h-11 rounded-md border border-slate-300 px-3 font-medium" name="category_slug" defaultValue={defaultCategory} required>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>{category.name}</option>
          ))}
        </select>
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Branch *
        <select className="h-11 rounded-md border border-slate-300 px-3 font-medium" name="branch_id" defaultValue={defaultBranch} required>
          {visibleBranches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name} ({branch.state})</option>
          ))}
        </select>
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Condition *
        <select className="h-11 rounded-md border border-slate-300 px-3 font-medium" name="condition" defaultValue="New" required>
          <option>New</option>
          <option>UK Used</option>
          <option>Refurbished</option>
        </select>
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Product status *
        <select className="h-11 rounded-md border border-slate-300 px-3 font-medium" name="status" defaultValue="active" required>
          <option value="draft">Draft</option>
          <option value="active">Published</option>
          <option value="inactive">Hidden</option>
        </select>
        </label>
        <Field label="Stock quantity *" name="quantity" placeholder="10" inputMode="numeric" required />
        <Field label="Low stock threshold" name="low_stock_threshold" placeholder="3" inputMode="numeric" defaultValue="3" />
        <label className="grid gap-1 text-sm font-bold text-slate-700 lg:col-span-2">
          Warranty
          <input className="h-11 rounded-md border border-slate-300 px-3 font-medium" name="warranty" placeholder="e.g. 6 months" />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700 lg:col-span-2">
          Specifications
          <textarea className="min-h-24 rounded-md border border-slate-300 p-3 font-medium" name="specifications" placeholder="Processor, RAM, storage, display..." />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700 lg:col-span-2">
          Description *
          <textarea className="min-h-24 rounded-md border border-slate-300 p-3 font-medium" name="description" placeholder="Describe the product, condition, and included accessories." required />
        </label>
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
          No approved vendors are available for this scope yet. You can still add a company-owned product without selecting a vendor.
        </p>
      ) : null}
    </section>
  );
}

function Field({
  label,
  name,
  placeholder,
  inputMode,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  inputMode?: "numeric";
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <input
        className="h-11 rounded-md border border-slate-300 px-3 font-medium"
        defaultValue={defaultValue}
        inputMode={inputMode}
        name={name}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
