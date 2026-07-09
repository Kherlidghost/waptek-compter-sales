import Link from "next/link";
import { AddToCartButton } from "@/components/AddToCartButton";
import type { Product } from "@/lib/types";
import { formatNaira, getBranch, getCategory, getVendor } from "@/lib/marketplace-data";

export function ProductCard({ product }: { product: Product }) {
  const categoryName = product.categoryName ?? getCategory(product.categoryId)?.name ?? "Product";
  const branch = getBranch(product.branchId);
  const branchState = product.branchState ?? branch?.state;
  const branchName = product.branchName ?? branch?.name;
  const vendorName = product.vendorName ?? getVendor(product.vendorId)?.businessName ?? "Approved vendor";
  const stockStatus = product.stock <= 0 ? "Out of Stock" : product.stock <= 3 ? "Low Stock" : "In Stock";
  const stockClasses =
    product.stock <= 0
      ? "bg-red-50 text-red-700"
      : product.stock <= 3
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Link
        href={`/products/${product.slug}`}
        className="block h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${product.image})` }}
        aria-label={`View ${product.name}`}
      />
      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {categoryName}
          </p>
          <Link href={`/products/${product.slug}`} className="mt-2 block text-lg font-semibold text-slate-950 hover:text-emerald-700">
            {product.name}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{product.description}</p>
        </div>
        <div className="grid gap-2 text-sm text-slate-600">
          <p>
            Vendor:{" "}
            <Link className="font-semibold text-slate-800 hover:text-emerald-700" href={`/vendors/${product.vendorId}`}>
              {vendorName}
            </Link>
          </p>
          <p>Location: <span className="font-semibold text-slate-800">{branchName ?? branchState ?? "Online"}</span></p>
          <span className={`w-fit rounded-md px-2 py-1 text-xs font-bold ${stockClasses}`}>{stockStatus}</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-slate-950">{formatNaira(product.price)}</p>
            <p className="text-xs text-slate-500">
              {product.condition}
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <AddToCartButton disabled={product.stock <= 0} productId={product.id} productName={product.name} />
          <Link
            href={`/products/${product.slug}`}
            className="rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-bold text-slate-900 hover:border-emerald-600 hover:text-emerald-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, emptyMessage = "No products found. Try another search or category." }: { products: Product[]; emptyMessage?: string }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-lg font-bold text-slate-950">{emptyMessage}</p>
        <p className="mt-2 text-sm text-slate-600">You can reset filters, search for a different product, or browse another category.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
