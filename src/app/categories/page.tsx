import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { getStorefrontCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const { categories, products } = await getStorefrontCatalog();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase text-emerald-700">Categories</p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">Shop computers, accessories, and repair services.</h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              Browse the marketplace by product type, then narrow results by branch, condition, price, and stock.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2">
            {categories.map((category) => {
              const categoryProducts = products.filter((product) => product.categoryId === category.id);
              const previewProducts = categoryProducts.slice(0, 3);

              return (
                <article key={category.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-950">{category.name}</h2>
                      <p className="mt-2 leading-7 text-slate-600">{category.description}</p>
                    </div>
                    <Link
                      className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                      href={`/products?category=${category.id}`}
                    >
                      View {categoryProducts.length}
                    </Link>
                  </div>
                  <div className="mt-5 grid gap-2">
                    {previewProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm hover:bg-emerald-50"
                      >
                        <span className="font-semibold text-slate-800">{product.name}</span>
                        <span className="text-slate-500">{product.condition}</span>
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mb-5">
            <p className="text-sm font-bold uppercase text-emerald-700">All public products</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Newest marketplace items</h2>
          </div>
          <ProductGrid products={products.slice(0, 3)} />
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
