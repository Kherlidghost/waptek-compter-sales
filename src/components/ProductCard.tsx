import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatNaira, getBranch, getCategory, getVendor } from "@/lib/marketplace-data";

export function ProductCard({ product }: { product: Product }) {
  const categoryName = product.categoryName ?? getCategory(product.categoryId)?.name ?? "Product";
  const branchState = product.branchState ?? getBranch(product.branchId)?.state;
  const vendorName = product.vendorName ?? getVendor(product.vendorId)?.businessName ?? "Approved vendor";

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Link
        href={`/products/${product.slug}`}
        className="block h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${product.image})` }}
        aria-label={`View ${product.name}`}
      />
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {categoryName} · {branchState ?? "Online"}
          </p>
          <Link href={`/products/${product.slug}`} className="mt-2 block text-lg font-semibold text-slate-950 hover:text-emerald-700">
            {product.name}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{product.description}</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-slate-950">{formatNaira(product.price)}</p>
            <p className="text-xs text-slate-500">
              {product.stock} in stock · {product.condition}
            </p>
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            View
          </Link>
        </div>
        <p className="text-xs text-slate-500">Vendor: {vendorName}</p>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-lg font-bold text-slate-950">No products found</p>
        <p className="mt-2 text-sm text-slate-600">Try another category, branch, condition, or price range.</p>
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
