import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCustomerActions } from "@/components/CustomerActions";
import { ProductGrid } from "@/components/ProductCard";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { ReviewSection } from "@/components/ReviewSection";
import { getStorefrontProduct } from "@/lib/catalog";
import { formatNaira } from "@/lib/marketplace-data";

export const dynamic = "force-dynamic";

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { product, products, categories, branches } = await getStorefrontProduct(id);

  if (!product) {
    notFound();
  }

  const branch = branches.find((item) => item.id === product.branchId);
  const category = categories.find((item) => item.id === product.categoryId);
  const relatedProducts = products
    .filter((item) => item.id !== product.id && (item.categoryId === product.categoryId || item.branchId === product.branchId))
    .slice(0, 3);

  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <PublicHeader />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto mb-5 max-w-6xl text-sm font-semibold text-slate-600">
        <Link href="/products" className="hover:text-emerald-700">Products</Link>
        <span className="mx-2">/</span>
        <Link href={`/products?category=${product.categoryId}`} className="hover:text-emerald-700">{category?.name ?? product.categoryName ?? "Category"}</Link>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_420px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
          <div
            className="h-80 bg-cover bg-center"
            style={{ backgroundImage: `url(${product.image})` }}
            role="img"
            aria-label={product.name}
          />
          <div className="p-6">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              {category?.name ?? product.categoryName} · {branch?.state ?? product.branchState}
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">{product.name}</h1>
            <p className="mt-4 leading-7 text-slate-600">{product.description}</p>
            <dl className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">Branch</dt>
                <dd className="mt-1 font-bold text-slate-950">{branch?.name ?? product.branchName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Condition</dt>
                <dd className="mt-1 font-bold text-slate-950">{product.condition}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Available stock</dt>
                <dd className="mt-1 font-bold text-slate-950">{product.stock} units</dd>
              </div>
              <div>
                <dt className="text-slate-500">Brand</dt>
                <dd className="mt-1 font-bold text-slate-950">{product.brand ?? "Not specified"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">SKU</dt>
                <dd className="mt-1 font-bold text-slate-950">{product.sku ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Warranty</dt>
                <dd className="mt-1 font-bold text-slate-950">{product.warranty ?? "Ask vendor"}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              {product.specs.map((spec) => (
                <span key={spec} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold">{spec}</span>
              ))}
            </div>
          </div>
        </div>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
          <p className="text-3xl font-black text-slate-950">{formatNaira(product.price)}</p>
          <p className="mt-2 text-sm text-slate-600">{product.condition} · {product.stock} in stock</p>
          <p className="mt-4 text-sm text-slate-600">
            Vendor:{" "}
            <Link className="font-bold text-slate-900 hover:text-emerald-700" href={`/vendors/${product.vendorId}`}>
              {product.vendorName ?? "Approved vendor"}
            </Link>
          </p>
          <p className="mt-1 text-sm text-slate-600">Branch: {branch?.city ?? product.branchCity}, {branch?.state ?? product.branchState}</p>
          <ProductCustomerActions product={product} />
        </aside>
      </div>

      <ReviewSection product={product} />

      <section className="mx-auto mt-10 max-w-6xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">Related products</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">More from this category or branch</h2>
          </div>
          <Link className="text-sm font-bold text-emerald-800" href="/products">
            View all products
          </Link>
        </div>
        <ProductGrid products={relatedProducts} />
      </section>
    </main>
    <PublicFooter />
    </div>
  );
}
