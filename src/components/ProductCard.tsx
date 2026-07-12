import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/AddToCartButton";
import type { Product } from "@/lib/types";
import { formatNaira, getBranch, getCategory, getVendor } from "@/lib/marketplace-data";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80";

function stockBadge(stock: number) {
  if (stock <= 0) return { label: "Out of Stock", cls: "bg-red-50 text-red-700 border-red-200" };
  if (stock <= 3) return { label: "Low Stock", cls: "bg-amber-50 text-amber-800 border-amber-200" };
  return { label: "In Stock", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" };
}

export function ProductCard({ product }: { product: Product }) {
  const categoryName = product.categoryName ?? getCategory(product.categoryId)?.name ?? "Product";
  const branch = getBranch(product.branchId);
  const branchLabel = product.branchName ?? branch?.name ?? product.branchState ?? branch?.state ?? "Online";
  const vendorName =
    product.vendorName ??
    (product.vendorId ? getVendor(product.vendorId)?.businessName : null) ??
    "WAPTEK COMPUTER SERVICES";
  const { label: stockLabel, cls: stockCls } = stockBadge(product.stock);
  const displayPrice = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.price;
  const imgSrc = product.image || FALLBACK_IMAGE;

  return (
    <article className="wcs-card group flex h-full flex-col overflow-hidden rounded-[1.5rem] transition hover:-translate-y-1">
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block overflow-hidden"
        aria-label={`View ${product.name}`}
        tabIndex={-1}
      >
        <div className="relative h-52 w-full overflow-hidden bg-slate-100">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.04]"
            unoptimized={imgSrc.startsWith("https://images.unsplash.com")}
          />
        </div>
        {product.featured ? (
          <span className="badge-new absolute left-3 top-3">
            Featured
          </span>
        ) : null}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{categoryName}</p>
          <Link
            href={`/products/${product.slug}`}
            className="mt-1 block text-lg font-black leading-snug text-slate-950 hover:text-emerald-700 focus-visible:outline-emerald-600"
          >
            {product.name}
          </Link>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{product.description}</p>
        </div>

        {/* Meta */}
        <div className="grid gap-1 text-xs text-slate-600">
          <p>
            Seller:{" "}
            {product.vendorId ? (
              <Link
                className="font-semibold text-slate-800 hover:text-emerald-700"
                href={`/vendors/${product.vendorId}`}
              >
                {vendorName}
              </Link>
            ) : (
              <span className="font-semibold text-slate-800">{vendorName}</span>
            )}
          </p>
          <p>
            Location: <span className="font-semibold text-slate-800">{branchLabel}</span>
          </p>
          <p>
            Condition: <span className="font-semibold text-slate-800">{product.condition}</span>
          </p>
        </div>

        {/* Stock badge */}
        <span
          className={`w-fit rounded-full border px-2.5 py-1 text-xs font-black ${stockCls}`}
        >
          {stockLabel}
        </span>

        {/* Price */}
        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-black text-slate-950">{formatNaira(displayPrice)}</p>
            {hasDiscount ? (
              <p className="text-xs text-slate-400 line-through">{formatNaira(product.price)}</p>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <AddToCartButton
            disabled={product.stock <= 0}
            productId={product.id}
            productName={product.name}
          />
          <Link
            href={`/products/${product.slug}`}
            className="btn-outline w-full"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  emptyMessage = "No products found. Try another search or category.",
}: {
  products: Product[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/90 p-10 text-center shadow-xl shadow-slate-950/5">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          📦
        </div>
        <p className="text-base font-black text-slate-950">{emptyMessage}</p>
        <p className="mt-2 text-sm text-slate-500">
          Reset filters, search for a different product, or browse another category.
        </p>
        <Link
          href="/products"
          className="mt-5 inline-flex rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-800"
        >
          Browse All Products
        </Link>
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
