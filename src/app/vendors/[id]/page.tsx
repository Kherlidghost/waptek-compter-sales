import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductCard";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatNaira } from "@/lib/marketplace-data";
import { supabaseConfig } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import type { BranchState, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

type VendorProfile = {
  id: string;
  business_name: string;
  owner_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  state: BranchState | null;
  city: string | null;
  business_type: string | null;
  business_logo_path: string | null;
  status: string;
  approved_at: string | null;
  created_at: string;
  branches: { name: string; state: BranchState; city: string } | { name: string; state: BranchState; city: string }[] | null;
};

type ProductRow = {
  id: string;
  vendor_id: string;
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
  condition: Product["condition"];
  featured: boolean | null;
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null;
  branches: { name: string; state: BranchState; city: string } | { name: string; state: BranchState; city: string }[] | null;
  product_images: Array<{ storage_path: string; is_primary: boolean }> | null;
  inventory: Array<{ quantity: number; status?: string }> | null;
};

function first<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function storageUrl(bucket: string, path?: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

function mapProduct(row: ProductRow, vendorName: string): Product {
  const category = first(row.categories);
  const branch = first(row.branches);
  const primaryImage = row.product_images?.find((image) => image.is_primary) ?? row.product_images?.[0];
  const stock = row.inventory?.filter((item) => item.status !== "archived").reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) ?? 0;

  return {
    id: row.id,
    vendorId: row.vendor_id,
    categoryId: category?.slug ?? row.category_id,
    branchId: branch?.state?.toLowerCase() ?? row.branch_id,
    name: row.name,
    slug: row.slug,
    sku: row.sku ?? undefined,
    brand: row.brand ?? undefined,
    description: row.description,
    specifications: row.specifications ?? undefined,
    price: Number(row.discount_price ?? row.price),
    discountPrice: row.discount_price === null ? null : Number(row.discount_price),
    warranty: row.warranty,
    condition: row.condition,
    stock,
    image: storageUrl(supabaseConfig.storageBuckets.productImages, primaryImage?.storage_path) ?? "/favicon.ico",
    specs: row.specifications?.split("\n").map((item) => item.trim()).filter(Boolean) ?? [],
    featured: Boolean(row.featured),
    categoryName: category?.name,
    branchName: branch?.name,
    branchState: branch?.state,
    branchCity: branch?.city,
    vendorName,
  };
}

export default async function PublicVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: vendorData } = await supabase
    .from("vendors")
    .select("id, business_name, owner_name, business_email, business_phone, business_address, state, city, business_type, business_logo_path, status, approved_at, created_at, branches(name, state, city)")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (!vendorData) notFound();

  const vendor = vendorData as unknown as VendorProfile;
  const { data: productRows } = await supabase
    .from("products")
    .select("id, vendor_id, category_id, branch_id, name, slug, sku, brand, description, specifications, price, discount_price, warranty, condition, featured, categories(name, slug), branches(name, state, city), product_images(storage_path, is_primary), inventory(quantity, status)")
    .eq("vendor_id", vendor.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("quantity, unit_price, orders(status)")
    .eq("vendor_id", vendor.id);

  const products = ((productRows ?? []) as unknown as ProductRow[]).map((product) => mapProduct(product, vendor.business_name));
  const ordersCompleted = (orderItems ?? []).filter((item) => {
    const order = first(item.orders as { status: string } | { status: string }[] | null);
    return order?.status === "fulfilled";
  }).length;
  const revenue = (orderItems ?? []).reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0);
  const branch = first(vendor.branches);
  const logo = storageUrl("vendor-assets", vendor.business_logo_path);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex gap-4">
              <div className="h-20 w-20 rounded-lg bg-slate-100 bg-cover bg-center" style={{ backgroundImage: logo ? `url(${logo})` : undefined }} />
              <div>
                <p className="text-sm font-bold uppercase text-emerald-700">Verified Vendor</p>
                <h1 className="mt-1 text-3xl font-black text-slate-950">{vendor.business_name}</h1>
                <p className="mt-2 text-sm text-slate-600">{vendor.business_type ?? "Computer marketplace vendor"} · {vendor.city ?? branch?.city}, {vendor.state ?? branch?.state}</p>
                <p className="mt-2"><StatusBadge status={vendor.status} /></p>
              </div>
            </div>
            <Link className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white" href="/products">Browse Products</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Products Listed", products.length.toString()],
              ["Orders Completed", ordersCompleted.toString()],
              ["Revenue", formatNaira(revenue)],
              ["Average Rating", "New"],
              ["Member Since", new Date(vendor.created_at).toLocaleDateString("en-NG")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 font-black text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Business information</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-slate-500">Owner</dt><dd className="font-bold">{vendor.owner_name ?? "Vendor owner"}</dd></div>
              <div><dt className="text-slate-500">Phone</dt><dd className="font-bold">{vendor.business_phone ?? "Contact through marketplace"}</dd></div>
              <div><dt className="text-slate-500">Email</dt><dd className="font-bold">{vendor.business_email ?? "Not public"}</dd></div>
              <div><dt className="text-slate-500">Address</dt><dd className="font-bold">{vendor.business_address ?? `${vendor.city ?? branch?.city}, ${vendor.state ?? branch?.state}`}</dd></div>
            </dl>
          </aside>
          <div>
            <h2 className="text-2xl font-black text-slate-950">Products from {vendor.business_name}</h2>
            <div className="mt-5">
              <ProductGrid products={products} emptyMessage="This vendor has no published products yet." />
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
